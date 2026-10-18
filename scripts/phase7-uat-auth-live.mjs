/** UAT regression: real browser, real Nest/SQL; no API interception. */
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { chromium } from "@playwright/test";
const be = path.resolve(process.env.LIVE_BE_ROOT || "../V-INTERN-BE");
createRequire(path.join(be, "package.json"))("dotenv").config({ path: path.join(be, ".env.local"), quiet: true });
if (process.env.NODE_ENV !== "test" || !process.env.DB_NAME?.startsWith("VIntern_Phase715_") || !process.env.LIVE_PASSWORD) throw new Error("Disposable test environment required.");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [], network = [];
const base = "http://localhost:3001", api = "http://localhost:8080/api/v1";
async function login(page) {
  await page.goto(base + "/login");
  await page.getByLabel("Email", { exact: true }).fill("admin@phase715.test");
  await page.getByLabel("Mật khẩu", { exact: true }).fill(process.env.LIVE_PASSWORD);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.waitForURL("**/admin");
  await page.locator("h1").waitFor();
}
async function scenario(name, run) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  context.on("page", page => {
    page.on("pageerror", e => errors.push(e.message));
    page.on("response", response => {
      if (response.url().startsWith(api)) network.push({ scenario: name, url: response.url().split("?")[0], method: response.request().method(), status: response.status() });
    });
  });
  try { await run(context); assert.deepEqual(errors, []); results.push({ name, status: "PASS" }); }
  catch (error) { results.push({ name, status: "FAIL", error: String(error) }); }
  finally { await context.close(); }
}
try {
  await scenario("rapid login submits only one credential request", async context => {
    const page = await context.newPage(); await page.goto(base + "/login");
    await page.getByLabel("Email", { exact: true }).fill("admin@phase715.test");
    await page.getByLabel("Mật khẩu", { exact: true }).fill(process.env.LIVE_PASSWORD);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).evaluate(b => { b.click(); b.click(); });
    await page.waitForURL("**/admin"); await page.waitForLoadState("networkidle");
    assert.equal(network.filter(r => r.scenario.startsWith("rapid login") && r.url === api + "/auth/login" && r.method === "POST").length, 1);
  });
  await scenario("locked account shows safe denial and unlock recovers", async context => {
    const auth = await fetch(api + "/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "admin@phase715.test", password: process.env.LIVE_PASSWORD }) });
    assert.equal(auth.status, 200); const { accessToken } = await auth.json();
    const headers = { authorization: `Bearer ${accessToken}`, "content-type": "application/json" }, tag = Date.now().toString(36), email = `uat-lock-${tag}@phase715.test`;
    const created = await fetch(api + "/users", { method: "POST", headers, body: JSON.stringify({ email, username: "uat-lock-" + tag, displayName: "UAT locked account", password: process.env.LIVE_PASSWORD, roleCodes: ["intern"] }) });
    assert.equal(created.status, 201); const user = await created.json();
    async function status(value) { const r = await fetch(api + `/users/${user.id}/status`, { method: "PATCH", headers, body: JSON.stringify({ status: value }) }); assert.equal(r.status, 200); }
    await status("locked");
    const page = await context.newPage(); await page.goto(base + "/login");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Mật khẩu", { exact: true }).fill(process.env.LIVE_PASSWORD);
    const [denied] = await Promise.all([page.waitForResponse(r => r.url() === api + "/auth/login" && r.request().method() === "POST"), page.getByRole("button", { name: "Đăng nhập", exact: true }).click()]);
    assert.equal(denied.status(), 403); await page.getByRole("alert").filter({ hasText: /khóa/i }).waitFor();
    assert.equal(new URL(page.url()).pathname, "/login"); assert.equal((await context.cookies()).filter(c => c.name === "vintern_refresh").length, 0);
    await status("active");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await page.waitForURL("**/intern/onboarding**"); await page.locator("h1").first().waitFor();
  });
  await scenario("two tabs restore and reload concurrently without refresh reuse", async context => {
    const first = await context.newPage(); await login(first);
    const networkStart = network.length;
    const second = await context.newPage(), third = await context.newPage();
    await Promise.all([second.goto(base + "/admin"), third.goto(base + "/admin")]);
    await Promise.all([second.locator("h1").waitFor({ timeout: 10000 }), third.locator("h1").waitFor({ timeout: 10000 })]);
    assert.equal(new URL(second.url()).pathname, "/admin"); assert.equal(new URL(third.url()).pathname, "/admin");
    await Promise.all([second.reload(), third.reload()]);
    await Promise.all([second.locator("h1").waitFor({ timeout: 10000 }), third.locator("h1").waitFor({ timeout: 10000 })]);
    assert.equal(new URL(second.url()).pathname, "/admin"); assert.equal(new URL(third.url()).pathname, "/admin");
    assert.equal(network.slice(networkStart).filter(r => r.url.endsWith("/auth/refresh") && r.status !== 200).length, 0);
  });
  await scenario("logout clears another open tab and browser back never restores private UI", async context => {
    const first = await context.newPage(); await login(first);
    const second = await context.newPage(); await second.goto(base + "/admin"); await second.locator("h1").waitFor();
    await first.getByRole("button", { name: "Đăng xuất", exact: true }).click();
    await Promise.all([first.waitForURL("**/login"), second.waitForURL("**/login", { timeout: 10000 })]);
    await second.goBack();
    if (second.url().startsWith(base + "/admin")) await second.waitForURL("**/login");
    assert.equal(await second.getByRole("button", { name: "Đăng xuất", exact: true }).count(), 0);
    await second.goto(base + "/admin");
    await second.waitForURL("**/login");
  });
  await scenario("invalid password and unknown account give the same safe error", async context => {
    const page = await context.newPage(), messages = [];
    await page.goto(base + "/login");
    for (const email of ["admin@phase715.test", "unknown-uat@phase715.test"]) {
      await page.getByLabel("Email", { exact: true }).fill(email);
      await page.getByLabel("Mật khẩu", { exact: true }).fill("invalid-development-password");
      const [response] = await Promise.all([
        page.waitForResponse(r => r.url() === api + "/auth/login" && r.request().method() === "POST"),
        page.getByRole("button", { name: "Đăng nhập", exact: true }).click(),
      ]);
      assert.equal(response.status(), 401);
      const alert = page.getByRole("alert").filter({ hasText: "Email hoặc mật khẩu" });
      await alert.waitFor(); messages.push(await alert.textContent());
      assert.equal(new URL(page.url()).pathname, "/login");
    }
    assert.equal(messages[0], messages[1]);
    assert.equal((await context.cookies()).filter(c => c.name === "vintern_refresh").length, 0);
  });
  await scenario("offline login is recoverable without a ghost principal", async context => {
    const page = await context.newPage(); await page.goto(base + "/login");
    await page.getByLabel("Email", { exact: true }).fill("admin@phase715.test");
    await page.getByLabel("Mật khẩu", { exact: true }).fill(process.env.LIVE_PASSWORD);
    await context.setOffline(true);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await page.getByRole("alert").filter({ hasText: "Không thể kết nối" }).waitFor();
    assert.equal(new URL(page.url()).pathname, "/login");
    await context.setOffline(false);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await page.waitForURL("**/admin"); await page.locator("h1").waitFor();
    const cookie = (await context.cookies()).find(c => c.name === "vintern_refresh");
    assert.ok(cookie?.httpOnly); assert.equal(cookie.sameSite, "Lax");
    assert.equal(cookie.path, "/api/v1/auth");
    assert.equal(await page.evaluate(() => Object.keys(localStorage).some(k => /token|principal|auth/i.test(k))), false);
  });
} finally {
  await browser.close(); fs.mkdirSync("phase7-evidence/final", { recursive: true });
  fs.writeFileSync("phase7-evidence/final/uat-auth-live-results.json", JSON.stringify({ results, network }, null, 2));
}
console.log(JSON.stringify(results, null, 2));
if (results.some(r => r.status !== "PASS")) process.exitCode = 1;
