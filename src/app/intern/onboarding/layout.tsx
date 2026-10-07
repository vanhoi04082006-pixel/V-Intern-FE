import type { ReactNode } from "react";

import { InternOnboardingGuard } from "@/components/intern/onboarding/onboarding-guard";
import { RecruitmentProvider } from "@/components/intern/onboarding/recruitment-provider";

/**
 * Layout chung của Intern Onboarding flow (/intern/onboarding/*):
 * 1. `InternOnboardingGuard` — tái sử dụng WorkspaceGuard thật, chặn role
 *    `intern` cho MỌI route con (welcome/role/interview/result).
 * 2. `RecruitmentProvider` — tải recruitment/workspace từ Nest dùng chung
 *    giữa các route con; reload khôi phục bằng dữ liệu backend.
 *
 * Không đụng layout/auth của /intern hiện có — onboarding tách riêng.
 */
export default function InternOnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <InternOnboardingGuard>
      <RecruitmentProvider>{children}</RecruitmentProvider>
    </InternOnboardingGuard>
  );
}
