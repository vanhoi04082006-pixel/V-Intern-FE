import { request } from "./client";
import { parseAcademic, type AcademicKind } from "./academic";
import { transitionSprint } from "./management";

export interface ChecklistInput {
  sessionCount: number;
  projectsTotal: number;
  projectsActive: number;
  internCount: number;
  sprintCount: number;
  taskCount: number;
}

export interface ChecklistStep {
  key: "session" | "project" | "assign" | "sprint" | "task";
  label: string;
  hint: string;
  done: boolean;
  href: string;
}

/** Derive the 5 onboarding steps from real counts — never hardcoded complete. */
export function deriveChecklist(input: ChecklistInput): ChecklistStep[] {
  return [
    {
      key: "session",
      label: "Tạo phiên thực tập",
      hint: "Phiên chứa dự án và học viên",
      done: input.sessionCount > 0,
      href: "/instructor/sessions",
    },
    {
      key: "project",
      label: "Tạo hoặc kích hoạt dự án",
      hint: "Chỉ dự án đang hoạt động mới phân công được",
      done: input.projectsActive > 0,
      href: "/instructor/projects",
    },
    {
      key: "assign",
      label: "Phân công sinh viên",
      hint: "Sinh viên đã đạt tuyển dụng",
      done: input.internCount > 0,
      href: "/instructor",
    },
    {
      key: "sprint",
      label: "Tạo Sprint",
      hint: "Kích hoạt sprint để giao việc",
      done: input.sprintCount > 0,
      href: "/instructor/sprints",
    },
    {
      key: "task",
      label: "Tạo nhiệm vụ đầu tiên",
      hint: "Giao task cho sinh viên",
      done: input.taskCount > 0,
      href: "/instructor/sprints",
    },
  ];
}

export type ActivatableKind = "sessions" | "projects" | "sprints";

type PatchDeps = {
  patch: (
    kind: ActivatableKind,
    id: string,
    body: { status: string },
  ) => Promise<{ status: string }>;
  transition?: (id: string, status: string) => Promise<{ status: string }>;
};

/**
 * One-click activation.
 * Sessions/projects: PATCH status=active only (update DTOs accept partial
 * bodies). Sprints: real state-machine transition via the backend contract.
 * Every other rule stays authoritative in the backend, whose domain error
 * propagates untouched for the UI to display.
 */
export function activateAcademic(
  kind: ActivatableKind,
  id: string,
  deps: PatchDeps = {
    patch: (k, entityId, body) =>
      request(
        `/${k}/${encodeURIComponent(entityId)}`,
        (v) => ({ status: parseAcademic(v).status }),
        { method: "PATCH", body },
      ),
    transition: transitionSprint,
  },
): Promise<{ status: string }> {
  if (kind === "sprints") {
    if (!deps.transition) throw new Error("Sprint transition unavailable.");
    return deps.transition(id, "active");
  }
  return deps.patch(kind, id, { status: "active" });
}

/** Non-terminal statuses that may still be activated from the UI. */
export function canActivate(kind: ActivatableKind, status: string): boolean {
  if (status === "active" || status === "archived" || status === "cancelled" || status === "completed") return false;
  if (kind === "sprints") return status === "planned";
  if (kind === "projects") return status === "draft" || status === "recruiting" || status === "paused";
  return status === "upcoming" || status === "paused" || status === "ending";
}

export type { AcademicKind };
