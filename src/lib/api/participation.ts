import { request } from "./client";
import * as p from "./parse";
function parseIncident(value: unknown) {
  const v = p.record(value);
  return {
    id: p.string(v.id),
    taskId: p.string(v.taskId),
    internId: p.string(v.internId),
    sessionId: p.string(v.sessionId),
    deadlineVersion: p.number(v.deadlineVersion),
    policyVersion: p.number(v.policyVersion),
    dueAt: p.string(v.dueAt),
    submittedAt: p.nullable(v.submittedAt, p.string),
    kind: p.oneOf(v.kind, ["missing", "late"]),
    status: p.oneOf(v.status, ["active", "excused", "reversed"]),
    ordinal: p.number(v.ordinal),
    points: p.number(v.points),
    recommendReplacement: p.boolean(v.recommendReplacement),
    createdAt: p.string(v.createdAt),
    reason: p.nullable(v.reason, p.string),
    taskCode: p.string(v.taskCode),
    taskTitle: p.string(v.taskTitle),
    displayName: p.string(v.displayName),
    sessionName: p.string(v.sessionName),
    baseScore: p.nullable(v.baseScore, p.number),
    latePenalty: p.nullable(v.latePenalty, p.number),
    score: p.nullable(v.score, p.number),
    submissionStatus: p.nullable(v.submissionStatus, p.string),
  };
}
function parsePolicy(value: unknown) {
  const v = p.record(value);
  return {
    version: p.number(v.version),
    configured: p.boolean(v.configured),
    activeFrom: p.nullable(v.activeFrom, p.string),
    warningFrom: p.number(v.warningFrom),
    penaltyFrom: p.number(v.penaltyFrom),
    replacementFrom: p.number(v.replacementFrom),
    penaltyPoints: p.nullable(v.penaltyPoints, p.number),
    penaltyCap: p.number(v.penaltyCap),
  };
}
function parseReport(value: unknown) {
  const v = p.record(value),
    summary = p.record(v.summary);
  return {
    items: p.array(v.items, parseIncident),
    summary: {
      total: p.number(summary.total),
      active: p.number(summary.active),
      registeredPenalty: p.number(summary.registeredPenalty),
    },
    page: p.number(v.page),
    pageSize: p.number(v.pageSize),
  };
}
export type ParticipationIncident = ReturnType<typeof parseIncident>;
export type ParticipationPolicy = ReturnType<typeof parsePolicy>;
export const ownParticipation = (page: number, signal?: AbortSignal) =>
  request(`/participation/me?page=${page}&pageSize=20`, parseReport, {
    signal,
  });
export const sessionParticipation = (
  id: string,
  page: number,
  signal?: AbortSignal,
) =>
  request(
    `/sessions/${encodeURIComponent(id)}/participation?page=${page}&pageSize=20`,
    (value) => ({
      ...parseReport(value),
      policy: parsePolicy(p.record(value).policy),
    }),
    { signal },
  );
export const saveParticipationPolicy = (
  id: string,
  body: Omit<ParticipationPolicy, "version" | "configured" | "activeFrom"> & {
    expectedVersion: number;
    reason: string;
  },
) =>
  request(
    `/sessions/${encodeURIComponent(id)}/participation/policy`,
    parsePolicy,
    { method: "POST", body },
  );
export const resolveParticipation = (
  id: string,
  incidentId: string,
  body: {
    action: "excused" | "reversed";
    expectedDeadlineVersion: number;
    reason: string;
  },
) =>
  request(
    `/sessions/${encodeURIComponent(id)}/participation/incidents/${encodeURIComponent(incidentId)}/resolve`,
    p.record,
    { method: "POST", body },
  );
export const extendParticipationDeadline = (
  id: string,
  taskId: string,
  body: { expectedVersion: number; until: string; reason: string },
) =>
  request(
    `/sessions/${encodeURIComponent(id)}/participation/tasks/${encodeURIComponent(taskId)}/extend`,
    p.record,
    { method: "POST", body },
  );
export const refreshParticipation = (id: string) =>
  request(
    `/sessions/${encodeURIComponent(id)}/participation/refresh`,
    p.record,
    { method: "POST" },
  );
