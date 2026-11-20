#!/usr/bin/env node
/**
 * JOURNEY V3 — AUTOMATED COVERAGE GATE (master prompt §10)
 *
 * 1. Quét danh sách route từ source thật (mọi src/app/…/page.tsx, bỏ route group).
 * 2. Đọc coverage manifest độc lập: docs/journey-v3-evidence/coverage-manifest.json
 *    (mapping route → component → evidence → trạng thái nghiệm thu).
 * 3. So sánh route thực tế ↔ route đã kiểm kê (phát hiện bỏ sót / khai báo thừa).
 * 4. Kiểm tra từng route có trạng thái UI nghiệm thu hợp lệ.
 * 5. Kiểm tra sự tồn tại của evidence bắt buộc trên đĩa.
 * 6. Phát hiện PARTIAL / BLOCKED / NOT-STARTED (kể cả khai báo dạng biến thể).
 * 7. In báo cáo thống kê; exit code khác 0 khi chưa đạt nghiệm thu.
 *
 * Lưu ý: cổng này xác nhận đầy đủ metadata/evidence — KHÔNG thay thế visual review
 * và test thực tế (kết hợp vitest + browser audit đã chạy song song).
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = join(ROOT, "docs", "journey-v3-evidence", "coverage-manifest.json");

const OK = new Set(["DONE", "ALREADY-COMPLIANT"]);
const NON_BLOCKING = new Set([...OK, "REDIRECT"]);

function scanRoutes() {
  const routes = new Set();
  const appDir = join(ROOT, "src", "app");
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const st = statSync(full);
      if (st.isDirectory()) walk(full);
      else if (entry === "page.tsx") {
        const rel = relative(appDir, dirname(full));
        const parts = rel.split("/").filter((p) => !(p.startsWith("(") && p.endsWith(")")));
        routes.add(parts.length ? "/" + parts.join("/") : "/");
      }
    }
  };
  walk(appDir);
  return [...routes].sort();
}

if (!existsSync(MANIFEST)) {
  console.error("✗ Thiếu coverage manifest:", relative(ROOT, MANIFEST));
  process.exit(2);
}
const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const entries = manifest.routes ?? [];
const globalEntries = manifest.globals ?? [];

const actual = scanRoutes();
const declared = entries.map((e) => e.route);

const missing = actual.filter((r) => !declared.includes(r));       // route thật chưa kiểm kê
const extra = declared.filter((r) => !actual.includes(r));         // khai báo thừa/ sai

const badStatus = entries.filter((e) => !NON_BLOCKING.has(e.status));
const partial = entries.filter((e) => /partial/i.test(e.status) || /not[- ]?started/i.test(e.status) || /blocked/i.test(e.status));
const evMissing = [];
for (const e of entries) {
  if (e.status === "REDIRECT") continue;
  for (const p of e.evidence ?? []) {
    if (!existsSync(join(ROOT, p))) evMissing.push(`${e.route} → ${p}`);
  }
}
const globalsBad = globalEntries.filter((g) => !OK.has(g.status));

const groupStats = {};
for (const e of entries) {
  const g = e.group || "?";
  groupStats[g] ??= { total: 0, done: 0 };
  groupStats[g].total += 1;
  if (OK.has(e.status)) groupStats[g].done += 1;
}

const total = entries.length;
const done = entries.filter((e) => OK.has(e.status)).length;
const redirects = entries.filter((e) => e.status === "REDIRECT").length;
const acceptance = total ? Math.round(((done + redirects) / total) * 100) : 0;

console.log("JOURNEY V3 — COVERAGE VERIFICATION");
console.log("==================================");
console.log(`Total routes discovered (source scan): ${actual.length}`);
console.log(`Total routes in manifest:              ${total}`);
console.log(`Routes visually compliant (DONE/COMPLIANT): ${done}`);
console.log(`Redirect-only routes:                 ${redirects}`);
console.log(`Routes with browser evidence:         ${entries.filter((e) => (e.evidence ?? []).length > 0).length}`);
console.log(`Global states compliant:               ${globalEntries.length - globalsBad.length}/${globalEntries.length}`);
console.log(`Overall acceptance:                    ${acceptance}%`);
console.log("");
for (const [g, s] of Object.entries(groupStats)) {
  console.log(`  ${g.padEnd(12)} ${s.done}/${s.total} compliant`);
}
console.log("");
let fail = 0;
const report = (label, list) => {
  if (!list.length) return console.log(`✓ ${label}: 0`);
  fail += 1;
  console.error(`✗ ${label}: ${list.length}`);
  for (const x of list.slice(0, 30)) console.error(`    - ${typeof x === "string" ? x : x.route + " (" + x.status + ")"}`);
};
report("Route bỏ sót (chưa kiểm kê)", missing);
report("Route khai báo thừa (không tồn tại trong source)", extra);
report("Route PARTIAL / NOT-STARTED / BLOCKED", [...partial, ...badStatus]);
report("Evidence thiếu (file không tồn tại)", evMissing);
report("Global states chưa compliant", globalsBad.map((g) => g.file));

console.log("");
if (fail > 0) {
  console.error(`RESULT: INCOMPLETE — ${fail} nhóm kiểm tra fail. Exit 1.`);
  process.exit(1);
}
console.log("RESULT: PASS — 100% route được kiểm kê, chuyển thể hoặc chứng minh compliant, evidence đầy đủ.");
process.exit(0);
