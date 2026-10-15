import { request } from "./client";
import * as p from "./parse";
export const ROLE_LABELS = {
  frontend: "Frontend Developer",
  backend: "Backend Developer",
  fullstack: "Fullstack Developer",
  qa: "QA Tester",
  business_analyst: "Business Analyst",
} as const;
export type RecruitmentRole = keyof typeof ROLE_LABELS;
export const WORKSPACE_STATUSES = [
  "recruitment_required",
  "recruitment_in_progress",
  "recruitment_failed",
  "unassigned",
  "active",
] as const;
export interface AssignmentResource {
  id: string;
  code: string;
  name: string;
  status: string;
}
export interface InternWorkspace {
  status: (typeof WORKSPACE_STATUSES)[number];
  assignment: {
    id: string;
    assignedAt: string;
    project: AssignmentResource;
    session: AssignmentResource;
  } | null;
  recruitment: {
    status: string;
    selectedRole: string | null;
    attemptCount: number;
    recruitedAt: string | null;
  } | null;
  currentSprint: {
    id: string;
    code: string;
    name: string;
    status: string;
    startDate: string;
    endDate: string;
  } | null;
  taskSummary: {
    todo: number;
    doing: number;
    review: number;
    done: number;
    total: number;
  };
  focusedTask: {
    id: string;
    code: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
    progress: number;
  } | null;
}
function resource(value: unknown): AssignmentResource {
  const v = p.record(value);
  return {
    id: p.string(v.id),
    code: p.string(v.code),
    name: p.string(v.name),
    status: p.string(v.status),
  };
}
export function parseWorkspace(value: unknown): InternWorkspace {
  const v = p.record(value);
  const t = p.record(v.taskSummary);
  const result: InternWorkspace = {
    status: p.oneOf(v.status, WORKSPACE_STATUSES),
    assignment: p.nullable(v.assignment, (x) => {
      const a = p.record(x);
      return {
        id: p.string(a.id),
        assignedAt: p.string(a.assignedAt),
        project: resource(a.project),
        session: resource(a.session),
      };
    }),
    recruitment: p.nullable(v.recruitment, (x) => {
      const r = p.record(x);
      return {
        status: p.string(r.status),
        selectedRole: p.nullable(r.selectedRole, p.string),
        attemptCount: p.number(r.attemptCount),
        recruitedAt: p.nullable(r.recruitedAt, p.string),
      };
    }),
    currentSprint: p.nullable(v.currentSprint, (x) => {
      const s = p.record(x);
      return {
        ...resource(s),
        startDate: p.string(s.startDate),
        endDate: p.string(s.endDate),
      };
    }),
    taskSummary: {
      todo: p.number(t.todo),
      doing: p.number(t.doing),
      review: p.number(t.review),
      done: p.number(t.done),
      total: p.number(t.total),
    },
    focusedTask: p.nullable(v.focusedTask, (x) => {
      const f = p.record(x);
      return {
        id: p.string(f.id),
        code: p.string(f.code),
        title: p.string(f.title),
        status: p.string(f.status),
        priority: p.string(f.priority),
        dueDate: p.nullable(f.dueDate, p.string),
        progress: p.number(f.progress),
      };
    }),
  };
  if (
    (result.status === "active" && !result.assignment) ||
    ((result.status === "active" || result.status === "unassigned") &&
      result.recruitment?.status !== "passed")
  )
    p.invalid();
  if (
    result.status !== "active" &&
    (result.assignment ||
      result.currentSprint ||
      result.focusedTask ||
      result.taskSummary.total !== 0)
  )
    p.invalid();
  return result;
}
export const getWorkspace = (signal?: AbortSignal) =>
  request("/intern/me/workspace", parseWorkspace, { signal });
/** Exhaustive routing: recruitment is resolved before either workspace is rendered. */
export function lifecyclePath(workspace: InternWorkspace): string {
  switch (workspace.status) {
    case "recruitment_required":
      return workspace.recruitment?.selectedRole
        ? "/intern/onboarding/role"
        : "/intern/onboarding";
    case "recruitment_in_progress":
      return workspace.recruitment?.status === "evaluation_pending"
        ? "/intern/onboarding/result"
        : "/intern/onboarding/interview";
    case "recruitment_failed":
      return "/intern/onboarding/result";
    case "unassigned":
    case "active":
      return "/intern";
    default:
      return assertNever(workspace.status);
  }
}
function assertNever(value: never): never {
  return p.invalid();
  void value;
}
export function roleLabel(code: string | null): string {
  return code
    ? (Object.entries(ROLE_LABELS).find(([key]) => key === code)?.[1] ?? code)
    : "Chưa chọn";
}
