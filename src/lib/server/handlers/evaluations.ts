/**
 * Evaluation cycles, criteria, evaluations (instructor) + AI suggestions
 * (heuristic từ performance thật, delay 1.5s).
 */

import type { Criterion, Evaluation, EvaluationCycle } from "../types";
import { findUserById, notifyUser, pushAudit, pushTimeline } from "../store";
import { clamp, nowIso, randomId } from "../util";
import { computePerformance, isDoneOnTime } from "../perf";
import { badRequest, conflict, notFound, pageOf, route, sleep, type RouteDef, type Ctx } from "./common";

const CYCLE_STATUSES: EvaluationCycle["status"][] = ["draft", "open", "closed", "archived"];

const DEFAULT_CRITERIA: [string, string, number][] = [
  ["TECH_FOUNDATION", "Nền tảng kỹ thuật", 0.3],
  ["TASK_DELIVERY", "Bàn giao & tiến độ", 0.25],
  ["TEAMWORK", "Làm việc nhóm", 0.15],
  ["COMMUNICATION", "Giao tiếp & báo cáo", 0.15],
  ["GROWTH", "Tăng trưởng kỹ năng", 0.15],
];

function getCycle(ctx: Ctx, id: string): EvaluationCycle {
  const c = ctx.store.cycles.find((x) => x.id === id);
  if (!c) throw notFound("Không tìm thấy chu kỳ đánh giá.");
  return c;
}

function cycleRow(ctx: Ctx, c: EvaluationCycle): Record<string, unknown> {
  return {
    id: c.id,
    name: c.name,
    status: c.status,
    startDate: c.startDate,
    endDate: c.endDate,
    evaluationCount: ctx.store.evaluations.filter((e) => e.cycleId === c.id).length,
    criteriaCount: ctx.store.criteria.filter((x) => x.cycleId === c.id).length,
  };
}

async function listCycles(ctx: Ctx): Promise<unknown> {
  const items = ctx.store.cycles
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map((c) => cycleRow(ctx, c));
  return { data: items };
}

async function createCycle(ctx: Ctx): Promise<unknown> {
  const name = typeof ctx.body?.name === "string" ? ctx.body.name.trim() : "";
  if (!name) throw badRequest("Tên chu kỳ là bắt buộc.", ["name: bắt buộc"]);
  const startDate = typeof ctx.body?.startDate === "string" && ctx.body.startDate ? ctx.body.startDate : nowIso();
  const endDate =
    typeof ctx.body?.endDate === "string" && ctx.body.endDate ? ctx.body.endDate : new Date(Date.now() + 14 * 86400000).toISOString();
  const cycle: EvaluationCycle = { id: randomId("cyc"), name, status: "draft", startDate, endDate, createdAt: nowIso() };
  ctx.store.cycles.unshift(cycle);
  DEFAULT_CRITERIA.forEach(([code, label, weight], i) => {
    ctx.store.criteria.push({ id: `cri_${cycle.id.replace("cyc_", "")}_${i + 1}`, cycleId: cycle.id, code, label, weight, maxScore: 100 });
  });
  pushAudit(ctx.user!.displayName, "CREATE", `Tạo chu kỳ đánh giá ${cycle.name}`);
  return cycleRow(ctx, cycle);
}

async function cycleStatus(ctx: Ctx): Promise<unknown> {
  const c = getCycle(ctx, ctx.params.id);
  const status = ctx.body?.status;
  if (typeof status !== "string" || !CYCLE_STATUSES.includes(status as EvaluationCycle["status"])) {
    throw badRequest("Trạng thái không hợp lệ.", ["status: draft|open|closed|archived"]);
  }
  c.status = status as EvaluationCycle["status"];
  return cycleRow(ctx, c);
}

/* -------------------------------- criteria -------------------------------- */

function criterionPublic(c: Criterion): Record<string, unknown> {
  return { id: c.id, cycleId: c.cycleId, code: c.code, label: c.label, weight: c.weight, maxScore: c.maxScore };
}

