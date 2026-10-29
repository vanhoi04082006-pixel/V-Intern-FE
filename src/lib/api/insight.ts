"use client";

/**
 * Domain API: Dashboards, performance, reports, notifications, GitHub cá nhân,
 * AI generation (sprint plan), health check.
 */

import { getJson, sendJson, arrOf, dateOf, numOf, strOf, qs, parsePaginated, downloadFile } from "@/lib/api/client";

/* ─────────────────────────── Dashboards ─────────────────────────── */

export interface AdminDashboardData {
  totalUsers: number;
  activeSessions: number;
  openTasks: number;
  pendingEvaluations: number;
  recentAudit: { id: string; action: string; actorName: string | null; createdAt: string | null }[];
}

export function fetchAdminDashboard(signal?: AbortSignal): Promise<AdminDashboardData> {
  return getJson("/api/v1/dashboard/admin", (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    const audit = (r.recentAudit ?? r.audit ?? []) as unknown[];
    return {
      totalUsers: numOf(r.totalUsers),
      activeSessions: numOf(r.activeSessions),
      openTasks: numOf(r.openTasks),
      pendingEvaluations: numOf(r.pendingEvaluations),
      recentAudit: arrOf(audit, (a) => {
        const ar = (a ?? {}) as Record<string, unknown>;
        const actor = (ar.actor ?? {}) as Record<string, unknown>;
        return { id: strOf(ar.id), action: strOf(ar.action), actorName: typeof actor.displayName === "string" ? actor.displayName : null, createdAt: dateOf(ar.createdAt as string) };
      }),
    };
  }, signal);
}

export interface InstructorDashboardData {
  activeSessions: number;
  totalInterns: number;
  openTasks: number;
  submissionsPending: number;
  upcomingEvaluations: number;
  sessionSummaries: { id: string; name: string; status: string; internCount: number; openTasks: number }[];
}

export function fetchInstructorDashboard(signal?: AbortSignal): Promise<InstructorDashboardData> {
  return getJson("/api/v1/dashboard/instructor", (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    return {
      activeSessions: numOf(r.activeSessions),
      totalInterns: numOf(r.totalInterns),
      openTasks: numOf(r.openTasks),
      submissionsPending: numOf(r.submissionsPending),
      upcomingEvaluations: numOf(r.upcomingEvaluations),
      sessionSummaries: arrOf(r.sessionSummaries ?? r.sessions, (s) => {
        const sr = (s ?? {}) as Record<string, unknown>;
        return { id: strOf(sr.id), name: strOf(sr.name), status: strOf(sr.status), internCount: numOf(sr.internCount), openTasks: numOf(sr.openTasks) };
      }),
    };
  }, signal);
}

/* ─────────────────────────── Performance ─────────────────────────── */

export interface InternPerformance {
  userId: string;
  displayName: string;
  email: string;
  taskCompletionRate: number | null;
  storyPointCompletionRate: number | null;
  onTimeCompletionRate: number | null;
  overdueOpenTaskCount: number;
  averageEvaluationScore: number | null;
}

export function fetchInternPerformances(query: { q?: string; sort?: string; page?: number } = {}, signal?: AbortSignal) {
  return getJson(
    "/api/v1/performance/interns" + qs({ q: query.q, sort: query.sort, page: query.page ?? 1, pageSize: 20 }),
    parsePaginated((d) => {
      const r = (d ?? {}) as Record<string, unknown>;
      return {
        userId: strOf(r.userId ?? r.id),
        displayName: strOf(r.displayName),
        email: strOf(r.email),
        taskCompletionRate: r.taskCompletionRate == null ? null : numOf(r.taskCompletionRate),
        storyPointCompletionRate: r.storyPointCompletionRate == null ? null : numOf(r.storyPointCompletionRate),
        onTimeCompletionRate: r.onTimeCompletionRate == null ? null : numOf(r.onTimeCompletionRate),
        overdueOpenTaskCount: numOf(r.overdueOpenTaskCount),
        averageEvaluationScore: r.averageEvaluationScore == null ? null : numOf(r.averageEvaluationScore),
      } as InternPerformance;
    }),
    signal,
  );
}

/* ─────────────────────────── Reports ─────────────────────────── */

export interface ReportSnapshot {
  id: string;
  title: string;
  kind: string;
  createdAt: string | null;
}

export function fetchReports(query: { projectId?: string; sessionId?: string; kind?: string; page?: number } = {}, signal?: AbortSignal) {
  return getJson("/api/v1/reports" + qs({ projectId: query.projectId, sessionId: query.sessionId, kind: query.kind, page: query.page ?? 1, pageSize: 20 }), parsePaginated((d) => {
    const r = (d ?? {}) as Record<string, unknown>;
    return { id: strOf(r.id), title: strOf(r.title), kind: strOf(r.kind, "progress"), createdAt: dateOf(r.createdAt as string) } as ReportSnapshot;
  }), signal);
}

export function createReport(payload: { requestId: string; title: string; kind: string; projectId: string; sessionId?: string; sprintId?: string; studentId?: string }): Promise<ReportSnapshot> {
  return sendJson("/api/v1/reports", "POST", payload, (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    return { id: strOf(r.id), title: strOf(r.title), kind: strOf(r.kind), createdAt: dateOf(r.createdAt as string) };
  });
}

