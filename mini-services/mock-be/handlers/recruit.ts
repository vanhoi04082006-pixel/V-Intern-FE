// handlers/recruit.ts — recruitment flow (intern), applications (public),
// recruitment rounds + question bank + career-role admin (staff), candidates.
import { db, defaultInterviewQuestions, type RecruitmentStateRec } from "../data";
import { json, err, notFound, noContent, paginate, nowIso, nid, matches } from "../lib";
import type { Ctx } from "../lib";
import { getCookie, CANDIDATE_COOKIE } from "../lib";

/* ============================ /recruitment/me ============================ */

function stateFor(userId: string): RecruitmentStateRec {
  let s = db.recruitmentStates.find((x) => x.userId === userId);
  if (!s) {
    s = { userId, status: "not_started", selectedRole: null, attemptsUsed: 0, maxAttempts: 3, cooldownUntil: null, latestResult: null };
    db.recruitmentStates.push(s);
  }
  return s;
}

export function recruitmentMe(ctx: Ctx): Response {
  const s = stateFor(ctx.user!.id);
  return json({
    status: s.status, selectedRole: s.selectedRole, attemptsUsed: s.attemptsUsed,
    maxAttempts: s.maxAttempts, cooldownUntil: s.cooldownUntil, latestResult: s.latestResult,
  });
}

export function careerRoles(_ctx: Ctx): Response {
  return json(db.careerRoles.filter((r) => r.status === "active"));
}

export function selectRole(ctx: Ctx): Response {
  const role = ctx.body?.role;
  const exists = db.careerRoles.some((r) => r.code === role && r.status === "active");
  if (!exists) return err(400, "UNKNOWN_ROLE", "Vai trò nghề nghiệp không tồn tại hoặc không nhận hồ sơ.");
  const s = stateFor(ctx.user!.id);
  s.selectedRole = String(role);
  if (s.status === "not_started") s.status = "role_selected";
  return json({
    status: s.status, selectedRole: s.selectedRole, attemptsUsed: s.attemptsUsed,
    maxAttempts: s.maxAttempts, cooldownUntil: s.cooldownUntil, latestResult: s.latestResult,
  });
}

function interviewDto(i: any) {
  return {
    id: i.id, role: i.role, status: i.status, startedAt: i.startedAt,
    submittedAt: i.submittedAt ?? null, evaluatedAt: i.evaluatedAt ?? null,
    overallScore: i.overallScore ?? null, technicalScore: i.technicalScore ?? null, softScore: i.softScore ?? null,
    questionCount: i.questions.length,
    answeredCount: i.questions.filter((q: any) => q.answerText).length,
  };
}

export function createInterview(ctx: Ctx): Response {
  const user = ctx.user!;
  const s = stateFor(user.id);
  if (!s.selectedRole) return err(400, "ROLE_NOT_SELECTED", "Bạn cần chọn vai trò nghề nghiệp trước khi bắt đầu.");
  if (s.attemptsUsed >= s.maxAttempts && s.status === "failed") {
    return err(429, "MAX_ATTEMPTS", "Bạn đã dùng hết số lần làm bài cho phép.");
  }
  const iv = {
    id: nid("iv"), userId: user.id, role: s.selectedRole, status: "in_progress" as const,
    startedAt: nowIso(), submittedAt: null, evaluatedAt: null,
    overallScore: null, technicalScore: null, softScore: null,
    questions: defaultInterviewQuestions(),
  };
  db.interviews.push(iv);
  s.status = "in_progress";
  return json({ id: iv.id, status: "in_progress", startedAt: iv.startedAt, questionCount: iv.questions.length, answeredCount: 0 }, 201);
}

export function listInterviews(ctx: Ctx): Response {
  const rows = db.interviews.filter((i) => i.userId === ctx.user!.id).map(interviewDto);
  return json(paginate(rows, ctx.url));
}

function myInterview(ctx: Ctx) {
  return db.interviews.find((i) => i.id === ctx.params.id && i.userId === ctx.user!.id);
}

