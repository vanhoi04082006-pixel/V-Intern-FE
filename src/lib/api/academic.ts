"use client";

/**
 * Domain API: Sessions, Classes, Projects, Sprints, Assignments,
 * Sharing, Participation — cho giảng viên & quản trị.
 */

import { getJson, sendJson, arrOf, dateOf, numOf, strOf, qs, parsePaginated } from "@/lib/api/client";
import { parseTask, type TaskItem } from "@/lib/api/tasks";

/* ───────────────────────────── Sessions ───────────────────────────── */

export interface SessionSummary {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
  leadInstructorName: string | null;
  startDate: string | null;
  endDate: string | null;
  internCount: number;
  projectCount: number;
  version: number;
}

export interface SessionMember {
  userId: string;
  displayName: string;
  email: string;
}

export interface Milestone {
  id: string;
  name: string;
  dueDate: string | null;
  completed: boolean;
}

export interface SessionRepoStatus {
  connected: boolean;
  repositoryUrl: string | null;
  invitationPending: number;
  members: { userId: string; displayName: string; login: string | null; status: string }[];
}

export interface TimelineEntry {
  id: string;
  kind: string;
  title: string;
  actorName: string | null;
  createdAt: string | null;
}

export function parseSession(d: Record<string, unknown>): SessionSummary {
  const lead = (d.leadInstructor ?? {}) as Record<string, unknown>;
  return {
    id: strOf(d.id),
    code: strOf(d.code),
    name: strOf(d.name),
    description: typeof d.description === "string" ? d.description : null,
    status: strOf(d.status ?? "planned"),
    leadInstructorName: typeof lead.displayName === "string" ? lead.displayName : null,
    startDate: dateOf(d.startDate as string),
    endDate: dateOf(d.endDate as string),
    internCount: numOf(d.internCount),
    projectCount: numOf(d.projectCount),
    version: numOf(d.version, 1),
  };
}

export function fetchSessions(query: { q?: string; status?: string; projectId?: string; page?: number } = {}, signal?: AbortSignal) {
  return getJson(
    "/api/v1/sessions" + qs({ q: query.q, status: query.status, projectId: query.projectId, page: query.page ?? 1, pageSize: 20 }),
    parsePaginated(parseSession),
    signal,
  );
}

export function fetchSession(id: string, signal?: AbortSignal): Promise<SessionSummary> {
  return getJson(`/api/v1/sessions/${encodeURIComponent(id)}`, (data) => parseSession((data ?? {}) as Record<string, unknown>), signal);
}

export interface CreateSessionPayload {
  code: string;
  name: string;
  description?: string;
  leadInstructorId?: string;
  startDate: string;
  endDate: string;
}

export function createSession(payload: CreateSessionPayload): Promise<SessionSummary> {
  return sendJson("/api/v1/sessions", "POST", payload, (data) => parseSession((data ?? {}) as Record<string, unknown>));
}

export function updateSession(id: string, payload: Partial<CreateSessionPayload> & { status?: string }): Promise<SessionSummary> {
  return sendJson(`/api/v1/sessions/${encodeURIComponent(id)}`, "PATCH", payload, (data) => parseSession((data ?? {}) as Record<string, unknown>));
}

export function fetchSessionMembers(sessionId: string, signal?: AbortSignal): Promise<SessionMember[]> {
  return getJson(`/api/v1/sessions/${encodeURIComponent(sessionId)}/members`, (data) => {
    const d = (data ?? {}) as Record<string, unknown>;
    const arr = Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
    return arrOf(arr, (m) => {
      const r = (m ?? {}) as Record<string, unknown>;
      const user = (r.user ?? {}) as Record<string, unknown>;
      return { userId: strOf(r.userId ?? user.id), displayName: strOf(user.displayName ?? r.displayName), email: strOf(user.email ?? r.email) };
    });
  }, signal);
}

export function addSessionMembers(sessionId: string, userIds: string[]): Promise<void> {
  return sendJson(`/api/v1/sessions/${encodeURIComponent(sessionId)}/members`, "POST", { userIds }, () => undefined);
}

export function removeSessionMember(sessionId: string, userId: string): Promise<void> {
  return sendJson(`/api/v1/sessions/${encodeURIComponent(sessionId)}/members/${encodeURIComponent(userId)}`, "DELETE", {}, () => undefined);
}

