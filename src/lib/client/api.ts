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
