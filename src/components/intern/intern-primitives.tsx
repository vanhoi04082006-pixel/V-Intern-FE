import type { IconComponent } from "@/components/v-intern/icons";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

import { INTERN_TONES, type InternTone } from "./intern-ui-tones";

/**
 * Primitives dùng chung cho Intern Workspace: card section, badge, progress
 * bar, avatar. Thuần presentational, giữ local cho intern để không phụ thuộc
 * chéo vào admin/instructor components (cùng pattern với instructor).
 */

const SECTION_CARD_SHADOW = "shadow-app-xs";

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
  headerClassName,
  bodyClassName,
  children,
}: {
  id: string;
  icon: IconComponent;
  tone?: InternTone;
  title: string;
  /** Phần phụ sau tiêu đề, ví dụ "(Sprint 03)" — vẫn thuộc accessible name */
  titleSuffix?: string;
  actions?: ReactNode;
  className?: string;
  /** Override padding header (dùng cho compact density của Waiting desktop) */
  headerClassName?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  const toneStyle = INTERN_TONES[tone];
  // Capitalize để TS không hiểu `icon` là intrinsic HTML element.
  const Icon = icon;

  return (
    <section
      aria-labelledby={id}
      className={cn(
        "workspace-section flex min-w-0 flex-col rounded-panel border border-border bg-card",
        SECTION_CARD_SHADOW,
        className,
      )}
    >
      <div
        className={cn(
          "workspace-section-header flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-border px-4 py-4 sm:px-5",
          headerClassName,
        )}
      >
        <h2
          id={id}
          className="flex min-w-0 items-center gap-3 text-subsection font-bold text-foreground"
        >
          <span
            aria-hidden="true"
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-control",
              toneStyle.tile,
            )}
          >
            <Icon className={cn("size-[18px]", toneStyle.icon)} />
          </span>
          <span className="truncate">{title}</span>
          {titleSuffix ? (
            <span className="truncate text-small font-normal text-muted-foreground">
              {titleSuffix}
            </span>
          ) : null}
        </h2>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
      <div className={cn("min-w-0 flex-1 p-4 sm:p-5", bodyClassName)}>
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
      className="inline-flex items-center gap-1 rounded-control text-small font-semibold text-primary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      {label}
      <ArrowRight className="size-4" aria-hidden="true" />
    </button>
  );
}

/**
 * Nút hành động chính. Round 3: cùng hệ nút với Instructor (px-4 py-2,
 * text 13px, rounded-control, shadow mảnh) để hai workspace cùng một visual
 * language — trước đây h-10 px-4 text-body khiến Waiting "như app khác".
 */
export function PrimaryAction({ children }: { children: ReactNode }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 whitespace-nowrap rounded-control bg-primary px-4 py-2 text-small font-semibold text-primary-foreground shadow-app-xs transition-colors hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1"
    >
      {children}
    </button>
  );
}

/** Nút hành động phụ viền — cùng geometry với PrimaryAction (Instructor). */
export function OutlineAction({ children }: { children: ReactNode }) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control border border-border bg-card px-4 py-2 text-small font-semibold text-foreground shadow-app-xs transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1"
    >
      {children}
    </button>
  );
}

/** Nút nhỏ trong card (ví dụ "Mở chi tiết" / "Hỏi Mentor"). Visual-only. */
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
        "inline-flex h-8 items-center justify-center whitespace-nowrap rounded-control px-3 text-small font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
        variant === "soft"
          ? "bg-accent text-primary hover:bg-accent"
          : "border border-border text-muted-foreground hover:bg-background",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Nút icon tròn nhỏ (menu "⋮" trên task card). Visual-only, luôn có label. */
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
        "grid size-8 shrink-0 place-items-center rounded-control text-muted-foreground transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
        className,
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
  tone: InternTone;
  withDot?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const toneStyle = INTERN_TONES[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1 text-caption font-semibold",
        toneStyle.soft,
        className,
      )}
    >
      {withDot ? (
        <span
          aria-hidden="true"
          className={cn("size-1.5 rounded-full", toneStyle.bar)}
        />
      ) : null}
      {children}
    </span>
  );
}

const PRIORITY_TONE: Record<"High" | "Medium" | "Low", InternTone> = {
  High: "red",
  Medium: "amber",
  Low: "green",
};

/** Badge priority của task — màu semantic + chữ (không chỉ dùng màu). */
export function PriorityBadge({
  priority,
}: {
  priority: "High" | "Medium" | "Low";
}) {
  return <StatusBadge tone={PRIORITY_TONE[priority]}>{priority}</StatusBadge>;
}

/** Progress bar trang trí — giá trị % đã hiển thị dạng text bên cạnh. */
export function ProgressBar({
  value,
  tone = "blue",
  className,
}: {
  value: number;
  tone?: InternTone;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      aria-hidden="true"
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-muted",
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full", INTERN_TONES[tone].bar)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

const AVATAR_TONE_CYCLE: InternTone[] = [
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
  tone?: InternTone;
  className?: string;
}) {
  const toneStyle = INTERN_TONES[tone];

  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full text-caption font-bold",
        toneStyle.tile,
        toneStyle.icon,
        className,
      )}
    >
      {initials}
    </span>
  );
}

/** Avatar nhỏ xoay vòng tone theo index — dùng trong task card/bảng. */
export function TaskAvatar({
  index,
  className = "size-7 text-caption",
}: {
  index: number;
  className?: string;
}) {
  return (
    <Avatar
      initials="NA"
      tone={AVATAR_TONE_CYCLE[index % AVATAR_TONE_CYCLE.length]}
      className={className}
    />
  );
}
