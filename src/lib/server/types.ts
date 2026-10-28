/** Kiểu dữ liệu dùng chung cho backend mock V-Intern. */

export type UserRole = "intern" | "instructor" | "admin";
export type AccountStatus = "active" | "pending" | "locked";

export interface User {
  id: string;
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  status: AccountStatus;
  avatarColor: string;
  joinedAt: string;
  lastLoginAt: string | null;
  studentId?: string | null;
  university?: string | null;
}

export type RecruitmentStatus =
  | "not_started"
  | "role_selected"
  | "interview_in_progress"
  | "evaluation_pending"
  | "passed"
  | "failed";

export interface RecruitmentProfile {
  userId: string;
  status: RecruitmentStatus;
  selectedRole: string | null;
  attemptCount: number;
  maxAttempts: number;
  recruitedAt: string | null;
  nextEligibleAt: string | null;
}

export type InterviewPhase = "introduction" | "technical" | "english" | "communication";
export type InterviewSessionStatus = "in_progress" | "evaluating" | "completed" | "evaluation_failed";

export interface InterviewQuestion {
  id: string;
  position: number;
  phase: InterviewPhase;
  kind: "main" | "follow_up";
  prompt: string;
  expectedConcepts: string[];
  answer: string | null;
  status: "ready" | "answered" | "skipped";
  score: number | null;
}

export interface InterviewMessage {
  id: string;
  role: "ai" | "user";
  content: string;
  at: string;
}

export interface InterviewSession {
  id: string;
  userId: string;
  roleCode: string;
  status: InterviewSessionStatus;
  startedAt: string;
  submittedAt: string | null;
  expiresAt: string;
  attemptNumber: number;
  currentIndex: number;
  questions: InterviewQuestion[];
  messages: InterviewMessage[];
  evaluatingSince: string | null;
  result: InterviewResult | null;
  jitter: number;
}

export interface InterviewResultCriterion {
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
  criteria: InterviewResultCriterion[];
  strengths: string[];
  weaknesses: string[];
  feedback: string;
  recommendedRole: string;
  evaluatedAt: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string;
  status: string;
  techStack: string[];
  templateId: string | null;
  templateName: string | null;
}

export type SessionStatus = "planning" | "active" | "completed" | "cancelled";

export interface SessionRecord {
  id: string;
  code: string;
  name: string;
  status: SessionStatus;
  startDate: string;
  endDate: string;
  projectId: string;
  description: string;
  instructorIds: string[];
  createdAt: string;
  planPublishedAt: string | null;
}

export type SprintStatus = "todo" | "active" | "done";

export interface Sprint {
  id: string;
  code: string;
  name: string;
  goal: string;
  status: SprintStatus;
  startDate: string;
  endDate: string;
  sessionId: string;
  projectId: string;
}

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
  dependencies: string[];
  createdAt: string;
  updatedAt: string;
  doneAt: string | null;
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
  reviewedAt: string | null;
}

export type CodeReviewStatus = "running" | "awaiting_instructor" | "needs_changes" | "passed";

export interface CodeReviewRubric {
  functional: number;
  quality: number;
  testing: number;
  errors: number;
  security: number;
  dod: number;
}

export interface CodeReviewFinding {
  file: string;
  line: number;
  message: string;
  severity: "warning" | "error" | "info";
}

export interface CodeReviewResult {
  score: number;
  rubric: CodeReviewRubric;
  summary: string;
  limitations: string[];
  findings: CodeReviewFinding[];
}

export interface TrustedTestCheck {
  name: string;
  passed: boolean;
  log: string;
}

export interface CodeReviewEvidence {
  complete: boolean;
  trustedTests: {
    status: string;
    passed: number;
    failed: number;
    executionTimeMs: number;
    checks: TrustedTestCheck[];
  };
}

export interface CodeReview {
  id: string;
  submissionId: string;
  status: CodeReviewStatus;
  model: string;
  result: CodeReviewResult | null;
  evidence: CodeReviewEvidence | null;
  scoredAt: string | null;
  createdAt: string;
  instructorScores: CodeReviewRubric | null;
  instructorFeedback: string | null;
  overrideReason: string | null;
}

export interface MentorConversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  lastMessageAt: string;
  messageCount: number;
  status: "active" | "archived";
}

export interface MentorMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  at: string;
  taskId: string | null;
}

