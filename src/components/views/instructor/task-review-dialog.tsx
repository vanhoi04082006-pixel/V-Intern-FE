"use client";

import * as React from "react";
import {
  ExternalLink,
  GitPullRequest,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  submissionApi,
  taskApi,
  type CodeReview,
  type CodeReviewFinding,
  type Submission,
  type Task,
} from "@/lib/client/api";
import { formatDate, relativeTime, reviewStatusLabels, shortSha } from "@/lib/client/labels";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Panel,
  ToneBadge,
  Empty,
  KeyValue,
  AnimatedProgressBar,
} from "@/components/shared/primitives";
import { PriorityBadge, TaskStatusBadge, SubmissionStatusBadge, RoleBadge } from "@/components/shared/badges";
import { InlineSpinner } from "@/components/shared/states";
import { ScoreRing, rubricKeys, rubricLabels, type RubricKey } from "./shared";

type Scores = Record<RubricKey, number>;

const defaultScores: Scores = {
  functional: 70,
  quality: 70,
  testing: 70,
  errors: 70,
  security: 70,
  dod: 70,
};

const severityTones: Record<string, "rose" | "amber" | "teal"> = {
  error: "rose",
  warning: "amber",
  info: "teal",
};

/**
 * Dialog duyệt bài nộp: thông tin task + danh sách bài nộp + AI review chi tiết
 * + form chấm 6 rubric (slider 0-100). Dùng chung cho tab "Công việc" của buổi
 * thực tập và không gian sprint.
 */
