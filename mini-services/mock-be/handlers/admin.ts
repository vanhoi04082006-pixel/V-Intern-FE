// handlers/admin.ts — users/RBAC, groups, settings, catalogs, knowledge,
// audit, activity, agents, communications, system, notifications, github, health.
import { db, PERM_CATALOG, INTERN_PERMS } from "../data";
import { json, err, notFound, noContent, paginate, nowIso, nid, matches, findUser } from "../lib";
import type { Ctx, AuthUser } from "../lib";

/* ============================ Users ============================ */

function userDto(u: any) {
  return {
    id: u.id, email: u.email, username: u.username, displayName: u.displayName,
    status: u.status, roles: u.roles, createdAt: u.createdAt,
  };
}

export function listUsers(ctx: Ctx): Response {
  const sp = ctx.url.searchParams;
  const q = sp.get("q") ?? undefined;
  const rows = db.users
    .filter((u) => (!q || matches(u.displayName, q) || matches(u.email, q) || matches(u.username, q)) &&
      (!sp.get("status") || u.status === sp.get("status")))
    .filter((u) => !sp.get("roleCode") || u.roles.includes(sp.get("roleCode")!))
    .map(userDto);
  return json(paginate(rows, ctx.url));
}

export function createUser(ctx: Ctx): Response {
  const b = ctx.body || {};
  if (!b.email || !b.displayName || !b.password) return err(400, "VALIDATION_ERROR", "Thiếu email, displayName hoặc password.");
  if (db.users.some((u) => u.email.toLowerCase() === String(b.email).toLowerCase())) {
    return err(409, "USER_EXISTS", "Email đã tồn tại trong hệ thống.");
  }
  const roleCodes: string[] = Array.isArray(b.roleCodes) && b.roleCodes.length ? b.roleCodes : ["intern"];
  const perms = [...new Set(roleCodes.flatMap((c) => db.rolePermissions[c] ?? []))];
  const u = {
    id: nid("u"), email: String(b.email), username: b.username ?? String(b.email).split("@")[0],
    displayName: String(b.displayName), password: String(b.password), status: "active" as const,
    roles: roleCodes, permissions: perms.length ? perms : [...INTERN_PERMS],
    createdAt: nowIso(),
  };
  db.users.push(u);
  if (u.roles.includes("intern")) {
    db.recruitmentStates.push({ userId: u.id, status: "not_started", selectedRole: null, attemptsUsed: 0, maxAttempts: 3, cooldownUntil: null, latestResult: null });
  }
  return json(userDto(u), 201);
}

export function patchUser(ctx: Ctx): Response {
  const u = db.users.find((x) => x.id === ctx.params.id);
  if (!u) return notFound();
  const b = ctx.body || {};
  for (const k of ["email", "username", "displayName"]) if (b[k] !== undefined) (u as any)[k] = b[k];
  return json(userDto(u));
}

export function patchUserStatus(ctx: Ctx): Response {
  const u = db.users.find((x) => x.id === ctx.params.id);
  if (!u) return notFound();
  const status = ctx.body?.status;
  if (!["active", "inactive", "pending"].includes(status)) {
    return err(400, "VALIDATION_ERROR", "Trạng thái không hợp lệ (active | inactive | pending).");
  }
  u.status = status;
  db.auditLogs.push({ id: nid("al"), actorId: ctx.user!.id, actorName: ctx.user!.displayName, action: "user.status_changed", module: "users", createdAt: nowIso() });
  return json(userDto(u));
}

/* ============================ Roles & permissions ============================ */

export function listRoles(ctx: Ctx): Response {
  return json(paginate(db.roles, ctx.url));
}

export function listPermissions(ctx: Ctx): Response {
  return json(paginate(PERM_CATALOG, ctx.url));
}

export function rolePermissions(ctx: Ctx): Response {
  const role = db.roles.find((r) => r.id === ctx.params.id);
  if (!role) return notFound();
  return json(db.rolePermissions[role.code] ?? []);
}

/* ============================ Groups ============================ */

export function listGroups(ctx: Ctx): Response {
  const q = ctx.url.searchParams.get("q") ?? undefined;
  const rows = db.groups.filter((g) => !q || matches(g.name, q) || matches(g.code, q));
  return json(paginate(rows, ctx.url));
}

