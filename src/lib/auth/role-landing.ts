import type { SessionUser } from "@/lib/auth/session";

/**
 * Ánh xạ role (mã role do backend trả) → workspace của frontend.
 *
 * Mã role lấy đúng từ contract RBAC của BE: `admin`, `teacher`, `intern`
 * (BE trả về trong `user.roles` / `GET /api/v1/rbac/me`).
 *
 * `intern` → `/intern` (Intern Workspace, mock-only UI). Đây là nguồn
 * truth duy nhất cho role landing — không hardcode redirect ở component khác.
 */
const WORKSPACE_BY_ROLE: Record<string, string> = {
  admin: "/admin",
  teacher: "/instructor",
  intern: "/intern",
};

/** Workspace dùng chung khi không xác định được role nào khớp. */
export const DEFAULT_AFTER_LOGIN_PATH = "/";

/** Workspace tương ứng với role đầu tiên khớp trong danh sách role. */
export function getWorkspacePathForRoles(roles: readonly string[]): string {
  for (const role of roles) {
    const path = WORKSPACE_BY_ROLE[role];
    if (path) return path;
  }
  return DEFAULT_AFTER_LOGIN_PATH;
}

/** Workspace của user đang đăng nhập. */
export function getWorkspacePathForUser(user: SessionUser): string {
  return getWorkspacePathForRoles(user.roles);
}

/** Route được bảo vệ và role nào được vào. */
export const PROTECTED_ROUTES: Readonly<Record<string, readonly string[]>> = {
  "/admin": ["admin"],
  "/instructor": ["teacher"],
  "/intern": ["intern"],
};

/** `true` khi user có ít nhất một role trong `allowedRoles`. */
export function hasAllowedRole(
  user: SessionUser,
  allowedRoles: readonly string[]
): boolean {
  return user.roles.some((role) => allowedRoles.includes(role));
}
