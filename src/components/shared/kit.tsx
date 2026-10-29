"use client";

/**
 * Bộ dụng cụ UI dùng chung cho mọi view trong workspace —
 * đúng tinh thần "sổ tay": thẻ giấy, viền mực, dấu bút xanh.
 */

import { Loader2, Inbox, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/* ── Tiêu đề trang ── */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b-2 border-dashed border-ink/15 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-ink">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-soft">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/* ── Thẻ thống kê ── */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "blue" | "ink" | "green" | "amber" | "rose";
}) {
  const tones: Record<string, string> = {
    blue: "border-blue/30 bg-blue-mist/70 text-blue",
    ink: "border-ink/20 bg-paper-raised text-ink",
    green: "border-emerald-500/30 bg-emerald-50 text-emerald-700",
    amber: "border-amber-500/30 bg-amber-50 text-amber-700",
    rose: "border-rose-500/30 bg-rose-50 text-rose-600",
  };
  return (
    <div className="rounded-2xl border-2 border-ink/12 bg-paper-raised p-4 shadow-[3px_3px_0_0_rgba(23,23,28,0.06)] transition-transform hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12px] font-bold uppercase tracking-wide text-ink-soft">{label}</p>
        {Icon ? (
          <span className={cn("rounded-lg border-2 p-1.5", tones[tone])}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-[26px] font-extrabold leading-none text-ink">{value}</p>
      {hint ? <p className="mt-1.5 font-hand text-[15px] leading-none text-ink-faint">{hint}</p> : null}
    </div>
  );
}

/* ── Thẻ vùng nội dung ── */
export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border-2 border-ink/12 bg-paper-raised p-5 shadow-[3px_3px_0_0_rgba(23,23,28,0.06)]",
        className,
      )}
    >
      {title ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-ink">{title}</h2>
            {description ? <p className="mt-0.5 text-[13px] text-ink-soft">{description}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/* ── Trạng thái: đang tải / trống / lỗi ── */
export function LoadingState({ label = "Đang tải…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-ink-faint">
      <Loader2 className="h-7 w-7 animate-spin text-blue" aria-hidden="true" />
      <p className="text-sm font-semibold">{label}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink/15 bg-paper px-6 py-12 text-center">
      <Inbox className="h-8 w-8 text-ink-faint" aria-hidden="true" />
      <p className="text-sm font-bold text-ink">{title}</p>
      {description ? <p className="max-w-sm text-[13px] leading-relaxed text-ink-soft">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-rose-300 bg-rose-50/60 px-6 py-10 text-center">
      <AlertTriangle className="h-7 w-7 text-rose-500" aria-hidden="true" />
      <p className="text-sm font-bold text-rose-700">Không tải được dữ liệu</p>
      <p className="max-w-md text-[13px] leading-relaxed text-rose-600">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Thử lại
        </Button>
      ) : null}
    </div>
  );
}

/* ── Huy hiệu trạng thái (bút màu) ── */
const STATUS_TONES: Record<string, string> = {
  // chung
  active: "bg-blue-mist text-blue border-blue/40",
  draft: "bg-ink/5 text-ink-soft border-ink/25",
  planned: "bg-ink/5 text-ink-soft border-ink/25",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-400/50",
  done: "bg-emerald-50 text-emerald-700 border-emerald-400/50",
  passed: "bg-emerald-50 text-emerald-700 border-emerald-400/50",
  issued: "bg-emerald-50 text-emerald-700 border-emerald-400/50",
  open: "bg-blue-mist text-blue border-blue/40",
  published: "bg-emerald-50 text-emerald-700 border-emerald-400/50",
  archived: "bg-ink/5 text-ink-faint border-ink/20",
  cancelled: "bg-ink/5 text-ink-faint border-ink/20",
  closed: "bg-ink/5 text-ink-faint border-ink/20",
  revoked: "bg-rose-50 text-rose-600 border-rose-300",
  failed: "bg-rose-50 text-rose-600 border-rose-300",
  rejected: "bg-rose-50 text-rose-600 border-rose-300",
  pending: "bg-amber-50 text-amber-700 border-amber-300",
  submitted: "bg-amber-50 text-amber-700 border-amber-300",
  review: "bg-amber-50 text-amber-700 border-amber-300",
  needs_review: "bg-amber-50 text-amber-700 border-amber-300",
  in_progress: "bg-blue-mist text-blue border-blue/40",
  doing: "bg-blue-mist text-blue border-blue/40",
  todo: "bg-ink/5 text-ink-soft border-ink/25",
  locked: "bg-rose-50 text-rose-600 border-rose-300",
  evaluated: "bg-emerald-50 text-emerald-700 border-emerald-400/50",
  finalized: "bg-emerald-50 text-emerald-700 border-emerald-400/50",
  calculating: "bg-amber-50 text-amber-700 border-amber-300",
  withdrawn: "bg-ink/5 text-ink-faint border-ink/20",
  reviewed: "bg-emerald-50 text-emerald-700 border-emerald-400/50",
  invited: "bg-amber-50 text-amber-700 border-amber-300",
  accepted: "bg-emerald-50 text-emerald-700 border-emerald-400/50",
  verified: "bg-emerald-50 text-emerald-700 border-emerald-400/50",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Đang hoạt động",
  draft: "Bản nháp",
  planned: "Đã lên lịch",
  completed: "Hoàn thành",
  done: "Xong",
  passed: "Đạt",
  issued: "Đã cấp",
  open: "Đang mở",
  closed: "Đã đóng",
  published: "Đã xuất bản",
  archived: "Lưu trữ",
  cancelled: "Đã huỷ",
  revoked: "Đã thu hồi",
  failed: "Không đạt",
  pending: "Chờ xử lý",
  submitted: "Đã nộp",
  review: "Chờ duyệt",
  needs_review: "Cần xem lại",
  in_progress: "Đang làm",
  doing: "Đang làm",
  todo: "Cần làm",
  locked: "Bị khoá",
  evaluated: "Đã chấm",
  finalized: "Đã chốt",
  calculating: "Đang tính",
  withdrawn: "Đã rút",
  reviewed: "Đã duyệt",
  invited: "Đã mời",
  accepted: "Đã nhận",
  verified: "Đã xác minh",
  none: "Chưa bắt đầu",
  not_started: "Chưa bắt đầu",
  role_selected: "Đã chọn vai trò",
  draft_save: "Nháp",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = STATUS_TONES[status] ?? "bg-ink/5 text-ink-soft border-ink/25";
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
        tone,
        className,
      )}
    >
      {label}
    </span>
  );
}

