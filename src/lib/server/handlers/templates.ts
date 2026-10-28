/** Project templates: list/detail/start (instructor, admin) + CRUD (admin). */

import type { ProjectTemplate } from "../types";
import { includesNoAccent, nowIso, randomId } from "../util";
import { badRequest, conflict, notFound, pageOf, route, type RouteDef, type Ctx } from "./common";

function templateSummary(t: ProjectTemplate): Record<string, unknown> {
  return {
    id: t.id,
    code: t.code,
    name: t.name,
    category: t.category,
    difficulty: t.difficulty,
    status: t.status,
    version: t.version,
    techStack: t.techStack,
    roles: t.roles,
    teamSize: t.teamSize,
    sprintCount: t.sprintCount,
    description: t.description,
    createdAt: t.createdAt,
  };
}

function getTemplate(ctx: Ctx, id: string): ProjectTemplate {
  const t = ctx.store.templates.find((x) => x.id === id || x.code === id);
  if (!t) throw notFound("Không tìm thấy mẫu dự án.");
  return t;
}

async function listTemplates(ctx: Ctx): Promise<unknown> {
  let items = [...ctx.store.templates];
  const search = ctx.query.get("search")?.trim();
  if (search) {
    items = items.filter((t) => includesNoAccent(`${t.code} ${t.name} ${t.description} ${t.category}`, search));
  }
  const category = ctx.query.get("category");
  if (category) items = items.filter((t) => t.category === category);
  const difficulty = ctx.query.get("difficulty");
  if (difficulty) items = items.filter((t) => t.difficulty === difficulty);
  const status = ctx.query.get("status");
  if (status) items = items.filter((t) => t.status === status);
  items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return pageOf(items.map(templateSummary), ctx.query);
}

async function templateDetail(ctx: Ctx): Promise<unknown> {
  const t = getTemplate(ctx, ctx.params.id);
  // các phiên đã chạy từ template này
  const runs = ctx.store.sessions
    .filter((s) => ctx.store.projects.find((p) => p.id === s.projectId)?.templateId === t.id)
    .map((s) => ({ sessionId: s.id, sessionName: s.name, startedAt: s.createdAt }));
  return { ...templateSummary(t), blueprint: t.blueprint, runs };
}

/** POST /project-templates/:id/start — tạo project + session planning (dedupe 30s). */
async function startTemplate(ctx: Ctx): Promise<unknown> {
  const t = getTemplate(ctx, ctx.params.id);
  const body = ctx.body ?? {};
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : `${t.name} — ${new Date().getFullYear()}`;
  const startDate = typeof body.startDate === "string" && body.startDate ? body.startDate : nowIso();
  const endDate =
    typeof body.endDate === "string" && body.endDate ? body.endDate : new Date(new Date(startDate).getTime() + 84 * 86400000).toISOString();

  // dedupe: gọi lại trong 30s với cùng body → trả kết quả cũ
  const recent = ctx.store.templateStarts.find(
    (s) => s.templateId === t.id && s.name === name && Date.now() - s.at < 30000
  );
  if (recent) {
    return { projectId: recent.projectId, sessionId: recent.sessionId, sessionCode: recent.sessionCode, deduped: true };
  }

  const projectId = randomId("prj");
  const projectCode = `PRJ-${t.code.replace("TPL-", "")}-${String(ctx.store.projects.length + 1).padStart(2, "0")}`;
  ctx.store.projects.push({
    id: projectId,
    code: projectCode,
    name,
    description: t.description,
    status: "planning",
    techStack: [...t.techStack],
    templateId: t.id,
    templateName: t.name,
  });

  const sessionId = randomId("ses");
  const sessionCode = `SES-${new Date().getFullYear()}-${String(ctx.store.sessions.length + 1).padStart(2, "0")}`;
  ctx.store.sessions.push({
    id: sessionId,
    code: sessionCode,
    name,
    status: "planning",
    startDate,
    endDate,
    projectId,
    description: `Phiên thực tập sinh từ mẫu dự án ${t.name} (${t.code}).`,
    instructorIds: [ctx.user!.id],
    createdAt: nowIso(),
    planPublishedAt: null,
  });

  ctx.store.templateStarts.push({ templateId: t.id, name, at: Date.now(), projectId, sessionId, sessionCode });
  return { projectId, sessionId, sessionCode };
}