async function listCriteria(ctx: Ctx): Promise<unknown> {
  const c = getCycle(ctx, ctx.params.id);
  const items = ctx.store.criteria.filter((x) => x.cycleId === c.id).map(criterionPublic);
  return { data: items };
}

async function addCriterion(ctx: Ctx): Promise<unknown> {
  const c = getCycle(ctx, ctx.params.id);
  const code = typeof ctx.body?.code === "string" ? ctx.body.code.trim().toUpperCase() : "";
  const label = typeof ctx.body?.label === "string" ? ctx.body.label.trim() : "";
  const weight = typeof ctx.body?.weight === "number" ? ctx.body.weight : NaN;
  const maxScore = typeof ctx.body?.maxScore === "number" ? ctx.body.maxScore : 100;
  const details: string[] = [];
  if (!code) details.push("code: bắt buộc");
  if (!label) details.push("label: bắt buộc");
  if (!(weight > 0 && weight <= 1)) details.push("weight: số trong khoảng (0, 1]");
  if (!(maxScore >= 10 && maxScore <= 100)) details.push("maxScore: 10-100");
  if (details.length) throw badRequest("Tiêu chí chưa hợp lệ.", details);
  if (ctx.store.criteria.some((x) => x.cycleId === c.id && x.code === code)) {
    throw conflict(`Tiêu chí '${code}' đã tồn tại trong chu kỳ này.`);
  }
  const criterion: Criterion = { id: randomId("cri"), cycleId: c.id, code, label, weight, maxScore };
  ctx.store.criteria.push(criterion);
  return criterionPublic(criterion);
}

async function patchCriterion(ctx: Ctx): Promise<unknown> {
  const cr = ctx.store.criteria.find((x) => x.id === ctx.params.id);
  if (!cr) throw notFound("Không tìm thấy tiêu chí.");
  const body = ctx.body ?? {};
  if (body.code != null) {
    if (typeof body.code !== "string" || !body.code.trim()) throw badRequest("Mã tiêu chí không hợp lệ.", ["code: bắt buộc"]);
    cr.code = body.code.trim().toUpperCase();
  }
  if (body.label != null) {
    if (typeof body.label !== "string" || !body.label.trim()) throw badRequest("Tên tiêu chí không hợp lệ.", ["label: bắt buộc"]);
    cr.label = body.label.trim();
  }
  if (body.weight != null) {
    if (typeof body.weight !== "number" || body.weight <= 0 || body.weight > 1) {
      throw badRequest("Trọng số phải trong khoảng (0, 1].", ["weight: (0, 1]"]);
    }
    cr.weight = body.weight;
  }
  if (body.maxScore != null) {
    if (typeof body.maxScore !== "number" || body.maxScore < 10 || body.maxScore > 100) {
      throw badRequest("Điểm tối đa phải 10-100.", ["maxScore: 10-100"]);
    }
    cr.maxScore = body.maxScore;
  }
  return criterionPublic(cr);
}

async function deleteCriterion(ctx: Ctx): Promise<unknown> {
  const cr = ctx.store.criteria.find((x) => x.id === ctx.params.id);
  if (!cr) throw notFound("Không tìm thấy tiêu chí.");
  ctx.store.criteria = ctx.store.criteria.filter((x) => x.id !== cr.id);
  // gỡ khỏi các evaluation của cycle
  for (const e of ctx.store.evaluations.filter((x) => x.cycleId === cr.cycleId)) {
    e.scores = e.scores.filter((s) => s.criterionId !== cr.id);
  }
  return { deleted: true, id: cr.id };
}

/* ------------------------------- evaluations ------------------------------- */

function evaluationRow(e: Evaluation): Record<string, unknown> {
  return {
    id: e.id,
    cycleId: e.cycleId,
    cycleName: e.cycleName,
    internId: e.internId,
    internName: e.internName,
    status: e.status,
    overallScore: e.overallScore,
    evaluatorName: e.evaluatorName,
    updatedAt: e.updatedAt,
  };
}

async function listEvaluations(ctx: Ctx): Promise<unknown> {
  const cycleId = ctx.query.get("cycleId");
  const status = ctx.query.get("status");
  let items = ctx.store.evaluations.filter(
    (e) => (cycleId ? e.cycleId === cycleId : true) && (status ? e.status === status : true)
  );
  items = items.slice().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  return pageOf(items.map(evaluationRow), ctx.query);
}

