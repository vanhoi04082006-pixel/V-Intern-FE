"use client";

/**
 * Domain API: Tuyển dụng — recruitment/me (phỏng vấn AI của sinh viên),
 * applications (nộp CV công khai), recruitment-rounds (staff),
 * candidates, question-bank, career-roles public.
 */

import { getJson, sendJson, sendForm, arrOf, dateOf, numOf, strOf, qs, parsePaginated } from "@/lib/api/client";

/* ───────────────── Recruitment profile (sinh viên) ───────────────── */

export interface RecruitmentProfile {
  status: string;
  selectedRole: string | null;
  attemptsUsed: number;
  maxAttempts: number;
  cooldownUntil: string | null;
  latestResult: { status: string; overallScore: number | null; passed: boolean } | null;
}

export function fetchRecruitmentProfile(signal?: AbortSignal): Promise<RecruitmentProfile> {
  return getJson("/api/v1/recruitment/me", (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    const result = (r.latestResult ?? r.result ?? null) as Record<string, unknown> | null;
    return {
      status: strOf(r.status, "none"),
      selectedRole: typeof r.selectedRole === "string" ? r.selectedRole : null,
      attemptsUsed: numOf(r.attemptsUsed),
      maxAttempts: numOf(r.maxAttempts, 3),
      cooldownUntil: dateOf(r.cooldownUntil as string),
      latestResult: result
        ? {
            status: strOf(result.status),
            overallScore: result.overallScore == null ? null : numOf(result.overallScore),
            passed: result.passed === true,
          }
        : null,
    };
  }, signal);
}

export interface CareerRole {
  code: string;
  name: string;
  description: string | null;
  level: string;
  language: string;
  requiredSkills: string[];
  acceptingApplications: boolean;
}

export function fetchCareerRoleCatalog(signal?: AbortSignal): Promise<CareerRole[]> {
  return getJson("/api/v1/career-roles", (data) => {
    const d = (data ?? {}) as Record<string, unknown>;
    const arr = Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
    return arrOf(arr, (c) => {
      const r = (c ?? {}) as Record<string, unknown>;
      return {
        code: strOf(r.code),
        name: strOf(r.name),
        description: typeof r.description === "string" ? r.description : null,
        level: strOf(r.level, "intern"),
        language: strOf(r.language, "vi"),
        requiredSkills: arrOf(r.requiredSkills, (s) => strOf(s)),
        acceptingApplications: r.acceptingApplications !== false,
      };
    });
  }, signal);
}

export function selectRecruitmentRole(role: string): Promise<void> {
  return sendJson("/api/v1/recruitment/me/role", "PATCH", { role }, () => undefined);
}

/* ───────────────── Interview (phỏng vấn AI) ───────────────── */

export interface InterviewSummary {
  id: string;
  status: string;
  startedAt: string | null;
  submittedAt: string | null;
  overallScore: number | null;
  technicalScore: number | null;
  softScore: number | null;
  questionCount: number;
  answeredCount: number;
}

export interface InterviewQuestion {
  id: string;
  order: number;
  section: string;
  prompt: string;
  answerText: string | null;
  followUp: string | null;
}

export interface ConversationTurn {
  role: "system" | "interviewer" | "candidate";
  content: string;
}

function parseInterview(d: Record<string, unknown>): InterviewSummary {
  return {
    id: strOf(d.id),
    status: strOf(d.status, "in_progress"),
    startedAt: dateOf(d.startedAt as string),
    submittedAt: dateOf(d.submittedAt as string),
    overallScore: d.overallScore == null ? null : numOf(d.overallScore),
    technicalScore: d.technicalScore == null ? null : numOf(d.technicalScore),
    softScore: d.softScore == null ? null : numOf(d.softScore),
    questionCount: numOf(d.questionCount, 10),
    answeredCount: numOf(d.answeredCount),
  };
}

export function fetchMyInterviews(signal?: AbortSignal): Promise<InterviewSummary[]> {
  return getJson("/api/v1/recruitment/me/interviews" + qs({ pageSize: 20 }), (data) => {
    const d = (data ?? {}) as Record<string, unknown>;
    const arr = Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
    return arrOf(arr, (i) => parseInterview((i ?? {}) as Record<string, unknown>));
  }, signal);
}

