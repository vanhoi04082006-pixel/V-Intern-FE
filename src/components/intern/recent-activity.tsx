import { CheckCircle2, History } from "lucide-react";
import { cn } from "@/lib/utils";

import { CardLinkAction, SectionCard } from "./intern-primitives";
import { INTERN_TONES } from "./intern-ui-tones";
import type { InternActivityItem } from "./data/intern-mock-data";

/**
 * Card "Hoạt động gần đây" (state empty): timeline các mốc trong quá trình
 * tuyển dụng → chờ phân công. Icon kiểm tra xanh = đã hoàn thành, chấm xanh
 * dương = đang chờ (phân biệt bằng icon, không chỉ màu).
 */
export function RecentActivityCard({
  activities,
  actionLabel,
}: {
  activities: InternActivityItem[];
  actionLabel: string;
}) {
  return (
    <SectionCard
      id="hoat-dong-gan-day"
      icon={History}
      tone="blue"
      title="Hoạt động gần đây"
      actions={<CardLinkAction label={actionLabel} />}
    >
      <ol className="flex flex-col">
        {activities.map((item, index) => {
          const toneStyle = INTERN_TONES[item.tone];
          const isDone = item.tone === "green";

          return (
            <li key={item.id} className="relative flex gap-3.5 pb-5 last:pb-0">
              {index < activities.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute left-[13px] top-8 h-[calc(100%-2rem)] w-px bg-slate-200"
                />
              ) : null}
              <span
                aria-hidden="true"
                className={cn(
                  "z-10 grid size-7 shrink-0 place-items-center rounded-full",
                  toneStyle.tile
                )}
              >
                {isDone ? (
                  <CheckCircle2 className={cn("size-4", toneStyle.icon)} />
                ) : (
                  <span className={cn("size-2 rounded-full", toneStyle.bar)} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="text-sm font-semibold leading-snug text-navy">
                    {item.title}
                  </p>
                  <time className="shrink-0 text-xs text-slate-400">
                    {item.timeLabel}
                  </time>
                </div>
                <p className="mt-0.5 text-[13px] leading-relaxed text-slate-500">
                  {item.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </SectionCard>
  );
}
