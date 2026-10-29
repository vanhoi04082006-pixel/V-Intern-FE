"use client";

/**
 * Domain API: Tasks + Submissions + Comments — /tasks, /submissions.
 * Intern tự cập nhật qua PATCH /tasks/:id/my (todo→doing→review).
 */

import { getJson, sendJson, request, arrOf, dateOf, numOf, strOf, qs, parsePaginated } from "@/lib/api/client";

export interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  storyPoints: number | null;
  dueDate: string | null;
  version: number;
  projectId: string | null;
  sprintId: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  createdAt: string | null;
}

export interface TaskComment {
  id: string;
  authorName: string;
  content: string;
  createdAt: string | null;
}

export interface TaskHistoryEntry {
  id: string;
  fromStatus: string | null;
  toStatus: string | null;
  actorName: string | null;
  note: string | null;
  createdAt: string | null;
}

export interface Submission {
  id: string;
  taskId: string;
  internName: string | null;
  prUrl: string | null;
  ref: string | null;
  summary: string | null;
  status: string;
  version: number;
  submittedAt: string | null;
  reviewedAt: string | null;
  score: number | null;
  feedback: string | null;
}

export interface CodeReview {
  id: string;
  source: string;
  status: string;
  findings: string[];
  score: number | null;
  createdAt: string | null;
}

export interface TaskSpec {
  title: string;
  body: string;
}

export function parseTask(d: Record<string, unknown>): TaskItem {
  const assignee = (d.assignee ?? {}) as Record<string, unknown>;
  return {
    id: strOf(d.id),
    title: strOf(d.title),
    description: typeof d.description === "string" ? d.description : null,
    status: strOf(d.status ?? "todo"),
    priority: typeof d.priority === "string" ? d.priority : null,
    storyPoints: d.storyPoints == null ? null : numOf(d.storyPoints),
    dueDate: dateOf(d.dueDate as string),
    version: numOf(d.version, 1),
    projectId: d.projectId == null ? null : strOf(d.projectId),
    sprintId: d.sprintId == null ? null : strOf(d.sprintId),
    assigneeId: d.assigneeId == null ? null : strOf(d.assigneeId),
    assigneeName: typeof assignee.displayName === "string" ? assignee.displayName : null,
    createdAt: dateOf(d.createdAt as string),
  };
}

export interface TaskQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  projectId?: string;
  sprintId?: string;
  sessionId?: string;
  assigneeId?: string;
  status?: string;
  priority?: string;
  mine?: boolean;
}

export function fetchTasks(query: TaskQuery = {}, signal?: AbortSignal) {
  return getJson(
    "/api/v1/tasks" + qs({
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
      search: query.search,
      projectId: query.projectId,
      sprintId: query.sprintId,
      sessionId: query.sessionId,
      assigneeId: query.assigneeId,
      status: query.status,
      priority: query.priority,
      mine: query.mine === true ? "true" : undefined,
    }),
    parsePaginated(parseTask),
    signal,
  );
}

export function fetchTask(id: string, signal?: AbortSignal): Promise<TaskItem> {
  return getJson(`/api/v1/tasks/${encodeURIComponent(id)}`, (data) => parseTask((data ?? {}) as Record<string, unknown>), signal);
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  projectId: string;
  sprintId?: string;
  assigneeId?: string;
  priority?: string;
  storyPoints?: number;
  dueDate?: string;
}

export function createTask(payload: CreateTaskPayload): Promise<TaskItem> {
  return sendJson("/api/v1/tasks", "POST", payload, (data) => parseTask((data ?? {}) as Record<string, unknown>));
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  sprintId?: string | null;
  assigneeId?: string | null;
  priority?: string;
  storyPoints?: number | null;
  dueDate?: string | null;
  status?: string;
  expectedVersion?: number;
}

export function updateTask(id: string, payload: UpdateTaskPayload): Promise<TaskItem> {
  return sendJson(`/api/v1/tasks/${encodeURIComponent(id)}`, "PATCH", payload, (data) => parseTask((data ?? {}) as Record<string, unknown>));
}

/** Intern tự chuyển trạng thái: todo→doing→review. */
export function updateMyTask(
  id: string,
  payload: { expectedVersion?: number; status?: string; progress?: number; reason?: string },
): Promise<TaskItem> {
  return sendJson(`/api/v1/tasks/${encodeURIComponent(id)}/my`, "PATCH", payload, (data) => parseTask((data ?? {}) as Record<string, unknown>));
}

export function deleteTask(id: string): Promise<void> {
  return sendJson(`/api/v1/tasks/${encodeURIComponent(id)}`, "DELETE", {}, () => undefined);
}

export function fetchTaskComments(taskId: string, signal?: AbortSignal): Promise<TaskComment[]> {
  return getJson(`/api/v1/tasks/${encodeURIComponent(taskId)}/comments`, (data) => {
    const d = (data ?? {}) as Record<string, unknown>;
    const arr = Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
    return arrOf(arr, (c) => {
      const r = (c ?? {}) as Record<string, unknown>;
      const author = (r.author ?? {}) as Record<string, unknown>;
      return {
        id: strOf(r.id),
        authorName: strOf(author.displayName ?? r.authorName, "—"),
        content: strOf(r.content),
        createdAt: dateOf(r.createdAt as string),
      };
    });
  }, signal);
}

