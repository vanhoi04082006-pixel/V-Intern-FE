/**
 * Admin knowledge — kho tri thức cho Agent (Task 2-b).
 *
 * CRUD + vòng đời draft → published → archived (+ restore từ revision),
 * publication-check (đủ nguồn / nội dung theo kind / audience),
 * import dry-run validation từng hàng.
 */

import type {
  KnowledgeAudience,
  KnowledgeDoc,
  KnowledgeKind,
  KnowledgePurpose,
  KnowledgeRevision,
  KnowledgeSource,
} from "../org-store";
import { getOrgStore } from "../org-store";
import { pushAudit } from "../store";
import { includesNoAccent, nowIso, randomId } from "../util";
import { badRequest, conflict, notFound, pageOf, requireString, route, type Ctx, type RouteDef } from "./common";

const KINDS: KnowledgeKind[] = ["qa", "guide", "exercise", "solution", "rubric", "plan_template", "communication"];
const STATUSES: KnowledgeDoc["status"][] = ["draft", "published", "archived"];
const AUDIENCES: KnowledgeAudience[] = ["student_safe", "staff_only", "grading_only"];
const PURPOSES: KnowledgePurpose[] = [
  "interview_question",
  "code_review",
  "plan_generation",
  "career_advice",
  "exercise_grading",
  "cv_analysis",
  "session_summary",
  "mentor_chat",
  "onboarding_guide",
];

/** Trường bắt buộc theo kind để coi là "có nội dung". */
const KIND_REQUIRED: Record<KnowledgeKind, string[]> = {
  qa: ["intendedKeyPoints", "correctApproaches", "commonErrors", "followUpQuestions", "rubric"],
  guide: ["overview", "sections"],
  exercise: ["prompt", "requirements"],
  solution: ["steps"],
  rubric: ["criteria"],
  plan_template: ["sections"],
  communication: ["scenario", "script"],
};

const CODE_PATTERN = /^[a-z0-9][a-z0-9-]{2,63}$/;

/* ------------------------------- helpers ------------------------------- */

function getDocByCode(code: string): KnowledgeDoc {
  const doc = getOrgStore().knowledgeDocs.find((d) => d.code === code);
  if (!doc) throw notFound(`Không tìm thấy tài liệu '${code}'.`);
  return doc;
}

function docSummary(d: KnowledgeDoc): Record<string, unknown> {
  return {
    id: d.id,
    code: d.code,
    title: d.title,
    summary: d.summary,
    kind: d.kind,
    version: d.version,
    status: d.status,
    audience: d.audience,
    purpose: d.purpose,
    roleCode: d.roleCode,
    updatedAt: d.updatedAt,
  };
}

function docDetail(d: KnowledgeDoc): Record<string, unknown> {
  return {
    ...docSummary(d),
    body: d.body,
    sources: d.sources,
    createdAt: d.createdAt,
    publishedAt: d.publishedAt,
    archivedAt: d.archivedAt,
    revisionCount: getOrgStore().knowledgeRevisions.filter((r) => r.docId === d.id).length,
  };
}

function snapshotOf(d: KnowledgeDoc) {
  return {
    title: d.title,
    summary: d.summary,
    kind: d.kind,
    audience: d.audience,
    purpose: d.purpose,
    roleCode: d.roleCode,
    status: d.status,
    body: d.body,
    sources: d.sources,
  };
}

function saveRevision(doc: KnowledgeDoc, note: string, editedBy: string): void {
  const org = getOrgStore();
  const rev: KnowledgeRevision = {
    id: randomId("krev"),
    docId: doc.id,
    docCode: doc.code,
    version: doc.version,
    snapshot: snapshotOf(doc),
    note,
    editedBy,
    at: nowIso(),
  };
  org.knowledgeRevisions.push(rev);
}

