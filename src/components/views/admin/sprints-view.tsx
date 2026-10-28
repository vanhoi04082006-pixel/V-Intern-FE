"use client";

import * as React from "react";
import { CalendarDays, KanbanSquare, ListChecks, Presentation, Rocket } from "lucide-react";
import {
  sessionApi,
  sprintApi,
  taskApi,
  type SprintBoard,
  type Task,
} from "@/lib/client/api";
import { useResource } from "@/lib/client/use-resource";
import { formatDate } from "@/lib/client/labels";
import {
  AnimatedProgressBar,
  Empty,
  KeyValue,
  PageHeader,
  Pager,
  Panel,
  PanelHeader,
  ToneBadge,
  UserAvatar,
} from "@/components/shared/primitives";
import { PriorityBadge, TaskStatusBadge } from "@/components/shared/badges";
import { LoadingBlock, ErrorBlock } from "@/components/shared/states";
import { FilterBar, FilterSelect } from "@/components/shared/toolbar";
import { ViewFrame } from "@/components/shared/view";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  TableShell,
  TBody,
  Td,
  THead,
  Th,
  Tr,
} from "./admin-shared";

/* Trạng thái sprint: todo/active/review/done (fallback: hiển thị mã gốc). */
const sprintStatusMeta: Record<string, { label: string; tone: "zinc" | "teal" | "amber" | "emerald" | "rose" }> = {
  todo: { label: "Chưa bắt đầu", tone: "zinc" },
  active: { label: "Đang diễn ra", tone: "teal" },
  review: { label: "Đang duyệt", tone: "amber" },
  done: { label: "Hoàn tất", tone: "emerald" },
  planned: { label: "Chưa bắt đầu", tone: "zinc" },
  completed: { label: "Hoàn tất", tone: "emerald" },
  cancelled: { label: "Đã hủy", tone: "rose" },
};

function SprintStatusBadge({ status }: { status: string }) {
  const meta = sprintStatusMeta[status] ?? { label: status, tone: "zinc" as const };
  return (
    <ToneBadge tone={meta.tone} dot>
      {meta.label}
    </ToneBadge>
  );
}

/* ============================ dialog chi tiết sprint ============================ */

