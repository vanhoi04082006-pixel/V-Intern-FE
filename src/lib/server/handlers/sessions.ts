/** Sessions (instructor + admin): overview, detail, work, timeline, members, status. */

import type { SessionRecord, SessionStatus } from "../types";
import { findUserById, notifyUser, pushTimeline } from "../store";
import { isOverdueOpen, submissionInfoOf } from "../perf";
import { includesNoAccent, nowIso, randomId } from "../util";
import { badRequest, conflict, notFound, pageOf, route, type RouteDef, type Ctx } from "./common";
import { taskPublic } from "./tasks";

const SESSION_STATUSES: SessionStatus[] = ["planning", "active", "completed", "cancelled"];

function getSession(ctx: Ctx, id: string): SessionRecord {
  const s = ctx.store.sessions.find((x) => x.id === id || x.code === id);
  if (!s) throw notFound("Không tìm thấy phiên thực tập.");
  return s;
}

/** Tasks của session: task thuộc các sprint của session (+ task trực tiếp của project chưa vào sprint). */
function tasksOfSession(ctx: Ctx, sessionId: string) {
  const sprintIds = new Set(ctx.store.sprints.filter((s) => s.sessionId === sessionId).map((s) => s.id));
  const session = ctx.store.sessions.find((s) => s.id === sessionId);
  return ctx.store.tasks
    .filter((t) => sprintIds.has(t.sprintId ?? "") || (session && t.projectId === session.projectId && !t.sprintId))
    .sort((a, b) => (a.code < b.code ? -1 : 1));
}

function assignmentsOf(ctx: Ctx, sessionId: string) {
  return ctx.store.assignments
    .filter((a) => a.sessionId === sessionId)
    .sort((a, b) => (a.assignedAt < b.assignedAt ? -1 : 1));
}

function currentSprintOf(ctx: Ctx, sessionId: string) {
  const sprints = ctx.store.sprints
    .filter((s) => s.sessionId === sessionId)
    .sort((a, b) => (a.startDate < b.startDate ? -1 : 1));
  return sprints.find((s) => s.status === "active") ?? sprints[sprints.length - 1] ?? null;
}

function sprintProgressOf(ctx: Ctx, sprintId: string): number {
  const tasks = ctx.store.tasks.filter((t) => t.sprintId === sprintId);
  if (!tasks.length) return 0;
  return Math.round(tasks.reduce((a, t) => a + t.progress, 0) / tasks.length);
}

/* ------------------------------- overview ------------------------------- */

async function sessionsOverview(ctx: Ctx): Promise<unknown> {
  let items = [...ctx.store.sessions];
  const q = ctx.query.get("q")?.trim();
  if (q) {
    items = items.filter((s) => {
      const project = ctx.store.projects.find((p) => p.id === s.projectId);
      return includesNoAccent(`${s.code} ${s.name} ${project?.name ?? ""}`, q);
    });
  }
  const status = ctx.query.get("status");
  if (status) items = items.filter((s) => s.status === status);

  const sortBy = ctx.query.get("sortBy") ?? "startDate";
  const dir = ctx.query.get("sortDirection") === "asc" ? 1 : -1;
  items.sort((a, b) => {
    let r = 0;
    if (sortBy === "name") r = a.name.localeCompare(b.name, "vi");
    else if (sortBy === "status") r = a.status.localeCompare(b.status);
    else if (sortBy === "createdAt") r = a.createdAt < b.createdAt ? -1 : 1;
    else r = a.startDate < b.startDate ? -1 : 1;
    return r * dir;
  });

  return pageOf(
    items.map((s) => {
      const project = ctx.store.projects.find((p) => p.id === s.projectId);
      const members = assignmentsOf(ctx, s.id).filter((a) => a.status === "active");
      const sprints = ctx.store.sprints.filter((x) => x.sessionId === s.id);
      const tasks = tasksOfSession(ctx, s.id);
      const taskDone = tasks.filter((t) => t.status === "done").length;
      const current = currentSprintOf(ctx, s.id);
      const pendingReview =
        tasks.filter((t) => t.status === "review").length +
        ctx.store.submissions.filter((sub) => {
          const task = ctx.store.tasks.find((t) => t.id === sub.taskId);
          return sub.status === "submitted" && task && tasks.some((t2) => t2.id === task.id);
        }).length;
      return {
        id: s.id,
        code: s.code,
        name: s.name,
        status: s.status,
        startDate: s.startDate,
        endDate: s.endDate,
        project: project ? { id: project.id, code: project.code, name: project.name } : null,
        memberCount: members.length,
        sprintCount: sprints.length,
        taskTotal: tasks.length,
        taskDone,
        taskPercent: tasks.length ? Math.round((taskDone / tasks.length) * 100) : 0,
        currentSprint: current ? { id: current.id, code: current.code, name: current.name } : null,
        alerts: {
          overdueTasks: tasks.filter(isOverdueOpen).length,
          pendingReview,
          sessionOverdue: s.status === "active" && new Date(s.endDate).getTime() < Date.now(),
        },
      };
    }),
    ctx.query
  );
}

