import { Zap } from "lucide-react";

import { CardLinkAction, SectionCard } from "./instructor-primitives";
import { INSTRUCTOR_TONES } from "./instructor-ui-tones";
import { cn } from "@/lib/utils";
import { INSTRUCTOR_QUICK_ACTIONS } from "./data/instructor-mock-data";

/**
 * Card "Thiết lập nhanh": 6 shortcut button theo reference. Toàn bộ chỉ là
 * trình bày — không mở dialog, không mutation.
 */
export function InstructorQuickSettingsCard() {
  return (
    <SectionCard
      id="instructor-quick-settings-card"
      icon={Zap}
      tone="blue"
      title="Thiết lập nhanh"
      actions={<CardLinkAction label="Xem thêm" />}
    >
      <ul
        aria-label="Thao tác nhanh"
        className="grid grid-cols-2 gap-2 2xl:grid-cols-3"
      >
        {INSTRUCTOR_QUICK_ACTIONS.map((action) => {
          const tone = INSTRUCTOR_TONES[action.tone];

          return (
            <li key={action.id}>
              <button
                type="button"
                className="flex w-full items-center gap-1 rounded-lg border border-slate-200 px-2 py-2.5 text-left text-[11.5px] font-medium text-navy transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                <action.icon className={cn("size-3.5 shrink-0", tone.icon)} aria-hidden="true" />
                <span className="truncate">{action.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
