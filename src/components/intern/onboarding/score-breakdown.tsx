import { CheckCircle2, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

import { OVERALL_FORMULA_LABEL } from "./recruitment-scoring";
import { formatScore } from "./recruitment-scoring";
import type { RecruitmentResultData } from "./data/recruitment-mock-data";

/**
 * Card phân tích điểm của Result screen (dùng chung Đạt/Chưa đạt):
 * - Donut SVG hiển thị Overall (đã derive từ 70/30 — KHÔNG hardcode).
 * - Pill trạng thái "Đạt yêu cầu" / "Chưa đạt" — trạng thái không chỉ dựa
 *   vào màu (icon + chữ).
 * - 3 hàng: Technical (trọng số 70%), Soft Skill (30%), Overall.
 * - Chú thích công thức business rule ngay trong card.
 */

const DONUT_RADIUS = 56;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

export function ScoreBreakdown({ result }: { result: RecruitmentResultData }) {
  const { scores, overall, passed } = result;
  const clamped = Math.min(100, Math.max(0, overall));
  const dash = (clamped / 100) * DONUT_CIRCUMFERENCE;

  return (
    <section
      aria-labelledby="result-score-heading"
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-5"
    >
      <h2
        id="result-score-heading"
        className="text-base font-bold tracking-tight text-navy"
      >
        Kết quả đánh giá
      </h2>

      <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
        {/* Donut Overall */}
        <div className="relative shrink-0">
          <svg
            width="150"
            height="150"
            viewBox="0 0 150 150"
            role="img"
            aria-label={`Điểm Overall ${formatScore(overall)} trên 100`}
          >
            <circle
              cx="75"
              cy="75"
              r={DONUT_RADIUS}
              fill="none"
              strokeWidth="12"
              className="stroke-slate-100"
            />
            <circle
              cx="75"
              cy="75"
              r={DONUT_RADIUS}
              fill="none"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${DONUT_CIRCUMFERENCE - dash}`}
              transform="rotate(-90 75 75)"
              className={passed ? "stroke-emerald-500" : "stroke-amber-500"}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              aria-hidden="true"
              className="text-[32px] font-extrabold leading-none tracking-tight text-navy"
            >
              {formatScore(overall)}
            </span>
            <span aria-hidden="true" className="mt-1 text-xs font-semibold text-slate-400">
              / 100 Overall
            </span>
          </div>
          <span className="sr-only">
            {`Điểm Overall ${formatScore(overall)} trên 100`}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold",
              passed
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            )}
          >
            {passed ? (
              <CheckCircle2 className="size-4" aria-hidden="true" />
            ) : (
              <TrendingDown className="size-4" aria-hidden="true" />
            )}
            {passed ? "Đạt yêu cầu" : "Chưa đạt"}
          </span>

          <dl className="mt-3 flex flex-col gap-2.5">
            <ScoreRow
              label="Technical"
              weight="70%"
              value={scores.technical}
              barTone="bg-brand"
            />
            <ScoreRow
              label="Soft Skill"
              weight="30%"
              value={scores.soft}
              barTone="bg-violet-500"
            />
            <ScoreRow
              label="Overall"
              weight="100%"
              value={overall}
              barTone={passed ? "bg-emerald-500" : "bg-amber-500"}
              emphasized
            />
          </dl>
        </div>
      </div>

      <p className="mt-4 rounded-lg bg-slate-50 px-3.5 py-2.5 text-[13px] font-medium leading-relaxed text-slate-600">
        Công thức: <span className="font-bold text-navy">{OVERALL_FORMULA_LABEL}</span>
        {" "}— đạt yêu cầu khi Overall ≥ 70.
      </p>
    </section>
  );
}

function ScoreRow({
  label,
  weight,
  value,
  barTone,
  emphasized = false,
}: {
  label: string;
  weight: string;
  value: number;
  barTone: string;
  emphasized?: boolean;
}) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      className={cn(
        "rounded-lg px-3 py-2.5",
        emphasized ? "bg-blue-50/60" : "bg-slate-50"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <dt className={cn("text-[13px] font-semibold text-slate-700", emphasized && "text-navy")}>
          {label}
          <span className="ml-1.5 font-normal text-slate-400">({weight})</span>
        </dt>
        <dd
          className={cn(
            "text-[13px] font-bold tabular-nums",
            emphasized ? "text-navy" : "text-slate-700"
          )}
        >
          {formatScore(value)}/100
        </dd>
      </div>
      <div
        aria-hidden="true"
        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70"
      >
        <div
          className={cn("h-full rounded-full", barTone)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
