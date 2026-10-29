"use client";

/**
 * Nhiệm vụ của tôi — danh sách + chi tiết (đề bài, bàn giao PR, thảo luận, lịch sử).
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  FileText,
  GitPullRequest,
  History as HistoryIcon,
  Loader2,
  MessageSquare,
  RotateCcw,
  Send,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  addTaskComment,
  fetchCodeReviews,
  fetchTaskComments,
  fetchTaskHistory,
  fetchTaskSpec,
  fetchTaskSubmissions,
  fetchTasks,
  submitTask,
  updateMyTask,
  withdrawSubmission,
  type Submission,
  type TaskItem,
} from "@/lib/api/tasks";
import { errorMessage } from "@/lib/api/transport";
import { fmtDate, fmtDateTime } from "@/lib/api/client";
import {
  EmptyState,
  ErrorState,
  ListTable,
  LoadingState,
  PageHeader,
  StatusBadge,
  type Column,
} from "@/components/shared/kit";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "todo", label: "Cần làm" },
  { value: "doing", label: "Đang làm" },
  { value: "review", label: "Chờ duyệt" },
  { value: "done", label: "Xong" },
];

const PRIORITY_META: Record<string, { label: string; cls: string }> = {
  low: { label: "Thấp", cls: "border-ink/20 bg-ink/5 text-ink-soft" },
  medium: { label: "Trung bình", cls: "border-blue/40 bg-blue-mist text-blue" },
  high: { label: "Cao", cls: "border-amber-300 bg-amber-50 text-amber-700" },
  urgent: { label: "Khẩn cấp", cls: "border-rose-300 bg-rose-50 text-rose-600" },
  critical: { label: "Khẩn cấp", cls: "border-rose-300 bg-rose-50 text-rose-600" },
};

const SPEC_HTML_CLS =
  "max-w-none space-y-3 text-sm leading-relaxed text-ink [&_a]:font-bold [&_a]:text-blue [&_code]:rounded [&_code]:bg-blue-mist [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12px] [&_h1]:text-lg [&_h1]:font-extrabold [&_h2]:text-base [&_h2]:font-extrabold [&_h3]:text-sm [&_h3]:font-extrabold [&_li]:ml-5 [&_li]:list-disc [&_ol]:ml-5 [&_ol]:list-decimal [&_p]:leading-relaxed [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border-2 [&_pre]:border-ink/10 [&_pre]:bg-paper [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-[12px] [&_strong]:font-extrabold [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-ink/10 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-ink/10 [&_th]:bg-paper [&_th]:px-2 [&_th]:py-1 [&_ul]:ml-5 [&_ul]:list-disc";

function isOverdue(task: Pick<TaskItem, "dueDate" | "status">): boolean {
  if (!task.dueDate || task.status === "done") return false;
  return new Date(task.dueDate).getTime() < Date.now();
}

/* ─────────────────── Tab: Chi tiết ─────────────────── */

function TaskSpecPanel({ taskId }: { taskId: string }) {
  const { data: spec, isLoading, error } = useQuery({
    queryKey: ["task-spec", taskId],
    queryFn: ({ signal }) => fetchTaskSpec(taskId, signal),
    retry: false,
  });

  if (isLoading) return <LoadingState label="Đang tải đề bài…" />;
  if (error || !spec) {
    return (
      <p className="rounded-2xl border-2 border-dashed border-ink/15 bg-paper px-4 py-6 text-center text-[13px] text-ink-soft">
        Nhiệm vụ này chưa có đề bài chi tiết. Bạn có thể hỏi mentor qua tab Thảo luận nhé!
      </p>
    );
  }
  return (
    <div>
      <p className="mb-3 flex items-center gap-1.5 text-sm font-extrabold text-ink">
        <FileText className="h-4 w-4 text-blue" aria-hidden="true" />
        {spec.title}
      </p>
      <div className={cn("rounded-2xl border-2 border-ink/10 bg-paper p-4", SPEC_HTML_CLS)} dangerouslySetInnerHTML={{ __html: spec.body }} />
    </div>
  );
}

/* ─────────────────── Tab: Bàn giao ─────────────────── */

