/**
 * Task 2-a — Backend mock domain "Tuyển dụng công khai & Nghề nghiệp".
 *
 * 4 nhóm route (đăng ký vào index.ts bằng `applyRoutes`):
 * 1. applyPublicRoutes   — cổng nộp CV công khai /applications/* (PUBLIC, không token)
 * 2. recruitmentRoundRoutes — đợt tuyển + khung giờ + hồ sơ /recruitment-rounds/* (instructor|admin)
 * 3. careerRoleRoutes    — thư viện nghề /career-roles (public) + /admin/career-roles/* (admin)
 * 4. communicationRoutes — hàng đợi email /admin/communications/* (admin)
 *
 * Store riêng: getApplyStore() (globalThis `__vintern_apply_store__`), user/auth
 * dùng store chính qua ctx.store. Mọi list trả { data, meta } chuẩn.
 */

import type { User } from "../types";
import { pushAudit, recordActivity } from "../store";
import {
  findApplication,
  findApplicationByEmail,
  findCareerRole,
  findRound,
  findSlot,
  getApplyStore,
  nextRoundCode,
  pushTimeline,
  slotBookedCount,
  timelineOf,
} from "../apply/store";
import { generateAnalysis } from "../apply/analysis";
import { enqueueMail, tickMailQueue } from "../apply/mail";
import {
  RESENDABLE_STATUSES,
  RESEND_COOLDOWN_SECONDS,
  SENSITIVE_KINDS,
  buildCancelledMail,
  buildCredentialsMail,
  buildExistingAccountMail,
  buildScheduleMail,
  buildVerifyMail,
  maskEmail,
} from "../apply/mail-templates";
import type {
  ApplicationStatus,
  ApplicationRecord,
  CareerRoleRecord,
  MailRecord,
  RoundRecord,
  SkillRequirement,
  SlotRecord,
} from "../apply/types";
import { APPLICATION_STATUSES } from "../apply/types";
import { ROUND_POLICY } from "../apply/seed";
import { hashString, includesNoAccent, nowIso, paginate, randomHex, randomId } from "../util";
import { ApiErr, badRequest, conflict, notFound, pageOf, requireNumber, requireString, route, type Ctx, type RouteDef } from "./common";
import { ROLE_LABELS } from "./recruitment";

const STAFF: User["role"][] = ["instructor", "admin"];
const AVATAR_COLORS = ["#10B981", "#FBBF24", "#2DD4BF", "#FB7185", "#FB923C", "#A3E635"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLE_CODE_RE = /^[a-z][a-z0-9_]{1,31}$/;

/* ------------------------------- helpers ------------------------------- */

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  unverified: "Chờ xác minh email",
  queued: "Trong hàng đợi phân tích",
  analyzing: "Đã phân tích — chờ đặt lịch",
  needs_information: "Cần bổ sung thông tin",
  waitlisted: "Danh sách chờ",
  booked: "Đã đặt lịch phỏng vấn",
  cancelled: "Đã hủy",
  deferred: "Tạm hoãn",
  failed: "Phân tích thất bại",
};

function roleLabelOf(code: string): string {
  return getApplyStore().careerRoles.find((r) => r.code === code)?.name ?? ROLE_LABELS[code] ?? code;
}

function roundOf(idOrCode: string): RoundRecord {
  const r = findRound(idOrCode);
  if (!r) throw notFound("Không tìm thấy đợt tuyển.");
  return r;
}

function roundRow(round: RoundRecord): Record<string, unknown> {
  const store = getApplyStore();
  const slots = store.slots.filter((s) => s.roundId === round.id);
  return {
    id: round.id,
    code: round.code,
    name: round.name,
    description: round.description,
    status: round.status,
    opensAt: round.opensAt,
    closesAt: round.closesAt,
    createdAt: round.createdAt,
    slotCount: slots.length,
    openSlotCount: slots.filter((s) => s.status === "open" && new Date(s.endsAt).getTime() > Date.now()).length,
    applicationCount: store.applications.filter((a) => a.roundId === round.id).length,
    bookedCount: store.applications.filter((a) => a.roundId === round.id && a.status === "booked").length,
  };
}

function slotRow(slot: SlotRecord): Record<string, unknown> {
  const bookedCount = slotBookedCount(slot.id);
  return {
    id: slot.id,
    roundId: slot.roundId,
    roleCode: slot.roleCode,
    roleLabel: roleLabelOf(slot.roleCode),
    startsAt: slot.startsAt,
    endsAt: slot.endsAt,
    capacity: slot.capacity,
    bookedCount,
    remaining: Math.max(0, slot.capacity - bookedCount),
    status: slot.status,
    minimumPreparationMinutes: slot.minimumPreparationMinutes,
    credentialsLeadMinutes: slot.credentialsLeadMinutes,
    location: slot.location,
    createdAt: slot.createdAt,
  };
}

/** Thông tin hồ sơ an toàn cho cổng công khai (không có verifyToken). */
function applicationPublic(app: ApplicationRecord): Record<string, unknown> {
  return {
    id: app.id,
    roundId: app.roundId,
    fullName: app.fullName,
    email: app.email,
    status: app.status,
    statusLabel: STATUS_LABELS[app.status],
    cvFileName: app.cvFileName,
    createdAt: app.createdAt,
    updatedAt: app.updatedAt,
    booking: app.booking,
    cancelReason: app.cancelReason,
    credentialsSentAt: app.credentialsSentAt,
    nextRebookEligibleAt: app.nextRebookEligibleAt,
  };
}

/** Dòng hồ sơ cho giao diện giảng viên/admin. */
function applicationRow(app: ApplicationRecord, users: User[]): Record<string, unknown> {
  const hasAccount =
    !!app.accountUserId || users.some((u) => u.email.toLowerCase() === app.email.toLowerCase());
  return {
    ...applicationPublic(app),
    emailHint: maskEmail(app.email),
    matchedRole: app.analysis?.matchedRole ?? null,
    matchedRoleLabel: app.analysis?.matchedRoleLabel ?? null,
    confidence: app.analysis?.confidence ?? null,
    rebookingAttemptsUsed: app.rebookingAttemptsUsed,
    rebookingAttemptsRemaining: Math.max(0, app.maxRebookingAttempts - app.rebookingAttemptsUsed),
    hasAccount,
  };
}

/** Chính sách đặt lại lịch (rebooking policy) của một hồ sơ. */
function rebookingPolicyOf(app: ApplicationRecord): Record<string, unknown> {
  const store = getApplyStore();
  const attemptsRemaining = Math.max(0, app.maxRebookingAttempts - app.rebookingAttemptsUsed);
  const eligible =
    !app.nextRebookEligibleAt || new Date(app.nextRebookEligibleAt).getTime() <= Date.now();
  const activeStatuses: ApplicationStatus[] = ["analyzing", "waitlisted", "booked"];
  const allowedRoleCodes = app.analysis
    ? [app.analysis.matchedRole]
    : store.careerRoles
        .filter((r) => r.status === "published" && r.acceptingApplications)
        .map((r) => r.code);
  return {
    canRebook: activeStatuses.includes(app.status) && attemptsRemaining > 0 && eligible,
    attemptsUsed: app.rebookingAttemptsUsed,
    attemptsRemaining,
    nextEligibleAt: app.nextRebookEligibleAt,
    allowedRoleCodes,
    serverNow: nowIso(),
  };
}

