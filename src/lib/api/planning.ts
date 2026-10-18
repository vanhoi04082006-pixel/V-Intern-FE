import { request } from "./client";
import { array, number, record, string } from "./parse";

export interface PlanSummary {
  planId: string;
  projectId: string;
  sessionId: string;
  templateVersion: number | null;
  status: string;
  createdAt: string;
  sprintCount: number;
  taskCount: number;
  hasDraft: boolean;
}

export interface PlannedTask {
  key?: string;
  parentKey?: string | null;
  dependsOn?: string[];
  expectedOutput?: string | null;
  estimatedHours?: number | null;
  skillTags?: string[];
  complexity?: string;
  acceptanceCriteria?: string[];
  title: string;
  description: string | null;
  priority: string;
  storyPoints: number | null;
  dueDate: string | null;
  suggestedRole: string | null;
  assigneeId: string | null;
}

export interface PlannedSprint {
  code: string | null;
  name: string;
  goal: string | null;
  startDate: string;
  endDate: string;
  tasks: PlannedTask[];
}
export interface PlannedMilestone { key: string; title: string; dueDate: string; taskKeys: string[] }
export interface SprintPlan { sprints: PlannedSprint[]; milestones?: PlannedMilestone[] }

export interface PlanDetail {
  planId: string;
  projectId: string;
  sessionId: string;
  templateVersion: number | null;
  status: string;
  createdAt: string;
  /** Counts come from the LIST shape; the detail endpoint omits them. */
  sprintCount: number | null;
  taskCount: number | null;
  hasDraft: boolean;
  draft: SprintPlan | null;
  warnings: Array<{ taskTitle: string; message: string }>;
  error: unknown;
  deduped: boolean;
}

function optStr(v: unknown): string | null {
  return v === null || v === undefined ? null : string(v);
}
function optNum(v: unknown): number | null {
  return v === null || v === undefined ? null : number(v);
}

export function parsePlanSummary(value: unknown): PlanSummary {
  const v = record(value);
  return {
    planId: string(v.planId),
    projectId: string(v.projectId),
    sessionId: string(v.sessionId),
    templateVersion: optNum(v.templateVersion),
    status: string(v.status),
    createdAt: string(v.createdAt),
    sprintCount: number(v.sprintCount),
    taskCount: number(v.taskCount),
    hasDraft: v.hasDraft === true,
  };
}

export function parsePlannedTask(value: unknown): PlannedTask {
  const v = record(value);
  return {
    key: optStr(v.key) ?? undefined, parentKey: optStr(v.parentKey),
    dependsOn: v.dependsOn === undefined ? [] : array(v.dependsOn, string),
    expectedOutput: optStr(v.expectedOutput), estimatedHours: optNum(v.estimatedHours),
    skillTags: v.skillTags === undefined ? [] : array(v.skillTags, string), complexity: optStr(v.complexity) ?? 'beginner',
    title: string(v.title),
    description: optStr(v.description),
    priority: typeof v.priority === "string" ? v.priority : "medium",
    storyPoints: optNum(v.storyPoints),
    dueDate: optStr(v.dueDate),
    suggestedRole: optStr(v.suggestedRole),
    assigneeId: optStr(v.assigneeId),
    acceptanceCriteria: v.acceptanceCriteria === undefined ? [] : array(v.acceptanceCriteria, string),
  };
}

export function parsePlannedSprint(value: unknown): PlannedSprint {
  const v = record(value);
  return {
    code: optStr(v.code),
    name: string(v.name),
    goal: optStr(v.goal),
    startDate: string(v.startDate),
    endDate: string(v.endDate),
    tasks: array(v.tasks, parsePlannedTask),
  };
}

export function parsePlanDetail(value: unknown): PlanDetail {
  const v = record(value);
  const d = v.draft === null || v.draft === undefined ? null : record(v.draft);
  return {
    planId: string(v.planId),
    projectId: string(v.projectId),
    sessionId: string(v.sessionId),
    templateVersion: optNum(v.templateVersion),
    status: string(v.status),
    createdAt: string(v.createdAt),
    sprintCount: optNum(v.sprintCount),
    taskCount: optNum(v.taskCount),
    hasDraft: v.hasDraft === true,
    draft: d ? { sprints: array(d.sprints, parsePlannedSprint), milestones: d.milestones === undefined ? [] : array(d.milestones, item => {
      const m = record(item); return { key: string(m.key), title: string(m.title), dueDate: string(m.dueDate), taskKeys: array(m.taskKeys, string) };
    }) } : null,
    warnings: Array.isArray(v.warnings)
      ? v.warnings.map((w) => {
          const r = record(w);
          return { taskTitle: string(r.taskTitle), message: string(r.message) };
        })
      : [],
    error: v.error ?? null,
    deduped: v.deduped === true,
  };
}

export const listPlans = (sessionId: string, signal?: AbortSignal) =>
  request(`/ai-generations/plans?${new URLSearchParams({ sessionId })}`, (v) => array(v, parsePlanSummary), {
    signal,
  });

export const getPlan = (planId: string, signal?: AbortSignal) =>
  request(`/ai-generations/plans/${encodeURIComponent(planId)}`, parsePlanDetail, { signal });

export const generatePlan = (body: {
  projectId: string;
  sessionId: string;
  sprintCount?: number;
  startDate?: string;
  requestId?: string;
  regenerate?: boolean;
}) =>
  request("/ai-generations/plans/generate", (v) => {
    const r = record(v);
    return {
      planId: string(r.planId),
      status: string(r.status),
      deduped: r.deduped === true,
    };
  }, { method: "POST", body });

export const confirmPlan = (body: {
  projectId: string;
  sessionId: string;
  draft: unknown;
  requestId: string;
  planId?: string;
}) =>
  request("/ai-generations/sprint-plan/confirm", (v) => {
    const r = record(v);
    return {
      sprintIds: array(r.sprintIds, string),
      taskIds: array(r.taskIds, string),
      sprintCount: number(r.sprintCount),
      taskCount: number(r.taskCount),
      deduped: r.deduped === true,
    };
  }, { method: "POST", body });

export function sprintCountForDuration(startDate: string, endDate: string): number {
  const days = Math.max(1, Math.round((Date.parse(endDate) - Date.parse(startDate)) / 86400000));
  return Math.min(8, Math.max(1, Math.ceil(days / 14)));
}
