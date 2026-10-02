import { AiMentorCard } from "./ai-mentor-card";
import { FocusedTaskCard } from "./focused-task";
import { InternKpiGrid } from "./intern-kpi-grid";
import { NotificationsCard } from "./notifications-card";
import { PerformanceSummary } from "./performance-summary";
import { PullRequestReviewCard } from "./pull-request-review";
import { TaskBoard } from "./task-board";
import type { InternWorkspaceState } from "./data/intern-mock-data";

/**
 * State B — ACTIVE của Intern Workspace (reference image 1):
 * hàng 5 KPI → Task Board (trái) + rail phải (AI Mentor, PR & AI Review,
 * Thông báo) → Task đang tập trung → dải Hiệu suất thực tập full-width.
 * Chỉ render SAU khi WorkspaceGuard xác thực role intern.
 */
export function ActiveInternWorkspace({
  state,
}: {
  state: Extract<InternWorkspaceState, { status: "active" }>;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <InternKpiGrid kpis={state.kpis} />

      {/* Board + focused task (trái) | rail phải (Mentor, PR, thông báo) */}
      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <TaskBoard columns={state.boardColumns} />
          <FocusedTaskCard focusedTask={state.focusedTask} />
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <AiMentorCard mentor={state.mentor} />
          <PullRequestReviewCard pullRequest={state.pullRequest} />
          <NotificationsCard
            notifications={state.notifications}
            actionLabel={state.notificationsActionLabel}
          />
        </div>
      </div>

      <PerformanceSummary performance={state.performance} />
    </div>
  );
}
