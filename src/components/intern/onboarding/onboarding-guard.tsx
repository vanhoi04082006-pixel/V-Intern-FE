import type { ReactNode } from "react";

import { WorkspaceGuard } from "@/components/auth/workspace-guard";
import { PROTECTED_ROUTES } from "@/lib/auth/role-landing";

/**
 * Bảo vệ toàn bộ Onboarding flow (/intern/onboarding/*) theo role `intern`.
 *
 * PRODUCTION (build thường): TÁI SỬ DỤNG WorkspaceGuard thật của repo
 * (không duplicate, không bypass):
 * - Chưa đăng nhập → /login.
 * - Sai role (admin/teacher) → về workspace đúng của user.
 * - Đủ role `intern` → render onboarding.
 *
 * DEVELOPMENT (chỉ `next dev`): cho phép mở trực tiếp toàn bộ onboarding
 * để review UI KHÔNG cần Backend/auth session — workspaceguard cần
 * `/auth/refresh` nên cản trở local review khi BE không chạy. Bypass:
 * - CHỈ khi `process.env.NODE_ENV === "development"` (Next.js inline hằng
 *   này lúc build — production build không bao giờ chạy nhánh bypass).
 * - KHÔNG dùng localStorage/sessionStorage/cookie giả, không fake token,
 *   không mock login state — chỉ đơn giản là không mount guard.
 * - Scope CHỈ /intern/onboarding/*: /intern, /admin, /instructor và mọi
 *   route khác vẫn dùng WorkspaceGuard như cũ (guard chung không đổi).
 * - `?_preview=pass|fail` KHÔNG liên quan bypass này — param đó chỉ chọn
 *   MOCK RESULT DATA, không phải công tắc auth.
 *
 * VỀ ROUTING TƯƠNG LAI (khi BE có trạng thái tuyển dụng/phân công):
 *   intern + chưa hoàn thành recruitment → /intern/onboarding
 *   intern + đã tuyển + chưa phân công   → /intern (empty state)
 *   intern + đã tuyển + đã phân công     → /intern (active state)
 * Hiện BE chưa có field trạng thái này → KHÔNG tự chế trong auth/session,
 * landing sau login vẫn giữ nguyên (intern → /intern).
 */

/**
 * Đọc NODE_ENV TẠI RENDER TIME (không phải hằng module-level) để test có
 * thể stub `vi.stubEnv("NODE_ENV", ...)` cho cả 2 nhánh dev/production.
 */
export function isOnboardingDevPreviewEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}

export function InternOnboardingGuard({ children }: { children: ReactNode }) {
  if (isOnboardingDevPreviewEnabled()) {
    return <>{children}</>;
  }

  return (
    <WorkspaceGuard allowedRoles={PROTECTED_ROUTES["/intern"]}>
      {children}
    </WorkspaceGuard>
  );
}
