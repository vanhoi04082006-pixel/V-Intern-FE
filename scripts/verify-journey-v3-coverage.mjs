#!/usr/bin/env node
/**
 * JOURNEY V3 — COVERAGE GATE v2 (FINAL ACCEPTANCE)
 *
 * Nghiêm ngặt theo 10 yêu cầu của FINAL ACCEPTANCE AUDIT:
 *  1. Route thực tế (quét src/app) đối chiếu manifest — bỏ sót/thừa đều fail.
 *  2. Ảnh phải thuộc ĐÚNG route (slug từ route + ID động; resolvedRoute khớp).
 *  3. Đúng role truy cập (auditedAs ∈ access; tài khoản demo của role đó).
 *  4. Đủ 3 viewport 390/768/1440 cho mọi route có UI (redirect thì không).
 *  5. Route động phải dùng ID hợp lệ (resolvedRoute có ID thật, không placeholder).
 *  6. Không mượn ảnh route khác (một file chỉ thuộc 1 route; slug khớp prefix).
 *  7. Không chấp nhận evidence trống cho trạng thái kiểm thử được —
 *     loading/empty/error phải có bằng chứng riêng (stateVariants + globals).
 *  8. Bản ghi browser verification đầy đủ (URL cuối, viewport, console error,
 *     501, trạng thái dữ liệu, role) cho mọi route.
 *  9. Có kết quả tương tác nghiệp vụ (đủ số lượng, pass toàn bộ).
 * 10. Manifest không thể tự nhận DONE khi thiếu bằng chứng (DONE nhưng thiếu
 *     mục nào ở 1–9 → fail).
 *
 * Ngoại lệ (EXEMPT-*): bắt buộc có justification + bằng chứng kỹ thuật +
 * trạng thái riêng — không tính PASS; nếu thiếu justification → fail.
 *
 * Exit code: 0 khi tất cả đạt; ≠ 0 khi CHƯA đủ nghiệm thu.
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const EV = join(ROOT, "docs", "journey-v3-evidence");
const MANIFEST = join(EV, "coverage-manifest.json");
const BROWSER_AUDIT = join(EV, "browser-audit.json");

const REQUIRED_VIEWPORTS = ["1440x900", "768x1024", "390x844"];
const EXEMPT = new Set(["EXEMPT-REASONED", "EXEMPT-NO-UI"]);

let failures = 0;
const fail = (group, msg) => {
  failures += 1;
  console.error(`✗ [${group}] ${msg}`);
};

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
const globals = manifest.globals ?? [];
const auditExists = existsSync(BROWSER_AUDIT);
const audit = auditExists ? JSON.parse(readFileSync(BROWSER_AUDIT, "utf8")) : null;
const auditByRoute = audit ? new Map((audit.pages ?? []).map((p) => [p.route, p])) : new Map();
const interactions = audit ? (audit.interactions ?? []) : [];

/* ---------- 1. route thực tế vs manifest ---------- */
const actual = scanRoutes();
const declared = entries.map((e) => e.route);
const missing = actual.filter((r) => !declared.includes(r));
const extra = declared.filter((r) => !actual.includes(r));
if (missing.length) fail("1.route", `route thật chưa kiểm kê: ${missing.join(", ")}`);
if (extra.length) fail("1.route", `route khai báo thừa (không tồn tại): ${extra.join(", ")}`);

/* ---------- per-route checks ---------- */
const fileOwner = new Map(); // file → route (yêu cầu 6: không mượn ảnh)
let routesDone = 0,
  routesRedirect = 0,
  routesBad = 0;