async function createEvaluation(ctx: Ctx): Promise<unknown> {
  const cycleId = typeof ctx.body?.cycleId === "string" ? ctx.body.cycleId : "";
  const internId = typeof ctx.body?.internId === "string" ? ctx.body.internId : "";
  if (!cycleId) throw badRequest("Cần chọn chu kỳ đánh giá.", ["cycleId: bắt buộc"]);
  if (!internId) throw badRequest("Cần chọn thực tập sinh.", ["internId: bắt buộc"]);
  const cycle = getCycle(ctx, cycleId);
  const intern = findUserById(internId);
  if (!intern) throw badRequest("Thực tập sinh không tồn tại.", ["internId: không hợp lệ"]);
  const hasAssignment = ctx.store.assignments.some((a) => a.internId === internId && a.status === "active");
  if (!hasAssignment) {
    throw badRequest("Chỉ tạo được đánh giá cho thực tập sinh đang có phân công hoạt động.", ["internId: chưa có assignment active"]);
  }
  if (ctx.store.evaluations.some((e) => e.cycleId === cycleId && e.internId === internId)) {
    throw conflict("Đã có đánh giá cho thực tập sinh này trong chu kỳ.");
  }
  const criteria = ctx.store.criteria.filter((c) => c.cycleId === cycle.id);
  const evaluation: Evaluation = {
    id: randomId("ev"),
    cycleId: cycle.id,
    cycleName: cycle.name,
    internId,
    internName: intern.displayName,
    status: "draft",
    overallScore: null,
    summary: null,
    evaluatorId: ctx.user!.id,
    evaluatorName: ctx.user!.displayName,
    scores: criteria.map((c) => ({
      criterionId: c.id,
      criterionCode: c.code,
      label: c.label,
      weight: c.weight,
      score: null,
      comment: null,
    })),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    submittedAt: null,
    finalizedAt: null,
  };
  ctx.store.evaluations.unshift(evaluation);
  pushAudit(ctx.user!.displayName, "CREATE", `Tạo đánh giá ${evaluation.id} cho ${intern.displayName}`);
  return evaluationRow(evaluation);
}

function getEvaluation(ctx: Ctx, id: string): Evaluation {
  const e = ctx.store.evaluations.find((x) => x.id === id);
  if (!e) throw notFound("Không tìm thấy đánh giá.");
  return e;
}

function recalcOverall(e: Evaluation): void {
  const filled = e.scores.filter((s) => s.score != null);
  const totalWeight = filled.reduce((a, s) => a + s.weight, 0);
  e.overallScore = filled.length ? Math.round(filled.reduce((a, s) => a + (s.score as number) * s.weight, 0) / (totalWeight || 1)) : null;
}

async function evaluationDetail(ctx: Ctx): Promise<unknown> {
  const e = getEvaluation(ctx, ctx.params.id);
  const intern = findUserById(e.internId);
  return {
    evaluation: {
      ...evaluationRow(e),
      summary: e.summary,
      createdAt: e.createdAt,
      submittedAt: e.submittedAt,
      finalizedAt: e.finalizedAt,
      scores: e.scores.map((s) => ({ criterionCode: s.criterionCode, label: s.label, score: s.score, comment: s.comment })),
    },
    scores: e.scores.map((s) => ({
      criterionId: s.criterionId,
      criterionCode: s.criterionCode,
      label: s.label,
      weight: s.weight,
      score: s.score,
      comment: s.comment,
    })),
    intern: intern
      ? {
          id: intern.id,
          displayName: intern.displayName,
          email: intern.email,
          avatarColor: intern.avatarColor,
          university: intern.university,
          studentId: intern.studentId,
        }
      : null,
  };
}

