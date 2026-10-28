import { request } from "./client";
import * as p from "./parse";
import type { RecruitmentRole } from "./workspace";
export interface RecruitmentResult {
  id: string;
  sessionId: string;
  technicalScore: number;
  softSkillScore: number;
  overallScore: number;
  decision: "passed" | "failed";
  strengths: string[];
  weaknesses: string[];
  criteria: { code: string; score: number; feedback: string }[];
  feedback: string;
  recommendedRole: string | null;
  model: string;
  promptVersion: string;
  evaluatedAt: string;
}
export interface RecruitmentProfile {
  interviewSchedule?: RecruitmentSchedule | null;
  status:
    | "not_started"
    | "role_selected"
    | "interview_in_progress"
    | "evaluation_pending"
    | "passed"
    | "failed";
  selectedRole: string | null;
  selectedRoleLabel: string | null;
  attemptNumber: number;
  attemptsRemaining: number;
  nextEligibleAt: string | null;
  currentInterviewSessionId: string | null;
  recruitedAt: string | null;
  result: RecruitmentResult | null;
}
export interface RecruitmentSchedule {
  managed: boolean;
  phase: "waiting" | "ready" | "started" | "no_show" | "cancelled";
  bookingId: string | null;
  version: number | null;
  roleCode: string | null;
  roleName: string | null;
  startsAt: string | null;
  endsAt: string | null;
  deadlineAt: string | null;
  timezone: string | null;
  sessionId: string | null;
  serverNow: string;
}
function parseSchedule(raw: unknown): RecruitmentSchedule {
  const s = p.record(raw);
  return {
    managed: p.boolean(s.managed),
    phase: p.oneOf(s.phase, [
      "waiting",
      "ready",
      "started",
      "no_show",
      "cancelled",
    ]),
    bookingId: p.nullable(s.bookingId, p.string),
    version: p.nullable(s.version, p.number),
    roleCode: p.nullable(s.roleCode, p.string),
    roleName: p.nullable(s.roleName, p.string),
    startsAt: p.nullable(s.startsAt, p.string),
    endsAt: p.nullable(s.endsAt, p.string),
    deadlineAt: p.nullable(s.deadlineAt, p.string),
    timezone: p.nullable(s.timezone, p.string),
    sessionId: p.nullable(s.sessionId, p.string),
    serverNow: p.string(s.serverNow),
  };
}
export interface InterviewSession {
  id: string;
  roleCode: string;
  status:
    | "created"
    | "in_progress"
    | "submitted"
    | "evaluating"
    | "completed"
    | "evaluation_failed"
    | "expired"
    | "cancelled";
  startedAt: string | null;
  expiresAt: string | null;
  submittedAt: string | null;
  attemptNumber: number;
  questionCount: number;
  serverNow: string;
  secondsRemaining: number | null;
}
export interface InterviewQuestion {
  id: string;
  position: number;
  category: "technical" | "soft";
  difficulty: string;
  prompt: string;
  answered: boolean;
  answeredAt: string | null;
}
export interface Interview {
  session: InterviewSession;
  questions: InterviewQuestion[];
}
export function parseResult(value: unknown): RecruitmentResult {
  const v = p.record(value);
  return {
    id: p.string(v.id),
    sessionId: p.string(v.sessionId),
    technicalScore: p.number(v.technicalScore),
    softSkillScore: p.number(v.softSkillScore),
    overallScore: p.number(v.overallScore),
    decision: p.oneOf(v.decision, ["passed", "failed"]),
    strengths: p.array(v.strengths, p.string),
    weaknesses: p.array(v.weaknesses, p.string),
    criteria: p.array(v.criteria, (x) => {
      const c = p.record(x);
      return {
        code: p.string(c.code),
        score: p.number(c.score),
        feedback: p.string(c.feedback),
      };
    }),
    feedback: p.string(v.feedback),
    recommendedRole: p.nullable(v.recommendedRole, p.string),
    model: p.string(v.model),
    promptVersion: p.string(v.promptVersion),
    evaluatedAt: p.string(v.evaluatedAt),
  };
}
export function parseProfile(value: unknown): RecruitmentProfile {
  const v = p.record(value);
  return {
    ...(v.interviewSchedule === undefined
      ? {}
      : { interviewSchedule: p.nullable(v.interviewSchedule, parseSchedule) }),
    status: p.oneOf(v.status, [
      "not_started",
      "role_selected",
      "interview_in_progress",
      "evaluation_pending",
      "passed",
      "failed",
    ]),
    selectedRole: p.nullable(v.selectedRole, p.string),
    selectedRoleLabel: p.nullable(v.selectedRoleLabel, p.string),
    attemptNumber: p.number(v.attemptNumber),
    attemptsRemaining: p.number(v.attemptsRemaining),
    nextEligibleAt: p.nullable(v.nextEligibleAt, p.string),
    currentInterviewSessionId: p.nullable(
      v.currentInterviewSessionId,
      p.string,
    ),
    recruitedAt: p.nullable(v.recruitedAt, p.string),
    result: p.nullable(v.result, parseResult),
  };
}
export function parseInterviewSession(value: unknown): InterviewSession {
  const v = p.record(value);
  return {
    id: p.string(v.id),
    roleCode: p.string(v.roleCode),
    status: p.oneOf(v.status, [
      "created",
      "in_progress",
      "submitted",
      "evaluating",
      "completed",
      "evaluation_failed",
      "expired",
      "cancelled",
    ]),
    startedAt: p.nullable(v.startedAt, p.string),
    expiresAt: p.nullable(v.expiresAt, p.string),
    submittedAt: p.nullable(v.submittedAt, p.string),
    attemptNumber: p.number(v.attemptNumber),
    questionCount: p.number(v.questionCount),
    serverNow: p.string(v.serverNow),
    secondsRemaining: p.nullable(v.secondsRemaining, p.number),
  };
}
export function parseInterview(value: unknown): Interview {
  const v = p.record(value);
  return {
    session: parseInterviewSession(v.session),
    questions: p.array(v.questions, (x) => {
      const q = p.record(x);
      return {
        id: p.string(q.id),
        position: p.number(q.position),
        category: p.oneOf(q.category, ["technical", "soft"]),
        difficulty: p.string(q.difficulty),
        prompt: p.string(q.prompt),
        answered: p.boolean(q.answered),
        answeredAt: p.nullable(q.answeredAt, p.string),
      };
    }),
  };
}
function parseEvaluation(value: unknown) {
  const v = p.record(value);
  return {
    session: parseInterviewSession(v.session),
    result: p.nullable(v.result, parseResult),
    errorCode: v.errorCode === undefined ? undefined : p.string(v.errorCode),
  };
}
const sessionPath = (id: string) =>
  `/recruitment/me/interviews/${encodeURIComponent(id)}`;
