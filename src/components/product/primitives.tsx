"use client";
import { useEffect, useRef, type ReactNode } from "react";
import {
  IconX,
  IconInbox,
  IconInfo,
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
  IconArrowLeft,
  type IconComponent,
} from "@/components/v-intern/icons";
import { LoaderCircle } from "@/components/animate-ui/icons/loader-circle";
import Link from "next/link";
import { trapDialogFocus } from "@/lib/ui/dialog-focus";
import { cn } from "@/lib/utils";
import { SquiggleUnderline } from "@/components/notebook/doodles";
import { StampMoc } from "@/components/notebook/ui";

/* =====================================================================
 * PRODUCT PRIMITIVES — Journey Notebook v3 conversion (Phase B).
 *
 * Nguyên tắc:
 * - API (tên hàm/props) giữ nguyên 100% — không phá call sites hay test.
 * - Hook `product-*` vẫn render trong DOM (test + aurora fallback dựa vào).
 * - Lớp nhìn chuyển sang nb3-* (journey.css) — tự chứa, không bị
 *   `.aurora-workspace` v2 đè nhờ §20 BRIDGE trong journey.css.
 * - KHÔNG đụng logic: không fetch, không state nghiệp vụ.
 * ===================================================================== */

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const buttonBase =
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-200 disabled:cursor-not-allowed disabled:active:translate-y-0";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "nb3-btn-primary",
  secondary: "",
  ghost: "nb3-btn-ghost",
  danger: "nb3-btn-danger",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "nb3-btn-sm",
  md: "nb3-btn-md",
  lg: "nb3-btn-lg",
  icon: "nb3-btn-icon",
};

/** Class cho button theo variant/size — dùng thay cho string ghép tay. */
export function btn(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
): string {
  return cn(
    "product-button",
    `product-button-${variant}`,
    "nb3-btn",
    buttonVariants[variant],
    buttonSizes[size],
    buttonBase,
  );
}

/** Primary CTA class — giữ tên cũ để không phá import hiện có. */
export const buttonClass = btn("primary");

/** Icon-only button (menu, close, toolbar) — cần aria-label ở call site. */
export const iconButtonClass = cn(
  "product-button product-button-ghost",
  "nb3-btn nb3-btn-ghost nb3-btn-icon",
  buttonBase,
);