export function getInterview(ctx: Ctx): Response {
  const iv = myInterview(ctx);
  if (!iv) return notFound();
  return json(interviewDto(iv));
}

export function interviewQuestions(ctx: Ctx): Response {
  const iv = myInterview(ctx);
  if (!iv) return notFound();
  // NB: intentionally NO rubric in the payload
  return json(iv.questions.map((q) => ({ id: q.id, order: q.order, section: q.section, prompt: q.prompt, answerText: q.answerText, followUp: q.followUp })));
}

export function interviewConversation(ctx: Ctx): Response {
  const iv = myInterview(ctx);
  if (!iv) return notFound();
  const turns: { role: string; content: string }[] = [];
  for (const q of iv.questions) {
    turns.push({ role: "interviewer", content: q.prompt });
    if (q.answerText) turns.push({ role: "candidate", content: q.answerText });
  }
  return json({ turns });
}

export function conversationClarify(ctx: Ctx): Response {
  const iv = myInterview(ctx);
  if (!iv) return notFound();
  const question = String(ctx.body?.question ?? "").trim();
  if (!question) return err(400, "VALIDATION_ERROR", "Thiếu nội dung câu hỏi làm rõ.");
  return json({
    reply: `Câu hỏi của bạn: "${question}". Gợi ý làm rõ: hãy đọc kỹ đề bài, trả lời theo cấu trúc khái niệm → ví dụ thực tế → kinh nghiệm cá nhân. Bạn có thể trả lời tự nhiên như đang trò chuyện với người phỏng vấn.`,
  });
}

export function conversationNext(ctx: Ctx): Response {
  const iv = myInterview(ctx);
  if (!iv) return notFound();
  const next = iv.questions.find((q) => !q.answerText);
  if (!next) return json({ done: true, question: null });
  return json({ done: false, question: { id: next.id, order: next.order, section: next.section, prompt: next.prompt } });
}

export function saveAnswer(ctx: Ctx): Response {
  const iv = myInterview(ctx);
  if (!iv) return notFound();
  const q = iv.questions.find((x) => x.id === ctx.params.questionId);
  if (!q) return notFound();
  const answerText = String(ctx.body?.answerText ?? "");
  if (!answerText.trim()) return err(400, "VALIDATION_ERROR", "Câu trả lời không được để trống.");
  q.answerText = answerText;
  return json({ saved: true, answeredCount: iv.questions.filter((x) => x.answerText).length });
}

export function saveFollowUp(ctx: Ctx): Response {
  const iv = myInterview(ctx);
  if (!iv) return notFound();
  const q = iv.questions.find((x) => x.id === ctx.params.questionId);
  if (!q) return notFound();
  const answerText = String(ctx.body?.answerText ?? "");
  if (!answerText.trim()) return err(400, "VALIDATION_ERROR", "Câu trả lời không được để trống.");
  q.followUp = answerText;
  return json({ saved: true });
}

export function submitInterview(ctx: Ctx): Response {
  const iv = myInterview(ctx);
  if (!iv) return notFound();
  if (iv.status !== "in_progress") return err(400, "INVALID_TRANSITION", `Bài phỏng vấn đã ở trạng thái ${iv.status}.`);
  iv.submittedAt = nowIso();
  iv.evaluatedAt = nowIso();
  iv.status = "evaluated";
  iv.overallScore = 7.5;
  iv.technicalScore = 8;
  iv.softScore = 6;
  const s = stateFor(ctx.user!.id);
  s.attemptsUsed += 1;
  s.status = "passed";
  s.latestResult = { status: "passed", overallScore: 7.5, passed: true };
  return json(interviewDto(iv));
}

export function retryEvaluation(ctx: Ctx): Response {
  const iv = myInterview(ctx);
  if (!iv) return notFound();
  if (iv.status !== "evaluated") return err(400, "INVALID_TRANSITION", "Chỉ bài đã nộp mới có thể đánh giá lại.");
  iv.evaluatedAt = nowIso();
  return json({ status: "evaluated", overallScore: iv.overallScore, technicalScore: iv.technicalScore, softScore: iv.softScore });
}

