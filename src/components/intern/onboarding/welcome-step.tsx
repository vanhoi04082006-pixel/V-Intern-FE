"use client";

import Link from "next/link";
import { useState } from "react";
import {
  IconArrowRight,
  IconBookOpen,
  IconInfo,
} from "@/components/v-intern/icons";

import {
  WELCOME_BREADCRUMB,
  WELCOME_GUIDANCE_ITEMS,
  WELCOME_GUIDANCE_TITLE,
  WELCOME_HEADING,
  WELCOME_INFO_ITEMS,
  WELCOME_INFO_QUESTION,
  WELCOME_SUBTITLE,
} from "./recruitment-presentation";
import { HorizontalStepper, MobileStepbar } from "./onboarding-stepper";
import { NoteCard, StepBadge } from "./onboarding-primitives";

/**
 * Màn 1 — Welcome (Bước 1/4): tiêu đề chào mừng lớn, stepper ngang 4 bước,
 * 4 khối giải thích "Bạn sắp trải qua điều gì?", CTA chính "Bắt đầu" và CTA
 * phụ "Xem hướng dẫn".
 *
 * - "Bắt đầu" là Link thật → /intern/onboarding/role (không API).
 * - "Xem hướng dẫn" là toggle panel hướng dẫn thuần UI — hành vi thật
 *   (expand/collapse, aria-expanded), không giả điều hướng.
 * - Hero là khối text thuần (heading + subtitle + breadcrumb) với max-width
 *   hợp lý để dễ đọc — không có ảnh minh họa (đã bỏ, không thay mascot).
 */
export function WelcomeStep() {
  const [guidanceOpen, setGuidanceOpen] = useState(false);

  return (
    <div>
      <StepBadge step={1} />

      <header className="student-onboarding-intro mt-3">
        <div className="max-w-[720px]">
          <h1 className="text-page font-extrabold leading-[1.15] tracking-tight text-foreground sm:text-metric">
            {WELCOME_HEADING}
          </h1>
          <p className="mt-3 text-body leading-relaxed text-muted-foreground">
            {WELCOME_SUBTITLE}
          </p>
          <nav aria-label="Breadcrumb onboarding" className="mt-3">
            <ol className="flex items-center gap-2 text-small text-muted-foreground">
              {WELCOME_BREADCRUMB.map((crumb, index) => (
                <li key={crumb} className="flex items-center gap-2">
                  {index > 0 ? (
                    <span aria-hidden="true" className="text-muted-foreground">
                      /
                    </span>
                  ) : null}
                  <span>{crumb}</span>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </header>

      <div className="mt-6 lg:hidden">
        <MobileStepbar activeStep={1} variant="card" />
      </div>
      <div className="mt-6 hidden lg:block">
        <HorizontalStepper activeStep={1} />
      </div>

      <section aria-labelledby="welcome-info-heading" className="mt-8">
        <h2
          id="welcome-info-heading"
          className="text-section font-bold tracking-tight text-foreground"
        >
          {WELCOME_INFO_QUESTION}
        </h2>

        <ul className="workspace-onboarding-facts mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {WELCOME_INFO_ITEMS.map((item) => (
            <li
              key={item.id}
              className="min-w-0 border-t border-border pt-4"
            >
              <h3 className="text-body font-semibold leading-snug text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-small leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          href="/intern/onboarding/role"
          className="inline-flex h-11 items-center gap-2 rounded-control bg-primary px-5 text-body font-semibold text-primary-foreground shadow-app-xs transition-colors hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1"
        >
          Bắt đầu
          <IconArrowRight className="size-4" aria-hidden="true" />
        </Link>
        <button
          type="button"
          aria-expanded={guidanceOpen}
          aria-controls="welcome-guidance"
          onClick={() => setGuidanceOpen((open) => !open)}
          className="inline-flex h-11 items-center gap-2 rounded-control border border-border bg-card px-5 text-body font-semibold text-foreground shadow-app-xs transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1"
        >
          <IconBookOpen className="size-4" aria-hidden="true" />
          Xem hướng dẫn
        </button>
      </div>

      {guidanceOpen ? (
        <section
          id="welcome-guidance"
          aria-labelledby="welcome-guidance-heading"
          className="mt-6 border-t border-border pt-6"
        >
          <h2
            id="welcome-guidance-heading"
            className="flex items-center gap-2 text-subsection font-bold text-foreground"
          >
            <IconInfo className="size-4 text-primary" aria-hidden="true" />
            {WELCOME_GUIDANCE_TITLE}
          </h2>
          <ul className="mt-3 flex list-disc flex-col gap-2 pl-4 text-small leading-relaxed text-foreground marker:text-primary/60">
            {WELCOME_GUIDANCE_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <NoteCard tone="blue" className="mt-4">
            Quy trình này chỉ dành cho lần đăng nhập đầu tiên của Intern. Bạn có
            thể mở lại hướng dẫn trước khi bắt đầu phỏng vấn.
          </NoteCard>
        </section>
      ) : null}
    </div>
  );
}
