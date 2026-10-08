/** REAL browser/API/SQL regression. No interception. Disposable development database only. */
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
  throw new Error("Disposable test environment required");
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(path.join(process.env.PLAYWRIGHT_MODULE, "index.mjs")).href
    : "playwright"
);
const browser = await chromium.launch({ channel: "chrome", headless: true }),
  api = "http://localhost:8080/api/v1",
  evidence = path.resolve("phase7-evidence/final");
fs.mkdirSync(evidence, { recursive: true });
const ds = req(path.join(be, "dist/database/data-source.js")).default;
await ds.initialize();
const network = [],
  results = [];
async function call(token, endpoint, method = "GET", body) {
  const response = await fetch(api + endpoint, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  assert.equal(
    response.ok,
    true,
    `${method} ${endpoint} ${response.status} ${data.code ?? ""}`,
  );
  return data;
}
async function auth(key) {
  return call(null, "/auth/login", "POST", {
    email: `${key}@phase715.test`,
    password: process.env.LIVE_PASSWORD,
  });
}
async function login(page, key) {
  await page.goto("http://localhost:3001/login");
  await page
    .getByLabel("Email hoặc tên đăng nhập")
    .fill(`${key}@phase715.test`);
  await page
    .getByLabel("Mật khẩu", { exact: true })
    .fill(process.env.LIVE_PASSWORD);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.waitForURL("**/intern");
}
try {
  const intern = await auth("waiting"),
    instructor = await auth("instructor"),
    workspace = await call(intern.accessToken, "/intern/me/workspace");
  assert.equal(workspace.status, "active");
  const tag = Date.now().toString(36),
    task = await call(instructor.accessToken, "/tasks", "POST", {
      title: `Live Phase 7 task ${tag}`,
      description: "Browser → Nest → SQL trace",
      projectId: workspace.assignment.project.id,
      sprintId: workspace.currentSprint.id,
      assigneeId: intern.user.id,
      storyPoints: 5,
    });
  const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
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
  await login(page, "waiting");
  await page
    .getByRole("link", { name: "Công việc của tôi", exact: true })
    .click();
  await page
    .getByRole("button", { name: `${task.code} · ${task.title}`, exact: true })
    .click();
  // A second real client of the owner updates after the browser loaded its version.
  await page
    .getByRole("button", { name: "Lưu tiến độ", exact: true })
    .waitFor();
  const freshOwner = await auth("waiting");
  await call(freshOwner.accessToken, `/tasks/${task.id}/my`, "PATCH", {
    progress: 37,
    expectedVersion: task.version,
  });
  const [conflict] = await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().endsWith(`/tasks/${task.id}/my`) &&
        r.request().method() === "PATCH",
    ),
    page.getByRole("button", { name: "Lưu tiến độ", exact: true }).click(),
  ]);
  assert.equal(conflict.status(), 409);
  await page
    .getByRole("alert")
    .filter({ hasText: "Trạng thái đã thay đổi" })
    .waitFor();
  await page.waitForFunction(
    () =>
      document.querySelector('input[aria-label="Tiến độ nhiệm vụ"]')?.value ===
      "37",
  );
  assert.equal(
    (await ds.query("SELECT progress FROM tasks WHERE id=@0", [task.id]))[0]
      .progress,
    37,
  );
  const [retry] = await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().endsWith(`/tasks/${task.id}/my`) &&
        r.request().method() === "PATCH",
    ),
    page.getByRole("button", { name: "Lưu tiến độ", exact: true }).click(),
  ]);
  assert.equal(retry.status(), 200);
  await page.getByRole("button", { name: "Chuyển sang Đang làm" }).waitFor();
  await page.getByRole("button", { name: "Chuyển sang Đang làm" }).click();
  await page.getByRole("button", { name: "Chuyển sang Chờ duyệt" }).waitFor();
  await page.getByLabel("Bình luận mới").fill(`Bình luận live ${tag}`);
  await page.getByRole("button", { name: "Gửi bình luận" }).click();
  await page.getByText(`Bình luận live ${tag}`, { exact: true }).waitFor();
  await page.getByRole("button", { name: "Chuyển sang Chờ duyệt" }).click();
  await page.getByText("Đang làm → Chờ duyệt", { exact: true }).waitFor();
  assert.equal(
    await page.getByRole("button", { name: "Chuyển sang Hoàn thành" }).count(),
    0,
  );
  await page.screenshot({
    path: path.join(evidence, "intern-work-detail.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Đóng", exact: true }).click();
  await page.getByRole("link", { name: "Sprint Board", exact: true }).click();
  await page.getByText(task.title, { exact: true }).waitFor();
  await page.screenshot({
    path: path.join(evidence, "intern-sprint.png"),
    fullPage: true,
  });
  await page.getByRole("link", { name: "Dự án", exact: true }).click();
  await page
    .getByRole("heading", {
      name: workspace.assignment.project.name,
      exact: true,
    })
    .waitFor();
  await page.screenshot({
    path: path.join(evidence, "intern-project.png"),
    fullPage: true,
  });
  const rows = await ds.query(
    "SELECT t.status,c.content FROM tasks t JOIN task_comments c ON c.taskId=t.id WHERE t.id=@0",
    [task.id],
  );
  assert.equal(rows[0].status, "review");
  assert.equal(rows[0].content, `Bình luận live ${tag}`);
  assert.deepEqual(errors, []);
  await context.close();
  results.push({
    name: "Real concurrent 409/refetch/retry without overwrite; own task transitions/comments/history, Sprint/Project SQL trace",
    status: "PASS",
    taskId: task.id,
    sqlTrace: rows[0],
  });
  const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
    }),
    mp = await mobile.newPage();
  await login(mp, "waiting");
  await mp.goto("http://localhost:3001/intern/work");
  await mp
    .getByRole("heading", { name: "Công việc của tôi", exact: true })
    .waitFor();
  await mp.getByRole("button", { name: "Mở menu", exact: true }).click();
  await mp.getByRole("dialog").waitFor();
  await mp.keyboard.press("Escape");
  assert.equal(await mp.getByRole("dialog").count(), 0);
  assert.equal(
    await mp.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    true,
  );
  await mp.screenshot({
    path: path.join(evidence, "intern-work-mobile.png"),
    fullPage: true,
  });
  await mobile.close();
  results.push({ name: "390×844 mobile navigation/overflow", status: "PASS" });
} catch (error) {
  results.push({ status: "FAIL", error: String(error) });
  process.exitCode = 1;
} finally {
  await browser.close();
  await ds.destroy();
  fs.writeFileSync(
    path.join(evidence, "work-live-results.json"),
    JSON.stringify({ interception: false, results, network }, null, 2) + "\n",
  );
}
console.log(JSON.stringify(results, null, 2));
