// handlers/eval.ts — evaluation cycles, evaluations, AI suggestions,
// imported reviews, KPI periods, virtual salary, certificates.
import { db, defaultCriteria } from "../data";
import { json, err, notFound, paginate, nowIso, nid, userName, matches } from "../lib";
import type { Ctx } from "../lib";
import { buildPdf } from "../pdf";

/* ============================ Evaluation cycles ============================ */

const CYCLE_TRANSITIONS: Record<string, string[]> = {
  draft: ["open"], open: ["closed"], closed: ["archived"], archived: [],
};

export function listCycles(ctx: Ctx): Response {
  const status = ctx.url.searchParams.get("status");
  const rows = db.evaluationCycles.filter((c) => !status || c.status === status);
  return json(paginate(rows, ctx.url));
}

export function createCycle(ctx: Ctx): Response {
  const b = ctx.body || {};
  if (!b.code || !b.name || !b.type || !b.startDate || !b.endDate) {
    return err(400, "VALIDATION_ERROR", "Thiếu thông tin kỳ đánh giá (code, name, type, startDate, endDate).");
  }
  const c = {
    id: nid("ec"), code: String(b.code), name: String(b.name), type: String(b.type),
    status: "draft" as const, sessionId: b.sessionId ?? null, projectId: b.projectId ?? null,
    startDate: String(b.startDate), endDate: String(b.endDate), dueDate: b.dueDate ?? null,
    criteria: b.useDefaultTemplate === false ? [] : defaultCriteria([nid("c"), nid("c"), nid("c"), nid("c")]),
    version: 1, createdAt: nowIso(),
  };
  db.evaluationCycles.push(c);
  return json(c, 201);
}

export function cycleStatus(ctx: Ctx): Response {
  const c = db.evaluationCycles.find((x) => x.id === ctx.params.id);
  if (!c) return notFound();
  const target = ctx.body?.status;
  if (!target || !CYCLE_TRANSITIONS[c.status].includes(target)) {
    return err(400, "INVALID_TRANSITION", `Không thể chuyển kỳ đánh giá từ ${c.status} sang ${target ?? "(trống)"}.`);
  }
  c.status = target;
  c.version += 1;
  return json(c);
}

export function cycleCriteria(ctx: Ctx): Response {
  const c = db.evaluationCycles.find((x) => x.id === ctx.params.id);
  if (!c) return notFound();
  return json(c.criteria);
}

/* ============================ Evaluations ============================ */

function evaluationDto(e: any) {
  const cycle = db.evaluationCycles.find((c) => c.id === e.cycleId);
  const critById = new Map((cycle?.criteria ?? []).map((c) => [c.id, c]));
  return {
    id: e.id, cycleId: e.cycleId, cycle: { name: cycle?.name ?? "" },
    intern: { displayName: userName(e.internId) }, internId: e.internId,
    evaluator: e.evaluatorId ? { displayName: userName(e.evaluatorId) } : null,
    status: e.status, overallScore: e.overallScore, summary: e.summary,
    scores: e.scores.map((s: any) => {
      const c = critById.get(s.criterionId);
      return {
        criterionId: s.criterionId, code: c?.code ?? s.criterionId, name: c?.name ?? "",
        weight: c?.weight ?? 0, score: s.score, maxScore: c?.maxScore ?? 10, comment: s.comment,
      };
    }),
    version: e.version,
  };
}

export function listEvaluations(ctx: Ctx): Response {
  const sp = ctx.url.searchParams;
  const rows = db.evaluations.filter((e) =>
    (!sp.get("cycleId") || e.cycleId === sp.get("cycleId")) &&
    (!sp.get("internId") || e.internId === sp.get("internId")) &&
    (!sp.get("status") || e.status === sp.get("status")));
  return json(paginate(rows.map(evaluationDto), ctx.url));
}

