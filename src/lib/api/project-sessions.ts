import { request } from "./client";
import { array, nullable, number, record, string } from "./parse";

/**
 * Adapters for project-scoped session history + library claim
 * (projects.controller: GET :id/sessions, POST :id/claim).
 * Kept in a dedicated module because the generic academic.ts project
 * adapter maps a different (paginated list) contract.
 */

/** Session row of GET projects/:id/sessions — full cohort history of a project. */
export interface ProjectSessionSummary {
  id: string;
  code: string;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  memberCount: number;
}

export function parseProjectSession(value: unknown): ProjectSessionSummary {
  const v = record(value);
  return {
    id: string(v.id),
    code: string(v.code),
    name: string(v.name),
    status: string(v.status),
    startDate: nullable(v.startDate, string),
    endDate: nullable(v.endDate, string),
    memberCount: number(v.memberCount),
  };
}

/** GET projects/:id/sessions — sessions that ever ran on this project. */
export const getProjectSessions = (projectId: string, signal?: AbortSignal) =>
  request(
    `/projects/${encodeURIComponent(projectId)}/sessions`,
    (x) => array(record(x).sessions, parseProjectSession),
    { signal },
  );

/**
 * POST projects/:id/claim — claim an unmentored library project as the
 * managing mentor. 409 PROJECT_ALREADY_CLAIMED when a mentor exists.
 * Returns the updated project id (lower-cased like other adapters).
 */
export const claimProject = (projectId: string) =>
  request(
    `/projects/${encodeURIComponent(projectId)}/claim`,
    (x) => string(record(x).id).toLowerCase(),
    { method: "POST" },
  );
