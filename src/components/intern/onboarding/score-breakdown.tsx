import {
  IconCircleCheck,
  IconTrendingDown,
} from "@/components/v-intern/icons";
import { cn } from "@/lib/utils";

import { OVERALL_FORMULA_LABEL } from "./recruitment-scoring";
import { formatScore } from "./recruitment-scoring";
import type { RecruitmentResultData } from "./recruitment-model";

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
      className="rounded-panel border border-border bg-card p-4 shadow-app-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="result-score-heading"
          className="flex items-center gap-2 text-subsection font-bold tracking-tight text-foreground"
        >
          Kết quả đánh giá
        </h2>
        {/* Badge công thức như reference — inner span giữ chuỗi công thức
            CHÍNH XÁC (dùng chung cho test), phần prefix chỉ sr-only. */}
        <p className="hidden items-center rounded-control bg-background px-3 py-1 text-caption font-medium text-muted-foreground sm:inline-flex">
          <span className="sr-only">Công thức tính: </span>
          <span className="font-semibold text-foreground">
            {OVERALL_FORMULA_LABEL}
          </span>
          <span aria-hidden="true" className="mx-2 text-muted-foreground">
            |
          </span>
          <span>Đậu khi trên 70, 50 đến 70: đề xuất vai trò khác, dưới 50: chưa đạt</span>
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
                className="stroke-muted-foreground"
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
                className={passed ? "stroke-success" : "stroke-warning"}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                aria-hidden="true"
                className="text-page font-extrabold leading-none tracking-tight text-foreground"
              >
                {formatScore(overall)}
              </span>
              <span
                aria-hidden="true"
                className="mt-1 text-caption font-semibold text-muted-foreground"
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
              "mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-small font-bold",
              passed
                ? "bg-success-subtle text-success"
                : "bg-warning-subtle text-warning"
            )}
          >
            {passed ? (
              <IconCircleCheck className="size-4" aria-hidden="true" />
            ) : (
              <IconTrendingDown className="size-4" aria-hidden="true" />
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
            barTone="bg-primary"
          />
          <ScoreRow
            label="Soft Skill"
            weight="30%"
            value={scores.soft}
            barTone="bg-info"
          />
          <ScoreRow
            label="Overall"
            weight="100%"
            value={overall}
            barTone={passed ? "bg-success" : "bg-warning"}
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
        "rounded-control px-3 py-2 [&+&]:mt-2",
        emphasized ? "bg-accent" : "bg-background"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <dt className={cn("text-small font-semibold text-foreground", emphasized && "text-foreground")}>
          {label}
          <span className="ml-2 font-normal text-muted-foreground">({weight})</span>
        </dt>
        <dd
          className={cn(
            "text-small font-bold tabular-nums",
            emphasized ? "text-foreground" : "text-foreground"
          )}
        >
          {formatScore(value)}/100
        </dd>
      </div>
      <div
        aria-hidden="true"
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn("h-full rounded-full", barTone)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
