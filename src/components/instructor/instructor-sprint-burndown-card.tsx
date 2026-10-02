import { ChartColumn, ChevronDown } from "lucide-react";

import { SectionCard } from "./instructor-primitives";
import { INSTRUCTOR_TONES } from "./instructor-ui-tones";
import { cn } from "@/lib/utils";
import {
  BURNDOWN_CHART,
  SPRINT_METRICS,
  SPRINT_SELECTOR_LABEL,
} from "./data/instructor-mock-data";

/**
 * Card "Tiến độ Sprint & Burndown": 4 mini metric + burndown chart vẽ bằng
 * SVG thuần (không thêm chart dependency — yêu cầu task). Đường thực tế
 * (solid, có area nhẹ + dots), đường lý tưởng (dashed reference) và một
 * annotation dạng tooltip ghim tại điểm dữ liệu thực tế cuối.
 * Toàn bộ số liệu là mock presentation.
 */

const CHART_W = 520;
const CHART_H = 236;
const PAD = { top: 14, right: 14, bottom: 26, left: 34 };

const BRAND_COLOR = "#0c67ed";

export function InstructorSprintBurndownCard() {
  const { points, max, yTicks, xLabelIndices, annotation, legend } = BURNDOWN_CHART;

  const plotW = CHART_W - PAD.left - PAD.right;
  const plotH = CHART_H - PAD.top - PAD.bottom;
  const stepX = plotW / (points.length - 1);
  const xAt = (index: number) => PAD.left + index * stepX;
  const yAt = (value: number) => PAD.top + plotH - (value / max) * plotH;

  const actualPoints = points
    .map((point, index) => ({ ...point, index }))
    .filter((point): point is { date: string; actual: number; ideal: number; index: number } =>
      typeof point.actual === "number"
    );

  const actualLine = actualPoints
    .map((point) => `${xAt(point.index).toFixed(1)},${yAt(point.actual).toFixed(1)}`)
    .join(" ");
  const idealLine = points
    .map((point, index) => `${xAt(index).toFixed(1)},${yAt(point.ideal).toFixed(1)}`)
    .join(" ");

  // Area dưới đường thực tế — fill nhẹ giúp đọc xu hướng, thuần trang trí.
  const lastActual = actualPoints[actualPoints.length - 1];
  const baselineY = yAt(0);
  const areaPath = `M ${xAt(actualPoints[0].index).toFixed(1)} ${baselineY} ${actualPoints
    .map((point) => `L ${xAt(point.index).toFixed(1)} ${yAt(point.actual).toFixed(1)}`)
    .join(" ")} L ${xAt(lastActual.index).toFixed(1)} ${baselineY} Z`;

  const annotationAnchorX = xAt(annotation.index);

  return (
    <SectionCard
      id="instructor-sprint-card"
      icon={ChartColumn}
      tone="blue"
      title="Tiến độ Sprint & Burndown"
      actions={
        <button
          type="button"
          aria-label={`Chọn sprint: ${SPRINT_SELECTOR_LABEL}`}
          className="inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-semibold text-navy transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          {SPRINT_SELECTOR_LABEL}
          <ChevronDown className="size-4 text-slate-400" aria-hidden="true" />
        </button>
      }
    >
      <ul aria-label="Chỉ số sprint hiện tại" className="grid grid-cols-2 gap-3">
        {SPRINT_METRICS.map((metric) => {
          const tone = INSTRUCTOR_TONES[metric.tone];

          return (
            <li
              key={metric.id}
              className="flex items-center gap-2 rounded-lg border border-slate-200 p-2.5"
            >
              <span
                aria-hidden="true"
                className={cn("grid size-7 shrink-0 place-items-center rounded-lg", tone.tile)}
              >
                <metric.icon className={cn("size-4", tone.icon)} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[10.5px] leading-tight text-slate-500">{metric.label}</p>
                <p className="flex items-baseline gap-1">
                  <span className="text-[15px] font-bold leading-tight text-navy">
                    {metric.value}
                  </span>
                  {metric.note ? (
                    <span className={cn("whitespace-nowrap text-[10.5px] font-semibold", INSTRUCTOR_TONES[metric.noteTone ?? "slate"].icon)}>
                      {metric.note}
                    </span>
                  ) : null}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <ul aria-label="Chú giải biểu đồ burndown" className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5">
        <li className="flex items-center gap-2 text-xs text-slate-500">
          <span aria-hidden="true" className="h-0.5 w-5 rounded-full bg-brand" />
          {legend.actual}
        </li>
        <li className="flex items-center gap-2 text-xs text-slate-500">
          <span
            aria-hidden="true"
            className="h-0 w-5 border-t-2 border-dashed border-slate-400"
          />
          {legend.ideal}
        </li>
      </ul>

      <div className="relative mt-3">
        <svg
          role="img"
          aria-label={`Burndown Sprint 03. ${BURNDOWN_CHART.description}`}
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className="h-auto w-full"
        >
          {/* Lưới ngang + nhãn trục y */}
          {yTicks.map((tick) => (
            <g key={`y-${tick}`}>
              <line
                x1={PAD.left}
                x2={CHART_W - PAD.right}
                y1={yAt(tick)}
                y2={yAt(tick)}
                stroke="#e2e8f0"
                strokeWidth={1}
                strokeDasharray={tick === 0 ? undefined : "3 4"}
              />
              <text
                x={PAD.left - 8}
                y={yAt(tick) + 3.5}
                textAnchor="end"
                fontSize={10}
                fill="#94a3b8"
              >
                {tick}
              </text>
            </g>
          ))}

          {/* Nhãn trục x tại các mốc được chọn */}
          {xLabelIndices.map((index) => (
            <text
              key={`x-${index}`}
              x={xAt(index)}
              y={CHART_H - 8}
              textAnchor="middle"
              fontSize={10}
              fill="#94a3b8"
            >
              {points[index]?.date}
            </text>
          ))}

          {/* Area dưới đường thực tế */}
          <path d={areaPath} fill={BRAND_COLOR} opacity={0.08} />

          {/* Đường lý tưởng (reference, dashed) */}
          <polyline
            points={idealLine}
            fill="none"
            stroke="#94a3b8"
            strokeWidth={1.75}
            strokeDasharray="5 5"
          />

          {/* Đường thực tế */}
          <polyline
            points={actualLine}
            fill="none"
            stroke={BRAND_COLOR}
            strokeWidth={2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Dots trên đường thực tế */}
          {actualPoints.map((point) => (
            <circle
              key={`dot-${point.index}`}
              cx={xAt(point.index)}
              cy={yAt(point.actual)}
              r={3.5}
              fill={BRAND_COLOR}
              stroke="#ffffff"
              strokeWidth={1.5}
            />
          ))}
        </svg>

        {/* Tooltip-style annotation ghim tại điểm thực tế cuối — div phủ để
            giữ text sắc nét và wrap dễ hơn SVG text. */}
        <div
          className="absolute top-6 w-[150px] rounded-lg border border-slate-200 bg-white p-2.5 text-[11px] leading-snug shadow-md sm:w-[164px]"
          style={{ left: `min(calc(100% - 164px), ${((annotationAnchorX + 10) / CHART_W) * 100}%)` }}
        >
          <p className="font-bold text-navy">{annotation.date}</p>
          <p className="mt-1 flex items-center gap-1.5 text-slate-600">
            <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-brand" />
            {legend.actual}: <span className="font-bold text-navy">{annotation.actual}</span>
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-slate-600">
            <span
              aria-hidden="true"
              className="h-0 w-2.5 shrink-0 border-t-2 border-dashed border-slate-400"
            />
            {legend.ideal}: <span className="font-bold text-navy">{annotation.ideal}</span>
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
