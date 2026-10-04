"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import {
  RECRUITMENT_ROLES,
  ROLE_STEP_EXPLAIN_ITEMS,
  ROLE_STEP_EXPLAIN_TITLE,
  ROLE_STEP_HEADING,
  ROLE_STEP_NOTE,
  ROLE_STEP_SUBTITLE,
} from "./data/recruitment-mock-data";
import type { RoleId } from "./data/recruitment-mock-data";
import { HorizontalStepper } from "./onboarding-stepper";
import { NoteCard, StepBadge } from "./onboarding-primitives";
import { useRecruitmentFlow } from "./recruitment-provider";
import { RoleCard } from "./role-card";

/**
 * Màn 2 — Chọn vị trí ứng tuyển (Bước 2/4): stepper ngang (bước 1 hoàn tất,
 * bước 2 đang active), 4 card vai trò chọn một (radio), khu giải thích 4
 * điểm dưới cùng, CTA "Quay lại" + "Tiếp tục".
 *
 * - Lựa chọn mặc định: Frontend Developer (theo reference).
 * - "Tiếp tục" luôn là Link → /intern/onboarding/interview; disabled khi
 *   chưa có vai trò nào được chọn (không thể xảy ra với default, nhưng
 *   vẫn guard đúng semantics).
 * - Lựa chọn lưu vào mock context — có thể quay lại đổi trước khi phỏng vấn.
 */
export function RoleSelectionStep() {
  const { selectedRoleId, selectRole } = useRecruitmentFlow();

  return (
    <div>
      <StepBadge step={2} />

      <header className="mt-3 max-w-[640px]">
        <h1 className="text-[30px] font-extrabold leading-[1.15] tracking-tight text-navy sm:text-4xl">
          {ROLE_STEP_HEADING}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
          {ROLE_STEP_SUBTITLE}
        </p>
      </header>

      <div className="mt-6">
        <HorizontalStepper activeStep={2} />
      </div>

      <fieldset className="mt-8">
        <legend className="sr-only">Chọn vị trí ứng tuyển</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {RECRUITMENT_ROLES.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              checked={role.id === selectedRoleId}
              onChange={(id: RoleId) => selectRole(id)}
            />
          ))}
        </div>
      </fieldset>

      <section
        aria-labelledby="role-explain-heading"
        className="mt-8 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-5"
      >
        <h2
          id="role-explain-heading"
          className="text-base font-bold tracking-tight text-navy sm:text-lg"
        >
          {ROLE_STEP_EXPLAIN_TITLE}
        </h2>
        <ol className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          {ROLE_STEP_EXPLAIN_ITEMS.map((item, index) => (
            <li key={item} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-bold text-brand"
              >
                {index + 1}
              </span>
              <span className="text-[13px] leading-relaxed text-slate-700">
                {item}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <NoteCard className="mt-5">{ROLE_STEP_NOTE}</NoteCard>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <Link
          href="/intern/onboarding"
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Quay lại
        </Link>
        {selectedRoleId ? (
          <Link
            href="/intern/onboarding/interview"
            data-testid="role-continue"
            aria-disabled={false}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1"
          >
            Tiếp tục
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        ) : (
          <button
            type="button"
            disabled
            data-testid="role-continue"
            className="inline-flex h-11 cursor-not-allowed items-center gap-2 rounded-lg bg-slate-200 px-5 text-sm font-semibold text-slate-400"
          >
            Tiếp tục
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