/* --------------------------------- detail --------------------------------- */

async function sessionDetail(ctx: Ctx): Promise<unknown> {
  const s = getSession(ctx, ctx.params.id);
  const project = ctx.store.projects.find((p) => p.id === s.projectId);
  const members = assignmentsOf(ctx, s.id).map((a) => {
    const u = findUserById(a.internId);
    return {
      userId: a.internId,
      displayName: a.internName,
      role: a.role,
      assignmentStatus: a.status,
      avatarColor: u?.avatarColor ?? "#10B981",
    };
  });
  const sprints = ctx.store.sprints
    .filter((x) => x.sessionId === s.id)
    .sort((a, b) => (a.startDate < b.startDate ? -1 : 1))
    .map((x) => ({
      id: x.id,
      code: x.code,
      name: x.name,
      status: x.status,
      progress: sprintProgressOf(ctx, x.id),
      startDate: x.startDate,
      endDate: x.endDate,
    }));
  const milestones = ctx.store.milestones
    .filter((m) => m.sessionId === s.id)
    .map((m) => ({ id: m.id, title: m.title, dueDate: m.dueDate, completed: m.completed }));
  const tasks = tasksOfSession(ctx, s.id);
  const taskDone = tasks.filter((t) => t.status === "done").length;
  const taskIds = new Set(tasks.map((t) => t.id));
  const submissions = ctx.store.submissions.filter((sub) => taskIds.has(sub.taskId));
  const plan = ctx.store.plans
    .filter((p) => p.sessionId === s.id)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];

  return {
    id: s.id,
    code: s.code,
    name: s.name,
    status: s.status,
    startDate: s.startDate,
    endDate: s.endDate,
    project: project ? { id: project.id, code: project.code, name: project.name, description: project.description, techStack: project.techStack } : null,
    description: s.description,
    instructors: s.instructorIds.map((id) => {
      const u = findUserById(id);
      return { userId: id, displayName: u?.displayName ?? id };
    }),
    members,
    sprints,
    milestones,
    stats: {
      taskTotal: tasks.length,
      taskDone,
      taskPercent: tasks.length ? Math.round((taskDone / tasks.length) * 100) : 0,
      submissionTotal: submissions.length,
      pendingReviewCount: tasks.filter((t) => t.status === "review").length + submissions.filter((sub) => sub.status === "submitted").length,
      activeInternCount: assignmentsOf(ctx, s.id).filter((a) => a.status === "active").length,
    },
    plan: plan ? { status: plan.status, planId: plan.planId } : { status: "none", planId: null },
  };
}

/* ---------------------------------- work ---------------------------------- */

async function sessionWork(ctx: Ctx): Promise<unknown> {
  const s = getSession(ctx, ctx.params.id);
  let tasks = tasksOfSession(ctx, s.id);
  const status = ctx.query.get("status");
  if (status) tasks = tasks.filter((t) => t.status === status);
  const priority = ctx.query.get("priority");
  if (priority) tasks = tasks.filter((t) => t.priority === priority);
  const assigneeId = ctx.query.get("assigneeId");
  if (assigneeId) tasks = tasks.filter((t) => t.assigneeId === assigneeId);
  const search = ctx.query.get("search")?.trim();
  if (search) tasks = tasks.filter((t) => includesNoAccent(`${t.code} ${t.title} ${t.assigneeName ?? ""}`, search));

  return pageOf(
    tasks.map((t) => ({
      ...taskPublic(t),
      submission: submissionInfoOf(ctx.store, t.id),
    })),
    ctx.query
  );
}

/* -------------------------------- timeline -------------------------------- */

async function sessionTimeline(ctx: Ctx): Promise<unknown> {
  const s = getSession(ctx, ctx.params.id);
  const items = ctx.store.timelineEvents
    .filter((e) => e.sessionId === s.id)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map((e) => ({ id: e.id, action: e.action, summary: e.summary, actorName: e.actorName, createdAt: e.createdAt }));
  return pageOf(items, ctx.query);
}

/* ----------------------------- member options ----------------------------- */