export function recruitmentResult(ctx: Ctx): Response {
  const s = stateFor(ctx.user!.id);
  const evaluated = [...db.interviews].reverse().find((i) => i.userId === ctx.user!.id && i.status === "evaluated");
  if (!s.latestResult && !evaluated) return notFound();
  const src = s.latestResult ?? (evaluated ? { status: "passed", overallScore: evaluated.overallScore!, passed: true } : null);
  return json({
    status: src!.status, passed: src!.passed, overallScore: src!.overallScore,
    technicalScore: evaluated?.technicalScore ?? 8, softScore: evaluated?.softScore ?? 6,
    decisionNote: "Kết quả đạt yêu cầu đầu vào của chương trình thực tập V-Intern.",
    evaluatedAt: evaluated?.evaluatedAt ?? null,
  });
}

/* ============================ Candidates (staff) ============================ */

export function candidates(ctx: Ctx): Response {
  const sp = ctx.url.searchParams;
  const search = sp.get("search") ?? undefined;
  const role = sp.get("role");
  const rows = db.users
    .filter((u) => u.roles.includes("intern"))
    .map((u) => {
      const s = stateFor(u.id);
      return {
        userId: u.id, displayName: u.displayName, email: u.email, role: s.selectedRole,
        eligibility: s.status === "failed" && s.attemptsUsed >= s.maxAttempts ? "blocked" : "eligible",
        status: s.status, attempts: s.attemptsUsed, latestScore: s.latestResult?.overallScore ?? null,
      };
    })
    .filter((r) => (!search || matches(r.displayName, search) || matches(r.email, search)) && (!role || r.role === role));
  return json(paginate(rows, ctx.url));
}

/* ============================ Applications (PUBLIC) ============================ */

export function applicationRounds(_ctx: Ctx): Response {
  return json(db.recruitmentRounds.map((r) => ({ id: r.id, name: r.name, opensAt: r.opensAt, closesAt: r.closesAt, status: r.status })));
}

export function submitApplication(ctx: Ctx): Promise<Response> {
  return (async () => {
    let fields: Record<string, any> = {};
    try {
      const fd = await ctx.req.formData();
      for (const [k, v] of fd.entries()) {
        if (typeof v === "string") fields[k] = v;
        else fields[k] = v; // File
      }
    } catch {
      return err(400, "VALIDATION_ERROR", "Yêu cầu phải là multipart/form-data.");
    }
    const roundId = fields.roundId, email = fields.email, fullName = fields.fullName;
    const cv = fields.cv ?? fields.file ?? fields.CV;
    if (!roundId || !email || !fullName) return err(400, "VALIDATION_ERROR", "Thiếu roundId, email hoặc fullName.");
    if (!cv || typeof cv === "string" || (cv as any).size === 0) {
      return err(400, "CV_REQUIRED", "Vui lòng đính kèm file CV.");
    }
    const round = db.recruitmentRounds.find((r) => r.id === roundId);
    if (!round) return err(400, "ROUND_NOT_FOUND", "Vòng tuyển dụng không tồn tại.");
    const app = {
      id: nid("app"), roundId: String(roundId), email: String(email), fullName: String(fullName),
      consentVersion: String(fields.consentVersion ?? "v1.0"), status: "submitted",
      submittedAt: nowIso(), interviewSlot: null,
      cvName: (cv as any).name ?? "cv.pdf", accessCode: `VC-${new Date().getFullYear()}-${String(db.applications.length + 1).padStart(4, "0")}`,
    };
    db.applications.push(app);
    return json({ applicationId: app.id, accessCodeSent: true }, 201);
  })();
}

