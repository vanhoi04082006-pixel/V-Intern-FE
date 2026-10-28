"use client";

import * as React from "react";
import {
  CalendarDays,
  ClipboardCheck,
  Clock3,
  GitPullRequest,
  History,
  LayoutList,
  MessageSquare,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  UserCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  submissionApi,
  taskApi,
  type CodeReview,
  type Submission,
  type TaskDetail,
  type TaskSpec,
} from "@/lib/client/api";
import { taskAdminApi } from "@/lib/client/api-org";
import { ApiError } from "@/lib/client/http";
import { useResource } from "@/lib/client/use-resource";
import { formatDate, formatDateTime, relativeTime, reviewStatusLabels } from "@/lib/client/labels";
import {
  Panel,
  ToneBadge,
  Empty,
  KeyValue,
  AnimatedProgressBar,
  UserAvatar,
} from "@/components/shared/primitives";
import { PriorityBadge, RoleBadge, TaskStatusBadge, SubmissionStatusBadge } from "@/components/shared/badges";
import { LoadingBlock, ErrorBlock, InlineSpinner } from "@/components/shared/states";
import { ConfirmDialog } from "@/components/shared/confirm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { rubricKeys, rubricLabels } from "./shared";

/* ==================== Dialog task detail (quản trị) ==================== */

/**
 * Chi tiết nhiệm vụ dành cho giảng viên — dùng cho route /instructor/tasks/:id.
 * Main render: <InstructorTaskDetail taskId={id} onClose={() => ...} />
 */
