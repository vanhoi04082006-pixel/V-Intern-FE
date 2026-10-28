/**
 * Participation — kỷ luật & thay người (Task 2-b).
 *
 * Intern (chỉ đọc của chính mình): GET /participation/me, /participation/me/replacements.
 * Instructor/admin (quản trị theo phiên): báo cáo incidents, policy, refresh,
 * resolve incident, extend hạn task, wizard thay thành viên 3 bước
 * (replacement-advice → replacement-preview → approve), repository-access jobs.
 */

import type { ParticipationIncident, ParticipationPolicy, ReplacementRecord } from "../org-store";
import {
  findIncident,
  findPolicy,
  getOrgStore,
  incidentsOf,
  participationReport,
  policyActiveFor,
} from "../org-store";
import { getStore, notifyUser, pushTimeline } from "../store";
import type { Task, User } from "../types";
import { clamp, nowIso, randomHex, randomId } from "../util";
import { badRequest, conflict, notFound, pageOf, requireString, route, type Ctx, type RouteDef } from "./common";
import { taskPublic } from "./tasks";

/* ------------------------------- helpers ------------------------------- */

function getSession(ctx: Ctx, id: string) {
  const s = ctx.store.sessions.find((x) => x.id === id || x.code === id);
  if (!s) throw notFound("Không tìm thấy phiên thực tập.");
  return s;
}

function getIncidentOf(ctx: Ctx, sessionId: string, incidentId: string): ParticipationIncident {
  const session = getSession(ctx, sessionId);
  const inc = findIncident(incidentId);
  if (!inc || inc.sessionId !== session.id) throw notFound("Không tìm thấy vi phạm kỷ luật trong phiên này.");
  return inc;
}

function incidentPublic(i: ParticipationIncident, includeIntern = false): Record<string, unknown> {
  const base: Record<string, unknown> = {
    id: i.id,
    taskCode: i.taskCode,
    taskTitle: i.taskTitle,
    sessionName: i.sessionName,
    dueAt: i.dueAt,
    submittedAt: i.submittedAt,
    ordinal: i.ordinal,
    points: i.points,
    kind: i.kind,
    status: i.status,
    baseScore: i.baseScore,
    latePenalty: i.latePenalty,
    score: i.score,
    resolvedAt: i.resolvedAt,
    resolvedBy: i.resolvedBy,
    resolveReason: i.resolveReason,
    createdAt: i.createdAt,
  };
  if (includeIntern) {
    base.taskId = i.taskId;
    base.internId = i.internId;
    base.internName = i.internName;
  }
  return base;
}

function policyPublic(p: ParticipationPolicy): Record<string, unknown> {
  return {
    id: p.id,
    sessionId: p.sessionId,
    version: p.version,
    warningFrom: p.warningFrom,
    penaltyFrom: p.penaltyFrom,
    replacementFrom: p.replacementFrom,
    penaltyPoints: p.penaltyPoints,
    penaltyCap: p.penaltyCap,
    activeFrom: p.activeFrom,
    reason: p.reason,
    updatedBy: p.updatedBy,
    updatedAt: p.updatedAt,
  };
}

function replacementPublic(r: ReplacementRecord): Record<string, unknown> {
  return {
    id: r.id,
    sessionId: r.sessionId,
    sessionName: r.sessionName,
    incidentId: r.incidentId,
    fromUserId: r.fromUserId,
    fromName: r.fromName,
    toUserId: r.toUserId,
    toName: r.toName,
    reason: r.reason,
    transfers: r.transfers,
    preservedTasks: r.preservedTasks,
    preservedTaskCount: r.preservedTasks.length,
    handoverHours: r.handoverHours,
    createdBy: r.createdBy,
    at: r.at,
  };
}

/** Tasks thuộc phiên (theo sprint của phiên + task trực tiếp project chưa vào sprint). */
function tasksOfSession(ctx: Ctx, sessionId: string): Task[] {
  const sprintIds = new Set(ctx.store.sprints.filter((s) => s.sessionId === sessionId).map((s) => s.id));
  const session = ctx.store.sessions.find((s) => s.id === sessionId);
  return ctx.store.tasks.filter(
    (t) => sprintIds.has(t.sprintId ?? "") || (session != null && t.projectId === session.projectId && !t.sprintId)
  );
}

function hoursLate(dueAt: string, at: number): number {
  return Math.max(0, (at - new Date(dueAt).getTime()) / 3600000);
}