export function startInterview(): Promise<InterviewSummary> {
  return sendJson("/api/v1/recruitment/me/interviews", "POST", {}, (data) => parseInterview((data ?? {}) as Record<string, unknown>));
}

export function fetchInterview(id: string, signal?: AbortSignal): Promise<InterviewSummary> {
  return getJson(`/api/v1/recruitment/me/interviews/${encodeURIComponent(id)}`, (data) => parseInterview((data ?? {}) as Record<string, unknown>), signal);
}

export function fetchInterviewQuestions(interviewId: string, signal?: AbortSignal): Promise<InterviewQuestion[]> {
  return getJson(`/api/v1/recruitment/me/interviews/${encodeURIComponent(interviewId)}/questions`, (data) => {
    const d = (data ?? {}) as Record<string, unknown>;
    const arr = Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
    return arrOf(arr, (q) => {
      const r = (q ?? {}) as Record<string, unknown>;
      return {
        id: strOf(r.id),
        order: numOf(r.order),
        section: strOf(r.section, "technical"),
        prompt: strOf(r.prompt),
        answerText: typeof r.answerText === "string" ? r.answerText : null,
        followUp: typeof r.followUp === "string" ? r.followUp : null,
      };
    });
  }, signal);
}

export function fetchInterviewConversation(interviewId: string, signal?: AbortSignal): Promise<ConversationTurn[]> {
  return getJson(`/api/v1/recruitment/me/interviews/${encodeURIComponent(interviewId)}/conversation`, (data) => {
    const d = (data ?? {}) as Record<string, unknown>;
    const arr = Array.isArray(d.turns) ? d.turns : Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
    return arrOf(arr, (t) => {
      const r = (t ?? {}) as Record<string, unknown>;
      const role = strOf(r.role);
      return { role: role === "candidate" ? "candidate" : role === "system" ? "system" : "interviewer", content: strOf(r.content) };
    });
  }, signal);
}

export function askClarification(interviewId: string, question: string): Promise<{ reply: string }> {
  return sendJson(`/api/v1/recruitment/me/interviews/${encodeURIComponent(interviewId)}/conversation/clarify`, "POST", { question }, (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    return { reply: strOf(r.reply ?? r.answer ?? r.content) };
  });
}

export function requestNextQuestion(interviewId: string): Promise<InterviewQuestion | null> {
  return sendJson(`/api/v1/recruitment/me/interviews/${encodeURIComponent(interviewId)}/conversation/next`, "POST", {}, (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    if (!r.id) return null;
    return { id: strOf(r.id), order: numOf(r.order), section: strOf(r.section, "technical"), prompt: strOf(r.prompt), answerText: null, followUp: null };
  });
}

export function saveInterviewAnswer(interviewId: string, questionId: string, answerText: string): Promise<void> {
  return sendJson(
    `/api/v1/recruitment/me/interviews/${encodeURIComponent(interviewId)}/answers/${encodeURIComponent(questionId)}`,
    "PUT",
    { answerText },
    () => undefined,
  );
}

export function saveFollowUp(interviewId: string, questionId: string, answerText: string): Promise<void> {
  return sendJson(
    `/api/v1/recruitment/me/interviews/${encodeURIComponent(interviewId)}/follow-ups/${encodeURIComponent(questionId)}`,
    "PUT",
    { answerText },
    () => undefined,
  );
}

export function submitInterview(interviewId: string): Promise<InterviewSummary> {
  return sendJson(`/api/v1/recruitment/me/interviews/${encodeURIComponent(interviewId)}/submit`, "POST", {}, (data) => parseInterview((data ?? {}) as Record<string, unknown>));
}

export function retryInterviewEvaluation(interviewId: string): Promise<InterviewSummary> {
  return sendJson(`/api/v1/recruitment/me/interviews/${encodeURIComponent(interviewId)}/retry-evaluation`, "POST", {}, (data) => parseInterview((data ?? {}) as Record<string, unknown>));
}

