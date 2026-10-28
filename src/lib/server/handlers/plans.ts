/**
 * AI Kế hoạch sprint (instructor): generate (lazy 3.5s → draft), list, detail,
 * confirm (publish → tạo sprint + task thật, session → active).
 */

import type { Plan, ProjectTemplate, Task } from "../types";
import { getStore, notifyUser, pushTimeline } from "../store";
import { buildPlanDraft } from "../plan";
import { nowIso, randomId } from "../util";
import { badRequest, conflict, notFound, route, type RouteDef, type Ctx } from "./common";

const GENERATE_MS = 3500;

function templateOfSession(sessionId: string): ProjectTemplate | null {
  const store = getStore();
  const session = store.sessions.find((s) => s.id === sessionId);
  if (!session) return null;
  const project = store.projects.find((p) => p.id === session.projectId);
  if (!project?.templateId) return null;
  return store.templates.find((t) => t.id === project.templateId) ?? null;
}

/** Hoàn tất plan nếu đã quá 3.5s (lazy-complete cho FE poll). */
function maybeCompletePlan(plan: Plan): void {
  if (plan.status !== "generating") return;
  if (!plan.generatingSince || Date.now() - new Date(plan.generatingSince).getTime() < GENERATE_MS) return;
  const template = templateOfSession(plan.sessionId);
  if (template) {
    const session = getStore().sessions.find((s) => s.id === plan.sessionId);
    plan.draft = buildPlanDraft(template, { id: plan.sessionId, startDate: session?.startDate ?? nowIso() });
    plan.sprintCount = plan.draft.sprints.length;
    plan.taskCount = plan.draft.sprints.reduce((a, s) => a + s.tasks.length, 0);
    plan.status = "draft";
  } else {
    plan.status = "failed";
    plan.error = "Không tìm thấy blueprint mẫu dự án cho phiên này.";
  }
  plan.generatingSince = null;
}

async function generatePlan(ctx: Ctx): Promise<unknown> {
  const sessionId = typeof ctx.body?.sessionId === "string" ? ctx.body.sessionId : "";
  if (!sessionId) throw badRequest("Cần truyền sessionId.", ["sessionId: bắt buộc"]);
  const session = ctx.store.sessions.find((s) => s.id === sessionId || s.code === sessionId);
  if (!session) throw notFound("Không tìm thấy phiên thực tập.");

  if (!templateOfSession(session.id)) {
    throw badRequest("Phiên chưa gắn với mẫu dự án nào — không thể sinh kế hoạch.", ["sessionId: phiên thiếu template"]);
  }

  // Hoàn tất các plan generating cũ (nếu có) rồi kiểm tra plan đang chạy
  for (const p of ctx.store.plans) maybeCompletePlan(p);
  const inFlight = ctx.store.plans.find((p) => p.sessionId === session.id && p.status === "generating");
  if (inFlight) return { planId: inFlight.planId, status: inFlight.status };

  const planId = randomId("plan");
  const plan: Plan = {
    planId,
    sessionId: session.id,
    status: "generating",
    createdAt: nowIso(),
    generatingSince: nowIso(),
    sprintCount: null,
    taskCount: null,
    draft: null,
    warnings: [],
    error: null,
  };
  ctx.store.plans.unshift(plan);

  setTimeout(() => {
    maybeCompletePlan(plan);
  }, GENERATE_MS);

  ctx.store.aiRuns += 1;
  return { planId: plan.planId, status: plan.status };
}

async function listPlans(ctx: Ctx): Promise<unknown> {
  const sessionId = ctx.query.get("sessionId") ?? "";
  const items = ctx.store.plans
    .filter((p) => (sessionId ? p.sessionId === sessionId : true))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  for (const p of items) maybeCompletePlan(p);
  return {
    data: items.map((p) => ({
      planId: p.planId,
      sessionId: p.sessionId,
      status: p.status,
      createdAt: p.createdAt,
      sprintCount: p.sprintCount ?? 0,
      taskCount: p.taskCount ?? 0,
    })),
  };
}

async function planDetail(ctx: Ctx): Promise<unknown> {
  const plan = ctx.store.plans.find((p) => p.planId === ctx.params.planId);
  if (!plan) throw notFound("Không tìm thấy kế hoạch.");
  maybeCompletePlan(plan);
  return {
    planId: plan.planId,
    sessionId: plan.sessionId,
    status: plan.status,
    createdAt: plan.createdAt,
    draft: plan.draft,
    warnings: plan.warnings,
    error: plan.error,
    sprintCount: plan.sprintCount ?? 0,
    taskCount: plan.taskCount ?? 0,
  };
}

/* ------------------------------- confirm ------------------------------- */

