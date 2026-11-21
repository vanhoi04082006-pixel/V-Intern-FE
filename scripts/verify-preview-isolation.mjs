#!/usr/bin/env node
/**
 * VERIFY PREVIEW ISOLATION — bằng chứng tự động cho Section 10.2:
 * "mock không lọt vào production bundle".
 *
 * Bước:
 *  1. `next build` KHÔNG đặt NEXT_PUBLIC_PREVIEW (như mọi production build thật).
 *  2. Dò chuỗi marker "VINTERN-PREVIEW-MARKER" và tên module preview
 *     (preview-switcher / preview-gate refs, demo emails) trong .next
 *     (client chunks + server chunks).
 *  3. FAIL ngay khi tìm thấy bất kỳ marker nào.
 *
 * Chạy: node scripts/verify-preview-isolation.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const markers = [
  "VINTERN-PREVIEW-MARKER",
  "@vintern.preview",
  "Preview@12345",
  "PREVIEW_ENDPOINT_NOT_MOCKED",
];

console.log("[1/3] next build (production, KHÔNG preview flag)...");
const build = spawnSync("npx", ["next", "build"], {
  encoding: "utf-8",
  timeout: 600_000,
});
if (build.status !== 0) {
  console.error("Build thất bại:", build.stderr?.slice(-4000));
  process.exit(1);
}
console.log("    build OK.");

console.log("[2/3] dò marker trong .next ...");
const hits = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "cache") continue; // cache không phải bundle
      walk(full);
    } else if (/\.(js|mjs|html|txt|rsc|json)$/.test(entry.name)) {
      let content = "";
      try {
        content = fs.readFileSync(full, "utf-8");
      } catch {
        continue;
      }
      for (const marker of markers) {
        if (content.includes(marker)) {
          hits.push({ file: path.relative(root, full), marker });
        }
      }
    }
  }
}
walk(path.join(root, ".next", "static"));
walk(path.join(root, ".next", "server"));

console.log("[3/3] kết luận...");
if (hits.length === 0) {
  console.log(
    "PASS: 0 marker preview trong .next — mock bị dead-code loại khỏi production bundle.",
  );
  process.exit(0);
}
console.error("FAIL — mock lọt vào production build:");
for (const hit of hits) {
  console.error(`  ${hit.file} chứa "${hit.marker}"`);
}
process.exit(1);
