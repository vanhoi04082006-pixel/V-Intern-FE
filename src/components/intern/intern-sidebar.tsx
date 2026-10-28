import Link from "next/link";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/v-intern/logo";
import { LearningIcon } from "@/components/workspace/learning-icon";

import { INTERN_BOTTOM_NAV } from "./workspace-presentation";
import type {
  InternNavGroup,
  InternNavItem,
  InternWorkspaceUser,
} from "./data/intern-mock-data";

/** Shared desktop/drawer navigation. InternShell supplies route availability
 * from the current workspace lifecycle; unavailable items have no destination.
 */

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
    <item.icon className="size-[17px] shrink-0" aria-hidden="true" />
  );

  if (active) {
    return (
      <Link
        href={item.href ?? "/intern"}
        aria-current="page"
        onClick={onNavigate}
        className="student-nav-item"
      >
        {icon}
        <span className="truncate">{item.label}</span>
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
        className="student-nav-item"
      >
        {icon}
        <span className="truncate">{item.label}</span>
      </button>
    );
  }

  if (item.href)
    return (
      <Link href={item.href} onClick={onNavigate} className="student-nav-item">
        {icon}
        <span className="truncate">{item.label}</span>
        {typeof item.badge === "number" && item.badge > 0 ? (
          <span className="student-nav-badge">{item.badge}</span>
        ) : null}
      </Link>
    );

  return (
    <button type="button" onClick={onNavigate} className="student-nav-item">
      {icon}
      <span className="truncate">{item.label}</span>
      {typeof item.badge === "number" && item.badge > 0 ? (
        <span className="student-nav-badge">{item.badge}</span>
      ) : null}
    </button>
  );
}

export function InternSidebar({
  groups,
  className,
  onNavigate,
  currentPath = "/intern",
  user,
}: {
  groups: InternNavGroup[];
  className?: string;
  /** Gọi sau khi user tương tác với một mục (dùng để đóng drawer mobile) */
  onNavigate?: () => void;
  currentPath?: string;
  user?: InternWorkspaceUser;
}) {
  return (
    <aside className={cn("student-sidebar", className)}>
      <div className="student-sidebar-brand">
        <div className="student-sidebar-brand-text">
          <Logo />
          <p className="student-sidebar-tagline">Learn · Build · Belong</p>
        </div>
        <span className="student-sidebar-scope">Sinh viên</span>
      </div>

      <nav
        aria-label="Điều hướng thực tập sinh"
        className="student-sidebar-nav"
      >
        <div className="student-sidebar-scroll">
          {groups.map((group) => (
            <div key={group.id} className="student-nav-group">
              {group.label ? (
                <p className="student-nav-label notebook-nav-group"><LearningIcon kind={group.id === 'performance' ? 'analytics' : 'workflow'} />{group.label}</p>
              ) : null}
              <ul className="student-nav-list">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <NavItem
                      item={item}
                      active={
                        !item.unavailable &&
                        Boolean(item.href) &&
                        (currentPath === item.href ||
                          (item.href !== "/intern" &&
                            currentPath.startsWith(`${item.href}/`)))
                      }
                      onNavigate={onNavigate}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="student-sidebar-footer">
          <div>
            <NavItem
              item={INTERN_BOTTOM_NAV}
              active={currentPath === INTERN_BOTTOM_NAV.href}
              onNavigate={onNavigate}
            />
          </div>
          {user && (
            <Link
              href="/intern/profile"
              className="student-user-card mt-1"
              aria-label={`Mở hồ sơ cá nhân của ${user.name}`}
            >
              <span className="student-avatar" aria-hidden="true">
                {user.initials}
              </span>
              <span className="student-user-meta">
                <span className="student-user-name">{user.name}</span>
                <span className="student-user-role">{user.roleLabel}</span>
              </span>
              <span className="student-user-settings" aria-hidden="true">
                <Settings className="size-4" />
              </span>
            </Link>
          )}
        </div>
      </nav>
    </aside>
  );
}
