import { ArrowRight, ChevronRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

import { TONE_STYLES } from "./admin-ui-tones";
import { ADMIN_ROLES, type AdminRoleSummary } from "./data/admin-mock-data";

/**
 * Card "Vai trò & phân quyền" — 3 tile vai trò với số quyền được cấp.
 * Nút chi tiết là visual-only (không điều hướng tới trang khác).
 */
export function RoleSummaryCard() {
  return (
    <section
      aria-labelledby="admin-roles-heading"
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="admin-roles-heading"
          className="flex items-center gap-3 text-base font-bold text-navy"
        >
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-lg bg-blue-50"
          >
            <ShieldCheck className="size-5 text-blue-600" />
          </span>
          Vai trò &amp; phân quyền
        </h2>
        <LinkButton label="Quản lý chi tiết" />
      </div>

      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {ADMIN_ROLES.map((role) => (
          <li key={role.id}>
            <RoleTile role={role} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function RoleTile({ role }: { role: AdminRoleSummary }) {
  const tone = TONE_STYLES[role.tone];

  return (
    <div className="h-full rounded-lg border border-slate-200 p-4 transition-colors hover:border-blue-200">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className={cn("grid size-9 shrink-0 place-items-center rounded-lg", tone.tile)}
        >
          <role.icon className={cn("size-5", tone.icon)} />
        </span>
        <p className={cn("text-sm font-bold", tone.name)}>{role.name}</p>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">
        {role.description}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <p className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-navy">{role.permissions}</span>
          <span className="text-xs text-slate-500">quyền được cấp</span>
        </p>
        <button
          type="button"
          aria-label={`Xem chi tiết vai trò ${role.name}`}
          className={cn(
            "grid size-7 place-items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
            tone.tile,
            tone.icon
          )}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/** Nút link-style dùng cho header card (visual-only, chưa có trang đích). */
export function LinkButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 rounded-md text-[13px] font-semibold text-brand transition-colors hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      {label}
      <ArrowRight className="size-4" aria-hidden="true" />
    </button>
  );
}