/* ------------------------------ admin CRUD ------------------------------ */

const DIFFICULTIES: ProjectTemplate["difficulty"][] = ["beginner", "intermediate", "advanced"];
const STATUSES: ProjectTemplate["status"][] = ["active", "draft", "archived"];

async function createTemplate(ctx: Ctx): Promise<unknown> {
  const body = ctx.body ?? {};
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) throw badRequest("Tên mẫu dự án là bắt buộc.", ["name: bắt buộc"]);

  const code = `TPL-${name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toUpperCase()
    .slice(0, 12)}`;

  const template: ProjectTemplate = {
    id: randomId("tpl"),
    code: ctx.store.templates.some((t) => t.code === code) ? `${code}-${ctx.store.templates.length + 1}` : code,
    name,
    category: typeof body.category === "string" && body.category ? body.category : "Web App",
    difficulty:
      typeof body.difficulty === "string" && DIFFICULTIES.includes(body.difficulty as ProjectTemplate["difficulty"])
        ? (body.difficulty as ProjectTemplate["difficulty"])
        : "intermediate",
    status:
      typeof body.status === "string" && STATUSES.includes(body.status as ProjectTemplate["status"])
        ? (body.status as ProjectTemplate["status"])
        : "draft",
    version: 1,
    techStack: Array.isArray(body.techStack) ? (body.techStack as string[]).map(String) : [],
    roles: Array.isArray(body.roles) ? (body.roles as string[]).map(String) : ["frontend", "backend", "fullstack", "qa"],
    teamSize:
      body.teamSize && typeof body.teamSize === "object"
        ? {
            min: Math.max(1, Number((body.teamSize as Record<string, unknown>).min) || 3),
            max: Math.max(1, Number((body.teamSize as Record<string, unknown>).max) || 6),
          }
        : { min: 3, max: 6 },
    sprintCount: typeof body.sprintCount === "number" ? body.sprintCount : 3,
    description: typeof body.description === "string" ? body.description : "",
    createdAt: nowIso(),
    blueprint:
      body.blueprint && typeof body.blueprint === "object"
        ? (body.blueprint as ProjectTemplate["blueprint"])
        : { overview: name, roleDetails: [], sprints: [], milestones: [] },
  };
  ctx.store.templates.push(template);
  return { ...templateSummary(template), blueprint: template.blueprint };
}

async function patchTemplate(ctx: Ctx): Promise<unknown> {
  const t = getTemplate(ctx, ctx.params.id);
  const body = ctx.body ?? {};
  const expectedVersion = body.expectedVersion;
  if (typeof expectedVersion !== "number" || expectedVersion !== t.version) {
    throw conflict("Mẫu dự án đã được cập nhật bởi người khác. Vui lòng tải lại.", "VERSION_CONFLICT");
  }
  if (body.name != null) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) throw badRequest("Tên mẫu dự án không được để trống.", ["name: bắt buộc"]);
    t.name = name;
  }
  if (typeof body.category === "string" && body.category) t.category = body.category;
  if (body.difficulty != null) {
    if (typeof body.difficulty !== "string" || !DIFFICULTIES.includes(body.difficulty as ProjectTemplate["difficulty"])) {
      throw badRequest("Độ khó không hợp lệ.", ["difficulty: beginner|intermediate|advanced"]);
    }
    t.difficulty = body.difficulty as ProjectTemplate["difficulty"];
  }
  if (body.status != null) {
    if (typeof body.status !== "string" || !STATUSES.includes(body.status as ProjectTemplate["status"])) {
      throw badRequest("Trạng thái không hợp lệ.", ["status: active|draft|archived"]);
    }
    t.status = body.status as ProjectTemplate["status"];
  }
  if (typeof body.description === "string") t.description = body.description;
  t.version += 1;
  return { ...templateSummary(t), blueprint: t.blueprint };
}

export const templateRoutes: RouteDef[] = [
  route("GET", "/project-templates", ["instructor", "admin"], listTemplates),
  route("POST", "/project-templates", "admin", createTemplate),
  route("GET", "/project-templates/:id", ["instructor", "admin"], templateDetail),
  route("POST", "/project-templates/:id/start", ["instructor", "admin"], startTemplate),
  route("PATCH", "/project-templates/:id", "admin", patchTemplate),
];
