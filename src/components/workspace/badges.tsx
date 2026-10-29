"use client";

import { cn } from "@/lib/utils";
import {
  TASK_PRIORITY_META,
  TASK_STATUS_META,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/types";

export function StatusBadge({
  status,
  className,
}: {
  status: TaskStatus;
  className?: string;
}) {
  const dot =
    status === "done"
      ? "bg-emerald-500"
      : status === "in_progress"
        ? "bg-blue"
        : status === "review"
          ? "bg-amber-500"
          : "bg-ink-faint";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-raised px-2.5 py-0.5 text-[11px] font-bold text-ink-soft",
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} aria-hidden="true" />
      {TASK_STATUS_META[status].label}
    </span>
  );
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: TaskPriority;
  className?: string;
}) {
  const meta = TASK_PRIORITY_META[priority];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border-2 px-2.5 py-0.5 text-[11px] font-bold",
        meta.className,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}

/** Số ngày còn tới hạn — âm là đã trễ. */
export function dueInfo(due: string | null): { text: string; overdue: boolean; soon: boolean } {
  if (!due) return { text: "Không hạn", overdue: false, soon: false };
  const ms = new Date(due).getTime() - Date.now();
  const days = Math.round(ms / 86_400_000);
  if (days < 0)
    return { text: `Trễ ${Math.abs(days)} ngày`, overdue: true, soon: false };
  if (days === 0) return { text: "Hôm nay", overdue: false, soon: true };
  if (days === 1) return { text: "Mai", overdue: false, soon: true };
  return { text: `Còn ${days} ngày`, overdue: false, soon: days <= 3 };
}

export function formatDateVi(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
