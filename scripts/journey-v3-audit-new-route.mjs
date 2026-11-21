#!/usr/bin/env node
/**
 * JOURNEY V3 — Mini browser audit cho route MỚI /admin/evaluations
 * (Master prompt V6 Phase E/P1 — route mới cho capability BE spec 14).
 *
 * Tại sao file riêng: sandbox giết tiến trình nền giữa các lần gọi công cụ,
 * nên phase=admin đầy đủ (~30 route) không chạy trọn trong một tool call.
 * Script này audit ĐÚNG route mới theo cùng semantics của
 * journey-v3-browser-audit.mjs (login preview admin → 3 viewport 1440/768/
 * 390 → chụp ảnh đúng slug → probe classify loaded/empty/error → ghi vào
 * browser-audit.json). KHÔNG đụng các entry route khác.
 *
 * Chạy: node scripts/journey-v3-audit-new-route.mjs
 * (tự spawn `next dev -p 3120` NEXT_PUBLIC_PREVIEW=1; exit ≠ 0 nếu route lỗi.)
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = process.env.AUDIT_PORT ?? "3120";
const BASE = `http://localhost:${PORT}`;
const EV_DIR = path.join(ROOT, "docs", "journey-v3-evidence");
const VIEWPORTS = [
  { w: 1440, h: 900, tag: "1440" },
  { w: 768, h: 1024, tag: "768" },
  { w: 390, h: 844, tag: "390" },
];
const DEMO_ADMIN = { email: "admin@vintern.preview", password: "Preview@12345" };
const ENTRY = { route: "/admin/evaluations", url: "/admin/evaluations", slug: "evaluations" };
const CONSOLE_NOISE = [
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
  /Manifest:/i,
  /webpack\/hot\/log/i,
  /GL Driver Message/i,
  /\[HMR\]/i,
  /\[next-dev\]/i,
];

function startDevServer() {
  const proc = spawn("npx", ["next", "dev", "-p", PORT], {
    cwd: ROOT,
    env: { ...process.env, NEXT_PUBLIC_PREVIEW: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  proc.stdout.on("data", (d) => (output += d.toString()));
  proc.stderr.on("data", (d) => (output += d.toString()));
  const cleanup = () => { try { proc.kill("SIGTERM"); } catch { /* đã chết */ } };
  process.on("SIGTERM", cleanup);
  process.on("SIGINT", cleanup);
  process.on("exit", cleanup);
  return {
    proc,
    ready: async () => {
      for (let i = 0; i < 200; i++) {
        try {
          const res = await fetch(`${BASE}/login`);
          if (res.ok) return output;
        } catch { /* chưa sẵn sàng */ }
        await new Promise((r) => setTimeout(r, 1000));
      }
      proc.kill("SIGTERM");
      throw new Error(`Dev server không sẵn sàng sau 200s.\n${output.slice(-2000)}`);
    },
  };
}

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

async function stableFill(page, selector, value) {
  await page.locator(selector).waitFor({ timeout: 30_000 });
  await page.locator(selector).fill(value);
}

async function login(page, credentials) {
  await page.goto(`${BASE}/login`, { waitUntil: "load", timeout: 90_000 });
  await stableFill(page, "#login-identifier", credentials.email);
  await stableFill(page, "#login-password", credentials.password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).first().click();
  await page.waitForURL(/\/(admin|instructor|intern)/, { timeout: 90_000 });
  await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => undefined);
  await page.waitForTimeout(600);
}

const record = {
  route: ENTRY.route,
  slug: ENTRY.slug,
  role: "admin",
  account: DEMO_ADMIN.email,
  url: ENTRY.url,
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

const server = startDevServer();
await server.ready();
const browser = await chromium.launch({ headless: true, args: ["--disable-dev-shm-usage", "--no-sandbox", "--disable-gpu"] });
let exitCode = 0;
try {
  const page = await browser.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (CONSOLE_NOISE.some((re) => re.test(text))) return;
      record.consoleErrors.push(text.slice(0, 240));
    }
  });
  page.on("pageerror", (err) => record.consoleErrors.push(`pageerror: ${err.message.slice(0, 240)}`));
  page.on("response", (res) => {
    if (res.status() === 501) record.notMocked501 += 1;
    if (res.status() >= 500) record.http5xx += 1;
  });
  await login(page, DEMO_ADMIN);
  await page.setViewportSize({ width: VIEWPORTS[0].w, height: VIEWPORTS[0].h });
  await page.goto(BASE + ENTRY.url, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await waitSettled(page);
  record.finalUrl = new URL(page.url()).pathname;
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await page.waitForTimeout(420);
    const probe = await probeState(page);
    const file = path.join(EV_DIR, "admin", `${ENTRY.slug}-${vp.tag}.jpg`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await page.screenshot({ path: file, type: "jpeg", quality: 72 });
    record.shots.push(path.relative(ROOT, file));
    record.viewports.push({
      viewport: `${vp.w}x${vp.h}`,
      file: path.relative(ROOT, file),
      overflowX: probe.overflowX,
    });
  }
  await page.setViewportSize({ width: VIEWPORTS[0].w, height: VIEWPORTS[0].h });
  await page.waitForTimeout(250);
  record.probe = await probeState(page);
  record.state = classify(record.probe);
  if (record.failure || record.consoleErrors.length || record.notMocked501 || record.state === "crash") {
    exitCode = 1;
  }
  console.log(`[admin] ${ENTRY.route} → state=${record.state}, 501=${record.notMocked501}, consoleErrors=${record.consoleErrors.length}, probe=${JSON.stringify(record.probe)}`);
} catch (error) {
  record.failure = String(error).slice(0, 300);
  record.state = "crash";
  exitCode = 1;
  console.error("Audit thất bại:", record.failure);
} finally {
  await browser.close().catch(() => undefined);
}

/* Gộp vào browser-audit.json: thay/append đúng entry route, giữ mọi entry cũ. */
const auditPath = path.join(EV_DIR, "browser-audit.json");
const audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));
const previous = audit.pages.findIndex((p) => p.route === ENTRY.route);
if (previous >= 0) audit.pages[previous] = record;
else audit.pages.push(record);
audit.pages.sort((a, b) => a.route.localeCompare(b.route));
audit.meta.routeCount = audit.pages.length;
audit.meta.finishedAt = new Date().toISOString();
fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2) + "\n");
console.log(`Đã ghi browser-audit.json: ${audit.pages.length} route (thêm ${ENTRY.route}).`);

server.proc.kill("SIGTERM");
process.exit(exitCode);