export function createGroup(ctx: Ctx): Response {
  const b = ctx.body || {};
  if (!b.code || !b.name) return err(400, "VALIDATION_ERROR", "Thiếu mã hoặc tên nhóm.");
  const g = { id: nid("g"), code: String(b.code), name: String(b.name), memberIds: [], createdAt: nowIso() };
  db.groups.push(g);
  return json(g, 201);
}

export function addGroupMembers(ctx: Ctx): Response {
  const g = db.groups.find((x) => x.id === ctx.params.id);
  if (!g) return notFound();
  const ids: string[] = Array.isArray(ctx.body?.userIds) ? ctx.body.userIds : [];
  let added = 0;
  for (const id of ids) if (!g.memberIds.includes(id)) { g.memberIds.push(id); added++; }
  return json({ added, total: g.memberIds.length });
}

export function removeGroupMember(ctx: Ctx): Response {
  const g = db.groups.find((x) => x.id === ctx.params.id);
  if (!g) return notFound();
  const idx = g.memberIds.indexOf(ctx.params.userId);
  if (idx >= 0) g.memberIds.splice(idx, 1);
  return json({ removed: idx >= 0 });
}

/* ============================ Settings ============================ */

export function listSettings(_ctx: Ctx): Response {
  return json(db.settings);
}

export function upsertSetting(ctx: Ctx): Response {
  const { key, value } = ctx.body || {};
  if (!key || value === undefined) return err(400, "VALIDATION_ERROR", "Thiếu key hoặc value.");
  const s = db.settings.find((x) => x.key === key);
  if (s) s.value = String(value);
  else db.settings.push({ key: String(key), value: String(value), description: "" });
  return json({ key, value: String(value) });
}

/* ============================ Catalogs ============================ */

export function listCatalogTypes(_ctx: Ctx): Response {
  return json(db.catalogTypes);
}

export function createCatalogType(ctx: Ctx): Response {
  const b = ctx.body || {};
  if (!b.code || !b.name) return err(400, "VALIDATION_ERROR", "Thiếu mã hoặc tên loại danh mục.");
  const t = { id: nid("ct"), code: String(b.code), name: String(b.name) };
  db.catalogTypes.push(t);
  return json(t, 201);
}

export function listCatalogItems(ctx: Ctx): Response {
  const typeCode = ctx.url.searchParams.get("typeCode");
  const rows = db.catalogItems.filter((i) => !typeCode || i.typeCode === typeCode);
  return json(paginate(rows, ctx.url));
}

export function createCatalogItem(ctx: Ctx): Response {
  const b = ctx.body || {};
  if (!b.typeCode || !b.code || !b.name) return err(400, "VALIDATION_ERROR", "Thiếu typeCode, code hoặc name.");
  const i = { id: nid("ci"), typeCode: String(b.typeCode), code: String(b.code), name: String(b.name), version: 1 };
  db.catalogItems.push(i);
  return json(i, 201);
}

export function patchCatalogItem(ctx: Ctx): Response {
  const i = db.catalogItems.find((x) => x.id === ctx.params.id);
  if (!i) return notFound();
  const b = ctx.body || {};
  if (b.version !== undefined && b.version !== i.version) return err(409, "VERSION_CONFLICT", "Mục danh mục đã bị cập nhật.");
  for (const k of ["code", "name", "typeCode"]) if (b[k] !== undefined) (i as any)[k] = b[k];
  i.version += 1;
  return json(i);
}

/* ============================ Knowledge ============================ */

export function listKnowledge(ctx: Ctx): Response {
  const q = ctx.url.searchParams.get("q") ?? undefined;
  const rows = db.knowledge
    .filter((k) => !q || matches(k.title, q) || matches(k.code, q))
    .map((k) => ({ id: k.id, code: k.code, title: k.title, status: k.status, version: k.version, updatedAt: k.updatedAt }));
  return json(paginate(rows, ctx.url));
}

