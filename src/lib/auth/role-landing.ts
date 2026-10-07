import type { SessionUser } from "@/lib/auth/session";
const WORKSPACE_BY_ROLE: Readonly<Record<string, string>> = {
  admin: "/admin",
  instructor: "/instructor",
  intern: "/intern",
};
export const DEFAULT_AFTER_LOGIN_PATH = "/";
/** Intern landing is the lifecycle resolver entry, never an assumed Active state. */
export function getWorkspacePathForRoles(roles: readonly string[]): string {
  for (const role of roles) {
    const path = WORKSPACE_BY_ROLE[role];
    if (path) return path;
  }
  return DEFAULT_AFTER_LOGIN_PATH;
}
export function getWorkspacePathForUser(user: SessionUser): string {
  return getWorkspacePathForRoles(user.roles);
}
export const PROTECTED_ROUTES: Readonly<Record<string, readonly string[]>> = {
  "/admin": ["admin"],
  "/instructor": ["instructor"],
  "/intern": ["intern"],
};
export function hasAllowedRole(
  user: SessionUser,
  roles: readonly string[],
): boolean {
  return user.roles.some((role) => roles.includes(role));
}
