"use client";

import { Bot, Sparkles } from "lucide-react";

import type { RecruitmentResultData } from "./data/recruitment-mock-data";
import { TagPill } from "./onboarding-primitives";

/**
 * Các card "AI Recruiter nói gì" trên Result screen (dùng chung pass/fail):
 * - `RecruiterFeedback`: nhận xét chi tiết của AI Recruiter — compact
 *   (3 bullet) nằm dưới score card ở cột chính.
 * - `RoleRecommendation`: chỉ render khi fail — card THÔNG TIN compact nằm
 *   trong RAIL PHẢI theo reference 4B (không còn full-width dưới main);
 *   CTA "Tiếp tục với {vai trò}" nằm ở hàng CTA chính của recruitment-result.
 *   Thuần gợi ý UI, KHÔNG tạo bất kỳ phân công/persist nào phía server.
 */
export function RecruiterFeedback({
  result,
}: {
  result: RecruitmentResultData;
}) {
  return (
    <section
      aria-labelledby="result-feedback-heading"
      className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
    >
      <h2
        id="result-feedback-heading"
        className="flex items-center gap-2 text-[15px] font-bold tracking-tight text-navy"
      >
        <Bot className="size-5 text-brand" aria-hidden="true" />
        Nhận xét từ AI Recruiter
      </h2>
      <ul className="mt-2.5 flex list-disc flex-col gap-1.5 pl-4 text-[13px] leading-relaxed text-slate-700 marker:text-brand/50">
        {result.feedback.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export function RoleRecommendation({
  result,
}: {
  result: RecruitmentResultData;
}) {
  const suggested = result.suggestedRole;
  if (result.passed || !suggested) return null;

  return (
    <section
      aria-labelledby="result-recommendation-heading"
      className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
    >
      <h2
        id="result-recommendation-heading"
        className="flex items-center gap-2 text-[15px] font-bold tracking-tight text-navy"
      >
        <Sparkles className="size-5 text-amber-600" aria-hidden="true" />
        Đề xuất từ AI Recruiter
      </h2>

      {/* Role + tags inline compact (không box lồng) — density rail reference */}
      <p className="mt-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
        Vai trò phù hợp hơn
      </p>
      <p className="mt-0.5 text-lg font-extrabold tracking-tight text-navy">
        {suggested.label}
      </p>
      <ul
        className="mt-1.5 flex flex-wrap gap-1.5"
        aria-label="Kỹ năng của vai trò đề xuất"
      >
        {suggested.tags.map((tag) => (
          <li key={tag}>
            <TagPill tone="green">{tag}</TagPill>
          </li>
        ))}
      </ul>

      {/* Lý do gộp 1 đoạn clamp-3 — đủ business info, tiết kiệm chiều cao */}
      <p className="mt-2.5 line-clamp-3 text-[13px] leading-relaxed text-slate-700">
        {suggested.reasons.join(" ")}
      </p>

    </section>
  );
}
