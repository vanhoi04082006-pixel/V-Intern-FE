"use client";

/**
 * Typed API client — nguồn DUY NHẤT để FE gọi backend.
 * Agent backend (Task 1-a) sẽ MỞ RỘNG file này theo docs/API.md
 * (thêm các nhóm recruitment, tasks, mentor, evaluations, ...).
 * FE agents chỉ import từ đây.
 */

import { api, buildQuery, type PageData } from "./http";
import { setSession, clearSession, type SessionUser } from "./session";

/* ============================ AUTH ============================ */

export interface LoginResponse {
  accessToken: string;
  user: SessionUser;
}

export const authApi = {
  async login(email: string, password: string): Promise<SessionUser> {
    const res = await api<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setSession(res.accessToken, res.user);
    return res.user;
  },

  async register(input: {
    fullName: string;
    email: string;
    password: string;
    acceptedTerms: boolean;
  }): Promise<{ registered: boolean }> {
    return api("/auth/register", { method: "POST", body: input });
  },

  async logout(): Promise<void> {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      /* best-effort */
    }
    clearSession();
  },

  async me(): Promise<SessionUser> {
    return api("/auth/me");
  },
};

/* ======================= NOTIFICATIONS ======================= */

export type NotificationCategory =
  | "task"
  | "session"
  | "evaluation"
  | "kpi"
  | "salary"
  | "certificate"
  | "announcement"
  | "system"
  | "recruitment";

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  content: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

export const notificationApi = {
  list(params: { page?: number; pageSize?: number; unread?: boolean } = {}) {
    return api<PageData<AppNotification>>("/notifications", { query: params });
  },

  markRead(id: string) {
    return api<{ updated: number }>(`/notifications/${id}/read`, { method: "POST" });
  },

  markAllRead() {
    return api<{ updated: number }>("/notifications/read-all", { method: "POST" });
  },

  preferences() {
    return api<{ category: string; enabled: boolean }[]>("/notifications/preferences");
  },

  updatePreference(category: string, enabled: boolean) {
    return api<{ category: string; enabled: boolean }[]>("/notifications/preferences", {
      method: "PUT",
      body: { category, enabled },
    });
  },
};

/* ========================= PROFILE =========================== */

export interface MyProfile {
  id: string;
  email: string;
  displayName: string;
  role: string;
  roleLabel: string;
  avatarColor: string;
  joinedAt: string;
  lastLoginAt: string;
  studentId?: string;
  university?: string;
}

export const profileApi = {
  me: () => api<MyProfile>("/users/me/profile"),
};

/* ========================== GITHUB =========================== */

export interface GithubStatus {
  configured: boolean;
  connected: boolean;
  login: string | null;
  canCreatePublicRepo: boolean;
}

export const githubApi = {
  me: () => api<GithubStatus>("/github/me"),
  connect: () => api<{ authorizeUrl: string }>("/github/connect", { method: "POST" }),
  disconnect: () => api<{ ok: boolean }>("/github/me", { method: "DELETE" }),
};

/* ========================= WORKSPACE ========================= */

export interface AssignmentResource {
  id: string;
  code: string;
  name: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  description?: string;
  techStack?: string[];
}

export interface InternWorkspace {
  status: string;
  hasAssignmentHistory: boolean;
  assignment: {
    id: string;
    assignedAt: string;
    role: string;
    project: AssignmentResource;
    session: AssignmentResource;
  } | null;
  recruitment: {
    status: string;
    selectedRole: string | null;
    attemptCount: number;
    recruitedAt: string | null;
  } | null;
  currentSprint: {
    id: string;
    code: string;
    name: string;
    status: string;
    startDate: string;
    endDate: string;
    progress: number;
  } | null;
  taskSummary: { todo: number; doing: number; review: number; done: number; total: number };
  focusedTask: {
    id: string;
    code: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
    progress: number;
  } | null;
  notificationsUnread: number;
}

export const workspaceApi = {
  my: () => api<InternWorkspace>("/intern/me/workspace"),
};

/* ========================= RECRUITMENT ======================== */

export type RecruitmentRole = "frontend" | "backend" | "fullstack" | "qa" | "business_analyst";

export interface RecruitmentResultCriterion {
  code: string;
  label: string;
  score: number;
  feedback: string;
}

export interface InterviewResult {
  id: string;
  sessionId: string;
  roleCode: string;
  decision: "passed" | "failed";
  technicalScore: number;
  softSkillScore: number;
  englishScore: number;
  overallScore: number;
  criteria: RecruitmentResultCriterion[];
  strengths: string[];
  weaknesses: string[];
  feedback: string;
  recommendedRole: string;
  evaluatedAt: string;
}

export interface RecruitmentMe {
  status: string;
  selectedRole: string | null;
  selectedRoleLabel: string | null;
  attemptNumber: number;
  attemptsRemaining: number;
  nextEligibleAt: string | null;
  currentInterviewSessionId: string | null;
  result: InterviewResult | null;
}

export interface InterviewSummary {
  id: string;
  roleCode: string;
  status: string;
  startedAt: string;
  submittedAt: string | null;
  attemptNumber: number;
  decision: "passed" | "failed" | null;
  overallScore: number | null;
}

export interface InterviewSessionPublic {
  id: string;
  roleCode: string;
  status: string;
  startedAt: string;
  submittedAt: string | null;
  expiresAt: string;
  attemptNumber: number;
  secondsRemaining: number;
}

export interface InterviewQuestionPublic {
  id: string;
  position: number;
  phase: "introduction" | "technical" | "english" | "communication";
  kind: "main" | "follow_up";
  prompt: string;
  answer: string | null;
  status: "ready" | "answered" | "skipped";
}

export interface InterviewConversation {
  session: InterviewSessionPublic;
  answeredCount: number;
  totalQuestions: number;
  messages: { id: string; role: "ai" | "user"; content: string; at: string }[];
  currentQuestion: InterviewQuestionPublic | null;
  evaluating?: boolean;
  finished?: boolean;
}

export const recruitmentApi = {
  me: () => api<RecruitmentMe>("/recruitment/me"),

  interviews(params: { page?: number; pageSize?: number } = {}) {
    return api<PageData<InterviewSummary>>("/recruitment/me/interviews", { query: params });
  },

  selectRole(role: RecruitmentRole) {
    return api<Record<string, unknown>>("/recruitment/me/role", { method: "PATCH", body: { role } });
  },

  startInterview() {
    return api<{ session: InterviewSessionPublic; firstQuestion: InterviewQuestionPublic | null }>(
      "/recruitment/me/interviews",
      { method: "POST" }
    );
  },

  conversation(id: string) {
    return api<InterviewConversation>(`/recruitment/me/interviews/${id}/conversation`);
  },

  answer(id: string, questionId: string, answerText: string) {
    return api<{ question: InterviewQuestionPublic; currentQuestion: InterviewQuestionPublic | null; finished: boolean }>(
      `/recruitment/me/interviews/${id}/answers/${questionId}`,
      { method: "PUT", body: { answerText } }
    );
  },

  next(id: string) {
    return api<{ session: InterviewSessionPublic; currentQuestion: InterviewQuestionPublic | null; finished: boolean }>(
      `/recruitment/me/interviews/${id}/conversation/next`,
      { method: "POST" }
    );
  },

  clarify(id: string) {
    return api<{ message: string; currentQuestion: InterviewQuestionPublic }>(
      `/recruitment/me/interviews/${id}/conversation/clarify`,
      { method: "POST" }
    );
  },

  skip(id: string) {
    return api<{ session: InterviewSessionPublic; currentQuestion: InterviewQuestionPublic | null; finished: boolean }>(
      `/recruitment/me/interviews/${id}/skip`,
      { method: "POST" }
    );
  },

  submit(id: string) {
    return api<{ session: InterviewSessionPublic; evaluating: boolean; status: string }>(
      `/recruitment/me/interviews/${id}/submit`,
      { method: "POST" }
    );
  },

  retryEvaluation(id: string) {
    return api<{ session: InterviewSessionPublic; evaluating: boolean; status: string; retry?: boolean }>(
      `/recruitment/me/interviews/${id}/retry-evaluation`,
      { method: "POST" }
    );
  },

  result: () => api<InterviewResult | null>("/recruitment/me/result"),
};

