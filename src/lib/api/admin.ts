"use client";

/**
 * Domain API: Admin — users, RBAC, groups, settings, catalogs, knowledge,
 * career-roles (admin), audit, activity, agents, communications, system.
 */

import { getJson, sendJson, arrOf, dateOf, numOf, strOf, qs, parsePaginated } from "@/lib/api/client";

/* ───────────────────────────── Users ───────────────────────────── */

export interface UserItem {
  id: string;
  email: string;
  username: string | null;
  displayName: string;
  status: string;
  roles: string[];
  createdAt: string | null;
}

export function fetchUsers(query: { q?: string; status?: string; roleCode?: string; page?: number } = {}, signal?: AbortSignal) {
  return getJson(
    "/api/v1/users" + qs({ q: query.q, status: query.status, roleCode: query.roleCode, page: query.page ?? 1, pageSize: 20 }),
    parsePaginated((d) => {
      const r = (d ?? {}) as Record<string, unknown>;
      return {
        id: strOf(r.id),
        email: strOf(r.email),
        username: typeof r.username === "string" ? r.username : null,
        displayName: strOf(r.displayName),
        status: strOf(r.status, "active"),
        roles: arrOf(r.roles, (x) => strOf(x)),
        createdAt: dateOf(r.createdAt as string),
      } as UserItem;
    }),
    signal,
  );
}

export function createUser(payload: { email: string; username?: string; displayName: string; password: string; roleCodes?: string[] }): Promise<UserItem> {
  return sendJson("/api/v1/users", "POST", payload, (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    return {
      id: strOf(r.id),
      email: strOf(r.email),
      username: typeof r.username === "string" ? r.username : null,
      displayName: strOf(r.displayName),
      status: strOf(r.status, "pending"),
      roles: arrOf(r.roles, (x) => strOf(x)),
      createdAt: dateOf(r.createdAt as string),
    };
  });
}

export function updateUser(id: string, payload: { displayName?: string; username?: string }): Promise<void> {
  return sendJson(`/api/v1/users/${encodeURIComponent(id)}`, "PATCH", payload, () => undefined);
}

export function setUserStatus(id: string, status: string): Promise<void> {
  return sendJson(`/api/v1/users/${encodeURIComponent(id)}/status`, "PATCH", { status }, () => undefined);
}

/* ───────────────────────── RBAC: roles & permissions ───────────────── */

export interface RoleItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}

export interface PermissionItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

export function fetchRoles(signal?: AbortSignal) {
  return getJson("/api/v1/roles" + qs({ pageSize: 50 }), parsePaginated((d) => {
    const r = (d ?? {}) as Record<string, unknown>;
    return { id: strOf(r.id), code: strOf(r.code), name: strOf(r.name), description: typeof r.description === "string" ? r.description : null, isSystem: r.isSystem === true } as RoleItem;
  }), signal);
}

export function fetchPermissions(signal?: AbortSignal) {
  return getJson("/api/v1/permissions" + qs({ pageSize: 100 }), parsePaginated((d) => {
    const r = (d ?? {}) as Record<string, unknown>;
    return { id: strOf(r.id), code: strOf(r.code), name: strOf(r.name), description: typeof r.description === "string" ? r.description : null } as PermissionItem;
  }), signal);
}

export function fetchRolePermissions(roleId: string, signal?: AbortSignal): Promise<string[]> {
  return getJson(`/api/v1/roles/${encodeURIComponent(roleId)}/permissions`, (data) => {
    const d = (data ?? {}) as Record<string, unknown>;
    const arr = Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
    return arrOf(arr, (p) => {
      const r = (p ?? {}) as Record<string, unknown>;
      return strOf(r.code ?? r.permissionCode);
    });
  }, signal);
}

/* ───────────────────────────── Groups ───────────────────────────── */

export interface GroupItem {
  id: string;
  code: string;
  name: string;
  memberCount: number;
  roleCodes: string[];
}

export function fetchGroups(query: { q?: string; page?: number } = {}, signal?: AbortSignal) {
  return getJson("/api/v1/groups" + qs({ q: query.q, page: query.page ?? 1, pageSize: 20 }), parsePaginated((d) => {
    const r = (d ?? {}) as Record<string, unknown>;
    return { id: strOf(r.id), code: strOf(r.code), name: strOf(r.name), memberCount: numOf(r.memberCount), roleCodes: arrOf(r.roleCodes, (x) => strOf(x)) } as GroupItem;
  }), signal);
}

