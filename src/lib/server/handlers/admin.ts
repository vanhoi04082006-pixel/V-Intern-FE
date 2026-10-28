/** Admin: dashboard, users, question bank, AI config, system status, settings, activity, audit. */

import type { AccountStatus, Question, User, UserRole } from "../types";
import { findUserByEmail, pushAudit, recordActivity } from "../store";
import { includesNoAccent, nowIso, randomId } from "../util";
import { badRequest, conflict, notFound, pageOf, route, type RouteDef, type Ctx } from "./common";

const ROLES: UserRole[] = ["intern", "instructor", "admin"];
const ACCOUNT_STATUSES: AccountStatus[] = ["active", "pending", "locked"];
const PHASES: Question["phase"][] = ["introduction", "technical", "english", "communication"];
const DIFFICULTIES: Question["difficulty"][] = ["easy", "medium", "hard"];

/* ------------------------------- dashboard ------------------------------- */

async function dashboard(ctx: Ctx): Promise<unknown> {
  const s = ctx.store;
  const counts = {
    users: s.users.length,
    interns: s.users.filter((u) => u.role === "intern").length,
    instructors: s.users.filter((u) => u.role === "instructor").length,
    admins: s.users.filter((u) => u.role === "admin").length,
    sessions: s.sessions.length,
    activeSessions: s.sessions.filter((x) => x.status === "active").length,
    templates: s.templates.length,
    questions: s.questionBank.filter((q) => q.isActive).length,
    certificates: s.certificates.length,
  };
  return {
    counts,
    recentActivity: s.activityEvents.slice(0, 8).map((e) => ({
      id: e.id,
      action: e.action,
      actorName: e.actorName,
      at: e.at,
      summary: e.summary,
    })),
    systemHealth: "operational",
  };
}

/* --------------------------------- users --------------------------------- */

function userRow(u: User): Record<string, unknown> {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    role: u.role,
    status: u.status,
    joinedAt: u.joinedAt,
    lastLoginAt: u.lastLoginAt,
  };
}

async function listUsers(ctx: Ctx): Promise<unknown> {
  const q = ctx.query.get("q")?.trim();
  const role = ctx.query.get("role");
  const status = ctx.query.get("status");
  let items = ctx.store.users.filter((u) => {
    if (role && u.role !== role) return false;
    if (status && u.status !== status) return false;
    if (q && !includesNoAccent(`${u.displayName} ${u.email}`, q)) return false;
    return true;
  });
  items = items.slice().sort((a, b) => (a.joinedAt < b.joinedAt ? 1 : -1));
  return pageOf(items.map(userRow), ctx.query);
}

async function createUser(ctx: Ctx): Promise<unknown> {
  const email = typeof ctx.body?.email === "string" ? ctx.body.email.trim().toLowerCase() : "";
  const displayName = typeof ctx.body?.displayName === "string" ? ctx.body.displayName.trim() : "";
  const password = typeof ctx.body?.password === "string" && ctx.body.password ? ctx.body.password : "demo1234";
  const role = typeof ctx.body?.role === "string" ? (ctx.body.role as UserRole) : "intern";

  const details: string[] = [];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) details.push("email: Email không hợp lệ");
  if (displayName.length < 2) details.push("displayName: Tên hiển thị tối thiểu 2 ký tự");
  if (!ROLES.includes(role)) details.push("role: intern|instructor|admin");
  if (password.length < 8) details.push("password: Mật khẩu tối thiểu 8 ký tự");
  if (details.length) throw badRequest("Thông tin người dùng chưa hợp lệ.", details);
  if (findUserByEmail(email)) throw conflict("Email này đã có tài khoản.", "EMAIL_EXISTS");

  const colors = ["#10B981", "#FBBF24", "#2DD4BF", "#FB7185", "#FB923C", "#A3E635"];
  const user: User = {
    id: randomId("usr"),
    email,
    password,
    displayName,
    role,
    status: "active",
    avatarColor: colors[ctx.store.users.length % colors.length],
    joinedAt: nowIso(),
    lastLoginAt: null,
    studentId: null,
    university: null,
  };
  ctx.store.users.push(user);
  pushAudit(ctx.user!.displayName, "CREATE", `Tạo người dùng ${user.email}`);
  recordActivity("auth", "USER_CREATED", ctx.user!.displayName, `Tạo tài khoản ${role} mới: ${user.email}.`);
  return userRow(user);
}

function getUser(ctx: Ctx, id: string): User {
  const u = ctx.store.users.find((x) => x.id === id || x.email === id);
  if (!u) throw notFound("Không tìm thấy người dùng.");
  return u;
}