/* =========================== TASKS =========================== */

export type TaskStatus = "todo" | "doing" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface Task {
  id: string;
  code: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  storyPoints: number;
  dueDate: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  projectId: string;
  sprintId: string | null;
  sprintCode: string | null;
  version: number;
  role: string;
  estimatedHours: number;
  createdAt: string;
}

export interface TaskDependency {
  taskId: string;
  code: string;
  title: string;
  status: TaskStatus;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  content: string;
  at: string;
}

export interface TaskHistoryEntry {
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus;
  changedBy: string;
  at: string;
  reason?: string | null;
}

export interface TaskDetail extends Task {
  dependencies: TaskDependency[];
  comments: TaskComment[];
  history: TaskHistoryEntry[];
}

export interface TaskSpec {
  requirements: string;
  role: string;
  dod: string[];
  documentation: string;
  expectedOutput: string;
  skillTags: string[];
  complexity: "easy" | "medium" | "hard";
  estimatedHours: number;
  blocked: boolean;
}

export type TaskListParams = {
  mine?: boolean;
  page?: number;
  pageSize?: number;
  status?: string;
  priority?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  projectId?: string;
  sprintId?: string;
  assigneeId?: string;
};

export const taskApi = {
  list(params: TaskListParams = {}) {
    return api<PageData<Task>>("/tasks", { query: params });
  },

  detail(id: string) {
    return api<TaskDetail>(`/tasks/${id}`);
  },

  spec(id: string) {
    return api<TaskSpec>(`/tasks/${id}/spec`);
  },

  comments(taskId: string, params: { page?: number; pageSize?: number } = {}) {
    return api<PageData<TaskComment>>(`/tasks/${taskId}/comments`, { query: params });
  },

  addComment(taskId: string, content: string) {
    return api<TaskComment>(`/tasks/${taskId}/comments`, { method: "POST", body: { content } });
  },

  updateMy(id: string, input: { status?: TaskStatus; progress?: number; reason?: string; expectedVersion: number }) {
    return api<Task>(`/tasks/${id}/my`, { method: "PATCH", body: input });
  },

  create(input: {
    title: string;
    description?: string;
    projectId: string;
    sprintId?: string | null;
    assigneeId?: string | null;
    priority?: TaskPriority;
    storyPoints?: number;
    dueDate?: string | null;
    role?: string;
  }) {
    return api<Task>("/tasks", { method: "POST", body: input });
  },

  update(id: string, input: Partial<{ title: string; description: string; status: TaskStatus; priority: TaskPriority; assigneeId: string | null; storyPoints: number; dueDate: string | null; progress: number; role: string; reason: string }>) {
    return api<Task>(`/tasks/${id}`, { method: "PATCH", body: input });
  },

  remove(id: string) {
    return api<{ deleted: boolean; id: string }>(`/tasks/${id}`, { method: "DELETE" });
  },
};

/* =========================== SPRINT =========================== */

export interface SprintSummary {
  id: string;
  code: string;
  name: string;
  goal: string;
  status: string;
  startDate: string;
  endDate: string;
  progress: number;
}

export interface SprintColumn {
  status: TaskStatus;
  count: number;
  tasks: Task[];
}

export interface SprintBoard {
  sprint: SprintSummary | null;
  overdueOpenTaskCount: number;
  columns: SprintColumn[];
}

export const sprintApi = {
  myBoard: () => api<SprintBoard>("/intern/me/sprint/board"),
  board: (sprintId: string) => api<SprintBoard>(`/sprints/${sprintId}/board`),
};

/* ========================= SUBMISSIONS ======================== */

export type SubmissionStatus = "submitted" | "approved" | "rework" | "withdrawn";

export interface Submission {
  id: string;
  taskId: string;
  internId: string;
  internName: string;
  prUrl: string;
  summary: string;
  status: SubmissionStatus;
  score: number | null;
  feedback: string | null;
  headSha: string;
  submittedAt: string;
}

export interface CodeReviewFinding {
  file: string;
  line: number;
  message: string;
  severity: "warning" | "error" | "info";
}

export interface CodeReviewResult {
  score: number;
  rubric: { functional: number; quality: number; testing: number; errors: number; security: number; dod: number };
  summary: string;
  limitations: string[];
  findings: CodeReviewFinding[];
}

export interface CodeReviewEvidence {
  complete: boolean;
  trustedTests: {
    status: string;
    passed: number;
    failed: number;
    executionTimeMs: number;
    checks: { name: string; passed: boolean; log: string }[];
  };
}

export interface CodeReview {
  id: string;
  submissionId: string;
  status: "running" | "awaiting_instructor" | "needs_changes" | "passed";
  model: string;
  result: CodeReviewResult | null;
  evidence: CodeReviewEvidence | null;
  scoredAt: string | null;
}

export interface ReviewRubricInput {
  functional: number;
  quality: number;
  testing: number;
  errors: number;
  security: number;
  dod: number;
}

export const submissionApi = {
  listOfTask(taskId: string) {
    return api<{ data: Submission[] }>(`/tasks/${taskId}/submissions`);
  },

  submit(taskId: string, input: { prUrl: string; summary: string }) {
    return api<Submission>(`/tasks/${taskId}/submissions`, { method: "POST", body: input });
  },

  withdraw(id: string) {
    return api<Submission>(`/submissions/${id}/withdraw`, { method: "POST" });
  },

  codeReviews(id: string) {
    return api<{ data: CodeReview[] }>(`/submissions/${id}/code-reviews`);
  },

  rerunCodeReview(id: string) {
    return api<CodeReview>(`/submissions/${id}/code-reviews`, { method: "POST" });
  },

  instructorReview(id: string, input: { scores: ReviewRubricInput; feedback: string; overrideReason?: string }) {
    return api<{ submission: Submission; review: CodeReview | null }>(`/submissions/${id}/review`, {
      method: "POST",
      body: input,
    });
  },
};

/* ========================== AI MENTOR ========================= */

