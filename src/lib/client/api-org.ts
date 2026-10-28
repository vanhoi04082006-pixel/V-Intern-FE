"use client";

/**
 * Typed API client — nhóm Task 2-b (participation / knowledge / org / account /
 * admin tasks CRUD). File RIÊNG với api.ts (agent 2-a đang mở rộng song song) —
 * FE agents import nhóm dưới đây từ đây, KHÔNG tự gọi fetch.
 */

import { api, type PageData } from "./http";

/* ========================= PARTICIPATION ========================= */

export type IncidentKind = "missing" | "late";
export type IncidentStatus = "active" | "excused" | "reversed";

export interface ParticipationIncident {
  id: string;
  taskCode: string;
  taskTitle: string;
  sessionName: string;
  dueAt: string;
  submittedAt: string | null;
  ordinal: number;
  points: number;
  kind: IncidentKind;
  status: IncidentStatus;
  baseScore: number;
  latePenalty: number;
  score: number;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolveReason: string | null;
  createdAt: string;
  /** Chỉ có ở view instructor (theo phiên). */
  taskId?: string;
  internId?: string;
  internName?: string;
}

export interface ParticipationPolicy {
  id: string;
  sessionId: string;
  version: number;
  warningFrom: number;
  penaltyFrom: number;
  replacementFrom: number;
  penaltyPoints: number;
  penaltyCap: number;
  activeFrom: string;
  reason: string;
  updatedBy: string;
  updatedAt: string;
}

export interface ParticipationReport {
  totalIncidents: number;
  active: number;
  excused: number;
  reversed: number;
  penaltyPointsTotal: number;
  affectedInterns: number;
}

export interface MyReplacementHistoryItem {
  id: string;
  sessionId: string;
  sessionName: string;
  reason: string;
  transferredTaskIds: string[];
  transferredTaskCodes: string[];
  preservedTaskCount: number;
  handoverHours: number;
  fromName: string;
  toName: string;
  createdBy: string;
  at: string;
}

export interface ReplacementTransferItem {
  taskId: string;
  taskCode: string;
  taskTitle: string;
}

export interface ReplacementPreservedItem {
  taskCode: string;
  reason: string;
}

export interface ReplacementRecord {
  id: string;
  sessionId: string;
  sessionName: string;
  incidentId: string | null;
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  reason: string;
  transfers: ReplacementTransferItem[];
  preservedTasks: ReplacementPreservedItem[];
  preservedTaskCount: number;
  handoverHours: number;
  createdBy: string;
  at: string;
}

export interface ReplacementCandidate {
  userId: string;
  name: string;
  email: string;
  role: string;
  matchScore: number;
  reason: string;
  completedTasks: number;
  avgScore: number;
}

export interface ReplacementPreview {
  commandId: string;
  previewHash: string;
  expiresAt: string;
  candidate: { userId: string; name: string; email: string };
  handoverHours: number;
  transfers: {
    taskId: string;
    taskCode: string;
    taskTitle: string;
    from: string;
    to: string;
    fromName: string;
    toName: string;
  }[];
  preservedTasks: ReplacementPreservedItem[];
  warnings: string[];
}

export type RepoJobStatus =
  | "pending"
  | "leased"
  | "retry"
  | "waiting_user"
  | "done"
  | "failed"
  | "review_required";

export interface RepositoryAccessJob {
  id: string;
  userId: string;
  userName: string;
  displayStatus: RepoJobStatus;
  revision: number;
  note: string;
  at: string;
}

export interface SessionParticipationPage {
  report: ParticipationReport;
  policy: ParticipationPolicy | null;
  data: ParticipationIncident[];
  meta: PageData<ParticipationIncident>["meta"];
}

export interface MyParticipationPage {
  summary: { total: number; active: number; registeredPenalty: number; policyActive: boolean };
  data: ParticipationIncident[];
  meta: PageData<ParticipationIncident>["meta"];
}

