import { cn } from "@/lib/utils";

import { TONE_STYLES } from "./admin-ui-tones";
import type { AdminKpi } from "./data/admin-mock-data";

/**
 * KPI card của Admin Workspace: icon nền mềm + label + số lớn + delta
 * + mini bar chart tĩnh (dữ liệu trình bày, không phải chart động).
 */
export function MetricCard({ kpi }: { kpi: AdminKpi }) {
  const tone = TONE_STYLES[kpi.tone];

  return (
    <article className="h-full rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-lg",
              tone.tile
            )}
          >
            <kpi.icon className={cn("size-[18px]", tone.icon)} />
          </span>
          <div className="min-w-0">
            <p className="text-xs leading-tight text-slate-500">{kpi.label}</p>
            <p className="text-xl font-bold leading-tight tracking-tight text-navy">
              {kpi.value}
            </p>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="flex h-7 shrink-0 items-end gap-[2px]"
        >
          {kpi.bars.map((height, index) => (
            <span
              key={`${kpi.id}-bar-${index}`}
              className={cn("w-[3px] rounded-full", tone.bar, height >= 75 ? "opacity-100" : "opacity-50")}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>

      {kpi.footnote ? (
        <p className="mt-2 text-xs text-slate-400">{kpi.footnote}</p>
      ) : null}
      <p className="text-xs font-medium text-emerald-600">{kpi.delta}</p>
    </article>
  );
}
