import { request } from "./client";
import { array, nullable, number, parsePage, record, string } from "./parse";
import { parseLearningPackage, type TemplateAssessment } from './template-materials';

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
  responsibilities: string[];
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
    responsibilities: strArr(v.responsibilities),
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
  parseLearningPackage(record(v.definition).learningPackage);
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
export const saveTemplateDefinition = (definition: Record<string, unknown>, current?: { id: string; version: number }, assessment?: TemplateAssessment | null) => request(`/project-templates${current ? '/' + encodeURIComponent(current.id) : ''}`, raw => { const v = record(raw); return { id: string(v.id), version: number(v.version) }; }, { method: current ? 'PATCH' : 'POST', body: { ...(current ? { definition, expectedVersion: current.version } : definition), ...(assessment === undefined ? {} : { assessment }) } });
export const setTemplateStatus = (template: { id: string; version: number }, status: 'active' | 'archived') => request(`/project-templates/${encodeURIComponent(template.id)}`, parseTemplateSummary, { method: 'PATCH', body: { status, expectedVersion: template.version } });

export const getTemplateContext = (projectId: string, signal?: AbortSignal) =>
  request(`/projects/${encodeURIComponent(projectId)}/template-context`, (v) => {
    const r = record(v);
    return { definition: record(r.definition), templateVersion: number(r.templateVersion) };
  }, { signal });

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
export function parseChange(v: unknown) { const r = record(v); return { id:string(r.id),title:string(r.title),description:string(r.description),reason:string(r.reason),status:string(r.status),taskId:nullable(r.taskId,string),createdAt:string(r.createdAt) }; }
export const listChanges = (id: string,signal?: AbortSignal) => request(`/projects/${id}/changes`,v => array(v,parseChange),{ signal });
export const proposeChange = (id: string,body: { title:string;description:string;reason:string }) => request(`/projects/${id}/changes`,record,{ method:'POST',body });
export const applyChange = (id: string) => request(`/project-changes/${id}/apply`,record,{ method:'POST' });
export const getTaskSpec = (id: string, signal?: AbortSignal) => request(`/tasks/${encodeURIComponent(id)}/spec`, (v) => nullable(v, (raw) => {
  const s = record(raw);
  return { requirements: string(s.requirements), role: string(s.role), dod: array(s.dod, string), documentation: string(s.documentation), rubricVersion: string(s.rubricVersion),
    expectedOutput: s.expectedOutput == null ? null : string(s.expectedOutput),
    estimatedHours: s.estimatedHours == null ? null : number(s.estimatedHours),
    skillTags: s.skillTags === undefined ? [] : array(s.skillTags, string),
    complexity: s.complexity === undefined ? null : string(s.complexity),
    blocked: s.blocked === true,
    dependencies: s.dependencies === undefined ? [] : array(s.dependencies, item => { const d = record(item); return { taskId: string(d.taskId), code: string(d.code), title: string(d.title), status: string(d.status) }; }),
  };
}), { signal });
