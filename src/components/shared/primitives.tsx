"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { avatarStyleOf, initialsOf } from "@/lib/client/labels";

/* ============ ViewFrame & motion helpers ============ */

export { ViewFrame } from "./view";

/* ============ Panel ============ */

export function Panel({
  children,
  className,
  hoverable,
}: {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}) {
  return (
    <section
      className={cn(
        "card-surface",
        hoverable &&
          "transition-colors hover:border-line-strong hover:bg-panel-2",
        className
      )}
    >
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  description,
  actions,
  icon,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4",
        className
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        {icon ? (
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand-bright">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight text-ink">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-xs text-dim line-clamp-2">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}

/* ============ PageHeader ============ */

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-bright">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight text-ink md:text-[28px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm text-dim">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

/* ============ MetricCard ============ */

export function MetricCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "default" | "brand" | "amber" | "teal" | "rose" | "orange";
  className?: string;
}) {
  const toneMap: Record<string, string> = {
    default: "bg-panel text-dim",
    brand: "bg-brand/10 text-brand-bright",
    amber: "bg-amber/10 text-amber",
    teal: "bg-teal/10 text-teal",
    rose: "bg-rose/10 text-rose",
    orange: "bg-orange/10 text-orange",
  };
  return (
    <div className={cn("card-surface p-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-dim">{label}</span>
        {icon ? (
          <span
            className={cn(
              "grid size-7 shrink-0 place-items-center rounded-lg [&_svg]:size-4",
              toneMap[tone]
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <div className="mt-2 font-mono text-[26px] font-bold leading-none tracking-tight text-ink">
        {value}
      </div>
      {hint ? <div className="mt-1.5 text-xs text-faint">{hint}</div> : null}
    </div>
  );
}

/* ============ ToneBadge ============ */

const toneClasses: Record<string, string> = {
  emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
  teal: "bg-teal-500/10 text-teal-300 border-teal-500/25",
  amber: "bg-amber-500/10 text-amber-300 border-amber-500/25",
  rose: "bg-rose-500/10 text-rose-300 border-rose-500/25",
  orange: "bg-orange-500/10 text-orange-300 border-orange-500/25",
  violet: "bg-violet-500/10 text-violet-300 border-violet-500/25",
  zinc: "bg-zinc-500/10 text-zinc-300 border-zinc-500/25",
  brand: "bg-brand/12 text-brand-bright border-brand/30",
};

export function ToneBadge({
  children,
  tone = "zinc",
  dot,
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof toneClasses;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold leading-5",
        toneClasses[tone] ?? toneClasses.zinc,
        className
      )}
    >
      {dot ? (
        <span className="size-1.5 rounded-full bg-current" aria-hidden />
      ) : null}
      {children}
    </span>
  );
}

/* ============ Empty ============ */

export function Empty({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className
      )}
    >
      {icon ? (
        <div className="mb-4 grid size-12 place-items-center rounded-2xl border border-line bg-panel-2 text-dim [&_svg]:size-5">
          {icon}
        </div>
      ) : null}
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-dim">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/* ============ Pager ============ */

export function Pager({
  page,
  totalPages,
  total,
  onChange,
}: {
  page: number;
  totalPages: number;
  total?: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
      <span className="text-xs text-faint">
        {total !== undefined ? `${total} mục · ` : ""}Trang {page}/{totalPages}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="h-8 rounded-lg border border-line px-3 text-xs font-medium text-dim transition-colors hover:border-line-strong hover:text-ink disabled:pointer-events-none disabled:opacity-40"
        >
          Trước
        </button>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="h-8 rounded-lg border border-line px-3 text-xs font-medium text-dim transition-colors hover:border-line-strong hover:text-ink disabled:pointer-events-none disabled:opacity-40"
        >
          Sau
        </button>
      </div>
    </div>
  );
}

/* ============ StatusDot ============ */

const dotTones: Record<string, string> = {
  emerald: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]",
  teal: "bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.7)]",
  amber: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]",
  rose: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.7)]",
  orange: "bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.7)]",
  zinc: "bg-zinc-400",
};

export function StatusDot({
  tone = "zinc",
  pulse,
  className,
}: {
  tone?: keyof typeof dotTones;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block size-2 rounded-full",
        dotTones[tone],
        pulse && "animate-pulse-soft",
        className
      )}
    />
  );
}

/* ============ Avatar ============ */

export function UserAvatar({
  name,
  size = 32,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 select-none place-items-center rounded-full font-semibold ring-1 ring-line",
        className
      )}
      style={{ ...avatarStyleOf(name), width: size, height: size, fontSize: size * 0.36 }}
    >
      {initialsOf(name)}
    </span>
  );
}

export function AvatarStack({
  names,
  max = 4,
  size = 26,
}: {
  names: string[];
  max?: number;
  size?: number;
}) {
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  return (
    <span className="flex items-center">
      {shown.map((n, i) => (
        <span key={n + i} className="rounded-full ring-2 ring-panel" style={{ marginLeft: i === 0 ? 0 : -8 }}>
          <UserAvatar name={n} size={size} />
        </span>
      ))}
      {rest > 0 ? (
        <span
          className="grid place-items-center rounded-full bg-panel-2 text-[10px] font-semibold text-dim ring-2 ring-panel"
          style={{ width: size, height: size, marginLeft: -8 }}
        >
          +{rest}
        </span>
      ) : null}
    </span>
  );
}

/* ============ AnimatedProgressBar ============ */

export function AnimatedProgressBar({
  value,
  tone = "brand",
  className,
  showLabel,
}: {
  value: number;
  tone?: "brand" | "amber" | "teal" | "rose";
  className?: string;
  showLabel?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const tones: Record<string, string> = {
    brand: "from-brand to-brand-bright",
    amber: "from-amber to-orange",
    teal: "from-teal to-brand-bright",
    rose: "from-rose to-orange",
  };
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-track"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn("h-full rounded-full bg-gradient-to-r transition-[width] duration-700 ease-out", tones[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel ? (
        <span className="font-mono text-[11px] font-semibold text-dim">{pct}%</span>
      ) : null}
    </div>
  );
}

/* ============ KeyValue ============ */

export function KeyValue({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-faint">{label}</dt>
      <dd className="mt-1 truncate text-sm text-ink">{children}</dd>
    </div>
  );
}

/* ============ SectionHeading ============ */

export function SectionHeading({
  children,
  action,
  className,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-3", className)}>
      <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-dim">
        {children}
      </h3>
      {action}
    </div>
  );
}
