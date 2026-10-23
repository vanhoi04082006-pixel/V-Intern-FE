/** Real Instructor UI/SQL authority journey. Harness uses explicit external-provider fixtures. */
import path from "node:path";
import fs from "node:fs";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { prepareTestRepository } from "./project-first-github.mjs";
const be = path.resolve(process.env.LIVE_BE_ROOT || "../V-INTERN-BE"),
  req = createRequire(path.join(be, "package.json"));
req("dotenv").config({ path: path.join(be, ".env.local"), quiet: true });
if (
  process.env.NODE_ENV !== "test" ||
  !process.env.DB_NAME?.startsWith("VIntern_Phase715_")
)
  throw Error("Disposable test database required");
const { chromium } = await import(
    process.env.PLAYWRIGHT_MODULE
      ? pathToFileURL(path.join(process.env.PLAYWRIGHT_MODULE, "index.mjs"))
          .href
      : "playwright"
  ),
  browser = await chromium.launch({ channel: "chrome", headless: true }),
  ds = req(path.join(be, "dist/database/data-source.js")).default;
await ds.initialize();
const api = "http://localhost:8080/api/v1",
  base = "http://localhost:3001",
  tag = Date.now().toString(36),
  evidence = path.resolve("phase7-evidence/final"),
  results = [],
  network = [];
