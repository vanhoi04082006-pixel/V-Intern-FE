import { request } from "./client";
import { array, nullable, number, oneOf, record, string } from "./parse";
export const agentStatuses = [
  "queued",
  "running",
  "paused",
  "succeeded",
  "failed",
  "cancelled",
] as const;
export function parseBusinessRuns(raw: unknown) {
  const row = record(raw);
  return {
    definitions: array(row.definitions, (item) => {
      const r = record(item),
        budget = record(r.budget);
      return {
        id: string(r.id),
        version: string(r.version),
        promptVersion: string(r.promptVersion),
        features: array(r.features, string),
        maxToolCalls: number(budget.maxToolCalls),
      };
    }),
    items: array(row.items, (item) => {
      const r = record(item);
      return {
        id: string(r.id),
        agentId: string(r.agentId),
        agentVersion: string(r.agentVersion),
        promptVersion: string(r.promptVersion),
        status: oneOf(r.status, agentStatuses),
        model: nullable(r.model, string),
        stepCount: number(r.stepCount),
        attempts: number(r.attempts),
        toolCalls: number(r.toolCalls),
        inputTokens: nullable(r.inputTokens, number),
        outputTokens: nullable(r.outputTokens, number),
        errorCode: nullable(r.errorCode, string),
        createdAt: string(r.createdAt),
      };
    }),
    total: number(row.total),
    page: number(row.page),
    pageSize: number(row.pageSize),
  };
}
export type BusinessRuns = ReturnType<typeof parseBusinessRuns>;
export const getBusinessRuns = (
  page: number,
  agentId: string,
  status: string,
  signal?: AbortSignal,
) =>
  request(
    `/admin/agents/business-runs?${new URLSearchParams({ page: String(page), pageSize: "20", ...(agentId ? { agentId } : {}), ...(status ? { status } : {}) })}`,
    parseBusinessRuns,
    { signal },
  );
