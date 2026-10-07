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
export const recruitmentApi = {
  me: (signal?: AbortSignal) =>
    request("/recruitment/me", parseProfile, { signal }),
  selectRole: (role: RecruitmentRole) =>
    request("/recruitment/me/role", parseProfile, {
      method: "PATCH",
      body: { role },
    }),
  start: () =>
    request("/recruitment/me/interviews", parseInterview, { method: "POST" }),
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
