/**
 * Store in-memory cho backend mock V-Intern.
 * Gắn trên globalThis để sống qua HMR của Next dev server.
 */

import type {
  Assignment,
  CodeReview,
  InterviewQuestion,
  InterviewSession,
  RecruitmentProfile,
  Store,
  Task,
  User,
} from "./types";
import { seedAssignments, seedInterviews, seedRecruitment, seedUsers } from "./seed/users";
import {
  seedCodeReviews,
  seedMilestones,
  seedPlans,
  seedProjects,
  seedSessions,
  seedSprints,
  seedSubmissions,
  seedTaskComments,
  seedTaskHistory,
  seedTaskSpecs,
  seedTasks,
  seedTimeline,
} from "./seed/session";
import { seedTemplates } from "./seed/templates";
import {
  seedCertificates,
  seedCycles,
  seedCriteria,
  seedEvaluations,
  seedKpis,
  seedMentor,
  seedRecommendations,
  seedSalary,
} from "./seed/outcomes";
import {
  seedActivityEvents,
  seedAiConfig,
  seedAuditLogs,
  seedNotificationPrefs,
  seedNotifications,
  seedReports,
  seedSettings,
} from "./seed/misc";
import { seedQuestionBank } from "./seed/questions";

const GLOBAL_KEY = "__vintern_mock_store__";

/** Trạng thái GitHub seed: configured cho mọi user, Minh Hà đã kết nối (demo đa trạng thái). */
function seedGithub(): Store["github"] {
  return {
    usr_an: { userId: "usr_an", configured: true, connected: false, login: null },
    usr_minhha: { userId: "usr_minhha", configured: true, connected: true, login: "minhha-dev" },
    usr_hong: { userId: "usr_hong", configured: true, connected: true, login: "hong-le-gv" },
  };
}

function buildStore(): Store {
  const users = seedUsers();
  const templates = seedTemplates();
  return {
    seededAt: new Date().toISOString(),
    users,
    tokens: {},
    recruitment: seedRecruitment(),
    interviews: seedInterviews(),
    projects: seedProjects(),
    sessions: seedSessions(),
    sprints: seedSprints(),
    tasks: seedTasks(),
    taskComments: seedTaskComments(),
    taskSpecs: seedTaskSpecs(),
    taskHistory: seedTaskHistory({ hong: "Hồng Lê" }),
    submissions: seedSubmissions(),
    codeReviews: seedCodeReviews(),
    mentorConversations: [],
    mentorMessages: [],
    cycles: seedCycles(),
    criteria: seedCriteria(),
    evaluations: seedEvaluations(),
    kpis: seedKpis(),
    salaryEntries: seedSalary(),
    certificates: seedCertificates(),
    recommendations: seedRecommendations(),
    notifications: seedNotifications(users),
    notificationPrefs: seedNotificationPrefs(users),
    github: seedGithub(),
    templates,
    plans: [seedPlans(templates)].filter((p): p is NonNullable<typeof p> => p !== null),
    reports: seedReports(),
    activityEvents: seedActivityEvents(),
    auditLogs: seedAuditLogs(),
    settings: seedSettings(),
    aiConfig: seedAiConfig(),
    questionBank: seedQuestionBank(),
    assignments: seedAssignments(),
    timelineEvents: seedTimeline(),
    milestones: seedMilestones(),
    aiRuns: 47,
    templateStarts: [],
  };
}

function initMentor(): void {
  // Seed mentor riêng để tránh gọi randomId tại module-scope khác — vẫn deterministic theo store.
  const seeded = seedMentor();
  store.mentorConversations = seeded.conversations;
  store.mentorMessages = seeded.messages;
}

const globalRef = globalThis as unknown as { [GLOBAL_KEY]?: Store };
let store: Store;

export function getStore(): Store {
  if (!globalRef[GLOBAL_KEY]) {
    globalRef[GLOBAL_KEY] = buildStore();
    store = globalRef[GLOBAL_KEY]!;
    initMentor();
  }
  store = globalRef[GLOBAL_KEY]!;
  // Tự phục hồi: store cũ (từ trước khi có seed mentor) → seed bù hội thoại
  if (store.mentorConversations.length === 0 && store.mentorMessages.length === 0) {
    initMentor();
  }
  if (Object.keys(store.github).length === 0) {
    store.github = seedGithub();
  }
  return store;
}

/* ============================ Truy vấn tiện ích ============================ */

export function findUserById(id: string): User | undefined {
  return getStore().users.find((u) => u.id === id);
}

export function findUserByEmail(email: string): User | undefined {
  const e = email.trim().toLowerCase();
  return getStore().users.find((u) => u.email.toLowerCase() === e);
}

