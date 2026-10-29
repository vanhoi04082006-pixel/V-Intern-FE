"use client";

/**
 * Tích hợp xác thực với V-Intern backend — đúng contract Module Auth:
 * POST /auth/login, POST /auth/register, POST /auth/refresh (cookie),
 * POST /auth/logout (204), GET /auth/me, POST /auth/change-password.
 *
 * BE KHÔNG có quên mật khẩu — khôi phục do admin cấp mật khẩu tạm
 * (mustChangePassword). Không bịa endpoint, không giả thành công.
 */

import { apiFetch, errorMessage } from "@/lib/api/transport";
import {
  clearSession,
  getAccessToken,
  getSessionUser,
  isLogoutPending,
  notifyOtherTabs,
  setLogoutPending,
  setSession,
  type SessionUser,
} from "@/lib/auth/session";
import { isRecord } from "@/lib/api/transport";

export type { SessionUser };

function parseUser(data: unknown): SessionUser {
  if (!isRecord(data)) throw new Error("INVALID_RESPONSE");
  const user = isRecord(data.user) ? data.user : data;
  return {
    id: String(user.id ?? ""),
    email: String(user.email ?? ""),
    displayName: String(user.displayName ?? ""),
    status: String(user.status ?? "active"),
    roles: Array.isArray(user.roles) ? user.roles.map(String) : [],
    permissions: Array.isArray(user.permissions) ? user.permissions.map(String) : [],
    mustChangePassword: user.mustChangePassword === true,
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  acceptedTerms: boolean;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

/** Kết quả auth: ok mang SessionUser (nếu response có), fail mang message tiếng Việt. */
export type AuthResult =
  | { ok: true; user?: SessionUser }
  | { ok: false; message: string };

export async function login(payload: LoginPayload): Promise<AuthResult> {
  try {
    const data = await apiFetch("/api/v1/auth/login", {
      method: "POST",
      body: { email: payload.email, password: payload.password },
    });
    const parsed = isRecord(data) ? data : {};
    setSession(String(parsed.accessToken ?? ""), parseUser(parsed));
    notifyOtherTabs("session-changed");
    return { ok: true, user: getSessionUser() ?? undefined };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

export async function register(payload: RegisterPayload): Promise<AuthResult> {
  try {
    await apiFetch("/api/v1/auth/register", {
      method: "POST",
      body: {
        fullName: payload.fullName,
        email: payload.email,
        password: payload.password,
        acceptedTerms: payload.acceptedTerms,
      },
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

/** Đổi mật khẩu. BE xoá refresh cookie → bắt đăng nhập lại sau khi đổi. */
export async function changePassword(payload: ChangePasswordPayload): Promise<AuthResult> {
  try {
    await apiFetch("/api/v1/auth/change-password", {
      method: "POST",
      body: {
        currentPassword: payload.currentPassword,
        newPassword: payload.newPassword,
      },
      token: getAccessToken(),
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

/** Làm mới phiên từ HttpOnly cookie. true nếu còn phiên hợp lệ. */
export async function refreshSession(): Promise<boolean> {
  if (isLogoutPending()) return false;
  try {
    const data = await apiFetch("/api/v1/auth/refresh", { method: "POST" });
    const parsed = isRecord(data) ? data : {};
    setSession(String(parsed.accessToken ?? ""), parseUser(parsed));
    return true;
  } catch {
    clearSession();
    return false;
  }
}

/** Lấy principal mới nhất (dùng sau khi đổi quyền, kiểm tra trạng thái). */
export async function fetchMe(): Promise<SessionUser | null> {
  try {
    const data = await apiFetch("/api/v1/auth/me", { token: getAccessToken() });
    const user = parseUser(data);
    const token = getAccessToken();
    if (token) setSession(token, user);
    return user;
  } catch {
    return null;
  }
}

/** Đăng xuất: thu hồi refresh cookie phía BE rồi xoá phiên local. */
export async function logout(): Promise<void> {
  setLogoutPending(true);
  try {
    await apiFetch("/api/v1/auth/logout", { method: "POST", token: getAccessToken() });
  } catch {
    /* Thu hồi tốt nhất có thể — vẫn xoá phiên local. */
  } finally {
    clearSession();
    setLogoutPending(false);
    notifyOtherTabs("logout");
  }
}
