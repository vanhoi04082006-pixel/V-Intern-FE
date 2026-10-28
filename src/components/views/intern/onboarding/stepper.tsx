"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** 4 bước onboarding: Chào mừng → Chọn vai trò → Phỏng vấn AI → Kết quả. */
export const ONBOARDING_STEPS = [
  "Chào mừng",
  "Chọn vai trò",
  "Phỏng vấn AI",
  "Kết quả",
] as const;

/**
 * Stepper ngang dùng chung cho các view onboarding.
 * `current` = index bước đang active (0–3). current = 4 → mọi bước hoàn tất.
 */
export function OnboardingStepper({
  current,
  className,
}: {
  current: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(ONBOARDING_STEPS.length, current));
  return (
    <ol className={cn("card-surface flex items-start px-5 py-5 sm:px-7", className)}>
      {ONBOARDING_STEPS.map((label, i) => {
        const done = i < clamped;
        const active = i === clamped;
        const connectorDone = i <= clamped - 1;
        return (
          <li key={label} className={cn("flex min-w-0 items-start", i > 0 && "flex-1")}>
            {i > 0 ? (
              <div className="mt-4 h-0.5 min-w-4 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className={cn(
                    "h-full rounded-full bg-gradient-to-r from-brand to-brand-bright transition-[width] duration-700 ease-out",
                    connectorDone ? "w-full" : "w-0"
                  )}
                />
              </div>
            ) : null}
            <div className="flex w-20 shrink-0 flex-col items-center gap-2 sm:w-28">
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full border text-xs font-bold transition-colors",
                  done && "border-brand bg-brand text-on-brand",
                  active &&
                    "border-brand/60 bg-brand/15 text-brand-bright shadow-[0_0_0_4px_rgba(16,185,129,0.12)]",
                  !done && !active && "border-line bg-panel-2 text-faint"
                )}
                aria-current={active ? "step" : undefined}
              >
                {done ? <Check className="size-4 icon" /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-center text-[11px] leading-tight",
                  active ? "font-semibold text-ink" : done ? "font-medium text-dim" : "text-faint"
                )}
              >
                {label}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Index bước active suy ra từ recruitment status. */
export function stepIndexOf(status: string): number {
  switch (status) {
    case "not_started":
      return 1;
    case "role_selected":
      return 2;
    case "interview_in_progress":
      return 2;
    case "evaluation_pending":
      return 3;
    case "passed":
    case "failed":
      return 4;
    default:
      return 1;
  }
}
