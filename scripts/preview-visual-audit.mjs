#!/usr/bin/env node
/**
 * VISUAL AUDIT QUA PREVIEW MODE — bằng chứng browser cho UI Coverage Matrix.
 *
 * Môi trường: `next dev -p 3100` với NEXT_PUBLIC_PREVIEW=1 (mock transport).
 * Không đụng backend thật, không đụng DB — mọi response từ src/lib/preview.
 *
 * Quy tắc tab: sessionStorage của preview state là THEO TAB (như refresh cookie
 * theo tab) — mỗi role dùng MỘT page duy nhất cho toàn bộ routes (đúng như
 * người dùng thật làm việc trong một tab), không mở tab mới mỗi route.
 *
 * Trả về:
 *  - docs/preview-evidence/browser-audit.json (tổng hợp per-route × role)
 *  - docs/preview-evidence/screens/*.jpg (ảnh desktop/mobile)
 *
 * Chạy: `npm run preview:audit` (script tự spawn dev server; tắt ở cleanup.)
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const PORT = process.env.AUDIT_PORT ?? "3100";
const BASE = `http://localhost:${PORT}`;
const OUT_DIR = path.resolve("docs/preview-evidence");
const SCREENS = path.join(OUT_DIR, "screens");

/** Route inventory — trích từ source (find src/app -name page.tsx). */
const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password", "/verify", "/apply", "/github/invitation"];
const ADMIN_ROUTES = [
  "/admin", "/admin/users", "/admin/roles", "/admin/groups", "/admin/sessions",
  "/admin/sprints", "/admin/tasks", "/admin/templates", "/admin/questions",
  "/admin/career-roles", "/admin/recruitment-rounds", "/admin/knowledge",
  "/admin/knowledge/new", "/admin/catalogs", "/admin/performance", "/admin/kpi",
  "/admin/salary", "/admin/certificates", "/admin/reports", "/admin/activity",
  "/admin/ai", "/admin/audit", "/admin/communications", "/admin/notifications",
  "/admin/profile", "/admin/services", "/admin/settings",
];
const INSTRUCTOR_ROUTES = [
  "/instructor", "/instructor/recruitment-rounds", "/instructor/sessions",
  "/instructor/sprints", "/instructor/projects", "/instructor/evaluations",
  "/instructor/performance", "/instructor/participation", "/instructor/reports",
  "/instructor/github", "/instructor/notifications", "/instructor/profile",
];
const INTERN_ROUTES = [
  "/intern", "/intern/work", "/intern/participation", "/intern/sprint",
  "/intern/project", "/intern/mentor", "/intern/evaluations", "/intern/performance",
  "/intern/kpi", "/intern/virtual-salary", "/intern/certificates",
  "/intern/recommendations", "/intern/notifications", "/intern/profile",
];
const INTERN_DETAIL = ["/intern/work/ts-20", "/intern/kpi/kpi-2026-10", "/intern/evaluations/ev-2026-mid", "/intern/certificates/cert-01"];
const ONBOARDING_ROUTES = ["/intern/onboarding", "/intern/onboarding/role", "/intern/onboarding/interview", "/intern/onboarding/result"];
const MOBILE_SAMPLE = [
  "/login", "/verify", "/admin", "/instructor", "/intern",
];

const DEMO = {
  admin: { email: "admin@vintern.preview", password: "Preview@12345" },
  instructor: { email: "giangvien1@vintern.preview", password: "Preview@12345" },
  intern: { email: "sinhvien1@vintern.preview", password: "Preview@12345" },
  internNew: { email: "sinhvien_tan@vintern.preview", password: "Preview@12345" },
};

const results = { meta: {}, pages: [], scenarios: [], public: [] };

/** Tiếng ồn dev không liên quan UI — loại khỏi đếm console error. */
const CONSOLE_NOISE = [
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
  /Manifest:/i,
  /webpack\/hot\/log/i,
  /GL Driver Message/i,
];

