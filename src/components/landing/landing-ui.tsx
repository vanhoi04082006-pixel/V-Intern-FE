"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "@/lib/client/router";
import { FadeIn } from "@/components/shared/view";
import { cn } from "@/lib/utils";

/**
 * Tiện ích dùng chung cho landing.
 * Lưu ý: KHÔNG dùng href="#id" vì SPA hash-router sẽ hiểu lầm thành route.
 */

export function scrollToSection(id: string) {
  if (typeof document === "undefined") return;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Cuộn về đầu trang — dùng cho link dead-end (Bảng giá, Blog…). */
export function scrollTop() {
  if (typeof window === "undefined") return;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

const primaryCls =
  "glow-brand group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-sm font-semibold text-on-brand transition-all hover:bg-brand-bright active:scale-[0.98]";

const ghostCls =
  "group inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-panel px-6 text-sm font-medium text-ink transition-all hover:border-line-strong hover:bg-panel-2 active:scale-[0.98]";

function Arrow() {
  return (
    <ArrowRight className="size-4 icon transition-transform duration-300 group-hover:translate-x-0.5" />
  );
}

export function CtaPrimary({
  to,
  onClick,
  children,
  arrow = true,
  className,
}: {
  to?: string;
  onClick?: () => void;
  children: React.ReactNode;
  arrow?: boolean;
  className?: string;
}) {
  if (to) {
    return (
      <Link to={to} className={cn(primaryCls, className)}>
        {children}
        {arrow ? <Arrow /> : null}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cn(primaryCls, className)}>
      {children}
      {arrow ? <Arrow /> : null}
    </button>
  );
}

export function CtaGhost({
  to,
  onClick,
  children,
  arrow = false,
  className,
}: {
  to?: string;
  onClick?: () => void;
  children: React.ReactNode;
  arrow?: boolean;
  className?: string;
}) {
  if (to) {
    return (
      <Link to={to} className={cn(ghostCls, className)}>
        {children}
        {arrow ? <Arrow /> : null}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cn(ghostCls, className)}>
      {children}
      {arrow ? <Arrow /> : null}
    </button>
  );
}

/** Heading section chuẩn landing: eyebrow + tiêu đề lớn + mô tả. */
export function LandingHeading({
  eyebrow,
  title,
  sub,
  align = "center",
}: {
  eyebrow: string;
  title: React.ReactNode;
  sub?: React.ReactNode;
  align?: "center" | "left";
}) {
  return (
    <FadeIn className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-bright">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-ink md:text-4xl">
        {title}
      </h2>
      {sub ? (
        <p className="mt-4 text-sm leading-relaxed text-dim md:text-[15px]">{sub}</p>
      ) : null}
    </FadeIn>
  );
}

/** Vỏ section chuẩn: padding dọc + container max-w-7xl. */
export function SectionShell({
  id,
  children,
  className,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("relative scroll-mt-24 py-20 md:py-28", className)}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">{children}</div>
    </section>
  );
}
