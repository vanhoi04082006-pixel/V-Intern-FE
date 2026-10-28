/**
 * Recruitment / onboarding: chọn vai trò, phỏng vấn AI (conversation flow),
 * nộp bài + đánh giá lazy sau 2.5s, retry evaluation, xem kết quả.
 */

import type { InterviewQuestion, InterviewResult, InterviewSession, Question, RecruitmentProfile } from "../types";
import {
  currentInterviewOf,
  getRecruitment,
  notifyUser,
  pushAudit,
  recordActivity,
} from "../store";
import { clamp, hashString, normalizeText, nowIso, randomId } from "../util";
import { ApiErr, badRequest, conflict, notFound, pageOf, route, type RouteDef, type Ctx } from "./common";

export const ROLE_LABELS: Record<string, string> = {
  frontend: "Lập trình viên Frontend",
  backend: "Lập trình viên Backend",
  fullstack: "Lập trình viên Full-stack",
  qa: "Kỹ sư kiểm thử (QA)",
  business_analyst: "Chuyên viên phân tích nghiệp vụ (BA)",
};

const VALID_ROLES = Object.keys(ROLE_LABELS);
const EVALUATION_DELAY_MS = 2500;
const SESSION_MINUTES = 45;

/* ------------------------------- helpers ------------------------------- */

function myProfile(ctx: Ctx): RecruitmentProfile {
  return getRecruitment(ctx.user!.id);
}

function sessionPublic(s: InterviewSession): Record<string, unknown> {
  const secondsRemaining = Math.max(0, Math.floor((new Date(s.expiresAt).getTime() - Date.now()) / 1000));
  return {
    id: s.id,
    roleCode: s.roleCode,
    status: s.status,
    startedAt: s.startedAt,
    submittedAt: s.submittedAt,
    expiresAt: s.expiresAt,
    attemptNumber: s.attemptNumber,
    secondsRemaining,
  };
}

function questionPublic(q: InterviewQuestion): Record<string, unknown> {
  return {
    id: q.id,
    position: q.position,
    phase: q.phase,
    kind: q.kind,
    prompt: q.prompt,
    answer: q.answer,
    status: q.status,
  };
}

function currentReadyQuestion(s: InterviewSession): InterviewQuestion | null {
  return s.questions.find((q) => q.status === "ready") ?? null;
}

/** Điểm heuristic 1 câu trả lời theo expectedConcepts + độ dài hợp lý. */
export function scoreAnswer(q: InterviewQuestion, answer: string, jitterSeed = 0): number {
  const norm = normalizeText(answer);
  let score = 40;
  for (const c of q.expectedConcepts) {
    if (norm.includes(normalizeText(c))) score += 8;
  }
  const len = answer.trim().length;
  if (len >= 40) score += 4;
  if (len >= 120) score += 4;
  if (len >= 250) score += 4;
  if (len < 15) score -= 12;
  if (jitterSeed) score += (hashString(q.id + ":" + jitterSeed) % 13) - 6;
  return clamp(score, 0, 100);
}

