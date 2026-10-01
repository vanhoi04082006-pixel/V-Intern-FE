import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";

import { LinkButton } from "./role-summary-card";
import { TONE_STYLES } from "./admin-ui-tones";
import { QUICK_SETTINGS } from "./data/admin-mock-data";

/**
 * Card "Thiết lập nhanh" — lối tắt tới các nhóm cài đặt (visual-only).
 * 5 tile: 2x2 + tile cuối chiếm full width để bố cục cân đối.
 */
export function QuickSettingsCard() {
  return (
    <section
      aria-labelledby="admin-quick-settings-heading"
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="admin-quick-settings-heading"
          className="flex items-center gap-3 text-base font-bold text-navy"
        >
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-lg bg-blue-50"
          >
            <Settings className="size-5 text-blue-600" />
          </span>
          Thiết lập nhanh
        </h2>
        <LinkButton label="Truy cập cài đặt" />
      </div>

      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {QUICK_SETTINGS.map((item, index) => (
          <li
            key={item.id}
            className={index === QUICK_SETTINGS.length - 1 ? "sm:col-span-2" : undefined}
          >
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left transition-colors hover:border-blue-200 hover:bg-slate-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-lg",
                  TONE_STYLES[item.tone].tile
                )}
              >
                <item.icon className={cn("size-[18px]", TONE_STYLES[item.tone].icon)} />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold leading-snug text-navy">
                  {item.title}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-slate-500">
                  {item.description}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
