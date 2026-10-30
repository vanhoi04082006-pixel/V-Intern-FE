"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type Ref } from "react";
import {
  IconChevronDown,
  IconChevronRight,
  IconHome,
  IconMenu,
  IconSearch,
} from "@/components/v-intern/icons";
import { LogoutButton } from "@/components/auth/logout-button";
import { NotificationBell } from "@/components/shared/notification-bell";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { cn } from "@/lib/utils";

import type { InternWorkspaceUser } from "./intern-workspace-types";

/**
 * Topbar của Intern Workspace: breadcrumb, ô tìm kiếm, thông báo, user.
 * Thuần presentational — drawer mobile điều khiển qua props bởi workspace.
 * Dùng initials placeholder cho avatar (yêu cầu: không pull ảnh ngoài).
 *
 * Waiting follows R01: search left, account/actions right; Active retains breadcrumb.
 */
export function InternTopbar({
  className,
  breadcrumb,
  searchPlaceholder,
  user,
  menuOpen,
  onOpenMenu,
  menuButtonRef,
  waiting = false,
  searchItems = [
    { href: "/intern/notifications", label: "Thông báo" },
    { href: "/intern/profile", label: "Hồ sơ" },
  ],
}: {
  className?: string;
  waiting?: boolean;
  breadcrumb: { id: string; label: string; href?: string; current?: boolean }[];
  searchPlaceholder: string;
  user: InternWorkspaceUser;
  menuOpen?: boolean;
  onOpenMenu?: () => void;
  /** Ref nút mở menu — workspace dùng để trả focus khi drawer đóng */
  menuButtonRef?: Ref<HTMLButtonElement>;
  searchItems?: { href: string; label: string }[];
}) {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const matches = searchItems.filter((item) =>
    item.label.toLocaleLowerCase("vi").includes(query.trim().toLocaleLowerCase("vi")),
  );
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey)
        return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      )
        return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  return (
    <header className={cn("student-topbar", className)}>
      <div className="student-topbar-inner">
        <button
          type="button"
          ref={menuButtonRef}
          aria-label="Mở menu điều hướng"
          aria-expanded={menuOpen ? true : false}
          onClick={onOpenMenu}
          className="student-icon-button student-menu-button"
        >
          <IconMenu className="size-5" aria-hidden="true" />
        </button>

        {!waiting && (
          <nav
            aria-label="Breadcrumb"
            className="student-breadcrumb hidden min-w-0 md:block"
          >
            <ol>
              <li>
                <Link href="/" className="truncate">
                  <IconHome className="size-3.5" aria-hidden="true" />
                  V-Intern
                </Link>
              </li>
              {breadcrumb.map((crumb) => (
                <li key={crumb.id} className="flex min-w-0 items-center gap-1">
                  <IconChevronRight
                    className="size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  {crumb.current ? (
                    <span aria-current="page" className="truncate">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link href={crumb.href ?? "/intern"} className="truncate">
                      {crumb.label}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className={cn("student-topbar-actions", waiting && "w-full")}>
          <div
            className={cn("student-topbar-search", waiting && "mr-auto")}
          >
            <IconSearch className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              ref={searchRef}
              type="search"
              aria-label="Tìm kiếm trong không gian thực tập"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setQuery("");
              }}
              autoComplete="off"
            />
            {!query && (
              <kbd className="student-kbd" aria-hidden="true">
                /
              </kbd>
            )}
            {query.trim() && (
              <nav
                aria-label="Kết quả tìm trang"
                className="student-search-results"
              >
                {matches.length ? (
                  matches.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setQuery("")}
                    >
                      {item.label}
                    </Link>
                  ))
                ) : (
                  <p
                    role="status"
                    className="px-3 py-3 text-caption text-muted-foreground"
                  >
                    Không tìm thấy trang phù hợp.
                  </p>
                )}
              </nav>
            )}
          </div>

          <ThemeToggle className="hidden sm:inline-flex" />

          <NotificationBell href="/intern/notifications" />

          <span className="student-topbar-divider" aria-hidden="true" />

          <Link
            href="/intern/profile"
            aria-label={`Tài khoản ${user.name}, ${user.roleLabel}`}
            className="student-topbar-user"
          >
            <span className="student-avatar size-8 text-caption" aria-hidden="true">
              {user.initials}
            </span>
            <span className="student-topbar-user-meta hidden sm:block">
              <span className="student-topbar-user-name">{user.name}</span>
              <span className="student-topbar-user-role">{user.roleLabel}</span>
            </span>
            <IconChevronDown
              className="size-4 text-muted-foreground max-sm:hidden"
              aria-hidden="true"
            />
          </Link>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
