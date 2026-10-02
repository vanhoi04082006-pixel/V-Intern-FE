import type { Metadata } from "next";

import { WorkspaceGuard } from "@/components/auth/workspace-guard";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { PROTECTED_ROUTES } from "@/lib/auth/role-landing";

export const metadata: Metadata = {
  title: "Admin Workspace | V-Intern",
  description:
    "Không gian quản trị hệ thống V-Intern: người dùng, vai trò & phân quyền, trạng thái dịch vụ, nhật ký hoạt động.",
};

export default function AdminPage() {
  return (
    <WorkspaceGuard allowedRoles={PROTECTED_ROUTES["/admin"]}>
      <AdminWorkspace />
    </WorkspaceGuard>
  );
}