function parseKind(v: unknown, field: string): KnowledgeKind {
  if (typeof v !== "string" || !KINDS.includes(v as KnowledgeKind)) {
    throw badRequest(`Loại tài liệu không hợp lệ (${field}).`, [`${field}: ${KINDS.join("|")}`]);
  }
  return v as KnowledgeKind;
}

function parseAudience(v: unknown, field: string): KnowledgeAudience {
  if (typeof v !== "string" || !AUDIENCES.includes(v as KnowledgeAudience)) {
    throw badRequest(`Đối tượng không hợp lệ (${field}).`, [`${field}: ${AUDIENCES.join("|")}`]);
  }
  return v as KnowledgeAudience;
}

function parsePurpose(v: unknown, field: string): KnowledgePurpose {
  if (typeof v !== "string" || !PURPOSES.includes(v as KnowledgePurpose)) {
    throw badRequest(`Mục đích sử dụng không hợp lệ (${field}).`, [`${field}: ${PURPOSES.join("|")}`]);
  }
  return v as KnowledgePurpose;
}

function parseSources(v: unknown): KnowledgeSource[] | null {
  if (v == null) return null;
  if (!Array.isArray(v)) throw badRequest("Nguồn tham khảo phải là mảng {name, url}.", ["sources: mảng"]);
  return v.map((s) => {
    if (typeof s !== "object" || s == null || typeof (s as Record<string, unknown>).name !== "string" || typeof (s as Record<string, unknown>).url !== "string") {
      throw badRequest("Mỗi nguồn cần đủ name + url.", ["sources[]: name, url"]);
    }
    const src = s as { name: string; url: string };
    return { name: src.name.trim(), url: src.url.trim() };
  });
}

function bodyHasContent(kind: KnowledgeKind, body: Record<string, unknown>): boolean {
  const required = KIND_REQUIRED[kind];
  return required.every((key) => {
    const v = body[key];
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "string") return v.trim().length > 0;
    if (v != null && typeof v === "object") return Object.keys(v).length > 0;
    return false;
  });
}

/* ------------------------------- list ------------------------------- */

async function listKnowledge(ctx: Ctx): Promise<unknown> {
  const q = ctx.query;
  let items = [...getOrgStore().knowledgeDocs];
  const query = q.get("query")?.trim();
  if (query) {
    items = items.filter((d) => includesNoAccent(`${d.code} ${d.title} ${d.summary}`, query));
  }
  const status = q.get("status");
  if (status) items = items.filter((d) => d.status === status);
  const kind = q.get("kind");
  if (kind) items = items.filter((d) => d.kind === kind);
  const audience = q.get("audience");
  if (audience) items = items.filter((d) => d.audience === audience);
  const purpose = q.get("purpose");
  if (purpose) items = items.filter((d) => d.purpose === purpose);
  const roleCode = q.get("roleCode");
  if (roleCode) items = items.filter((d) => d.roleCode === roleCode);
  items.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  return pageOf(items.map(docSummary), q);
}

/* ------------------------------- create ------------------------------- */

async function createKnowledge(ctx: Ctx): Promise<unknown> {
  const body = ctx.body ?? {};
  const code = requireString(body, "code", "Mã tài liệu");
  if (!CODE_PATTERN.test(code)) {
    throw badRequest("Mã tài liệu chỉ gồm a-z, 0-9 và gạch nối (3–64 ký tự).", ["code: slug"]);
  }
  const org = getOrgStore();
  if (org.knowledgeDocs.some((d) => d.code === code)) {
    throw conflict(`Mã tài liệu '${code}' đã tồn tại.`, "KNOWLEDGE_CODE_EXISTS");
  }
  const title = requireString(body, "title", "Tiêu đề");
  const summary = requireString(body, "summary", "Tóm tắt");
  const kind = parseKind(body.kind, "kind");
  const audience = parseAudience(body.audience, "audience");
  const purpose = parsePurpose(body.purpose, "purpose");
  const roleCode = typeof body.roleCode === "string" && body.roleCode ? body.roleCode : null;

  const doc: KnowledgeDoc = {
    id: randomId("kdoc"),
    code,
    title,
    summary,
    kind,
    audience,
    purpose,
    roleCode,
    version: 1,
    status: "draft",
    body: {},
    sources: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    publishedAt: null,
    archivedAt: null,
  };
  org.knowledgeDocs.push(doc);
  saveRevision(doc, "Tạo bản nháp đầu tiên", ctx.user!.displayName);
  pushAudit(ctx.user!.displayName, "CREATE", `Knowledge ${code}`);
  return docDetail(doc);
}