fs.mkdirSync(evidence, { recursive: true });
async function call(email, url, method = "GET", body, expectedStatus) {
  const auth = await fetch(api + "/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: process.env.LIVE_PASSWORD }),
  });
  assert.equal(auth.status, 200);
  const { accessToken } = await auth.json();
  const r = await fetch(api + url, {
    method,
    headers: {
      authorization: `Bearer ${accessToken}`,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (expectedStatus) assert.equal(r.status, expectedStatus, `${url} ${r.status}`);
  else assert.equal(r.ok, true, `${url} ${r.status}`);
  return r.status === 204 ? null : r.json();
}
const academic = JSON.parse(
  fs.readFileSync("../phase7-local/academic.json", "utf8"),
);
const instructor = "instructor@phase715.test";
async function login(page, email) {
  await page.goto(base + "/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page
    .getByLabel("Mật khẩu", { exact: true })
    .fill(process.env.LIVE_PASSWORD);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.waitForURL(email === instructor ? "**/instructor" : "**/intern");
}
async function mutation(page, suffix, method, click, status = 201) {
  const [r] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().endsWith(suffix) && r.request().method() === method,
    ),
    click(),
  ]);
  assert.equal(r.status(), status, `${suffix}: ${await r.text()}`);
  return r.json();
}
let failurePage;
try {
  const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    }),
    page = await context.newPage(),
    errors = [];
  failurePage = page;
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.url().startsWith(api))
      network.push({
        url: r.url(),
        method: r.request().method(),
        status: r.status(),
      });
  });
  await login(page, instructor);
  await page.goto(base + "/instructor/evaluations");
  await page
    .getByRole("button", { name: "Tạo kỳ đánh giá", exact: true })
    .click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Mã kỳ").fill("UI-EVAL-" + tag);
  await dialog.getByLabel("Tên kỳ").fill("Đánh giá browser " + tag);
  await dialog.getByLabel("Tìm dự án đánh giá").fill(academic.projectCode);
  await dialog
    .getByLabel("Dự án đánh giá", { exact: true })
    .selectOption(academic.projects);
  await dialog.getByLabel("Tìm phiên đánh giá").fill(academic.sessionCode);
  await dialog
    .getByLabel("Phiên đánh giá", { exact: true })
    .selectOption(academic.sessions);
  await dialog.getByLabel("Bắt đầu", { exact: true }).fill(academic.startDate + "T00:00");
  await dialog.getByLabel("Kết thúc", { exact: true }).fill(academic.endDate + "T00:00");
  const cycle = await mutation(page, "/evaluation-cycles", "POST", () =>
    dialog.getByRole("button", { name: "Lưu kỳ đánh giá" }).click(),
  );
  await page.getByRole("button", { name: "Đánh giá browser " + tag }).click();
  const card = page
    .locator("div.rounded-lg")
    .filter({
      has: page.getByRole("button", { name: "Đánh giá browser " + tag }),
    });
  await card.getByRole("button", { name: "Tiêu chí / trạng thái" }).click();
  dialog = page.getByRole("dialog");
  await mutation(page, `/evaluation-cycles/${cycle.id}/status`, "POST", () =>
    dialog.getByRole("button", { name: "Mở kỳ đánh giá", exact: true }).click(),
  );
  await page.getByRole("button", { name: "Tạo đánh giá", exact: true }).click();
  const internSelect = page.getByRole("combobox", { name: /^Intern đánh giá/ });
  const internOption = internSelect.locator(`option[value="${academic.graduateId}" i]`);
  // Native option nodes are attached but hidden while the select popup is closed.
  await internOption.waitFor({ state: "attached" });
  const internValue = await internOption.getAttribute("value");
  assert.equal(internValue.toLowerCase(), academic.graduateId.toLowerCase());
  await internSelect.selectOption(internValue);
  const evaluation = await mutation(page, "/evaluations", "POST", () =>
    page.getByRole("button", { name: "Tạo bản nháp" }).click(),
  );
  dialog = page.getByRole("dialog");
  await mutation(
    page,
    `/evaluations/${evaluation.id}/ai-suggestions`,
    "POST",
    () => dialog.getByRole("button", { name: "Yêu cầu gợi ý AI" }).click(),
  );
  await dialog
    .getByText(/AI đề xuất 95/)
    .first()
    .waitFor();
  let sql = await ds.query(
    "SELECT overallScore, status FROM evaluations WHERE id=@0",
    [evaluation.id],
  );
  assert.equal(sql[0].overallScore, null);
  assert.equal(sql[0].status, "draft");
  const inputs = dialog.locator("input[type=number]");
  assert.equal(await inputs.count(), 4);
  for (let i = 0; i < 4; i++) {
    assert.equal(await inputs.nth(i).inputValue(), "");
    await inputs.nth(i).fill("80");
  }
  await dialog
    .getByLabel("Tổng kết")
    .fill("Điểm giảng viên 80, AI tham khảo 95.");
  await mutation(
    page,
    `/evaluations/${evaluation.id}`,
    "PATCH",
    () => dialog.getByRole("button", { name: "Lưu điểm chính thức" }).click(),
    200,
  );
  await dialog.getByText("Điểm chính thức: 80", { exact: true }).waitFor();
  await mutation(page, `/evaluations/${evaluation.id}/submit`, "POST", () =>
    dialog.getByRole("button", { name: "Nộp đánh giá" }).click(),
  );
  await mutation(page, `/evaluations/${evaluation.id}/finalize`, "POST", () =>
    dialog.getByRole("button", { name: "Chốt đánh giá" }).click(),
  );
  await dialog.getByText(/Đánh giá đã khóa/).waitFor();
  sql = await ds.query(
    "SELECT overallScore, status FROM evaluations WHERE id=@0",
    [evaluation.id],
  );
  assert.equal(Number(sql[0].overallScore), 80);
  assert.equal(sql[0].status, "finalized");
  await page.screenshot({
    path: path.join(evidence, "instructor-evaluation-ai.png"),
    fullPage: true,
  });
  results.push({
    name: "Browser AI95 remains advisory; Instructor80 finalized and SQL80",
    status: "PASS",
  });
  await dialog.getByRole("button", { name: "Đóng", exact: true }).click();
  // Delivery now comes from the reviewed AI plan, not manual Sprint/Task seeding.
  const task = await call(academic.graduateEmail, `/tasks/${academic.taskId}`);
  await call(academic.graduateEmail, `/tasks/${task.id}/my`, "PATCH", { status: "doing", progress: 30, expectedVersion: task.version });
  const doing = await call(academic.graduateEmail, `/tasks/${task.id}`);
  const blockedStudent = await call(academic.graduateEmail, `/tasks/${task.id}/my`, "PATCH", { status: "review", progress: 90, expectedVersion: doing.version }, 409);
  assert.equal(blockedStudent.code, "CODE_SUBMISSION_REQUIRED");
  const [teacher] = await ds.query('SELECT id FROM users WHERE email=@0', [instructor]);
  const fixture = await prepareTestRepository(ds, req(path.join(be, 'dist/github/github-security.js')).sealToken, academic.sessions, teacher.id, academic.graduateId, process.env.GITHUB_TOKEN_ENCRYPTION_KEY);
  const submission = await call(academic.graduateEmail, `/tasks/${task.id}/submissions`, 'POST', { prUrl: fixture.prUrl, summary: 'CI transport fixture: immutable source snapshot, no real GitHub or execution claim.', version: doing.version });
  assert.equal(submission.status, 'submitted'); assert.equal(submission.headSha, fixture.headSha);
  const pendingTask = await call(instructor, `/tasks/${task.id}`);
  assert.equal(pendingTask.status, 'review');
  const blockedTeacher = await call(instructor, `/tasks/${task.id}`, 'PATCH', { status: 'done', expectedVersion: pendingTask.version }, 409);
  assert.equal(blockedTeacher.code, 'SUBMISSION_PENDING_REVIEW');
  const reviews = await call(instructor, `/submissions/${submission.id}/code-reviews`, 'POST');
  assert.equal(reviews[0].status, 'inconclusive'); assert.equal(reviews[0].headSha, fixture.headSha);
  const blockedApproval = await call(instructor, `/submissions/${submission.id}/review`, 'POST', { rubric: { functional: 80, quality: 80, testing: 80, errors: 80, security: 80, dod: 80 }, feedback: 'No verified execution; approval requires an explicit audited reason.', taskVersion: pendingTask.version }, 409);
  assert.equal(blockedApproval.code, 'AI_REVIEW_REQUIRED');
  await page.goto(`${base}/instructor/tasks/${task.id}`);
  for (const label of ['Chức năng', 'Chất lượng code', 'Kiểm thử', 'Xử lý lỗi', 'Bảo mật', 'Tiêu chí hoàn thành']) await page.getByRole('spinbutton', { name: label, exact: true }).fill('80');
  await page.getByLabel('Nhận xét cho sinh viên', { exact: true }).fill('Giảng viên xác nhận điểm thủ công trên fixture CI; AI chỉ tham khảo.');
  const overrideReason = 'Nghiệm thu luồng chấm thủ công trong CI: transport giả lập không có kiểm thử thực thi độc lập, không công nhận AI đạt.';
  await page.getByLabel('Lý do chấm thủ công nếu kết quả AI chưa đủ cơ sở (tối thiểu 30 ký tự)', { exact: true }).fill(overrideReason);
  const approved = await mutation(page, `/submissions/${submission.id}/review`, 'POST', () => page.getByRole('button', { name: 'Lưu kết quả giảng viên', exact: true }).click());
  assert.equal(approved.status, 'approved'); assert.equal(Number(approved.score), 80);
  assert.equal(approved.headSha, fixture.headSha); assert.equal(approved.reviewerId.toLowerCase(), teacher.id.toLowerCase());
  await page.getByText("Hoàn thành", { exact: true }).first().waitFor();
  const sqlTask = (await ds.query("SELECT status,progress FROM tasks WHERE id=@0", [task.id]))[0];
  assert.equal(sqlTask.status, "done"); assert.equal(Number(sqlTask.progress), 100);
  const [audit] = await ds.query("SELECT TOP(1) detail FROM audit_logs WHERE targetId=@0 AND action='submission.review' ORDER BY createdAt DESC", [submission.id]);
  assert.equal(JSON.parse(audit.detail).manualOverrideReason, overrideReason);
  results.push({ name: "Template submission snapshot, inconclusive AI, direct-transition guards and audited instructor override", status: "PASS", transport: fixture.transport });
  await page.goto(`${base}/instructor/performance?projectId=${academic.projects}&sessionId=${academic.sessions}`);
  await page.getByRole("heading", { name: "Top 10 sinh viên hiệu suất tốt nhất", exact: true }).waitFor();
  const top = page.locator("section").filter({ has: page.getByRole("heading", { name: "Top 10 sinh viên hiệu suất tốt nhất", exact: true }) });
  await top.getByText("80", { exact: true }).waitFor();
  const download = page.waitForEvent("download"); await page.getByRole("button", { name: "Xuất CSV trang này", exact: true }).click();
  assert.equal((await download).suggestedFilename(), "v-intern-performance.csv");
  await page.goto(`${base}/instructor/reports?projectId=${academic.projects}&sessionId=${academic.sessions}`);
  await page.getByRole("heading", { name: "Báo cáo phiên thực tập", exact: true }).waitFor();
  await page.getByLabel("Tên báo cáo", { exact: true }).fill(`Project-first report ${tag}`);
  const report = await mutation(page, "/reports", "POST", () => page.getByRole("button", { name: "Tạo và lưu báo cáo", exact: true }).click());
  await page.getByRole("heading", { name: `Project-first report ${tag}`, exact: true }).waitFor();
  assert.equal(report.snapshot.scope.sessionId.toLowerCase(), academic.sessions.toLowerCase());
  assert.ok(report.snapshot.members.some(m => m.userId.toLowerCase() === academic.graduateId.toLowerCase() && m.averageEvaluationScore === 80));
  for (const format of ["PDF", "XLSX", "CSV"]) {
    const downloaded = page.waitForEvent("download"); await page.getByRole("button", { name: `Tải ${format}`, exact: true }).click();
    const file = await (await downloaded).path(), bytes = fs.readFileSync(file);
    if (format === "PDF") assert.equal(bytes.subarray(0, 4).toString(), "%PDF");
    else if (format === "XLSX") assert.equal(bytes.subarray(0, 2).toString(), "PK");
    else assert.ok(bytes.toString().includes("Project-first report"));
  }
  const foreignAuth = await fetch(api + "/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: academic.foreignEmail, password: process.env.LIVE_PASSWORD }) });
  assert.equal(foreignAuth.status, 200); const foreignToken = (await foreignAuth.json()).accessToken;
  for (const suffix of ["", "/pdf", "/xlsx"]) {
    const r = await fetch(api + `/reports/${report.id}${suffix}`, { headers: { authorization: `Bearer ${foreignToken}` }, signal: AbortSignal.timeout(10000) });
    assert.equal(r.status, 404); assert.match(r.headers.get("content-type"), /application\/json/);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.screenshot({ path: path.join(evidence, "instructor-reports-mobile.png"), fullPage: true });
  assert.deepEqual(errors, []);
  results.push({ name: "Finalized scoped Top10, persisted report, PDF/XLSX/CSV content and foreign ownership", status: "PASS" });
  await context.close();
} catch (error) {
  results.push({ name: "Instructor authority/delivery/report gate", status: "FAIL", error: String(error) });
  await failurePage?.screenshot({ path: path.join(evidence, "instructor-failure.png"), fullPage: true }).catch(() => undefined);
  throw error;
} finally {
  fs.writeFileSync(path.join(evidence, "instructor-live-results.json"), JSON.stringify({ results, network, browserInterception: false, externalProviders: 'Explicit test-only AI and read-only GitHub HTTP boundary; no live-provider or execution acceptance claim' }, null, 2));
  await ds.destroy(); await browser.close();
}
console.log(JSON.stringify({ passed: results.length, results }));