/** Sinh result từ câu trả lời đã lưu (heuristic theo docs mục 2). */
export function buildResult(s: InterviewSession, jitterSeed = 0): InterviewResult {
  const answered = s.questions.filter((q) => q.status === "answered" && q.answer);
  const avgPhase = (phases: InterviewQuestion["phase"][]): number => {
    const qs = answered.filter((q) => phases.includes(q.phase));
    if (!qs.length) return 50;
    return Math.round(qs.reduce((acc, q) => acc + scoreAnswer(q, q.answer!, jitterSeed), 0) / qs.length);
  };
  const technicalScore = avgPhase(["technical"]);
  const softSkillScore = avgPhase(["communication", "introduction"]);
  const englishScore = avgPhase(["english"]);
  const overallScore = Math.round(0.5 * technicalScore + 0.3 * softSkillScore + 0.2 * englishScore);
  const decision: "passed" | "failed" = overallScore >= 60 ? "passed" : "failed";

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (technicalScore >= 60) strengths.push("Nền tảng kỹ thuật của vai trò khá chắc, có ví dụ cụ thể");
  else weaknesses.push("Nền tảng kỹ thuật còn hạn chế, cần hệ thống lại kiến thức cốt lõi");
  if (softSkillScore >= 60) strengths.push("Trình bày mạch lạc, biết tóm gọn ý chính");
  else weaknesses.push("Cần luyện cách trình bày có cấu trúc hơn");
  if (englishScore >= 60) strengths.push("Tiếng Anh chuyên ngành đáp ứng yêu cầu đọc tài liệu");
  else weaknesses.push("Từ vựng tiếng Anh chuyên ngành cần củng cố thêm");
  if (answered.length < s.questions.length) weaknesses.push("Một số câu chưa được trả lời đủ sâu");

  const feedback =
    decision === "passed"
      ? `Tổng quát: ${overallScore}/100. Bạn thể hiện tư duy phù hợp với vai trò ${ROLE_LABELS[s.roleCode] ?? s.roleCode}. Tiếp tục giữ thói trình bày theo cấu trúc và đưa ví dụ thực tế.`
      : `Tổng quát: ${overallScore}/100. Kết quả chưa đạt chuẩn đầu vào (${60} điểm). Hãy ôn lại các khái niệm cốt lõi của vai trò và luyện trả lời theo cấu trúc rồi thi lại.`;

  return {
    id: randomId("res"),
    sessionId: s.id,
    roleCode: s.roleCode,
    decision,
    technicalScore,
    softSkillScore,
    englishScore,
    overallScore,
    criteria: [
      {
        code: "TECH_FOUNDATION",
        label: "Nền tảng kỹ thuật",
        score: technicalScore,
        feedback: technicalScore >= 60 ? "Trình bày khái niệm cốt lõi tương đối chắc chắn." : "Khái niệm cốt lõi còn mơ hồ, cần hệ thống lại.",
      },
      {
        code: "PROBLEM_SOLVING",
        label: "Tư duy giải quyết vấn đề",
        score: Math.round((technicalScore + softSkillScore) / 2),
        feedback: "Có bước phân tích vấn đề, một số chỗ thiếu cấu trúc.",
      },
      {
        code: "COMMUNICATION",
        label: "Giao tiếp & trình bày",
        score: softSkillScore,
        feedback: softSkillScore >= 60 ? "Diễn đạt rõ, biết tóm tắt ý chính." : "Nên trả lời đúng trọng tâm, đi thẳng vào khái niệm.",
      },
      {
        code: "ENGLISH",
        label: "Tiếng Anh kỹ thuật",
        score: englishScore,
        feedback: englishScore >= 60 ? "Đọc hiểu tài liệu tiếng Anh ổn." : "Nên đọc tài liệu gốc tiếng Anh nhiều hơn.",
      },
      {
        code: "LEARNING_ATTITUDE",
        label: "Thái độ học hỏi",
        score: clamp(softSkillScore + 6, 0, 100),
        feedback: "Thể hiện mong muốn học hỏi và nhận phản hồi tốt.",
      },
    ],
    strengths,
    weaknesses,
    feedback,
    recommendedRole: s.roleCode,
    evaluatedAt: nowIso(),
  };
}

/** Lazy-complete: sau 2.5s chấm xong, cập nhật session + recruitment profile. */
function maybeCompleteEvaluation(ctx: Ctx, s: InterviewSession): void {
  if (s.status !== "evaluating" || !s.evaluatingSince) return;
  if (Date.now() - new Date(s.evaluatingSince).getTime() < EVALUATION_DELAY_MS) return;

  s.result = buildResult(s, s.jitter);
  s.status = "completed";
  if (!s.submittedAt) s.submittedAt = nowIso();

  const profile = getRecruitment(s.userId);
  const passed = s.result.decision === "passed";
  profile.status = passed ? "passed" : "failed";
  if (passed && !profile.recruitedAt) profile.recruitedAt = nowIso();
  if (!passed) profile.nextEligibleAt = nowIso(); // demo: được thi lại ngay

  const user = ctx.store.users.find((u) => u.id === s.userId);
  recordActivity(
    "recruitment",
    passed ? "INTERVIEW_PASSED" : "INTERVIEW_FAILED",
    user?.displayName ?? "Ứng viên",
    `Phỏng vấn AI vai trò ${s.roleCode} (lần ${s.attemptNumber}): ${passed ? "ĐẠT" : "CHƯA ĐẠT"} (${s.result.overallScore}/100).`
  );
  notifyUser(
    s.userId,
    "recruitment",
    `Kết quả phỏng vấn: ${passed ? "ĐẠT" : "CHƯA ĐẠT"} (${s.result.overallScore}/100)`,
    passed
      ? `Chúc mừng! Bạn đã qua phỏng vấn vai trò ${ROLE_LABELS[s.roleCode] ?? s.roleCode}. Đang chờ giảng viên chọn vào phiên thực tập.`
      : `Đừng nản chí! Bạn còn ${profile.maxAttempts - profile.attemptCount} lần thi lại. Xem nhận xét để ôn tập đúng trọng tâm.`,
    "#/recruitment"
  );
}