export function fetchSessionInstructors(sessionId: string, signal?: AbortSignal): Promise<SessionMember[]> {
  return getJson(`/api/v1/sessions/${encodeURIComponent(sessionId)}/instructors`, (data) => {
    const d = (data ?? {}) as Record<string, unknown>;
    const arr = Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
    return arrOf(arr, (m) => {
      const r = (m ?? {}) as Record<string, unknown>;
      const user = (r.user ?? r.instructor ?? {}) as Record<string, unknown>;
      return { userId: strOf(r.instructorId ?? r.userId ?? user.id), displayName: strOf(user.displayName ?? r.displayName), email: strOf(user.email ?? r.email) };
    });
  }, signal);
}

export function addSessionInstructors(sessionId: string, instructorIds: string[]): Promise<void> {
  return sendJson(`/api/v1/sessions/${encodeURIComponent(sessionId)}/instructors`, "POST", { instructorIds }, () => undefined);
}

export function fetchMilestones(sessionId: string, signal?: AbortSignal): Promise<Milestone[]> {
  return getJson(`/api/v1/sessions/${encodeURIComponent(sessionId)}/milestones`, (data) => {
    const d = (data ?? {}) as Record<string, unknown>;
    const arr = Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
    return arrOf(arr, (m) => {
      const r = (m ?? {}) as Record<string, unknown>;
      return { id: strOf(r.id), name: strOf(r.name), dueDate: dateOf(r.dueDate as string), completed: r.completed === true };
    });
  }, signal);
}

export function createMilestone(sessionId: string, payload: { name: string; dueDate?: string }): Promise<void> {
  return sendJson(`/api/v1/sessions/${encodeURIComponent(sessionId)}/milestones`, "POST", payload, () => undefined);
}

export function fetchSessionRepoStatus(sessionId: string, signal?: AbortSignal): Promise<SessionRepoStatus> {
  return getJson(`/api/v1/sessions/${encodeURIComponent(sessionId)}/github`, (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    return {
      connected: r.connected === true,
      repositoryUrl: typeof r.repositoryUrl === "string" ? r.repositoryUrl : null,
      invitationPending: numOf(r.invitationPending),
      members: arrOf(r.members, (m) => {
        const mr = (m ?? {}) as Record<string, unknown>;
        return { userId: strOf(mr.userId), displayName: strOf(mr.displayName), login: typeof mr.login === "string" ? mr.login : null, status: strOf(mr.status) };
      }),
    };
  }, signal);
}

export function provisionSessionRepo(sessionId: string): Promise<void> {
  return sendJson(`/api/v1/sessions/${encodeURIComponent(sessionId)}/github/provision`, "POST", {}, () => undefined);
}

export function inviteSessionMembers(sessionId: string): Promise<void> {
  return sendJson(`/api/v1/sessions/${encodeURIComponent(sessionId)}/github/invite`, "POST", {}, () => undefined);
}

export function fetchSessionTimeline(sessionId: string, signal?: AbortSignal): Promise<TimelineEntry[]> {
  return getJson(`/api/v1/sessions/${encodeURIComponent(sessionId)}/timeline` + qs({ pageSize: 30 }), (data) => {
    const d = (data ?? {}) as Record<string, unknown>;
    const arr = Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
    return arrOf(arr, (t) => {
      const r = (t ?? {}) as Record<string, unknown>;
      return { id: strOf(r.id), kind: strOf(r.kind), title: strOf(r.title), actorName: typeof r.actorName === "string" ? r.actorName : null, createdAt: dateOf(r.createdAt as string) };
    });
  }, signal);
}

export function fetchMemberOptions(query: { q?: string; sessionId?: string; projectId?: string }, signal?: AbortSignal): Promise<SessionMember[]> {
  return getJson(
    "/api/v1/sessions/member-options" + qs({ q: query.q, sessionId: query.sessionId, projectId: query.projectId }),
    (data) => {
      const d = (data ?? {}) as Record<string, unknown>;
      const arr = Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
      return arrOf(arr, (m) => {
        const r = (m ?? {}) as Record<string, unknown>;
        return { userId: strOf(r.id ?? r.userId), displayName: strOf(r.displayName), email: strOf(r.email) };
      });
    },
    signal,
  );
}

export function fetchInstructorOptions(q?: string, signal?: AbortSignal): Promise<SessionMember[]> {
  return fetchMemberOptions({ q }, signal);
}

/* ───────────────────────────── Classes ───────────────────────────── */

