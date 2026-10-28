"use client";

/**
 * Registry INSTRUCTOR — Task 4 sở hữu file này (trừ notifications/profile/github
 * đã do routes.outcomes.tsx đăng ký chung 3 role).
 */
import type { RouteDefinition } from "./route-types";
import { InstructorHome } from "@/components/views/instructor/home";
import { InstructorTemplates } from "@/components/views/instructor/templates";
import { InstructorTemplateDetail } from "@/components/views/instructor/template-detail";
import { InstructorSessions } from "@/components/views/instructor/sessions";
import { InstructorSessionDetail } from "@/components/views/instructor/session-detail";
import { InstructorSprints } from "@/components/views/instructor/sprints";
import { SprintWorkspace } from "@/components/views/instructor/sprint-workspace";
import { InstructorEvaluations } from "@/components/views/instructor/evaluations";
import { InstructorPerformance } from "@/components/views/instructor/performance";
import { InstructorReports } from "@/components/views/instructor/reports";

export const instructorRoutes: RouteDefinition[] = [
  { pattern: "/instructor", component: InstructorHome },
  { pattern: "/instructor/projects", component: InstructorTemplates },
  { pattern: "/instructor/projects/:id", component: InstructorTemplateDetail },
  { pattern: "/instructor/sessions", component: InstructorSessions },
  { pattern: "/instructor/sessions/:id", component: InstructorSessionDetail },
  { pattern: "/instructor/sprints", component: InstructorSprints },
  { pattern: "/instructor/sprints/:id", component: SprintWorkspace },
  { pattern: "/instructor/evaluations", component: InstructorEvaluations },
  { pattern: "/instructor/performance", component: InstructorPerformance },
  { pattern: "/instructor/reports", component: InstructorReports },
];
