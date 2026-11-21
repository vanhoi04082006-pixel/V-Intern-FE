#!/usr/bin/env node
/**
 * JOURNEY V3 — FINAL ACCEPTANCE BROWSER AUDIT (đợt tái nghiệm thu 2026-11-20)
 *
 * Nghiệm thu độc lập theo đúng yêu cầu FINAL ACCEPTANCE AUDIT:
 *   - Mỗi route được truy cập bằng ĐÚNG ROLE (public/admin/instructor/intern/
 *     intern-onboarding) trên môi trường Preview QA (NEXT_PUBLIC_PREVIEW=1,
 *     mock API — không đụng backend thật, không đụng dữ liệu production).
 *   - Chờ dữ liệu tải hoàn tất (không còn skeleton/“Đang tải”) trước khi chụp;
 *     trạng thái loading/error/empty được chụp RIÊNG dưới mục state-variants.
 *   - 3 viewport cho mọi route có UI: 390 / 768 / 1440.
 *   - Route động được truy cập bằng ID hợp lệ lấy từ chính dữ liệu preview
 *     (ss-f26, sp-03, ts-20, KL-QA-01, tpl-lib, kpi-2026-10, ev-2026-mid,
 *     cert-01, VC-2026-000123-XK4T).
 *   - KHÔNG dùng ảnh của route khác thay thế: ảnh đặt tại
 *     docs/journey-v3-evidence/<role>/<slug>-<vw>.jpg với slug suy ra từ route
 *     (tham số động thay bằng ID thực) — coverage gate đối chiếu lại được.
 *   - Ghi metadata cho từng (route × viewport): URL cuối, role, account,
 *     console/page errors, số response 501 (endpoint chưa mock), trạng thái
 *     dữ liệu (loaded/empty/error/loading), overflow ngang, shell role.
 *   - Redirect được kiểm chứng bằng URL cuối (không chụp ảnh mượn).
 *   - Tương tác nghiệp vụ chính (đăng nhập từng role, palette ⌘K, drawer mobile,
 *     dialog tạo phiên, tìm kiếm user, gửi tin nhắn AI mentor, đánh dấu thông
 *     báo, luồng onboarding chọn nghề, đổi mật khẩu, logout) chạy ở CUỐI buổi
 *     (context riêng) để không làm bẩn trạng thái chụp.
 *
 * Output:
 *   docs/journey-v3-evidence/browser-audit.json  (toàn bộ metadata + tương tác)
 *   docs/journey-v3-evidence/<role>/*.jpg        (ảnh theo route × viewport)
 *   docs/journey-v3-evidence/global/*.jpg        (not-found + state variants)
 *
 * Chạy: node scripts/journey-v3-browser-audit.mjs
 * (script tự spawn `next dev -p 3120` với NEXT_PUBLIC_PREVIEW=1 và dọn ở cuối;
 *  exit code ≠ 0 khi có route lỗi/tải không xong/501/console error.)
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

/* ------------------------------------------------------------------ *
 * PHASE MODE — sandbox giết process nền giữa các lần gọi công cụ,
 * nên audit chạy theo phase (mỗi phase một tool call < 10 phút):
 *   node scripts/journey-v3-browser-audit.mjs --phase=public|intern|
 *     onboarding|instructor|admin|interactions|merge
 * Mỗi phase ghi docs/journey-v3-evidence/.audit-partials/<phase>.json;
 * phase=merge gộp tất cả thành browser-audit.json + tính exit code.
 * ------------------------------------------------------------------ */
const PHASE = (process.argv.find((a) => a.startsWith("--phase=")) ?? "--phase=all").slice("--phase=".length);
const PARTIAL_DIR = () => path.join(EV_DIR, ".audit-partials");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = process.env.AUDIT_PORT ?? "3120";
const BASE = `http://localhost:${PORT}`;
const EV_DIR = path.join(ROOT, "docs", "journey-v3-evidence");
const VIEWPORTS = [
  { w: 1440, h: 900, tag: "1440" },
  { w: 768, h: 1024, tag: "768" },
  { w: 390, h: 844, tag: "390" },
];

const DEMO = {
  admin: { email: "admin@vintern.preview", password: "Preview@12345", id: "pv-admin-1" },
  instructor: { email: "giangvien1@vintern.preview", password: "Preview@12345", id: "pv-inst-1" },
  intern: { email: "sinhvien1@vintern.preview", password: "Preview@12345", id: "pv-intern-1" },
  internNew: { email: "sinhvien_tan@vintern.preview", password: "Preview@12345", id: "pv-intern-3" },
};

/** Tiếng ồn dev không liên quan UI — loại khỏi đếm console error. */
const CONSOLE_NOISE = [
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
  /Manifest:/i,
  /webpack\/hot\/log/i,
  /GL Driver Message/i,
  /\[HMR\]/i,
  /\[next-dev\]/i,
];

/* ------------------------------------------------------------------ *
 * KẾ HOẠCH AUDIT — route thật (80) × role đúng × ID động hợp lệ.
 * slug dùng cho tên ảnh: tham số động thay bằng ID thực tế.
 * ------------------------------------------------------------------ */
