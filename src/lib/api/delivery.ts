import { request } from "./client";
import { nullable, number, parsePage, record, string } from "./parse";
import { taskStatuses, priorities, parseTask } from "./work";

export interface SprintSummary {
  id: string;
  code: string;
  name: string;
  goal: string | null;
  status: string;
  projectId: string;
  sessionId: string | null;
  startDate: string | null;
  endDate: string | null;
  progress: number | null;
}

export function parseSprint(value: unknown): SprintSummary {
  const v = record(value);
  return {
    id: string(v.id),
    code: string(v.code),
    name: string(v.name),
    goal: nullable(v.goal, string),
    status: string(v.status),
    projectId: string(v.projectId),
    sessionId: nullable(v.sessionId, string),
    startDate: nullable(v.startDate, string),
    endDate: nullable(v.endDate, string),
    progress: v.progress === null || v.progress === undefined ? null : number(v.progress),
  };
}

export interface SprintQuery {
  page?: number;
  pageSize?: number;
  projectId?: string;
  sessionId?: string;
  status?: string;
  assigneeId?: string;
  dueFrom?: string;
  dueTo?: string;
  search?: string;
}

/** Server-side sprint list (managed scope enforced by the backend). */
export const listSprints = (q: SprintQuery, signal?: AbortSignal) => {
  const params = new URLSearchParams({
    page: String(q.page ?? 1),
    pageSize: String(q.pageSize ?? 20),
  });
  Object.entries(q).forEach(([key, value]) => { if (typeof value === "string" && value) params.set(key, value); });
  return request(`/sprints?${params.toString()}`, (v) => parsePage(v, parseSprint), { signal });
};

export interface TaskQuery {
  page?: number;
  pageSize?: number;
  projectId?: string;
  sprintId?: string;
  sessionId?: string;
  assigneeId?: string;
  status?: string;
  priority?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  dueFrom?: string;
  dueTo?: string;
}

export const listTasks = (q: TaskQuery, signal?: AbortSignal) => {
  const params = new URLSearchParams({
    page: String(q.page ?? 1),
    pageSize: String(q.pageSize ?? 20),
  });
  Object.entries(q).forEach(([k, v]) => {
    if (k === "page" || k === "pageSize") return;
    if (typeof v === "string" && v) params.set(k, v);
  });
  return request(`/tasks?${params.toString()}`, (v) => parsePage(v, parseTask), { signal });
};

/** Progress rollup for a set of tasks (no recomputation needed client-side). */
export function taskProgress(tasks: Array<{ status: string }>): { done: number; total: number; percent: number } {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}

export { taskStatuses, priorities };

export const listMemberOptions = (q: { page: number; q?: string; sessionId?: string; projectId?: string }, signal?: AbortSignal) => {
  const params = new URLSearchParams({ page: String(q.page), pageSize: "10" });
  Object.entries(q).forEach(([k, v]) => { if (typeof v === "string" && v) params.set(k, v); });
  return request(`/sessions/member-options?${params}`, v => parsePage(v, value => {
    const row = record(value);
    return { userId: string(row.userId), displayName: string(row.displayName), email: string(row.email) };
  }), { signal });
};
