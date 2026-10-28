/** Sprint board: /intern/me/sprint/board (intern) + /sprints/:id/board (instructor/admin). */

import { activeAssignmentOf, activeSprintOf, sprintProgress } from "../store";
import type { Task } from "../types";
import { notFound, route, type RouteDef, type Ctx } from "./common";
import { taskPublic } from "./tasks";

const COLUMN_ORDER: Task["status"][] = ["todo", "doing", "review", "done"];

function isOverdueOpen(t: Task): boolean {
  return t.status !== "done" && t.dueDate != null && new Date(t.dueDate).getTime() < Date.now();
}

function sprintPayload(ctx: Ctx, sprintId: string): Record<string, unknown> {
  const sprint = ctx.store.sprints.find((s) => s.id === sprintId);
  if (!sprint) throw notFound("Không tìm thấy sprint.");
  return {
    id: sprint.id,
    code: sprint.code,
    name: sprint.name,
    goal: sprint.goal,
    status: sprint.status,
    startDate: sprint.startDate,
    endDate: sprint.endDate,
    progress: sprintProgress(sprint.id),
  };
}

function boardColumns(tasks: Task[]): Record<string, unknown>[] {
  return COLUMN_ORDER.map((status) => {
    const items = tasks
      .filter((t) => t.status === status)
      .sort((a, b) => {
        const pa = a.dueDate ?? "9999";
        const pb = b.dueDate ?? "9999";
        return pa < pb ? -1 : pa > pb ? 1 : a.code < b.code ? -1 : 1;
      });
    return { status, count: items.length, tasks: items.map(taskPublic) };
  });
}

async function mySprintBoard(ctx: Ctx): Promise<unknown> {
  const assignment = activeAssignmentOf(ctx.user!.id);
  if (!assignment) {
    return {
      sprint: null,
      overdueOpenTaskCount: 0,
      columns: COLUMN_ORDER.map((status) => ({ status, count: 0, tasks: [] })),
    };
  }
  const sprint = activeSprintOf(assignment.sessionId);
  if (!sprint) throw notFound("Phiên thực tập chưa có sprint nào.");
  const myTasks = ctx.store.tasks.filter((t) => t.sprintId === sprint.id && t.assigneeId === ctx.user!.id);
  return {
    sprint: sprintPayload(ctx, sprint.id),
    overdueOpenTaskCount: myTasks.filter(isOverdueOpen).length,
    columns: boardColumns(myTasks),
  };
}

async function sprintBoard(ctx: Ctx): Promise<unknown> {
  const sprint = ctx.store.sprints.find((s) => s.id === ctx.params.id);
  if (!sprint) throw notFound("Không tìm thấy sprint.");
  const tasks = ctx.store.tasks.filter((t) => t.sprintId === sprint.id);
  return {
    sprint: sprintPayload(ctx, sprint.id),
    overdueOpenTaskCount: tasks.filter(isOverdueOpen).length,
    columns: boardColumns(tasks),
  };
}

export const sprintRoutes: RouteDef[] = [
  route("GET", "/intern/me/sprint/board", "intern", mySprintBoard),
  route("GET", "/sprints/:id/board", ["instructor", "admin"], sprintBoard),
];
