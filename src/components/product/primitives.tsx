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
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-control font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:active:translate-y-0";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground shadow-app-xs hover:bg-primary/90",
  secondary:
    "border border-border bg-card text-foreground shadow-app-xs hover:border-input hover:bg-background",
  ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
  danger: "bg-destructive text-primary-foreground shadow-app-xs hover:bg-destructive/90",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 py-2 text-small",
  md: "min-h-10 px-4 py-3 text-body",
  lg: "min-h-11 px-5 py-3 text-body",
  icon: "size-10 p-0",
};

/** Class cho button theo variant/size — dùng thay cho string ghép tay. */
export function btn(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
): string {
  return cn(
    "product-button",
    `product-button-${variant}`,
    buttonBase,
    buttonVariants[variant],
    buttonSizes[size],
  );
}

/** Primary CTA class — giữ tên cũ để không phá import hiện có. */
export const buttonClass = btn("primary");

/** Icon-only button (menu, close, toolbar) — cần aria-label ở call site. */
export const iconButtonClass = cn(
  buttonBase,
  buttonVariants.ghost,
  buttonSizes.icon,
);

/* ------------------------------------------------------------------ */
/* Form controls                                                       */
/* ------------------------------------------------------------------ */
export const inputClass =
  "product-input w-full min-w-0 rounded-control border border-border bg-card px-4 py-3 text-body text-foreground shadow-app-xs transition-[border-color,box-shadow] placeholder:text-muted-foreground hover:border-input focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30";