function getMySession(ctx: Ctx, id: string): InterviewSession {
  const s = ctx.store.interviews.find((i) => i.id === id && i.userId === ctx.user!.id);
  if (!s) throw notFound("Không tìm thấy phiên phỏng vấn.");
  return s;
}

/** Hết hạn phiên đang làm → evaluation_failed (không có result). */
function maybeExpire(s: InterviewSession): void {
  if (s.status === "in_progress" && new Date(s.expiresAt).getTime() < Date.now()) {
    s.status = "evaluation_failed";
    const profile = getRecruitment(s.userId);
    profile.status = "failed";
    profile.nextEligibleAt = nowIso();
  }
}

function conversationPayload(ctx: Ctx, s: InterviewSession): Record<string, unknown> {
  maybeExpire(s);
  if (s.status === "evaluating") {
    maybeCompleteEvaluation(ctx, s);
  }
  const payload: Record<string, unknown> = {
    session: sessionPublic(s),
    answeredCount: s.questions.filter((q) => q.status !== "ready").length,
    totalQuestions: s.questions.length,
    messages: s.messages.map((m) => ({ id: m.id, role: m.role, content: m.content, at: m.at })),
    currentQuestion: s.status === "in_progress" && currentReadyQuestion(s) ? questionPublic(currentReadyQuestion(s)!) : null,
  };
  if (s.status === "evaluating") payload.evaluating = true;
  if (s.status === "completed" && s.result) {
    payload.finished = true;
    payload.currentQuestion = null;
  }
  return payload;
}

/* ------------------------------- handlers ------------------------------- */

async function getRecruitmentMe(ctx: Ctx): Promise<unknown> {
  const profile = myProfile(ctx);
  const evaluating = currentInterviewOf(ctx.user!.id);
  if (evaluating) maybeCompleteEvaluation(ctx, evaluating);

  const current = currentInterviewOf(ctx.user!.id) ?? null;
  const latest = ctx.store.interviews
    .filter((i) => i.userId === ctx.user!.id && i.result)
    .sort((a, b) => ((a.submittedAt ?? a.startedAt) < (b.submittedAt ?? b.startedAt) ? 1 : -1))[0];

  return {
    status: profile.status,
    selectedRole: profile.selectedRole,
    selectedRoleLabel: profile.selectedRole ? (ROLE_LABELS[profile.selectedRole] ?? profile.selectedRole) : null,
    attemptNumber: profile.attemptCount,
    attemptsRemaining: Math.max(0, profile.maxAttempts - profile.attemptCount),
    nextEligibleAt: profile.nextEligibleAt,
    currentInterviewSessionId: current?.id ?? null,
    result: latest?.result ?? null,
  };
}

async function listInterviews(ctx: Ctx): Promise<unknown> {
  const items = ctx.store.interviews
    .filter((i) => i.userId === ctx.user!.id)
    .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))
    .map((i) => ({
      id: i.id,
      roleCode: i.roleCode,
      status: i.status,
      startedAt: i.startedAt,
      submittedAt: i.submittedAt,
      attemptNumber: i.attemptNumber,
      decision: i.result?.decision ?? null,
      overallScore: i.result?.overallScore ?? null,
    }));
  return pageOf(items, ctx.query);
}

