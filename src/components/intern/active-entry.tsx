"use client";
import Link from "next/link";
import { useCallback } from "react";
import {
  IconArrowUpRight,
  IconBot,
  IconCalendarDays,
  IconCircleCheck,
  IconCircleDot,
  IconClipboardCheck,
  IconClock,
  IconCodeXml,
  IconFolderKanban,
  IconHourglass,
  IconListTodo,
  IconSquareKanban,
  IconTarget,
  IconTrendingUp,
} from "@/components/v-intern/icons";
import { StarDoodle, Tape } from "@/components/v-intern/doodles";
import { NoteCard, StampMoc } from "@/components/workspace/notebook";
import { listTasks, type Task } from "@/lib/api/work";
import { useResource } from "@/lib/api/use-resource";
import type { InternWorkspace } from "@/lib/api/workspace";
import { getSessionUser } from "@/lib/auth/session";
import { sprintStatusLabel } from "@/lib/api/sprint-status";
import { TaskDistribution } from "@/components/workspace/workspace-ui";
import {
  StudentBadge,
  StudentChip,
  StudentHeading,
  StudentLink,
  StudentMetric,
  StudentPanel,
  StudentProgress,
  studentDate,
  studentPriority,
  studentStatus,
  studentToneForPriority,
  studentToneForStatus,
} from "./student-ui";

