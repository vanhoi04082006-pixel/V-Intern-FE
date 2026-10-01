import { Activity } from "lucide-react";

import { LinkButton } from "./role-summary-card";
import {
  SERVICE_STATE_LABEL,
  SYSTEM_SERVICES,
} from "./data/admin-mock-data";

/**
 * Card "Trạng thái hệ thống" — dịch vụ, độ trễ, uptime (mock presentation).
 * Tất cả dịch vụ đang "Hoạt động tốt" như reference.
 */
export function SystemStatusCard() {
  return (
    <section
      aria-labelledby="admin-status-heading"
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="admin-status-heading"
          className="flex items-center gap-3 text-base font-bold text-navy"
        >
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-lg bg-emerald-50"
          >
            <Activity className="size-5 text-emerald-600" />
          </span>
          Trạng thái hệ thống
        </h2>
        <LinkButton label="Xem chi tiết" />
      </div>

      <ul className="mt-2 divide-y divide-slate-100">
        {SYSTEM_SERVICES.map((service) => (
          <li key={service.id} className="flex items-center gap-2.5 py-3">
            <span
              aria-hidden="true"
              className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-50"
            >
              <service.icon className="size-[18px] text-emerald-600" />
            </span>
            <p className="min-w-0 flex-1 text-[13px] font-semibold leading-snug text-navy">
              {service.name}
            </p>
            <span className="flex shrink-0 items-center gap-1.5">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-emerald-500"
              />
              <span className="hidden text-xs font-medium text-emerald-600 lg:inline">
                {SERVICE_STATE_LABEL}
              </span>
            </span>
            <span className="w-12 shrink-0 text-right text-[13px] tabular-nums text-slate-500">
              {service.latencyMs} ms
            </span>
            <span className="w-12 shrink-0 text-right text-[13px] font-medium tabular-nums text-navy">
              {service.uptime}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400 lg:hidden">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-500" />
        Tất cả dịch vụ {SERVICE_STATE_LABEL.toLowerCase()}
      </p>
    </section>
  );
}