async function startDevServer() {
  const proc = spawn("npx", ["next", "dev", "-p", PORT], {
    env: { ...process.env, NEXT_PUBLIC_PREVIEW: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  proc.stdout.on("data", (d) => (output += d.toString()));
  proc.stderr.on("data", (d) => (output += d.toString()));
  for (let i = 0; i < 150; i++) {
    try {
      const res = await fetch(`${BASE}/login`);
      if (res.ok) return { proc, output };
    } catch {
      /* chưa sẵn sàng */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  proc.kill("SIGTERM");
  throw new Error(`Dev server không sẵn sàng sau 150s.\n${output.slice(-2000)}`);
}

/** Audit trên MỘT page có sẵn (giữ sessionStorage của tab đó). */
async function auditPage(page, route, options = {}) {
  const entry = {
    route,
    role: options.role ?? null,
    account: options.account ?? null,
    consoleErrors: [],
    notMocked: 0,
    desktopOk: null,
    mobileOk: null,
    screenshot: null,
    url: null,
  };
  const onConsole = (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (CONSOLE_NOISE.some((re) => re.test(text))) return;
      entry.consoleErrors.push(text.slice(0, 300));
    }
  };
  const onPageError = (err) => entry.consoleErrors.push(`pageerror: ${err.message.slice(0, 300)}`);
  const onResponse = (res) => {
    if (res.status() === 501) entry.notMocked += 1;
  };
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("response", onResponse);
  try {
    await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => undefined);
    await page.waitForTimeout(1000);
    entry.url = new URL(page.url()).pathname;
    const shot = options.screenshotName ?? screenshotName(route, options);
    await page.screenshot({ path: path.join(SCREENS, shot), type: "jpeg", quality: 55 });
    entry.screenshot = `screens/${shot}`;
    // ErrorState (data-state.tsx) hiển thị khi endpoint chưa mock (501) hoặc lỗi
    // thật — dùng để phân biệt "render có dữ liệu" với "render đúng lỗi".
    entry.errorState = (await page.locator(".nb-error-card").count()) > 0;
    entry[options.mobile ? "mobileOk" : "desktopOk"] = entry.consoleErrors.length === 0;
  } catch (error) {
    entry.consoleErrors.push(`audit: ${String(error).slice(0, 300)}`);
  } finally {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
    page.off("response", onResponse);
  }
  return entry;
}

function screenshotName(route, options) {
  const suffix = options.mobile ? "-mobile" : "";
  const safe = route === "/" ? "home" : route.replaceAll("/", "-").replaceAll("[", "").replaceAll("]", "");
  return `${options.role ?? "public"}${safe}${suffix}.jpg`;
}

/** Fill bền vững với hydration: React wipe giá trị fill khi hydrate xong —
 *  điền lại cho tới khi giá trị còn nguyên sau 400ms. */
async function stableFill(page, selector, value) {
  for (let i = 0; i < 10; i++) {
    await page.locator(selector).fill(value);
    await page.waitForTimeout(400);
    if ((await page.locator(selector).inputValue()) === value) return;
  }
  throw new Error(`stableFill không ổn định: ${selector}`);
}

/** Đăng nhập ngay trên page được cho (giữ tab, giữ preview state).
 *  Dev compile có lúc chậm hơn 90s → thử tối đa 2 lần trước khi bỏ cuộc. */
async function login(page, credentials) {
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await page.goto(BASE + "/login", { waitUntil: "load", timeout: 90000 });
      await page.locator("#login-identifier").waitFor({ timeout: 30000 });
      await stableFill(page, "#login-identifier", credentials.email);
      await stableFill(page, "#login-password", credentials.password);
      await page.getByRole("button", { name: "Đăng nhập", exact: true }).first().click();
      await page.waitForURL(/\/(admin|instructor|intern)/, { timeout: 90000 });
      await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => undefined);
      await page.waitForTimeout(500);
      return new URL(page.url()).pathname;
    } catch (error) {
      lastError = error;
      console.error(`login attempt ${attempt} thất bại (${credentials.email}):`, String(error).slice(0, 120));
    }
  }
  throw lastError;
}