export function createEvaluation(ctx: Ctx): Response {
  const b = ctx.body || {};
  const cycle = db.evaluationCycles.find((c) => c.id === b.cycleId);
  if (!cycle) return err(400, "VALIDATION_ERROR", "Kỳ đánh giá không tồn tại.");
  if (!b.internId) return err(400, "VALIDATION_ERROR", "Thiếu internId.");
  const e = {
    id: nid("ev"), cycleId: cycle.id, internId: String(b.internId),
    evaluatorId: b.evaluatorId ?? ctx.user!.id, status: "draft" as const,
    overallScore: null, summary: null,
    scores: cycle.criteria.map((c) => ({ criterionId: c.id, score: null, comment: null })),
    version: 1, createdAt: nowIso(),
  };
  db.evaluations.push(e);
  return json(evaluationDto(e), 201);
}

export function patchEvaluation(ctx: Ctx): Response {
  const e = db.evaluations.find((x) => x.id === ctx.params.id);
  if (!e) return notFound();
  if (e.status === "finalized") return err(400, "ALREADY_FINALIZED", "Đánh giá đã chốt, không thể sửa.");
  const b = ctx.body || {};
  if (b.expectedVersion !== undefined && b.expectedVersion !== e.version) {
    return err(409, "VERSION_CONFLICT", "Đánh giá đã bị cập nhật bởi người khác.");
  }
  if (Array.isArray(b.scores)) {
    for (const s of b.scores) {
      const found = e.scores.find((x) => x.criterionId === s.criterionId);
      if (found) { found.score = s.score ?? null; found.comment = s.comment ?? found.comment; }
    }
  }
  if (b.summary !== undefined) e.summary = b.summary;
  const cycle = db.evaluationCycles.find((c) => c.id === e.cycleId);
  const critById = new Map((cycle?.criteria ?? []).map((c) => [c.id, c]));
  // overallScore = Σ (score / 10 * weight) over scored criteria
  const total = e.scores.reduce((acc, s) => {
    if (typeof s.score === "number") {
      const w = critById.get(s.criterionId)?.weight ?? 0;
      return acc + (s.score / 10) * w;
    }
    return acc;
  }, 0);
  e.overallScore = +total.toFixed(2);
  e.version += 1;
  return json(evaluationDto(e));
}

export function submitEvaluation(ctx: Ctx): Response {
  const e = db.evaluations.find((x) => x.id === ctx.params.id);
  if (!e) return notFound();
  if (e.status !== "draft") return err(400, "INVALID_TRANSITION", `Không thể nộp đánh giá ở trạng thái ${e.status}.`);
  e.status = "submitted";
  e.version += 1;
  e.submittedAt = nowIso();
  return json(evaluationDto(e));
}

export function finalizeEvaluation(ctx: Ctx): Response {
  const e = db.evaluations.find((x) => x.id === ctx.params.id);
  if (!e) return notFound();
  if (e.status !== "submitted") return err(400, "INVALID_TRANSITION", `Chỉ đánh giá đã nộp mới được chốt (hiện tại: ${e.status}).`);
  e.status = "finalized";
  e.finalizedAt = nowIso();
  e.version += 1;
  db.auditLogs.push({ id: nid("al"), actorId: ctx.user!.id, actorName: ctx.user!.displayName, action: "evaluation.finalized", module: "evaluations", createdAt: nowIso() });
  return json(evaluationDto(e));
}

/* ============================ AI suggestions ============================ */

export function aiSuggestions(ctx: Ctx): Response {
  const rows = db.aiSuggestions.filter((s) => s.evaluationId === ctx.params.id);
  return json(paginate(rows, ctx.url));
}

