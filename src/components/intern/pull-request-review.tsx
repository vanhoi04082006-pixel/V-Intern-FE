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
      <p className="flex flex-wrap items-baseline gap-x-2 text-body font-bold text-foreground">
        {pullRequest.prLabel}
        <span className="font-normal text-muted-foreground">/</span>
        <span className="font-mono text-small font-semibold text-primary">
          {pullRequest.branch}
        </span>
      </p>

      <ul className="mt-3 flex flex-wrap items-center gap-2">
        <li className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-caption font-semibold text-primary">
          {pullRequest.statusLabel}
        </li>
        <li className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-caption font-semibold text-muted-foreground">
          {pullRequest.reviewScore}
        </li>
        <li className="inline-flex items-center rounded-full bg-success-subtle px-3 py-1 text-caption font-semibold text-success">
          {pullRequest.resultLabel}
        </li>
      </ul>

      <ul className="mt-3 flex list-disc flex-col gap-2 pl-4 text-small leading-relaxed text-muted-foreground marker:text-muted-foreground">
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
