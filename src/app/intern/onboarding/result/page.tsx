import type { Metadata } from "next";

import {
  resolveRecruitmentResult,
} from "@/components/intern/onboarding/data/recruitment-mock-data";
import { OnboardingShell } from "@/components/intern/onboarding/onboarding-shell";
import {
  parseInternResultPreviewParam,
  type OnboardingResultPreview,
} from "@/components/intern/onboarding/onboarding-preview";
import { RecruitmentResult } from "@/components/intern/onboarding/recruitment-result";

export const metadata: Metadata = {
  title: "Kết quả tuyển dụng | V-Intern",
  description:
    "Kết quả phỏng vấn AI Recruiter: điểm Overall theo công thức 70% Technical + 30% Soft Skill và bước tiếp theo.",
};

/**
 * Màn 4 — Kết quả tuyển dụng (Bước 4/4). Route: /intern/onboarding/result
 *
 * Pass/fail là 2 DATA STATE của cùng một screen:
 * - Production: luôn render dataset mặc định của flow (mock pass).
 * - Dev-only: `?_preview=pass|fail` chọn dataset tương ứng để xem cả 2
 *   trạng thái (không bypass auth — guard vẫn chạy ở layout).
 */
export default async function InternOnboardingResultPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  let preview: OnboardingResultPreview | null = null;
  if (process.env.NODE_ENV === "development") {
    preview = parseInternResultPreviewParam(params._preview);
  }

  return (
    <OnboardingShell variant="sidebar" activeStep={4}>
      <RecruitmentResult result={resolveRecruitmentResult(preview)} />
    </OnboardingShell>
  );
}
