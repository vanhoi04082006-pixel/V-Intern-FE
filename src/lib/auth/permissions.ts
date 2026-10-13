import type { SessionUser } from "@/lib/auth/session";

function norm(code: string): string {
  return code.trim().toLowerCase();
}

/** True when the user holds the permission (case-insensitive, fail-closed on empty). */
export function hasPermission(user: SessionUser | null | undefined, permission: string): boolean {
  if (!user || !permission.trim()) return false;
  const want = norm(permission);
  return (user.permissions ?? []).some((p) => norm(p) === want);
}

/** True when the user holds at least one of the permissions. Empty list → false. */
export function hasAnyPermission(user: SessionUser | null | undefined, permissions: readonly string[]): boolean {
  return permissions.some((p) => hasPermission(user, p));
}

/** True when the user holds all of the permissions. Empty list → true (nothing required). */
export function hasAllPermissions(user: SessionUser | null | undefined, permissions: readonly string[]): boolean {
  return permissions.every((p) => hasPermission(user, p));
}

/** True when the user holds the role (case-insensitive). */
export function hasRole(user: SessionUser | null | undefined, role: string): boolean {
  if (!user || !role.trim()) return false;
  const want = norm(role);
  return (user.roles ?? []).some((r) => norm(r) === want);
}
