/**
 * Local visual QA harness (Playwright + route interception).
 *
 * Boots `next dev` against an unreachable API base, fulfils /api/v1 requests
 * from tools/qa/fixtures.mjs, then walks the requested routes at
 * 390/768/1024/1280/1440 in light and dark, capturing:
 *   - screenshots per route x viewport x theme  -> .qa/shots/
 *   - horizontal overflow (scrollWidth > clientWidth + 1)
 *   - console errors / page errors / failed requests (except the API stubs)
 *
 * Usage:
 *   node tools/qa/visual-check.mjs --routes /intern,/intern/work
 *   node tools/qa/visual-check.mjs --pack intern-work
 *   node tools/qa/visual-check.mjs --pack intern-work --viewports 390,1440 --themes light
 *
 * This tool never changes application behaviour; the sql2019 CI gate stays
 * the authority for real backend flows.
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const shotsDir = path.join(repoRoot, ".qa", "shots");
const reportPath = path.join(repoRoot, ".qa", "report.json");

const PACKS = {
  "instructor-core": [
    "/instructor",
    "/instructor/sessions",
    "/instructor/sessions/ses-0000-4000-8000-000000000050",
    "/instructor/sessions/ses-0000-4000-8000-000000000050/setup?project=prj-0000-4000-8000-000000000050",
    "/instructor/sprints",
    "/instructor/sprints/spr-0000-4000-8000-000000000051",
    "/instructor/tasks/tsk-0000-4000-8000-000000000102",
    "/instructor/projects",
    "/instructor/projects/prj-0000-4000-8000-000000000050",
  ],
  "instructor-monitoring": [
    "/instructor/recruitment-rounds",
    "/instructor/participation",
    "/instructor/evaluations",
    "/instructor/performance",
    "/instructor/reports",
    "/instructor/github",
    "/instructor/notifications",
    "/instructor/profile",
  ],
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
const viewports = String(arg("viewports", "390,768,1024,1280,1440")).split(",").map(Number);
const themes = String(arg("themes", "light,dark")).split(",");
const port = Number(arg("port", 3016));
const externalBase = arg("base-url");
const baseURL = externalBase ? String(externalBase).replace(/\/+$/, "") : `http://localhost:${port}`;

const { resolveApi: resolveInternApi } = await import("./fixtures.mjs");
const { resolveInstructorApi } = await import("./fixtures-instructor.mjs");
// Fixtures are role-scoped: instructor surfaces authenticate as an instructor.
const resolveApi = (method, path, search) =>
  routes.some((r) => r.startsWith("/instructor"))
    ? resolveInstructorApi(method, path, search)
    : resolveInternApi(method, path, search);
const { chromium } = await import("playwright-core");

// Use an already-installed Chromium when the bundled revision is missing
// (project-scoped cache; never download browsers into the machine profile).
const CHROMIUM_CANDIDATES = [
  process.env.QA_CHROME_PATH,
  "/home/z/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome",
  "/home/z/.cache/ms-playwright/chromium_headless_shell-1200/chrome-headless-shell-linux64/chrome-headless-shell",
].filter(Boolean);
const executablePath = CHROMIUM_CANDIDATES.find((candidate) => existsSync(candidate));

// The API base must include the /api/v1 prefix (see api-client.ts: the
// configured base already includes it), and must be a host Playwright can
// intercept via context.route.
const apiBase = "http://qa-be.internal/api/v1";

async function waitForServer(url, timeoutMs = 120000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.status < 500) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

const server = externalBase
  ? null
  : spawn(
      process.platform === "win32" ? "npm.cmd" : "npm",
      ["run", "dev", "--", "-p", String(port)],
      {
        cwd: repoRoot,
        env: { ...process.env, NEXT_PUBLIC_API_BASE_URL: apiBase },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
let serverLog = "";
if (server) {
  server.stdout.on("data", (d) => (serverLog += d.toString()));
  server.stderr.on("data", (d) => (serverLog += d.toString()));
}

const cleanup = async () => {
  server?.kill("SIGTERM");
};
process.on("SIGINT", () => { server?.kill("SIGTERM"); process.exit(130); });
process.on("SIGTERM", () => { server?.kill("SIGTERM"); process.exit(143); });

try {
  if (server && !(await waitForServer(baseURL))) {
    console.error("Dev server did not start:\n", serverLog.slice(-3000));
    process.exit(1);
  }

  const browser = await chromium.launch({ executablePath });
  const results = [];
  const interactiveErrors = [];
  const missingFixtures = [];

  for (const route of routes) {
    for (const theme of themes) {
      const context = await browser.newContext({
        viewport: { width: viewports[viewports.length - 1] ?? 1280, height: 900 },
        colorScheme: theme === "dark" ? "dark" : "light",
      });
      await context.addInitScript(
        ([themeKey]) => {
          try { window.localStorage.setItem("vintern-theme", themeKey); } catch {}
        },
        [theme],
      );
      await context.route("**/api/v1/**", (routeHandle) => {
        const request = routeHandle.request();
        const url = new URL(request.url());
        // Strip the /api/v1 prefix: fixtures are written in app-relative paths
        // exactly as they appear in src/lib/api/* request calls.
        const appPath = url.pathname.replace(/^\/api\/v1(?=\/|$)/, "") || "/";
        const body = resolveApi(request.method(), appPath, url.searchParams);
        if (body === null) {
          missingFixtures.push(`${request.method()} ${url.pathname}`);
          return routeHandle.fulfill({
            status: 404,
            contentType: "application/json",
            body: JSON.stringify({ statusCode: 404, message: `QA fixture không có endpoint ${request.method()} ${url.pathname}` }),
          });
        }
        return routeHandle.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(body),
        });
      });
      const page = await context.newPage();
      const routeErrors = [];
      page.on("console", (msg) => {
        if (msg.type() === "error" && !msg.text().includes("qa-be.internal")) routeErrors.push(msg.text());
      });
      page.on("pageerror", (err) => routeErrors.push(`pageerror: ${err.message}`));
      page.on("requestfailed", (request) => {
        if (!request.url().includes("qa-be.internal")) routeErrors.push(`requestfailed: ${request.url()}`);
      });
      page.on("response", (response) => {
        if (response.url().includes("qa-be.internal") && response.status() >= 500) {
          routeErrors.push(`api ${response.status()}: ${response.url()}`);
        }
      });

      const slug = route.replaceAll("/", "_").replace(/^_/, "").replace(/[?&=]/g, "-") || "home";
      for (const width of viewports) {
        await page.setViewportSize({ width, height: 900 });
        const attempt = await page
          .goto(`${baseURL}${route}`, { waitUntil: "domcontentloaded", timeout: 90000 })
          .catch(() => null)
          .then((response) =>
            response
              ? page
                  .waitForLoadState("networkidle", { timeout: 20000 })
                  .catch(() => null)
                  .then(() => response)
              : null,
          );
        if (!attempt) {
          results.push({ route, theme, width, ok: false, reason: "navigation failed" });
          continue;
        }
        await page.waitForTimeout(700);
        const metrics = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          bodyScrollWidth: document.body.scrollWidth,
        }));
        const overflow = metrics.scrollWidth > metrics.clientWidth + 1;
        const shot = path.join(shotsDir, theme, `${slug}-${width}.png`);
        mkdirSync(path.dirname(shot), { recursive: true });
        await page.screenshot({ path: shot, fullPage: width === viewports[viewports.length - 1] });
        results.push({
          route,
          theme,
          width,
          ok: !overflow,
          scrollWidth: metrics.scrollWidth,
          clientWidth: metrics.clientWidth,
          errors: routeErrors.slice(0, 10),
        });
        if (routeErrors.length) interactiveErrors.push({ route, theme, width, errors: routeErrors.slice(0, 10) });
        routeErrors.length = 0;
      }
      await context.close();
    }
    console.log(`checked ${route}`);
  }

  await browser.close();
  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, JSON.stringify({ baseURL, routes, viewports, themes, results, interactiveErrors, missingFixtures: [...new Set(missingFixtures)] }, null, 2));

  const overflowRows = results.filter((r) => r.ok === false);
  const withErrors = results.filter((r) => r.errors?.length);
  const uniqueMissing = [...new Set(missingFixtures)];
  console.log("\n=== VISUAL QA SUMMARY ===");
  console.log(`routes: ${routes.length} | viewport shots: ${results.length}`);
  console.log(`horizontal overflow: ${overflowRows.length}${overflowRows.length ? "" : " ✅"}`);
  for (const row of overflowRows) console.log(`  ❌ ${row.route} ${row.theme} ${row.width}: scroll ${row.scrollWidth} > ${row.clientWidth}`);
  console.log(`console/network errors: ${withErrors.length}${withErrors.length ? "" : " ✅"}`);
  for (const row of withErrors) console.log(`  ❌ ${row.route} ${row.theme} ${row.width}:`, row.errors.join(" | ").slice(0, 300));
  console.log(`missing fixtures: ${uniqueMissing.length}${uniqueMissing.length ? "" : " ✅"}`);
  for (const endpoint of uniqueMissing) console.log(`  ⚠️ ${endpoint}`);
  console.log(`screenshots: ${shotsDir}`);
  console.log(`report: ${reportPath}`);
  const failed = overflowRows.length || withErrors.length;
  server?.kill("SIGTERM");
  process.exit(failed ? 1 : 0);
} finally {
  await cleanup();
}