export interface MentorConversation {
  id: string;
  title: string;
  createdAt: string;
  lastMessageAt: string;
  messageCount: number;
  status: "active" | "archived";
}

export interface MentorMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  at: string;
  taskId: string | null;
}

export const mentorApi = {
  conversations(params: { page?: number; pageSize?: number; status?: "active" | "archived" } = {}) {
    return api<PageData<MentorConversation>>("/intern/me/ai-mentor/conversations", { query: params });
  },

  createConversation(title?: string) {
    return api<MentorConversation>("/intern/me/ai-mentor/conversations", { method: "POST", body: { title } });
  },

  conversation(id: string) {
    return api<{ conversation: MentorConversation; messages: MentorMessage[] }>(
      `/intern/me/ai-mentor/conversations/${id}`
    );
  },

  send(id: string, content: string, taskId?: string) {
    return api<{ userMessage: MentorMessage; assistantMessage: MentorMessage; followUps: string[] }>(
      `/intern/me/ai-mentor/conversations/${id}/messages`,
      { method: "POST", body: { content, taskId } }
    );
  },

  archive(id: string) {
    return api<MentorConversation>(`/intern/me/ai-mentor/conversations/${id}/archive`, { method: "POST" });
  },
};

/* ========================== OUTCOMES ========================== */

export interface MyEvaluation {
  id: string;
  cycleId: string;
  cycleName: string;
  status: "draft" | "submitted" | "finalized";
  overallScore: number | null;
  summary: string | null;
  evaluatorName: string;
  finalizedAt: string | null;
  submittedAt: string | null;
  scores: { criterionCode: string; label: string; score: number | null; comment: string | null }[];
}

export interface PerformanceMetrics {
  totalTaskCount: number;
  completedTaskCount: number;
  taskCompletionRate: number;
  committedStoryPoints: number;
  completedStoryPoints: number;
  storyPointCompletionRate: number;
  onTimeCompletionRate: number;
  overdueOpenTaskCount: number;
  averageEvaluationScore: number | null;
  finalizedEvaluationCount: number;
  activeSprintProgress: number | null;
}

export interface KpiMetric {
  metricCode: string;
  label: string;
  sourceValue: number;
  configuredWeight: number;
  effectiveWeight: number;
  weightedContribution: number;
  sourceJson: Record<string, unknown>;
}

export interface KpiSummary {
  id: string;
  period: string;
  status: "calculated" | "pending";
  finalScore: number;
  calculatedAt: string;
}

export interface KpiDetail extends KpiSummary {
  metrics: KpiMetric[];
}

export interface SalaryEntry {
  id: string;
  type: "kpi_earning" | "bonus" | "penalty" | "adjustment";
  amount: number;
  description: string;
  at: string;
}

export interface VirtualSalary {
  balance: number;
  unit: string;
  virtual: boolean;
  earnedThisPeriod: number;
  latestEntries: SalaryEntry[];
}

export interface CertificateSummary {
  id: string;
  certificateNumber: string;
  status: "issued" | "revoked";
  issuedAt: string;
  projectName: string;
  sessionName: string;
}

export interface CertificateDetail extends CertificateSummary {
  verificationCode: string;
  completedAt: string;
  policyCode: string;
  revokedAt: string | null;
}

export interface CertificateVerification {
  valid: boolean;
  reason?: string;
  certificateNumber?: string;
  holderName?: string;
  projectName?: string;
  sessionName?: string;
  issuedAt?: string;
}

export interface AiRecommendation {
  type: "skill" | "process" | "career";
  priority: "high" | "medium" | "low";
  title: string;
  reason: string;
  actions: string[];
  evidenceMetricCodes: string[];
}

export interface RecommendationSet {
  id: string;
  createdAt: string;
  summary: string;
  recommendations: AiRecommendation[];
}

export const outcomeApi = {
  evaluations: () => api<{ data: MyEvaluation[] }>("/intern/me/evaluations"),
  performance: () => api<PerformanceMetrics>("/intern/me/performance"),
  kpis: () => api<{ data: KpiSummary[] }>("/intern/me/kpi"),
  kpi: (id: string) => api<KpiDetail>(`/intern/me/kpi/${id}`),
  virtualSalary: () => api<VirtualSalary>("/intern/me/virtual-salary"),
  salaryLedger(params: { page?: number; pageSize?: number } = {}) {
    return api<PageData<SalaryEntry>>("/intern/me/virtual-salary/ledger", { query: params });
  },
  certificates: () => api<{ data: CertificateSummary[] }>("/intern/me/certificates"),
  certificate: (id: string) => api<CertificateDetail>(`/intern/me/certificates/${id}`),
  verifyCertificate: (code: string) => api<CertificateVerification>(`/certificates/verify/${encodeURIComponent(code)}`),
  recommendations: () => api<RecommendationSet>("/intern/me/ai-recommendations"),
  refreshRecommendations: () => api<RecommendationSet>("/intern/me/ai-recommendations/refresh", { method: "POST" }),
};

/* ====================== PROJECT TEMPLATES ===================== */

export interface TeamSize {
  min: number;
  max: number;
}

export interface TemplateSummary {
  id: string;
  code: string;
  name: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  status: "active" | "draft" | "archived";
  version: number;
  techStack: string[];
  roles: string[];
  teamSize: TeamSize;
  sprintCount: number;
  description: string;
  createdAt: string;
}

export interface BlueprintRoleDetail {
  code: string;
  label: string;
  countMin: number;
  countMax: number;
  skills: string[];
  responsibilities: string[];
}

export interface BlueprintTask {
  title: string;
  priority: TaskPriority;
  storyPoints: number;
  role: string;
}

export interface BlueprintSprint {
  code: string;
  name: string;
  goal: string;
  tasks: BlueprintTask[];
}

export interface BlueprintMilestone {
  title: string;
  dueOffsetDays: number;
}

export interface ProjectBlueprint {
  overview: string;
  roleDetails: BlueprintRoleDetail[];
  sprints: BlueprintSprint[];
  milestones: BlueprintMilestone[];
}

export interface TemplateRun {
  sessionId: string;
  sessionName: string;
  startedAt: string;
}

export interface TemplateDetail extends TemplateSummary {
  blueprint: ProjectBlueprint;
  runs: TemplateRun[];
}

export const templateApi = {
  list(params: { page?: number; pageSize?: number; search?: string; category?: string; difficulty?: string; status?: string } = {}) {
    return api<PageData<TemplateSummary>>("/project-templates", { query: params });
  },

  detail(id: string) {
    return api<TemplateDetail>(`/project-templates/${id}`);
  },

  start(id: string, input: { name?: string; startDate?: string; endDate?: string } = {}) {
    return api<{ projectId: string; sessionId: string; sessionCode: string; deduped?: boolean }>(
      `/project-templates/${id}/start`,
      { method: "POST", body: input }
    );
  },

  create(input: Partial<TemplateDetail>) {
    return api<TemplateDetail>("/project-templates", { method: "POST", body: input });
  },

  update(id: string, input: { name?: string; category?: string; difficulty?: string; status?: string; description?: string; expectedVersion: number }) {
    return api<TemplateDetail>(`/project-templates/${id}`, { method: "PATCH", body: input });
  },
};

