import { cn } from "@/lib/utils";

import { ProgressBar } from "./intern-primitives";
import { INTERN_TONES } from "./intern-ui-tones";
import type { InternKpi } from "./data/intern-mock-data";

/**
 * Hàng 5 KPI của state active (reference: Tiến độ Sprint, Task Sprint hiện
 * tại, Điểm review trung bình, Deadline gần nhất, Lương ảo tạm tính).
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
            <article className="h-full rounded-panel border border-border bg-card p-4 shadow-app-xs">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-control",
                    toneStyle.tile
                  )}
                >
                  <KpiIcon className={cn("size-[18px]", toneStyle.icon)} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-caption leading-tight text-muted-foreground">
                    {kpi.label}
                  </p>
                  <p className="truncate text-section font-bold leading-tight tracking-tight text-foreground">
                    {kpi.value}
                  </p>
                </div>
              </div>

              {hasProgress ? (
                <div className="mt-3">
                  {kpi.note ? (
                    <p
                      className={cn(
                        "text-caption font-semibold",
                        noteToneStyle?.icon ?? "text-foreground"
                      )}
                    >
                      {kpi.note}
                    </p>
                  ) : null}
                  <ProgressBar
                    value={kpi.progress ?? 0}
                    tone={kpi.tone}
                    className="mt-2"
                  />
                </div>
              ) : kpi.note ? (
                <p
                  className={cn(
                    "mt-2 text-caption font-semibold",
                    noteToneStyle?.icon ?? "text-muted-foreground"
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
