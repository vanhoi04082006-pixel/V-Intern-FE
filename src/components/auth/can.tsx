"use client";
import { useSyncExternalStore } from "react";
import { getSessionUser, subscribeSession } from "@/lib/auth/session";
import { hasAllPermissions } from "@/lib/auth/permissions";

/**
 * Permission-aware render gate (P0 FE-020). Hides content the caller may not
 * use; the Backend still enforces every mutation. Renders `fallback` (default
 * null) when the session user lacks any required permission.
 */
export function Can({
  perm,
  fallback = null,
  children,
}: {
  perm: string | readonly string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const user = useSyncExternalStore(
    subscribeSession,
    getSessionUser,
    getSessionUser,
  );
  const required = Array.isArray(perm) ? perm : [perm];
  if (!hasAllPermissions(user, required)) return <>{fallback}</>;
  return <>{children}</>;
}
