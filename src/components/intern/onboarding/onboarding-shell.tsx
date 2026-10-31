import type { ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

import { NoteCard } from "@/components/workspace/notebook";
import { OnboardingTopbar } from "./onboarding-topbar";
import { MobileStepbar, VerticalStepper } from "./onboarding-stepper";

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
 * Notebook v3: toàn shell là một trang sổ — nền chấm bi mờ (overlay
 * pointer-events-none, fade ở mép theo pattern hero), rail dọc có gáy
 * kẻ đỏ đôi (`ruling-red-top`) như gáy vở học sinh, chú mascot AI
 * Recruiter dán bằng mẩu băng dính (sticky note).
 *
 * KHÔNG set overflow hidden lên body/app toàn cục — chỉ scope shell này.
 * Thuần presentational, server-safe — auth do layout (InternOnboardingGuard)
 * lo, trạng thái luồng do RecruitmentProvider (layout) quản lý.
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
      data-workspace-role="intern"
      className={cn(
        "student-experience workspace-ui aurora-workspace workspace-onboarding relative flex min-h-dvh flex-col",
        isSidebar && "lg:h-dvh lg:min-h-0 lg:overflow-hidden",
      )}
    >
      {/* Nền giấy chấm bi — overlay mờ, fade mép để nội dung vẫn là chủ thể */}
      <div
        aria-hidden="true"
        className="bg-dots-paper mask-fade-edges pointer-events-none absolute inset-0"
      />

      <OnboardingTopbar />

      {isSidebar ? <MobileStepbar activeStep={activeStep} /> : null}

      {isSidebar ? (
        <div className="mx-auto flex w-full max-w-[1440px] flex-1 lg:min-h-0">
          {/* Rail stepper dọc — chỉ desktop, dashboard height.
              Gáy kẻ đỏ đôi trên đỉnh rail như trang vở Việt Nam. */}
          <aside
            aria-label="Tiến trình onboarding"
            className="ruling-red-top hidden w-[248px] shrink-0 flex-col border-r border-border bg-card px-4 py-5 lg:flex lg:min-h-0 lg:overflow-y-auto"
          >
            <VerticalStepper activeStep={activeStep} />
            {/* Chú mascot AI Recruiter — mẩu note vàng dán băng dính cuối rail */}
            <div className="mt-auto pt-6">
              <NoteCard tape rotate={-1.2}>
                <span className="flex items-start gap-2.5">
                  <Image
                    src="/images/landing/robot-mascot.png"
                    alt=""
                    width={44}
                    height={44}
                    aria-hidden="true"
                    className="size-11 shrink-0 object-contain"
                  />
                  <span className="text-small font-medium leading-relaxed">
                    AI Recruiter luôn đồng hành cùng bạn
                  </span>
                </span>
                <span className="font-hand mt-2 block text-[15px] leading-snug opacity-80">
                  trả lời tự nhiên là được, không cần hoàn hảo!
                </span>
              </NoteCard>
            </div>
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
