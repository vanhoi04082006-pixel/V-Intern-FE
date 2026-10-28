"use client";

import { clearSession, getSessionToken } from "./session";

export class ApiError extends Error {
  status: number;
  code: string;
  details?: string[];

  constructor(status: number, message: string, code = "", details?: string[]) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.name = "ApiError";
  }
}

export interface PageData<T> {
  data: T[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

const BASE = "/api/v1";

type QueryValue = string | number | boolean | undefined | null;

export function buildQuery(params: Record<string, QueryValue>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export async function api<T>(
  path: string,
  opts?: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: unknown;
    query?: Record<string, QueryValue>;
  }
): Promise<T> {
  const url = `${BASE}${path}${opts?.query ? buildQuery(opts.query) : ""}`;
  const headers: Record<string, string> = {};
  const token = getSessionToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opts?.body !== undefined) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(url, {
      method: opts?.method ?? "GET",
      headers,
      body: opts?.body !== undefined ? JSON.stringify(opts.body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "Không kết nối được máy chủ. Vui lòng thử lại.", "NETWORK_ERROR");
  }

  if (res.status === 204) return undefined as T;

  let payload: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!res.ok) {
    const err = (payload ?? {}) as {
      message?: string;
      code?: string;
      details?: string[];
    };
    if (res.status === 401 && !path.startsWith("/auth/")) {
      clearSession();
      if (typeof window !== "undefined") {
        window.location.hash = "#/login";
      }
    }
    throw new ApiError(
      res.status,
      err.message ?? "Có lỗi xảy ra, vui lòng thử lại.",
      err.code ?? "",
      err.details
    );
  }

  return payload as T;
}

/** Tải file blob (CSV/PDF) kèm Bearer, tự kích hoạt download. */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const token = getSessionToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new ApiError(res.status, "Không tải được tệp.");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
