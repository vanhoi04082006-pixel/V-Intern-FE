"use client";
import { useCallback, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Gauge,
  Flag,
  GitBranch,
  Info,
  SquareKanban,
} from "lucide-react";
import {
  listTasks,
  statusLabels,
  priorityLabels,
  taskStatuses,
  type TaskStatus,
} from "@/lib/api/work";
import { useResource } from "@/lib/api/use-resource";
import { ErrorState } from "@/components/shared/data-state";
import { InlineAlert } from "./primitives";
import { DropColumn, canOwnDrop, draggableTask } from "./kanban-dnd";
import { useOwnTaskDrop, type OwnTaskOpenIntent } from "./use-own-task-drop";
import { StudentProgress } from "@/components/intern/student-ui";
import { useInternWorkspaceContext } from "@/components/intern/intern-workspace-context";
import { TaskDeadline } from "@/components/workspace/task-deadline";

export function OwnKanban({
  search,
  priority,
  onOpen,
  revision = 0,
  onUpdated,
}: {
  search: string;
  priority: string;
  onOpen: (id: string, intent?: OwnTaskOpenIntent) => void;
  revision?: number;
  onUpdated?: () => void;
}) {
  const [moved, setMoved] = useState(0);
  const workspace = useInternWorkspaceContext();
  const drop = useOwnTaskDrop(() => {
    setMoved((value) => value + 1);
    workspace?.reload();
    onUpdated?.();
  }, onOpen);
  return (
    <>
      <div className="student-notice">
        <Info size={16} className="shrink-0" aria-hidden="true" />
        <p>
          Kéo thẻ từ <strong>Cần làm</strong> sang <strong>Đang làm</strong>.
          Thả sang <strong>Chờ duyệt</strong> sẽ mở biểu mẫu nộp bài; thẻ chỉ
          chuyển trạng thái sau khi nộp thành công. Giảng viên duyệt{" "}
          <strong>Hoàn thành</strong>. Bạn cũng có thể bấm thẻ để cập nhật.{" "}
          <span className="student-board-touch-hint">
            Trên điện thoại, vuốt ngang để xem các cột.
          </span>
        </p>
      </div>
      {drop.error && (
        <div className="mt-3">
          <InlineAlert tone="danger">{drop.error}</InlineAlert>
        </div>
      )}
      {drop.busy && (
        <p role="status" className="mt-3 text-body text-muted-foreground">
          Đang cập nhật nhiệm vụ…
        </p>
      )}
      <div className="student-board mt-4">
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
    <DropColumn
      status={status}
      canDrop={(from) => !busy && canOwnDrop(from, status)}
      onDrop={onDrop}
      className={`student-board-column student-column-${status}`}
    >
      <section aria-label={statusLabels[status]}>
        <header className="student-board-head">
          <h2>
            {statusLabels[status]}
            <span className="student-board-count">
              {data.data?.total ?? "…"}
            </span>
          </h2>
          <p>{{ todo: "Đọc yêu cầu và chuẩn bị", doing: "Tập trung từng nhiệm vụ", review: "Đã nộp, chờ phản hồi", done: "Được giảng viên xác nhận" }[status]}</p>
        </header>
        {data.loading ? (
          <div className="space-y-3" role="status">
            <span className="sr-only">
              Đang tải cột {statusLabels[status]}…
            </span>
            {[0, 1].map((card) => (
              <div key={card} className="student-skeleton h-[118px]" />
            ))}
          </div>
        ) : data.error ? (
          <ErrorState error={data.error} onRetry={data.reload} />
        ) : !data.data?.items.length ? (
          <p className="student-board-empty">
            {
              {
                todo: "Chưa có công việc cần bắt đầu.",
                doing: "Sẵn sàng? Kéo một thẻ Cần làm vào đây.",
                review: "Nộp bài để nhận phản hồi từ giảng viên.",
                done: "Công việc được duyệt sẽ xuất hiện ở đây.",
              }[status]
            }
          </p>
        ) : (
          <div className="space-y-3">
            {data.data.items.map((t) => (
              <button
                key={t.id}
                {...(!busy && (t.status === "todo" || t.status === "doing")
                  ? draggableTask(t.id, t.status)
                  : {})}
                onClick={() => onOpen(t.id)}
                className="student-board-card group w-full text-left"
              >
                <div className="student-board-card-head">
                  <span className="student-work-code">{t.code}</span>
                  <span
                    className={`inline-flex items-center gap-1 text-caption font-semibold ${
                      t.priority === "critical" || t.priority === "high"
                        ? "text-destructive"
                        : t.priority === "medium"
                          ? "text-warning"
                          : "text-muted-foreground"
                    }`}
                  >
                    <Flag size={11} aria-hidden="true" />
                    {priorityLabels[t.priority]}
                  </span>
                </div>
                <h3>{t.title}</h3>
                <p className="student-board-card-foot">
                  <SquareKanban size={11} aria-hidden="true" />
                  <span className="inline-flex items-center gap-1">
                    Sprint: {t.sprint?.name ?? "Chưa gắn Sprint"}
                  </span>
                </p>
                <p className="student-board-card-foot workspace-board-repository">
                  <GitBranch size={12} aria-hidden="true" />
                  <span className="min-w-0 break-words">
                    {t.repository
                      ? `${t.repository.fullName ?? "Repository"} · ${
                          {
                            ready: "Sẵn sàng",
                            provisioning: "Đang tạo repository",
                            failed: "Cần giảng viên xử lý",
                          }[t.repository.status]
                        }`
                      : "Chưa có repository cho phiên"}
                  </span>
                </p>
                <div className="mt-3">
                  <StudentProgress
                    value={t.progress}
                    label={`Tiến độ ${t.code}`}
                    tone={t.progress >= 100 ? "green" : "blue"}
                    hideLabel
                  />
                </div>
                <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2.5 text-caption text-muted-foreground">
                  <TaskDeadline value={t.dueDate} status={t.status} compact />
                  <span className="workspace-task-points"><Gauge size={12} aria-hidden="true" />{t.storyPoints ?? '—'} điểm</span>
                  <ChevronRight
                    size={14}
                    className="text-primary transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </div>
              </button>
            ))}
          </div>
        )}
        {data.data && data.data.totalPages > 1 && (
          <div className="mt-3 flex items-center justify-between gap-2 text-caption text-muted-foreground">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="student-action student-action-secondary student-action-sm"
              aria-label={`Trang trước, cột ${statusLabels[status]}`}
            >
              <ChevronLeft size={13} aria-hidden="true" />
              Trước
            </button>
            <span className="tabular-nums">
              {page}/{data.data.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= data.data.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="student-action student-action-secondary student-action-sm"
              aria-label={`Trang sau, cột ${statusLabels[status]}`}
            >
              Sau
              <ChevronRight size={13} aria-hidden="true" />
            </button>
          </div>
        )}
      </section>
    </DropColumn>
  );
}
