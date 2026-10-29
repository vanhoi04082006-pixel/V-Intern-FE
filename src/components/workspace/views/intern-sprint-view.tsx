"use client";

/**
 * Sprint — bảng nhiệm vụ 4 cột của intern, kèm chuyển trạng thái todo→doing→review.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Goal, Loader2, Send, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchMyBoard, fetchMySprints, type BoardTask } from "@/lib/api/intern";
import { updateMyTask } from "@/lib/api/tasks";
import { errorMessage } from "@/lib/api/transport";
import { fmtDate } from "@/lib/api/client";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  ProgressBar,
  SectionCard,
  StatusBadge,
} from "@/components/shared/kit";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const COLUMN_STATUSES = ["todo", "doing", "review", "done"] as const;

const PRIORITY_META: Record<string, { label: string; cls: string }> = {
  low: { label: "Thấp", cls: "border-ink/20 bg-ink/5 text-ink-soft" },
  medium: { label: "Trung bình", cls: "border-blue/40 bg-blue-mist text-blue" },
  high: { label: "Cao", cls: "border-amber-300 bg-amber-50 text-amber-700" },
  urgent: { label: "Khẩn cấp", cls: "border-rose-300 bg-rose-50 text-rose-600" },
  critical: { label: "Khẩn cấp", cls: "border-rose-300 bg-rose-50 text-rose-600" },
};

function isOverdue(task: BoardTask): boolean {
  if (!task.dueDate || task.status === "done") return false;
  return new Date(task.dueDate).getTime() < Date.now();
}

function BoardTaskCard({
  task,
  onTransition,
  pending,
}: {
  task: BoardTask;
  onTransition: (task: BoardTask, status: string) => void;
  pending: boolean;
}) {
  const priority = task.priority ? PRIORITY_META[task.priority] : null;
  const overdue = isOverdue(task);

  return (
    <div className="rounded-xl border-2 border-ink/10 bg-paper-raised p-3.5 shadow-[2px_2px_0_0_rgba(23,23,28,0.05)] transition-colors hover:border-blue/40">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-extrabold leading-snug text-ink">{task.title}</p>
        {priority ? (
          <span
            className={cn(
              "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              priority.cls,
            )}
          >
            {priority.label}
          </span>
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-ink-soft">
        {task.storyPoints != null ? (
          <span className="inline-flex items-center gap-0.5">
            <Zap className="h-3 w-3 text-amber-500" aria-hidden="true" />
            {task.storyPoints} điểm
          </span>
        ) : null}
        {task.dueDate ? (
          <span className={cn("inline-flex items-center gap-1", overdue && "text-rose-600")}>
            <CalendarDays className="h-3 w-3" aria-hidden="true" />
            {overdue ? "Trễ hạn: " : "Hạn: "}
            {fmtDate(task.dueDate)}
          </span>
        ) : null}
      </div>

      {task.progress != null ? <ProgressBar value={task.progress} className="mt-2.5" /> : null}

      {task.status === "todo" ? (
        <Button
          size="sm"
          className="mt-3 h-9 w-full gap-1.5"
          disabled={pending}
          onClick={() => onTransition(task, "doing")}
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
          Bắt đầu làm
        </Button>
      ) : task.status === "doing" ? (
        <Button
          size="sm"
          variant="outline"
          className="mt-3 h-9 w-full gap-1.5"
          disabled={pending}
          onClick={() => onTransition(task, "review")}
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
          <Send className="h-3.5 w-3.5" aria-hidden="true" />
          Gửi chờ duyệt
        </Button>
      ) : null}
    </div>
  );
}

export function InternSprintView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [chosenSprintId, setChosenSprintId] = useState<string | null>(null);

  const { data: sprints, isLoading: loadingSprints } = useQuery({
    queryKey: ["intern-sprints"],
    queryFn: ({ signal }) => fetchMySprints(signal),
  });

  // Sprint mặc định: sprint đang chạy, nếu không có thì sprint đầu tiên (derive khi render,
  // không dùng effect để tránh render dây chuyền).
  const defaultSprintId =
    sprints?.find((s) => s.status === "in_progress" || s.status === "active")?.id ??
    sprints?.[0]?.id ??
    null;
  const sprintId = chosenSprintId ?? defaultSprintId;

  const boardKey = sprintId ?? "current";
  const {
    data: board,
    isLoading: loadingBoard,
    error,
    refetch,
  } = useQuery({
    queryKey: ["intern-board", boardKey],
    queryFn: ({ signal }) => fetchMyBoard(sprintId ?? undefined, signal),
  });

  const transition = useMutation({
    mutationFn: ({ task, status }: { task: BoardTask; status: string }) =>
      updateMyTask(task.id, { status, expectedVersion: task.version }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["intern-board"] });
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({ queryKey: ["intern-workspace"] });
      toast({
        title: "Đã cập nhật nhiệm vụ ✦",
        description:
          variables.status === "doing"
            ? "Chúc bạn làm việc hiệu quả nhé!"
            : "Đã gửi chờ mentor duyệt bài!",
      });
    },
    onError: (e) =>
      toast({ title: "Chưa cập nhật được", description: errorMessage(e), variant: "destructive" }),
  });

  const hasSprint = !!board?.sprintId;
  const hasTasks = (board?.tasks.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sprint"
        description="Bảng nhiệm vụ theo cột trạng thái — kéo đẩy công việc của bạn qua từng bước nhé."
      />

      {sprints && sprints.length > 0 ? (
        <Tabs value={sprintId ?? undefined} onValueChange={setChosenSprintId}>
          <TabsList className="h-auto w-full max-w-full flex-wrap justify-start gap-1 rounded-xl border-2 border-ink/10 bg-paper p-1">
            {sprints.map((sprint) => (
              <TabsTrigger
                key={sprint.id}
                value={sprint.id}
                className="rounded-lg px-3 py-1.5 text-[12px] font-bold data-[state=active]:bg-royal data-[state=active]:text-white"
              >
                {sprint.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      ) : null}

      {loadingSprints || loadingBoard ? (
        <LoadingState label="Đang tải bảng sprint…" />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : !hasSprint && !hasTasks ? (
        <EmptyState
          title="Chưa có sprint nào"
          description="Đồ án của bạn chưa có sprint nào được lên kế hoạch. Khi mentor tạo sprint, bảng nhiệm vụ sẽ hiện ở đây."
        />
      ) : (
        <>
          <SectionCard>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-extrabold text-ink">{board?.sprintName ?? "Sprint hiện tại"}</p>
                  {board?.status ? <StatusBadge status={board.status} /> : null}
                </div>
                {board?.sprintGoal ? (
                  <p className="flex items-start gap-1.5 text-[13px] leading-relaxed text-ink-soft">
                    <Goal className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue" aria-hidden="true" />
                    {board.sprintGoal}
                  </p>
                ) : null}
              </div>
              <p className="shrink-0 rounded-xl border-2 border-dashed border-ink/15 bg-paper px-3 py-1.5 font-hand text-[15px] text-ink-faint">
                {board?.startDate ? fmtDate(board.startDate) : "—"} → {board?.endDate ? fmtDate(board.endDate) : "—"}
              </p>
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {COLUMN_STATUSES.map((status) => {
              const tasks = (board?.tasks ?? []).filter((t) => t.status === status);
              const count = board?.columns.find((c) => c.status === status)?.count ?? tasks.length;
              return (
                <div
                  key={status}
                  className="rounded-2xl border-2 border-ink/12 bg-paper p-3 shadow-[3px_3px_0_0_rgba(23,23,28,0.06)]"
                >
                  <div className="mb-3 flex items-center justify-between px-1">
                    <StatusBadge status={status} />
                    <span className="text-[12px] font-extrabold text-ink-faint">{count}</span>
                  </div>
                  <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-0.5">
                    {tasks.length === 0 ? (
                      <p className="rounded-xl border-2 border-dashed border-ink/10 px-3 py-6 text-center text-[12px] text-ink-faint">
                        Chưa có nhiệm vụ
                      </p>
                    ) : (
                      tasks.map((task) => (
                        <BoardTaskCard
                          key={task.id}
                          task={task}
                          pending={transition.isPending && transition.variables?.task.id === task.id}
                          onTransition={(t, status) => transition.mutate({ task: t, status })}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
