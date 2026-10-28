import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

import { ONBOARDING_STEPS } from "./recruitment-presentation";

/**
 * Stepper dùng chung cho Onboarding (4 bước):
 * - `HorizontalStepper`: thanh ngang trên Welcome/Role (reference màn 1-2) —
 *   mobile co lại thành hàng compact có scroll ngang khi cần.
 * - `VerticalStepper`: rail dọc bên trái Interview/Result (reference màn 3-5),
 *   kèm mascot khuyến nghị.
 *
 * State mỗi bước: "completed" (check), "active" (đang ở đây, aria-current),
 * "pending" (chưa tới). Trạng thái KHÔNG chỉ dùng màu — completed có icon
 * check, active có nền đậm + aria-current="step".
 */

export type OnboardingStepState = "completed" | "active" | "pending";

function stateForPosition(
  position: number,
  activeStep: number,
): OnboardingStepState {
  if (position < activeStep) return "completed";
  if (position === activeStep) return "active";
  return "pending";
}

function StepCircle({
  state,
  position,
}: {
  state: OnboardingStepState;
  position: number;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-full border text-sm font-bold transition-colors",
        state === "completed" &&
          "border-emerald-200 bg-emerald-50 text-emerald-600",
        state === "active" && "border-brand bg-brand text-white shadow-sm",
        state === "pending" && "border-slate-200 bg-white text-slate-500",
      )}
    >
      {state === "completed" ? <Check className="size-4" /> : position}
    </span>
  );
}

export function HorizontalStepper({ activeStep }: { activeStep: number }) {
  return (
    <nav
      aria-label="Tiến trình onboarding"
      className="workspace-onboarding-progress"
    >
      <ol className="flex items-stretch gap-x-2 gap-y-3 overflow-x-auto pb-1 sm:gap-x-3">
        {ONBOARDING_STEPS.map((step, index) => {
          const position = index + 1;
          const state = stateForPosition(position, activeStep);
          return (
            <li
              key={step.id}
              aria-current={state === "active" ? "step" : undefined}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border px-3 py-2.5",
                state === "active" && "border-brand/30 bg-blue-50/60",
                state === "completed" && "border-slate-200 bg-white",
                state === "pending" && "border-slate-100 bg-slate-50/60",
              )}
            >
              <StepCircle state={state} position={position} />
              <span className="min-w-0">
                <span
                  className={cn(
                    "block truncate text-[13px] font-bold",
                    state === "pending" ? "text-slate-500" : "text-navy",
                  )}
                >
                  {step.label}
                </span>
                <span
                  className={cn(
                    "hidden truncate text-xs sm:block",
                    state === "active" ? "text-brand" : "text-slate-500",
                  )}
                >
                  {step.description}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function VerticalStepper({ activeStep }: { activeStep: number }) {
  return (
    <nav aria-label="Tiến trình onboarding">
      <ol className="relative flex flex-col gap-1">
        {ONBOARDING_STEPS.map((step, index) => {
          const position = index + 1;
          const state = stateForPosition(position, activeStep);
          const isLast = position === ONBOARDING_STEPS.length;
          return (
            <li
              key={step.id}
              aria-current={state === "active" ? "step" : undefined}
              className="relative flex gap-3 pb-5 last:pb-0"
            >
              {/* Đường nối giữa các bước */}
              {!isLast ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-4 top-9 h-[calc(100%-1.75rem)] w-px",
                    state === "completed" ? "bg-emerald-300" : "bg-slate-200",
                  )}
                />
              ) : null}
              <StepCircle state={state} position={position} />
              <span className="min-w-0 pt-1">
                <span
                  className={cn(
                    "block text-sm font-bold leading-tight",
                    state === "pending" ? "text-slate-500" : "text-navy",
                  )}
                >
                  {step.label}
                </span>
                <span
                  className={cn(
                    "mt-0.5 block text-xs leading-tight",
                    state === "active" ? "text-brand" : "text-slate-500",
                  )}
                >
                  {step.description}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Stepper compact cho mobile/tablet ở màn sidebar-variant (interview/result):
 * "Bước 3/4 · Phỏng vấn AI Recruiter" + dot mini theo 4 bước.
 */
export function MobileStepbar({
  activeStep,
  variant = "bar",
}: {
  activeStep: number;
  variant?: "bar" | "card";
}) {
  return (
    <nav
      aria-label="Tiến trình onboarding"
      className={cn(
        "flex items-center justify-between gap-3",
        variant === "bar"
          ? "border-b border-slate-200 bg-white px-4 py-2.5 lg:hidden"
          : "rounded-xl border border-slate-200 bg-white px-4 py-3",
      )}
    >
      <p className="text-[13px] font-bold text-navy">
        Bước {activeStep}/4 ·{" "}
        <span className="font-semibold text-brand">
          {ONBOARDING_STEPS[activeStep - 1]?.label}
        </span>
      </p>
      <ol className="flex items-center gap-1.5" aria-hidden="true">
        {ONBOARDING_STEPS.map((step, index) => {
          const state = stateForPosition(index + 1, activeStep);
          return (
            <li
              key={step.id}
              className={cn(
                "size-2 rounded-full",
                state === "completed" && "bg-emerald-400",
                state === "active" && "bg-brand",
                state === "pending" && "bg-slate-200",
              )}
            />
          );
        })}
      </ol>
    </nav>
  );
}