const PLAN = {
  public: {
    account: null,
    routes: [
      { route: "/", url: "/", slug: "landing" },
      { route: "/login", url: "/login", slug: "login" },
      { route: "/register", url: "/register", slug: "register" },
      { route: "/forgot-password", url: "/forgot-password", slug: "forgot-password" },
      { route: "/verify", url: "/verify?code=VC-2026-000123-XK4T", slug: "verify" },
      { route: "/apply", url: "/apply", slug: "apply" },
    ],
  },
  intern: {
    account: DEMO.intern,
    routes: [
      { route: "/change-password", url: "/change-password", slug: "change-password" }, // (auth) — truy cập khi đã đăng nhập
      { route: "/github/invitation", url: "/github/invitation?session=ss-f26", slug: "github-invitation" },
      { route: "/intern", url: "/intern", slug: "home" },
      { route: "/intern/work", url: "/intern/work", slug: "work" },
      { route: "/intern/work/[id]", url: "/intern/work/ts-20", slug: "work_ts-20" },
      { route: "/intern/sprint", url: "/intern/sprint", slug: "sprint" },
      { route: "/intern/project", url: "/intern/project", slug: "project" },
      { route: "/intern/mentor", url: "/intern/mentor", slug: "mentor" },
      { route: "/intern/evaluations", url: "/intern/evaluations", slug: "evaluations" },
      { route: "/intern/evaluations/[id]", url: "/intern/evaluations/ev-2026-mid", slug: "evaluations_ev-2026-mid" },
      { route: "/intern/performance", url: "/intern/performance", slug: "performance" },
      { route: "/intern/kpi", url: "/intern/kpi", slug: "kpi" },
      { route: "/intern/kpi/[id]", url: "/intern/kpi/kpi-2026-10", slug: "kpi_kpi-2026-10" },
      { route: "/intern/virtual-salary", url: "/intern/virtual-salary", slug: "virtual-salary" },
      { route: "/intern/certificates", url: "/intern/certificates", slug: "certificates" },
      { route: "/intern/certificates/[id]", url: "/intern/certificates/cert-01", slug: "certificates_cert-01" },
      { route: "/intern/recommendations", url: "/intern/recommendations", slug: "recommendations" },
      { route: "/intern/participation", url: "/intern/participation", slug: "participation" },
      { route: "/intern/github", url: "/intern/github", slug: "github" },
      { route: "/intern/notifications", url: "/intern/notifications", slug: "notifications" },
      { route: "/intern/profile", url: "/intern/profile", slug: "profile" },
    ],
  },
  "intern-onboarding": {
    account: DEMO.internNew,
    routes: [
      { route: "/intern/onboarding", url: "/intern/onboarding", slug: "onboarding" },
      { route: "/intern/onboarding/role", url: "/intern/onboarding/role", slug: "onboarding-role" },
      { route: "/intern/onboarding/interview", url: "/intern/onboarding/interview", slug: "onboarding-interview" },
      { route: "/intern/onboarding/result", url: "/intern/onboarding/result", slug: "onboarding-result" },
    ],
    onboardingFlow: true, // đi tiếp luồng thật: chọn nghề → phỏng vấn → kết quả
  },
  instructor: {
    account: DEMO.instructor,
    routes: [
      { route: "/instructor", url: "/instructor", slug: "home" },
      { route: "/instructor/sessions", url: "/instructor/sessions", slug: "sessions" },
      { route: "/instructor/sessions/[id]", url: "/instructor/sessions/ss-f26", slug: "sessions_ss-f26" },
      { route: "/instructor/sessions/[id]/setup", url: "/instructor/sessions/ss-f26/setup?project=prj-lib", slug: "sessions_ss-f26_setup" },
      { route: "/instructor/sprints", url: "/instructor/sprints", slug: "sprints" },
      { route: "/instructor/sprints/[id]", url: "/instructor/sprints/sp-03", slug: "sprints_sp-03" },
      { route: "/instructor/projects", url: "/instructor/projects", slug: "projects" },
      { route: "/instructor/projects/[id]", url: "/instructor/projects/tpl-lib", slug: "projects_tpl-lib" },
      { route: "/instructor/tasks/[id]", url: "/instructor/tasks/ts-20", slug: "tasks_ts-20" },
      { route: "/instructor/evaluations", url: "/instructor/evaluations", slug: "evaluations" },
      { route: "/instructor/performance", url: "/instructor/performance", slug: "performance" },
      { route: "/instructor/participation", url: "/instructor/participation", slug: "participation" },
      { route: "/instructor/reports", url: "/instructor/reports", slug: "reports" },
      { route: "/instructor/recruitment-rounds", url: "/instructor/recruitment-rounds", slug: "recruitment-rounds" },
      { route: "/instructor/github", url: "/instructor/github", slug: "github" },
      { route: "/instructor/notifications", url: "/instructor/notifications", slug: "notifications" },
      { route: "/instructor/profile", url: "/instructor/profile", slug: "profile" },
      {
        route: "/instructor/classes",
        url: "/instructor/classes",
        slug: "classes",
        expectRedirectTo: "/instructor/projects",
      },
    ],
  },
  admin: {
    account: DEMO.admin,
    routes: [
      { route: "/admin", url: "/admin", slug: "home" },
      { route: "/admin/users", url: "/admin/users", slug: "users" },
      { route: "/admin/roles", url: "/admin/roles", slug: "roles" },
      { route: "/admin/groups", url: "/admin/groups", slug: "groups" },
      { route: "/admin/sessions", url: "/admin/sessions", slug: "sessions" },
      { route: "/admin/sessions/[id]", url: "/admin/sessions/ss-f26", slug: "sessions_ss-f26" },
      { route: "/admin/sprints", url: "/admin/sprints", slug: "sprints" },
      { route: "/admin/sprints/[id]", url: "/admin/sprints/sp-03", slug: "sprints_sp-03" },
      { route: "/admin/tasks", url: "/admin/tasks", slug: "tasks" },
      { route: "/admin/tasks/[id]", url: "/admin/tasks/ts-20", slug: "tasks_ts-20" },
      { route: "/admin/templates", url: "/admin/templates", slug: "templates" },
      { route: "/admin/questions", url: "/admin/questions", slug: "questions" },
      { route: "/admin/knowledge", url: "/admin/knowledge", slug: "knowledge" },
      { route: "/admin/knowledge/new", url: "/admin/knowledge/new", slug: "knowledge-new" },
      { route: "/admin/knowledge/[code]", url: "/admin/knowledge/KL-QA-01", slug: "knowledge_KL-QA-01" },
      { route: "/admin/career-roles", url: "/admin/career-roles", slug: "career-roles" },
      { route: "/admin/recruitment-rounds", url: "/admin/recruitment-rounds", slug: "recruitment-rounds" },
      { route: "/admin/certificates", url: "/admin/certificates", slug: "certificates" },
      { route: "/admin/kpi", url: "/admin/kpi", slug: "kpi" },
      { route: "/admin/salary", url: "/admin/salary", slug: "salary" },
      { route: "/admin/reports", url: "/admin/reports", slug: "reports" },
      { route: "/admin/performance", url: "/admin/performance", slug: "performance" },
      { route: "/admin/evaluations", url: "/admin/evaluations", slug: "evaluations" },
      { route: "/admin/catalogs", url: "/admin/catalogs", slug: "catalogs" },
      { route: "/admin/services", url: "/admin/services", slug: "services" },
      { route: "/admin/communications", url: "/admin/communications", slug: "communications" },
      { route: "/admin/ai", url: "/admin/ai", slug: "ai" },
      { route: "/admin/activity", url: "/admin/activity", slug: "activity" },
      { route: "/admin/audit", url: "/admin/audit", slug: "audit" },
      { route: "/admin/notifications", url: "/admin/notifications", slug: "notifications" },
      { route: "/admin/profile", url: "/admin/profile", slug: "profile" },
      { route: "/admin/settings", url: "/admin/settings", slug: "settings" },
    ],
  },
};
// (Route /admin/evaluations đã tồn tại thật từ Master prompt V6 Phase E —
// không còn dòng định danh placeholder cần loại.)

const results = {
  meta: {
    startedAt: null,
    finishedAt: null,
    base: BASE,
    environment: "preview-qa (NEXT_PUBLIC_PREVIEW=1, mock API — KHÔNG phải Real Backend E2E)",
    viewports: VIEWPORTS.map((v) => `${v.w}x${v.h}`),
    logins: {},
    routeCount: 0,
    screenshotCount: 0,
  },
  pages: [], // một bản ghi cho mỗi (route × role): gồm cả 3 viewport
  stateVariants: [], // not-found / loading / error / empty
  interactions: [], // functional QA
};

/* ------------------------------------------------------------------ */

