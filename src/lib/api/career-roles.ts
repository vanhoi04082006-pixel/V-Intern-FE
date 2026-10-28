import { request } from './client';
import * as p from './parse';

export const careerStatuses = ['draft', 'published', 'archived'] as const;
export function parseCareerRole(raw: unknown) {
  const v = p.record(raw), weights = p.record(v.competencyWeights);
  return {
    code: p.string(v.code), name: p.string(v.name), description: p.string(v.description),
    level: p.oneOf(v.level, ['intern', 'junior']), language: p.oneOf(v.language, ['vi', 'en']),
    requiredSkills: p.array(v.requiredSkills, p.string), optionalSkills: p.array(v.optionalSkills, p.string),
    competencyWeights: Object.fromEntries(Object.entries(weights).map(([key, value]) => [key, p.number(value)])),
    status: p.oneOf(v.status, careerStatuses), acceptingApplications: p.boolean(v.acceptingApplications), version: p.number(v.version),
    createdAt: p.string(v.createdAt), updatedAt: p.string(v.updatedAt),
  };
}
export type CareerRole = ReturnType<typeof parseCareerRole>;
export type CareerContent = Pick<CareerRole, 'name' | 'description' | 'level' | 'language' | 'requiredSkills' | 'optionalSkills' | 'competencyWeights'>;
export type CareerUpdate = CareerContent & Pick<CareerRole, 'version' | 'status' | 'acceptingApplications'>;
function parsePage<T>(raw: unknown, item: (v: unknown) => T) {
  const v = p.record(raw);
  return { items: p.array(v.items, item), total: p.number(v.total), page: p.number(v.page), pageSize: p.number(v.pageSize) };
}
const base = '/admin/career-roles';
export const listCareerRoles = (q: URLSearchParams, signal?: AbortSignal) => request(`${base}?${q}`, raw => parsePage(raw, parseCareerRole), { signal });
export const createCareerRole = (body: CareerContent & { code: string }) => request(base, parseCareerRole, { method: 'POST', body });
export const updateCareerRole = (code: string, body: CareerUpdate) => request(`${base}/${encodeURIComponent(code)}`, parseCareerRole, { method: 'PUT', body });
export const archiveCareerRole = (code: string, version: number) => request(`${base}/${encodeURIComponent(code)}/archive`, parseCareerRole, { method: 'POST', body: { version } });
export const listCareerRoleRevisions = (code: string, page = 1, signal?: AbortSignal) => request(`${base}/${encodeURIComponent(code)}/revisions?page=${page}`, raw => parsePage(raw, raw => {
  const v = p.record(raw), snapshot = p.record(v.snapshot);
  return { version: p.number(v.version), snapshot: parseCareerRole({ ...snapshot, createdAt: v.createdAt, updatedAt: v.createdAt }), createdBy: p.nullable(v.createdBy, p.string), createdAt: p.string(v.createdAt) };
}), { signal });

export const listRecruitingCareers = (signal?: AbortSignal) => request('/career-roles', raw => {
  const v = p.record(raw);
  return p.array(v.items, raw => { const r = p.record(raw); return { code: p.string(r.code), label: p.string(r.label), description: p.string(r.description), level: p.string(r.level), language: p.string(r.language), requiredSkills: p.array(r.requiredSkills, p.string), optionalSkills: p.array(r.optionalSkills, p.string), version: p.number(r.version) }; });
}, { signal });
export const listCareerReferences = (signal?: AbortSignal) => request('/career-roles/reference', raw => p.array(p.record(raw).items, raw => { const role = p.record(raw); return { code: p.string(role.code), label: p.string(role.label) }; }), { signal });

/** Authoring includes drafts/archived careers; never silently truncate the catalog to one page. */
export async function allCareerRoles(signal?: AbortSignal): Promise<CareerRole[]> {
  const rows: CareerRole[] = [];
  for (let page = 1; ; page++) {
    const result = await listCareerRoles(new URLSearchParams({ page: String(page), pageSize: '100' }), signal);
    rows.push(...result.items);
    if (page * result.pageSize >= result.total) return rows;
    if (!result.items.length) p.invalid();
  }
}