export interface ClassSummary {
  id: string;
  code: string;
  name: string;
  status: string;
  memberCount: number;
  lessonCount: number;
}

export interface ClassLesson {
  id: string;
  title: string;
  startsAt: string | null;
  attendanceCount: number;
}

export function fetchClasses(query: { q?: string; status?: string; sessionId?: string; page?: number } = {}, signal?: AbortSignal) {
  return getJson(
    "/api/v1/classes" + qs({ q: query.q, status: query.status, sessionId: query.sessionId, page: query.page ?? 1, pageSize: 20 }),
    parsePaginated((d) => {
      const r = (d ?? {}) as Record<string, unknown>;
      return {
        id: strOf(r.id),
        code: strOf(r.code),
        name: strOf(r.name),
        status: strOf(r.status ?? "active"),
        memberCount: numOf(r.memberCount),
        lessonCount: numOf(r.lessonCount),
      } as ClassSummary;
    }),
    signal,
  );
}

export function createClass(payload: { code: string; name: string; sessionId?: string }): Promise<ClassSummary> {
  return sendJson("/api/v1/classes", "POST", payload, (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    return { id: strOf(r.id), code: strOf(r.code), name: strOf(r.name), status: strOf(r.status, "active"), memberCount: numOf(r.memberCount), lessonCount: numOf(r.lessonCount) };
  });
}

export function fetchClassMembers(classId: string, signal?: AbortSignal): Promise<SessionMember[]> {
  return getJson(`/api/v1/classes/${encodeURIComponent(classId)}/members`, (data) => {
    const d = (data ?? {}) as Record<string, unknown>;
    const arr = Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
    return arrOf(arr, (m) => {
      const r = (m ?? {}) as Record<string, unknown>;
      const user = (r.user ?? {}) as Record<string, unknown>;
      return { userId: strOf(r.userId ?? user.id), displayName: strOf(user.displayName ?? r.displayName), email: strOf(user.email ?? r.email) };
    });
  }, signal);
}

export function addClassMembers(classId: string, userIds: string[]): Promise<void> {
  return sendJson(`/api/v1/classes/${encodeURIComponent(classId)}/members`, "POST", { userIds }, () => undefined);
}

export function removeClassMember(classId: string, userId: string): Promise<void> {
  return sendJson(`/api/v1/classes/${encodeURIComponent(classId)}/members/${encodeURIComponent(userId)}`, "DELETE", {}, () => undefined);
}

export function fetchClassLessons(classId: string, signal?: AbortSignal): Promise<ClassLesson[]> {
  return getJson(`/api/v1/classes/${encodeURIComponent(classId)}/lessons`, (data) => {
    const d = (data ?? {}) as Record<string, unknown>;
    const arr = Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
    return arrOf(arr, (l) => {
      const r = (l ?? {}) as Record<string, unknown>;
      return { id: strOf(r.id), title: strOf(r.title), startsAt: dateOf(r.startsAt as string), attendanceCount: numOf(r.attendanceCount) };
    });
  }, signal);
}

export function createClassLesson(classId: string, payload: { title: string; startsAt?: string }): Promise<void> {
  return sendJson(`/api/v1/classes/${encodeURIComponent(classId)}/lessons`, "POST", payload, () => undefined);
}

export function fetchLessonAttendance(classId: string, lessonId: string, signal?: AbortSignal): Promise<{ userId: string; displayName: string; present: boolean }[]> {
  return getJson(`/api/v1/classes/${encodeURIComponent(classId)}/lessons/${encodeURIComponent(lessonId)}/attendance`, (data) => {
    const d = (data ?? {}) as Record<string, unknown>;
    const arr = Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
    return arrOf(arr, (a) => {
      const r = (a ?? {}) as Record<string, unknown>;
      const user = (r.user ?? {}) as Record<string, unknown>;
      return { userId: strOf(r.userId ?? user.id), displayName: strOf(user.displayName ?? r.displayName), present: r.present === true };
    });
  }, signal);
}

export function saveLessonAttendance(classId: string, lessonId: string, payload: unknown): Promise<void> {
  return sendJson(`/api/v1/classes/${encodeURIComponent(classId)}/lessons/${encodeURIComponent(lessonId)}/attendance`, "PUT", payload, () => undefined);
}

/* ───────────────────────────── Projects ───────────────────────────── */