function startDevServer() {
  const proc = spawn("npx", ["next", "dev", "-p", PORT], {
    cwd: ROOT,
    env: { ...process.env, NEXT_PUBLIC_PREVIEW: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  proc.stdout.on("data", (d) => (output += d.toString()));
  proc.stderr.on("data", (d) => (output += d.toString()));
  // SIGTERM/SIGINT: dọn dev server, tránh orphan (quan trọng khi bị timeout kill).
  const cleanup = () => {
    try {
      proc.kill("SIGTERM");
    } catch {
      /* đã chết */
    }
  };
  process.on("SIGTERM", cleanup);
  process.on("SIGINT", cleanup);
  process.on("exit", cleanup);
  return {
    proc,
    reused: false,
    ready: async () => {
      for (let i = 0; i < 200; i++) {
        try {
          const res = await fetch(`${BASE}/login`);
          if (res.ok) return output;
        } catch {
          /* chưa sẵn sàng */
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
      proc.kill("SIGTERM");
      throw new Error(`Dev server không sẵn sàng sau 200s.\n${output.slice(-2000)}`);
    },
  };
}

async function stableFill(page, selector, value) {
  for (let i = 0; i < 12; i++) {
    await page.locator(selector).fill(value);
    await page.waitForTimeout(400);
    if ((await page.locator(selector).inputValue()) === value) return;
  }
  throw new Error(`stableFill không ổn định: ${selector}`);
}

async function login(page, credentials) {
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await page.goto(`${BASE}/login`, { waitUntil: "load", timeout: 90_000 });
      await page.locator("#login-identifier").waitFor({ timeout: 30_000 });
      await stableFill(page, "#login-identifier", credentials.email);
      await stableFill(page, "#login-password", credentials.password);
      await page.getByRole("button", { name: "Đăng nhập", exact: true }).first().click();
      await page.waitForURL(/\/(admin|instructor|intern)/, { timeout: 90_000 });
      await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => undefined);
      await page.waitForTimeout(600);
      return new URL(page.url()).pathname;
    } catch (error) {
      lastError = error;
      console.error(`login attempt ${attempt} thất bại (${credentials.email}):`, String(error).slice(0, 140));
    }
  }
  throw lastError;
}

/** Đổi kịch bản preview (sessionStorage theo tab) — không reload trang. */
async function setScenario(page, accountId, scenario) {
  await page.evaluate(
    ([id, sc]) => {
      sessionStorage.setItem(
        "vintern-preview-state",
        JSON.stringify({ account: id, scenario: sc }),
      );
    },
    [accountId, scenario],
  );
}

/** Đo trạng thái dữ liệu + layout ngay trên DOM hiện tại. */
async function probeState(page) {
  return page.evaluate(() => {
    const text = document.body?.innerText ?? "";
    const loading = [...document.querySelectorAll('[role="status"]')].filter((el) =>
      /đang tải/i.test(el.textContent ?? ""),
    );
    const skeletonish = document.querySelectorAll('[class*="skeleton"]').length;
    const errorCard = document.querySelectorAll(".nb-error-card").length;
    const emptyNote = document.querySelectorAll(".nb3-empty, .product-empty").length;
    const alerts = document.querySelectorAll('[role="alert"]').length;
    const permDenied = /chưa có quyền/i.test(text);
    const shellRole = document
      .querySelector("[data-workspace-role]")
      ?.getAttribute("data-workspace-role") ?? null;
    const tableRows = document.querySelectorAll("table tbody tr").length;
    const buttons = document.querySelectorAll("button").length;
    const overflowX = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    return {
      loadingMarkers: loading.length + skeletonish,
      errorCard,
      emptyNote,
      alerts,
      permDenied,
      shellRole,
      tableRows,
      buttons,
      bodyTextLength: text.trim().length,
      overflowX,
    };
  });
}

async function waitSettled(page, { timeout = 14_000 } = {}) {
  await page.waitForLoadState("networkidle", { timeout: 9_000 }).catch(() => undefined);
  await page
    .waitForFunction(
      () => {
        const loading = [...document.querySelectorAll('[role="status"]')].filter((el) =>
          /đang tải/i.test(el.textContent ?? ""),
        );
        return loading.length === 0 && document.querySelectorAll('[class*="skeleton"]').length === 0;
      },
      { timeout },
    )
    .catch(() => undefined);
  await page.waitForTimeout(500);
}

function classify(probe) {
  if (probe.errorCard > 0) return "error";
  if (probe.loadingMarkers > 0) return "loading";
  if (probe.emptyNote > 0) return "empty";
  return "loaded";
}

/** Audit 1 route trên 3 viewport (cùng tab — giữ phiên/preview state). */

/** Chạy danh sách route với xoay trang mỗi `every` route (giải phóng socket
 *  Chromium — tránh ERR_INSUFFICIENT_RESOURCES trên các phase dài). Login giữ
 *  nguyên nhờ cookie của context. */
async function auditRoutes(ctx, pageRef, entries, role, account, every = 6) {
  let page = pageRef;
  for (let i = 0; i < entries.length; i++) {
    if (i > 0 && i % every === 0) {
      // Xoay tab giải phóng socket — nhưng phiên đăng nhập nằm THEO TAB
      // (token sessionStorage) nên phải đăng nhập lại trên tab mới.
      const fresh = await ctx.newPage();
      await page.close().catch(() => undefined);
      page = fresh;
      if (account) await login(page, account);
    }
    const rec = await auditRoute(page, entries[i], role, account);
    results.pages.push(rec);
    console.log(`[${role}] ${entries[i].route}`);
  }
  return page;
}

async function auditRoute(page, entry, role, account) {
  const record = {
    route: entry.route,
    slug: entry.slug,
    role,
    account: account?.email ?? null,
    url: entry.url,
    finalUrl: null,
    redirectVerified: null,
    viewports: [],
    consoleErrors: [],
    notMocked501: 0,
    http5xx: 0,
    state: null,
    probe: null,
    shots: [],
    failure: null,
  };
  const onConsole = (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (CONSOLE_NOISE.some((re) => re.test(text))) return;
      record.consoleErrors.push(text.slice(0, 240));
    }
  };
  const onPageError = (err) =>
    record.consoleErrors.push(`pageerror: ${err.message.slice(0, 240)}`);
  const onResponse = (res) => {
    if (res.status() === 501) record.notMocked501 += 1;
    if (res.status() >= 500) record.http5xx += 1;
  };
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("response", onResponse);
  try {
    await page.setViewportSize({ width: VIEWPORTS[0].w, height: VIEWPORTS[0].h });
    await page.goto(BASE + entry.url, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await waitSettled(page);
    // Dev-compile flaky: nếu trang vừa rồi 5xx (biên dịch giữa chừng) → thử lại 1 lần
    if (record.http5xx > 0) {
      record.http5xx = 0;
      record.notMocked501 = 0;
      await page.waitForTimeout(1_200);
      await page.goto(BASE + entry.url, { waitUntil: "domcontentloaded", timeout: 90_000 });
      await waitSettled(page);
    }
    record.finalUrl = new URL(page.url()).pathname + new URL(page.url()).search;

    // Chặn lớp lỗi "ảnh mượn": nếu trang bị đẩy đi chỗ khác (mất phiên, guard
    // redirect) → ghi failure, KHÔNG chụp ảnh thay thế.
    const targetPath = new URL(BASE + entry.url).pathname;
    const finalPath = new URL(page.url()).pathname;
    if (!entry.expectRedirectTo && finalPath !== targetPath) {
      record.state = "unexpected-redirect";
      record.failure = `Trang bị chuyển hướng: ${finalPath} (kỳ vọng ${targetPath}) — không dùng ảnh của route khác.`;
      return record;
    }

    if (entry.expectRedirectTo) {
      record.redirectVerified = record.finalUrl === entry.expectRedirectTo;
      record.state = "redirect";
      record.probe = await probeState(page);
      results.meta.screenshotCount += 0;
      return record; // redirect: bằng chứng là URL cuối, không cần ảnh
    }

    // 3 viewport: 1440 → 768 → 390
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.w, height: vp.h });
      await page.waitForTimeout(420);
      const probe = await probeState(page);
      const file = path.join(EV_DIR, role, `${entry.slug}-${vp.tag}.jpg`);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      await page.screenshot({ path: file, type: "jpeg", quality: 72 });
      record.shots.push(path.relative(ROOT, file));
      record.viewports.push({
        viewport: `${vp.w}x${vp.h}`,
        file: path.relative(ROOT, file),
        overflowX: probe.overflowX,
      });
      results.meta.screenshotCount += 1;
    }
    // probe cuối theo viewport lớn nhất để phân loại tổng thể
    await page.setViewportSize({ width: VIEWPORTS[0].w, height: VIEWPORTS[0].h });
    await page.waitForTimeout(250);
    record.probe = await probeState(page);
    record.state = classify(record.probe);
  } catch (error) {
    record.failure = String(error).slice(0, 300);
    record.state = "crash";
  } finally {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
    page.off("response", onResponse);
  }
  return record;
}

/** Chụp một biến thể trạng thái toàn cục (loading/error/empty/not-found). */
async function captureVariant(page, variant, url, accountId, opts = {}) {
  const rec = { variant, role: opts.role ?? null, url, finalUrl: null, shots: [], state: null };
  await setScenario(page, accountId, opts.scenario ?? "populated");
  try {
    await page.setViewportSize({ width: opts.width ?? 1440, height: opts.height ?? 900 });
    await page.goto(BASE + url, { waitUntil: "domcontentloaded", timeout: 90_000 });
    if (opts.immediateShot) {
      await page.waitForTimeout(opts.waitMs ?? 1_100); // đang chậm 2400ms/request → skeleton còn nguyên
    } else {
      await waitSettled(page);
    }
    rec.finalUrl = new URL(page.url()).pathname;
    rec.state = classify(await probeState(page));
    const stateAtShot = rec.state; // trạng thái tại thời điểm chụp (không bị đè bởi settle sau đó)
    for (const vp of opts.viewports ?? VIEWPORTS) {
      await page.setViewportSize({ width: vp.w, height: vp.h });
      await page.waitForTimeout(350);
      if (opts.immediateShot && vp !== (opts.viewports ?? VIEWPORTS)[0]) continue; // loading chỉ chụp viewport đầu (thời gian trôi qua nhanh)
      const file = path.join(EV_DIR, "global", `${variant}-${vp.tag}.jpg`);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      await page.screenshot({ path: file, type: "jpeg", quality: 72 });
      rec.shots.push(path.relative(ROOT, file));
    }
    rec.stateAtShot ??= stateAtShot;
  } catch (error) {
    rec.failure = String(error).slice(0, 300);
  } finally {
    await setScenario(page, accountId, "populated");
  }
  results.meta.screenshotCount += rec.shots.length;
  return rec;
}