/* ── Thanh tiến độ ── */
export function ProgressBar({
  value,
  max = 100,
  label,
  className,
}: {
  value: number;
  max?: number;
  label?: string;
  className?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={cn("space-y-1", className)}>
      {label ? (
        <div className="flex items-center justify-between text-[11px] font-bold text-ink-soft">
          <span>{label}</span>
          <span>{pct}%</span>
        </div>
      ) : null}
      <div
        className="h-2.5 overflow-hidden rounded-full border border-ink/15 bg-paper"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-blue transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ── Bảng danh sách đơn giản, responsive ── */
export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

export function ListTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  emptyTitle = "Chưa có gì ở đây",
  emptyDescription,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }
  return (
    <div className="overflow-x-auto rounded-xl border-2 border-ink/12">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b-2 border-ink/12 bg-paper">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn("whitespace-nowrap px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider text-ink-soft", col.className)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.key === "Enter") onRowClick(row);
                    }
                  : undefined
              }
              className={cn(
                "border-b border-dashed border-ink/10 bg-paper-raised last:border-0",
                onRowClick && "cursor-pointer transition-colors hover:bg-blue-mist/50 focus-visible:bg-blue-mist/60 focus-visible:outline-none",
              )}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn("px-4 py-3 align-middle text-ink", col.className)}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Phân trang ── */
export function Pager({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Trước
      </Button>
      <span className="text-[13px] font-bold text-ink-soft">
        {page} / {totalPages}
      </span>
      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Sau
      </Button>
    </div>
  );
}

/* ── Dòng khóa-giá trị ── */
export function KeyVal({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
      <span className="min-w-[130px] text-[12px] font-bold uppercase tracking-wide text-ink-faint">{label}</span>
      <span className="text-sm font-medium text-ink">{children}</span>
    </div>
  );
}

/* ── Chip nhỏ (công nghệ, kỹ năng...) ── */
export function Chip({ children, tone = "ink" }: { children: ReactNode; tone?: "ink" | "blue" | "green" }) {
  const tones: Record<string, string> = {
    ink: "border-ink/20 bg-paper text-ink-soft",
    blue: "border-blue/40 bg-blue-mist text-blue",
    green: "border-emerald-400/50 bg-emerald-50 text-emerald-700",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold", tones[tone])}>
      {children}
    </span>
  );
}