/* ------------------------------------------------------------------ */
/* Form controls                                                       */
/* ------------------------------------------------------------------ */
export const inputClass = "product-input nb3-input w-full min-w-0";
export const selectClass = cn(inputClass, "nb3-select");
export const textareaClass = cn(inputClass, "nb3-textarea min-h-24 resize-y");

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
      <label htmlFor={htmlFor} className="product-field-label nb3-label block text-foreground">
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
/* Feedback                                                           */
/* ------------------------------------------------------------------ */
export function Spinner({ className }: { className?: string }) {
  return (
    <LoaderCircle
      loop
      animate
      size={16}
      aria-hidden="true"
      className={cn("size-4 shrink-0", className)}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("skeleton-pencil", className)}
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
  info: { icon: IconInfo },
  success: { icon: IconCircleCheck },
  warning: { icon: IconAlertTriangle },
  danger: { icon: IconCircleX },
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
      data-tone={tone}
      className={cn(
        "nb3-alert flex items-start gap-3 px-4 py-3 text-body leading-6 text-foreground",
        className,
      )}
    >
      <Icon
        aria-hidden="true"
        className="mt-0.5 size-5 shrink-0"
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
  icon: IconComponent;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  subTone?: string;
  index?: number;
}) {
  return (
    <section className="product-metric nb3-kpi paper-grain min-w-0">
      <span className="nb3-kpi-icon">
        <Icon size={20} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="nb3-kpi-label">{label}</p>
        <p className="nb3-kpi-value mt-0.5 break-words">{value}</p>
        {sub != null && (
          <p className={cn("nb3-kpi-sub mt-1", subTone)}>{sub}</p>
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
        "product-panel nb3-panel paper-grain min-w-0",
        className,
      )}
    >
      <div className="product-panel-header mb-4 flex flex-wrap items-center justify-between gap-3 pb-3">
        <div className="relative min-w-0">
          <div className="relative w-fit max-w-full">
            <h2 className="product-panel-title nb3-panel-title text-body leading-6 sm:text-subsection">
              {title}
            </h2>
            <SquiggleUnderline
              className="pointer-events-none absolute -bottom-1.5 left-0 h-2 w-full text-[var(--ink)]/45"
              draw
            />
          </div>
          {description && (
            <p className="product-panel-description nb3-panel-desc mt-1.5">
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
        "product-card nb3-card",
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
  eyebrow,
  stamp,
  stampTone = "red",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  back?: { href: string; label: string };
  /** v3 additive: dòng mono nhỏ trên tiêu đề (opt-in từng trang). */
  eyebrow?: string;
  /** v3 additive: con dấu cạnh tiêu đề (opt-in từng trang). */
  stamp?: string;
  stampTone?: "red" | "blue";
}) {
  return (
    <div className="product-page-title nb3-page-heading mb-6">
      {back && (
        <Link
          href={back.href}
          className="mb-3 inline-flex min-h-8 items-center gap-2 rounded-control px-2 text-small font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1"
        >
          <IconArrowLeft size={15} aria-hidden="true" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
          <div className="relative w-fit max-w-full">
            <h1 className="product-page-title-heading nb3-page-title text-page tracking-tight sm:text-page">
              {title}
            </h1>
            <SquiggleUnderline
              className="pointer-events-none absolute -bottom-2 left-0 h-2.5 w-full text-[var(--royal)]/70"
              draw
            />
          </div>
          {subtitle && (
            <p className="product-page-title-subtitle nb3-page-subtitle mt-3">
              {subtitle}
            </p>
          )}
        </div>
        {stamp && (
          <div className="relative shrink-0 pl-2 pt-1">
            <StampMoc tone={stampTone}>{stamp}</StampMoc>
          </div>
        )}
        {action && (
          <div className="product-page-actions nb3-page-actions max-w-full">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}

export function Empty({
  icon: Icon = IconInbox,
  title,
  description,
  action,
  children,
}: {
  icon?: IconComponent;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}) {
  const hasRich = Boolean(title || description || action);
  return (
    <div
      role="status"
      className="product-empty nb3-empty px-4 py-8"
    >
      {hasRich && (
        <span className="nb3-empty-doodle">
          <Icon size={22} aria-hidden="true" />
        </span>
      )}
      {title && (
        <p className="nb3-empty-title mt-3 text-foreground">{title}</p>
      )}
      {description && (
        <p className="nb3-empty-desc mx-auto mt-1 max-w-md">
          {description}
        </p>
      )}
      {!hasRich && (
        <div className="nb3-empty-desc text-body">
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
  blue: "blue",
  gray: "muted",
  amber: "amber",
  green: "green",
  red: "red",
  sky: "blue",
} as const;
export type BadgeTone = keyof typeof badgeTones;

export function Badge({
  children,
  tone = "blue",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  const dataTone = badgeTones[tone];
  return (
    <span
      data-tone={dataTone}
      className={cn(
        "product-badge nb3-chip inline-flex items-center gap-1 leading-none",
      )}
    >
      {children}
    </span>
  );
}

const statusDotTones: Record<string, string> = {
  green: "green",
  amber: "amber",
  blue: "blue",
  gray: "muted",
  red: "red",
  sky: "blue",
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
      data-tone={statusDotTones[tone]}
      className={cn(
        "product-status nb3-chip inline-flex items-center gap-2 whitespace-nowrap leading-none",
      )}
    >
      <span className="nb3-chip-dot" aria-hidden="true" />
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
      <p className="mt-2 text-body text-muted-foreground">
        <span className="tabular-nums">
          {total} {unit}
        </span>
      </p>
    );
  return (
    <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-body text-muted-foreground">
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
  closeDisabled = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  description?: ReactNode;
  footer?: ReactNode;
  closeDisabled?: boolean;
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
        if (!closeDisabled && event.target === ref.current) onClose();
      }}
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!closeDisabled) onClose();
      }}
      aria-label={title}
      className={`product-modal nb3-modal fixed inset-0 m-auto max-h-[90dvh] ${wide ? "w-[min(1200px,calc(100%-24px))]" : "w-[min(760px,calc(100%-24px))]"} overflow-y-auto backdrop:bg-foreground/50`}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="nb3-modal-title text-section font-bold text-foreground">{title}</h2>
          {description && (
            <p className="mt-1 text-body leading-6 text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          aria-label="Đóng"
          disabled={closeDisabled}
          onClick={onClose}
          className={iconButtonClass}
        >
          <IconX size={20} aria-hidden="true" />
        </button>
      </div>
      {children}
      {footer && (
        <div className="mt-5 flex flex-wrap justify-end gap-2 pt-4">
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
  items: { icon: IconComponent; label: string; value: ReactNode }[];
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
    <span className="nb3-mini-track inline-flex items-center gap-2">
      <span
        className="nb3-mini-bar"
        role="progressbar"
        aria-valuenow={v}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? `Tiến độ ${v}%`}
      >
        <span className="nb3-mini-fill" style={{ width: `${v}%` }} />
      </span>
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
  "workspace-table-wrap nb3-table-wrap overflow-x-auto";
export const tableClass = "product-table nb3-table w-full border-collapse text-body";
export const thClass = "nb3-th whitespace-nowrap text-left";
export const tdClass = "nb3-td align-top";
export const tableRowClass = "";
