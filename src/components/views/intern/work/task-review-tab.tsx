"use client";

import * as React from "react";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  GitPullRequest,
  Info,
  Send,
  Timer,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useResource } from "@/lib/client/use-resource";
import { formatDateTime, relativeTime, shortSha } from "@/lib/client/labels";
import {
  submissionApi,
  type CodeReview,
  type CodeReviewFinding,
  type Submission,
} from "@/lib/client/api";
import { Empty, Panel, PanelHeader, AnimatedProgressBar, ToneBadge } from "@/components/shared/primitives";
import { ScoreBadge, SubmissionStatusBadge } from "@/components/shared/badges";
import { InlineSpinner } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Banner, ReviewStatusBadge, ScoreRing, useCodeReviews } from "../shared";

const RUBRIC_LABELS: Record<string, string> = {
  functional: "Chức năng",
  quality: "Chất lượng code",
  testing: "Kiểm thử",
  errors: "Xử lý lỗi",
  security: "Bảo mật",
  dod: "Definition of Done",
};

const SEVERITY_UI: Record<
  CodeReviewFinding["severity"],
  { icon: React.ReactNode; className: string; label: string }
> = {
  error: {
    icon: <AlertOctagon className="size-3.5 icon" />,
    className: "text-rose border-rose/30 bg-rose/[0.06]",
    label: "Nghiêm trọng",
  },
  warning: {
    icon: <AlertTriangle className="size-3.5 icon" />,
    className: "text-amber border-amber/30 bg-amber/[0.06]",
    label: "Cảnh báo",
  },
  info: {
    icon: <Info className="size-3.5 icon" />,
    className: "text-teal border-teal/30 bg-teal/[0.06]",
    label: "Gợi ý",
  },
};