export interface ProjectSummary {
  id: string;
  code: string;
  name: string;
  description: string | null;
  domainCategory: string | null;
  difficulty: string | null;
  status: string;
  mentorName: string | null;
  capacity: number | null;
  memberCount: number;
  technologies: string[];
  startDate: string | null;
  endDate: string | null;
}

export function parseProject(d: Record<string, unknown>): ProjectSummary {
  const mentor = (d.mentor ?? {}) as Record<string, unknown>;
  return {
    id: strOf(d.id),
    code: strOf(d.code),
    name: strOf(d.name),
    description: typeof d.description === "string" ? d.description : null,
    domainCategory: typeof d.domainCategory === "string" ? d.domainCategory : null,
    difficulty: typeof d.difficulty === "string" ? d.difficulty : null,
    status: strOf(d.status ?? "draft"),
    mentorName: typeof mentor.displayName === "string" ? mentor.displayName : null,
    capacity: d.capacity == null ? null : numOf(d.capacity),
    memberCount: numOf(d.memberCount),
    technologies: arrOf(d.technologies, (t) => strOf(t)),
    startDate: dateOf(d.startDate as string),
    endDate: dateOf(d.endDate as string),
  };
}

export function fetchProjects(query: { q?: string; status?: string; difficulty?: string; technology?: string; page?: number } = {}, signal?: AbortSignal) {
  return getJson(
    "/api/v1/projects" + qs({ q: query.q, status: query.status, difficulty: query.difficulty, technology: query.technology, page: query.page ?? 1, pageSize: 20 }),
    parsePaginated(parseProject),
    signal,
  );
}

export function fetchProjectFilterOptions(signal?: AbortSignal): Promise<{ difficulties: string[]; technologies: string[]; domainCategories: string[] }> {
  return getJson("/api/v1/projects/filter-options", (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    return {
      difficulties: arrOf(r.difficulties, (x) => strOf(x)),
      technologies: arrOf(r.technologies, (x) => strOf(x)),
      domainCategories: arrOf(r.domainCategories, (x) => strOf(x)),
    };
  }, signal);
}

export function fetchProject(id: string, signal?: AbortSignal): Promise<ProjectSummary> {
  return getJson(`/api/v1/projects/${encodeURIComponent(id)}`, (data) => parseProject((data ?? {}) as Record<string, unknown>), signal);
}

export interface CreateProjectPayload {
  code: string;
  name: string;
  description?: string;
  domainCategory?: string;
  difficulty?: string;
  status?: string;
  mentorId?: string;
  capacity?: number;
  startDate?: string;
  endDate?: string;
  technologies?: string[];
}

export function createProject(payload: CreateProjectPayload): Promise<ProjectSummary> {
  return sendJson("/api/v1/projects", "POST", payload, (data) => parseProject((data ?? {}) as Record<string, unknown>));
}

export function updateProject(id: string, payload: Partial<CreateProjectPayload>): Promise<ProjectSummary> {
  return sendJson(`/api/v1/projects/${encodeURIComponent(id)}`, "PATCH", payload, (data) => parseProject((data ?? {}) as Record<string, unknown>));
}

export function fetchProjectMembers(projectId: string, signal?: AbortSignal): Promise<(SessionMember & { roleName: string | null })[]> {
  return getJson(`/api/v1/projects/${encodeURIComponent(projectId)}/members`, (data) => {
    const d = (data ?? {}) as Record<string, unknown>;
    const arr = Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
    return arrOf(arr, (m) => {
      const r = (m ?? {}) as Record<string, unknown>;
      const user = (r.user ?? r.intern ?? {}) as Record<string, unknown>;
      return { userId: strOf(r.userId ?? user.id), displayName: strOf(user.displayName ?? r.displayName), email: strOf(user.email ?? r.email), roleName: typeof r.roleName === "string" ? r.roleName : null };
    });
  }, signal);
}

export function claimProject(projectId: string): Promise<ProjectSummary> {
  return sendJson(`/api/v1/projects/${encodeURIComponent(projectId)}/claim`, "POST", {}, (data) => parseProject((data ?? {}) as Record<string, unknown>));
}

/* ───────────────────────────── Sprints ───────────────────────────── */

export interface SprintSummary {
  id: string;
  code: string;
  name: string;
  goal: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  projectId: string | null;
  sessionId: string | null;
}

