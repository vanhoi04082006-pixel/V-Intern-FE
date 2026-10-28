/**
 * Outcomes (intern): evaluations, performance, KPI, lương ảo, chứng chỉ
 * (+ verify public), AI recommendations.
 */

import type { Certificate, Evaluation, KpiRecord, RecommendationSet, SalaryEntry } from "../types";
import { activeAssignmentOf } from "../store";
import { nowIso, randomId } from "../util";
import { computePerformance } from "../perf";
import { notFound, pageOf, route, sleep, type RouteDef, type Ctx } from "./common";

/* ------------------------------ evaluations ------------------------------ */

function evaluationPublic(e: Evaluation): Record<string, unknown> {
  return {
    id: e.id,
    cycleId: e.cycleId,
    cycleName: e.cycleName,
    status: e.status,
    overallScore: e.overallScore,
    summary: e.summary,
    evaluatorName: e.evaluatorName,
    finalizedAt: e.finalizedAt,
    submittedAt: e.submittedAt,
    scores: e.scores.map((s) => ({ criterionCode: s.criterionCode, label: s.label, score: s.score, comment: s.comment })),
  };
}

async function myEvaluations(ctx: Ctx): Promise<unknown> {
  const items = ctx.store.evaluations
    .filter((e) => e.internId === ctx.user!.id)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .map(evaluationPublic);
  return { data: items };
}

/* ------------------------------- performance ------------------------------- */

async function myPerformance(ctx: Ctx): Promise<unknown> {
  return computePerformance(ctx.store, ctx.user!.id);
}

/* ----------------------------------- KPI ----------------------------------- */

function kpiSummary(k: KpiRecord): Record<string, unknown> {
  return { id: k.id, period: k.period, status: k.status, finalScore: k.finalScore, calculatedAt: k.calculatedAt };
}

async function myKpis(ctx: Ctx): Promise<unknown> {
  const items = ctx.store.kpis
    .filter((k) => k.userId === ctx.user!.id)
    .sort((a, b) => (a.period < b.period ? 1 : -1))
    .map(kpiSummary);
  return { data: items };
}

async function myKpiDetail(ctx: Ctx): Promise<unknown> {
  const k = ctx.store.kpis.find((x) => x.id === ctx.params.id && x.userId === ctx.user!.id);
  if (!k) throw notFound("Không tìm thấy kỳ KPI.");
  return { ...kpiSummary(k), metrics: k.metrics };
}

/* ------------------------------ virtual salary ------------------------------ */

function ledgerPublic(e: SalaryEntry): Record<string, unknown> {
  return { id: e.id, type: e.type, amount: e.amount, description: e.description, at: e.at };
}

async function myVirtualSalary(ctx: Ctx): Promise<unknown> {
  const entries = ctx.store.salaryEntries
    .filter((e) => e.userId === ctx.user!.id)
    .sort((a, b) => (a.at < b.at ? 1 : -1));
  const balance = entries.reduce((a, e) => a + e.amount, 0);
  const cutoff = Date.now() - 30 * 86400000;
  const earnedThisPeriod = entries
    .filter((e) => e.amount > 0 && new Date(e.at).getTime() >= cutoff)
    .reduce((a, e) => a + e.amount, 0);
  return {
    balance,
    unit: "VND",
    virtual: true,
    earnedThisPeriod,
    latestEntries: entries.slice(0, 5).map(ledgerPublic),
  };
}

async function mySalaryLedger(ctx: Ctx): Promise<unknown> {
  const items = ctx.store.salaryEntries
    .filter((e) => e.userId === ctx.user!.id)
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .map(ledgerPublic);
  return pageOf(items, ctx.query);
}

/* ------------------------------- certificates ------------------------------- */

function certificatePublic(c: Certificate): Record<string, unknown> {
  return {
    id: c.id,
    certificateNumber: c.certificateNumber,
    status: c.status,
    issuedAt: c.issuedAt,
    projectName: c.projectName,
    sessionName: c.sessionName,
  };
}

function certificateDetail(c: Certificate): Record<string, unknown> {
  return {
    ...certificatePublic(c),
    verificationCode: c.verificationCode,
    completedAt: c.completedAt,
    policyCode: c.policyCode,
    revokedAt: c.revokedAt,
  };
}

async function myCertificates(ctx: Ctx): Promise<unknown> {
  const items = ctx.store.certificates
    .filter((c) => c.userId === ctx.user!.id)
    .sort((a, b) => (a.issuedAt < b.issuedAt ? 1 : -1))
    .map(certificatePublic);
  return { data: items };
}

