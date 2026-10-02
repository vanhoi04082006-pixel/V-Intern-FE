import { cn } from "@/lib/utils";

import { ProgressBar } from "./intern-primitives";
import { INTERN_TONES } from "./intern-ui-tones";
import type { InternKpi } from "./data/intern-mock-data";

/**
 * Hàng 5 KPI của state active (reference: Tiến độ Sprint, Task của tôi,
 * Điểm review trung bình, Deadline gần nhất, Lương ảo tạm tính).
 * KPI có `progress` hiển thị progress bar; note màu semantic.
 * Grid: 1 cột mobile → 2 cột sm → 3 lg → 5 xl (tablet giảm cột theo task).
 */
export function InternKpiGrid({ kpis }: { kpis: InternKpi[] }) {
  return (
    <ul
      aria-label="Chỉ số tổng quan"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
    >
      {kpis.map((kpi) => {
        const toneStyle = INTERN_TONES[kpi.tone];
        const noteToneStyle = kpi.noteTone
          ? INTERN_TONES[kpi.noteTone]
          : undefined;
        const hasProgress = typeof kpi.progress === "number";
        const KpiIcon = kpi.icon;

        return (
          <li key={kpi.id}>
            <article className="h-full rounded-xl border border-slate-200 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
              <div className="flex items-start gap-2.5">
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-lg",
                    toneStyle.tile
                  )}
                >
                  <KpiIcon className={cn("size-[18px]", toneStyle.icon)} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[11px] leading-tight text-slate-500">
                    {kpi.label}
                  </p>
                  <p className="truncate text-xl font-bold leading-tight tracking-tight text-navy">
                    {kpi.value}
                  </p>
                </div>
              </div>

              {hasProgress ? (
                <div className="mt-2.5">
                  {kpi.note ? (
                    <p
                      className={cn(
                        "text-xs font-semibold",
                        noteToneStyle?.icon ?? "text-navy"
                      )}
                    >
                      {kpi.note}
                    </p>
                  ) : null}
                  <ProgressBar
                    value={kpi.progress ?? 0}
                    tone={kpi.tone}
                    className="mt-1.5"
                  />
                </div>
              ) : kpi.note ? (
                <p
                  className={cn(
                    "mt-2 text-xs font-semibold",
                    noteToneStyle?.icon ?? "text-slate-500"
                  )}
                >
                  {kpi.note}
                </p>
              ) : null}
            </article>
          </li>
        );
      })}
    </ul>
  );
}
