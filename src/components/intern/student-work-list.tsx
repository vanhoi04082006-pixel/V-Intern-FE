import Link from "next/link";
import {
  IconArrowRight,
  IconChartTrend,
  IconSquareKanban,
} from "@/components/v-intern/icons";
import { NotebookEmpty } from "@/components/workspace/notebook";
import type { Task } from "@/lib/api/work";
import {
  StudentBadge,
  StudentChip,
  StudentProgress,
  studentPriority,
  studentStatus,
  studentToneForPriority,
  studentToneForStatus,
} from "./student-ui";
import {
  TaskDeadline,
  describeTaskDeadline,
} from "@/components/workspace/task-deadline";

/** Danh sách nhiệm vụ của sinh viên — mỗi dòng là một "thẻ công việc" đầy đủ
 * ngữ cảnh: trạng thái, ưu tiên, sprint, story points, tiến độ và thời hạn. */
export function StudentWorkList({
  tasks,
  onOpen,
  filtered,
  onClear,
}: {
  tasks: Task[];
  onOpen: (id: string) => void;
  filtered: boolean;
  onClear: () => void;
}) {
  if (!tasks.length)
    return (
      /* Trang sổ trống — artwork sổ tay, không bịa dữ liệu. */
      <NotebookEmpty
        title={
          filtered
            ? "Không tìm thấy nhiệm vụ phù hợp"
            : "Bạn chưa có nhiệm vụ được giao"
        }
        hint={
          filtered
            ? "Thử tên ngắn hơn hoặc bỏ bộ lọc để xem lại toàn bộ công việc."
            : "Khi giảng viên giao việc, yêu cầu và thời hạn sẽ xuất hiện tại đây."
        }
        action={
          filtered ? (
            <button
              className="student-action student-action-secondary"
              onClick={onClear}
            >
              Xóa bộ lọc
            </button>
          ) : undefined
        }
      />
    );
  return (
    <div className="student-work-list nb-stagger">
      <div className="workspace-work-columns" aria-hidden="true"><span>Nhiệm vụ & yêu cầu</span><span>Tiến độ</span><span>Hạn hoàn thành</span></div>
      {tasks.map((task) => {
        /* v3: chip hạn "thở" gradient ấm (shimmer-warm — class journey chưa
            dùng tới) khi nhiệm vụ đang mở đã quá hạn; một nhiệm vụ đã xong thì
            hạn cũ không còn là cảnh báo (cùng quy tắc TaskDeadline). */
        const overdue =
          describeTaskDeadline(task.dueDate, task.status).tone === "danger";
        return (
        <article
          key={task.id}
          className="student-work-row"
          data-status={task.status}
        >
          <div className="min-w-0">
            <span className="student-work-code">{task.code}</span>
            <h3>
              <button
                onClick={() => onOpen(task.id)}
                className="student-row-open w-full rounded-control"
                aria-label={`${task.code} ${task.title}`}
              >
                {task.title}
              </button>
            </h3>
            <div className="student-meta">
              <StudentBadge tone={studentToneForStatus(task.status)}>
                {studentStatus(task.status)}
              </StudentBadge>
              <StudentChip tone={studentToneForPriority(task.priority)}>
                Ưu tiên {studentPriority(task.priority).toLocaleLowerCase("vi")}
              </StudentChip>
              <span className="student-work-foot">
                <IconSquareKanban size={12} aria-hidden="true" />
                {task.sprint?.name ?? "Chưa gắn Sprint"}
              </span>
              <span className="student-work-foot">
                <IconChartTrend size={12} aria-hidden="true" />
                Story points: {task.storyPoints ?? "—"}
              </span>
            </div>
          </div>
          <div className="student-work-progress">
            <StudentProgress
              value={task.progress}
              label={`Tiến độ ${task.code}`}
              tone={task.progress >= 100 ? "green" : "blue"}
              hideLabel
            />
          </div>
          <div className="student-work-actions">
            {overdue ? (
              <span className="shimmer-warm inline-flex items-center rounded-full px-2 py-0.5">
                <TaskDeadline value={task.dueDate} status={task.status} />
              </span>
            ) : (
              <TaskDeadline value={task.dueDate} status={task.status} />
            )}
            <Link
              href={`/intern/work/${encodeURIComponent(task.id)}`}
              className="student-action student-action-secondary student-action-sm"
            >
              Chi tiết
              <IconArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </article>
        );
      })}
    </div>
  );
}
