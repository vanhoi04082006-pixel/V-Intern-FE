"use client";
import { useCallback, useState } from "react";
import { Flag, Clock, ChevronRight, GitBranch } from "lucide-react";
import {
  listTasks,
  statusLabels,
  priorityLabels,
  taskStatuses,
  type TaskStatus,
} from "@/lib/api/work";
import { useResource } from "@/lib/api/use-resource";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { Empty } from "./primitives";
import { DropColumn, canOwnDrop, draggableTask } from "./kanban-dnd";
import { useOwnTaskDrop } from "./use-own-task-drop";

const tones: Record<TaskStatus, string> = {
  todo: "border-t-slate-400",
  doing: "border-t-blue-500",
  review: "border-t-amber-500",
  done: "border-t-emerald-500",
};
export function OwnKanban({
  search,
  priority,
  onOpen,
  revision = 0,
  onUpdated,
}: {
  search: string;
  priority: string;
  onOpen: (id: string) => void;
  revision?: number;
  onUpdated?: () => void;
}) {
  const [moved, setMoved] = useState(0);
  const drop = useOwnTaskDrop(() => { setMoved(value => value + 1); onUpdated?.(); }, onOpen);
  return (
    <>
    <p className="mt-4 text-sm text-slate-600">Kéo thẻ từ Cần làm sang Đang làm. Thả sang Chờ duyệt để mở chi tiết và nộp bài; giảng viên duyệt Hoàn thành. Bạn cũng có thể bấm thẻ để cập nhật.</p>
    {drop.error && <p role="alert" className="mt-2 text-sm text-rose-700">{drop.error}</p>}
    {drop.busy && <p role="status">Đang cập nhật nhiệm vụ…</p>}
    <div className="mt-4 grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
      {taskStatuses.map((status) => (
        <KanbanColumn
          key={`${status}-${search}-${priority}`}
          status={status}
          search={search}
          priority={priority}
          revision={revision + moved}
          onOpen={onOpen}
          onDrop={drop.move}
          busy={drop.busy}
        />
      ))}
    </div>
    </>
  );
}
function KanbanColumn({
  status,
  search,
  priority,
  onOpen,
  revision,
  onDrop,
  busy,
}: {
  status: TaskStatus;
  search: string;
  priority: string;
  onOpen: (id: string) => void;
  revision: number;
  onDrop: (id: string, to: TaskStatus) => void;
  busy: boolean;
}) {
  const [page, setPage] = useState(1);
  const data = useResource(
    useCallback(
      (signal: AbortSignal) => {
        // Mutation revision invalidates this column without resetting its page.
        void revision;
        return listTasks(
          new URLSearchParams({
            mine: "true",
            status,
            ...(search.trim() ? { search: search.trim() } : {}),
            ...(priority ? { priority } : {}),
            sortBy: "priority",
            sortOrder: "DESC",
            page: String(page),
            pageSize: "8",
          }),
          signal,
        );
      },
      [status, search, priority, page, revision],
    ),
  );
  return (
    <DropColumn status={status} canDrop={from => !busy && canOwnDrop(from, status)} onDrop={onDrop} className="h-full">
    <section
      aria-label={statusLabels[status]}
      className={`min-w-0 rounded-2xl border border-t-4 border-slate-200 bg-slate-50/70 p-3 ${tones[status]}`}
    >
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-navy">{statusLabels[status]}</h2>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
          {data.data?.total ?? "…"}
        </span>
      </header>
      {data.loading ? (
        <LoadingState />
      ) : data.error ? (
        <ErrorState error={data.error} onRetry={data.reload} />
      ) : !data.data?.items.length ? (
        <Empty>Chưa có công việc.</Empty>
      ) : (
        <div className="space-y-3">
          {data.data.items.map((t) => (
            <button
              key={t.id}
              {...(!busy && (t.status === "todo" || t.status === "doing") ? draggableTask(t.id, t.status) : {})}
              onClick={() => onOpen(t.id)}
              className="group w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 [&[draggable=true]]:cursor-grab [&[draggable=true]]:active:cursor-grabbing"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-blue-700">{t.code}</span>
                <span
                  className={`inline-flex items-center gap-1 ${t.priority === "critical" || t.priority === "high" ? "text-rose-700" : "text-slate-500"}`}
                >
                  <Flag size={12} />
                  {priorityLabels[t.priority]}
                </span>
              </div>
              <p className="my-3 text-sm font-semibold leading-6 text-navy">
                {t.title}
              </p>
              <p className="mb-2 break-words text-xs text-slate-500">Sprint: {t.sprint?.name ?? 'Chưa gắn Sprint'}</p>
              <div className="mb-3 flex items-start gap-1.5 text-xs text-slate-600">
                <GitBranch size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span className="min-w-0 break-words">{t.repository
                  ? `${t.repository.fullName} · ${{ ready: 'Sẵn sàng', provisioning: 'Đang tạo repository', failed: 'Cần giảng viên xử lý' }[t.repository.status]}`
                  : 'Chưa có repository cho phiên'}</span>
              </div>
              <p className="mb-1 text-right text-xs font-semibold text-slate-600">{t.progress}%</p>
              <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${t.progress}%` }}
                />
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-slate-500">
                <Clock size={12} />
                {t.dueDate
                  ? new Date(t.dueDate).toLocaleDateString("vi-VN")
                  : "Chưa có hạn"}
                <ChevronRight size={14} className="ml-auto text-blue-500" />
              </div>
            </button>
          ))}
        </div>
      )}
      {data.data && data.data.totalPages > 1 && (
        <div className="mt-4 flex justify-between text-xs">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Trước
          </button>
          <span>
            {page}/{data.data.totalPages}
          </span>
          <button
            disabled={page >= data.data.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
          </button>
        </div>
      )}
    </section>
    </DropColumn>
  );
}