export const participationApi = {
  /* ---- intern ---- */
  myIncidents(params: { page?: number; pageSize?: number } = {}) {
    return api<MyParticipationPage>("/participation/me", { query: params });
  },

  myReplacements(params: { page?: number; pageSize?: number } = {}) {
    return api<PageData<MyReplacementHistoryItem>>("/participation/me/replacements", { query: params });
  },

  /* ---- instructor/admin theo phiên ---- */
  sessionReport(sessionId: string, params: { page?: number; pageSize?: number } = {}) {
    return api<SessionParticipationPage>(`/sessions/${sessionId}/participation`, { query: params });
  },

  upsertPolicy(
    sessionId: string,
    body: {
      warningFrom: number;
      penaltyFrom: number;
      replacementFrom: number;
      penaltyPoints: number;
      penaltyCap: number;
      activeFrom: string;
      reason: string;
      expectedVersion?: number;
    }
  ) {
    return api<{ policy: ParticipationPolicy }>(`/sessions/${sessionId}/participation/policy`, {
      method: "POST",
      body,
    });
  },

  refresh(sessionId: string) {
    return api<{
      report: ParticipationReport;
      policy: ParticipationPolicy | null;
      incidentCount: number;
      refreshedAt: string;
    }>(`/sessions/${sessionId}/participation/refresh`, { method: "POST" });
  },

  resolveIncident(
    sessionId: string,
    incidentId: string,
    body: { action: "excused" | "reversed"; reason: string }
  ) {
    return api<{ incident: ParticipationIncident }>(
      `/sessions/${sessionId}/participation/incidents/${incidentId}/resolve`,
      { method: "POST", body }
    );
  },

  extendTask(sessionId: string, taskId: string, body: { newDueAt: string; reason: string }) {
    return api<{
      task: Record<string, unknown>;
      previousDueAt: string | null;
      newDueAt: string;
      reason: string;
      at: string;
    }>(`/sessions/${sessionId}/participation/tasks/${taskId}/extend`, { method: "POST", body });
  },

  /* ---- wizard thay thành viên 3 bước ---- */
  replacementAdvice(sessionId: string, incidentId: string) {
    return api<{ candidates: ReplacementCandidate[]; notes: string[] }>(
      `/sessions/${sessionId}/participation/incidents/${incidentId}/replacement-advice`,
      { method: "POST", body: {} }
    );
  },

  replacementPreview(
    sessionId: string,
    incidentId: string,
    body: { candidateUserId: string; handoverHours?: number }
  ) {
    return api<ReplacementPreview>(
      `/sessions/${sessionId}/participation/incidents/${incidentId}/replacement-preview`,
      { method: "POST", body }
    );
  },

  approveReplacement(
    sessionId: string,
    commandId: string,
    body: { expectedPreviewHash: string; reason: string; confirmed: boolean }
  ) {
    return api<{ replacement: ReplacementRecord }>(
      `/sessions/${sessionId}/participation/replacements/${commandId}/approve`,
      { method: "POST", body }
    );
  },

  sessionReplacements(sessionId: string, params: { page?: number; pageSize?: number } = {}) {
    return api<PageData<ReplacementRecord>>(`/sessions/${sessionId}/participation/replacements`, {
      query: params,
    });
  },

  /* ---- repository access jobs ---- */
  repoAccessJobs(sessionId: string, params: { page?: number; pageSize?: number } = {}) {
    return api<PageData<RepositoryAccessJob>>(
      `/sessions/${sessionId}/participation/repository-access-jobs`,
      { query: params }
    );
  },

  retryRepoAccessJob(sessionId: string, jobId: string, body: { expectedRevision: number; reason: string }) {
    return api<{ job: RepositoryAccessJob }>(
      `/sessions/${sessionId}/participation/repository-access-jobs/${jobId}/retry`,
      { method: "POST", body }
    );
  },
};

/* ========================== KNOWLEDGE ========================== */

export type KnowledgeKind =
  | "qa"
  | "guide"
  | "exercise"
  | "solution"
  | "rubric"
  | "plan_template"
  | "communication";
export type KnowledgeStatus = "draft" | "published" | "archived";
export type KnowledgeAudience = "student_safe" | "staff_only" | "grading_only";
export type KnowledgePurpose =
  | "interview_question"
  | "code_review"
  | "plan_generation"
  | "career_advice"
  | "exercise_grading"
  | "cv_analysis"
  | "session_summary"
  | "mentor_chat"
  | "onboarding_guide";