function mailRow(m: MailRecord): Record<string, unknown> {
  const app = m.applicationId
    ? getApplyStore().applications.find((a) => a.id === m.applicationId)
    : undefined;
  const cooldown = m.lastResentAt
    ? Math.max(0, Math.ceil(RESEND_COOLDOWN_SECONDS - (Date.now() - new Date(m.lastResentAt).getTime()) / 1000))
    : 0;
  return {
    id: m.id,
    kind: m.kind,
    subject: m.subject,
    recipientHint: m.recipientHint,
    applicationId: m.applicationId,
    applicationName: app?.fullName ?? null,
    roundId: m.roundId,
    availableAt: m.availableAt,
    attempts: m.attempts,
    status: m.status,
    lastCode: m.lastCode,
    lastResentAt: m.lastResentAt,
    resendable: RESENDABLE_STATUSES.includes(m.status) && cooldown === 0,
    cooldownRemainingSeconds: cooldown,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}

function activeQuestionCount(ctx: Ctx, roleCode: string): number {
  return ctx.store.questionBank.filter((q) => q.roleCode === roleCode && q.isActive).length;
}

function parseSkills(input: unknown, field: string): SkillRequirement[] {
  if (!Array.isArray(input)) throw badRequest(`Trường "${field}" phải là mảng kỹ năng.`, [`${field}: mảng`]);
  const out: SkillRequirement[] = [];
  for (const it of input) {
    if (typeof it !== "object" || it === null) {
      throw badRequest(`Mỗi kỹ năng trong "${field}" phải là object { skill, weight, mandatory }.`);
    }
    const o = it as Record<string, unknown>;
    const skill = typeof o.skill === "string" ? o.skill.trim() : "";
    if (!skill) throw badRequest("Tên kỹ năng không được để trống.", [`${field}.skill: bắt buộc`]);
    const weight = o.weight;
    if (typeof weight !== "number" || !Number.isFinite(weight) || weight < 0 || weight > 100) {
      throw badRequest("Trọng số kỹ năng phải là số 0–100.", [`${field}.weight: 0–100`]);
    }
    out.push({ skill, weight: Math.round(weight), mandatory: o.mandatory !== false });
  }
  return out;
}

function parseStringArray(input: unknown, field: string): string[] {
  if (input === undefined || input === null) return [];
  if (!Array.isArray(input)) throw badRequest(`Trường "${field}" phải là mảng chuỗi.`, [`${field}: mảng`]);
  return input.map((x) => {
    if (typeof x !== "string" || !x.trim()) {
      throw badRequest(`Phần tử trong "${field}" phải là chuỗi khác rỗng.`, [`${field}: chuỗi`]);
    }
    return x.trim();
  });
}

function optNumber(
  body: Record<string, unknown> | null,
  field: string,
  label: string,
  fallback: number
): number {
  const v = body?.[field];
  if (v === undefined || v === null) return fallback;
  if (typeof v !== "number" || !Number.isFinite(v)) {
    throw badRequest(`Trường "${label}" phải là số.`, [`${field}: số`]);
  }
  return v;
}

function assertIsoDate(value: string, field: string, label: string): Date {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw badRequest(`Trường "${label}" phải là thời gian ISO hợp lệ.`, [`${field}: ISO`]);
  }
  return d;
}

function snapOf(role: CareerRoleRecord): Omit<CareerRoleRecord, "code" | "createdAt" | "updatedAt"> {
  return {
    name: role.name,
    description: role.description,
    level: role.level,
    language: role.language,
    requiredSkills: role.requiredSkills.map((s) => ({ ...s })),
    optionalSkills: [...role.optionalSkills],
    version: role.version,
    status: role.status,
    acceptingApplications: role.acceptingApplications,
  };
}

function roleRow(role: CareerRoleRecord, questionCount: number): Record<string, unknown> {
  return {
    code: role.code,
    name: role.name,
    description: role.description,
    level: role.level,
    language: role.language,
    requiredSkills: role.requiredSkills,
    optionalSkills: role.optionalSkills,
    version: role.version,
    status: role.status,
    acceptingApplications: role.acceptingApplications,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
    questionCount,
  };
}

/* ==================================================================== */
/* 1. CỔNG NỘP CV CÔNG KHAI (/applications/*) — PUBLIC                  */
/* ==================================================================== */

/** GET /applications/rounds — các đợt tuyển đang mở cho cổng công khai. */
async function listPublicRounds(): Promise<unknown> {
  const store = getApplyStore();
  const data = store.rounds
    .filter((r) => r.status === "open")
    .map((r) => {
      const slots = store.slots.filter(
        (s) => s.roundId === r.id && s.status === "open" && new Date(s.endsAt).getTime() > Date.now()
      );
      const roleCodes = [...new Set(slots.map((s) => s.roleCode))];
      return {
        id: r.id,
        code: r.code,
        name: r.name,
        status: r.status,
        opensAt: r.opensAt,
        closesAt: r.closesAt,
        openSlotCount: slots.length,
        openRoles: roleCodes.map((c) => ({ code: c, label: roleLabelOf(c) })),
      };
    });
  return { data };
}

/** POST /applications — tạo hồ sơ công khai (status unverified) + verifyToken. */
async function createApplication(ctx: Ctx): Promise<unknown> {
  const body = ctx.body ?? {};
  if (body.consent !== true) {
    throw badRequest("Bạn phải đồng ý với chính sách xử lý dữ liệu để nộp hồ sơ.", ["consent: phải là true"]);
  }
  const fullName = requireString(ctx.body, "fullName", "Họ và tên");
  if (fullName.length < 2) throw badRequest("Họ và tên quá ngắn.", ["fullName: tối thiểu 2 ký tự"]);
  const email = requireString(ctx.body, "email", "Email").toLowerCase();
  if (!EMAIL_RE.test(email)) throw badRequest("Email không hợp lệ.", ["email: định dạng email"]);
  const roundId = requireString(ctx.body, "roundId", "Đợt tuyển");
  const round = roundOf(roundId);
  if (round.status !== "open") throw conflict("Đợt tuyển hiện không nhận hồ sơ mới.", "ROUND_NOT_OPEN");
  const cvFileName =
    typeof body.cvFileName === "string" && body.cvFileName.trim() ? body.cvFileName.trim() : null;

  const existing = findApplicationByEmail(email, round.id);
  if (existing && !["cancelled", "failed", "deferred"].includes(existing.status)) {
    throw conflict(
      `Email này đã có hồ sơ trong đợt tuyển (trạng thái: ${STATUS_LABELS[existing.status]}). Dùng "Tìm lại hồ sơ" để theo dõi.`,
      "APPLICATION_EXISTS"
    );
  }

  const app: ApplicationRecord = {
    id: randomId("app"),
    roundId: round.id,
    fullName,
    email,
    cvFileName,
    consent: true,
    status: "unverified",
    verifyToken: `vrf_${randomHex(5)}${Date.now().toString(36).slice(-4)}`,
    analysis: null,
    booking: null,
    cancelReason: null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    credentialsSentAt: null,
    rebookingAttemptsUsed: 0,
    maxRebookingAttempts: ROUND_POLICY.maxRebookingAttempts,
    nextRebookEligibleAt: null,
    recoveryRevision: 0,
    accountUserId: null,
  };
  const store = getApplyStore();
  store.applications.unshift(app);
  pushTimeline(app.id, "submitted", `Hồ sơ ứng tuyển đợt "${round.name}" đã được ghi nhận.`, "Ứng viên");
  pushTimeline(app.id, "email_sent", `Đã gửi email xác minh tới ${app.email}.`, "Hệ thống");

  const preview = buildVerifyMail(app, round);
  const mail = enqueueMail({
    kind: "verify",
    recipient: app.email,
    subject: `[V-Intern] Xác minh email ứng tuyển — ${round.name}`,
    applicationId: app.id,
    roundId: round.id,
    ...preview,
  });

  return {
    applicationId: app.id,
    verifyToken: app.verifyToken,
    status: app.status,
    mailId: mail.id,
    message: "Hồ sơ đã được ghi nhận. Kiểm tra email (kể cả hộp thư rác) để xác minh địa chỉ của bạn.",
  };
}

/** POST /applications/verify {token} — unverified → queued → analyzing (đồng bộ). */
async function verifyApplication(ctx: Ctx): Promise<unknown> {
  const token = requireString(ctx.body, "token", "Token xác minh");
  const store = getApplyStore();
  const app = store.applications.find((a) => a.verifyToken === token.trim());
  if (!app) throw new ApiErr(400, "Token xác minh không hợp lệ hoặc đã hết hạn.", "INVALID_TOKEN");
  if (app.status !== "unverified") throw conflict("Email của hồ sơ này đã được xác minh trước đó.");

  const round = store.rounds.find((r) => r.id === app.roundId);
  if (!round) throw notFound("Đợt tuyển của hồ sơ không còn tồn tại.");

  // Bước queued (mock: chuyển nhanh sang phân tích ngay trong cùng request).
  app.status = "queued";
  pushTimeline(app.id, "email_verified", "Xác minh email thành công — hồ sơ vào hàng đợi phân tích.", "Ứng viên");

  const analysis = generateAnalysis({ fullName: app.fullName, cvFileName: app.cvFileName });
  app.analysis = analysis;
  app.updatedAt = nowIso();
  if (!app.cvFileName) {
    app.status = "needs_information";
    pushTimeline(app.id, "needs_information", "Cần bổ sung CV chi tiết hơn — Agent chưa nhận được tệp CV hợp lệ.", "Agent V-Intern");
  } else {
    app.status = "analyzing";
    pushTimeline(
      app.id,
      "analysis_completed",
      `Agent phân tích CV: khớp ${analysis.confidence}% với vai trò ${analysis.matchedRoleLabel}.`,
      "Agent V-Intern"
    );
  }
  return { application: applicationPublic(app), analysis: app.analysis, status: app.status };
}

