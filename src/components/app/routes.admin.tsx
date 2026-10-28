"use client";

/**
 * Registry ADMIN — task 3-c bổ sung 11 nhóm: career-roles, knowledge,
 * communications, performance, reports, sprints, tasks, users v2, groups,
 * roles, catalogs. Notifications/profile đã do routes.outcomes.tsx chung.
 */
import type { RouteDefinition } from "./route-types";
import { AdminDashboardView } from "@/components/views/admin/dashboard-view";
import { AdminUsersViewV2 } from "@/components/views/admin/users-view-v2";
import { AdminQuestionsView } from "@/components/views/admin/questions-view";
import { AdminTemplatesView } from "@/components/views/admin/templates-view";
import { AdminSessionsView } from "@/components/views/admin/sessions-view";
import { AdminAiView } from "@/components/views/admin/ai-view";
import { AdminServicesView } from "@/components/views/admin/services-view";
import { AdminSettingsView } from "@/components/views/admin/settings-view";
import { AdminActivityView } from "@/components/views/admin/activity-view";
import { AdminAuditView } from "@/components/views/admin/audit-view";
import { AdminCareerRoles } from "@/components/views/admin/career-roles-view";
import { AdminKnowledge } from "@/components/views/admin/knowledge-view";
import { AdminCommunications } from "@/components/views/admin/communications-view";
import { AdminPerformance } from "@/components/views/admin/performance-view";
import { AdminReports } from "@/components/views/admin/reports-view";
import { AdminSprints } from "@/components/views/admin/sprints-view";
import { AdminTasks } from "@/components/views/admin/tasks-view";
import { AdminGroups } from "@/components/views/admin/groups-view";
import { AdminRoles } from "@/components/views/admin/roles-view";
import { AdminCatalogs } from "@/components/views/admin/catalogs-view";

export const adminRoutes: RouteDefinition[] = [
  { pattern: "/admin", component: AdminDashboardView },
  { pattern: "/admin/users", component: AdminUsersViewV2 },
  { pattern: "/admin/questions", component: AdminQuestionsView },
  { pattern: "/admin/templates", component: AdminTemplatesView },
  { pattern: "/admin/sessions", component: AdminSessionsView },
  { pattern: "/admin/career-roles", component: AdminCareerRoles },
  { pattern: "/admin/knowledge", component: AdminKnowledge },
  { pattern: "/admin/tasks", component: AdminTasks },
  { pattern: "/admin/sprints", component: AdminSprints },
  { pattern: "/admin/performance", component: AdminPerformance },
  { pattern: "/admin/reports", component: AdminReports },
  { pattern: "/admin/communications", component: AdminCommunications },
  { pattern: "/admin/groups", component: AdminGroups },
  { pattern: "/admin/roles", component: AdminRoles },
  { pattern: "/admin/catalogs", component: AdminCatalogs },
  { pattern: "/admin/ai", component: AdminAiView },
  { pattern: "/admin/services", component: AdminServicesView },
  { pattern: "/admin/settings", component: AdminSettingsView },
  { pattern: "/admin/activity", component: AdminActivityView },
  { pattern: "/admin/audit", component: AdminAuditView },
];
