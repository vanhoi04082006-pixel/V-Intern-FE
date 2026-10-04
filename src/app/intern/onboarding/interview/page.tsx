import type { Metadata } from "next";

import { InterviewStep } from "@/components/intern/onboarding/interview-step";
import { OnboardingShell } from "@/components/intern/onboarding/onboarding-shell";

export const metadata: Metadata = {
  title: "Phỏng vấn AI Recruiter | V-Intern",
  description:
    "Trả lời 8 câu hỏi phỏng vấn cùng AI Recruiter — kết hợp Technical và Soft Skill.",
};

/** Màn 3 — Phỏng vấn AI Recruiter (Bước 3/4). Route: /intern/onboarding/interview */
export default function InternOnboardingInterviewPage() {
  return (
    <OnboardingShell variant="sidebar" activeStep={3}>
      <InterviewStep />
    </OnboardingShell>
  );
}
