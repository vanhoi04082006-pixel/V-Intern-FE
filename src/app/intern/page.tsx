import type { Metadata } from "next";

import { WorkspaceGuard } from "@/components/auth/workspace-guard";
import { InternWorkspace } from "@/components/intern/intern-workspace";
import {
  parseInternPreviewParam,
  type InternPreviewState,
} from "@/components/intern/intern-preview";
import { PROTECTED_ROUTES } from "@/lib/auth/role-landing";

export const metadata: Metadata = {
  title: "Intern Workspace | V-Intern",
  description:
    "Không gian làm việc và thực tập của bạn tại V-Intern: dự án, phiên thực tập, sprint & task board, AI Mentor, review PR và hiệu suất thực tập.",
};

export default async function InternPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  let previewState: InternPreviewState | null = null;
  if (process.env.NODE_ENV === "development") {
    previewState = parseInternPreviewParam(params._preview);
  }

  return (
    <WorkspaceGuard allowedRoles={PROTECTED_ROUTES["/intern"]}>
      <InternWorkspace previewState={previewState} />
    </WorkspaceGuard>
  );
}