export function ActiveEntry({ workspace }: { workspace: InternWorkspace }) {
  const { assignment, currentSprint, taskSummary, focusedTask } = workspace;
  const name = getSessionUser()?.displayName;
  const completed = taskSummary.total
    ? Math.round((taskSummary.done / taskSummary.total) * 100)
    : 0;
  return (
    <div className="student-dashboard student-reveal space-y-6">
      <StudentHeading
        title={name ? `Chào ${name}!` : "Không gian thực tập của bạn"}
        description="Tiếp tục công việc, nhận phản hồi và theo dõi tiến bộ của bạn."
        action={
          <>
            <StudentLink secondary href="/intern/work">
              Công việc của tôi
            </StudentLink>
            <StudentLink secondary href="/intern/sprint">
              Mở Sprint Board
            </StudentLink>
          </>
        }
      />

      <section
        className="student-placement-summary"
        aria-label="Dự án hiện tại"
      >
        <div className="min-w-0">
          <h2>{assignment?.project.name}</h2>
          <div className="student-meta my-2">
            {assignment && (
              <StudentChip icon={IconCalendarDays}>
                {assignment.session.name}
              </StudentChip>
            )}
            {currentSprint && (
              <StudentChip icon={IconSquareKanban} tone="blue">
                {currentSprint.code} ·{" "}
                {sprintStatusLabel(currentSprint.status).label}
              </StudentChip>
            )}
            <StudentChip icon={IconFolderKanban}>
              {assignment?.project.status === "active"
                ? "Đang thực hiện"
                : (assignment?.project.status ?? "Chưa xác định")}
            </StudentChip>
          </div>
          <p>
            {currentSprint
              ? `Sprint hiện tại: ${currentSprint.name}.`
              : "Dự án đã được phân công. Xem yêu cầu và chuẩn bị môi trường trong lúc chờ Sprint bắt đầu."}
          </p>
          <div className="student-hero-actions">
            {focusedTask && (
              <StudentLink
                href={`/intern/work/${encodeURIComponent(focusedTask.id)}`}
              >
                {focusedTask.status === "review"
                  ? "Xem bài nộp và phản hồi"
                  : "Tiếp tục nhiệm vụ đang làm"}
              </StudentLink>
            )}
            <Link
              href="/intern/project"
              className="student-action student-action-secondary"
            >
              Khám phá dự án
              <IconArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="student-placement-progress">
          <StudentProgress value={completed} label="Tiến độ thực tập" />
        </div>
      </section>

      <div className="student-metrics" role="group" aria-label="Tổng quan nhiệm vụ">
        <StudentMetric
          icon={IconClipboardCheck}
          label="Tất cả nhiệm vụ"
          value={taskSummary.total}
          hint="Công việc được giao"
        />
        <StudentMetric
          icon={IconListTodo}
          label="Cần bắt đầu"
          value={taskSummary.todo}
          hint="Đọc yêu cầu trước khi làm"
          tone="slate"
        />
        <StudentMetric
          icon={IconCircleDot}
          label="Đang thực hiện"
          value={taskSummary.doing}
          hint="Duy trì nhịp làm việc"
        />
        <StudentMetric
          icon={IconHourglass}
          label="Chờ phản hồi"
          value={taskSummary.review}
          hint="Đang chờ giảng viên duyệt"
          tone="amber"
        />
        <StudentMetric
          icon={IconCircleCheck}
          label="Đã hoàn thành"
          value={taskSummary.done}
          hint="Được giảng viên xác nhận"
          tone="green"
        />
      </div>

      <div className="student-dashboard-grid">
        <div className="student-stack">
          <WorkQueue />
          <StudentPanel
            title="Tiếp tục từ đây"
            icon={IconTarget}
            action={
              <Link href="/intern/work" className="student-link">
                Xem tất cả
              </Link>
            }
          >
            {focusedTask ? (
              <div className="student-focus">
                <div className="student-focus-head">
                  <span className="student-focus-label">
                    Nhiệm vụ đang tập trung
                  </span>
                  <StudentBadge tone={studentToneForStatus(focusedTask.status)}>
                    {studentStatus(focusedTask.status)}
                  </StudentBadge>
                </div>
                <h3>
                  {focusedTask.code} · {focusedTask.title}
                </h3>
                <div className="student-meta">
                  <StudentChip
                    tone={studentToneForPriority(focusedTask.priority)}
                  >
                    Ưu tiên {studentPriority(focusedTask.priority)}
                  </StudentChip>
                  <StudentChip icon={IconCalendarDays}>
                    Hạn {studentDate(focusedTask.dueDate)}
                  </StudentChip>
                </div>
                <div className="my-5">
                  <StudentProgress
                    value={focusedTask.progress}
                    label="Tiến độ nhiệm vụ"
                    tone={focusedTask.progress >= 100 ? "green" : "blue"}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <StudentLink
                    href={`/intern/work/${encodeURIComponent(focusedTask.id)}`}
                  >
                    {focusedTask.status === "review"
                      ? "Xem bài nộp và phản hồi"
                      : "Mở nhiệm vụ"}
                  </StudentLink>
                  <Link
                    href="/intern/mentor"
                    className="student-action student-action-secondary"
                  >
                    <IconBot size={15} aria-hidden="true" />
                    Hỏi Mentor
                  </Link>
                </div>
              </div>
            ) : (
              <div className="student-empty">
                <IconClipboardCheck size={36} aria-hidden="true" />
                <h3>Chưa có nhiệm vụ cần tập trung</h3>
                <p>
                  Khi có công việc được giao, bạn có thể mở chi tiết và bắt đầu
                  ngay tại đây.
                </p>
                <Link href="/intern/work" className="student-link mt-4">
                  Kiểm tra danh sách công việc
                </Link>
              </div>
            )}
          </StudentPanel>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/intern/github" className="student-quick-link">
              <IconCodeXml size={22} aria-hidden="true" />
              <div>
                <strong>Không gian mã nguồn</strong>
                <p>Kiểm tra liên kết GitHub và quyền truy cập repository.</p>
              </div>
            </Link>
            <Link href="/intern/performance" className="student-quick-link">
              <IconTrendingUp size={22} aria-hidden="true" />
              <div>
                <strong>Nhìn lại tiến bộ</strong>
                <p>Xem hiệu suất và kết quả thực tập của bạn.</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="student-stack">
          <TaskDistribution
            items={[
              { label: "Cần làm", value: taskSummary.todo, tone: "neutral" },
              { label: "Đang làm", value: taskSummary.doing, tone: "primary" },
              { label: "Chờ duyệt", value: taskSummary.review, tone: "warning" },
              { label: "Hoàn thành", value: taskSummary.done, tone: "success" },
            ]}
          />
          <StudentPanel title="Nhịp Sprint" icon={IconCalendarDays}>
            {currentSprint ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <StudentBadge
                    tone={
                      sprintStatusLabel(currentSprint.status).tone === "green"
                        ? "green"
                        : "blue"
                    }
                  >
                    {sprintStatusLabel(currentSprint.status).label}
                  </StudentBadge>
                  <span className="text-caption text-muted-foreground">
                    {currentSprint.code}
                  </span>
                </div>
                <h3 className="mt-3 text-body font-bold leading-relaxed text-foreground">
                  {currentSprint.code} · {currentSprint.name}
                </h3>
                <dl className="student-info-list mt-2">
                  <div className="student-info-row">
                    <dt>
                      <span className="student-info-icon">
                        <IconCalendarDays size={15} aria-hidden="true" />
                      </span>
                      Thời gian
                    </dt>
                    <dd>
                      {studentDate(currentSprint.startDate)} đến{" "}
                      {studentDate(currentSprint.endDate)}
                    </dd>
                  </div>
                </dl>
                <div className="mt-4">
                  <StudentProgress
                    value={completed}
                    label="Tiến độ nhiệm vụ trong Sprint"
                  />
                </div>
                <div className="mt-5">
                  <StudentLink secondary href="/intern/sprint">
                    Xem bảng Sprint
                  </StudentLink>
                </div>
              </>
            ) : (
              <>
                <p className="text-body leading-7 text-muted-foreground">
                  Chưa có Sprint đang hoạt động. Nhiệm vụ đã phân công vẫn có
                  thể xem trong Công việc của tôi.
                </p>
                <div className="mt-4">
                  <StudentLink secondary href="/intern/work">
                    Xem nhiệm vụ
                  </StudentLink>
                </div>
              </>
            )}
          </StudentPanel>

          <details className="student-help-disclosure">
            <summary>Một quy trình, từng bước rõ ràng</summary>
            <ol className="student-step-list">
              <li>
                <div>
                  <strong>Hiểu yêu cầu</strong>
                  <p>
                    Đọc tiêu chí hoàn thành và kiểm tra công việc phụ thuộc
                    trước khi bắt đầu.
                  </p>
                </div>
              </li>
              <li>
                <div>
                  <strong>Làm và kiểm tra</strong>
                  <p>Cập nhật tiến độ; hỏi Mentor khi cần gỡ vướng.</p>
                </div>
              </li>
              <li>
                <div>
                  <strong>Nộp và cải thiện</strong>
                  <p>Gửi liên kết bài làm, theo dõi phản hồi và chỉnh sửa.</p>
                </div>
              </li>
            </ol>
          </details>

          {/* Mộc đỏ khi mọi nhiệm vụ đã hoàn tất — dấu đóng vào sổ */}
          {taskSummary.total > 0 && taskSummary.done === taskSummary.total ? (
            <StampMoc tone="red" thump rotate={-6} className="justify-self-start">
              Đã hoàn tất
            </StampMoc>
          ) : null}

          {/* Ghi chú tay dán lề — nhắc nhỏ quy trình nộp bài */}
          <NoteCard rotate={-1.1} title="Nhắc nhỏ">
            Nộp bài kèm liên kết repo và ghi chú thay đổi — giảng viên phản hồi
            nhanh hơn khi thấy bạn đã tự kiểm tra theo tiêu chí hoàn thành.
          </NoteCard>

          <Link href="/intern/mentor" className="student-quick-link">
            <IconBot size={20} aria-hidden="true" />
            <div>
              <strong>Đang gặp một nút thắt?</strong>
              <p>Cùng AI Mentor tìm hướng giải quyết cho nhiệm vụ hiện tại.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Hàng đợi nhiệm vụ đang mở đến dữ liệu thật từ API, thay cho bảng Kanban thu gọn. */
function WorkQueue() {
  const tasks = useResource(
    useCallback(
      (signal: AbortSignal) =>
        listTasks(
          new URLSearchParams({
            mine: "true",
            page: "1",
            pageSize: "6",
            sortBy: "priority",
            sortOrder: "DESC",
          }),
          signal,
        ),
      [],
    ),
  );
  const open = (tasks.data?.items ?? []).filter(
    (task: Task) => task.status !== "done",
  );
  return (
    <StudentPanel
      title="Việc nên xử lý tiếp theo"
      icon={IconListTodo}
      action={
        <Link href="/intern/work" className="student-link">
          Mở danh sách
        </Link>
      }
      bodyClassName="pt-0"
      className="relative"
    >
      {/* Băng dính + sao vẽ tay — mật độ ĐẬM cho panel chính dashboard intern */}
      <Tape className="tape-peel -top-3 left-7" rotate={-5} aria-hidden="true" />
      <StarDoodle className="absolute -right-1.5 -top-3.5 h-5 w-5 text-blue/50" />
      {tasks.loading ? (
        <div className="space-y-3 pt-4" aria-hidden="true">
          {[0, 1, 2].map((row) => (
            <div key={row} className="student-skeleton h-14" />
          ))}
        </div>
      ) : tasks.error ? (
        <p className="pt-4 text-body leading-7 text-muted-foreground" role="status">
          Chưa tải được danh sách nhiệm vụ. Mở{" "}
          <Link href="/intern/work" className="student-link">
            Công việc của tôi
          </Link>{" "}
          để xem đầy đủ.
        </p>
      ) : open.length ? (
        <ul className="divide-y divide-border">
          {open.map((task: Task) => (
            <li key={task.id}>
              <Link
                href={`/intern/work/${encodeURIComponent(task.id)}`}
                className="group flex items-center gap-4 py-3"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-panel bg-background text-muted-foreground">
                  {task.status === "review" ? (
                    <IconHourglass size={16} aria-hidden="true" />
                  ) : task.status === "doing" ? (
                    <IconCircleDot size={16} aria-hidden="true" />
                  ) : (
                    <IconListTodo size={16} aria-hidden="true" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="student-work-code">{task.code}</span>
                  <span className="block truncate text-small font-semibold text-foreground group-hover:text-primary">
                    {task.title}
                  </span>
                  <span className="student-work-foot mt-1">
                    <span>{studentStatus(task.status)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <IconClock size={11} aria-hidden="true" />
                      {studentDate(task.dueDate)}
                    </span>
                  </span>
                </span>
                <StudentBadge tone={studentToneForStatus(task.status)}>
                  {studentStatus(task.status)}
                </StudentBadge>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="pt-4 text-body leading-7 text-muted-foreground" role="status">
          Không còn nhiệm vụ đang mở. Mọi việc đã được xử lý hoặc đang chờ giảng
          viên xác nhận.
        </p>
      )}
    </StudentPanel>
  );
}