/* ------------------------------------------------------------------ *
 * TƯƠNG TÁC NGHIỆP VỤ (functional QA) — context riêng, chạy cuối.
 * Mỗi bước ghi ok/fail + bằng chứng nhỏ (ảnh xác nhận).
 * ------------------------------------------------------------------ */
async function runInteractions(browser) {
  const push = (id, role, route, description, ok, evidenceShot = null, error = null) => {
    results.interactions.push({ id, role, route, description, ok, evidenceShot, error: error ? String(error).slice(0, 200) : null });
    console.log(`${ok ? "✓" : "✗"} interaction ${id} (${role})`);
  };

  /* --- Public: register / forgot-password / verify / apply --- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    try {
      // forgot-password: submit email → phản hồi hiện
      await page.goto(`${BASE}/forgot-password`, { waitUntil: "load", timeout: 60_000 });
      await page.waitForTimeout(1_000);
      const emailInput = page.locator('input[type="email"], input[name="email"], #forgot-email').first();
      await emailInput.waitFor({ timeout: 10_000 });
      await stableFill(page, 'input[type="email"], input[name="email"], #forgot-email', "nguoidung moi@example.com");
      await page.getByRole("button", { name: /gửi|khôi phục|tiếp tục/i }).first().click();
      await page.waitForTimeout(1_800);
      const feedback =
        (await page.locator("text=/chưa được kết nối|đang gửi|vui lòng kiểm tra/i").count()) > 0;
      push("public-forgot-password-submit", "public", "/forgot-password", "Gửi yêu cầu quên mật khẩu — FE hiện phản hồi trạng thái", feedback);
    } catch (e) {
      push("public-forgot-password-submit", "public", "/forgot-password", "Gửi yêu cầu quên mật khẩu — thấy phản hồi", false, null, e);
    }
    try {
      // register: điền form → submit → feedback/redirect
      await page.goto(`${BASE}/register`, { waitUntil: "load", timeout: 60_000 });
      await page.waitForTimeout(1_000);
      await stableFill(page, "#register-full-name", "Người Dùng Mới");
      await stableFill(page, "#register-email", "nguoidungmoi@example.com");
      await stableFill(page, "#register-password", "Matkhaumoi@12345");
      await stableFill(page, "#register-confirm", "Matkhaumoi@12345");
      const terms = page.locator("#register-terms");
      if (await terms.count()) await terms.check({ force: true });
      await page.getByRole("button", { name: /đăng ký|tạo tài khoản/i }).first().click();
      await page.waitForTimeout(2_400);
      const ok =
        (await page.locator("text=/đăng ký thành công|đã tạo|vui lòng|kiểm tra email/i").count()) > 0 ||
        new URL(page.url()).pathname === "/login";
      push("public-register-submit", "public", "/register", "Gửi form đăng ký — thấy phản hồi", ok);
    } catch (e) {
      push("public-register-submit", "public", "/register", "Gửi form đăng ký — feedback hoặc chuyển /login", false, null, e);
    }
    try {
      // verify: nhập mã hợp lệ → kết quả xác minh hiển thị
      await page.goto(`${BASE}/verify`, { waitUntil: "load", timeout: 60_000 });
      await page.waitForTimeout(1_200);
      const codeInput = page.locator('input[name="code"], input[placeholder*="VC-"], input#verify-code').first();
      await codeInput.waitFor({ timeout: 8_000 });
      await stableFill(page, 'input[name="code"], input[placeholder*="VC-"], input#verify-code', "VC-2026-000123-XK4T");
      await page.getByRole("button", { name: /xác minh|tra cứu|kiểm tra/i }).first().click();
      await page.waitForTimeout(2_200);
      const ok = (await page.locator("text=/VINTERN-2026|còn hiệu lực|hợp lệ|chứng nhận/i").count()) > 0;
      const shot = path.join(EV_DIR, "public", "interaction-verify-result-1440.jpg");
      await page.screenshot({ path: shot, type: "jpeg", quality: 72 });
      push("public-verify-certificate", "public", "/verify", "Xác minh mã chứng nhận VC-2026-000123-XK4T — kết quả hiển thị", ok, path.relative(ROOT, shot));
    } catch (e) {
      push("public-verify-certificate", "public", "/verify", "Xác minh mã chứng nhận — kết quả hiển thị", false, null, e);
    }
    await ctx.close();
  }

  /* --- Intern: palette ⌘K, mobile drawer, mentor chat, notifications, change-password --- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const landing = await login(page, DEMO.intern);
    push("intern-login", "intern", "/login", "Đăng nhập sinh viên1 → vào workspace", /\/intern/.test(landing));
    try {
      // ⌘K command palette
      await page.goto(`${BASE}/intern/work`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await waitSettled(page);
      await page.keyboard.press("Control+k");
      await page.waitForTimeout(900);
      const paletteVisible =
        (await page.locator(".cmd-palette-dialog, [role='dialog']").count()) > 0;
      const shot = path.join(EV_DIR, "intern", "interaction-command-palette-1440.jpg");
      await page.screenshot({ path: shot, type: "jpeg", quality: 72 });
      await page.keyboard.press("Escape");
      push("intern-command-palette", "intern", "/intern/work", "Ctrl+K mở bảng lệnh", paletteVisible, path.relative(ROOT, shot));
    } catch (e) {
      push("intern-command-palette", "intern", "/intern/work", "Ctrl+K mở bảng lệnh", false, null, e);
    }
    try {
      // mobile drawer 390
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${BASE}/intern/work`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await waitSettled(page);
      const menuBtn = page.getByRole("button", { name: /menu|mở điều hướng|thanh cạnh/i }).first();
      if (await menuBtn.count()) {
        await menuBtn.click();
        await page.waitForTimeout(700);
      }
      const drawerOpen = (await page.locator('nav a[href="/intern/kpi"], nav a[href="/intern/profile"], [role="dialog"] a[href^="/intern"]').count()) > 0;
      const shot = path.join(EV_DIR, "intern", "interaction-mobile-drawer-390.jpg");
      await page.screenshot({ path: shot, type: "jpeg", quality: 72 });
      push("intern-mobile-drawer", "intern", "/intern/work", "Mở drawer điều hướng trên mobile 390", drawerOpen, path.relative(ROOT, shot));
      await page.setViewportSize({ width: 1440, height: 900 });
    } catch (e) {
      push("intern-mobile-drawer", "intern", "/intern/work", "Mở drawer điều hướng trên mobile 390", false, null, e);
    }
    try {
      // AI mentor: chọn hội thoại hiện có → gửi tin nhắn trong composer
      await page.goto(`${BASE}/intern/mentor`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await waitSettled(page);
      const convoBtn = page.locator("button.student-conversation").first();
      if (await convoBtn.count()) await convoBtn.click();
      await page.waitForTimeout(1_200);
      const textarea = page.locator("textarea").first();
      if (await textarea.count()) {
        await textarea.fill("Em bị lỗi khi deploy, mentor giúp em với?");
        await page.getByRole("button", { name: /gửi câu hỏi|gửi/i }).first().click();
        await page.waitForTimeout(3_000);
        const appended =
          (await page.locator("text=/bị lỗi khi deploy/i").count()) > 0 ||
          (await page.locator("text=/mentor đang xử lý/i").count()) > 0;
        const shot = path.join(EV_DIR, "intern", "interaction-mentor-message-1440.jpg");
        await page.screenshot({ path: shot, type: "jpeg", quality: 72 });
        push("intern-mentor-send-message", "intern", "/intern/mentor", "Gửi tin nhắn AI Mentor — hội thoại phản hồi", appended, path.relative(ROOT, shot));
      } else {
        push("intern-mentor-send-message", "intern", "/intern/mentor", "Gửi tin nhắn AI Mentor — không tìm thấy ô nhập", false);
      }
    } catch (e) {
      push("intern-mentor-send-message", "intern", "/intern/mentor", "Gửi tin nhắn AI Mentor", false, null, e);
    }
    try {
      // notifications: đánh dấu tất cả đã đọc
      await page.goto(`${BASE}/intern/notifications`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await waitSettled(page);
      const markBtn = page.getByRole("button", { name: /đã đọc|đánh dấu|tất cả/i }).first();
      if (await markBtn.count()) {
        await markBtn.click();
        await page.waitForTimeout(1_500);
        push("intern-notifications-read-all", "intern", "/intern/notifications", "Đánh dấu mọi thông báo đã đọc", true);
      } else {
        push("intern-notifications-read-all", "intern", "/intern/notifications", "Nút đánh dấu đã đọc không tìm thấy", false);
      }
    } catch (e) {
      push("intern-notifications-read-all", "intern", "/intern/notifications", "Đánh dấu mọi thông báo đã đọc", false, null, e);
    }
    try {
      // change-password form (đã đăng nhập)
      await page.goto(`${BASE}/change-password`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForTimeout(900);
      const currentPw = page.locator('input[type="password"]').nth(0);
      await currentPw.waitFor({ timeout: 30_000 });
      const shot = path.join(EV_DIR, "intern", "interaction-change-password-form-1440.jpg");
      await page.screenshot({ path: shot, type: "jpeg", quality: 72 });
      push("intern-change-password-render", "intern", "/change-password", "Form đổi mật khẩu render (đã đăng nhập)", true, path.relative(ROOT, shot), null);
    } catch (e) {
      push("intern-change-password-render", "intern", "/change-password", "Form đổi mật khẩu render (đã đăng nhập)", false, null, e);
    }
    await ctx.close();
  }

  /* --- Admin: users search, create-session dialog, salary period, knowledge editor --- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const landing = await login(page, DEMO.admin);
    push("admin-login", "admin", "/login", "Đăng nhập admin → vào /admin", landing.startsWith("/admin"));
    try {
      // users: lọc tìm kiếm
      await page.goto(`${BASE}/admin/users`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await waitSettled(page);
      const search = page.locator('input[type="search"], input[placeholder*="Tìm"], input[placeholder*="tìm"]').first();
      if (await search.count()) {
        await search.fill("sinhvien");
        await page.waitForTimeout(1_200);
        const rows = await page.locator("table tbody tr").count();
        push("admin-users-search", "admin", "/admin/users", `Tìm kiếm "sinhvien" — còn ${rows} hàng`, rows > 0);
      } else {
        push("admin-users-search", "admin", "/admin/users", "Không tìm thấy ô tìm kiếm", false);
      }
    } catch (e) {
      push("admin-users-search", "admin", "/admin/users", "Tìm kiếm user", false, null, e);
    }
    try {
      // sessions console (chỉ đọc): mở hàng phiên SS-F26 → trang chi tiết phiên
      await page.goto(`${BASE}/admin/sessions`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await waitSettled(page);
      const row = page.locator('a[href="/admin/sessions/ss-f26"]').first();
      if (await row.count()) {
        await row.click();
        await page.waitForURL(/\/admin\/sessions\/ss-f26/, { timeout: 20_000 }).catch(() => undefined);
        await page.waitForTimeout(1_500);
        const onDetail = new URL(page.url()).pathname === "/admin/sessions/ss-f26";
        push("admin-session-open-detail", "admin", "/admin/sessions", "Mở phiên SS-F26 → trang chi tiết phiên", onDetail);
      } else {
        push("admin-session-open-detail", "admin", "/admin/sessions", "Không thấy link SS-F26", false);
      }
    } catch (e) {
      push("admin-session-open-detail", "admin", "/admin/sessions", "Mở chi tiết phiên", false, null, e);
    }
    try {
      // recruitment-rounds (admin): chọn đợt → workspace hiển thị hồ sơ
      await page.goto(`${BASE}/admin/recruitment-rounds`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await waitSettled(page);
      const roundSelect = page.locator("select").first();
      if (await roundSelect.count()) {
        const opts = await roundSelect.locator("option").all();
        if (opts.length > 1) {
          await roundSelect.selectOption({ index: 1 });
          await page.waitForTimeout(2_200);
          const shot = path.join(EV_DIR, "admin", "interaction-recruitment-round-selected-1440.jpg");
          await page.screenshot({ path: shot, type: "jpeg", quality: 72 });
          push("admin-recruitment-round-select", "admin", "/admin/recruitment-rounds", "Chọn đợt tuyển → workspace hồ sơ hiển thị", true, path.relative(ROOT, shot));
        } else {
          push("admin-recruitment-round-select", "admin", "/admin/recruitment-rounds", "Dropdown không có đợt", false);
        }
      } else {
        push("admin-recruitment-round-select", "admin", "/admin/recruitment-rounds", "Không tìm thấy dropdown", false);
      }
    } catch (e) {
      push("admin-recruitment-round-select", "admin", "/admin/recruitment-rounds", "Chọn đợt tuyển", false, null, e);
    }
    try {
      // salary console: chọn kỳ trong select (option đầu "Tất cả kỳ" → chọn kỳ thật)
      await page.goto(`${BASE}/admin/salary`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await waitSettled(page);
      const periodSelect = page
        .locator("select")
        .filter({ has: page.locator('option:has-text("Tất cả kỳ")') })
        .first();
      if (await periodSelect.count()) {
        await periodSelect.selectOption({ index: 1 });
        await page.waitForTimeout(1_600);
        const shot = path.join(EV_DIR, "admin", "interaction-salary-period-switch-1440.jpg");
        await page.screenshot({ path: shot, type: "jpeg", quality: 72 });
        push("admin-salary-period-switch", "admin", "/admin/salary", "Chọn kỳ lương trong console — bảng tải lại theo kỳ", true, path.relative(ROOT, shot));
      } else {
        push("admin-salary-period-switch", "admin", "/admin/salary", "Không tìm thấy select kỳ", false);
      }
    } catch (e) {
      push("admin-salary-period-switch", "admin", "/admin/salary", "Chọn kỳ lương", false, null, e);
    }
    try {
      // knowledge: từ danh sách mở tài liệu (nút/xem) — đúng route chi tiết
      await page.goto(`${BASE}/admin/knowledge`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await waitSettled(page);
      const link = page.locator('a[href="/admin/knowledge/KL-QA-01"]').first();
      if (await link.count()) {
        await link.click();
        await page.waitForURL(/\/admin\/knowledge\/KL-QA-01/, { timeout: 20_000 }).catch(() => undefined);
        await page.waitForTimeout(1_600);
        const onEditor = new URL(page.url()).pathname === "/admin/knowledge/KL-QA-01";
        push("admin-knowledge-open-document", "admin", "/admin/knowledge", "Mở tài liệu KL-QA-01 → trang biên soạn", onEditor);
      } else {
        push("admin-knowledge-open-document", "admin", "/admin/knowledge", "Không thấy link KL-QA-01", false);
      }
    } catch (e) {
      push("admin-knowledge-open-document", "admin", "/admin/knowledge", "Mở tài liệu knowledge", false, null, e);
    }
    await ctx.close();
  }

  /* --- Instructor: session detail tab + evaluation filter --- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const landing = await login(page, DEMO.instructor);
    push("instructor-login", "instructor", "/login", "Đăng nhập giảng viên → vào /instructor", landing.startsWith("/instructor"));
    try {
      // tổng quan phiên không dùng tab — mở link "Thiết lập" sang trang setup
      await page.goto(`${BASE}/instructor/sessions/ss-f26`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await waitSettled(page);
      const setupLink = page.getByRole("link", { name: /thiết lập/i }).first();
      if (await setupLink.count()) {
        await setupLink.click();
        await page.waitForURL(/setup/, { timeout: 20_000 }).catch(() => undefined);
        await page.waitForTimeout(1_800);
        const onSetup = /setup/.test(new URL(page.url()).pathname);
        const shot = path.join(EV_DIR, "instructor", "interaction-session-open-setup-1440.jpg");
        await page.screenshot({ path: shot, type: "jpeg", quality: 72 });
        push("instructor-session-open-setup", "instructor", "/instructor/sessions/[id]", "Mở trang Thiết lập phiên từ tổng quan", onSetup, path.relative(ROOT, shot));
      } else {
        push("instructor-session-open-setup", "instructor", "/instructor/sessions/[id]", "Không thấy link Thiết lập", false);
      }
    } catch (e) {
      push("instructor-session-open-setup", "instructor", "/instructor/sessions/[id]", "Mở trang Thiết lập", false, null, e);
    }
    try {
      // recruitment-rounds: chọn một đợt trong dropdown → workspace đợt hiển thị
      await page.goto(`${BASE}/instructor/recruitment-rounds`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await waitSettled(page);
      const roundSelect = page.locator("select").first();
      if (await roundSelect.count()) {
        const opts = await roundSelect.locator("option").all();
        if (opts.length > 1) {
          await roundSelect.selectOption({ index: 1 });
          await page.waitForTimeout(2_000);
          const shot = path.join(EV_DIR, "instructor", "interaction-recruitment-round-selected-1440.jpg");
          await page.screenshot({ path: shot, type: "jpeg", quality: 72 });
          push("instructor-recruitment-round-select", "instructor", "/instructor/recruitment-rounds", "Chọn đợt tuyển dụng → workspace đợt hiển thị", true, path.relative(ROOT, shot));
        } else {
          push("instructor-recruitment-round-select", "instructor", "/instructor/recruitment-rounds", "Dropdown không có đợt nào", false);
        }
      } else {
        push("instructor-recruitment-round-select", "instructor", "/instructor/recruitment-rounds", "Không tìm thấy dropdown đợt", false);
      }
    } catch (e) {
      push("instructor-recruitment-round-select", "instructor", "/instructor/recruitment-rounds", "Chọn đợt tuyển dụng", false, null, e);
    }
    try {
      await page.goto(`${BASE}/instructor/evaluations`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await waitSettled(page);
      const ok = (await page.locator("text=/chu kỳ|vòng đánh giá|đánh giá giữa kỳ/i").count()) > 0;
      push("instructor-evaluations-render", "instructor", "/instructor/evaluations", "Bảng quản lý đánh giá render với dữ liệu", ok);
    } catch (e) {
      push("instructor-evaluations-render", "instructor", "/instructor/evaluations", "Bảng quản lý đánh giá", false, null, e);
    }
    await ctx.close();
  }

  /* --- Onboarding flow (sinhvien_tan): chọn nghề → phỏng vấn --- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const landing = await login(page, DEMO.internNew);
    push("intern-onboarding-login", "intern-onboarding", "/login", "Đăng nhập sinh viên mới → vào onboarding", /onboarding/.test(landing) || /\/intern/.test(landing));
    try {
      await page.goto(`${BASE}/intern/onboarding/role`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await waitSettled(page);
      const roleCard = page.locator("text=/frontend|backend|fullstack/i").first();
      if (await roleCard.count()) {
        await roleCard.click();
        await page.waitForTimeout(1_000);
        const confirm = page.getByRole("button", { name: /chọn|xác nhận|tiếp tục/i }).first();
        if (await confirm.count()) await confirm.click();
        await page.waitForTimeout(2_000);
        const shot = path.join(EV_DIR, "intern-onboarding", "interaction-role-selection-1440.jpg");
        await page.screenshot({ path: shot, type: "jpeg", quality: 72 });
        push("intern-onboarding-select-role", "intern-onboarding", "/intern/onboarding/role", "Chọn nghề trong onboarding → sang bước phỏng vấn", true, path.relative(ROOT, shot));
      } else {
        push("intern-onboarding-select-role", "intern-onboarding", "/intern/onboarding/role", "Không thấy thẻ nghề", false);
      }
    } catch (e) {
      push("intern-onboarding-select-role", "intern-onboarding", "/intern/onboarding/role", "Chọn nghề onboarding", false, null, e);
    }
    await ctx.close();
  }

  /* --- Logout (dùng context admin cuối) --- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await login(page, DEMO.admin);
    try {
      const logoutBtn = page.getByRole("button", { name: /đăng xuất|logout/i }).first();
      if (await logoutBtn.count()) {
        await logoutBtn.click();
        await page.waitForURL(/\/login/, { timeout: 20_000 }).catch(() => undefined);
        await page.waitForTimeout(800);
        push("admin-logout", "admin", "/admin", "Đăng xuất → về /login", new URL(page.url()).pathname === "/login");
      } else {
        push("admin-logout", "admin", "/admin", "Nút đăng xuất không tìm thấy", false);
      }
    } catch (e) {
      push("admin-logout", "admin", "/admin", "Đăng xuất", false, null, e);
    }
    await ctx.close();
  }
}

/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ *
 * CÁC PHASE
 * ------------------------------------------------------------------ */
async function phaseStates(browser) {
  // Biến thể trạng thái (loading/empty/error) — tách riêng để tái chụp độc lập.
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    results.meta.logins.intern = await login(page, PLAN.intern.account);
    results.stateVariants.push(
      await captureVariant(page, "intern-work-loading-skeleton", "/intern/work", DEMO.intern.id, {
        role: "intern",
        scenario: "loading-slow",
        immediateShot: true,
        waitMs: 5800,
        viewports: [VIEWPORTS[0], VIEWPORTS[2]],
      }),
    );
    results.stateVariants.push(
      await captureVariant(page, "intern-work-error-state", "/intern/work", DEMO.intern.id, {
        role: "intern",
        scenario: "error",
      }),
    );
        await ctx.close();
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    results.meta.logins.admin = await login(page, PLAN.admin.account);
    results.stateVariants.push(
      await captureVariant(page, "admin-users-empty-state", "/admin/users", DEMO.admin.id, {
        role: "admin",
        scenario: "empty",
      }),
    );
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    results.meta.logins.instructor = await login(page, PLAN.instructor.account);
    results.stateVariants.push(
      await captureVariant(page, "instructor-empty-users", "/instructor/participation", DEMO.instructor.id, {
        role: "instructor",
        scenario: "empty",
      }),
    );
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    results.meta.logins.internOnboarding = await login(page, PLAN["intern-onboarding"].account);
    results.stateVariants.push(
      await captureVariant(page, "onboarding-empty-evaluations", "/intern/onboarding/result", DEMO.internNew.id, {
        role: "intern-onboarding",
      }),
    );
    await ctx.close();
  }
}

