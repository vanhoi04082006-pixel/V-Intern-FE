"use client";

import * as React from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { navigate } from "@/lib/client/router";
import { AnimatedNumber } from "@/components/shared/counters";

/* ============ Ngưỡng điểm (≥80 emerald · ≥60 teal · ≥40 amber · <40 rose) ============ */

export type ScoreTone = "emerald" | "teal" | "amber" | "rose";

export function scoreToneOf(score: number): ScoreTone {
  if (score >= 80) return "emerald";
  if (score >= 60) return "teal";
  if (score >= 40) return "amber";
  return "rose";
}

const STROKE_VAR: Record<ScoreTone, string> = {
  emerald: "var(--color-brand-bright)",
  teal: "var(--color-teal)",
  amber: "var(--color-amber)",
  rose: "var(--color-rose)",
};

const BAR_BG: Record<ScoreTone, string> = {
  emerald: "bg-brand-bright",
  teal: "bg-teal",
  amber: "bg-amber",
  rose: "bg-rose",
};

const TEXT_COLOR: Record<ScoreTone, string> = {
  emerald: "text-brand-bright",
  teal: "text-teal",
  amber: "text-amber",
  rose: "text-rose",
};

/** Màu chữ cho một điểm số theo ngưỡng (dùng cho số lớn). */
export function scoreTextClass(score: number | null | undefined): string {
  if (score === null || score === undefined) return "text-dim";
  return TEXT_COLOR[scoreToneOf(score)];
}

/** Định dạng số kiểu vi-VN, tối đa 1 chữ số thập phân (57.1 → "57,1"). */
export function fmtNum(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/* ============ Nút quay lại trang danh sách ============ */

export function BackButton({ to, label }: { to: string; label: string }) {
  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className="mb-4 inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-panel px-3 text-xs font-medium text-dim transition-colors hover:border-line-strong hover:text-ink"
    >
      <ArrowLeft className="size-3.5 icon" />
      {label}
    </button>
  );
}

/* ============ Vòng điểm SVG (ring) ============ */

export function ScoreRing({
  score,
  size = 176,
  thickness = 12,
  caption = "điểm",
  className,
}: {
  score: number | null;
  size?: number;
  thickness?: number;
  caption?: string;
  className?: string;
}) {
  const [on, setOn] = React.useState(false);

  React.useEffect(() => {
    const raf = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = score === null ? 0 : Math.max(0, Math.min(100, score)) / 100;
  const offset = on ? circumference * (1 - pct) : circumference;
  const tone: ScoreTone = score === null ? "teal" : scoreToneOf(score);

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={score === null ? "Chưa có điểm" : `Tổng điểm ${fmtNum(score)} trên 100`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={thickness}
          className="stroke-track"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={STROKE_VAR[tone]}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-[1100ms] ease-out"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          {score === null ? (
            <span className="font-mono text-4xl font-bold text-dim">—</span>
          ) : (
            <AnimatedNumber
              value={score}
              decimals={Number.isInteger(score) ? 0 : 1}
              className="font-mono text-4xl font-bold text-ink"
            />
          )}
          <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-faint">
            {caption}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ Thanh điểm theo ngưỡng ============ */

export function ScoreBar({
  score,
  className,
}: {
  score: number | null | undefined;
  className?: string;
}) {
  const pct = score === null || score === undefined ? 0 : Math.max(0, Math.min(100, score));
  const tone: ScoreTone = score === null || score === undefined ? "teal" : scoreToneOf(score);
  return (
    <div
      className={cn("h-1.5 overflow-hidden rounded-full bg-track", className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-700 ease-out", BAR_BG[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
