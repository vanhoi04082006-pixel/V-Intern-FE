import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

import { LinkButton } from "./role-summary-card";
import { ACTIVITY_LOG } from "./data/admin-mock-data";

/**
 * Card "Nhật ký hoạt động" — timeline mock: thời điểm + hành động + actor.
 * Dòng màu đỏ = sự kiện đáng chú ý (đăng nhập thất bại).
 */
export function ActivityLogCard() {
  return (
    <section
      aria-labelledby="admin-activity-heading"
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="admin-activity-heading"
          className="flex items-center gap-3 text-base font-bold text-navy"
        >
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-lg bg-blue-50"
          >
            <FileText className="size-5 text-blue-600" />
          </span>
          Nhật ký hoạt động
        </h2>
        <LinkButton label="Xem tất cả" />
      </div>

      <ul className="mt-2 divide-y divide-slate-100">
        {ACTIVITY_LOG.map((entry) => (
          <li key={entry.id} className="py-2.5">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  entry.tone === "red" ? "bg-red-500" : "bg-blue-500"
                )}
              />
              <span className="w-10 shrink-0 text-xs tabular-nums text-slate-400">
                {entry.time}
              </span>
              <span className="min-w-0 flex-1 text-[13px] font-medium text-slate-700">
                {entry.action}
              </span>
            </div>
            <p className="ml-[26px] mt-1 truncate text-xs text-slate-400">
              {entry.actor}
              {entry.role ? (
                <span className="text-slate-300"> ({entry.role})</span>
              ) : null}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
