import type { Metadata } from "next";

import { AdminWorkspace } from "@/components/admin/admin-workspace";

export const metadata: Metadata = {
  title: "Admin Workspace | V-Intern",
  description:
    "Không gian quản trị hệ thống V-Intern: người dùng, vai trò & phân quyền, trạng thái dịch vụ, nhật ký hoạt động.",
};

export default function AdminPage() {
  return <AdminWorkspace />;
}
