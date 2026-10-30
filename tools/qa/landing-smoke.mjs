/**
 * Smoke kiểm chứng hydration + tương tác trên landing — chạy được cho mọi
 * nhánh đang dev. Phát hiện lớp lỗi mà visual-check/a11y không thấy: trang
 * SSR đẹp nhưng React không hydrate (nút/đổi theme/form chết).
 *
 * Dùng cùng playwright-core + chromium như harness tools/qa. Tự spawn next
 * dev và dọn server khi xong.
 *
 * LƯU Ý MÔI TRƯỜNG (quan trọng): phải vào bằng `http://localhost:<port>`,
 * KHÔNG dùng 127.0.0.1 — Next 16 dev chặn cross-origin dev-resource
 * (_next/hmr…) khi origin khác host server tự xưng danh → trang không
 * hydrate, mọi test tương tác fail âm thầm.
 *
 * Chạy: node tools/qa/landing-smoke.mjs   (hoặc BASE_URL=http://localhost:3016)
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const port = Number(process.env.PORT ?? 3018);
/* Phải là `localhost` — xem comment đầu file. */
const baseURL = process.env.BASE_URL ?? `http://localhost:${port}`;

const CHROMIUM_CANDIDATES = [
  process.env.QA_CHROME_PATH,
  "/home/z/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome",
  "/home/z/.cache/ms-playwright/chromium_headless_shell-1200/chrome-headless-shell-linux64/chrome-headless-shell",
].filter(Boolean);
const executablePath = CHROMIUM_CANDIDATES.find((candidate) => existsSync(candidate));

const external = Boolean(process.env.BASE_URL);
const server = external
  ? null
  : spawn(
      process.execPath,
      [path.join(repoRoot, "node_modules", "next", "dist", "bin", "next"), "dev", "-p", String(port)],
      {
        cwd: repoRoot,
        env: { ...process.env, NEXT_PUBLIC_API_BASE_URL: "http://qa-be.internal/api/v1" },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
let serverLog = "";
if (server) {
  server.stdout.on("data", (d) => (serverLog += d.toString()));
  server.stderr.on("data", (d) => (serverLog += d.toString()));
}

async function waitForServer(url, timeoutMs = 120000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status >= 400) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

const { chromium } = await import("playwright-core");
const browser = await chromium.launch({ executablePath });
const results = [];
const fail = (name, detail) => results.push(`❌ ${name}: ${detail}`);
const pass = (name) => results.push(`✓ ${name}`);

try {
  if (server && !(await waitForServer(`${baseURL}/`))) {
    console.error("Server không khởi động được:\n" + serverLog.slice(-2000));
    process.exit(1);
  }
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const consoleErrors = [];
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
  page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));

  await page.goto(`${baseURL}/`, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(2500);

  // 1) Theme toggle: click radio "Chủ đề Tối" -> .dark trên <html>
  await page.click('[aria-label="Chủ đề Tối"]');
  await page.waitForTimeout(600);
  const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
  const storedTheme = await page.evaluate(() => localStorage.getItem("vintern-theme"));
  if (isDark && storedTheme === "dark") pass("theme toggle hydrate + apply dark");
  else fail("theme toggle", `dark=${isDark}, stored=${storedTheme}`);

  // 2) Newsletter: email sai -> thông báo lỗi hiển thị (form handler chạy)
  await page.fill("#footer-newsletter-email", "khong-hop-le");
  await page.click('button:has-text("Đăng ký")');
  await page.waitForTimeout(500);
  const feedback = await page.textContent("#footer-newsletter-feedback");
  if (feedback && feedback.includes("hợp lệ")) pass("newsletter form handler chạy");
  else fail("newsletter", `feedback="${feedback ?? ""}"`);

  // 3) Focusable đầu tiên (skip link hoặc logo) — keyboard không chết
  await page.keyboard.press("Tab");
  const firstFocus = await page.evaluate(() => document.activeElement?.textContent?.trim());
  if (firstFocus && firstFocus.length > 0) pass(`tab đầu tiên:focusable ("${firstFocus.slice(0, 40)}")`);
  else fail("tab focus", "không có focusable đầu tiên");

  // 4) Băng dính + sticky note + mộc xuất hiện trên landing
  const tapeCount = await page.evaluate(() => document.querySelectorAll(".tape").length);
  if (tapeCount >= 3) pass(`tape x${tapeCount}`);
  else fail("tape", `count=${tapeCount}`);

  const stickyCount = await page.evaluate(() => document.querySelectorAll(".sticky-note").length);
  if (stickyCount >= 1) pass(`sticky-note x${stickyCount}`);
  else fail("sticky-note", `count=${stickyCount}`);

  const stampCount = await page.evaluate(() => document.querySelectorAll(".stamp-moc").length);
  if (stampCount >= 1) pass(`stamp-moc x${stampCount}`);
  else fail("stamp-moc", `count=${stampCount}`);

  // 5) Bộ icon notebook render (svg nét)
  const iconCount = await page.evaluate(() => document.querySelectorAll("svg[stroke-width]").length);
  if (iconCount > 20) pass(`svg icon render x${iconCount}`);
  else fail("icons", `count=${iconCount}`);

  if (consoleErrors.length) fail("console errors", consoleErrors.slice(0, 3).join(" | ").slice(0, 300));
  else pass("0 console error");
} finally {
  await browser.close();
  if (server) server.kill("SIGTERM");
}

console.log("\n=== LANDING INTERACTIVITY SMOKE ===");
for (const line of results) console.log(line);
const failed = results.some((r) => r.startsWith("❌"));
process.exit(failed ? 1 : 0);
