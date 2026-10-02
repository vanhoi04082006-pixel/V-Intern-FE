import { GitPullRequestArrow } from "lucide-react";

import { CardLinkAction, PillButton, SectionCard } from "./intern-primitives";
import type { InternWorkspaceState } from "./data/intern-mock-data";

/**
 * Card "Pull Request & AI Review" (state active) — mock PR #42 feat/login-api
 * theo reference. KHÔNG gọi GitHub API. Status chips: Submitted (blue) /
 * AI Review: 82/100 (light) / Passed (green) — phân biệt bằng chữ, không
 * chỉ màu.
 */
export function PullRequestReviewCard({
  pullRequest,
}: {
  pullRequest: Extract<
    InternWorkspaceState,
    { status: "active" }
  >["pullRequest"];
}) {
  return (
    <SectionCard
      id="pull-request-ai-review"
      icon={GitPullRequestArrow}
      tone="blue"
      title="Pull Request & AI Review"
      actions={<CardLinkAction label="Xem trên GitHub" />}
    >
      <p className="flex flex-wrap items-baseline gap-x-1.5 text-sm font-bold text-navy">
        {pullRequest.prLabel}
        <span className="font-normal text-slate-300">/</span>
        <span className="font-mono text-[13px] font-semibold text-brand">
          {pullRequest.branch}
        </span>
      </p>

      <ul className="mt-3 flex flex-wrap items-center gap-2">
        <li className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
          {pullRequest.statusLabel}
        </li>
        <li className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          {pullRequest.reviewScore}
        </li>
        <li className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          {pullRequest.resultLabel}
        </li>
      </ul>

      <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-4 text-[13px] leading-relaxed text-slate-600 marker:text-slate-300">
        {pullRequest.feedback.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <div className="mt-4 flex justify-end">
        <PillButton variant="soft">Xem đánh giá</PillButton>
      </div>
    </SectionCard>
  );
}
