import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

import { LinkButton } from "./role-summary-card";
import { SYSTEM_ALERTS, type SystemAlert } from "./data/admin-mock-data";

/**
 * Card "Cảnh báo hệ thống" — danh sách cảnh báo mock với badge mức độ.
 * "Cảnh báo" = severity cao (đỏ), "Chú ý" = mức chú ý (vàng).
 */
export function SystemAlertsCard() {
  return (
    <section
      aria-labelledby="admin-alerts-heading"
      className="h-full rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="admin-alerts-heading"
          className="flex items-center gap-3 text-base font-bold text-navy"
        >
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-lg bg-red-50"
          >
            <TriangleAlert className="size-5 text-red-600" />
          </span>
          Cảnh báo hệ thống
        </h2>
        <LinkButton label="Xem tất cả" />
      </div>

      <ul className="mt-3 divide-y divide-slate-100">
        {SYSTEM_ALERTS.map((alert) => (
          <li key={alert.id} className="flex items-center gap-2.5 py-2.5">
            <TriangleAlert
              aria-hidden="true"
              className={cn(
                "size-4 shrink-0",
                alert.severity === "warning" ? "text-red-500" : "text-amber-500"
              )}
            />
            <span className="w-9 shrink-0 text-xs tabular-nums text-slate-400">
              {alert.time}
            </span>
            <span className="min-w-0 flex-1 text-xs leading-snug text-slate-700">
              {alert.message}
            </span>
            <AlertBadge severity={alert.severity} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function AlertBadge({ severity }: { severity: SystemAlert["severity"] }) {
  const isWarning = severity === "warning";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-md px-1.5 py-1 text-[11px] font-medium",
        isWarning ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
      )}
    >
      {isWarning ? "Cảnh báo" : "Chú ý"}
    </span>
  );
}
