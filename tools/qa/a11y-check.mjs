/**
 * Accessibility audit for the local visual QA harness (axe-core).
 *
 * Runs axe against each requested route (with fixture interception, matching
 * visual-check.mjs) at 390px and 1440px, light and dark, and reports serious
 * violations (impact: serious/critical) that block the 9-criteria gate.
 *
 * Usage:
 *   node tools/qa/a11y-check.mjs --pack intern-work
 *   node tools/qa/a11y-check.mjs --routes /intern/work
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, writeFileSync, mkdirSync } from "node:fs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const reportPath = path.join(repoRoot, ".qa", "a11y-report.json");

const PACKS = {
  "intern-work": [
    "/intern",
    "/intern/work",
    "/intern/work/a1b2c3d4-0000-4000-8000-000000000002",
    "/intern/sprint",
    "/intern/project",
    "/intern/mentor",
    "/intern/github",
    "/intern/participation",
  ],
  "intern-results": [
    "/intern/evaluations",
    "/intern/evaluations/a1b2c3d4-0000-4000-8000-000000000100",
    "/intern/kpi",
    "/intern/kpi/a1b2c3d4-0000-4000-8000-000000000200",
    "/intern/virtual-salary",
    "/intern/performance",
    "/intern/recommendations",
    "/intern/certificates",
    "/intern/certificates/a1b2c3d4-0000-4000-8000-000000000300",
  ],
};

function arg(name, fallback) {
  const argv = process.argv.slice(2);
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const value = argv[i + 1];
  return value && !value.startsWith("--") ? value : true;
}

const routesArg = arg("routes");
const packArg = arg("pack");
const routes = routesArg
  ? String(routesArg).split(",").map((r) => r.trim()).filter(Boolean)
  : packArg
    ? PACKS[String(packArg)] ?? []
    : [];
if (!routes.length) {
  console.error("No routes. Use --routes a,b or --pack <name>.");
  process.exit(2);
}
const baseURL = String(arg("base-url", "http://localhost:3016"));

const { resolveApi } = await import("./fixtures.mjs");
const { chromium } = await import("playwright-core");
const axeSource = await readFile(
  path.join(repoRoot, "node_modules", "axe-core", "axe.min.js"),
  "utf8",
);

const CHROMIUM_CANDIDATES = [
  process.env.QA_CHROME_PATH,
  "/home/z/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome",
].filter(Boolean);
const executablePath = CHROMIUM_CANDIDATES.find((c) => existsSync(c));

const browser = await chromium.launch({ executablePath });
const results = [];
const CONTEXTS = [
  { width: 390, height: 844, theme: "light" },
  { width: 1440, height: 900, theme: "light" },
  { width: 390, height: 844, theme: "dark" },
];

for (const route of routes) {
  for (const context of CONTEXTS) {
    const browserContext = await browser.newContext({
      viewport: { width: context.width, height: context.height },
      colorScheme: context.theme === "dark" ? "dark" : "light",
    });
    await browserContext.addInitScript(
      ([themeKey]) => {
        try { window.localStorage.setItem("vintern-theme", themeKey); } catch {}
      },
      [context.theme],
    );
    await browserContext.route("**/api/v1/**", (routeHandle) => {
      const request = routeHandle.request();
      const url = new URL(request.url());
      const appPath = url.pathname.replace(/^\/api\/v1(?=\/|$)/, "") || "/";
      const body = resolveApi(request.method(), appPath, url.searchParams);
      if (body === null) {
        return routeHandle.fulfill({ status: 404, contentType: "application/json", body: "{}" });
      }
      return routeHandle.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
    });
    const page = await browserContext.newPage();
    await page
      .goto(`${baseURL}${route}`, { waitUntil: "domcontentloaded", timeout: 90000 })
      .catch(() => null);
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => null);
    await page.waitForTimeout(600);
    await page.addScriptTag({ content: axeSource });
    const violations = await page.evaluate(async () => {
      const run = await window.axe.run(document, {
        resultTypes: ["violations"],
        rules: { "color-contrast": { enabled: true } },
      });
      return run.violations
        .filter((v) => v.impact === "serious" || v.impact === "critical")
        .map((v) => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          nodes: v.nodes.slice(0, 3).map((n) => n.target.join(" ")),
        }));
    });
    results.push({ route, ...context, violations });
    await browserContext.close();
  }
  console.log(`a11y checked ${route}`);
}
await browser.close();

mkdirSync(path.dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify({ baseURL, routes, results }, null, 2));
const failed = results.filter((r) => r.violations.length);
console.log("\n=== A11Y (axe, serious+critical) ===");
console.log(`checks: ${results.length}${failed.length ? "" : " ✅"}`);
for (const row of failed) {
  console.log(`  ❌ ${row.route} ${row.width}px ${row.theme}:`);
  for (const v of row.violations) console.log(`     ${v.id} (${v.impact}) — ${v.help} @ ${v.nodes.join(" | ")}`);
}
console.log(`report: ${reportPath}`);
process.exit(failed.length ? 1 : 0);
