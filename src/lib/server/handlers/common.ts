/**
 * Hạ tầng dùng chung cho handlers: context, đăng ký route, phân quyền,
 * response chuẩn { data, meta } và lỗi chuẩn { statusCode, message, code }.
 */

import { NextResponse } from "next/server";
import type { Store, User } from "../types";
import { getStore, getUserByToken } from "../store";
import { paginate, type PageResult } from "../util";

export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** Ai được gọi route: "public" | "user" (đăng nhập bất kỳ) | 1 role | mảng role. */
export type AuthSpec = "public" | "user" | User["role"] | User["role"][];

export interface Ctx {
  req: Request;
  method: Method;
  path: string;
  segments: string[];
  query: URLSearchParams;
  /** Body JSON đã parse (null nếu không có / lỗi parse). */
  body: Record<string, unknown> | null;
  /** Tham số path từ pattern ví dụ /tasks/:id → { id }. */
  params: Record<string, string>;
  /** User đăng nhập (null với route public chưa có/không sai token). */
  user: User | null;
  store: Store;
}

export interface RouteDef {
  method: Method;
  /** Pattern kiểu "/tasks/:id/comments" — khớp từng segment. */
  pattern: string;
  auth: AuthSpec;
  handler: (ctx: Ctx) => Promise<unknown>;
}

export function route(
  method: Method,
  pattern: string,
  auth: AuthSpec,
  handler: (ctx: Ctx) => Promise<unknown>
): RouteDef {
  return { method, pattern, auth, handler };
}

/* ------------------------------- Lỗi chuẩn ------------------------------- */

export class ApiErr extends Error {
  status: number;
  code?: string;
  details?: string[];

  constructor(status: number, message: string, code?: string, details?: string[]) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function badRequest(message: string, details?: string[]): ApiErr {
  return new ApiErr(400, message, "VALIDATION_ERROR", details);
}

export function unauthorized(message = "Phiên đăng nhập không hợp lệ hoặc đã hết hạn."): ApiErr {
  return new ApiErr(401, message, "UNAUTHORIZED");
}

export function forbidden(message = "Bạn không có quyền thực hiện thao tác này."): ApiErr {
  return new ApiErr(403, message, "FORBIDDEN");
}

export function notFound(message = "Không tìm thấy tài nguyên."): ApiErr {
  return new ApiErr(404, message, "NOT_FOUND");
}

export function conflict(message: string, code = "CONFLICT"): ApiErr {
  return new ApiErr(409, message, code);
}

/* ----------------------------- Phân quyền ----------------------------- */

/** Đường dẫn public (không cần token). */
export const PUBLIC_PATHS = ["/auth/login", "/auth/register"];

export function isPublicPath(path: string): boolean {
  if (path === "/auth/login" || path === "/auth/register") return true;
  if (path.startsWith("/certificates/verify/")) return true;
  return false;
}

function matchAuth(auth: AuthSpec, user: User | null): { ok: boolean; status?: number; message?: string } {
  if (auth === "public") return { ok: true };
  if (!user) return { ok: false, status: 401, message: "Chưa đăng nhập hoặc token không hợp lệ." };
  if (auth === "user") return { ok: true };
  const roles = Array.isArray(auth) ? auth : [auth];
  if (!roles.includes(user.role)) return { ok: false, status: 403, message: "Bạn không có quyền truy cập tài nguyên này." };
  return { ok: true };
}

/* ------------------------------- Dispatch ------------------------------- */

function matchPattern(pattern: string, segments: string[]): Record<string, string> | null {
  const parts = pattern.split("/").filter(Boolean);
  if (parts.length !== segments.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.startsWith(":")) {
      params[p.slice(1)] = decodeURIComponent(segments[i]);
    } else if (p !== segments[i]) {
      return null;
    }
  }
  return params;
}

export function toResponse(value: unknown): Response {
  if (value instanceof Response) return value;
  if (value === undefined || value === null) return new NextResponse(null, { status: 204 });
  return NextResponse.json(value);
}

export function errResponse(err: unknown): Response {
  if (err instanceof ApiErr) {
    const payload: Record<string, unknown> = { statusCode: err.status, message: err.message };
    if (err.code) payload.code = err.code;
    if (err.details) payload.details = err.details;
    return NextResponse.json(payload, { status: err.status });
  }
  const message = err instanceof Error ? err.message : "Lỗi máy chủ không xác định.";
  return NextResponse.json({ statusCode: 500, message, code: "INTERNAL_ERROR" }, { status: 500 });
}

/** Dispatch 1 request tới bảng route. Trả về Response (kể cả 404). */
export async function dispatch(allRoutes: RouteDef[], req: Request, rawPath: string, method: Method): Promise<Response> {
  const path = "/" + rawPath.split("/").filter(Boolean).join("/");
  const segments = path.split("/").filter(Boolean);
  const url = new URL(req.url);
  const query = url.searchParams;

  let body: Record<string, unknown> | null = null;
  if (method !== "GET" && method !== "DELETE") {
    try {
      const text = await req.text();
      body = text ? (JSON.parse(text) as Record<string, unknown>) : null;
    } catch {
      body = null;
    }
  }

  const store = getStore();
  // Token: route public vẫn cho user nếu token hợp lệ.
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : null;
  const user = getUserByToken(token) ?? null;

  let matchedPath = false;
  for (const r of allRoutes) {
    const params = matchPattern(r.pattern, segments);
    if (!params) continue;
    matchedPath = true;
    if (r.method !== method) continue;

    const check = matchAuth(r.auth, user);
    if (!check.ok) {
      return errResponse(check.status === 403 ? forbidden(check.message) : unauthorized(check.message));
    }

    const ctx: Ctx = { req, method, path, segments, query, body, params, user, store };
    try {
      const result = await r.handler(ctx);
      return toResponse(result);
    } catch (err) {
      return errResponse(err);
    }
  }

  if (matchedPath) {
    return errResponse(new ApiErr(405, "Phương thức không được hỗ trợ cho tài nguyên này.", "METHOD_NOT_ALLOWED"));
  }
  return errResponse(notFound("Không tìm thấy tài nguyên"));
}

/* --------------------------- Helper response --------------------------- */

export function pageOf<T>(items: T[], query: URLSearchParams): PageResult<T> {
  const page = Number(query.get("page") ?? 1) || 1;
  const pageSize = Number(query.get("pageSize") ?? 10) || 10;
  return paginate(items, page, pageSize);
}

/** Đọc giá trị query boolean "true"/"1". */
export function queryBool(query: URLSearchParams, key: string): boolean {
  const v = query.get(key);
  return v === "true" || v === "1";
}

export function requireString(body: Record<string, unknown> | null, field: string, label: string): string {
  const v = body?.[field];
  if (typeof v !== "string" || !v.trim()) throw badRequest(`Trường "${label}" là bắt buộc.`, [`${field}: bắt buộc`]);
  return v.trim();
}

export function requireNumber(body: Record<string, unknown> | null, field: string, label: string): number {
  const v = body?.[field];
  if (typeof v !== "number" || !Number.isFinite(v)) throw badRequest(`Trường "${label}" phải là số.`, [`${field}: số`]);
  return v;
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