async function patchEvaluation(ctx: Ctx): Promise<unknown> {
  const e = getEvaluation(ctx, ctx.params.id);
  if (e.status !== "draft") throw conflict(`Không thể sửa đánh giá ở trạng thái '${e.status}'.`);
  const body = ctx.body ?? {};

  if (Array.isArray(body.scores)) {
    for (const input of body.scores as Record<string, unknown>[]) {
      const criterionId = typeof input.criterionId === "string" ? input.criterionId : null;
      const target = e.scores.find((s) => s.criterionId === criterionId);
      if (!target) continue;
      if (input.score != null) {
        if (typeof input.score !== "number" || input.score < 0 || input.score > 100) {
          throw badRequest(`Điểm tiêu chí '${target.criterionCode}' phải 0-100.`, [`scores.${target.criterionCode}: 0-100`]);
        }
        target.score = Math.round(input.score);
      } else if ("score" in input) {
        target.score = null;
      }
      if (input.comment != null) {
        target.comment = typeof input.comment === "string" && input.comment.trim() ? input.comment.trim() : null;
      }
    }
  }
  if (body.summary != null) {
    e.summary = typeof body.summary === "string" && body.summary.trim() ? body.summary.trim() : null;
  }
  recalcOverall(e);
  e.updatedAt = nowIso();
  return evaluationDetail(ctx);
}

async function submitEvaluation(ctx: Ctx): Promise<unknown> {
  const e = getEvaluation(ctx, ctx.params.id);
  if (e.status !== "draft") throw conflict(`Đánh giá đang ở trạng thái '${e.status}', không thể gửi.`);
  if (!e.scores.some((s) => s.score != null)) {
    throw badRequest("Cần chấm ít nhất một tiêu chí trước khi gửi.", ["scores: còn trống"]);
  }
  e.status = "submitted";
  e.submittedAt = nowIso();
  e.updatedAt = nowIso();
  pushAudit(ctx.user!.displayName, "UPDATE", `Gửi đánh giá ${e.id} (${e.internName})`);
  return evaluationRow(e);
}

async function finalizeEvaluation(ctx: Ctx): Promise<unknown> {
  const e = getEvaluation(ctx, ctx.params.id);
  if (e.status !== "submitted") throw conflict(`Đánh giá phải ở trạng thái 'submitted' để chốt (hiện '${e.status}').`);
  e.status = "finalized";
  e.finalizedAt = nowIso();
  e.updatedAt = nowIso();
  const sessionId = ctx.store.assignments.find((a) => a.internId === e.internId && a.status === "active")?.sessionId;
  if (sessionId) {
    pushTimeline(sessionId, "evaluation_finalized", `Chốt ${e.cycleName} cho ${e.internName}: ${e.overallScore ?? 0}/100.`, ctx.user!.displayName);
  }
  notifyUser(
    e.internId,
    "evaluation",
    `${e.cycleName} đã chốt: ${e.overallScore ?? 0}/100`,
    `Mentor ${ctx.user!.displayName} đã chốt đánh giá "${e.cycleName}" của bạn với số điểm ${e.overallScore ?? 0}/100. Xem chi tiết từng tiêu chí để cải thiện.`,
    "#/intern/evaluations"
  );
  pushAudit(ctx.user!.displayName, "STATUS_CHANGE", `Chốt đánh giá ${e.id} → finalized`);
  return evaluationRow(e);
}

/* ----------------------------- ai-suggestions ----------------------------- */

interface Suggestion {
  criterionCode: string;
  label: string;
  suggestedScore: number;
  comment: string;
  evidence: string[];
}