/* ------------------------------- detail ------------------------------- */

async function knowledgeDetail(ctx: Ctx): Promise<unknown> {
  return docDetail(getDocByCode(ctx.params.code));
}

/* ------------------------------- update (PUT) ------------------------------- */

async function updateKnowledge(ctx: Ctx): Promise<unknown> {
  const doc = getDocByCode(ctx.params.code);
  const body = ctx.body ?? {};
  const expectedVersion = body.expectedVersion;
  if (typeof expectedVersion !== "number" || expectedVersion !== doc.version) {
    throw conflict("Tài liệu đã được chỉnh sửa bởi người khác. Vui lòng tải lại.", "KNOWLEDGE_VERSION_CONFLICT");
  }
  if (doc.status === "archived") {
    throw conflict("Tài liệu đã lưu trữ — hãy khôi phục (restore) trước khi sửa.", "KNOWLEDGE_ARCHIVED");
  }

  if (body.title != null) doc.title = requireString(body, "title", "Tiêu đề");
  if (body.summary != null) doc.summary = requireString(body, "summary", "Tóm tắt");
  if (body.kind != null) doc.kind = parseKind(body.kind, "kind");
  if (body.audience != null) doc.audience = parseAudience(body.audience, "audience");
  if (body.purpose != null) doc.purpose = parsePurpose(body.purpose, "purpose");
  if (body.roleCode !== undefined) {
    doc.roleCode = typeof body.roleCode === "string" && body.roleCode ? body.roleCode : null;
  }
  if (body.body !== undefined) {
    if (typeof body.body !== "object" || body.body == null || Array.isArray(body.body)) {
      throw badRequest("Nội dung phải là object theo loại tài liệu.", ["body: object"]);
    }
    doc.body = body.body as Record<string, unknown>;
  }
  const sources = parseSources(body.sources);
  if (sources != null) doc.sources = sources;

  doc.version += 1;
  doc.status = "draft"; // chỉnh sửa luôn tạo bản nháp mới
  doc.updatedAt = nowIso();
  const note = typeof body.note === "string" && body.note.trim() ? body.note.trim() : `Chỉnh sửa lên phiên bản ${doc.version}`;
  saveRevision(doc, note, ctx.user!.displayName);
  pushAudit(ctx.user!.displayName, "UPDATE", `Knowledge ${doc.code} v${doc.version}`);
  return docDetail(doc);
}

/* --------------------------- lifecycle actions --------------------------- */

function expectVersion(body: Record<string, unknown> | null, doc: KnowledgeDoc): void {
  const v = body?.version;
  if (typeof v !== "number" || v !== doc.version) {
    throw conflict("Phiên bản không khớp. Vui lòng tải lại tài liệu.", "KNOWLEDGE_VERSION_CONFLICT");
  }
}

async function publishKnowledge(ctx: Ctx): Promise<unknown> {
  const doc = getDocByCode(ctx.params.code);
  expectVersion(ctx.body, doc);
  if (doc.status === "archived") {
    throw conflict("Tài liệu đã lưu trữ — hãy khôi phục trước khi xuất bản.", "KNOWLEDGE_ARCHIVED");
  }
  if (doc.status === "published") {
    throw conflict("Tài liệu đã xuất bản ở phiên bản này.", "KNOWLEDGE_ALREADY_PUBLISHED");
  }
  doc.status = "published";
  doc.publishedAt = nowIso();
  doc.updatedAt = nowIso();
  saveRevision(doc, `Xuất bản phiên bản ${doc.version}`, ctx.user!.displayName);
  pushAudit(ctx.user!.displayName, "STATUS_CHANGE", `Knowledge ${doc.code} → published`);
  return docDetail(doc);
}

