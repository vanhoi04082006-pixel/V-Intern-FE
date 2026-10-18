import { request } from "./client";
import {
  array,
  nullable,
  number,
  oneOf,
  parsePage,
  record,
  string,
} from "./parse";
export const taskStatuses = ["todo", "doing", "review", "done"] as const;
export type TaskStatus = (typeof taskStatuses)[number];
export const statusLabels: Record<TaskStatus, string> = {
  todo: "Cần làm",
  doing: "Đang làm",
  review: "Chờ duyệt",
  done: "Hoàn thành",
};
export const priorities = ["low", "medium", "high", "critical"] as const;
export const priorityLabels = { low: 'Thấp', medium: 'Trung bình', high: 'Cao', critical: 'Khẩn cấp' } as const;
export function parseBoardTask(value: unknown) {
  const v = record(value);
  return {
    id: string(v.id),
    code: string(v.code),
    title: string(v.title),
    description: v.description == null ? null : string(v.description),
    storyPoints: v.storyPoints == null ? null : number(v.storyPoints),
    status: oneOf(v.status, taskStatuses),
    priority: oneOf(v.priority, priorities),
    progress: number(v.progress),
    dueDate: nullable(v.dueDate, string),
    assigneeId: nullable(v.assigneeId, string),
  };
}
export function parseTask(value: unknown) {
  const v = record(value);
  const sprint = v.sprint == null ? null : record(v.sprint);
  const repository = v.repository == null ? null : record(v.repository);
  return {
    ...parseBoardTask(v),
    description: nullable(v.description, string),
    projectId: string(v.projectId),
    sprintId: nullable(v.sprintId, string),
    storyPoints: nullable(v.storyPoints, number),
    version: number(v.version),
    ...(sprint ? { sprint: { id: string(sprint.id), code: string(sprint.code), name: string(sprint.name), status: string(sprint.status) } } : {}),
    ...(v.repository !== undefined ? { repository: repository ? { status: oneOf(repository.status, ['provisioning', 'ready', 'failed'] as const), fullName: string(repository.fullName) } : null } : {}),
  };
}
export type Task = ReturnType<typeof parseTask>;
export function nextOwnStatus(status: TaskStatus): TaskStatus | null {
  return status === "todo" ? "doing" : status === "doing" ? "review" : null;
}
export function parseComment(value: unknown) {
  const v = record(value);
  return {
    id: string(v.id),
    content: string(v.content),
    authorId: nullable(v.authorId, string),
    createdAt: string(v.createdAt),
  };
}
export function parseHistory(value: unknown) {
  const v = record(value);
  return {
    id: string(v.id),
    fromStatus: nullable(v.fromStatus, (x) => oneOf(x, taskStatuses)),
    toStatus: oneOf(v.toStatus, taskStatuses),
    changedById: nullable(v.changedById, string),
    reason: nullable(v.reason, string),
    createdAt: string(v.createdAt),
  };
}
export function parseBoard(value: unknown) {
  const v = record(value),
    s = record(v.sprint);
  return {
    sprint: {
      id: string(s.id),
      code: string(s.code),
      name: string(s.name),
      status: string(s.status),
      projectId: string(s.projectId),
      ...(s.sessionId === undefined ? {} : { sessionId: nullable(s.sessionId, string) }),
      ...(s.goal === undefined ? {} : { goal: nullable(s.goal, string) }),
      ...(s.description === undefined ? {} : { description: nullable(s.description, string) }),
      startDate: string(s.startDate),
      endDate: string(s.endDate),
    },
    total: number(v.total),
    ...(v.overdueOpenTaskCount === undefined ? {} : { overdueOpenTaskCount: number(v.overdueOpenTaskCount) }),
    columns: array(v.columns, (value) => {
      const c = record(value);
      return {
        status: oneOf(c.status, taskStatuses),
        count: number(c.count),
        tasks: array(c.tasks, parseBoardTask),
      };
    }),
  };
}
export function parseProject(value: unknown) {
  const v = record(value);
  return {
    id: string(v.id),
    code: string(v.code),
    name: string(v.name),
    description: string(v.description),
    status: string(v.status),
    difficulty: string(v.difficulty),
    mentorId: nullable(v.mentorId, string),
    capacity: nullable(v.capacity, number),
    startDate: nullable(v.startDate, string),
    endDate: nullable(v.endDate, string),
    technologies: array(v.technologies, string),
  };
}
export const listTasks = (query: URLSearchParams, signal?: AbortSignal) =>
  request(`/tasks?${query}`, (value) => parsePage(value, parseTask), {
    signal,
  });
export const getTask = (id: string, signal?: AbortSignal) =>
  request(`/tasks/${encodeURIComponent(id)}`, parseTask, { signal });
export const getComments = (id: string, page = 1, signal?: AbortSignal) =>
  request(
    `/tasks/${encodeURIComponent(id)}/comments?page=${page}&pageSize=20`,
    (value) => parsePage(value, parseComment),
    { signal },
  );
export const getHistory = (id: string, page = 1, signal?: AbortSignal) =>
  request(
    `/tasks/${encodeURIComponent(id)}/history?page=${page}&pageSize=20`,
    (value) => parsePage(value, parseHistory),
    { signal },
  );
export const addTaskComment = (id: string, content: string) =>
  request(`/tasks/${encodeURIComponent(id)}/comments`, parseComment, {
    method: "POST",
    body: { content },
  });
export const updateOwnTask = (
  id: string,
  body: {
    status?: TaskStatus;
    progress?: number;
    reason?: string;
    expectedVersion?: number;
  },
) =>
  request(`/tasks/${encodeURIComponent(id)}/my`, parseTask, {
    method: "PATCH",
    body,
  });
export const getBoard = (id: string, signal?: AbortSignal) =>
  request(`/sprints/${encodeURIComponent(id)}/board`, parseBoard, { signal });
export const getProject = (id: string, signal?: AbortSignal) =>
  request(`/projects/${encodeURIComponent(id)}`, parseProject, { signal });
export const getOwnBoard = (signal?: AbortSignal) =>
  request("/intern/me/sprint/board?pageSize=100", parseBoard, { signal });
export const getOwnProject = (signal?: AbortSignal) =>
  request("/intern/me/project", parseProject, { signal });