async function patchRole(ctx: Ctx): Promise<unknown> {
  const role = typeof ctx.body?.role === "string" ? ctx.body.role.trim() : "";
  if (!VALID_ROLES.includes(role)) {
    throw badRequest("Vai trò không hợp lệ.", [`role: một trong ${VALID_ROLES.join(", ")}`]);
  }
  const profile = myProfile(ctx);
  const active = currentInterviewOf(ctx.user!.id);
  if (active) {
    throw conflict("Bạn đang có phiên phỏng vấn đang diễn ra — không thể đổi vai trò lúc này.");
  }
  profile.selectedRole = role;
  if (profile.status === "not_started") profile.status = "role_selected";
  return {
    status: profile.status,
    selectedRole: profile.selectedRole,
    selectedRoleLabel: ROLE_LABELS[role],
    attemptCount: profile.attemptCount,
    maxAttempts: profile.maxAttempts,
    recruitedAt: profile.recruitedAt,
    nextEligibleAt: profile.nextEligibleAt,
  };
}

function pickQuestions(ctx: Ctx, role: string): InterviewQuestion[] {
  const bank = ctx.store.questionBank.filter((q) => q.isActive && q.roleCode === role);
  const pick = (phase: Question["phase"], n: number): Question[] =>
    bank
      .filter((q) => q.phase === phase)
      .sort(() => Math.random() - 0.5)
      .slice(0, n);
  const selected = [
    ...pick("introduction", 1),
    ...pick("technical", 3),
    ...pick("english", 1),
    ...pick("communication", 2),
  ];
  // fallback nếu ngân hàng thiếu
  if (selected.length < 5) {
    const rest = bank.filter((q) => !selected.includes(q));
    selected.push(...rest.slice(0, 5 - selected.length));
  }
  let position = 1;
  return selected.map((q) => ({
    id: randomId("qst"),
    position: position++,
    phase: q.phase,
    kind: "main" as const,
    prompt: q.prompt,
    expectedConcepts: q.expectedConcepts,
    answer: null,
    status: "ready" as const,
    score: null,
  }));
}

async function startInterview(ctx: Ctx): Promise<unknown> {
  const profile = myProfile(ctx);
  if (!profile.selectedRole) {
    throw new ApiErr(400, "Bạn cần chọn vai trò trước khi bắt đầu phỏng vấn.", "ROLE_REQUIRED");
  }
  if (profile.attemptCount >= profile.maxAttempts) {
    throw badRequest("Bạn đã dùng hết số lần phỏng vấn cho phép.", ["attempts: tối đa " + profile.maxAttempts]);
  }
  if (profile.nextEligibleAt && new Date(profile.nextEligibleAt).getTime() > Date.now()) {
    throw badRequest("Bạn chưa đủ điều kiện thi lại vào lúc này. Vui lòng thử lại sau.");
  }
  const active = currentInterviewOf(ctx.user!.id);
  if (active) {
    throw conflict("Bạn đang có phiên phỏng vấn chưa hoàn tất.");
  }

  const questions = pickQuestions(ctx, profile.selectedRole);
  const session: InterviewSession = {
    id: randomId("itv"),
    userId: ctx.user!.id,
    roleCode: profile.selectedRole,
    status: "in_progress",
    startedAt: nowIso(),
    submittedAt: null,
    expiresAt: new Date(Date.now() + SESSION_MINUTES * 60000).toISOString(),
    attemptNumber: profile.attemptCount + 1,
    currentIndex: 0,
    questions,
    messages: [
      {
        id: randomId("msg"),
        role: "ai",
        content: `Chào ${ctx.user!.displayName.split(" ")[0]}! Mình là AI phỏng vấn của V-Intern. Buổi phỏng vấn vai trò ${ROLE_LABELS[profile.selectedRole] ?? profile.selectedRole} gồm ${questions.length} câu hỏi về giới thiệu, kỹ thuật, tiếng Anh và giao tiếp. Trả lời tự nhiên như đang trò chuyện nhé — sẵn sàng thì bắt đầu!`,
        at: nowIso(),
      },
      { id: randomId("msg"), role: "ai", content: questions[0]?.prompt ?? "", at: nowIso() },
    ],
    evaluatingSince: null,
    result: null,
    jitter: 0,
  };
  ctx.store.interviews.push(session);
  profile.attemptCount += 1;
  profile.status = "interview_in_progress";
  pushAudit(ctx.user!.displayName, "CREATE", `Bắt đầu phiên phỏng vấn ${session.id} (lần ${session.attemptNumber})`);
  return {
    session: sessionPublic(session),
    firstQuestion: session.questions[0] ? questionPublic(session.questions[0]) : null,
  };
}

