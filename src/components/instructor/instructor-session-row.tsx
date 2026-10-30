import Link from "next/link";
import type { SessionOverviewRow } from "@/lib/api/sessions";
import { StatusDot } from "@/components/product/primitives";
import { StampMoc } from "@/components/workspace/notebook";
import { instructorDate } from "./instructor-ui";

export function InstructorSessionRow({
  row,
  status,
  onManage,
}: {
  row: SessionOverviewRow;
  status: { label: string; tone: "amber" | "blue" | "green" | "gray" };
  onManage?: (id: string) => void;
}) {
  return (
    <article
      className={`workspace-collection-row workspace-session-row${row.status === "upcoming" ? " dashed-cut" : ""}`}
    >
      <div>
        <h3><Link href={`/instructor/sessions/${row.id}`}>{row.name}</Link></h3>
        <p className="workspace-session-meta">
          {row.code}, {instructorDate(row.startDate)} →{" "}
          {instructorDate(row.endDate)}
        </p>
        <p className="workspace-session-meta">
          Dự án: {row.project?.name ?? "—"}
          {row.project?.templateVersion != null
            ? `, mẫu v${row.project.templateVersion}`
            : ""}{" "}
         , {row.memberCount} thành viên, {row.sprintCount} sprint ·{" "}
          {row.taskDone}/{row.taskTotal} nhiệm vụ ({row.taskPercent}%)
        </p>
        <p className="workspace-session-meta">
          Sprint đang chạy:{" "}
          {row.currentSprint?.name ?? "Chưa có sprint nào đang chạy"}
        </p>
        {row.alerts && (
          <div
            className="workspace-session-alerts"
            role="group"
            aria-label="Cảnh báo tiến độ"
          >
            {row.alerts.overdueTasks > 0 && (
              <span className="text-destructive">
                {row.alerts.overdueTasks} nhiệm vụ quá hạn
              </span>
            )}
            {row.alerts.pendingReview > 0 && (
              <span className="text-warning">
                {row.alerts.pendingReview} nhiệm vụ chờ duyệt
              </span>
            )}
            {row.alerts.sessionOverdue && (
              <span className="text-destructive">Phiên đã quá ngày kết thúc</span>
            )}
          </div>
        )}
      </div>
      <div>
        {row.status === "completed" ? (
          <StampMoc tone="blue" size="sm" thump>
            {status.label}
          </StampMoc>
        ) : (
          <StatusDot tone={status.tone}>{status.label}</StatusDot>
        )}
      </div>
      <div className="workspace-session-progress">
        <span>Hoàn thành nhiệm vụ</span>
        <progress
          value={row.taskPercent}
          max={100}
          aria-label={`Tiến độ ${row.name}`}
        />
        <strong>
          {row.taskPercent}%
        </strong>
      </div>
      <div className="workspace-session-actions">
        <Link href={`/instructor/sessions/${row.id}`}>Chi tiết</Link>
        {row.status === "upcoming" && row.project && (
          <Link
            href={`/instructor/sessions/${row.id}/setup?project=${row.project.id}`}
          >
            Thiết lập đội hình
          </Link>
        )}
        {onManage && (
          <button onClick={() => onManage(row.id)}>Quản trị thông tin</button>
        )}
      </div>
    </article>
  );
}
