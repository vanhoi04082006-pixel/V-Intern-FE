/**
 * Bảng route tổng của backend mock V-Intern.
 *
 * 1-a-1: auth, workspace, recruitment, tasks, sprints, submissions, mentor.
 * 1-a-2: outcomes, notifications, github, profile, templates, sessions,
 * plans, candidates, evaluations, performance, reports, admin.
 */

import type { RouteDef } from "./common";
import { authRoutes } from "./auth";
import { workspaceRoutes } from "./workspace";
import { recruitmentRoutes } from "./recruitment";
import { taskRoutes } from "./tasks";
import { sprintRoutes } from "./sprints";
import { submissionRoutes } from "./submissions";
import { mentorRoutes } from "./mentor";
import { outcomeRoutes } from "./outcomes";
import { notificationRoutes } from "./notifications";
import { githubRoutes } from "./github";
import { profileRoutes } from "./profile";
import { templateRoutes } from "./templates";
import { sessionRoutes } from "./sessions";
import { planRoutes } from "./plans";
import { candidateRoutes } from "./candidates";
import { evaluationRoutes } from "./evaluations";
import { performanceRoutes } from "./performance";
import { reportRoutes } from "./reports";
import { adminRoutes } from "./admin";

export const allRoutes: RouteDef[] = [
  ...authRoutes,
  ...workspaceRoutes,
  ...recruitmentRoutes,
  ...taskRoutes,
  ...sprintRoutes,
  ...submissionRoutes,
  ...mentorRoutes,
  ...outcomeRoutes,
  ...notificationRoutes,
  ...githubRoutes,
  ...profileRoutes,
  ...templateRoutes,
  ...sessionRoutes,
  ...planRoutes,
  ...candidateRoutes,
  ...evaluationRoutes,
  ...performanceRoutes,
  ...reportRoutes,
  ...adminRoutes,
];
