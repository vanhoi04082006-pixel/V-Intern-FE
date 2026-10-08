/** Real browser navigation, role guards and privacy-safe error UI. No interception. */
import path from "node:path";
import fs from "node:fs";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const be = path.resolve(process.env.LIVE_BE_ROOT || "../V-INTERN-BE");
const req = createRequire(path.join(be, "package.json"));
req("dotenv").config({ path: path.join(be, ".env.local"), quiet: true });
if (
  process.env.NODE_ENV !== "test" ||
  !process.env.DB_NAME?.startsWith("VIntern_Phase715_")
)
  throw Error("Disposable test environment required");
const { chromium } = await import("playwright");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const base = "http://localhost:3001",
  api = "http://localhost:8080/api/v1";
const evidence = path.resolve("phase7-evidence/final");
const results = [],
  network = [];
const academic = JSON.parse(
  fs.readFileSync("../phase7-local/academic.json", "utf8"),
);
const fixture = JSON.parse(
  fs.readFileSync("../phase7-local/outcomes.json", "utf8"),
);
const routes = {
  intern: [
    "",
    "work",
    "sprint",
    "project",
    "mentor",
    "evaluations",
    "performance",
    "kpi",
    "virtual-salary",
    "certificates",
    "recommendations",
    "notifications",
    "profile",
  ],
  instructor: [
    "",
    "classes",
    "sessions",
    `sessions/${academic.sessions}`,
    "projects",
    "sprints",
    "evaluations",
    "performance",
    "reports",
    "notifications",
    "profile",
  ],
  admin: [
    "",
    "users",
    "roles",
    "groups",
    "catalogs",
    "settings",
    "audit",
    "activity",
    "services",
    "tasks",
    "notifications",
    "profile",
    "logs",
  ],
};
async function ready(page) {
  await page.getByRole("heading", { level: 1 }).first().waitFor();
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(
    () =>
      ![...document.querySelectorAll('[role="status"]')].some((e) =>
        /Đang tải|Đang kiểm tra/.test(e.textContent || ""),
      ),
  );
}
async function login(page, role) {
  await page.goto(base + "/login");
  await page
    .getByLabel("Email hoặc tên đăng nhập")
    .fill(`${role === "intern" ? "waiting" : role}@phase715.test`);
  await page
    .getByLabel("Mật khẩu", { exact: true })
    .fill(process.env.LIVE_PASSWORD);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.waitForURL(`**/${role}`);
}
try {
  for (const role of Object.keys(routes)) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    const page = await context.newPage(),
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
    await login(page, role);
    for (const route of routes[role]) {
      console.log(JSON.stringify({ checking: `${role}/${route}` }));
      await page.goto(`${base}/${role}${route ? "/" + route : ""}`);
      if (route === "logs") await page.waitForURL("**/admin/audit");
      try {
        await ready(page);
      } catch (error) {
        await page.screenshot({
          path: path.join(evidence, `navigation-error-${role}.png`),
          fullPage: true,
        });
        console.error(
          JSON.stringify({
            url: page.url(),
            text: await page.locator("body").innerText(),
          }),
        );
        throw error;
      }
      // Next's accessibility route announcer is not an application error.
      const applicationAlerts = page.locator(
        '[role="alert"]:not(#__next-route-announcer__)',
      );
      if (await applicationAlerts.count()) {
        await page.screenshot({
          path: path.join(evidence, `navigation-error-${role}.png`),
          fullPage: true,
        });
        console.error(
          JSON.stringify({
            role,
            route,
            alerts: await page
              .getByRole("alert")
              .evaluateAll((nodes) => nodes.map((n) => n.outerHTML)),
          }),
        );
      }
      assert.equal(
        await applicationAlerts.count(),
        0,
        `${role}/${route} unexpectedly rendered an error`,
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${role}/${route} desktop overflow`,
      );
      const name = `${role}-${route.replaceAll("/", "-") || "overview"}`;
      await page.screenshot({
        path: path.join(evidence, `navigation-${name}.png`),
        fullPage: true,
      });
      await page.setViewportSize({ width: 390, height: 844 });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${role}/${route} mobile overflow`,
      );
      if (
        [
          "classes",
          "sessions",
          "projects",
          "reports",
          "catalogs",
          "groups",
          "roles",
          "activity",
          "audit",
          "work",
        ].includes(route)
      )
        await page.screenshot({
          path: path.join(evidence, `navigation-${name}-mobile.png`),
          fullPage: true,
        });
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
    if (role === "intern") {
      await page.goto(`${base}/intern/certificates/${fixture.certificateId}`);
      await page
        .getByRole("alert")
        .filter({ hasText: "Không tìm thấy dữ liệu" })
        .waitFor();
      assert.equal(
        await page
          .getByText(fixture.certificateNumber, { exact: true })
          .count(),
        0,
      );
      await page.goto(base + "/admin/users");
      await page.waitForURL("**/intern");
      assert.equal(
        await page
          .getByRole("heading", { name: "Quản lý người dùng", exact: true })
          .count(),
        0,
      );
      results.push({
        name: "Foreign certificate 404 UI hides identity; Intern cannot render Admin workspace",
        status: "PASS",
      });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + "/" + role);
    await ready(page);
    await page
      .getByRole("button", {
        name: role === "intern" ? "Mở menu điều hướng" : "Mở menu",
        exact: true,
      })
      .click();
    await page
      .getByRole("dialog", {
        name: role === "intern" ? "Menu thực tập sinh" : "Menu workspace",
      })
      .getByRole("link", {
        name: role === "intern" ? "Cài đặt" : "Hồ sơ",
        exact: true,
      })
      .click();
    await page.waitForURL(`**/${role}/profile`);
    assert.equal(
      await page
        .getByRole("dialog", {
          name: role === "intern" ? "Menu thực tập sinh" : "Menu workspace",
        })
        .count(),
      0,
    );
    assert.deepEqual(errors, []);
    results.push({
      name: `${role}: ${routes[role].length} real routes, desktop/mobile, no JS errors, mobile navigation`,
      status: "PASS",
    });
    await context.close();
  }
  const publicContext = await browser.newContext(),
    publicPage = await publicContext.newPage();
  for (const route of [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/verify",
  ]) {
    await publicPage.goto(base + route);
    await publicPage.waitForLoadState("networkidle");
    assert.equal(
      await publicPage.getByText("404", { exact: true }).count(),
      0,
      `${route} is missing`,
    );
  }
  results.push({
    name: "Public landing/login/register/forgot/verify routes resolve; unsupported Auth actions remain explicit contract gaps",
    status: "PASS",
  });
  await publicContext.close();
} catch (error) {
  results.push({
    name: "Navigation gate",
    status: "FAIL",
    error: String(error),
  });
  process.exitCode = 1;
} finally {
  await browser.close();
  fs.writeFileSync(
    path.join(evidence, "navigation-live-results.json"),
    JSON.stringify({ results, network, interception: false }, null, 2),
  );
}
console.log(
  JSON.stringify({
    passed: results.filter((r) => r.status === "PASS").length,
    results,
  }),
);
