"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowLeft, Award, KanbanSquare, Sparkles } from "lucide-react";
import { Link } from "@/lib/client/router";
import { Logo } from "@/components/shared/logo";
import { UserAvatar } from "@/components/shared/primitives";
import { cn } from "@/lib/utils";

/* ===================== Brand panel (bên phải split) ===================== */

const PERKS = [
  {
    icon: Sparkles,
    title: "Phỏng vấn AI 15 phút",
    desc: "Định vị trình độ, xếp đội theo điểm mạnh.",
  },
  {
    icon: KanbanSquare,
    title: "Dự án & sprint thật",
    desc: "Kanban, pull request, AI review code từng dòng.",
  },
  {
    icon: Award,
    title: "Chứng chỉ số",
    desc: "Mã tra cứu công khai cho nhà tuyển dụng.",
  },
];

const MINI_STATS = [
  { value: "1.250+", label: "sinh viên" },
  { value: "38", label: "dự án thật" },
  { value: "92%", label: "hoàn thành" },
];

export interface AuthQuote {
  name: string;
  role: string;
  text: string;
}

function BrandPanel({ quote }: { quote: AuthQuote }) {
  return (
    <aside className="relative hidden overflow-hidden bg-deep lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
      <Image
        src="/images/hero-orb.png"
        alt=""
        aria-hidden
        fill
        sizes="45vw"
        className="object-cover opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-deep/50 via-transparent to-deep/80"
        aria-hidden
      />

      <div className="relative">
        <Logo size={34} />
      </div>

      <div className="relative max-w-md">
        <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-ink xl:text-3xl">
          AI là đồng nghiệp,
          <br />
          <span className="text-gradient">dự án là thật.</span>
        </h2>
        <ul className="mt-8 space-y-5">
          {PERKS.map((perk) => (
            <li key={perk.title} className="flex items-start gap-3.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-brand/25 bg-brand/10 text-brand-bright">
                <perk.icon className="size-4 icon" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink">{perk.title}</span>
                <span className="mt-0.5 block text-[13px] leading-relaxed text-dim">
                  {perk.desc}
                </span>
              </span>
            </li>
          ))}
        </ul>

        <figure className="glass mt-9 rounded-2xl border border-line p-5">
          <blockquote className="text-[13px] leading-relaxed text-ink">
            “{quote.text}”
          </blockquote>
          <figcaption className="mt-4 flex items-center gap-3">
            <UserAvatar name={quote.name} size={32} />
            <span>
              <span className="block text-[13px] font-semibold text-ink">{quote.name}</span>
              <span className="block text-[11px] text-faint">{quote.role}</span>
            </span>
          </figcaption>
        </figure>
      </div>

      <div className="relative flex items-center gap-6 border-t border-line pt-5">
        {MINI_STATS.map((s) => (
          <div key={s.label}>
            <p className="font-mono text-lg font-bold text-ink">{s.value}</p>
            <p className="text-[11px] text-faint">{s.label}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}

/* ========================= Split auth layout ========================= */

export function SplitAuthLayout({
  children,
  quote,
}: {
  children: React.ReactNode;
  quote: AuthQuote;
}) {
  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-[55%_45%]">
      <div className="relative flex min-h-screen flex-col px-4 py-6 sm:px-8">
        <div
          className="dot-bg pointer-events-none absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_70%,transparent)]"
          aria-hidden
        />

        <div className="relative flex items-center justify-between">
          <Link to="/" aria-label="Về trang chủ" className="py-2">
            <Logo />
          </Link>
          <Link
            to="/"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-dim transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-3.5 icon" />
            Về trang chủ
          </Link>
        </div>

        <div className="relative flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>

      <BrandPanel quote={quote} />
    </div>
  );
}

/* ======================== Centered auth layout ======================== */

export function CenteredAuthLayout({
  children,
  width = "max-w-md",
}: {
  children: React.ReactNode;
  width?: string;
}) {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-canvas px-4 py-10">
      <div className="dot-bg absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_70%)]" aria-hidden />
      <Image
        src="/images/hero-orb.png"
        alt=""
        aria-hidden
        width={640}
        height={640}
        className="pointer-events-none absolute left-1/2 top-1/2 w-[560px] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-[0.14] [mask-image:radial-gradient(closest-side,black_30%,transparent_75%)]"
      />

      <div className={cn("relative w-full", width)}>
        <Link to="/" aria-label="Về trang chủ" className="mb-8 flex justify-center">
          <Logo size={34} />
        </Link>
        {children}
      </div>
    </div>
  );
}