/** GET /applications/me?email=&roundId= — tra cứu hồ sơ + booking + timeline + policy. */
async function getMyApplication(ctx: Ctx): Promise<unknown> {
  const email = ctx.query.get("email")?.trim() ?? "";
  const roundId = ctx.query.get("roundId")?.trim() ?? "";
  if (!email || !roundId) {
    throw badRequest("Cần truyền email và roundId để tra cứu hồ sơ.", ["email: bắt buộc", "roundId: bắt buộc"]);
  }
  const app = findApplicationByEmail(email, roundId);
  if (!app) throw notFound("Không tìm thấy hồ sơ ứng tuyển với email và đợt tuyển này.");
  const round = getApplyStore().rounds.find((r) => r.id === app.roundId);
  const policy = rebookingPolicyOf(app);

  const payload: Record<string, unknown> = {
    round: round
      ? { id: round.id, code: round.code, name: round.name, status: round.status, closesAt: round.closesAt }
      : null,
    application: applicationPublic(app),
    analysis: app.analysis,
    booking: app.booking,
    timeline: timelineOf(app.id),
    rebookingPolicy: policy,
  };
  if (["analyzing", "waitlisted", "booked"].includes(app.status) && round && round.status === "open") {
    payload.availableSlots = getApplyStore()
      .slots.filter(
        (s) =>
          s.roundId === round.id &&
          s.status === "open" &&
          (policy.allowedRoleCodes as string[]).includes(s.roleCode) &&
          new Date(s.endsAt).getTime() > Date.now()
      )
      .sort((a, b) => (a.startsAt < b.startsAt ? -1 : 1))
      .map(slotRow);
  }
  return payload;
}

/** GET /applications/slots?roundId=&roleCode= — khung giờ còn chỗ cho ứng viên. */
async function listPublicSlots(ctx: Ctx): Promise<unknown> {
  const roundId = ctx.query.get("roundId")?.trim() ?? "";
  if (!roundId) throw badRequest("Cần truyền roundId.", ["roundId: bắt buộc"]);
  const round = roundOf(roundId);
  const roleCode = ctx.query.get("roleCode")?.trim() ?? "";
  let slots = getApplyStore().slots.filter(
    (s) => s.roundId === round.id && s.status === "open" && new Date(s.endsAt).getTime() > Date.now()
  );
  if (roleCode) slots = slots.filter((s) => s.roleCode === roleCode);
  return { data: slots.sort((a, b) => (a.startsAt < b.startsAt ? -1 : 1)).map(slotRow) };
}

/** POST /applications/me/book {email, roundId, slotId} — đặt / đổi lịch phỏng vấn. */
async function bookMySlot(ctx: Ctx): Promise<unknown> {
  const email = requireString(ctx.body, "email", "Email");
  const roundId = requireString(ctx.body, "roundId", "Đợt tuyển");
  const slotId = requireString(ctx.body, "slotId", "Khung giờ");
  const app = findApplicationByEmail(email, roundId);
  if (!app) throw notFound("Không tìm thấy hồ sơ ứng tuyển.");
  const round = getApplyStore().rounds.find((r) => r.id === app.roundId);
  if (!round) throw notFound("Đợt tuyển của hồ sơ không còn tồn tại.");
  if (round.status !== "open") throw conflict("Đợt tuyển đã đóng — không thể đặt lịch.", "ROUND_NOT_OPEN");
  if (!["analyzing", "waitlisted", "booked"].includes(app.status)) {
    throw conflict(`Hồ sơ ở trạng thái "${STATUS_LABELS[app.status]}" — chưa thể đặt lịch phỏng vấn.`);
  }
  const slot = findSlot(round.id, slotId);
  if (!slot) throw notFound("Không tìm thấy khung giờ trong đợt tuyển này.");
  if (slot.status !== "open") throw conflict("Khung giờ này đã đóng.", "SLOT_CLOSED");
  if (new Date(slot.endsAt).getTime() <= Date.now()) throw conflict("Khung giờ này đã qua thời gian phỏng vấn.");
  const policy = rebookingPolicyOf(app);
  if (!(policy.allowedRoleCodes as string[]).includes(slot.roleCode)) {
    throw badRequest(`Khung giờ dành cho vai trò ${roleLabelOf(slot.roleCode)} — không khớp vai trò được gợi ý cho hồ sơ của bạn.`, [
      "slotId: sai vai trò",
    ]);
  }
  if (app.booking?.slotId === slot.id) throw conflict("Bạn đã đặt khung giờ này rồi.");

  const rebooking = !!app.booking;
  if (rebooking) {
    const remaining = Math.max(0, app.maxRebookingAttempts - app.rebookingAttemptsUsed);
    if (remaining <= 0) {
      throw conflict("Bạn đã dùng hết lượt đổi lịch. Vui lòng liên hệ giảng viên để được hỗ trợ.", "REBOOKING_NOT_ALLOWED");
    }
    if (app.nextRebookEligibleAt && new Date(app.nextRebookEligibleAt).getTime() > Date.now()) {
      throw conflict("Bạn vừa đổi lịch — vui lòng đợi hết thời gian chờ giữa 2 lần đổi.", "REBOOKING_COOLDOWN");
    }
    pushTimeline(app.id, "slot_released", `Đã giải phóng khung giờ cũ (${app.booking!.startsAt.slice(0, 10)}).`, "Ứng viên");
    app.rebookingAttemptsUsed += 1;
    app.nextRebookEligibleAt = new Date(Date.now() + ROUND_POLICY.rebookingCooldownMinutes * 60000).toISOString();
  }
  if (slotBookedCount(slot.id) >= slot.capacity) throw conflict("Khung giờ đã đủ chỗ.", "SLOT_FULL");

  app.booking = {
    slotId: slot.id,
    roleCode: slot.roleCode,
    startsAt: slot.startsAt,
    endsAt: slot.endsAt,
    location: slot.location,
    bookedAt: nowIso(),
  };
  app.status = "booked";
  app.updatedAt = nowIso();
  pushTimeline(
    app.id,
    "slot_booked",
    `Đã ${rebooking ? "đổi lịch" : "đặt lịch"} phỏng vấn ${roleLabelOf(slot.roleCode)} — ${slot.startsAt.slice(0, 16).replace("T", " ")} → ${slot.endsAt.slice(11, 16)} (UTC), ${slot.location}.`,
    "Ứng viên"
  );
  enqueueMail({
    kind: "schedule",
    recipient: app.email,
    subject: `[V-Intern] Xác nhận lịch phỏng vấn vai trò ${roleLabelOf(slot.roleCode)}`,
    applicationId: app.id,
    roundId: round.id,
    ...buildScheduleMail(app, round, slot, roleLabelOf(slot.roleCode)),
  });
  return { application: applicationPublic(app), booking: app.booking, rebookingPolicy: rebookingPolicyOf(app) };
}

