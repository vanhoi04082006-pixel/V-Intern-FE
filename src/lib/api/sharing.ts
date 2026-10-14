import { request } from "./client";
import * as p from "./parse";

function access(value: unknown) {
  const v = p.record(value);
  return {
    id: p.string(v.id),
    requesterId: p.string(v.requesterId),
    ownerId: p.string(v.ownerId),
    requesterName: p.string(v.requesterName),
    ownerName: p.string(v.ownerName),
    reason: p.string(v.reason),
    status: p.oneOf(v.status, ["pending", "approved", "denied", "revoked"]),
    sessionName: p.nullable(v.sessionName, p.string),
    expiresAt: p.nullable(v.expiresAt, p.string),
  };
}
export const listAccess = (page: number, signal?: AbortSignal) =>
  request(
    `/session-sharing?page=${page}&pageSize=20`,
    (value) => p.parsePage(value, access),
    { signal },
  );
export const requestAccess = (ownerEmail: string, reason: string) =>
  request("/session-sharing", p.record, {
    method: "POST",
    body: { ownerEmail, reason },
  });
export const decideAccess = (
  id: string,
  decision: string,
  sessionId?: string,
) =>
  request(`/session-sharing/${id}/decision`, p.record, {
    method: "POST",
    body: { decision, ...(sessionId ? { sessionId } : {}) },
  });
export const sharingSessions = (q: string, signal?: AbortSignal) =>
  request(
    `/sessions?page=1&pageSize=100&q=${encodeURIComponent(q)}`,
    (value) =>
      p.parsePage(value, (item) => {
        const v = p.record(item);
        return {
          id: p.string(v.id),
          name: p.string(v.name),
          leadInstructorId: p.nullable(v.leadInstructorId, p.string),
        };
      }),
    { signal },
  );
export const sharedSnapshot = (
  id: string,
  page: number,
  signal?: AbortSignal,
) =>
  request(
    `/session-sharing/${id}/snapshot?page=${page}&pageSize=50`,
    (value) => {
      const v = p.record(value),
        s = p.record(v.session),
        meta = p.record(v.meta);
      return {
        session: {
          name: p.string(s.name),
          status: p.string(s.status),
          startDate: p.string(s.startDate),
          endDate: p.string(s.endDate),
          description: p.nullable(s.description, p.string),
        },
        projects: p.array(v.projects, (item) => {
          const r = p.record(item);
          return p.string(r.name);
        }),
        members: p.array(v.members, (item) => {
          const r = p.record(item);
          return p.string(r.displayName);
        }),
        tasks: p.array(v.tasks, (item) => {
          const r = p.record(item);
          return {
            id: p.string(r.id),
            title: p.string(r.title),
            description: p.nullable(r.description, p.string),
            status: p.string(r.status),
            priority: p.string(r.priority),
            dueDate: p.nullable(r.dueDate, p.string),
            sprintName: p.string(r.sprintName),
            assigneeName: p.nullable(r.assigneeName, p.string),
          };
        }),
        totalPages: p.number(meta.totalPages),
        expiresAt: p.string(v.expiresAt),
      };
    },
    { signal },
  );
