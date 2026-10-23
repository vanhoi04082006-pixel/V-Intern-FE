/** Exact UAT finance and UTC boundary trace: SQL = Nest = rendered browser. */
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { chromium } from "@playwright/test";
const be = path.resolve(process.env.LIVE_BE_ROOT || "../V-INTERN-BE"), req = createRequire(path.join(be, "package.json"));
req("dotenv").config({ path: path.join(be, ".env.local"), quiet: true });
if (process.env.NODE_ENV !== "test" || !process.env.DB_NAME?.startsWith("VIntern_Phase715_")) throw Error("Disposable test environment required");
const f = JSON.parse(fs.readFileSync("../phase7-local/uat-finance.json", "utf8"));
const ds = req(path.join(be, "dist/database/data-source.js")).default; await ds.initialize();
const browser = await chromium.launch({ channel: "chrome", headless: true }), context = await browser.newContext({ viewport: { width: 1440, height: 900 } }), page = await context.newPage();
const api = "http://localhost:8080/api/v1", base = "http://localhost:3001", results = [], network = [], cache = new Map();
fs.mkdirSync("phase7-evidence/final", { recursive: true });
page.on("response", r => { if (r.url().startsWith(api)) network.push({ source: "browser", url: r.url().split("?")[0], method: r.request().method(), status: r.status() }); });
async function token(role) {
  const c = cache.get(role); if (c && Date.now() - c.time < 8000) return c.token;
  const r = await fetch(api + "/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: role === "intern" ? f.email : "admin@phase715.test", password: process.env.LIVE_PASSWORD }) });
  assert.equal(r.status, 200); const value = (await r.json()).accessToken; cache.set(role, { token: value, time: Date.now() }); return value;
}
async function call(role, endpoint, method = "GET", body, expected = 200) {
  const r = await fetch(api + endpoint, { method, headers: { authorization: "Bearer " + await token(role), ...(body !== undefined ? { "content-type": "application/json" } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  network.push({ source: "real-api", url: api + endpoint.split("?")[0], method, status: r.status });
  const data = await r.json(); assert.equal(r.status, expected, endpoint + " " + data?.code); return data;
}
async function balance(expected) {
  const sql = await ds.query("SELECT SUM(amount) AS balance FROM virtual_salary_ledger WHERE userId=@0", [f.userId]);
  const value = await call("intern", "/intern/me/virtual-salary");
  assert.equal(Number(sql[0].balance), expected); assert.equal(Number(value.balance), expected);
  await page.goto(base + "/intern/virtual-salary"); await page.getByText(new RegExp("^" + expected.toLocaleString("vi-VN").replaceAll(".", "\\.") + "\\s*đồng\\s*ảo$")).first().waitFor();
  await page.reload(); await page.getByText(new RegExp("^" + expected.toLocaleString("vi-VN").replaceAll(".", "\\.") + "\\s*đồng\\s*ảo$")).first().waitFor();
  await page.screenshot({ path: "phase7-evidence/final/uat-salary-" + expected + ".png", fullPage: true });
  return { sql: Number(sql[0].balance), nest: Number(value.balance), rendered: expected.toLocaleString("vi-VN") };
}
try {
  await page.goto(base + "/login"); await page.getByLabel("Email", { exact: true }).fill(f.email); await page.getByLabel("Mật khẩu", { exact: true }).fill(process.env.LIVE_PASSWORD);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click(); await page.waitForURL("**/intern");
  const kpi = await call("intern", "/intern/me/kpi/" + f.kpiResultId);
  const sqlKpi = await ds.query("SELECT finalScore FROM kpi_results WHERE id=@0", [f.kpiResultId]);
  assert.equal(Number(sqlKpi[0].finalScore), 83.8);
  await page.goto(base + "/intern/kpi/" + f.kpiResultId); await page.getByRole("heading", { name: "Kết quả KPI", exact: true }).waitFor();
  await page.locator(".student-score").filter({ hasText: "Điểm KPI" }).getByText("83.8", { exact: true }).waitFor();
  assert.equal(Number(kpi.result?.finalScore ?? kpi.finalScore), 83.8);
  results.push({ name: "KPI exact renormalization SQL/API/FE", status: "PASS", delivery: 80, quality: 90, timeliness: null, finalScore: 83.8 });
  const trace = [await balance(8380000)];
  const bonus = await call("admin", "/virtual-salary/adjustments", "POST", { userId: f.userId, type: "bonus", amount: 500000, reason: "UAT controlled bonus" }, 201);
  await call("admin", "/virtual-salary/adjustments", "POST", { userId: f.userId, type: "penalty", amount: 200000, reason: "UAT controlled penalty" }, 201);
  trace.push(await balance(8680000));
  await call("admin", "/virtual-salary/adjustments", "POST", { userId: f.userId, type: "reversal", sourceId: bonus.id, reason: "UAT controlled reversal" }, 201);
  trace.push(await balance(8180000));
  await call("admin", "/virtual-salary/adjustments", "POST", { userId: f.userId, type: "reversal", sourceId: bonus.id, reason: "UAT duplicate reversal" }, 409);
  results.push({ name: "Salary bonus/penalty/reversal SQL/API/FE and reload", status: "PASS", trace });
  await Promise.all([call("admin", "/virtual-salary/generate/" + f.periodId, "POST", undefined, 201), call("admin", "/virtual-salary/generate/" + f.periodId, "POST", undefined, 201)]);
  const earning = await ds.query("SELECT COUNT(*) AS n FROM virtual_salary_ledger WHERE userId=@0 AND kpiPeriodId=@1 AND type='kpi_earning'", [f.userId, f.periodId]);
  assert.equal(Number(earning[0].n), 1); results.push({ name: "Concurrent salary regeneration has one earning", status: "PASS", earningRows: 1 });
  const task = (await ds.query("SELECT t.createdAt, (SELECT MIN(h.createdAt) FROM task_status_histories h WHERE h.taskId=t.id AND h.toStatus='done') AS completedAt FROM tasks t WHERE t.id=@0", [f.taskId]))[0];
  const t = task.createdAt.getTime();
  const include = await call("intern", "/intern/me/performance?from=" + encodeURIComponent(new Date(t).toISOString()) + "&to=" + encodeURIComponent(new Date(t + 1).toISOString()));
  const exclude = await call("intern", "/intern/me/performance?from=" + encodeURIComponent(new Date(t - 1).toISOString()) + "&to=" + encodeURIComponent(new Date(t).toISOString()));
  assert.equal(include.metrics.totalTaskCount, 1); assert.equal(exclude.metrics.totalTaskCount, 0);
  assert.ok(task.completedAt >= task.createdAt && task.completedAt.getTime() <= Date.now() + 10000);
  results.push({ name: "UTC exact from-inclusive/to-exclusive task-createdAt boundary", status: "PASS", taskCreatedAt: task.createdAt.toISOString(), completedAt: task.completedAt.toISOString(), included: 1, excluded: 0 });
} catch (error) { results.push({ name: "finance UAT", status: "FAIL", error: String(error) }); }
finally { await browser.close(); await ds.destroy(); fs.writeFileSync("phase7-evidence/final/uat-finance-live-results.json", JSON.stringify({ results, network }, null, 2)); }
console.log(JSON.stringify(results, null, 2)); if (results.some(r => r.status !== "PASS")) process.exitCode = 1;
