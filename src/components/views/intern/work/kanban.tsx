"use client";

import * as React from "react";
import { toast } from "sonner";
import { navigate } from "@/lib/client/router";
import { taskStatusLabels } from "@/lib/client/labels";
import { ApiError } from "@/lib/client/http";
import { taskApi, type Task, type TaskStatus } from "@/lib/client/api";
import { KanbanBoard, KanbanTaskCard } from "@/components/shared/kanban";
import { PriorityBadge } from "@/components/shared/badges";
import { AnimatedProgressBar } from "@/components/shared/primitives";
import { DueDate } from "../shared";

/** Luồng intern được phép tự chuyển: todo → doing → review (done do mentor chốt). */
const MY_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  todo: ["doing"],
  doing: ["review"],
  review: [],
  done: [],
};

/** Trả về câu lỗi rule nếu cú kéo không hợp lệ, null nếu được phép. */
export function getMoveRuleError(
  task: Pick<Task, "status" | "code">,
  to: TaskStatus
): string | null {
  if (task.status === to) return null;
  if (task.status === "done") {
    return `Nhiệm vụ ${task.code} đã hoàn thành — không thể kéo. Trạng thái "Hoàn thành" chỉ được mentor chốt sau khi duyệt bài.`;
  }
  if (to === "done") {
    return `Không thể tự chuyển ${task.code} sang "Hoàn thành". Hãy chuyển sang "Chờ duyệt" rồi nộp bài để mentor chốt.`;
  }
  if (!MY_TRANSITIONS[task.status].includes(to)) {
    return `Không thể chuyển "${taskStatusLabels[task.status]}" → "${taskStatusLabels[to]}". Luồng hợp lệ: Cần làm → Đang làm → Chờ duyệt.`;
  }
  return null;
}

/**
 * Kéo-thả đổi trạng thái task intern:
 * chặn rule trước (toast lỗi), optimistic update rồi reload ngầm;
 * lỗi 409 (version) → toast + reload lại toàn bộ.
 */
export function useKanbanMove(opts: {
  getTask: (taskId: string) => Task | undefined;
  optimisticMove: (taskId: string, to: TaskStatus) => void;
  reload: () => void;
}) {
  const { getTask, optimisticMove, reload } = opts;
  const getTaskRef = React.useRef(getTask);
  const moveRef = React.useRef(optimisticMove);
  const reloadRef = React.useRef(reload);
  React.useEffect(() => {
    getTaskRef.current = getTask;
    moveRef.current = optimisticMove;
    reloadRef.current = reload;
  });

  return React.useCallback(async (taskId: string, toStatus: TaskStatus) => {
    const task = getTaskRef.current(taskId);
    if (!task) return;
    const ruleError = getMoveRuleError(task, toStatus);
    if (ruleError) {
      toast.error(ruleError);
      return;
    }
    // Optimistic: đổi trạng thái ngay trên UI rồi gọi API
    moveRef.current(taskId, toStatus);
    try {
      await taskApi.updateMy(taskId, { status: toStatus, expectedVersion: task.version });
      toast.success(`${task.code} → ${taskStatusLabels[toStatus]}`);
      reloadRef.current();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error("Nhiệm vụ vừa được cập nhật ở nơi khác — đã tải lại bảng.");
      } else {
        toast.error(err instanceof Error ? err.message : "Không thể chuyển trạng thái nhiệm vụ.");
      }
      reloadRef.current();
    }
  }, []);
}

/** Bảng kanban công việc intern (dùng chung /intern/work + /intern/sprint). */
export function InternTaskKanban({
  tasks,
  onMove,
}: {
  tasks: Task[];
  onMove: (taskId: string, toStatus: TaskStatus) => void;
}) {
  return (
    <KanbanBoard
      items={tasks}
      onMove={(id, to) => onMove(id, to as TaskStatus)}
      onOpen={(t) => navigate(`/intern/work/${t.id}`)}
      renderCard={(t, dragging) => (
        <KanbanTaskCard
          code={t.code}
          title={t.title}
          dragging={dragging}
          meta={
            <div className="flex flex-wrap items-center gap-1.5">
              <PriorityBadge priority={t.priority} />
              <span className="text-faint">·</span>
              <DueDate task={t} />
            </div>
          }
          footer={
            <div className="space-y-1">
              <AnimatedProgressBar value={t.progress} showLabel />
            </div>
          }
        />
      )}
    />
  );
}