for (const e of entries) {
  const isRedirect = Boolean(e.redirect?.verified);
  const tag = `${e.route}`;

  /* 10. DONE phải có bằng chứng thật */
  if (e.status === "DONE" && !isRedirect) {
    if (!Array.isArray(e.evidence) || e.evidence.length === 0) {
      fail("10.done", `${tag}: DONE nhưng không có evidence nào`);
    }
    if (!e.browser) {
      fail("10.done", `${tag}: DONE nhưng thiếu bản ghi browser verification`);
    }
    if (!e.role?.auditedAs) {
      fail("10.done", `${tag}: DONE nhưng không rõ role đã audit`);
    }
  }

  /* 2+3+4+5: ảnh đúng route, đúng role, đủ viewport, ID hợp lệ */
  if (!isRedirect && e.status === "DONE") {
    const slugExpect = e.slug ?? expectedSlug(e.route);
    if (e.slug && e.route !== "/" && !e.slug.includes(staticTail(e.route)) && !["landing", "home"].includes(e.slug)) {
      fail("2.slug", `${tag}: slug "${e.slug}" không suy ra được từ route`);
    }
    const seenVp = new Set();
    for (const ev of e.evidence ?? []) {
      const file = ev.file;
      if (!existsSync(join(ROOT, file))) {
        fail("2.file", `${tag}: ảnh không tồn tại: ${file}`);
        continue;
      }
      // file thuộc đúng route? (slug suy từ route; đoạn sau là ID động)
      const name = basename(file);
      if (!name.startsWith(slugExpect)) {
        fail("2.slug", `${tag}: ảnh không thuộc route này (tên ${name}, mong đợi tiền tố ${slugExpect})`);
      }
      // 6: một file chỉ được dùng cho 1 route
      if (fileOwner.has(file) && fileOwner.get(file) !== e.route) {
        fail("6.borrow", `${tag}: ảnh bị dùng chung với route ${fileOwner.get(file)}: ${file}`);
      }
      fileOwner.set(file, e.route);
      // 3: role
      const auditedRole = ev.role === "intern-onboarding" ? "intern" : ev.role;
      if (!e.role?.access?.includes(auditedRole)) {
        fail("3.role", `${tag}: ảnh chụp bằng role ${ev.role} không nằm trong quyền truy cập ${JSON.stringify(e.role.access)}`);
      }
      // 4: viewport
      if (!REQUIRED_VIEWPORTS.includes(ev.viewport)) {
        fail("4.viewport", `${tag}: viewport lạ ${ev.viewport}`);
      }
      seenVp.add(ev.viewport);
      // 5: route động → resolvedRoute có ID thật; route tĩnh → resolvedRoute
      // PHẢI là chính route đó (chặn ảnh mượn từ /login hoặc route khác).
      const resolved = ev.resolvedRoute ?? "";
      if (!resolved || !matchesPattern(e.route, resolved)) {
        fail("5.route", `${tag}: resolvedRoute "${resolved}" không khớp mẫu route`);
      }
      if (e.route.includes("[") && /\[(id|code)\]|%5B|undefined|null/.test(resolved)) {
        fail("5.dynamic", `${tag}: resolvedRoute chứa placeholder: ${resolved}`);
      }
    }
    if (seenVp.size !== REQUIRED_VIEWPORTS.length) {
      fail("4.viewport", `${tag}: thiếu viewport (${[...seenVp].join(",")} — cần đủ ${REQUIRED_VIEWPORTS.join(",")})`);
    }

    /* 8: bản ghi browser verification */
    const b = e.browser;
    if (!b) {
      fail("8.browser", `${tag}: thiếu browser verification record`);
    } else {
      if (typeof b.finalUrl !== "string" || !b.finalUrl.startsWith("/")) fail("8.browser", `${tag}: finalUrl thiếu/sai`);
      if ((b.consoleErrors ?? 0) > 0) fail("8.browser", `${tag}: console errors = ${b.consoleErrors}`);
      if ((b.notMocked501 ?? 0) > 0) fail("8.browser", `${tag}: endpoint chưa mock (501) = ${b.notMocked501}`);
      if ((b.http5xx ?? 0) > 0) fail("8.browser", `${tag}: HTTP 5xx = ${b.http5xx}`);
      if (!["loaded", "empty"].includes(b.dataLoad ?? b.state)) {
        fail("8.browser", `${tag}: trạng thái dữ liệu = ${b.dataLoad ?? b.state} (phải loaded — error/loading chưa đạt)`);
      }
      const over = Object.entries(b.overflowX ?? {}).filter(([, v]) => (v ?? 0) > 2);
      if (over.length) fail("8.browser", `${tag}: tràn ngang ${JSON.stringify(over)}`);
    }

    /* 8b: đối chiếu ngược với browser-audit.json (nguồn sự thật) */
    if (auditExists) {
      const rec = auditByRoute.get(e.route);
      if (!rec) fail("8.source", `${tag}: không có trong browser-audit.json`);
      else {
        if (rec.consoleErrors?.length) fail("8.source", `${tag}: browser-audit ghi console errors`);
        if (rec.notMocked501) fail("8.source", `${tag}: browser-audit ghi 501`);
        if (rec.finalUrl !== (e.browser?.finalUrl ?? rec.finalUrl)) {
          fail("8.source", `${tag}: finalUrl manifest khác browser-audit (${e.browser?.finalUrl} vs ${rec.finalUrl})`);
        }
        if ((e.evidence ?? []).length !== (rec.viewports ?? []).length) {
          fail("8.source", `${tag}: số viewport manifest (${(e.evidence ?? []).length}) khác audit (${(rec.viewports ?? []).length})`);
        }
      }
    } else {
      fail("8.source", "thiếu docs/journey-v3-evidence/browser-audit.json");
    }
  }

  if (isRedirect && e.status === "DONE") {
    if (e.redirect.expected !== e.redirect.finalUrl) {
      fail("redirect", `${tag}: URL cuối ${e.redirect.finalUrl} khác đích khai báo ${e.redirect.expected}`);
    }
    routesRedirect += 1;
    continue;
  }

  if (e.status === "DONE") routesDone += 1;
  else routesBad += 1;
}

