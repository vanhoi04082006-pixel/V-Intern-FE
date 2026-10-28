import { request } from './client';
import { array, boolean, invalid, nullable, number, record, string } from './parse';

export interface SealedContractIssue { code: string; detail: string }
export function parseSystemContracts(raw: unknown) {
  const v = record(raw);
  const parseOperator = (raw: unknown) => { const o = record(raw); const images = record(o.images); return { version: nullable(o.version, string), reviewer: nullable(o.reviewer, string), sealedAt: nullable(o.sealedAt, string), images: { runtime: nullable(images.runtime, string), tester: nullable(images.tester, string) }, complete: boolean(o.complete) }; };
  return {
    checkedAt: string(v.checkedAt),
    source: string(v.source),
    valid: boolean(v.valid),
    error: nullable(v.error, string),
    contracts: array(v.contracts, raw => { const c = record(raw), op = record(c.operator); return { key: string(c.key), suiteId: nullable(c.suiteId, string), digest: nullable(c.digest, string), status: string(c.status), issues: array(c.issues, raw => { const i = record(raw); return { code: string(i.code), detail: string(i.detail) }; }), operator: parseOperator(op) }; }),
  };
}
export const getSystemContracts = (signal?: AbortSignal) => request('/admin/system/contracts', parseSystemContracts, { signal });
export const validateSystemContractsDraft = (data: string) => request('/admin/system/contracts/validate', raw => {
  const draft = record(raw);
  if (draft.stored !== false) invalid();
  // Draft validation is read-only and has no configured source; GET /contracts does.
  return parseSystemContracts({ ...draft, source: 'Bản nháp kiểm tra — chưa lưu, chưa kích hoạt' });
}, { method: 'POST', body: { data } });
export function parseAiConfiguration(raw: unknown) { const v = record(raw), policy = record(v.policy); return { policy: { model: string(policy.model), timeoutMs: number(policy.timeoutMs), maxRetries: number(policy.maxRetries), version: number(policy.version) }, source: string(v.source), provider: nullable(v.provider, string), credentialsConfigured: boolean(v.credentialsConfigured), appliesTo: array(v.appliesTo, string) }; }
export const getAiConfiguration = (signal?: AbortSignal) => request('/admin/ai-configuration', parseAiConfiguration, { signal });
export const saveAiConfiguration = (policy: ReturnType<typeof parseAiConfiguration>['policy']) => request('/admin/ai-configuration', parseAiConfiguration, { method: 'PUT', body: policy });
export const getSystemStatus = (signal?: AbortSignal) => request('/admin/system/status', raw => {
  const v = record(raw), counts = record(v.counts), db = record(v.database), i = record(v.integrations), github = record(i.github), webhook = record(i.webhook), runner = record(i.runner), alerts = record(v.learningAlerts);
  return { checkedAt: string(v.checkedAt), latency: number(db.latencyMs), counts: { users: number(counts.users), activeSessions: number(counts.activeSessions), activeQuestions: number(counts.activeQuestions), activeTemplates: number(counts.activeTemplates), migrations: number(counts.migrations), runningReviews: number(counts.runningReviews) },
    github: { configured: boolean(github.configured), missing: array(github.missing, string) }, webhook: boolean(webhook.configured), runner: { configured: boolean(runner.configured), missing: array(runner.missing, string), sealedSuites: number(runner.sealedSuites), valid: boolean(runner.suiteConfigValid) },
    alerts: { enabled: boolean(alerts.enabled), intervalSeconds: number(alerts.intervalSeconds), running: boolean(alerts.running), lastScanAt: nullable(alerts.lastScanAt, string), error: nullable(alerts.lastErrorCode, string), lastResult: nullable(alerts.lastResult, raw => { const r = record(raw); return { created: number(r.created), muted: number(r.muted), processed: number(r.processed) }; }) },
    ai: array(v.aiLast24Hours, raw => { const r = record(raw); return { feature: string(r.feature), status: string(r.status), count: number(r.count), latency: nullable(r.averageLatencyMs, number) }; }) };
}, { signal });
export const listSystemRepositories = (query: URLSearchParams, signal?: AbortSignal) => request(`/admin/system/repositories?${query}`, raw => { const v = record(raw); return { total: number(v.total), pageSize: number(v.pageSize), items: array(v.items, raw => { const r = record(raw); return { sessionId: string(r.sessionId), sessionName: string(r.sessionName), sessionCode: string(r.sessionCode), instructorName: nullable(r.instructorName, string), ownerLogin: nullable(r.ownerLogin, string), repoName: nullable(r.repoName, string), status: string(r.status), webhookStatus: string(r.webhookStatus), error: nullable(r.webhookErrorCode, string), lastEventAt: nullable(r.lastEventAt, string) }; }) }; }, { signal });
