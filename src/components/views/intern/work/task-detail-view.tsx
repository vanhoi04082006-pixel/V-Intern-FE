"use client";

import * as React from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  GitBranch,
  History as HistoryIcon,
  ListChecks,
  MessageSquare,
  Play,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { navigate } from "@/lib/client/router";
import { useResource } from "@/lib/client/use-resource";
import { formatDateTime, relativeTime, taskStatusLabels } from "@/lib/client/labels";
import { ApiError } from "@/lib/client/http";
import { taskApi, type TaskDetail, type TaskSpec, type TaskStatus } from "@/lib/client/api";
import { ViewFrame } from "@/components/shared/view";
import {
  AnimatedProgressBar,
  Empty,
  KeyValue,
  Panel,
  PanelHeader,
  UserAvatar,
} from "@/components/shared/primitives";
import { PriorityBadge, RoleBadge, TaskStatusBadge } from "@/components/shared/badges";
import { ErrorBlock, LoadingBlock } from "@/components/shared/states";
import { ChatComposer } from "@/components/shared/chat";
import { ConfirmDialog } from "@/components/shared/confirm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Banner, Chip, DueDate } from "../shared";
import { TaskReviewTab } from "./task-review-tab";

const COMPLEXITY_LABELS: Record<string, string> = {
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Khó",
};

const NEXT_TRANSITION: Partial<
  Record<TaskStatus, { to: TaskStatus; label: string; hint: string }>
> = {
  todo: {
    to: "doing",
    label: "Bắt đầu làm",
    hint: "Chuyển nhiệm vụ sang “Đang làm” để bám sát tiến độ sprint.",
  },
  doing: {
    to: "review",
    label: "Chuyển sang chờ duyệt",
    hint: "Nhiệm vụ sẽ chờ mentor duyệt. Hãy nộp pull request ở tab “Nộp & Review”.",
  },
};