export function parseSprint(d: Record<string, unknown>): SprintSummary {
  return {
    id: strOf(d.id),
    code: strOf(d.code),
    name: strOf(d.name),
    goal: typeof d.goal === "string" ? d.goal : null,
    status: strOf(d.status ?? "planned"),
    startDate: dateOf(d.startDate as string),
    endDate: dateOf(d.endDate as string),
    projectId: d.projectId == null ? null : strOf(d.projectId),
    sessionId: d.sessionId == null ? null : strOf(d.sessionId),
  };
}

export function fetchSprints(query: { projectId?: string; sessionId?: string; status?: string; search?: string; page?: number } = {}, signal?: AbortSignal) {
  return getJson(
    "/api/v1/sprints" + qs({ projectId: query.projectId, sessionId: query.sessionId, status: query.status, search: query.search, page: query.page ?? 1, pageSize: 50 }),
    parsePaginated(parseSprint),
    signal,
  );
}

export function createSprint(payload: { code: string; name: string; goal?: string; projectId?: string; sessionId?: string; startDate?: string; endDate?: string }): Promise<SprintSummary> {
  return sendJson("/api/v1/sprints", "POST", payload, (data) => parseSprint((data ?? {}) as Record<string, unknown>));
}

export function updateSprint(id: string, payload: Partial<{ code: string; name: string; goal: string; startDate: string; endDate: string }>): Promise<SprintSummary> {
  return sendJson(`/api/v1/sprints/${encodeURIComponent(id)}`, "PATCH", payload, (data) => parseSprint((data ?? {}) as Record<string, unknown>));
}

export function transitionSprint(id: string, status: string, allowOpenTasks?: boolean): Promise<SprintSummary> {
  return sendJson(`/api/v1/sprints/${encodeURIComponent(id)}/status`, "POST", allowOpenTasks === undefined ? { status } : { status, allowOpenTasks }, (data) => parseSprint((data ?? {}) as Record<string, unknown>));
}

export interface StaffBoard {
  columns: { status: string; count: number }[];
  tasks: TaskItem[];
}

export function fetchSprintBoard(sprintId: string, signal?: AbortSignal): Promise<StaffBoard> {
  return getJson(`/api/v1/sprints/${encodeURIComponent(sprintId)}/board` + qs({ pageSize: 100 }), (data) => {
    const d = (data ?? {}) as Record<string, unknown>;
    return {
      columns: arrOf(d.columns, (c) => {
        const r = (c ?? {}) as Record<string, unknown>;
        return { status: strOf(r.status), count: numOf(r.count) };
      }),
      tasks: arrOf(d.tasks, (t) => parseTask((t ?? {}) as Record<string, unknown>)),
    };
  }, signal);
}

export function fetchSprintCompletion(sprintId: string, signal?: AbortSignal): Promise<{ totalTasks: number; doneTasks: number; openTasks: number; totalStoryPoints: number; doneStoryPoints: number }> {
  return getJson(`/api/v1/sprints/${encodeURIComponent(sprintId)}/completion`, (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    return {
      totalTasks: numOf(r.totalTasks),
      doneTasks: numOf(r.doneTasks),
      openTasks: numOf(r.openTasks),
      totalStoryPoints: numOf(r.totalStoryPoints),
      doneStoryPoints: numOf(r.doneStoryPoints),
    };
  }, signal);
}

export function fetchSprintBurndown(sprintId: string, signal?: AbortSignal): Promise<{ points: { date: string; remaining: number }[] }> {
  return getJson(`/api/v1/dashboard/sprints/${encodeURIComponent(sprintId)}/burndown`, (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    return {
      points: arrOf(r.points ?? r.series ?? r.burndown, (p) => {
        const pr = (p ?? {}) as Record<string, unknown>;
        return { date: strOf(pr.date ?? pr.day), remaining: numOf(pr.remaining ?? pr.value) };
      }),
    };
  }, signal);
}

/* ─────────────────────────── Assignments ─────────────────────────── */

export interface AssignmentSummary {
  id: string;
  internId: string;
  internName: string;
  projectId: string;
  projectName: string;
  sessionId: string;
  sessionName: string;
  status: string;
  role: string | null;
}