export function downloadReportPdf(id: string): Promise<Blob> {
  return downloadFile(`/api/v1/reports/${encodeURIComponent(id)}/pdf`, "pdf");
}

export function downloadReportXlsx(id: string): Promise<Blob> {
  return downloadFile(`/api/v1/reports/${encodeURIComponent(id)}/xlsx`, "xlsx");
}

/* ─────────────────────────── Notifications ─────────────────────────── */

export interface NotificationItem {
  id: string;
  category: string;
  title: string;
  body: string | null;
  read: boolean;
  createdAt: string | null;
}

export function parseNotification(d: Record<string, unknown>): NotificationItem {
  return {
    id: strOf(d.id),
    category: strOf(d.category, "general"),
    title: strOf(d.title),
    body: typeof d.body === "string" ? d.body : null,
    read: d.read === true,
    createdAt: dateOf(d.createdAt as string),
  };
}

export function fetchNotifications(query: { unread?: boolean; page?: number } = {}, signal?: AbortSignal) {
  return getJson("/api/v1/notifications" + qs({ unread: query.unread === true ? "true" : undefined, page: query.page ?? 1, pageSize: 20 }), parsePaginated(parseNotification), signal);
}

export function fetchUnreadCount(signal?: AbortSignal): Promise<number> {
  return getJson("/api/v1/notifications/unread-count", (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    return numOf(r.count);
  }, signal);
}

export function markNotificationRead(id: string): Promise<void> {
  return sendJson(`/api/v1/notifications/${encodeURIComponent(id)}/read`, "POST", {}, () => undefined);
}

export function markAllNotificationsRead(): Promise<void> {
  return sendJson("/api/v1/notifications/read-all", "POST", {}, () => undefined);
}

export function fetchNotificationPreferences(signal?: AbortSignal): Promise<Record<string, boolean>> {
  return getJson("/api/v1/notifications/preferences", (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    const prefs = (r.preferences ?? r) as Record<string, unknown>;
    const out: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(prefs)) {
      if (typeof v === "boolean") out[k] = v;
    }
    return out;
  }, signal);
}

export function setNotificationPreference(category: string, enabled: boolean): Promise<void> {
  return sendJson("/api/v1/notifications/preferences", "PUT", { category, enabled }, () => undefined);
}

/* ─────────────────────────── GitHub cá nhân ─────────────────────────── */

export interface MyGitHubStatus {
  connected: boolean;
  login: string | null;
}

export function fetchMyGitHub(signal?: AbortSignal): Promise<MyGitHubStatus> {
  return getJson("/api/v1/github/me", (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    return { connected: r.connected === true, login: typeof r.login === "string" ? r.login : null };
  }, signal);
}

export function startGitHubConnect(): Promise<{ authorizeUrl: string }> {
  return sendJson("/api/v1/github/connect", "POST", {}, (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    return { authorizeUrl: strOf(r.authorizeUrl) };
  });
}

export function disconnectGitHub(): Promise<void> {
  return sendJson("/api/v1/github/me", "DELETE", {}, () => undefined);
}

/* ─────────────────────────── AI generation (sprint plan) ─────────────── */

export interface SprintPlanDraftTask {
  title: string;
  storyPoints: number;
  priority: string;
}

export interface SprintPlanDraft {
  planId: string;
  requestId: string;
  sprints: { name: string; goal: string; tasks: SprintPlanDraftTask[] }[];
  warnings: string[];
}

export function draftSprintPlan(payload: { projectId: string; sessionId: string; sprintCount?: number; startDate?: string }): Promise<SprintPlanDraft> {
  return sendJson("/api/v1/ai-generations/sprint-plan/draft", "POST", payload, (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    return {
      planId: strOf(r.planId),
      requestId: strOf(r.requestId),
      sprints: arrOf(r.sprints, (s) => {
        const sr = (s ?? {}) as Record<string, unknown>;
        return {
          name: strOf(sr.name),
          goal: strOf(sr.goal),
          tasks: arrOf(sr.tasks, (t) => {
            const tr = (t ?? {}) as Record<string, unknown>;
            return { title: strOf(tr.title), storyPoints: numOf(tr.storyPoints), priority: strOf(tr.priority, "medium") };
          }),
        };
      }),
      warnings: arrOf(r.warnings, (w) => strOf(w)),
    };
  });
}

export function confirmSprintPlan(payload: { projectId: string; sessionId: string; draft: unknown; requestId: string; planId?: string }): Promise<{ created: number }> {
  return sendJson("/api/v1/ai-generations/sprint-plan/confirm", "POST", payload, (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    return { created: numOf(r.created) };
  });
}

/* ─────────────────────────── Health ─────────────────────────── */

export interface HealthStatus {
  status: string;
  database: string;
  ai: string;
  uptimeSeconds: number;
}

export function fetchHealth(signal?: AbortSignal): Promise<HealthStatus> {
  return getJson("/api/v1/health", (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    const checks = (r.checks ?? {}) as Record<string, unknown>;
    return {
      status: strOf(r.status, "unknown"),
      database: strOf(checks.database, "unknown"),
      ai: strOf(checks.ai, "unknown"),
      uptimeSeconds: numOf(r.uptimeSeconds),
    };
  }, signal);
}
