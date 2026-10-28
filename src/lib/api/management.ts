import { request } from "./client";
import {
  array,
  nullable,
  number,
  oneOf,
  parsePage,
  record,
  string,
} from "./parse";
import { parseTask, type TaskStatus } from "./work";
import { parsePerformance, parseRecommendations } from "./outcomes";
export function parseItemsPage<T>(
  value: unknown,
  page: number,
  pageSize: number,
  parse: (v: unknown) => T,
) {
  const v = record(value),
    total = number(v.total);
  return {
    items: array(v.items, parse),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
export function parseCycle(value: unknown) {
  const v = record(value);
  return {
    id: string(v.id),
    code: string(v.code),
    name: string(v.name),
    status: oneOf(v.status, ["draft", "open", "closed", "archived"]),
    type: string(v.type),
    projectId: nullable(v.projectId, string),
    sessionId: nullable(v.sessionId, string),
    startDate: string(v.startDate),
    endDate: string(v.endDate),
  };
}
export function parseCriterion(value: unknown) {
  const v = record(value);
  return {
    id: string(v.id),
    code: string(v.code),
    name: string(v.name),
    weight: number(v.weight),
    maxScore: number(v.maxScore),
    isRequired: v.isRequired === true,
  };
}
export function parseManagedEvaluation(value: unknown) {
  const v = record(value);
  return {
    id: string(v.id),
    cycleId: string(v.cycleId),
    internId: string(v.internId),
    evaluatorId: string(v.evaluatorId),
    status: oneOf(v.status, ["draft", "submitted", "finalized"]),
    overallScore: nullable(v.overallScore, number),
    summary: nullable(v.summary, string),
    revisionNumber: number(v.revisionNumber),
  };
}
export function parseAiSuggestion(value: unknown) {
  const v = record(record(value).suggestion);
  return {
    summary: string(v.summary),
    strengths: array(v.strengths, string),
    improvements: array(v.improvementAreas, string),
    criteria: array(v.criterionSuggestions, (x) => {
      const c = record(x);
      return {
        criterionCode: string(c.criterionCode),
        suggestedScore: number(c.suggestedScore),
        comment: string(c.comment),
        evidence: array(c.evidence, string),
      };
    }),
  };
}
export const listCycles = (page: number, signal?: AbortSignal) =>
  request(
    `/evaluation-cycles?page=${page}&pageSize=10`,
    (x) => parseItemsPage(x, page, 10, parseCycle),
    { signal },
  );
export const createCycle = (body: {
  code: string;
  name: string;
  type: string;
  projectId: string;
  sessionId?: string;
  startDate: string;
  endDate: string;
}) => request("/evaluation-cycles", parseCycle, { method: "POST", body });
export const updateCycle = (
  id: string,
  body: { name: string; startDate: string; endDate: string },
) =>
  request(`/evaluation-cycles/${encodeURIComponent(id)}`, parseCycle, {
    method: "PATCH",
    body,
  });
export const transitionCycle = (id: string, status: string) =>
  request(`/evaluation-cycles/${encodeURIComponent(id)}/status`, parseCycle, {
    method: "POST",
    body: { status },
  });
export const getCriteria = (id: string, signal?: AbortSignal) =>
  request(
    `/evaluation-cycles/${encodeURIComponent(id)}/criteria`,
    (x) => array(record(x).items, parseCriterion),
    { signal },
  );
export const updateCriterion = (
  cycleId: string,
  id: string,
  body: { name: string; weight: number; maxScore: number },
) =>
  request(
    `/evaluation-cycles/${encodeURIComponent(cycleId)}/criteria/${encodeURIComponent(id)}`,
    parseCriterion,
    { method: "PATCH", body },
  );
export const createCriterion = (
  cycleId: string,
  body: { code: string; name: string; weight: number; maxScore: number },
) =>
  request(
    `/evaluation-cycles/${encodeURIComponent(cycleId)}/criteria`,
    parseCriterion,
    { method: "POST", body },
  );
export const deleteCriterion = (cycleId: string, id: string) =>
  request(
    `/evaluation-cycles/${encodeURIComponent(cycleId)}/criteria/${encodeURIComponent(id)}`,
    () => null,
    { method: "DELETE" },
  );
export const listManagedEvaluations = (
  page: number,
  cycleId: string,
  status: string,
  evaluatorId?: string,
  signal?: AbortSignal,
) =>
  request(
    `/evaluations?${new URLSearchParams({ page: String(page), pageSize: "10", ...(cycleId ? { cycleId } : {}), ...(status ? { status } : {}), ...(evaluatorId ? { evaluatorId } : {}) })}`,
    (x) => parseItemsPage(x, page, 10, parseManagedEvaluation),
    { signal },
  );
export const createEvaluation = (cycleId: string, internId: string) =>
  request("/evaluations", parseManagedEvaluation, {
    method: "POST",
    body: { cycleId, internId },
  });
export const getManagedEvaluation = (id: string, signal?: AbortSignal) =>
  request(
    `/evaluations/${encodeURIComponent(id)}`,
    (value) => {
      const v = record(value);
      return {
        ...parseManagedEvaluation(v.evaluation),
        scores: array(v.scores, (x) => {
          const s = record(x);
          return {
            criterionId: string(s.criterionId),
            score: number(s.score),
            comment: nullable(s.comment, string),
          };
        }),
      };
    },
    { signal },
  );
export const saveEvaluation = (
  id: string,
  body: {
    scores: { criterionId: string; score: number; comment: string }[];
    summary: string;
  },
) =>
  request(
    `/evaluations/${encodeURIComponent(id)}`,
    (x) => parseManagedEvaluation(record(x).evaluation),
    { method: "PATCH", body },
  );
export const advanceEvaluation = (id: string, action: "submit" | "finalize") =>
  request(
    `/evaluations/${encodeURIComponent(id)}/${action}`,
    (x) => parseManagedEvaluation(record(x).evaluation),
    { method: "POST" },
  );
export const suggestEvaluation = (id: string) =>
  request(
    `/evaluations/${encodeURIComponent(id)}/ai-suggestions`,
    parseAiSuggestion,
    { method: "POST" },
  );
/** AI suggestion history for one evaluation (advisory; newest first). */
export const listEvaluationSuggestions = (id: string, signal?: AbortSignal) =>
  request(
    `/evaluations/${encodeURIComponent(id)}/ai-suggestions`,
    (x) => {
      const v = record(x);
      return array(
        v.items,
        (raw) => record(raw),
      ).map((row) => ({
        id: string(row.id),
        status: string(row.status),
        generatedAt: string(row.generatedAt),
        suggestion: parseAiSuggestion(row),
      }));
    },
    { signal },
  );
/** One AI suggestion detail (advisory; ownership enforced backend-side). */
export const getEvaluationSuggestion = (
  evaluationId: string,
  suggestionId: string,
  signal?: AbortSignal,
) =>
  request(
    `/evaluations/${encodeURIComponent(evaluationId)}/ai-suggestions/${encodeURIComponent(suggestionId)}`,
    (x) => {
      const row = record(x);
      return {
        id: string(row.id),
        evaluationId: string(row.evaluationId),
        status: string(row.status),
        generatedAt: string(row.generatedAt),
        aiRunId: nullable(row.aiRunId, string),
        promptVersion: string(row.promptVersion),
        acceptedAt:
          row.acceptedAt === null || row.acceptedAt === undefined
            ? null
            : string(row.acceptedAt),
        suggestion: parseAiSuggestion(row),
      };
    },
    { signal },
  );
export function parseSprint(value: unknown) {
  const v = record(value);
  return {
    id: string(v.id),
    code: string(v.code),
    name: string(v.name),
    status: oneOf(v.status, ["planned", "active", "completed", "cancelled"]),
    projectId: string(v.projectId),
    sessionId: nullable(v.sessionId, string),
    startDate: string(v.startDate),
    endDate: string(v.endDate),
    description: nullable(v.description, string),
    goal: nullable(v.goal, string),
  };
}
export type Sprint = ReturnType<typeof parseSprint>;
export const listSprints = (
  page: number,
  projectId: string,
  status: string,
  signal?: AbortSignal,
) =>
  request(
    `/sprints?${new URLSearchParams({ page: String(page), pageSize: "10", ...(projectId ? { projectId } : {}), ...(status ? { status } : {}) })}`,
    (x) => parsePage(x, parseSprint),
    { signal },
  );
export const saveSprint = (
  id: string | undefined,
  body: {
    code?: string;
    name: string;
    description?: string;
    goal?: string;
    projectId?: string;
    sessionId?: string;
    startDate: string;
    endDate: string;
  },
) =>
  request(`/sprints${id ? `/${encodeURIComponent(id)}` : ""}`, parseSprint, {
    method: id ? "PATCH" : "POST",
    body,
  });
export const transitionSprint = (id: string, status: string) =>
  request(`/sprints/${encodeURIComponent(id)}/status`, parseSprint, {
    method: "POST",
    body: { status },
  });
export function managerTransitions(status: TaskStatus): TaskStatus[] {
  return status === "todo"
    ? ["doing"]
    : status === "doing"
      ? ["review"]
      : status === "review"
        ? ["done", "doing"]
        : [];
}
export type ManagedTaskInput = {
  title?: string;
  description?: string;
  projectId?: string;
  sprintId?: string;
  assigneeId?: string | null;
  priority?: string;
  storyPoints?: number;
  dueDate?: string;
  status?: TaskStatus;
  reason?: string;
  expectedVersion?: number;
};
export const saveManagedTask = (
  id: string | undefined,
  body: ManagedTaskInput,
) =>
  request(`/tasks${id ? `/${encodeURIComponent(id)}` : ""}`, parseTask, {
    method: id ? "PATCH" : "POST",
    body,
  });
export const deleteTask = (id: string) =>
  request(`/tasks/${encodeURIComponent(id)}`, () => null, { method: "DELETE" });
export function parsePerformanceMember(value: unknown) {
  const v = record(value);
  return {
    userId: string(v.userId),
    displayName: nullable(v.displayName, string),
    totalTaskCount: number(v.totalTaskCount),
    completedTaskCount: number(v.completedTaskCount),
    taskCompletionRate: nullable(v.taskCompletionRate, number),
    storyPointCompletionRate: nullable(v.storyPointCompletionRate, number),
    averageEvaluationScore: nullable(v.averageEvaluationScore, number),
    rank: v.rank === undefined ? null : number(v.rank),
  };
}
export const listPerformance = (query: URLSearchParams, signal?: AbortSignal) =>
  request(
    `/performance/interns?${query}`,
    (x) => { const v = record(x); return { items: array(v.items, parsePerformanceMember), total: number(v.total), page: number(v.page), pageSize: number(v.pageSize) }; },
    { signal },
  );
export const getMemberPerformance = (id: string, signal?: AbortSignal, scope = "") =>
  request(`/performance/interns/${encodeURIComponent(id)}${scope ? `?${scope}` : ""}`, parsePerformance, {
    signal,
  });
export const getMemberRecommendations = (id: string, signal?: AbortSignal) =>
  request(
    `/performance/interns/${encodeURIComponent(id)}/ai-recommendations`,
    parseRecommendations,
    { signal },
  );
/** CSV quoting alone does not stop formula execution. Neutralize formula prefixes, including whitespace. */
export function csvCell(value: string | number | null) {
  let s = value === null ? "" : String(value);
  if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