async function archiveKnowledge(ctx: Ctx): Promise<unknown> {
  const doc = getDocByCode(ctx.params.code);
  expectVersion(ctx.body, doc);
  if (doc.status === "archived") {
    throw conflict("Tài liệu đã lưu trữ rồi.", "KNOWLEDGE_ALREADY_ARCHIVED");
  }
  doc.status = "archived";
  doc.archivedAt = nowIso();
  doc.updatedAt = nowIso();
  saveRevision(doc, `Lưu trữ phiên bản ${doc.version}`, ctx.user!.displayName);
  pushAudit(ctx.user!.displayName, "STATUS_CHANGE", `Knowledge ${doc.code} → archived`);
  return docDetail(doc);
}

async function restoreKnowledge(ctx: Ctx): Promise<unknown> {
  const doc = getDocByCode(ctx.params.code);
  const body = ctx.body ?? {};
  expectVersion(body, doc);
  const sourceVersion = body.sourceVersion;
  if (typeof sourceVersion !== "number") {
    throw badRequest("Cần chọn phiên bản nguồn để khôi phục.", ["sourceVersion: số"]);
  }
  const rev = getOrgStore().knowledgeRevisions.find((r) => r.docId === doc.id && r.version === sourceVersion);
  if (!rev) {
    throw notFound(`Không tìm thấy phiên bản ${sourceVersion} của tài liệu này.`);
  }

  doc.title = rev.snapshot.title;
  doc.summary = rev.snapshot.summary;
  doc.kind = rev.snapshot.kind;
  doc.audience = rev.snapshot.audience;
  doc.purpose = rev.snapshot.purpose;
  doc.roleCode = rev.snapshot.roleCode;
  doc.body = rev.snapshot.body;
  doc.sources = rev.snapshot.sources;
  doc.version += 1;
  doc.status = "draft";
  doc.updatedAt = nowIso();
  doc.archivedAt = null;
  saveRevision(doc, `Khôi phục từ phiên bản ${sourceVersion} thành bản nháp v${doc.version}`, ctx.user!.displayName);
  pushAudit(ctx.user!.displayName, "UPDATE", `Knowledge ${doc.code} restore từ v${sourceVersion}`);
  return docDetail(doc);
}

/* ------------------------------- revisions ------------------------------- */

async function listRevisions(ctx: Ctx): Promise<unknown> {
  const doc = getDocByCode(ctx.params.code);
  const items = getOrgStore()
    .knowledgeRevisions.filter((r) => r.docId === doc.id)
    .sort((a, b) => (a.version < b.version ? 1 : -1))
    .map((r) => ({
      id: r.id,
      version: r.version,
      note: r.note,
      editedBy: r.editedBy,
      at: r.at,
      snapshot: r.snapshot,
    }));
  return pageOf(items, ctx.query);
}

/* --------------------------- publication-check --------------------------- */

async function publicationCheck(ctx: Ctx): Promise<unknown> {
  const doc = getDocByCode(ctx.params.code);
  const hasSources = doc.sources.length > 0;
  const hasBody = bodyHasContent(doc.kind, doc.body);
  const hasAudience = doc.audience != null && doc.audience.length > 0;
  const checks = [
    { id: "has_sources", label: "Có ít nhất một nguồn tham khảo hợp lệ", passed: hasSources },
    { id: "has_body", label: `Có nội dung đầy đủ theo loại '${doc.kind}' (${KIND_REQUIRED[doc.kind].join(", ")})`, passed: hasBody },
    { id: "has_audience", label: "Có phân đối tượng người đọc (audience)", passed: hasAudience },
  ];
  return { checks, canPublish: checks.every((c) => c.passed) };
}

