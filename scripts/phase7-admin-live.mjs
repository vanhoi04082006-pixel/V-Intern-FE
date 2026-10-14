/** Real Admin browser/SQL verification. No interception or legacy endpoint. */
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
const api = "http://localhost:8080/api/v1",
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
const admin = "admin@phase715.test";
async function mutate(page, suffix, method, click, expectedStatus = 201) {
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().endsWith(suffix) && r.request().method() === method,
    ),
    click(),
  ]);
  assert.equal(
    response.status(),
    expectedStatus,
    `${suffix}: status ${response.status()}`,
  );
  return response.json();
}
try {
  const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
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
  await page.getByLabel("Email hoặc tên đăng nhập").fill(admin);
  await page
    .getByLabel("Mật khẩu", { exact: true })
    .fill(process.env.LIVE_PASSWORD);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.waitForURL("**/admin");
  await page
    .getByRole("heading", { name: "Admin Workspace", exact: true })
    .waitFor();
  await page.goto(base + "/admin/users");
  await page
    .getByRole("button", { name: "Tạo người dùng", exact: true })
    .click();
  let dialog = page.getByRole("dialog");
  const email = `admin-created-${tag}@phase715.test`;
  await dialog
    .getByLabel("Họ tên", { exact: true })
    .fill("Admin browser " + tag);
  await dialog.getByLabel("Username", { exact: true }).fill("admin-ui-" + tag);
  await dialog.getByLabel("Email", { exact: true }).fill(email);
  await dialog.getByLabel("Mật khẩu khởi tạo").fill(process.env.LIVE_PASSWORD);
  await dialog.getByRole("checkbox", { name: /intern/ }).check();
  const user = await mutate(page, "/users", "POST", () =>
    dialog.getByRole("button", { name: "Lưu người dùng" }).click(),
  );
  assert.ok(!Object.hasOwn(user, "passwordHash"));
  await page.getByLabel("Tìm người dùng", { exact: true }).fill(email);
  const [roleFilter] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/users?") && r.url().includes("roleCode=intern"),
    ),
    page.getByLabel("Lọc vai trò người dùng").selectOption("intern"),
  ]);
  assert.equal(roleFilter.status(), 200);
  assert.equal((await roleFilter.json()).meta.total, 1);
  await mutate(
    page,
    `/users/${user.id}/status`,
    "PATCH",
    () =>
      page
        .getByLabel("Trạng thái " + email, { exact: true })
        .selectOption("active"),
    200,
  );
  await page
    .getByRole("button", { name: "Sửa tài khoản", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Họ tên", { exact: true })
    .fill("Admin browser edited " + tag);
  await mutate(
    page,
    `/users/${user.id}`,
    "PATCH",
    () => dialog.getByRole("button", { name: "Lưu người dùng" }).click(),
    200,
  );
  await page
    .getByText("Admin browser edited " + tag, { exact: true })
    .waitFor();
  const actual = await ds.query(
    "SELECT displayName,status FROM users WHERE id=@0",
    [user.id],
  );
  assert.equal(actual[0].displayName, "Admin browser edited " + tag);
  assert.equal(actual[0].status, "active");
  const detail = await call(admin, `/users/${user.id}`);
  assert.ok(!Object.hasOwn(detail, "passwordHash"));
  await page.screenshot({
    path: path.join(evidence, "admin-users.png"),
    fullPage: true,
  });
  results.push({
    name: "Admin browser user create/edit/status and SQL truth; no hash in response",
    status: "PASS",
  });
  await page.goto(base + "/admin/groups");
  await page.getByRole("button", { name: "Tạo nhóm", exact: true }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Mã nhóm").fill("ui-group-" + tag);
  await dialog.getByLabel("Tên nhóm").fill("Nhóm browser " + tag);
  await dialog
    .getByLabel("Mô tả nhóm")
    .fill("Dev test only, real Nest contract");
  const group = await mutate(page, "/groups", "POST", () =>
    dialog.getByRole("button", { name: "Lưu nhóm" }).click(),
  );
  await page.getByLabel("Tìm nhóm").fill(group.code);
  await page
    .getByRole("button", { name: new RegExp("Nhóm browser " + tag) })
    .click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Tìm thành viên nhóm").fill(email);
  await dialog
    .getByLabel("Thành viên nhóm", { exact: true })
    .selectOption(user.id);
  await mutate(page, `/groups/${group.id}/members`, "POST", () =>
    dialog.getByRole("button", { name: "Thêm thành viên nhóm" }).click(),
  );
  await dialog.getByText(email, { exact: true }).waitFor();
  await dialog.getByRole("checkbox", { name: /intern/ }).check();
  await mutate(
    page,
    `/groups/${group.id}/roles`,
    "PUT",
    () => dialog.getByRole("button", { name: "Lưu vai trò nhóm" }).click(),
    200,
  );
  assert.deepEqual((await call(admin, `/groups/${group.id}/roles`)).roles, [
    "intern",
  ]);
  const membership = await ds.query(
    "SELECT COUNT(*) AS n FROM group_members WHERE groupId=@0 AND userId=@1",
    [group.id, user.id],
  );
  assert.equal(Number(membership[0].n), 1);
  await page.screenshot({
    path: path.join(evidence, "admin-groups.png"),
    fullPage: true,
  });
  await mutate(
    page,
    `/groups/${group.id}/members/${user.id}`,
    "DELETE",
    () =>
      dialog
        .getByRole("button", { name: "Gỡ thành viên", exact: true })
        .click(),
    200,
  );
  assert.equal(
    (
      await ds.query(
        "SELECT COUNT(*) n FROM group_members WHERE groupId=@0 AND userId=@1",
        [group.id, user.id],
      )
    )[0].n,
    0,
  );
  await dialog.getByRole("button", { name: "Đóng", exact: true }).click();
  await page.goto(base + "/admin/roles");
  await page.getByRole("button", { name: /intern/i }).click();
  await page.getByRole("heading", { name: /Quyền của/ }).waitFor();
  const grantsPanel = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: /Quyền của/ }) });
  await grantsPanel.getByText(/bản ghi · Trang/).waitFor();
  for (
    let i = 0;
    i < 10 &&
    !(await page.getByText("tasks.update.own", { exact: true }).count());
    i++
  ) {
    const next = grantsPanel.getByRole("button", { name: "Sau", exact: true });
    if (!(await next.isEnabled())) break;
    const [response] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes("/permissions?page=") && r.status() === 200,
      ),
      next.click(),
    ]);
    const body = await response.json();
    await grantsPanel
      .getByText(new RegExp(`Trang ${body.meta.page}/`))
      .waitFor();
  }
  await page.getByText("tasks.update.own", { exact: true }).waitFor();
  await page.screenshot({
    path: path.join(evidence, "admin-roles.png"),
    fullPage: true,
  });
  results.push({
    name: "Admin browser group/member/role assignment and actual RBAC grant matrix",
    status: "PASS",
  });
  await page.goto(base + "/admin/catalogs");
  await page.getByRole("button", { name: "Tạo loại danh mục" }).click();
  dialog = page.getByRole("dialog");
  const typeCode = "ui-type-" + tag;
  await dialog.getByLabel("Mã loại").fill(typeCode);
  await dialog.getByLabel("Tên loại").fill("Danh mục browser " + tag);
  await dialog.getByLabel("Mô tả loại").fill("Dev browser fixture");
  await mutate(page, "/catalogs/types", "POST", () =>
    dialog.getByRole("button", { name: "Lưu loại danh mục" }).click(),
  );
  await page
    .getByRole("button", { name: new RegExp("Danh mục browser " + tag) })
    .click();
  await page.getByRole("button", { name: "Tạo giá trị", exact: true }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Mã giá trị").fill("first");
  await dialog.getByLabel("Tên giá trị").fill("Giá trị thật");
  await dialog.getByLabel("Giá trị", { exact: true }).fill("sql-value-" + tag);
  await dialog.getByLabel("Thứ tự").fill("1");
  const item = await mutate(page, "/catalogs/items", "POST", () =>
    dialog.getByRole("button", { name: "Lưu giá trị" }).click(),
  );
  await page.getByRole("button", { name: /Giá trị thật/ }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Tên giá trị").fill("Giá trị đã sửa");
  await dialog.getByLabel("Đang hoạt động").uncheck();
  await mutate(
    page,
    `/catalogs/items/${item.id}`,
    "PATCH",
    () => dialog.getByRole("button", { name: "Lưu giá trị" }).click(),
    200,
  );
  await page.getByRole("button", { name: /Giá trị đã sửa/ }).waitFor();
  const itemRow = await ds.query(
    "SELECT name,isActive FROM catalog_items WHERE id=@0",
    [item.id],
  );
  assert.equal(itemRow[0].name, "Giá trị đã sửa");
  assert.equal(Boolean(itemRow[0].isActive), false);
  await page.screenshot({
    path: path.join(evidence, "admin-catalogs.png"),
    fullPage: true,
  });
  await page.goto(base + "/admin/settings");
  await page.getByRole("button", { name: "Thêm cấu hình" }).click();
  dialog = page.getByRole("dialog");
  const key = "program.phase7." + tag;
  await dialog.getByLabel("Khóa cấu hình").fill(key);
  await dialog
    .getByLabel("Giá trị cấu hình")
    .fill("Live browser configuration");
  await dialog
    .getByLabel("Mô tả cấu hình")
    .fill("Phase7 development verification");
  await mutate(
    page,
    "/settings",
    "PATCH",
    () => dialog.getByRole("button", { name: "Lưu cấu hình" }).click(),
    200,
  );
  await page
    .getByRole("button")
    .filter({ hasText: key })
    .getByText("Live browser configuration", { exact: true })
    .waitFor();
  const config = await ds.query(
    "SELECT value FROM system_settings WHERE settingKey=@0",
    [key],
  );
  assert.equal(config[0].value, "Live browser configuration");
  await page.screenshot({
    path: path.join(evidence, "admin-settings.png"),
    fullPage: true,
  });
  results.push({
    name: "Catalog create/edit/status and business setting persisted in SQL",
    status: "PASS",
  });
  await page.goto(base + "/admin/tasks");
  await page.getByRole("button", { name: "Tạo nhiệm vụ", exact: true }).click();
  dialog = page.getByRole("dialog");
  const academic = JSON.parse(
    fs.readFileSync("../phase7-local/academic.json", "utf8"),
  );
  const project = await call(admin, `/projects/${academic.projects}`);
  await dialog.getByLabel("Tìm dự án nhiệm vụ").fill(project.code);
  await dialog
    .getByLabel("Dự án nhiệm vụ", { exact: true })
    .selectOption(academic.projects);
  await dialog
    .getByLabel("Tên nhiệm vụ", { exact: true })
    .fill("Admin task " + tag);
  await dialog
    .getByLabel("Mô tả nhiệm vụ", { exact: true })
    .fill("Real browser create/edit/delete");
  await dialog.getByLabel("Story points", { exact: true }).fill("3");
  const task = await mutate(page, "/tasks", "POST", () =>
    dialog.getByRole("button", { name: "Lưu nhiệm vụ" }).click(),
  );
  await page.getByLabel("Tìm nhiệm vụ quản lý").fill("Admin task " + tag);
  const taskRow = page.getByRole("row").filter({ has: page.getByRole("button", { name: task.code, exact: true }) });
  await taskRow.getByText("Admin task " + tag, { exact: true }).waitFor();
  await taskRow.getByLabel(`Thao tác ${task.code}`, { exact: true }).click();
  await taskRow.getByRole("button", { name: "Sửa nhiệm vụ", exact: true }).click();
  dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Tên nhiệm vụ", { exact: true })
    .fill("Admin task edited " + tag);
  await mutate(
    page,
    `/tasks/${task.id}`,
    "PATCH",
    () => dialog.getByRole("button", { name: "Lưu nhiệm vụ" }).click(),
    200,
  );
  assert.equal(
    (await ds.query("SELECT title FROM tasks WHERE id=@0", [task.id]))[0].title,
    "Admin task edited " + tag,
  );
  await page
    .getByLabel("Tìm nhiệm vụ quản lý")
    .fill("Admin task edited " + tag);
  await taskRow.getByText(`Admin task edited ${tag}`, { exact: true }).waitFor();
  await page.screenshot({
    path: path.join(evidence, "admin-tasks.png"),
    fullPage: true,
  });
  page.once("dialog", (d) => d.accept());
  await taskRow.getByLabel(`Thao tác ${task.code}`, { exact: true }).click();
  await mutate(
    page,
    `/tasks/${task.id}`,
    "DELETE",
    () => taskRow.getByRole("button", { name: "Xóa nhiệm vụ", exact: true }).click(),
    200,
  );
  assert.ok(
    (await ds.query("SELECT deletedAt FROM tasks WHERE id=@0", [task.id]))[0]
      .deletedAt,
  );
  results.push({
    name: "Admin task browser create/edit/soft-delete and SQL trace; group membership removal",
    status: "PASS",
  });
  await page.goto(base + "/admin/audit");
  await page.getByLabel("Hành động audit").fill("user.created");
  await page
    .getByRole("button", { name: /Chi tiết audit/ })
    .first()
    .click();
  dialog = page.getByRole("dialog");
  await dialog.getByText("user.created", { exact: true }).waitFor();
  await page.screenshot({
    path: path.join(evidence, "admin-audit.png"),
    fullPage: true,
  });
  await dialog.getByRole("button", { name: "Đóng", exact: true }).click();
  await page.goto(base + "/admin/activity");
  await page
    .getByRole("heading", { name: "Dòng hoạt động", exact: true })
    .waitFor();
  await page.screenshot({
    path: path.join(evidence, "admin-activity.png"),
    fullPage: true,
  });
  await page.goto(base + "/admin/services");
  await page
    .getByRole("heading", { name: "SQL Server", exact: true })
    .waitFor();
  await page.screenshot({
    path: path.join(evidence, "admin-services.png"),
    fullPage: true,
  });
  const alias = await page.request.get(base + "/admin/logs", {
    maxRedirects: 0,
  });
  assert.equal(alias.status(), 307);
  assert.equal(alias.headers().location, "/admin/audit");
  await page.goto(base + "/admin/logs");
  await page.waitForURL("**/admin/audit");
  // Complete the target's real session bootstrap before the next full navigation.
  await page.getByRole("heading", { name: "Audit log", exact: true }).waitFor();
  await page.waitForLoadState("networkidle");
  await page.goto(base + "/admin/notifications");
  await page.getByRole("heading", { name: "Thông báo", exact: true }).waitFor();
  await page.goto(base + "/admin/profile");
  await page.getByText(admin, { exact: true }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + "/admin/users");
  await page
    .getByRole("heading", { name: "Quản lý người dùng", exact: true })
    .waitFor();
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  );
  await page.getByRole("button", { name: "Mở menu", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Menu workspace" })
    .getByRole("link", { name: "Audit log", exact: true })
    .click();
  await page.waitForURL("**/admin/audit");
  await page.screenshot({
    path: path.join(evidence, "admin-audit-mobile.png"),
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  results.push({
    name: "Audit/activity/services/log alias/profile/notifications and real mobile navigation",
    status: "PASS",
  });
  await context.close();
} finally {
  fs.writeFileSync(
    path.join(evidence, "admin-live-results.json"),
    JSON.stringify({ results, network, interception: false }, null, 2),
  );
  await ds.destroy();
  await browser.close();
}
console.log(JSON.stringify({ passed: results.length, results }));
