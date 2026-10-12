import { request } from "./client";
import { array, number, parsePage, record, string } from "./parse";

/**
 * Optional DTO fields may be ABSENT (undefined) or explicit null — unlike
 * nullable(), which only tolerates null. Stored template definitions omit
 * keys the creator never sent; parsers must not throw on them.
 */
function opt<T>(value: unknown, parse: (v: unknown) => T): T | null {
  return value === null || value === undefined ? null : parse(value);
}

export interface TemplateRoleDetail {
  code: string;
  title: string | null;
  countMin: number | null;
  countMax: number | null;
  requiredSkills: string[];
  recommendedSkills: string[];
  level: string | null;
}

export interface TemplateSummary {
  id: string;
  code: string;
  name: string;
  category: string | null;
  difficulty: string;
  status: string;
  version: number;
  techStack: string[];
  roles: string[];
  teamSize: number;
  sprintCount: number;
  createdAt: string;
}

export interface TemplateRunRef {
  id: string;
  projectId: string;
  sessionId: string;
  templateVersion: number;
  createdAt: string;
}

export interface TemplateDetail extends TemplateSummary {
  archivedAt: string | null;
  definition: Record<string, unknown>;
  runs: TemplateRunRef[];
}

export function parseRoleDetail(value: unknown) {
  const v = record(value);
  const strArr = (x: unknown): string[] => (Array.isArray(x) ? x.filter((i): i is string => typeof i === "string") : []);
  return {
    code: string(v.code),
    title: opt(v.title, string),
    countMin: opt(v.countMin, number),
    countMax: opt(v.countMax, number),
    requiredSkills: strArr(v.requiredSkills),
    recommendedSkills: strArr(v.recommendedSkills),
    level: opt(v.level, string),
  };
}

export function parseTemplateSummary(value: unknown): TemplateSummary {
  const v = record(value);
  return {
    id: string(v.id),
    code: string(v.code),
    name: string(v.name),
    category: opt(v.category, string),
    difficulty: string(v.difficulty),
    status: string(v.status),
    version: number(v.version),
    techStack: array(v.techStack, string),
    roles: array(v.roles, string),
    teamSize: number(v.teamSize),
    sprintCount: number(v.sprintCount),
    createdAt: string(v.createdAt),
  };
}

export function parseTemplateRun(value: unknown): TemplateRunRef {
  const v = record(value);
  return {
    id: string(v.id),
    projectId: string(v.projectId),
    sessionId: string(v.sessionId),
    templateVersion: number(v.templateVersion),
    createdAt: string(v.createdAt),
  };
}

export function parseTemplateDetail(value: unknown): TemplateDetail {
  const v = record(value);
  return {
    ...parseTemplateSummary(v),
    archivedAt: opt(v.archivedAt, string),
    definition: record(v.definition),
    runs: array(v.runs, parseTemplateRun),
  };
}

export interface TemplateQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  difficulty?: string;
  status?: string;
  sort?: string;
}

export const listTemplates = (q: TemplateQuery, signal?: AbortSignal) => {
  const params = new URLSearchParams();
  if (q.page) params.set("page", String(q.page));
  if (q.pageSize) params.set("pageSize", String(q.pageSize));
  if (q.search) params.set("search", q.search);
  if (q.category) params.set("category", q.category);
  if (q.difficulty) params.set("difficulty", q.difficulty);
  if (q.status) params.set("status", q.status);
  if (q.sort) params.set("sort", q.sort);
  return request(`/project-templates?${params.toString()}`, (v) => parsePage(v, parseTemplateSummary), { signal });
};

export const getTemplate = (id: string, signal?: AbortSignal) =>
  request(`/project-templates/${encodeURIComponent(id)}`, parseTemplateDetail, { signal });

export const startTemplateSession = (
  id: string,
  body: { name: string; startDate: string; endDate: string; requestId?: string },
) =>
  request(`/project-templates/${encodeURIComponent(id)}/start`, (v) => {
    const r = record(v);
    return {
      id: string(r.id),
      projectId: string(r.projectId),
      sessionId: string(r.sessionId),
      templateVersion: number(r.templateVersion),
      deduped: r.deduped === true,
    };
  }, { method: "POST", body });