/* ----------------------------- import dry-run ----------------------------- */

interface ImportItem {
  code?: unknown;
  title?: unknown;
  summary?: unknown;
  kind?: unknown;
  audience?: unknown;
  purpose?: unknown;
  roleCode?: unknown;
}

async function importDryRun(ctx: Ctx): Promise<unknown> {
  const items = ctx.body?.items;
  if (!Array.isArray(items) || items.length === 0) {
    throw badRequest("Cần truyền danh sách items để kiểm tra.", ["items: mảng không rỗng"]);
  }
  if (items.length > 200) {
    throw badRequest("Tối đa 200 hàng mỗi lần kiểm tra.", ["items: ≤ 200"]);
  }
  const existingCodes = new Set(getOrgStore().knowledgeDocs.map((d) => d.code));
  const seenInBatch = new Set<string>();
  const valid: { row: number; code: string; title: string; issues: string[] }[] = [];
  const invalid: { row: number; code: string | null; issues: string[] }[] = [];

  items.forEach((raw, idx) => {
    const row = idx + 1;
    const item = (raw ?? {}) as ImportItem;
    const issues: string[] = [];
    const code = typeof item.code === "string" ? item.code.trim().toLowerCase() : "";
    if (!code) issues.push("code: bắt buộc");
    else if (!CODE_PATTERN.test(code)) issues.push("code: chỉ gồm a-z, 0-9, gạch nối (3–64 ký tự)");
    else if (existingCodes.has(code)) issues.push(`code: '${code}' đã tồn tại trong kho`);
    else if (seenInBatch.has(code)) issues.push(`code: '${code}' trùng trong file import`);
    if (typeof item.title !== "string" || !item.title.trim()) issues.push("title: bắt buộc");
    if (typeof item.summary !== "string" || !item.summary.trim()) issues.push("summary: bắt buộc");
    if (typeof item.kind !== "string" || !KINDS.includes(item.kind as KnowledgeKind)) issues.push(`kind: ${KINDS.join("|")}`);
    if (typeof item.audience !== "string" || !AUDIENCES.includes(item.audience as KnowledgeAudience)) issues.push(`audience: ${AUDIENCES.join("|")}`);
    if (typeof item.purpose !== "string" || !PURPOSES.includes(item.purpose as KnowledgePurpose)) issues.push(`purpose: ${PURPOSES.join("|")}`);
    if (item.roleCode != null && typeof item.roleCode !== "string") issues.push("roleCode: chuỗi hoặc bỏ trống");

    if (issues.length === 0) {
      seenInBatch.add(code);
      valid.push({ row, code, title: (item.title as string).trim(), issues: [] });
    } else {
      invalid.push({ row, code: code || null, issues });
    }
  });

  return {
    total: items.length,
    validCount: valid.length,
    invalidCount: invalid.length,
    valid,
    invalid,
  };
}

/* ------------------------------- routes ------------------------------- */

export const knowledgeRoutes: RouteDef[] = [
  route("GET", "/admin/knowledge", "admin", listKnowledge),
  route("POST", "/admin/knowledge", "admin", createKnowledge),
  route("POST", "/admin/knowledge/import/dry-run", "admin", importDryRun),
  route("GET", "/admin/knowledge/:code", "admin", knowledgeDetail),
  route("PUT", "/admin/knowledge/:code", "admin", updateKnowledge),
  route("POST", "/admin/knowledge/:code/publish", "admin", publishKnowledge),
  route("POST", "/admin/knowledge/:code/archive", "admin", archiveKnowledge),
  route("POST", "/admin/knowledge/:code/restore", "admin", restoreKnowledge),
  route("GET", "/admin/knowledge/:code/revisions", "admin", listRevisions),
  route("GET", "/admin/knowledge/:code/publication-check", "admin", publicationCheck),
];
