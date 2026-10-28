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
    id: string(v.id).toLowerCase(),
    code: string(v.code),
    name: string(v.name),
    status: string(v.status),
    meetingSchedule: v.meetingSchedule == null ? null : string(v.meetingSchedule),
    meetingLocation: v.meetingLocation == null ? null : string(v.meetingLocation),
    progress: v.progress == null ? null : number(v.progress),
    domainCategory: v.domainCategory == null ? null : string(v.domainCategory),
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
  filters: Record<string, string> = {},
) =>
  request(
    `/${kind}?${new URLSearchParams({ page: String(page), pageSize: "10", ...(q ? { q } : {}), ...(status ? { status } : {}), ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) })}`,
    (x) => parsePage(x, parseAcademic),
    { signal },
  );
export function parseSlot(value: unknown) {
  const v = record(value);
  return {
    roleCode: string(v.roleCode),
    requiredCount: number(v.requiredCount),
    filledCount: number(v.filledCount),
    members: Array.isArray(v.members)
      ? v.members.map((m) => {
          const r = record(m);
          return { userId: string(r.userId), displayName: nullable(r.displayName, string) };
        })
      : [],
  };
}
export type SlotInfo = ReturnType<typeof parseSlot>;

export const getProjectSlots = (projectId: string, signal?: AbortSignal) =>
  request(`/projects/${encodeURIComponent(projectId)}/slots`, (x) => array(record(x).slots, parseSlot), {
    signal,
  });

/** M5 Start Session: explicit status transition (preconditions enforced server-side). */
export const transitionSession = (id: string, status: string) =>
  request(`/sessions/${encodeURIComponent(id)}`, parseAcademic, {
    method: "PATCH",
    body: { status },
  });

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
export interface CandidateResult {
  englishScore?: number | null;
  strengths?: string[];
  weaknesses?: string[];
  overallScore: number | null;
  technicalScore: number | null;
  softSkillScore: number | null;
  decision: string | null;
  evaluatedAt: string | null;
}

export interface Candidate {
  userId: string;
  displayName: string | null;
  email: string | null;
  status: string;
  selectedRole: string | null;
  attemptCount: number;
  recruitedAt: string | null;
  hasActiveAssignment: boolean;
  activeProjectId: string | null;
  result: CandidateResult | null;
}

export function parseCandidate(value: unknown): Candidate {
  const c = record(value);
  const num = (v: unknown): number | null => (v === null || v === undefined ? null : number(v));
  const r = c.result === null || c.result === undefined ? null : record(c.result);
  return {
    userId: string(c.userId),
    displayName: nullable(c.displayName, string),
    email: nullable(c.email, string),
    status: string(c.status),
    selectedRole: nullable(c.selectedRole, string),
    attemptCount: typeof c.attemptCount === "number" ? c.attemptCount : 0,
    recruitedAt: nullable(c.recruitedAt, string),
    hasActiveAssignment: c.hasActiveAssignment === true,
    activeProjectId: nullable(c.activeProjectId, string),
    result: r
      ? {
          overallScore: num(r.overallScore),
          technicalScore: num(r.technicalScore),
          softSkillScore: num(r.softSkillScore),
          englishScore: num(r.englishScore),
          strengths: r.strengths === undefined ? [] : array(r.strengths, string),
          weaknesses: r.weaknesses === undefined ? [] : array(r.weaknesses, string),
          decision: r.decision === null || r.decision === undefined ? null : string(r.decision),
          evaluatedAt: nullable(r.evaluatedAt, string),
        }
      : null,
  };
}

export interface CandidateQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  eligibility?: string;
  status?: string;
  sort?: string;
}

/** M4 server-side candidate search — never fetch-all-filter-local. */
export const searchCandidates = (q: CandidateQuery, signal?: AbortSignal) => {
  const params = new URLSearchParams({
    page: String(q.page ?? 1),
    pageSize: String(q.pageSize ?? 20),
  });
  if (q.search) params.set("search", q.search);
  if (q.role) params.set("role", q.role);
  if (q.eligibility) params.set("eligibility", q.eligibility);
  if (q.status) params.set("status", q.status);
  if (q.sort) params.set("sort", q.sort);
  return request(`/recruitment/candidates?${params.toString()}`, (x) => {
    const v = record(x);
    return {
      items: array(v.items, parseCandidate),
      total: number(v.total),
      page: q.page ?? 1,
      pageSize: q.pageSize ?? 20,
      totalPages: Math.ceil(number(v.total) / (q.pageSize ?? 20)),
    };
  }, { signal });
};

export const getCandidateDetail = (userId: string, signal?: AbortSignal) =>
  request(`/recruitment/candidates/${encodeURIComponent(userId)}`, (x) => record(x), { signal });

export const listSessionAssignments = (sessionId: string, signal?: AbortSignal, internId?: string) =>
  request(`/assignments?${new URLSearchParams({ sessionId, status: "active", page: "1", pageSize: internId ? '1' : '100', ...(internId ? { internId } : {}) })}`, (x) => {
    const v = record(x);
    const items = Array.isArray(v.items) ? v.items : array(v.data, (i) => i);
    return items.map((i) => {
      const r = record(i);
      return { id: string(r.id), internId: string(r.internId), status: string(r.status) };
    });
  }, { signal });

export const cancelAssignment = (id: string) =>
  request(`/assignments/${encodeURIComponent(id)}/cancel`, (x) => string(record(x).id), {
    method: "POST",
  });

/** POST assignments/:id/complete — complete an active assignment (history preserved). */
export const completeAssignment = (id: string) =>
  request(`/assignments/${encodeURIComponent(id)}/complete`, (x) => string(record(x).id), {
    method: "POST",
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
    ...(v.role === undefined && v.roleInProject === undefined ? {} : { role: nullable(v.role ?? v.roleInProject ?? null, string) }),
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
  /** Role slot to fill; BE enforces the slot cap and records project membership. */
  role?: string;
}) =>
  request("/assignments", (x) => string(record(x).id), {
    method: "POST",
    body,
  });
export const getAcademicSummaries = (kind: AcademicKind, ids: string, signal?: AbortSignal) => request(`/dashboard/academic?kind=${kind}&ids=${encodeURIComponent(ids)}`, value => array(record(value).items, x => {
  const v=record(x);
  return {id:string(v.id),responsibleName:nullable(v.responsibleName,string),sessionName:nullable(v.sessionName,string),memberCount:number(v.memberCount),taskCount:nullable(v.taskCount,number),doneCount:nullable(v.doneCount,number)};
}), {signal});

export const getProjectFilterOptions = (signal?:AbortSignal) => request('/projects/filter-options',value=>{const v=record(value);return {domains:array(v.domains,string),technologies:array(v.technologies,string)};},{signal});