function SubmissionItem({ submission, onWithdraw, withdrawing }: {
  submission: Submission;
  onWithdraw: (id: string) => void;
  withdrawing: boolean;
}) {
  const { data: reviews } = useQuery({
    queryKey: ["code-reviews", submission.id],
    queryFn: ({ signal }) => fetchCodeReviews(submission.id, signal),
  });

  return (
    <div className="space-y-3 rounded-2xl border-2 border-ink/10 bg-paper p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={submission.status} />
          <span className="text-[12px] font-bold text-ink-soft">Nộp: {fmtDateTime(submission.submittedAt)}</span>
        </div>
        {submission.score != null ? (
          <span className="text-[13px] font-extrabold text-blue">{submission.score}/10 điểm</span>
        ) : null}
      </div>

      <div className="space-y-1.5 text-[13px] text-ink-soft">
        {submission.prUrl ? (
          <p className="flex items-center gap-1.5">
            <GitPullRequest className="h-3.5 w-3.5 shrink-0 text-blue" aria-hidden="true" />
            <a
              href={submission.prUrl}
              target="_blank"
              rel="noreferrer"
              className="break-all font-bold text-blue underline decoration-dotted underline-offset-2"
            >
              {submission.prUrl}
            </a>
          </p>
        ) : null}
        {submission.ref ? <p className="font-mono text-[12px]">ref: {submission.ref}</p> : null}
        {submission.summary ? <p className="leading-relaxed">{submission.summary}</p> : null}
      </div>

      {submission.feedback ? (
        <div className="rounded-xl border-2 border-dashed border-blue/40 bg-blue-mist/50 p-3 text-[13px] italic leading-relaxed text-ink">
          “{submission.feedback}”
        </div>
      ) : null}

      {reviews && reviews.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-ink-faint">
            Kết quả review code
          </p>
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border-2 border-ink/10 bg-paper-raised p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full border border-ink/20 bg-paper px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-ink-soft">
                  {review.source === "ai" ? "AI review" : review.source}
                </span>
                {review.score != null ? (
                  <span className="text-[12px] font-extrabold text-ink-soft">{review.score}/10</span>
                ) : null}
              </div>
              {review.findings.length > 0 ? (
                <ul className="mt-2 space-y-1.5">
                  {review.findings.map((finding, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12px] leading-relaxed text-ink-soft">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue" aria-hidden="true" />
                      {finding}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-[12px] text-ink-faint">Không có phát hiện nào — code sạch đấy ✦</p>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {submission.status === "submitted" ? (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-rose-300 text-rose-600 hover:bg-rose-50"
          disabled={withdrawing}
          onClick={() => onWithdraw(submission.id)}
        >
          {withdrawing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          Rút bài nộp
        </Button>
      ) : null}
    </div>
  );
}

function SubmitPanel({ task }: { task: TaskItem }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [prUrl, setPrUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [ref, setRef] = useState("");

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["task-submissions", task.id],
    queryFn: ({ signal }) => fetchTaskSubmissions(task.id, signal),
  });

  const submit = useMutation({
    mutationFn: () => submitTask(task.id, { prUrl: prUrl.trim(), summary: summary.trim(), ref: ref.trim() || undefined, version: task.version }),
    onSuccess: () => {
      setPrUrl("");
      setSummary("");
      setRef("");
      void queryClient.invalidateQueries({ queryKey: ["task-submissions", task.id] });
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({ queryKey: ["intern-board"] });
      toast({ title: "Đã nộp bài ✦", description: "Mentor sẽ sớm review Pull Request của bạn!" });
    },
    onError: (e) =>
      toast({ title: "Chưa nộp được bài", description: errorMessage(e), variant: "destructive" }),
  });

  const withdraw = useMutation({
    mutationFn: (submissionId: string) => withdrawSubmission(submissionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["task-submissions", task.id] });
      toast({ title: "Đã rút bài nộp", description: "Bạn có thể nộp lại sau khi chỉnh sửa nhé." });
    },
    onError: (e) =>
      toast({ title: "Chưa rút được bài", description: errorMessage(e), variant: "destructive" }),
  });

  const inputCls =
    "h-12 rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium text-ink placeholder:text-ink-faint focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";

  return (
    <div className="space-y-5">
      {task.status !== "done" ? (
        <form
          className="space-y-4 rounded-2xl border-2 border-ink/10 bg-paper p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!prUrl.trim() || !summary.trim()) {
              toast({
                title: "Thiếu thông tin nhé",
                description: "Nhập link Pull Request và mô tả thay đổi giúp mình.",
                variant: "destructive",
              });
              return;
            }
            submit.mutate();
          }}
          noValidate
        >
          <p className="flex items-center gap-1.5 text-sm font-extrabold text-ink">
            <Send className="h-4 w-4 text-blue" aria-hidden="true" />
            Nộp bài của nhiệm vụ
          </p>
          <div className="space-y-2">
            <Label htmlFor="submit-pr" className="text-[13px] font-bold">
              Link Pull Request <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="submit-pr"
              value={prUrl}
              onChange={(e) => setPrUrl(e.target.value)}
              placeholder="https://github.com/…/pull/…"
              className={inputCls}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="submit-summary" className="text-[13px] font-bold">
              Mô tả thay đổi <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="submit-summary"
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Bạn đã làm gì, gặp khó khăn gì, cần mentor chú ý gì…"
              className="rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="submit-ref" className="flex items-center gap-1.5 text-[13px] font-bold">
              Tham chiếu (tuỳ chọn) <span className="font-hand text-[14px] text-ink-faint">commit/branch</span>
            </Label>
            <Input
              id="submit-ref"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="VD: feature/login-ui"
              className={inputCls}
            />
          </div>
          <Button type="submit" className="gap-2" disabled={submit.isPending}>
            {submit.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <GitPullRequest className="h-4 w-4" aria-hidden="true" />
            )}
            Nộp bài
          </Button>
        </form>
      ) : null}

      {isLoading ? (
        <LoadingState label="Đang tải lịch sử nộp bài…" />
      ) : !submissions || submissions.length === 0 ? (
        <EmptyState
          title="Chưa nộp bài lần nào"
          description="Hoàn thành nhiệm vụ rồi nộp Pull Request để mentor duyệt nhé!"
        />
      ) : (
        <div className="space-y-3">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-ink-faint">
            Lịch sử nộp bài ({submissions.length})
          </p>
          {submissions.map((submission) => (
            <SubmissionItem
              key={submission.id}
              submission={submission}
              withdrawing={withdraw.isPending && withdraw.variables === submission.id}
              onWithdraw={(id) => withdraw.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────── Tab: Thảo luận ─────────────────── */

function CommentsPanel({ taskId }: { taskId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");

  const { data: comments, isLoading, error, refetch } = useQuery({
    queryKey: ["task-comments", taskId],
    queryFn: ({ signal }) => fetchTaskComments(taskId, signal),
  });

  const addComment = useMutation({
    mutationFn: () => addTaskComment(taskId, content.trim()),
    onSuccess: () => {
      setContent("");
      void queryClient.invalidateQueries({ queryKey: ["task-comments", taskId] });
    },
    onError: (e) =>
      toast({ title: "Chưa gửi được bình luận", description: errorMessage(e), variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      {isLoading ? (
        <LoadingState label="Đang tải thảo luận…" />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : !comments || comments.length === 0 ? (
        <EmptyState
          title="Chưa có bình luận nào"
          description="Có thắc mắc về nhiệm vụ? Hỏi mentor trực tiếp ở đây nhé!"
        />
      ) : (
        <ul className="max-h-[40vh] space-y-3 overflow-y-auto pr-1">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-2xl border-2 border-ink/10 bg-paper p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[13px] font-extrabold text-ink">{comment.authorName}</p>
                <p className="font-mono text-[11px] text-ink-faint">{fmtDateTime(comment.createdAt)}</p>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-soft">
                {comment.content}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2 rounded-2xl border-2 border-dashed border-ink/15 bg-paper p-3">
        <Textarea
          rows={2}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Viết bình luận hoặc câu hỏi của bạn…"
          className="rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25"
        />
        <Button
          size="sm"
          className="gap-1.5"
          disabled={!content.trim() || addComment.isPending}
          onClick={() => addComment.mutate()}
        >
          {addComment.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          Gửi bình luận
        </Button>
      </div>
    </div>
  );
}

/* ─────────────────── Tab: Lịch sử ─────────────────── */

function HistoryPanel({ taskId }: { taskId: string }) {
  const { data: history, isLoading, error, refetch } = useQuery({
    queryKey: ["task-history", taskId],
    queryFn: ({ signal }) => fetchTaskHistory(taskId, signal),
  });

  if (isLoading) return <LoadingState label="Đang tải lịch sử…" />;
  if (error) return <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />;
  if (!history || history.length === 0) {
    return <EmptyState title="Chưa có gì trong lịch sử" description="Các thay đổi của nhiệm vụ sẽ được ghi lại ở đây." />;
  }

  return (
    <ol className="relative space-y-4 border-l-2 border-dashed border-ink/15 pl-5">
      {history.map((entry) => (
        <li key={entry.id} className="relative">
          <span
            className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-ink bg-blue"
            aria-hidden="true"
          />
          <div className="flex flex-wrap items-center gap-2">
            {entry.fromStatus ? (
              <>
                <StatusBadge status={entry.fromStatus} />
                <span className="text-[11px] font-extrabold text-ink-faint">→</span>
              </>
            ) : null}
            {entry.toStatus ? <StatusBadge status={entry.toStatus} /> : null}
            <span className="text-[12px] font-bold text-ink-soft">{entry.actorName ?? "Hệ thống"}</span>
          </div>
          {entry.note ? (
            <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{entry.note}</p>
          ) : null}
          <p className="mt-0.5 font-mono text-[11px] text-ink-faint">{fmtDateTime(entry.createdAt)}</p>
        </li>
      ))}
    </ol>
  );
}

/* ─────────────────── Dialog chi tiết ─────────────────── */

function TaskDetailDialog({ task, onClose }: { task: TaskItem; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const priority = task.priority ? PRIORITY_META[task.priority] : null;

  const transition = useMutation({
    mutationFn: (status: string) => updateMyTask(task.id, { status, expectedVersion: task.version }),
    onSuccess: (_data, status) => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({ queryKey: ["intern-board"] });
      void queryClient.invalidateQueries({ queryKey: ["intern-workspace"] });
      toast({
        title: "Đã cập nhật nhiệm vụ ✦",
        description: status === "doing" ? "Chúc bạn làm việc hiệu quả nhé!" : "Đã gửi chờ mentor duyệt bài!",
      });
    },
    onError: (e) =>
      toast({ title: "Chưa cập nhật được", description: errorMessage(e), variant: "destructive" }),
  });

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto rounded-2xl border-2 border-ink/15 bg-paper p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-extrabold leading-snug text-ink">{task.title}</DialogTitle>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={task.status} />
            {priority ? (
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                  priority.cls,
                )}
              >
                {priority.label}
              </span>
            ) : null}
            {task.storyPoints != null ? (
              <span className="inline-flex items-center gap-0.5 text-[12px] font-extrabold text-ink-soft">
                <Zap className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                {task.storyPoints} điểm
              </span>
            ) : null}
            {task.dueDate ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-[12px] font-extrabold",
                  isOverdue(task) ? "text-rose-600" : "text-ink-soft",
                )}
              >
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                Hạn: {fmtDate(task.dueDate)}
              </span>
            ) : null}
          </div>
        </DialogHeader>

        {task.status === "todo" ? (
          <Button className="h-12 gap-2 self-start rounded-xl border-2 border-ink bg-royal px-6 font-bold text-white shadow-[4px_4px_0_0_var(--ink)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5" disabled={transition.isPending} onClick={() => transition.mutate("doing")}>
            {transition.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            Bắt đầu làm nhiệm vụ này
          </Button>
        ) : task.status === "doing" ? (
          <Button variant="outline" className="h-11 gap-2 self-start" disabled={transition.isPending} onClick={() => transition.mutate("review")}>
            {transition.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            Gửi chờ duyệt
          </Button>
        ) : null}

        <Tabs defaultValue="detail">
          <TabsList className="w-full justify-start gap-1 rounded-xl border-2 border-ink/10 bg-paper p-1">
            <TabsTrigger value="detail" className="rounded-lg px-3 py-1.5 text-[12px] font-bold data-[state=active]:bg-royal data-[state=active]:text-white">
              Chi tiết
            </TabsTrigger>
            <TabsTrigger value="submit" className="rounded-lg px-3 py-1.5 text-[12px] font-bold data-[state=active]:bg-royal data-[state=active]:text-white">
              Bàn giao
            </TabsTrigger>
            <TabsTrigger value="comments" className="rounded-lg px-3 py-1.5 text-[12px] font-bold data-[state=active]:bg-royal data-[state=active]:text-white">
              Thảo luận
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg px-3 py-1.5 text-[12px] font-bold data-[state=active]:bg-royal data-[state=active]:text-white">
              Lịch sử
            </TabsTrigger>
          </TabsList>

          <TabsContent value="detail" className="mt-4 space-y-4">
            {task.description ? (
              <div className="rounded-2xl border-2 border-ink/10 bg-paper p-4">
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-ink-faint">Mô tả</p>
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
                  {task.description}
                </p>
              </div>
            ) : null}
            <TaskSpecPanel taskId={task.id} />
          </TabsContent>

          <TabsContent value="submit" className="mt-4">
            <SubmitPanel task={task} />
          </TabsContent>

          <TabsContent value="comments" className="mt-4">
            <CommentsPanel taskId={task.id} />
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <HistoryPanel taskId={task.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────── View chính ─────────────────── */

export function InternTasksView() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["tasks", "mine", statusFilter],
    queryFn: ({ signal }) =>
      fetchTasks({ mine: true, pageSize: 50, status: statusFilter === "all" ? undefined : statusFilter }, signal),
  });

  const openTask = openTaskId ? (data?.data.find((t) => t.id === openTaskId) ?? null) : null;

  const columns: Column<TaskItem>[] = [
    {
      key: "title",
      header: "Tiêu đề",
      render: (row) => <span className="font-bold text-ink">{row.title}</span>,
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "priority",
      header: "Ưu tiên",
      render: (row) => {
        const meta = row.priority ? PRIORITY_META[row.priority] : null;
        return meta ? (
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
              meta.cls,
            )}
          >
            {meta.label}
          </span>
        ) : (
          <span className="text-ink-faint">—</span>
        );
      },
    },
    {
      key: "points",
      header: "Điểm",
      render: (row) =>
        row.storyPoints != null ? (
          <span className="inline-flex items-center gap-0.5 font-extrabold text-ink">
            <Zap className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
            {row.storyPoints}
          </span>
        ) : (
          <span className="text-ink-faint">—</span>
        ),
    },
    {
      key: "due",
      header: "Hạn",
      render: (row) => (
        <span className={cn("font-bold", isOverdue(row) ? "text-rose-600" : "text-ink-soft")}>
          {fmtDate(row.dueDate)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nhiệm vụ"
        description="Toàn bộ nhiệm vụ của bạn — mở chi tiết để xem đề bài, nộp bài và trao đổi với mentor."
        actions={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-11 w-56 rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-bold focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {isLoading ? (
        <LoadingState label="Đang tải nhiệm vụ…" />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <>
          <ListTable
            columns={columns}
            rows={data?.data ?? []}
            rowKey={(row) => row.id}
            onRowClick={(row) => setOpenTaskId(row.id)}
            emptyTitle="Chưa có nhiệm vụ nào"
            emptyDescription="Khi mentor giao việc, danh sách sẽ hiện ở đây nhé!"
          />
          <p className="flex items-center justify-center gap-1.5 text-center font-hand text-[16px] text-ink-faint">
            <HistoryIcon className="h-4 w-4" aria-hidden="true" />
            nhấp vào một dòng để mở chi tiết và nộp bài nhé ✦
          </p>
        </>
      )}

      {openTask ? <TaskDetailDialog task={openTask} onClose={() => setOpenTaskId(null)} /> : null}
    </div>
  );
}
