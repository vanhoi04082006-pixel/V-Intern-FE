import {
  IconCheck,
} from "@/components/v-intern/icons";
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
        "grid size-8 shrink-0 place-items-center rounded-full border text-body font-bold transition-colors",
        state === "completed" &&
          "border-border bg-success-subtle text-success",
        state === "active" && "border-brand bg-primary text-primary-foreground shadow-app-xs",
        state === "pending" && "border-border bg-card text-muted-foreground",
      )}
    >
      {state === "completed" ? <IconCheck className="size-4" /> : position}
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
                "flex min-w-0 flex-1 items-center gap-3 rounded-panel border px-3 py-3",
                state === "active" && "border-brand/30 bg-accent",
                state === "completed" && "border-border bg-card",
                state === "pending" && "border-border bg-background",
              )}
            >
              <StepCircle state={state} position={position} />
              <span className="min-w-0">
                <span
                  className={cn(
                    "block truncate text-small font-bold",
                    state === "pending" ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {step.label}
                </span>
                <span
                  className={cn(
                    "hidden truncate text-caption sm:block",
                    state === "active" ? "text-primary" : "text-muted-foreground",
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
                    state === "completed" ? "bg-success" : "bg-muted",
                  )}
                />
              ) : null}
              <StepCircle state={state} position={position} />
              <span className="min-w-0 pt-1">
                <span
                  className={cn(
                    "block text-body font-bold leading-tight",
                    state === "pending" ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {step.label}
                </span>
                <span
                  className={cn(
                    "mt-1 block text-caption leading-tight",
                    state === "active" ? "text-primary" : "text-muted-foreground",
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
          ? "border-b border-border bg-card px-4 py-3 lg:hidden"
          : "rounded-panel border border-border bg-card px-4 py-3",
      )}
    >
      <p className="text-small font-bold text-foreground">
        Bước {activeStep}/4 ·{" "}
        <span className="font-semibold text-primary">
          {ONBOARDING_STEPS[activeStep - 1]?.label}
        </span>
      </p>
      <ol className="flex items-center gap-2" aria-hidden="true">
        {ONBOARDING_STEPS.map((step, index) => {
          const state = stateForPosition(index + 1, activeStep);
          return (
            <li
              key={step.id}
              className={cn(
                "size-2 rounded-full",
                state === "completed" && "bg-success",
                state === "active" && "bg-primary",
                state === "pending" && "bg-muted",
              )}
            />
          );
        })}
      </ol>
    </nav>
  );
}