export interface KnowledgeSummary {
  id: string;
  code: string;
  title: string;
  summary: string;
  kind: KnowledgeKind;
  version: number;
  status: KnowledgeStatus;
  audience: KnowledgeAudience;
  purpose: KnowledgePurpose;
  roleCode: string | null;
  updatedAt: string;
}

export interface KnowledgeSource {
  name: string;
  url: string;
}

export interface KnowledgeDocDetail extends KnowledgeSummary {
  body: Record<string, unknown>;
  sources: KnowledgeSource[];
  createdAt: string;
  publishedAt: string | null;
  archivedAt: string | null;
  revisionCount: number;
}

export interface KnowledgeRevision {
  id: string;
  version: number;
  note: string;
  editedBy: string;
  at: string;
  snapshot: {
    title: string;
    summary: string;
    kind: KnowledgeKind;
    audience: KnowledgeAudience;
    purpose: KnowledgePurpose;
    roleCode: string | null;
    status: KnowledgeStatus;
    body: Record<string, unknown>;
    sources: KnowledgeSource[];
  };
}

export interface KnowledgeImportRow {
  code?: string;
  title?: string;
  summary?: string;
  kind?: string;
  audience?: string;
  purpose?: string;
  roleCode?: string | null;
}

export interface KnowledgeImportDryRunResult {
  total: number;
  validCount: number;
  invalidCount: number;
  valid: { row: number; code: string; title: string; issues: string[] }[];
  invalid: { row: number; code: string | null; issues: string[] }[];
}

export interface KnowledgeUpsertInput {
  title?: string;
  summary?: string;
  kind?: KnowledgeKind;
  audience?: KnowledgeAudience;
  purpose?: KnowledgePurpose;
  roleCode?: string | null;
  body?: Record<string, unknown>;
  sources?: KnowledgeSource[];
  note?: string;
}

export const knowledgeApi = {
  list(
    params: {
      page?: number;
      pageSize?: number;
      query?: string;
      status?: KnowledgeStatus;
      kind?: KnowledgeKind;
      audience?: KnowledgeAudience;
      purpose?: KnowledgePurpose;
      roleCode?: string;
    } = {}
  ) {
    return api<PageData<KnowledgeSummary>>("/admin/knowledge", { query: params });
  },

  detail(code: string) {
    return api<KnowledgeDocDetail>(`/admin/knowledge/${code}`);
  },

  create(body: {
    code: string;
    title: string;
    summary: string;
    kind: KnowledgeKind;
    audience: KnowledgeAudience;
    purpose: KnowledgePurpose;
    roleCode?: string | null;
  }) {
    return api<KnowledgeDocDetail>("/admin/knowledge", { method: "POST", body });
  },

  update(code: string, body: KnowledgeUpsertInput & { expectedVersion: number }) {
    return api<KnowledgeDocDetail>(`/admin/knowledge/${code}`, { method: "PUT", body });
  },

  publish(code: string, version: number) {
    return api<KnowledgeDocDetail>(`/admin/knowledge/${code}/publish`, {
      method: "POST",
      body: { version },
    });
  },

  archive(code: string, version: number) {
    return api<KnowledgeDocDetail>(`/admin/knowledge/${code}/archive`, {
      method: "POST",
      body: { version },
    });
  },

  restore(code: string, version: number, sourceVersion: number) {
    return api<KnowledgeDocDetail>(`/admin/knowledge/${code}/restore`, {
      method: "POST",
      body: { version, sourceVersion },
    });
  },

  revisions(code: string, params: { page?: number; pageSize?: number } = {}) {
    return api<PageData<KnowledgeRevision>>(`/admin/knowledge/${code}/revisions`, { query: params });
  },

  publicationCheck(code: string) {
    return api<{ checks: { id: string; label: string; passed: boolean }[]; canPublish: boolean }>(
      `/admin/knowledge/${code}/publication-check`
    );
  },

  importDryRun(items: KnowledgeImportRow[]) {
    return api<KnowledgeImportDryRunResult>("/admin/knowledge/import/dry-run", {
      method: "POST",
      body: { items },
    });
  },
};

/* ==================== GROUPS / ROLES / CATALOGS ==================== */

export interface Group {
  id: string;
  code: string;
  name: string;
  description: string;
  memberCount: number;
  roleCodes: string[];
  createdAt?: string;
}

