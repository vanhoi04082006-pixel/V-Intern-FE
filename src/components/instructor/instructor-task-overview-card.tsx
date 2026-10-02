import { ListChecks, Plus } from "lucide-react";

import { SectionCard } from "./instructor-primitives";
import { INSTRUCTOR_TONES } from "./instructor-ui-tones";
import { cn } from "@/lib/utils";
import { TASK_OVERVIEW } from "./data/instructor-mock-data";

/**
 * Card "Tổng quan Task (Tất cả phiên)": 4 ô To Do / Doing / Review / Done.
 * Nút "+" ở mỗi ô chỉ là trình bày (visual-only).
 */
export function InstructorTaskOverviewCard() {
  return (
    <SectionCard
      id="instructor-task-overview-card"
      icon={ListChecks}
      tone="blue"
      title="Tổng quan Task"
      titleSuffix="(Tất cả phiên)"
    >
      <ul aria-label="Tổng quan task theo trạng thái" className="grid grid-cols-2 gap-3">
        {TASK_OVERVIEW.map((cell) => {
          const tone = INSTRUCTOR_TONES[cell.tone];
          const noteTone = INSTRUCTOR_TONES[cell.noteTone];

          return (
            <li
              key={cell.id}
              className="relative rounded-lg border border-slate-200 p-3"
            >
              <button
                type="button"
                aria-label={`Thêm task vào cột ${cell.label}`}
                className="absolute right-2 top-2 grid size-6 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                <Plus className="size-3.5" aria-hidden="true" />
              </button>
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className={cn("grid size-8 shrink-0 place-items-center rounded-lg", tone.tile)}
                >
                  <cell.icon className={cn("size-4", tone.icon)} />
                </span>
                <div className="min-w-0 pr-4">
                  <p className="truncate text-xs leading-tight text-slate-500">{cell.label}</p>
                  <p className="text-lg font-bold leading-tight text-navy">{cell.count}</p>
                </div>
              </div>
              <p className={cn("mt-2 text-xs font-medium", noteTone.icon)}>{cell.note}</p>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
