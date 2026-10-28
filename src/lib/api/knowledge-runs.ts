import { request } from "./client";
import { array, boolean, nullable, number, oneOf, record, string } from "./parse";
import { agentStatuses } from "./business-agents";

/** Same runtime state machine as business runs; expiry lands as failed + AGENT_RUN_EXPIRED. */
export const knowledgeRunStatuses = agentStatuses;

export function parseKnowledgeRun(raw: unknown) {
  const r = record(raw);
  return {
    id: string(r.id),
    requestId: string(r.requestId),
    agentId: string(r.agentId),
    agentVersion: string(r.agentVersion),
    status: oneOf(r.status, knowledgeRunStatuses),
    steps: number(r.steps),
    attempts: number(r.attempts),
    inputTokens: nullable(r.inputTokens, number),
    outputTokens: nullable(r.outputTokens, number),
    errorCode: nullable(r.errorCode, string),
    retryable: boolean(r.retryable),
    output: nullable(r.output, (value) => {
      const o = record(value);
      return {
        answer: string(o.answer),
        insufficientEvidence: boolean(o.insufficientEvidence),
        citations: array(o.citations, record),
      };
    }),
    createdAt: string(r.createdAt),
    updatedAt: string(r.updatedAt),
    deadlineAt: string(r.deadlineAt),
  };
}
export type KnowledgeRun = ReturnType<typeof parseKnowledgeRun>;

export type ResumeOutcome = { id: string; accepted: boolean };

export const createKnowledgeRun = (
  question: string,
  roleCode: string | undefined,
  signal?: AbortSignal,
) =>
  request("/admin/agents/knowledge-runs", parseKnowledgeRun, {
    method: "POST",
    body: {
      requestId: crypto.randomUUID(),
      question,
      ...(roleCode ? { roleCode } : {}),
    },
    signal,
  });

export const getKnowledgeRun = (id: string, signal?: AbortSignal) =>
  request(
    `/admin/agents/knowledge-runs/${encodeURIComponent(id)}`,
    parseKnowledgeRun,
    { signal },
  );

export const cancelKnowledgeRun = (id: string) =>
  request(
    `/admin/agents/knowledge-runs/${encodeURIComponent(id)}/cancel`,
    parseKnowledgeRun,
    { method: "POST" },
  );

export const resumeKnowledgeRun = (id: string) =>
  request(
    `/admin/agents/knowledge-runs/${encodeURIComponent(id)}/resume`,
    (raw) => {
      const r = record(raw);
      return { id: string(r.id), accepted: boolean(r.accepted) };
    },
    { method: "POST" },
  );
