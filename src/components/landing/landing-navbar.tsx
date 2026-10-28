"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "@/lib/client/router";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";
import { scrollToSection } from "./landing-ui";

const NAV_LINKS = [
  { label: "Tính năng", id: "features" },
  { label: "Quy trình", id: "how" },
  { label: "Đối tượng", id: "roles" },
  { label: "Câu hỏi", id: "faq" },
];

export function LandingNavbar() {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "glass sticky top-0 z-50 border-b transition-colors duration-300",
        scrolled ? "border-line-strong shadow-[0_8px_32px_rgba(0,0,0,0.35)]" : "border-transparent"
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" aria-label="V-Intern — về trang chủ" className="shrink-0 py-2">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Điều hướng chính">
          {NAV_LINKS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollToSection(item.id)}
              className="h-10 rounded-lg px-3.5 text-sm font-medium text-dim transition-colors hover:bg-white/[0.04] hover:text-ink"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="inline-flex h-10 items-center rounded-lg border border-line px-4 text-sm font-medium text-dim transition-colors hover:border-line-strong hover:text-ink"
          >
            Đăng nhập
          </Link>
          <Link
            to="/register"
            className="hidden h-10 items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-semibold text-on-brand shadow-[0_0_24px_rgba(16,185,129,0.25)] transition-all hover:bg-brand-bright active:scale-[0.98] sm:inline-flex"
          >
            Bắt đầu ngay
            <ArrowRight className="size-4 icon" />
          </Link>
        </div>
      </div>
    </header>
  );
}
