import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

import { INSTRUCTOR_TONES, type InstructorTone } from "./instructor-ui-tones";

/**
 * Primitives dùng chung cho Instructor Workspace: card section, badge,
 * progress bar, avatar. Thuần presentational, giữ local cho instructor
 * để không phụ thuộc chéo vào admin components.
 */

const SECTION_CARD_SHADOW = "shadow-[0_1px_2px_rgba(15,23,42,0.05)]";

/**
 * Card section chuẩn theo reference: header (icon mềm + h2 + actions)
 * + body padding. `id` phải unique trong trang vì dùng aria-labelledby.
 */
export function SectionCard({
  id,
  icon,
  tone = "blue",
  title,
  titleSuffix,
  actions,
  className,
  bodyClassName,
  children,
}: {
  id: string;
  icon: LucideIcon;
  tone?: InstructorTone;
  title: string;
  /** Phần phụ sau tiêu đề, ví dụ "(Tất cả phiên)" — vẫn thuộc accessible name */
  titleSuffix?: string;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  const toneStyle = INSTRUCTOR_TONES[tone];
  // Capitalize để TS không hiểu `icon` là intrinsic HTML element.
  const Icon = icon;

  return (
    <section
      aria-labelledby={id}
      className={cn(
        "flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white",
        SECTION_CARD_SHADOW,
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-slate-100 px-4 py-3.5 sm:px-5">
        <h2
          id={id}
          className="flex min-w-0 items-center gap-2.5 text-base font-bold text-navy"
        >
          <span
            aria-hidden="true"
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-lg",
              toneStyle.tile
            )}
          >
            <Icon className={cn("size-[18px]", toneStyle.icon)} />
          </span>
          <span className="truncate">{title}</span>
          {titleSuffix ? (
            <span className="truncate text-[13px] font-normal text-slate-400">
              {titleSuffix}
            </span>
          ) : null}
        </h2>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
      <div
        className={cn(
          "min-w-0 flex-1 p-4 sm:p-5",
          SECTION_CARD_SHADOW,
          bodyClassName
        )}
      >
        {children}
      </div>
    </section>
  );
}

/** Link-style action ở header card, ví dụ "Xem tất cả →". Visual-only. */
export function CardLinkAction({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 rounded-md text-[13px] font-semibold text-brand transition-colors hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      {label}
      <ArrowRight className="size-4" aria-hidden="true" />
    </button>
  );
}

/** Nút hành động chính (ví dụ "Tạo phiên mới"). Visual-only. */
export function PrimaryAction({ children }: { children: ReactNode }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1"
    >
      {children}
    </button>
  );
}

/** Nút pill nhỏ trong bảng: "Duyệt" (soft) / "Xem" (outline). Visual-only. */
export function PillButton({
  variant = "outline",
  className,
  children,
  ariaLabel,
}: {
  variant?: "soft" | "outline";
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex h-8 items-center justify-center whitespace-nowrap rounded-lg px-3 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
        variant === "soft"
          ? "bg-blue-50 text-brand hover:bg-blue-100"
          : "border border-slate-200 text-slate-600 hover:bg-slate-50",
        className
      )}
    >
      {children}
    </button>
  );
}

/** Nút icon tròn nhỏ (menu "..."). Visual-only, luôn có aria-label. */
export function GhostIconButton({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
        className
      )}
    >
      {children}
    </button>
  );
}

/** Badge trạng thái mềm, tuỳ chọn chấm màu phía trước. */
export function StatusBadge({
  tone,
  withDot = false,
  className,
  children,
}: {
  tone: InstructorTone;
  withDot?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const toneStyle = INSTRUCTOR_TONES[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
        toneStyle.soft,
        className
      )}
    >
      {withDot ? (
        <span aria-hidden="true" className={cn("size-1.5 rounded-full", toneStyle.bar)} />
      ) : null}
      {children}
    </span>
  );
}

/** Progress bar trang trí — giá trị % đã hiển thị dạng text bên cạnh. */
export function ProgressBar({
  value,
  tone = "blue",
  className,
}: {
  value: number;
  tone?: InstructorTone;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      aria-hidden="true"
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-slate-100", className)}
    >
      <div
        className={cn("h-full rounded-full", INSTRUCTOR_TONES[tone].bar)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

const AVATAR_TONE_CYCLE: InstructorTone[] = [
  "blue",
  "violet",
  "green",
  "amber",
  "fuchsia",
  "sky",
];

/** Avatar initials placeholder (không dùng ảnh ngoài theo yêu cầu). */
export function Avatar({
  initials,
  tone = "blue",
  className,
}: {
  initials: string;
  tone?: InstructorTone;
  className?: string;
}) {
  const toneStyle = INSTRUCTOR_TONES[tone];

  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold",
        toneStyle.tile,
        toneStyle.icon,
        className
      )}
    >
      {initials}
    </span>
  );
}

/** Stack avatar đè lên nhau + chip "+N" — dùng trong bảng phiên. */
export function AvatarStack({
  initials,
  extra,
  tone,
  avatarClassName = "size-7 text-[10px]",
}: {
  initials: string[];
  extra?: number;
  /** Tone cho cả stack; bỏ trống thì xoay vòng theo index */
  tone?: InstructorTone;
  /** Ghi đè kích thước avatar cho bảng compact */
  avatarClassName?: string;
}) {
  return (
    <div className="flex items-center -space-x-2">
      {initials.map((value, index) => (
        <Avatar
          key={`${value}-${index}`}
          initials={value}
          tone={tone ?? AVATAR_TONE_CYCLE[index % AVATAR_TONE_CYCLE.length]}
          className={cn("ring-2 ring-white", avatarClassName)}
        />
      ))}
      {typeof extra === "number" && extra > 0 ? (
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 ring-2 ring-white">
          +{extra}
        </span>
      ) : null}
    </div>
  );
}
