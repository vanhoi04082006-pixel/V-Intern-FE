import Image from "next/image";
import type { ReactNode } from "react";

import { OnboardingTopbar } from "./onboarding-topbar";
import {
  MobileStepbar,
  VerticalStepper,
} from "./onboarding-stepper";

/**
 * Shell dùng chung cho toàn bộ Onboarding flow (4 route con):
 *
 * - variant "top" (Welcome/Role — reference màn 1-2): topbar + nội dung
 *   giữa, max-w 1104px.
 * - variant "sidebar" (Interview/Result — reference màn 3-5): topbar +
 *   rail dọc bên trái (≥lg) chứa VerticalStepper + mascot khuyến nghị;
 *   <lg stepper co thành MobileStepbar, nội dung 1 cột.
 *
 * Thuần presentational, server-safe — auth do layout (InternOnboardingGuard)
 * lo, mock state do RecruitmentProvider (layout) lo. Shell KHÔNG giữ state.
 */
export function OnboardingShell({
  variant,
  activeStep,
  children,
}: {
  variant: "top" | "sidebar";
  activeStep: number;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#F4F6FB]">
      <OnboardingTopbar />

      {variant === "sidebar" ? <MobileStepbar activeStep={activeStep} /> : null}

      {variant === "top" ? (
        <main className="mx-auto w-full max-w-[1104px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      ) : (
        <div className="mx-auto flex w-full max-w-[1440px] flex-1">
          {/* Rail stepper dọc — chỉ desktop */}
          <aside
            aria-label="Tiến trình onboarding"
            className="hidden w-[264px] shrink-0 border-r border-slate-200 bg-white px-5 py-6 lg:block"
          >
            <VerticalStepper activeStep={activeStep} />
            <figure className="mt-6 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
              <div className="relative mx-auto h-28 w-24">
                <Image
                  src="/images/robot-v2.png"
                  alt=""
                  fill
                  sizes="96px"
                  className="object-contain"
                />
              </div>
              <figcaption className="mt-2 text-center text-xs font-semibold text-slate-500">
                AI Recruiter luôn đồng hành cùng bạn ở bước này.
              </figcaption>
            </figure>
          </aside>

          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            {children}
          </main>
        </div>
      )}
    </div>
  );
}
