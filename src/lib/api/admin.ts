import { request } from "./client";
import {
  array,
  boolean,
  nullable,
  number,
  oneOf,
  parsePage,
  record,
  string,
} from "./parse";
export function parseUser(value: unknown) {
  const v = record(value);
  return {
    id: string(v.id),
    email: string(v.email),
    username: string(v.username),
    displayName: string(v.displayName),
    status: oneOf(v.status, ["active", "pending", "locked", "deleted"]),
    lastLoginAt: nullable(v.lastLoginAt, string),
    createdAt: string(v.createdAt),
  };
}
export function parseNamed(value: unknown) {
  const v = record(value);
  return {
    id: string(v.id),
    code: string(v.code),
    name: string(v.name),
    description: nullable(v.description, string),
  };
}
export function parseCatalogItem(value: unknown) {
  const v = record(value);
  return {
    id: string(v.id),
    code: string(v.code),
    name: string(v.name),
    value: nullable(v.value, string),
    sortOrder: number(v.sortOrder),
    isActive: boolean(v.isActive),
  };
}
export function parseAudit(value: unknown) {
  const v = record(value);
  return {
    id: string(v.id),
    actorId: nullable(v.actorId, string),
    action: string(v.action),
    targetType: nullable(v.targetType, string),
    targetId: nullable(v.targetId, string),
    detail: nullable(v.detail, string),
    ip: nullable(v.ip, string),
    userAgent: nullable(v.userAgent, string),
    createdAt: string(v.createdAt),
  };
}
export function parseActivity(value: unknown) {
  const v = record(value);
  return {
    id: string(v.id),
    actorId: nullable(v.actorId, string),
    module: string(v.module),
    action: string(v.action),
    targetType: nullable(v.targetType, string),
    targetId: nullable(v.targetId, string),
    summary: nullable(v.summary, string),
    createdAt: string(v.createdAt),
  };
}
/** System settings are business data. Credential-like keys never reach the presentation layer. */
export const safeSettingKey = (key: string) =>
  !/(secret|password|token|api.?key|credential|connection.?string|private.?key)/i.test(
    key,
  );
export function parseSettings(value: unknown) {
  return array(record(value).settings, (x) => {
    const v = record(x);
    return {
      key: string(v.key),
      value: string(v.value),
      description: nullable(v.description, string),
      updatedAt: string(v.updatedAt),
    };
  }).filter((v) => safeSettingKey(v.key));
}
function query(page: number, filters: Record<string, string> = {}) {
  return new URLSearchParams({
    page: String(page),
    pageSize: "10",
    ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== "")),
  });
}
export const listUsers = (
  page: number,
  q: string,
  status: string,
  signal?: AbortSignal,
  roleCode = "",
) =>
  request(
    `/users?${query(page, { q, status, roleCode })}`,
    (x) => parsePage(x, parseUser),
    { signal },
  );
export const getUser = (id: string, signal?: AbortSignal) =>
  request(`/users/${encodeURIComponent(id)}`, parseUser, { signal });
export const saveUser = (
  id: string | undefined,
  body: {
    displayName: string;
    username: string;
    email?: string;
    password?: string;
    roleCodes?: string[];
  },
) =>
  request(`/users${id ? `/${encodeURIComponent(id)}` : ""}`, parseUser, {
    method: id ? "PATCH" : "POST",
    body,
  });
export const setUserStatus = (id: string, status: string) =>
  request(`/users/${encodeURIComponent(id)}/status`, parseUser, {
    method: "PATCH",
    body: { status },
  });
export const listRoles = (page: number, signal?: AbortSignal) =>
  request(`/roles?${query(page)}`, (x) => parsePage(x, parseNamed), { signal });
export const listPermissions = (
  page: number,
  roleId: string,
  signal?: AbortSignal,
) =>
  request(
    `${roleId ? `/roles/${encodeURIComponent(roleId)}/permissions` : "/permissions"}?${query(page)}`,
    (x) => parsePage(x, parseNamed),
    { signal },
  );
