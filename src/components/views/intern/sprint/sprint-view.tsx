"use client";

import * as React from "react";
import { CalendarRange, Rocket, Timer } from "lucide-react";
import { useResource } from "@/lib/client/use-resource";
import { formatDate } from "@/lib/client/labels";
import { sprintApi, type SprintBoard } from "@/lib/client/api";
import { ViewFrame } from "@/components/shared/view";
import {
  AnimatedProgressBar,
  Empty,
  MetricCard,
  PageHeader,
  Panel,
  ToneBadge,
} from "@/components/shared/primitives";
import { ErrorBlock, LoadingBlock } from "@/components/shared/states";
import { SprintStatusBadge } from "../shared";
import { InternTaskKanban, useKanbanMove } from "../work/kanban";

/** /intern/sprint — bảng kanban sprint hiện tại của tôi. */
export function SprintView() {
  const board = useResource<SprintBoard>(() => sprintApi.myBoard(), []);

  if (board.loading && !board.data) {
    return (
      <ViewFrame>
        <LoadingBlock variant="detail" rows={5} />
      </ViewFrame>
    );
  }
  if (board.error && !board.data) {
    return (
      <ViewFrame>
        <ErrorBlock error={board.error} onRetry={board.reload} />
      </ViewFrame>
    );
  }

  const data = board.data;
  if (!data) return null;
  const sprint = data.sprint;

  if (!sprint) {
    return (
      <ViewFrame>
        <PageHeader
          eyebrow="Sprint"
          title="Sprint của tôi"
          description="Bảng công việc của sprint đang diễn ra."
        />
        <Panel>
          <Empty
            icon={<Rocket className="size-5 icon" />}
            title="Phiên thực tập chưa có sprint nào"
            description="Khi giảng viên lên kế hoạch sprint, bảng công việc sẽ xuất hiện tại đây."
          />
        </Panel>
      </ViewFrame>
    );
  }

  return (
    <SprintBoardView
      sprint={data.sprint}
      tasks={data.columns.flatMap((c) => c.tasks)}
      overdue={data.overdueOpenTaskCount}
      reload={board.reload}
      setData={board.setData}
    />
  );
}

function SprintBoardView({
  sprint,
  tasks,
  overdue,
  reload,
  setData,
}: {
  sprint: SprintBoard["sprint"];
  tasks: SprintBoard["columns"][number]["tasks"];
  overdue: number;
  reload: () => void;
  setData: (updater: (prev: SprintBoard | null) => SprintBoard | null) => void;
}) {
  const moveTask = useKanbanMove({
    getTask: (id) => tasks.find((t) => t.id === id),
    optimisticMove: (id, to) =>
      setData((prev) =>
        prev
          ? {
              ...prev,
              columns: prev.columns.map((col) => ({
                ...col,
                tasks: col.tasks.map((t) => (t.id === id ? { ...t, status: to } : t)),
              })),
            }
          : prev
      ),
    reload,
  });

  if (!sprint) return null;

  return (
    <ViewFrame>
      <PageHeader
        eyebrow={sprint.code}
        title={sprint.name}
        actions={<SprintStatusBadge status={sprint.status} />}
      />

      {/* Thông tin sprint */}
      <Panel className="mb-4 p-5">
        <p className="text-sm italic leading-relaxed text-dim">Mục tiêu: {sprint.goal}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-dim">
          <span className="inline-flex items-center gap-1.5">
            <CalendarRange className="size-3.5 icon" />
            {formatDate(sprint.startDate)} → {formatDate(sprint.endDate)}
          </span>
          {overdue > 0 ? (
            <ToneBadge tone="amber" dot>
              {overdue} nhiệm vụ quá hạn
            </ToneBadge>
          ) : (
            <ToneBadge tone="emerald" dot>
              Không có nhiệm vụ quá hạn
            </ToneBadge>
          )}
        </div>
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wide text-faint">
              Tiến độ sprint
            </span>
          </div>
          <AnimatedProgressBar value={sprint.progress} showLabel />
        </div>
      </Panel>

      {/* Số liệu nhanh */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Tổng nhiệm vụ" value={tasks.length} icon={<Rocket className="size-4" />} tone="brand" />
        <MetricCard
          label="Cần làm"
          value={tasks.filter((t) => t.status === "todo").length}
          icon={<Timer className="size-4" />}
        />
        <MetricCard
          label="Đang làm"
          value={tasks.filter((t) => t.status === "doing").length}
          icon={<Timer className="size-4" />}
          tone="teal"
        />
        <MetricCard
          label="Quá hạn"
          value={overdue}
          hint={overdue > 0 ? "Ưu tiên xử lý trước" : undefined}
          icon={<Timer className="size-4" />}
          tone={overdue > 0 ? "rose" : "default"}
        />
      </div>

      {/* Kanban */}
      {tasks.length === 0 ? (
        <Panel>
          <Empty
            icon={<Rocket className="size-5 icon" />}
            title="Bạn chưa có nhiệm vụ trong sprint này"
            description="Khi được giao việc, thẻ nhiệm vụ sẽ xuất hiện trên bảng để kéo thả."
          />
        </Panel>
      ) : (
        <InternTaskKanban tasks={tasks} onMove={moveTask} />
      )}

      <p className="mt-4 text-center text-[11px] text-faint">
        Kéo thẻ giữa các cột để chuyển trạng thái (Cần làm → Đang làm → Chờ duyệt). Trạng thái
        “Hoàn thành” do mentor chốt sau khi duyệt bài.
      </p>
    </ViewFrame>
  );
}
