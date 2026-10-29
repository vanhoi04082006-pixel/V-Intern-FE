"use client";

/**
 * Domain API: Đánh giá — evaluation-cycles, evaluations, ai-suggestions,
 * imported-reviews.
 */

import { getJson, sendJson, arrOf, dateOf, numOf, strOf, qs, parsePaginated } from "@/lib/api/client";

export interface EvaluationCycle {
  id: string;
  code: string;
  name: string;
  type: string;
  status: string;
  sessionId: string | null;
  projectId: string | null;
  startDate: string | null;
  endDate: string | null;
  dueDate: string | null;
}

export interface Criterion {
  id: string;
  code: string;
  name: string;
  description: string | null;
  weight: number;
  maxScore: number | null;
  isRequired: boolean;
}

export interface EvaluationItem {
  id: string;
  cycleId: string;
  cycleName: string | null;
  internId: string;
  internName: string;
  evaluatorId: string | null;
  evaluatorName: string | null;
  status: string;
  overallScore: number | null;
  summary: string | null;
  scores: { criterionId: string; code: string; name: string; weight: number; score: number | null; maxScore: number | null; comment: string | null }[];
  version: number;
}

function parseCycle(d: Record<string, unknown>): EvaluationCycle {
  return {
    id: strOf(d.id),
    code: strOf(d.code),
    name: strOf(d.name),
    type: strOf(d.type, "formative"),
    status: strOf(d.status, "draft"),
    sessionId: d.sessionId == null ? null : strOf(d.sessionId),
    projectId: d.projectId == null ? null : strOf(d.projectId),
    startDate: dateOf(d.startDate as string),
    endDate: dateOf(d.endDate as string),
    dueDate: dateOf(d.dueDate as string),
  };
}

function parseEvaluation(d: Record<string, unknown>): EvaluationItem {
  const cycle = (d.cycle ?? {}) as Record<string, unknown>;
  const intern = (d.intern ?? {}) as Record<string, unknown>;
  const evaluator = (d.evaluator ?? {}) as Record<string, unknown>;
  return {
    id: strOf(d.id),
    cycleId: strOf(d.cycleId ?? cycle.id),
    cycleName: typeof cycle.name === "string" ? cycle.name : typeof d.cycleName === "string" ? d.cycleName : null,
    internId: strOf(d.internId ?? intern.id),
    internName: strOf(intern.displayName ?? d.internName),
    evaluatorId: d.evaluatorId == null ? null : strOf(d.evaluatorId),
    evaluatorName: typeof evaluator.displayName === "string" ? evaluator.displayName : null,
    status: strOf(d.status, "draft"),
    overallScore: d.overallScore == null ? null : numOf(d.overallScore),
    summary: typeof d.summary === "string" ? d.summary : null,
    scores: arrOf(d.scores ?? d.criteria, (s) => {
      const r = (s ?? {}) as Record<string, unknown>;
      return {
        criterionId: strOf(r.criterionId ?? r.id),
        code: strOf(r.code),
        name: strOf(r.name),
        weight: numOf(r.weight),
        score: r.score == null ? null : numOf(r.score),
        maxScore: r.maxScore == null ? null : numOf(r.maxScore),
        comment: typeof r.comment === "string" ? r.comment : null,
      };
    }),
    version: numOf(d.version, 1),
  };
}

/* ── Cycles ── */

export function fetchEvaluationCycles(query: { status?: string; sessionId?: string; projectId?: string; page?: number } = {}, signal?: AbortSignal) {
  return getJson(
    "/api/v1/evaluation-cycles" + qs({ status: query.status, sessionId: query.sessionId, projectId: query.projectId, page: query.page ?? 1, pageSize: 20 }),
    parsePaginated(parseCycle),
    signal,
  );
}

export function createEvaluationCycle(payload: { code: string; name: string; sessionId?: string; projectId?: string; type: string; startDate: string; endDate: string; dueDate?: string; useDefaultTemplate?: boolean }): Promise<EvaluationCycle> {
  return sendJson("/api/v1/evaluation-cycles", "POST", payload, (data) => parseCycle((data ?? {}) as Record<string, unknown>));
}

export function transitionCycle(id: string, status: string): Promise<EvaluationCycle> {
  return sendJson(`/api/v1/evaluation-cycles/${encodeURIComponent(id)}/status`, "POST", { status }, (data) => parseCycle((data ?? {}) as Record<string, unknown>));
}

export function fetchCycleCriteria(cycleId: string, signal?: AbortSignal): Promise<Criterion[]> {
  return getJson(`/api/v1/evaluation-cycles/${encodeURIComponent(cycleId)}/criteria`, (data) => {
    const d = (data ?? {}) as Record<string, unknown>;
    const arr = Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
    return arrOf(arr, (c) => {
      const r = (c ?? {}) as Record<string, unknown>;
      return {
        id: strOf(r.id),
        code: strOf(r.code),
        name: strOf(r.name),
        description: typeof r.description === "string" ? r.description : null,
        weight: numOf(r.weight),
        maxScore: r.maxScore == null ? null : numOf(r.maxScore),
        isRequired: r.isRequired === true,
      };
    });
  }, signal);
}

