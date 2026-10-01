/**
 * Ranh giới HTTP typed giữa frontend và backend V-Intern (Module 1: `/api/v1`).
 *
 * Mọi thứ UI cần để gọi BE đều đi qua đây — component không tự dựng URL,
 * không tự gắn `Authorization`, không tự cấu hình `credentials`.
 *
 * - Base URL đọc lazy từ `NEXT_PUBLIC_API_BASE_URL` (chuẩn hóa slash một
 *   lần ở đây, không rải rác khắp component).
 * - Mọi request đều `credentials: "include"` để trình duyệt gửi/nhận
 *   HttpOnly refresh cookie (`vintern_refresh`). Không bao giờ đọc cookie
 *   đó bằng JavaScript.
 * - BE dùng `ValidationPipe` với `forbidNonWhitelisted` → chỉ gửi đúng field
 *   trong contract, không thêm field lạ.
 * - JSON ngoài là dữ liệu không đáng tin: parse bằng `unknown` + narrowing,
 *   không dùng `any`.
 */

export interface ApiErrorBody {
  statusCode: number;
  code: string;
  message: string;
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? "")
    .trim()
    .replace(/\/+$/, "");
}

export function isApiConfigured(): boolean {
  return getApiBaseUrl().length > 0;
}

export interface ApiFetchOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function apiFetch(
  path: string,
  { method = "GET", body, token }: ApiFetchOptions = {}
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}/api/v1${path}`, {
      method,
      credentials: "include",
      headers: {
        // Chỉ gửi Content-Type khi thực sự có JSON body (login). Các request
        // không body (refresh/logout/me) không gửi header thừa.
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Network request failed.");
  }

  // 204 (logout) không có body — không parse JSON.
  if (response.status === 204) return null;

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const err = isRecord(data) ? data : {};
    const statusCode =
      typeof err.statusCode === "number" ? err.statusCode : response.status;
    throw new ApiError(
      statusCode,
      typeof err.code === "string" ? err.code : "UNKNOWN_ERROR",
      typeof err.message === "string" && err.message.length > 0
        ? err.message
        : response.statusText
    );
  }

  return data;
}
