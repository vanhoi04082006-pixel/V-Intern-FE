import type { ReactNode } from "react";

import { WorkspaceGuard } from "@/components/auth/workspace-guard";
import { PROTECTED_ROUTES } from "@/lib/auth/role-landing";

/**
 * Bảo vệ toàn bộ Onboarding flow (/intern/onboarding/*) theo role `intern`.
 *
 * TÁI SỬ DỤNG WorkspaceGuard thật của repo (không duplicate, không bypass):
 * - Chưa đăng nhập → /login.
 * - Sai role (admin/teacher) → về workspace đúng của user.
 * - Đủ role `intern` → render onboarding.
 *
 * VỀ ROUTING TƯƠNG LAI (khi BE có trạng thái tuyển dụng/phân công):
 *   intern + chưa hoàn thành recruitment → /intern/onboarding
 *   intern + đã tuyển + chưa phân công   → /intern (empty state)
 *   intern + đã tuyển + đã phân công     → /intern (active state)
 * Hiện BE chưa có field trạng thái này → KHÔNG tự chế trong auth/session,
 * landing sau login vẫn giữ nguyên (intern → /intern). Onboarding được vào
 * trực tiếp sau khi auth hợp lệ để dev/QA xem flow.
 */
export function InternOnboardingGuard({ children }: { children: ReactNode }) {
  return (
    <WorkspaceGuard allowedRoles={PROTECTED_ROUTES["/intern"]}>
      {children}
    </WorkspaceGuard>
  );
}