export const selectClass = cn(
  inputClass,
  "pr-9 cursor-pointer",
);
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
    <div className={cn("space-y-2", className)}>
      <label htmlFor={htmlFor} className="block text-body font-medium text-foreground">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-destructive">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${htmlFor}-hint`} className="text-caption leading-5 text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="text-caption font-medium leading-5 text-destructive"
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
      className={cn("animate-pulse rounded-control bg-muted/60", className)}
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
              className={cn(
                "h-4",
                c === 0 ? "w-1/4 min-w-24" : "w-full flex-1",
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

const alertTones = {
  info: {
    box: "border-primary/20 bg-accent text-primary",
    icon: Info,
    iconClass: "text-primary",
  },
  success: {
    box: "border-success/20 bg-success-subtle text-success",
    icon: CircleCheck,
    iconClass: "text-success",
  },
  warning: {
    box: "border-warning/20 bg-warning-subtle text-warning",
    icon: TriangleAlert,
    iconClass: "text-warning",
  },
  danger: {
    box: "border-destructive/20 bg-destructive-subtle text-destructive",
    icon: CircleX,
    iconClass: "text-destructive",
  },
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
        "flex items-start gap-3 rounded-control border px-4 py-3 text-body leading-6",
        conf.box,
        className,
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn("mt-0.5 size-5 shrink-0", conf.iconClass)}
      />
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
  subTone = "text-muted-foreground",
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  subTone?: string;
  index?: number;
}) {
  return (
    <section className="product-metric flex min-w-0 items-start gap-3 border-b border-border py-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-control bg-accent">
        <Icon className="text-primary" size={21} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-caption font-medium leading-5 text-muted-foreground">{label}</p>
        <p className="mt-1 break-words text-page font-bold tracking-tight text-foreground tabular-nums">
          {value}
        </p>
        {sub != null && (
          <p className={cn("mt-1 text-caption leading-5", subTone)}>{sub}</p>
        )}
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
        "product-panel min-w-0",
        className,
      )}
    >
      <div className="product-panel-header mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="min-w-0">
          <h2 className="product-panel-title text-body font-bold leading-6 text-foreground sm:text-subsection">
            {title}
          </h2>
          {description && (
            <p className="product-panel-description mt-0.5 text-caption leading-5 text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Card phụ trong Panel — thay cho pattern `rounded-control border border-border` rải rác. */
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
        "product-card border-b border-border py-4",
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
    <div className="product-page-title mb-6">
      {back && (
        <Link
          href={back.href}
          className="mb-3 inline-flex min-h-8 items-center gap-2 rounded-control px-2 text-small font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="product-page-title-heading text-page font-bold tracking-tight text-foreground sm:text-page">
            {title}
          </h1>
          {subtitle && (
            <p className="product-page-title-subtitle mt-2 max-w-3xl text-body leading-6 text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          <div className="product-page-actions flex min-w-0 max-w-full shrink-0 flex-wrap items-center gap-2">
            {action}
          </div>
        )}
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
      className="product-empty px-4 py-8 text-center"
    >
      {hasRich && (
        <span className="mx-auto grid size-11 place-items-center rounded-full bg-card text-muted-foreground ring-1 ring-ring/70">
          <Icon size={20} aria-hidden="true" />
        </span>
      )}
      {title && <p className="mt-3 text-body font-semibold text-foreground">{title}</p>}
      {description && (
        <p className="mx-auto mt-1 max-w-md text-body leading-6 text-muted-foreground">
          {description}
        </p>
      )}
      {!hasRich && (
        <div className="text-body text-muted-foreground">
          {children ?? "Chưa có dữ liệu."}
        </div>
      )}
      {hasRich && children}
      {action && <div className="mt-4 flex justify-center gap-2">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Badge / status                                                      */
/* ------------------------------------------------------------------ */
const badgeTones = {
  blue: "bg-accent text-primary",
  gray: "bg-muted text-muted-foreground",
  amber: "bg-warning-subtle text-warning",
  green: "bg-success-subtle text-success",
  red: "bg-destructive-subtle text-destructive",
  sky: "bg-accent text-primary",
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
        "product-badge inline-flex items-center gap-1 rounded-md px-2 py-1 text-caption font-medium leading-none",
        badgeTones[tone],
      )}
    >
      {children}
    </span>
  );
}

const statusDotTones: Record<string, string> = {
  green: "bg-success-subtle text-success",
  amber: "bg-warning-subtle text-warning",
  blue: "bg-accent text-primary",
  gray: "bg-muted text-muted-foreground",
  red: "bg-destructive-subtle text-destructive",
  sky: "bg-accent text-primary",
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
        "product-status inline-flex items-center gap-2 whitespace-nowrap rounded px-2 py-1 text-caption font-medium",
        statusDotTones[tone],
      )}
    >
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
  // A single-page list shows only the count: two permanently disabled
  // buttons read as a broken control, not as "there is nothing more".
  if (last <= 1)
    return (
      <p className="mt-4 text-body text-muted-foreground">
        <span className="tabular-nums">
          {total} {unit}
        </span>
      </p>
    );
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-body text-muted-foreground">
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
      className={`product-modal fixed inset-0 m-auto max-h-[90dvh] ${wide ? "w-[min(1200px,calc(100%-24px))]" : "w-[min(760px,calc(100%-24px))]"} overflow-y-auto rounded-panel border border-border bg-card p-5 shadow-popover backdrop:bg-foreground/50`}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-section font-bold text-foreground">{title}</h2>
          {description && (
            <p className="mt-1 text-body leading-6 text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          aria-label="Đóng"
          onClick={onClose}
          className={iconButtonClass}
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      {children}
      {footer && (
        <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-border pt-4">
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
    <dl className="mb-4 flex flex-wrap gap-x-7 gap-y-2 text-caption text-muted-foreground">
      {items.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center gap-2">
          <Icon size={16} aria-hidden="true" />
          <dt>{label}:</dt>
          <dd className="font-bold text-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Overlapping member avatars with overflow count. */
export function AvatarStack({ count }: { count: number }) {
  if (!count) return <span className="text-muted-foreground">0</span>;
  return (
    <span className="flex items-center gap-2">
      <strong className="tabular-nums">{count}</strong>
      <span className="flex -space-x-1" aria-hidden="true">
        {Array.from({ length: Math.min(3, count) }, (_, i) => (
          <span
            key={i}
            className="grid h-5 w-5 place-items-center rounded-full border-2 border-card bg-accent text-caption text-primary"
          >
            SV
          </span>
        ))}
        {count > 3 && (
          <span className="grid h-5 w-5 place-items-center rounded-full border-2 border-card bg-muted text-caption text-muted-foreground">
            +{count - 3}
          </span>
        )}
      </span>
    </span>
  );
}

/** Inline progress bar with percent label. */
export function ProgressBar({
  value,
  label,
}: {
  value: number | null;
  label?: string;
}) {
  if (value === null) return <span className="text-muted-foreground">Chưa có dữ liệu</span>;
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <span className="flex items-center gap-2">
      <progress
        value={v}
        max={100}
        className="h-2 w-20 accent-primary"
        aria-label={label ?? `Tiến độ ${v}%`}
      />
      <span className="text-caption tabular-nums text-muted-foreground">
        {label ?? `${v}%`}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Table classes — dùng cho bảng thủ công để đồng bộ style             */
/* ------------------------------------------------------------------ */
export const tableWrapClass =
  "workspace-table-wrap overflow-x-auto border-y border-border";
export const tableClass = "product-table w-full border-collapse text-body";
export const thClass =
  "whitespace-nowrap border-b border-border/70 bg-background/80 px-4 py-3 text-left text-caption font-semibold  text-muted-foreground";
export const tdClass =
  "border-b border-border px-4 py-3 align-top text-foreground";
export const tableRowClass = "transition-colors hover:bg-background/70";