export function getUserByToken(token: string | null | undefined): User | undefined {
  if (!token) return undefined;
  const s = getStore();
  const userId = s.tokens[token];
  if (!userId) return undefined;
  return s.users.find((u) => u.id === userId);
}

export function getRecruitment(userId: string): RecruitmentProfile {
  const s = getStore();
  if (!s.recruitment[userId]) {
    s.recruitment[userId] = {
      userId,
      status: "not_started",
      selectedRole: null,
      attemptCount: 0,
      maxAttempts: 3,
      recruitedAt: null,
      nextEligibleAt: null,
    };
  }
  return s.recruitment[userId];
}

export function activeAssignmentOf(userId: string): Assignment | undefined {
  return getStore().assignments.find((a) => a.internId === userId && a.status === "active");
}

export function assignmentHistoryOf(userId: string): Assignment[] {
  return getStore().assignments.filter((a) => a.internId === userId);
}

export function tasksOfUser(userId: string): Task[] {
  return getStore().tasks.filter((t) => t.assigneeId === userId);
}

export function nextTaskCode(): string {
  const s = getStore();
  let max = 0;
  for (const t of s.tasks) {
    const n = Number(t.code.replace("TSK-", ""));
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `TSK-${String(max + 1).padStart(2, "0")}`;
}

export function currentInterviewOf(userId: string): InterviewSession | undefined {
  return getStore().interviews.find(
    (i) => i.userId === userId && (i.status === "in_progress" || i.status === "evaluating")
  );
}

export function latestResultOf(userId: string): { session: InterviewSession } | null {
  const sessions = getStore()
    .interviews.filter((i) => i.userId === userId && i.result)
    .sort((a, b) => (a.submittedAt ?? a.startedAt) < (b.submittedAt ?? b.startedAt) ? 1 : -1);
  return sessions.length ? { session: sessions[0] } : null;
}

export function recordActivity(
  module: Store["activityEvents"][number]["module"],
  action: string,
  actorName: string,
  summary: string
): void {
  const s = getStore();
  s.activityEvents.unshift({
    id: `act_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    module,
    action,
    actorName,
    summary,
    at: new Date().toISOString(),
  });
}

export function pushAudit(actorName: string, action: "LOGIN" | "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE", target: string): void {
  getStore().auditLogs.unshift({
    id: `aud_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    actorName,
    action,
    target,
    at: new Date().toISOString(),
    ip: `10.0.${Math.floor(Math.random() * 40) + 1}.${Math.floor(Math.random() * 200) + 10}`,
  });
}

export function pushTimeline(sessionId: string, action: string, summary: string, actorName: string): void {
  getStore().timelineEvents.unshift({
    id: `tlm_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    sessionId,
    action,
    summary,
    actorName,
    createdAt: new Date().toISOString(),
  });
}

export function notifyUser(
  userId: string,
  category: Store["notifications"][number]["category"],
  title: string,
  content: string,
  link: string | null = null
): void {
  getStore().notifications.unshift({
    id: `ntf_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    userId,
    category,
    title,
    content,
    read: false,
    link,
    createdAt: new Date().toISOString(),
  });
}

export function unreadNotificationCount(userId: string): number {
  return getStore().notifications.filter((n) => n.userId === userId && !n.read).length;
}

/** Bài nộp mới nhất của task. */
export function latestSubmissionOf(taskId: string) {
  const subs = getStore().submissions.filter((s) => s.taskId === taskId);
  return subs.length ? subs[subs.length - 1] : undefined;
}

/** Code review của submission (mỗi submission có thể nhiều lần chạy lại). */
export function codeReviewsOf(submissionId: string): CodeReview[] {
  return getStore().codeReviews.filter((c) => c.submissionId === submissionId);
}

/** Sprint active của session. */
export function activeSprintOf(sessionId: string) {
  const s = getStore();
  return (
    s.sprints.find((sp) => sp.sessionId === sessionId && sp.status === "active") ??
    s.sprints.filter((sp) => sp.sessionId === sessionId).sort((a, b) => (a.startDate < b.startDate ? 1 : -1))[0]
  );
}

export function sprintProgress(sprintId: string): number {
  const s = getStore();
  const tasks = s.tasks.filter((t) => t.sprintId === sprintId);
  if (!tasks.length) return 0;
  const sum = tasks.reduce((acc, t) => acc + t.progress, 0);
  return Math.round(sum / tasks.length);
}

/** Chuyển câu hỏi sang shape trả về cho FE. */
export function questionPublic(q: InterviewQuestion) {
  return {
    id: q.id,
    position: q.position,
    phase: q.phase,
    kind: q.kind,
    prompt: q.prompt,
    answer: q.answer,
    status: q.status,
  };
}

export { buildStore };
