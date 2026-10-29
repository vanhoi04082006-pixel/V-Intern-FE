"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { ArrowRight, Menu, Moon, Sun, X } from "lucide-react";
import { Logo } from "@/components/landing/logo";

const NAV_LINKS = [
  { label: "Nền tảng", href: "#platform" },
  { label: "Cách hoạt động", href: "#how-it-works" },
  { label: "Dành cho sinh viên", href: "#for-students" },
  { label: "Dành cho giảng viên", href: "#for-instructors" },
];

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Chuyển đổi chế độ nền giấy sáng và bảng đen"
      className="inline-flex h-11 w-11 items-center justify-center rounded-xl border-2 border-ink/15 bg-raised text-ink transition-all hover:-translate-y-0.5 hover:border-blue hover:text-blue active:translate-y-0"
    >
      <Moon className="h-5 w-5 dark:hidden" aria-hidden="true" />
      <Sun className="hidden h-5 w-5 dark:block" aria-hidden="true" />
    </button>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-ink/10 bg-paper/90 backdrop-blur-md">
      <nav
        aria-label="Điều hướng chính"
        className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8"
      >
        <div className="flex items-center gap-10">
          <a
            href="#platform"
            className="flex min-h-11 items-center transition-transform hover:-rotate-2"
            aria-label="V-Intern — về đầu trang"
          >
            <Logo />
          </a>

          <ul className="hidden items-center gap-1.5 lg:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="inline-flex min-h-11 items-center rounded-lg px-3 py-1 text-sm font-semibold text-ink-soft transition-colors hover:text-blue"
                >
                  <span className="marker">{link.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          <a
            href="#login"
            className="group inline-flex h-11 items-center gap-2 rounded-xl border-2 border-ink bg-royal px-5 text-sm font-bold text-white shadow-[3px_3px_0_0_var(--ink)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-royal-deep hover:shadow-[5px_5px_0_0_var(--ink)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0_0_var(--ink)]"
          >
            Bắt đầu
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </a>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border-2 border-ink/15 bg-raised text-ink transition-colors hover:border-blue hover:text-blue"
            aria-label={open ? "Đóng menu" : "Mở menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {open ? (
        <div
          id="mobile-menu"
          className="border-t-2 border-dashed border-ink/15 bg-paper/95 backdrop-blur-md lg:hidden"
        >
          <ul className="mx-auto max-w-7xl space-y-1 px-4 py-4 md:px-6">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center rounded-xl border-2 border-transparent px-4 text-sm font-semibold text-ink transition-colors hover:border-blue hover:bg-blue-mist hover:text-blue"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mx-auto flex max-w-7xl flex-col px-4 pb-5 md:px-6">
            <a
              href="#login"
              onClick={() => setOpen(false)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-ink bg-royal text-sm font-bold text-white shadow-[3px_3px_0_0_var(--ink)]"
            >
              Bắt đầu
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}
