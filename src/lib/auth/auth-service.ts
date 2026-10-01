/**
 * Ranh giới tích hợp API xác thực (authentication service boundary).
 *
 * Đã nối backend thật theo contract **Module 1** đã kiểm chứng từ source BE:
 * `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`,
 * `POST /api/v1/auth/logout` (204), `GET /api/v1/auth/me`.
 * UI form giữ nguyên — chỉ map `AuthResult` như trước.
 *
 * Chưa có endpoint BE cho: đăng ký công khai, quên/đặt lại mật khẩu,
 * newsletter, Google OAuth → các hàm đó vẫn trả `not-connected` trung thực,
 * KHÔNG giả thành công. (`POST /users` của BE yêu cầu role `admin`, không
 * phải đăng ký công khai nên không được dùng cho form register.)
 *
 * Quy ước:
 * - KHÔNG invent API URL / request contract / response shape ở đây.
 * - `message` trả về luôn là câu tiếng Việt hiển thị thẳng cho người dùng.
 * - Không lộ thông tin nhạy cảm/raw nội bộ server ra UI.
 */

import { ApiError, apiFetch, isApiConfigured } from "@/lib/auth/api-client";
import { clearSession, getAccessToken, setSession } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/session";
import { EMAIL_PATTERN } from "@/lib/auth/validation";

export type { SessionUser };
export { getSessionUser } from "@/lib/auth/session";

export interface LoginCredentials {
  identifier: string;
  password: string;
  /**
   * Giữ lại vì UI đã duyệt có checkbox "Ghi nhớ đăng nhập".
   * Contract BE KHÔNG nhận field này → không gửi đi, không phát minh
   * persistence nào từ nó (không localStorage/sessionStorage/cookie tự chế).
   */
  remember: boolean;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
}

export type AuthFailureKind = "auth-error" | "system-error" | "not-connected";

export type AuthFailure = {
  ok: false;
  kind: AuthFailureKind;
  message: string;
};

/** Kết quả login: success mang SessionUser theo đúng contract BE. */
export type LoginResult = { ok: true; user: SessionUser } | AuthFailure;

/**
 * Kết quả các thao tác auth khác (register/reset...): success KHÔNG mang
 * user để không bắt các action không liên quan phải khớp contract response
 * của login. Các hàm đó hiện vẫn not-connected (BE chưa có endpoint).
 */
export type AuthResult = { ok: true } | AuthFailure;

const NOT_CONNECTED_MESSAGE =
  "Tính năng đăng nhập chưa được kết nối với hệ thống.";
const GENERIC_AUTH_ERROR = "Email hoặc mật khẩu không chính xác.";
const SYSTEM_ERROR_MESSAGE =
  "Không thể kết nối đến hệ thống. Vui lòng thử lại sau.";

interface LoginSuccessBody {
  accessToken: string;
  user: SessionUser;
}

function isSessionUser(value: unknown): value is SessionUser {
  if (typeof value !== "object" || value === null) return false;
  const user = value as Record<string, unknown>;
  return (
    typeof user.id === "string" &&
    typeof user.email === "string" &&
    typeof user.displayName === "string" &&
    isStringArray(user.roles) &&
    isStringArray(user.permissions)
  );
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item): item is string => typeof item === "string")
  );
}

/**
 * Narrowing tường minh cho response login/refresh (200).
 * `apiFetch` trả `unknown` — không bao giờ truy cập property trước khi guard.
 * Mọi shape sai (null, primitive, array, object thiếu field) đều → null để
 * caller xử lý fail-closed. Chỉ kiểm tra đúng field FE cần (accessToken +
 * user); không ép các field còn lại của contract để tránh giòn khi BE mở rộng.
 */
function parseLoginSuccessBody(data: unknown): LoginSuccessBody | null {
  if (typeof data !== "object" || data === null) return null;
  const body = data as Record<string, unknown>;
  if (typeof body.accessToken !== "string") return null;
  if (!isSessionUser(body.user)) return null;
  return { accessToken: body.accessToken, user: body.user };
}

function toAuthError(error: unknown): AuthFailure {
  if (error instanceof ApiError) {
    if (error.statusCode === 401) {
      return { ok: false, kind: "auth-error", message: GENERIC_AUTH_ERROR };
    }
    if (error.statusCode === 429) {
      return {
        ok: false,
        kind: "auth-error",
        message:
          "Quá nhiều lần thử đăng nhập. Vui lòng chờ ít nhất 60 giây trước khi thử lại.",
      };
    }
    if (error.statusCode === 400 && error.code === "INVALID_PASSWORD") {
      return {
        ok: false,
        kind: "auth-error",
        message: "Mật khẩu quá dài (tối đa 72 ký tự).",
      };
    }
    if (error.statusCode >= 400 && error.statusCode < 500) {
      // BE cố ý không phân biệt email tồn tại hay không → generic.
      return { ok: false, kind: "auth-error", message: GENERIC_AUTH_ERROR };
    }
  }
  return { ok: false, kind: "system-error", message: SYSTEM_ERROR_MESSAGE };
}