export function verifyApplication(ctx: Ctx): Response {
  const token = String(ctx.body?.token ?? "").trim();
  if (!token) return err(400, "VALIDATION_ERROR", "Thiếu mã truy cập (token).");
  // Demo mode: unknown tokens map to the most recent application.
  const byCode = db.applications.find((a) => a.accessCode === token);
  const app = byCode ?? db.applications[db.applications.length - 1];
  if (!app) return err(404, "NOT_FOUND", "Không tìm thấy hồ sơ ứng tuyển.");
  db.candidateTokens.set(token, app.id);
  return json({ verified: true, applicationId: app.id }, 200, {
    "Set-Cookie": `${CANDIDATE_COOKIE}=${token}; Path=/api/v1/applications; SameSite=Lax`,
  });
}

function candidateApp(ctx: Ctx) {
  const token = getCookie(ctx.req, CANDIDATE_COOKIE);
  if (!token) return null;
  const appId = db.candidateTokens.get(token);
  return db.applications.find((a) => a.id === appId) ?? null;
}

export function applicationMe(ctx: Ctx): Response {
  const app = candidateApp(ctx);
  if (!app) return err(401, "CANDIDATE_MISSING", "Phiên ứng viên không hợp lệ hoặc đã hết hạn.");
  const round = db.recruitmentRounds.find((r) => r.id === app.roundId);
  return json({ status: app.status, roundName: round?.name ?? "", submittedAt: app.submittedAt, interviewSlot: app.interviewSlot });
}

export function applicationUploadCv(ctx: Ctx): Promise<Response> {
  return (async () => {
    const app = candidateApp(ctx);
    if (!app) return err(401, "CANDIDATE_MISSING", "Phiên ứng viên không hợp lệ hoặc đã hết hạn.");
    try {
      const fd = await ctx.req.formData();
      const cv = fd.get("cv") ?? fd.get("file");
      if (!cv || typeof cv === "string") return err(400, "CV_REQUIRED", "Vui lòng đính kèm file CV.");
      app.cvName = (cv as any).name ?? "cv.pdf";
    } catch {
      return err(400, "VALIDATION_ERROR", "Yêu cầu phải là multipart/form-data.");
    }
    return json({ uploaded: true, cvName: app.cvName });
  })();
}

export function applicationLeave(_ctx: Ctx): Response {
  return new Response(null, {
    status: 204,
    headers: { "Set-Cookie": `${CANDIDATE_COOKIE}=; Path=/api/v1/applications; SameSite=Lax; Max-Age=0` },
  });
}

export function requestAccess(ctx: Ctx): Response {
  const { roundId, email } = ctx.body || {};
  if (!roundId || !email) return err(400, "VALIDATION_ERROR", "Thiếu roundId hoặc email.");
  return json({ sent: true });
}

/* ============================ Recruitment rounds (staff) ============================ */

const ROUND_TRANSITIONS: Record<string, string[]> = {
  upcoming: ["open"], open: ["closed"], closed: [],
};

export function listRounds(ctx: Ctx): Response {
  return json(paginate(db.recruitmentRounds, ctx.url));
}

export function createRound(ctx: Ctx): Response {
  const b = ctx.body || {};
  if (!b.name || !b.opensAt || !b.closesAt) return err(400, "VALIDATION_ERROR", "Thiếu tên hoặc thời gian vòng tuyển dụng.");
  const r = { id: nid("rd"), name: String(b.name), opensAt: String(b.opensAt), closesAt: String(b.closesAt), status: "upcoming" as const, version: 1, createdAt: nowIso() };
  db.recruitmentRounds.push(r);
  return json(r, 201);
}

export function roundStatus(ctx: Ctx): Response {
  const r = db.recruitmentRounds.find((x) => x.id === ctx.params.id);
  if (!r) return notFound();
  const target = ctx.body?.status;
  if (!target || !ROUND_TRANSITIONS[r.status].includes(target)) {
    return err(400, "INVALID_TRANSITION", `Không thể chuyển vòng tuyển dụng từ ${r.status} sang ${target ?? "(trống)"}.`);
  }
  r.status = target;
  r.version += 1;
  return json(r);
}