async function patchUser(ctx: Ctx): Promise<unknown> {
  const u = getUser(ctx, ctx.params.id);
  const body = ctx.body ?? {};
  if (body.displayName != null) {
    const name = typeof body.displayName === "string" ? body.displayName.trim() : "";
    if (name.length < 2) throw badRequest("Tên hiển thị tối thiểu 2 ký tự.", ["displayName: ≥ 2 ký tự"]);
    u.displayName = name;
  }
  if (body.role != null) {
    if (typeof body.role !== "string" || !ROLES.includes(body.role as UserRole)) {
      throw badRequest("Vai trò không hợp lệ.", ["role: intern|instructor|admin"]);
    }
    u.role = body.role as UserRole;
  }
  pushAudit(ctx.user!.displayName, "UPDATE", `Cập nhật người dùng ${u.email}`);
  return userRow(u);
}

async function patchUserStatus(ctx: Ctx): Promise<unknown> {
  const u = getUser(ctx, ctx.params.id);
  const status = ctx.body?.status;
  if (typeof status !== "string" || !ACCOUNT_STATUSES.includes(status as AccountStatus)) {
    throw badRequest("Trạng thái không hợp lệ.", ["status: active|pending|locked"]);
  }
  u.status = status as AccountStatus;
  pushAudit(ctx.user!.displayName, "STATUS_CHANGE", `Chuyển ${u.email} → ${status}`);
  recordActivity("auth", "ACCOUNT_STATUS", ctx.user!.displayName, `Chuyển trạng thái tài khoản ${u.email} sang '${status}'.`);
  return userRow(u);
}

/* ------------------------------ question bank ------------------------------ */

function questionRow(q: Question): Record<string, unknown> {
  return {
    id: q.id,
    roleCode: q.roleCode,
    phase: q.phase,
    difficulty: q.difficulty,
    language: q.language,
    prompt: q.prompt,
    expectedConcepts: q.expectedConcepts,
    isActive: q.isActive,
    version: q.version,
  };
}

async function listQuestionBank(ctx: Ctx): Promise<unknown> {
  const role = ctx.query.get("role");
  const phase = ctx.query.get("phase");
  const difficulty = ctx.query.get("difficulty");
  const search = ctx.query.get("search")?.trim();
  let items = ctx.store.questionBank.filter((q) => {
    if (role && q.roleCode !== role) return false;
    if (phase && q.phase !== phase) return false;
    if (difficulty && q.difficulty !== difficulty) return false;
    if (search && !includesNoAccent(`${q.prompt} ${q.expectedConcepts.join(" ")}`, search)) return false;
    return true;
  });
  items = items.slice().sort((a, b) => (a.id < b.id ? -1 : 1));
  return pageOf(items.map(questionRow), ctx.query);
}

