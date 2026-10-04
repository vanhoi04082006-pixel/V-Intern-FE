"use client";

import Image from "next/image";
import { Bot, Sparkles } from "lucide-react";

import type { RecruitmentResultData } from "./data/recruitment-mock-data";
import { TagPill } from "./onboarding-primitives";

/**
 * Các card "AI Recruiter nói gì" trên Result screen (dùng chung pass/fail):
 * - `RecruiterFeedback`: nhận xét chi tiết của AI Recruiter.
 * - `RoleRecommendation`: chỉ render khi fail — vai trò được đề xuất kèm
 *   lý do và tags (reference màn 5). Đây thuần là gợi ý UI, KHÔNG tạo bất
 *   kỳ phân công/persist nào phía server.
 */
export function RecruiterFeedback({
  result,
}: {
  result: RecruitmentResultData;
}) {
  return (
    <section
      aria-labelledby="result-feedback-heading"
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-5"
    >
      <h2
        id="result-feedback-heading"
        className="flex items-center gap-2 text-base font-bold tracking-tight text-navy"
      >
        <Bot className="size-5 text-brand" aria-hidden="true" />
        Nhận xét từ AI Recruiter
      </h2>
      <ul className="mt-3 flex list-disc flex-col gap-2 pl-4 text-[13px] leading-relaxed text-slate-700 marker:text-brand/50">
        {result.feedback.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export function RoleRecommendation({
  result,
  onContinue,
}: {
  result: RecruitmentResultData;
  /** Callback CTA "Tiếp tục với {vai trò}" — do recruitment-result truyền. */
  onContinue: (roleId: Exclude<RecruitmentResultData["suggestedRole"], null>["id"]) => void;
}) {
  const suggested = result.suggestedRole;
  if (result.passed || !suggested) return null;

  return (
    <section
      aria-labelledby="result-recommendation-heading"
      className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-5"
    >
      <h2
        id="result-recommendation-heading"
        className="flex items-center gap-2 text-base font-bold tracking-tight text-navy"
      >
        <Sparkles className="size-5 text-amber-600" aria-hidden="true" />
        Đề xuất từ AI Recruiter
      </h2>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-white p-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Vai trò phù hợp hơn
          </p>
          <p className="mt-0.5 text-lg font-extrabold tracking-tight text-navy">
            {suggested.label}
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Kỹ năng của vai trò đề xuất">
            {suggested.tags.map((tag) => (
              <li key={tag}>
                <TagPill tone="green">{tag}</TagPill>
              </li>
            ))}
          </ul>
        </div>
        <div aria-hidden="true" className="relative h-20 w-16 shrink-0">
          <Image
            src="/images/robot-v2.png"
            alt=""
            fill
            sizes="64px"
            className="object-contain"
          />
        </div>
      </div>

      <h3 className="mt-4 text-[13px] font-bold uppercase tracking-wide text-slate-500">
        Lý do đề xuất
      </h3>
      <ul className="mt-2 flex list-disc flex-col gap-2 pl-4 text-[13px] leading-relaxed text-slate-700 marker:text-amber-500">
        {suggested.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onContinue(suggested.id)}
        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1"
      >
        Tiếp tục với {suggested.label}
      </button>
      <p className="mt-2 text-xs leading-relaxed text-amber-800">
        Hành động này chỉ cập nhật lựa chọn vai trò trong phiên onboarding
        hiện tại — không tạo phân công nào phía hệ thống.
      </p>
    </section>
  );
}