async function myCertificateDetail(ctx: Ctx): Promise<unknown> {
  const c = ctx.store.certificates.find((x) => x.id === ctx.params.id && x.userId === ctx.user!.id);
  if (!c) throw notFound("Không tìm thấy chứng chỉ.");
  return certificateDetail(c);
}

/** PUBLIC — tra cứu chứng chỉ theo mã verification. */
async function verifyCertificate(ctx: Ctx): Promise<unknown> {
  const code = ctx.params.code.trim().toUpperCase();
  const c = ctx.store.certificates.find((x) => x.verificationCode.toUpperCase() === code);
  if (!c) {
    return { valid: false, reason: "Mã chứng chỉ không tồn tại trong hệ thống. Vui lòng kiểm tra lại mã tra cứu." };
  }
  if (c.status === "revoked") {
    return { valid: false, reason: c.revokeReason ?? "Chứng chỉ đã bị thu hồi." };
  }
  const holder = ctx.store.users.find((u) => u.id === c.userId);
  return {
    valid: true,
    certificateNumber: c.certificateNumber,
    holderName: holder?.displayName ?? "—",
    projectName: c.projectName,
    sessionName: c.sessionName,
    issuedAt: c.issuedAt,
  };
}

/* --------------------------- AI recommendations --------------------------- */

interface RecSeed {
  type: "skill" | "process" | "career";
  priority: "high" | "medium" | "low";
  title: string;
  reason: string;
  actions: string[];
  evidenceMetricCodes: string[];
}

/** Sinh 4 gợi ý heuristic từ performance thật của intern. */
function generateRecommendations(ctx: Ctx, userId: string, variant: number): { summary: string; recommendations: RecSeed[] } {
  const metrics = computePerformance(ctx.store, userId);
  const user = ctx.store.users.find((u) => u.id === userId);
  const assignment = activeAssignmentOf(userId);
  const v = variant % 3;

  const recs: RecSeed[] = [];

  // 1) Kỹ năng — mạnh nhất theo điểm rubric testing hoặc task completion thấp
  recs.push({
    type: "skill",
    priority: metrics.taskCompletionRate < 60 ? "high" : "medium",
    title: v === 0 ? "Nâng cấp kỹ năng testing với React Testing Library" : v === 1 ? "Củng cố kỹ năng viết test tự động cho tính năng đang làm" : "Luyện viết unit test cho 2 component trọng yếu",
    reason:
      metrics.taskCompletionRate < 60
        ? `Bạn mới hoàn thành ${metrics.completedTaskCount}/${metrics.totalTaskCount} nhiệm vụ (${metrics.taskCompletionRate}%) — chất lượng test là đòn bẩy để giảm rework.`
        : `Tiến độ hiện tại ${metrics.taskCompletionRate}% — đầu tư vào testing giúp giữ chất lượng khi tốc độ tăng.`,
    actions: [
      "Viết test cho 2 component đang thiếu",
      `Áp dụng testing vào ${Math.max(1, metrics.overdueOpenTaskCount + 1)} task sắp tới`,
      "Đọc tài liệu RTL 2 buổi/tuần và áp dụng ngay",
    ],
    evidenceMetricCodes: ["TASK_COMPLETION", "CODE_QUALITY"],
  });

  // 2) Quy trình — rủi ro deadline
  recs.push({
    type: "process",
    priority: metrics.overdueOpenTaskCount > 0 || metrics.onTimeCompletionRate < 85 ? "high" : "medium",
    title: v === 0 ? "Chủ động báo cáo rủi ro deadline sớm hơn" : v === 1 ? "Quản lý tiến độ task theo checklist mỗi ngày" : "Chia nhỏ task lớn và cập nhật tiến độ cuối ngày",
    reason: metrics.overdueOpenTaskCount > 0
      ? `Bạn đang có ${metrics.overdueOpenTaskCount} nhiệm vụ trễ hạn mở — báo cáo sớm giúp mentor can thiệp kịp.`
      : `Tỷ lệ giao đúng hạn ${metrics.onTimeCompletionRate}% — duy trì bằng nhịp cập nhật tiến độ đều đặn.`,
    actions: ["Cập nhật tiến độ task mỗi cuối ngày", "Khi thấy rủi ro trễ, thông báo mentor trước 3 ngày", "Chia nhỏ task > 8h thành checklist con"],
    evidenceMetricCodes: ["ON_TIME_DELIVERY"],
  });

  // 3) Kỹ năng chuyên sâu theo role
  const role = assignment?.role ?? "frontend";
  recs.push({
    type: "skill",
    priority: "medium",
    title: v === 2 ? `Học sâu công nghệ cốt lõi vai trò ${role}` : v === 1 ? `Làm mini-lab ${role === "backend" ? "caching & indexing" : role === "qa" ? "test automation" : "rendering & caching"}` : "Đọc thêm tài liệu gốc của framework đang dùng",
    reason: "Kiến thức nền vững giúp bạn tự tin nhận task khó hơn ở sprint cuối.",
    actions: ["Làm 1 mini lab nhỏ về chủ đề mới", "Refactor 1 phần code hiện có theo pattern học được", "Ghi chú ADR cho các quyết định kỹ thuật"],
    evidenceMetricCodes: ["CODE_QUALITY"],
  });

  // 4) Định hướng nghề nghiệp
  recs.push({
    type: "career",
    priority: "low",
    title: v === 0 ? "Chuẩn bị portfolio cá nhân từ dự án thực tập" : v === 1 ? "Gom dự án thực tập thành case study portfolio" : "Viết README nổi bật và deploy bản demo",
    reason: "Kỳ thực tập đang cho kết quả tốt — đây là thời điểm gom thành sản phẩm portfolio để xin việc.",
    actions: ["Viết README dự án theo cấu trúc nổi bật", "Trích 3 khó điểm kỹ thuật thành case study", "Deploy bản demo công khai"],
    evidenceMetricCodes: ["GROWTH"],
  });

  const summary = `Dựa trên ${metrics.totalTaskCount} nhiệm vụ, ${ctx.store.submissions.filter((s) => s.internId === userId).length} bài nộp và tiến độ hiện tại, AI đề xuất ${recs.length} hành động ưu tiên cho 4 tuần tới${user ? ` cho ${user.displayName}` : ""}.`;
  return { summary, recommendations: recs };
}