async function main() {
  fs.rmSync(SCREENS, { recursive: true, force: true });
  fs.mkdirSync(SCREENS, { recursive: true });
  const { proc } = await startDevServer();
  const browser = await chromium.launch({ headless: true });
  const started = new Date().toISOString();
  try {
    // ---- Public (không đăng nhập) — 1 tab riêng, không có preview state
    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      for (const route of PUBLIC_ROUTES) {
        results.public.push(await auditPage(page, route, { role: "public" }));
      }
      await context.close();
    }

    // ---- Admin — 1 tab, login 1 lần, mọi route qua goto trên cùng tab
    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      results.meta.adminLanding = await login(page, DEMO.admin);
      for (const route of ADMIN_ROUTES) {
        results.pages.push(
          await auditPage(page, route, { role: "admin", account: DEMO.admin.email }),
        );
      }
      await context.close();
    }

    // ---- Instructor
    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      results.meta.instructorLanding = await login(page, DEMO.instructor);
      for (const route of INSTRUCTOR_ROUTES) {
        results.pages.push(
          await auditPage(page, route, { role: "instructor", account: DEMO.instructor.email }),
        );
      }
      await context.close();
    }

    // ---- Intern (đầy đủ dữ liệu)
    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      results.meta.internLanding = await login(page, DEMO.intern);
      for (const route of [...INTERN_ROUTES, ...INTERN_DETAIL]) {
        results.pages.push(
          await auditPage(page, route, { role: "intern", account: DEMO.intern.email }),
        );
      }
      await context.close();
    }

    // ---- Intern mới → luồng onboarding
    {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      results.meta.internNewLanding = await login(page, DEMO.internNew);
      for (const route of ONBOARDING_ROUTES) {
        results.pages.push(
          await auditPage(page, route, { role: "intern", account: DEMO.internNew.email }),
        );
      }
      await context.close();
    }

    // ---- Mobile (390×844): public + từng role trên tab riêng
    {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      });
      const page = await context.newPage();
      for (const route of MOBILE_SAMPLE) {
        results.public.push(await auditPage(page, route, { role: "public", mobile: true }));
      }
      results.meta.adminMobileLanding = await login(page, DEMO.admin);
      for (const route of ["/admin/users", "/admin/salary"]) {
        results.pages.push(
          await auditPage(page, route, { role: "admin", account: DEMO.admin.email, mobile: true }),
        );
      }
      await context.close();

      const iContext = await browser.newContext({
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
      });
      const iPage = await iContext.newPage();
      await login(iPage, DEMO.intern);
      for (const route of ["/intern/work", "/intern/virtual-salary", "/intern/notifications"]) {
        results.pages.push(
          await auditPage(iPage, route, { role: "intern", account: DEMO.intern.email, mobile: true }),
        );
      }
      await iContext.close();
    }

    // ---- Scenario sweep trên /intern (dashboard sinh viên): mỗi kịch bản
    // một tab riêng — ghi preview state ngay trên tab đó rồi goto.
    for (const scenario of ["empty", "error", "forbidden", "network", "loading-slow", "unauthorized"]) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      await page.goto(BASE + "/login", { waitUntil: "domcontentloaded", timeout: 90000 });
      await page.evaluate(
        ([acc, sce]) =>
          window.sessionStorage.setItem(
            "vintern-preview-state",
            JSON.stringify({ account: acc, scenario: sce }),
          ),
        ["pv-intern-1", scenario],
      );
      const entry = await auditPage(page, "/intern", {
        role: "intern",
        account: DEMO.intern.email,
        screenshotName: `scenario-${scenario}.jpg`,
      });
      results.scenarios.push({ scenario, ...entry });
      await context.close();
    }
  } finally {
    await browser.close().catch(() => undefined);
    proc.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 1500));
    try { proc.kill("SIGKILL"); } catch { /* đã tắt */ }
  }

  results.meta = {
    ...results.meta,
    startedAt: started,
    finishedAt: new Date().toISOString(),
    baseUrl: BASE,
    previewMode: "NEXT_PUBLIC_PREVIEW=1 (mock transport)",
    routesAudited: results.pages.length + results.public.length,
    totalConsoleErrors: [...results.pages, ...results.public, ...results.scenarios].reduce(
      (sum, p) => sum + p.consoleErrors.length,
      0,
    ),
  };
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, "browser-audit.json"), JSON.stringify(results, null, 2));
  const pagesOk = results.pages.filter((p) => p.desktopOk || p.mobileOk).length;
  console.log(`\nOK: ${results.pages.length + results.public.length} route-passes, ${pagesOk} không console error.`);
  console.log(`JSON: docs/preview-evidence/browser-audit.json · Ảnh: docs/preview-evidence/screens/`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