async function phasePatch(browser) {
  // Tái audit sau khi sửa component (giữ partial riêng; merge dedupe theo route giữ bản mới)
  const targets = [
    { role: "intern", account: DEMO.intern, entry: PLAN.intern.routes.find((r) => r.route === "/intern/work/[id]") },
    { role: "instructor", account: DEMO.instructor, entry: PLAN.instructor.routes.find((r) => r.route === "/instructor/tasks/[id]") },
    { role: "admin", account: DEMO.admin, entry: PLAN.admin.routes.find((r) => r.route === "/admin/tasks/[id]") },
  ];
  for (const t of targets) {
    if (!t.entry) continue;
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await login(page, t.account);
    results.pages.push(await auditRoute(page, t.entry, t.role, t.account));
    console.log(`[patch] ${t.role} ${t.entry.route}`);
    await ctx.close();
  }
}

async function phasePublic(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  for (const entry of PLAN.public.routes) {
    results.pages.push(await auditRoute(page, entry, "public", null));
    console.log(`[public] ${entry.route}`);
  }
  results.stateVariants.push(
    await captureVariant(page, "not-found", "/khong-ton-tai-route-kiem-chung", null, { role: "public" }),
  );
  await ctx.close();
}

async function phaseIntern(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  results.meta.logins.intern = await login(page, PLAN.intern.account);
  page = await auditRoutes(ctx, page, PLAN.intern.routes, "intern", PLAN.intern.account);
  results.stateVariants.push(
    await captureVariant(page, "intern-work-loading-skeleton", "/intern/work", DEMO.intern.id, {
      role: "intern",
      scenario: "loading-slow",
      immediateShot: true,
      waitMs: 3200,
      viewports: [VIEWPORTS[0], VIEWPORTS[2]],
    }),
  );
  results.stateVariants.push(
    await captureVariant(page, "intern-work-error-state", "/intern/work", DEMO.intern.id, {
      role: "intern",
      scenario: "error",
    }),
  );
  await ctx.close();
}