export function createGroup(payload: { code: string; name: string; description?: string }): Promise<GroupItem> {
  return sendJson("/api/v1/groups", "POST", payload, (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    return { id: strOf(r.id), code: strOf(r.code), name: strOf(r.name), memberCount: 0, roleCodes: [] };
  });
}

export function addGroupMembers(groupId: string, userIds: string[]): Promise<void> {
  return sendJson(`/api/v1/groups/${encodeURIComponent(groupId)}/members`, "POST", { userIds }, () => undefined);
}

export function removeGroupMember(groupId: string, userId: string): Promise<void> {
  return sendJson(`/api/v1/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}`, "DELETE", {}, () => undefined);
}

/* ───────────────────────────── Settings ───────────────────────────── */

export interface SettingItem {
  key: string;
  value: string;
  description: string | null;
}

export function fetchSettings(signal?: AbortSignal): Promise<SettingItem[]> {
  return getJson("/api/v1/settings", (data) => {
    const d = (data ?? {}) as Record<string, unknown>;
    const arr = Array.isArray(d.data) ? d.data : Array.isArray(d) ? d : [];
    return arrOf(arr, (s) => {
      const r = (s ?? {}) as Record<string, unknown>;
      return { key: strOf(r.key), value: strOf(r.value), description: typeof r.description === "string" ? r.description : null };
    });
  }, signal);
}

export function updateSetting(payload: { key: string; value: string; description?: string }): Promise<void> {
  return sendJson("/api/v1/settings", "PATCH", payload, () => undefined);
}

/* ───────────────────────────── Catalogs ───────────────────────────── */

export interface CatalogType {
  id: string;
  code: string;
  name: string;
}

export interface CatalogItemEntry {
  id: string;
  typeCode: string;
  code: string;
  name: string;
  value: string | null;
  isActive: boolean;
  sortOrder: number;
}

export function fetchCatalogTypes(signal?: AbortSignal) {
  return getJson("/api/v1/catalogs/types" + qs({ pageSize: 50 }), parsePaginated((d) => {
    const r = (d ?? {}) as Record<string, unknown>;
    return { id: strOf(r.id), code: strOf(r.code), name: strOf(r.name) } as CatalogType;
  }), signal);
}

export function fetchCatalogItems(typeCode?: string, signal?: AbortSignal) {
  return getJson("/api/v1/catalogs/items" + qs({ typeCode, pageSize: 100 }), parsePaginated((d) => {
    const r = (d ?? {}) as Record<string, unknown>;
    return { id: strOf(r.id), typeCode: strOf(r.typeCode), code: strOf(r.code), name: strOf(r.name), value: typeof r.value === "string" ? r.value : null, isActive: r.isActive !== false, sortOrder: numOf(r.sortOrder) } as CatalogItemEntry;
  }), signal);
}

export function createCatalogType(payload: { code: string; name: string; description?: string }): Promise<CatalogType> {
  return sendJson("/api/v1/catalogs/types", "POST", payload, (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    return { id: strOf(r.id), code: strOf(r.code), name: strOf(r.name) };
  });
}

export function createCatalogItem(payload: { typeCode: string; code: string; name: string; value?: string; sortOrder?: number }): Promise<CatalogItemEntry> {
  return sendJson("/api/v1/catalogs/items", "POST", payload, (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    return { id: strOf(r.id), typeCode: strOf(r.typeCode), code: strOf(r.code), name: strOf(r.name), value: typeof r.value === "string" ? r.value : null, isActive: true, sortOrder: numOf(r.sortOrder) };
  });
}

export function updateCatalogItem(id: string, payload: { name?: string; value?: string; sortOrder?: number; isActive?: boolean }): Promise<void> {
  return sendJson(`/api/v1/catalogs/items/${encodeURIComponent(id)}`, "PATCH", payload, () => undefined);
}

/* ───────────────────────── Knowledge (admin) ───────────────── */

export interface KnowledgeEntry {
  id: string;
  code: string;
  title: string;
  status: string;
  version: number;
  updatedAt: string | null;
}

export function fetchKnowledge(query: { q?: string; status?: string; page?: number } = {}, signal?: AbortSignal) {
  return getJson("/api/v1/admin/knowledge" + qs({ q: query.q, status: query.status, page: query.page ?? 1, pageSize: 20 }), parsePaginated((d) => {
    const r = (d ?? {}) as Record<string, unknown>;
    return { id: strOf(r.id), code: strOf(r.code), title: strOf(r.title), status: strOf(r.status, "draft"), version: numOf(r.version, 1), updatedAt: dateOf(r.updatedAt as string) } as KnowledgeEntry;
  }), signal);
}

