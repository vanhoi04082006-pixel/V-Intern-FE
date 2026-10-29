"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarClock,
  CircleDashed,
  CircleDotDashed,
  Loader2,
  Send,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { TaskStatus, WorkspaceData, WorkspaceTask } from "@/lib/types";
import { PriorityBadge, StatusBadge, dueInfo, formatDateVi } from "@/components/workspace/badges";

const COLUMNS: { id: TaskStatus; label: string; hint: string }[] = [
  { id: "todo", label: "Cần làm", hint: "chưa bắt đầu" },
  { id: "in_progress", label: "Đang làm", hint: "đang tay" },
  { id: "review", label: "Chờ duyệt", hint: "chờ mentor" },
  { id: "done", label: "Hoàn thành", hint: "đã xong" },
];

const STATUS_OPTIONS: TaskStatus[] = ["todo", "in_progress", "review", "done"];

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "Cần làm",
  in_progress: "Đang làm",
  review: "Chờ duyệt",
  done: "Hoàn thành",
};

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  todo: "in_progress",
  in_progress: "review",
  review: "done",
  done: "todo",
};

function TaskCard({
  task,
  onOpen,
}: {
  task: WorkspaceTask;
  onOpen: (t: WorkspaceTask) => void;
}) {
  const info = dueInfo(task.dueDate);
  return (
    <button
      type="button"
      onClick={() => onOpen(task)}
      className="w-full rounded-xl border-2 border-ink/12 bg-raised p-4 text-left transition-all hover:-translate-y-0.5 hover:border-blue/50 hover:shadow-[3px_3px_0_0_var(--hard-shadow)] focus-visible:border-blue"
    >
      <p className="text-[13px] font-bold leading-snug text-ink">{task.title}</p>
      <p className="mt-1 truncate text-[11px] text-ink-faint">{task.sprintName}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={task.priority} />
        {task.dueDate ? (
          <span
            className={
              "inline-flex items-center gap-1 rounded-full border-2 px-2 py-0.5 text-[11px] font-bold " +
              (info.overdue
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : info.soon
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-600"
                  : "border-ink/15 bg-raised text-ink-soft")
            }
          >
            <CalendarClock className="h-3 w-3" aria-hidden="true" />
            {info.text}
          </span>
        ) : null}
        <span className="ml-auto rounded-lg border-2 border-ink/12 bg-blue-mist px-2 py-0.5 font-mono text-[11px] font-bold text-blue">
          {task.point}đ
        </span>
      </div>
    </button>
  );
}

