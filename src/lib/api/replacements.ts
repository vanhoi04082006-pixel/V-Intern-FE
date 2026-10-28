import { request } from "./client";
import * as p from "./parse";
function parseCandidate(value: unknown) {
  const v = p.record(value);
  return {
    userId: p.string(v.userId),
    displayName: p.string(v.displayName),
    roleCode: p.string(v.roleCode),
    overallScore: p.nullable(v.overallScore, p.number),
    technicalScore: p.nullable(v.technicalScore, p.number),
    strengths: p.array(v.strengths, p.string),
    weaknesses: p.array(v.weaknesses, p.string),
    evaluatedAt: p.nullable(v.evaluatedAt, p.string),
    evidenceRef: p.string(v.evidenceRef),
  };
}
function parseAdvice(value: unknown) {
  const v = p.record(value),
    a = p.record(v.advice);
  return {
    id: p.string(v.id),
    aiRunId: p.nullable(v.aiRunId, p.string),
    contextHash: p.string(v.contextHash),
    requiresInstructorApproval: p.boolean(v.requiresInstructorApproval),
    searchLimited: p.boolean(v.searchLimited),
    advice: {
      candidateId: p.nullable(a.candidateId, p.string),
      reason: p.string(a.reason),
      evidenceRefs: p.array(a.evidenceRefs, p.string),
      limitations: p.array(a.limitations, p.string),
    },
    candidates: p.array(v.candidates, parseCandidate),
  };
}
function parsePreview(value: unknown) {
  const v = p.record(value),
    d = p.record(v.document),
    s = p.record(d.summary),
    plan = p.record(d.taskPlan);
  return {
    id: p.string(v.id),
    previewHash: p.string(v.previewHash),
    expiresAt: p.string(v.expiresAt),
    status: p.oneOf(v.status, ["pending", "expired", "approved"]),
    document: {
      schemaVersion: p.number(d.schemaVersion),
      preparedAt: p.string(d.preparedAt),
      handoverHours: p.number(d.handoverHours),
      adviceId: p.string(d.adviceId),
      sourceFingerprint: p.string(d.sourceFingerprint),
      summary: {
        sessionId: p.string(s.sessionId),
        sessionName: p.string(s.sessionName),
        projectId: p.string(s.projectId),
        projectName: p.string(s.projectName),
        roleCode: p.string(s.roleCode),
        roleName: p.string(s.roleName),
        oldAssignmentId: p.string(s.oldAssignmentId),
        oldInternId: p.string(s.oldInternId),
        oldInternName: p.string(s.oldInternName),
        candidateId: p.string(s.candidateId),
        candidateName: p.string(s.candidateName),
      },
      taskPlan: {
        handoverAt: p.string(plan.handoverAt),
        preservedCount: p.number(plan.preservedCount),
        transfers: p.array(plan.transfers, (raw) => {
          const t = p.record(raw);
          return {
            id: p.string(t.id),
            code: p.string(t.code),
            title: p.string(t.title),
            status: p.oneOf(t.status, ["todo", "doing"]),
            version: p.number(t.version),
            dueAt: p.nullable(t.dueAt, p.string),
            handoverDueAt: p.nullable(t.handoverDueAt, p.string),
          };
        }),
      },
      warnings: p.array(d.warnings, p.string),
    },
  };
}
function parseResult(value: unknown) {
  const v = p.record(value);
  return {
    schemaVersion: p.number(v.schemaVersion),
    replacementId: p.string(v.replacementId),
    commandId: p.string(v.commandId),
    sessionId: p.string(v.sessionId),
    oldAssignmentId: p.string(v.oldAssignmentId),
    newAssignmentId: p.string(v.newAssignmentId),
    oldInternId: p.string(v.oldInternId),
    newInternId: p.string(v.newInternId),
    transferredTaskIds: p.array(v.transferredTaskIds, p.string),
    preservedTaskCount: p.number(v.preservedTaskCount),
    approvedById: p.string(v.approvedById),
    approvedAt: p.string(v.approvedAt),
    reason: p.string(v.reason),
    repositoryAccessQueued: p.boolean(v.repositoryAccessQueued),
  };
}
const scope = (id: string) =>
  `/sessions/${encodeURIComponent(id)}/participation`;
export type ReplacementAdvice = ReturnType<typeof parseAdvice>;
export type ReplacementPreview = ReturnType<typeof parsePreview>;
export type ReplacementResult = ReturnType<typeof parseResult>;
export const replacementAdvice = (sessionId: string, incidentId: string) =>
  request(
    `${scope(sessionId)}/incidents/${encodeURIComponent(incidentId)}/replacement-advice`,
    parseAdvice,
    { method: "POST" },
  );
export const prepareReplacement = (
  sessionId: string,
  incidentId: string,
  body: { adviceId: string; candidateId: string; handoverHours: number },
) =>
  request(
    `${scope(sessionId)}/incidents/${encodeURIComponent(incidentId)}/replacement-preview`,
    parsePreview,
    { method: "POST", body },
  );
export const approveReplacement = (
  sessionId: string,
  commandId: string,
  body: { expectedPreviewHash: string; reason: string },
) =>
  request(
    `${scope(sessionId)}/replacements/${encodeURIComponent(commandId)}/approve`,
    parseResult,
    { method: "POST", body },
  );
export const ownReplacements = (signal?: AbortSignal) =>
  request(
    "/participation/me/replacements",
    (value) => {
      const v = p.record(value);
      return {
        limit: p.number(v.limit),
        items: p.array(v.items, (raw) => {
          const r = p.record(raw);
          return {
            result: parseResult(r.result),
            sessionName: p.string(r.sessionName),
            projectName: p.string(r.projectName),
          };
        }),
      };
    },
    { signal },
  );
