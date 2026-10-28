/** Intern workspace: GET /intern/me/workspace — tính từ dữ liệu thật của intern. */

import {
  activeAssignmentOf,
  activeSprintOf,
  assignmentHistoryOf,
  getRecruitment,
  sprintProgress,
  tasksOfUser,
  unreadNotificationCount,
} from "../store";
import type { Task } from "../types";
import { notFound, route, type RouteDef, type Ctx } from "./common";

const PRIORITY_WEIGHT: Record<Task["priority"], number> = { critical: 4, high: 3, medium: 2, low: 1 };
const STATUS_RANK: Record<Task["status"], number> = { doing: 0, review: 1, todo: 2, done: 3 };

function resourceOf(id: string, code: string, name: string, status: string, extra: Record<string, unknown> = {}) {
  return { id, code, name, status, ...extra };
}

async function workspace(ctx: Ctx): Promise<unknown> {
  if (!ctx.user) throw notFound();
  const userId = ctx.user.id;
  const store = ctx.store;

  const assignment = activeAssignmentOf(userId);
  const history = assignmentHistoryOf(userId);
  const recruitment = getRecruitment(userId);

  let status: string;
  if (assignment) {
    status = "active";
  } else if (recruitment.status === "passed") {
    status = "unassigned";
  } else if (recruitment.status === "interview_in_progress" || recruitment.status === "evaluation_pending") {
    status = "recruitment_in_progress";
  } else if (recruitment.status === "failed") {
    status = "recruitment_failed";
  } else {
    status = "recruitment_required";
  }

  const project = assignment ? store.projects.find((p) => p.id === assignment.projectId) : undefined;
  const session = assignment ? store.sessions.find((s) => s.id === assignment.sessionId) : undefined;

  let currentSprint: Record<string, unknown> | null = null;
  if (session) {
    const sprint = activeSprintOf(session.id);
    if (sprint) {
      currentSprint = {
        id: sprint.id,
        code: sprint.code,
        name: sprint.name,
        status: sprint.status,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        progress: sprintProgress(sprint.id),
      };
    }
  }

  // taskSummary — ĐẾM từ tasks thật của intern
  const myTasks = tasksOfUser(userId);
  const taskSummary = {
    todo: myTasks.filter((t) => t.status === "todo").length,
    doing: myTasks.filter((t) => t.status === "doing").length,
    review: myTasks.filter((t) => t.status === "review").length,
    done: myTasks.filter((t) => t.status === "done").length,
    total: myTasks.length,
  };

  // focusedTask: task đang làm quan trọng nhất (doing > review > todo, ưu tiên priority, hạn gần nhất)
  const open = myTasks
    .filter((t) => t.status !== "done")
    .sort((a, b) => {
      const r = STATUS_RANK[a.status] - STATUS_RANK[b.status];
      if (r !== 0) return r;
      const p = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      if (p !== 0) return p;
      return (a.dueDate ?? "9999") < (b.dueDate ?? "9999") ? -1 : 1;
    });
  const focused = open[0];

  return {
    status,
    hasAssignmentHistory: history.length > 0,
    assignment: assignment
      ? {
          id: assignment.id,
          assignedAt: assignment.assignedAt,
          role: assignment.role,
          project: project
            ? resourceOf(project.id, project.code, project.name, project.status, {
                description: project.description,
                techStack: project.techStack,
              })
            : null,
          session: session
            ? resourceOf(session.id, session.code, session.name, session.status, {
                startDate: session.startDate,
                endDate: session.endDate,
              })
            : null,
        }
      : null,
    recruitment: {
      status: recruitment.status,
      selectedRole: recruitment.selectedRole,
      attemptCount: recruitment.attemptCount,
      recruitedAt: recruitment.recruitedAt,
    },
    currentSprint,
    taskSummary,
    focusedTask: focused
      ? {
          id: focused.id,
          code: focused.code,
          title: focused.title,
          status: focused.status,
          priority: focused.priority,
          dueDate: focused.dueDate,
          progress: focused.progress,
        }
      : null,
    notificationsUnread: unreadNotificationCount(userId),
  };
}

export const workspaceRoutes: RouteDef[] = [
  route("GET", "/intern/me/workspace", "intern", workspace),
];
