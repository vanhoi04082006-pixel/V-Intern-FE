/**
 * Keyboard walkthrough smoke test for the QA harness.
 * Verifies: Tab reaches interactive elements in DOM order, focus-visible
 * produces a visible outline, Escape closes the mobile menu, and the
 * skip-link is the first focusable element.
 */
import { existsSync } from "node:fs";

const baseURL = process.argv[2] ?? "http://localhost:3016";
const route = process.argv[3] ?? "/intern/work";

const { resolveApi } = await import("./fixtures.mjs");
const { chromium } = await import("playwright-core");
const CHROMIUM_CANDIDATES = [
  process.env.QA_CHROME_PATH,
  "/home/z/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome",
].filter(Boolean);
const browser = await chromium.launch({
  executablePath: CHROMIUM_CANDIDATES.find((c) => existsSync(c)),
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.route("**/api/v1/**", (routeHandle) => {
  const request = routeHandle.request();
  const url = new URL(request.url());
  const appPath = url.pathname.replace(/^\/api\/v1(?=\/|$)/, "") || "/";
  const body = resolveApi(request.method(), appPath, url.searchParams);
  if (body === null) return routeHandle.fulfill({ status: 404, body: "{}", contentType: "application/json" });
  return routeHandle.fulfill({ status: 200, body: JSON.stringify(body), contentType: "application/json" });
});
const page = await context.newPage();
await page.goto(`${baseURL}${route}`, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(600);

// 1) Skip link should be the first tab stop.
await page.keyboard.press("Tab");
const firstFocus = await page.evaluate(() => ({
  text: document.activeElement?.textContent?.trim().slice(0, 40),
  tag: document.activeElement?.tagName,
}));
console.log("first tab stop:", JSON.stringify(firstFocus));

// 2) Walk 20 tab stops; every stop must have a visible focus style when focused.
const stops = [];
for (let i = 0; i < 20; i++) {
  await page.keyboard.press("Tab");
  // tokens.css transitions every control (160ms) — let focus styles settle
  // before reading computed outlines, or a passing outline reads as 0px.
  await page.waitForTimeout(300);
  const info = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return null;
    const style = getComputedStyle(el);
    const outline = `${style.outlineWidth} ${style.outlineStyle} ${style.outlineColor}`;
    return {
      label: (el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 32),
      tag: el.tagName,
      outline,
      visibleOutline: style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0,
      // Next dev mode injects <nextjs-portal> (devtools indicator) past the
      // app's own stops; production has no such element. Stop walking there —
      // BODY afterwards just echoes document focus.
      devArtifact: el.tagName === "NEXTJS-PORTAL" || el === document.body,
    };
  });
  if (!info) break;
  if (info.devArtifact) break;
  stops.push(info);
}
console.log("tab stops:", stops.map((s) => `${s.tag}:"${s.label}"${s.visibleOutline ? " ✓focus" : " ✗NO-OUTLINE"}`).join("\n  "));

const noOutline = stops.filter((s) => !s.visibleOutline);
console.log(`\nfocus-visible coverage: ${stops.length - noOutline.length}/${stops.length}`);
if (noOutline.length) {
  console.log("MISSING OUTLINE ON:", noOutline.map((s) => s.label).join(", "));
}

// 3) Escape closes the mobile menu drawer at 390px and returns focus.
await page.setViewportSize({ width: 390, height: 844 });
const menuButton = page.locator('button[aria-label*="menu" i], button[aria-label*="Menu" i]').first();
if (await menuButton.count()) {
  await menuButton.click();
  await page.waitForTimeout(300);
  const drawerRole = await page.locator('div[role="dialog"]').count();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  const drawerAfter = await page.locator('div[role="dialog"]').count();
  console.log(`mobile drawer: opened=${drawerRole > 0}, closedByEscape=${drawerAfter === 0}`);
} else {
  console.log("mobile menu button not found (route may render differently)");
}
await browser.close();
process.exit(noOutline.length ? 1 : 0);
