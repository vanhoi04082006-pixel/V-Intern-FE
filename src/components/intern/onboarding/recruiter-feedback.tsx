"use client";

import { Bot, Sparkles } from "lucide-react";

import type { RecruitmentResultData } from "./recruitment-model";
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
      className="rounded-panel border border-border bg-card p-4 shadow-app-xs"
    >
      <h2
        id="result-feedback-heading"
        className="flex items-center gap-2 text-body font-bold tracking-tight text-foreground"
      >
        <Bot className="size-5 text-primary" aria-hidden="true" />
        Nhận xét từ AI Recruiter
      </h2>
      <ul className="mt-3 flex list-disc flex-col gap-2 pl-4 text-small leading-relaxed text-foreground marker:text-primary/50">
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
      className="rounded-panel border border-border bg-warning-subtle p-4 shadow-app-xs"
    >
      <h2
        id="result-recommendation-heading"
        className="flex items-center gap-2 text-body font-bold tracking-tight text-foreground"
      >
        <Sparkles className="size-5 text-warning" aria-hidden="true" />
        Đề xuất từ AI Recruiter
      </h2>

      {/* Role + tags inline compact (không box lồng) — density rail reference */}
      <p className="mt-3 text-caption font-bold  text-muted-foreground">
        Vai trò phù hợp hơn
      </p>
      <p className="mt-1 text-section font-extrabold tracking-tight text-foreground">
        {suggested.label}
      </p>
      <ul
        className="mt-2 flex flex-wrap gap-2"
        aria-label="Kỹ năng của vai trò đề xuất"
      >
        {suggested.tags.map((tag) => (
          <li key={tag}>
            <TagPill tone="green">{tag}</TagPill>
          </li>
        ))}
      </ul>

      {/* Lý do gộp 1 đoạn clamp-3 — đủ business info, tiết kiệm chiều cao */}
      <p className="mt-3 line-clamp-3 text-small leading-relaxed text-foreground">
        {suggested.reasons.join(" ")}
      </p>

    </section>
  );
}
