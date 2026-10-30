/**
 * Debug một route với fixture theo role: liệt kê [role=alert] và headings
 * để tìm error state ẩn. Usage: node tools/qa/inspect-page.mjs /instructor/sprints
 */
import { existsSync } from "node:fs";
const route = process.argv[2] ?? "/intern/work";
const baseURL = process.env.QA_BASE_URL ?? "http://localhost:3016";
const isinstructor = route.startsWith("/instructor");
const internModule = await import("./fixtures.mjs");
const instructorModule = await import("./fixtures-instructor.mjs");
const resolveApi = isinstructor
  ? instructorModule.resolveInstructorApi
  : internModule.resolveApi;
const { chromium } = await import("playwright-core");
const exe = "/home/z/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome";
const browser = await chromium.launch({ executablePath: existsSync(exe) ? exe : undefined });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.route("**/api/v1/**", (routeHandle) => {
  const request = routeHandle.request();
  const url = new URL(request.url());
  const appPath = url.pathname.replace(/^\/api\/v1(?=\/|$)/, "") || "/";
  const body = resolveApi(request.method(), appPath, url.searchParams);
  if (body === null) {
    console.log("MISSING:", request.method(), url.pathname);
    return routeHandle.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ statusCode: 404, message: "no fixture" }) });
  }
  return routeHandle.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
});
const page = await context.newPage();
await page.goto(`${baseURL}${route}`, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(1000);
const alertText = await page.evaluate(() => {
  const alerts = Array.from(document.querySelectorAll('[role="alert"]'));
  return alerts.map((a) => a.textContent?.slice(0, 140));
});
console.log("alerts:", JSON.stringify(alertText, null, 2));
const headings = await page.evaluate(() => Array.from(document.querySelectorAll("h1, h2, h3")).map((h) => h.textContent?.slice(0, 60)));
console.log("headings:", JSON.stringify(headings, null, 2));
await browser.close();