export function createAiSuggestion(ctx: Ctx): Response {
  const e = db.evaluations.find((x) => x.id === ctx.params.id);
  if (!e) return notFound();
  const s = {
    id: nid("ais"), evaluationId: e.id, status: "ready",
    draftSummary: "Học viên có tinh thần trách nhiệm tốt, hoàn thành đúng tiến độ các nhiệm vụ được giao. Chất lượng mã nguồn ổn định, nên chú ý thêm unit test ở những module nghiệp vụ phức tạp.",
    draftScores: [
      { code: "TECH_QUALITY", score: 8.2 }, { code: "DELIVERY", score: 8.0 },
      { code: "COLLABORATION", score: 7.6 }, { code: "GROWTH", score: 8.4 },
    ],
    createdAt: nowIso(),
  };
  db.aiSuggestions.push(s);
  return json(s, 201);
}

/* ============================ Imported reviews ============================ */

function importedDto(r: any) {
  return {
    id: r.id, intern: { displayName: userName(r.internId) }, repositoryUrl: r.repositoryUrl,
    score: r.score, status: r.status, feedback: r.feedback, version: r.version, createdAt: r.createdAt,
  };
}

export function listImportedReviews(ctx: Ctx): Response {
  const q = ctx.url.searchParams.get("q") ?? undefined;
  const rows = db.importedReviews
    .filter((r) => !q || matches(userName(r.internId), q) || matches(r.repositoryUrl, q))
    .map(importedDto);
  return json(paginate(rows, ctx.url));
}

export function patchImportedReview(ctx: Ctx): Response {
  const r = db.importedReviews.find((x) => x.id === ctx.params.id);
  if (!r) return notFound();
  const b = ctx.body || {};
  if (b.version !== undefined && b.version !== r.version) {
    return err(409, "VERSION_CONFLICT", "Bản review đã bị cập nhật bởi người khác.");
  }
  for (const k of ["score", "status", "feedback"]) if (b[k] !== undefined) (r as any)[k] = b[k];
  r.version += 1;
  return json(importedDto(r));
}

/* ============================ KPI ============================ */

const KPI_TRANSITIONS: Record<string, string[]> = {
  draft: ["open"], open: ["finalized"], finalized: ["closed"], closed: [],
};

export function listKpiPeriods(ctx: Ctx): Response {
  const status = ctx.url.searchParams.get("status");
  const rows = db.kpiPeriods.filter((p) => !status || p.status === status);
  return json(paginate(rows, ctx.url));
}

export function createKpiPeriod(ctx: Ctx): Response {
  const b = ctx.body || {};
  if (!b.code || !b.name || !b.startDate || !b.endDate) {
    return err(400, "VALIDATION_ERROR", "Thiếu thông tin kỳ KPI (code, name, startDate, endDate).");
  }
  const p = {
    id: nid("kp"), code: String(b.code), name: String(b.name), status: "draft" as const,
    startDate: String(b.startDate), endDate: String(b.endDate), version: 1, resultCount: 0, createdAt: nowIso(),
  };
  db.kpiPeriods.push(p);
  return json(p, 201);
}

export function kpiPeriodStatus(ctx: Ctx): Response {
  const p = db.kpiPeriods.find((x) => x.id === ctx.params.id);
  if (!p) return notFound();
  const target = ctx.body?.status;
  if (!target || !KPI_TRANSITIONS[p.status].includes(target)) {
    return err(400, "INVALID_TRANSITION", `Không thể chuyển kỳ KPI từ ${p.status} sang ${target ?? "(trống)"}.`);
  }
  p.status = target;
  p.version += 1;
  return json(p);
}

