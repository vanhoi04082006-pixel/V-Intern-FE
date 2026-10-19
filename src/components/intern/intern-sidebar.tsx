import Link from "next/link";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/v-intern/logo";

import {
  INTERN_BOTTOM_NAV,
} from "./workspace-presentation";
import type { InternNavGroup, InternNavItem } from "./data/intern-mock-data";

/** Shared desktop/drawer navigation. InternShell supplies route availability
 * from the current workspace lifecycle; unavailable items have no destination.
 */

const itemBase =
  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40";

function NavItem({
  item,
  active,
  onNavigate,
}: {
  item: InternNavItem;
  active?: boolean;
  onNavigate?: () => void;
}) {
  const icon = (
    <item.icon className="size-[18px] shrink-0" aria-hidden="true" />
  );

  if (active) {
    return (
      <Link
        href={item.href ?? "/intern"}
        aria-current="page"
        onClick={onNavigate}
        className={cn(itemBase, "bg-blue-50 font-semibold text-brand")}
      >
        {icon}
        {item.label}
      </Link>
    );
  }

  // State waiting: Sprint/Dự án cần Project đã phân công — render disabled
  // muted (không giả link, không điều hướng sai). State active không có item
  // unavailable nên không ảnh hưởng.
  if (item.unavailable) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        title="Chưa khả dụng — cần dự án được phân công"
        className={cn(
          itemBase,
          "cursor-not-allowed text-slate-300",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
        )}
      >
        {icon}
        {item.label}
      </button>
    );
  }

  if (item.href)
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          itemBase,
          "text-slate-600 hover:bg-slate-100 hover:text-navy",
        )}
      >
        {icon}
        {item.label}
      </Link>
    );

  return (
    <button
      type="button"
      onClick={onNavigate}
      className={cn(
        itemBase,
        "text-slate-600 hover:bg-slate-100 hover:text-navy",
      )}
    >
      {icon}
      {item.label}
      {typeof item.badge === "number" && item.badge > 0 ? (
        <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
          {item.badge}
        </span>
      ) : null}
    </button>
  );
}

export function InternSidebar({
  groups,
  className,
  onNavigate,
  currentPath = "/intern",
}: {
  groups: InternNavGroup[];
  className?: string;
  /** Gọi sau khi user tương tác với một mục (dùng để đóng drawer mobile) */
  onNavigate?: () => void;
  currentPath?: string;
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
        aria-label="Điều hướng thực tập sinh"
        className="flex min-h-0 flex-1 flex-col px-3 py-4"
      >
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
          {groups.map((group, groupIndex) => (
            <div key={group.id}>
              {groupIndex > 0 ? (
                <hr className="mb-4 border-slate-100" aria-hidden="true" />
              ) : null}
              {group.label ? (
                <p className="px-3 pb-2 text-xs font-medium text-slate-400">
                  {group.label}
                </p>
              ) : null}
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <NavItem
                      item={item}
                      active={!item.unavailable && Boolean(item.href) && (currentPath === item.href || (item.href !== "/intern" && currentPath.startsWith(`${item.href}/`)))}
                      onNavigate={onNavigate}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-2 shrink-0 border-t border-slate-100 pt-3">
          <NavItem item={INTERN_BOTTOM_NAV} active={currentPath === INTERN_BOTTOM_NAV.href} onNavigate={onNavigate} />
        </div>
      </nav>
    </aside>
  );
}