export interface InterviewResult {
  status: string;
  passed: boolean;
  overallScore: number | null;
  technicalScore: number | null;
  softScore: number | null;
  decisionNote: string | null;
  evaluatedAt: string | null;
}

export function fetchRecruitmentResult(signal?: AbortSignal): Promise<InterviewResult | null> {
  return getJson("/api/v1/recruitment/me/result", (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    if (!r.status && r.overallScore == null) return null;
    return {
      status: strOf(r.status),
      passed: r.passed === true,
      overallScore: r.overallScore == null ? null : numOf(r.overallScore),
      technicalScore: r.technicalScore == null ? null : numOf(r.technicalScore),
      softScore: r.softScore == null ? null : numOf(r.softScore),
      decisionNote: typeof r.decisionNote === "string" ? r.decisionNote : null,
      evaluatedAt: dateOf(r.evaluatedAt as string),
    };
  }, signal);
}

/* ───────────────── Applications (công khai — ứng viên) ───────────────── */

export interface ApplicationRound {
  id: string;
  name: string;
  opensAt: string | null;
  closesAt: string | null;
  status: string;
}

export function fetchPublicRounds(signal?: AbortSignal): Promise<ApplicationRound[]> {
  return getJson("/api/v1/applications/rounds", (data) => {
    const d = (data ?? {}) as Record<string, unknown>;
    const arr = Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
    return arrOf(arr, (r0) => {
      const r = (r0 ?? {}) as Record<string, unknown>;
      return { id: strOf(r.id), name: strOf(r.name), opensAt: dateOf(r.opensAt as string), closesAt: dateOf(r.closesAt as string), status: strOf(r.status, "open") };
    });
  }, signal);
}

export interface ApplyResult {
  applicationId?: string;
  accessCodeSent?: boolean;
  verified?: boolean;
  message?: string;
}

export function submitApplication(payload: { roundId: string; email: string; fullName: string; consentVersion: string }, cv: File): Promise<ApplyResult> {
  const formData = new FormData();
  formData.append("roundId", payload.roundId);
  formData.append("email", payload.email);
  formData.append("fullName", payload.fullName);
  formData.append("consentVersion", payload.consentVersion);
  formData.append("cv", cv);
  return sendForm("/api/v1/applications", formData, (data) => (data ?? {}) as ApplyResult);
}

export function verifyApplicationToken(token: string): Promise<ApplyResult> {
  return sendJson("/api/v1/applications/verify", "POST", { token }, (data) => (data ?? {}) as ApplyResult);
}

export interface MyApplicationStatus {
  status: string;
  roundName: string | null;
  submittedAt: string | null;
  interviewSlot: string | null;
}

export function fetchMyApplication(signal?: AbortSignal): Promise<MyApplicationStatus | null> {
  return getJson("/api/v1/applications/me", (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    if (!r.status) return null;
    return {
      status: strOf(r.status),
      roundName: typeof r.roundName === "string" ? r.roundName : null,
      submittedAt: dateOf(r.submittedAt as string),
      interviewSlot: dateOf(r.interviewSlot as string),
    };
  }, signal);
}

export function supplementApplicationCv(cv: File): Promise<void> {
  const formData = new FormData();
  formData.append("cv", cv);
  return sendForm("/api/v1/applications/me/cv", formData, () => undefined);
}

export function leaveApplicationSession(): Promise<void> {
  return sendJson("/api/v1/applications/leave", "POST", {}, () => undefined);
}

/* ───────────────── Recruitment rounds (staff) ───────────────── */

export interface RecruitmentRound {
  id: string;
  name: string;
  status: string;
  opensAt: string | null;
  closesAt: string | null;
  applicationCount: number;
}

export function fetchRecruitmentRounds(signal?: AbortSignal) {
  return getJson("/api/v1/recruitment-rounds", parsePaginated((d) => {
    const r = (d ?? {}) as Record<string, unknown>;
    return {
      id: strOf(r.id),
      name: strOf(r.name),
      status: strOf(r.status, "draft"),
      opensAt: dateOf(r.opensAt as string),
      closesAt: dateOf(r.closesAt as string),
      applicationCount: numOf(r.applicationCount),
    } as RecruitmentRound;
  }), signal);
}

