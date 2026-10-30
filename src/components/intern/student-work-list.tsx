import Link from "next/link";
import {
  IconArrowRight,
  IconChartTrend,
  IconListTodo,
  IconSquareKanban,
} from "@/components/v-intern/icons";
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
import { TaskDeadline } from "@/components/workspace/task-deadline";

/** Danh sách nhiệm vụ của sinh viên — mỗi dòng là một "thẻ công việc" đầy đủ
 * ngữ cảnh: trạng thái, ưu tiên, sprint, điểm độ lớn, tiến độ và thời hạn. */
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
      <div className="student-empty">
        <IconListTodo size={36} aria-hidden="true" />
        <h3>
          {filtered
            ? "Không tìm thấy nhiệm vụ phù hợp"
            : "Bạn chưa có nhiệm vụ được giao"}
        </h3>
        <p>
          {filtered
            ? "Thử tên ngắn hơn hoặc bỏ bộ lọc để xem lại toàn bộ công việc."
            : "Khi giảng viên giao việc, yêu cầu và thời hạn sẽ xuất hiện tại đây."}
        </p>
        {filtered && (
          <button
            className="student-action student-action-secondary mt-5"
            onClick={onClear}
          >
            Xóa bộ lọc
          </button>
        )}
      </div>
    );
  return (
    <div className="student-work-list">
      <div className="workspace-work-columns" aria-hidden="true"><span>Nhiệm vụ & yêu cầu</span><span>Tiến độ</span><span>Hạn hoàn thành</span></div>
      {tasks.map((task) => (
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
                {task.storyPoints ?? "—"} điểm
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
            <TaskDeadline value={task.dueDate} status={task.status} />
            <Link
              href={`/intern/work/${encodeURIComponent(task.id)}`}
              className="student-action student-action-secondary student-action-sm"
            >
              Chi tiết
              <IconArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