function staticTail(route) {
  const parts = route.split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  return last && !last.startsWith("[") ? last : (parts[parts.length - 2] ?? "");
}
function expectedSlug(route) {
  // slug tiền tố tĩnh của route: /admin/sessions/[id] → "sessions_"
  const parts = route.split("/").filter(Boolean).slice(1); // bỏ nhóm role đầu
  const last = parts[parts.length - 1];
  const statics = parts.filter((p) => !p.startsWith("["));
  if (last?.startsWith("[")) return statics.length ? statics[statics.length - 1] + "_" : "";
  return last ?? "landing";
}
function matchesPattern(route, resolved) {
  const rparts = route.split("/").filter(Boolean);
  const uparts = resolved.split("?")[0].split("/").filter(Boolean);
  if (rparts.length !== uparts.length) return false;
  return rparts.every((p, i) => (p.startsWith("[") ? Boolean(uparts[i]) : p === uparts[i]));
}

/* ---------- 7. trạng thái loading/empty/error có bằng chứng riêng ---------- */
const variants = audit ? (audit.stateVariants ?? []) : [];
const needVariant = (name) => {
  const v = variants.find((x) => x.variant === name);
  if (!v) {
    fail("7.states", `thiếu bằng chứng trạng thái: ${name}`);
    return;
  }
  const shots = v.shots ?? [];
  if (!shots.length) fail("7.states", `biến thể ${name} không có ảnh`);
  for (const s of shots) if (!existsSync(join(ROOT, s))) fail("7.states", `biến thể ${name}: ảnh thiếu ${s}`);
};
needVariant("intern-work-loading-skeleton");
needVariant("intern-work-error-state");
needVariant("admin-users-empty-state");
needVariant("instructor-empty-users");

/* ---------- globals + not-found ---------- */
const notFound = globals.find((g) => g.file === "src/app/not-found.tsx");
if (!notFound || notFound.status !== "DONE" || !(notFound.evidence ?? []).length) {
  fail("7.states", "not-found.tsx thiếu bằng chứng DONE (404 thật)");
} else {
  for (const ev of notFound.evidence) {
    if (!existsSync(join(ROOT, ev.file))) fail("7.states", `not-found ảnh thiếu: ${ev.file}`);
    if (!REQUIRED_VIEWPORTS.includes(ev.viewport)) fail("4.viewport", `not-found thiếu viewport ${ev.viewport}`);
  }
}

