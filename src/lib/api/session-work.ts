import { request } from './client';
import { boolean, nullable, number, oneOf, parsePage, record, string } from './parse';
import { parseTask } from './work';
import type { TaskQuery } from './delivery';

export function githubSourceLink(value: string): string | null {
  try {
    const url = new URL(value);
    return url.origin === 'https://github.com' && !url.username && !url.password && /^\/[^/]+\/[^/]+\//.test(url.pathname) ? url.href : null;
  } catch { return null; }
}

export function parseSessionWorkTask(value: unknown) {
  const v = record(value), delivery = v.delivery == null ? null : record(v.delivery);
  const sub = delivery?.submission == null ? null : record(delivery.submission);
  return { ...parseTask(v), delivery: delivery ? {
    blocked: boolean(delivery.blocked), submission: sub ? {
      id: string(sub.id), status: oneOf(sub.status, ['submitted', 'approved', 'rework', 'withdrawn']),
      prUrl: string(sub.prUrl), headSha: nullable(sub.headSha, string), submittedAt: string(sub.submittedAt),
      aiStatus: nullable(sub.aiStatus, v => oneOf(v, ['running', 'awaiting_instructor', 'needs_changes', 'inconclusive', 'failed'])),
      aiScore: nullable(sub.aiScore, number), aiSummary: nullable(sub.aiSummary, string),
      instructorScore: nullable(sub.instructorScore, number), instructorFeedback: nullable(sub.instructorFeedback, string),
    } : null,
  } : null };
}
export function listSessionWork(q: TaskQuery, signal?: AbortSignal) {
  const params = new URLSearchParams({ page: String(q.page ?? 1), pageSize: String(q.pageSize ?? 20) });
  Object.entries(q).forEach(([key, value]) => { if (key !== 'sessionId' && typeof value === 'string' && value) params.set(key, value); });
  return request(`/sessions/${encodeURIComponent(q.sessionId ?? '')}/work?${params}`, v => parsePage(v, parseSessionWorkTask), { signal });
}
export function parseSessionEvent(value: unknown) {
  const v = record(value);
  return { id: string(v.id), action: string(v.action), summary: nullable(v.summary, string), createdAt: string(v.createdAt), actorName: nullable(v.actorName, string) };
}
export const listSessionTimeline = (sessionId: string, page: number, signal?: AbortSignal) =>
  request(`/sessions/${encodeURIComponent(sessionId)}/timeline?page=${page}&pageSize=10`, v => parsePage(v, parseSessionEvent), { signal });