function SprintDetailDialog({
  sprintId,
  onOpenChange,
}: {
  sprintId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const board = useResource(
    () => (sprintId ? sprintApi.board(sprintId) : Promise.resolve(null)),
    [sprintId]
  );
  const [page, setPage] = React.useState(1);
  const tasks = useResource(
    () => (sprintId ? taskApi.list({ sprintId, page, pageSize: 10 }) : Promise.resolve(null)),
    [sprintId, page]
  );

  React.useEffect(() => {
    if (sprintId) setPage(1);
  }, [sprintId]);

  const boardData: SprintBoard | null = board.data;
  const sprint = boardData?.sprint ?? null;
  const taskRows: Task[] = tasks.data?.data ?? [];

  return (
    <Dialog open={Boolean(sprintId)} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col gap-0 overflow-hidden rounded-2xl border-line bg-panel p-0">
        <DialogHeader className="border-b border-line px-6 pt-6">
          <DialogTitle className="text-left text-base font-semibold text-ink">
            {sprint ? `${sprint.code} · ${sprint.name}` : "Chi tiết sprint"}
          </DialogTitle>
          <DialogDescription className="text-left text-xs text-dim">
            {sprint ? sprint.goal : "Đang tải…"}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {board.loading ? (
            <LoadingBlock rows={5} />
          ) : board.error || !sprint ? (
            <ErrorBlock error={board.error ?? new Error("Không tìm thấy sprint")} onRetry={board.reload} />
          ) : (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KeyValue label="Trạng thái">
                  <SprintStatusBadge status={sprint.status} />
                </KeyValue>
                <KeyValue label="Thời gian">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-3.5 icon text-faint" />
                    {formatDate(sprint.startDate)} — {formatDate(sprint.endDate)}
                  </span>
                </KeyValue>
                <KeyValue label="Tiến độ">
                  <div className="mt-1 flex items-center gap-2">
                    <AnimatedProgressBar value={sprint.progress} className="w-28" />
                    <span className="font-mono text-xs font-semibold text-ink">{sprint.progress}%</span>
                  </div>
                </KeyValue>
                <KeyValue label="Trễ hạn">
                  <span className={boardData?.overdueOpenTaskCount ? "text-rose" : "text-brand-bright"}>
                    {boardData?.overdueOpenTaskCount
                      ? `${boardData.overdueOpenTaskCount} nhiệm vụ`
                      : "Không có"}
                  </span>
                </KeyValue>
              </div>

              {/* Tổng quan các cột board */}
              <Panel className="p-4">
                <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
                  <KanbanSquare className="size-3.5 icon" /> Bảng nhiệm vụ theo trạng thái
                </p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {(boardData?.columns ?? []).map((col) => (
                    <div key={col.status} className="rounded-xl border border-line bg-deep/60 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <TaskStatusBadge status={col.status} />
                        <span className="font-mono text-sm font-bold text-ink">{col.count}</span>
                      </div>
                      {col.tasks.length > 0 ? (
                        <ul className="mt-2 space-y-1">
                          {col.tasks.slice(0, 3).map((t) => (
                            <li key={t.id} className="truncate text-[11px] text-dim" title={t.title}>
                              <span className="font-mono text-brand-bright/70">{t.code}</span> {t.title}
                            </li>
                          ))}
                          {col.tasks.length > 3 ? (
                            <li className="text-[10px] text-faint">+{col.tasks.length - 3} nữa…</li>
                          ) : null}
                        </ul>
                      ) : (
                        <p className="mt-2 text-[10px] text-faint">Trống</p>
                      )}
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Danh sách nhiệm vụ + Pager */}
              <Panel className="overflow-hidden">
                <PanelHeader
                  title="Danh sách nhiệm vụ"
                  description={tasks.data ? `${tasks.data.meta.total} nhiệm vụ trong sprint` : "Đang tải…"}
                  icon={<ListChecks className="size-4 icon" />}
                />
                {tasks.loading ? (
                  <div className="px-5 py-4">
                    <LoadingBlock rows={3} />
                  </div>
                ) : tasks.error ? (
                  <div className="px-5 py-4">
                    <ErrorBlock error={tasks.error} onRetry={tasks.reload} />
                  </div>
                ) : taskRows.length === 0 ? (
                  <Empty icon={<Rocket className="icon" />} title="Sprint chưa có nhiệm vụ nào" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs" style={{ minWidth: 640 }}>
                      <thead className="bg-deep/50 text-faint">
                        <tr>
                          <th className="whitespace-nowrap px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.06em]">Mã</th>
                          <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.06em]">Nhiệm vụ</th>
                          <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.06em]">Người thực hiện</th>
                          <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.06em]">Trạng thái</th>
                          <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.06em]">Ưu tiên</th>
                          <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.06em]">Hạn</th>
                        </tr>
                      </thead>
                      <tbody>
                        {taskRows.map((t) => (
                          <tr key={t.id} className="border-t border-line transition-colors hover:bg-panel-2/60">
                            <td className="px-4 py-2.5 font-mono text-[10px] text-brand-bright/80">{t.code}</td>
                            <td className="max-w-64 truncate py-2.5 text-ink">{t.title}</td>
                            <td className="py-2.5">
                              {t.assigneeName ? (
                                <span className="flex items-center gap-1.5">
                                  <UserAvatar name={t.assigneeName} size={18} />
                                  <span className="text-dim">{t.assigneeName}</span>
                                </span>
                              ) : (
                                <span className="text-faint">Chưa gán</span>
                              )}
                            </td>
                            <td className="py-2.5">
                              <TaskStatusBadge status={t.status} />
                            </td>
                            <td className="py-2.5">
                              <PriorityBadge priority={t.priority} />
                            </td>
                            <td className="whitespace-nowrap px-4 py-2.5 text-right text-dim">{formatDate(t.dueDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {tasks.data && tasks.data.meta.totalPages > 1 ? (
                  <Pager
                    page={tasks.data.meta.page}
                    totalPages={tasks.data.meta.totalPages}
                    total={tasks.data.meta.total}
                    onChange={setPage}
                  />
                ) : null}
              </Panel>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ============================ view chính ============================ */

export function AdminSprints() {
  const overview = useResource(() => sessionApi.overview({ page: 1, pageSize: 50 }), []);
  const sessions = overview.data?.data ?? [];

  const [sessionId, setSessionId] = React.useState("");
  const effectiveSessionId = sessionId || sessions[0]?.id || "";

  const detail = useResource(
    () => (effectiveSessionId ? sessionApi.detail(effectiveSessionId) : Promise.resolve(null)),
    [effectiveSessionId]
  );

  // Đếm nhiệm vụ theo sprint của phiên đang chọn.
  const work = useResource(
    () =>
      effectiveSessionId
        ? sessionApi.work(effectiveSessionId, { page: 1, pageSize: 200 })
        : Promise.resolve(null),
    [effectiveSessionId]
  );

  const taskCountBySprint = React.useMemo(() => {
    const map = new Map<string, number>();
    (work.data?.data ?? []).forEach((t) => {
      if (t.sprintId) map.set(t.sprintId, (map.get(t.sprintId) ?? 0) + 1);
    });
    return map;
  }, [work.data]);

  const [detailSprintId, setDetailSprintId] = React.useState<string | null>(null);

  const sprints = detail.data?.sprints ?? [];
  const sessionOptions = sessions.map((s) => ({
    value: s.id,
    label: `${s.code} · ${s.name}`,
  }));

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Quản trị hệ thống"
        title="Sprint"
        description="Toàn bộ sprint của các phiên thực tập trên nền tảng — bấm một dòng để xem bảng nhiệm vụ chi tiết."
      />

      <FilterBar>
        {sessions.length > 0 ? (
          <FilterSelect
            value={effectiveSessionId}
            onChange={setSessionId}
            options={sessionOptions}
            allLabel="Chọn phiên thực tập"
            placeholder="Chọn phiên thực tập"
            className="w-full sm:w-80"
            ariaLabel="Chọn phiên thực tập"
          />
        ) : null}
      </FilterBar>

      {overview.loading || detail.loading ? (
        <LoadingBlock rows={4} />
      ) : overview.error ? (
        <ErrorBlock error={overview.error} onRetry={overview.reload} />
      ) : detail.error ? (
        <ErrorBlock error={detail.error} onRetry={detail.reload} />
      ) : sessions.length === 0 ? (
        <Panel>
          <Empty
            icon={<Presentation className="icon" />}
            title="Chưa có phiên thực tập nào"
            description="Sprint xuất hiện sau khi phiên thực tập được khởi động từ dự án mẫu."
          />
        </Panel>
      ) : sprints.length === 0 ? (
        <Panel>
          <Empty
            icon={<Rocket className="icon" />}
            title="Phiên thực tập chưa có sprint"
            description="Sinh kế hoạch AI cho phiên để tạo sprint tự động."
          />
        </Panel>
      ) : (
        <TableShell minWidth={960}>
          <THead>
            <tr>
              <Th>Mã sprint</Th>
              <Th>Tên sprint</Th>
              <Th>Phiên thực tập</Th>
              <Th>Trạng thái</Th>
              <Th>Tiến độ</Th>
              <Th>Thời gian</Th>
              <Th className="text-right">Nhiệm vụ</Th>
            </tr>
          </THead>
          <TBody>
            {sprints.map((s) => (
              <Tr key={s.id} className="cursor-pointer">
                <td className="px-4 py-3 align-middle text-ink" onClick={() => setDetailSprintId(s.id)}>
                  <span className="font-mono text-xs font-semibold text-brand-bright">{s.code}</span>
                </td>
                <td className="px-4 py-3 align-middle text-ink" onClick={() => setDetailSprintId(s.id)}>
                  <p className="max-w-80 truncate text-sm font-medium">{s.name}</p>
                </td>
                <td className="px-4 py-3 align-middle text-ink" onClick={() => setDetailSprintId(s.id)}>
                  <span className="text-xs text-dim">
                    {detail.data?.code} · {detail.data?.name}
                  </span>
                </td>
                <td className="px-4 py-3 align-middle text-ink" onClick={() => setDetailSprintId(s.id)}>
                  <SprintStatusBadge status={s.status} />
                </td>
                <td className="w-44 px-4 py-3 align-middle text-ink" onClick={() => setDetailSprintId(s.id)}>
                  <div className="flex items-center gap-2">
                    <AnimatedProgressBar value={s.progress} tone={s.status === "done" ? "brand" : "teal"} className="w-24" />
                    <span className="font-mono text-[11px] font-semibold text-dim">{s.progress}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 align-middle text-ink" onClick={() => setDetailSprintId(s.id)}>
                  <span className="whitespace-nowrap text-xs text-dim">
                    {formatDate(s.startDate)} — {formatDate(s.endDate)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right align-middle text-ink" onClick={() => setDetailSprintId(s.id)}>
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs text-dim">
                    <ListChecks className="size-3.5 icon text-faint" />
                    {taskCountBySprint.get(s.id) ?? 0}
                  </span>
                </td>
              </Tr>
            ))}
          </TBody>
        </TableShell>
      )}

      <SprintDetailDialog sprintId={detailSprintId} onOpenChange={(o) => !o && setDetailSprintId(null)} />
    </ViewFrame>
  );
}
