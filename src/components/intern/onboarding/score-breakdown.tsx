import { CheckCircle2, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

import { OVERALL_FORMULA_LABEL } from "./recruitment-scoring";
import { formatScore } from "./recruitment-scoring";
import type { RecruitmentResultData } from "./data/recruitment-mock-data";

/**
 * Card phân tích điểm của Result screen (dùng chung Đạt/Chưa đạt) —
 * COMPACT theo reference 4A/4B: header có badge công thức bên phải,
 * donut nhỏ (120px) + pill trạng thái bên dưới, 3 hàng điểm bên phải.
 * - Donut SVG hiển thị Overall (đã derive từ 70/30 — KHÔNG hardcode).
 * - Pill trạng thái "Đạt yêu cầu" / "Chưa đạt" — trạng thái không chỉ
 *   dựa vào màu (icon + chữ).
 * - 3 hàng: Technical (trọng số 70%), Soft Skill (30%), Overall.
 */

const DONUT_RADIUS = 52;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

export function ScoreBreakdown({ result }: { result: RecruitmentResultData }) {
  const { scores, overall, passed } = result;
  const clamped = Math.min(100, Math.max(0, overall));
  const dash = (clamped / 100) * DONUT_CIRCUMFERENCE;

  return (
    <section
      aria-labelledby="result-score-heading"
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="result-score-heading"
          className="flex items-center gap-2 text-base font-bold tracking-tight text-navy"
        >
          Kết quả đánh giá
        </h2>
        {/* Badge công thức như reference — inner span giữ chuỗi công thức
            CHÍNH XÁC (dùng chung cho test), phần prefix chỉ sr-only. */}
        <p className="hidden items-center rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500 sm:inline-flex">
          <span className="sr-only">Công thức tính: </span>
          <span className="font-semibold text-navy">
            {OVERALL_FORMULA_LABEL}
          </span>
          <span aria-hidden="true" className="mx-1.5 text-slate-300">
            |
          </span>
          <span>Đậu khi trên 70 · 50–70: đề xuất vai trò khác · dưới 50: chưa đạt</span>
        </p>
      </div>

      <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
        {/* Donut Overall + pill trạng thái bên dưới (reference) */}
        <div className="flex shrink-0 flex-col items-center">
          <div className="relative">
            <svg
              width="120"
              height="120"
              viewBox="0 0 120 120"
              role="img"
              aria-label={`Điểm Overall ${formatScore(overall)} trên 100`}
            >
              <circle
                cx="60"
                cy="60"
                r={DONUT_RADIUS}
                fill="none"
                strokeWidth="11"
                className="stroke-slate-100"
              />
              <circle
                cx="60"
                cy="60"
                r={DONUT_RADIUS}
                fill="none"
                strokeWidth="11"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${DONUT_CIRCUMFERENCE - dash}`}
                transform="rotate(-90 60 60)"
                className={passed ? "stroke-emerald-500" : "stroke-amber-500"}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                aria-hidden="true"
                className="text-[26px] font-extrabold leading-none tracking-tight text-navy"
              >
                {formatScore(overall)}
              </span>
              <span
                aria-hidden="true"
                className="mt-0.5 text-[11px] font-semibold text-slate-500"
              >
                / 100 Overall
              </span>
            </div>
            <span className="sr-only">
              {`Điểm Overall ${formatScore(overall)} trên 100`}
            </span>
          </div>
          <span
            className={cn(
              "mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-bold",
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
        </div>

        {/* 3 hàng điểm — compact */}
        <dl className="min-w-0 flex-1">
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
        "rounded-lg px-3 py-2 [&+&]:mt-1.5",
        emphasized ? "bg-blue-50/60" : "bg-slate-50"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <dt className={cn("text-[13px] font-semibold text-slate-700", emphasized && "text-navy")}>
          {label}
          <span className="ml-1.5 font-normal text-slate-500">({weight})</span>
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
