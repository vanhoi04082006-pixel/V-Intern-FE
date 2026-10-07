import type { ReactNode } from "react";
import { WorkspaceGuard } from "@/components/auth/workspace-guard";
import { PROTECTED_ROUTES } from "@/lib/auth/role-landing";
/** Every onboarding route requires a backend principal, including development. */
export function InternOnboardingGuard({ children }: { children: ReactNode }) {
  return (
    <WorkspaceGuard allowedRoles={PROTECTED_ROUTES["/intern"]}>
      {children}
    </WorkspaceGuard>
  );
}
