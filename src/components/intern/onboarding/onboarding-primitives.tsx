import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

import type { InternTone } from "../intern-ui-tones";
import { INTERN_TONES } from "../intern-ui-tones";

/**
 * Primitives dùng chung cho Intern Onboarding — thuần presentational,
 * cùng phong cách với intern-primitives (SectionCard/badge/progress) nhưng
 * phục vụ layout onboarding: pill tag, badge "Bước x / 4", note card và
 * progress bar có text equivalent.
 */

/** Pill nhãn kỹ năng/vai trò (VD: "React", "Testing"). */
export function TagPill({
  tone = "blue",
  className,
  children,
}: {
  tone?: InternTone;
  className?: string;
  children: ReactNode;
}) {
  const toneStyle = INTERN_TONES[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
        toneStyle.soft,
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * Badge "— Bước x / 4" hiển thị phía trên tiêu đề từng màn.
 * `x` từ 1..4 (ONBOARDING_STEP_COUNT).
 */
export function StepBadge({ step }: { step: number }) {
  return (
    <p className="flex items-center gap-2 text-sm font-semibold text-brand">
      <span aria-hidden="true" className="h-px w-8 bg-brand/50" />
      Bước {step} / 4
    </p>
  );
}

/** Card ghi chú nền mềm (thông tin/lưu ý) — dùng cho note dưới cùng màn. */
export function NoteCard({
  tone = "amber",
  className,
  children,
}: {
  tone?: InternTone;
  className?: string;
  children: ReactNode;
}) {
  const toneStyle = INTERN_TONES[tone];

  return (
    <p
      className={cn(
        "rounded-lg px-3.5 py-2.5 text-[13px] font-medium leading-relaxed",
        toneStyle.soft,
        className
      )}
    >
      {children}
    </p>
  );
}

/**
 * Progress bar có text equivalent: phần trăm đã hiển thị dạng text ở nơi
 * dùng (không chỉ truyền đạt qua màu/độ dài thanh). role=progressbar để
 * screen reader đọc được giá trị.
 */
export function OnboardingProgress({
  value,
  label,
  className,
}: {
  /** 0-100. */
  value: number;
  /** Nhãn accessible, VD "Tiến độ phỏng vấn: 3/8 câu hỏi". */
  label: string;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-100", className)}
    >
      <div
        className="h-full rounded-full bg-brand transition-[width]"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/** Khối icon tròn mềm — dùng trong card giải thích (welcome/role). */
export function IconTile({
  icon: Icon,
  tone = "blue",
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone?: InternTone;
  className?: string;
}) {
  const toneStyle = INTERN_TONES[tone];

  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-xl",
        toneStyle.tile,
        className
      )}
    >
      <Icon className={cn("size-5", toneStyle.icon)} />
    </span>
  );
}
