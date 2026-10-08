"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
export const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";
export const inputClass =
  "w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus-visible:outline-2 focus-visible:outline-blue-600";
export function Panel({
  title,
  children,
  action,
}: {
  title: string;
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
}: {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
      <span>
        {total} bản ghi · Trang {page}/{Math.max(1, totalPages)}
      </span>
      <div className="flex gap-2">
        <button
          className={buttonClass}
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Trước
        </button>
        <button
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
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
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
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      aria-label={title}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[min(760px,calc(100%-24px))] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl backdrop:bg-slate-900/50"
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