function requireReason(body: Record<string, unknown> | null, min: number, max: number, label: string): string {
  const v = body?.reason;
  if (typeof v !== "string" || v.trim().length < min || v.trim().length > max) {
    throw badRequest(`Trường "${label}" phải từ ${min} đến ${max} ký tự.`, [`reason: ${min}–${max} ký tự`]);
  }
  return v.trim();
}

/* ------------------------- Intern: của chính mình ------------------------- */

async function myIncidents(ctx: Ctx): Promise<unknown> {
  const me = ctx.user!;
  const all = getOrgStore()
    .incidents.filter((i) => i.internId === me.id)
    .sort((a, b) => (a.dueAt < b.dueAt ? 1 : -1));
  const active = all.filter((i) => i.status === "active");
  const sessionIds = new Set(all.map((i) => i.sessionId));
  const hasActivePolicy = [...sessionIds].some((sid) => policyActiveFor(sid) != null);
  const page = pageOf(all.map((i) => incidentPublic(i)), ctx.query);
  return {
    summary: {
      total: all.length,
      active: active.length,
      registeredPenalty: active.reduce((acc, i) => acc + Math.abs(i.points), 0),
      policyActive: hasActivePolicy,
    },
    ...page,
  };
}

async function myReplacements(ctx: Ctx): Promise<unknown> {
  const me = ctx.user!;
  const items = getOrgStore()
    .replacements.filter((r) => r.toUserId === me.id || r.fromUserId === me.id)
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .map((r) => ({
      id: r.id,
      sessionId: r.sessionId,
      sessionName: r.sessionName,
      reason: r.reason,
      transferredTaskIds: r.transfers.map((t) => t.taskId),
      transferredTaskCodes: r.transfers.map((t) => t.taskCode),
      preservedTaskCount: r.preservedTasks.length,
      handoverHours: r.handoverHours,
      fromName: r.fromName,
      toName: r.toName,
      createdBy: r.createdBy,
      at: r.at,
    }));
  return pageOf(items, ctx.query);
}

/* --------------------- Instructor: báo cáo phiên --------------------- */

async function sessionParticipation(ctx: Ctx): Promise<unknown> {
  const session = getSession(ctx, ctx.params.id);
  const policy = policyActiveFor(session.id) ?? findPolicy(session.id);
  const page = pageOf(incidentsOf(session.id).map((i) => incidentPublic(i, true)), ctx.query);
  return {
    report: participationReport(session.id),
    policy: policy ? policyPublic(policy) : null,
    ...page,
  };
}

/* ------------------------------- Policy ------------------------------- */

function requireHours(body: Record<string, unknown> | null, field: string, label: string): number {
  const v = body?.[field];
  if (typeof v !== "number" || !Number.isFinite(v) || v <= 0 || Math.round(v) !== v) {
    throw badRequest(`Trường "${label}" phải là số giờ dương.`, [`${field}: số giờ dương`]);
  }
  return v;
}

