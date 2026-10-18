"use client";
import Link from "next/link";
import { useState, type Ref } from "react";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Home,
  Menu,
  Search,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { cn } from "@/lib/utils";

import type { InternWorkspaceUser } from "./data/intern-mock-data";

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
  searchItems = [{ href: "/intern/notifications", label: "Thông báo" }, { href: "/intern/profile", label: "Hồ sơ" }],
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
  const matches = searchItems.filter(item => item.label.toLocaleLowerCase("vi").includes(query.trim().toLocaleLowerCase("vi")));
  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-slate-200 bg-white",
        className,
      )}
    >
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          ref={menuButtonRef}
          aria-label="Mở menu điều hướng"
          aria-expanded={menuOpen ? true : false}
          onClick={onOpenMenu}
          className="grid size-10 shrink-0 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 lg:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>

        {!waiting && (
          <nav aria-label="Breadcrumb" className="hidden min-w-0 md:block">
            <ol className="flex items-center gap-1.5 text-[13px]">
              <li>
                <Link
                  href="/"
                  className="flex items-center gap-1.5 rounded-md px-1 py-0.5 text-slate-500 transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                >
                  <Home className="size-4" aria-hidden="true" />
                  V-Intern
                </Link>
              </li>
              {breadcrumb.map((crumb) => (
                <li
                  key={crumb.id}
                  className="flex min-w-0 items-center gap-1.5"
                >
                  <ChevronRight
                    className="size-3.5 shrink-0 text-slate-300"
                    aria-hidden="true"
                  />
                  {crumb.current ? (
                    <span
                      aria-current="page"
                      className="truncate px-1 font-semibold text-navy"
                    >
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href ?? "/intern"}
                      className="truncate rounded-md px-1 py-0.5 text-slate-500 transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div
          className={cn(
            "ml-auto flex items-center gap-2 sm:gap-3",
            waiting && "w-full justify-end",
          )}
        >
          <div
            className={cn(
              "relative hidden h-10 w-[280px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 transition-shadow focus-within:ring-2 focus-within:ring-brand/30 lg:flex xl:w-[320px]",
              waiting && "mr-auto",
            )}
          >
            <Search
              className="size-4 shrink-0 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Tìm kiếm trong không gian thực tập"
              placeholder={searchPlaceholder}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Escape") setQuery(""); }}
              autoComplete="off"
              className="w-full bg-transparent text-sm text-navy outline-none placeholder:text-slate-400"
            />
            {query.trim() && <nav aria-label="Kết quả tìm trang" className="absolute inset-x-0 top-12 z-40 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg">{matches.length ? matches.map(item => <Link key={item.href} href={item.href} onClick={() => setQuery("")} className="block rounded-lg px-3 py-2 text-sm text-navy hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600">{item.label}</Link>) : <p role="status" className="p-3 text-sm text-slate-500">Không tìm thấy trang phù hợp.</p>}</nav>}
          </div>

          <Link
            href="/intern/notifications"
            aria-label={
              typeof user.notificationBadge === "number" &&
              user.notificationBadge > 0
                ? `Thông báo, có ${user.notificationBadge} thông báo chưa đọc`
                : "Thông báo"
            }
            className="relative grid size-10 shrink-0 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <Bell className="size-5" aria-hidden="true" />
            {typeof user.notificationBadge === "number" &&
            user.notificationBadge > 0 ? (
              <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-red-500 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                {user.notificationBadge}
              </span>
            ) : null}
          </Link>

          <span
            aria-hidden="true"
            className="hidden h-6 w-px bg-slate-200 sm:block"
          />

          <Link
            href="/intern/profile"
            aria-label={`Tài khoản ${user.name}, ${user.roleLabel}`}
            className="flex items-center gap-2.5 rounded-lg p-1.5 pr-2 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <span
              aria-hidden="true"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-bold text-brand"
            >
              {user.initials}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-[13px] font-semibold leading-tight text-navy">
                {user.name}
              </span>
              <span className="block text-xs leading-tight text-slate-500">
                {user.roleLabel}
              </span>
            </span>
            <ChevronDown
              className="hidden size-4 text-slate-400 sm:block"
              aria-hidden="true"
            />
          </Link>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
