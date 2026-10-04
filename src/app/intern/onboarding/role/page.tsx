import type { Metadata } from "next";

import { OnboardingShell } from "@/components/intern/onboarding/onboarding-shell";
import { RoleSelectionStep } from "@/components/intern/onboarding/role-selection-step";

export const metadata: Metadata = {
  title: "Chọn vị trí ứng tuyển | V-Intern",
  description:
    "Chọn vị trí ứng tuyển: Frontend Developer, Backend Developer, QA / Tester hoặc Business Analyst.",
};

/** Màn 2 — Chọn vị trí ứng tuyển (Bước 2/4). Route: /intern/onboarding/role */
export default function InternOnboardingRolePage() {
  return (
    <OnboardingShell variant="top" activeStep={2}>
      <RoleSelectionStep />
    </OnboardingShell>
  );
}