export function createKnowledge(ctx: Ctx): Response {
  const b = ctx.body || {};
  if (!b.code || !b.draft?.title) return err(400, "VALIDATION_ERROR", "Thiếu code hoặc draft.title.");
  const k = {
    id: nid("kb"), code: String(b.code), title: String(b.draft.title), status: "draft" as const, version: 1,
    draft: { title: String(b.draft.title), body: String(b.draft.body ?? "") },
    publishedAt: null, updatedAt: nowIso(), createdAt: nowIso(),
  };
  db.knowledge.push(k);
  return json(k, 201);
}

export function updateKnowledge(ctx: Ctx): Response {
  const k = db.knowledge.find((x) => x.code === ctx.params.code);
  if (!k) return notFound();
  const b = ctx.body || {};
  if (b.version !== undefined && b.version !== k.version) return err(409, "VERSION_CONFLICT", "Bài viết đã bị cập nhật bởi người khác.");
  if (b.draft) {
    k.draft = { title: String(b.draft.title ?? k.draft.title), body: String(b.draft.body ?? k.draft.body) };
    k.title = k.draft.title;
  }
  k.version += 1;
  k.updatedAt = nowIso();
  return json(k);
}

export function publishKnowledge(ctx: Ctx): Response {
  const k = db.knowledge.find((x) => x.code === ctx.params.code);
  if (!k) return notFound();
  const b = ctx.body || {};
  if (b.version !== undefined && b.version !== k.version) return err(409, "VERSION_CONFLICT", "Bài viết đã bị cập nhật.");
  k.status = "published";
  k.publishedAt = nowIso();
  k.version += 1;
  k.updatedAt = nowIso();
  return json(k);
}

/* ============================ Audit & activity ============================ */

export function listAuditLogs(ctx: Ctx): Response {
  const action = ctx.url.searchParams.get("action");
  const rows = db.auditLogs
    .filter((a) => !action || a.action === action)
    .map((a) => ({ id: a.id, actor: { displayName: a.actorName }, action: a.action, createdAt: a.createdAt }));
  return json(paginate(rows, ctx.url));
}

export function listActivityEvents(ctx: Ctx): Response {
  const module = ctx.url.searchParams.get("module");
  const rows = db.activityEvents
    .filter((a) => !module || a.module === module)
    .map((a) => ({ id: a.id, actor: { displayName: a.actorName }, action: a.action, createdAt: a.createdAt }));
  return json(paginate(rows, ctx.url));
}

/* ============================ Agents ============================ */

export function createAgentRun(ctx: Ctx): Response {
  const b = ctx.body || {};
  if (!b.requestId || !b.question) return err(400, "VALIDATION_ERROR", "Thiếu requestId hoặc question.");
  const run = {
    id: nid("ar"), requestId: String(b.requestId), question: String(b.question),
    roleCode: b.roleCode ?? null, status: "running" as const, result: null, createdAt: nowIso(),
  };
  db.agentRuns.push(run);
  return json({ id: run.id, requestId: run.requestId, question: run.question, status: run.status }, 202);
}

export function getAgentRun(ctx: Ctx): Response {
  const run = db.agentRuns.find((r) => r.id === ctx.params.id);
  if (!run) return notFound();
  return json({
    id: run.id, requestId: run.requestId, question: run.question, roleCode: run.roleCode,
    status: "completed",
    result: `Câu trả lời mẫu (AI agent): Về câu hỏi "${run.question}" — theo quy chế V-Intern, học viên cần hoàn thành tối thiểu 80% khối lượng công việc của sprint và đạt điểm đánh giá ≥ 5/10 để được xét cấp chứng chỉ.`,
    createdAt: run.createdAt,
  });
}

export function cancelAgentRun(ctx: Ctx): Response {
  const run = db.agentRuns.find((r) => r.id === ctx.params.id);
  if (!run) return notFound();
  run.status = "cancelled";
  return json({ id: run.id, status: run.status });
}

export function resumeAgentRun(ctx: Ctx): Response {
  const run = db.agentRuns.find((r) => r.id === ctx.params.id);
  if (!run) return notFound();
  run.status = "running";
  return json({ id: run.id, status: run.status });
}

/* ============================ Communications ============================ */

