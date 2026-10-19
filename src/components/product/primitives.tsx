"use client";
import { useEffect, useRef, type ReactNode } from "react";
import {
  X,
  Inbox,
  Info,
  TriangleAlert,
  CircleCheck,
  CircleX,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { trapDialogFocus } from "@/lib/ui/dialog-focus";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const buttonBase =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:active:translate-y-0";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-blue-600 text-white shadow-xs hover:bg-blue-700 hover:shadow-sm",
  secondary:
    "border border-slate-200 bg-white text-navy shadow-xs hover:border-slate-300 hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-navy",
  danger: "bg-rose-600 text-white shadow-xs hover:bg-rose-700 hover:shadow-sm",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 py-2 text-[13px]",
  md: "min-h-10 px-4 py-2.5 text-sm",
  lg: "min-h-11 px-5 py-3 text-sm",
  icon: "size-10 p-0",
};

/** Class cho button theo variant/size — dùng thay cho string ghép tay. */
export function btn(variant: ButtonVariant = "primary", size: ButtonSize = "md"): string {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size]);
}

/** Primary CTA class — giữ tên cũ để không phá import hiện có. */
export const buttonClass = btn("primary");

/** Icon-only button (menu, close, toolbar) — cần aria-label ở call site. */
export const iconButtonClass = cn(buttonBase, buttonVariants.ghost, buttonSizes.icon);

/* ------------------------------------------------------------------ */
/* Form controls                                                       */
/* ------------------------------------------------------------------ */
export const inputClass =
  "w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 shadow-xs transition-[border-color,box-shadow] placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30";
