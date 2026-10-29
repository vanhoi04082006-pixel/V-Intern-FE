// handlers/staff.ts — sprints, sessions, classes, projects, assignments,
// dashboards, performance and reports.
import { db } from "../data";
import { json, err, notFound, paginate, nowIso, nid, userName, matches, isTrue } from "../lib";
import type { Ctx } from "../lib";
import { buildPdf, buildXlsx } from "../pdf";

/* ============================ Sprints ============================ */

const SPRINT_TRANSITIONS: Record<string, string[]> = {
  planned: ["active", "cancelled"],
  active: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function listSprints(ctx: Ctx): Response {
  const sp = ctx.url.searchParams;
  const search = sp.get("search") ?? sp.get("q") ?? undefined;
  const rows = db.sprints.filter((s) =>
    (!sp.get("projectId") || s.projectId === sp.get("projectId")) &&
    (!sp.get("sessionId") || s.sessionId === sp.get("sessionId")) &&
    (!sp.get("status") || s.status === sp.get("status")) &&
    (!search || matches(s.name, search) || matches(s.code, search) || matches(s.goal, search)));
  return json(paginate(rows, ctx.url));
}

export function createSprint(ctx: Ctx): Response {
  const b = ctx.body || {};
  if (!b.code || !b.name || !b.projectId || !b.sessionId || !b.startDate || !b.endDate) {
    return err(400, "VALIDATION_ERROR", "Thiếu thông tin sprint (code, name, projectId, sessionId, startDate, endDate).");
  }
  const s = {
    id: nid("sp"), code: String(b.code), name: String(b.name), goal: String(b.goal ?? ""),
    projectId: String(b.projectId), sessionId: String(b.sessionId), status: "planned" as const,
    startDate: String(b.startDate), endDate: String(b.endDate), version: 1, createdAt: nowIso(),
  };
  db.sprints.push(s);
  return json(s, 201);
}

export function patchSprint(ctx: Ctx): Response {
  const s = db.sprints.find((x) => x.id === ctx.params.id);
  if (!s) return notFound();
  const b = ctx.body || {};
  if (b.expectedVersion !== undefined && b.expectedVersion !== s.version) {
    return err(409, "VERSION_CONFLICT", "Sprint đã bị cập nhật bởi người khác.");
  }
  if (b.status && b.status !== s.status && !SPRINT_TRANSITIONS[s.status].includes(b.status)) {
    return err(400, "INVALID_TRANSITION", `Không thể chuyển sprint từ ${s.status} sang ${b.status}.`);
  }
  for (const k of ["code", "name", "goal", "projectId", "sessionId", "status", "startDate", "endDate"]) {
    if (b[k] !== undefined) (s as any)[k] = b[k];
  }
  s.version += 1;
  return json(s);
}

export function sprintStatus(ctx: Ctx): Response {
  const s = db.sprints.find((x) => x.id === ctx.params.id);
  if (!s) return notFound();
  const b = ctx.body || {};
  const target = b.status;
  if (!target || !SPRINT_TRANSITIONS[s.status].includes(target)) {
    return err(400, "INVALID_TRANSITION", `Không thể chuyển sprint từ ${s.status} sang ${target ?? "(trống)"}.`);
  }
  if (target === "completed") {
    const openTasks = db.tasks.filter((t) => t.sprintId === s.id && !t.deleted && t.status !== "done");
    if (openTasks.length > 0 && b.allowOpenTasks !== true) {
      return err(400, "OPEN_TASKS_EXIST", `Sprint còn ${openTasks.length} nhiệm vụ chưa hoàn thành. Truyền allowOpenTasks=true để bỏ qua.`);
    }
  }
  s.status = target;
  s.version += 1;
  return json(s);
}

function boardColumns(tasks: any[]) {
  return (["todo", "doing", "review", "done"] as const).map((status) => ({
    status, count: tasks.filter((t) => t.status === status).length,
  }));
}

export function sprintBoard(ctx: Ctx): Response {
  const s = db.sprints.find((x) => x.id === ctx.params.id);
  if (!s) return notFound();
  let tasks = db.tasks.filter((t) => t.sprintId === s.id && !t.deleted);
  const status = ctx.url.searchParams.get("status");
  if (status) tasks = tasks.filter((t) => t.status === status);
  return json({
    columns: boardColumns(db.tasks.filter((t) => t.sprintId === s.id && !t.deleted)),
    tasks: tasks.map((t) => ({
      id: t.id, title: t.title, description: t.description, status: t.status, priority: t.priority,
      storyPoints: t.storyPoints, dueDate: t.dueDate, version: t.version, progress: t.progress,
      assigneeId: t.assigneeId, assignee: t.assigneeId ? { displayName: userName(t.assigneeId) } : null,
    })),
  });
}

export function sprintCompletion(ctx: Ctx): Response {
  const s = db.sprints.find((x) => x.id === ctx.params.id);
  if (!s) return notFound();
  const tasks = db.tasks.filter((t) => t.sprintId === s.id && !t.deleted);
  const done = tasks.filter((t) => t.status === "done");
  return json({
    totalTasks: tasks.length,
    doneTasks: done.length,
    openTasks: tasks.length - done.length,
    totalStoryPoints: tasks.reduce((a, t) => a + t.storyPoints, 0),
    doneStoryPoints: done.reduce((a, t) => a + t.storyPoints, 0),
  });
}

export function sprintBurndown(ctx: Ctx): Response {
  const s = db.sprints.find((x) => x.id === ctx.params.id);
  if (!s) return notFound();
  const tasks = db.tasks.filter((t) => t.sprintId === s.id && !t.deleted);
  const total = tasks.reduce((a, t) => a + t.storyPoints, 0);
  const done = tasks.filter((t) => t.status === "done").reduce((a, t) => a + t.storyPoints, 0);
  const remainingSp = total - done;
  const start = new Date(`${s.startDate}T00:00:00.000Z`).getTime();
  const days = 10;
  const points = Array.from({ length: days }, (_, i) => {
    const d = new Date(start + i * 86400000).toISOString().slice(0, 10);
    const remaining = Math.max(0, Math.round(total - (total - remainingSp) * (i / (days - 1))));
    return { date: d, remaining };
  });
  return json({ points });
}

/* ============================ Sessions ============================ */

const SESSION_TRANSITIONS: Record<string, string[]> = {
  planned: ["active"], active: ["completed"], completed: [],
};

function sessionDto(s: any) {
  return {
    id: s.id, code: s.code, name: s.name, description: s.description, status: s.status,
    leadInstructor: { displayName: userName(s.leadInstructorId) },
    startDate: s.startDate, endDate: s.endDate,
    internCount: s.memberIds.length, projectCount: s.projectIds.length, version: s.version,
  };
}

export function listSessions(ctx: Ctx): Response {
  const sp = ctx.url.searchParams;
  const q = sp.get("q") ?? undefined;
  const rows = db.sessions.filter((s) =>
    (!q || matches(s.name, q) || matches(s.code, q) || matches(s.description, q)) &&
    (!sp.get("status") || s.status === sp.get("status")) &&
    (!sp.get("projectId") || s.projectIds.includes(sp.get("projectId")!)));
  return json(paginate(rows.map(sessionDto), ctx.url));
}

export function createSession(ctx: Ctx): Response {
  const b = ctx.body || {};
  if (!b.code || !b.name) return err(400, "VALIDATION_ERROR", "Thiếu mã hoặc tên phiên thực tập.");
  const s = {
    id: nid("s"), code: String(b.code), name: String(b.name), description: String(b.description ?? ""),
    status: "planned" as const, leadInstructorId: b.leadInstructorId ?? ctx.user!.id,
    startDate: b.startDate ?? null, endDate: b.endDate ?? null,
    memberIds: [], instructorIds: [b.leadInstructorId ?? ctx.user!.id], projectIds: [],
    version: 1, createdAt: nowIso(),
    milestones: [], timeline: [{ id: nid("tl"), kind: "session.created", title: "Phiên thực tập được tạo", actorName: ctx.user!.displayName, createdAt: nowIso() }],
    github: { connected: false, repositoryUrl: "", invitationPending: 0, members: [] },
    participation: { incidents: [], policy: null },
  };
  db.sessions.push(s);
  return json(sessionDto(s), 201);
}

export function getSession(ctx: Ctx): Response {
  const s = db.sessions.find((x) => x.id === ctx.params.id);
  if (!s) return notFound();
  return json(sessionDto(s));
}

export function patchSession(ctx: Ctx): Response {
  const s = db.sessions.find((x) => x.id === ctx.params.id);
  if (!s) return notFound();
  const b = ctx.body || {};
  if (b.expectedVersion !== undefined && b.expectedVersion !== s.version) {
    return err(409, "VERSION_CONFLICT", "Phiên thực tập đã bị cập nhật bởi người khác.");
  }
  if (b.status && b.status !== s.status) {
    if (!SESSION_TRANSITIONS[s.status].includes(b.status)) {
      return err(400, "INVALID_TRANSITION", `Không thể chuyển phiên từ ${s.status} sang ${b.status}.`);
    }
    s.timeline.push({ id: nid("tl"), kind: "status.changed", title: `Chuyển trạng thái phiên sang ${b.status}`, actorName: ctx.user!.displayName, createdAt: nowIso() });
  }
  for (const k of ["code", "name", "description", "status", "leadInstructorId", "startDate", "endDate"]) {
    if (b[k] !== undefined) (s as any)[k] = b[k];
  }
  s.version += 1;
  return json(sessionDto(s));
}

export function sessionMembers(ctx: Ctx): Response {
  const s = db.sessions.find((x) => x.id === ctx.params.id);
  if (!s) return notFound();
  const rows = s.memberIds.map((id) => {
    const u = db.users.find((x) => x.id === id);
    return { userId: id, displayName: u?.displayName ?? "", email: u?.email ?? "", roleName: "intern" };
  });
  return json(paginate(rows, ctx.url));
}

export function addSessionMembers(ctx: Ctx): Response {
  const s = db.sessions.find((x) => x.id === ctx.params.id);
  if (!s) return notFound();
  const ids: string[] = Array.isArray(ctx.body?.userIds) ? ctx.body.userIds : [];
  let added = 0;
  for (const id of ids) {
    if (!s.memberIds.includes(id)) { s.memberIds.push(id); added++; }
    s.timeline.push({ id: nid("tl"), kind: "member.added", title: `Thêm học viên ${userName(id)} vào phiên`, actorName: ctx.user!.displayName, createdAt: nowIso() });
  }
  s.version += 1;
  return json({ added, total: s.memberIds.length });
}

export function removeSessionMember(ctx: Ctx): Response {
  const s = db.sessions.find((x) => x.id === ctx.params.id);
  if (!s) return notFound();
  const idx = s.memberIds.indexOf(ctx.params.userId);
  if (idx >= 0) s.memberIds.splice(idx, 1);
  s.timeline.push({ id: nid("tl"), kind: "member.removed", title: `Xoá học viên ${userName(ctx.params.userId)} khỏi phiên`, actorName: ctx.user!.displayName, createdAt: nowIso() });
  return json({ removed: idx >= 0 });
}

export function sessionInstructors(ctx: Ctx): Response {
  const s = db.sessions.find((x) => x.id === ctx.params.id);
  if (!s) return notFound();
  const rows = s.instructorIds.map((id) => {
    const u = db.users.find((x) => x.id === id);
    return { userId: id, displayName: u?.displayName ?? "", email: u?.email ?? "" };
  });
  return json(paginate(rows, ctx.url));
}

export function addSessionInstructors(ctx: Ctx): Response {
  const s = db.sessions.find((x) => x.id === ctx.params.id);
  if (!s) return notFound();
  const ids: string[] = Array.isArray(ctx.body?.instructorIds) ? ctx.body.instructorIds : [];
  let added = 0;
  for (const id of ids) if (!s.instructorIds.includes(id)) { s.instructorIds.push(id); added++; }
  return json({ added, total: s.instructorIds.length });
}

export function sessionMilestones(ctx: Ctx): Response {
  const s = db.sessions.find((x) => x.id === ctx.params.id);
  if (!s) return notFound();
  return json(paginate(s.milestones, ctx.url));
}

export function addSessionMilestone(ctx: Ctx): Response {
  const s = db.sessions.find((x) => x.id === ctx.params.id);
  if (!s) return notFound();
  const b = ctx.body || {};
  if (!b.name) return err(400, "VALIDATION_ERROR", "Thiếu tên cột mốc.");
  const ms = { id: nid("ms"), name: String(b.name), dueDate: b.dueDate ?? null, completed: !!b.completed };
  s.milestones.push(ms);
  return json(ms, 201);
}

export function instructorOptions(ctx: Ctx): Response {
  const q = ctx.url.searchParams.get("q") ?? undefined;
  const rows = db.users
    .filter((u) => u.roles.includes("instructor") || u.roles.includes("admin"))
    .filter((u) => !q || matches(u.displayName, q) || matches(u.email, q))
    .map((u) => ({ id: u.id, displayName: u.displayName, email: u.email }));
  return json(rows);
}

export function memberOptions(ctx: Ctx): Response {
  const sp = ctx.url.searchParams;
  const q = sp.get("q") ?? undefined;
  const sessionId = sp.get("sessionId");
  const projectId = sp.get("projectId");
  let users = db.users.filter((u) => u.roles.includes("intern"));
  if (projectId) {
    const assigned = new Set(db.assignments.filter((a) => a.projectId === projectId && a.status === "active").map((a) => a.internId));
    users = users.filter((u) => assigned.has(u.id));
  }
  if (sessionId) {
    const sess = db.sessions.find((s) => s.id === sessionId);
    if (sess) users = users.filter((u) => !sess.memberIds.includes(u.id)); // suggest non-members
  }
  const rows = users
    .filter((u) => !q || matches(u.displayName, q) || matches(u.email, q))
    .map((u) => ({ id: u.id, displayName: u.displayName, email: u.email }));
  return json(rows);
}

export function sessionTimeline(ctx: Ctx): Response {
  const s = db.sessions.find((x) => x.id === ctx.params.id);
  if (!s) return notFound();
  return json(paginate(s.timeline, ctx.url));
}

export function sessionGithub(ctx: Ctx): Response {
  const s = db.sessions.find((x) => x.id === ctx.params.id);
  if (!s) return notFound();
  return json(s.github);
}

export function sessionGithubProvision(ctx: Ctx): Response {
  const s = db.sessions.find((x) => x.id === ctx.params.id);
  if (!s) return notFound();
  s.github.connected = true;
  if (!s.github.repositoryUrl) s.github.repositoryUrl = `https://github.com/v-intern/session-${s.id}`;
  s.timeline.push({ id: nid("tl"), kind: "github.connected", title: "Cấp phát kho mã GitHub cho phiên", actorName: ctx.user!.displayName, createdAt: nowIso() });
  return json({});
}

export function sessionGithubInvite(ctx: Ctx): Response {
  const s = db.sessions.find((x) => x.id === ctx.params.id);
  if (!s) return notFound();
  s.github.invitationPending = s.github.members.filter((m) => m.status === "invited").length;
  return json({});
}

export function sessionParticipation(ctx: Ctx): Response {
  const s = db.sessions.find((x) => x.id === ctx.params.id);
  if (!s) return notFound();
  return json(s.participation);
}

export function sessionParticipationRefresh(ctx: Ctx): Response {
  const s = db.sessions.find((x) => x.id === ctx.params.id);
  if (!s) return notFound();
  return json({ refreshed: true, incidentCount: s.participation.incidents.length });
}

/* ============================ Classes ============================ */

export function listClasses(ctx: Ctx): Response {
  const sp = ctx.url.searchParams;
  const q = sp.get("q") ?? undefined;
  const rows = db.classes.filter((c) =>
    (!q || matches(c.name, q) || matches(c.code, q)) &&
    (!sp.get("status") || c.status === sp.get("status")));
  return json(paginate(rows, ctx.url));
}

export function createClass(ctx: Ctx): Response {
  const b = ctx.body || {};
  if (!b.code || !b.name) return err(400, "VALIDATION_ERROR", "Thiếu mã hoặc tên lớp học.");
  const c = {
    id: nid("c"), code: String(b.code), name: String(b.name), sessionId: b.sessionId ?? null,
    status: "active", memberIds: [], lessons: [], version: 1, createdAt: nowIso(),
  };
  db.classes.push(c);
  return json(c, 201);
}

export function classMembers(ctx: Ctx): Response {
  const c = db.classes.find((x) => x.id === ctx.params.id);
  if (!c) return notFound();
  const rows = c.memberIds.map((id) => {
    const u = db.users.find((x) => x.id === id);
    return { userId: id, displayName: u?.displayName ?? "", email: u?.email ?? "", roleName: "intern" };
  });
  return json(paginate(rows, ctx.url));
}

export function addClassMembers(ctx: Ctx): Response {
  const c = db.classes.find((x) => x.id === ctx.params.id);
  if (!c) return notFound();
  const ids: string[] = Array.isArray(ctx.body?.userIds) ? ctx.body.userIds : [];
  let added = 0;
  for (const id of ids) if (!c.memberIds.includes(id)) { c.memberIds.push(id); added++; }
  return json({ added, total: c.memberIds.length });
}

export function removeClassMember(ctx: Ctx): Response {
  const c = db.classes.find((x) => x.id === ctx.params.id);
  if (!c) return notFound();
  const idx = c.memberIds.indexOf(ctx.params.userId);
  if (idx >= 0) c.memberIds.splice(idx, 1);
  return json({ removed: idx >= 0 });
}

export function classLessons(ctx: Ctx): Response {
  const c = db.classes.find((x) => x.id === ctx.params.id);
  if (!c) return notFound();
  const rows = c.lessons.map((l) => ({
    id: l.id, title: l.title, startsAt: l.startsAt, attendanceCount: Object.values(l.attendance).filter(Boolean).length,
  }));
  return json(paginate(rows, ctx.url));
}

export function createLesson(ctx: Ctx): Response {
  const c = db.classes.find((x) => x.id === ctx.params.id);
  if (!c) return notFound();
  const b = ctx.body || {};
  if (!b.title) return err(400, "VALIDATION_ERROR", "Thiếu tiêu đề buổi học.");
  const l = { id: nid("ls"), title: String(b.title), startsAt: b.startsAt ?? nowIso(), attendance: {} };
  c.lessons.push(l);
  return json({ id: l.id, title: l.title, startsAt: l.startsAt, attendanceCount: 0 }, 201);
}

export function lessonAttendance(ctx: Ctx): Response {
  const c = db.classes.find((x) => x.id === ctx.params.id);
  if (!c) return notFound();
  const lesson = c.lessons.find((l) => l.id === ctx.params.lessonId);
  if (!lesson) return notFound();
  const rows = c.memberIds.map((id) => ({
    userId: id, displayName: userName(id), present: lesson.attendance[id] === true,
  }));
  return json(rows);
}

export function updateLessonAttendance(ctx: Ctx): Response {
  const c = db.classes.find((x) => x.id === ctx.params.id);
  if (!c) return notFound();
  const lesson = c.lessons.find((l) => l.id === ctx.params.lessonId);
  if (!lesson) return notFound();
  const records: { userId: string; present: boolean }[] = ctx.body?.records ?? [];
  for (const r of records) lesson.attendance[r.userId] = !!r.present;
  return json({ updated: records.length, attendanceCount: Object.values(lesson.attendance).filter(Boolean).length });
}

/* ============================ Projects ============================ */

export function listProjects(ctx: Ctx): Response {
  const sp = ctx.url.searchParams;
  const q = sp.get("q") ?? undefined;
  const rows = db.projects.filter((p) =>
    (!q || matches(p.name, q) || matches(p.code, q) || matches(p.description, q)) &&
    (!sp.get("status") || p.status === sp.get("status")) &&
    (!sp.get("difficulty") || p.difficulty === sp.get("difficulty")) &&
    (!sp.get("technology") || p.technologies.some((t) => t.toLowerCase() === sp.get("technology")!.toLowerCase())));
  return json(paginate(rows, ctx.url));
}

export function projectFilterOptions(_ctx: Ctx): Response {
  return json({
    difficulties: ["beginner", "intermediate", "advanced"],
    technologies: [...new Set(db.projects.flatMap((p) => p.technologies))].sort(),
    domainCategories: [...new Set(db.projects.map((p) => p.domainCategory))].sort(),
  });
}

export function createProject(ctx: Ctx): Response {
  const b = ctx.body || {};
  if (!b.code || !b.name) return err(400, "VALIDATION_ERROR", "Thiếu mã hoặc tên dự án.");
  const p = {
    id: nid("p"), code: String(b.code), name: String(b.name), description: String(b.description ?? ""),
    domainCategory: b.domainCategory ?? "internal", difficulty: b.difficulty ?? "intermediate",
    status: b.status ?? "active", mentorId: b.mentorId ?? null, capacity: b.capacity ?? 5,
    startDate: b.startDate ?? null, endDate: b.endDate ?? null,
    technologies: Array.isArray(b.technologies) ? b.technologies : [], sessionId: null,
    version: 1, createdAt: nowIso(),
  };
  db.projects.push(p);
  return json(p, 201);
}

export function getProject(ctx: Ctx): Response {
  const p = db.projects.find((x) => x.id === ctx.params.id);
  if (!p) return notFound();
  return json(p);
}

export function patchProject(ctx: Ctx): Response {
  const p = db.projects.find((x) => x.id === ctx.params.id);
  if (!p) return notFound();
  const b = ctx.body || {};
  if (b.expectedVersion !== undefined && b.expectedVersion !== p.version) {
    return err(409, "VERSION_CONFLICT", "Dự án đã bị cập nhật bởi người khác.");
  }
  for (const k of ["code", "name", "description", "domainCategory", "difficulty", "status", "mentorId", "capacity", "startDate", "endDate", "technologies", "sessionId"]) {
    if (b[k] !== undefined) (p as any)[k] = b[k];
  }
  p.version += 1;
  return json(p);
}

export function projectMembers(ctx: Ctx): Response {
  const p = db.projects.find((x) => x.id === ctx.params.id);
  if (!p) return notFound();
  const rows: { userId: string; displayName: string; email: string; roleName: string }[] = [];
  if (p.mentorId) {
    const m = db.users.find((u) => u.id === p.mentorId);
    if (m) rows.push({ userId: m.id, displayName: m.displayName, email: m.email, roleName: "mentor" });
  }
  for (const a of db.assignments.filter((a) => a.projectId === p.id && a.status === "active")) {
    const u = db.users.find((x) => x.id === a.internId);
    if (u) rows.push({ userId: u.id, displayName: u.displayName, email: u.email, roleName: a.role });
  }
  return json(paginate(rows, ctx.url));
}

export function projectSessions(ctx: Ctx): Response {
  const p = db.projects.find((x) => x.id === ctx.params.id);
  if (!p) return notFound();
  const rows = db.sessions.filter((s) => s.projectIds.includes(p.id)).map(sessionDto);
  return json(paginate(rows, ctx.url));
}

/* ============================ Assignments ============================ */

function assignmentDto(a: any) {
  const intern = db.users.find((u) => u.id === a.internId);
  const project = db.projects.find((p) => p.id === a.projectId);
  const session = db.sessions.find((s) => s.id === a.sessionId);
  return {
    id: a.id, intern: { displayName: intern?.displayName ?? "" }, internId: a.internId,
    project: { name: project?.name ?? "" }, projectId: a.projectId,
    session: { name: session?.name ?? "" }, sessionId: a.sessionId,
    status: a.status, role: a.role, createdAt: a.createdAt,
  };
}

export function listAssignments(ctx: Ctx): Response {
  const sp = ctx.url.searchParams;
  const rows = db.assignments.filter((a) =>
    (!sp.get("internId") || a.internId === sp.get("internId")) &&
    (!sp.get("sessionId") || a.sessionId === sp.get("sessionId")) &&
    (!sp.get("projectId") || a.projectId === sp.get("projectId")) &&
    (!sp.get("status") || a.status === sp.get("status")));
  return json(paginate(rows.map(assignmentDto), ctx.url));
}

export function createAssignment(ctx: Ctx): Response {
  const b = ctx.body || {};
  if (!b.internId || !b.projectId || !b.sessionId) {
    return err(400, "VALIDATION_ERROR", "Thiếu internId, projectId hoặc sessionId.");
  }
  if (db.assignments.some((a) => a.internId === b.internId && a.status === "active")) {
    return err(409, "ASSIGNMENT_CONFLICT", "Học viên này đang có phân công còn hiệu lực.");
  }
  const a = {
    id: nid("a"), internId: String(b.internId), projectId: String(b.projectId),
    sessionId: String(b.sessionId), status: "active" as const, role: b.role ?? "developer", createdAt: nowIso(),
  };
  db.assignments.push(a);
  const session = db.sessions.find((s) => s.id === a.sessionId);
  if (session && !session.memberIds.includes(a.internId)) session.memberIds.push(a.internId);
  const project = db.projects.find((p) => p.id === a.projectId);
  if (project && !project.sessionId) project.sessionId = a.sessionId;
  return json(assignmentDto(a), 201);
}

export function completeAssignment(ctx: Ctx): Response {
  const a = db.assignments.find((x) => x.id === ctx.params.id);
  if (!a) return notFound();
  a.status = "completed";
  return json(assignmentDto(a));
}

export function cancelAssignment(ctx: Ctx): Response {
  const a = db.assignments.find((x) => x.id === ctx.params.id);
  if (!a) return notFound();
  a.status = "cancelled";
  return json(assignmentDto(a));
}

/* ============================ Dashboards ============================ */

export function adminDashboard(_ctx: Ctx): Response {
  const openTasks = db.tasks.filter((t) => !t.deleted && ["todo", "doing", "review"].includes(t.status)).length;
  return json({
    totalUsers: db.users.length,
    activeSessions: db.sessions.filter((s) => s.status === "active").length,
    openTasks,
    pendingEvaluations: db.evaluations.filter((e) => e.status === "draft" || e.status === "submitted").length,
    recentAudit: db.auditLogs.slice(-5).reverse().map((a) => ({ id: a.id, action: a.action, actorName: a.actorName, createdAt: a.createdAt })),
  });
}

export function instructorDashboard(_ctx: Ctx): Response {
  const openTasks = db.tasks.filter((t) => !t.deleted && ["todo", "doing", "review"].includes(t.status)).length;
  return json({
    activeSessions: db.sessions.filter((s) => s.status === "active").length,
    totalInterns: db.users.filter((u) => u.roles.includes("intern")).length,
    openTasks,
    submissionsPending: db.submissions.filter((s) => s.status === "submitted").length,
    upcomingEvaluations: db.evaluationCycles.filter((c) => c.status === "open").length,
    sessionSummaries: db.sessions.map((s) => ({
      id: s.id, name: s.name, status: s.status, internCount: s.memberIds.length,
      openTasks: db.tasks.filter((t) => !t.deleted && db.sprints.some((sp) => sp.id === t.sprintId && sp.sessionId === s.id) && t.status !== "done").length,
    })),
  });
}

/* ============================ Performance ============================ */

function internMetrics(userId: string) {
  const tasks = db.tasks.filter((t) => t.assigneeId === userId && !t.deleted);
  const done = tasks.filter((t) => t.status === "done");
  const totalSp = tasks.reduce((s, t) => s + t.storyPoints, 0);
  const doneSp = done.reduce((s, t) => s + t.storyPoints, 0);
  const onTime = done.filter((t) => !t.completedAt || !t.dueDate || new Date(t.completedAt) <= new Date(t.dueDate)).length;
  const finalized = db.evaluations.filter((e) => e.internId === userId && e.status === "finalized" && typeof e.overallScore === "number");
  const avg = finalized.length ? +(finalized.reduce((s, e) => s + (e.overallScore as number), 0) / finalized.length).toFixed(2) : null;
  const round2 = (n: number) => +n.toFixed(2);
  return {
    taskCompletionRate: tasks.length ? round2(done.length / tasks.length) : 0,
    storyPointCompletionRate: totalSp ? round2(doneSp / totalSp) : 0,
    onTimeCompletionRate: done.length ? round2(onTime / done.length) : 0,
    overdueOpenTaskCount: tasks.filter((t) => t.status !== "done" && t.dueDate && new Date(t.dueDate) < new Date("2026-10-28T08:00:00.000Z")).length,
    averageEvaluationScore: avg,
  };
}

export function performanceInterns(ctx: Ctx): Response {
  const q = ctx.url.searchParams.get("q") ?? undefined;
  const rows = db.users
    .filter((u) => u.roles.includes("intern"))
    .filter((u) => !q || matches(u.displayName, q) || matches(u.email, q))
    .map((u) => ({ userId: u.id, displayName: u.displayName, email: u.email, ...internMetrics(u.id) }));
  return json(paginate(rows, ctx.url));
}

/* ============================ Reports ============================ */

export function listReports(ctx: Ctx): Response {
  return json(paginate(db.reports, ctx.url));
}

export function createReport(ctx: Ctx): Response {
  const b = ctx.body || {};
  if (!b.requestId || !b.title || !b.kind) return err(400, "VALIDATION_ERROR", "Thiếu requestId, title hoặc kind của báo cáo.");
  const project = b.projectId ? db.projects.find((p) => p.id === b.projectId) : null;
  const tasks = db.tasks.filter((t) => !t.deleted && (!project || t.projectId === project.id));
  const done = tasks.filter((t) => t.status === "done");
  const r = {
    id: nid("r"), requestId: String(b.requestId), title: String(b.title), kind: String(b.kind),
    projectId: b.projectId ?? null, sessionId: b.sessionId ?? null, status: "completed", createdAt: nowIso(),
    snapshot: {
      projectName: project?.name ?? null,
      totalTasks: tasks.length, doneTasks: done.length, openTasks: tasks.length - done.length,
      totalStoryPoints: tasks.reduce((s, t) => s + t.storyPoints, 0),
      doneStoryPoints: done.reduce((s, t) => s + t.storyPoints, 0),
      internCount: db.users.filter((u) => u.roles.includes("intern")).length,
    },
  };
  db.reports.unshift(r);
  return json(r, 201);
}

export function reportPdf(ctx: Ctx): Response {
  const r = db.reports.find((x) => x.id === ctx.params.id);
  if (!r) return notFound();
  const s = r.snapshot;
  const pdf = buildPdf(r.title, [
    `Kind: ${r.kind}`,
    `Project: ${s.projectName ?? "(all)"}`,
    `Tasks: ${s.doneTasks}/${s.totalTasks} done, ${s.openTasks ?? 0} open`,
    `Story points: ${s.doneStoryPoints ?? 0}/${s.totalStoryPoints ?? 0}`,
    `Generated at: ${r.createdAt.slice(0, 19).replace("T", " ")} UTC`,
    "Generated by mock-be for demo purposes.",
  ]);
  return new Response(pdf as any, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="report-${r.id}.pdf"`,
    },
  });
}

export function reportXlsx(ctx: Ctx): Response {
  const r = db.reports.find((x) => x.id === ctx.params.id);
  if (!r) return notFound();
  return new Response(buildXlsx() as any, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="report-${r.id}.xlsx"`,
    },
  });
}