export function InstructorTaskDetail({ taskId, onClose }: { taskId: string; onClose: () => void }) {
  const [tab, setTab] = React.useState("overview");
  const task = useResource(() => taskApi.detail(taskId), [taskId]);

  const reload = React.useCallback(() => task.reload(), [task]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col gap-0 overflow-hidden rounded-2xl border-line bg-panel p-0">
        {task.loading && !task.data ? (
          <div className="p-6">
            <LoadingBlock rows={6} />
          </div>
        ) : task.error || !task.data ? (
          <div className="p-6">
            <ErrorBlock error={task.error ?? new Error("Không tìm thấy nhiệm vụ")} onRetry={reload} />
          </div>
        ) : (
          <>
            <TaskHeader task={task.data} onClose={onClose} />
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <Tabs value={tab} onValueChange={setTab} className="flex h-full flex-col">
                <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl border border-line bg-deep/60 p-1 sm:w-fit">
                  <TabsTrigger
                    value="overview"
                    className="h-9 gap-1.5 rounded-lg px-3.5 text-[13px] font-medium text-dim data-[state=active]:bg-brand/12 data-[state=active]:text-brand-bright data-[state=active]:shadow-none"
                  >
                    <LayoutList className="size-3.5 icon" /> Tổng quan
                  </TabsTrigger>
                  <TabsTrigger
                    value="review"
                    className="h-9 gap-1.5 rounded-lg px-3.5 text-[13px] font-medium text-dim data-[state=active]:bg-brand/12 data-[state=active]:text-brand-bright data-[state=active]:shadow-none"
                  >
                    <ClipboardCheck className="size-3.5 icon" /> Nộp & Review
                  </TabsTrigger>
                  <TabsTrigger
                    value="comments"
                    className="h-9 gap-1.5 rounded-lg px-3.5 text-[13px] font-medium text-dim data-[state=active]:bg-brand/12 data-[state=active]:text-brand-bright data-[state=active]:shadow-none"
                  >
                    <MessageSquare className="size-3.5 icon" /> Bình luận
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="h-9 gap-1.5 rounded-lg px-3.5 text-[13px] font-medium text-dim data-[state=active]:bg-brand/12 data-[state=active]:text-brand-bright data-[state=active]:shadow-none"
                  >
                    <History className="size-3.5 icon" /> Lịch sử
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <OverviewTab task={task.data} />
                </TabsContent>
                <TabsContent value="review">
                  <ReviewTab task={task.data} onChanged={reload} />
                </TabsContent>
                <TabsContent value="comments">
                  <CommentsTab taskId={taskId} />
                </TabsContent>
                <TabsContent value="history">
                  <HistoryTab task={task.data} />
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ==================== Header ==================== */

function TaskHeader({ task, onClose }: { task: TaskDetail; onClose: () => void }) {
  return (
    <header className="border-b border-line px-6 pt-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] font-semibold tracking-wider text-brand-bright/80">{task.code}</span>
        <TaskStatusBadge status={task.status} />
        <PriorityBadge priority={task.priority} />
        <RoleBadge role={task.role} />
        <span className="ml-auto inline-flex items-center gap-2">
          <span className="font-mono text-[10px] text-faint">v{task.version}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chi tiết nhiệm vụ"
            className="grid size-8 place-items-center rounded-lg text-faint transition-colors hover:bg-panel-2 hover:text-ink"
          >
            <XCircle className="size-4 icon" />
          </button>
        </span>
      </div>
      <h2 className="mt-1.5 text-base font-semibold leading-snug text-ink">{task.title}</h2>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-dim">{task.description}</p>

      <div className="mt-3 grid gap-3 border-t border-line py-4 sm:grid-cols-2 lg:grid-cols-4">
        <KeyValue label="Người thực hiện">
          <span className="inline-flex items-center gap-2">
            <UserAvatar name={task.assigneeName ?? "?"} size={24} />
            <span className="truncate text-[13px]">{task.assigneeName ?? "Chưa gán"}</span>
          </span>
        </KeyValue>
        <KeyValue label="Hạn chót">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5 icon text-faint" />
            {formatDate(task.dueDate)}
          </span>
        </KeyValue>
        <KeyValue label="Sprint / story points">
          <span className="font-mono text-[13px]">
            {task.sprintCode ?? "—"} · {task.storyPoints} SP
          </span>
        </KeyValue>
        <KeyValue label="Tiến độ">
          <div className="mt-1 flex items-center gap-2">
            <AnimatedProgressBar value={task.progress} className="w-24" />
            <span className="font-mono text-xs font-semibold text-ink">{task.progress}%</span>
          </div>
        </KeyValue>
      </div>
    </header>
  );
}

/* ==================== Tab: Tổng quan ==================== */

const complexityLabels: Record<string, string> = {
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Khó",
};

function OverviewTab({ task }: { task: TaskDetail }) {
  const spec = useResource(() => taskApi.spec(task.id), [task.id]);

  return (
    <div className="space-y-4">
      {task.dependencies.length > 0 ? (
        <div className="rounded-xl border border-line bg-deep/60 p-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
            Phụ thuộc ({task.dependencies.length})
          </p>
          <ul className="space-y-1.5">
            {task.dependencies.map((d) => (
              <li key={d.taskId} className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono text-[10px] font-semibold text-brand-bright/80">{d.code}</span>
                <span className="min-w-0 flex-1 truncate text-dim">{d.title}</span>
                <TaskStatusBadge status={d.status} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {spec.loading ? (
        <LoadingBlock rows={5} />
      ) : spec.error ? (
        <ErrorBlock error={spec.error} onRetry={spec.reload} />
      ) : spec.data ? (
        <SpecView spec={spec.data} />
      ) : null}
    </div>
  );
}

function SpecView({ spec }: { spec: TaskSpec }) {
  return (
    <>
      <Panel className="p-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">Yêu cầu</p>
        <p className="whitespace-pre-line text-xs leading-relaxed text-dim">{spec.requirements}</p>

        <div className="mt-4 border-t border-line pt-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
            Tiêu chí hoàn thành (Definition of Done)
          </p>
          <ul className="space-y-1.5">
            {spec.dod.map((d) => (
              <li key={d} className="flex items-start gap-2 text-xs leading-relaxed text-ink">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0 icon text-brand-bright" />
                {d}
              </li>
            ))}
          </ul>
        </div>

        {spec.documentation ? (
          <div className="mt-4 border-t border-line pt-3">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">Tài liệu</p>
            <p className="text-xs leading-relaxed text-dim">{spec.documentation}</p>
          </div>
        ) : null}
        {spec.expectedOutput ? (
          <div className="mt-4 border-t border-line pt-3">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">Kết quả đầu ra</p>
            <p className="text-xs leading-relaxed text-dim">{spec.expectedOutput}</p>
          </div>
        ) : null}
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2">
        <Panel className="p-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">Kỹ năng</p>
          <div className="flex flex-wrap gap-1.5">
            {spec.skillTags.length > 0 ? (
              spec.skillTags.map((t) => (
                <ToneBadge key={t} tone="teal">
                  {t}
                </ToneBadge>
              ))
            ) : (
              <span className="text-xs text-faint">—</span>
            )}
          </div>
        </Panel>
        <Panel className="p-4">
          <div className="grid gap-3">
            <KeyValue label="Độ phức tạp">
              <ToneBadge tone={spec.complexity === "hard" ? "rose" : spec.complexity === "medium" ? "amber" : "teal"}>
                {complexityLabels[spec.complexity] ?? spec.complexity}
              </ToneBadge>
            </KeyValue>
            <KeyValue label="Ước lượng">{spec.estimatedHours} giờ</KeyValue>
            <KeyValue label="Chặn">
              {spec.blocked ? <ToneBadge tone="rose" dot>Bị chặn</ToneBadge> : <ToneBadge tone="emerald" dot>Không</ToneBadge>}
            </KeyValue>
          </div>
        </Panel>
      </div>
    </>
  );
}

/* ==================== Tab: Nộp & Review ==================== */

function ReviewTab({ task, onChanged }: { task: TaskDetail; onChanged: () => void }) {
  const [submissions, setSubmissions] = React.useState<Submission[] | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [reviews, setReviews] = React.useState<CodeReview[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [decision, setDecision] = React.useState<"done" | "rework" | null>(null);
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    submissionApi
      .listOfTask(task.id)
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
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [task.id, task.version]);

  const selected = (submissions ?? []).find((s) => s.id === selectedId) ?? null;

  React.useEffect(() => {
    if (!selectedId) {
      setReviews(null);
      return;
    }
    let cancelled = false;
    setReviews(null);
    submissionApi
      .codeReviews(selectedId)
      .then((res) => {
        if (!cancelled) setReviews(res.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setReviews([]);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const latestReview = reviews?.[0] ?? null;
  const aiResult = latestReview?.result ?? null;

  const openDecision = (d: "done" | "rework") => {
    setDecision(d);
    setReason("");
  };

  const handleDecision = () => {
    if (!decision) return;
    if (reason.trim().length < 10) {
      toast.error("Lý do cần tối thiểu 10 ký tự");
      return;
    }
    setBusy(true);
    taskAdminApi
      .update(task.id, {
        status: decision === "done" ? "done" : "doing",
        reason: reason.trim(),
        expectedVersion: task.version,
      })
      .then(() => {
        toast.success(
          decision === "done"
            ? `Đã duyệt hoàn thành ${task.code} — nhiệm vụ chuyển sang hoàn thành`
            : `Đã yêu cầu làm lại ${task.code} — nhiệm vụ quay về đang làm`
        );
        setDecision(null);
        onChanged();
      })
      .catch((err) => {
        if (err instanceof ApiError && err.code === "TASK_VERSION_CONFLICT") {
          toast.error("Dữ liệu vừa được cập nhật bởi người khác — đang tải lại nhiệm vụ.");
          onChanged();
          setDecision(null);
          return;
        }
        toast.error(err instanceof Error ? err.message : "Không cập nhật được trạng thái nhiệm vụ");
      })
      .finally(() => setBusy(false));
  };

  return (
    <div className="space-y-4">
      {/* Danh sách bài nộp */}
      <section>
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">Bài nộp</h4>
        {loading ? (
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
                  <SubmissionStatusBadge status={s.status} />
                  <span className="min-w-0 flex-1 truncate text-xs text-ink">{s.summary}</span>
                  <span className="shrink-0 text-[10px] text-faint">{relativeTime(s.submittedAt)}</span>
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
            <GitPullRequest className="size-3 icon" /> Mở pull request ({selected.prUrl})
          </a>
        ) : null}
      </section>

      {/* AI code review — rubric 6 tiêu chí */}
      {selected ? (
        <section>
          <h4 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">
            <Sparkles className="size-3.5 icon text-brand-bright" /> AI code review — 6 tiêu chí
          </h4>
          {reviews === null ? (
            <div className="flex items-center gap-2 py-3 text-xs text-dim">
              <InlineSpinner /> Đang tải kết quả AI…
            </div>
          ) : !latestReview ? (
            <p className="rounded-xl border border-line bg-deep/60 px-4 py-3 text-xs text-dim">
              Chưa có kết quả AI review cho bài nộp này.
            </p>
          ) : (
            <Panel className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
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
                <span className="font-mono text-sm font-bold text-ink">{aiResult?.score ?? "—"}/100</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-dim">{aiResult?.summary}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {rubricKeys.map((key) => {
                  const value = aiResult?.rubric[key] ?? 0;
                  return (
                    <div key={key}>
                      <div className="mb-1 flex items-center justify-between text-[11px]">
                        <span className="text-dim">{rubricLabels[key]}</span>
                        <span className="font-mono font-semibold text-ink">{value}</span>
                      </div>
                      <AnimatedProgressBar value={value} tone={value >= 70 ? "brand" : "amber"} />
                    </div>
                  );
                })}
              </div>
              {aiResult?.findings?.length ? (
                <div className="mt-4 border-t border-line pt-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
                    Phát hiện ({aiResult.findings.length})
                  </p>
                  <ul className="space-y-1.5">
                    {aiResult.findings.map((f, i) => (
                      <li key={`${f.file}-${f.line}-${i}`} className="rounded-lg border border-line bg-deep/60 px-3 py-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <ToneBadge tone={f.severity === "error" ? "rose" : f.severity === "warning" ? "amber" : "teal"}>
                            {f.severity === "error" ? "Lỗi" : f.severity === "warning" ? "Cảnh báo" : "Gợi ý"}
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
            </Panel>
          )}
        </section>
      ) : null}

      {/* Hành động PATCH trạng thái */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-deep/60 px-4 py-3">
        <p className="max-w-sm text-[11px] leading-relaxed text-dim">
          Chốt trạng thái nhiệm vụ (đối chiếu phiên bản v{task.version} — nếu người khác vừa sửa, yêu cầu bị từ chối và
          tải lại).
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg border-amber/40 bg-transparent text-amber hover:bg-amber/10"
            disabled={task.status === "done"}
            onClick={() => openDecision("rework")}
          >
            <RotateCcw className="icon" /> Yêu cầu làm lại
          </Button>
          <Button
            size="sm"
            className="rounded-lg bg-brand font-semibold text-on-brand hover:bg-brand-bright"
            disabled={task.status === "done"}
            onClick={() => openDecision("done")}
          >
            <ClipboardCheck className="icon" /> Duyệt hoàn thành
          </Button>
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(decision)}
        onOpenChange={(open) => {
          if (!busy && !open) setDecision(null);
        }}
        title={decision === "done" ? `Duyệt hoàn thành ${task.code}?` : `Yêu cầu làm lại ${task.code}?`}
        description={
          decision === "done"
            ? "Nhiệm vụ chuyển sang hoàn thành (done). Sinh viên nhận thông báo kèm lý do của bạn."
            : "Nhiệm vụ quay về đang làm (doing) để sinh viên sửa và nộp lại."
        }
        confirmLabel={decision === "done" ? "Duyệt hoàn thành" : "Yêu cầu làm lại"}
        destructive={decision === "rework"}
        busy={busy}
        onConfirm={handleDecision}
      >
        <div className="space-y-1.5">
          <label htmlFor="task-decision-reason" className="text-xs font-medium text-dim">
            Lý do (tối thiểu 10 ký tự) <span className="text-rose">*</span>
          </label>
          <Textarea
            id="task-decision-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              decision === "done"
                ? "VD: Đã đạt đủ 6 tiêu chí rubric, chất lượng code tốt…"
                : "VD: Test chưa đạt 2/6 tiêu chí, cần bổ sung xử lý lỗi…"
            }
            className="min-h-20 rounded-lg border-line bg-deep text-sm text-ink placeholder:text-faint focus-visible:ring-brand/30"
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}

/* ==================== Tab: Bình luận ==================== */

function CommentsTab({ taskId }: { taskId: string }) {
  const comments = useResource(() => taskApi.comments(taskId, { page: 1, pageSize: 50 }), [taskId]);
  const [content, setContent] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = () => {
    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung bình luận");
      return;
    }
    setSubmitting(true);
    taskApi
      .addComment(taskId, content.trim())
      .then(() => {
        toast.success("Đã gửi bình luận");
        setContent("");
        comments.reload();
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Không gửi được bình luận"))
      .finally(() => setSubmitting(false));
  };

  const rows = comments.data?.data ?? [];

  return (
    <div className="space-y-4">
      {comments.loading ? (
        <LoadingBlock rows={4} />
      ) : comments.error ? (
        <ErrorBlock error={comments.error} onRetry={comments.reload} />
      ) : rows.length === 0 ? (
        <Empty
          icon={<MessageSquare />}
          title="Chưa có bình luận nào"
          description="Trao đổi với sinh viên ngay trong nhiệm vụ — sinh viên thấy bình luận trong trang việc của mình."
        />
      ) : (
        <ol className="space-y-3">
          {rows.map((c) => (
            <li key={c.id} className="flex gap-3 rounded-xl border border-line bg-deep/60 px-4 py-3">
              <UserAvatar name={c.authorName} size={32} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-semibold text-ink">{c.authorName}</span>
                  <span className="text-[10px] text-faint">{formatDateTime(c.at)}</span>
                </div>
                <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-dim">{c.content}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="rounded-2xl border border-line bg-panel p-2.5">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Viết bình luận cho nhiệm vụ…"
          rows={3}
          className="w-full resize-none bg-transparent px-2 py-1.5 text-sm text-ink outline-none placeholder:text-faint"
        />
        <div className="flex items-center justify-end px-1 pt-1">
          <Button
            size="sm"
            className="rounded-lg bg-brand text-xs font-semibold text-on-brand hover:bg-brand-bright"
            disabled={submitting || !content.trim()}
            onClick={handleSubmit}
          >
            {submitting ? <InlineSpinner /> : <Send className="size-3.5 icon" />}
            Gửi bình luận
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ==================== Tab: Lịch sử ==================== */

function HistoryTab({ task }: { task: TaskDetail }) {
  const history = task.history;
  if (history.length === 0) {
    return (
      <Empty
        icon={<History />}
        title="Chưa có lịch sử thay đổi"
        description="Mỗi lần đổi trạng thái sẽ được ghi lại ở đây."
      />
    );
  }
  return (
    <ol className="relative space-y-0 rounded-xl border border-line bg-deep/60 px-4 py-4">
      {history.map((h, i) => (
        <li key={`${h.at}-${i}`} className="relative flex gap-3 pb-5 last:pb-0">
          {i < history.length - 1 ? (
            <span
              className="absolute left-[15px] top-8 h-full w-px bg-gradient-to-b from-line to-line/40"
              aria-hidden
            />
          ) : null}
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-panel-2 text-dim">
            {h.toStatus === "done" ? (
              <ClipboardCheck className="size-3.5 icon text-brand-bright" />
            ) : h.toStatus === "review" ? (
              <Clock3 className="size-3.5 icon text-amber" />
            ) : h.toStatus === "doing" ? (
              <UserCircle2 className="size-3.5 icon text-teal" />
            ) : (
              <History className="size-3.5 icon" />
            )}
          </span>
          <div className="min-w-0 flex-1 pt-1">
            <p className="text-xs leading-relaxed text-ink">
              {h.fromStatus ? (
                <>
                  Chuyển từ <b>{h.fromStatus === "todo" ? "Cần làm" : h.fromStatus === "doing" ? "Đang làm" : h.fromStatus === "review" ? "Chờ duyệt" : "Hoàn thành"}</b> sang{" "}
                </>
              ) : (
                "Khởi tạo ở trạng thái "
              )}
              <b>{h.toStatus === "todo" ? "Cần làm" : h.toStatus === "doing" ? "Đang làm" : h.toStatus === "review" ? "Chờ duyệt" : "Hoàn thành"}</b>
            </p>
            <p className="mt-0.5 text-[10px] text-faint">
              {h.changedBy} · {formatDateTime(h.at)}
            </p>
            {h.reason ? <p className="mt-1 text-[11px] italic leading-relaxed text-dim">Lý do: {h.reason}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