export const listGroups = (page: number, q: string, signal?: AbortSignal) =>
  request(`/groups?${query(page, { q })}`, (x) => parsePage(x, parseNamed), {
    signal,
  });
export const saveGroup = (
  id: string | undefined,
  body: { code?: string; name: string; description: string },
) =>
  request(`/groups${id ? `/${encodeURIComponent(id)}` : ""}`, parseNamed, {
    method: id ? "PATCH" : "POST",
    body,
  });
export const getGroupMembers = (id: string, signal?: AbortSignal) =>
  request(
    `/groups/${encodeURIComponent(id)}/members`,
    (x) =>
      array(record(x).members, (v) => {
        const m = record(v);
        return { userId: string(m.userId), joinedAt: string(m.joinedAt) };
      }),
    { signal },
  );
export const getGroupRoles = (id: string, signal?: AbortSignal) =>
  request(
    `/groups/${encodeURIComponent(id)}/roles`,
    (x) => array(record(x).roles, string),
    { signal },
  );
export const setGroupRoles = (id: string, roleCodes: string[]) =>
  request(
    `/groups/${encodeURIComponent(id)}/roles`,
    (x) => array(record(x).roles, string),
    { method: "PUT", body: { roleCodes } },
  );
export const addGroupMember = (id: string, userId: string) =>
  request(`/groups/${encodeURIComponent(id)}/members`, () => null, {
    method: "POST",
    body: { userIds: [userId] },
  });
export const removeGroupMember = (id: string, userId: string) =>
  request(
    `/groups/${encodeURIComponent(id)}/members/${encodeURIComponent(userId)}`,
    () => null,
    { method: "DELETE" },
  );
export const listCatalogTypes = (page: number, signal?: AbortSignal) =>
  request(`/catalogs/types?${query(page)}`, (x) => parsePage(x, parseNamed), {
    signal,
  });
export const listCatalogItems = (
  page: number,
  typeCode: string,
  signal?: AbortSignal,
) =>
  request(
    `/catalogs/items?${query(page, { typeCode, includeInactive: "true" })}`,
    (x) => parsePage(x, parseCatalogItem),
    { signal },
  );
export const createCatalogType = (body: {
  code: string;
  name: string;
  description: string;
}) => request("/catalogs/types", parseNamed, { method: "POST", body });
export const saveCatalogItem = (
  id: string | undefined,
  body: {
    typeCode?: string;
    code?: string;
    name: string;
    value: string;
    sortOrder: number;
    isActive?: boolean;
  },
) =>
  request(
    `/catalogs/items${id ? `/${encodeURIComponent(id)}` : ""}`,
    parseCatalogItem,
    { method: id ? "PATCH" : "POST", body },
  );
export const getSettings = (signal?: AbortSignal) =>
  request("/settings", parseSettings, { signal });
export const saveSetting = (body: {
  key: string;
  value: string;
  description: string;
}) => request("/settings", parseSettings, { method: "PATCH", body });
export const listAudits = (
  page: number,
  filters: Record<string, string>,
  signal?: AbortSignal,
) =>
  request(
    `/audit-logs?${query(page, filters)}`,
    (x) => parsePage(x, parseAudit),
    { signal },
  );
export const listActivity = (
  page: number,
  filters: Record<string, string>,
  signal?: AbortSignal,
) =>
  request(
    `/activity-events?${query(page, filters)}`,
    (x) => parsePage(x, parseActivity),
    { signal },
  );
export const getHealth = (signal?: AbortSignal) =>
  request(
    "/health",
    (x) => {
      const v = record(x),
        c = record(v.checks);
      return {
        status: string(v.status),
        backend: string(c.backend),
        database: string(c.database),
        latency: number(c.dbLatencyMs),
        ai: string(c.ai),
        aiProvider: nullable(c.aiProvider, string),
        aiModel: nullable(c.aiModel, string),
        uptimeSeconds: number(v.uptimeSeconds),
        timestamp: string(v.timestamp),
      };
    },
    { signal },
  );
