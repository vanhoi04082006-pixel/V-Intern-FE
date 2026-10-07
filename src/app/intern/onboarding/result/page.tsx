import { OnboardingShell } from "@/components/intern/onboarding/onboarding-shell";
import { RecruitmentResult } from "@/components/intern/onboarding/recruitment-result";
export default function ResultPage() {
  return (
    <OnboardingShell variant="sidebar" activeStep={4}>
      <RecruitmentResult />
    </OnboardingShell>
  );
}
