"use client";

/**
 * Registry OUTCOMES + trang dùng chung mọi role — Task 3 sở hữu file này.
 * Gồm: intern outcomes (evaluations, performance, kpi, virtual-salary,
 * certificates, recommendations) + shared pages cho CẢ 3 role
 * (notifications, profile, github).
 */
import type { RouteDefinition } from "./route-types";
import {
  EvaluationsView,
  EvaluationDetailView,
} from "@/components/views/intern/outcomes/evaluations";
import { PerformanceView } from "@/components/views/intern/outcomes/performance";
import { KpiListView, KpiDetailView } from "@/components/views/intern/outcomes/kpi";
import { VirtualSalaryView } from "@/components/views/intern/outcomes/virtual-salary";
import {
  CertificatesView,
  CertificateDetailView,
} from "@/components/views/intern/outcomes/certificates";
import { RecommendationsView } from "@/components/views/intern/outcomes/recommendations";
import { NotificationsView } from "@/components/views/shared/notifications-view";
import { ProfileView } from "@/components/views/shared/profile-view";
import { GithubView } from "@/components/views/shared/github-view";

export const outcomeRoutes: RouteDefinition[] = [
  { pattern: "/intern/evaluations", component: EvaluationsView },
  { pattern: "/intern/evaluations/:id", component: EvaluationDetailView },
  { pattern: "/intern/performance", component: PerformanceView },
  { pattern: "/intern/kpi", component: KpiListView },
  { pattern: "/intern/kpi/:id", component: KpiDetailView },
  { pattern: "/intern/virtual-salary", component: VirtualSalaryView },
  { pattern: "/intern/certificates", component: CertificatesView },
  { pattern: "/intern/certificates/:id", component: CertificateDetailView },
  { pattern: "/intern/recommendations", component: RecommendationsView },
  // Shared pages — đăng ký cho cả 3 role, trỏ cùng component
  { pattern: "/intern/notifications", component: NotificationsView },
  { pattern: "/instructor/notifications", component: NotificationsView },
  { pattern: "/admin/notifications", component: NotificationsView },
  { pattern: "/intern/github", component: GithubView },
  { pattern: "/instructor/github", component: GithubView },
  { pattern: "/intern/profile", component: ProfileView },
  { pattern: "/instructor/profile", component: ProfileView },
  { pattern: "/admin/profile", component: ProfileView },
];
