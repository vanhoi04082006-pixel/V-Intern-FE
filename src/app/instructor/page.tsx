import type { Metadata } from "next";

import { WorkspaceGuard } from "@/components/auth/workspace-guard";
import { InstructorWorkspace } from "@/components/instructor/instructor-workspace";
import { PROTECTED_ROUTES } from "@/lib/auth/role-landing";

export const metadata: Metadata = {
  title: "Instructor Workspace | V-Intern",
  description:
    "Không gian làm việc giảng viên trên V-Intern: phiên thực tập, sprint & burndown, hiệu suất sinh viên, review pull request và đánh giá AI.",
};

export default function InstructorPage() {
  return (
    <WorkspaceGuard allowedRoles={PROTECTED_ROUTES["/instructor"]}>
      <InstructorWorkspace />
    </WorkspaceGuard>
  );
}
