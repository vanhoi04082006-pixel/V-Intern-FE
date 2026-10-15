/* API interception is test-only; this runner creates no mock production server. */
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import ts from "typescript";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(path.join(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const fixtures = {};
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync("src/test/nest-fixtures.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  { exports: fixtures },
);
const copy = (value) => JSON.parse(JSON.stringify(value));
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || "chrome",
  headless: true,
});
const results = [];
const dir = path.resolve("phase7-evidence");
fs.mkdirSync(dir, { recursive: true });
async function scenario(name, options, check) {
  const context = await browser.newContext({
    viewport: options.viewport || { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  const errors = [],
    calls = [];
  page.on("pageerror", (error) => errors.push(error.message));
  let workspace = copy(options.workspace || fixtures.waiting);
  const user = {
    ...copy(fixtures.principal),
    roles: [options.role || "intern"],
  };
  let profile = copy(fixtures.profile);
  const interview = copy(fixtures.interview);
  if (workspace.status === "unassigned" || workspace.status === "active")
    profile = {
      ...profile,
      status: "passed",
      selectedRole: "backend",
      result: copy(fixtures.result),
    };
  if (workspace.status === "recruitment_in_progress")
    profile = {
      ...profile,
      status: "interview_in_progress",
      selectedRole: "backend",
      currentInterviewSessionId: interview.session.id,
    };
  if (workspace.status === "recruitment_failed")
    profile = {
      ...profile,
      status: "failed",
      selectedRole: "backend",
      result: { ...copy(fixtures.result), decision: "failed" },
    };
  await context.route("http://localhost:8080/api/v1/**", async (route) => {
    const req = route.request(),
      endpoint = new URL(req.url()).pathname.replace("/api/v1", "");
    calls.push({ endpoint, method: req.method() });
    const send = (status, body) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    if (options.unauthenticated && endpoint.startsWith("/auth/"))
      return send(401, { code: "INVALID_REFRESH_TOKEN", message: "expired" });
    if (endpoint === "/auth/login" || endpoint === "/auth/refresh")
      return send(200, { accessToken: "browser-test-only", user });
    if (endpoint === "/auth/me") return send(200, user);
    if (endpoint === "/auth/logout") return send(204);
    if (endpoint === "/intern/me/workspace")
      return options.error
        ? send(options.error, { code: "UNAVAILABLE", message: "unavailable" })
        : send(200, workspace);
    if (endpoint === "/recruitment/me") return send(200, profile);
    if (endpoint === "/recruitment/me/role") {
      assert.equal(req.postDataJSON().role, "backend");
      profile = {
        ...profile,
        status: "role_selected",
        selectedRole: "backend",
      };
      return send(200, profile);
    }
    if (endpoint === "/recruitment/me/interviews") {
      profile = {
        ...profile,
        status: "interview_in_progress",
        selectedRole: "backend",
        currentInterviewSessionId: interview.session.id,
      };
      workspace = fixtures.blocked("recruitment_in_progress");
      return send(201, interview);
    }
    if (endpoint.endsWith("/questions")) return send(200, interview);
    if (endpoint.includes("/answers/")) {
      const id = endpoint.split("/").at(-1),
        question = interview.questions.find((q) => q.id === id);
      assert.ok(req.postDataJSON().answerText.length > 0);
      question.answered = true;
      question.answeredAt = new Date().toISOString();
      return send(200, {
        id: "answer-" + id,
        sessionQuestionId: id,
        answeredAt: question.answeredAt,
      });
    }
    if (endpoint.endsWith("/submit")) {
      assert.ok(interview.questions.every((q) => q.answered));
      interview.session.status = "completed";
      profile = { ...profile, status: "passed", result: copy(fixtures.result) };
      workspace = copy(fixtures.waiting);
      return send(200, { session: interview.session, result: fixtures.result });
    }
    return send(404, {
      code: "NOT_FOUND",
      message: "No test contract for endpoint",
    });
  });
  try {
    await page.goto("http://localhost:3001" + (options.url || "/intern"));
    await check(page, calls);
    assert.deepEqual(errors, []);
    results.push({ name, status: "PASS", calls });
  } catch (error) {
    results.push({
      name,
      status: "FAIL",
      error: String(error),
      calls,
      pageErrors: errors,
    });
  } finally {
    await context.close();
  }
}
async function screenshot(page, name, fullPage = false) {
  await page.screenshot({ path: path.join(dir, name), fullPage });
}
async function waitingCheck(page) {
  await page
    .getByRole("heading", { name: "Chưa có dự án được phân công", exact: true })
    .waitFor();
  assert.equal(
    await page
      .locator('section[aria-labelledby="thong-tin-thuc-tap"] dt')
      .count(),
    6,
  );
  assert.deepEqual(
    await page
      .locator('section[aria-labelledby="thong-tin-thuc-tap"] dt')
      .allTextContents(),
    ["Vai trò", "Dự án", "Phiên thực tập", "Sprint", "Task", "Trạng thái"],
  );
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  assert.equal(
    await page
      .getByRole("link", { name: /^(Công việc của tôi|Sprint Board|Dự án)$/ })
      .count(),
    0,
  );
}
try {
  await scenario(
    "Waiting desktop: preview cannot override backend",
    { url: "/intern?_preview=active" },
    async (page) => {
      await waitingCheck(page);
      await screenshot(page, "phase7.1-waiting-desktop.png");
    },
  );
  await scenario(
    "Waiting mobile: responsive and drawer keyboard",
    { viewport: { width: 390, height: 844 } },
    async (page) => {
      await waitingCheck(page);
      await screenshot(page, "phase7.1-waiting-mobile.png", true);
      await screenshot(page, "phase7.1-waiting-mobile-viewport.png");
      const menu = page.getByRole("button", { name: "Mở menu điều hướng" });
      await menu.click();
      await page.getByRole("dialog").waitFor();
      await screenshot(page, "phase7.1-waiting-mobile-menu.png");
      await page.keyboard.press("Tab");
      assert.equal(
        await page.evaluate(
          () =>
            !!document
              .querySelector('[role="dialog"]')
              ?.contains(document.activeElement),
        ),
        true,
      );
      await page.keyboard.press("Escape");
      await page.getByRole("dialog").waitFor({ state: "hidden" });
      assert.equal(
        await menu.evaluate((el) => el === document.activeElement),
        true,
      );
    },
  );
  await scenario(
    "Active entry uses API assignment, sprint, task",
    { workspace: fixtures.active },
    async (page) => {
      await page.getByText("Dự án từ API", { exact: true }).waitFor();
      await page
        .getByText("SPR-REAL · Sprint từ API", { exact: true })
        .waitFor();
      await page
        .getByText("TASK-REAL · Task từ API", { exact: true })
        .waitFor();
      await screenshot(page, "phase7.1-active-entry.png");
    },
  );
  for (const [status, target] of [
    ["recruitment_required", "/intern/onboarding"],
    ["recruitment_in_progress", "/intern/onboarding/interview"],
    ["recruitment_failed", "/intern/onboarding/result"],
  ]) {
    await scenario(
      status + " routing",
      { workspace: fixtures.blocked(status) },
      async (page) => {
        await page.waitForURL("**" + target);
        await page.getByRole("heading").first().waitFor();
      },
    );
  }
  for (const role of ["admin", "instructor"]) {
    await scenario(
      role + " login landing and logout",
      { role, url: "/login" },
      async (page, calls) => {
        await page
          .getByLabel("Email", { exact: true })
          .fill(role + "@test.local");
        await page
          .getByLabel("Mật khẩu", { exact: true })
          .fill("Test-only-password");
        await page
          .getByRole("button", { name: "Đăng nhập", exact: true })
          .click();
        await page.waitForURL("**/" + role);
        await page
          .getByRole("button", { name: "Đăng xuất", exact: true })
          .click();
        await page.waitForURL("**/login");
        assert.ok(
          calls.some(
            (c) => c.endpoint === "/auth/logout" && c.method === "POST",
          ),
        );
      },
    );
  }
  await scenario(
    "Unauthenticated preview cannot bypass guard",
    { unauthenticated: true, url: "/intern?_preview=waiting" },
    async (page) => {
      await page.waitForURL("**/login");
    },
  );
  await scenario(
    "Backend 503 has explicit error, no demo",
    { error: 503 },
    async (page) => {
      await page.getByRole("alert").waitFor();
      assert.equal(
        await page.getByText("Dự án từ API", { exact: true }).count(),
        0,
      );
      await screenshot(page, "phase7.1-backend-error.png");
    },
  );
  await scenario(
    "Recruitment role, answers, submit, backend score",
    {
      workspace: fixtures.blocked("recruitment_required"),
      url: "/intern/onboarding/role",
    },
    async (page, calls) => {
      await page.getByText("Backend Developer", { exact: true }).click();
      await page
        .getByRole("button", { name: "Bắt đầu phỏng vấn", exact: true })
        .click();
      await page.waitForURL("**/intern/onboarding/interview");
      for (let i = 0; i < 2; i++) {
        await page
          .getByLabel("Câu trả lời của bạn")
          .fill("Câu trả lời được lưu qua contract backend " + i);
        await page
          .getByRole("button", { name: "Lưu câu trả lời", exact: true })
          .click();
        await page
          .getByText(i + 1 + "/2 câu đã lưu", { exact: false })
          .waitFor();
      }
      await page
        .getByRole("button", { name: "Nộp bài phỏng vấn", exact: true })
        .click();
      await page.waitForURL("**/intern/onboarding/result");
      await page.getByText("88.7", { exact: false }).first().waitFor();
      assert.equal(
        calls.filter(
          (c) => c.endpoint.includes("/answers/") && c.method === "PUT",
        ).length,
        2,
      );
    },
  );
} finally {
  await browser.close();
  fs.writeFileSync(
    path.join(dir, "browser-qa.json"),
    JSON.stringify(
      {
        authority:
          "TEST CONTRACT ONLY — production FE with intercepted API, not live Nest/SQL",
        results,
        passed: results.filter((r) => r.status === "PASS").length,
        failed: results.filter((r) => r.status === "FAIL").length,
      },
      null,
      2,
    ) + "\n",
  );
}
console.log(
  JSON.stringify(
    results.map(({ name, status, error }) => ({ name, status, error })),
    null,
    2,
  ),
);
if (results.some((r) => r.status === "FAIL")) process.exitCode = 1;
