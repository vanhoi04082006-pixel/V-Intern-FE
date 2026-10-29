"use client";

/**
 * request() — wrapper dùng chung cho mọi module API:
 * gắn Bearer token, gặp 401 thì refresh một lần rồi retry.
 * Không bao giờ replay refresh/login chính nó.
 */

import { ApiError, apiFetch, type ApiFetchOptions } from "@/lib/api/transport";
import { clearSession, getAccessToken } from "@/lib/auth/session";
import { refreshSession } from "@/lib/auth/auth-service";

export async function request<T>(
  path: string,
  parse: (data: unknown) => T,
  options: Omit<ApiFetchOptions, "token"> = {},
): Promise<T> {
  const token = getAccessToken();
  try {
    return parse(await apiFetch(path, { ...options, token }));
  } catch (error) {
    if (!(error instanceof ApiError) || error.statusCode !== 401) throw error;
    if (options.signal?.aborted) throw new DOMException("Cancelled", "AbortError");
    // Có request khác đã xoay token khi 401 này đang bay → chỉ retry.
    if (getAccessToken() === token && !(await refreshSession())) throw error;
    try {
      return parse(await apiFetch(path, { ...options, token: getAccessToken() }));
    } catch (retryError) {
      if (retryError instanceof ApiError && retryError.statusCode === 401) {
        clearSession();
      }
      throw retryError;
    }
  }
}

/** GET JSON thuần. */
export async function getJson<T>(path: string, parse: (data: unknown) => T, signal?: AbortSignal): Promise<T> {
  return request<T>(path, parse, { signal });
}

/** POST/PATCH/PUT/DELETE JSON. */
export async function sendJson<T>(
  path: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  body: unknown,
  parse: (data: unknown) => T,
): Promise<T> {
  return request<T>(path, parse, { method, body });
}

/** POST FormData (upload CV...). */
export async function sendForm<T>(path: string, formData: FormData, parse: (data: unknown) => T): Promise<T> {
  return request<T>(path, parse, { method: "POST", formData });
}

/** Tải file (PDF/XLSX/CV) → Blob. */
export async function downloadFile(path: string, responseType: "pdf" | "xlsx" | "cv"): Promise<Blob> {
  return request<Blob>(path, (data) => data as Blob, { responseType });
}

/** Tải Blob về máy với tên file. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ─────────────────── Phân trang & parse helper (contract BE) ───────────── */

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export function parsePageMeta(value: unknown): PageMeta {
  const m = (value ?? {}) as Record<string, unknown>;
  return {
    page: Number(m.page ?? 1) || 1,
    pageSize: Number(m.pageSize ?? 20) || 20,
    total: Number(m.total ?? 0) || 0,
    totalPages: Number(m.totalPages ?? 0) || 0,
  };
}

export function parsePaginated<T>(parseItem: (item: any) => T): (data: unknown) => Paginated<T> {
  return (data: unknown) => {
    const raw = (data ?? {}) as Record<string, unknown>;
    return {
      data: Array.isArray(raw.data) ? raw.data.map(parseItem) : [],
      meta: parsePageMeta(raw.meta),
    };
  };
}

/** Build query string từ object — bỏ qua giá trị rỗng. */
export function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}

/** Ép an toàn các giá trị số từ BE (decimal mssql hay về string). */
export function numOf(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Ngày ISO hoặc null. */
export function dateOf(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** Chuỗi an toàn. */
export function strOf(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

/** Mảng an toàn. */
export function arrOf<T>(value: unknown, parseItem: (item: unknown) => T): T[] {
  return Array.isArray(value) ? value.map(parseItem) : [];
}

/** Định dạng ngày tiếng Việt gọn. */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Định dạng ngày giờ tiếng Việt. */
export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Định dạng tiền tệ ảo (VND). */
export function fmtVnd(value: unknown): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(numOf(value));
}
