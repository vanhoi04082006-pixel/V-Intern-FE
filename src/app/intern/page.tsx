import { WorkspaceGuard } from "@/components/auth/workspace-guard";
import { InternWorkspace } from "@/components/intern/intern-workspace";
import { PROTECTED_ROUTES } from "@/lib/auth/role-landing";
/** No preview parameter can decide a production lifecycle. */
export default function InternPage() {
  return (
    <WorkspaceGuard allowedRoles={PROTECTED_ROUTES["/intern"]}>
      <InternWorkspace />
    </WorkspaceGuard>
  );
}
