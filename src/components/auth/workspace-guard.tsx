"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { fetchCurrentUser } from "@/lib/auth/auth-service";
import { getSessionUser, subscribeSession } from "@/lib/auth/session";
import {
  getWorkspacePathForUser,
  hasAllowedRole,
} from "@/lib/auth/role-landing";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
export function WorkspaceGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: readonly string[];
  children: ReactNode;
}) {
  const router = useRouter();
  const [state, setState] = useState<
    | { kind: "checking" }
    | { kind: "allowed" }
    | { kind: "error"; error: unknown }
  >({ kind: "checking" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    void fetchCurrentUser()
      .then((user) => {
        if (cancelled) return;
        if (!user) {
          router.replace("/login");
          return;
        }
        if (!hasAllowedRole(user, allowedRoles)) {
          router.replace(getWorkspacePathForUser(user));
          return;
        }
        setState({ kind: "allowed" });
      })
      .catch((error) => {
        if (!cancelled) setState({ kind: "error", error });
      });
    return () => {
      cancelled = true;
    };
  }, [allowedRoles, router, attempt]);
  useEffect(() => {
    if (state.kind !== "allowed") return;
    return subscribeSession(() => {
      if (!getSessionUser()) {
        setState({ kind: "checking" });
        router.replace("/login");
      }
    });
  }, [state.kind, router]);
  if (state.kind === "error")
    return (
      <ErrorState
        error={state.error}
        onRetry={() => {
          setState({ kind: "checking" });
          setAttempt((x) => x + 1);
        }}
      />
    );
  if (state.kind === "checking")
    return <LoadingState label="Đang kiểm tra phiên đăng nhập..." />;
  return <>{children}</>;
}