export interface EvaluationCycle {
  id: string;
  name: string;
  status: "draft" | "open" | "closed" | "archived";
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface Criterion {
  id: string;
  cycleId: string;
  code: string;
  label: string;
  weight: number;
  maxScore: number;
}

export interface EvaluationScore {
  criterionId: string;
  criterionCode: string;
  label: string;
  weight: number;
  score: number | null;
  comment: string | null;
}

export interface Evaluation {
  id: string;
  cycleId: string;
  cycleName: string;
  internId: string;
  internName: string;
  status: "draft" | "submitted" | "finalized";
  overallScore: number | null;
  summary: string | null;
  evaluatorId: string;
  evaluatorName: string;
  scores: EvaluationScore[];
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  finalizedAt: string | null;
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

export interface KpiRecord {
  id: string;
  userId: string;
  period: string;
  status: "calculated" | "pending";
  finalScore: number;
  calculatedAt: string;
  metrics: KpiMetric[];
}

export interface SalaryEntry {
  id: string;
  userId: string;
  type: "kpi_earning" | "bonus" | "penalty" | "adjustment";
  amount: number;
  description: string;
  at: string;
}

export interface Certificate {
  id: string;
  userId: string;
  certificateNumber: string;
  status: "issued" | "revoked";
  issuedAt: string;
  projectName: string;
  sessionName: string;
  completedAt: string;
  policyCode: string;
  verificationCode: string;
  revokedAt: string | null;
  revokeReason: string | null;
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
  userId: string;
  createdAt: string;
  summary: string;
  recommendations: AiRecommendation[];
}

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

export interface AppNotificationRecord {
  id: string;
  userId: string;
  category: NotificationCategory;
  title: string;
  content: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

export interface GithubLink {
  userId: string;
  configured: boolean;
  connected: boolean;
  login: string | null;
}

export interface BlueprintTask {
  title: string;
  priority: TaskPriority;
  storyPoints: number;
  role: string;
}

export interface BlueprintRoleDetail {
  code: string;
  label: string;
  countMin: number;
  countMax: number;
  skills: string[];
  responsibilities: string[];
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

export interface ProjectTemplate {
  id: string;
  code: string;
  name: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  status: "active" | "draft" | "archived";
  version: number;
  techStack: string[];
  roles: string[];
  teamSize: { min: number; max: number };
  sprintCount: number;
  description: string;
  createdAt: string;
  blueprint: ProjectBlueprint;
}

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

export interface Plan {
  planId: string;
  sessionId: string;
  status: "generating" | "draft" | "published" | "failed";
  createdAt: string;
  generatingSince: string | null;
  sprintCount: number | null;
  taskCount: number | null;
  draft: { sprints: PlanDraftSprint[]; milestones: BlueprintMilestone[] } | null;
  warnings: string[];
  error: string | null;
}

export interface ReportItem {
  id: string;
  kind: "progress" | "performance" | "evaluation" | "review" | "risk";
  title: string;
  scope: string;
  sessionId: string | null;
  createdAt: string;
  authorName: string;
}

export interface ActivityEvent {
  id: string;
  module: "auth" | "recruitment" | "session" | "task" | "evaluation" | "system";
  action: string;
  actorName: string;
  summary: string;
  at: string;
}

export interface AuditLog {
  id: string;
  actorName: string;
  action: "LOGIN" | "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE";
  target: string;
  at: string;
  ip: string;
}

export interface AdminSetting {
  key: string;
  value: string;
  description: string;
  isSecret: boolean;
}

export interface AiConfig {
  model: string;
  timeoutMs: number;
  maxRetries: number;
  version: number;
  provider: string;
  fallbackEnabled: boolean;
}

export interface Question {
  id: string;
  roleCode: string;
  phase: InterviewPhase;
  difficulty: "easy" | "medium" | "hard";
  language: string;
  prompt: string;
  expectedConcepts: string[];
  isActive: boolean;
  version: number;
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

export interface SessionTimelineEvent {
  id: string;
  sessionId: string;
  action: string;
  summary: string;
  actorName: string;
  createdAt: string;
}

export interface Milestone {
  id: string;
  sessionId: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export interface Store {
  seededAt: string;
  users: User[];
  tokens: Record<string, string>;
  recruitment: Record<string, RecruitmentProfile>;
  interviews: InterviewSession[];
  projects: Project[];
  sessions: SessionRecord[];
  sprints: Sprint[];
  tasks: Task[];
  taskComments: TaskComment[];
  taskSpecs: Record<string, TaskSpec>;
  taskHistory: Record<string, TaskHistoryEntry[]>;
  submissions: Submission[];
  codeReviews: CodeReview[];
  mentorConversations: MentorConversation[];
  mentorMessages: MentorMessage[];
  cycles: EvaluationCycle[];
  criteria: Criterion[];
  evaluations: Evaluation[];
  kpis: KpiRecord[];
  salaryEntries: SalaryEntry[];
  certificates: Certificate[];
  recommendations: RecommendationSet[];
  notifications: AppNotificationRecord[];
  notificationPrefs: Record<string, boolean>;
  github: Record<string, GithubLink>;
  templates: ProjectTemplate[];
  plans: Plan[];
  reports: ReportItem[];
  activityEvents: ActivityEvent[];
  auditLogs: AuditLog[];
  settings: AdminSetting[];
  aiConfig: AiConfig;
  questionBank: Question[];
  assignments: Assignment[];
  timelineEvents: SessionTimelineEvent[];
  milestones: Milestone[];
  aiRuns: number;
  templateStarts: { templateId: string; name: string; at: number; projectId: string; sessionId: string; sessionCode: string }[];
}