/** POST /applications/me/cv {email, roundId, cvFileName} — nộp lại CV. */
async function updateMyCv(ctx: Ctx): Promise<unknown> {
  const email = requireString(ctx.body, "email", "Email");
  const roundId = requireString(ctx.body, "roundId", "Đợt tuyển");
  const cvFileName = requireString(ctx.body, "cvFileName", "Tên tệp CV");
  const app = findApplicationByEmail(email, roundId);
  if (!app) throw notFound("Không tìm thấy hồ sơ ứng tuyển.");
  if (!["needs_information", "failed"].includes(app.status)) {
    throw conflict(`Hồ sơ ở trạng thái "${STATUS_LABELS[app.status]}" — không cần cập nhật CV lúc này.`);
  }
  app.cvFileName = cvFileName;
  app.analysis = generateAnalysis({ fullName: app.fullName, cvFileName });
  app.status = "analyzing";
  app.updatedAt = nowIso();
  pushTimeline(app.id, "cv_updated", `Đã cập nhật CV: ${cvFileName}.`, "Ứng viên");
  pushTimeline(
    app.id,
    "analysis_completed",
    `Agent phân tích lại CV: khớp ${app.analysis.confidence}% với vai trò ${app.analysis.matchedRoleLabel}.`,
    "Agent V-Intern"
  );
  return { application: applicationPublic(app), analysis: app.analysis };
}

/** POST /applications/leave {email, roundId} — ứng viên tự rút hồ sơ. */
async function leaveApplication(ctx: Ctx): Promise<unknown> {
  const email = requireString(ctx.body, "email", "Email");
  const roundId = requireString(ctx.body, "roundId", "Đợt tuyển");
  const app = findApplicationByEmail(email, roundId);
  if (!app) throw notFound("Không tìm thấy hồ sơ ứng tuyển.");
  if (app.status === "cancelled") throw conflict("Hồ sơ đã bị hủy trước đó.");
  const round = getApplyStore().rounds.find((r) => r.id === app.roundId);
  if (app.booking) {
    pushTimeline(app.id, "slot_released", `Đã giải phóng khung giờ phỏng vấn (${app.booking.startsAt.slice(0, 10)}).`, "Hệ thống");
    app.booking = null;
  }
  const reason = "Ứng viên tự rút hồ sơ.";
  app.status = "cancelled";
  app.cancelReason = reason;
  app.updatedAt = nowIso();
  pushTimeline(app.id, "cancelled", `Hồ sơ đã hủy: ${reason}`, "Ứng viên");
  if (round) {
    enqueueMail({
      kind: "cancelled",
      recipient: app.email,
      subject: `[V-Intern] Xác nhận hủy hồ sơ ứng tuyển — ${round.name}`,
      applicationId: app.id,
      roundId: round.id,
      ...buildCancelledMail(app, round, reason),
    });
  }
  return { application: applicationPublic(app) };
}

/** POST /applications/request-access {roundId, email} — luôn trả message trung lập. */
async function requestAccess(ctx: Ctx): Promise<unknown> {
  const roundId = requireString(ctx.body, "roundId", "Đợt tuyển");
  const email = requireString(ctx.body, "email", "Email").toLowerCase();
  const round = findRound(roundId);
  const app = findApplicationByEmail(email, round?.id ?? roundId);
  if (app && round) {
    enqueueMail({
      kind: "verify",
      recipient: app.email,
      subject: `[V-Intern] Yêu cầu truy cập hồ sơ ứng tuyển — ${round.name}`,
      applicationId: app.id,
      roundId: round.id,
      ...buildVerifyMail(app, round),
    });
  }
  return {
    message: "Nếu email tồn tại trong hệ thống, hướng dẫn truy cập hồ sơ đã được gửi tới hộp thư của bạn.",
  };
}

/* ==================================================================== */
/* 2. ĐỢT TUYỂN + KHUNG GIỜ + HỒ SƠ (/recruitment-rounds/*)             */
/* ==================================================================== */

/** GET /recruitment-rounds — page các đợt (instructor|admin). */
async function listRounds(ctx: Ctx): Promise<unknown> {
  const status = ctx.query.get("status");
  let items = getApplyStore().rounds.slice();
  if (status) items = items.filter((r) => r.status === status);
  items.sort((a, b) => (a.opensAt < b.opensAt ? 1 : -1));
  return pageOf(items.map(roundRow), ctx.query);
}

/** POST /recruitment-rounds — tạo draft mới (code RR-YYYY-NN). */
async function createRound(ctx: Ctx): Promise<unknown> {
  const body = ctx.body ?? {};
  const name = requireString(ctx.body, "name", "Tên đợt tuyển");
  const opensAt = requireString(ctx.body, "opensAt", "Thời gian mở");
  const closesAt = requireString(ctx.body, "closesAt", "Thời gian đóng");
  const open = assertIsoDate(opensAt, "opensAt", "Thời gian mở");
  const close = assertIsoDate(closesAt, "closesAt", "Thời gian đóng");
  if (open.getTime() >= close.getTime()) {
    throw badRequest("Thời gian đóng phải sau thời gian mở.", ["closesAt: sau opensAt"]);
  }
  const round: RoundRecord = {
    id: randomId("rr"),
    code: nextRoundCode(),
    name,
    description: typeof body.description === "string" ? body.description : "",
    status: "draft",
    opensAt,
    closesAt,
    createdAt: nowIso(),
  };
  getApplyStore().rounds.unshift(round);
  pushAudit(ctx.user!.displayName, "CREATE", `Tạo đợt tuyển ${round.code} — ${round.name}`);
  recordActivity("recruitment", "ROUND_CREATED", ctx.user!.displayName, `Tạo đợt tuyển ${round.code} “${round.name}” (draft).`);
  return { ...roundRow(round), slots: [] };
}

/** GET /recruitment-rounds/:id — chi tiết + slots + policy + thống kê hồ sơ. */
async function roundDetail(ctx: Ctx): Promise<unknown> {
  const round = roundOf(ctx.params.id);
  const store = getApplyStore();
  const slots = store.slots
    .filter((s) => s.roundId === round.id)
    .sort((a, b) => (a.startsAt < b.startsAt ? -1 : 1))
    .map(slotRow);
  const apps = store.applications.filter((a) => a.roundId === round.id);
  const byStatus: Record<string, number> = {};
  for (const s of APPLICATION_STATUSES) byStatus[s] = apps.filter((a) => a.status === s).length;
  return {
    round: roundRow(round),
    slots,
    policy: ROUND_POLICY,
    stats: { applicationCount: apps.length, byStatus },
  };
}

/** POST /recruitment-rounds/:id/status {status} — mở/đóng nhận CV. */
async function setRoundStatus(ctx: Ctx): Promise<unknown> {
  const round = roundOf(ctx.params.id);
  const status = requireString(ctx.body, "status", "Trạng thái");
  if (!["draft", "open", "closed"].includes(status)) {
    throw badRequest("Trạng thái không hợp lệ.", ["status: draft|open|closed"]);
  }
  const transitions: Record<RoundRecord["status"], RoundRecord["status"][]> = {
    draft: ["open"],
    open: ["closed"],
    closed: ["open"],
  };
  if (!transitions[round.status].includes(status as RoundRecord["status"])) {
    throw badRequest(`Không thể chuyển đợt tuyển từ "${round.status}" sang "${status}".`, [
      `status: ${transitions[round.status].join(" → ")}`,
    ]);
  }
  round.status = status as RoundRecord["status"];
  pushAudit(ctx.user!.displayName, "STATUS_CHANGE", `Đợt tuyển ${round.code} → ${status}`);
  recordActivity("recruitment", "ROUND_STATUS_CHANGED", ctx.user!.displayName, `Đợt tuyển ${round.code} “${round.name}” chuyển sang ${status}.`);
  return roundRow(round);
}

