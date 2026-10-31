import {
  CheckCheck,
  ClipboardList,
  Clock,
  TrendingUp,
} from "lucide-react";
import type { getPerformance } from "@/lib/api/outcomes";
import {
  StudentLink,
  StudentMetric,
  StudentPanel,
} from "./student-ui";
import { RateComparison } from "@/components/workspace/workspace-charts";
import { useInternWorkspaceContext } from "./intern-workspace-context";
import { MarginNote } from "@/components/workspace/notebook";

export function StudentPerformance({
  data: m,
}: {
  data: Awaited<ReturnType<typeof getPerformance>>;
}) {
  const context = useInternWorkspaceContext();
  const activeAssignment = !context || context.workspace.status === "active";
  return (
    <div className="space-y-5">
      <div className="workspace-stat-strip grid sm:grid-cols-2 xl:grid-cols-4">
        <StudentMetric
          icon={ClipboardList}
          label="Nhiệm vụ được giao"
          value={m.totalTaskCount}
        />
        <StudentMetric
          icon={CheckCheck}
          label="Đã hoàn thành"
          value={m.completedTaskCount}
          tone="green"
        />
        <StudentMetric
          icon={Clock}
          label="Nhiệm vụ đang quá hạn"
          value={m.overdueOpenTaskCount}
          tone={m.overdueOpenTaskCount ? "amber" : "slate"}
        />
        <StudentMetric
          icon={TrendingUp}
          label="Điểm đánh giá trung bình"
          value={m.averageEvaluationScore ?? "—"}
          hint={`${m.finalizedEvaluationCount} đánh giá đã chốt`}
        />
      </div>
      <div className="student-dashboard-grid">
        <StudentPanel title="Bước tiếp theo">
          <p className="mb-5 text-body leading-7 text-muted-foreground">
            {!activeAssignment
              ? "Phiên thực tập đã kết thúc. Xem lại đánh giá chính thức và gợi ý phát triển để chuẩn bị cho chặng tiếp theo."
              : m.overdueOpenTaskCount > 0
              ? `Bạn có ${m.overdueOpenTaskCount} nhiệm vụ đang quá hạn. Xem lại công việc và trao đổi với giảng viên về những trở ngại.`
              : m.totalTaskCount === 0
                ? "Chưa có công việc để đo hiệu suất. Các chỉ số sẽ được cập nhật khi bạn nhận nhiệm vụ và bắt đầu thực hiện."
                : "Tiếp tục cập nhật tiến độ, kiểm thử và nộp bài đúng hạn. Đọc nhận xét chính thức để chọn điều cần cải thiện."}
          </p>
          <StudentLink href={activeAssignment ? "/intern/work" : "/intern/evaluations"}>
            {activeAssignment ? "Xem công việc" : "Xem đánh giá"}
          </StudentLink>
          <div className="mt-4">
            <StudentLink secondary href="/intern/recommendations">
              Gợi ý phát triển
            </StudentLink>
          </div>
          <MarginNote className="mt-4">
            {!activeAssignment
              ? "Kỳ này đã khép sổ — đọc kỹ nhận xét để chuẩn bị chặng sau."
              : m.overdueOpenTaskCount > 0
                ? "Dọn mấy việc quá hạn trước đã nhé, đừng để dồn lại!"
                : m.totalTaskCount === 0
                  ? "Chưa có số liệu là chuyện thường — có việc là có điểm."
                  : "Giữ nhịp này là đẹp — đừng quên đọc nhận xét của giảng viên."}
          </MarginNote>
        </StudentPanel>
        <div>
          <RateComparison label="Nhìn vào quá trình" items={[
            { label: "Hoàn thành nhiệm vụ", value: m.taskCompletionRate },
            { label: "Hoàn thành đúng hạn", value: m.onTimeCompletionRate },
            { label: "Tiến độ Sprint hiện tại", value: m.activeSprintProgress },
            { label: "Hoàn thành điểm độ lớn", value: m.storyPointCompletionRate },
          ]} />
          <div className="mt-7 border-t border-border pt-5 text-body text-muted-foreground">
            <strong className="text-foreground tabular-nums">
              {m.completedStoryPoints}/{m.committedStoryPoints}
            </strong>{" "}
            điểm độ lớn đã hoàn thành / cam kết
          </div>
        </div>
      </div>
      <p className="text-caption leading-6 text-muted-foreground">
        Chưa đo được nghĩa là chưa có đủ dữ liệu. Hệ thống không suy diễn xu
        hướng từ một thời điểm. Các chỉ số được tính từ nhiệm vụ và đánh giá
        chính thức.
      </p>
    </div>
  );
}