export const selectClass = cn(inputClass, "appearance-none pr-9 cursor-pointer");
export const textareaClass = cn(inputClass, "min-h-24 resize-y");

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  className,
  children,
}: {
  label: ReactNode;
  htmlFor: string;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-navy">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-rose-600">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${htmlFor}-hint`} className="text-xs leading-5 text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="text-xs font-medium leading-5 text-rose-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Feedback                                                            */
/* ------------------------------------------------------------------ */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-lg bg-slate-200/60", className)}
    />
  );
}

/** Khối skeleton dạng bảng cho trang danh sách. */
export function TableSkeleton({
  rows = 5,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div role="status" aria-label="Đang tải dữ liệu" className="space-y-3 p-1">
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-4">
          {Array.from({ length: cols }, (_, c) => (
            <Skeleton
              key={c}
              className={cn("h-4", c === 0 ? "w-1/4 min-w-24" : "w-full flex-1")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

const alertTones = {
  info: { box: "border-sky-200 bg-sky-50 text-sky-900", icon: Info, iconClass: "text-sky-600" },
  success: { box: "border-emerald-200 bg-emerald-50 text-emerald-900", icon: CircleCheck, iconClass: "text-emerald-600" },
  warning: { box: "border-amber-200 bg-amber-50 text-amber-900", icon: TriangleAlert, iconClass: "text-amber-600" },
  danger: { box: "border-rose-200 bg-rose-50 text-rose-900", icon: CircleX, iconClass: "text-rose-600" },
} as const;
export type AlertTone = keyof typeof alertTones;

export function InlineAlert({
  tone,
  title,
  children,
  action,
  className,
}: {
  tone: AlertTone;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const conf = alertTones[tone];
  const Icon = conf.icon;
  return (
    <div
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-6",
        conf.box,
        className,
      )}
    >
      <Icon aria-hidden="true" className={cn("mt-0.5 size-5 shrink-0", conf.iconClass)} />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */
export function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  subTone = "text-slate-500",
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  subTone?: string;
  index?: number;
}) {
  return (
    <section className="flex min-w-0 items-start gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-xs transition-shadow hover:shadow-sm sm:p-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50">
        <Icon className="text-blue-600" size={21} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium leading-5 text-slate-500">{label}</p>
        <p className="mt-1 break-words text-2xl font-bold tracking-tight text-navy tabular-nums">
          {value}
        </p>
        {sub != null && <p className={cn("mt-1 text-xs leading-5", subTone)}>{sub}</p>}
      </div>
    </section>
  );
}

export function Panel({
  title,
  children,
  action,
  description,
  className,
}: {
  title: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-xs sm:p-5",
        className,
      )}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="min-w-0">
          <h2 className="text-sm font-bold leading-6 text-navy sm:text-base">{title}</h2>
          {description && <p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Card phụ trong Panel — thay cho pattern `rounded-xl border border-slate-200` rải rác. */
export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/70 bg-white p-4 shadow-xs",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageTitle({
  title,
  subtitle,
  action,
  back,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6">
      {back && (
        <Link
          href={back.href}
          className="mb-3 inline-flex min-h-8 items-center gap-1.5 rounded-lg px-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{subtitle}</p>}
        </div>
        {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
      </div>
    </div>
  );
}

export function Empty({
  icon: Icon = Inbox,
  title,
  description,
  action,
  children,
}: {
  icon?: LucideIcon;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}) {
  const hasRich = Boolean(title || description || action);
  return (
    <div
      role="status"
      className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-8 text-center"
    >
      {hasRich && (
        <span className="mx-auto grid size-11 place-items-center rounded-full bg-white text-slate-400 ring-1 ring-slate-200/70">
          <Icon size={20} aria-hidden="true" />
        </span>
      )}
      {title && <p className="mt-3 text-sm font-semibold text-navy">{title}</p>}
      {description && (
        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      )}
      {!hasRich && <div className="text-sm text-slate-500">{children ?? "Chưa có dữ liệu."}</div>}
      {hasRich && children}
      {action && <div className="mt-4 flex justify-center gap-2">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Badge / status                                                      */
/* ------------------------------------------------------------------ */
const badgeTones = {
  blue: "bg-blue-50 text-blue-700",
  gray: "bg-slate-100 text-slate-600",
  amber: "bg-amber-50 text-amber-800",
  green: "bg-emerald-50 text-emerald-700",
  red: "bg-rose-50 text-rose-700",
  sky: "bg-sky-50 text-sky-700",
} as const;
export type BadgeTone = keyof typeof badgeTones;

export function Badge({
  children,
  tone = "blue",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium leading-none",
        badgeTones[tone],
      )}
    >
      {children}
    </span>
  );
}

const statusDotTones: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-800",
  blue: "bg-blue-50 text-blue-700",
  gray: "bg-slate-100 text-slate-500",
  red: "bg-rose-50 text-rose-700",
  sky: "bg-sky-50 text-sky-700",
};

/** Status pill with leading dot, as in the reference tables. */
export function StatusDot({
  tone = "green",
  children,
}: {
  tone?: keyof typeof statusDotTones;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded px-2 py-1 text-[11px] font-medium",
        statusDotTones[tone],
      )}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Pagination                                                          */
/* ------------------------------------------------------------------ */
export function Pager({
  page,
  totalPages,
  total,
  onChange,
  unit = "bản ghi",
}: {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
  unit?: string;
}) {
  const last = Math.max(1, totalPages);
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
      <span className="tabular-nums">
        {total} {unit} · Trang {page}/{last}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          className={btn("secondary", "sm")}
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Trước
        </button>
        <button
          type="button"
          className={btn("secondary", "sm")}
          disabled={page >= last}
          onClick={() => onChange(page + 1)}
        >
          Sau
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */
export function Modal({
  title,
  onClose,
  children,
  wide = false,
  description,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  description?: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      onKeyDown={trapDialogFocus}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      aria-label={title}
      className={`fixed inset-0 m-auto max-h-[90dvh] ${wide ? "w-[min(1200px,calc(100%-24px))]" : "w-[min(760px,calc(100%-24px))]"} overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl backdrop:bg-slate-900/50`}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-navy">{title}</h2>
          {description && <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>}
        </div>
        <button type="button" aria-label="Đóng" onClick={onClose} className={iconButtonClass}>
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      {children}
      {footer && (
        <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
          {footer}
        </div>
      )}
    </dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Misc                                                                */
/* ------------------------------------------------------------------ */
export function PageMeta({
  items,
}: {
  items: { icon: LucideIcon; label: string; value: ReactNode }[];
}) {
  return (
    <dl className="mb-4 flex flex-wrap gap-x-7 gap-y-2 text-xs text-slate-500">
      {items.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center gap-2">
          <Icon size={16} aria-hidden="true" />
          <dt>{label}:</dt>
          <dd className="font-bold text-navy">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Overlapping member avatars with overflow count. */
export function AvatarStack({ count }: { count: number }) {
  if (!count) return <span className="text-slate-400">0</span>;
  return (
    <span className="flex items-center gap-2">
      <strong className="tabular-nums">{count}</strong>
      <span className="flex -space-x-1" aria-hidden="true">
        {Array.from({ length: Math.min(3, count) }, (_, i) => (
          <span
            key={i}
            className="grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-blue-100 text-[8px] text-blue-700"
          >
            SV
          </span>
        ))}
        {count > 3 && (
          <span className="grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-slate-100 text-[8px] text-slate-500">
            +{count - 3}
          </span>
        )}
      </span>
    </span>
  );
}

/** Inline progress bar with percent label. */
export function ProgressBar({ value, label }: { value: number | null; label?: string }) {
  if (value === null) return <span className="text-slate-400">—</span>;
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <span className="flex items-center gap-2">
      <progress
        value={v}
        max={100}
        className="h-2 w-20 accent-blue-600"
        aria-label={label ?? `Tiến độ ${v}%`}
      />
      <span className="text-[11px] tabular-nums text-slate-500">{label ?? `${v}%`}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Table classes — dùng cho bảng thủ công để đồng bộ style             */
/* ------------------------------------------------------------------ */
export const tableWrapClass = "overflow-x-auto rounded-xl border border-slate-200/70 bg-white";
export const tableClass = "w-full border-collapse text-sm";
export const thClass =
  "whitespace-nowrap border-b border-slate-200/70 bg-slate-50/80 px-3.5 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500";
export const tdClass = "border-b border-slate-100 px-3.5 py-3 align-top text-slate-700";
export const tableRowClass = "transition-colors hover:bg-slate-50/70";