/* ── Evaluations ── */

export function fetchEvaluations(query: { cycleId?: string; internId?: string; evaluatorId?: string; status?: string; page?: number } = {}, signal?: AbortSignal) {
  return getJson(
    "/api/v1/evaluations" + qs({ cycleId: query.cycleId, internId: query.internId, evaluatorId: query.evaluatorId, status: query.status, page: query.page ?? 1, pageSize: 20 }),
    parsePaginated(parseEvaluation),
    signal,
  );
}

export function fetchEvaluation(id: string, signal?: AbortSignal): Promise<EvaluationItem> {
  return getJson(`/api/v1/evaluations/${encodeURIComponent(id)}`, (data) => parseEvaluation((data ?? {}) as Record<string, unknown>), signal);
}

export function createEvaluation(payload: { cycleId: string; internId: string; evaluatorId?: string }): Promise<EvaluationItem> {
  return sendJson("/api/v1/evaluations", "POST", payload, (data) => parseEvaluation((data ?? {}) as Record<string, unknown>));
}

export function saveEvaluationScores(id: string, payload: { scores: { criterionId: string; score: number; comment?: string }[]; summary?: string }): Promise<EvaluationItem> {
  return sendJson(`/api/v1/evaluations/${encodeURIComponent(id)}`, "PATCH", payload, (data) => parseEvaluation((data ?? {}) as Record<string, unknown>));
}

export function submitEvaluation(id: string): Promise<EvaluationItem> {
  return sendJson(`/api/v1/evaluations/${encodeURIComponent(id)}/submit`, "POST", {}, (data) => parseEvaluation((data ?? {}) as Record<string, unknown>));
}

export function finalizeEvaluation(id: string): Promise<EvaluationItem> {
  return sendJson(`/api/v1/evaluations/${encodeURIComponent(id)}/finalize`, "POST", {}, (data) => parseEvaluation((data ?? {}) as Record<string, unknown>));
}

/* ── AI suggestions (giảng viên) ── */

export interface AiSuggestion {
  id: string;
  status: string;
  draftSummary: string | null;
  draftScores: { code: string; score: number }[];
  createdAt: string | null;
}

export function requestAiSuggestion(evaluationId: string): Promise<AiSuggestion> {
  return sendJson(`/api/v1/evaluations/${encodeURIComponent(evaluationId)}/ai-suggestions`, "POST", {}, (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    return {
      id: strOf(r.id),
      status: strOf(r.status),
      draftSummary: typeof r.draftSummary === "string" ? r.draftSummary : null,
      draftScores: arrOf(r.draftScores, (s) => {
        const sr = (s ?? {}) as Record<string, unknown>;
        return { code: strOf(sr.code), score: numOf(sr.score) };
      }),
      createdAt: dateOf(r.createdAt as string),
    };
  });
}

export function fetchAiSuggestions(evaluationId: string, signal?: AbortSignal): Promise<AiSuggestion[]> {
  return getJson(`/api/v1/evaluations/${encodeURIComponent(evaluationId)}/ai-suggestions`, (data) => {
    const d = (data ?? {}) as Record<string, unknown>;
    const arr = Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
    return arrOf(arr, (s) => {
      const r = (s ?? {}) as Record<string, unknown>;
      return {
        id: strOf(r.id),
        status: strOf(r.status),
        draftSummary: typeof r.draftSummary === "string" ? r.draftSummary : null,
        draftScores: arrOf(r.draftScores, (x) => {
          const xr = (x ?? {}) as Record<string, unknown>;
          return { code: strOf(xr.code), score: numOf(xr.score) };
        }),
        createdAt: dateOf(r.createdAt as string),
      };
    });
  }, signal);
}

/* ── Imported reviews (PR review của mentor) ── */

export interface ImportedReview {
  id: string;
  internName: string | null;
  repositoryUrl: string | null;
  score: number | null;
  status: string;
  feedback: string | null;
  version: number;
}

export function fetchImportedReviews(signal?: AbortSignal) {
  return getJson("/api/v1/imported-reviews" + qs({ pageSize: 50 }), parsePaginated((d) => {
    const r = (d ?? {}) as Record<string, unknown>;
    const intern = (r.intern ?? {}) as Record<string, unknown>;
    return {
      id: strOf(r.id),
      internName: typeof intern.displayName === "string" ? intern.displayName : null,
      repositoryUrl: typeof r.repositoryUrl === "string" ? r.repositoryUrl : null,
      score: r.score == null ? null : numOf(r.score),
      status: strOf(r.status),
      feedback: typeof r.feedback === "string" ? r.feedback : null,
      version: numOf(r.version, 1),
    } as ImportedReview;
  }), signal);
}

export function updateImportedReview(id: string, payload: { score?: number; status?: string; feedback?: string; version: number }): Promise<void> {
  return sendJson(`/api/v1/imported-reviews/${encodeURIComponent(id)}`, "PATCH", payload, () => undefined);
}