export interface GroupMemberRow {
  userId: string;
  name: string;
  email: string;
  role: string;
  addedAt?: string;
}

export interface OrgRole {
  id: string;
  code: string;
  name: string;
  description: string;
  permissionCount?: number;
}

export interface OrgPermission {
  id: string;
  code: string;
  name: string;
  description: string;
  group: string;
}

export interface CatalogType {
  id: string;
  code: string;
  name: string;
  itemCount?: number;
  createdAt?: string;
}

export interface CatalogItem {
  id: string;
  typeCode: string;
  name: string;
  code: string;
  value: string;
  isActive: boolean;
  sortOrder: number;
}

export const groupApi = {
  list(params: { page?: number; pageSize?: number; q?: string } = {}) {
    return api<PageData<Group>>("/groups", { query: params });
  },

  create(body: { code: string; name: string; description?: string }) {
    return api<Group>("/groups", { method: "POST", body });
  },

  update(id: string, body: { name?: string; description?: string }) {
    return api<Group>(`/groups/${id}`, { method: "PATCH", body });
  },

  members(id: string) {
    return api<{ data: GroupMemberRow[] }>(`/groups/${id}/members`);
  },

  addMember(id: string, userId: string) {
    return api<GroupMemberRow>(`/groups/${id}/members`, { method: "POST", body: { userId } });
  },

  removeMember(id: string, userId: string) {
    return api<{ removed: boolean; userId: string }>(`/groups/${id}/members/${userId}`, {
      method: "DELETE",
    });
  },

  roles(id: string) {
    return api<{ data: { code: string; name: string }[] }>(`/groups/${id}/roles`);
  },

  setRoles(id: string, roleCodes: string[]) {
    return api<{ roles: { code: string; name: string }[] }>(`/groups/${id}/roles`, {
      method: "PUT",
      body: { roleCodes },
    });
  },
};

export const roleApi = {
  list(params: { page?: number; pageSize?: number } = {}) {
    return api<PageData<OrgRole>>("/roles", { query: params });
  },

  permissions(roleId: string, params: { page?: number; pageSize?: number } = {}) {
    return api<PageData<OrgPermission>>(`/roles/${roleId}/permissions`, { query: params });
  },
};

export const catalogApi = {
  types(params: { page?: number; pageSize?: number } = {}) {
    return api<PageData<CatalogType>>("/catalogs/types", { query: params });
  },

  createType(body: { code: string; name: string }) {
    return api<CatalogType>("/catalogs/types", { method: "POST", body });
  },

  items(typeCode: string, params: { page?: number; pageSize?: number } = {}) {
    return api<PageData<CatalogItem>>(`/catalogs/types/${typeCode}/items`, { query: params });
  },

  createItem(
    typeCode: string,
    body: { name: string; code?: string; value?: string; isActive?: boolean; sortOrder?: number }
  ) {
    return api<CatalogItem>(`/catalogs/types/${typeCode}/items`, { method: "POST", body });
  },

  updateItem(
    typeCode: string,
    itemId: string,
    body: { name?: string; value?: string; isActive?: boolean; sortOrder?: number }
  ) {
    return api<CatalogItem>(`/catalogs/types/${typeCode}/items/${itemId}`, { method: "PATCH", body });
  },
};

/* ============ ACCOUNT: change-password / github invitation / sharing ============ */

export interface ChangePasswordResult {
  changed: boolean;
  changedAt: string;
  mockNote: string;
}

export interface GithubInvitationState {
  session: { id: string; code: string; name: string };
  repository: {
    owner: string;
    name: string;
    fullName: string;
    status: "ready" | "provisioning" | "failed";
    url: string;
    webhookStatus: "healthy" | "pending" | "failed";
  };
  members: {
    userId: string;
    name: string;
    status: "accepted" | "pending" | "expired" | "failed" | "not_connected";
    invitedAt: string;
  }[];
  stats: { total: number; accepted: number; pending: number; notConnected: number };
}

export interface GithubActivityRow {
  id: string;
  action: string;
  pr: string | null;
  branch: string | null;
  headSha: string;
  at: string;
  actor: string;
}

export type ShareStatus = "pending" | "approved" | "denied" | "revoked";

