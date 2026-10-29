"use client";

/**
 * Transport HTTP cho V-Intern backend (NestJS, base /api/v1).
 *
 * Contract bắt buộc (từ source BE):
 * - Lỗi: { statusCode, code, message, details? } — message có thể là string
 *   hoặc mảng string (ValidationPipe).
 * - 204 không có body.
 * - Download: PDF / XLSX / CV — kiểm tra content-type chặt.
 * - forbidNonWhitelisted: FE KHÔNG gửi field thừa — mọi module API phải
 *   khai báo type riêng và chỉ gửi field đúng DTO.
 */

export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Base URL: rỗng = same-origin qua rewrite proxy của next.config.ts. */
export function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").trim().replace(/\/+$/, "");
}

export type ResponseType = "json" | "pdf" | "xlsx" | "cv";

export interface ApiFetchOptions {
  method?: string;
  body?: unknown;
  formData?: FormData;
  token?: string | null;
  signal?: AbortSignal;
  responseType?: ResponseType;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const CONTENT_TYPES: Record<Exclude<ResponseType, "json">, string> = {
  pdf: "application/pdf",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  cv: "application/octet-stream",
};

export async function apiFetch(
  path: string,
  { method = "GET", body, formData, token, signal, responseType = "json" }: ApiFetchOptions = {},
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      method,
      credentials: "include",
      cache: "no-store",
      signal,
      headers: {
        ...(formData || body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(formData
        ? { body: formData }
        : body === undefined
          ? {}
          : { body: JSON.stringify(body) }),
    });
  } catch (error) {
    if (isRecord(error) && error.name === "AbortError") throw error;
    throw new ApiError(0, "NETWORK_ERROR", "Không thể kết nối đến hệ thống.");
  }

  if (response.status === 204 && response.ok) return null;

  if (response.ok && responseType !== "json") {
    const expected = CONTENT_TYPES[responseType];
    const actual = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
    if (actual !== expected) {
      throw new ApiError(0, "INVALID_RESPONSE", "Dữ liệu tải về chưa đúng định dạng.");
    }
    return response.blob();
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    /* JSON lỗi format → rơi vào xử lý bên dưới */
  }

  if (!response.ok) {
    const err = isRecord(data) ? data : {};
    const message =
      typeof err.message === "string"
        ? err.message
        : Array.isArray(err.message)
          ? err.message.filter((x): x is string => typeof x === "string").join("; ")
          : response.statusText || "Có lỗi xảy ra.";
    throw new ApiError(
      response.status,
      typeof err.code === "string" ? err.code : "HTTP_ERROR",
      message,
      err.details ?? err.errors,
    );
  }
  return data;
}

/** Thông điệp lỗi tiếng Việt thân thiện cho các mã lỗi thường gặp của BE. */
const ERROR_MESSAGES: Record<string, string> = {
  NETWORK_ERROR: "Không kết nối được máy chủ. Kiểm tra backend đang chạy rồi thử lại.",
  INVALID_CREDENTIALS: "Email hoặc mật khẩu không chính xác.",
  ACCOUNT_LOCKED: "Tài khoản đã bị khoá. Liên hệ quản trị viên để được hỗ trợ.",
  ACCOUNT_PENDING: "Tài khoản chưa được kích hoạt. Liên hệ quản trị viên.",
  ACCOUNT_DELETED: "Tài khoản không còn tồn tại.",
  ACCOUNT_UNAVAILABLE: "Tài khoản hiện không khả dụng. Liên hệ quản trị viên.",
  TOKEN_REVOKED: "Phiên đăng nhập đã hết hạn. Đăng nhập lại giúp mình nhé.",
  REGISTRATION_CONFLICT: "Email này đã được đăng ký. Thử đăng nhập hoặc dùng email khác.",
  REGISTRATION_CLOSED: "Hệ thống hiện đóng đăng ký công khai.",
  VALIDATION_ERROR: "Dữ liệu gửi lên chưa hợp lệ. Kiểm tra lại các trường đã nhập.",
  AI_PROVIDER_UNAVAILABLE: "Tính năng AI chưa được cấu hình trên máy chủ.",
  KPI_CALCULATION_IN_PROGRESS: "Đang tính toán KPI, vui lòng đợi ít phút rồi tải lại.",
  CERTIFICATE_NOT_ELIGIBLE: "Sinh viên chưa đủ điều kiện cấp chứng nhận.",
  SPRINT_CODE_TAKEN: "Mã sprint đã tồn tại, chọn mã khác nhé.",
  ASSIGNMENT_CONFLICT: "Sinh viên này đã có phân công rồi.",
  PROJECT_CAPACITY_FULL: "Đồ án đã đủ số lượng thành viên.",
  SESSION_NOT_ASSIGNABLE: "Phiên thực tập hiện không nhận phân công mới.",
  INVALID_SESSION_TRANSITION: "Không thể chuyển trạng thái phiên theo cách này.",
  GITHUB_RATE_OR_PERMISSION: "GitHub đang giới hạn hoặc thiếu quyền. Thử lại sau.",
  CV_FILE_INVALID: "CV cần là PDF hoặc DOCX, tối đa 5 MB.",
};

export function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "Không thể xử lý dữ liệu. Vui lòng thử lại.";
  }
  return ERROR_MESSAGES[error.code] ?? error.message;
}
