import { apiFetch } from "../auth/api-client";
import { request } from "./client";
import {
  array,
  boolean,
  invalid,
  nullable,
  number,
  oneOf,
  parsePage,
  record,
  string,
} from "./parse";
export const items = <T>(value: unknown, parser: (v: unknown) => T) =>
  array(record(value).items, parser);
export function parseEvaluation(value: unknown) {
  const v = record(value);
  return {
    id: string(v.id),
    cycleId: string(v.cycleId),
    status: oneOf(v.status, ["draft", "submitted", "finalized"]),
    overallScore: nullable(v.overallScore, number),
    summary: nullable(v.summary, string),
    finalizedAt: nullable(v.finalizedAt, string),
    revisionNumber: number(v.revisionNumber),
    scores: array(v.scores, (x) => {
      const s = record(x);
      return {
        id: string(s.id),
        criterionId: string(s.criterionId),
        score: number(s.score),
        comment: nullable(s.comment, string),
      };
    }),
  };
}
export function parsePerformance(value: unknown) {
  const m = record(record(value).metrics);
  return {
    totalTaskCount: number(m.totalTaskCount),
    completedTaskCount: number(m.completedTaskCount),
    taskCompletionRate: nullable(m.taskCompletionRate, number),
    committedStoryPoints: number(m.committedStoryPoints),
    completedStoryPoints: number(m.completedStoryPoints),
    storyPointCompletionRate: nullable(m.storyPointCompletionRate, number),
    onTimeCompletionRate: nullable(m.onTimeCompletionRate, number),
    overdueOpenTaskCount: number(m.overdueOpenTaskCount),
    averageEvaluationScore: nullable(m.averageEvaluationScore, number),
    finalizedEvaluationCount: number(m.finalizedEvaluationCount),
    activeSprintProgress: nullable(m.activeSprintProgress, number),
  };
}
export function parseKpi(value: unknown) {
  const v = record(value);
  return {
    id: string(v.id),
    ruleVersion: string(v.ruleVersion),
    status: oneOf(v.status, ["calculated", "insufficient_data"]),
    finalScore: nullable(v.finalScore, number),
    calculatedAt: string(v.calculatedAt),
  };
}
export function parseKpiDetail(value: unknown) {
  const v = record(value);
  return {
    ...parseKpi(v),
    metrics: array(v.metrics, (value) => {
      const m = record(value);
      return {
        metricCode: string(m.metricCode),
        sourceValue: nullable(m.sourceValue, number),
        configuredWeight: number(m.configuredWeight),
        effectiveWeight: nullable(m.effectiveWeight, number),
        weightedContribution: nullable(m.weightedContribution, number),
        sourceJson: string(m.sourceJson),
      };
    }),
  };
}
export function parseLedger(value: unknown) {
  const v = record(value);
  return {
    id: string(v.id),
    type: oneOf(v.type, [
      "kpi_earning",
      "bonus",
      "penalty",
      "adjustment",
      "reversal",
    ]),
    amount: number(v.amount),
    unit: string(v.unit),
    description: string(v.description),
    createdAt: string(v.createdAt),
  };
}
export function parseSalary(value: unknown) {
  const v = record(value);
  if (boolean(v.virtual) !== true) invalid();
  return {
    balance: number(v.balance),
    unit: string(v.unit),
    virtual: true as const,
    earnedThisPeriod: number(v.earnedThisPeriod),
    latestEntries: array(v.latestEntries, parseLedger),
  };
}
export function parseCertificate(value: unknown) {
  const v = record(value);
  return {
    id: string(v.id),
    certificateNumber: string(v.certificateNumber),
    verificationCode: string(v.verificationCode),
    status: oneOf(v.status, ["issued", "revoked"]),
    issuedAt: string(v.issuedAt),
    completedAt: nullable(v.completedAt ?? null, string),
    projectName: nullable(v.projectNameSnapshot ?? null, string),
    sessionName: nullable(v.sessionNameSnapshot ?? null, string),
    revokedAt: nullable(v.revokedAt, string),
    revokeReason: nullable(v.revokeReason, string),
    policyCode: string(v.policyCode),
    policyVersion: number(v.policyVersion),
  };
}
export function parseVerification(value: unknown) {
  const v = record(value);
  const status = oneOf(v.status, ["issued", "revoked"]),
    valid = boolean(v.valid);
  if (valid !== (status === "issued")) invalid();
  return {
    valid,
    status,
    certificateNumber: string(v.certificateNumber),
    holderName: nullable(v.holderName, string),
    role: nullable(v.role, string),
    projectName: nullable(v.projectName, string),
    sessionName: nullable(v.sessionName ?? null, string),
    completedAt: nullable(v.completedAt ?? null, string),
    issuedAt: string(v.issuedAt),
    revokedAt: v.revokedAt === undefined ? null : nullable(v.revokedAt, string),
  };
}
export function safeNotificationLink(value: string | null): string | null {
  if (
    !value ||
    value.includes("\\") ||
    value.includes("%") ||
    value.includes("..")
  )
    return null;
  const aliases: Record<string, string> = {
    "/intern/me/certificates": "/intern/certificates",
    "/intern/me/kpi": "/intern/kpi",
    "/intern/me/virtual-salary": "/intern/virtual-salary",
    "/intern/me/evaluations": "/intern/evaluations",
  };
  if (aliases[value]) return aliases[value];
  const oldDetail = value.match(
    /^\/intern\/(tasks|assignments|sprints)\/([a-f0-9-]{36})$/i,
  );
  if (oldDetail)
    return oldDetail[1] === "tasks"
      ? `/intern/work/${oldDetail[2]}`
      : oldDetail[1] === "assignments"
        ? "/intern/project"
        : "/intern/sprint";
  return /^\/(intern|instructor|admin)(\/(work|sprint|project|mentor|evaluations|performance|kpi|virtual-salary|certificates|notifications|recommendations|profile|classes|sessions|projects|sprints|reports|users|roles|groups|catalogs|settings|audit|activity|services|tasks|logs|sharing|github|templates|questions|ai)(\/[a-fA-F0-9-]{36})?|\/onboarding\/(role|interview|result))?(\?[a-zA-Z0-9=&_-]*)?$/.test(
    value,
  )
    ? value
    : null;
}
export function parseNotification(value: unknown) {
  const v = record(value);
  return {
    id: string(v.id),
    title: string(v.title),
    body: nullable(v.body, string),
    linkUrl: safeNotificationLink(nullable(v.linkUrl, string)),
    readAt: nullable(v.readAt, string),
    createdAt: string(v.createdAt),
  };
}
export function notificationLinkForRole(
  value: string | null,
  role: string,
): string | null {
  const link = safeNotificationLink(value);
  if (!link) return null;
  if (role === 'intern' && link.startsWith('/intern/onboarding/')) return link;
  if (role === "instructor" && /^\/intern\/work\//.test(link))
    return link.replace(/^\/intern\/work\//, '/instructor/tasks/');
  if (role === "admin" && /^\/intern\/work\//.test(link)) return link.replace(/^\/intern\/work\//, '/admin/tasks/');
  if (role === "instructor" && link === "/intern/project")
    return "/instructor/projects";
  if (role === "instructor" && link === "/intern/sprint")
    return "/instructor/sprints";
  const routes: Record<string, readonly string[]> = {
    intern: [
      "",
      "work",
      "sprint",
      "project",
      "mentor",
      "evaluations",
      "performance",
      "kpi",
      "virtual-salary",
      "certificates",
      "notifications",
      "recommendations",
      "profile",
    ],
    instructor: [
      "",
      "classes",
      "sessions",
      "projects",
      "sprints",
      "evaluations",
      "performance",
      "reports",
      "notifications",
      "profile",
      "tasks", "sharing", "github",
    ],
    admin: [
      "",
      "users",
      "roles",
      "groups",
      "catalogs",
      "settings",
      "audit",
      "activity",
      "services",
      "tasks",
      "logs",
      "notifications",
      "profile",
      "templates", "questions", "ai", "sessions", "sprints", "performance", "reports",
    ],
  };
  const [prefix, section = "", id, ...rest] = link
    .split("?")[0]
    .slice(1)
    .split("/");
  if (prefix !== role || !routes[role]?.includes(section) || rest.length)
    return null;
  const detailRoutes: Record<string, readonly string[]> = {
    intern: ['work', 'evaluations', 'kpi', 'certificates'],
    instructor: ['tasks', 'sessions', 'projects', 'sprints'],
    admin: ['tasks', 'sessions', 'sprints'],
  };
  if (id && !detailRoutes[role]?.includes(section)) return null;
  return link;
}
export function parseRecommendations(value: unknown) {
  const v = record(value),
    data = record(v.recommendations);
  return {
    id: string(v.id),
    createdAt: string(v.createdAt),
    reused: boolean(v.reused),
    summary: string(data.summary),
    recommendations: array(data.recommendations, (value) => {
      const r = record(value);
      return {
        type: string(r.type),
        priority: string(r.priority),
        title: string(r.title),
        reason: string(r.reason),
        actions: array(r.actions, string),
        evidenceMetricCodes: array(r.evidenceMetricCodes, string),
      };
    }),
  };
}
export const getEvaluations = (signal?: AbortSignal) =>
  request("/intern/me/evaluations", (x) => items(x, parseEvaluation), {
    signal,
  });
export const getEvaluation = (id: string, signal?: AbortSignal) =>
  request(`/intern/me/evaluations/${encodeURIComponent(id)}`, parseEvaluation, {
    signal,
  });
export const getPerformance = (signal?: AbortSignal) =>
  request("/intern/me/performance", parsePerformance, { signal });
export const getKpis = (signal?: AbortSignal) =>
  request("/intern/me/kpi", (x) => items(x, parseKpi), { signal });
export const getKpi = (id: string, signal?: AbortSignal) =>
  request(`/intern/me/kpi/${encodeURIComponent(id)}`, parseKpiDetail, {
    signal,
  });
export const getSalary = (signal?: AbortSignal) =>
  request("/intern/me/virtual-salary", parseSalary, { signal });
export const getLedger = (page: number, signal?: AbortSignal) =>
  request(
    `/intern/me/virtual-salary/ledger?page=${page}&pageSize=20`,
    (value) => {
      const v = record(value);
      const total = number(v.total);
      return {
        items: array(v.items, parseLedger),
        total,
        page,
        pageSize: 20,
        totalPages: Math.ceil(total / 20),
      };
    },
    { signal },
  );
export const getCertificates = (signal?: AbortSignal) =>
  request("/intern/me/certificates", (x) => items(x, parseCertificate), {
    signal,
  });
export const getCertificate = (id: string, signal?: AbortSignal) =>
  request(
    `/intern/me/certificates/${encodeURIComponent(id)}`,
    parseCertificate,
    { signal },
  );
export const getCertificatePdf = (id: string) =>
  request(
    `/intern/me/certificates/${encodeURIComponent(id)}/pdf`,
    (value) => (value instanceof Blob ? value : invalid()),
    { responseType: "blob" },
  );
export const verifyCertificate = async (code: string) =>
  parseVerification(
    await apiFetch(`/certificates/verify/${encodeURIComponent(code)}`),
  );
export const getNotifications = (
  page: number,
  unread: boolean,
  signal?: AbortSignal,
) =>
  request(
    `/notifications?page=${page}&pageSize=20${unread ? "&unread=true" : ""}`,
    (x) => parsePage(x, parseNotification),
    { signal },
  );
export const markNotification = (id: string) =>
  request(`/notifications/${encodeURIComponent(id)}/read`, () => null, {
    method: "POST",
  });
export const markAllNotifications = () =>
  request("/notifications/read-all", (x) => number(record(x).updated), {
    method: "POST",
  });
export const notificationCategories = [
  "system",
  "task",
  "session",
  "evaluation",
  "announcement",
  "recruitment",
  "kpi",
  "salary",
  "certificate",
] as const;
export type NotificationCategory = (typeof notificationCategories)[number];
export function parsePreferences(value: unknown) {
  return array(record(value).preferences, (x) => {
    const p = record(x);
    return {
      category: oneOf(p.category, notificationCategories),
      enabled: boolean(p.enabled),
    };
  });
}
export const getNotificationPreferences = (signal?: AbortSignal) =>
  request("/notifications/preferences", parsePreferences, { signal });
export const setNotificationPreference = (
  category: NotificationCategory,
  enabled: boolean,
) =>
  request("/notifications/preferences", parsePreferences, {
    method: "PUT",
    body: { category, enabled },
  });
export const getRecommendations = (signal?: AbortSignal) =>
  request("/intern/me/ai-recommendations", parseRecommendations, { signal });
export const refreshRecommendations = () =>
  request("/intern/me/ai-recommendations/refresh", parseRecommendations, {
    method: "POST",
  });
