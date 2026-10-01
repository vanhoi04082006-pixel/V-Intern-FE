"use client";

/**
 * Session đăng nhập giữ trong bộ nhớ (in-memory).
 *
 * `"use client"` ở trên xác lập ranh giới client cho module stateful này:
 * token chỉ tồn tại trong browser bundle, không bao giờ rơi vào server
 * module scope. (Cố ý không dùng package `client-only`: nó chỉ là transitive
 * dep chưa khai báo trong package.json; thêm dep mới nằm ngoài scope task.)
 *
 * - Access token KHÔNG lưu localStorage/sessionStorage để giảm nguy cơ XSS
 *   đánh cắp token. Không có persistence "remember me" nào được phát minh:
 *   checkbox "Ghi nhớ đăng nhập" ở UI hiện không có hành vi tích hợp tương
 *   ứng vì contract BE không nhận field `remember`.
 * - Refresh token nằm trong HttpOnly cookie do BE quản lý
 *   (`vintern_refresh`, path `/api/v1/auth`) nên reload trang có thể khôi
 *   phục session bằng `refreshSession()` mà không cần lưu gì thêm ở FE.
 */

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  permissions: string[];
}

interface SessionState {
  accessToken: string;
  user: SessionUser;
}

let state: SessionState | null = null;

export function setSession(accessToken: string, user: SessionUser): void {
  state = { accessToken, user };
}

export function getAccessToken(): string | null {
  return state?.accessToken ?? null;
}

export function getSessionUser(): SessionUser | null {
  return state?.user ?? null;
}

export function clearSession(): void {
  state = null;
}
