import { request } from './client';
import { array, boolean, number, oneOf, record, string } from './parse';
export const questionPhases = ['technical', 'introduction', 'english', 'communication'] as const;
export function parseQuestion(value: unknown) {
  const v = record(value);
  return { id: string(v.id), roleCode: string(v.roleCode), phase: oneOf(v.phase, questionPhases), difficulty: oneOf(v.difficulty, ['easy', 'medium', 'hard']), language: oneOf(v.language, ['vi', 'en']), prompt: string(v.prompt), expectedConcepts: array(v.expectedConcepts, string), exampleAnswer: string(v.exampleAnswer), scoringRubric: string(v.scoringRubric), followUpHints: array(v.followUpHints, string), tags: array(v.tags, string), isActive: boolean(v.isActive), sortOrder: number(v.sortOrder), version: number(v.version), updatedAt: string(v.updatedAt) };
}
export type BankQuestion = ReturnType<typeof parseQuestion>;
export type QuestionContent = Omit<BankQuestion, 'id' | 'version' | 'updatedAt' | 'sortOrder'>;
export const listQuestionBank = (query: URLSearchParams, signal?: AbortSignal) => request(`/admin/question-bank?${query}`, raw => { const v = record(raw); return { items: array(v.items, parseQuestion), total: number(v.total), page: number(v.page), pageSize: number(v.pageSize), coverage: array(v.coverage, raw => { const c = record(raw); return { roleCode: string(c.roleCode), phase: string(c.phase), count: number(c.count) }; }) }; }, { signal });
export const saveQuestion = (body: QuestionContent, current?: { id: string; version: number }) => request(`/admin/question-bank${current ? '/' + encodeURIComponent(current.id) : ''}`, parseQuestion, { method: current ? 'PUT' : 'POST', body: { ...body, ...(current ? { version: current.version } : {}) } });
export const retireQuestion = (question: { id: string; version: number }) => request(`/admin/question-bank/${encodeURIComponent(question.id)}?version=${question.version}`, parseQuestion, { method: 'DELETE' });