async function getConversation(ctx: Ctx): Promise<unknown> {
  const s = getMySession(ctx, ctx.params.id);
  return conversationPayload(ctx, s);
}

async function putAnswer(ctx: Ctx): Promise<unknown> {
  const s = getMySession(ctx, ctx.params.id);
  maybeExpire(s);
  if (s.status !== "in_progress") throw conflict("Phiên phỏng vấn đã đóng, không thể trả lời thêm.");

  const answerText = typeof ctx.body?.answerText === "string" ? ctx.body.answerText.trim() : "";
  if (!answerText) throw badRequest("Nội dung trả lời không được để trống.", ["answerText: bắt buộc"]);

  const q = s.questions.find((x) => x.id === ctx.params.questionId);
  if (!q) throw notFound("Không tìm thấy câu hỏi trong phiên này.");
  if (q.status !== "ready") throw conflict("Câu hỏi này đã được trả lời hoặc bỏ qua.");

  q.answer = answerText;
  q.status = "answered";
  q.score = scoreAnswer(q, answerText, s.jitter);
  s.messages.push({ id: randomId("msg"), role: "user", content: answerText, at: nowIso() });

  const next = currentReadyQuestion(s);
  return {
    question: questionPublic(q),
    currentQuestion: next ? questionPublic(next) : null,
    finished: !next,
  };
}

async function nextQuestion(ctx: Ctx): Promise<unknown> {
  const s = getMySession(ctx, ctx.params.id);
  maybeExpire(s);
  if (s.status === "evaluating") maybeCompleteEvaluation(ctx, s);
  if (s.status !== "in_progress") {
    return { session: sessionPublic(s), currentQuestion: null, finished: true };
  }
  const next = currentReadyQuestion(s);
  if (next && next !== s.questions[s.currentIndex]) {
    s.messages.push({ id: randomId("msg"), role: "ai", content: next.prompt, at: nowIso() });
  }
  if (next) s.currentIndex = s.questions.indexOf(next);
  return { session: sessionPublic(s), currentQuestion: next ? questionPublic(next) : null, finished: !next };
}

async function clarify(ctx: Ctx): Promise<unknown> {
  const s = getMySession(ctx, ctx.params.id);
  maybeExpire(s);
  if (s.status !== "in_progress") throw conflict("Phiên phỏng vấn đã đóng.");

  const current = currentReadyQuestion(s);
  if (!current) throw conflict("Không có câu hỏi nào đang chờ trả lời.");

  const hints: Record<string, string> = {
    introduction: "Câu này muốn nghe về con người bạn: bạn là ai, đang học gì, vì sao chọn vai trò này. Cấu trúc gợi ý: bản thân → trải nghiệm liên quan → mục tiêu.",
    technical: "Câu này kiểm tra kiến thức kỹ thuật. Trình bày theo: định nghĩa ngắn → cơ chế hoạt động → ví dụ thực tế → đánh đổi (nếu có). Không cần hoàn hảo, đủ ý là được.",
    english: "Câu này kiểm tra tiếng Anh kỹ thuật. Viết 3–5 câu là đủ: mô tả tình huống, nguyên nhân và cách bạn giải quyết. Đừng lo ngữ pháp nhỏ.",
    communication: "Câu này xem cách bạn phối hợp với người khác. Gợi ý: lắng nghe → tìm hiểu lý lẽ → đề xuất hướng giải quyết → giữ thái độ tôn trọng.",
  };
  const message = `Gợi ý làm rõ: ${hints[current.phase] ?? "Trả lời theo cấu trúc: ý chính → ví dụ → kết luận."} (Câu hỏi gốc: "${current.prompt}")`;
  s.messages.push({ id: randomId("msg"), role: "ai", content: message, at: nowIso() });
  return { message, currentQuestion: questionPublic(current) };
}