export async function login(
  credentials: LoginCredentials
): Promise<LoginResult> {
  if (!isApiConfigured()) {
    return {
      ok: false,
      kind: "not-connected",
      message: NOT_CONNECTED_MESSAGE,
    };
  }

  // `LoginDto` của BE yêu cầu `@IsEmail()` — chặn sớm, không gọi fetch.
  // Message generic để không lộ user nào tồn tại (đúng ý đồ của BE).
  // Không đổi validation/label của form ("Email hoặc tên đăng nhập" là copy
  // đã duyệt; đây chỉ là enforcement ở service boundary).
  const email = credentials.identifier.trim();
  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, kind: "auth-error", message: GENERIC_AUTH_ERROR };
  }

  let data: unknown;
  try {
    // Đúng contract: chỉ {email, password}. Không gửi `remember`.
    data = await apiFetch("/auth/login", {
      method: "POST",
      body: { email, password: credentials.password },
    });
  } catch (error) {
    return toAuthError(error);
  }

  const parsed = parseLoginSuccessBody(data);
  if (!parsed) {
    return { ok: false, kind: "system-error", message: SYSTEM_ERROR_MESSAGE };
  }

  setSession(parsed.accessToken, parsed.user);
  return { ok: true, user: parsed.user };
}

/**
 * Đăng xuất: thu hồi refresh cookie phía BE (204) rồi xóa session FE.
 * Luôn xóa session local kể cả khi gọi BE thất bại (best-effort).
 */
export async function logout(): Promise<void> {
  if (isApiConfigured()) {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Logout best-effort: session local vẫn bị xóa bên dưới.
    }
  }
  clearSession();
}

/**
 * Khôi phục session sau reload: dùng refresh cookie (HttpOnly, trình duyệt
 * tự gửi nhờ `credentials: "include"`) để lấy access token mới mà không cần
 * nhập lại mật khẩu. Không bao giờ đọc cookie bằng JavaScript.
 * Trả `null` khi không có cookie hợp lệ.
 */
export async function refreshSession(): Promise<SessionUser | null> {
  if (!isApiConfigured()) return null;
  let data: unknown;
  try {
    data = await apiFetch("/auth/refresh", { method: "POST" });
  } catch {
    clearSession();
    return null;
  }
  const parsed = parseLoginSuccessBody(data);
  if (!parsed) {
    clearSession();
    return null;
  }
  setSession(parsed.accessToken, parsed.user);
  return parsed.user;
}

/**
 * Lấy principal hiện tại (`GET /api/v1/auth/me`, Bearer token).
 * Tự refresh một lần khi access token hết hạn (401); trả `null` khi không
 * còn session hợp lệ. Không phát minh trang/route nào để dùng hàm này.
 */
export async function fetchCurrentUser(): Promise<SessionUser | null> {
  const token = getAccessToken();
  if (!isApiConfigured() || !token) return null;
  try {
    const user = (await apiFetch("/auth/me", { token })) as unknown;
    if (!isSessionUser(user)) {
      // 200 nhưng body không đúng contract: không thể xác thực session đang
      // giữ → fail-closed (xóa) thay vì giữ session mâu thuẫn (null user +
      // token còn sống). Caller đọc null là là "không có session".
      clearSession();
      return null;
    }
    setSession(token, user);
    return user;
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 401) {
      return refreshSession();
    }
    return null;
  }
}

export async function register(
  _payload: RegisterPayload
): Promise<AuthResult> {
  void _payload;
  // Module 1 chưa có endpoint đăng ký công khai (chỉ admin tạo user qua
  // POST /users). Giữ trung thực, không giả thành công.
  return {
    ok: false,
    kind: "not-connected",
    message: "Tính năng đăng ký chưa được kết nối với hệ thống.",
  };
}

export async function requestPasswordReset(_email: string): Promise<AuthResult> {
  void _email;
  // Module 1 chưa có endpoint quên/đặt lại mật khẩu.
  return {
    ok: false,
    kind: "not-connected",
    message:
      "Tính năng đặt lại mật khẩu chưa được kết nối với hệ thống. Vui lòng thử lại sau.",
  };
}