export function kpiCalculate(ctx: Ctx): Response {
  const p = db.kpiPeriods.find((x) => x.id === ctx.params.id);
  if (!p) return notFound();
  const interns = db.users.filter((u) => u.roles.includes("intern"));
  let created = 0;
  for (const intern of interns) {
    if (db.kpiResults.some((r) => r.periodId === p.id && r.userId === intern.id)) continue;
    const m = (db.kpiResults.length + created) % 10;
    const score = +(6 + (m / 10) * 3).toFixed(1); // 6.0 .. 9.0
    db.kpiResults.push({
      id: nid("kr"), periodId: p.id, userId: intern.id, totalScore: score, rank: 0,
      components: [
        { code: "TASK", name: "Hoàn thành công việc", score: Math.min(10, score + 0.3), weight: 40, detail: `Tính toán tự động từ tiến độ task của ${intern.displayName}.` },
        { code: "QUALITY", name: "Chất lượng công việc", score: Math.min(10, score), weight: 30, detail: "Điểm trung bình các bài review code trong kỳ." },
        { code: "COLLAB", name: "Hợp tác & giao tiếp", score: Math.min(10, score - 0.4), weight: 15, detail: "Đánh giá từ mentor và đồng nhóm." },
        { code: "DISCIPLINE", name: "Kỷ luật", score: Math.min(10, score + 0.1), weight: 15, detail: "Dựa trên dữ liệu điểm danh và đi trễ." },
      ],
      createdAt: nowIso(),
    });
    created++;
  }
  const results = db.kpiResults.filter((r) => r.periodId === p.id).sort((a, b) => b.totalScore - a.totalScore);
  results.forEach((r, i) => (r.rank = i + 1));
  p.resultCount = results.length;
  return json({ calculated: created, total: results.length });
}

export function kpiFinalize(ctx: Ctx): Response {
  const p = db.kpiPeriods.find((x) => x.id === ctx.params.id);
  if (!p) return notFound();
  p.status = "finalized";
  p.version += 1;
  return json({ finalized: true, resultCount: p.resultCount });
}

export function kpiResults(ctx: Ctx): Response {
  const p = db.kpiPeriods.find((x) => x.id === ctx.params.id);
  if (!p) return notFound();
  const rows = db.kpiResults
    .filter((r) => r.periodId === p.id)
    .map((r) => ({ id: r.id, intern: { displayName: userName(r.userId) }, periodName: p.name, totalScore: r.totalScore, rank: r.rank, components: r.components }));
  return json(paginate(rows, ctx.url));
}

/* ============================ Virtual salary ============================ */

export function generateSalary(ctx: Ctx): Response {
  const p = db.kpiPeriods.find((x) => x.id === ctx.params.kpiPeriodId);
  if (!p) return notFound();
  const results = db.kpiResults.filter((r) => r.periodId === p.id);
  let generated = 0;
  for (const r of results) {
    const amount = Math.round((r.totalScore * 300000) / 10000) * 10000; // ~2-3 triệu
    db.salaryEntries.push({
      id: nid("se"), userId: r.userId, type: "payout", amount,
      reason: `Chi trả lương ảo kỳ ${p.name}`, kpiPeriodName: p.name, createdAt: nowIso(),
    });
    generated++;
  }
  return json({ generated, periodId: p.id, periodName: p.name });
}

export function createAdjustment(ctx: Ctx): Response {
  const b = ctx.body || {};
  if (!b.userId || !b.type || b.amount === undefined) {
    return err(400, "VALIDATION_ERROR", "Thiếu userId, type hoặc amount.");
  }
  const period = b.kpiPeriodId ? db.kpiPeriods.find((p) => p.id === b.kpiPeriodId) : null;
  const entry = {
    id: nid("se"), userId: String(b.userId), type: b.type as "payout" | "bonus" | "penalty",
    amount: Number(b.amount), reason: String(b.reason ?? ""), kpiPeriodName: period?.name ?? null, createdAt: nowIso(),
  };
  db.salaryEntries.push(entry);
  return json({ ...entry, userName: userName(entry.userId) }, 201);
}

export function listSalaryEntries(ctx: Ctx): Response {
  const sp = ctx.url.searchParams;
  const rows = db.salaryEntries
    .filter((e) => (!sp.get("userId") || e.userId === sp.get("userId")) && (!sp.get("type") || e.type === sp.get("type")))
    .map((e) => ({ id: e.id, userId: e.userId, userName: userName(e.userId), type: e.type, amount: e.amount, reason: e.reason, kpiPeriodName: e.kpiPeriodName, createdAt: e.createdAt }));
  return json(paginate(rows, ctx.url));
}