/** POST /recruitment-rounds/:id/slots — thêm khung giờ (role published + ≥10 câu hỏi). */
async function createSlot(ctx: Ctx): Promise<unknown> {
  const body = ctx.body ?? {};
  const round = roundOf(ctx.params.id);
  if (round.status === "closed") throw conflict("Đợt tuyển đã đóng — không thể thêm khung giờ.", "ROUND_CLOSED");

  const roleCode = requireString(ctx.body, "roleCode", "Mã vai trò");
  const role = findCareerRole(roleCode);
  if (!role) throw badRequest(`Vai trò "${roleCode}" không tồn tại trong thư viện nghề.`, ["roleCode: không tồn tại"]);
  if (role.status !== "published") {
    throw conflict(`Vai trò "${role.name}" chưa được công bố (hiện: ${role.status}) — không thể mở khung giờ.`, "ROLE_NOT_PUBLISHED");
  }
  const qCount = activeQuestionCount(ctx, roleCode);
  if (qCount < 10) {
    throw conflict(
      `Vai trò "${role.name}" mới có ${qCount}/10 câu hỏi phỏng vấn — bổ sung ngân hàng câu hỏi trước khi mở khung giờ.`,
      "INSUFFICIENT_QUESTIONS"
    );
  }
  const startsAt = requireString(ctx.body, "startsAt", "Thời gian bắt đầu");
  const endsAt = requireString(ctx.body, "endsAt", "Thời gian kết thúc");
  const start = assertIsoDate(startsAt, "startsAt", "Thời gian bắt đầu");
  const end = assertIsoDate(endsAt, "endsAt", "Thời gian kết thúc");
  if (start.getTime() >= end.getTime()) throw badRequest("Thời gian kết thúc phải sau thời gian bắt đầu.", ["endsAt: sau startsAt"]);
  if (start.getTime() <= Date.now()) throw badRequest("Khung giờ phải bắt đầu trong tương lai.", ["startsAt: tương lai"]);
  const capacity = requireNumber(ctx.body, "capacity", "Sức chứa");
  if (capacity < 1 || capacity > 100) throw badRequest("Sức chứa phải từ 1 đến 100.", ["capacity: 1–100"]);
  const minimumPreparationMinutes = optNumber(body, "minimumPreparationMinutes", "Thời gian chuẩn bị (phút)", ROUND_POLICY.minimumPreparationMinutesDefault);
  const credentialsLeadMinutes = optNumber(body, "credentialsLeadMinutes", "Thời gian gửi credentials trước (phút)", ROUND_POLICY.credentialsLeadMinutesDefault);
  const location = typeof body.location === "string" && body.location.trim() ? body.location.trim() : "Phòng ảo — Google Meet";

  const slot: SlotRecord = {
    id: randomId("slt"),
    roundId: round.id,
    roleCode,
    startsAt,
    endsAt,
    capacity: Math.round(capacity),
    minimumPreparationMinutes: Math.round(minimumPreparationMinutes),
    credentialsLeadMinutes: Math.round(credentialsLeadMinutes),
    status: "open",
    location,
    createdAt: nowIso(),
  };
  getApplyStore().slots.push(slot);
  pushAudit(ctx.user!.displayName, "CREATE", `Thêm khung giờ ${roleLabelOf(roleCode)} vào đợt ${round.code}`);
  return slotRow(slot);
}

/** POST /recruitment-rounds/:id/slots/:slotId/close — đóng khung giờ. */
async function closeSlot(ctx: Ctx): Promise<unknown> {
  const round = roundOf(ctx.params.id);
  const slot = findSlot(round.id, ctx.params.slotId);
  if (!slot) throw notFound("Không tìm thấy khung giờ trong đợt tuyển này.");
  if (slot.status === "closed") throw conflict("Khung giờ đã đóng trước đó.");
  slot.status = "closed";
  pushAudit(ctx.user!.displayName, "STATUS_CHANGE", `Đóng khung giờ ${slot.id} (${round.code})`);
  return slotRow(slot);
}

/** GET /recruitment-rounds/:id/applications — hồ sơ của đợt (pageSize mặc định 25). */
async function listRoundApplications(ctx: Ctx): Promise<unknown> {
  const round = roundOf(ctx.params.id);
  const status = ctx.query.get("status");
  const search = ctx.query.get("search")?.trim();
  let items = getApplyStore().applications.filter((a) => a.roundId === round.id);
  if (status && APPLICATION_STATUSES.includes(status as ApplicationStatus)) {
    items = items.filter((a) => a.status === status);
  }
  if (search) items = items.filter((a) => includesNoAccent(`${a.fullName} ${a.email} ${a.cvFileName ?? ""}`, search));
  items = items.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const page = Number(ctx.query.get("page") ?? 1) || 1;
  const pageSize = Number(ctx.query.get("pageSize") ?? 25) || 25;
  return paginate(items.map((a) => applicationRow(a, ctx.store.users)), page, pageSize);
}

function staffApplication(ctx: Ctx): { app: ApplicationRecord; round: RoundRecord } {
  const round = roundOf(ctx.params.id);
  const app = findApplication(round.id, ctx.params.appId);
  if (!app) throw notFound("Không tìm thấy hồ sơ ứng tuyển trong đợt này.");
  return { app, round };
}

/** GET /recruitment-rounds/:id/applications/:appId — chi tiết + timeline + analysis + mail. */
async function roundApplicationDetail(ctx: Ctx): Promise<unknown> {
  const { app } = staffApplication(ctx);
  const mails = getApplyStore()
    .mailQueue.filter((m) => m.applicationId === app.id)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map(mailRow);
  return {
    application: {
      ...applicationRow(app, ctx.store.users),
      recoveryRevision: app.recoveryRevision,
      accountUserId: app.accountUserId,
    },
    analysis: app.analysis,
    timeline: timelineOf(app.id),
    rebookingPolicy: rebookingPolicyOf(app),
    mails,
  };
}

/** POST .../cancel {reason} — giảng viên/admin hủy hồ sơ. */
async function cancelRoundApplication(ctx: Ctx): Promise<unknown> {
  const { app, round } = staffApplication(ctx);
  if (app.status === "cancelled") throw conflict("Hồ sơ đã bị hủy trước đó.");
  const reason = requireString(ctx.body, "reason", "Lý do hủy");
  if (app.booking) {
    pushTimeline(app.id, "slot_released", `Đã giải phóng khung giờ phỏng vấn (${app.booking.startsAt.slice(0, 10)}).`, ctx.user!.displayName);
    app.booking = null;
  }
  app.status = "cancelled";
  app.cancelReason = reason;
  app.updatedAt = nowIso();
  pushTimeline(app.id, "cancelled", `Hồ sơ bị hủy bởi ${ctx.user!.displayName}: ${reason}`, ctx.user!.displayName);
  enqueueMail({
    kind: "cancelled",
    recipient: app.email,
    subject: `[V-Intern] Xác nhận hủy hồ sơ ứng tuyển — ${round.name}`,
    applicationId: app.id,
    roundId: round.id,
    ...buildCancelledMail(app, round, reason),
  });
  pushAudit(ctx.user!.displayName, "STATUS_CHANGE", `Hủy hồ sơ ${app.id} (${app.fullName}) — ${reason}`);
  return { application: applicationRow(app, ctx.store.users) };
}

/** POST .../reschedule {slotId} — đổi khung giờ (check capacity, không tốn lượt rebook của ứng viên). */
async function rescheduleApplication(ctx: Ctx): Promise<unknown> {
  const { app, round } = staffApplication(ctx);
  if (app.status !== "booked" || !app.booking) throw conflict("Hồ sơ chưa đặt lịch — không thể đổi khung giờ.");
  const slotId = requireString(ctx.body, "slotId", "Khung giờ mới");
  const slot = findSlot(round.id, slotId);
  if (!slot) throw notFound("Không tìm thấy khung giờ mới trong đợt tuyển này.");
  if (slot.id === app.booking.slotId) throw conflict("Khung giờ mới trùng khung giờ hiện tại.");
  if (slot.status !== "open") throw conflict("Khung giờ mới đã đóng.", "SLOT_CLOSED");
  if (new Date(slot.endsAt).getTime() <= Date.now()) throw conflict("Khung giờ mới đã qua thời gian phỏng vấn.");
  const others = getApplyStore().applications.filter(
    (a) => a.status === "booked" && a.booking?.slotId === slot.id && a.id !== app.id
  );
  if (others.length >= slot.capacity) throw conflict("Khung giờ mới đã đủ chỗ.", "SLOT_FULL");

  const old = app.booking;
  app.booking = {
    slotId: slot.id,
    roleCode: slot.roleCode,
    startsAt: slot.startsAt,
    endsAt: slot.endsAt,
    location: slot.location,
    bookedAt: nowIso(),
  };
  app.updatedAt = nowIso();
  pushTimeline(
    app.id,
    "slot_rescheduled",
    `Đổi lịch bởi ${ctx.user!.displayName}: ${old.startsAt.slice(0, 16).replace("T", " ")} → ${slot.startsAt.slice(0, 16).replace("T", " ")} (UTC).`,
    ctx.user!.displayName
  );
  enqueueMail({
    kind: "schedule",
    recipient: app.email,
    subject: `[V-Intern] Cập nhật lịch phỏng vấn vai trò ${roleLabelOf(slot.roleCode)}`,
    applicationId: app.id,
    roundId: round.id,
    ...buildScheduleMail(app, round, slot, roleLabelOf(slot.roleCode)),
  });
  pushAudit(ctx.user!.displayName, "UPDATE", `Đổi lịch hồ sơ ${app.id} sang khung giờ ${slot.id}`);
  return { application: applicationRow(app, ctx.store.users), booking: app.booking };
}

