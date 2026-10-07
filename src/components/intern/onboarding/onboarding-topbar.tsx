"use client";
import Link from "next/link";
import { Logo } from "@/components/v-intern/logo";
import { getSessionUser } from "@/lib/auth/session";
import { LogoutButton } from "@/components/auth/logout-button";
export function OnboardingTopbar() {
  const user = getSessionUser();
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="V-Intern — về trang chủ">
          <Logo className="text-xl" />
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-navy">
            {user?.displayName}
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