export function salaryBalance(ctx: Ctx): Response {
  const userId = ctx.params.userId;
  const balance = db.salaryEntries.filter((e) => e.userId === userId).reduce((s, e) => s + e.amount, 0);
  return json({ balance });
}

/* ============================ Certificates ============================ */

function certificateDto(c: any) {
  return {
    id: c.id, certificateNumber: c.certificateNumber, holder: { displayName: userName(c.userId) },
    userId: c.userId, role: c.role,
    project: { name: db.projects.find((p) => p.id === c.projectId)?.name ?? "" },
    status: c.status, issuedAt: c.issuedAt, revokedAt: c.revokedAt,
  };
}

export function listCertificates(ctx: Ctx): Response {
  const sp = ctx.url.searchParams;
  const rows = db.certificates
    .filter((c) => (!sp.get("userId") || c.userId === sp.get("userId")) && (!sp.get("status") || c.status === sp.get("status")))
    .map(certificateDto);
  return json(paginate(rows, ctx.url));
}

export function issueCertificate(ctx: Ctx): Response {
  const b = ctx.body || {};
  if (!b.userId || !b.projectId) return err(400, "VALIDATION_ERROR", "Thiếu userId hoặc projectId.");
  const seq = String(db.certificates.length + 1).padStart(3, "0");
  const c = {
    id: nid("cert"), certificateNumber: `V-INTERN-2026-${seq}`, userId: String(b.userId),
    role: b.roleCode ?? "intern", projectId: String(b.projectId), status: "issued" as const,
    issuedAt: nowIso(), revokedAt: null, revokeReason: null,
  };
  db.certificates.push(c);
  db.auditLogs.push({ id: nid("al"), actorId: ctx.user!.id, actorName: ctx.user!.displayName, action: "certificate.issued", module: "certificates", createdAt: nowIso() });
  return json(certificateDto(c), 201);
}

export function revokeCertificate(ctx: Ctx): Response {
  const c = db.certificates.find((x) => x.id === ctx.params.id);
  if (!c) return notFound();
  c.status = "revoked";
  c.revokedAt = nowIso();
  c.revokeReason = ctx.body?.reason ?? null;
  return json(certificateDto(c));
}

export function certificatePdf(ctx: Ctx): Response {
  const c = db.certificates.find((x) => x.id === ctx.params.id);
  if (!c) return notFound();
  const project = db.projects.find((p) => p.id === c.projectId);
  const pdf = buildPdf("CHUNG CHI V-INTERN", [
    `Certificate No: ${c.certificateNumber}`,
    `Holder: ${userName(c.userId)}`,
    `Role: ${c.role}`,
    `Project: ${project?.code ?? ""} - ${project?.name ?? ""}`,
    `Status: ${c.status}`,
    `Issued at: ${c.issuedAt.slice(0, 10)}`,
    "This is a demo certificate generated by mock-be.",
  ]);
  return new Response(pdf as any, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${c.certificateNumber}.pdf"`,
    },
  });
}

/** PUBLIC endpoint — no auth. */
export function verifyCertificate(ctx: Ctx): Response {
  const code = ctx.params.code;
  const c = db.certificates.find((x) => x.certificateNumber === code);
  if (!c) return notFound();
  if (c.status === "revoked") {
    return json({ valid: false, certificateNumber: c.certificateNumber, status: "revoked", revokedAt: c.revokedAt });
  }
  const project = db.projects.find((p) => p.id === c.projectId);
  return json({
    valid: true, certificateNumber: c.certificateNumber, holderName: userName(c.userId),
    role: c.role, projectName: project?.name ?? "", issuedAt: c.issuedAt,
  });
}
