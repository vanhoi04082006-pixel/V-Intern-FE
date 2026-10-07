import { WorkspaceGuard } from "@/components/auth/workspace-guard";
import { RoleWorkspaceEntry } from "@/components/auth/role-workspace-entry";
import { PROTECTED_ROUTES } from "@/lib/auth/role-landing";
export default function Page() {
  return (
    <WorkspaceGuard allowedRoles={PROTECTED_ROUTES["/admin"]}>
      <RoleWorkspaceEntry role="admin" />
    </WorkspaceGuard>
  );
}
