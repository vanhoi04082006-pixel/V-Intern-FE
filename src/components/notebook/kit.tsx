"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Tape, StampMoc, InkBadge, MarginNote } from "@/components/notebook/ui";
import { SquiggleUnderline, StarDoodle } from "@/components/notebook/doodles";
import type { VIconComponent } from "@/components/icons/v-icons";

/* =====================================================================
 * NOTEBOOK PAGE KIT — nguyên liệu chuyển thể sâu từng trang (v3).
 *
 * Mọi class `nb3-*` được định nghĩa tự chứa trong src/styles/journey.css
 * (đã kiểm: không stylesheet nào của repo dùng tiền tố này), dùng tokens
 * toàn cục (--ink/--paper/--royal/--hard-shadow…) nên shell
 * `.aurora-workspace` không thể đổi lớp nhìn của kit.
 *
 * Kit KHÔNG đụng logic: không fetch, không state nghiệp vụ — thuần trình bày.
 * ===================================================================== */

/* ------------------------------------------------------------------ */
/* PageHeading — tiêu đề trang kiểu sổ tay                             */
/* ------------------------------------------------------------------ */
export function PageHeading({
  eyebrow,
  title,
  subtitle,
  stamp,
  stampTone = "red",
  note,
  actions,
  back,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  stamp?: string;
  stampTone?: "red" | "blue";
  note?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
  className?: string;
}) {
  return (
    <header className={cn("nb3-page-heading", className)}>
      {back && (
        <Link
          href={back.href}
          className="nb3-link-back mb-2 inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 font-hand text-[0.95rem] text-[var(--ink-soft)] transition-colors hover:text-[var(--royal)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]"
        >
          ← {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="eyebrow mb-1.5">{eyebrow}</p>
          )}
          <div className="relative w-fit max-w-full">
            <h1 className="nb3-page-title text-[1.6rem] sm:text-[1.85rem]">{title}</h1>
            <SquiggleUnderline className="pointer-events-none absolute -bottom-2 left-0 h-2.5 w-full text-[var(--royal)]/70" draw />
          </div>
          {subtitle && <p className="nb3-page-subtitle mt-3">{subtitle}</p>}
          {note && <MarginNote className="mt-2">{note}</MarginNote>}
        </div>
        {stamp && (
          <div className="relative shrink-0 pl-2 pt-1">
            <StarDoodle className="absolute -left-4 -top-1 h-4 w-4 text-[var(--gold)]" />
            <StampMoc tone={stampTone}>{stamp}</StampMoc>
          </div>
        )}
        {actions && <div className="nb3-page-actions sm:ml-auto">{actions}</div>}
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* KpiTile — thẻ số liệu sổ tay                                        */
/* ------------------------------------------------------------------ */
export function KpiTile({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  tape = false,
  className,
}: {
  icon: VIconComponent;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  trend?: { text: ReactNode; tone: "up" | "down" | "flat" };
  tape?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("nb3-kpi paper-grain", className)}>
      {tape && <Tape variant="warm" rotate={-8} className="-top-2.5 left-4 !h-5 !w-14" />}
      <span className="nb3-kpi-icon">
        <Icon size={20} strokeWidth={2.1} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="nb3-kpi-label">{label}</p>
        <p className="nb3-kpi-value mt-0.5">{value}</p>
        {trend && (
          <p className="nb3-kpi-trend mt-1" data-tone={trend.tone}>
            {trend.tone === "up" && <span aria-hidden="true">▲</span>}
            {trend.tone === "down" && <span aria-hidden="true">▼</span>}
            {trend.tone === "flat" && <span aria-hidden="true">—</span>}
            {trend.text}
          </p>
        )}
        {sub && !trend && <p className="nb3-kpi-sub mt-0.5">{sub}</p>}
        {sub && trend && <p className="nb3-kpi-sub mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SectionPanel — panel mực có băng dính + con dấu                      */
/* ------------------------------------------------------------------ */
export function SectionPanel({
  title,
  description,
  stamp,
  stampTone = "red",
  tapeVariant,
  action,
  children,
  className,
  as: As = "section",
}: {
  title: ReactNode;
  description?: ReactNode;
  stamp?: string;
  stampTone?: "red" | "blue";
  tapeVariant?: "blue" | "warm" | "candy" | "mint" | "slate";
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
}) {
  return (
    <As className={cn("nb3-panel paper-grain", className)}>
      {tapeVariant && (
        <Tape variant={tapeVariant} rotate={-5} className="-top-3 left-8 !h-6 !w-20" />
      )}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="relative min-w-0">
          <div className="relative w-fit max-w-full">
            <h2 className="nb3-panel-title text-[1.05rem]">{title}</h2>
            <SquiggleUnderline className="pointer-events-none absolute -bottom-1.5 left-0 h-2 w-full text-[var(--ink)]/45" draw />
          </div>
          {description && <p className="nb3-panel-desc mt-1.5">{description}</p>}
        </div>
        {stamp && <StampMoc tone={stampTone}>{stamp}</StampMoc>}
        {action && <div className="flex min-w-0 flex-wrap items-center gap-2">{action}</div>}
      </div>
      {children}
    </As>
  );
}

/* ------------------------------------------------------------------ */
/* Data table helpers — class ghép cho bảng mực                        */
/* ------------------------------------------------------------------ */
export const inkTableWrapClass = "nb3-table-wrap";
export const inkTableClass = "nb3-table";
export const inkThClass = "nb3-th whitespace-nowrap";
export const inkTdClass = "nb3-td";
export const inkTrClass = "";

/* RowMenu — nút ⋯ viền mực cho hành động trên dòng bảng. */
export function RowMenuButton({
  label,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label?: string; children?: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label ?? "Thao tác"}
      title={label ?? "Thao tác"}
      className="nb3-btn nb3-btn-ghost nb3-btn-icon nb3-row-menu size-9"
      {...props}
    >
      {children ?? <span aria-hidden="true" className="text-base font-black leading-none">⋮</span>}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* StatusChip — tem trạng thái viền mực                                 */
/* ------------------------------------------------------------------ */
export function StatusChip({
  tone = "muted",
  dot = false,
  children,
  className,
}: {
  tone?: "neutral" | "blue" | "green" | "amber" | "red" | "muted" | string;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const dataTone =
    tone === "neutral"
      ? undefined
      : tone === "muted"
        ? "muted"
        : ["blue", "green", "amber", "red"].includes(tone)
          ? tone
          : undefined;
  return (
    <span className={cn("nb3-chip", className)} data-tone={dataTone}>
      {dot && <span className="nb3-chip-dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

/* Map tone chuẩn của repo (Badge/StatusDot) về tone nb3-chip. */
export function toneToChipTone(tone: string): string {
  switch (tone) {
    case "blue":
    case "sky":
      return "blue";
    case "green":
      return "green";
    case "amber":
      return "amber";
    case "red":
      return "red";
    case "gray":
      return "muted";
    default:
      return "neutral";
  }
}

/* ------------------------------------------------------------------ */
/* FilterChips — dải lọc vẽ tay                                          */
/* ------------------------------------------------------------------ */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  ariaLabel = "Bộ lọc",
  className,
}: {
  options: { value: T; label: ReactNode; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className={cn("nb3-toolbar", className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className="nb3-filter-chip"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
          {opt.count != null && (
            <span className="tabular-nums opacity-70">{opt.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MiniBar — thanh tiến độ mực có nắp                                    */
/* ------------------------------------------------------------------ */
export function MiniBar({
  value,
  label,
  tone,
  className,
}: {
  value: number;
  label?: string;
  tone?: "blue" | "success" | "warning" | "danger";
  className?: string;
}) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const toneAttr = tone === "blue" ? undefined : tone;
  return (
    <span className={cn("nb3-mini-track", className)}>
      <span className="nb3-mini-bar" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? `Tiến độ ${v}%`}>
        <span className="nb3-mini-fill" data-tone={toneAttr} style={{ width: `${v}%` }} />
      </span>
      <span className="text-xs font-bold tabular-nums text-[var(--ink-soft)]">{v}%</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* SparkTrend — dải cột mini xu hướng                                    */
/* ------------------------------------------------------------------ */
export function SparkTrend({
  values,
  tone,
  className,
  label,
}: {
  values: number[];
  tone?: "blue" | "success" | "warning" | "danger";
  label?: string;
  className?: string;
}) {
  const max = Math.max(...values, 1);
  return (
    <span
      className={cn("inline-flex h-4 items-end gap-[3px]", className)}
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      {values.map((v, i) => (
        <span
          key={i}
          className="spark-bar w-[5px]"
          data-tone={tone}
          style={{ height: `${Math.max(12, (v / max) * 100)}%` }}
        />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* ChartFrame — khung biểu đồ sketch                                     */
/* ------------------------------------------------------------------ */
export function ChartFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("nb3-chart-frame paper-grain", className)}>{children}</div>;
}

/* ------------------------------------------------------------------ */
/* EmptyNotebook — trạng thái trống doodle                               */
/* ------------------------------------------------------------------ */
export function EmptyNotebook({
  doodle,
  title,
  description,
  action,
  className,
}: {
  doodle?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div role="status" className={cn("nb3-empty", className)}>
      <span className="nb3-empty-doodle">{doodle ?? <StarDoodle className="h-5 w-5" />}</span>
      {title && <p className="nb3-empty-title">{title}</p>}
      {description && <p className="nb3-empty-desc">{description}</p>}
      {action && <div className="mt-2 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* KanbanColumn — cột bảng mực                                          */
/* ------------------------------------------------------------------ */
export function KanbanColumn({
  title,
  count,
  tone = "blue",
  tapeVariant,
  children,
  className,
}: {
  title: ReactNode;
  count: number;
  tone?: "blue" | "green" | "amber" | "red" | "neutral";
  tapeVariant?: "blue" | "warm" | "candy" | "mint" | "slate";
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("nb3-kanban-col", className)} aria-label={`Cột ${typeof title === "string" ? title : ""}`}>
      {tapeVariant && <Tape variant={tapeVariant} rotate={-4} className="-top-2 left-1/2 z-10 !h-5 !w-16 -translate-x-1/2" />}
      <header className="nb3-kanban-col-head">
        <InkBadge tone={tone === "neutral" ? "neutral" : tone}>{title}</InkBadge>
        <span className="nb3-kanban-count">{count}</span>
      </header>
      <div className="nb3-kanban-body">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* KanbanCard — thẻ nhiệm vụ sketch                                      */
/* ------------------------------------------------------------------ */
export function KanbanCard({
  title,
  children,
  onClick,
  href,
  className,
}: {
  title: ReactNode;
  children?: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
}) {
  const body = (
    <>
      <p className="text-[0.85rem] font-bold leading-snug text-[var(--ink)]">{title}</p>
      {children}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={cn("nb3-kanban-card", className)}>{body}</Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn("nb3-kanban-card text-left", className)}>{body}</button>
    );
  }
  return <div className={cn("nb3-kanban-card", className)}>{body}</div>;
}

/* ------------------------------------------------------------------ */
/* InkTabs — tab gạch mực                                                */
/* ------------------------------------------------------------------ */
export function InkTabs<T extends string>({
  tabs,
  value,
  onChange,
  ariaLabel = "Chuyển mục",
  className,
}: {
  tabs: { value: T; label: ReactNode; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn("nb3-tabs", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          type="button"
          aria-selected={value === tab.value}
          className="nb3-tab"
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
          {tab.count != null && (
            <span className="ml-1 text-xs tabular-nums opacity-60">{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* InkDivider — gạch đứt mực có kim cương                                */
/* ------------------------------------------------------------------ */
export function InkDivider({ className }: { className?: string }) {
  return <hr className={cn("divider-dashed-ink my-6 border-0", className)} aria-hidden="true" />;
}
