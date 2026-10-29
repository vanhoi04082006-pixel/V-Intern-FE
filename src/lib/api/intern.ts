"use client";

/**
 * Domain API: Intern workspace — intern/me/*
 * Quyền: intern.workspace.view + các quyền *.own tương ứng.
 */

import { getJson, sendJson, arrOf, dateOf, numOf, strOf, qs } from "@/lib/api/client";

/* ───────────────────────────── Types ───────────────────────────── */

export interface InternProject {
  projectId: string;
  code: string;
  name: string;
  description: string | null;
  domainCategory: string | null;
  difficulty: string | null;
  status: string;
  technologies: string[];
}

export interface BoardColumn {
  status: string;
  count: number;
}

export interface BoardTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  storyPoints: number | null;
  dueDate: string | null;
  version: number;
  sprintId: string | null;
  projectId: string | null;
  progress: number | null;
}

export interface SprintBoard {
  sprintId: string | null;
  sprintName: string | null;
  sprintGoal: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string | null;
  columns: BoardColumn[];
  tasks: BoardTask[];
}

export interface InternSprint {
  id: string;
  code: string;
  name: string;
  goal: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
}

export interface InternWorkspace {
  identity: { userId: string; displayName: string; email: string };
  project: { id: string; name: string; code: string } | null;
  sprint: { id: string; name: string; code: string; status: string; endDate: string | null } | null;
  taskSummary: Record<string, number>;
  focusedTask: { id: string; title: string; status: string; dueDate: string | null } | null;
}

export interface MyPerformance {
  taskCompletionRate: number | null;
  storyPointCompletionRate: number | null;
  onTimeCompletionRate: number | null;
  overdueOpenTaskCount: number;
  averageEvaluationScore: number | null;
  generatedAt: string | null;
}

export interface MyEvaluation {
  id: string;
  cycleName: string | null;
  status: string;
  overallScore: number | null;
  summary: string | null;
  finalizedAt: string | null;
  criteria: { code: string; name: string; weight: number; score: number | null; maxScore: number | null; comment: string | null }[];
}

export interface KpiResult {
  id: string;
  periodName: string | null;
  periodStatus: string | null;
  totalScore: number | null;
  rank: number | null;
  components: { code: string; name: string; score: number | null; weight: number | null; detail: string | null }[];
}

export interface SalaryEntry {
  id: string;
  type: string;
  amount: number;
  reason: string | null;
  kpiPeriodName: string | null;
  createdAt: string | null;
}

export interface MyCertificate {
  id: string;
  certificateNumber: string;
  status: string;
  projectName: string | null;
  issuedAt: string | null;
  revokedAt: string | null;
  revokeReason: string | null;
}

export interface MentorMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string | null;
}