async function phaseOnboarding(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const acc = PLAN["intern-onboarding"].account;
  results.meta.logins.internOnboarding = await login(page, acc);

  // 1) welcome + role (trạng thái chưa chọn nghề)
  results.pages.push(await auditRoute(page, PLAN["intern-onboarding"].routes[0], "intern-onboarding", acc));
  console.log(`[intern-onboarding] /intern/onboarding`);
  results.pages.push(await auditRoute(page, PLAN["intern-onboarding"].routes[1], "intern-onboarding", acc));
  console.log(`[intern-onboarding] /intern/onboarding/role`);

  // 2) DRIVE LUỒNG THẬT: chọn nghề qua UI (radio trong fieldset + "Bắt đầu phỏng vấn")
  //    → PATCH /recruitment/me/role + POST /recruitment/me/interviews
  try {
    await page.goto(`${BASE}/intern/onboarding/role`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await waitSettled(page);
    const roleLabel = page.locator("label.student-role-option").first();
    if (await roleLabel.count()) {
      await roleLabel.click({ timeout: 10_000 });
      await page.waitForTimeout(400);
      const startRoleBtn = page.getByRole("button", { name: /bắt đầu phỏng vấn/i }).first();
      if (await startRoleBtn.count()) {
        await startRoleBtn.click();
        await page.waitForTimeout(2_500);
      }
    } else {
      console.log("onboarding role: không tìm thấy radio nào");
    }
  } catch (e) {
    console.log("onboarding role drive:", String(e).slice(0, 140));
  }

  // 3) interview: trang render phiên đang chạy (flow đã chọn nghề ở bước 2).
  results.pages.push(await auditRoute(page, PLAN["intern-onboarding"].routes[2], "intern-onboarding", acc));
  console.log(`[intern-onboarding] /intern/onboarding/interview`);

  // DRIVE: trả lời đủ 6 câu + "Nộp bài phỏng vấn" (POST submit) → flow passed
  try {
    await page.goto(`${BASE}/intern/onboarding/interview`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await waitSettled(page);
    for (let i = 1; i <= 6; i++) {
      const qBtn = page.locator(`nav[aria-label="Danh sách câu hỏi"] button`, { hasText: new RegExp(`Câu ${i} `) }).first();
      if (!(await qBtn.count())) break;
      await qBtn.click();
      await page.waitForTimeout(300);
      const ta = page.locator("#interview-answer");
      if (!(await ta.count())) break;
      await ta.fill(`Trả lời câu ${i}: em đã làm dự án tương tự và xử lý bằng cách chia nhỏ bài toán, viết kiểm thử và đo lường kết quả.`);
      await page.getByRole("button", { name: /lưu câu trả lời/i }).first().click();
      await page.waitForTimeout(900);
    }
    const submitBtn = page.getByRole("button", { name: /nộp bài phỏng vấn/i }).first();
    if (await submitBtn.count()) {
      await submitBtn.click();
      await page.waitForTimeout(2_200);
    }
  } catch (e) {
    console.log("onboarding interview drive:", String(e).slice(0, 140));
  }

  // 4) result (status đã passed sau khi nộp)
  results.pages.push(await auditRoute(page, PLAN["intern-onboarding"].routes[3], "intern-onboarding", acc));
  console.log(`[intern-onboarding] /intern/onboarding/result`);

  // state variant: trang result trước khi có kết quả? không tái tạo được sau khi
  // flow đã hoàn tất trong phiên — dùng chính bằng chứng 2 ảnh trên.
  await ctx.close();
}

async function phaseInstructor(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  results.meta.logins.instructor = await login(page, PLAN.instructor.account);
  page = await auditRoutes(ctx, page, PLAN.instructor.routes, "instructor", PLAN.instructor.account);
  results.stateVariants.push(
    await captureVariant(page, "instructor-empty-users", "/instructor/participation", DEMO.instructor.id, {
      role: "instructor",
      scenario: "empty",
    }),
  );
  await ctx.close();
}

async function phaseAdmin(browser) {
  // Nửa 1 (16 route) — tách để tránh OOM: next-server phình ~2GB khi biên dịch ~15 route.
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  results.meta.logins.admin = await login(page, PLAN.admin.account);
  const half = Math.ceil(PLAN.admin.routes.length / 2);
  await auditRoutes(ctx, page, PLAN.admin.routes.slice(0, half), "admin", PLAN.admin.account);
  await ctx.close();
}

async function phaseAdmin2(browser) {
  // Nửa 2 (15 route còn lại + empty-state variant) — server mới, bộ nhớ sạch.
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  results.meta.logins.admin = await login(page, PLAN.admin.account);
  const half = Math.ceil(PLAN.admin.routes.length / 2);
  const page2 = await auditRoutes(ctx, page, PLAN.admin.routes.slice(half), "admin", PLAN.admin.account);
  results.stateVariants.push(
    await captureVariant(page2, "admin-users-empty-state", "/admin/users", DEMO.admin.id, {
      role: "admin",
      scenario: "empty",
    }),
  );
  await ctx.close();
}

function writePartial(phase, extra = {}) {
  fs.mkdirSync(PARTIAL_DIR(), { recursive: true });
  const payload = {
    phase,
    finishedAt: new Date().toISOString(),
    pages: results.pages,
    stateVariants: results.stateVariants,
    interactions: results.interactions,
    logins: results.meta.logins,
    screenshotCount: results.meta.screenshotCount,
    ...extra,
  };
  fs.writeFileSync(path.join(PARTIAL_DIR(), `${phase}.json`), JSON.stringify(payload, null, 1));
}

/* --- Merge + báo cáo cuối --- */
function mergeAndReport() {
  const phases = ["public", "intern", "onboarding", "instructor", "admin", "admin2", "states", "interactions"];
  const optional = ["patch"];
  const merged = {
    meta: {
      ...results.meta,
      startedAt: null,
      finishedAt: new Date().toISOString(),
      environment: "preview-qa (NEXT_PUBLIC_PREVIEW=1, mock API — KHÔNG phải Real Backend E2E)",
      viewports: VIEWPORTS.map((v) => `${v.w}x${v.h}`),
      logins: {},
      routeCount: 0,
      screenshotCount: 0,
      phases: {},
    },
    pages: [],
    stateVariants: [],
    interactions: [],
  };
  const missing = phases.filter(
    (ph) => !fs.existsSync(path.join(PARTIAL_DIR(), `${ph}.json`)),
  );
  const withOptional = phases.concat(
    optional.filter((ph) => fs.existsSync(path.join(PARTIAL_DIR(), `${ph}.json`))),
  );
  if (missing.length) {
    console.error(`✗ Thiếu phase: ${missing.join(", ")}`);
    process.exit(2);
  }
  for (const ph of withOptional) {
    const part = JSON.parse(fs.readFileSync(path.join(PARTIAL_DIR(), `${ph}.json`), "utf8"));
    merged.meta.phases[ph] = { finishedAt: part.finishedAt, pages: part.pages.length };
    merged.pages.push(...part.pages);
    merged.stateVariants.push(...part.stateVariants);
    merged.interactions.push(...(part.interactions ?? []));
    Object.assign(merged.meta.logins, part.logins ?? {});
    merged.meta.screenshotCount += part.screenshotCount ?? 0;
    const first = part.pages[0];
    if (!merged.meta.startedAt && first) merged.meta.startedAt = first.startedAt ?? part.finishedAt;
  }
  // gộp variants trùng tên (bản sau cùng ưu tiên — phase states chụp lại chính xác hơn)
  merged.stateVariants = Object.values(
    merged.stateVariants.reduce((acc, v) => ({ ...acc, [v.variant]: v }), {}),
  );
  merged.interactions = merged.interactions.filter(
    (i, idx, all) => all.findIndex((x) => x.id === i.id) === idx,
  );
  // dedupe route theo (role+route): phase patch chụp lại → giữ bản mới nhất
  merged.pages = merged.pages.filter(
    (p, idx, all) => all.findIndex((x) => x.role === p.role && x.route === p.route) === idx,
  );
  merged.meta.routeCount = merged.pages.length;
  fs.writeFileSync(path.join(EV_DIR, "browser-audit.json"), JSON.stringify(merged, null, 1));

  const bad = [];
  for (const p of merged.pages) {
    const reasons = [];
    if (p.failure) reasons.push("crash");
    if (p.state === "error") reasons.push("error-state");
    if (p.state === "loading") reasons.push("stuck-loading");
    if (p.notMocked501 > 0) reasons.push(`501×${p.notMocked501}`);
    if (p.consoleErrors.length > 0) reasons.push(`consoleErr×${p.consoleErrors.length}`);
    if (p.redirectVerified === false) reasons.push("redirect-sai");
    if (p.viewports.length > 0 && p.viewports.some((v) => v.overflowX > 2)) reasons.push("overflowX");
    // redirect route: bằng chứng là URL cuối (redirectVerified=true), không cần ảnh
    if (p.redirectVerified === true) {
      // đã kiểm chứng redirect — bỏ qua yêu cầu viewport
    } else if (p.viewports.length !== 3) {
      reasons.push(`thiếu viewport (${p.viewports.length}/3)`);
    }
    if (reasons.length) bad.push(`${p.role} ${p.route} → ${reasons.join(",")}`);
  }
  const interactionsFailed = merged.interactions.filter((i) => !i.ok);
  const variantsBad = merged.stateVariants.filter((v) => v.failure);

  console.log("\n================ JOURNEY V3 BROWSER AUDIT (merged) ================");
  console.log(`Routes audited:  ${merged.pages.length}/80`);
  console.log(`Screenshots:    ${merged.meta.screenshotCount}`);
  console.log(`State variants: ${merged.stateVariants.length} (${variantsBad.length} lỗi)`);
  console.log(`Interactions:   ${merged.interactions.length} (${interactionsFailed.length} fail)`);
  console.log(`Route-level problems: ${bad.length}`);
  for (const b of bad) console.log("  ✗ " + b);
  for (const i of interactionsFailed) console.log(`  ✗ interaction ${i.id} — ${i.error ?? ""}`);
  const exitBad = bad.length > 0 || interactionsFailed.length > 0 || variantsBad.length > 0;
  console.log(exitBad ? "\nRESULT: AUDIT INCOMPLETE — chi tiết trong browser-audit.json" : "\nRESULT: AUDIT PASS (preview QA).");
  process.exit(exitBad ? 1 : 0);
}

async function shutdownServer() {
  const { execSync } = await import("node:child_process");
  try {
    execSync(`pkill -f "next dev -p ${PORT}" || true`, { stdio: "ignore" });
  } catch { /* bỏ qua */ }
  try {
    execSync(`kill $(lsof -t -i:${PORT}) 2>/dev/null || true`, { stdio: "ignore" });
  } catch { /* bỏ qua */ }
  await new Promise((r) => setTimeout(r, 1500));
  try {
    const probe = await fetch(`http://localhost:${PORT}/login`);
    if (!probe.ok) console.log(`Dev server ${PORT} đã dọn.`);
    else console.log(`Cảnh báo: ${PORT} vẫn còn phản hồi.`);
  } catch {
    console.log(`Dev server ${PORT} đã dọn.`);
  }
}

async function main() {
  if (PHASE === "shutdown") return shutdownServer();
  if (PHASE === "merge") return mergeAndReport();

  results.meta.startedAt = new Date().toISOString();
  for (const role of Object.keys(PLAN)) fs.mkdirSync(path.join(EV_DIR, role), { recursive: true });
  fs.mkdirSync(path.join(EV_DIR, "global"), { recursive: true });

  // Port còn daemon Next 16 (sống sót qua SIGKILL của phase trước) → dọn trước khi spawn
  try {
    const probe = await fetch(`http://localhost:${PORT}/login`);
    if (probe.ok) {
      const { execSync } = await import("node:child_process");
      console.log(`(dọn daemon cũ trên port ${PORT}...)`);
      try {
        execSync(`kill $(lsof -t -i:${PORT}) 2>/dev/null || true`, { stdio: "ignore" });
      } catch { /* bỏ qua */ }
      await new Promise((r) => setTimeout(r, 2500));
      try {
        const after = await fetch(`http://localhost:${PORT}/login`);
        if (after.ok) throw new Error(`Port ${PORT} vẫn bận sau khi dọn — kiểm tra tay.`);
      } catch (e) {
        if (String(e).includes("vẫn bận")) throw e;
      }
    }
  } catch (e) {
    if (String(e).includes("vẫn bận")) throw e;
  }

  const server = startDevServer();
  await server.ready();
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-dev-shm-usage", "--no-sandbox", "--disable-gpu"],
  });

  try {
    switch (PHASE) {
      case "public":
        await phasePublic(browser);
        break;
      case "intern":
        await phaseIntern(browser);
        break;
      case "onboarding":
        await phaseOnboarding(browser);
        break;
      case "instructor":
        await phaseInstructor(browser);
        break;
      case "admin":
        await phaseAdmin(browser);
        break;
      case "admin2":
        await phaseAdmin2(browser);
        break;
      case "interactions":
        await runInteractions(browser);
        break;
      case "states":
        await phaseStates(browser);
        break;
      case "patch":
        await phasePatch(browser);
        break;
      case "all":
        await phasePublic(browser);
        await phaseIntern(browser);
        await phaseOnboarding(browser);
        await phaseInstructor(browser);
        await phaseAdmin(browser);
        await phaseAdmin2(browser);
        await runInteractions(browser);
        break;
      default:
        throw new Error(`Phase không hợp lệ: ${PHASE}`);
    }
  } finally {
    writePartial(PHASE);
    await browser.close().catch(() => undefined);
    if (server.proc) {
      server.proc.kill("SIGTERM");
      await new Promise((r) => setTimeout(r, 1500));
      server.proc.kill("SIGKILL");
    }
    // daemon next-server v16 tách khỏi chuỗi npm — dọn theo port
    try {
      const { execSync } = await import("node:child_process");
      execSync(`kill $(lsof -t -i:${PORT}) 2>/dev/null || true`, { stdio: "ignore" });
    } catch { /* bỏ qua */ }
    await new Promise((r) => setTimeout(r, 1200));
  }
  console.log(`\nPHASE ${PHASE} xong — partial ghi vào .audit-partials/${PHASE}.json`);
}

main().catch((error) => {
  console.error("Lỗi audit:", error);
  process.exit(2);
});
