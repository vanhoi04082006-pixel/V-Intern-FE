"use client";

import * as React from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, reviewStatusLabels } from "@/lib/client/labels";
import { submissionApi, type CodeReview } from "@/lib/client/api";
import { ToneBadge } from "@/components/shared/primitives";

/* ============ Hạn chót (icon CalendarClock khi quá hạn & chưa xong) ============ */

export function isOverdueOpen(t: { status: string; dueDate: string | null }): boolean {
  return t.status !== "done" && t.dueDate != null && new Date(t.dueDate).getTime() < Date.now();
}

export function DueDate({
  task,
  className,
}: {
  task: { status: string; dueDate: string | null };
  className?: string;
}) {
  const overdue = isOverdueOpen(task);
  if (!task.dueDate) return <span className={cn("text-faint", className)}>Không có hạn</span>;
  return (
    <span
      className={cn("inline-flex items-center gap-1 whitespace-nowrap", overdue && "text-rose", className)}
      title={overdue ? "Đã quá hạn" : undefined}
    >
      {overdue ? <CalendarClock className="size-3.5 icon" /> : null}
      {formatDate(task.dueDate)}
    </span>
  );
}

/* ============ Badge trạng thái AI review (không có trong shared badges) ============ */

const reviewToneMap: Record<string, "teal" | "amber" | "rose" | "emerald"> = {
  running: "teal",
  awaiting_instructor: "amber",
  needs_changes: "rose",
  passed: "emerald",
};

export function ReviewStatusBadge({ status }: { status: string }) {
  return (
    <ToneBadge tone={reviewToneMap[status] ?? "zinc"} dot>
      {reviewStatusLabels[status] ?? status}
    </ToneBadge>
  );
}

/* ============ Badge trạng thái sprint ============ */

const sprintToneMap: Record<string, "emerald" | "teal" | "zinc"> = {
  active: "emerald",
  todo: "teal",
  planning: "teal",
  done: "zinc",
  completed: "zinc",
};

const sprintStatusCopy: Record<string, string> = {
  active: "Đang diễn ra",
  todo: "Chưa bắt đầu",
  planning: "Đang chuẩn bị",
  done: "Hoàn thành",
  completed: "Hoàn thành",
};

export function SprintStatusBadge({ status }: { status: string }) {
  return (
    <ToneBadge tone={sprintToneMap[status] ?? "zinc"} dot>
      {sprintStatusCopy[status] ?? status}
    </ToneBadge>
  );
}

/* ============ Banner thông báo trạng thái bài nộp ============ */

export function Banner({
  tone,
  icon,
  title,
  children,
  className,
}: {
  tone: "amber" | "emerald" | "teal" | "rose";
  icon?: React.ReactNode;
  title: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  const tones: Record<string, string> = {
    amber: "border-amber/30 bg-amber/[0.07] text-amber",
    emerald: "border-emerald/30 bg-emerald/[0.07] text-emerald",
    teal: "border-teal/30 bg-teal/[0.07] text-teal",
    rose: "border-rose/30 bg-rose/[0.07] text-rose",
  };
  const icons: Record<string, React.ReactNode> = {
    amber: <AlertTriangle className="size-4 icon" />,
    emerald: <CheckCircle2 className="size-4 icon" />,
    teal: <Info className="size-4 icon" />,
    rose: <XCircle className="size-4 icon" />,
  };
  return (
    <div
      role="status"
      className={cn("flex items-start gap-3 rounded-2xl border px-4 py-3.5", tones[tone], className)}
    >
      <span className="mt-0.5 shrink-0">{icon ?? icons[tone]}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug">{title}</p>
        {children ? (
          <div className="mt-1 text-[13px] leading-relaxed text-dim">{children}</div>
        ) : null}
      </div>
    </div>
  );
}

/* ============ Vòng điểm AI review (SVG ring) ============ */

export function scoreToneOf(score: number): "emerald" | "teal" | "amber" | "rose" {
  if (score >= 80) return "emerald";
  if (score >= 60) return "teal";
  if (score >= 40) return "amber";
  return "rose";
}

export function ScoreRing({
  score,
  size = 96,
  caption,
}: {
  score: number;
  size?: number;
  caption?: string;
}) {
  const pct = Math.max(0, Math.min(100, score));
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const tone = scoreToneOf(pct);
  const toneText: Record<string, string> = {
    emerald: "text-emerald-400",
    teal: "text-teal-400",
    amber: "text-amber-400",
    rose: "text-rose-400",
  };
  const toneStroke: Record<string, string> = {
    emerald: "stroke-emerald-400",
    teal: "stroke-teal-400",
    amber: "stroke-amber-400",
    rose: "stroke-rose-400",
  };
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={7}
          className="fill-none stroke-white/[0.07]"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          className={cn(
            "fill-none transition-[stroke-dashoffset] duration-1000 ease-out",
            toneStroke[tone]
          )}
        />
      </svg>
      <div className="absolute text-center">
        <div className={cn("font-mono text-[22px] font-bold leading-none", toneText[tone])}>
          {pct}
        </div>
        <div className="mt-1 text-[10px] text-faint">{caption ?? "/ 100"}</div>
      </div>
    </div>
  );
}

/* ============ Chip nhỏ (skill tag, mã...) ============ */

export function Chip({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  tone?: "default" | "brand";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-5",
        tone === "brand"
          ? "border-brand/30 bg-brand/10 text-brand-bright"
          : "border-line bg-panel-2 text-dim",
        className
      )}
    >
      {children}
    </span>
  );
}

/* ============ Mini progress bar (dùng trong bảng) ============ */

export function MiniProgress({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-track" aria-hidden>
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand to-brand-bright"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-[11px] text-dim">{pct}%</span>
    </div>
  );
}

/* ============ Hooks ============ */

/** Giá trị debounce cho ô tìm kiếm. */
export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/** Danh sách code review của một bài nộp — tự poll mỗi 3s khi còn "running". */
export function useCodeReviews(submissionId: string | null) {
  const [reviews, setReviews] = React.useState<CodeReview[]>([]);
  const [error, setError] = React.useState<unknown>(null);
  const [revision, setRevision] = React.useState(0);

  React.useEffect(() => {
    if (!submissionId) {
      setReviews([]);
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = async () => {
      try {
        const res = await submissionApi.codeReviews(submissionId);
        if (cancelled) return;
        setError(null);
        setReviews(res.data);
        if (res.data.some((r) => r.status === "running")) {
          timer = setTimeout(tick, 3000);
        }
      } catch (err) {
        if (!cancelled) setError(err);
      }
    };
    setReviews([]);
    setError(null);
    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [submissionId, revision]);

  const reload = React.useCallback(() => setRevision((r) => r + 1), []);
  return { reviews, error, reload };
}
