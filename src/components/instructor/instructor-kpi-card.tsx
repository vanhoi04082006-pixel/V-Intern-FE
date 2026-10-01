import { cn } from "@/lib/utils";

import { INSTRUCTOR_TONES } from "./instructor-ui-tones";
import { ProgressBar } from "./instructor-primitives";
import type { InstructorKpi } from "./data/instructor-mock-data";

/**
 * KPI card của Instructor Workspace: icon nền mềm + label + số lớn + note
 * màu semantic + mini bar chart tĩnh. Riêng KPI có `progress` (Tỷ lệ hoàn
 * thành sprint) hiển thị progress bar thay mini bars, note đậm màu navy.
 */
export function InstructorKpiCard({ kpi }: { kpi: InstructorKpi }) {
  const tone = INSTRUCTOR_TONES[kpi.tone];
  const noteTone = INSTRUCTOR_TONES[kpi.noteTone];
  const hasProgress = typeof kpi.progress === "number";

  return (
    <article className="h-full rounded-xl border border-slate-200 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className={cn("grid size-9 shrink-0 place-items-center rounded-lg", tone.tile)}
          >
            <kpi.icon className={cn("size-[18px]", tone.icon)} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11px] leading-tight text-slate-500">{kpi.label}</p>
            <p className="text-xl font-bold leading-tight tracking-tight text-navy">
              {kpi.value}
            </p>
          </div>
        </div>

        {!hasProgress && kpi.bars.length > 0 ? (
          <div aria-hidden="true" className="flex h-7 shrink-0 items-end gap-[2px]">
            {kpi.bars.map((height, index) => (
              <span
                key={`${kpi.id}-bar-${index}`}
                className={cn(
                  "w-[3px] rounded-full",
                  tone.bar,
                  height >= 75 ? "opacity-100" : "opacity-50"
                )}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        ) : null}
      </div>

      {hasProgress ? (
        <div className="mt-2.5">
          <p className="text-xs font-bold text-navy">{kpi.note}</p>
          <ProgressBar value={kpi.progress ?? 0} tone={kpi.tone} className="mt-1.5" />
        </div>
      ) : (
        <p className={cn("mt-2 text-xs font-medium", noteTone.icon)}>{kpi.note}</p>
      )}
    </article>
  );
}