export interface MentorConversation {
  id: string;
  title: string;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AiRecommendation {
  id: string;
  generatedAt: string | null;
  focusAreas: string[];
  suggestions: string[];
  encouragement: string | null;
}

/* ─────────────────────────── Parsers ──────────────────────────── */

function parseProject(d: Record<string, unknown>): InternProject {
  return {
    projectId: strOf(d.projectId ?? d.id),
    code: strOf(d.code),
    name: strOf(d.name),
    description: dateOf(d.description as string) ?? (typeof d.description === "string" ? d.description : null),
    domainCategory: typeof d.domainCategory === "string" ? d.domainCategory : null,
    difficulty: typeof d.difficulty === "string" ? d.difficulty : null,
    status: strOf(d.status),
    technologies: arrOf(d.technologies ?? [], (t) => strOf(t)),
  };
}

function parseBoardTask(d: Record<string, unknown>): BoardTask {
  return {
    id: strOf(d.id),
    title: strOf(d.title),
    description: typeof d.description === "string" ? d.description : null,
    status: strOf(d.status ?? "todo"),
    priority: typeof d.priority === "string" ? d.priority : null,
    storyPoints: d.storyPoints == null ? null : numOf(d.storyPoints),
    dueDate: dateOf(d.dueDate as string),
    version: numOf(d.version, 1),
    sprintId: d.sprintId == null ? null : strOf(d.sprintId),
    projectId: d.projectId == null ? null : strOf(d.projectId),
    progress: d.progress == null ? null : numOf(d.progress),
  };
}

function parseBoard(data: unknown): SprintBoard {
  const d = (data ?? {}) as Record<string, unknown>;
  const sprint = (d.sprint ?? {}) as Record<string, unknown>;
  return {
    sprintId: sprint.id ? strOf(sprint.id) : d.sprintId ? strOf(d.sprintId) : null,
    sprintName: typeof sprint.name === "string" ? sprint.name : null,
    sprintGoal: typeof sprint.goal === "string" ? sprint.goal : null,
    startDate: dateOf(sprint.startDate as string),
    endDate: dateOf(sprint.endDate as string),
    status: typeof sprint.status === "string" ? sprint.status : null,
    columns: arrOf(d.columns, (c) => {
      const col = (c ?? {}) as Record<string, unknown>;
      return { status: strOf(col.status), count: numOf(col.count) };
    }),
    tasks: arrOf(d.tasks, (t) => parseBoardTask((t ?? {}) as Record<string, unknown>)),
  };
}

function parseWorkspace(data: unknown): InternWorkspace {
  const d = (data ?? {}) as Record<string, unknown>;
  const identity = (d.identity ?? {}) as Record<string, unknown>;
  const project = (d.project ?? {}) as Record<string, unknown>;
  const sprint = (d.sprint ?? {}) as Record<string, unknown>;
  const focused = (d.focusedTask ?? {}) as Record<string, unknown>;
  const summary = (d.taskSummary ?? {}) as Record<string, unknown>;
  return {
    identity: {
      userId: strOf(identity.userId ?? identity.id),
      displayName: strOf(identity.displayName),
      email: strOf(identity.email),
    },
    project: project.id ? { id: strOf(project.id), name: strOf(project.name), code: strOf(project.code) } : null,
    sprint: sprint.id
      ? {
          id: strOf(sprint.id),
          name: strOf(sprint.name),
          code: strOf(sprint.code),
          status: strOf(sprint.status),
          endDate: dateOf(sprint.endDate as string),
        }
      : null,
    taskSummary: Object.fromEntries(Object.entries(summary).map(([k, v]) => [k, numOf(v)])),
    focusedTask: focused.id
      ? { id: strOf(focused.id), title: strOf(focused.title), status: strOf(focused.status), dueDate: dateOf(focused.dueDate as string) }
      : null,
  };
}

/* ─────────────────────────── API calls ────────────────────────── */

export function fetchMyWorkspace(signal?: AbortSignal): Promise<InternWorkspace> {
  return getJson("/api/v1/intern/me/workspace", parseWorkspace, signal);
}

export function fetchMyProject(signal?: AbortSignal): Promise<InternProject | null> {
  return getJson(
    "/api/v1/intern/me/project",
    (data) => {
      const d = (data ?? {}) as Record<string, unknown>;
      return d.projectId || d.id ? parseProject(d) : null;
    },
    signal,
  );
}

export function fetchMyBoard(sprintId?: string, signal?: AbortSignal): Promise<SprintBoard> {
  const path = sprintId
    ? `/api/v1/intern/me/sprints/${encodeURIComponent(sprintId)}/board`
    : "/api/v1/intern/me/sprint/board";
  return getJson(path, parseBoard, signal);
}

export function fetchMySprints(signal?: AbortSignal): Promise<InternSprint[]> {
  return getJson(
    "/api/v1/intern/me/sprints" + qs({ pageSize: 50 }),
    (data) => {
      const d = (data ?? {}) as Record<string, unknown>;
      const arr = Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
      return arrOf(arr, (s) => {
        const r = (s ?? {}) as Record<string, unknown>;
        const active = (r.active ?? r.current ?? {}) as Record<string, unknown>;
        return {
          id: strOf(r.id ?? active.id),
          code: strOf(r.code ?? active.code),
          name: strOf(r.name ?? active.name),
          goal: typeof r.goal === "string" ? r.goal : null,
          status: strOf(r.status ?? active.status),
          startDate: dateOf((r.startDate ?? active.startDate) as string),
          endDate: dateOf((r.endDate ?? active.endDate) as string),
        };
      });
    },
    signal,
  );
}

export function fetchMyPerformance(signal?: AbortSignal): Promise<MyPerformance> {
  return getJson(
    "/api/v1/intern/me/performance",
    (data) => {
      const d = (data ?? {}) as Record<string, unknown>;
      return {
        taskCompletionRate: d.taskCompletionRate == null ? null : numOf(d.taskCompletionRate),
        storyPointCompletionRate: d.storyPointCompletionRate == null ? null : numOf(d.storyPointCompletionRate),
        onTimeCompletionRate: d.onTimeCompletionRate == null ? null : numOf(d.onTimeCompletionRate),
        overdueOpenTaskCount: numOf(d.overdueOpenTaskCount),
        averageEvaluationScore: d.averageEvaluationScore == null ? null : numOf(d.averageEvaluationScore),
        generatedAt: dateOf(d.generatedAt as string),
      };
    },
    signal,
  );
}

export function fetchMyEvaluations(signal?: AbortSignal): Promise<MyEvaluation[]> {
  return getJson(
    "/api/v1/intern/me/evaluations",
    (data) => {
      const d = (data ?? {}) as Record<string, unknown>;
      const arr = Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
      return arrOf(arr, (e) => {
        const r = (e ?? {}) as Record<string, unknown>;
        return {
          id: strOf(r.id),
          cycleName: typeof r.cycleName === "string" ? r.cycleName : null,
          status: strOf(r.status),
          overallScore: r.overallScore == null ? null : numOf(r.overallScore),
          summary: typeof r.summary === "string" ? r.summary : null,
          finalizedAt: dateOf(r.finalizedAt as string),
          criteria: arrOf(r.criteria, (c) => {
            const cr = (c ?? {}) as Record<string, unknown>;
            return {
              code: strOf(cr.code),
              name: strOf(cr.name),
              weight: numOf(cr.weight),
              score: cr.score == null ? null : numOf(cr.score),
              maxScore: cr.maxScore == null ? null : numOf(cr.maxScore),
              comment: typeof cr.comment === "string" ? cr.comment : null,
            };
          }),
        };
      });
    },
    signal,
  );
}

export function fetchMyKpi(signal?: AbortSignal): Promise<KpiResult[]> {
  return getJson(
    "/api/v1/intern/me/kpi",
    (data) => {
      const d = (data ?? {}) as Record<string, unknown>;
      const arr = Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
      return arrOf(arr, parseKpiResult);
    },
    signal,
  );
}

export function parseKpiResult(item: unknown): KpiResult {
  const r = (item ?? {}) as Record<string, unknown>;
  const period = (r.period ?? r.kpiPeriod ?? {}) as Record<string, unknown>;
  return {
    id: strOf(r.id),
    periodName: typeof r.periodName === "string" ? r.periodName : typeof period.name === "string" ? period.name : null,
    periodStatus: typeof r.periodStatus === "string" ? r.periodStatus : null,
    totalScore: r.totalScore == null ? null : numOf(r.totalScore),
    rank: r.rank == null ? null : numOf(r.rank),
    components: arrOf(r.components, (c) => {
      const cr = (c ?? {}) as Record<string, unknown>;
      return {
        code: strOf(cr.code),
        name: strOf(cr.name),
        score: cr.score == null ? null : numOf(cr.score),
        weight: cr.weight == null ? null : numOf(cr.weight),
        detail: typeof cr.detail === "string" ? cr.detail : null,
      };
    }),
  };
}

export function fetchMySalary(signal?: AbortSignal): Promise<{ balance: number; entries: SalaryEntry[] }> {
  return getJson("/api/v1/intern/me/virtual-salary", (data) => parseSalaryBundle(data), signal);
}

export function fetchMySalaryLedger(signal?: AbortSignal): Promise<SalaryEntry[]> {
  return getJson("/api/v1/intern/me/virtual-salary/ledger", (data) => {
    const d = (data ?? {}) as Record<string, unknown>;
    const arr = Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
    return arrOf(arr, parseSalaryEntry);
  }, signal);
}

export function parseSalaryEntry(item: unknown): SalaryEntry {
  const r = (item ?? {}) as Record<string, unknown>;
  return {
    id: strOf(r.id),
    type: strOf(r.type),
    amount: numOf(r.amount),
    reason: typeof r.reason === "string" ? r.reason : null,
    kpiPeriodName: typeof r.kpiPeriodName === "string" ? r.kpiPeriodName : null,
    createdAt: dateOf(r.createdAt as string),
  };
}

function parseSalaryBundle(data: unknown): { balance: number; entries: SalaryEntry[] } {
  const d = (data ?? {}) as Record<string, unknown>;
  const balance = d.balance == null ? numOf(d.total) : numOf(d.balance);
  const arr = Array.isArray(d.entries) ? d.entries : Array.isArray(d.ledger) ? d.ledger : Array.isArray(d.data) ? d.data : [];
  return { balance, entries: arrOf(arr, parseSalaryEntry) };
}

export function fetchMyCertificates(signal?: AbortSignal): Promise<MyCertificate[]> {
  return getJson(
    "/api/v1/intern/me/certificates",
    (data) => {
      const d = (data ?? {}) as Record<string, unknown>;
      const arr = Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
      return arrOf(arr, (c) => {
        const r = (c ?? {}) as Record<string, unknown>;
        const project = (r.project ?? {}) as Record<string, unknown>;
        return {
          id: strOf(r.id),
          certificateNumber: strOf(r.certificateNumber ?? r.number),
          status: strOf(r.status),
          projectName: typeof r.projectName === "string" ? r.projectName : typeof project.name === "string" ? project.name : null,
          issuedAt: dateOf(r.issuedAt as string),
          revokedAt: dateOf(r.revokedAt as string),
          revokeReason: typeof r.revokeReason === "string" ? r.revokeReason : null,
        };
      });
    },
    signal,
  );
}

/* ── AI Mentor (conversations + messages) ── */

export function fetchMentorConversations(signal?: AbortSignal): Promise<MentorConversation[]> {
  return getJson(
    "/api/v1/intern/me/ai-mentor/conversations" + qs({ pageSize: 50 }),
    (data) => {
      const d = (data ?? {}) as Record<string, unknown>;
      const arr = Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
      return arrOf(arr, (c) => {
        const r = (c ?? {}) as Record<string, unknown>;
        return {
          id: strOf(r.id),
          title: strOf(r.title, "Cuộc trò chuyện"),
          status: strOf(r.status, "active"),
          createdAt: dateOf(r.createdAt as string),
          updatedAt: dateOf(r.updatedAt as string),
        };
      });
    },
    signal,
  );
}

export function createMentorConversation(title?: string): Promise<MentorConversation> {
  return sendJson("/api/v1/intern/me/ai-mentor/conversations", "POST", title ? { title } : {}, (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    return {
      id: strOf(r.id),
      title: strOf(r.title, "Cuộc trò chuyện"),
      status: strOf(r.status, "active"),
      createdAt: dateOf(r.createdAt as string),
      updatedAt: dateOf(r.updatedAt as string),
    };
  });
}

export function fetchMentorConversation(id: string, signal?: AbortSignal): Promise<MentorConversation & { messages: MentorMessage[] }> {
  return getJson(`/api/v1/intern/me/ai-mentor/conversations/${encodeURIComponent(id)}`, (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    return {
      id: strOf(r.id),
      title: strOf(r.title, "Cuộc trò chuyện"),
      status: strOf(r.status, "active"),
      createdAt: dateOf(r.createdAt as string),
      updatedAt: dateOf(r.updatedAt as string),
      messages: arrOf(r.messages, (m) => {
        const mr = (m ?? {}) as Record<string, unknown>;
        return {
          id: strOf(mr.id),
          role: mr.role === "assistant" ? "assistant" : "user",
          content: strOf(mr.content),
          createdAt: dateOf(mr.createdAt as string),
        };
      }),
    };
  }, signal);
}

export function sendMentorMessage(conversationId: string, content: string, taskId?: string): Promise<{ reply: string }> {
  return sendJson(
    `/api/v1/intern/me/ai-mentor/conversations/${encodeURIComponent(conversationId)}/messages`,
    "POST",
    taskId ? { content, taskId } : { content },
    (data) => {
      const r = (data ?? {}) as Record<string, unknown>;
      return { reply: strOf(r.reply ?? r.content ?? r.message) };
    },
  );
}

export function archiveMentorConversation(conversationId: string): Promise<void> {
  return sendJson(
    `/api/v1/intern/me/ai-mentor/conversations/${encodeURIComponent(conversationId)}/archive`,
    "POST",
    {},
    () => undefined,
  );
}

/* ── AI Recommendations ── */

export function fetchMyRecommendations(signal?: AbortSignal): Promise<AiRecommendation | null> {
  return getJson(
    "/api/v1/intern/me/ai-recommendations",
    (data) => {
      const r = (data ?? {}) as Record<string, unknown>;
      if (!r.id && !r.generatedAt) return null;
      return {
        id: strOf(r.id),
        generatedAt: dateOf(r.generatedAt as string),
        focusAreas: arrOf(r.focusAreas, (x) => strOf(x)),
        suggestions: arrOf(r.suggestions, (x) => strOf(x)),
        encouragement: typeof r.encouragement === "string" ? r.encouragement : null,
      };
    },
    signal,
  );
}

export function refreshMyRecommendations(): Promise<AiRecommendation | null> {
  return sendJson("/api/v1/intern/me/ai-recommendations/refresh", "POST", {}, (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    if (!r.id && !r.generatedAt) return null;
    return {
      id: strOf(r.id),
      generatedAt: dateOf(r.generatedAt as string),
      focusAreas: arrOf(r.focusAreas, (x) => strOf(x)),
      suggestions: arrOf(r.suggestions, (x) => strOf(x)),
      encouragement: typeof r.encouragement === "string" ? r.encouragement : null,
    };
  });
}

/* ── Learning package ── */

export function fetchLearningPackage(projectId: string, signal?: AbortSignal): Promise<{ title: string; sections: { heading: string; items: string[] }[] }> {
  return getJson(
    `/api/v1/intern/me/projects/${encodeURIComponent(projectId)}/learning-package`,
    (data) => {
      const r = (data ?? {}) as Record<string, unknown>;
      return {
        title: strOf(r.title, "Gói học tập"),
        sections: arrOf(r.sections, (s) => {
          const sr = (s ?? {}) as Record<string, unknown>;
          return { heading: strOf(sr.heading), items: arrOf(sr.items, (i) => strOf(i)) };
        }),
      };
    },
    signal,
  );
}