async function aiSuggestions(ctx: Ctx): Promise<unknown> {
  const e = getEvaluation(ctx, ctx.params.id);
  const intern = findUserById(e.internId);
  await sleep(1500);
  ctx.store.aiRuns += 1;

  const metrics = computePerformance(ctx.store, e.internId);
  const tasks = ctx.store.tasks.filter((t) => t.assigneeId === e.internId);
  const doneOnTime = tasks.filter((t) => t.status === "done" && isDoneOnTime(t));
  const late = tasks.filter((t) => t.status === "done" && !isDoneOnTime(t));
  const reworks = ctx.store.submissions.filter((s) => s.internId === e.internId && s.status === "rework");
  const commentsReceived = ctx.store.taskComments.filter(
    (c) => tasks.some((t) => t.id === c.taskId) && c.authorId !== e.internId
  ).length;

  const suggestions: Suggestion[] = [];
  const byCode = (code: string) => e.scores.find((s) => s.criterionCode === code);

  const tech = byCode("TECH_FOUNDATION");
  if (tech) {
    const aiScores = ctx.store.codeReviews
      .filter((c) => c.result && ctx.store.submissions.some((s) => s.id === c.submissionId && s.internId === e.internId))
      .map((c) => c.result!.score);
    const avgAi = aiScores.length ? Math.round(aiScores.reduce((a, b) => a + b, 0) / aiScores.length) : 72;
    const mentorScored = ctx.store.submissions.filter((s) => s.internId === e.internId && s.score != null);
    suggestions.push({
      criterionCode: "TECH_FOUNDATION",
      label: tech.label,
      suggestedScore: clamp(Math.round(avgAi * 0.9 + 12), 50, 95),
      comment: `Điểm AI review trung bình ${avgAi}/100 trên ${aiScores.length} bài nộp — đề xuất chậm lại 1 nhịp so với AI để phản ánh độ khó task.`,
      evidence: mentorScored.length
        ? mentorScored.slice(0, 2).map((s) => {
            const t = ctx.store.tasks.find((x) => x.id === s.taskId);
            return `${t?.code ?? s.taskId}: mentor chấm ${s.score}/100`;
          })
        : aiScores.length
          ? [`AI review trung bình ${avgAi}/100 trên ${aiScores.length} bài nộp (chờ mentor chốt)`]
          : ["Chưa có bài nộp nào được chấm điểm"],
    });
  }

  const delivery = byCode("TASK_DELIVERY");
  if (delivery) {
    const score = clamp(Math.round(metrics.taskCompletionRate * 0.6 + metrics.onTimeCompletionRate * 0.4), 40, 95);
    const evidence = [
      ...doneOnTime.slice(0, 2).map((t) => `${t.code} hoàn thành đúng hạn`),
      ...(late.length ? [`${late[0].code} hoàn thành trễ hạn`] : []),
      ...(reworks.length ? [`${reworks.length} bài nộp phải làm lại`] : []),
    ];
    suggestions.push({
      criterionCode: "TASK_DELIVERY",
      label: delivery.label,
      suggestedScore: score,
      comment: `Hoàn thành ${metrics.completedTaskCount}/${metrics.totalTaskCount} nhiệm vụ (${metrics.taskCompletionRate}%), đúng hạn ${metrics.onTimeCompletionRate}%.`,
      evidence: evidence.length ? evidence : ["Chưa có nhiệm vụ nào hoàn thành trong kỳ"],
    });
  }

  const teamwork = byCode("TEAMWORK");
  if (teamwork) {
    const given = ctx.store.taskComments.filter((c) => c.authorId === e.internId).length;
    suggestions.push({
      criterionCode: "TEAMWORK",
      label: teamwork.label,
      suggestedScore: clamp(68 + given * 3 + commentsReceived, 55, 92),
      comment: `Tích cực trao đổi trên ${commentsReceived} nhận xét nhận được và để lại ${given} nhận xét hỗ trợ đồng đội.`,
      evidence: [
        `Tham gia ${commentsReceived + given} lượt trao đổi trên task`,
        ...(given ? [`Để lại ${given} nhận xét hỗ trợ đồng đội`] : []),
      ],
    });
  }

  const communication = byCode("COMMUNICATION");
  if (communication) {
    const convs = ctx.store.mentorConversations.filter((c) => c.userId === e.internId).length;
    suggestions.push({
      criterionCode: "COMMUNICATION",
      label: communication.label,
      suggestedScore: clamp(70 + convs * 2, 55, 93),
      comment: `${convs} cuộc hội thoại với AI Mentor — mô tả vấn đề rõ ràng, biết đặt câu hỏi có ngữ cảnh.`,
      evidence: [`Hỏi đáp AI Mentor ${convs} chủ đề`, "Báo cáo tiến độ task đều đặn"],
    });
  }

  const growth = byCode("GROWTH");
  if (growth) {
    const prevFinal = ctx.store.evaluations
      .filter((x) => x.internId === e.internId && x.status === "finalized" && x.id !== e.id)
      .sort((a, b) => (a.finalizedAt! < b.finalizedAt! ? 1 : -1))[0];
    const delta = prevFinal?.overallScore != null ? metrics.averageEvaluationScore != null ? metrics.averageEvaluationScore - prevFinal.overallScore : 0 : null;
    suggestions.push({
      criterionCode: "GROWTH",
      label: growth.label,
      suggestedScore: clamp((metrics.averageEvaluationScore ?? 75) + 3, 50, 95),
      comment:
        delta != null
          ? `Điểm đánh giá chốt ${delta >= 0 ? "tăng" : "giảm"} ${Math.abs(delta)} điểm so với lần chốt trước.`
          : "Tiến bộ ổn định qua các sprint — đề xuất điểm tăng nhẹ so với mức trung bình.",
      evidence: [
        ...(prevFinal ? [`Lần chốt trước: ${prevFinal.overallScore}/100 (${prevFinal.cycleName})`] : []),
        `Tiến độ sprint hiện tại: ${metrics.activeSprintProgress ?? 0}%`,
      ],
    });
  }

  const strengths = [
    ...(metrics.onTimeCompletionRate >= 80 ? ["Giao task đúng nhịp, hiếm khi trễ hạn"] : []),
    ...(metrics.overdueOpenTaskCount === 0 ? ["Không có task trễ hạn đang mở"] : []),
    ...(reworks.length === 0 ? ["Bài nộp đạt ngay lần đầu"] : []),
    "Chủ động hỏi đáp mentor khi vướng",
  ].slice(0, 3);

  const improvementAreas = [
    ...(metrics.overdueOpenTaskCount > 0 ? [`${metrics.overdueOpenTaskCount} task trễ hạn cần đẩy nhanh`] : []),
    ...(reworks.length > 0 ? ["Chất lượng bài nộp lần đầu cần cẩn thận hơn (có rework)"] : []),
    ...(metrics.taskCompletionRate < 70 ? ["Tỷ lệ hoàn thành task còn thấp so với kế hoạch"] : []),
    "Viết test cho các component trọng yếu",
  ].slice(0, 3);

  return {
    summary: `Đề xuất heuristics dựa trên ${metrics.totalTaskCount} nhiệm vụ, ${ctx.store.submissions.filter((s) => s.internId === e.internId).length} bài nộp và lịch sử đánh giá của ${intern?.displayName ?? "thực tập sinh"} — mentor xem xét và điều chỉnh trước khi chốt.`,
    strengths,
    improvementAreas,
    criteriaSuggestions: suggestions,
  };
}

