import Link from "next/link";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/v-intern/logo";

import {
  INSTRUCTOR_BOTTOM_NAV,
  INSTRUCTOR_NAV_ITEMS,
  INSTRUCTOR_OVERVIEW_NAV_ID,
  type InstructorNavItem,
} from "./data/instructor-mock-data";

/**
 * Sidebar của Instructor Workspace — presentational, dựng theo ảnh reference.
 * Desktop: nằm cố định bên trái (cha điều khiển positioning qua className).
 * Mobile: render trong drawer của InstructorWorkspace, onNavigate đóng drawer.
 *
 * Giống Admin Workspace: chỉ "Tổng quan" là link thật tới route hiện có
 * (/instructor); các mục còn lại là section chưa implement — render bằng
 * button trung tính để không giả link dẫn tới route 404. Component tách
 * biệt hoàn toàn khỏi admin sidebar (không import chéo) để tránh leakage.
 */

const itemBase =
  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40";

function NavItem({
  item,
  active,
  onNavigate,
}: {
  item: InstructorNavItem;
  active?: boolean;
  onNavigate?: () => void;
}) {
  const icon = <item.icon className="size-[18px] shrink-0" aria-hidden="true" />;

  if (active) {
    return (
      <Link
        href={item.href ?? "/instructor"}
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
      {typeof item.badge === "number" && item.badge > 0 ? (
        <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
          {item.badge}
        </span>
      ) : null}
    </button>
  );
}

export function InstructorSidebar({
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
        aria-label="Điều hướng giảng viên"
        className="flex min-h-0 flex-1 flex-col px-3 py-4"
      >
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
          <div>
            <p className="px-3 pb-2 text-xs font-medium text-slate-400">Giảng viên</p>
            <ul className="space-y-0.5">
              {INSTRUCTOR_NAV_ITEMS.map((item) => (
                <li key={item.id}>
                  <NavItem
                    item={item}
                    active={item.id === INSTRUCTOR_OVERVIEW_NAV_ID}
                    onNavigate={onNavigate}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-2 shrink-0 border-t border-slate-100 pt-3">
          <NavItem item={INSTRUCTOR_BOTTOM_NAV} onNavigate={onNavigate} />
        </div>
      </nav>
    </aside>
  );
}
