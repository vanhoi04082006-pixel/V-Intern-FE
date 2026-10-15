import { request } from "./client";
import * as p from "./parse";
export const rubricKeys = [
  "functional",
  "quality",
  "testing",
  "errors",
  "security",
  "dod",
] as const;
export type ReviewRubric = Record<(typeof rubricKeys)[number], number>;
function parseSubmission(value: unknown) {
  const v = p.record(value);
  return {
    id: p.string(v.id),
    taskId: p.string(v.taskId),
    internId: p.string(v.internId),
    prUrl: p.string(v.prUrl),
    summary: p.string(v.summary),
    status: p.oneOf(v.status, ["submitted", "approved", "rework", "withdrawn"]),
    score: p.nullable(v.score, p.number),
    feedback: p.nullable(v.feedback, p.string),
    headSha: p.nullable(v.headSha ?? null, p.string),
    ...(v.observedHeadSha === undefined ? {} : { observedHeadSha: p.nullable(v.observedHeadSha, p.string) }),
    ...(v.sourceChangedAt === undefined ? {} : { sourceChangedAt: p.nullable(v.sourceChangedAt, p.string) }),
    submittedAt: p.string(v.submittedAt),
  };
}
export type TaskSubmission = ReturnType<typeof parseSubmission>;
export const listSubmissions = (taskId: string, signal?: AbortSignal) =>
  request(
    `/tasks/${taskId}/submissions`,
    (value) => p.array(value, parseSubmission),
    { signal },
  );
export const submitCode = (
  taskId: string,
  body: { prUrl: string; summary: string; version: number; ref?: string },
) =>
  request(`/tasks/${taskId}/submissions`, parseSubmission, {
    method: "POST",
    body,
  });
export const withdrawCode = (id: string) =>
  request(`/submissions/${id}/withdraw`, parseSubmission, { method: "POST" });
export const confirmCodeReview = (
  id: string,
  body: {
    rubric: ReviewRubric;
    feedback: string;
    taskVersion: number;
    overrideReason?: string;
  },
) =>
  request(`/submissions/${id}/review`, parseSubmission, {
    method: "POST",
    body,
  });
function parseCodeReviews(value: unknown) {
  return p.array(value, (item) => {
    const v = p.record(item);
    return {
      id: p.string(v.id),
      headSha: p.string(v.headSha),
      status: p.oneOf(v.status, [
        "running",
        "awaiting_instructor",
        "needs_changes",
        "inconclusive",
        "failed",
      ]),
      model: p.nullable(v.model, p.string),
      inputHash: p.nullable(v.inputHash, p.string),
      errorCode: p.nullable(v.errorCode, p.string),
      result: p.nullable(v.result, (result) => {
        const r = p.record(result),
          rawRubric = p.record(r.rubric);
        const rubric = Object.fromEntries(
          rubricKeys.map((key) => [key, p.number(rawRubric[key])]),
        ) as ReviewRubric;
        return {
          score: p.number(r.score),
          rubric,
          summary: p.string(r.summary),
          limitations: p.array(r.limitations, p.string),
          findings: p.array(r.findings, (finding) => {
            const f = p.record(finding);
            return {
              file: p.string(f.file),
              line: p.number(f.line),
              message: p.string(f.message),
              severity: p.string(f.severity),
            };
          }),
        };
      }),
      evidence: p.nullable(v.evidence, (value) => {
        const e = p.record(value),
          tests = e.trustedTests ? p.record(e.trustedTests) : null;
        return {
          complete: p.boolean(e.complete),
          warnings: p.array(e.warnings, p.string),
          tests: tests
            ? {
                status: p.string(tests.status),
                passed: p.number(tests.passed),
                failed: p.number(tests.failed),
                summary: p.string(tests.summary),
              }
            : null,
        };
      }),
    };
  });
}
export const listCodeReviews = (id: string, signal?: AbortSignal) =>
  request(`/submissions/${id}/code-reviews`, parseCodeReviews, { signal });
export const runCodeReview = (id: string) =>
  request(`/submissions/${id}/code-reviews`, parseCodeReviews, {
    method: "POST",
  });
