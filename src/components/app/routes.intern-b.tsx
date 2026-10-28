"use client";

/** Registry INTERN-B (work/sprint/project/mentor) — Task 2-b sở hữu file này. */
import type { RouteDefinition } from "./route-types";
import { WorkView } from "@/components/views/intern/work/work-view";
import { TaskDetailView } from "@/components/views/intern/work/task-detail-view";
import { SprintView } from "@/components/views/intern/sprint/sprint-view";
import { ProjectView } from "@/components/views/intern/project/project-view";
import { MentorView } from "@/components/views/intern/mentor/mentor-view";

export const internBRoutes: RouteDefinition[] = [
  { pattern: "/intern/work/:id", component: TaskDetailView },
  { pattern: "/intern/work", component: WorkView },
  { pattern: "/intern/sprint", component: SprintView },
  { pattern: "/intern/project", component: ProjectView },
  { pattern: "/intern/mentor", component: MentorView },
];