export function parseInterviewHistory(value: unknown) {
  const v = p.record(value);
  return {
    total: p.number(v.total),
    items: p.array(v.items, (item) => {
      const s = p.record(item);
      return {
        id: p.string(s.id),
        roleCode: p.string(s.roleCode),
        status: p.string(s.status),
        attemptNumber: p.number(s.attemptNumber),
        questionCount: p.number(s.questionCount),
        startedAt: p.nullable(s.startedAt, p.string),
        submittedAt: p.nullable(s.submittedAt, p.string),
        evaluatedAt: p.nullable(s.evaluatedAt, p.string),
        result: p.nullable(s.result, parseResult),
      };
    }),
  };
}
export const recruitmentApi = {
  me: (signal?: AbortSignal) =>
    request("/recruitment/me", parseProfile, { signal }),
  history: (page = 1, signal?: AbortSignal) =>
    request(
      `/recruitment/me/interviews?page=${page}&pageSize=5`,
      parseInterviewHistory,
      { signal },
    ),
  selectRole: (role: RecruitmentRole) =>
    request("/recruitment/me/role", parseProfile, {
      method: "PATCH",
      body: { role },
    }),
  start: () =>
    request("/recruitment/me/interviews", parseInterview, { method: "POST" }),
  /** Interview session status (own sessions; 404-safe) — for resume/reload. */
  sessionStatus: (id: string, signal?: AbortSignal) =>
    request(sessionPath(id), parseInterviewSession, { signal }),
  questions: (id: string, signal?: AbortSignal) =>
    request(`${sessionPath(id)}/questions`, parseInterview, { signal }),
  saveAnswer: (id: string, questionId: string, answerText: string) =>
    request(
      `${sessionPath(id)}/answers/${encodeURIComponent(questionId)}`,
      (x) => {
        const a = p.record(x);
        return {
          id: p.string(a.id),
          sessionQuestionId: p.string(a.sessionQuestionId),
          answeredAt: p.string(a.answeredAt),
        };
      },
      { method: "PUT", body: { answerText } },
    ),
  saveFollowUp: (id: string, questionId: string, answerText: string) =>
    request(
      `${sessionPath(id)}/follow-ups/${encodeURIComponent(questionId)}`,
      (value) => {
        const v = p.record(value);
        return { saved: p.boolean(v.saved) };
      },
      { method: "PUT", body: { answerText } },
    ),
  submit: (id: string) =>
    request(`${sessionPath(id)}/submit`, parseEvaluation, { method: "POST" }),
  retryEvaluation: (id: string) =>
    request(`${sessionPath(id)}/retry-evaluation`, parseEvaluation, {
      method: "POST",
    }),
  result: (signal?: AbortSignal) =>
    request("/recruitment/me/result", parseResult, { signal }),
};
/** Local elapsed time animates the backend snapshot; it never expires/submits a session. */
export function remainingSeconds(
  session: InterviewSession,
  elapsedMs: number,
): number | null {
  return session.secondsRemaining === null
    ? null
    : Math.max(0, session.secondsRemaining - Math.floor(elapsedMs / 1000));
}

export function parseConversation(value: unknown) {
  const v = p.record(value);
  return {
    session: parseInterviewSession(v.session),
    answeredCount: p.number(v.answeredCount),
    messages: p.array(v.messages, (item) => {
      const m = p.record(item);
      return {
        role: p.oneOf(m.role, ["assistant", "user"]),
        questionId: p.string(m.questionId),
        position: p.number(m.position),
        content: p.string(m.content),
      };
    }),
    currentQuestion: p.nullable(v.currentQuestion, (item) => {
      const q = p.record(item);
      return {
        id: p.string(q.id),
        position: p.number(q.position),
        phase: p.string(q.phase),
        kind:
          q.kind === undefined
            ? ("main" as const)
            : p.oneOf(q.kind, ["main", "follow_up"]),
        status: p.oneOf(q.status, [
          "generating",
          "ready",
          "failed",
          "not_started",
        ]),
        errorCode: p.nullable(q.errorCode, p.string),
      };
    }),
  };
}
export const conversationView = (id: string, signal?: AbortSignal) =>
  request(`${sessionPath(id)}/conversation`, parseConversation, { signal });
export const conversationNext = (id: string) =>
  request(`${sessionPath(id)}/conversation/next`, parseConversation, {
    method: "POST",
  });

export const conversationClarify = (id: string) =>
  request(`${sessionPath(id)}/conversation/clarify`, parseConversation, {
    method: "POST",
  });