async function skipQuestion(ctx: Ctx): Promise<unknown> {
  const s = getMySession(ctx, ctx.params.id);
  maybeExpire(s);
  if (s.status !== "in_progress") throw conflict("Phiên phỏng vấn đã đóng.");

  const current = currentReadyQuestion(s);
  if (!current) throw conflict("Không có câu hỏi nào đang chờ trả lời.");
  current.status = "skipped";
  s.messages.push({ id: randomId("msg"), role: "ai", content: "(Bạn đã chọn bỏ qua câu hỏi này — câu bị đánh dấu skipped và không tính điểm.)", at: nowIso() });

  const next = currentReadyQuestion(s);
  if (next) {
    s.currentIndex = s.questions.indexOf(next);
    s.messages.push({ id: randomId("msg"), role: "ai", content: next.prompt, at: nowIso() });
  }
  return { session: sessionPublic(s), currentQuestion: next ? questionPublic(next) : null, finished: !next };
}

async function submitInterview(ctx: Ctx): Promise<unknown> {
  const s = getMySession(ctx, ctx.params.id);
  maybeExpire(s);
  if (s.status === "completed" || s.status === "evaluating") {
    throw conflict("Phiên phỏng vấn đã được nộp trước đó.");
  }
  if (s.status !== "in_progress") throw conflict("Phiên phỏng vấn đã đóng.");

  s.status = "evaluating";
  s.evaluatingSince = nowIso();
  s.submittedAt = nowIso();
  const profile = myProfile(ctx);
  profile.status = "evaluation_pending";
  pushAudit(ctx.user!.displayName, "STATUS_CHANGE", `Nộp bài phỏng vấn ${s.id} — đang chấm`);
  return { session: sessionPublic(s), evaluating: true, status: "evaluating" };
}

async function retryEvaluation(ctx: Ctx): Promise<unknown> {
  const s = getMySession(ctx, ctx.params.id);
  if (s.status === "in_progress") throw conflict("Phiên phỏng vấn chưa được nộp.");
  if (s.status === "evaluating") {
    maybeCompleteEvaluation(ctx, s);
    if (s.status === "evaluating") return { session: sessionPublic(s), evaluating: true, status: "evaluating" };
  }
  s.jitter += 1;
  s.status = "evaluating";
  s.evaluatingSince = nowIso();
  return { session: sessionPublic(s), evaluating: true, status: "evaluating", retry: true };
}

async function getResult(ctx: Ctx): Promise<unknown> {
  const evaluating = currentInterviewOf(ctx.user!.id);
  if (evaluating) maybeCompleteEvaluation(ctx, evaluating);
  const latest = ctx.store.interviews
    .filter((i) => i.userId === ctx.user!.id && i.result)
    .sort((a, b) => ((a.submittedAt ?? a.startedAt) < (b.submittedAt ?? b.startedAt) ? 1 : -1))[0];
  return latest?.result ?? null;
}

/* ------------------------------- routes ------------------------------- */

export const recruitmentRoutes: RouteDef[] = [
  route("GET", "/recruitment/me", "intern", getRecruitmentMe),
  route("GET", "/recruitment/me/interviews", "intern", listInterviews),
  route("PATCH", "/recruitment/me/role", "intern", patchRole),
  route("POST", "/recruitment/me/interviews", "intern", startInterview),
  route("GET", "/recruitment/me/interviews/:id/conversation", "intern", getConversation),
  route("PUT", "/recruitment/me/interviews/:id/answers/:questionId", "intern", putAnswer),
  route("POST", "/recruitment/me/interviews/:id/conversation/next", "intern", nextQuestion),
  route("POST", "/recruitment/me/interviews/:id/conversation/clarify", "intern", clarify),
  route("POST", "/recruitment/me/interviews/:id/skip", "intern", skipQuestion),
  route("POST", "/recruitment/me/interviews/:id/submit", "intern", submitInterview),
  route("POST", "/recruitment/me/interviews/:id/retry-evaluation", "intern", retryEvaluation),
  route("GET", "/recruitment/me/result", "intern", getResult),
];