export function listCommunications(ctx: Ctx): Response {
  const rows = db.communications.map((c) => ({ id: c.id, recipient: c.recipient, subject: c.subject, status: c.status, createdAt: c.createdAt }));
  return json(paginate(rows, ctx.url));
}

export function resendCommunication(ctx: Ctx): Response {
  const c = db.communications.find((x) => x.id === ctx.params.id);
  if (!c) return notFound();
  c.status = "sent";
  return json({ id: c.id, status: c.status, resent: true });
}

/* ============================ System ============================ */

export function systemStatus(_ctx: Ctx): Response {
  return json({
    userCount: db.users.length,
    sessionCount: db.sessions.length,
    questionCount: db.questionBank.length,
    templateCount: db.evaluationCycles.reduce((s, c) => s + c.criteria.length, 0),
    aiRunsLast24h: 12,
    githubConfigured: true,
  });
}

/* ============================ Notifications ============================ */

function myNotifications(userId: string) {
  return db.notifications.filter((n) => n.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listNotifications(ctx: Ctx): Response {
  let rows = myNotifications(ctx.user!.id);
  if (ctx.url.searchParams.get("unread") === "true" || ctx.url.searchParams.get("unread") === "1") {
    rows = rows.filter((n) => !n.read);
  }
  return json(paginate(rows, ctx.url));
}

export function unreadCount(ctx: Ctx): Response {
  return json({ count: myNotifications(ctx.user!.id).filter((n) => !n.read).length });
}

export function markRead(ctx: Ctx): Response {
  const n = db.notifications.find((x) => x.id === ctx.params.id && x.userId === ctx.user!.id);
  if (!n) return notFound();
  n.read = true;
  return noContent();
}

export function markAllRead(ctx: Ctx): Response {
  const rows = db.notifications.filter((n) => n.userId === ctx.user!.id && !n.read);
  rows.forEach((n) => (n.read = true));
  return json({ updated: rows.length });
}

function prefsFor(userId: string): Record<string, boolean> {
  if (!db.notificationPrefs[userId]) db.notificationPrefs[userId] = { general: true, evaluation: true, deadline: true };
  return db.notificationPrefs[userId];
}

export function notificationPreferences(ctx: Ctx): Response {
  return json({ preferences: prefsFor(ctx.user!.id) });
}

export function updateNotificationPreferences(ctx: Ctx): Response {
  const prefs = prefsFor(ctx.user!.id);
  const { category, enabled } = ctx.body || {};
  if (!category || typeof enabled !== "boolean") return err(400, "VALIDATION_ERROR", "Thiếu category hoặc enabled.");
  prefs[String(category)] = enabled;
  return json({ preferences: prefs });
}

/* ============================ GitHub ============================ */

function githubAccountFor(userId: string) {
  const user = findUser(userId);
  if (user?.githubConnected) return { connected: true, login: user.githubLogin ?? null };
  if (db.githubAccounts[userId]) return db.githubAccounts[userId];
  return { connected: false, login: null };
}

export function githubMe(ctx: Ctx): Response {
  return json(githubAccountFor(ctx.user!.id));
}

export function githubConnect(ctx: Ctx): Response {
  return json({ authorizeUrl: "https://github.com/login/oauth/authorize?client_id=demo" });
}

export function githubDisconnect(ctx: Ctx): Response {
  const user = findUser(ctx.user!.id);
  if (user) { user.githubConnected = false; user.githubLogin = null; }
  db.githubAccounts[ctx.user!.id] = { connected: false, login: null };
  return noContent();
}

export function githubRepositoryAccount(_ctx: Ctx): Response {
  return json({ ...db.githubRepoAccount });
}

export function setGithubRepositoryAccount(ctx: Ctx): Response {
  const b = ctx.body || {};
  if (b.selected !== undefined) db.githubRepoAccount.selected = !!b.selected;
  if (b.login !== undefined) db.githubRepoAccount.login = String(b.login);
  return json({ ...db.githubRepoAccount });
}

/* ============================ Health (PUBLIC) ============================ */

const startedAt = Date.now();

export function health(_ctx: Ctx): Response {
  return json({
    status: "ok",
    checks: { backend: "up", database: "up", ai: "unavailable" },
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    timestamp: nowIso(),
  });
}
