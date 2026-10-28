/** Candidates & assignments (instructor): danh sách ứng viên passed, chi tiết, hủy phân công. */

import { findUserById, pushTimeline } from "../store";
import { includesNoAccent } from "../util";
import { conflict, notFound, pageOf, route, type RouteDef, type Ctx } from "./common";

function latestInterviewOf(ctx: Ctx, userId: string) {
  return (
    ctx.store.interviews
      .filter((i) => i.userId === userId && i.status === "completed")
      .sort((a, b) => ((a.submittedAt ?? a.startedAt) < (b.submittedAt ?? b.startedAt) ? 1 : -1))[0] ?? null
  );
}

function activeAssignmentOfAny(ctx: Ctx, userId: string) {
  return ctx.store.assignments.find((a) => a.internId === userId && a.status === "active") ?? null;
}

function candidateRow(ctx: Ctx, userId: string): Record<string, unknown> | null {
  const profile = ctx.store.recruitment[userId];
  if (!profile) return null;
  const user = findUserById(userId);
  if (!user) return null;
  const interview = latestInterviewOf(ctx, userId);
  const assignment = activeAssignmentOfAny(ctx, userId);
  const activeProject = assignment ? ctx.store.projects.find((p) => p.id === assignment.projectId) : undefined;
  return {
    userId,
    displayName: user.displayName,
    email: user.email,
    selectedRole: profile.selectedRole,
    attemptCount: profile.attemptCount,
    recruitedAt: profile.recruitedAt,
    hasActiveAssignment: !!assignment,
    activeProjectName: activeProject?.name ?? null,
    result: interview?.result
      ? {
          overallScore: interview.result.overallScore,
          technicalScore: interview.result.technicalScore,
          softSkillScore: interview.result.softSkillScore,
          decision: interview.result.decision,
          strengths: interview.result.strengths,
          weaknesses: interview.result.weaknesses,
        }
      : null,
  };
}

async function listCandidates(ctx: Ctx): Promise<unknown> {
  const status = ctx.query.get("status") ?? "passed";
  const role = ctx.query.get("role");
  const search = ctx.query.get("search")?.trim();

  let rows: Record<string, unknown>[] = [];
  for (const [userId, profile] of Object.entries(ctx.store.recruitment)) {
    if (profile.status !== status) continue;
    if (role && profile.selectedRole !== role) continue;
    const row = candidateRow(ctx, userId);
    if (!row) continue;
    if (search && !includesNoAccent(`${row.displayName} ${row.email}`, search)) continue;
    rows.push(row);
  }
  rows.sort((a, b) => {
    const ra = (a.result as { overallScore: number } | null)?.overallScore ?? 0;
    const rb = (b.result as { overallScore: number } | null)?.overallScore ?? 0;
    return rb - ra;
  });
  return pageOf(rows, ctx.query);
}

async function candidateDetail(ctx: Ctx): Promise<unknown> {
  const userId = ctx.params.userId;
  const profile = ctx.store.recruitment[userId];
  const user = findUserById(userId);
  if (!profile || !user) throw notFound("Không tìm thấy ứng viên.");
  const base = candidateRow(ctx, userId);
  const interview = latestInterviewOf(ctx, userId);
  return {
    ...base,
    university: user.university,
    studentId: user.studentId,
    maxAttempts: profile.maxAttempts,
    nextEligibleAt: profile.nextEligibleAt,
    interview: interview
      ? {
          sessionId: interview.id,
          attemptNumber: interview.attemptNumber,
          roleCode: interview.roleCode,
          startedAt: interview.startedAt,
          submittedAt: interview.submittedAt,
          decision: interview.result?.decision ?? null,
          overallScore: interview.result?.overallScore ?? null,
          questions: interview.questions.map((q) => ({
            prompt: q.prompt,
            answer: q.answer,
            score: q.score,
            phase: q.phase,
          })),
        }
      : null,
  };
}

/* ------------------------------ assignments ------------------------------ */

async function listAssignments(ctx: Ctx): Promise<unknown> {
  const sessionId = ctx.query.get("sessionId");
  const items = ctx.store.assignments
    .filter((a) => (sessionId ? a.sessionId === sessionId : true))
    .sort((a, b) => (a.assignedAt < b.assignedAt ? 1 : -1))
    .map((a) => ({
      id: a.id,
      internId: a.internId,
      internName: a.internName,
      role: a.role,
      projectId: a.projectId,
      sessionId: a.sessionId,
      status: a.status,
      assignedAt: a.assignedAt,
    }));
  return { data: items };
}

async function cancelAssignment(ctx: Ctx): Promise<unknown> {
  const a = ctx.store.assignments.find((x) => x.id === ctx.params.id);
  if (!a) throw notFound("Không tìm thấy phân công.");
  if (a.status === "cancelled") throw conflict("Phân công đã bị hủy trước đó.");
  a.status = "cancelled";
  pushTimeline(a.sessionId, "assignment_cancelled", `Hủy phân công của ${a.internName} (vai trò ${a.role}).`, ctx.user!.displayName);
  return {
    id: a.id,
    internId: a.internId,
    internName: a.internName,
    role: a.role,
    projectId: a.projectId,
    sessionId: a.sessionId,
    status: a.status,
    assignedAt: a.assignedAt,
  };
}

export const candidateRoutes: RouteDef[] = [
  route("GET", "/recruitment/candidates", ["instructor", "admin"], listCandidates),
  route("GET", "/recruitment/candidates/:userId", ["instructor", "admin"], candidateDetail),
  route("GET", "/assignments", ["instructor", "admin"], listAssignments),
  route("POST", "/assignments/:id/cancel", ["instructor", "admin"], cancelAssignment),
];
