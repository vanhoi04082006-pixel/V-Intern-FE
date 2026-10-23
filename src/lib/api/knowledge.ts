import { request } from './client';
import * as p from './parse';

export const knowledgeKinds = ['qa', 'guide', 'exercise', 'solution', 'rubric', 'plan_template', 'communication'] as const;
export const knowledgeAudiences = ['student_safe', 'staff_only', 'grading_only'] as const;
export const knowledgePurposes = ['interview', 'interview_evaluation', 'planning', 'code_review', 'mentoring', 'evaluation_assistance', 'recommendation', 'cv_screening', 'communication'] as const;
export const knowledgeStatuses = ['draft', 'published', 'archived'] as const;
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type KnowledgeKind = typeof knowledgeKinds[number];
export type KnowledgeAudience = typeof knowledgeAudiences[number];
export type KnowledgePurpose = typeof knowledgePurposes[number];
export type KnowledgeStatus = typeof knowledgeStatuses[number];
export interface KnowledgeSource { title: string; url?: string; reference?: string }
export interface KnowledgeDraft {
  kind: KnowledgeKind; title: string; summary: string; language: 'vi' | 'en'; difficulty: 'easy' | 'medium' | 'hard' | null;
  audience: KnowledgeAudience; purposes: KnowledgePurpose[]; roleCodes: string[]; tags: string[]; sources: KnowledgeSource[];
  body: { [key: string]: JsonValue };
}
function integer(value: unknown, minimum = 1) { const number = p.number(value); return Number.isInteger(number) && number >= minimum ? number : p.invalid(); }
function hash(value: unknown) { const result = p.string(value); return /^[a-f0-9]{64}$/.test(result) ? result : p.invalid(); }
function json(value: unknown, depth = 0, budget = { nodes: 0 }): JsonValue {
  if (depth > 16 || ++budget.nodes > 6000) return p.invalid();
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return p.number(value);
  if (Array.isArray(value)) return value.map(item => json(item, depth + 1, budget));
  const object = p.record(value);
  return Object.fromEntries(Object.entries(object).map(([key, item]) => {
    if (['__proto__', 'constructor', 'prototype'].includes(key)) p.invalid();
    return [key, json(item, depth + 1, budget)];
  }));
}
function source(raw: unknown): KnowledgeSource {
  const v = p.record(raw), result: KnowledgeSource = { title: p.string(v.title) };
  if (v.url !== undefined) {
    result.url = p.string(v.url);
    try { const url = new URL(result.url); if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) return p.invalid(); } catch { return p.invalid(); }
  }
  if (v.reference !== undefined) result.reference = p.string(v.reference);
  return result;
}
function fields(v: Record<string, unknown>) {
  return {
    kind: p.oneOf(v.kind, knowledgeKinds), title: p.string(v.title), summary: p.string(v.summary), language: p.oneOf(v.language, ['vi', 'en']),
    difficulty: p.nullable(v.difficulty, raw => p.oneOf(raw, ['easy', 'medium', 'hard'])), audience: p.oneOf(v.audience, knowledgeAudiences),
    purposes: p.array(v.purposes, raw => p.oneOf(raw, knowledgePurposes)), roleCodes: p.array(v.roleCodes, p.string), tags: p.array(v.tags, p.string),
  };
}
export function parseKnowledgeSnapshot(raw: unknown) {
  const v = p.record(raw);
  if (v.schemaVersion !== 1) p.invalid();
  const body = p.record(json(p.record(v.body)));
  return { ...fields(v), sources: p.array(v.sources, source), body: body as KnowledgeDraft['body'], schemaVersion: 1 as const, code: p.string(v.code), version: integer(v.version), status: p.oneOf(v.status, knowledgeStatuses) };
}
export type KnowledgeSnapshot = ReturnType<typeof parseKnowledgeSnapshot>;
/** Authoring never sends server identity, version or lifecycle fields inside draft content. */
export function toKnowledgeDraft(snapshot: KnowledgeSnapshot): KnowledgeDraft {
  return structuredClone({ kind: snapshot.kind, title: snapshot.title, summary: snapshot.summary, language: snapshot.language, difficulty: snapshot.difficulty,
    audience: snapshot.audience, purposes: snapshot.purposes, roleCodes: snapshot.roleCodes, tags: snapshot.tags, sources: snapshot.sources, body: snapshot.body });
}
export function parseKnowledgeDocument(raw: unknown) {
  const v = p.record(raw), snapshot = parseKnowledgeSnapshot(v.snapshot), code = p.string(v.code), version = integer(v.version), status = p.oneOf(v.status, knowledgeStatuses);
  if (snapshot.code !== code || snapshot.version !== version || snapshot.status !== status) p.invalid();
  return { id: p.string(v.id), code, version, status, snapshot, sha256: hash(v.sha256) };
}
export type KnowledgeDocument = ReturnType<typeof parseKnowledgeDocument>;
export function parseKnowledgeMetadata(raw: unknown) {
  const v = p.record(raw);
  return { ...fields(v), id: p.string(v.id), code: p.string(v.code), version: integer(v.version), status: p.oneOf(v.status, knowledgeStatuses), updatedAt: p.string(v.updatedAt), sha256: hash(v.sha256) };
}
export type KnowledgeMetadata = ReturnType<typeof parseKnowledgeMetadata>;
function page<T>(raw: unknown, item: (value: unknown) => T) { const v = p.record(raw); return { items: p.array(v.items, item), total: integer(v.total, 0), page: integer(v.page), pageSize: integer(v.pageSize) }; }
const base = '/admin/knowledge', path = (code: string) => `${base}/${encodeURIComponent(code)}`;
export const listKnowledge = (query: URLSearchParams, signal?: AbortSignal) => request(`${base}?${query}`, raw => page(raw, parseKnowledgeMetadata), { signal });
export const getKnowledge = (code: string, signal?: AbortSignal) => request(path(code), parseKnowledgeDocument, { signal });
export const createKnowledge = (code: string, draft: KnowledgeDraft) => request(base, parseKnowledgeDocument, { method: 'POST', body: { code, draft } });
export const updateKnowledge = (code: string, version: number, draft: KnowledgeDraft) => request(path(code), parseKnowledgeDocument, { method: 'PUT', body: { version, draft } });
export const publishKnowledge = (code: string, version: number) => request(`${path(code)}/publish`, parseKnowledgeDocument, { method: 'POST', body: { version } });
export const archiveKnowledge = (code: string, version: number) => request(`${path(code)}/archive`, parseKnowledgeDocument, { method: 'POST', body: { version } });
export const restoreKnowledge = (code: string, version: number, sourceVersion: number) => request(`${path(code)}/restore`, parseKnowledgeDocument, { method: 'POST', body: { version, sourceVersion } });
export const listKnowledgeHistory = (code: string, currentPage: number, signal?: AbortSignal) => request(`${path(code)}/revisions?page=${currentPage}`, raw => page(raw, raw => {
  const v = p.record(raw), snapshot = parseKnowledgeSnapshot(v.snapshot), version = integer(v.version);
  if (version !== snapshot.version || snapshot.code !== code) p.invalid();
  return { version, snapshot, sha256: hash(v.sha256), createdBy: p.string(v.createdBy), createdAt: p.string(v.createdAt) };
}), { signal });
export const knowledgeDryRun = (entries: unknown[], signal?: AbortSignal) => request(`${base}/import/dry-run`, raw => {
  const v = p.record(raw);
  if (v.mutationsPerformed !== 0) p.invalid();
  return { total: integer(v.total, 0), validDrafts: integer(v.validDrafts, 0), publishable: integer(v.publishable, 0), mutationsPerformed: 0 as const,
    items: p.array(v.items, raw => { const row = p.record(raw); return { index: integer(row.index, 0), code: p.nullable(row.code, p.string), validDraft: p.boolean(row.validDraft), publishable: p.boolean(row.publishable), exists: p.boolean(row.exists), currentVersion: p.nullable(row.currentVersion, raw => integer(raw)), issues: p.array(row.issues, p.string), publicationIssues: p.array(row.publicationIssues, p.string) }; }) };
}, { method: 'POST', body: { entries }, signal });