export function fetchAssignments(query: { internId?: string; sessionId?: string; projectId?: string; status?: string; page?: number } = {}, signal?: AbortSignal) {
  return getJson(
    "/api/v1/assignments" + qs({ internId: query.internId, sessionId: query.sessionId, projectId: query.projectId, status: query.status, page: query.page ?? 1, pageSize: 20 }),
    parsePaginated((d) => {
      const r = (d ?? {}) as Record<string, unknown>;
      const intern = (r.intern ?? {}) as Record<string, unknown>;
      const project = (r.project ?? {}) as Record<string, unknown>;
      const session = (r.session ?? {}) as Record<string, unknown>;
      return {
        id: strOf(r.id),
        internId: strOf(r.internId ?? intern.id),
        internName: strOf(intern.displayName ?? r.internName),
        projectId: strOf(r.projectId ?? project.id),
        projectName: strOf(project.name ?? r.projectName),
        sessionId: strOf(r.sessionId ?? session.id),
        sessionName: strOf(session.name ?? r.sessionName),
        status: strOf(r.status ?? "active"),
        role: typeof r.role === "string" ? r.role : null,
      } as AssignmentSummary;
    }),
    signal,
  );
}

export function createAssignment(payload: { internId: string; projectId: string; sessionId: string; role?: string }): Promise<AssignmentSummary> {
  return sendJson("/api/v1/assignments", "POST", payload, (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    return {
      id: strOf(r.id),
      internId: strOf(r.internId),
      internName: strOf(r.internName),
      projectId: strOf(r.projectId),
      projectName: strOf(r.projectName),
      sessionId: strOf(r.sessionId),
      sessionName: strOf(r.sessionName),
      status: strOf(r.status, "active"),
      role: typeof r.role === "string" ? r.role : null,
    };
  });
}

export function completeAssignment(id: string): Promise<void> {
  return sendJson(`/api/v1/assignments/${encodeURIComponent(id)}/complete`, "POST", {}, () => undefined);
}

export function cancelAssignment(id: string): Promise<void> {
  return sendJson(`/api/v1/assignments/${encodeURIComponent(id)}/cancel`, "POST", {}, () => undefined);
}

/* ────────────────────────── Session sharing ────────────────────────── */

export interface AccessRequest {
  id: string;
  ownerEmail: string;
  reason: string | null;
  status: string;
  createdAt: string | null;
}

export function fetchMyAccessRequests(signal?: AbortSignal): Promise<AccessRequest[]> {
  return getJson("/api/v1/session-sharing", (data) => {
    const d = (data ?? {}) as Record<string, unknown>;
    const arr = Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
    return arrOf(arr, (r0) => {
      const r = (r0 ?? {}) as Record<string, unknown>;
      return { id: strOf(r.id), ownerEmail: strOf(r.ownerEmail), reason: typeof r.reason === "string" ? r.reason : null, status: strOf(r.status), createdAt: dateOf(r.createdAt as string) };
    });
  }, signal);
}

export function requestAccess(payload: { ownerEmail: string; reason: string }): Promise<void> {
  return sendJson("/api/v1/session-sharing", "POST", payload, () => undefined);
}

export function decideAccess(id: string, decision: "approve" | "deny" | "revoke", sessionId?: string, days?: number): Promise<void> {
  return sendJson(`/api/v1/session-sharing/${encodeURIComponent(id)}/decision`, "POST", { decision, sessionId, days }, () => undefined);
}

/* ────────────────────────── Participation ────────────────────────── */

export interface ParticipationIncident {
  id: string;
  kind: string;
  severity: string;
  description: string | null;
  resolvedAt: string | null;
  createdAt: string | null;
}

export interface SessionParticipation {
  incidents: ParticipationIncident[];
  policy: Record<string, unknown> | null;
}

export function fetchSessionParticipation(sessionId: string, signal?: AbortSignal): Promise<SessionParticipation> {
  return getJson(`/api/v1/sessions/${encodeURIComponent(sessionId)}/participation`, (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    return {
      incidents: arrOf(r.incidents, (i) => {
        const ir = (i ?? {}) as Record<string, unknown>;
        return { id: strOf(ir.id), kind: strOf(ir.kind), severity: strOf(ir.severity), description: typeof ir.description === "string" ? ir.description : null, resolvedAt: dateOf(ir.resolvedAt as string), createdAt: dateOf(ir.createdAt as string) };
      }),
      policy: (r.policy ?? null) as Record<string, unknown> | null,
    };
  }, signal);
}

export function refreshSessionParticipation(sessionId: string): Promise<void> {
  return sendJson(`/api/v1/sessions/${encodeURIComponent(sessionId)}/participation/refresh`, "POST", {}, () => undefined);
}
