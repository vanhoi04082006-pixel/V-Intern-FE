import { request } from "./client";
import { array, nullable, number, parsePage, record, string } from "./parse";
import { parseAcademic, parseMilestone } from "./academic";

export interface SessionOverviewRow {
  id: string;
  code: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  project: {
    id: string;
    code: string | null;
    name: string | null;
    templateVersion: number | null;
  } | null;
  memberCount: number;
  sprintCount: number;
  taskTotal: number;
  taskDone: number;
  taskPercent: number;
}

export function parseSessionOverview(value: unknown): SessionOverviewRow {
  const v = record(value);
  const p = v.project === null || v.project === undefined ? null : record(v.project);
  return {
    id: string(v.id),
    code: string(v.code),
    name: string(v.name),
    status: string(v.status),
    startDate: string(v.startDate),
    endDate: string(v.endDate),
    project: p
      ? {
          id: string(p.id),
          code: nullable(p.code, string),
          name: nullable(p.name, string),
          templateVersion: p.templateVersion === null || p.templateVersion === undefined ? null : number(p.templateVersion),
        }
      : null,
    memberCount: number(v.memberCount),
    sprintCount: number(v.sprintCount),
    taskTotal: number(v.taskTotal),
    taskDone: number(v.taskDone),
    taskPercent: number(v.taskPercent),
  };
}

export interface SessionListQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
  projectId?: string;
}

/** M6 management overview: one aggregated row per session, server paginated. */
export const listSessionOverview = (q: SessionListQuery, signal?: AbortSignal) => {
  const params = new URLSearchParams({
    page: String(q.page ?? 1),
    pageSize: String(q.pageSize ?? 10),
  });
  if (q.q) params.set("q", q.q);
  if (q.status) params.set("status", q.status);
  if (q.projectId) params.set("projectId", q.projectId);
  return request(`/sessions/overview?${params.toString()}`, (v) => parsePage(v, parseSessionOverview), {
    signal,
  });
};

export function parseSessionDetail(value: unknown) {
  const v = record(value);
  return {
    ...parseAcademic(v),
    overview: parseSessionOverview(v.overview),
    projectSnapshot: v.projectSnapshot == null ? null : record(v.projectSnapshot),
    members: array(v.members, (raw) => {
      const m = record(raw);
      return { userId: string(m.userId), displayName: string(m.displayName), email: string(m.email) };
    }),
    milestones: array(v.milestones, parseMilestone),
    sprintProgress: array(v.sprintProgress, (raw) => {
      const p = record(raw);
      return { id: string(p.id), status: string(p.status), taskTotal: number(p.taskTotal), taskDone: number(p.taskDone), taskReview: number(p.taskReview) };
    }),
  };
}
export const getSessionDetail = (id: string, signal?: AbortSignal) =>
  request(`/sessions/${encodeURIComponent(id)}`, parseSessionDetail, { signal });
