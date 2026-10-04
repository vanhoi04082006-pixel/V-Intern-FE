"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BookOpen, Info } from "lucide-react";

import {
  WELCOME_BREADCRUMB,
  WELCOME_GUIDANCE_ITEMS,
  WELCOME_GUIDANCE_TITLE,
  WELCOME_HEADING,
  WELCOME_INFO_ITEMS,
  WELCOME_INFO_QUESTION,
  WELCOME_SUBTITLE,
} from "./data/recruitment-mock-data";
import { HorizontalStepper } from "./onboarding-stepper";
import {
  IconTile,
  NoteCard,
  StepBadge,
} from "./onboarding-primitives";

/**
 * Màn 1 — Welcome (Bước 1/4): tiêu đề chào mừng lớn, stepper ngang 4 bước,
 * 4 khối giải thích "Bạn sắp trải qua điều gì?", CTA chính "Bắt đầu" và CTA
 * phụ "Xem hướng dẫn".
 *
 * - "Bắt đầu" là Link thật → /intern/onboarding/role (không API).
 * - "Xem hướng dẫn" là toggle panel hướng dẫn thuần UI — hành vi thật
 *   (expand/collapse, aria-expanded), không giả điều hướng.
 * - Ảnh minh họa tái sử dụng asset hiện có của repo (student-v2.png) —
 *   thuần trang trí, ẩn trên mobile để ưu tiên nội dung.
 */
export function WelcomeStep() {
  const [guidanceOpen, setGuidanceOpen] = useState(false);

  return (
    <div>
      <StepBadge step={1} />

      <header className="mt-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="max-w-[640px]">
          <h1 className="text-[30px] font-extrabold leading-[1.15] tracking-tight text-navy sm:text-4xl">
            {WELCOME_HEADING}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
            {WELCOME_SUBTITLE}
          </p>
          <nav aria-label="Breadcrumb onboarding" className="mt-3">
            <ol className="flex items-center gap-2 text-[13px] text-slate-500">
              {WELCOME_BREADCRUMB.map((crumb, index) => (
                <li key={crumb} className="flex items-center gap-2">
                  {index > 0 ? (
                    <span aria-hidden="true" className="text-slate-300">
                      /
                    </span>
                  ) : null}
                  <span>{crumb}</span>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <div
          aria-hidden="true"
          className="relative hidden h-44 w-36 shrink-0 lg:block"
        >
          <Image
            src="/images/student-v2.png"
            alt=""
            fill
            sizes="144px"
            className="object-contain object-bottom"
          />
        </div>
      </header>

      <div className="mt-6">
        <HorizontalStepper activeStep={1} />
      </div>

      <section aria-labelledby="welcome-info-heading" className="mt-8">
        <h2
          id="welcome-info-heading"
          className="text-lg font-bold tracking-tight text-navy"
        >
          {WELCOME_INFO_QUESTION}
        </h2>

        <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {WELCOME_INFO_ITEMS.map((item) => (
            <li
              key={item.id}
              className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
            >
              <IconTile icon={item.icon} tone={item.tone} />
              <h3 className="mt-3 text-[15px] font-bold leading-snug text-navy">
                {item.title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          href="/intern/onboarding/role"
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1"
        >
          Bắt đầu
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
        <button
          type="button"
          aria-expanded={guidanceOpen}
          aria-controls="welcome-guidance"
          onClick={() => setGuidanceOpen((open) => !open)}
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1"
        >
          <BookOpen className="size-4" aria-hidden="true" />
          Xem hướng dẫn
        </button>
      </div>

      {guidanceOpen ? (
        <section
          id="welcome-guidance"
          aria-labelledby="welcome-guidance-heading"
          className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-5"
        >
          <h2
            id="welcome-guidance-heading"
            className="flex items-center gap-2 text-base font-bold text-navy"
          >
            <Info className="size-4 text-brand" aria-hidden="true" />
            {WELCOME_GUIDANCE_TITLE}
          </h2>
          <ul className="mt-3 flex list-disc flex-col gap-2 pl-4 text-[13px] leading-relaxed text-slate-700 marker:text-brand/60">
            {WELCOME_GUIDANCE_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <NoteCard tone="blue" className="mt-4">
            Quy trình này chỉ dành cho lần đăng nhập đầu tiên của Intern — dữ
            liệu đang hiển thị là dữ liệu mẫu để trình bày UI.
          </NoteCard>
        </section>
      ) : null}
    </div>
  );
}
