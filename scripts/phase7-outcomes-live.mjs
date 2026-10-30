/** REAL browser/Nest/SQL outcomes release checks. Never intercept requests. */
import path from "node:path";
import fs from "node:fs";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
const be = path.resolve(process.env.LIVE_BE_ROOT || "../V-INTERN-BE"),
  req = createRequire(path.join(be, "package.json"));
req("dotenv").config({ path: path.join(be, ".env.local"), quiet: true });
if (
  process.env.NODE_ENV !== "test" ||
  !process.env.DB_NAME?.startsWith("VIntern_Phase715_")
)
  throw Error("Disposable test environment required");
const fixture = JSON.parse(
  fs.readFileSync("../phase7-local/outcomes.json", "utf8"),
);
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(path.join(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const browser = await chromium.launch({ channel: "chrome", headless: true }),
  ds = req(path.join(be, "dist/database/data-source.js")).default;
await ds.initialize();
const api = "http://localhost:8080/api/v1",
  base = "http://localhost:3001",
  evidence = path.resolve("phase7-evidence/final"),
  results = [],
  network = [];
fs.mkdirSync(evidence, { recursive: true });
async function token(email) {
  const r = await fetch(api + "/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: process.env.LIVE_PASSWORD }),
  });
  assert.equal(r.status, 200);
  return (await r.json()).accessToken;
}
async function call(email, url, method = "GET", body) {
  return fetch(api + url, {
    method,
    headers: {
      authorization: `Bearer ${await token(email)}`,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
async function login(page) {
  await page.goto(base + "/login");
  await page.getByLabel("Email", { exact: true }).fill(fixture.email);
  await page
    .getByLabel("Mật khẩu", { exact: true })
    .fill(process.env.LIVE_PASSWORD);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.waitForURL("**/intern");
}
async function shot(page, name) {
  await page.screenshot({
    path: path.join(evidence, name + ".png"),
    fullPage: true,
  });
}
try {
  const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      acceptDownloads: true,
    }),
    page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.url().startsWith(api))
      network.push({
        url: r.url(),
        method: r.request().method(),
        status: r.status(),
      });
  });
  await login(page);
  await page.goto(base + "/intern/mentor");
  await page
    .getByRole("button", { name: "Cuộc trò chuyện mới", exact: true })
    .click();
  const question = `[${Date.now().toString(36)}] Làm thế nào để chia nhỏ nhiệm vụ?`;
  await page
    .getByLabel("Câu hỏi của bạn")
    .fill(question);
  const sent = page.waitForResponse(
    (r) => r.url().includes("/messages") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Gửi câu hỏi" }).click();
  const message = await (await sent).json();
  assert.equal(message.assistantMessage.role, "assistant");
  await page.getByText("AI Mentor · Gợi ý", { exact: true }).waitFor();
  await shot(page, "intern-mentor");
  await page.reload();
  await page
    .getByRole("button")
    .filter({ has: page.getByText(question, { exact: true }) })
    .click();
  await page
    .getByLabel("Nội dung cuộc trò chuyện", { exact: true })
    .getByText(question, { exact: true })
    .waitFor();
  assert.equal(
    (
      await call(
        "required@phase715.test",
        `/intern/me/ai-mentor/conversations/${message.conversation.id}`,
      )
    ).status,
    404,
  );
  await page.getByLabel("Câu hỏi của bạn").fill("[phase7-test-timeout]");
  const failed = page.waitForResponse(
    (r) => r.url().includes("/messages") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Gửi câu hỏi" }).click();
  assert.equal((await failed).status(), 503);
  await page.getByText(/Kiểm tra lịch sử trước khi gửi lại/).waitFor();
  await shot(page, "intern-mentor-unavailable");
  await page.getByRole("button", { name: "Lưu trữ", exact: true }).click();
  await page.getByText(/Cuộc trò chuyện đã lưu trữ/).waitFor();
  assert.equal(await page.getByLabel("Câu hỏi của bạn").count(), 0);
  results.push({
    name: "Mentor persistence, private ownership, timeout, archive",
    status: "PASS",
  });
  await page.goto(base + `/intern/evaluations/${fixture.evaluationId}`);
  await page
    .getByRole("heading", { name: "Đánh giá chính thức" })
    .waitFor();
  // The official score renders in the score hero (label + value /100 scale).
  // Scope to the hero: bare text "80" also matches criterion score cells.
  await page
    .locator(".student-score")
    .filter({ hasText: "Điểm chính thức" })
    .filter({ hasText: "80" })
    .waitFor();
  assert.equal(await page.getByText("95", { exact: true }).count(), 0);
  await shot(page, "intern-evaluations");
  const ev = await ds.query(
    "SELECT overallScore FROM evaluations WHERE id=@0",
    [fixture.evaluationId],
  );
  assert.equal(Number(ev[0].overallScore), 80);
  await page.goto(base + "/intern/performance");
  await page.getByText("Điểm đánh giá trung bình", { exact: true }).waitFor();
  await shot(page, "intern-performance");
  await page.goto(base + `/intern/kpi/${fixture.kpiResultId}`);
  await page
    .getByRole("heading", {
      name: "Kết quả KPI",
      exact: true,
    })
    .waitFor();
  await page.locator(".student-score").filter({ hasText: "Điểm KPI" }).getByText(String(fixture.kpiFinalScore), { exact: true }).waitFor();
  await page.getByText("Tiến độ bàn giao", { exact: true }).waitFor();
  await page.getByText("đồng ảo", { exact: true }).first().waitFor();
  await shot(page, "intern-kpi");
  const ledger = await ds.query(
    "SELECT SUM(amount) balance FROM virtual_salary_ledger WHERE userId=@0",
    [fixture.userId],
  );
  assert.equal(Number(ledger[0].balance), fixture.salaryBalance);
  assert.ok(
    (await page.locator("main").innerText()).includes(
      fixture.salaryBalance.toLocaleString("vi-VN"),
    ),
  );
  results.push({
    name: "SQL official score80 overrides advisory95; KPI provenance; salary ledger sum",
    status: "PASS",
    officialScore: 80,
    kpi: fixture.kpiFinalScore,
    balance: fixture.salaryBalance,
  });
  await page.goto(base + `/intern/certificates/${fixture.certificateId}`);
  await page
    .locator(".student-cert-document-meta")
    .getByText(fixture.certificateNumber, { exact: true })
    .waitFor();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Tải PDF" }).click();
  const pdf = await download,
    file = await pdf.path();
  assert.equal(fs.readFileSync(file).subarray(0, 4).toString(), "%PDF");
  await shot(page, "intern-certificates");
  for (const route of [
    `/intern/me/evaluations/${fixture.evaluationId}`,
    `/intern/me/kpi/${fixture.kpiResultId}`,
    `/intern/me/certificates/${fixture.certificateId}`,
  ])
    assert.equal((await call("required@phase715.test", route)).status, 404);
  const publicContext = await browser.newContext(),
    publicPage = await publicContext.newPage();
  await publicPage.goto(base + `/verify?code=${fixture.verificationCode}`);
  await publicPage
    .getByRole("button", { name: "Xác minh", exact: true })
    .click();
  await publicPage
    .getByRole("heading", { name: "Chứng nhận hợp lệ" })
    .waitFor();
  await shot(publicPage, "public-verify");
  const publicData = await (
    await fetch(api + `/certificates/verify/${fixture.verificationCode}`)
  ).json();
  for (const field of ["email", "userId", "overallScore", "salaryBalance"])
    assert.equal(field in publicData, false);
  const revoke = await call(
    "admin@phase715.test",
    `/certificates/${fixture.certificateId}/revoke`,
    "POST",
    { reason: "Development live revocation test" },
  );
  assert.equal(revoke.ok, true);
  await publicPage
    .getByRole("button", { name: "Xác minh", exact: true })
    .click();
  await publicPage
    .getByRole("heading", { name: "Chứng nhận đã thu hồi" })
    .waitFor();
  await shot(publicPage, "public-verify-revoked");
  await page.reload();
  await page.getByText("Đã thu hồi", { exact: true }).waitFor();
  assert.equal(
    await page.getByRole("button", { name: "Tải PDF" }).isDisabled(),
    true,
  );
  await publicContext.close();
  results.push({
    name: "Real PDF, certificate ownership, anonymous public whitelist, revocation",
    status: "PASS",
  });
  await page.goto(base + "/intern/notifications");
  await page.getByRole("heading", { name: "Thông báo", exact: true }).waitFor();
  const [readAll] = await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().endsWith("/notifications/read-all") &&
        r.request().method() === "POST",
    ),
    page.getByRole("button", { name: "Đánh dấu tất cả đã đọc" }).click(),
  ]);
  assert.equal(readAll.status(), 200);
  assert.equal(
    (
      await ds.query(
        "SELECT COUNT(*) n FROM notifications WHERE userId=@0 AND readAt IS NULL",
        [fixture.userId],
      )
    )[0].n,
    0,
  );
  const preference = page.getByRole("checkbox", {
    name: "Nhiệm vụ",
    exact: true,
  });
  await preference.waitFor();
  const [preferenceResponse] = await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().endsWith("/notifications/preferences") &&
        r.request().method() === "PUT",
    ),
    preference.uncheck(),
  ]);
  assert.equal(preferenceResponse.status(), 200);
  assert.equal(
    Boolean(
      (
        await ds.query(
          "SELECT enabled FROM notification_preferences WHERE userId=@0 AND category='task'",
          [fixture.userId],
        )
      )[0].enabled,
    ),
    false,
  );
  await page.reload();
  await page.getByRole("checkbox", { name: "Nhiệm vụ", exact: true }).waitFor();
  assert.equal(
    await page
      .getByRole("checkbox", { name: "Nhiệm vụ", exact: true })
      .isChecked(),
    false,
  );
  // Restore fixture defaults through the same real browser contract.
  await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().endsWith("/notifications/preferences") &&
        r.request().method() === "PUT",
    ),
    page.getByRole("checkbox", { name: "Nhiệm vụ", exact: true }).check(),
  ]);
  await shot(page, "intern-notifications");
  await page.goto(base + "/intern/recommendations");
  await page.getByRole("button", { name: /Cập nhật/ }).click();
  await page.getByText("Lập kế hoạch công việc", { exact: true }).waitFor();
  await shot(page, "intern-recommendations");
  await page.goto(base + "/intern/profile");
  const accountEmail = page.getByRole("definition").filter({ hasText: fixture.email });
  await accountEmail.waitFor();
  assert.equal((await accountEmail.textContent()).trim(), fixture.email);
  await shot(page, "intern-profile");
  assert.deepEqual(errors, []);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + "/intern/kpi");
  await page.getByRole("heading", { name: "KPI & Lương ảo" }).waitFor();
  await page.getByText("đồng ảo", { exact: true }).first().waitFor();
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  );
  await shot(page, "intern-kpi-mobile");
  results.push({
    name: "Notifications/recommendations/profile real responses, mobile overflow",
    status: "PASS",
  });
  await context.close();
} finally {
  fs.writeFileSync(
    path.join(evidence, "outcomes-live-results.json"),
    JSON.stringify({ results, network, interception: false }, null, 2),
  );
  await ds.destroy();
  await browser.close();
}
console.log(JSON.stringify({ passed: results.length, results }));
