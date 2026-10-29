// lib.ts — shared helpers: responses, pagination, tokens, cookies, RBAC.
import { db, DEMO_NOW, type UserRec } from "./data";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  status: string;
  roles: string[];
  permissions: string[];
  mustChangePassword: boolean;
}

export interface Ctx {
  req: Request;
  url: URL;
  params: Record<string, string>;
  user: AuthUser | null; // null on public routes
  body: any;
}

export type Handler = (ctx: Ctx) => Response | Promise<Response>;

/* ---------------- responses ---------------- */

export function json(data: any, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}

export function err(status: number, code: string, message: string): Response {
  return json({ statusCode: status, code, message }, status);
}

export function notFound(): Response {
  return err(404, "NOT_FOUND", "Không tìm thấy tài nguyên.");
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}

export function nowIso(): string {
  return new Date().toISOString();
}

/* ---------------- query helpers ---------------- */

export function searchParam(url: URL, ...names: string[]): string | undefined {
  for (const n of names) {
    const v = url.searchParams.get(n);
    if (v !== null && v !== "") return v;
  }
  return undefined;
}

export function toInt(v: string | null | undefined, def: number, min = 0): number {
  const n = parseInt(String(v ?? ""), 10);
  if (Number.isNaN(n)) return def;
  return Math.max(min, n);
}

export function isTrue(v: string | null | undefined): boolean {
  return v === "true" || v === "1" || v === "yes";
}

export function paginate<T>(items: T[], url: URL) {
  const page = toInt(url.searchParams.get("page"), 1, 1);
  const pageSize = toInt(url.searchParams.get("pageSize"), 20, 1);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  return { data: items.slice(start, start + pageSize), meta: { page, pageSize, total, totalPages } };
}

export function matches(haystack: string | undefined | null, needle: string | undefined): boolean {
  if (!needle) return true;
  return String(haystack ?? "").toLowerCase().includes(needle.toLowerCase());
}

/* ---------------- ids ---------------- */

const counters: Record<string, number> = {};
export function nid(prefix: string): string {
  counters[prefix] = (counters[prefix] || 0) + 1;
  return `${prefix}_${counters[prefix]}`;
}

/* ---------------- demo clock ---------------- */
// The mock universe is anchored here so relative dates (overdue tasks, active
// sprints, …) stay meaningful no matter when the server is started.
export const DEMO_NOW_MS = new Date(DEMO_NOW).getTime();
export function isPast(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < DEMO_NOW_MS;
}

/* ---------------- RBAC ---------------- */

export function toAuthUser(u: UserRec): AuthUser {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    status: u.status,
    roles: u.roles,
    permissions: u.permissions,
    mustChangePassword: !!u.mustChangePassword,
  };
}

export function hasPerm(user: AuthUser, perm: string | string[] | null): boolean {
  if (perm === null || perm === undefined) return true;
  if (user.permissions.includes("*")) return true;
  const list = Array.isArray(perm) ? perm : [perm];
  return list.some((p) => user.permissions.includes(p));
}

export function findUser(id: string): UserRec | undefined {
  return db.users.find((u) => u.id === id);
}

export function userName(id: string | null | undefined): string {
  if (!id) return "";
  return findUser(id)?.displayName ?? "";
}

/* ---------------- fake JWT access tokens ---------------- */

const ACCESS_TTL_MS = 15 * 60 * 1000; // 15 minutes

export function signAccessToken(user: UserRec): string {
  const iat = Date.now();
  const payload = { sub: user.id, email: user.email, av: "1", iat, exp: iat + ACCESS_TTL_MS };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = Buffer.from(`sig:${user.id}:${iat}`, "utf8").toString("base64url");
  return `${body}.${sig}`;
}

export interface AccessPayload {
  sub: string;
  email: string;
  av?: string;
  iat: number;
  exp: number;
}

export function decodeAccessToken(token: string): AccessPayload | null {
  const [body] = token.split(".");
  if (!body) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as AccessPayload;
  } catch {
    return null;
  }
}

/** Returns the user for a bearer token, or an error code. */
export function userFromBearer(req: Request): { user: AuthUser; error?: never } | { user?: never; error: string } {
  const header = req.headers.get("authorization") || "";
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) return { error: "TOKEN_MISSING" };
  const payload = decodeAccessToken(m[1].trim());
  if (!payload || !payload.sub) return { error: "TOKEN_INVALID" };
  if (payload.exp && payload.exp < Date.now()) return { error: "TOKEN_EXPIRED" };
  const rec = findUser(payload.sub);
  if (!rec) return { error: "TOKEN_INVALID" };
  return { user: toAuthUser(rec) };
}

/* ---------------- refresh tokens ---------------- */

export const refreshTokens = new Map<string, { userId: string; issuedAt: number }>();

export function newRefreshToken(userId: string): string {
  const token = `rt_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  refreshTokens.set(token, { userId, issuedAt: Date.now() });
  return token;
}

/* ---------------- cookies ---------------- */

export function getCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) return part.slice(idx + 1).trim();
  }
  return null;
}

export const REFRESH_COOKIE = "vintern_refresh";
export const CANDIDATE_COOKIE = "vintern_candidate";