/** /intern/work/:id — chi tiết nhiệm vụ: tổng quan, nộp & review, bình luận, lịch sử. */
export function TaskDetailView({ params }: { params: Record<string, string> }) {
  const id = params.id ?? "";
  const taskRes = useResource<TaskDetail>(() => taskApi.detail(id), [id]);
  const specRes = useResource(() => taskApi.spec(id), [id]);
  const task = taskRes.data;
  const spec = specRes.data;

  if (taskRes.loading && !task) {
    return (
      <ViewFrame>
        <LoadingBlock variant="detail" rows={6} />
      </ViewFrame>
    );
  }
  if (taskRes.error && !task) {
    return (
      <ViewFrame>
        <ErrorBlock error={taskRes.error} onRetry={taskRes.reload} />
        <div className="mt-4 flex justify-center">
          <Button variant="outline" size="sm" onClick={() => navigate("/intern/work")}>
            <ArrowLeft className="size-3.5 icon" /> Quay lại danh sách
          </Button>
        </div>
      </ViewFrame>
    );
  }
  if (!task) return null;

  return (
    <ViewFrame>
      {/* ------------------------------ Header ------------------------------ */}
      <div className="mb-5">
        <Button
          variant="ghost"
          size="sm"
          className="mb-3 -ml-2 h-8 text-dim hover:text-ink"
          onClick={() => navigate("/intern/work")}
        >
          <ArrowLeft className="size-3.5 icon" /> Quay lại danh sách
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg border border-brand/25 bg-brand/[0.08] px-2.5 py-1 font-mono text-xs font-bold tracking-wider text-brand-bright">
            {task.code}
          </span>
          <span className="font-mono text-[11px] text-faint" title="Phiên bản (dùng để tránh ghi đè)">
            v{task.version}
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink md:text-[28px]">
          {task.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <TaskStatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          <RoleBadge role={task.role} />
          <Chip>
            <DueDate task={task} />
          </Chip>
          <Chip>{task.storyPoints} story points</Chip>
          <Chip>~{task.estimatedHours} giờ</Chip>
          {task.sprintCode ? <Chip tone="brand">{task.sprintCode}</Chip> : null}
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="w-full sm:w-fit">
          <TabsTrigger value="overview" className="flex-1 sm:flex-none">
            <ClipboardList className="size-4" /> Tổng quan
          </TabsTrigger>
          <TabsTrigger value="review" className="flex-1 sm:flex-none">
            <Send className="size-4" /> Nộp &amp; Review
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex-1 sm:flex-none">
            <MessageSquare className="size-4" /> Bình luận
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 sm:flex-none">
            <HistoryIcon className="size-4" /> Lịch sử
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab task={task} specLoading={specRes.loading} spec={spec} reloadTask={taskRes.reload} />
        </TabsContent>

        <TabsContent value="review" className="mt-4">
          <TaskReviewTab taskId={task.id} taskStatus={task.status} reloadTask={taskRes.reload} />
        </TabsContent>

        <TabsContent value="comments" className="mt-4">
          <CommentsTab task={task} reloadTask={taskRes.reload} />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <HistoryTab task={task} />
        </TabsContent>
      </Tabs>
    </ViewFrame>
  );
}

/* ============================== Tab Tổng quan ============================== */

function OverviewTab({
  task,
  spec,
  specLoading,
  reloadTask,
}: {
  task: TaskDetail;
  spec: TaskSpec | null;
  specLoading: boolean;
  reloadTask: () => void;
}) {
  const [progress, setProgress] = React.useState(task.progress);
  const [savingProgress, setSavingProgress] = React.useState(false);
  const [transitionOpen, setTransitionOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [transitioning, setTransitioning] = React.useState(false);
  const [dodChecked, setDodChecked] = React.useState<ReadonlySet<number>>(new Set());

  React.useEffect(() => {
    setProgress(task.progress);
  }, [task.progress, task.version]);

  React.useEffect(() => {
    setDodChecked(new Set());
  }, [task.id]);

  const next = NEXT_TRANSITION[task.status] ?? null;

  const saveProgress = async () => {
    setSavingProgress(true);
    try {
      await taskApi.updateMy(task.id, { progress, expectedVersion: task.version });
      toast.success(`Đã lưu tiến độ ${progress}% cho ${task.code}.`);
      reloadTask();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error("Nhiệm vụ vừa được cập nhật ở nơi khác — đã tải lại.");
      } else {
        toast.error(err instanceof Error ? err.message : "Không lưu được tiến độ.");
      }
      reloadTask();
    } finally {
      setSavingProgress(false);
    }
  };

  const confirmTransition = async () => {
    if (!next) return;
    setTransitioning(true);
    try {
      await taskApi.updateMy(task.id, {
        status: next.to,
        reason: reason.trim() || undefined,
        expectedVersion: task.version,
      });
      toast.success(`${task.code} → ${taskStatusLabels[next.to]}`);
      setReason("");
      setTransitionOpen(false);
      reloadTask();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error("Nhiệm vụ vừa được cập nhật ở nơi khác — đã tải lại.");
        setTransitionOpen(false);
      } else {
        toast.error(err instanceof Error ? err.message : "Không chuyển được trạng thái.");
      }
      reloadTask();
    } finally {
      setTransitioning(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mô tả + thông tin */}
      <Panel>
        <PanelHeader title="Mô tả công việc" icon={<ClipboardList className="size-4 icon" />} />
        <div className="space-y-5 p-5">
          <p className="whitespace-pre-line text-sm leading-relaxed text-dim">
            {task.description || "Chưa có mô tả chi tiết."}
          </p>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <KeyValue label="Vai trò">
              <RoleBadge role={task.role} />
            </KeyValue>
            <KeyValue label="Độ phức tạp">
              {COMPLEXITY_LABELS[spec?.complexity ?? ""] ?? "—"}
            </KeyValue>
            <KeyValue label="Sprint">{task.sprintCode ?? "—"}</KeyValue>
            <KeyValue label="Story points">{task.storyPoints}</KeyValue>
            <KeyValue label="Hạn chót">
              <DueDate task={task} />
            </KeyValue>
            <KeyValue label="Người thực hiện">{task.assigneeName ?? "—"}</KeyValue>
          </dl>
          {spec?.skillTags?.length ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[11px] font-medium uppercase tracking-wide text-faint">
                Kỹ năng:
              </span>
              {spec.skillTags.map((s) => (
                <Chip key={s} tone="brand">
                  {s}
                </Chip>
              ))}
            </div>
          ) : null}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Tiến độ & trạng thái */}
        <Panel>
          <PanelHeader
            title="Tiến độ & trạng thái"
            icon={<Play className="size-4 icon" />}
            description="Tiến độ do bạn tự cập nhật; trạng thái theo luồng Cần làm → Đang làm → Chờ duyệt."
          />
          <div className="space-y-5 p-5">
            {spec?.blocked ? (
              <Banner tone="amber" title="Nhiệm vụ đang bị chặn">
                Có nhiệm vụ phụ thuộc chưa hoàn thành — hãy hoàn thành các nhiệm vụ đó trước khi bắt
                đầu.
              </Banner>
            ) : null}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-dim">Tiến độ hiện tại</span>
                <span className="font-mono text-sm font-bold text-brand-bright">{progress}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                aria-label="Chỉnh tiến độ nhiệm vụ"
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/[0.08] accent-emerald-500"
              />
              <div className="mt-1 flex justify-between text-[10px] text-faint">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
              <div className="mt-3">
                <AnimatedProgressBar value={progress} showLabel />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-[11px] text-faint">Kéo thanh trượt rồi nhấn lưu để cập nhật.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg border-line text-dim hover:text-ink"
                  disabled={savingProgress || progress === task.progress}
                  onClick={saveProgress}
                >
                  {savingProgress ? "Đang lưu…" : "Lưu tiến độ"}
                </Button>
              </div>
            </div>

            <div className="border-t border-line pt-4">
              {next ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                      Trạng thái hiện tại: <TaskStatusBadge status={task.status} />
                    </p>
                    <p className="mt-1 text-xs text-dim">{next.hint}</p>
                  </div>
                  <Button
                    onClick={() => setTransitionOpen(true)}
                    className="rounded-lg bg-brand text-on-brand hover:bg-brand-bright"
                  >
                    {next.label} <ArrowRight className="size-3.5 icon" />
                  </Button>
                </div>
              ) : task.status === "review" ? (
                <Banner tone="teal" title="Đang chờ mentor duyệt">
                  Nhiệm vụ đã chuyển sang “Chờ duyệt”. Theo dõi kết quả AI review và quyết định của
                  mentor ở tab “Nộp &amp; Review”.
                </Banner>
              ) : (
                <Banner tone="emerald" title="Nhiệm vụ đã hoàn thành">
                  Bài nộp của bạn đã được mentor duyệt. Chúc mừng!
                </Banner>
              )}
            </div>
          </div>
        </Panel>

        {/* Nhiệm vụ phụ thuộc */}
        <Panel>
          <PanelHeader
            title="Nhiệm vụ phụ thuộc"
            icon={<GitBranch className="size-4 icon" />}
            description="Cần hoàn thành trước khi nhiệm vụ này sẵn sàng."
          />
          <div className="p-5">
            {task.dependencies.length === 0 ? (
              <p className="text-sm text-dim">Nhiệm vụ này không phụ thuộc nhiệm vụ nào khác.</p>
            ) : (
              <ul className="space-y-2">
                {task.dependencies.map((dep) => (
                  <li key={dep.taskId}>
                    <button
                      type="button"
                      onClick={() => navigate(`/intern/work/${dep.taskId}`)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-deep/50 px-3.5 py-2.5 text-left transition-colors hover:border-line-strong hover:bg-panel-2"
                    >
                      <div className="min-w-0">
                        <span className="font-mono text-[11px] font-semibold text-brand-bright/80">
                          {dep.code}
                        </span>
                        <p className="truncate text-[13px] font-medium text-ink">{dep.title}</p>
                      </div>
                      <TaskStatusBadge status={dep.status} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Yêu cầu */}
        <Panel>
          <PanelHeader
            title="Yêu cầu chi tiết"
            icon={<ListChecks className="size-4 icon" />}
            description="Đây là phần yêu cầu cụ thể từ spec nhiệm vụ."
          />
          <div className="p-5">
            {specLoading && !spec ? (
              <p className="flex items-center gap-2 text-sm text-dim">Đang tải yêu cầu…</p>
            ) : spec ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-dim">
                {spec.requirements}
              </p>
            ) : (
              <p className="text-sm text-dim">Chưa có yêu cầu chi tiết.</p>
            )}
            {spec?.documentation ? (
              <p className="mt-4 rounded-lg border border-line bg-deep/60 px-3 py-2.5 text-xs leading-relaxed text-faint">
                Tài liệu: {spec.documentation}
              </p>
            ) : null}
          </div>
        </Panel>

        {/* Definition of Done */}
        <Panel>
          <PanelHeader
            title="Definition of Done"
            icon={<CheckCircle2 className="size-4 icon" />}
            description="Tự đánh dấu các mục đã xong trước khi nộp bài."
            actions={
              spec?.dod?.length ? (
                <span className="font-mono text-[11px] text-dim">
                  {dodChecked.size}/{spec.dod.length}
                </span>
              ) : null
            }
          />
          <div className="p-5">
            {specLoading && !spec ? (
              <p className="text-sm text-dim">Đang tải danh mục kiểm tra…</p>
            ) : spec?.dod?.length ? (
              <ul className="space-y-2.5">
                {spec.dod.map((item, i) => {
                  const checked = dodChecked.has(i);
                  return (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() =>
                          setDodChecked((prev) => {
                            const nextSet = new Set(prev);
                            if (nextSet.has(i)) nextSet.delete(i);
                            else nextSet.add(i);
                            return nextSet;
                          })
                        }
                        className="flex w-full items-start gap-3 rounded-xl border border-line bg-deep/50 px-3.5 py-2.5 text-left transition-colors hover:border-line-strong"
                        aria-pressed={checked}
                      >
                        <span
                          className={
                            checked
                              ? "mt-0.5 grid size-4 shrink-0 place-items-center rounded-[4px] bg-brand text-on-brand"
                              : "mt-0.5 size-4 shrink-0 rounded-[4px] border border-line-strong"
                          }
                          aria-hidden
                        >
                          {checked ? <CheckCircle2 className="size-3 icon" /> : null}
                        </span>
                        <span
                          className={
                            checked
                              ? "text-[13px] leading-relaxed text-dim line-through decoration-brand/60"
                              : "text-[13px] leading-relaxed text-ink"
                          }
                        >
                          {item}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-dim">Chưa có danh mục kiểm tra cho nhiệm vụ này.</p>
            )}
            {spec?.expectedOutput ? (
              <div className="mt-4">
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-faint">
                  Kết quả mong đợi
                </p>
                <p className="rounded-lg border border-line bg-deep/60 px-3 py-2.5 text-[13px] leading-relaxed text-dim">
                  {spec.expectedOutput}
                </p>
              </div>
            ) : null}
          </div>
        </Panel>
      </div>

      {/* ConfirmDialog chuyển trạng thái */}
      <ConfirmDialog
        open={transitionOpen}
        onOpenChange={(open) => {
          setTransitionOpen(open);
          if (!open) setReason("");
        }}
        title={next ? `Chuyển ${task.code} sang “${taskStatusLabels[next.to]}”?` : ""}
        description={next?.hint}
        confirmLabel={next ? `Chuyển sang ${taskStatusLabels[next.to]}` : "Xác nhận"}
        busy={transitioning}
        onConfirm={confirmTransition}
      >
        <div>
          <label htmlFor="transition-reason" className="mb-1.5 block text-xs font-medium text-dim">
            Lý do (không bắt buộc)
          </label>
          <Textarea
            id="transition-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="VD: Đã xong luồng chính, còn chờ test edge case…"
            rows={2}
            className="min-h-[64px] rounded-lg border-line bg-deep text-sm text-ink placeholder:text-faint focus:border-line-strong"
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}

/* ============================== Tab Bình luận ============================== */

function CommentsTab({ task, reloadTask }: { task: TaskDetail; reloadTask: () => void }) {
  const [draft, setDraft] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const send = async () => {
    const content = draft.trim();
    if (!content) return;
    setBusy(true);
    try {
      await taskApi.addComment(task.id, content);
      setDraft("");
      toast.success("Đã gửi bình luận.");
      reloadTask();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không gửi được bình luận.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader
          title="Bình luận"
          icon={<MessageSquare className="size-4 icon" />}
          description={`${task.comments.length} bình luận trên nhiệm vụ này`}
        />
        <div className="space-y-4 p-5">
          {task.comments.length === 0 ? (
            <Empty
              icon={<MessageSquare className="size-5 icon" />}
              title="Chưa có bình luận"
              description="Đặt câu hỏi hoặc cập nhật tiến độ cho mentor ngay tại đây."
            />
          ) : (
            <ul className="space-y-4">
              {task.comments.map((c) => (
                <li key={c.id} className="flex gap-3">
                  <UserAvatar name={c.authorName} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-[13px] font-semibold text-ink">{c.authorName}</span>
                      <span className="text-[11px] text-faint" title={formatDateTime(c.at)}>
                        {relativeTime(c.at)}
                      </span>
                    </div>
                    <p className="mt-1 whitespace-pre-line rounded-2xl rounded-tl-md border border-line bg-panel-2 px-3.5 py-2.5 text-[13px] leading-relaxed text-ink">
                      {c.content}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-line p-4">
          <ChatComposer
            value={draft}
            onChange={setDraft}
            onSubmit={send}
            busy={busy}
            placeholder="Viết bình luận cho nhiệm vụ…"
            submitLabel="Gửi bình luận"
            rows={2}
          />
        </div>
      </Panel>
    </div>
  );
}

/* ============================== Tab Lịch sử ============================== */

function HistoryTab({ task }: { task: TaskDetail }) {
  const entries = [...task.history].reverse();
  return (
    <Panel>
      <PanelHeader
        title="Lịch sử trạng thái"
        icon={<HistoryIcon className="size-4 icon" />}
        description="Mọi thay đổi trạng thái của nhiệm vụ"
      />
      <div className="p-5">
        {entries.length === 0 ? (
          <Empty
            icon={<HistoryIcon className="size-5 icon" />}
            title="Chưa có lịch sử"
            description="Các thay đổi trạng thái sẽ được ghi lại tại đây."
          />
        ) : (
          <ul>
            {entries.map((h, i) => (
              <li key={`${h.at}-${i}`} className="relative flex gap-4 pb-5 last:pb-0">
                {i < entries.length - 1 ? (
                  <span className="absolute left-[5px] top-4 h-full w-px bg-line" aria-hidden />
                ) : null}
                <span
                  className="mt-1.5 size-[11px] shrink-0 rounded-full border-2 border-brand-bright bg-panel"
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {h.fromStatus ? (
                      <>
                        <TaskStatusBadge status={h.fromStatus} />
                        <ArrowRight className="size-3.5 icon text-faint" />
                      </>
                    ) : null}
                    <TaskStatusBadge status={h.toStatus} />
                  </div>
                  <p className="mt-1.5 text-xs text-dim">
                    <span className="font-medium text-ink">{h.changedBy}</span> ·{" "}
                    {formatDateTime(h.at)}
                  </p>
                  {h.reason ? (
                    <p className="mt-1 text-xs italic leading-relaxed text-faint">Lý do: {h.reason}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}