async function upsertPolicy(ctx: Ctx): Promise<unknown> {
  const session = getSession(ctx, ctx.params.id);
  const body = ctx.body ?? {};
  const org = getOrgStore();

  const warningFrom = requireHours(body, "warningFrom", "Ngưỡng cảnh báo (giờ)");
  const penaltyFrom = requireHours(body, "penaltyFrom", "Ngưỡng trừ điểm (giờ)");
  const replacementFrom = requireHours(body, "replacementFrom", "Ngưỡng đề xuất thay người (giờ)");
  if (warningFrom > penaltyFrom || penaltyFrom > replacementFrom) {
    throw badRequest("Yêu cầu warningFrom ≤ penaltyFrom ≤ replacementFrom.", [
      "warningFrom ≤ penaltyFrom ≤ replacementFrom",
    ]);
  }
  const penaltyPoints = body.penaltyPoints;
  if (typeof penaltyPoints !== "number" || !Number.isFinite(penaltyPoints) || penaltyPoints <= 0) {
    throw badRequest("Điểm trừ mỗi lần vi phạm phải là số dương.", ["penaltyPoints: số dương"]);
  }
  const penaltyCap = body.penaltyCap;
  if (typeof penaltyCap !== "number" || !Number.isFinite(penaltyCap) || penaltyCap < penaltyPoints) {
    throw badRequest("Trần điểm trừ phải ≥ điểm trừ mỗi lần.", ["penaltyCap ≥ penaltyPoints"]);
  }
  const activeFrom = body.activeFrom;
  if (typeof activeFrom !== "string" || Number.isNaN(new Date(activeFrom).getTime())) {
    throw badRequest("Ngày hiệu lực không hợp lệ.", ["activeFrom: ngày ISO hợp lệ"]);
  }
  const reason = requireReason(body, 10, 1000, "Lý do");

  const existing = findPolicy(session.id);
  if (existing) {
    const expected = body.expectedVersion;
    if (typeof expected !== "number" || expected !== existing.version) {
      throw conflict(
        "Chính sách đã được cập nhật bởi người khác. Vui lòng tải lại.",
        "POLICY_VERSION_CONFLICT"
      );
    }
    existing.warningFrom = warningFrom;
    existing.penaltyFrom = penaltyFrom;
    existing.replacementFrom = replacementFrom;
    existing.penaltyPoints = penaltyPoints;
    existing.penaltyCap = penaltyCap;
    existing.activeFrom = new Date(activeFrom).toISOString();
    existing.reason = reason;
    existing.updatedBy = ctx.user!.displayName;
    existing.updatedAt = nowIso();
    existing.version += 1;
    pushTimeline(session.id, "participation_policy_updated", `Cập nhật chính sách kỷ luật lên phiên bản ${existing.version}.`, ctx.user!.displayName);
    return { policy: policyPublic(existing) };
  }

  const policy: ParticipationPolicy = {
    id: randomId("pol"),
    sessionId: session.id,
    version: 1,
    warningFrom,
    penaltyFrom,
    replacementFrom,
    penaltyPoints,
    penaltyCap,
    activeFrom: new Date(activeFrom).toISOString(),
    reason,
    updatedBy: ctx.user!.displayName,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  org.policies.push(policy);
  pushTimeline(session.id, "participation_policy_created", `Thiết lập chính sách kỷ luật phiên bản 1 (cảnh báo ${warningFrom}h, trừ điểm ${penaltyFrom}h, thay người ${replacementFrom}h).`, ctx.user!.displayName);
  return { policy: policyPublic(policy) };
}

async function refreshParticipation(ctx: Ctx): Promise<unknown> {
  const session = getSession(ctx, ctx.params.id);
  // Mock: incidents giữ nguyên (đã khớp seed tasks), chỉ tính lại báo cáo.
  const report = participationReport(session.id);
  const policy = policyActiveFor(session.id) ?? findPolicy(session.id);
  return {
    report,
    policy: policy ? policyPublic(policy) : null,
    incidentCount: report.totalIncidents,
    refreshedAt: nowIso(),
  };
}

/* --------------------------- Resolve incident --------------------------- */

async function resolveIncident(ctx: Ctx): Promise<unknown> {
  const session = getSession(ctx, ctx.params.id);
  const inc = getIncidentOf(ctx, session.id, ctx.params.incidentId);
  const body = ctx.body ?? {};
  const action = body.action;
  if (action !== "excused" && action !== "reversed") {
    throw badRequest("Hành động phải là 'excused' hoặc 'reversed'.", ["action: excused|reversed"]);
  }
  const reason = requireReason(body, 10, 500, "Lý do");
  if (inc.status !== "active") {
    throw conflict(`Vi phạm đã được xử lý (${inc.status}) — không thể xử lý lại.`, "INCIDENT_ALREADY_RESOLVED");
  }
  inc.status = action;
  inc.resolveReason = reason;
  inc.resolvedAt = nowIso();
  inc.resolvedBy = ctx.user!.displayName;
  // Miễn trừ / đảo chiều: hoàn lại điểm theo baseScore.
  inc.score = inc.baseScore;
  notifyUser(
    inc.internId,
    "session",
    `Vi phạm ${inc.taskCode} được ${action === "excused" ? "miễn trừ" : "đảo chiều"}`,
    `${ctx.user!.displayName} đã xử lý vi phạm ${inc.taskCode}: ${reason}`,
    null
  );
  return { incident: incidentPublic(inc, true) };
}

/* ------------------------------ Extend task ------------------------------ */

async function extendTask(ctx: Ctx): Promise<unknown> {
  const session = getSession(ctx, ctx.params.id);
  const task = tasksOfSession(ctx, session.id).find((t) => t.id === ctx.params.taskId || t.code === ctx.params.taskId);
  if (!task) throw notFound("Không tìm thấy nhiệm vụ trong phiên này.");

  const body = ctx.body ?? {};
  const newDueAt = body.newDueAt;
  if (typeof newDueAt !== "string" || Number.isNaN(new Date(newDueAt).getTime())) {
    throw badRequest("Hạn mới không hợp lệ.", ["newDueAt: ngày ISO hợp lệ"]);
  }
  const reason = requireReason(body, 3, 500, "Lý do gia hạn");
  if (task.dueDate && new Date(newDueAt).getTime() <= new Date(task.dueDate).getTime()) {
    throw badRequest("Hạn mới phải sau hạn hiện tại.", ["newDueAt > dueDate"]);
  }
  const previousDueAt = task.dueDate;
  const normalized = new Date(newDueAt).toISOString();
  task.dueDate = normalized;
  task.version += 1;
  task.updatedAt = nowIso();
  const s = getStore();
  const hist = s.taskHistory[task.id] ?? (s.taskHistory[task.id] = []);
  hist.push({
    fromStatus: task.status,
    toStatus: task.status,
    changedBy: ctx.user!.displayName,
    at: nowIso(),
    reason: `Gia hạn hạn chót${previousDueAt ? ` từ ${previousDueAt.slice(0, 10)}` : ""} → ${normalized.slice(0, 10)}: ${reason}`,
  });
  pushTimeline(session.id, "participation_task_extended", `Gia hạn hạn chót ${task.code} → ${normalized.slice(0, 10)}.`, ctx.user!.displayName);
  if (task.assigneeId) {
    notifyUser(task.assigneeId, "task", `Gia hạn hạn chót ${task.code}`, `${ctx.user!.displayName} gia hạn hạn chót ${task.code} đến ${normalized.slice(0, 10)}. Lý do: ${reason}`, `#/intern/work/${task.code}`);
  }
  return {
    task: taskPublic(task),
    previousDueAt,
    newDueAt: normalized,
    reason,
    at: nowIso(),
  };
}

/* --------------------- Wizard thay thành viên (3 bước) --------------------- */

interface CandidateRow {
  userId: string;
  name: string;
  email: string;
  role: string;
  matchScore: number;
  reason: string;
  completedTasks: number;
  avgScore: number;
}

function candidatePool(ctx: Ctx, excludeUserId: string): { user: User; selectedRole: string | null; completedTasks: number; avgScore: number }[] {
  const rows: { user: User; selectedRole: string | null; completedTasks: number; avgScore: number }[] = [];
  for (const user of ctx.store.users) {
    if (user.id === excludeUserId) continue;
    if (user.role !== "intern" || user.status !== "active") continue;
    const profile = ctx.store.recruitment[user.id];
    if (!profile || profile.status !== "passed") continue;
    const completedTasks = ctx.store.tasks.filter((t) => t.assigneeId === user.id && t.status === "done").length;
    const latestInterview = ctx.store.interviews
      .filter((i) => i.userId === user.id && i.result)
      .sort((a, b) => ((a.submittedAt ?? a.startedAt) < (b.submittedAt ?? b.startedAt) ? 1 : -1))[0];
    const evals = ctx.store.evaluations.filter((e) => e.internId === user.id && e.overallScore != null);
    const avgScore = Math.round(
      latestInterview?.result?.overallScore ??
        (evals.length ? evals.reduce((acc, e) => acc + (e.overallScore ?? 0), 0) / evals.length : 70)
    );
    rows.push({ user, selectedRole: profile.selectedRole, completedTasks, avgScore });
  }
  return rows;
}

async function replacementAdvice(ctx: Ctx): Promise<unknown> {
  const session = getSession(ctx, ctx.params.id);
  const inc = getIncidentOf(ctx, session.id, ctx.params.incidentId);
  const taskRole = ctx.store.tasks.find((t) => t.id === inc.taskId)?.role ?? null;
  const pool = candidatePool(ctx, inc.internId);

  const candidates: CandidateRow[] = pool
    .map((row) => {
      const sameRole = taskRole != null && row.selectedRole === taskRole;
      const busyTasks = ctx.store.tasks.filter(
        (t) => t.assigneeId === row.user.id && (t.status === "todo" || t.status === "doing" || t.status === "review")
      ).length;
      const matchScore = clamp(
        Math.round(40 + row.completedTasks * 5 + (sameRole ? 18 : 0) + (row.avgScore - 60) * 0.4 - busyTasks * 1),
        58,
        97
      );
      const reason = sameRole
        ? `Cùng vai trò ${row.selectedRole} với task ${inc.taskCode}; đã hoàn thành ${row.completedTasks} task, điểm đánh giá ${row.avgScore}.`
        : `Vai trò ${row.selectedRole ?? "chưa rõ"} (khác vai trò task) nhưng tiến độ tốt: ${row.completedTasks} task hoàn thành, điểm ${row.avgScore}.`;
      return {
        userId: row.user.id,
        name: row.user.displayName,
        email: row.user.email,
        role: row.selectedRole ?? "intern",
        matchScore,
        reason,
        completedTasks: row.completedTasks,
        avgScore: row.avgScore,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);

  if (candidates.length < 3) {
    throw conflict("Không đủ ứng viên thay thế đạt yêu cầu (cần tối thiểu 3).", "NOT_ENOUGH_CANDIDATES");
  }

  const policy = policyActiveFor(session.id);
  const hLate = hoursLate(inc.dueAt, Date.now());
  const notes = [
    `Đối chiếu ${pool.length} hồ sơ đạt chuẩn (đã qua phỏng vấn, còn hoạt động) với nhiệm vụ ${inc.taskCode}.`,
    `Vi phạm đã quá hạn ${Math.round(hLate)} giờ${policy ? ` — ngưỡng thay người là ${policy.replacementFrom} giờ theo chính sách v${policy.version}` : ""}.`,
    "MatchScore ưu tiên: cùng vai trò task, số task đã hoàn thành, điểm đánh giá trung bình, trừ khối lượng đang mở.",
  ];
  return { candidates, notes };
}

async function replacementPreview(ctx: Ctx): Promise<unknown> {
  const session = getSession(ctx, ctx.params.id);
  const inc = getIncidentOf(ctx, session.id, ctx.params.incidentId);
  const body = ctx.body ?? {};

  const candidateUserId = requireString(body, "candidateUserId", "Ứng viên nhận bàn giao");
  const candidate = ctx.store.users.find((u) => u.id === candidateUserId);
  if (!candidate || candidate.role !== "intern") {
    throw badRequest("Ứng viên không hợp lệ.", ["candidateUserId: không tồn tại"]);
  }
  if (candidate.id === inc.internId) {
    throw badRequest("Không thể bàn giao cho chính người bị thay.", ["candidateUserId: trùng người bị thay"]);
  }
  if (!candidatePool(ctx, inc.internId).some((row) => row.user.id === candidate.id)) {
    throw badRequest("Ứng viên không nằm trong danh sách đề xuất thay thế.", ["candidateUserId: ngoài pool"]);
  }

  const handoverHours = body.handoverHours == null ? 24 : body.handoverHours;
  if (
    typeof handoverHours !== "number" ||
    !Number.isFinite(handoverHours) ||
    Math.round(handoverHours) !== handoverHours ||
    handoverHours < 1 ||
    handoverHours > 168
  ) {
    throw badRequest("Thời gian bàn giao phải là số giờ nguyên từ 1 đến 168.", ["handoverHours: 1–168"]);
  }

  const sessionTasks = tasksOfSession(ctx, session.id);
  const openTasks = sessionTasks.filter(
    (t) => t.assigneeId === inc.internId && t.status !== "done"
  );
  const doneTasks = sessionTasks.filter((t) => t.assigneeId === inc.internId && t.status === "done");

  const warnings: string[] = [];
  for (const t of openTasks) {
    const blockedBy = t.dependencies
      .map((depId) => ctx.store.tasks.find((x) => x.id === depId))
      .filter((d): d is Task => !!d && d.status !== "done");
    if (blockedBy.length) {
      warnings.push(`${t.code} đang phụ thuộc ${blockedBy.map((d) => d.code).join(", ")} chưa hoàn thành.`);
    }
  }
  if (handoverHours < 4) {
    warnings.push(`Thời gian bàn giao ${handoverHours} giờ khá ngắn — nên ≥ 4 giờ để người nhận kịp làm quen.`);
  }

  const command = {
    commandId: randomId("rep"),
    sessionId: session.id,
    incidentId: inc.id,
    fromUserId: inc.internId,
    fromName: inc.internName,
    candidateUserId: candidate.id,
    candidateName: candidate.displayName,
    handoverHours,
    previewHash: randomHex(10),
    expiresAt: new Date(Date.now() + 15 * 60000).toISOString(),
    transfers: openTasks.map((t) => ({
      taskId: t.id,
      taskCode: t.code,
      taskTitle: t.title,
      from: inc.internId,
      to: candidate.id,
      fromName: inc.internName,
      toName: candidate.displayName,
    })),
    preservedTasks: doneTasks.map((t) => ({
      taskCode: t.code,
      reason: "Nhiệm vụ đã hoàn thành — giữ nguyên người nhận để lộ trình học tập.",
    })),
    warnings,
    createdAt: nowIso(),
  };
  getOrgStore().previewCommands.push(command);
  return {
    commandId: command.commandId,
    previewHash: command.previewHash,
    expiresAt: command.expiresAt,
    candidate: { userId: candidate.id, name: candidate.displayName, email: candidate.email },
    handoverHours,
    transfers: command.transfers,
    preservedTasks: command.preservedTasks,
    warnings: command.warnings,
  };
}

async function approveReplacement(ctx: Ctx): Promise<unknown> {
  const session = getSession(ctx, ctx.params.id);
  const org = getOrgStore();
  const command = org.previewCommands.find((c) => c.commandId === ctx.params.commandId && c.sessionId === session.id);
  if (!command) throw notFound("Không tìm thấy lệnh thay người (preview) trong phiên này.");

  const body = ctx.body ?? {};
  if (body.confirmed !== true) {
    throw badRequest("Cần xác nhận rõ ràng trước khi duyệt thay người.", ["confirmed: phải là true"]);
  }
  const reason = requireReason(body, 10, 1000, "Lý do duyệt");
  if (typeof body.expectedPreviewHash !== "string" || body.expectedPreviewHash !== command.previewHash) {
    throw conflict("Mã preview không khớp — bản xem trước có thể đã đổi. Vui lòng tạo lại preview.", "PREVIEW_HASH_MISMATCH");
  }
  if (new Date(command.expiresAt).getTime() < Date.now()) {
    throw conflict("Bản xem trước đã hết hạn (15 phút). Vui lòng tạo lại preview.", "PREVIEW_EXPIRED");
  }

  const candidate = ctx.store.users.find((u) => u.id === command.candidateUserId);
  if (!candidate) throw badRequest("Ứng viên nhận bàn giao không còn tồn tại.", ["candidateUserId: không tồn tại"]);

  const transfers: { taskId: string; taskCode: string; taskTitle: string }[] = [];
  for (const tr of command.transfers) {
    const task = ctx.store.tasks.find((t) => t.id === tr.taskId);
    if (!task) continue;
    task.assigneeId = candidate.id;
    task.assigneeName = candidate.displayName;
    task.version += 1;
    task.updatedAt = nowIso();
    const hist = getStore().taskHistory[task.id] ?? (getStore().taskHistory[task.id] = []);
    hist.push({
      fromStatus: task.status,
      toStatus: task.status,
      changedBy: ctx.user!.displayName,
      at: nowIso(),
      reason: `Bàn giao ${command.fromName} → ${candidate.displayName} (thay người do kỷ luật): ${reason}`,
    });
    transfers.push({ taskId: task.id, taskCode: task.code, taskTitle: task.title });
  }

  const record: ReplacementRecord = {
    id: randomId("rep"),
    sessionId: session.id,
    sessionName: session.name,
    incidentId: command.incidentId,
    fromUserId: command.fromUserId,
    fromName: command.fromName,
    toUserId: candidate.id,
    toName: candidate.displayName,
    reason,
    transfers,
    preservedTasks: command.preservedTasks,
    handoverHours: command.handoverHours,
    createdBy: ctx.user!.displayName,
    at: nowIso(),
  };
  org.replacements.push(record);
  org.previewCommands = org.previewCommands.filter((c) => c.commandId !== command.commandId);

  notifyUser(
    candidate.id,
    "session",
    `Nhận bàn giao ${transfers.length} nhiệm vụ từ ${command.fromName}`,
    `${ctx.user!.displayName} đã duyệt thay người trong phiên ${session.code}: bạn nhận ${transfers.map((t) => t.taskCode).join(", ") || "0 nhiệm vụ"}.`,
    "#/intern"
  );
  notifyUser(
    command.fromUserId,
    "session",
    `Các nhiệm vụ của bạn đã được bàn giao cho ${candidate.displayName}`,
    `Quyết định thay người trong phiên ${session.code} đã được duyệt. Lý do: ${reason}`,
    null
  );
  pushTimeline(
    session.id,
    "participation_replacement_approved",
    `Duyệt thay người: ${command.fromName} → ${candidate.displayName} (${transfers.length} nhiệm vụ bàn giao).`,
    ctx.user!.displayName
  );

  return { replacement: replacementPublic(record) };
}

async function sessionReplacements(ctx: Ctx): Promise<unknown> {
  const session = getSession(ctx, ctx.params.id);
  const items = getOrgStore()
    .replacements.filter((r) => r.sessionId === session.id)
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .map(replacementPublic);
  return pageOf(items, ctx.query);
}

/* --------------------- Repository access jobs --------------------- */

async function listRepoAccessJobs(ctx: Ctx): Promise<unknown> {
  const session = getSession(ctx, ctx.params.id);
  const items = getOrgStore()
    .repoAccessJobs.filter((j) => j.sessionId === session.id)
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .map((j) => ({
      id: j.id,
      userId: j.userId,
      userName: j.userName,
      displayStatus: j.displayStatus,
      revision: j.revision,
      note: j.note,
      at: j.at,
    }));
  return pageOf(items, ctx.query);
}

async function retryRepoAccessJob(ctx: Ctx): Promise<unknown> {
  const session = getSession(ctx, ctx.params.id);
  const job = getOrgStore().repoAccessJobs.find((j) => j.id === ctx.params.jobId && j.sessionId === session.id);
  if (!job) throw notFound("Không tìm thấy job bàn giao GitHub trong phiên này.");
  const body = ctx.body ?? {};
  if (typeof body.expectedRevision !== "number" || body.expectedRevision !== job.revision) {
    throw conflict("Job đã được thao tác bởi người khác. Vui lòng tải lại.", "REVISION_CONFLICT");
  }
  const reason = requireReason(body, 3, 500, "Lý do chạy lại");
  if (job.displayStatus === "done") {
    throw conflict("Job đã hoàn thành — không cần chạy lại.", "JOB_ALREADY_DONE");
  }
  job.displayStatus = "leased";
  job.revision += 1;
  job.note = `Đang xử lý lại theo yêu cầu của ${ctx.user!.displayName}: ${reason}`;
  job.at = nowIso();
  return { job: { id: job.id, userId: job.userId, userName: job.userName, displayStatus: job.displayStatus, revision: job.revision, note: job.note, at: job.at } };
}

/* ------------------------------- routes ------------------------------- */

const INSTRUCTOR: User["role"][] = ["instructor", "admin"];

export const participationRoutes: RouteDef[] = [
  // Intern — chỉ đọc của chính mình
  route("GET", "/participation/me", "intern", myIncidents),
  route("GET", "/participation/me/replacements", "intern", myReplacements),
  // Instructor/admin — quản trị theo phiên
  route("GET", "/sessions/:id/participation", INSTRUCTOR, sessionParticipation),
  route("POST", "/sessions/:id/participation/policy", INSTRUCTOR, upsertPolicy),
  route("POST", "/sessions/:id/participation/refresh", INSTRUCTOR, refreshParticipation),
  route("POST", "/sessions/:id/participation/incidents/:incidentId/resolve", INSTRUCTOR, resolveIncident),
  route("POST", "/sessions/:id/participation/tasks/:taskId/extend", INSTRUCTOR, extendTask),
  route("POST", "/sessions/:id/participation/incidents/:incidentId/replacement-advice", INSTRUCTOR, replacementAdvice),
  route("POST", "/sessions/:id/participation/incidents/:incidentId/replacement-preview", INSTRUCTOR, replacementPreview),
  route("POST", "/sessions/:id/participation/replacements/:commandId/approve", INSTRUCTOR, approveReplacement),
  route("GET", "/sessions/:id/participation/replacements", INSTRUCTOR, sessionReplacements),
  route("GET", "/sessions/:id/participation/repository-access-jobs", INSTRUCTOR, listRepoAccessJobs),
  route("POST", "/sessions/:id/participation/repository-access-jobs/:jobId/retry", INSTRUCTOR, retryRepoAccessJob),
];