export function addTaskComment(taskId: string, content: string): Promise<void> {
  return sendJson(`/api/v1/tasks/${encodeURIComponent(taskId)}/comments`, "POST", { content }, () => undefined);
}

export function fetchTaskHistory(taskId: string, signal?: AbortSignal): Promise<TaskHistoryEntry[]> {
  return getJson(`/api/v1/tasks/${encodeURIComponent(taskId)}/history`, (data) => {
    const d = (data ?? {}) as Record<string, unknown>;
    const arr = Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
    return arrOf(arr, (h) => {
      const r = (h ?? {}) as Record<string, unknown>;
      return {
        id: strOf(r.id),
        fromStatus: typeof r.fromStatus === "string" ? r.fromStatus : null,
        toStatus: typeof r.toStatus === "string" ? r.toStatus : null,
        actorName: typeof r.actorName === "string" ? r.actorName : null,
        note: typeof r.note === "string" ? r.note : null,
        createdAt: dateOf(r.createdAt as string),
      };
    });
  }, signal);
}

export function fetchTaskSpec(taskId: string, signal?: AbortSignal): Promise<TaskSpec> {
  return getJson(`/api/v1/tasks/${encodeURIComponent(taskId)}/spec`, (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    return {
      title: strOf(r.title, "Đề bài nhiệm vụ"),
      body: strOf(r.body ?? r.html ?? r.content),
    };
  }, signal);
}

/* ───────────────────────── Submissions ───────────────────────── */

export function parseSubmission(d: Record<string, unknown>): Submission {
  const intern = (d.intern ?? {}) as Record<string, unknown>;
  return {
    id: strOf(d.id),
    taskId: strOf(d.taskId),
    internName: typeof intern.displayName === "string" ? intern.displayName : null,
    prUrl: typeof d.prUrl === "string" ? d.prUrl : null,
    ref: typeof d.ref === "string" ? d.ref : null,
    summary: typeof d.summary === "string" ? d.summary : null,
    status: strOf(d.status ?? "submitted"),
    version: numOf(d.version, 1),
    submittedAt: dateOf(d.submittedAt as string),
    reviewedAt: dateOf(d.reviewedAt as string),
    score: d.score == null ? null : numOf(d.score),
    feedback: typeof d.feedback === "string" ? d.feedback : null,
  };
}

export function fetchTaskSubmissions(taskId: string, signal?: AbortSignal): Promise<Submission[]> {
  return getJson(`/api/v1/tasks/${encodeURIComponent(taskId)}/submissions`, (data) => {
    const d = (data ?? {}) as Record<string, unknown>;
    const arr = Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
    return arrOf(arr, (s) => parseSubmission((s ?? {}) as Record<string, unknown>));
  }, signal);
}

export function submitTask(
  taskId: string,
  payload: { prUrl: string; ref?: string; summary: string; version: number },
): Promise<Submission> {
  return sendJson(`/api/v1/tasks/${encodeURIComponent(taskId)}/submissions`, "POST", payload, (data) =>
    parseSubmission((data ?? {}) as Record<string, unknown>),
  );
}

export function withdrawSubmission(submissionId: string): Promise<void> {
  return sendJson(`/api/v1/submissions/${encodeURIComponent(submissionId)}/withdraw`, "POST", {}, () => undefined);
}

export interface ReviewRubric {
  functional: number;
  quality: number;
  testing: number;
  errors: number;
  security: number;
  dod: number;
}

export function reviewSubmission(
  submissionId: string,
  payload: { rubric: ReviewRubric; feedback: string; taskVersion: number; confirmedLatePenalty?: number; overrideReason?: string },
): Promise<Submission> {
  return sendJson(`/api/v1/submissions/${encodeURIComponent(submissionId)}/review`, "POST", payload, (data) =>
    parseSubmission((data ?? {}) as Record<string, unknown>),
  );
}

export function fetchCodeReviews(submissionId: string, signal?: AbortSignal): Promise<CodeReview[]> {
  return getJson(`/api/v1/submissions/${encodeURIComponent(submissionId)}/code-reviews`, (data) => {
    const d = (data ?? {}) as Record<string, unknown>;
    const arr = Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
    return arrOf(arr, (c) => {
      const r = (c ?? {}) as Record<string, unknown>;
      return {
        id: strOf(r.id),
        source: strOf(r.source, "ai"),
        status: strOf(r.status),
        findings: arrOf(r.findings, (f) => strOf(f)),
        score: r.score == null ? null : numOf(r.score),
        createdAt: dateOf(r.createdAt as string),
      };
    });
  }, signal);
}

export function rerunCodeReview(submissionId: string): Promise<void> {
  return sendJson(`/api/v1/submissions/${encodeURIComponent(submissionId)}/code-reviews`, "POST", {}, () => undefined);
}

/** Raw request cho các endpoint hiếm dùng (giữ linh hoạt cho view tổng hợp). */
export function rawApi(path: string, init?: RequestInit): Promise<Response> {
  return request(path, (r) => r as Response, init as never);
}