export function roundApplications(ctx: Ctx): Response {
  const r = db.recruitmentRounds.find((x) => x.id === ctx.params.id);
  if (!r) return notFound();
  const rows = db.applications
    .filter((a) => a.roundId === r.id)
    .map((a) => ({ id: a.id, fullName: a.fullName, email: a.email, status: a.status, roleCode: null, submittedAt: a.submittedAt, interviewSlot: a.interviewSlot }));
  return json(paginate(rows, ctx.url));
}

/* ============================ Question bank ============================ */

export function listQuestions(ctx: Ctx): Response {
  const section = ctx.url.searchParams.get("section");
  const rows = db.questionBank.filter((q) => !section || q.section === section);
  return json(paginate(rows, ctx.url));
}

export function createQuestion(ctx: Ctx): Response {
  const b = ctx.body || {};
  if (!b.section || !b.prompt) return err(400, "VALIDATION_ERROR", "Thiếu section hoặc nội dung câu hỏi.");
  const q = { id: nid("qb"), section: String(b.section), prompt: String(b.prompt), language: b.language ?? "vi", version: 1, createdAt: nowIso() };
  db.questionBank.push(q);
  return json(q, 201);
}

export function deleteQuestion(ctx: Ctx): Response {
  const q = db.questionBank.find((x) => x.id === ctx.params.id);
  if (!q) return notFound();
  const version = ctx.url.searchParams.get("version");
  if (version === null || version === "") return err(400, "VALIDATION_ERROR", "Thiếu tham số version.");
  if (Number(version) !== q.version) return err(409, "VERSION_CONFLICT", "Câu hỏi đã bị cập nhật bởi người khác.");
  db.questionBank.splice(db.questionBank.indexOf(q), 1);
  return noContent();
}

/* ============================ Career roles admin ============================ */

export function adminListRoles(ctx: Ctx): Response {
  const sp = ctx.url.searchParams;
  const search = sp.get("search") ?? undefined;
  const rows = db.careerRoles
    .filter((r) => (!sp.get("status") || r.status === sp.get("status")) &&
      (!search || matches(r.name, search) || matches(r.code, search) || matches(r.description, search)));
  return json(paginate(rows, ctx.url));
}

export function adminCreateRole(ctx: Ctx): Response {
  const b = ctx.body || {};
  if (!b.code || !b.name || !b.level || !b.language) return err(400, "VALIDATION_ERROR", "Thiếu code, name, level hoặc language.");
  if (db.careerRoles.some((r) => r.code === b.code)) return err(409, "ROLE_CODE_EXISTS", "Mã vai trò đã tồn tại.");
  const r = {
    id: nid("role"), code: String(b.code), name: String(b.name), description: String(b.description ?? ""),
    level: String(b.level), language: String(b.language),
    requiredSkills: Array.isArray(b.requiredSkills) ? b.requiredSkills : [],
    acceptingApplications: true, status: "active" as const, version: 1, createdAt: nowIso(),
  };
  db.careerRoles.push(r);
  return json(r, 201);
}

export function adminUpdateRole(ctx: Ctx): Response {
  const r = db.careerRoles.find((x) => x.code === ctx.params.code);
  if (!r) return notFound();
  const b = ctx.body || {};
  if (b.version !== undefined && b.version !== r.version) return err(409, "VERSION_CONFLICT", "Vai trò đã bị cập nhật bởi người khác.");
  for (const k of ["name", "description", "level", "language", "requiredSkills", "acceptingApplications"]) {
    if (b[k] !== undefined) (r as any)[k] = b[k];
  }
  r.version += 1;
  return json(r);
}

export function adminArchiveRole(ctx: Ctx): Response {
  const r = db.careerRoles.find((x) => x.code === ctx.params.code);
  if (!r) return notFound();
  const b = ctx.body || {};
  if (b.version !== undefined && b.version !== r.version) return err(409, "VERSION_CONFLICT", "Vai trò đã bị cập nhật bởi người khác.");
  r.status = "archived";
  r.acceptingApplications = false;
  r.version += 1;
  return json(r);
}
