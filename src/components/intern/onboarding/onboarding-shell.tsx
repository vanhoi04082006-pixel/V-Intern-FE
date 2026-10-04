import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

import { OnboardingTopbar } from "./onboarding-topbar";
import {
  MobileStepbar,
  VerticalStepper,
} from "./onboarding-stepper";

/**
 * Shell dùng chung cho toàn bộ Onboarding flow (4 route con):
 *
 * - variant "top" (Welcome/Role — reference màn 1-2): topbar + nội dung
 *   giữa, max-w 1104px, page scroll bình thường (kể cả desktop).
 * - variant "sidebar" (Interview/Result — reference màn 3-5): DASHBOARD
 *   desktop — root cao đúng `100dvh`, overflow hidden ở lg+ để toàn bộ
 *   nội dung chính nằm trong MỘT viewport (không body scroll). Bên trong:
 *   rail dọc trái (stepper + mascot compact, tự scroll nếu thiếu chỗ) +
 *   main (tự scroll chỉ khi cực kỳ cần — nội dung được thiết kế để fit
 *   1366×768). <lg trở lại document flow + MobileStepbar, scroll bình
 *   thường như tablet/mobile.
 *
 * KHÔNG set overflow hidden lên body/app toàn cục — chỉ scope shell này.
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
  const isSidebar = variant === "sidebar";

  return (
    <div
      className={cn(
        "flex min-h-dvh flex-col bg-[#F4F6FB]",
        isSidebar && "lg:h-dvh lg:min-h-0 lg:overflow-hidden"
      )}
    >
      <OnboardingTopbar />

      {isSidebar ? <MobileStepbar activeStep={activeStep} /> : null}

      {isSidebar ? (
        <div className="mx-auto flex w-full max-w-[1440px] flex-1 lg:min-h-0">
          {/* Rail stepper dọc — chỉ desktop, dashboard height */}
          <aside
            aria-label="Tiến trình onboarding"
            className="hidden w-[248px] shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-5 lg:flex lg:min-h-0 lg:overflow-y-auto"
          >
            <VerticalStepper activeStep={activeStep} />
            {/* Mascot compact — đáy rail (mt-auto), không chiếm chỗ lớn */}
            <figure className="mt-auto pt-5">
              <div className="relative mx-auto h-20 w-16">
                <Image
                  src="/images/robot-v2.png"
                  alt=""
                  fill
                  sizes="64px"
                  className="object-contain"
                />
              </div>
              <figcaption className="mt-1.5 text-center text-[11px] font-medium leading-snug text-slate-400">
                AI Recruiter luôn đồng hành cùng bạn
              </figcaption>
            </figure>
          </aside>

          <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:min-h-0 lg:overflow-y-auto lg:px-8">
            {children}
          </main>
        </div>
      ) : (
        <main className="mx-auto w-full max-w-[1104px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      )}
    </div>
  );
}
