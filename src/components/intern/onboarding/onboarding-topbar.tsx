import Link from "next/link";
import { Bell, ChevronDown } from "lucide-react";

import { Logo } from "@/components/v-intern/logo";

import { ONBOARDING_USER } from "./data/recruitment-mock-data";

/**
 * Topbar của Onboarding — bám reference: logo bên trái, menu ngang giữa
 * (mục mô phỏng, chưa có route thật → render button trung tính, không giả
 * link 404), chuông thông báo + avatar bên phải.
 *
 * - Logo link về "/" (landing) — control thật duy nhất.
 * - Avatar dùng initials placeholder theo quy ước repo (không pull ảnh ngoài).
 * - Thuần presentational, server-safe (page server render được).
 */

const MOCK_NAV_ITEMS = ["Tổng quan", "Học tập", "Thực tập", "Hướng dẫn"] as const;

export function OnboardingTopbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="V-Intern — về trang chủ"
          className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <Logo className="text-xl" />
        </Link>

        <nav aria-label="Điều hướng onboarding" className="ml-6 hidden md:block">
          <ul className="flex items-center gap-1">
            {MOCK_NAV_ITEMS.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  title="Mục điều hướng mô phỏng — chưa có route thật"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            aria-label="Thông báo, có 1 thông báo chưa đọc"
            className="relative grid size-10 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <Bell className="size-5" aria-hidden="true" />
            <span
              aria-hidden="true"
              className="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-500 ring-2 ring-white"
            />
          </button>

          <span aria-hidden="true" className="hidden h-6 w-px bg-slate-200 sm:block" />

          <span className="flex items-center gap-2.5 rounded-lg p-1.5 pr-2">
            <span
              aria-hidden="true"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-bold text-brand"
            >
              {ONBOARDING_USER.initials}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-[13px] font-semibold leading-tight text-navy">
                {ONBOARDING_USER.name}
              </span>
              <span className="block text-xs leading-tight text-slate-500">
                {ONBOARDING_USER.roleLabel}
              </span>
            </span>
            <ChevronDown
              className="hidden size-4 text-slate-400 sm:block"
              aria-hidden="true"
            />
          </span>
        </div>
      </div>
    </header>
  );
}