function ensureRecommendations(ctx: Ctx): RecommendationSet {
  const userId = ctx.user!.id;
  let set = ctx.store.recommendations
    .filter((r) => r.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];
  if (!set) {
    const gen = generateRecommendations(ctx, userId, 0);
    set = {
      id: randomId("rec"),
      userId,
      createdAt: nowIso(),
      summary: gen.summary,
      recommendations: gen.recommendations,
    };
    ctx.store.recommendations.push(set);
  }
  return set;
}

async function myRecommendations(ctx: Ctx): Promise<unknown> {
  const set = ensureRecommendations(ctx);
  return { id: set.id, createdAt: set.createdAt, summary: set.summary, recommendations: set.recommendations };
}

async function refreshRecommendations(ctx: Ctx): Promise<unknown> {
  const userId = ctx.user!.id;
  const previous = ctx.store.recommendations
    .filter((r) => r.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];
  const variant = previous ? Math.floor(new Date(previous.createdAt).getTime() / 3600000) + 1 : 1;
  await sleep(1500);
  const gen = generateRecommendations(ctx, userId, variant);
  const set: RecommendationSet = {
    id: randomId("rec"),
    userId,
    createdAt: nowIso(),
    summary: gen.summary,
    recommendations: gen.recommendations,
  };
  ctx.store.recommendations.unshift(set);
  ctx.store.aiRuns += 1;
  return { id: set.id, createdAt: set.createdAt, summary: set.summary, recommendations: set.recommendations };
}

export const outcomeRoutes: RouteDef[] = [
  route("GET", "/intern/me/evaluations", "intern", myEvaluations),
  route("GET", "/intern/me/performance", "intern", myPerformance),
  route("GET", "/intern/me/kpi", "intern", myKpis),
  route("GET", "/intern/me/kpi/:id", "intern", myKpiDetail),
  route("GET", "/intern/me/virtual-salary", "intern", myVirtualSalary),
  route("GET", "/intern/me/virtual-salary/ledger", "intern", mySalaryLedger),
  route("GET", "/intern/me/certificates", "intern", myCertificates),
  route("GET", "/intern/me/certificates/:id", "intern", myCertificateDetail),
  route("GET", "/certificates/verify/:code", "public", verifyCertificate),
  route("GET", "/intern/me/ai-recommendations", "intern", myRecommendations),
  route("POST", "/intern/me/ai-recommendations/refresh", "intern", refreshRecommendations),
];
