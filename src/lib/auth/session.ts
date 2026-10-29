"use client";

/**
 * Phiên đăng nhập in-memory — token access chỉ sống trong bộ nhớ JS,
 * refresh token nằm trong HttpOnly cookie của backend (Path=/api/v1/auth).
 * Đồng bộ "đăng xuất / phiên đổi" giữa các tab qua BroadcastChannel.
 */

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  status: string;
  roles: string[];
  permissions: string[];
  mustChangePassword?: boolean;
}

type SessionState = { accessToken: string; user: SessionUser } | null;

let state: SessionState = null;
let logoutPending = false;
let channel: BroadcastChannel | null = null;
const listeners = new Set<() => void>();

function sessionChannel(): BroadcastChannel | null {
  if (!channel && typeof window !== "undefined" && "BroadcastChannel" in window) {
    channel = new BroadcastChannel("vintern-session-events");
    channel.onmessage = (event: MessageEvent<unknown>) => {
      if (event.data === "logout" || event.data === "session-changed") {
        state = null;
        listeners.forEach((fn) => fn());
      }
    };
  }
  return channel;
}

export function notifyOtherTabs(event: "logout" | "session-changed"): void {
  sessionChannel()?.postMessage(event);
}

export function setSession(accessToken: string, user: SessionUser): void {
  state = { accessToken, user };
  listeners.forEach((fn) => fn());
}

export function getAccessToken(): string | null {
  return state?.accessToken ?? null;
}

export function getSessionUser(): SessionUser | null {
  return state?.user ?? null;
}

export function clearSession(): void {
  state = null;
  listeners.forEach((fn) => fn());
}

export function subscribeSession(listener: () => void): () => void {
  sessionChannel();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setLogoutPending(pending: boolean): void {
  logoutPending = pending;
}

export function isLogoutPending(): boolean {
  return logoutPending;
}

/* ────────────────────────── Helpers vai trò & quyền ───────────────────── */

export function hasPermission(user: SessionUser | null, code: string): boolean {
  if (!user) return false;
  // "*" = grantAll (admin) — mọi quyền đều qua.
  return user.permissions.includes("*") || user.permissions.includes(code);
}

export function hasAnyPermission(user: SessionUser | null, codes: string[]): boolean {
  if (!user) return false;
  if (user.permissions.includes("*")) return true;
  return codes.some((c) => user.permissions.includes(c));
}

export function primaryRole(user: SessionUser | null): "admin" | "instructor" | "intern" {
  if (!user) return "intern";
  if (user.roles.includes("admin")) return "admin";
  if (user.roles.includes("instructor")) return "instructor";
  return "intern";
}

export const ROLE_LABELS: Record<string, string> = {
  admin: "Quản trị viên",
  instructor: "Giảng viên",
  intern: "Thực tập sinh",
};
