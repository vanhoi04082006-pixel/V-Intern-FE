/** Instructor CRUD/assignment browser verification against real Nest and SQL. */
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
const fixture = JSON.parse(
    fs.readFileSync("../phase7-local/outcomes.json", "utf8"),
  ),
  api = "http://localhost:8080/api/v1",
  base = "http://localhost:3001",
  tag = Date.now().toString(36),
  evidence = path.resolve("phase7-evidence/final"),
  results = [],
  network = [];
fs.mkdirSync(evidence, { recursive: true });
async function call(email, url, method = "GET", body) {
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
  assert.equal(r.ok, true, `${url} ${r.status}`);
  return r.status === 204 ? null : r.json();
}
try {
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
  await page.goto(base + "/login");
  await page
    .getByLabel("Email hoặc tên đăng nhập")
    .fill("instructor@phase715.test");
  await page
    .getByLabel("Mật khẩu", { exact: true })
    .fill(process.env.LIVE_PASSWORD);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.waitForURL("**/instructor");
  await page
    .getByRole("heading", { name: "Instructor Workspace", exact: true })
    .waitFor();
  const entities = {};
  for (const [kind, button, title] of [
    ["sessions", "Tạo phiên", "Phiên UI"],
    ["projects", "Tạo dự án", "Dự án UI"],
    ["classes", "Tạo lớp", "Lớp UI"],
  ]) {
    await page.goto(base + `/instructor/${kind}`);
    await page.getByRole("button", { name: button, exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Mã", { exact: true }).fill(`UI-${kind}-${tag}`);
    await dialog.getByLabel("Tên", { exact: true }).fill(`${title} ${tag}`);
    await dialog
      .getByLabel("Mô tả", { exact: true })
      .fill("Tạo bằng browser thật");
    await dialog
      .getByLabel("Trạng thái", { exact: true })
      .selectOption("active");
    if (kind === "sessions") {
      await dialog
        .getByLabel("Bắt đầu (UTC)")
        .fill(new Date(Date.now() - 86400000).toISOString().slice(0, 16));
      await dialog
        .getByLabel("Kết thúc (UTC)")
        .fill(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16));
    }
    if (kind === "projects") {
      await dialog
        .getByLabel("Công nghệ (phân cách bằng dấu phẩy)")
        .fill("NestJS, SQL Server");
      await dialog.getByLabel("Sức chứa").fill("3");
    }
    if (kind === "classes")
      await dialog
        .getByLabel("Phiên thực tập", { exact: true })
        .selectOption(entities.sessions);
    const saved = page.waitForResponse(
      (r) => r.url() === api + `/${kind}` && r.request().method() === "POST",
    );
    await dialog.getByRole("button", { name: "Lưu", exact: true }).click();
    const response = await saved;
    assert.equal(response.status(), 201);
    entities[kind] = (await response.json()).id;
    await page
      .getByRole("button", { name: `Chi tiết UI-${kind}-${tag}`, exact: true })
      .click();
    await dialog
      .getByRole("button", { name: "Chỉnh sửa", exact: true })
      .click();
    await dialog
      .getByLabel("Tên", { exact: true })
      .fill(`${title} cập nhật ${tag}`);
    await dialog.getByRole("button", { name: "Lưu", exact: true }).click();
    await dialog
      .getByRole("heading", { name: `${title} cập nhật ${tag}`, exact: true })
      .waitFor();
    if (kind === "sessions") {
      const [added] = await Promise.all([
        page.waitForResponse(
          (r) =>
            r.url().endsWith("/instructors") && r.request().method() === "POST",
        ),
        dialog.getByRole("button", { name: "Thêm tôi làm giảng viên" }).click(),
      ]);
      assert.equal(added.status(), 201);
      await dialog
        .getByRole("button", { name: "Thêm tôi làm giảng viên" })
        .waitFor({ state: "visible" });
      await dialog.getByLabel("Tên mốc").fill("Kiểm tra tiến độ live");
      await dialog
        .getByRole("button", { name: "Thêm mốc", exact: true })
        .click();
      await dialog
        .getByLabel("Trạng thái Kiểm tra tiến độ live")
        .selectOption("completed");
      await dialog.getByLabel("Trạng thái Kiểm tra tiến độ live").waitFor();
    }
    if (kind === "classes") {
      const memberForm = dialog.locator("form").filter({ has: page.getByRole("button", { name: "Thêm thành viên", exact: true }) });
      await memberForm
        .getByLabel("Chọn Intern")
        .selectOption(fixture.userId);
      await memberForm
        .getByRole("button", { name: "Thêm thành viên", exact: true })
        .click();
      await dialog.getByText(fixture.email, { exact: true }).waitFor();
    }
    await page.screenshot({
      path: path.join(evidence, `instructor-${kind}-detail.png`),
      fullPage: true,
    });
    await dialog.getByRole("button", { name: "Đóng", exact: true }).click();
    await page.screenshot({
      path: path.join(evidence, `instructor-${kind}.png`),
      fullPage: true,
    });
    const rows = await ds.query(
      `SELECT name FROM ${kind === "sessions" ? "internship_sessions" : kind} WHERE id=@0`,
      [entities[kind]],
    );
    assert.equal(rows[0].name, `${title} cập nhật ${tag}`);
  }
  results.push({
    name: "Browser class/session/project create/edit/member/milestone with SQL trace",
    status: "PASS",
  });
  const before = await call(fixture.email, "/intern/me/workspace");
  assert.equal(before.status, "active");
  await call(
    "instructor@phase715.test",
    `/assignments/${before.assignment.id}/complete`,
    "POST",
  );
  assert.equal(
    (await call(fixture.email, "/intern/me/workspace")).status,
    "unassigned",
  );
  await page.goto(base + "/instructor");
  await page.getByLabel("Chọn Intern").selectOption(fixture.userId);
  await page
    .getByLabel("Dự án", { exact: true })
    .selectOption(entities.projects);
  await page
    .getByLabel("Phiên thực tập", { exact: true })
    .selectOption(entities.sessions);
  await page.getByRole("button", { name: "Phân công", exact: true }).click();
  await page.getByText(/Phân công thành công/).waitFor();
  const after = await call(fixture.email, "/intern/me/workspace");
  assert.equal(after.status, "active");
  assert.equal(after.assignment.project.id, entities.projects);
  const assigned = await ds.query(
    "SELECT projectId FROM assignments WHERE internId=@0 AND status='active'",
    [fixture.userId],
  );
  assert.equal(
    assigned[0].projectId.toLowerCase(),
    entities.projects.toLowerCase(),
  );
  await page.screenshot({
    path: path.join(evidence, "instructor-assignment.png"),
    fullPage: true,
  });
  results.push({
    name: "Instructor browser assignment unassigned→active matches SQL",
    status: "PASS",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + "/instructor/classes");
  await page.getByRole("button", { name: `Chi tiết UI-classes-${tag}`, exact: true }).waitFor();
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  );
  await page.screenshot({
    path: path.join(evidence, "instructor-classes-mobile.png"),
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  results.push({
    name: "Instructor mobile/no console failures",
    status: "PASS",
  });
  fs.writeFileSync(
    "../phase7-local/academic.json",
    JSON.stringify(
      { ...entities, graduateEmail: fixture.email, graduateId: fixture.userId },
      null,
      2,
    ),
  );
  await context.close();
} finally {
  fs.writeFileSync(
    path.join(evidence, "academic-live-results.json"),
    JSON.stringify({ results, network, interception: false }, null, 2),
  );
  await ds.destroy();
  await browser.close();
}
console.log(JSON.stringify({ passed: results.length, results }));
