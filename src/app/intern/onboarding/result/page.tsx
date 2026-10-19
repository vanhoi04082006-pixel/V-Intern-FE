import type { Metadata } from "next";

import { OnboardingShell } from "@/components/intern/onboarding/onboarding-shell";
import { RecruitmentResult } from "@/components/intern/onboarding/recruitment-result";

export const metadata: Metadata = {
  title: "Kết quả tuyển chọn | V-Intern",
  description:
    "Kết quả phỏng vấn cùng AI Recruiter: điểm kỹ thuật, tiếng Anh, kỹ năng mềm và khuyến nghị vị trí thực tập.",
};

/** Màn 4 — Kết quả tuyển chọn. Route: /intern/onboarding/result */
export default function ResultPage() {
  return (
    <OnboardingShell variant="sidebar" activeStep={4}>
      <RecruitmentResult />
    </OnboardingShell>
  );
}