export interface SessionShareRequestRow {
  id: string;
  requesterId: string;
  requesterName: string;
  ownerEmail: string;
  ownerName: string;
  reason: string;
  status: ShareStatus;
  sessionId: string | null;
  sessionName: string | null;
  expiresAt: string | null;
  createdAt: string;
  decidedAt: string | null;
  decidedBy: string | null;
}

export interface SessionShareSnapshot {
  share: { id: string; requesterName: string; ownerName: string; expiresAt: string | null };
  session: {
    id: string;
    code: string;
    name: string;
    status: string;
    startDate: string;
    endDate: string;
    description: string;
  };
  projects: {
    id: string;
    code: string;
    name: string;
    description: string;
    status: string;
    techStack: string[];
  }[];
  members: { userId: string; name: string; email: string; role: string; assignmentStatus: string }[];
  tasks: PageData<Record<string, unknown>>;
  sprints: { id: string; code: string; name: string; status: string; startDate: string; endDate: string }[];
  generatedAt: string;
}

export const accountApi = {
  /* ---- mật khẩu ---- */
  changePassword(currentPassword: string, newPassword: string) {
    return api<ChangePasswordResult>("/auth/change-password", {
      method: "POST",
      body: { currentPassword, newPassword },
    });
  },

  /* ---- GitHub invitation theo phiên ---- */
  github(sessionId: string) {
    return api<GithubInvitationState>(`/sessions/${sessionId}/github`);
  },

  githubReconcile(sessionId: string) {
    return api<{
      repository: GithubInvitationState["repository"];
      members: GithubInvitationState["members"];
      updated: number;
      reconciledCount: number;
      reconciledAt: string;
    }>(`/sessions/${sessionId}/github/reconcile`, { method: "POST" });
  },

  githubActivity(sessionId: string, params: { page?: number; pageSize?: number } = {}) {
    return api<PageData<GithubActivityRow>>(`/sessions/${sessionId}/github/activity`, { query: params });
  },

  /* ---- session sharing ---- */
  shareRequests(params: { page?: number; pageSize?: number; q?: string; status?: ShareStatus } = {}) {
    return api<PageData<SessionShareRequestRow>>("/session-sharing", { query: params });
  },

  createShareRequest(ownerEmail: string, reason: string) {
    return api<SessionShareRequestRow>("/session-sharing", {
      method: "POST",
      body: { ownerEmail, reason },
    });
  },

  shareDecision(id: string, decision: "approve" | "deny" | "revoke", sessionId?: string) {
    return api<SessionShareRequestRow>(`/session-sharing/${id}/decision`, {
      method: "POST",
      body: { decision, sessionId },
    });
  },

  shareSnapshot(id: string, params: { page?: number; pageSize?: number } = {}) {
    return api<SessionShareSnapshot>(`/session-sharing/${id}/snapshot`, { query: params });
  },
};

/* ==================== ADMIN TASKS CRUD ==================== */

export interface TaskAdminCreateInput {
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high" | "critical";
  storyPoints?: number;
  dueDate?: string | null;
  sprintId?: string | null;
  assigneeId?: string | null;
  role?: string;
  projectId?: string;
}

export interface TaskAdminUpdateInput {
  title?: string;
  description?: string;
  priority?: "low" | "medium" | "high" | "critical";
  storyPoints?: number;
  dueDate?: string | null;
  assigneeId?: string | null;
  role?: string;
  status?: "todo" | "doing" | "review" | "done";
  progress?: number;
  reason?: string;
  expectedVersion?: number;
}

export interface TaskAdminRow {
  id: string;
  code: string;
  title: string;
  description: string;
  status: "todo" | "doing" | "review" | "done";
  priority: "low" | "medium" | "high" | "critical";
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

export const taskAdminApi = {
  create(body: TaskAdminCreateInput) {
    return api<TaskAdminRow>("/tasks", { method: "POST", body });
  },

  update(id: string, body: TaskAdminUpdateInput) {
    return api<TaskAdminRow>(`/tasks/${id}`, { method: "PATCH", body });
  },

  remove(id: string) {
    return api<{ deleted: boolean; id: string }>(`/tasks/${id}`, { method: "DELETE" });
  },
};