/** POST .../resend-credentials {acknowledgeUncertain?} — gửi lại email đăng nhập. */
async function resendCredentials(ctx: Ctx): Promise<unknown> {
  const { app, round } = staffApplication(ctx);
  if (!app.booking) throw conflict("Hồ sơ chưa có lịch phỏng vấn — chưa có thông tin đăng nhập để gửi.");
  const slot = findSlot(round.id, app.booking.slotId);
  if (!slot || new Date(slot.endsAt).getTime() <= Date.now()) {
    throw conflict("Buổi phỏng vấn đã kết thúc — không gửi lại được thông tin đăng nhập.");
  }
  const hasUncertain = getApplyStore().mailQueue.some(
    (m) => m.applicationId === app.id && m.kind === "credentials" && m.status === "uncertain"
  );
  if (hasUncertain && ctx.body?.acknowledgeUncertain !== true) {
    throw conflict(
      "Lần gửi gần nhất đang ở trạng thái không xác định (uncertain) — cần xác nhận lại để gửi tiếp.",
      "UNCERTAIN_ACKNOWLEDGE_REQUIRED"
    );
  }
  const mail = enqueueMail({
    kind: "credentials",
    recipient: app.email,
    subject: `[V-Intern] Thông tin đăng nhập buổi phỏng vấn — ${roleLabelOf(slot.roleCode)}`,
    applicationId: app.id,
    roundId: round.id,
    ...buildCredentialsMail(app, round, slot, roleLabelOf(slot.roleCode), null),
  });
  app.credentialsSentAt = nowIso();
  app.updatedAt = nowIso();
  pushTimeline(app.id, "credentials_resent", `${ctx.user!.displayName} gửi lại thông tin đăng nhập buổi phỏng vấn.`, ctx.user!.displayName);
  pushAudit(ctx.user!.displayName, "UPDATE", `Gửi lại credentials hồ sơ ${app.id}`);
  return { queued: true, mailId: mail.id, status: mail.status };
}

/** GET .../credential-recovery?slotId= — điều kiện khôi phục + revision. */
async function credentialRecovery(ctx: Ctx): Promise<unknown> {
  const { app } = staffApplication(ctx);
  const slotId = ctx.query.get("slotId")?.trim() || app.booking?.slotId || null;
  let canRecover = false;
  let reason: string | null = null;
  if (!app.booking) {
    reason = "Hồ sơ chưa có lịch phỏng vấn.";
  } else {
    const slot = findSlot(app.roundId, app.booking.slotId);
    if (!slot) reason = "Không tìm thấy khung giờ phỏng vấn của hồ sơ.";
    else if (new Date(slot.endsAt).getTime() <= Date.now()) {
      reason = "Buổi phỏng vấn đã kết thúc — không thể khôi phục thông tin đăng nhập.";
    } else {
      canRecover = true;
    }
  }
  return {
    canRecover,
    reason,
    expectedRevision: app.recoveryRevision,
    slotId,
    hasAccount: !!app.accountUserId || ctx.store.users.some((u) => u.email.toLowerCase() === app.email.toLowerCase()),
    serverNow: nowIso(),
  };
}

/** POST .../recover-credentials {expectedRevision, reason} — tạo tài khoản + mail credentials. */
async function recoverCredentials(ctx: Ctx): Promise<unknown> {
  const { app, round } = staffApplication(ctx);
  const expectedRevision = requireNumber(ctx.body, "expectedRevision", "Revision kỳ vọng");
  if (expectedRevision !== app.recoveryRevision) {
    throw conflict("Phiên yêu cầu khôi phục đã cũ — vui lòng tải lại điều kiện khôi phục.", "RECOVERY_REVISION_CONFLICT");
  }
  if (!app.booking) throw badRequest("Hồ sơ chưa có lịch phỏng vấn.");
  const slot = findSlot(round.id, app.booking.slotId);
  if (!slot || new Date(slot.endsAt).getTime() <= Date.now()) {
    throw badRequest("Buổi phỏng vấn đã kết thúc — không thể khôi phục thông tin đăng nhập.");
  }
  const reason = requireString(ctx.body, "reason", "Lý do khôi phục");
  app.recoveryRevision += 1;

  const existingUser = ctx.store.users.find((u) => u.email.toLowerCase() === app.email.toLowerCase());
  let accountCreated = false;
  let mailId: string;
  if (existingUser) {
    mailId = enqueueMail({
      kind: "existing-account",
      recipient: app.email,
      subject: "[V-Intern] Bạn đã có tài khoản trên V-Intern",
      applicationId: app.id,
      roundId: round.id,
      ...buildExistingAccountMail(app, round),
    }).id;
  } else {
    const password = `Vint@${randomHex(4)}${Math.floor(Math.random() * 90 + 10)}!`;
    const user: User = {
      id: randomId("usr"),
      email: app.email,
      password,
      displayName: app.fullName,
      role: "intern",
      status: "pending",
      avatarColor: AVATAR_COLORS[hashString(app.email) % AVATAR_COLORS.length],
      joinedAt: nowIso(),
      lastLoginAt: null,
      studentId: null,
      university: null,
    };
    ctx.store.users.push(user);
    app.accountUserId = user.id;
    accountCreated = true;
    mailId = enqueueMail({
      kind: "credentials",
      recipient: app.email,
      subject: `[V-Intern] Thông tin đăng nhập buổi phỏng vấn — ${roleLabelOf(slot.roleCode)}`,
      applicationId: app.id,
      roundId: round.id,
      ...buildCredentialsMail(app, round, slot, roleLabelOf(slot.roleCode), password),
    }).id;
  }
  app.credentialsSentAt = nowIso();
  app.updatedAt = nowIso();
  pushTimeline(
    app.id,
    "credentials_recovered",
    `Khôi phục thông tin đăng nhập (lý do: ${reason}) — ${accountCreated ? "đã tạo tài khoản mới và gửi mail credentials" : "email đã có tài khoản, gửi mail hướng dẫn truy cập"}.`,
    ctx.user!.displayName
  );
  pushAudit(ctx.user!.displayName, "CREATE", `Khôi phục credentials hồ sơ ${app.id} (${app.fullName})`);
  return { recovered: true, accountCreated, accountEmail: app.email, mailId, revision: app.recoveryRevision };
}

/* ==================================================================== */
/* 3. THƯ VIỆN NGHỀ NGHIỆP (/career-roles public + /admin/career-roles)  */
/* ==================================================================== */

/** GET /career-roles — public: chỉ role published + đang nhận hồ sơ. */
async function listPublicCareerRoles(ctx: Ctx): Promise<unknown> {
  const data = getApplyStore()
    .careerRoles.filter((r) => r.status === "published" && r.acceptingApplications)
    .sort((a, b) => (a.code < b.code ? -1 : 1))
    .map((r) => ({
      code: r.code,
      name: r.name,
      description: r.description,
      level: r.level,
      language: r.language,
      requiredSkills: r.requiredSkills,
      optionalSkills: r.optionalSkills,
      version: r.version,
      questionCount: activeQuestionCount(ctx, r.code),
    }));
  return { data };
}

/** GET /admin/career-roles?page=&search=&status= — full list. */
async function listCareerRoles(ctx: Ctx): Promise<unknown> {
  const status = ctx.query.get("status");
  const search = ctx.query.get("search")?.trim();
  let items = getApplyStore().careerRoles.slice();
  if (status) items = items.filter((r) => r.status === status);
  if (search) items = items.filter((r) => includesNoAccent(`${r.code} ${r.name} ${r.description}`, search));
  items.sort((a, b) => (a.code < b.code ? -1 : 1));
  return pageOf(items.map((r) => roleRow(r, activeQuestionCount(ctx, r.code))), ctx.query);
}