export function createKnowledgeEntry(payload: { code: string; draft: { title: string; body: string } }): Promise<KnowledgeEntry> {
  return sendJson("/api/v1/admin/knowledge", "POST", payload, (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    const draft = (r.draft ?? {}) as Record<string, unknown>;
    return { id: strOf(r.id), code: strOf(r.code), title: strOf(r.title ?? draft.title), status: strOf(r.status, "draft"), version: numOf(r.version, 1), updatedAt: dateOf(r.updatedAt as string) };
  });
}

export function updateKnowledgeEntry(code: string, payload: { version: number; draft: { title: string; body: string } }): Promise<void> {
  return sendJson(`/api/v1/admin/knowledge/${encodeURIComponent(code)}`, "PUT", payload, () => undefined);
}

export function publishKnowledgeEntry(code: string, version: number): Promise<void> {
  return sendJson(`/api/v1/admin/knowledge/${encodeURIComponent(code)}/publish`, "POST", { version }, () => undefined);
}

export function archiveKnowledgeEntry(code: string, version: number): Promise<void> {
  return sendJson(`/api/v1/admin/knowledge/${encodeURIComponent(code)}/archive`, "POST", { version }, () => undefined);
}

/* ───────────────── Career roles (admin CRUD) ───────────────── */

export interface AdminCareerRole {
  id: string;
  code: string;
  name: string;
  description: string | null;
  level: string;
  language: string;
  status: string;
  version: number;
  acceptingApplications: boolean;
}

export function fetchAdminCareerRoles(query: { status?: string; search?: string; page?: number } = {}, signal?: AbortSignal) {
  return getJson("/api/v1/admin/career-roles" + qs({ status: query.status, search: query.search, page: query.page ?? 1, pageSize: 20 }), parsePaginated((d) => {
    const r = (d ?? {}) as Record<string, unknown>;
    return {
      id: strOf(r.id), code: strOf(r.code), name: strOf(r.name),
      description: typeof r.description === "string" ? r.description : null,
      level: strOf(r.level, "intern"), language: strOf(r.language, "vi"),
      status: strOf(r.status, "draft"), version: numOf(r.version, 1),
      acceptingApplications: r.acceptingApplications === true,
    } as AdminCareerRole;
  }), signal);
}

export function createCareerRole(payload: { code: string; name: string; description?: string; level: string; language: string; requiredSkills?: string[] }): Promise<AdminCareerRole> {
  return sendJson("/api/v1/admin/career-roles", "POST", payload, (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    return { id: strOf(r.id), code: strOf(r.code), name: strOf(r.name), description: null, level: strOf(r.level), language: strOf(r.language), status: strOf(r.status, "draft"), version: 1, acceptingApplications: false };
  });
}

export function updateCareerRole(code: string, payload: Record<string, unknown>): Promise<void> {
  return sendJson(`/api/v1/admin/career-roles/${encodeURIComponent(code)}`, "PUT", payload, () => undefined);
}

export function archiveCareerRole(code: string, version: number): Promise<void> {
  return sendJson(`/api/v1/admin/career-roles/${encodeURIComponent(code)}/archive`, "POST", { version }, () => undefined);
}

/* ───────────────── Audit & activity ───────────────── */

export interface AuditLogEntry {
  id: string;
  actorName: string | null;
  action: string;
  createdAt: string | null;
}

export function fetchAuditLogs(query: { actorId?: string; action?: string; page?: number } = {}, signal?: AbortSignal) {
  return getJson("/api/v1/audit-logs" + qs({ actorId: query.actorId, action: query.action, page: query.page ?? 1, pageSize: 20 }), parsePaginated((d) => {
    const r = (d ?? {}) as Record<string, unknown>;
    const actor = (r.actor ?? {}) as Record<string, unknown>;
    return { id: strOf(r.id), actorName: typeof actor.displayName === "string" ? actor.displayName : null, action: strOf(r.action), createdAt: dateOf(r.createdAt as string) } as AuditLogEntry;
  }), signal);
}

