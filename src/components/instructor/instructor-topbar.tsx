import Link from "next/link";
import type { Ref } from "react";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Home,
  Menu,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

import {
  INSTRUCTOR_CURRENT_USER,
  INSTRUCTOR_SEARCH_PLACEHOLDER,
} from "./data/instructor-mock-data";

/**
 * Topbar của Instructor Workspace: breadcrumb, ô tìm kiếm, thông báo, user.
 * Thuần presentational — drawer mobile điều khiển qua props bởi workspace.
 * Dùng initials placeholder cho avatar (yêu cầu: không pull ảnh ngoài).
 */
export function InstructorTopbar({
  className,
  menuOpen,
  onOpenMenu,
  menuButtonRef,
}: {
  className?: string;
  menuOpen?: boolean;
  onOpenMenu?: () => void;
  /** Ref nút mở menu — workspace dùng để trả focus khi drawer đóng */
  menuButtonRef?: Ref<HTMLButtonElement>;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-slate-200 bg-white",
        className
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
            <li aria-hidden="true">
              <ChevronRight className="size-3.5 text-slate-300" />
            </li>
            <li>
              <Link
                href="/instructor"
                className="rounded-md px-1 py-0.5 text-slate-500 transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                Instructor Workspace
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="size-3.5 text-slate-300" />
            </li>
            <li aria-current="page" className="px-1 font-semibold text-navy">
              Tổng quan
            </li>
          </ol>
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="hidden h-10 w-[320px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 transition-shadow focus-within:ring-2 focus-within:ring-brand/30 lg:flex xl:w-[360px]">
            <Search className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              aria-label="Tìm kiếm trong không gian giảng viên"
              placeholder={INSTRUCTOR_SEARCH_PLACEHOLDER}
              className="w-full bg-transparent text-sm text-navy outline-none placeholder:text-slate-400"
            />
            <kbd className="shrink-0 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-medium text-slate-400">
              ⌘K
            </kbd>
          </div>

          <button
            type="button"
            aria-label={`Thông báo, có ${INSTRUCTOR_CURRENT_USER.notifications} thông báo mới`}
            className="relative grid size-10 shrink-0 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <Bell className="size-5" aria-hidden="true" />
            <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-red-500 text-[10px] font-bold leading-none text-white ring-2 ring-white">
              {INSTRUCTOR_CURRENT_USER.notifications}
            </span>
          </button>

          <span aria-hidden="true" className="hidden h-6 w-px bg-slate-200 sm:block" />

          <button
            type="button"
            aria-label={`Tài khoản ${INSTRUCTOR_CURRENT_USER.name}, ${INSTRUCTOR_CURRENT_USER.role}`}
            className="flex items-center gap-2.5 rounded-lg p-1.5 pr-2 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <span
              aria-hidden="true"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-bold text-brand"
            >
              {INSTRUCTOR_CURRENT_USER.initials}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-[13px] font-semibold leading-tight text-navy">
                {INSTRUCTOR_CURRENT_USER.name}
              </span>
              <span className="block text-xs leading-tight text-slate-500">
                {INSTRUCTOR_CURRENT_USER.role}
              </span>
            </span>
            <ChevronDown
              className="hidden size-4 text-slate-400 sm:block"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </header>
  );
}