export function createRecruitmentRound(payload: { name: string; opensAt: string; closesAt: string }): Promise<RecruitmentRound> {
  return sendJson("/api/v1/recruitment-rounds", "POST", payload, (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    return { id: strOf(r.id), name: strOf(r.name), status: strOf(r.status, "draft"), opensAt: dateOf(r.opensAt as string), closesAt: dateOf(r.closesAt as string), applicationCount: 0 };
  });
}

export function setRoundStatus(id: string, status: string): Promise<void> {
  return sendJson(`/api/v1/recruitment-rounds/${encodeURIComponent(id)}/status`, "POST", { status }, () => undefined);
}

export interface RoundApplication {
  id: string;
  fullName: string;
  email: string;
  status: string;
  roleCode: string | null;
  submittedAt: string | null;
  interviewSlot: string | null;
}

export function fetchRoundApplications(roundId: string, page = 1, signal?: AbortSignal) {
  return getJson(`/api/v1/recruitment-rounds/${encodeURIComponent(roundId)}/applications` + qs({ page }), parsePaginated((d) => {
    const r = (d ?? {}) as Record<string, unknown>;
    return {
      id: strOf(r.id),
      fullName: strOf(r.fullName),
      email: strOf(r.email),
      status: strOf(r.status),
      roleCode: typeof r.roleCode === "string" ? r.roleCode : null,
      submittedAt: dateOf(r.submittedAt as string),
      interviewSlot: dateOf(r.interviewSlot as string),
    } as RoundApplication;
  }), signal);
}

/* ───────────────── Candidates (staff) ───────────────── */

export interface CandidateProfile {
  userId: string;
  displayName: string;
  email: string;
  role: string | null;
  eligibility: string;
  status: string;
  attempts: number;
  latestScore: number | null;
}

export function fetchCandidates(query: { search?: string; role?: string; status?: string; page?: number } = {}, signal?: AbortSignal) {
  return getJson(
    "/api/v1/recruitment/candidates" + qs({ search: query.search, role: query.role, status: query.status, page: query.page ?? 1, pageSize: 20 }),
    parsePaginated((d) => {
      const r = (d ?? {}) as Record<string, unknown>;
      return {
        userId: strOf(r.userId ?? r.id),
        displayName: strOf(r.displayName),
        email: strOf(r.email),
        role: typeof r.role === "string" ? r.role : null,
        eligibility: strOf(r.eligibility, "unknown"),
        status: strOf(r.status),
        attempts: numOf(r.attempts),
        latestScore: r.latestScore == null ? null : numOf(r.latestScore),
      } as CandidateProfile;
    }),
    signal,
  );
}

/* ───────────────── Question bank (admin) ───────────────── */

export interface BankQuestion {
  id: string;
  section: string;
  prompt: string;
  language: string;
  status: string;
  version: number;
}

export function fetchQuestionBank(query: { section?: string; status?: string; page?: number } = {}, signal?: AbortSignal) {
  return getJson(
    "/api/v1/admin/question-bank" + qs({ section: query.section, status: query.status, page: query.page ?? 1, pageSize: 20 }),
    parsePaginated((d) => {
      const r = (d ?? {}) as Record<string, unknown>;
      return { id: strOf(r.id), section: strOf(r.section), prompt: strOf(r.prompt), language: strOf(r.language, "vi"), status: strOf(r.status, "active"), version: numOf(r.version, 1) } as BankQuestion;
    }),
    signal,
  );
}

export function createBankQuestion(payload: { section: string; prompt: string; language?: string; rubric?: string }): Promise<BankQuestion> {
  return sendJson("/api/v1/admin/question-bank", "POST", payload, (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    return { id: strOf(r.id), section: strOf(r.section), prompt: strOf(r.prompt), language: strOf(r.language, "vi"), status: strOf(r.status, "active"), version: numOf(r.version, 1) };
  });
}

export function retireBankQuestion(id: string, version: number): Promise<void> {
  return sendJson(`/api/v1/admin/question-bank/${encodeURIComponent(id)}?version=${version}`, "DELETE", {}, () => undefined);
}