async function questionCoverage(ctx: Ctx): Promise<unknown> {
  const map = new Map<string, number>();
  for (const q of ctx.store.questionBank.filter((x) => x.isActive)) {
    const key = `${q.roleCode}|${q.phase}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  const data = [...map.entries()]
    .map(([key, count]) => {
      const [roleCode, phase] = key.split("|");
      return { roleCode, phase, count };
    })
    .sort((a, b) => (a.roleCode < b.roleCode ? -1 : a.roleCode > b.roleCode ? 1 : a.phase < b.phase ? -1 : 1));
  return { data };
}

async function createQuestion(ctx: Ctx): Promise<unknown> {
  const roleCode = typeof ctx.body?.roleCode === "string" ? ctx.body.roleCode : "";
  const prompt = typeof ctx.body?.prompt === "string" ? ctx.body.prompt.trim() : "";
  const expectedConcepts = Array.isArray(ctx.body?.expectedConcepts) ? (ctx.body!.expectedConcepts as unknown[]).map(String) : [];
  const phase = typeof ctx.body?.phase === "string" ? (ctx.body.phase as Question["phase"]) : "technical";
  const difficulty = typeof ctx.body?.difficulty === "string" ? (ctx.body.difficulty as Question["difficulty"]) : "medium";

  const details: string[] = [];
  if (!roleCode) details.push("roleCode: bắt buộc");
  if (!prompt) details.push("prompt: bắt buộc");
  if (!PHASES.includes(phase)) details.push("phase: introduction|technical|english|communication");
  if (!DIFFICULTIES.includes(difficulty)) details.push("difficulty: easy|medium|hard");
  if (!expectedConcepts.length) details.push("expectedConcepts: cần ít nhất 1 khái niệm");
  if (details.length) throw badRequest("Câu hỏi chưa hợp lệ.", details);

  const question: Question = {
    id: randomId("qbk"),
    roleCode,
    phase,
    difficulty,
    language: "vi",
    prompt,
    expectedConcepts,
    isActive: true,
    version: 1,
  };
  ctx.store.questionBank.push(question);
  pushAudit(ctx.user!.displayName, "CREATE", `Tạo câu hỏi ${question.id}`);
  return questionRow(question);
}

async function updateQuestion(ctx: Ctx): Promise<unknown> {
  const q = ctx.store.questionBank.find((x) => x.id === ctx.params.id);
  if (!q) throw notFound("Không tìm thấy câu hỏi.");
  const body = ctx.body ?? {};
  if (typeof body.version !== "number" || body.version !== q.version) {
    throw conflict("Câu hỏi đã được cập nhật bởi người khác. Vui lòng tải lại.", "VERSION_CONFLICT");
  }
  if (body.prompt != null) {
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt) throw badRequest("Nội dung câu hỏi không được để trống.", ["prompt: bắt buộc"]);
    q.prompt = prompt;
  }
  if (typeof body.roleCode === "string" && body.roleCode) q.roleCode = body.roleCode;
  if (body.phase != null) {
    if (typeof body.phase !== "string" || !PHASES.includes(body.phase as Question["phase"])) {
      throw badRequest("Giai đoạn không hợp lệ.", ["phase: introduction|technical|english|communication"]);
    }
    q.phase = body.phase as Question["phase"];
  }
  if (body.difficulty != null) {
    if (typeof body.difficulty !== "string" || !DIFFICULTIES.includes(body.difficulty as Question["difficulty"])) {
      throw badRequest("Độ khó không hợp lệ.", ["difficulty: easy|medium|hard"]);
    }
    q.difficulty = body.difficulty as Question["difficulty"];
  }
  if (Array.isArray(body.expectedConcepts)) q.expectedConcepts = (body.expectedConcepts as unknown[]).map(String);
  q.version += 1;
  pushAudit(ctx.user!.displayName, "UPDATE", `Cập nhật câu hỏi ${q.id} (v${q.version})`);
  return questionRow(q);
}

async function retireQuestion(ctx: Ctx): Promise<unknown> {
  const q = ctx.store.questionBank.find((x) => x.id === ctx.params.id);
  if (!q) throw notFound("Không tìm thấy câu hỏi.");
  const version = Number(ctx.query.get("version"));
  if (!Number.isFinite(version) || version !== q.version) {
    throw conflict("Phiên bản câu hỏi không khớp. Vui lòng tải lại.", "VERSION_CONFLICT");
  }
  q.isActive = false;
  pushAudit(ctx.user!.displayName, "DELETE", `Ngừng sử dụng câu hỏi ${q.id}`);
  return { retired: true, id: q.id, isActive: q.isActive };
}

/* ----------------------------- ai configuration ----------------------------- */

async function getAiConfig(ctx: Ctx): Promise<unknown> {
  return ctx.store.aiConfig;
}

async function putAiConfig(ctx: Ctx): Promise<unknown> {
  const body = ctx.body ?? {};
  const model = typeof body.model === "string" ? body.model.trim() : "";
  const timeoutMs = typeof body.timeoutMs === "number" ? body.timeoutMs : NaN;
  const maxRetries = typeof body.maxRetries === "number" ? body.maxRetries : NaN;

  const details: string[] = [];
  if (!/^[a-z0-9.-]+$/.test(model)) details.push("model: chỉ gồm chữ thường, số, dấu chấm và gạch nối");
  if (!(timeoutMs >= 10000 && timeoutMs <= 180000)) details.push("timeoutMs: 10000-180000");
  if (!(Number.isInteger(maxRetries) && maxRetries >= 0 && maxRetries <= 3)) details.push("maxRetries: 0-3");
  if (details.length) throw badRequest("Cấu hình AI chưa hợp lệ.", details);

  const config = ctx.store.aiConfig;
  config.model = model;
  config.timeoutMs = timeoutMs;
  config.maxRetries = maxRetries;
  config.version += 1;
  pushAudit(ctx.user!.displayName, "UPDATE", `Cấu hình AI model ${model} v${config.version}`);
  recordActivity("system", "SETTING_UPDATED", ctx.user!.displayName, `Cập nhật cấu hình AI: model ${model}, timeout ${timeoutMs}ms, version ${config.version}.`);
  return config;
}

/* ------------------------------- system status ------------------------------- */

async function systemStatus(ctx: Ctx): Promise<unknown> {
  const s = ctx.store;
  return {
    status: "operational",
    database: { latencyMs: 12, connected: true },
    counts: {
      users: s.users.length,
      sessions: s.sessions.length,
      tasks: s.tasks.length,
      submissions: s.submissions.length,
    },
    githubIntegration: { configured: true, webhookHealthy: true },
    aiRunsLast24h: s.aiRuns,
    learningAlerts: 2,
    services: [
      { name: "API Gateway", status: "healthy", latencyMs: 8 },
      { name: "AI Engine", status: "healthy", latencyMs: 210 },
      { name: "GitHub Sync", status: "healthy", latencyMs: 95 },
      { name: "Notification", status: "degraded", latencyMs: 180 },
    ],
  };
}

/* --------------------------------- settings --------------------------------- */

async function listSettings(ctx: Ctx): Promise<unknown> {
  return ctx.store.settings.map((x) => ({
    key: x.key,
    value: x.isSecret ? "••••••••" : x.value,
    description: x.description,
    isSecret: x.isSecret,
  }));
}

async function patchSetting(ctx: Ctx): Promise<unknown> {
  const key = typeof ctx.body?.key === "string" ? ctx.body.key : "";
  const value = typeof ctx.body?.value === "string" ? ctx.body.value : null;
  if (!key) throw badRequest("Thiếu khóa cấu hình.", ["key: bắt buộc"]);
  if (value == null) throw badRequest("Thiếu giá trị cấu hình.", ["value: bắt buộc"]);
  const setting = ctx.store.settings.find((x) => x.key === key);
  if (!setting) throw notFound("Không tìm thấy khóa cấu hình.");
  setting.value = value;
  pushAudit(ctx.user!.displayName, "UPDATE", `Cấu hình ${key}`);
  return { key: setting.key, value: setting.isSecret ? "••••••••" : setting.value, description: setting.description, isSecret: setting.isSecret };
}

/* --------------------------- activity + audit logs --------------------------- */

async function listActivityEvents(ctx: Ctx): Promise<unknown> {
  const moduleFilter = ctx.query.get("module");
  const search = ctx.query.get("search")?.trim();
  let items = ctx.store.activityEvents.filter((e) => {
    if (moduleFilter && e.module !== moduleFilter) return false;
    if (search && !includesNoAccent(`${e.action} ${e.actorName} ${e.summary}`, search)) return false;
    return true;
  });
  items = items.slice().sort((a, b) => (a.at < b.at ? 1 : -1));
  return pageOf(
    items.map((e) => ({ id: e.id, module: e.module, action: e.action, actorName: e.actorName, summary: e.summary, at: e.at })),
    ctx.query
  );
}

async function listAuditLogs(ctx: Ctx): Promise<unknown> {
  const actor = ctx.query.get("actor")?.trim();
  const action = ctx.query.get("action")?.trim();
  let items = ctx.store.auditLogs.filter((l) => {
    if (actor && !includesNoAccent(l.actorName, actor)) return false;
    if (action && !l.action.toLowerCase().includes(action.toLowerCase())) return false;
    return true;
  });
  items = items.slice().sort((a, b) => (a.at < b.at ? 1 : -1));
  return pageOf(
    items.map((l) => ({ id: l.id, actorName: l.actorName, action: l.action, target: l.target, at: l.at, ip: l.ip })),
    ctx.query
  );
}

export const adminRoutes: RouteDef[] = [
  route("GET", "/admin/dashboard", "admin", dashboard),
  route("GET", "/admin/users", "admin", listUsers),
  route("POST", "/admin/users", "admin", createUser),
  route("PATCH", "/admin/users/:id", "admin", patchUser),
  route("PATCH", "/admin/users/:id/status", "admin", patchUserStatus),
  route("GET", "/admin/question-bank/coverage", "admin", questionCoverage),
  route("GET", "/admin/question-bank", "admin", listQuestionBank),
  route("POST", "/admin/question-bank", "admin", createQuestion),
  route("PUT", "/admin/question-bank/:id", "admin", updateQuestion),
  route("DELETE", "/admin/question-bank/:id", "admin", retireQuestion),
  route("GET", "/admin/ai-configuration", "admin", getAiConfig),
  route("PUT", "/admin/ai-configuration", "admin", putAiConfig),
  route("GET", "/admin/system/status", "admin", systemStatus),
  route("GET", "/admin/settings", "admin", listSettings),
  route("PATCH", "/admin/settings", "admin", patchSetting),
  route("GET", "/admin/activity-events", "admin", listActivityEvents),
  route("GET", "/admin/audit-logs", "admin", listAuditLogs),
];
