"use client";

import { WorkspaceGuard } from "@/components/auth/workspace-guard";
import { InternWorkspace } from "@/components/intern/intern-workspace";
import { useInternWorkspaceContext } from "@/components/intern/intern-workspace-context";
import { PROTECTED_ROUTES } from "@/lib/auth/role-landing";

/** No preview parameter can decide a production lifecycle. */
export default function InternPage() {
  const embedded = useInternWorkspaceContext();
  if (embedded) return <InternWorkspace />;
  return (
    <WorkspaceGuard allowedRoles={PROTECTED_ROUTES["/intern"]}>
      <InternWorkspace />
    </WorkspaceGuard>
  );
}