/** POST /admin/career-roles — tạo draft version 1. */
async function createCareerRole(ctx: Ctx): Promise<unknown> {
  const body = ctx.body ?? {};
  const code = requireString(ctx.body, "code", "Mã nghề");
  if (!ROLE_CODE_RE.test(code)) {
    throw badRequest("Mã nghề phải khớp mẫu [a-z][a-z0-9_]{1,31}.", ["code: [a-z][a-z0-9_]{1,31}"]);
  }
  if (findCareerRole(code)) throw conflict(`Mã nghề "${code}" đã tồn tại trong thư viện.`, "CAREER_ROLE_CODE_EXISTS");
  const name = requireString(ctx.body, "name", "Tên nghề");
  const level = requireString(ctx.body, "level", "Cấp bậc");
  if (!["intern", "junior"].includes(level)) throw badRequest("Cấp bậc không hợp lệ.", ["level: intern|junior"]);
  const language = requireString(ctx.body, "language", "Ngôn ngữ");
  if (!["vi", "en"].includes(language)) throw badRequest("Ngôn ngữ không hợp lệ.", ["language: vi|en"]);
  const requiredSkills = parseSkills(body.requiredSkills, "requiredSkills");
  if (requiredSkills.length === 0) {
    throw badRequest("Cần ít nhất 1 kỹ năng bắt buộc.", ["requiredSkills: tối thiểu 1 mục"]);
  }
  const optionalSkills = parseStringArray(body.optionalSkills, "optionalSkills");

  const role: CareerRoleRecord = {
    code,
    name,
    description: typeof body.description === "string" ? body.description : "",
    level: level as CareerRoleRecord["level"],
    language: language as CareerRoleRecord["language"],
    requiredSkills,
    optionalSkills,
    version: 1,
    status: "draft",
    acceptingApplications: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  getApplyStore().careerRoles.push(role);
  getApplyStore().careerRoleRevisions.unshift({
    id: randomId("crr"),
    code,
    version: 1,
    note: "Khởi tạo vai trò (draft)",
    changedBy: ctx.user!.displayName,
    changedAt: nowIso(),
    snapshot: snapOf(role),
  });
  pushAudit(ctx.user!.displayName, "CREATE", `Tạo nghề ${code} — ${name}`);
  recordActivity("recruitment", "CAREER_ROLE_CREATED", ctx.user!.displayName, `Tạo nghề "${name}" (${code}) trong thư viện.`);
  return roleRow(role, activeQuestionCount(ctx, code));
}

/** PUT /admin/career-roles/:code — cập nhật + tăng version + lưu snapshot (409 nếu sai version). */
async function updateCareerRole(ctx: Ctx): Promise<unknown> {
  const role = findCareerRole(ctx.params.code);
  if (!role) throw notFound("Không tìm thấy nghề trong thư viện.");
  if (role.status === "archived") {
    throw conflict("Vai trò đã lưu kho — không thể chỉnh sửa.", "CAREER_ROLE_ARCHIVED");
  }
  const body = ctx.body ?? {};
  const expectedVersion = requireNumber(ctx.body, "expectedVersion", "Phiên bản kỳ vọng");
  if (expectedVersion !== role.version) {
    throw conflict(
      `Nghề đã được người khác cập nhật (phiên bản hiện tại ${role.version}). Tải lại trang rồi thử lại.`,
      "CAREER_ROLE_VERSION_CONFLICT"
    );
  }
  if (body.name !== undefined) role.name = requireString(ctx.body, "name", "Tên nghề");
  if (body.description !== undefined) {
    if (typeof body.description !== "string") throw badRequest("Mô tả phải là chuỗi.", ["description: chuỗi"]);
    role.description = body.description;
  }
  if (body.level !== undefined) {
    const level = requireString(ctx.body, "level", "Cấp bậc");
    if (!["intern", "junior"].includes(level)) throw badRequest("Cấp bậc không hợp lệ.", ["level: intern|junior"]);
    role.level = level as CareerRoleRecord["level"];
  }
  if (body.language !== undefined) {
    const language = requireString(ctx.body, "language", "Ngôn ngữ");
    if (!["vi", "en"].includes(language)) throw badRequest("Ngôn ngữ không hợp lệ.", ["language: vi|en"]);
    role.language = language as CareerRoleRecord["language"];
  }
  if (body.requiredSkills !== undefined) role.requiredSkills = parseSkills(body.requiredSkills, "requiredSkills");
  if (body.optionalSkills !== undefined) role.optionalSkills = parseStringArray(body.optionalSkills, "optionalSkills");

  role.version += 1;
  role.updatedAt = nowIso();
  getApplyStore().careerRoleRevisions.unshift({
    id: randomId("crr"),
    code: role.code,
    version: role.version,
    note: typeof body.note === "string" && body.note.trim() ? body.note.trim() : "Cập nhật nội dung vai trò",
    changedBy: ctx.user!.displayName,
    changedAt: nowIso(),
    snapshot: snapOf(role),
  });
  pushAudit(ctx.user!.displayName, "UPDATE", `Cập nhật nghề ${role.code} → v${role.version}`);
  return roleRow(role, activeQuestionCount(ctx, role.code));
}

/** POST /admin/career-roles/:code/publish {version} — validate tổng trọng số = 100. */
async function publishCareerRole(ctx: Ctx): Promise<unknown> {
  const role = findCareerRole(ctx.params.code);
  if (!role) throw notFound("Không tìm thấy nghề trong thư viện.");
  const version = requireNumber(ctx.body, "version", "Phiên bản");
  if (version !== role.version) {
    throw conflict(
      `Nghề đã được người khác cập nhật (phiên bản hiện tại ${role.version}). Tải lại trang rồi thử lại.`,
      "CAREER_ROLE_VERSION_CONFLICT"
    );
  }
  if (role.status === "archived") throw conflict("Vai trò đã lưu kho — không thể công bố lại.", "CAREER_ROLE_ARCHIVED");
  if (role.status === "published") throw conflict("Vai trò đã được công bố rồi.");
  if (role.requiredSkills.length === 0) {
    throw badRequest("Cần ít nhất 1 kỹ năng bắt buộc để công bố.", ["requiredSkills: tối thiểu 1 mục"]);
  }
  const sum = role.requiredSkills.reduce((acc, s) => acc + s.weight, 0);
  if (sum !== 100) {
    throw badRequest(`Tổng trọng số kỹ năng bắt buộc phải bằng 100 (hiện tại ${sum}).`, [
      `requiredSkills: tổng weight = 100 (hiện ${sum})`,
    ]);
  }
  role.status = "published";
  role.updatedAt = nowIso();
  pushAudit(ctx.user!.displayName, "STATUS_CHANGE", `Công bố nghề ${role.code} v${role.version}`);
  recordActivity("recruitment", "CAREER_ROLE_PUBLISHED", ctx.user!.displayName, `Công bố nghề "${role.name}" (${role.code}) — nhận hồ sơ mở.`);
  return roleRow(role, activeQuestionCount(ctx, role.code));
}

/** POST /admin/career-roles/:code/archive {version}. */
async function archiveCareerRole(ctx: Ctx): Promise<unknown> {
  const role = findCareerRole(ctx.params.code);
  if (!role) throw notFound("Không tìm thấy nghề trong thư viện.");
  const version = requireNumber(ctx.body, "version", "Phiên bản");
  if (version !== role.version) {
    throw conflict(
      `Nghề đã được người khác cập nhật (phiên bản hiện tại ${role.version}). Tải lại trang rồi thử lại.`,
      "CAREER_ROLE_VERSION_CONFLICT"
    );
  }
  if (role.status === "archived") throw conflict("Vai trò đã lưu kho trước đó.");
  role.status = "archived";
  role.acceptingApplications = false;
  role.updatedAt = nowIso();
  pushAudit(ctx.user!.displayName, "STATUS_CHANGE", `Lưu kho nghề ${role.code}`);
  return roleRow(role, activeQuestionCount(ctx, role.code));
}

/** GET /admin/career-roles/:code/revisions?page= — snapshot theo phiên bản (mới nhất trước). */
async function listCareerRoleRevisions(ctx: Ctx): Promise<unknown> {
  const role = findCareerRole(ctx.params.code);
  if (!role) throw notFound("Không tìm thấy nghề trong thư viện.");
  const items = getApplyStore()
    .careerRoleRevisions.filter((r) => r.code === role.code)
    .sort((a, b) => b.version - a.version);
  return pageOf(items, ctx.query);
}

/** PATCH /admin/career-roles/:code/accepting {accepting, expectedVersion} — chỉ published. */
async function setCareerRoleAccepting(ctx: Ctx): Promise<unknown> {
  const role = findCareerRole(ctx.params.code);
  if (!role) throw notFound("Không tìm thấy nghề trong thư viện.");
  if (role.status !== "published") {
    throw conflict("Chỉ vai trò đã công bố mới được bật/tắt nhận hồ sơ.", "CAREER_ROLE_NOT_PUBLISHED");
  }
  const expectedVersion = requireNumber(ctx.body, "expectedVersion", "Phiên bản kỳ vọng");
  if (expectedVersion !== role.version) {
    throw conflict(
      `Nghề đã được người khác cập nhật (phiên bản hiện tại ${role.version}). Tải lại trang rồi thử lại.`,
      "CAREER_ROLE_VERSION_CONFLICT"
    );
  }
  if (typeof ctx.body?.accepting !== "boolean") {
    throw badRequest("Trường accepting phải là boolean.", ["accepting: boolean"]);
  }
  role.acceptingApplications = ctx.body.accepting;
  role.updatedAt = nowIso();
  pushAudit(ctx.user!.displayName, "UPDATE", `${role.code} nhận hồ sơ: ${role.acceptingApplications ? "BẬT" : "TẮT"}`);
  return roleRow(role, activeQuestionCount(ctx, role.code));
}

/* ==================================================================== */
/* 4. HÀNG ĐỢI EMAIL (/admin/communications)                            */
/* ==================================================================== */

/** GET /admin/communications?page=&kind=&status=&search= */
async function listCommunications(ctx: Ctx): Promise<unknown> {
  tickMailQueue();
  const kind = ctx.query.get("kind");
  const status = ctx.query.get("status");
  const search = ctx.query.get("search")?.trim();
  let items = getApplyStore().mailQueue.slice();
  if (kind) items = items.filter((m) => m.kind === kind);
  if (status) items = items.filter((m) => m.status === status);
  if (search) items = items.filter((m) => includesNoAccent(`${m.subject} ${m.recipientHint}`, search));
  items.sort((a, b) => (a.availableAt < b.availableAt ? 1 : -1));
  return pageOf(items.map(mailRow), ctx.query);
}

/** GET /admin/communications/:id/preview — {html, text}. */
async function previewCommunication(ctx: Ctx): Promise<unknown> {
  tickMailQueue();
  const m = getApplyStore().mailQueue.find((x) => x.id === ctx.params.id);
  if (!m) throw notFound("Không tìm thấy thư trong hàng đợi.");
  const app = m.applicationId
    ? getApplyStore().applications.find((a) => a.id === m.applicationId)
    : undefined;
  return {
    id: m.id,
    kind: m.kind,
    subject: m.subject,
    recipientHint: m.recipientHint,
    applicationName: app?.fullName ?? null,
    status: m.status,
    attempts: m.attempts,
    lastCode: m.lastCode,
    availableAt: m.availableAt,
    lastResentAt: m.lastResentAt,
    html: m.html,
    text: m.text,
  };
}

/** POST /admin/communications/:id/resend {acknowledgeUncertain} — cooldown 60s, 429 nếu vi phạm. */
async function resendCommunication(ctx: Ctx): Promise<unknown> {
  tickMailQueue();
  const m = getApplyStore().mailQueue.find((x) => x.id === ctx.params.id);
  if (!m) throw notFound("Không tìm thấy thư trong hàng đợi.");
  if (!RESENDABLE_STATUSES.includes(m.status)) {
    throw conflict(
      `Thư ở trạng thái "${m.status}" không được phép gửi lại (chỉ dead/accepted/bounced/uncertain).`,
      "MAIL_NOT_RESENDABLE"
    );
  }
  if (SENSITIVE_KINDS.includes(m.kind) && ctx.body?.acknowledgeUncertain !== true) {
    throw badRequest(
      `Thư loại "${m.kind}" chứa thông tin nhạy cảm — cần truyền acknowledgeUncertain: true để gửi lại.`,
      ["acknowledgeUncertain: true"]
    );
  }
  if (m.lastResentAt) {
    const elapsed = (Date.now() - new Date(m.lastResentAt).getTime()) / 1000;
    if (elapsed < RESEND_COOLDOWN_SECONDS) {
      throw new ApiErr(
        429,
        `Vui lòng đợi ${Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed)} giây trước khi gửi lại thư này.`,
        "RESEND_COOLDOWN"
      );
    }
  }
  m.attempts += 1;
  m.status = "sending";
  m.lastResentAt = nowIso();
  m.updatedAt = nowIso();
  m.lastCode = "250 2.1.0 OK — queued for resend";
  pushAudit(ctx.user!.displayName, "UPDATE", `Gửi lại thư ${m.id} (${m.kind}) → ${m.recipientHint}`);
  return { mail: mailRow(m) };
}

/* ================================ ROUTES ================================ */

export const applyPublicRoutes: RouteDef[] = [
  route("GET", "/applications/rounds", "public", listPublicRounds),
  route("POST", "/applications", "public", createApplication),
  route("POST", "/applications/verify", "public", verifyApplication),
  route("GET", "/applications/me", "public", getMyApplication),
  route("GET", "/applications/slots", "public", listPublicSlots),
  route("POST", "/applications/me/book", "public", bookMySlot),
  route("POST", "/applications/me/cv", "public", updateMyCv),
  route("POST", "/applications/leave", "public", leaveApplication),
  route("POST", "/applications/request-access", "public", requestAccess),
];

export const recruitmentRoundRoutes: RouteDef[] = [
  route("GET", "/recruitment-rounds", STAFF, listRounds),
  route("POST", "/recruitment-rounds", STAFF, createRound),
  route("GET", "/recruitment-rounds/:id", STAFF, roundDetail),
  route("POST", "/recruitment-rounds/:id/status", STAFF, setRoundStatus),
  route("POST", "/recruitment-rounds/:id/slots", STAFF, createSlot),
  route("POST", "/recruitment-rounds/:id/slots/:slotId/close", STAFF, closeSlot),
  route("GET", "/recruitment-rounds/:id/applications", STAFF, listRoundApplications),
  route("GET", "/recruitment-rounds/:id/applications/:appId", STAFF, roundApplicationDetail),
  route("POST", "/recruitment-rounds/:id/applications/:appId/cancel", STAFF, cancelRoundApplication),
  route("POST", "/recruitment-rounds/:id/applications/:appId/reschedule", STAFF, rescheduleApplication),
  route("POST", "/recruitment-rounds/:id/applications/:appId/resend-credentials", STAFF, resendCredentials),
  route("GET", "/recruitment-rounds/:id/applications/:appId/credential-recovery", STAFF, credentialRecovery),
  route("POST", "/recruitment-rounds/:id/applications/:appId/recover-credentials", STAFF, recoverCredentials),
];

export const careerRoleRoutes: RouteDef[] = [
  route("GET", "/career-roles", "public", listPublicCareerRoles),
  route("GET", "/admin/career-roles", "admin", listCareerRoles),
  route("POST", "/admin/career-roles", "admin", createCareerRole),
  route("PUT", "/admin/career-roles/:code", "admin", updateCareerRole),
  route("POST", "/admin/career-roles/:code/publish", "admin", publishCareerRole),
  route("POST", "/admin/career-roles/:code/archive", "admin", archiveCareerRole),
  route("GET", "/admin/career-roles/:code/revisions", "admin", listCareerRoleRevisions),
  route("PATCH", "/admin/career-roles/:code/accepting", "admin", setCareerRoleAccepting),
];

export const communicationRoutes: RouteDef[] = [
  route("GET", "/admin/communications", "admin", listCommunications),
  route("GET", "/admin/communications/:id/preview", "admin", previewCommunication),
  route("POST", "/admin/communications/:id/resend", "admin", resendCommunication),
];

/** Tổng hợp toàn bộ route của domain (đăng ký vào handlers/index.ts). */
export const applyRoutes: RouteDef[] = [
  ...applyPublicRoutes,
  ...recruitmentRoundRoutes,
  ...careerRoleRoutes,
  ...communicationRoutes,
];
