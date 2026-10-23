/** Live E2E: real Next + Nest + SQL. No route interception, mocked fetch or MSW. */
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
const be = path.resolve(process.env.LIVE_BE_ROOT || "../V-INTERN-BE");
const req = createRequire(path.join(be, "package.json"));
req("dotenv").config({ path: path.join(be, ".env.local"), quiet: true });
if (
  process.env.NODE_ENV !== "test" ||
  !process.env.DB_NAME?.startsWith("VIntern_Phase715_")
)
  throw new Error("Refuse outside disposable development DB.");
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(path.join(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const ds = req(path.join(be, "dist/database/data-source.js")).default;
await ds.initialize();
const api = "http://localhost:8080/api/v1",
  dir = path.resolve("phase7-evidence"),
  network = [],
  results = [];
const browser = await chromium.launch({ channel: "chrome", headless: true });
const local = JSON.parse(
  fs.readFileSync("../phase715-local/scenarios.json", "utf8"),
);
async function call(token, endpoint, method = "GET", body) {
  const response = await fetch(api + endpoint, {
    method,
    headers: {
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  network.push({
    source: "fixture-api",
    url: api + endpoint,
    method,
    status: response.status,
  });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok)
    throw new Error(
      JSON.stringify({ endpoint, status: response.status, code: data.code }),
    );
  return data;
}
const auth = (key) =>
  call(null, "/auth/login", "POST", {
    email: key + "@phase715.test",
    password: process.env.LIVE_PASSWORD,
  });
async function login(page, key, target) {
  await page.goto("http://localhost:3001/login");
  await page
    .getByLabel("Email", { exact: true })
    .fill(key + "@phase715.test");
  await page
    .getByLabel("Mật khẩu", { exact: true })
    .fill(process.env.LIVE_PASSWORD);
  if (key === "admin") await screenshot(page, "phase7.1-live-login.png");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.waitForURL("**" + target);
}
async function screenshot(page, file, fullPage = false) {
  await page.screenshot({ path: path.join(dir, file), fullPage });
}
async function scenario(name, run, viewport = { width: 1440, height: 900 }) {
  const context = await browser.newContext({ viewport }),
    page = await context.newPage(),
    errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.url().startsWith(api)) {
      const request = response.request(),
        headers = response.headers();
      network.push({
        source: "browser",
        url: response.url().split("?")[0],
        method: request.method(),
        status: response.status(),
        origin: headers["access-control-allow-origin"] || null,
        credentials: headers["access-control-allow-credentials"] || null,
      });
    }
  });
  try {
    const detail = await run(page, context);
    assert.deepEqual(errors, []);
    results.push({ name, status: "PASS", detail });
  } catch (error) {
    results.push({
      name,
      status: "FAIL",
      error: String(error),
      pageErrors: errors,
    });
  } finally {
    await context.close();
  }
}
try {
  await scenario(
    "CORS, original endpoints, migrations and SQL engine",
    async () => {
      const preflight = await fetch(api + "/auth/login", {
        method: "OPTIONS",
        headers: {
          Origin: "http://localhost:3001",
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "content-type,authorization",
        },
      });
      assert.equal(preflight.status, 204);
      assert.equal(
        preflight.headers.get("access-control-allow-origin"),
        "http://localhost:3001",
      );
      assert.equal(
        preflight.headers.get("access-control-allow-credentials"),
        "true",
      );
      const denied = await fetch(api + "/health", {
        headers: { Origin: "http://unauthorized.local" },
      });
      assert.notEqual(
        denied.headers.get("access-control-allow-origin"),
        "http://unauthorized.local",
      );
      const health = await fetch(api + "/health");
      assert.equal(health.status, 200);
      assert.equal((await health.json()).checks.database, "ok");
      const swagger = await fetch("http://localhost:8080/api/docs-json");
      assert.equal(swagger.status, 200);
      const sql = await ds.query(
        "SELECT CAST(SERVERPROPERTY('ProductVersion') AS varchar(40)) AS productVersion, CAST(SERVERPROPERTY('ProductMajorVersion') AS int) AS majorVersion",
      );
      const migrations = await ds.query(
        "SELECT name FROM migrations ORDER BY timestamp",
      );
      assert.equal(await ds.showMigrations(), false, "Product migrations must have no pending entries");
      assert.deepEqual(
        migrations.map(m => m.name).sort(),
        ds.migrations.map(m => m.name ?? m.constructor.name).sort(),
        "Applied history must match the pinned backend's configured migrations",
      );
      if (process.env.REQUIRE_SQL2019 === "true")
        assert.equal(
          sql[0].majorVersion,
          15,
          "Final full-stack release gate requires real SQL Server 2019 engine",
        );
      return {
        sql: sql[0],
        migrations: migrations.map((m) => m.name),
        sql2019: sql[0].majorVersion === 15,
        preflight: 204,
        origin: "http://localhost:3001",
        credentials: true,
        swaggerPaths: Object.keys((await swagger.json()).paths).length,
      };
    },
  );
  for (const key of ["admin", "instructor"])
    await scenario(
      key + " login/me/landing/logout and server revocation",
      async (page, context) => {
        await login(page, key, "/" + key);
        await page
          .getByRole("button", { name: "Đăng xuất", exact: true })
          .waitFor();
        const cookie = (await context.cookies(api + "/auth/refresh")).find(
          (c) => c.name === "vintern_refresh",
        );
        assert.ok(cookie);
        assert.equal(cookie.httpOnly, true);
        assert.equal(cookie.path, "/api/v1/auth");
        assert.equal(cookie.sameSite, "Lax");
        assert.equal(
          await page.evaluate(() =>
            document.cookie.includes("vintern_refresh"),
          ),
          false,
        );
        await screenshot(page, "phase7.1-live-" + key + "-landing.png");
        await page
          .getByRole("button", { name: "Đăng xuất", exact: true })
          .click();
        await page.waitForURL("**/login");
        assert.equal(
          (await context.cookies(api + "/auth/refresh")).some(
            (c) => c.name === "vintern_refresh",
          ),
          false,
        );
        assert.equal(
          (await context.request.post(api + "/auth/refresh")).status(),
          401,
        );
        const replay = await fetch(api + "/auth/refresh", {
          method: "POST",
          headers: { Cookie: "vintern_refresh=" + cookie.value },
        });
        assert.equal(replay.status, 401);
        const tokenHash = crypto
          .createHash("sha256")
          .update(cookie.value)
          .digest("hex");
        const stored = await ds.query(
          "SELECT revokedAt FROM refresh_tokens WHERE tokenHash=@0",
          [tokenHash],
        );
        assert.ok(stored[0]?.revokedAt);
        await page.goto("http://localhost:3001/" + key);
        await page.waitForURL("**/login");
        return {
          httpOnly: true,
          jsReadable: false,
          cookieCleared: true,
          refreshReplayStatus: 401,
          sqlRevoked: true,
        };
      },
    );
  await scenario(
    "recruitment_required resolves before workspace",
    async (page) => {
      await login(page, "required", "/intern/onboarding");
      await page.getByRole("heading").first().waitFor();
      assert.equal(
        await page
          .getByRole("heading", {
            name: "Đã vượt qua phỏng vấn — đang chờ giảng viên phân dự án",
            exact: true,
          })
          .count(),
        0,
      );
      const user = await auth("required"),
        w = await call(user.accessToken, "/intern/me/workspace");
      assert.equal(w.status, "recruitment_required");
      return { status: w.status };
    },
  );
  await scenario(
    "in-progress: server timer and persisted answer survive reload",
    async (page) => {
      await login(page, "progress", "/intern/onboarding/interview");
      await page.getByLabel("Thời gian còn lại").waitFor();
      const user = await auth("progress"),
        profile = await call(user.accessToken, "/recruitment/me");
      const endpoint =
        "/recruitment/me/interviews/" +
        profile.currentInterviewSessionId +
        "/questions";
      const before = await call(user.accessToken, endpoint);
      assert.equal(before.questions.filter((q) => q.answered).length, 1);
      await screenshot(page, "phase7.1-live-recruitment.png");
      await page.reload();
      await page.getByLabel("Thời gian còn lại").waitFor();
      const after = await call(user.accessToken, endpoint);
      assert.equal(after.session.id, before.session.id);
      assert.ok(
        after.session.secondsRemaining <= before.session.secondsRemaining,
      );
      assert.equal(after.questions.filter((q) => q.answered).length, 1);
      const saved = await ds.query(
        "SELECT COUNT(*) AS answerCount FROM interview_answers WHERE sessionId=@0",
        [before.session.id],
      );
      assert.equal(saved[0].answerCount, 1);
      return {
        status: "recruitment_in_progress",
        sessionPersisted: true,
        answerCount: 1,
        timerBefore: before.session.secondsRemaining,
        timerAfter: after.session.secondsRemaining,
      };
    },
  );
  await scenario("failed result/cooldown are authoritative", async (page) => {
    await login(page, "failed", "/intern/onboarding/result");
    await page
      .getByText("Development interview needs improvement.", { exact: false })
      .first()
      .waitFor();
    const user = await auth("failed"),
      profile = await call(user.accessToken, "/recruitment/me"),
      workspace = await call(user.accessToken, "/intern/me/workspace");
    assert.equal(workspace.status, "recruitment_failed");
    assert.equal(profile.result.decision, "failed");
    assert.equal(profile.result.overallScore, 33);
    assert.ok(profile.nextEligibleAt);
    const attempt = await fetch(api + "/recruitment/me/interviews", {
      method: "POST",
      headers: { Authorization: "Bearer " + user.accessToken },
    });
    assert.equal(attempt.status, 409);
    return {
      status: workspace.status,
      overall: 33,
      decision: "failed",
      cooldownEnforced: 409,
    };
  });
  await scenario(
    "Waiting desktop: DB rows, navigation and real expired-token refresh",
    async (page, context) => {
      await login(page, "waiting", "/intern");
      await page
        .getByRole("heading", {
          name: "Đã vượt qua phỏng vấn — đang chờ giảng viên phân dự án",
          exact: true,
        })
        .waitFor();
      const info = page.locator(
        'section[aria-labelledby="thong-tin-thuc-tap"]',
      );
      assert.deepEqual(await info.locator("dt").allTextContents(), [
        "Vai trò",
        "Dự án",
        "Phiên thực tập",
        "Sprint",
        "Task",
        "Trạng thái",
      ]);
      assert.deepEqual(await info.locator("dd").allTextContents(), [
        "Backend Developer",
        "Chưa phân công",
        "Chưa phân công",
        "Chưa có",
        "Chưa có",
        "Đang chờ phân công",
      ]);
      assert.equal(
        await page
          .getByRole("link", {
            name: /^(Công việc của tôi|Sprint Board|Dự án)$/,
          })
          .count(),
        0,
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      await screenshot(page, "phase7.1-live-waiting-desktop.png");
      const before = (await context.cookies(api + "/auth/refresh")).find(
        (c) => c.name === "vintern_refresh",
      );
      const start = network.length;
      await new Promise((resolve) => setTimeout(resolve, 22000));
      const refreshedWorkspace = page.waitForResponse((response) => response.url().endsWith("/intern/me/workspace") && response.status() === 200);
      await page
        .getByRole("button", { name: "Tải lại trạng thái", exact: true })
        .click();
      await page
        .getByRole("heading", {
          name: "Đã vượt qua phỏng vấn — đang chờ giảng viên phân dự án",
          exact: true,
        })
        .waitFor();
      await refreshedWorkspace;
      const calls = network.slice(start).filter((n) => n.source === "browser");
      const work = calls.filter((n) => n.url.endsWith("/intern/me/workspace"));
      assert.deepEqual(
        work.map((n) => n.status),
        [401, 200],
      );
      assert.equal(
        calls.filter((n) => n.url.endsWith("/auth/refresh")).length,
        1,
      );
      const after = (await context.cookies(api + "/auth/refresh")).find(
        (c) => c.name === "vintern_refresh",
      );
      assert.ok(after);
      assert.notEqual(before.value, after.value);
      assert.ok(
        await page
          .getByRole("link", {
            name: "Tài khoản Nguyễn Chờ Phân Công, Sinh viên",
          })
          .count(),
      );
      const rows = await ds.query(
        "SELECT status,selectedRole FROM recruitment_profiles WHERE userId=@0",
        [local.waiting.userId],
      );
      assert.deepEqual(rows[0], { status: "passed", selectedRole: "backend" });
      return {
        status: "unassigned",
        sixRows: true,
        dbProfile: rows[0],
        refreshSequence: [401, "refresh", 200],
        retries: 1,
        principalUnchanged: true,
      };
    },
  );
  await scenario(
    "Waiting mobile: live DB, menu keyboard, no overflow",
    async (page) => {
      await login(page, "waiting", "/intern");
      await page
        .getByRole("heading", {
          name: "Đã vượt qua phỏng vấn — đang chờ giảng viên phân dự án",
          exact: true,
        })
        .waitFor();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      await screenshot(page, "phase7.1-live-waiting-mobile.png", true);
      await screenshot(page, "phase7.1-live-waiting-mobile-viewport.png");
      const menu = page.getByRole("button", { name: "Mở menu điều hướng" });
      await menu.click();
      await page.getByRole("dialog").waitFor();
      await page.keyboard.press("Tab");
      assert.equal(
        await page.evaluate(() =>
          document
            .querySelector('[role="dialog"]')
            .contains(document.activeElement),
        ),
        true,
      );
      await page.keyboard.press("Escape");
      await page.getByRole("dialog").waitFor({ state: "hidden" });
      assert.equal(
        await menu.evaluate((el) => el === document.activeElement),
        true,
      );
      return {
        viewport: "390x844",
        horizontalOverflow: false,
        keyboardMenu: true,
      };
    },
    { width: 390, height: 844 },
  );
  await scenario(
    "Live interview answers/submit and backend PASS decision",
    async (page) => {
      const { User } = req(path.join(be, "dist/users/entities/user.entity.js")),
        { Role } = req(path.join(be, "dist/rbac/entities/role.entity.js")),
        { UserRole } = req(
          path.join(be, "dist/rbac/entities/user-role.entity.js"),
        );
      const suffix = Date.now().toString(36),
        key = "candidate-" + suffix,
        email = key + "@phase715.test";
      const role = await ds
        .getRepository(Role)
        .findOneByOrFail({ code: "intern" });
      const candidate = await ds.getRepository(User).save({
        email,
        username: key,
        displayName: "Live Candidate",
        status: "active",
        passwordHash: await req("bcryptjs").hash(process.env.LIVE_PASSWORD, 10),
      });
      await ds
        .getRepository(UserRole)
        .insert({ userId: candidate.id, roleId: role.id });
      await login(page, key, "/intern/onboarding");
      await page.goto("http://localhost:3001/intern/onboarding/role");
      await page.getByText("Backend Developer", { exact: true }).click();
      await page
        .getByRole("button", { name: "Bắt đầu phỏng vấn", exact: true })
        .click();
      await page.waitForURL("**/intern/onboarding/interview");
      for (let i = 0; i < 10; i++) {
        await page
          .getByLabel("Tin nhắn của bạn")
          .fill(
            "Live browser answer with concrete implementation reasoning and testable examples " +
              i,
          );
        await page
          .getByRole("button", { name: "Gửi câu trả lời", exact: true })
          .click();
        await page
          .getByText(i + 1 + "/10 câu ·", { exact: false })
          .waitFor();
      }
      await page
        .getByRole("button", { name: "Kết thúc và chờ kết quả", exact: true })
        .click();
      await page.waitForURL("**/intern/onboarding/result");
      await page.getByText("81.1", { exact: false }).first().waitFor();
      const user = await auth(key),
        profile = await call(user.accessToken, "/recruitment/me");
      assert.equal(profile.status, "passed");
      assert.equal(profile.result.decision, "passed");
      assert.equal(profile.result.overallScore, 81.1);
      return {
        answerCount: 10,
        technical: 85,
        soft: 72,
        overall: 81.1,
        decision: "passed",
        provider: "test-only override; Nest computes result",
      };
    },
  );
  await scenario(
    "Instructor assignment transitions Waiting to Active; SQL/API/FE trace",
    async (page) => {
      await login(page, "waiting", "/intern");
      await page
        .getByRole("heading", {
          name: "Đã vượt qua phỏng vấn — đang chờ giảng viên phân dự án",
          exact: true,
        })
        .waitFor();
      const intern = await auth("waiting"),
        before = await call(intern.accessToken, "/intern/me/workspace");
      assert.equal(before.status, "unassigned");
      const instructor = await auth("instructor"),
        admin = await auth("admin"),
        tag = Date.now().toString(36);
      const project = await call(admin.accessToken, "/projects", "POST", {
        code: "LIVE-" + tag,
        name: "Dự án SQL Live " + tag,
        description: "Controlled Phase 7.1.5 development verification",
        status: "active",
        mentorId: instructor.user.id,
      });
      const session = await call(admin.accessToken, "/sessions", "POST", {
        code: "SESSION-" + tag,
        name: "Phiên SQL Live " + tag,
        status: "active",
        leadInstructorId: instructor.user.id,
        startDate: "2026-10-01T00:00:00.000Z",
        endDate: "2026-12-31T00:00:00.000Z",
      });
      const assignment = await call(
        instructor.accessToken,
        "/assignments",
        "POST",
        {
          internId: intern.user.id,
          projectId: project.id,
          sessionId: session.id,
        },
      );
      await page
        .getByRole("button", { name: "Tải lại trạng thái", exact: true })
        .click();
      await page.getByText(project.name, { exact: true }).waitFor();
      const empty = await call(intern.accessToken, "/intern/me/workspace");
      assert.equal(empty.status, "active");
      assert.equal(empty.currentSprint, null);
      assert.equal(empty.focusedTask, null);
      assert.equal(empty.taskSummary.total, 0);
      await page
        .getByText(/^Chưa có Sprint đang hoạt động\./)
        .waitFor();
      await page
        .getByRole("heading", { name: "Chưa có nhiệm vụ cần tập trung", exact: true })
        .waitFor();
      for (const [route, message] of [
        ["evaluations", "Chưa có đánh giá được chốt."],
        ["kpi", "Chưa có kết quả KPI"],
        ["virtual-salary", "Chưa có giao dịch lương ảo"],
        ["certificates", "Chưa có chứng nhận được cấp."],
        ["mentor", "Chưa có cuộc trò chuyện"],
      ]) {
        await page.goto("http://localhost:3001/intern/" + route);
        await page.getByText(message, { exact: true }).waitFor();
        await screenshot(page, "uat-empty-" + route + ".png", true);
      }
      instructor.accessToken = (await auth("instructor")).accessToken;
      intern.accessToken = (await auth("waiting")).accessToken;
      await page.goto("http://localhost:3001/intern");
      await page.getByText(project.name, { exact: true }).waitFor();
      const sprint = await call(instructor.accessToken, "/sprints", "POST", {
        code: "SPR-" + tag,
        name: "Sprint SQL Live " + tag,
        projectId: project.id,
        sessionId: session.id,
        startDate: "2026-10-01T00:00:00.000Z",
        endDate: "2026-10-31T00:00:00.000Z",
      });
      await call(
        instructor.accessToken,
        "/sprints/" + sprint.id + "/status",
        "POST",
        { status: "active" },
      );
      const task = await call(instructor.accessToken, "/tasks", "POST", {
        title: "Task SQL Live " + tag,
        projectId: project.id,
        sprintId: sprint.id,
        assigneeId: intern.user.id,
        priority: "high",
        dueDate: "2026-10-20T00:00:00.000Z",
      });
      await call(intern.accessToken, "/tasks/" + task.id + "/my", "PATCH", {
        status: "doing",
        progress: 37,
      });
      await page.reload();
      await page.getByText(project.name, { exact: true }).waitFor();
      await page
        .getByText(sprint.code + " · " + sprint.name, { exact: true })
        .waitFor();
      await page
        .getByText(task.code + " · " + task.title, { exact: true })
        .waitFor();
      const after = await call(intern.accessToken, "/intern/me/workspace");
      assert.equal(after.taskSummary.total, 1);
      assert.equal(after.focusedTask.id, task.id);
      assert.equal(after.focusedTask.progress, 37);
      const trace = await ds.query(
        "SELECT p.name AS projectName,s.name AS sessionName,t.title AS taskTitle,t.progress AS progress FROM assignments a JOIN projects p ON p.id=a.projectId JOIN internship_sessions s ON s.id=a.sessionId JOIN tasks t ON t.projectId=p.id AND t.assigneeId=a.internId WHERE a.id=@0 AND t.deletedAt IS NULL",
        [assignment.id],
      );
      assert.equal(trace[0].projectName, after.assignment.project.name);
      assert.equal(trace[0].sessionName, after.assignment.session.name);
      assert.equal(trace[0].taskTitle, after.focusedTask.title);
      assert.equal(trace[0].progress, after.focusedTask.progress);
      const count = await ds.query(
        "SELECT COUNT(*) AS taskCount FROM tasks WHERE assigneeId=@0 AND projectId=@1 AND deletedAt IS NULL",
        [intern.user.id, project.id],
      );
      assert.equal(count[0].taskCount, after.taskSummary.total);
      const totalMetric = page.locator(".student-metric").filter({ hasText: "Tất cả nhiệm vụ" });
      await totalMetric.getByText("1", { exact: true }).waitFor();
      assert.equal(await totalMetric.locator("strong").first().textContent(), "1");
      await screenshot(page, "phase7.1-live-active.png");
      return {
        before: "unassigned",
        action: "Instructor POST /assignments",
        after: "active",
        emptySprintTaskVerified: true,
        taskSummary: after.taskSummary,
        dbTrace: trace[0],
        sqlTaskCount: count[0].taskCount,
        comparison: "SQL = Nest API = FE",
        assignmentId: assignment.id,
      };
    },
  );
} finally {
  await browser.close();
  await ds.destroy();
  fs.writeFileSync(
    path.join(dir, "phase715-live-network.json"),
    JSON.stringify(
      { interception: false, secretsLogged: false, requests: network },
      null,
      2,
    ) + "\n",
  );
  fs.writeFileSync(
    path.join(dir, "phase715-live-results.json"),
    JSON.stringify(
      {
        authority:
          "REAL Next -> REAL Nest AppModule -> REAL SQL; explicit test-only AI override",
        interception: false,
        results,
        passed: results.filter((r) => r.status === "PASS").length,
        failed: results.filter((r) => r.status === "FAIL").length,
      },
      null,
      2,
    ) + "\n",
  );
}
console.log(JSON.stringify(results, null, 2));
if (results.some((r) => r.status === "FAIL")) process.exitCode = 1;
