import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCheck,
  Clock3,
  Layers3,
} from "lucide-react";
import type { SessionOverviewRow } from "@/lib/api/sessions";
import { TaskDistribution } from "@/components/workspace/workspace-ui";
import { SessionProgressComparison } from "@/components/workspace/workspace-charts";

export function InstructorSessionSummary({
  rows,
  total,
}: {
  rows: SessionOverviewRow[];
  total: number;
}) {
  const alertsKnown = rows.every((row) => row.alerts !== undefined);
  const review = rows.reduce(
    (sum, row) => sum + (row.alerts?.pendingReview ?? 0),
    0,
  );
  const overdue = rows.reduce(
    (sum, row) => sum + (row.alerts?.overdueTasks ?? 0),
    0,
  );
  const done = rows.reduce((sum, row) => sum + row.taskDone, 0);
  const tasks = rows.reduce((sum, row) => sum + row.taskTotal, 0);
  const attention = rows.filter(
    (row) =>
      row.alerts &&
      (row.alerts.pendingReview > 0 ||
        row.alerts.overdueTasks > 0 ||
        row.alerts.sessionOverdue),
  );
  return (
    <section
      className="ins-operations"
      aria-label="Tình hình các phiên đang hiển thị"
    >
      <div className="ins-metric-grid">
        {[
          {
            label: "Phiên theo bộ lọc",
            value: total,
            icon: Layers3,
            tone: "blue",
          },
          {
            label: "Nhiệm vụ hoàn thành",
            value: `${done} / ${tasks}`,
            icon: CheckCheck,
            tone: "green",
          },
          {
            label: "Bài chờ duyệt",
            value: alertsKnown ? review : "Chưa có dữ liệu",
            icon: Clock3,
            tone: "amber",
          },
          {
            label: "Nhiệm vụ quá hạn",
            value: alertsKnown ? overdue : "Chưa có dữ liệu",
            icon: AlertCircle,
            tone: "rose",
          },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div className="ins-metric" data-tone={tone} key={label}>
            <span>
              <Icon size={18} aria-hidden="true" />
            </span>
            <div>
              <p>{label}</p>
              <strong>{value}</strong>
            </div>
          </div>
        ))}
      </div>
      <p className="ins-scope-note">
        Tổng số phiên theo bộ lọc; tiến độ và cảnh báo từ {rows.length} phiên
        đang hiển thị.
      </p>
      <div className="ins-attention">
        <header>
          <h2>Ưu tiên xử lý</h2>
          <p>Đi thẳng đến bài chờ duyệt hoặc phiên cần theo dõi.</p>
        </header>
        {attention.length ? (
          <ul>
            {attention.map((row) => (
              <li key={row.id}>
                <div>
                  <Link
                    href={`/instructor/sessions/${encodeURIComponent(row.id)}`}
                  >
                    {row.name}
                  </Link>
                  <p>
                    {row.code}
                    {row.alerts!.overdueTasks > 0 &&
                      ` · ${row.alerts!.overdueTasks} nhiệm vụ quá hạn`}
                    {row.alerts!.sessionOverdue &&
                      " · Phiên đã quá ngày kết thúc"}
                  </p>
                </div>
                <Link
                  className="ins-queue-action"
                  href={
                    row.alerts!.pendingReview > 0
                      ? `/instructor/sessions/${encodeURIComponent(row.id)}?taskStatus=review#session-work`
                      : `/instructor/sessions/${encodeURIComponent(row.id)}#session-work`
                  }
                >
                  {row.alerts!.pendingReview > 0
                    ? `Duyệt ${row.alerts!.pendingReview} bài`
                    : "Xem công việc"}
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="ins-attention-empty">
            {alertsKnown
              ? "Các phiên đang hiển thị chưa có bài chờ duyệt hoặc nhiệm vụ quá hạn."
              : "Chưa có dữ liệu cảnh báo cho các phiên này."}
          </p>
        )}
      </div>
      <div className="workspace-analytics-grid">
        <TaskDistribution
        label="Tiến độ nhiệm vụ trong các phiên đang hiển thị"
        items={[
          { label: "Đã hoàn thành", value: done, tone: "success" },
          {
            label: "Chưa hoàn thành",
            value: Math.max(0, tasks - done),
            tone: "neutral",
          },
        ]}
        />
        <SessionProgressComparison items={rows.map((row) => ({ id: row.id, name: row.name, done: row.taskDone, total: row.taskTotal }))} />
      </div>
    </section>
  );
}
