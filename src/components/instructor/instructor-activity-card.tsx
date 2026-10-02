import { Bell } from "lucide-react";

import { CardLinkAction, SectionCard } from "./instructor-primitives";
import { INSTRUCTOR_TONES } from "./instructor-ui-tones";
import { cn } from "@/lib/utils";
import { RECENT_ACTIVITY } from "./data/instructor-mock-data";

/**
 * Card "Hoạt động gần đây": timeline gọn với dot màu semantic + text + time
 * theo reference. Dữ liệu mock, thuần trình bày.
 */
export function InstructorActivityCard() {
  return (
    <SectionCard
      id="instructor-activity-card"
      icon={Bell}
      tone="blue"
      title="Hoạt động gần đây"
      actions={<CardLinkAction label="Xem tất cả" />}
      bodyClassName="p-4 sm:p-5"
    >
      <ul aria-label="Nhật ký hoạt động gần đây" className="space-y-3">
        {RECENT_ACTIVITY.map((item) => (
          <li key={item.id} className="flex items-start gap-2.5">
            <span
              aria-hidden="true"
              className={cn(
                "mt-[7px] size-2 shrink-0 rounded-full",
                INSTRUCTOR_TONES[item.tone].bar
              )}
            />
            <p className="min-w-0 flex-1 text-[13px] leading-snug text-slate-600">
              {item.text}
            </p>
            <time className="shrink-0 text-xs text-slate-400">{item.time}</time>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