export function fetchActivityEvents(query: { actorId?: string; module?: string; page?: number } = {}, signal?: AbortSignal) {
  return getJson("/api/v1/activity-events" + qs({ actorId: query.actorId, module: query.module, page: query.page ?? 1, pageSize: 20 }), parsePaginated((d) => {
    const r = (d ?? {}) as Record<string, unknown>;
    const actor = (r.actor ?? {}) as Record<string, unknown>;
    return { id: strOf(r.id), actorName: typeof actor.displayName === "string" ? actor.displayName : null, action: strOf(r.action ?? r.kind), createdAt: dateOf(r.createdAt as string) } as AuditLogEntry;
  }), signal);
}

/* ───────────────── Agents (knowledge runs) ───────────────── */

export interface AgentRun {
  id: string;
  requestId: string;
  question: string;
  status: string;
  attempts: number;
  result: string | null;
  createdAt: string | null;
}

export function createKnowledgeRun(question: string, roleCode?: string): Promise<AgentRun> {
  return sendJson("/api/v1/admin/agents/knowledge-runs", "POST", roleCode ? { requestId: crypto.randomUUID(), question, roleCode } : { requestId: crypto.randomUUID(), question }, (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    return { id: strOf(r.id), requestId: strOf(r.requestId), question: strOf(r.question), status: strOf(r.status, "queued"), attempts: numOf(r.attempts), result: typeof r.result === "string" ? r.result : null, createdAt: dateOf(r.createdAt as string) };
  });
}

export function fetchKnowledgeRun(id: string, signal?: AbortSignal): Promise<AgentRun> {
  return getJson(`/api/v1/admin/agents/knowledge-runs/${encodeURIComponent(id)}`, (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    return { id: strOf(r.id), requestId: strOf(r.requestId), question: strOf(r.question), status: strOf(r.status, "queued"), attempts: numOf(r.attempts), result: typeof r.result === "string" ? r.result : null, createdAt: dateOf(r.createdAt as string) };
  }, signal);
}

export function cancelKnowledgeRun(id: string): Promise<void> {
  return sendJson(`/api/v1/admin/agents/knowledge-runs/${encodeURIComponent(id)}/cancel`, "POST", {}, () => undefined);
}

export function resumeKnowledgeRun(id: string): Promise<void> {
  return sendJson(`/api/v1/admin/agents/knowledge-runs/${encodeURIComponent(id)}/resume`, "POST", {}, () => undefined);
}

/* ───────────────── Communications (admin) ───────────────── */

export interface CommunicationItem {
  id: string;
  recipient: string | null;
  subject: string | null;
  status: string;
  createdAt: string | null;
}

export function fetchCommunications(page = 1, signal?: AbortSignal) {
  return getJson("/api/v1/admin/communications" + qs({ page }), parsePaginated((d) => {
    const r = (d ?? {}) as Record<string, unknown>;
    return { id: strOf(r.id), recipient: typeof r.recipient === "string" ? r.recipient : null, subject: typeof r.subject === "string" ? r.subject : null, status: strOf(r.status), createdAt: dateOf(r.createdAt as string) } as CommunicationItem;
  }), signal);
}

export function resendCommunication(id: string): Promise<void> {
  return sendJson(`/api/v1/admin/communications/${encodeURIComponent(id)}/resend`, "POST", {}, () => undefined);
}

/* ───────────────── System status (admin) ───────────────── */

export interface SystemStatus {
  userCount: number;
  sessionCount: number;
  questionCount: number;
  templateCount: number;
  aiRunsLast24h: number;
  githubConfigured: boolean;
}

export function fetchSystemStatus(signal?: AbortSignal): Promise<SystemStatus> {
  return getJson("/api/v1/admin/system/status", (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    return {
      userCount: numOf(r.userCount),
      sessionCount: numOf(r.sessionCount),
      questionCount: numOf(r.questionCount),
      templateCount: numOf(r.templateCount),
      aiRunsLast24h: numOf(r.aiRunsLast24h),
      githubConfigured: r.githubConfigured === true,
    };
  }, signal);
}

/* ───────────────── GitHub (admin repository account) ───────────────── */

export interface RepositoryAccountStatus {
  connected: boolean;
  login: string | null;
  selected: boolean;
}

export function fetchRepositoryAccount(signal?: AbortSignal): Promise<RepositoryAccountStatus> {
  return getJson("/api/v1/github/repository-account", (data) => {
    const r = (data ?? {}) as Record<string, unknown>;
    return { connected: r.connected === true, login: typeof r.login === "string" ? r.login : null, selected: r.selected === true };
  }, signal);
}

export function selectRepositoryAccount(): Promise<void> {
  return sendJson("/api/v1/github/repository-account", "POST", {}, () => undefined);
}