/** Dialog chi tiết nhiệm vụ — viết bằng div cố định để giữ đúng ngôn ngữ thiết kế. */
function TaskDetail({
  task,
  onClose,
  onStatusChange,
  changing,
}: {
  task: WorkspaceTask;
  onClose: () => void;
  onStatusChange: (status: TaskStatus) => void;
  changing: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Chi tiết nhiệm vụ: ${task.title}`}
    >
      <div
        className="absolute inset-0 bg-coal/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="sketch-card relative z-10 max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-b-none p-6 sm:rounded-2xl sm:p-7">
        <div className="tape -top-2.5 right-8 z-20" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-blue">
              {task.sprintName}
            </p>
            <h3 className="mt-2 text-lg font-extrabold leading-snug text-ink">{task.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-ink/15 text-ink-soft transition-colors hover:border-destructive hover:text-destructive"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          <span className="rounded-lg border-2 border-ink/12 bg-blue-mist px-2.5 py-0.5 font-mono text-[11px] font-bold text-blue">
            {task.point} điểm
          </span>
          {task.dueDate ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-soft">
              <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
              Hạn {formatDateVi(task.dueDate)}
            </span>
          ) : null}
        </div>

        <div className="mt-5 rounded-xl border-2 border-dashed border-ink/15 bg-paper p-4">
          <p className="whitespace-pre-line text-sm leading-relaxed text-ink-soft">
            {task.description}
          </p>
        </div>

        <div className="mt-6">
          <p className="text-[13px] font-bold text-ink">Chuyển trạng thái</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                disabled={changing || s === task.status}
                onClick={() => onStatusChange(s)}
                className={
                  "min-h-11 rounded-xl border-2 px-3 text-[13px] font-bold transition-all disabled:cursor-default " +
                  (s === task.status
                    ? "border-ink bg-ink text-paper shadow-[2px_2px_0_0_var(--blue)]"
                    : "border-ink/20 bg-raised text-ink hover:-translate-y-0.5 hover:border-blue hover:text-blue disabled:opacity-40")
                }
              >
                {s === task.status ? `✓ ${STATUS_LABEL[s]}` : STATUS_LABEL[s]}
              </button>
            ))}
          </div>
          <p className="mt-3 font-hand text-[15px] text-ink-faint">
            mẹo: kéo nhanh bằng nút bên phải mỗi thẻ nhiệm vụ nhé
          </p>
        </div>
      </div>
    </div>
  );
}

export function TasksView({ data }: { data: WorkspaceData }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<WorkspaceTask | null>(null);
  const [filterSprint, setFilterSprint] = useState<string>("all");

  const mutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? "Cập nhật thất bại.");
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      void _data;
      queryClient.invalidateQueries({ queryKey: ["workspace", data.me.id] });
      if (selected) {
        setSelected({ ...selected, status: variables.status });
      }
      toast({
        title: "Đã cập nhật!",
        description: `Nhiệm vụ chuyển sang “${STATUS_LABEL[variables.status]}”.`,
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Chưa chuyển được trạng thái",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const sprints = data.sprints;
  const visibleTasks =
    filterSprint === "all"
      ? data.tasks
      : data.tasks.filter((t) => t.sprintId === filterSprint);

  const current =
    selected !== null
      ? (visibleTasks.find((t) => t.id === selected.id) ?? selected)
      : null;

  return (
    <div className="space-y-5">
      {/* Bộ lọc sprint */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilterSprint("all")}
          className={
            "min-h-10 rounded-xl border-2 px-4 text-[13px] font-bold transition-all " +
            (filterSprint === "all"
              ? "border-ink bg-ink text-paper"
              : "border-ink/15 bg-raised text-ink-soft hover:border-blue hover:text-blue")
          }
        >
          Tất cả ({data.tasks.length})
        </button>
        {sprints.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setFilterSprint(s.id)}
            className={
              "min-h-10 rounded-xl border-2 px-4 text-[13px] font-bold transition-all " +
              (filterSprint === s.id
                ? "border-ink bg-ink text-paper"
                : "border-ink/15 bg-raised text-ink-soft hover:border-blue hover:text-blue")
            }
          >
            Sprint {s.order}
          </button>
        ))}
      </div>

      {/* Bảng kanban */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = visibleTasks
            .filter((t) => t.status === col.id)
            .sort((a, b) => a.order - b.order);
          return (
            <section
              key={col.id}
              aria-label={col.label}
              className="rounded-2xl border-2 border-ink/10 bg-blue-mist/40 p-3"
            >
              <div className="flex items-center justify-between px-1.5 pb-3 pt-1">
                <div className="flex items-center gap-2">
                  {col.id === "todo" ? (
                    <CircleDashed className="h-4 w-4 text-ink-soft" aria-hidden="true" />
                  ) : col.id === "done" ? (
                    <Send className="h-4 w-4 rotate-90 text-emerald-600" aria-hidden="true" />
                  ) : (
                    <CircleDotDashed className="h-4 w-4 text-blue" aria-hidden="true" />
                  )}
                  <h3 className="text-[13px] font-extrabold uppercase tracking-wide text-ink">
                    {col.label}
                  </h3>
                  <span className="rounded-full border-2 border-ink/15 bg-raised px-1.5 text-[11px] font-bold text-ink-soft">
                    {items.length}
                  </span>
                </div>
              </div>
              <p className="sr-only">{col.hint}</p>

              <div className="space-y-3">
                {items.length === 0 ? (
                  <p className="rounded-xl border-2 border-dashed border-ink/15 p-5 text-center font-hand text-[15px] text-ink-faint">
                    {col.id === "done" ? "chưa có gì ở đây cả…" : "trống trải ghê…"}
                  </p>
                ) : (
                  items.map((t) => (
                    <div key={t.id} className="relative">
                      <TaskCard task={t} onOpen={setSelected} />
                      <button
                        type="button"
                        aria-label={`Chuyển nhanh sang ${STATUS_LABEL[NEXT_STATUS[t.status]]}`}
                        title={`Chuyển sang ${STATUS_LABEL[NEXT_STATUS[t.status]]}`}
                        disabled={mutation.isPending}
                        onClick={() =>
                          mutation.mutate({ id: t.id, status: NEXT_STATUS[t.status] })
                        }
                        className="absolute -right-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-royal text-white shadow-[2px_2px_0_0_var(--hard-shadow)] transition-transform hover:scale-110 active:scale-95"
                      >
                        {mutation.isPending && mutation.variables?.id === t.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>

      {current ? (
        <TaskDetail
          task={current}
          onClose={() => setSelected(null)}
          onStatusChange={(status) => mutation.mutate({ id: current.id, status })}
          changing={mutation.isPending}
        />
      ) : null}
    </div>
  );
}