/** Tab "Nộp & Review": lịch sử nộp bài + form nộp + kết quả AI code review. */
export function TaskReviewTab({
  taskId,
  taskStatus,
  reloadTask,
}: {
  taskId: string;
  taskStatus: string;
  reloadTask: () => void;
}) {
  const subsRes = useResource(
    () => submissionApi.listOfTask(taskId),
    [taskId]
  );
  const submissions = subsRes.data?.data ?? [];
  const latest = submissions[0] ?? null;
  const { reviews, error: reviewsError, reload: reloadReviews } = useCodeReviews(
    latest && latest.status !== "withdrawn" ? latest.id : null
  );
  const newest = reviews[0] ?? null;

  const canSubmit =
    taskStatus !== "done" &&
    (!latest || latest.status === "withdrawn" || latest.status === "rework");
  const isResubmit = latest?.status === "rework";

  const reloadAll = () => {
    subsRes.reload();
    reloadReviews();
    reloadTask();
  };

  if (subsRes.loading && !subsRes.data) {
    return (
      <Panel className="p-6">
        <div className="flex items-center gap-3 text-sm text-dim">
          <InlineSpinner /> Đang tải lịch sử nộp bài…
        </div>
      </Panel>
    );
  }
  if (subsRes.error && !subsRes.data) {
    return (
      <Panel className="p-6">
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-rose">Không tải được lịch sử nộp bài.</p>
          <Button variant="outline" size="sm" onClick={subsRes.reload}>
            Thử lại
          </Button>
        </div>
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      {/* Trạng thái bài nộp gần nhất */}
      {latest ? (
        latest.status === "approved" ? (
          <Banner tone="emerald" title={`Bài nộp đã được duyệt — ${latest.score ?? 0}/100`}>
            {latest.feedback ?? "Mentor đã phê duyệt bài nộp của bạn. Nhiệm vụ chuyển sang hoàn thành."}
          </Banner>
        ) : latest.status === "rework" ? (
          <Banner tone="amber" title="Cần làm lại — mentor yêu cầu chỉnh sửa">
            {latest.feedback ?? "Vui lòng xem nhận xét và nộp lại sau khi sửa."}
          </Banner>
        ) : latest.status === "withdrawn" ? (
          <Banner tone="rose" title="Bài nộp đã được rút">
            Bạn có thể nộp lại bất cứ lúc nào bằng form bên dưới.
          </Banner>
        ) : newest?.status === "running" ? null : (
          <Banner tone="teal" title="Đã nộp bài — chờ mentor chốt kết quả">
            AI đã review xong với đề xuất {newest?.result?.score ?? "—"}/100. Mentor sẽ xác nhận để
            hoàn thành nhiệm vụ.
          </Banner>
        )
      ) : null}

      {/* Form nộp bài */}
      {canSubmit ? (
        <SubmitForm taskId={taskId} onSubmitted={reloadAll} isResubmit={isResubmit} />
      ) : null}

      {/* Lịch sử nộp bài */}
      {submissions.length > 0 ? (
        <Panel>
          <PanelHeader
            title="Lịch sử nộp bài"
            description={`${submissions.length} lần nộp — mới nhất lên đầu`}
            icon={<GitPullRequest className="size-4 icon" />}
          />
          <div className="space-y-0 p-5">
            {submissions.map((s, i) => (
              <SubmissionRow key={s.id} submission={s} last={i === submissions.length - 1} />
            ))}
          </div>
        </Panel>
      ) : !canSubmit ? (
        <Panel>
          <Empty
            icon={<GitPullRequest className="size-5 icon" />}
            title="Chưa có bài nộp nào"
            description="Nộp pull request của bạn để AI review tự động và mentor chốt duyệt."
          />
        </Panel>
      ) : null}

      {/* AI code review của bài nộp gần nhất */}
      {latest && latest.status !== "withdrawn" ? (
        <AiReviewCard
          review={newest}
          loading={reviews.length === 0 && !reviewsError}
          error={reviewsError}
          onRetry={reloadReviews}
        />
      ) : null}
    </div>
  );
}

/* ------------------------------ Form nộp bài ------------------------------ */

function SubmitForm({
  taskId,
  onSubmitted,
  isResubmit,
}: {
  taskId: string;
  onSubmitted: () => void;
  isResubmit: boolean;
}) {
  const [prUrl, setPrUrl] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [errors, setErrors] = React.useState<{ prUrl?: string; summary?: string }>({});

  const submit = async () => {
    const next: { prUrl?: string; summary?: string } = {};
    if (!/^https:\/\/github\.com\/\S+/.test(prUrl.trim())) {
      next.prUrl = "Link pull request phải bắt đầu bằng https://github.com/…";
    }
    if (summary.trim().length < 10) {
      next.summary = "Tóm tắt thay đổi tối thiểu 10 ký tự.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setBusy(true);
    try {
      await submissionApi.submit(taskId, { prUrl: prUrl.trim(), summary: summary.trim() });
      toast.success("Đã nộp bài — AI bắt đầu review ngay bây giờ.");
      setPrUrl("");
      setSummary("");
      onSubmitted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không nộp được bài, vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel>
      <PanelHeader
        title={isResubmit ? "Nộp lại sau khi sửa" : "Nộp bài"}
        description="Dán link pull request trên GitHub kèm tóm tắt thay đổi — AI sẽ review tự động trong vài giây."
        icon={<Send className="size-4 icon" />}
      />
      <div className="space-y-4 p-5">
        <div>
          <label htmlFor="pr-url" className="mb-1.5 block text-xs font-medium text-dim">
            Link pull request
          </label>
          <Input
            id="pr-url"
            value={prUrl}
            onChange={(e) => setPrUrl(e.target.value)}
            placeholder="https://github.com/edumart/shop/pull/12"
            aria-invalid={Boolean(errors.prUrl)}
            className="h-10 rounded-lg border-line bg-deep text-sm text-ink placeholder:text-faint focus:border-line-strong"
          />
          {errors.prUrl ? <p className="mt-1.5 text-xs text-rose">{errors.prUrl}</p> : null}
        </div>
        <div>
          <label htmlFor="pr-summary" className="mb-1.5 block text-xs font-medium text-dim">
            Tóm tắt thay đổi <span className="text-faint">(tối thiểu 10 ký tự)</span>
          </label>
          <Textarea
            id="pr-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Mình đã làm gì, ảnh hưởng đến phần nào, còn điểm nào chưa chắc chắn…"
            rows={3}
            aria-invalid={Boolean(errors.summary)}
            className="min-h-[88px] rounded-lg border-line bg-deep text-sm text-ink placeholder:text-faint focus:border-line-strong"
          />
          {errors.summary ? (
            <p className="mt-1.5 text-xs text-rose">{errors.summary}</p>
          ) : (
            <p className="mt-1.5 text-[11px] text-faint">{summary.trim().length}/10 ký tự tối thiểu</p>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-faint">
            Khi nộp, nhiệm vụ chuyển sang “Chờ duyệt” và AI review tự động chạy.
          </p>
          <Button onClick={submit} disabled={busy} className="rounded-lg bg-brand text-on-brand hover:bg-brand-bright">
            {busy ? "Đang nộp…" : isResubmit ? "Nộp lại bài" : "Nộp bài"}
          </Button>
        </div>
      </div>
    </Panel>
  );
}

/* --------------------------- Một lần nộp trong timeline --------------------------- */

function SubmissionRow({ submission, last }: { submission: Submission; last: boolean }) {
  return (
    <div className="relative flex gap-4 pb-5 last:pb-0">
      {!last ? <span className="absolute left-[5px] top-4 h-full w-px bg-line" aria-hidden /> : null}
      <span
        className="mt-1.5 size-[11px] shrink-0 rounded-full border-2 border-brand-bright bg-panel"
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <SubmissionStatusBadge status={submission.status} />
          <ScoreBadge score={submission.score} />
          <span className="text-[11px] text-faint">
            {formatDateTime(submission.submittedAt)} · {relativeTime(submission.submittedAt)}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
          <a
            href={submission.prUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-brand-bright transition-colors hover:text-brand-bright/80 hover:underline"
          >
            <ExternalLink className="size-3.5 icon" /> Xem pull request
          </a>
          <span className="font-mono text-[11px] text-dim" title="HEAD commit">
            {shortSha(submission.headSha)}
          </span>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-dim">{submission.summary}</p>
        {submission.feedback ? (
          <p className="mt-2 rounded-lg border border-line bg-deep/60 px-3 py-2 text-xs italic leading-relaxed text-dim">
            “{submission.feedback}”
          </p>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------ AI review card ------------------------------ */

function AiReviewCard({
  review,
  loading,
  error,
  onRetry,
}: {
  review: CodeReview | null;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  return (
    <Panel>
      <PanelHeader
        title="AI Code Review"
        description={
          review ? `Mô hình ${review.model} · ${formatDateTime(review.scoredAt)}` : "Phân tích bài nộp tự động"
        }
        icon={<GitPullRequest className="size-4 icon" />}
        actions={review ? <ReviewStatusBadge status={review.status} /> : null}
      />
      <div className="p-5">
        {error ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-rose">Không tải được kết quả AI review.</p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Thử lại
            </Button>
          </div>
        ) : review?.status === "running" ? (
          <RunningReview />
        ) : review?.result ? (
          <ReviewResult review={review} />
        ) : loading ? (
          <div className="flex items-center gap-3 text-sm text-dim">
            <InlineSpinner /> Đang tải kết quả review…
          </div>
        ) : (
          <p className="text-sm text-dim">Chưa có kết quả review cho bài nộp này.</p>
        )}
      </div>
    </Panel>
  );
}

function RunningReview() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal/10 text-teal">
          <InlineSpinner className="text-teal" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">AI đang review bài nộp của bạn…</p>
          <p className="text-xs text-dim">
            AI đọc pull request, chạy test tin cậy và chấm theo 6 tiêu chí — mất vài giây.
          </p>
        </div>
      </div>
      <div className="space-y-2.5">
        <div className="h-3 w-3/4 rounded-md skeleton-shimmer bg-white/[0.05]" />
        <div className="h-3 w-full rounded-md skeleton-shimmer bg-white/[0.05]" />
        <div className="h-3 w-5/6 rounded-md skeleton-shimmer bg-white/[0.05]" />
        <div className="grid gap-2.5 sm:grid-cols-2">
          <div className="h-3 w-full rounded-md skeleton-shimmer bg-white/[0.05]" />
          <div className="h-3 w-full rounded-md skeleton-shimmer bg-white/[0.05]" />
        </div>
      </div>
    </div>
  );
}

function ReviewResult({ review }: { review: CodeReview }) {
  const result = review.result!;
  const evidence = review.evidence;
  return (
    <div className="space-y-5">
      {/* Điểm tổng + tóm tắt */}
      <div className="flex flex-wrap items-center gap-5">
        <ScoreRing score={result.score} />
        <div className="min-w-[220px] flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-faint">
              Đề xuất của AI
            </span>
            <ToneBadge tone="zinc">chưa chốt</ToneBadge>
          </div>
          <p className="text-[13px] leading-relaxed text-dim">{result.summary}</p>
        </div>
      </div>

      {/* 6 tiêu chí rubric */}
      <div>
        <h4 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-dim">
          Điểm theo tiêu chí
        </h4>
        <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {(Object.keys(RUBRIC_LABELS) as (keyof typeof RUBRIC_LABELS)[]).map((key) => (
            <div key={key} className="flex items-center gap-3">
              <span className="w-[110px] shrink-0 text-xs text-dim">{RUBRIC_LABELS[key]}</span>
              <AnimatedProgressBar value={result.rubric[key] ?? 0} showLabel />
            </div>
          ))}
        </div>
      </div>

      {/* Findings */}
      {result.findings.length > 0 ? (
        <div>
          <h4 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-dim">
            Phát hiện ({result.findings.length})
          </h4>
          <ul className="space-y-2">
            {result.findings.map((f, i) => {
              const ui = SEVERITY_UI[f.severity] ?? SEVERITY_UI.info;
              return (
                <li
                  key={`${f.file}-${f.line}-${i}`}
                  className={cn("flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5", ui.className)}
                >
                  <span className="mt-0.5 shrink-0">{ui.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[11px] font-semibold">
                      {f.file}:{f.line}
                      <span className="ml-2 font-sans font-medium opacity-80">({ui.label})</span>
                    </p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-ink/90">{f.message}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {/* Limitations */}
      {result.limitations.length > 0 ? (
        <div className="rounded-xl border border-amber/25 bg-amber/[0.05] p-4">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber">
            <AlertTriangle className="size-3.5 icon" /> Giới hạn của bài review
          </p>
          <ul className="space-y-1.5">
            {result.limitations.map((l, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px] leading-relaxed text-dim">
                <span className="mt-[7px] size-1 shrink-0 rounded-full bg-amber/70" aria-hidden />
                {l}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Evidence */}
      {evidence?.trustedTests ? (
        <div className="rounded-xl border border-line bg-deep/60 p-4">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-dim">
            <CheckCircle2 className="size-3.5 icon text-brand-bright" /> Bằng chứng kiểm thử tin cậy
          </p>
          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-dim">
            <ToneBadge tone={evidence.trustedTests.failed > 0 ? "rose" : "emerald"} dot>
              {evidence.trustedTests.failed > 0 ? "Có test lỗi" : "Tất cả đạt"}
            </ToneBadge>
            <span className="font-mono">
              {evidence.trustedTests.passed} passed · {evidence.trustedTests.failed} failed
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-faint">
              <Timer className="size-3.5 icon" /> {evidence.trustedTests.executionTimeMs}ms
            </span>
          </div>
          <ul className="space-y-1.5">
            {evidence.trustedTests.checks.map((c) => (
              <li key={c.name} className="flex items-start gap-2.5 text-[13px]">
                {c.passed ? (
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 icon text-emerald-400" />
                ) : (
                  <XCircle className="mt-0.5 size-3.5 shrink-0 icon text-rose" />
                )}
                <div className="min-w-0">
                  <span className="font-medium text-ink">{c.name}</span>
                  <span className="ml-2 font-mono text-[11px] text-faint">{c.log}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
