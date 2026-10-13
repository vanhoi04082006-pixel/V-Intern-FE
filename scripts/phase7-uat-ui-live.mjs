/** Additional real-user UAT: native dialogs, validation, duplicate mutations and tablet. */
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { chromium } from "@playwright/test";
const be = path.resolve(process.env.LIVE_BE_ROOT || "../V-INTERN-BE"), req = createRequire(path.join(be, "package.json"));
req("dotenv").config({ path: path.join(be, ".env.local"), quiet: true });
if (process.env.NODE_ENV !== "test" || !process.env.DB_NAME?.startsWith("VIntern_Phase715_")) throw Error("Disposable test environment required");
const ds = req(path.join(be, "dist/database/data-source.js")).default; await ds.initialize();
const browser = await chromium.launch({ channel: "chrome", headless: true });
const base = "http://localhost:3001", api = "http://localhost:8080/api/v1", evidence = "phase7-evidence/final";
fs.mkdirSync(evidence, { recursive: true });
const results = [], network = [];
async function login(page, role) {
  await page.goto(base + "/login");
  await page.getByLabel("Email hoặc tên đăng nhập").fill((role === "intern" ? "waiting" : role) + "@phase715.test");
  await page.getByLabel("Mật khẩu", { exact: true }).fill(process.env.LIVE_PASSWORD);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.waitForURL("**/" + role); await page.locator("h1").waitFor();
}
async function ready(page) {
  await page.locator("h1").first().waitFor(); await page.waitForLoadState("networkidle");
  await page.waitForFunction(() => ![...document.querySelectorAll('[role="status"]')].some(e => /Đang tải|Đang kiểm tra/.test(e.textContent || "")));
}
async function scenario(name, viewport, run) {
  const context = await browser.newContext({ viewport }), page = await context.newPage(), errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("response", r => { if (r.url().startsWith(api)) network.push({ scenario: name, url: r.url().split("?")[0], method: r.request().method(), status: r.status() }); });
  try { const detail = await run(page); assert.deepEqual(errors, []); results.push({ name, status: "PASS", detail }); }
  catch (error) { results.push({ name, status: "FAIL", error: String(error) }); await page.screenshot({ path: path.join(evidence, "uat-ui-failure-" + results.length + ".png"), fullPage: true }); }
  finally { await context.close(); }
}
try {
  await scenario("Admin keyboard modal, invalid form, double submit, duplicate email and XSS text", { width: 1440, height: 900 }, async page => {
    await login(page, "admin"); await page.goto(base + "/admin/users"); await ready(page);
    const trigger = page.getByRole("button", { name: "Tạo người dùng", exact: true }); await trigger.click();
    let dialog = page.getByRole("dialog"); await dialog.waitFor();
    for (let i = 0; i < 16; i++) { await page.keyboard.press("Tab"); assert.equal(await dialog.evaluate(d => d.contains(document.activeElement)), true, `modal Tab ${i}: focused ${await page.evaluate(() => document.activeElement?.tagName)}`); }
    await page.keyboard.press("Escape"); await dialog.waitFor({ state: "hidden" }); assert.equal(await trigger.evaluate(b => b === document.activeElement), true);
    await trigger.click(); dialog = page.getByRole("dialog");
    const requestsBefore = network.filter(r => r.url === api + "/users" && r.method === "POST").length;
    await dialog.getByRole("button", { name: "Lưu người dùng" }).click();
    assert.equal(await dialog.locator("form").evaluate(f => f.checkValidity()), false);
    assert.equal(network.filter(r => r.url === api + "/users" && r.method === "POST").length, requestsBefore);
    const tag = Date.now().toString(36), email = `uat-ui-${tag}@phase715.test`, name = "UAT <script>window.__uatXss=1</script>";
    async function fill() {
      await dialog.getByLabel("Họ tên", { exact: true }).fill(name);
      await dialog.getByLabel("Username", { exact: true }).fill("uat-ui-" + tag);
      await dialog.getByLabel("Email", { exact: true }).fill(email);
      await dialog.getByLabel("Mật khẩu khởi tạo").fill(process.env.LIVE_PASSWORD);
      await dialog.getByRole("checkbox", { name: /intern/ }).check();
    }
    await fill();
    const [created] = await Promise.all([
      page.waitForResponse(r => r.url() === api + "/users" && r.request().method() === "POST"),
      dialog.getByRole("button", { name: "Lưu người dùng" }).evaluate(b => { b.click(); b.click(); }),
    ]);
    assert.equal(created.status(), 201); await dialog.waitFor({ state: "hidden" });
    assert.equal(network.filter(r => r.url === api + "/users" && r.method === "POST").length, requestsBefore + 1);
    await page.getByLabel("Tìm người dùng", { exact: true }).fill(email); await page.getByText(name, { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => window.__uatXss), undefined);
    const rows = await ds.query("SELECT COUNT(*) AS n FROM users WHERE email=@0", [email]); assert.equal(Number(rows[0].n), 1);
    await trigger.click(); dialog = page.getByRole("dialog"); await fill();
    const [duplicate] = await Promise.all([
      page.waitForResponse(r => r.url() === api + "/users" && r.request().method() === "POST"),
      dialog.getByRole("button", { name: "Lưu người dùng" }).click(),
    ]);
    assert.equal(duplicate.status(), 409); await dialog.getByRole("alert").waitFor();
    assert.equal(await dialog.getByLabel("Email", { exact: true }).inputValue(), email);
    assert.equal(/stack|QueryFailedError|passwordHash|node_modules/.test(await dialog.innerText()), false);
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await dialog.evaluate(d => d.scrollWidth <= d.clientWidth + 1), true);
    await page.screenshot({ path: path.join(evidence, "uat-mobile-user-validation.png"), fullPage: true });
    return { email, sqlRows: Number(rows[0].n), createRequests: 1, duplicateStatus: 409, keyboardFocus: "contained/restored", xss: "text only" };
  });
  await scenario("Intern AI rapid double-send persists one user question", { width: 1440, height: 900 }, async page => {
    await login(page, "intern"); await page.goto(base + "/intern/mentor"); await ready(page);
    await page.getByRole("button", { name: "Cuộc trò chuyện mới", exact: true }).click();
    await page.getByLabel("Câu hỏi của bạn").fill("UAT double-send: chia nhỏ nhiệm vụ như thế nào?");
    const before = network.filter(r => r.scenario.includes("double-send") && r.url.endsWith("/messages") && r.method === "POST").length;
    const [sent] = await Promise.all([
      page.waitForResponse(r => r.url().endsWith("/messages") && r.request().method() === "POST"),
      page.getByRole("button", { name: "Gửi câu hỏi", exact: true }).evaluate(b => { b.click(); b.click(); }),
    ]);
    assert.equal(sent.status(), 201); const message = await sent.json();
    await page.getByText("AI Mentor · Gợi ý", { exact: true }).first().waitFor(); await page.waitForLoadState("networkidle");
    const count = network.filter(r => r.scenario.includes("double-send") && r.url.endsWith("/messages") && r.method === "POST").length - before;
    assert.equal(count, 1, "rapid UI send must issue one real API request");
    return { conversationId: message.conversation.id, messageRequests: count };
  });
  for (const [role, routes] of Object.entries({
    admin: ["users", "groups", "roles", "catalogs", "audit", "settings"],
    instructor: ["classes", "sessions", "projects", "sprints", "evaluations", "reports"],
    intern: ["work", "sprint", "project", "mentor", "kpi", "certificates"],
  })) {
    await scenario(role + " tablet routes, labels and mobile drawer", { width: 1024, height: 768 }, async page => {
      await login(page, role);
      for (const route of (role === "admin" ? ["groups", "roles"] : role === "instructor" ? ["reports"] : [])) {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto(`${base}/${role}/${route}`); await ready(page);
        if (role === "instructor" && route === "classes") {
          await page.waitForURL("**/instructor/projects");
          await page.getByRole("heading", { name: "Thư viện dự án", exact: true }).waitFor();
        }
        await page.screenshot({ path: path.join(evidence, `uat-desktop-${role}-${route}.png`), fullPage: true });
      }
      await page.setViewportSize({ width: 1024, height: 768 });
      for (const route of routes) {
        await page.goto(`${base}/${role}/${route}`); await ready(page);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `${role}/${route} tablet overflow`);
        assert.equal(await page.locator('[role="alert"]').filter({ hasText: /Không thể|không hợp lệ|không có quyền/ }).count(), 0);
        await page.screenshot({ path: path.join(evidence, `uat-tablet-${role}-${route}.png`), fullPage: true });
      }
      await page.setViewportSize({ width: 390, height: 844 });
      const trigger = page.getByRole("button", { name: "Mở menu", exact: true }); await trigger.click();
      const drawer = page.getByRole("dialog", { name: "Menu workspace" }); await drawer.waitFor();
      for (let i = 0; i < 20; i++) { await page.keyboard.press("Tab"); assert.equal(await drawer.evaluate(d => d.contains(document.activeElement)), true, `drawer Tab ${i}: focused ${await page.evaluate(() => document.activeElement?.tagName)}`); }
      await page.keyboard.press("Escape"); await drawer.waitFor({ state: "hidden" });
      assert.equal(await trigger.evaluate(b => document.activeElement === b), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
      return { tabletRoutes: routes, mobileDrawer: "keyboard contained, Escape and focus return" };
    });
  }
} finally {
  await browser.close(); await ds.destroy();
  fs.writeFileSync(path.join(evidence, "uat-ui-live-results.json"), JSON.stringify({ results, network }, null, 2));
}
console.log(JSON.stringify(results, null, 2)); if (results.some(r => r.status !== "PASS")) process.exitCode = 1;
