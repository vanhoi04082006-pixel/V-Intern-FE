"use client";

/** Registry ADMIN — Task 5 sở hữu file này (trừ notifications/profile chung). */
import type { RouteDefinition } from "./route-types";
import { AdminDashboardView } from "@/components/views/admin/dashboard-view";
import { AdminUsersView } from "@/components/views/admin/users-view";
import { AdminQuestionsView } from "@/components/views/admin/questions-view";
import { AdminTemplatesView } from "@/components/views/admin/templates-view";
import { AdminSessionsView } from "@/components/views/admin/sessions-view";
import { AdminAiView } from "@/components/views/admin/ai-view";
import { AdminServicesView } from "@/components/views/admin/services-view";
import { AdminSettingsView } from "@/components/views/admin/settings-view";
import { AdminActivityView } from "@/components/views/admin/activity-view";
import { AdminAuditView } from "@/components/views/admin/audit-view";

export const adminRoutes: RouteDefinition[] = [
  { pattern: "/admin", component: AdminDashboardView },
  { pattern: "/admin/users", component: AdminUsersView },
  { pattern: "/admin/questions", component: AdminQuestionsView },
  { pattern: "/admin/templates", component: AdminTemplatesView },
  { pattern: "/admin/sessions", component: AdminSessionsView },
  { pattern: "/admin/ai", component: AdminAiView },
  { pattern: "/admin/services", component: AdminServicesView },
  { pattern: "/admin/settings", component: AdminSettingsView },
  { pattern: "/admin/activity", component: AdminActivityView },
  { pattern: "/admin/audit", component: AdminAuditView },
];
