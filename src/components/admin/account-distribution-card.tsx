import { ChartColumn } from "lucide-react";

import {
  ACCOUNT_DISTRIBUTION,
  ACCOUNT_DISTRIBUTION_TOTAL,
  type AccountDistributionSlice,
} from "./data/admin-mock-data";

/**
 * Card "Phân bổ tài khoản" — donut chart vẽ bằng SVG thuần (stroke-dasharray),
 * không thêm thư viện chart. Kích thước/offset tính từ percent của mock data.
 */

const RADIUS = 62;
const STROKE_WIDTH = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** Khe hở nhỏ giữa các phân đoạn (đơn vị SVG) tạo separator trắng như reference */
const SEGMENT_GAP = 3;

export function AccountDistributionCard() {
  return (
    <section
      aria-labelledby="admin-distribution-heading"
      className="h-full rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-5"
    >
      <h2
        id="admin-distribution-heading"
        className="flex items-center gap-3 text-base font-bold text-navy"
      >
        <span
          aria-hidden="true"
          className="grid size-9 place-items-center rounded-lg bg-blue-50"
        >
          <ChartColumn className="size-5 text-blue-600" />
        </span>
        Phân bổ tài khoản
      </h2>

      <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row">
        <DonutChart />

        <ul className="w-full min-w-0 flex-1 space-y-2.5">
          {ACCOUNT_DISTRIBUTION.map((slice) => (
            <li key={slice.id} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <span className="min-w-0 flex-1 text-[13px] text-slate-600">
                {slice.label}
              </span>
              <span className="text-[13px] font-semibold tabular-nums text-navy">
                {slice.count.toLocaleString("en-US")}
              </span>
              <span className="w-9 shrink-0 text-right text-xs tabular-nums text-slate-400">
                {slice.percent}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function DonutChart() {
  /** Offset tích lũy tính trước bằng reduce (thuần, không mutate khi render) */
  const segments = ACCOUNT_DISTRIBUTION.map((slice, index) => ({
    slice,
    offset: ACCOUNT_DISTRIBUTION
      .slice(0, index)
      .reduce((accumulator, preceding) => accumulator + sliceLength(preceding), 0),
  }));

  return (
    <div className="relative shrink-0">
      <svg
        viewBox="0 0 160 160"
        width={140}
        height={140}
        role="img"
        aria-label={`Phân bổ ${ACCOUNT_DISTRIBUTION_TOTAL.value} ${ACCOUNT_DISTRIBUTION_TOTAL.label} theo vai trò`}
      >
        {segments.map(({ slice, offset }) => donutSegment(slice, offset))}
        <text
          x="80"
          y="75"
          textAnchor="middle"
          className="fill-navy text-[24px] font-bold"
        >
          {ACCOUNT_DISTRIBUTION_TOTAL.value}
        </text>
        <text
          x="80"
          y="96"
          textAnchor="middle"
          className="fill-slate-400 text-[11px]"
        >
          {ACCOUNT_DISTRIBUTION_TOTAL.label}
        </text>
      </svg>
    </div>
  );
}

function sliceLength(slice: AccountDistributionSlice) {
  return (slice.percent / 100) * CIRCUMFERENCE;
}

function donutSegment(slice: AccountDistributionSlice, offset: number) {
  const length = Math.max(sliceLength(slice) - SEGMENT_GAP, 1);

  return (
    <circle
      key={slice.id}
      cx="80"
      cy="80"
      r={RADIUS}
      fill="none"
      stroke={slice.color}
      strokeWidth={STROKE_WIDTH}
      strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
      strokeDashoffset={-offset}
      transform="rotate(-90 80 80)"
    />
  );
}