async function memberOptions(ctx: Ctx): Promise<unknown> {
  const sessionId = ctx.query.get("sessionId") ?? "";
  const role = ctx.query.get("role") ?? "";
  if (!sessionId) throw badRequest("Cần truyền sessionId.", ["sessionId: bắt buộc"]);

  const options: {
    userId: string;
    displayName: string;
    email: string;
    selectedRole: string | null;
    result: { overallScore: number } | null;
    hasActiveAssignment: boolean;
  }[] = [];
  for (const [userId, profile] of Object.entries(ctx.store.recruitment)) {
    if (profile.status !== "passed") continue;
    if (role && profile.selectedRole !== role) continue;
    const hasActive = ctx.store.assignments.some((a) => a.internId === userId && a.status === "active");
    if (hasActive) continue;
    const user = findUserById(userId);
    if (!user || user.status !== "active") continue;
    const latest = ctx.store.interviews
      .filter((i) => i.userId === userId && i.result)
      .sort((a, b) => ((a.submittedAt ?? a.startedAt) < (b.submittedAt ?? b.startedAt) ? 1 : -1))[0];
    options.push({
      userId,
      displayName: user.displayName,
      email: user.email,
      selectedRole: profile.selectedRole,
      result: latest?.result ? { overallScore: latest.result.overallScore } : null,
      hasActiveAssignment: false,
    });
  }
  options.sort((a, b) => (b.result?.overallScore ?? 0) - (a.result?.overallScore ?? 0));
  return { data: options };
}

/* --------------------------------- members --------------------------------- */

async function addMember(ctx: Ctx): Promise<unknown> {
  const s = getSession(ctx, ctx.params.id);
  const userId = typeof ctx.body?.userId === "string" ? ctx.body.userId : "";
  const role = typeof ctx.body?.role === "string" && ctx.body.role ? ctx.body.role : "frontend";
  if (!userId) throw badRequest("Cần chọn thực tập sinh.", ["userId: bắt buộc"]);
  const user = findUserById(userId);
  if (!user) throw badRequest("Người dùng không tồn tại.", ["userId: không hợp lệ"]);

  if (ctx.store.assignments.some((a) => a.internId === userId && a.status === "active")) {
    const inThis = ctx.store.assignments.some((a) => a.internId === userId && a.sessionId === s.id && a.status === "active");
    throw conflict(
      inThis
        ? "Thực tập sinh đã có phân công trong phiên này."
        : "Thực tập sinh đã có phân công đang hoạt động trong phiên khác.",
      "ASSIGNMENT_CONFLICT"
    );
  }

  const assignment = {
    id: randomId("asg"),
    internId: userId,
    internName: user.displayName,
    role,
    projectId: s.projectId,
    sessionId: s.id,
    status: "active" as const,
    assignedAt: nowIso(),
  };
  ctx.store.assignments.push(assignment);
  pushTimeline(s.id, "member_joined", `Thêm thành viên ${user.displayName} — vai trò ${role}.`, ctx.user!.displayName);
  notifyUser(userId, "session", `Bạn được thêm vào phiên ${s.code}`, `${ctx.user!.displayName} đã thêm bạn vào phiên "${s.name}" với vai trò ${role}.`, "#/intern");
  return {
    id: assignment.id,
    userId,
    displayName: user.displayName,
    role,
    assignmentStatus: "active",
    avatarColor: user.avatarColor,
  };
}

async function removeMember(ctx: Ctx): Promise<unknown> {
  const s = getSession(ctx, ctx.params.id);
  const assignment = ctx.store.assignments.find(
    (a) => a.sessionId === s.id && a.internId === ctx.params.userId && a.status === "active"
  );
  if (!assignment) throw notFound("Thành viên không có trong phiên này.");
  assignment.status = "cancelled";
  pushTimeline(s.id, "member_removed", `Hủy phân công của ${assignment.internName} khỏi phiên.`, ctx.user!.displayName);
  notifyUser(assignment.internId, "session", `Phân công trong phiên ${s.code} đã bị hủy`, `Mentor ${ctx.user!.displayName} đã hủy phân công của bạn trong phiên "${s.name}".`, "#/intern");
  return { removed: true, assignmentId: assignment.id };
}

async function patchSession(ctx: Ctx): Promise<unknown> {
  const s = getSession(ctx, ctx.params.id);
  const status = ctx.body?.status;
  if (typeof status !== "string" || !SESSION_STATUSES.includes(status as SessionStatus)) {
    throw badRequest("Trạng thái phiên không hợp lệ.", ["status: planning|active|completed|cancelled"]);
  }
  s.status = status as SessionStatus;
  pushTimeline(s.id, "session_status_changed", `Phiên chuyển sang trạng thái '${status}'.`, ctx.user!.displayName);
  return { id: s.id, code: s.code, name: s.name, status: s.status, startDate: s.startDate, endDate: s.endDate };
}
export const sessionRoutes: RouteDef[] = [
  route("GET", "/sessions/overview", ["instructor", "admin"], sessionsOverview),
  route("GET", "/sessions/member-options", ["instructor", "admin"], memberOptions),
  route("GET", "/sessions/:id", ["instructor", "admin"], sessionDetail),
  route("GET", "/sessions/:id/work", ["instructor", "admin"], sessionWork),
  route("GET", "/sessions/:id/timeline", ["instructor", "admin"], sessionTimeline),
  route("POST", "/sessions/:id/members", ["instructor", "admin"], addMember),
  route("DELETE", "/sessions/:id/members/:userId", ["instructor", "admin"], removeMember),
  route("PATCH", "/sessions/:id", ["instructor", "admin"], patchSession),
];
