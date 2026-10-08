import { request } from "./client";
import {
  array,
  nullable,
  number,
  parsePage,
  record,
  string,
  type Page,
} from "./parse";
export type AcademicKind = "classes" | "sessions" | "projects";
export const academicStatuses: Record<AcademicKind, readonly string[]> = {
  classes: ["upcoming", "active", "completed", "cancelled"],
  sessions: ["upcoming", "active", "ending", "completed", "cancelled"],
  projects: ["draft", "active", "completed", "archived"],
};
export function sessionTransitions(status: string): string[] {
  return (
    (
      {
        upcoming: ["active", "cancelled"],
        active: ["ending", "cancelled"],
        ending: ["completed"],
        completed: [],
        cancelled: [],
      } as Record<string, string[]>
    )[status] ?? []
  );
}
export function parseAcademic(value: unknown) {
  const v = record(value);
  return {
    id: string(v.id),
    code: string(v.code),
    name: string(v.name),
    status: string(v.status),
    description: nullable(v.description, string),
    startDate: nullable(v.startDate, string),
    endDate: nullable(v.endDate, string),
    leadInstructorId:
      v.leadInstructorId === undefined
        ? null
        : nullable(v.leadInstructorId, string),
    mentorId: v.mentorId === undefined ? null : nullable(v.mentorId, string),
    sessionId: v.sessionId === undefined ? null : nullable(v.sessionId, string),
    difficulty: v.difficulty === undefined ? null : string(v.difficulty),
    capacity: v.capacity === undefined ? null : nullable(v.capacity, number),
    technologies:
      v.technologies === undefined ? [] : array(v.technologies, string),
  };
}
export type AcademicEntity = ReturnType<typeof parseAcademic>;
export function parseCandidates(
  value: unknown,
  page: number,
): Page<{
  userId: string;
  displayName: string | null;
  email: string | null;
  status: string;
}> {
  const v = record(value),
    total = number(v.total);
  return {
    items: array(v.items, (x) => {
      const c = record(x);
      return {
        userId: string(c.userId),
        displayName: nullable(c.displayName, string),
        email: nullable(c.email, string),
        status: string(c.status),
      };
    }),
    total,
    page,
    pageSize: 20,
    totalPages: Math.ceil(total / 20),
  };
}
export function academicBody(
  kind: AcademicKind,
  form: Record<string, string>,
  edit: boolean,
) {
  const body: Record<string, string | number | string[]> = {
    name: form.name,
    description: form.description ?? "",
  };
  if (!edit) body.code = form.code;
  if (form.status) body.status = form.status;
  for (const key of ["startDate", "endDate"])
    if (form[key]) body[key] = new Date(form[key] + "Z").toISOString();
  if (kind === "projects") {
    if (form.mentorId) body.mentorId = form.mentorId;
    if (form.difficulty) body.difficulty = form.difficulty;
    if (form.capacity) body.capacity = Number(form.capacity);
    body.technologies = (form.technologies ?? "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  } else {
    if (form.leadInstructorId) body.leadInstructorId = form.leadInstructorId;
    if (kind === "classes" && form.sessionId) body.sessionId = form.sessionId;
  }
  return body;
}
export const listAcademic = (
  kind: AcademicKind,
  page: number,
  q = "",
  status = "",
  signal?: AbortSignal,
) =>
  request(
    `/${kind}?${new URLSearchParams({ page: String(page), pageSize: "10", ...(q ? { q } : {}), ...(status ? { status } : {}) })}`,
    (x) => parsePage(x, parseAcademic),
    { signal },
  );
export const getAcademic = (
  kind: AcademicKind,
  id: string,
  signal?: AbortSignal,
) => request(`/${kind}/${encodeURIComponent(id)}`, parseAcademic, { signal });
export const saveAcademic = (
  kind: AcademicKind,
  id: string | undefined,
  form: Record<string, string>,
) =>
  request(`/${kind}${id ? `/${encodeURIComponent(id)}` : ""}`, parseAcademic, {
    method: id ? "PATCH" : "POST",
    body: academicBody(kind, form, Boolean(id)),
  });
export const listCandidates = (page: number, signal?: AbortSignal) =>
  request(
    `/recruitment/candidates?page=${page}&pageSize=20`,
    (x) => parseCandidates(x, page),
    { signal },
  );
export function parseMember(value: unknown) {
  const v = record(value);
  return {
    userId: string(v.userId ?? v.instructorId),
    displayName: string(v.displayName),
    email: string(v.email),
  };
}
export const instructorOptions = (
  page: number,
  q: string,
  signal?: AbortSignal,
) =>
  request(
    `/sessions/instructor-options?${new URLSearchParams({ page: String(page), pageSize: "10", ...(q ? { q } : {}) })}`,
    (x) => parsePage(x, parseMember),
    { signal },
  );
export const getMembers = (
  kind: AcademicKind,
  id: string,
  signal?: AbortSignal,
) =>
  request(
    `/${kind}/${encodeURIComponent(id)}/members`,
    (x) => array(record(x).members, parseMember),
    { signal },
  );
export const getInstructors = (id: string, signal?: AbortSignal) =>
  request(
    `/sessions/${encodeURIComponent(id)}/instructors`,
    (x) => array(record(x).instructors, parseMember),
    { signal },
  );
export const addMember = (
  kind: "classes" | "sessions",
  id: string,
  userId: string,
) =>
  request(`/${kind}/${encodeURIComponent(id)}/members`, () => null, {
    method: "POST",
    body: { userIds: [userId] },
  });
export const removeMember = (kind: AcademicKind, id: string, userId: string) =>
  request(
    `/${kind}/${encodeURIComponent(id)}/members/${encodeURIComponent(userId)}`,
    () => null,
    { method: "DELETE" },
  );
export const addInstructor = (id: string, userId: string) =>
  request(`/sessions/${encodeURIComponent(id)}/instructors`, () => null, {
    method: "POST",
    body: { instructorIds: [userId] },
  });
export const removeInstructor = (id: string, userId: string) =>
  request(
    `/sessions/${encodeURIComponent(id)}/instructors/${encodeURIComponent(userId)}`,
    () => null,
    { method: "DELETE" },
  );
export function parseMilestone(value: unknown) {
  const v = record(value);
  return {
    id: string(v.id),
    title: string(v.title),
    status: string(v.status),
    dueDate: nullable(v.dueDate, string),
  };
}
export const getMilestones = (id: string, signal?: AbortSignal) =>
  request(
    `/sessions/${encodeURIComponent(id)}/milestones`,
    (x) => array(record(x).milestones, parseMilestone),
    { signal },
  );
export const saveMilestone = (
  id: string,
  milestoneId: string | undefined,
  body: { title?: string; dueDate?: string; status?: string },
) =>
  request(
    `/sessions/${encodeURIComponent(id)}/milestones${milestoneId ? `/${encodeURIComponent(milestoneId)}` : ""}`,
    parseMilestone,
    { method: milestoneId ? "PATCH" : "POST", body },
  );
export const deleteMilestone = (id: string, milestoneId: string) =>
  request(
    `/sessions/${encodeURIComponent(id)}/milestones/${encodeURIComponent(milestoneId)}`,
    () => null,
    { method: "DELETE" },
  );
export const assignIntern = (body: {
  internId: string;
  projectId: string;
  sessionId: string;
}) =>
  request("/assignments", (x) => string(record(x).id), {
    method: "POST",
    body,
  });