async function confirmPlan(ctx: Ctx): Promise<unknown> {
  const planId = typeof ctx.body?.planId === "string" ? ctx.body.planId : "";
  if (!planId) throw badRequest("Cần truyền planId.", ["planId: bắt buộc"]);
  const plan = ctx.store.plans.find((p) => p.planId === planId);
  if (!plan) throw notFound("Không tìm thấy kế hoạch.");
  maybeCompletePlan(plan);
  if (plan.status === "generating") throw conflict("Kế hoạch đang được sinh — đợi hoàn tất rồi xác nhận.");
  if (plan.status === "published") throw conflict("Kế hoạch đã được áp dụng cho phiên này.");
  if (plan.status === "failed" || !plan.draft) throw conflict("Kế hoạch không có bản nháp hợp lệ để áp dụng.");

  const session = ctx.store.sessions.find((s) => s.id === plan.sessionId);
  if (!session) throw notFound("Không tìm thấy phiên của kế hoạch.");
  const projectId = session.projectId;

  // thành viên active theo role — gán task đúng người (người ít việc nhất trước)
  const membersByRole = new Map<string, string[]>();
  const loadByUser = new Map<string, number>();
  for (const a of ctx.store.assignments.filter((x) => x.sessionId === session.id && x.status === "active")) {
    const list = membersByRole.get(a.role) ?? [];
    list.push(a.internId);
    membersByRole.set(a.role, list);
    loadByUser.set(a.internId, ctx.store.tasks.filter((t) => t.assigneeId === a.internId).length);
  }
  const pickAssignee = (role: string): string | null => {
    const ids = membersByRole.get(role) ?? [];
    if (!ids.length) return null;
    return [...ids].sort((a, b) => (loadByUser.get(a) ?? 0) - (loadByUser.get(b) ?? 0))[0];
  };

  const sprintIds: string[] = [];
  const taskIds: string[] = [];

  for (const draftSprint of plan.draft.sprints) {
    const sprintId = randomId("spr");
    const existingCodes = new Set(ctx.store.sprints.filter((s) => s.sessionId === session.id).map((s) => s.code));
    const sprintCode = existingCodes.has(draftSprint.code)
      ? `SPR-${String(ctx.store.sprints.length + 1).padStart(2, "0")}`
      : draftSprint.code;
    const latestDue = draftSprint.tasks.reduce(
      (max, t) => Math.max(max, new Date(t.dueDate).getTime() || Date.now()),
      Date.now()
    );
    ctx.store.sprints.push({
      id: sprintId,
      code: sprintCode,
      name: draftSprint.name,
      goal: draftSprint.goal,
      status: "todo",
      startDate: nowIso(),
      endDate: new Date(latestDue + 86400000).toISOString(),
      sessionId: session.id,
      projectId,
    });
    sprintIds.push(sprintId);

    const keyToId = new Map<string, string>();
    for (const dt of draftSprint.tasks) keyToId.set(dt.key, randomId("tsk"));

    for (const dt of draftSprint.tasks) {
      const assigneeId = pickAssignee(dt.suggestedRole);
      const assignee = assigneeId ? ctx.store.users.find((u) => u.id === assigneeId) : null;
      if (assigneeId) loadByUser.set(assigneeId, (loadByUser.get(assigneeId) ?? 0) + 1);

      let maxCode = 0;
      for (const t of ctx.store.tasks) {
        const n = Number(t.code.replace("TSK-", ""));
        if (Number.isFinite(n) && n > maxCode) maxCode = n;
      }

      const task: Task = {
        id: keyToId.get(dt.key)!,
        code: `TSK-${String(maxCode + 1).padStart(2, "0")}`,
        title: dt.title,
        description: dt.description,
        status: "todo",
        priority: dt.priority,
        progress: 0,
        storyPoints: dt.storyPoints,
        dueDate: dt.dueDate,
        assigneeId,
        assigneeName: assignee?.displayName ?? null,
        projectId,
        sprintId,
        sprintCode,
        version: 1,
        role: dt.suggestedRole,
        estimatedHours: Math.max(4, Math.round(dt.storyPoints * 2.5)),
        dependencies: dt.dependsOn.map((k) => keyToId.get(k)).filter((x): x is string => !!x),
        createdAt: nowIso(),
        updatedAt: nowIso(),
        doneAt: null,
      };
      ctx.store.tasks.push(task);
      ctx.store.taskHistory[task.id] = [
        { fromStatus: null, toStatus: "todo", changedBy: ctx.user!.displayName, at: nowIso(), reason: "Tạo từ kế hoạch AI" },
      ];
      taskIds.push(task.id);
      if (assigneeId) {
        notifyUser(
          assigneeId,
          "task",
          `Được giao nhiệm vụ ${task.code} — ${task.title}`,
          `Kế hoạch AI đã được áp dụng cho phiên ${session.code}. Bạn được gán nhiệm vụ ${dt.storyPoints} story points (vai trò ${dt.suggestedRole}).`,
          `#/intern/work/${task.code}`
        );
      }
    }
  }

  // milestones từ draft
  for (const m of plan.draft.milestones) {
    ctx.store.milestones.push({
      id: randomId("mst"),
      sessionId: session.id,
      title: m.title,
      dueDate: new Date(new Date(session.startDate).getTime() + m.dueOffsetDays * 86400000).toISOString(),
      completed: false,
    });
  }

  plan.status = "published";
  session.status = "active";
  session.planPublishedAt = nowIso();
  pushTimeline(
    session.id,
    "plan_published",
    `Xác nhận kế hoạch AI: ${sprintIds.length} sprint, ${taskIds.length} nhiệm vụ được tạo tự động.`,
    ctx.user!.displayName
  );

  return { sprintIds, taskIds, sprintCount: sprintIds.length, taskCount: taskIds.length };
}

export const planRoutes: RouteDef[] = [
  route("POST", "/ai-generations/plans/generate", ["instructor", "admin"], generatePlan),
  route("GET", "/ai-generations/plans", ["instructor", "admin"], listPlans),
  route("GET", "/ai-generations/plans/:planId", ["instructor", "admin"], planDetail),
  route("POST", "/ai-generations/sprint-plan/confirm", ["instructor", "admin"], confirmPlan),
];
