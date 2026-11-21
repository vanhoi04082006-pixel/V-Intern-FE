"use client";

import { cn } from "@/lib/utils";

/* =====================================================================
 * NOTEBOOK UI — nguyên thủy giao diện "Sổ tay hành trình":
 * Tape (băng dính washi), StampMoc (con dấu mộc), NoteCard (sticky
 * note), MarginNote (ghi chú lề), HandNote (chữ viết tay), Eyebrow.
 *
 * PORT NOTE (v3 port from sandbox): CSS classes that the real repo already
 * defines with a different look (tape, stamp-moc, animate-stamp-thump,
 * sticky-note, sketch-card, shadow-ink-*) are namespaced here with the
 * `nb-` prefix and defined exactly as the sandbox in src/styles/journey.css.
 * Un-conflicting names (sticky-pink, sticky-mint, eyebrow, ws-dot, tape-peel
 * vars) keep their original sandbox names.
 * ===================================================================== */

export function Tape({
  className,
  variant = "blue",
  rotate = -4,
  peel = false,
  style,
}: {
  className?: string;
  variant?: "blue" | "warm" | "candy" | "mint" | "slate";
  rotate?: number;
  peel?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("nb-tape", `nb-tape-${variant}`, peel && "nb-tape-peel", className)}
      style={{ ["--tape-rotate" as string]: `${rotate}deg`, transform: `rotate(${rotate}deg)`, ...style }}
    />
  );
}

export function StampMoc({
  children,
  tone = "red",
  rotate = -6,
  animate = true,
  className,
}: {
  children: React.ReactNode;
  tone?: "red" | "blue";
  rotate?: number;
  animate?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "nb-stamp-moc font-hand tracking-wide",
        tone === "blue" && "nb-stamp-blue",
        animate && "nb-animate-stamp-thump",
        className,
      )}
      style={{ ["--stamp-rotate" as string]: `${rotate}deg` }}
    >
      {children}
    </span>
  );
}

export function NoteCard({
  title,
  children,
  tone = "yellow",
  rotate = -1.5,
  tapeVariant,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  tone?: "yellow" | "pink" | "mint";
  rotate?: number;
  tapeVariant?: "blue" | "warm" | "candy" | "mint" | "slate";
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "nb-sticky-note relative px-4 py-3.5 pt-5 text-[0.85rem] leading-relaxed",
        tone === "pink" && "sticky-pink",
        tone === "mint" && "sticky-mint",
        className,
      )}
      style={{ ["--note-rotate" as string]: `${rotate}deg` }}
    >
      {tapeVariant && <Tape variant={tapeVariant} rotate={rotate * -3} className="-top-2.5 left-1/2 -translate-x-1/2 !w-16 !h-5" />}
      {title && <p className="mb-1.5 font-hand text-lg leading-tight">{title}</p>}
      <div className="[&_b]:font-semibold">{children}</div>
    </aside>
  );
}

export function MarginNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("font-hand text-[0.95rem] leading-snug text-[var(--pencil)]", className)}>
      {children} <span aria-hidden="true">✎</span>
    </p>
  );
}

export function HandNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("font-hand text-[1.05rem] leading-snug", className)}>{children}</span>;
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("eyebrow", className)}>{children}</p>;
}

/** Thẻ giấy sketch dùng chung — viền mực + bóng in lệch. */
export function SketchCard({
  children,
  className,
  hover = true,
  as: As = "div",
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  as?: "div" | "section" | "article" | "aside" | "li";
}) {
  return (
    <As className={cn("nb-sketch-card", hover && "nb-sketch-card-hover", className)}>{children}</As>
  );
}

/** Polaroid — khung ảnh nghiêng có băng dính, thẳng khi hover. */
export function PolaroidFrame({
  src,
  alt,
  caption,
  rotate = -2.5,
  tapeVariant = "warm",
  className,
  imgClassName,
}: {
  src: string;
  alt: string;
  caption?: string;
  rotate?: number;
  tapeVariant?: "blue" | "warm" | "candy" | "mint" | "slate";
  className?: string;
  imgClassName?: string;
}) {
  return (
    <figure
      className={cn("relative m-0 inline-block max-w-full bg-[var(--paper-raised)] p-2.5 pb-0 shadow-nb-ink-4 transition-transform duration-200", className)}
      style={{ transform: `rotate(${rotate}deg)`, borderRadius: "3px 4px 3px 4px" }}
    >
      <Tape variant={tapeVariant} rotate={rotate * -2.2} peel className="-top-3 left-1/2 -translate-x-1/2 !w-20" />
      <img
        src={src}
        alt={alt}
        className={cn("block h-auto w-full select-none rounded-[2px]", imgClassName)}
        draggable={false}
      />
      {caption && (
        <figcaption className="px-1 pb-1.5 pt-2 text-center font-hand text-[0.95rem] text-[var(--ink-soft)]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/** Badge trạng thái nét mực. */
const BADGE_TONES: Record<string, string> = {
  neutral: "border-[var(--ink)] text-[var(--ink)] bg-[var(--paper-raised)]",
  blue: "border-[var(--royal)] text-[var(--royal)] bg-[var(--blue-mist)]",
  green: "border-[var(--success)] text-[var(--success)] bg-[color-mix(in_srgb,var(--success)_12%,transparent)]",
  amber: "border-[var(--warning)] text-[var(--warning)] bg-[color-mix(in_srgb,var(--warning)_14%,transparent)]",
  red: "border-[var(--danger)] text-[var(--danger)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]",
  pink: "border-[#d6548a] text-[#d6548a] bg-[var(--note-pink)] dark:text-[#f9a8c9]",
  mint: "border-[var(--success)] text-[var(--note-mint-ink)] bg-[var(--note-mint)]",
};

export function InkBadge({
  children,
  tone = "neutral",
  className,
  dot = false,
}: {
  children: React.ReactNode;
  tone?: keyof typeof BADGE_TONES | string;
  className?: string;
  dot?: boolean;
}) {
  const toneClass = BADGE_TONES[tone] ?? BADGE_TONES.neutral;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-0.5 text-xs font-semibold leading-tight",
        toneClass,
        className,
      )}
    >
      {dot && <span className="ws-dot" style={{ background: "currentColor", borderColor: "transparent" }} />}
      {children}
    </span>
  );
}

/** Nhãn mức ưu tiên / trạng thái theo quy ước nghiệp vụ. */
export const TASK_STATUS_META: Record<string, { label: string; tone: string }> = {
  todo: { label: "Cần làm", tone: "neutral" },
  doing: { label: "Đang làm", tone: "blue" },
  review: { label: "Chờ duyệt", tone: "amber" },
  done: { label: "Hoàn thành", tone: "green" },
};

export const PRIORITY_META: Record<string, { label: string; tone: string }> = {
  low: { label: "Thấp", tone: "neutral" },
  medium: { label: "Trung bình", tone: "blue" },
  high: { label: "Cao", tone: "amber" },
  urgent: { label: "Khẩn cấp", tone: "red" },
};

export function formatDateVN(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateTimeVN(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function formatMoneyVND(amount: number) {
  return `${amount.toLocaleString("vi-VN")} đ ảo`;
}
