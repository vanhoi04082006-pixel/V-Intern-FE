import type { Metadata } from "next";

import { OnboardingShell } from "@/components/intern/onboarding/onboarding-shell";
import { WelcomeStep } from "@/components/intern/onboarding/welcome-step";

export const metadata: Metadata = {
  title: "Onboarding | V-Intern",
  description:
    "Chào mừng bạn đến với quy trình tuyển dụng V-Intern: chọn vị trí ứng tuyển, phỏng vấn cùng AI Recruiter và nhận kết quả.",
};

/** Màn 1 — Welcome (Bước 1/4). Route: /intern/onboarding */
export default function InternOnboardingWelcomePage() {
  return (
    <OnboardingShell variant="top" activeStep={1}>
      <WelcomeStep />
    </OnboardingShell>
  );
}