export function TaskReviewDialog({
  task,
  open,
  onOpenChange,
  onReviewed,
}: {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReviewed?: () => void;
}) {
  const taskId = task?.id ?? null;

  const [submissions, setSubmissions] = React.useState<Submission[] | null>(null);
  const [subLoading, setSubLoading] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const [reviews, setReviews] = React.useState<CodeReview[] | null>(null);
  const [reviewsLoading, setReviewsLoading] = React.useState(false);

  const [scores, setScores] = React.useState<Scores>(defaultScores);
  const [feedback, setFeedback] = React.useState("");
  const [overrideReason, setOverrideReason] = React.useState("");
  const [prefilledFor, setPrefilledFor] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // Reset khi đổi task / mở lại dialog
  React.useEffect(() => {
    if (!open) return;
    setSubmissions(null);
    setReviews(null);
    setSelectedId(null);
    setScores(defaultScores);
    setFeedback("");
    setOverrideReason("");
    setPrefilledFor(null);
  }, [open, taskId]);

  // Tải danh sách bài nộp
  React.useEffect(() => {
    if (!open || !taskId) return;
    let cancelled = false;
    setSubLoading(true);
    submissionApi
      .listOfTask(taskId)
      .then((res) => {
        if (cancelled) return;
        const list = res.data ?? [];
        setSubmissions(list);
        const pick = list.find((s) => s.status !== "withdrawn") ?? list[0] ?? null;
        setSelectedId(pick ? pick.id : null);
      })
      .catch(() => {
        if (!cancelled) setSubmissions([]);
      })
      .finally(() => {
        if (!cancelled) setSubLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, taskId]);

  const selected = React.useMemo(
    () => (submissions ?? []).find((s) => s.id === selectedId) ?? null,
    [submissions, selectedId]
  );

  // Tải code review (poll 3s nếu AI đang chạy)
  React.useEffect(() => {
    if (!open || !selectedId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      setReviewsLoading(true);
      try {
        const res = await submissionApi.codeReviews(selectedId);
        if (cancelled) return;
        setReviews(res.data ?? []);
        const latest = (res.data ?? [])[0];
        if (latest?.status === "running") {
          timer = setTimeout(load, 3000);
        }
      } catch {
        if (!cancelled) setReviews([]);
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [open, selectedId]);

  const latestReview = reviews?.[0] ?? null;
  const aiResult = latestReview?.result ?? null;

  // Điền sẵn điểm đề xuất từ AI (một lần mỗi submission)
  React.useEffect(() => {
    if (!selected || !aiResult || prefilledFor === selected.id) return;
    setScores({
      functional: aiResult.rubric.functional,
      quality: aiResult.rubric.quality,
      testing: aiResult.rubric.testing,
      errors: aiResult.rubric.errors,
      security: aiResult.rubric.security,
      dod: aiResult.rubric.dod,
    });
    setPrefilledFor(selected.id);
  }, [selected, aiResult, prefilledFor]);

  const avg = React.useMemo(() => {
    const values = rubricKeys.map((k) => scores[k]);
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }, [scores]);

  const reviewable = selected?.status === "submitted" || selected?.status === "rework";

  const handleSubmit = async () => {
    if (!selected) return;
    if (!feedback.trim()) {
      toast.error("Vui lòng viết nhận xét trước khi chốt điểm");
      return;
    }
    if (avg < 70 && !overrideReason.trim()) {
      toast.error("Điểm trung bình dưới 70 — cần ghi rõ lý do yêu cầu làm lại");
      return;
    }
    setSubmitting(true);
    try {
      await submissionApi.instructorReview(selected.id, {
        scores: {
          functional: scores.functional,
          quality: scores.quality,
          testing: scores.testing,
          errors: scores.errors,
          security: scores.security,
          dod: scores.dod,
        },
        feedback: feedback.trim(),
        overrideReason: avg < 70 ? overrideReason.trim() : undefined,
      });
      toast.success(
        avg >= 70
          ? `Đã duyệt bài nộp với ${avg}/100 điểm — nhiệm vụ chuyển sang hoàn thành`
          : `Đã yêu cầu làm lại (${avg}/100) — nhiệm vụ quay về đang làm`
      );
      onReviewed?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không lưu được kết quả duyệt");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto rounded-2xl border-line bg-panel p-0">
        {task ? (
          <>
            <DialogHeader className="border-b border-line px-6 pt-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] font-semibold tracking-wider text-brand-bright/80">
                  {task.code}
                </span>
                <PriorityBadge priority={task.priority} />
                <TaskStatusBadge status={task.status} />
                <RoleBadge role={task.role} />
                <span className="ml-auto font-mono text-[10px] text-faint">
                  {task.storyPoints} SP
                </span>
              </div>
              <DialogTitle className="text-left text-base font-semibold leading-snug text-ink">
                {task.title}
              </DialogTitle>
              <DialogDescription className="text-left text-xs leading-relaxed text-dim">
                {task.description}
              </DialogDescription>
              <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 pb-4 text-[11px] text-dim">
                <span>Người thực hiện: {task.assigneeName ?? "Chưa gán"}</span>
                <span>Hạn: {formatDate(task.dueDate)}</span>
                <span>Ước lượng: {task.estimatedHours}h</span>
              </div>
            </DialogHeader>

            <div className="space-y-5 px-6 py-5">
              {/* Danh sách bài nộp */}
              <section>
                <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
                  Bài nộp
                </h4>
                {subLoading ? (
                  <div className="flex items-center gap-2 py-3 text-xs text-dim">
                    <InlineSpinner /> Đang tải bài nộp…
                  </div>
                ) : (submissions ?? []).length === 0 ? (
                  <p className="rounded-xl border border-line bg-deep/60 px-4 py-3 text-xs text-dim">
                    Chưa có bài nộp nào cho nhiệm vụ này.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {(submissions ?? []).map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(s.id)}
                          className={`flex w-full flex-wrap items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                            s.id === selectedId
                              ? "border-brand/40 bg-brand/[0.06]"
                              : "border-line bg-deep/60 hover:border-line-strong"
                          }`}
                        >
                          <GitPullRequest className="size-3.5 shrink-0 icon text-faint" />
                          <span className="font-mono text-[10px] text-dim">{shortSha(s.headSha)}</span>
                          <SubmissionStatusBadge status={s.status} />
                          <span className="min-w-0 flex-1 truncate text-xs text-ink">{s.summary}</span>
                          <span className="shrink-0 text-[10px] text-faint">
                            {relativeTime(s.submittedAt)}
                          </span>
                          {s.score !== null ? (
                            <ToneBadge tone={s.score >= 70 ? "emerald" : "rose"}>{s.score} điểm</ToneBadge>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {selected?.prUrl ? (
                  <a
                    href={selected.prUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-brand-bright hover:underline"
                  >
                    <ExternalLink className="size-3 icon" /> Mở pull request
                  </a>
                ) : null}
              </section>

              {/* AI review chi tiết */}
              {selected ? (
                <section>
                  <h4 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
                    <Sparkles className="size-3.5 icon text-brand-bright" /> AI code review
                  </h4>
                  {reviewsLoading && !reviews ? (
                    <div className="flex items-center gap-2 py-3 text-xs text-dim">
                      <InlineSpinner /> Đang tải kết quả AI…
                    </div>
                  ) : !latestReview ? (
                    <p className="rounded-xl border border-line bg-deep/60 px-4 py-3 text-xs text-dim">
                      Chưa có kết quả AI review cho bài nộp này.
                    </p>
                  ) : (
                    <Panel className="p-4">
                      <div className="flex flex-wrap items-start gap-4">
                        <ScoreRing score={aiResult?.score ?? 0} size={80} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <ToneBadge
                              tone={
                                latestReview.status === "passed"
                                  ? "emerald"
                                  : latestReview.status === "needs_changes"
                                    ? "rose"
                                    : latestReview.status === "awaiting_instructor"
                                      ? "amber"
                                      : "teal"
                              }
                              dot
                            >
                              {reviewStatusLabels[latestReview.status] ?? latestReview.status}
                            </ToneBadge>
                            <span className="font-mono text-[10px] text-faint">{latestReview.model}</span>
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-dim">{aiResult?.summary}</p>
                          {aiResult?.limitations?.length ? (
                            <ul className="mt-2 space-y-1">
                              {aiResult.limitations.map((lim) => (
                                <li key={lim} className="flex gap-1.5 text-[11px] text-faint">
                                  — {lim}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      </div>

                      {aiResult ? (
                        <>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {rubricKeys.map((key) => (
                              <div key={key}>
                                <div className="mb-1 flex items-center justify-between text-[11px]">
                                  <span className="text-dim">{rubricLabels[key]}</span>
                                  <span className="font-mono font-semibold text-ink">
                                    {aiResult.rubric[key]}
                                  </span>
                                </div>
                                <AnimatedProgressBar
                                  value={aiResult.rubric[key]}
                                  tone={aiResult.rubric[key] >= 70 ? "brand" : "amber"}
                                />
                              </div>
                            ))}
                          </div>

                          {aiResult.findings?.length ? (
                            <div className="mt-4 border-t border-line pt-3">
                              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
                                Phát hiện ({aiResult.findings.length})
                              </p>
                              <ul className="space-y-1.5">
                                {aiResult.findings.map((f: CodeReviewFinding, i: number) => (
                                  <li
                                    key={`${f.file}-${f.line}-${i}`}
                                    className="rounded-lg border border-line bg-deep/60 px-3 py-2"
                                  >
                                    <div className="flex flex-wrap items-center gap-2">
                                      <ToneBadge tone={severityTones[f.severity] ?? "zinc"}>
                                        {f.severity === "error"
                                          ? "Lỗi"
                                          : f.severity === "warning"
                                            ? "Cảnh báo"
                                            : "Gợi ý"}
                                      </ToneBadge>
                                      <span className="font-mono text-[10px] text-dim">
                                        {f.file}:{f.line}
                                      </span>
                                    </div>
                                    <p className="mt-1 text-[11px] leading-relaxed text-dim">{f.message}</p>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}

                          {latestReview.evidence?.trustedTests ? (
                            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3 text-[11px] text-dim">
                              <ShieldCheck className="size-3.5 icon text-brand-bright" />
                              Kiểm thử tin cậy: {latestReview.evidence.trustedTests.passed} đạt /{" "}
                              {latestReview.evidence.trustedTests.failed} lỗi · {latestReview.evidence.trustedTests.executionTimeMs}ms
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <div className="mt-3 flex items-center gap-2 text-xs text-teal">
                          <InlineSpinner /> AI đang phân tích bài nộp — tự động cập nhật sau vài giây…
                        </div>
                      )}
                    </Panel>
                  )}
                </section>
              ) : null}

              {/* Kết quả đã chốt (nếu bài nộp đã được duyệt/làm lại) */}
              {selected && !reviewable && selected.score !== null ? (
                <Panel className="p-4">
                  <h4 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
                    Kết quả giảng viên
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <KeyValue label="Điểm">
                      <span className="font-mono text-lg font-bold text-ink">{selected.score}/100</span>
                    </KeyValue>
                    <KeyValue label="Trạng thái">
                      <SubmissionStatusBadge status={selected.status} />
                    </KeyValue>
                    <KeyValue label="Nộp lúc">{formatDate(selected.submittedAt)}</KeyValue>
                  </div>
                  {selected.feedback ? (
                    <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-dim">
                      {selected.feedback}
                    </p>
                  ) : null}
                </Panel>
              ) : null}

              {/* Form chấm điểm */}
              {selected && reviewable ? (
                <section>
                  <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
                    Chấm điểm giảng viên
                  </h4>
                  <Panel className="p-4">
                    <div className="space-y-4">
                      {rubricKeys.map((key) => (
                        <div key={key}>
                          <div className="mb-1.5 flex items-center justify-between">
                            <span className="text-xs font-medium text-dim">
                              {rubricLabels[key]}
                              {prefilledFor === selected.id && aiResult ? (
                                <span className="ml-1.5 text-[10px] text-faint">(đề xuất: {aiResult.rubric[key]})</span>
                              ) : null}
                            </span>
                            <span className="w-10 text-right font-mono text-sm font-bold text-ink">
                              {scores[key]}
                            </span>
                          </div>
                          <Slider
                            value={[scores[key]]}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={([v]) => setScores((prev) => ({ ...prev, [key]: v }))}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between rounded-xl border border-line bg-deep/60 px-4 py-3">
                      <span className="text-xs font-medium text-dim">Điểm trung bình</span>
                      <span
                        className={`font-mono text-xl font-bold ${avg >= 70 ? "text-brand-bright" : "text-amber"}`}
                      >
                        {avg}/100
                      </span>
                    </div>
                    <p className="mt-1.5 text-[10px] text-faint">
                      Trung bình ≥ 70: duyệt bài & hoàn thành nhiệm vụ. Dưới 70: yêu cầu làm lại.
                    </p>

                    <div className="mt-4 space-y-2">
                      <label htmlFor="review-feedback" className="text-xs font-medium text-dim">
                        Nhận xét cho sinh viên
                      </label>
                      <Textarea
                        id="review-feedback"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Điểm tốt, điểm cần cải thiện, hướng dẫn làm lại…"
                        className="min-h-20 rounded-lg border-line bg-deep text-sm text-ink placeholder:text-faint focus-visible:ring-brand/30"
                      />
                    </div>

                    {avg < 70 ? (
                      <div className="mt-3 space-y-2">
                        <label htmlFor="override-reason" className="text-xs font-medium text-amber">
                          Lý do yêu cầu làm lại (bắt buộc khi điểm dưới 70)
                        </label>
                        <Textarea
                          id="override-reason"
                          value={overrideReason}
                          onChange={(e) => setOverrideReason(e.target.value)}
                          placeholder="Vì sao kết quả chưa đạt dù AI đề xuất…"
                          className="min-h-16 rounded-lg border-amber/30 bg-deep text-sm text-ink placeholder:text-faint focus-visible:ring-amber/30"
                        />
                      </div>
                    ) : null}

                    <div className="mt-4 flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        className="rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
                        disabled={submitting}
                        onClick={() => onOpenChange(false)}
                      >
                        Đóng
                      </Button>
                      <Button
                        className="rounded-lg bg-brand font-semibold text-on-brand hover:bg-brand-bright"
                        disabled={submitting}
                        onClick={handleSubmit}
                      >
                        {submitting ? <InlineSpinner /> : null}
                        {avg >= 70 ? "Duyệt bài nộp" : "Yêu cầu làm lại"}
                      </Button>
                    </div>
                  </Panel>
                </section>
              ) : selected ? null : (
                <Empty
                  title="Chưa có bài nộp để duyệt"
                  description="Sinh viên chưa nộp bài cho nhiệm vụ này. Quay lại sau."
                />
              )}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/** Nút mở dialog duyệt — tiện dùng ở bảng công việc & kanban. */
export function useTaskReview(onReviewed?: () => void) {
  const [task, setTask] = React.useState<Task | null>(null);
  const [open, setOpen] = React.useState(false);

  const openReview = React.useCallback((t: Task) => {
    setTask(t);
    setOpen(true);
  }, []);

  const close = React.useCallback(() => setOpen(false), []);

  const dialog = (
    <TaskReviewDialog task={task} open={open} onOpenChange={setOpen} onReviewed={onReviewed} />
  );

  return { openReview, close, dialog };
}

/** Helper tải lại task (dùng sau khi duyệt để đồng bộ trạng thái). */
export async function refreshTask(taskId: string): Promise<Task | null> {
  try {
    return await taskApi.detail(taskId);
  } catch {
    return null;
  }
}
