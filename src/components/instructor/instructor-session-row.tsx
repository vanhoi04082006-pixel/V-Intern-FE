import Link from "next/link";
import type { SessionOverviewRow } from "@/lib/api/sessions";
import { StatusDot } from "@/components/product/primitives";
import { StampMoc } from "@/components/workspace/notebook";
import { Tape } from "@/components/notebook/ui";
import { instructorDate } from "./instructor-ui";

/** Journey v3: map tông chip trạng thái sang data-tone của nb3-chip. */
const STATUS_TONE_KEY: Record<string, string> = {
  blue: "blue",
  green: "green",
  amber: "amber",
  gray: "muted",
  red: "red",
};

/** Số ngày còn lại đến một mốc thật của phiên (0 nếu mốc đã qua). */
function daysUntil(iso: string): number {
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time)) return 0;
  return Math.max(0, Math.ceil((time - Date.now()) / 86_400_000));
}

export function InstructorSessionRow({
  row,
  status,
  onManage,
}: {
  row: SessionOverviewRow;
  status: { label: string; tone: "amber" | "blue" | "green" | "gray" | "red" };
  onManage?: (id: string) => void;
}) {
  const daysToStart = daysUntil(row.startDate);
  const daysToEnd = daysUntil(row.endDate);
  return (
    <article
      className={`workspace-collection-row workspace-session-row ins-session-card sketch-card-sm relative${
        row.status === "upcoming" ? " dashed-cut" : ""
      }${row.status === "cancelled" ? " opacity-75" : ""}`}
    >
      {/* Băng dính hổ phách — phiên sắp mở dán nhắc lịch. */}
      {row.status === "upcoming" && (
        <Tape
          variant="warm"
          rotate={-4}
          className="-top-3 left-7"
          style={{ width: 64, height: 20 }}
        />
      )}
      {/* Băng dính vàng son — phiên sắp kết thúc cần chốt quân. */}
      {row.status === "ending" && (
        <Tape
          variant="warm"
          rotate={-4}
          className="tape-gold -top-3 left-7"
          style={{ width: 64, height: 20 }}
        />
      )}
      {/* Tem xám nghiêng — phiên đã hủy vẫn giữ lịch sử (trang trí). */}
      {row.status === "cancelled" && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rotate-[9deg] rounded-full border-[2.5px] border-[color-mix(in_srgb,var(--ink)_50%,transparent)] px-3 py-0.5 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[color-mix(in_srgb,var(--ink)_50%,transparent)]"
        >
          Đã hủy
        </span>
      )}
      <div>
        <h3><Link href={`/instructor/sessions/${row.id}`}>{row.name}</Link></h3>
        <p className="workspace-session-meta">
          {row.code}, {instructorDate(row.startDate)} →{" "}
          {instructorDate(row.endDate)}
        </p>
        <p className="workspace-session-meta">
          Dự án: {row.project?.name ?? "—"}
          {row.project?.templateVersion != null
            ? ` · mẫu v${row.project.templateVersion}`
            : ""}{" "}
          · {row.memberCount} thành viên · {row.sprintCount} sprint ·{" "}
          {row.taskDone}/{row.taskTotal} nhiệm vụ ({row.taskPercent}%)
        </p>
        <p className="workspace-session-meta">
          Sprint đang chạy:{" "}
          {row.currentSprint?.name ?? "Chưa có sprint nào đang chạy"}
        </p>
        {row.status === "upcoming" && (
          <p className="mt-1 font-hand text-[0.95rem] leading-snug text-warning">
            bắt đầu sau {daysToStart} ngày
          </p>
        )}
        {row.status === "ending" && (
          <p className="mt-1 font-hand text-[0.95rem] leading-snug text-warning">
            còn {daysToEnd} ngày là khép lại
          </p>
        )}
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
        ) : row.status === "active" ? (
          /* ws-dot-live: chấm mực sống động pulse cho phiên đang chạy. */
          <span
            data-tone={STATUS_TONE_KEY[status.tone] ?? "blue"}
            className="product-status nb3-chip inline-flex items-center gap-2 whitespace-nowrap leading-none"
          >
            <span aria-hidden="true" className="ws-dot-live" />
            {status.label}
          </span>
        ) : row.status === "cancelled" ? (
          /* Phiên đã hủy đổi sang tông đỏ để phân biệt với tạm dừng/lưu trữ. */
          <StatusDot tone="red">{status.label}</StatusDot>
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