/* ========================== SESSIONS ========================== */

export interface SessionOverviewItem {
  id: string;
  code: string;
  name: string;
  status: "planning" | "active" | "completed" | "cancelled";
  startDate: string;
  endDate: string;
  project: { id: string; code: string; name: string } | null;
  memberCount: number;
  sprintCount: number;
  taskTotal: number;
  taskDone: number;
  taskPercent: number;
  currentSprint: { id: string; code: string; name: string } | null;
  alerts: { overdueTasks: number; pendingReview: number; sessionOverdue: boolean };
}

export interface SessionMember {
  userId: string;
  displayName: string;
  role: string;
  assignmentStatus: string;
  avatarColor: string;
}

export interface SessionSprint {
  id: string;
  code: string;
  name: string;
  status: string;
  progress: number;
  startDate: string;
  endDate: string;
}

export interface SessionMilestone {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export interface SessionDetail {
  id: string;
  code: string;
  name: string;
  status: "planning" | "active" | "completed" | "cancelled";
  startDate: string;
  endDate: string;
  project: { id: string; code: string; name: string; description?: string; techStack?: string[] } | null;
  description: string;
  instructors: { userId: string; displayName: string }[];
  members: SessionMember[];
  sprints: SessionSprint[];
  milestones: SessionMilestone[];
  stats: {
    taskTotal: number;
    taskDone: number;
    taskPercent: number;
    submissionTotal: number;
    pendingReviewCount: number;
    activeInternCount: number;
  };
  plan: { status: "none" | "generating" | "draft" | "published"; planId: string | null };
}

export interface TaskWithSubmission extends Task {
  submission: {
    id: string;
    status: SubmissionStatus;
    prUrl: string;
    aiScore: number | null;
    aiSummary: string | null;
    instructorScore: number | null;
    instructorFeedback: string | null;
    submittedAt: string;
  } | null;
}

export interface TimelineEvent {
  id: string;
  action: string;
  summary: string;
  actorName: string;
  createdAt: string;
}

export interface MemberOption {
  userId: string;
  displayName: string;
  email: string;
  selectedRole: string | null;
  result: { overallScore: number } | null;
  hasActiveAssignment: boolean;
}

export const sessionApi = {
  overview(params: { page?: number; pageSize?: number; q?: string; status?: string; sortBy?: string; sortDirection?: "asc" | "desc" } = {}) {
    return api<PageData<SessionOverviewItem>>("/sessions/overview", { query: params });
  },

  detail(id: string) {
    return api<SessionDetail>(`/sessions/${id}`);
  },

  work(id: string, params: { page?: number; pageSize?: number; status?: string; priority?: string; assigneeId?: string; search?: string } = {}) {
    return api<PageData<TaskWithSubmission>>(`/sessions/${id}/work`, { query: params });
  },

  timeline(id: string, params: { page?: number; pageSize?: number } = {}) {
    return api<PageData<TimelineEvent>>(`/sessions/${id}/timeline`, { query: params });
  },

  memberOptions(params: { sessionId: string; role?: string }) {
    return api<{ data: MemberOption[] }>("/sessions/member-options", { query: params });
  },

  addMember(id: string, userId: string, role: string) {
    return api<SessionMember>(`/sessions/${id}/members`, { method: "POST", body: { userId, role } });
  },

  removeMember(id: string, userId: string) {
    return api<{ removed: boolean; assignmentId: string }>(`/sessions/${id}/members/${userId}`, { method: "DELETE" });
  },

  updateStatus(id: string, status: string) {
    return api<{ id: string; code: string; name: string; status: string }>(`/sessions/${id}`, {
      method: "PATCH",
      body: { status },
    });
  },
};

/* ====================== AI PLANS (SPRINT) ===================== */

export interface PlanDraftTask {
  key: string;
  dependsOn: string[];
  title: string;
  description: string;
  priority: TaskPriority;
  storyPoints: number;
  dueDate: string;
  suggestedRole: string;
}

export interface PlanDraftSprint {
  code: string;
  name: string;
  goal: string;
  tasks: PlanDraftTask[];
}

export interface PlanListItem {
  planId: string;
  sessionId: string;
  status: "generating" | "draft" | "published" | "failed";
  createdAt: string;
  sprintCount: number;
  taskCount: number;
}

export interface PlanDetail {
  planId: string;
  sessionId: string;
  status: "generating" | "draft" | "published" | "failed";
  createdAt: string;
  draft: { sprints: PlanDraftSprint[]; milestones: BlueprintMilestone[] } | null;
  warnings: string[];
  error: string | null;
  sprintCount: number;
  taskCount: number;
}

export const planApi = {
  generate(sessionId: string) {
    return api<{ planId: string; status: string }>("/ai-generations/plans/generate", {
      method: "POST",
      body: { sessionId },
    });
  },

  list(sessionId?: string) {
    return api<{ data: PlanListItem[] }>("/ai-generations/plans", { query: { sessionId } });
  },

  detail(planId: string) {
    return api<PlanDetail>(`/ai-generations/plans/${planId}`);
  },

  confirm(planId: string) {
    return api<{ sprintIds: string[]; taskIds: string[]; sprintCount: number; taskCount: number }>(
      "/ai-generations/sprint-plan/confirm",
      { method: "POST", body: { planId } }
    );
  },
};

/* ======================== CANDIDATES ========================== */

export interface CandidateResult {
  overallScore: number;
  technicalScore: number;
  softSkillScore: number;
  decision: "passed" | "failed";
  strengths: string[];
  weaknesses: string[];
}

export interface Candidate {
  userId: string;
  displayName: string;
  email: string;
  selectedRole: string | null;
  attemptCount: number;
  recruitedAt: string | null;
  hasActiveAssignment: boolean;
  activeProjectName: string | null;
  result: CandidateResult | null;
}

export interface CandidateDetail extends Candidate {
  university?: string | null;
  studentId?: string | null;
  maxAttempts?: number;
  nextEligibleAt?: string | null;
  interview: {
    sessionId: string;
    attemptNumber: number;
    roleCode: string;
    startedAt: string;
    submittedAt: string | null;
    decision: "passed" | "failed" | null;
    overallScore: number | null;
    questions: { prompt: string; answer: string | null; score: number | null; phase: string }[];
  } | null;
}

export interface Assignment {
  id: string;
  internId: string;
  internName: string;
  role: string;
  projectId: string;
  sessionId: string;
  status: "active" | "cancelled";
  assignedAt: string;
}

export const candidateApi = {
  list(params: { page?: number; pageSize?: number; search?: string; role?: string; status?: string } = {}) {
    return api<PageData<Candidate>>("/recruitment/candidates", { query: params });
  },

  detail(userId: string) {
    return api<CandidateDetail>(`/recruitment/candidates/${userId}`);
  },

  assignments(sessionId?: string) {
    return api<{ data: Assignment[] }>("/assignments", { query: { sessionId } });
  },

  cancelAssignment(id: string) {
    return api<Assignment>(`/assignments/${id}/cancel`, { method: "POST" });
  },
};

/* ==================== EVALUATION CYCLES ======================= */

export interface EvaluationCycle {
  id: string;
  name: string;
  status: "draft" | "open" | "closed" | "archived";
  startDate: string;
  endDate: string;
  evaluationCount: number;
  criteriaCount: number;
}

export interface Criterion {
  id: string;
  cycleId: string;
  code: string;
  label: string;
  weight: number;
  maxScore: number;
}

export interface EvaluationRow {
  id: string;
  cycleId: string;
  cycleName: string;
  internId: string;
  internName: string;
  status: "draft" | "submitted" | "finalized";
  overallScore: number | null;
  evaluatorName: string;
  updatedAt: string;
}

export interface EvaluationScoreInput {
  criterionId: string;
  score?: number | null;
  comment?: string | null;
}

export interface EvaluationDetail {
  evaluation: EvaluationRow & {
    summary: string | null;
    createdAt: string;
    submittedAt: string | null;
    finalizedAt: string | null;
    scores: { criterionCode: string; label: string; score: number | null; comment: string | null }[];
  };
  scores: (Criterion & { score: number | null; comment: string | null })[];
  intern: {
    id: string;
    displayName: string;
    email: string;
    avatarColor: string;
    university: string | null;
    studentId: string | null;
  } | null;
}

export interface AiSuggestion {
  criterionCode: string;
  label: string;
  suggestedScore: number;
  comment: string;
  evidence: string[];
}

export interface EvaluationAiSuggestions {
  summary: string;
  strengths: string[];
  improvementAreas: string[];
  criteriaSuggestions: AiSuggestion[];
}

export const evaluationApi = {
  cycles: () => api<{ data: EvaluationCycle[] }>("/evaluation-cycles"),

  createCycle(input: { name: string; startDate?: string; endDate?: string }) {
    return api<EvaluationCycle>("/evaluation-cycles", { method: "POST", body: input });
  },

  setCycleStatus(id: string, status: string) {
    return api<EvaluationCycle>(`/evaluation-cycles/${id}/status`, { method: "POST", body: { status } });
  },

  criteria(cycleId: string) {
    return api<{ data: Criterion[] }>(`/evaluation-cycles/${cycleId}/criteria`);
  },

  addCriterion(cycleId: string, input: { code: string; label: string; weight: number; maxScore: number }) {
    return api<Criterion>(`/evaluation-cycles/${cycleId}/criteria`, { method: "POST", body: input });
  },

  updateCriterion(id: string, input: Partial<{ code: string; label: string; weight: number; maxScore: number }>) {
    return api<Criterion>(`/criteria/${id}`, { method: "PATCH", body: input });
  },

  deleteCriterion(id: string) {
    return api<{ deleted: boolean; id: string }>(`/criteria/${id}`, { method: "DELETE" });
  },

  list(params: { cycleId?: string; status?: string; page?: number; pageSize?: number } = {}) {
    return api<PageData<EvaluationRow>>("/evaluations", { query: params });
  },

  create(input: { cycleId: string; internId: string }) {
    return api<EvaluationRow>("/evaluations", { method: "POST", body: input });
  },

  detail(id: string) {
    return api<EvaluationDetail>(`/evaluations/${id}`);
  },

  update(id: string, input: { scores?: EvaluationScoreInput[]; summary?: string | null }) {
    return api<EvaluationDetail>(`/evaluations/${id}`, { method: "PATCH", body: input });
  },

  submit(id: string) {
    return api<EvaluationRow>(`/evaluations/${id}/submit`, { method: "POST" });
  },

  finalize(id: string) {
    return api<EvaluationRow>(`/evaluations/${id}/finalize`, { method: "POST" });
  },

  aiSuggestions(id: string) {
    return api<EvaluationAiSuggestions>(`/evaluations/${id}/ai-suggestions`, { method: "POST" });
  },
};

/* ======================== PERFORMANCE ========================= */

export interface InternPerformanceRow {
  userId: string;
  displayName: string;
  role: string;
  totalTaskCount: number;
  completedTaskCount: number;
  taskCompletionRate: number;
  storyPointCompletionRate: number;
  averageEvaluationScore: number | null;
  onTimeCompletionRate: number;
  rank: number;
}

export interface InternPerformanceDetail {
  profile: { userId: string; displayName: string; email: string; role: string };
  metrics: PerformanceMetrics;
  assignments: { projectName: string; sessionName: string; role: string; status: string }[];
  tasks: { items: TaskWithSubmission[] };
  trend: { month: string; created: number; completed: number }[];
  interviewSummary: {
    decision: "passed" | "failed";
    overallScore: number;
    technicalScore: number;
    softSkillScore: number;
  } | null;
}

export const performanceApi = {
  interns(params: { projectId?: string; sessionId?: string; search?: string; page?: number; pageSize?: number } = {}) {
    return api<PageData<InternPerformanceRow>>("/performance/interns", { query: params });
  },

  internDetail(userId: string) {
    return api<InternPerformanceDetail>(`/performance/interns/${userId}/detail`);
  },
};

/* ========================== REPORTS =========================== */

export type ReportKind = "progress" | "performance" | "evaluation" | "review" | "risk";

export interface ReportRow {
  id: string;
  kind: ReportKind;
  title: string;
  scope: string;
  createdAt: string;
  authorName: string;
}

export interface ReportList {
  items: ReportRow[];
  counts: { kind: ReportKind; count: number }[];
}

export interface ReportSnapshot {
  id: string;
  kind: ReportKind;
  title: string;
  createdAt: string;
  projectName: string;
  scope: string;
  summary: {
    total: number;
    completed: number;
    overdue: number;
    blocked: number;
    unassigned: number;
    risk: "low" | "medium" | "high";
    reasons: string[];
  };
  members: {
    displayName: string;
    totalTaskCount: number;
    completedTaskCount: number;
    taskCompletionRate: number;
    averageEvaluationScore: number | null;
    submissionCount: number;
    approvedCount: number;
    reworkCount: number;
  }[];
  tasks: { code: string; title: string; status: TaskStatus; assigneeName: string | null; priority: TaskPriority; dueDate: string | null }[];
  timeline: { at: string; action: string; summary: string; actorName: string }[];
}

export const reportApi = {
  list: () => api<ReportList>("/reports"),

  create(input: { kind: ReportKind; sessionId?: string; title?: string }) {
    return api<{ id: string; deduped?: boolean }>("/reports", { method: "POST", body: input });
  },

  detail(id: string) {
    return api<ReportSnapshot>(`/reports/${id}`);
  },

  /** Tải CSV — dùng downloadFile từ http.ts nếu cần blob download. */
  csvUrl: (id: string) => `/api/v1/reports/${id}/csv`,
};

/* =========================== ADMIN ============================ */

export interface AdminDashboard {
  counts: {
    users: number;
    interns: number;
    instructors: number;
    admins: number;
    sessions: number;
    activeSessions: number;
    templates: number;
    questions: number;
    certificates: number;
  };
  recentActivity: { id: string; action: string; actorName: string; at: string; summary: string }[];
  systemHealth: string;
}

export interface AdminUserRow {
  id: string;
  email: string;
  displayName: string;
  role: string;
  status: "active" | "pending" | "locked";
  joinedAt: string;
  lastLoginAt: string | null;
}

export interface QuestionBankItem {
  id: string;
  roleCode: string;
  phase: "introduction" | "technical" | "english" | "communication";
  difficulty: "easy" | "medium" | "hard";
  language: string;
  prompt: string;
  expectedConcepts: string[];
  isActive: boolean;
  version: number;
}

export interface AiConfiguration {
  model: string;
  timeoutMs: number;
  maxRetries: number;
  version: number;
  provider: string;
  fallbackEnabled: boolean;
}

export interface SystemStatus {
  status: string;
  database: { latencyMs: number; connected: boolean };
  counts: { users: number; sessions: number; tasks: number; submissions: number };
  githubIntegration: { configured: boolean; webhookHealthy: boolean };
  aiRunsLast24h: number;
  learningAlerts: number;
  services: { name: string; status: string; latencyMs: number }[];
}

export interface AdminSetting {
  key: string;
  value: string;
  description: string;
  isSecret: boolean;
}

export interface ActivityEventRow {
  id: string;
  module: "auth" | "recruitment" | "session" | "task" | "evaluation" | "system";
  action: string;
  actorName: string;
  summary: string;
  at: string;
}

export interface AuditLogRow {
  id: string;
  actorName: string;
  action: "LOGIN" | "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE";
  target: string;
  at: string;
  ip: string;
}

export const adminApi = {
  dashboard: () => api<AdminDashboard>("/admin/dashboard"),

  users(params: { page?: number; pageSize?: number; q?: string; role?: string; status?: string } = {}) {
    return api<PageData<AdminUserRow>>("/admin/users", { query: params });
  },

  createUser(input: { email: string; displayName: string; password?: string; role?: string }) {
    return api<AdminUserRow>("/admin/users", { method: "POST", body: input });
  },

  updateUser(id: string, input: { displayName?: string; role?: string }) {
    return api<AdminUserRow>(`/admin/users/${id}`, { method: "PATCH", body: input });
  },

  setUserStatus(id: string, status: string) {
    return api<AdminUserRow>(`/admin/users/${id}/status`, { method: "PATCH", body: { status } });
  },

  questionBank(params: { page?: number; pageSize?: number; role?: string; phase?: string; difficulty?: string; search?: string } = {}) {
    return api<PageData<QuestionBankItem>>("/admin/question-bank", { query: params });
  },

  questionCoverage() {
    return api<{ data: { roleCode: string; phase: string; count: number }[] }>("/admin/question-bank/coverage");
  },

  createQuestion(input: { roleCode: string; phase: string; difficulty: string; prompt: string; expectedConcepts: string[] }) {
    return api<QuestionBankItem>("/admin/question-bank", { method: "POST", body: input });
  },

  updateQuestion(id: string, input: Partial<QuestionBankItem> & { version: number }) {
    return api<QuestionBankItem>(`/admin/question-bank/${id}`, { method: "PUT", body: input });
  },

  retireQuestion(id: string, version: number) {
    return api<{ retired: boolean; id: string; isActive: boolean }>(`/admin/question-bank/${id}`, {
      method: "DELETE",
      query: { version },
    });
  },

  aiConfiguration: () => api<AiConfiguration>("/admin/ai-configuration"),

  updateAiConfiguration(input: { model: string; timeoutMs: number; maxRetries: number }) {
    return api<AiConfiguration>("/admin/ai-configuration", { method: "PUT", body: input });
  },

  systemStatus: () => api<SystemStatus>("/admin/system/status"),

  settings: () => api<AdminSetting[]>("/admin/settings"),

  updateSetting(key: string, value: string) {
    return api<AdminSetting>("/admin/settings", { method: "PATCH", body: { key, value } });
  },

  activityEvents(params: { page?: number; pageSize?: number; module?: string; search?: string } = {}) {
    return api<PageData<ActivityEventRow>>("/admin/activity-events", { query: params });
  },

  auditLogs(params: { page?: number; pageSize?: number; actor?: string; action?: string } = {}) {
    return api<PageData<AuditLogRow>>("/admin/audit-logs", { query: params });
  },
};

/* ==================================================================== */
/* TUYỂN DỤNG CÔNG KHAI & NGHỀ NGHIỆP (Task 2-a — apply.ts backend)      */
/* Cổng nộp CV /apply, đợt tuyển + khung giờ, thư viện nghề, mail queue  */
/* ==================================================================== */

/** 9 trạng thái hồ sơ ứng tuyển công khai. */
export type ApplicationStatus =
  | "unverified"
  | "queued"
  | "analyzing"
  | "needs_information"
  | "waitlisted"
  | "booked"
  | "cancelled"
  | "deferred"
  | "failed";

export type RoundStatus = "draft" | "open" | "closed";
export type SlotStatus = "open" | "closed";
export type CareerRoleStatus = "draft" | "published" | "archived";
export type CareerLevel = "intern" | "junior";
export type CareerLanguage = "vi" | "en";

/** 9 trạng thái thư trong hàng đợi email. */
export type MailStatus =
  | "pending"
  | "sending"
  | "accepted"
  | "delivered"
  | "uncertain"
  | "bounced"
  | "dead"
  | "blocked"
  | "failed";

export type MailKind = "verify" | "schedule" | "credentials" | "existing-account" | "cancelled";

export type TimelineKind =
  | "submitted"
  | "email_sent"
  | "email_verified"
  | "analysis_completed"
  | "needs_information"
  | "cv_updated"
  | "status_changed"
  | "waitlisted"
  | "slot_booked"
  | "slot_rescheduled"
  | "slot_released"
  | "cancelled"
  | "credentials_sent"
  | "credentials_resent"
  | "credentials_recovered";

export interface SkillRequirement {
  skill: string;
  weight: number;
  mandatory: boolean;
}

export interface AgentAnalysisFact {
  skill: string;
  evidence: string;
}

/** Kết quả phân tích CV bởi Agent (matchedRole chọn từ career-roles, confidence 62–91%). */
export interface AgentAnalysis {
  matchedRole: string;
  matchedRoleLabel: string;
  confidence: number;
  facts: AgentAnalysisFact[];
  missing: string[];
  summary: string;
  analyzedAt: string;
}

export interface TimelineEvent {
  id: string;
  applicationId: string;
  kind: TimelineKind;
  message: string;
  actor: string;
  at: string;
}

/** Lịch phỏng vấn hiện tại của hồ sơ (null khi chưa đặt). */
export interface SlotBookingInfo {
  slotId: string;
  roleCode: string;
  startsAt: string;
  endsAt: string;
  location: string;
  bookedAt: string;
}

/** Chính sách đặt lại lịch của một hồ sơ (mock attemptsRemaining 0–2). */
export interface RebookingPolicy {
  canRebook: boolean;
  attemptsUsed: number;
  attemptsRemaining: number;
  nextEligibleAt: string | null;
  allowedRoleCodes: string[];
  serverNow: string;
}

/** Đợt tuyển cho cổng công khai (GET /applications/rounds). */
export interface PublicApplyRound {
  id: string;
  code: string;
  name: string;
  status: "open";
  opensAt: string;
  closesAt: string;
  openSlotCount: number;
  openRoles: { code: string; label: string }[];
}

/** Khung giờ phỏng vấn (dùng chung public + staff). */
export interface ApplySlot {
  id: string;
  roundId: string;
  roleCode: string;
  roleLabel: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  bookedCount: number;
  remaining: number;
  status: SlotStatus;
  minimumPreparationMinutes: number;
  credentialsLeadMinutes: number;
  location: string;
  createdAt: string;
}

/** Hồ sơ ứng tuyển — shape public (cổng /apply). */
export interface PublicApplication {
  id: string;
  roundId: string;
  fullName: string;
  email: string;
  status: ApplicationStatus;
  statusLabel: string;
  cvFileName: string | null;
  createdAt: string;
  updatedAt: string;
  booking: SlotBookingInfo | null;
  cancelReason: string | null;
  credentialsSentAt: string | null;
  nextRebookEligibleAt: string | null;
}

/** GET /applications/me — hồ sơ + booking + timeline + policy (+ slots khả dụng). */
export interface ApplyMePayload {
  round: { id: string; code: string; name: string; status: RoundStatus; closesAt: string } | null;
  application: PublicApplication;
  analysis: AgentAnalysis | null;
  booking: SlotBookingInfo | null;
  timeline: TimelineEvent[];
  rebookingPolicy: RebookingPolicy;
  availableSlots?: ApplySlot[];
}

/** Dòng hồ sơ cho bảng giảng viên/admin. */
export interface ApplicationRecordRow extends PublicApplication {
  emailHint: string;
  matchedRole: string | null;
  matchedRoleLabel: string | null;
  confidence: number | null;
  rebookingAttemptsUsed: number;
  rebookingAttemptsRemaining: number;
  hasAccount: boolean;
}

/** GET /recruitment-rounds/:id/applications/:appId — chi tiết đầy đủ. */
export interface StaffApplicationDetail {
  application: ApplicationRecordRow & { recoveryRevision: number; accountUserId: string | null };
  analysis: AgentAnalysis | null;
  timeline: TimelineEvent[];
  rebookingPolicy: RebookingPolicy;
  mails: MailRecordRow[];
}

/** Dòng đợt tuyển trong bảng quản trị. */
export interface RoundRecord {
  id: string;
  code: string;
  name: string;
  description: string;
  status: RoundStatus;
  opensAt: string;
  closesAt: string;
  createdAt: string;
  slotCount: number;
  openSlotCount: number;
  applicationCount: number;
  bookedCount: number;
}

/** Chính sách đợt tuyển (kèm mặc định khi tạo khung giờ). */
export interface RoundPolicy {
  maxRebookingAttempts: number;
  rebookingCooldownMinutes: number;
  cancellationDeadlineHours: number;
  minimumPreparationMinutesDefault: number;
  credentialsLeadMinutesDefault: number;
}

export interface RoundDetailPayload {
  round: RoundRecord;
  slots: ApplySlot[];
  policy: RoundPolicy;
  stats: { applicationCount: number; byStatus: Record<string, number> };
}

/** Career role — thư viện nghề (admin). */
export interface CareerRoleRecord {
  code: string;
  name: string;
  description: string;
  level: CareerLevel;
  language: CareerLanguage;
  requiredSkills: SkillRequirement[];
  optionalSkills: string[];
  version: number;
  status: CareerRoleStatus;
  acceptingApplications: boolean;
  createdAt: string;
  updatedAt: string;
  questionCount: number;
}

/** Career role bản public (GET /career-roles — chỉ published + accepting). */
export type PublicCareerRole = Omit<
  CareerRoleRecord,
  "status" | "acceptingApplications" | "createdAt" | "updatedAt"
>;

/** Snapshot nội dung một phiên bản nghề. */
export interface CareerRoleRevision {
  id: string;
  code: string;
  version: number;
  note: string;
  changedBy: string;
  changedAt: string;
  snapshot: Omit<CareerRoleRecord, "code" | "createdAt" | "updatedAt" | "questionCount">;
}

/** Dòng thư trong hàng đợi email (admin). */
export interface MailRecordRow {
  id: string;
  kind: MailKind;
  subject: string;
  recipientHint: string;
  applicationId: string | null;
  applicationName: string | null;
  roundId: string | null;
  availableAt: string;
  attempts: number;
  status: MailStatus;
  lastCode: string | null;
  lastResentAt: string | null;
  resendable: boolean;
  cooldownRemainingSeconds: number;
  createdAt: string;
  updatedAt: string;
}

/** GET /admin/communications/:id/preview. */
export interface MailPreview {
  id: string;
  kind: MailKind;
  subject: string;
  recipientHint: string;
  applicationName: string | null;
  status: MailStatus;
  attempts: number;
  lastCode: string | null;
  availableAt: string;
  lastResentAt: string | null;
  html: string;
  text: string;
}

/** GET .../credential-recovery — điều kiện khôi phục credentials. */
export interface CredentialRecoveryInfo {
  canRecover: boolean;
  reason: string | null;
  expectedRevision: number;
  slotId: string | null;
  hasAccount: boolean;
  serverNow: string;
}

/* ------------------------- applyApi — cổng công khai ------------------------- */

export const applyApi = {
  /** Đợt tuyển đang mở (public). */
  rounds: () => api<{ data: PublicApplyRound[] }>("/applications/rounds"),

  /** Thư viện nghề bản public (chỉ published + đang nhận hồ sơ). */
  roles: () => api<{ data: PublicCareerRole[] }>("/career-roles"),

  /** Khung giờ còn chỗ của một đợt (lọc theo role nếu muốn). */
  slots: (roundId: string, roleCode?: string) =>
    api<{ data: ApplySlot[] }>("/applications/slots", { query: { roundId, roleCode } }),

  /** Nộp hồ sơ — trả verifyToken (mock: xem được luôn để demo luồng verify). */
  create(input: { roundId: string; fullName: string; email: string; cvFileName?: string; consent: true }) {
    return api<{ applicationId: string; verifyToken: string; status: ApplicationStatus; mailId: string; message: string }>(
      "/applications",
      { method: "POST", body: input }
    );
  },

  /** Xác minh email → unverified → queued → analyzing (Agent phân tích đồng bộ). */
  verify(token: string) {
    return api<{ application: PublicApplication; analysis: AgentAnalysis | null; status: ApplicationStatus }>(
      "/applications/verify",
      { method: "POST", body: { token } }
    );
  },

  /** Tra cứu hồ sơ theo email + đợt (thay cookie — dùng cho trang /apply/me). */
  me: (email: string, roundId: string) => api<ApplyMePayload>("/applications/me", { query: { email, roundId } }),

  /** Đặt / đổi lịch phỏng vấn (tuân thủ rebooking policy). */
  book: (input: { email: string; roundId: string; slotId: string }) =>
    api<{ application: PublicApplication; booking: SlotBookingInfo; rebookingPolicy: RebookingPolicy }>(
      "/applications/me/book",
      { method: "POST", body: input }
    ),

  /** Nộp lại CV khi needs_information/failed → phân tích lại. */
  updateCv: (input: { email: string; roundId: string; cvFileName: string }) =>
    api<{ application: PublicApplication; analysis: AgentAnalysis }>("/applications/me/cv", {
      method: "POST",
      body: input,
    }),

  /** Ứng viên tự rút hồ sơ → cancelled (giải phóng slot nếu đã đặt). */
  leave: (input: { email: string; roundId: string }) =>
    api<{ application: PublicApplication }>("/applications/leave", { method: "POST", body: input }),

  /** Xin lại link truy cập — luôn trả message trung lập. */
  requestAccess: (input: { roundId: string; email: string }) =>
    api<{ message: string }>("/applications/request-access", { method: "POST", body: input }),
};

/* ---------------- recruitmentRoundApi — đợt tuyển (staff) ---------------- */

export const recruitmentRoundApi = {
  list: (params: { page?: number; pageSize?: number; status?: RoundStatus } = {}) =>
    api<PageData<RoundRecord>>("/recruitment-rounds", { query: params }),

  create: (input: { name: string; opensAt: string; closesAt: string; description?: string }) =>
    api<RoundRecord & { slots: ApplySlot[] }>("/recruitment-rounds", { method: "POST", body: input }),

  detail: (id: string) => api<RoundDetailPayload>(`/recruitment-rounds/${id}`),

  /** Mở/đóng nhận CV: draft→open→closed (closed→open cho phép mở lại). */
  setStatus: (id: string, status: RoundStatus) =>
    api<RoundRecord>(`/recruitment-rounds/${id}/status`, { method: "POST", body: { status } }),

  /** Thêm khung giờ — chỉ role published + có ≥10 câu hỏi trong ngân hàng. */
  addSlot: (
    id: string,
    input: {
      roleCode: string;
      startsAt: string;
      endsAt: string;
      capacity: number;
      minimumPreparationMinutes?: number;
      credentialsLeadMinutes?: number;
      location?: string;
    }
  ) => api<ApplySlot>(`/recruitment-rounds/${id}/slots`, { method: "POST", body: input }),

  closeSlot: (id: string, slotId: string) =>
    api<ApplySlot>(`/recruitment-rounds/${id}/slots/${slotId}/close`, { method: "POST" }),

  applications: (
    id: string,
    params: { page?: number; pageSize?: number; status?: ApplicationStatus; search?: string } = {}
  ) => api<PageData<ApplicationRecordRow>>(`/recruitment-rounds/${id}/applications`, { query: params }),

  applicationDetail: (id: string, appId: string) =>
    api<StaffApplicationDetail>(`/recruitment-rounds/${id}/applications/${appId}`),

  cancelApplication: (id: string, appId: string, reason: string) =>
    api<{ application: ApplicationRecordRow }>(`/recruitment-rounds/${id}/applications/${appId}/cancel`, {
      method: "POST",
      body: { reason },
    }),

  /** Đổi khung giờ của hồ sơ booked (check capacity, không tốn lượt rebook của ứng viên). */
  reschedule: (id: string, appId: string, slotId: string) =>
    api<{ application: ApplicationRecordRow; booking: SlotBookingInfo }>(
      `/recruitment-rounds/${id}/applications/${appId}/reschedule`,
      { method: "POST", body: { slotId } }
    ),

  /** Gửi lại email đăng nhập (tạo mail queue entry; uncertain → cần acknowledge). */
  resendCredentials: (id: string, appId: string, acknowledgeUncertain?: boolean) =>
    api<{ queued: boolean; mailId: string; status: MailStatus }>(
      `/recruitment-rounds/${id}/applications/${appId}/resend-credentials`,
      { method: "POST", body: { acknowledgeUncertain } }
    ),

  credentialRecovery: (id: string, appId: string, slotId?: string) =>
    api<CredentialRecoveryInfo>(`/recruitment-rounds/${id}/applications/${appId}/credential-recovery`, {
      query: { slotId },
    }),

  /** Khôi phục credentials: tạo tài khoản intern (pending) + mail credentials / existing-account. */
  recoverCredentials: (id: string, appId: string, input: { expectedRevision: number; reason: string }) =>
    api<{ recovered: boolean; accountCreated: boolean; accountEmail: string; mailId: string; revision: number }>(
      `/recruitment-rounds/${id}/applications/${appId}/recover-credentials`,
      { method: "POST", body: input }
    ),
};

/* ---------------- careerRoleApi — thư viện nghề (admin) ---------------- */

export const careerRoleApi = {
  publicList: () => api<{ data: PublicCareerRole[] }>("/career-roles"),

  list: (params: { page?: number; pageSize?: number; search?: string; status?: CareerRoleStatus } = {}) =>
    api<PageData<CareerRoleRecord>>("/admin/career-roles", { query: params }),

  create: (input: {
    code: string;
    name: string;
    description?: string;
    level: CareerLevel;
    language: CareerLanguage;
    requiredSkills: SkillRequirement[];
    optionalSkills?: string[];
  }) => api<CareerRoleRecord>("/admin/career-roles", { method: "POST", body: input }),

  /** Sai expectedVersion → 409 code CAREER_ROLE_VERSION_CONFLICT; tăng version + lưu snapshot. */
  update: (
    code: string,
    input: {
      name?: string;
      description?: string;
      level?: CareerLevel;
      language?: CareerLanguage;
      requiredSkills?: SkillRequirement[];
      optionalSkills?: string[];
      note?: string;
      expectedVersion: number;
    }
  ) => api<CareerRoleRecord>(`/admin/career-roles/${code}`, { method: "PUT", body: input }),

  /** Publish yêu cầu tổng trọng số requiredSkills = 100. */
  publish: (code: string, version: number) =>
    api<CareerRoleRecord>(`/admin/career-roles/${code}/publish`, { method: "POST", body: { version } }),

  archive: (code: string, version: number) =>
    api<CareerRoleRecord>(`/admin/career-roles/${code}/archive`, { method: "POST", body: { version } }),

  revisions: (code: string, params: { page?: number; pageSize?: number } = {}) =>
    api<PageData<CareerRoleRevision>>(`/admin/career-roles/${code}/revisions`, { query: params }),

  /** Bật/tắt nhận hồ sơ — chỉ role published (không tăng version). */
  setAccepting: (code: string, input: { accepting: boolean; expectedVersion: number }) =>
    api<CareerRoleRecord>(`/admin/career-roles/${code}/accepting`, { method: "PATCH", body: input }),
};

/* ---------------- communicationApi — hàng đợi email (admin) ---------------- */

export const communicationApi = {
  list: (params: { page?: number; pageSize?: number; kind?: MailKind; status?: MailStatus; search?: string } = {}) =>
    api<PageData<MailRecordRow>>("/admin/communications", { query: params }),

  preview: (id: string) => api<MailPreview>(`/admin/communications/${id}/preview`),

  /** Chỉ cho status dead/accepted/bounced/uncertain; kind credentials/verify cần acknowledge; cooldown 60s → 429. */
  resend: (id: string, acknowledgeUncertain?: boolean) =>
    api<{ mail: MailRecordRow }>(`/admin/communications/${id}/resend`, {
      method: "POST",
      body: { acknowledgeUncertain },
    }),
};
