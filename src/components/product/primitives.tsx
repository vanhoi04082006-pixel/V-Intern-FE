"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { X, type LucideIcon } from "lucide-react";
import { trapDialogFocus } from "@/lib/ui/dialog-focus";
export const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";
export const inputClass =
  "w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus-visible:outline-2 focus-visible:outline-blue-600";
export function MetricCard({ icon: Icon, label, value, sub, subTone = 'text-slate-500' }: {
  icon: LucideIcon; label: string; value: ReactNode; sub?: ReactNode; subTone?: string; index?: number;
}) {
  return <section className="flex min-w-0 items-center gap-3 rounded-lg border border-blue-100 bg-white p-4">
    <Icon className="shrink-0 text-blue-600" size={24} aria-hidden="true" />
    <div><p className="text-xs text-slate-500">{label}</p><p className="text-2xl font-bold text-navy">{value}</p>{sub != null && <p className={`text-xs ${subTone}`}>{sub}</p>}</div>
  </section>;
}
export function Panel({
  title,
  children,
  action,
}: {
  title: ReactNode;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-[#10164b]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
export function PageTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#10164b] sm:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
export function Empty({
  children = "Chưa có dữ liệu.",
}: {
  children?: ReactNode;
}) {
  return (
    <p
      role="status"
      className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500"
    >
      {children}
    </p>
  );
}
export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
      {children}
    </span>
  );
}
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
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
      <span>
        {total} {unit} · Trang {page}/{Math.max(1, totalPages)}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          className={buttonClass}
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Trước
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Sau
        </button>
      </div>
    </div>
  );
}
export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
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
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      aria-label={title}
      className={`fixed inset-0 m-auto max-h-[90dvh] ${wide ? "w-[min(1200px,calc(100%-24px))]" : "w-[min(760px,calc(100%-24px))]"} overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl backdrop:bg-slate-900/50`}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-navy">{title}</h2>
        <button
          type="button"
          aria-label="Đóng"
          onClick={onClose}
          className="rounded-lg p-2 hover:bg-slate-100"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function PageMeta({ items }: { items: { icon: LucideIcon; label: string; value: ReactNode }[] }) {
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

const statusDotTones: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-800",
  blue: "bg-blue-50 text-blue-700",
  gray: "bg-slate-100 text-slate-500",
  red: "bg-rose-50 text-rose-700",
};

/** Status pill with leading dot, as in the reference tables. */
export function StatusDot({ tone = "green", children }: { tone?: keyof typeof statusDotTones; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded px-2 py-1 text-[11px] font-medium ${statusDotTones[tone]}`}>
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

/** Overlapping member avatars with overflow count. */
export function AvatarStack({ count }: { count: number }) {
  if (!count) return <span className="text-slate-400">0</span>;
  return (
    <span className="flex items-center gap-2">
      <strong>{count}</strong>
      <span className="flex -space-x-1" aria-hidden="true">
        {Array.from({ length: Math.min(3, count) }, (_, i) => (
          <span key={i} className="grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-blue-100 text-[8px] text-blue-700">SV</span>
        ))}
        {count > 3 && <span className="grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-slate-100 text-[8px] text-slate-500">+{count - 3}</span>}
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
      <progress value={v} max={100} className="h-2 w-20 accent-blue-600" aria-label={label ?? `Tiến độ ${v}%`} />
      <span className="text-[11px] text-slate-500">{label ?? `${v}%`}</span>
    </span>
  );
}
