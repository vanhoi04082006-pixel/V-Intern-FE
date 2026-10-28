/** Performance (instructor): bảng xếp hạng intern + chi tiết từng intern. */

import { findUserById } from "../store";
import { includesNoAccent } from "../util";
import { computePerformance, computeTrend, submissionInfoOf } from "../perf";
import { notFound, pageOf, route, type RouteDef, type Ctx } from "./common";
import { taskPublic } from "./tasks";

function internsWithAssignment(ctx: Ctx, sessionId: string | null, projectId: string | null) {
  return ctx.store.assignments.filter((a) => {
    if (a.status !== "active") return false;
    if (sessionId && a.sessionId !== sessionId) return false;
    if (projectId && a.projectId !== projectId) return false;
    return true;
  });
}

async function listInternPerformance(ctx: Ctx): Promise<unknown> {
  const sessionId = ctx.query.get("sessionId");
  const projectId = ctx.query.get("projectId");
  const search = ctx.query.get("search")?.trim();

  const seen = new Set<string>();
  const rows: Record<string, unknown>[] = [];
  for (const a of internsWithAssignment(ctx, sessionId, projectId)) {
    if (seen.has(a.internId)) continue;
    seen.add(a.internId);
    const user = findUserById(a.internId);
    if (!user) continue;
    if (search && !includesNoAccent(`${user.displayName} ${user.email}`, search)) continue;
    const m = computePerformance(ctx.store, a.internId);
    rows.push({
      userId: a.internId,
      displayName: a.internName,
      role: a.role,
      totalTaskCount: m.totalTaskCount,
      completedTaskCount: m.completedTaskCount,
      taskCompletionRate: m.taskCompletionRate,
      storyPointCompletionRate: m.storyPointCompletionRate,
      averageEvaluationScore: m.averageEvaluationScore,
      onTimeCompletionRate: m.onTimeCompletionRate,
    });
  }

  // rank theo tổng hợp: hoàn thành * 0.5 + đúng hạn * 0.25 + điểm đánh giá * 0.25
  const score = (r: Record<string, unknown>) =>
    (r.taskCompletionRate as number) * 0.5 +
    (r.onTimeCompletionRate as number) * 0.25 +
    ((r.averageEvaluationScore as number | null) ?? 60) * 0.25;
  rows.sort((a, b) => score(b) - score(a));
  rows.forEach((r, i) => (r.rank = i + 1));

  return pageOf(rows, ctx.query);
}

async function internPerformanceDetail(ctx: Ctx): Promise<unknown> {
  const userId = ctx.params.userId;
  const user = findUserById(userId);
  if (!user) throw notFound("Không tìm thấy thực tập sinh.");

  const metrics = computePerformance(ctx.store, userId);
  const assignmentRole = ctx.store.assignments.find((a) => a.internId === userId && a.status === "active")?.role ?? "intern";

  const assignments = ctx.store.assignments
    .filter((a) => a.internId === userId)
    .map((a) => {
      const project = ctx.store.projects.find((p) => p.id === a.projectId);
      const session = ctx.store.sessions.find((s) => s.id === a.sessionId);
      return {
        projectName: project?.name ?? a.projectId,
        sessionName: session?.name ?? a.sessionId,
        role: a.role,
        status: a.status,
      };
    });

  const tasks = ctx.store.tasks
    .filter((t) => t.assigneeId === userId)
    .sort((a, b) => (a.code < b.code ? -1 : 1))
    .map((t) => ({ ...taskPublic(t), submission: submissionInfoOf(ctx.store, t.id) }));

  const interview = ctx.store.interviews
    .filter((i) => i.userId === userId && i.result)
    .sort((a, b) => ((a.submittedAt ?? a.startedAt) < (b.submittedAt ?? b.startedAt) ? 1 : -1))[0];

  return {
    profile: { userId, displayName: user.displayName, email: user.email, role: assignmentRole },
    metrics,
    assignments,
    tasks: { items: tasks },
    trend: computeTrend(ctx.store, userId),
    interviewSummary: interview?.result
      ? {
          decision: interview.result.decision,
          overallScore: interview.result.overallScore,
          technicalScore: interview.result.technicalScore,
          softSkillScore: interview.result.softSkillScore,
        }
      : null,
  };
}

export const performanceRoutes: RouteDef[] = [
  route("GET", "/performance/interns", ["instructor", "admin"], listInternPerformance),
  route("GET", "/performance/interns/:userId/detail", ["instructor", "admin"], internPerformanceDetail),
];
