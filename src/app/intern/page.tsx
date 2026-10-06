import type { Metadata } from "next";

import { WorkspaceGuard } from "@/components/auth/workspace-guard";
import { InternWorkspace } from "@/components/intern/intern-workspace";
import { parseInternPreviewParam } from "@/components/intern/intern-preview";
import { PROTECTED_ROUTES } from "@/lib/auth/role-landing";

export const metadata: Metadata = {
  title: "Intern Workspace | V-Intern",
  description:
    "Không gian làm việc và thực tập của bạn tại V-Intern: dự án, phiên thực tập, sprint & task board, AI Mentor, review PR và hiệu suất thực tập.",
};

/**
 * DEVELOPMENT UI PREVIEW (`/intern?_preview=empty|active`):
 *
 * Khi giá trị `_preview` hợp lệ, render Intern Workspace TRỰC TIẾP không
 * mount `WorkspaceGuard` — guard cần `/auth/refresh` nên cản trở local UI
 * review khi Backend/auth session không chạy. Bypass yêu cầu CẢ HAI điều
 * kiện, enforce tại MỘT nơi duy nhất là `parseInternPreviewParam`:
 * - `process.env.NODE_ENV === "development"` (Next.js inline hằng này lúc
 *   build → production build luôn nhận `null`, KHÔNG bao giờ vào nhánh
 *   preview — preview không phải auth bypass production);
 * - giá trị param chính xác `empty` hoặc `active` (param lạ/true/array →
 *   `null` → rơi về nhánh guard như thường).
 *
 * Không fake token/cookie/localStorage, không mock auth service — chỉ đơn
 * giản là không mount guard cho nhánh preview dev. Scope CHỈ nhánh này:
 * `/intern` không có preview (dev lẫn production) vẫn qua `WorkspaceGuard`
 * như cũ; guard chung, role landing, /admin, /instructor, onboarding —
 * không đổi.
 */
export default async function InternPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  // `null` khi production, không có param, hoặc giá trị không hợp lệ.
  const previewState = parseInternPreviewParam(params._preview);

  if (previewState) {
    return <InternWorkspace previewState={previewState} />;
  }

  return (
    <WorkspaceGuard allowedRoles={PROTECTED_ROUTES["/intern"]}>
      <InternWorkspace previewState={previewState} />
    </WorkspaceGuard>
  );
}
