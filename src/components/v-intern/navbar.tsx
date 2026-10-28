"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { Logo } from "@/components/v-intern/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";

const NAV_LINKS = [
  { label: "Nền tảng", href: "#platform" },
  { label: "Cách hoạt động", href: "#how-it-works" },
  { label: "Dành cho sinh viên", href: "#for-students" },
  { label: "Dành cho giảng viên", href: "#for-instructors" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/80 backdrop-blur-md">
      <nav
        aria-label="Điều hướng chính"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8"
      >
        <div className="flex items-center gap-10">
          <a
            href="#platform"
            className="flex min-h-11 items-center"
            aria-label="V-Intern - Về đầu trang"
          >
            <Logo />
          </a>

          <ul className="hidden items-center gap-7 lg:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground transition-colors hover:text-brand"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          <Link
            href="/login"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600"
          >
            Bắt đầu
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted lg:hidden"
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
        <div className="lg:hidden">
          <ThemeToggle />
        </div>
      </nav>

      {open ? (
        <div
          id="mobile-menu"
          className="border-t border-border/70 bg-background/95 backdrop-blur-md lg:hidden"
        >
          <ul className="mx-auto max-w-7xl space-y-1 px-4 py-4 md:px-6">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-brand"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mx-auto flex max-w-7xl flex-col px-4 pb-4 md:px-6">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-600"
            >
              Bắt đầu
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
