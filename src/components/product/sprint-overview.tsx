"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import {
  Layers,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { request } from "@/lib/api/client";
import { array, nullable, number, record, string } from "@/lib/api/parse";
import { getBoard, getSprintCompletion } from "@/lib/api/work";
import { fetchSprintBurndown } from "@/lib/api/delivery";
import { useResource } from "@/lib/api/use-resource";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { Modal, Panel, Badge, Empty, MetricCard } from "./primitives";
import { TaskDetail } from "./intern-work";
import { TaskStatusPill, PriorityBadge } from "./sprint-management";
import { DropColumn, canManageDrop, draggableTask } from "./kanban-dnd";
import { saveManagedTask } from "@/lib/api/management";
import { Can } from "@/components/auth/can";
import { statusLabels } from "@/lib/api/work";
import { InstructorNotice } from "@/components/instructor/instructor-ui";
const labels = {
  todo: "To Do",
  doing: "Doing",
  review: "Review",
  done: "Done",
};
const colors = {
  todo: "bg-muted",
  doing: "bg-accent",
  review: "bg-warning-subtle",
  done: "bg-success-subtle",
};
export function SprintOverview({
  id,
  activeCount,
  revision,
  onUpdated,
  onManage,
  instructor = false,
}: {
  id: string;
  instructor?: boolean;
  activeCount?: number;
  revision?: number;
  onUpdated?: () => void;
  onManage?: () => void;
}) {
  const board = useResource(
      useCallback((s: AbortSignal) => getBoard(id, s), [id]),
      revision,
    ),
    [task, setTask] = useState("");
  const [completionOpen, setCompletionOpen] = useState(false);
  const completion = useResource(
    useCallback(
      (s: AbortSignal) =>
        completionOpen ? getSprintCompletion(id, s) : Promise.resolve(null),
      [id, completionOpen],
    ),
    revision,
  );
  const [now] = useState(() => Date.now());
  const [dropError, setDropError] = useState<unknown>(null);
  const [dropping, setDropping] = useState(false);
  async function dropTask(
    taskId: string,
    to: (typeof b.columns)[number]["status"],
  ) {
    if (dropping) return;
    setDropping(true);
    setDropError(null);
    try {
      await saveManagedTask(taskId, { status: to });
      reload();
    } catch (e) {
      setDropError(e);
    } finally {
      setDropping(false);
    }
  }
  function reload() {
    board.reload();
    onUpdated?.();
  }
  if (board.loading) return <LoadingState />;
  if (board.error)
    return <ErrorState error={board.error} onRetry={board.reload} />;
  if (!board.data) return null;
  const b = board.data,
    done = b.columns.find((c) => c.status === "done")?.count ?? 0,
    review = b.columns.find((c) => c.status === "review")?.count ?? 0;
  const overdue = b.overdueOpenTaskCount;
  const remain = Math.max(
    0,
    Math.ceil((Date.parse(b.sprint.endDate) - now) / 86400000),
  );
  const reviewTasks =
    b.columns
      .find((c) => c.status === "review")
      ?.tasks.filter((_, i) => i < 4) ?? [];
  return (
    <>
      <div className="mb-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          icon={Layers}
          label="Sprint đang hoạt động"
          index={0}
          value={activeCount ?? (b.sprint.status === "active" ? 1 : 0)}
          sub="Trong phạm vi đang xem"
        />
        <MetricCard
          icon={ClipboardList}
          label={instructor ? "Tổng nhiệm vụ" : "Task tổng"}
          index={1}
          value={b.total}
          sub="Trong Sprint đang chọn"
        />
        <MetricCard
          icon={CheckCircle2}
          label={instructor ? "Đã hoàn thành" : "Task hoàn thành"}
          index={2}
          value={done}
          sub={`${b.total ? Math.round((done / b.total) * 100) : 0}% Sprint đang chọn`}
        />
        <MetricCard
          icon={Clock}
          label={instructor ? "Bài chờ duyệt" : "Task / PR chờ duyệt"}
          index={3}
          value={review}
          sub={
            instructor
              ? "Đang ở trạng thái Chờ duyệt"
              : "Đang ở trạng thái Review"
          }
        />
        <MetricCard
          icon={AlertTriangle}
          label={instructor ? "Nhiệm vụ quá hạn" : "Task quá hạn"}
          index={4}
          value={overdue ?? "Chưa đo được"}
          sub={
            instructor
              ? "Tổng hợp trong Sprint này"
              : "Tổng hợp toàn Sprint từ backend"
          }
          subTone="text-destructive"
        />
      </div>
      {instructor && (
        <div className="mb-4">
          <InstructorNotice title="Theo dõi công việc và duyệt bài">
            Bấm thẻ để xem yêu cầu, bài nộp và phản hồi. Các cột chỉ hiển thị
            tối đa 3 thẻ; danh sách bên dưới có đầy đủ nhiệm vụ và bộ lọc. Chỉ
            duyệt hoàn thành qua bài nộp khi đã đủ bằng chứng.
          </InstructorNotice>
        </div>
      )}
      <div className="mb-5 grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel
          title="Bảng Sprint hiện tại"
          action={
            <span className="flex flex-wrap items-center gap-3">
              <Link href="#sprint-task-list" className="text-caption text-primary">
                Xem tất cả task
              </Link>
              <Can perm="tasks.manage">
                <a
                  href={
                    onManage ? "#sprint-task-management" : "#sprint-task-list"
                  }
                  onClick={onManage}
                  className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-caption font-semibold text-primary-foreground hover:bg-primary"
                >
                  <Plus size={14} />
                  {onManage ? "Quản lý task" : "Tạo task mới"}
                </a>
              </Can>
            </span>
          }
        >
          <p className="mb-4 text-body text-muted-foreground">
            {b.sprint.code}, {b.sprint.name}
          </p>
          <div
            className={`grid gap-3 sm:grid-cols-2 xl:grid-cols-4 ${instructor ? "ins-sprint-board" : ""}`}
          >
            {b.columns.map((c) => (
              <section
                key={c.status}
                className={`min-w-0 rounded-control p-3 ${colors[c.status]}`}
              >
                <h3 className="mb-3 text-body font-bold text-foreground">
                  {instructor ? statusLabels[c.status] : labels[c.status]}{" "}
                  <Badge>{c.count}</Badge>
                </h3>
                <DropColumn
                  status={c.status}
                  canDrop={(from) => canManageDrop(from, c.status)}
                  onDrop={(taskId, to) => void dropTask(taskId, to)}
                >
                  <div className="space-y-3">
                    {c.tasks.slice(0, 3).map((t) => (
                      <button
                        key={t.id}
                        {...draggableTask(t.id, t.status)}
                        title="Mở chi tiết, kéo sang cột được phép để chuyển trạng thái"
                        className="mb-3 w-full rounded-md border border-primary bg-card p-3 text-left"
                        onClick={() => setTask(t.id)}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-caption font-semibold text-primary">
                            {t.code}
                          </span>
                          <PriorityBadge priority={t.priority} />
                        </span>
                        <p
                          title={t.title}
                          className="mt-1 line-clamp-2 text-small font-bold text-foreground"
                        >
                          {t.title}
                        </p>
                        {t.description && (
                          <p className="mt-1 line-clamp-2 text-caption leading-relaxed text-muted-foreground">
                            {t.description}
                          </p>
                        )}
                        <span className="mt-2 flex items-center justify-between text-caption text-muted-foreground">
                          <span>
                            {t.dueDate
                              ? new Date(t.dueDate).toLocaleDateString("vi-VN")
                              : "Chưa có hạn"}
                          </span>
                          {t.storyPoints !== null && (
                            <span className="rounded bg-muted px-2 py-1 text-caption">
                              {t.storyPoints} pts
                            </span>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </DropColumn>
                {instructor && c.count === 0 && (
                  <p className="py-5 text-center text-caption leading-6 text-muted-foreground">
                    {c.status === "review"
                      ? "Chưa có bài cần duyệt."
                      : c.status === "done"
                        ? "Nhiệm vụ được duyệt sẽ hiển thị tại đây."
                        : "Chưa có nhiệm vụ trong cột này."}
                  </p>
                )}
                {c.count > 3 && (
                  <a
                    href="#sprint-task-list"
                    className="block rounded bg-card/70 p-2 text-center text-caption font-semibold text-primary"
                  >
                    Xem tất cả {c.count} task
                  </a>
                )}
              </section>
            ))}
          </div>
        </Panel>
        <div className="min-w-0 space-y-4">
          <Panel title={`Tiến độ ${b.sprint.code}`}>
            <strong className="text-page text-foreground">
              {done} / {b.total} task
            </strong>
            <div
              role="progressbar"
              aria-label="Tiến độ Sprint"
              aria-valuenow={done}
              aria-valuemin={0}
              aria-valuemax={b.total || 1}
              className="my-4 h-2 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${b.total ? (done / b.total) * 100 : 0}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-caption">
              <div className="rounded-md border border-primary p-2.5">
                <p className="text-caption text-muted-foreground">Thời gian còn lại</p>
                <strong className="mt-1 block text-body text-foreground">
                  {remain} ngày
                </strong>
              </div>
              <div className="rounded-md border border-primary p-2.5">
                <p className="text-caption text-muted-foreground">Task còn lại</p>
                <strong className="mt-1 block text-body text-foreground">
                  {b.total - done} task
                </strong>
              </div>
            </div>
            <Burndown id={id} compact />
          </Panel>
          <Panel
            title="Review & PR cần xử lý"
            action={
              <a href="#sprint-task-list" className="text-caption text-primary">
                Xem tất cả
              </a>
            }
          >
            {reviewTasks.length ? (
              <ul className="space-y-2">
                {reviewTasks.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center gap-2 rounded-md border border-primary p-2 text-caption"
                  >
                    <div className="min-w-0 flex-1">
                      <strong className="block text-primary">{t.code}</strong>
                      <span className="mt-0.5 line-clamp-1 block text-foreground">
                        {t.title}
                      </span>
                    </div>
                    <TaskStatusPill status="review" />
                    <button
                      className="rounded border border-primary px-2 py-1 text-primary"
                      onClick={() => setTask(t.id)}
                    >
                      Xem
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>Không có task chờ review.</Empty>
            )}
          </Panel>
          <SprintCompletionPanel
            open={completionOpen}
            onToggle={() => setCompletionOpen((v) => !v)}
            state={completion}
          />
        </div>
      </div>
      {dropping && <LoadingState />}
      {Boolean(dropError) && (
        <ErrorState
          error={dropError}
          onRetry={() => {
            setDropError(null);
            board.reload();
          }}
        />
      )}
      {task && (
        <Modal title="Chi tiết nhiệm vụ" onClose={() => setTask("")}>
          <TaskDetail id={task} managed onUpdated={reload} />
        </Modal>
      )}
    </>
  );
}
/**
 * GET sprints/:id/completion — tổng kết nhiệm vụ & story points của Sprint.
 * Chỉ tải khi mở; số liệu ưa điểm (points) có thể NULL khi không task nào
 * khai báo story points (không tự bịa số liệu).
 */
function SprintCompletionPanel({
  open,
  onToggle,
  state,
}: {
  open: boolean;
  onToggle: () => void;
  state: {
    data:
      | {
          total: number;
          done: number;
          open: number;
          committedStoryPoints: number | null;
          completedStoryPoints: number | null;
        }
      | null
      | undefined;
    error?: unknown;
    loading: boolean;
    reload: () => void;
  };
}) {
  return (
    <Panel
      title="Hoàn thành sprint"
      action={
        <button
          type="button"
          className="rounded border border-primary px-3 py-1.5 text-caption font-semibold text-primary hover:bg-accent"
          aria-expanded={open}
          aria-controls="sprint-completion-report"
          onClick={onToggle}
        >
          {open ? "Ẩn báo cáo" : "Xem báo cáo hoàn thành"}
        </button>
      }
    >
      {!open ? (
        <p className="text-body text-muted-foreground">
          Tổng kết số nhiệm vụ và story points được tính trực tiếp từ dữ liệu máy chủ.
        </p>
      ) : state.loading ? (
        <LoadingState />
      ) : state.error ? (
        <ErrorState error={state.error} onRetry={state.reload} />
      ) : state.data ? (
        <div id="sprint-completion-report" className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-caption">
            <div className="rounded-md border border-primary p-2.5">
              <p className="text-muted-foreground">Tổng nhiệm vụ</p>
              <strong className="mt-1 block text-body text-foreground">
                {state.data.total}
              </strong>
            </div>
            <div className="rounded-md border border-primary p-2.5">
              <p className="text-muted-foreground">Đã hoàn thành</p>
              <strong className="mt-1 block text-body text-success">
                {state.data.done}
              </strong>
            </div>
            <div className="rounded-md border border-primary p-2.5">
              <p className="text-muted-foreground">Đang mở</p>
              <strong className="mt-1 block text-body text-warning">
                {state.data.open}
              </strong>
            </div>
          </div>
          <p className="text-body text-muted-foreground">
            {state.data.committedStoryPoints === null
              ? "Chưa có task nào khai báo story points — không hiển thị điểm ước lượng."
              : `Story points: đã hoàn thành ${state.data.completedStoryPoints ?? 0} / cam kết ${state.data.committedStoryPoints} points.`}
          </p>
        </div>
      ) : null}
    </Panel>
  );
}
export function Burndown({
  id,
  compact = false,
}: {
  id: string;
  compact?: boolean;
}) {
  // Single validated contract: reuse fetchSprintBurndown (delivery.ts) instead
  // of a stale inline parser that expected a { points: [...] } wrapper — the
  // same endpoint already had two incompatible parsers, which surfaced as an
  // error card inside the "Tiến độ" panel.
  const data = useResource(
    useCallback((signal: AbortSignal) => fetchSprintBurndown(id, signal), [id]),
  );
  // The chart is supplementary: when the backend has no burndown yet, stay
  // hidden instead of pushing a heavy error card into the progress panel.
  if (data.loading || data.error || !data.data?.length) return null;
  const points = data.data,
    max = Math.max(1, ...points.flatMap((p) => [p.actual ?? 0, p.ideal]));
  const coords = (i: number, n: number) =>
    `${35 + (i / Math.max(1, points.length - 1)) * 420},${175 - (n / max) * 140}`;
  const actual = points
    .flatMap((p, i) => (p.actual === null ? [] : [coords(i, p.actual)]))
    .join(" ");
  return (
    <div className={compact ? "mt-3" : "mt-5"}>
      <h3 className="text-body font-bold text-foreground">Burndown</h3>
      <p className="my-2 text-caption text-muted-foreground">
        Xanh: task còn lại, Nét đứt: kế hoạch lý tưởng
      </p>
      <svg
        viewBox="0 0 490 210"
        className={compact ? "h-32 w-full" : "w-full"}
        role="img"
        aria-label="Burndown theo lịch sử trạng thái task hiện thuộc Sprint"
      >
        <path d="M35 25V175H455" fill="none" stroke="var(--border)" />
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line
              x1="35"
              x2="455"
              y1={175 - f * 140}
              y2={175 - f * 140}
              stroke="var(--border)"
              strokeDasharray="3 3"
            />
            <text x="2" y={179 - f * 140} className="text-caption" fill="var(--muted-foreground)">
              {Math.round(max * f)}
            </text>
          </g>
        ))}
        <polyline
          points={points.map((p, i) => coords(i, p.ideal)).join(" ")}
          fill="none"
          stroke="var(--input)"
          strokeWidth="2"
          strokeDasharray="6 5"
        />
        <polyline
          points={actual}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="3"
        />
        {points.map((p, i) =>
          p.actual === null ? null : (
            <circle
              key={p.date}
              cx={35 + (i / Math.max(1, points.length - 1)) * 420}
              cy={175 - (p.actual / max) * 140}
              r="3"
              fill="var(--primary)"
            >
              <title>
                {new Date(p.date).toLocaleDateString("vi-VN")}: {p.actual} task
                còn lại
              </title>
            </circle>
          ),
        )}
        <text x="35" y="202" className="text-caption" fill="var(--muted-foreground)">
          {new Date(points[0].date).toLocaleDateString("vi-VN")}
        </text>
        <text x="455" y="202" textAnchor="end" className="text-caption" fill="var(--muted-foreground)">
          {new Date(points.at(-1)!.date).toLocaleDateString("vi-VN")}
        </text>
      </svg>
      <details className="text-caption text-muted-foreground">
        <summary>Nguồn dữ liệu và bảng số</summary>
        <p className="my-2">
          Tái dựng từ lịch sử trạng thái của các task hiện thuộc Sprint, theo
          ngày UTC; không bao gồm task đã chuyển ra Sprint. Ngày tương lai chỉ
          có đường kế hoạch.
        </p>
        <ul>
          {points.map((p) => (
            <li key={p.date}>
              {new Date(p.date).toLocaleDateString("vi-VN")}:{" "}
              {p.actual ?? "Chưa diễn ra"}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