/* ngoại lệ: bắt buộc justification + bằng chứng kỹ thuật + trạng thái riêng */
for (const g of globals) {
  if (EXEMPT.has(g.status)) {
    if (!g.justification || g.justification.length < 40) {
      fail("exempt", `${g.file}: EXEMPT thiếu giải thích kỹ thuật`);
    }
    if (!Array.isArray(g.technicalEvidence) || g.technicalEvidence.length === 0) {
      fail("exempt", `${g.file}: EXEMPT thiếu bằng chứng kỹ thuật`);
    }
    if (g.status === "DONE") fail("exempt", `${g.file}: ngoại lệ không được khai DONE`);
  }
}

/* ---------- 9. tương tác nghiệp vụ ---------- */
if (interactions.length < 15) {
  fail("9.interactions", `quá ít tương tác được kiểm thử (${interactions.length}/15 tối thiểu)`);
}
const failedInteractions = interactions.filter((i) => !i.ok);
if (failedInteractions.length) {
  fail("9.interactions", `tương tác fail: ${failedInteractions.map((i) => i.id).join(", ")}`);
}
const withShot = interactions.filter((i) => i.evidenceShot);
if (withShot.length < 5) {
  fail("9.interactions", `quá ít tương tác có ảnh xác nhận (${withShot.length}/5 tối thiểu)`);
}

/* ---------- 10. manifest tự nhận DONE khi chưa đủ? ---------- */
if (manifest.stats && entries.length) {
  const statsDone = manifest.stats.routesDone ?? 0;
  const realDone = entries.filter((e) => e.status === "DONE").length;
  if (statsDone !== realDone) fail("10.stats", `stats.routesDone (${statsDone}) ≠ thực tế (${realDone})`);
  if (manifest.stats.routesTotal !== actual.length) {
    fail("10.stats", `stats.routesTotal (${manifest.stats.routesTotal}) ≠ số route thật (${actual.length})`);
  }
}
if (manifest.verifiedScopes?.realBackendVerified === true) {
  fail("10.honesty", "manifest tuyên bố Real Backend VERIFIED — bằng chứng toàn bộ là Preview QA, không được tuyên bố vậy");
}

/* ---------- tóm tắt ---------- */
const total = entries.length;
console.log("JOURNEY V3 — COVERAGE VERIFICATION (GATE v2)");
console.log("===========================================");
console.log(`Routes discovered (source scan): ${actual.length}`);
console.log(`Routes in manifest:              ${total}`);
console.log(`DONE (đủ bằng chứng):            ${routesDone}`);
console.log(`Redirect verified (URL cuối):   ${routesRedirect}`);
console.log(`PARTIAL / thiếu bằng chứng:      ${routesBad}`);
console.log(`Evidence files owned:            ${fileOwner.size}`);
console.log(`State variants (loading/empty/error + 404): có`);
console.log(`Interactions:                    ${interactions.length} (${failedInteractions.length} fail)`);
console.log(`Globals EXEMPT (có giải thích):  ${globals.filter((g) => EXEMPT.has(g.status)).length}`);
console.log("");
if (failures > 0) {
  console.error(`RESULT: INCOMPLETE — ${failures} vi phạm. Exit 1.`);
  process.exit(1);
}
if (routesBad > 0) {
  console.error(`RESULT: INCOMPLETE — còn ${routesBad} route chưa đủ bằng chứng. Exit 1.`);
  process.exit(1);
}
console.log("RESULT: PASS — 100% route có bằng chứng browser đúng role × 3 viewport, ảnh thuộc đúng route,");
console.log("         trạng thái loading/empty/error có bằng chứng riêng, tương tác nghiệp vụ pass, ngoại lệ có giải thích.");
console.log("         (Preview QA — chưa tuyên bố Real Backend E2E.)");
process.exit(0);
