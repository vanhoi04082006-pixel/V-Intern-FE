import {
  IconCheck,
} from "@/components/v-intern/icons";
import { CircleDoodle, Tape } from "@/components/v-intern/doodles";
import { cn } from "@/lib/utils";

import { ONBOARDING_STEPS } from "./recruitment-presentation";

/**
 * Stepper dùng chung cho Onboarding (4 bước) — phong cách "hành trình trong
 * sổ tay" (Journey Notebook v3):
 * - `HorizontalStepper`: thanh ngang trên Welcome/Role (reference màn 1-2) —
 *   mobile co lại thành hàng compact có scroll ngang khi cần. Bước đang làm
 *   được dán mẩu băng dính + nhãn quét marker như dòng được tô sáng.
 * - `VerticalStepper`: rail dọc bên trái Interview/Result (reference màn 3-5),
 *   đường gáy đứt nét nối các bước như vệt hành trình, bước hiện tại khoanh
 *   tròn vẽ tay (CircleDoodle) + marker, kèm mascot khuyến nghị ở shell.
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
          "border-success bg-success-subtle text-success",
        state === "active" && "border-brand bg-primary text-primary-foreground shadow-app-xs",
        // Bước chưa tới: nét chì đứt như vòng tròn phác sẵn trong sổ
        state === "pending" && "border-dashed border-muted-foreground/50 bg-card text-muted-foreground",
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
                "relative flex min-w-0 flex-1 items-center gap-3 rounded-panel border px-3 py-3",
                state === "active" && "border-brand/30 bg-accent",
                state === "completed" && "border-border bg-card",
                state === "pending" && "border-border bg-background",
              )}
            >
              {/* Bước đang làm: dán mẩu băng dính lên đỉnh thẻ như trang đang mở */}
              {state === "active" ? (
                <Tape
                  className="-top-3 left-1/2 -translate-x-1/2"
                  rotate={-2}
                  variant="mint"
                />
              ) : null}
              <StepCircle state={state} position={position} />
              <span className="min-w-0">
                <span
                  className={cn(
                    "block truncate text-small font-bold",
                    state === "active" ? "marker" : undefined,
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
              {/* Gáy hành trình: đường đứt nét nối các bước như vệt bút chì */}
              {!isLast ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-[19px] top-11 h-[calc(100%-2.75rem)] border-l-2 border-dashed",
                    state === "completed"
                      ? "border-success/60"
                      : "border-muted-foreground/30",
                  )}
                />
              ) : null}
              <span className="relative grid size-10 shrink-0 place-items-center">
                {/* Bước hiện tại khoanh tròn vẽ tay — nét mực xanh nổi trên trang */}
                {state === "active" ? (
                  <CircleDoodle className="absolute -inset-1 h-full w-full text-primary" />
                ) : null}
                <StepCircle state={state} position={position} />
              </span>
              <span className="min-w-0 pt-1.5">
                <span
                  className={cn(
                    "block text-body font-bold leading-tight",
                    state === "active" ? "marker" : undefined,
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
 * "Bước 3/4 · Phỏng vấn AI Recruiter" + dot mini theo 4 bước — dot chưa tới
 * là vòng chì đứt nét, khớp ngôn ngữ stepper dọc bên desktop.
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
          ? "ruling-red-top border-b border-border bg-card px-4 py-3 lg:hidden"
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
                "grid place-items-center rounded-full",
                state === "completed" && "size-2 bg-success",
                state === "active" && "size-2.5 bg-primary",
                state === "pending" &&
                  "size-2 border border-dashed border-muted-foreground/60",
              )}
            />
          );
        })}
      </ol>
    </nav>
  );
}
