import { request } from "./client";
import * as p from "./parse";
const statuses = [
  "pending",
  "leased",
  "retry",
  "waiting_user",
  "done",
  "failed",
  "review_required",
] as const;
function parseJob(value: unknown) {
  const v = p.record(value);
  return {
    id: p.string(v.id),
    sessionId: p.string(v.sessionId),
    status: p.oneOf(v.status, statuses),
    displayStatus: p.oneOf(v.displayStatus, statuses),
    errorCode: p.nullable(v.errorCode, p.string),
    attempts: p.number(v.attempts),
    updatedAt: p.string(v.updatedAt),
    nextAttemptAt: p.string(v.nextAttemptAt),
    revision: p.string(v.revision),
    displayName: p.string(v.displayName),
    sessionName: p.string(v.sessionName),
    projectName: p.string(v.projectName),
    role: p.oneOf(v.role, ["departing", "joining"]),
    outcome: p.nullable(v.outcome, p.string),
    repositoryUrl: p.nullable(v.repositoryUrl, (raw) => {
      const href = p.string(raw);
      return /^https:\/\/github\.com\/[^/?#]+\/[^/?#]+$/.test(href)
        ? href
        : p.invalid();
    }),
    retryAllowed: p.boolean(v.retryAllowed),
  };
}
function parseReport(value: unknown) {
  const v = p.record(value);
  return {
    items: p.array(v.items, parseJob),
    summary: p.array(v.summary, (raw) => {
      const s = p.record(raw);
      return { status: p.oneOf(s.status, statuses), total: p.number(s.total) };
    }),
    limit: p.number(v.limit),
  };
}
export type RepositoryAccessItem = ReturnType<typeof parseJob>;
export const ownRepositoryAccess = (signal?: AbortSignal) =>
  request("/github/me/repository-access", parseReport, { signal });
export const sessionRepositoryAccess = (id: string, signal?: AbortSignal) =>
  request(
    `/sessions/${encodeURIComponent(id)}/participation/repository-access-jobs`,
    parseReport,
    { signal },
  );
export const retryRepositoryAccess = (
  sessionId: string,
  id: string,
  body: { expectedRevision: string; reason: string },
) =>
  request(
    `/sessions/${encodeURIComponent(sessionId)}/participation/repository-access-jobs/${encodeURIComponent(id)}/retry`,
    p.record,
    { method: "POST", body },
  );
