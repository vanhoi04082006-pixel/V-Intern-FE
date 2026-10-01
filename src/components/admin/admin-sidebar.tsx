import Link from "next/link";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/v-intern/logo";

import {
  ADMIN_BOTTOM_NAV,
  ADMIN_NAV_SECTIONS,
  ADMIN_OVERVIEW_NAV_ID,
  type AdminNavItem,
} from "./data/admin-mock-data";

/**
 * Sidebar của Admin Workspace — presentational, dựng theo ảnh reference.
 * Desktop: nằm cố định bên trái (cha điều khiển positioning qua className).
 * Mobile: render trong drawer của AdminWorkspace, onNavigate dùng để đóng drawer.
 *
 * Mục "Tổng quan" là link thật tới /admin (route hiện có) và đang active.
 * Các mục còn lại là section chưa implement (task sau) — render bằng button
 * trung tính để không giả link dẫn tới route 404.
 */

const itemBase =
  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40";

function NavItem({
  item,
  active,
  onNavigate,
}: {
  item: AdminNavItem;
  active?: boolean;
  onNavigate?: () => void;
}) {
  const icon = <item.icon className="size-[18px] shrink-0" aria-hidden="true" />;

  if (active) {
    return (
      <Link
        href="/admin"
        aria-current="page"
        onClick={onNavigate}
        className={cn(itemBase, "bg-blue-50 font-semibold text-brand")}
      >
        {icon}
        {item.label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onNavigate}
      className={cn(itemBase, "text-slate-600 hover:bg-slate-100 hover:text-navy")}
    >
      {icon}
      {item.label}
    </button>
  );
}

export function AdminSidebar({
  className,
  onNavigate,
}: {
  className?: string;
  /** Gọi sau khi user tương tác với một mục (dùng để đóng drawer mobile) */
  onNavigate?: () => void;
}) {
  return (
    <aside className={cn("flex min-h-0 flex-col bg-white", className)}>
      <div className="flex h-16 shrink-0 flex-col justify-center gap-0.5 border-b border-slate-100 px-5">
        <Logo className="text-xl" />
        <p className="text-[8px] font-semibold uppercase tracking-[0.24em] text-slate-400">
          Learn · Build · Belong
        </p>
      </div>

      <nav
        aria-label="Điều hướng quản trị"
        className="flex min-h-0 flex-1 flex-col px-3 py-4"
      >
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto">
          {ADMIN_NAV_SECTIONS.map((section) => (
            <div key={section.id}>
              <p className="px-3 pb-2 text-xs font-medium text-slate-400">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <NavItem
                      item={item}
                      active={item.id === ADMIN_OVERVIEW_NAV_ID}
                      onNavigate={onNavigate}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-2 shrink-0 border-t border-slate-100 pt-3">
          <NavItem item={ADMIN_BOTTOM_NAV} onNavigate={onNavigate} />
        </div>
      </nav>
    </aside>
  );
}