export const evaluationRoutes: RouteDef[] = [
  route("GET", "/evaluation-cycles", ["instructor", "admin"], listCycles),
  route("POST", "/evaluation-cycles", ["instructor", "admin"], createCycle),
  route("GET", "/evaluation-cycles/:id/criteria", ["instructor", "admin"], listCriteria),
  route("POST", "/evaluation-cycles/:id/criteria", ["instructor", "admin"], addCriterion),
  route("POST", "/evaluation-cycles/:id/status", ["instructor", "admin"], cycleStatus),
  route("PATCH", "/criteria/:id", ["instructor", "admin"], patchCriterion),
  route("DELETE", "/criteria/:id", ["instructor", "admin"], deleteCriterion),
  route("GET", "/evaluations", ["instructor", "admin"], listEvaluations),
  route("POST", "/evaluations", ["instructor", "admin"], createEvaluation),
  route("GET", "/evaluations/:id", ["instructor", "admin"], evaluationDetail),
  route("PATCH", "/evaluations/:id", ["instructor", "admin"], patchEvaluation),
  route("POST", "/evaluations/:id/submit", ["instructor", "admin"], submitEvaluation),
  route("POST", "/evaluations/:id/finalize", ["instructor", "admin"], finalizeEvaluation),
  route("POST", "/evaluations/:id/ai-suggestions", ["instructor", "admin"], aiSuggestions),
];
