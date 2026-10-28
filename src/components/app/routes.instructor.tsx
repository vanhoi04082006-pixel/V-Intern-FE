"use client";

/**
 * Registry INSTRUCTOR — task 3-b bổ sung: recruitment-rounds, participation,
 * sharing, tasks/:id (detail quản trị) + classes redirect; notifications/
 * profile/github đã do routes.outcomes.tsx đăng ký chung 3 role.
 */
import * as React from "react";
import type { RouteDefinition } from "./route-types";
import { navigate } from "@/lib/client/router";
import { InstructorHome } from "@/components/views/instructor/home";
import { InstructorTemplates } from "@/components/views/instructor/templates";
import { InstructorTemplateDetail } from "@/components/views/instructor/template-detail";
import { InstructorSessions } from "@/components/views/instructor/sessions";
import { InstructorSessionDetail } from "@/components/views/instructor/session-detail";
import { InstructorSprints } from "@/components/views/instructor/sprints";
import { SprintWorkspace } from "@/components/views/instructor/sprint-workspace";
import { InstructorEvaluations } from "@/components/views/instructor/evaluations";
import { InstructorPerformance } from "@/components/views/instructor/performance";
import { InstructorReports } from "@/components/views/instructor/reports";
import { InstructorRecruitmentRounds } from "@/components/views/instructor/recruitment-rounds-view";
import { InstructorParticipation } from "@/components/views/instructor/participation-view";
import { InstructorSharing } from "@/components/views/instructor/sharing-view";
import { InstructorTaskDetail } from "@/components/views/instructor/task-manage-view";

/** /instructor/classes — trang cũ của bản gốc, giờ trỏ về thư viện dự án mẫu. */
function ClassesRedirect() {
  React.useEffect(() => {
    navigate("/instructor/projects", { replace: true });
  }, []);
  return null;
}

/** Wrapper cho task detail dạng route (đóng → về danh sách sprint). */
function InstructorTaskDetailRoute({ params }: { params: Record<string, string> }) {
  return (
    <InstructorTaskDetail
      taskId={params.id}
      onClose={() => navigate("/instructor/sprints")}
    />
  );
}

export const instructorRoutes: RouteDefinition[] = [
  { pattern: "/instructor", component: InstructorHome },
  { pattern: "/instructor/classes", component: ClassesRedirect },
  { pattern: "/instructor/projects", component: InstructorTemplates },
  { pattern: "/instructor/projects/:id", component: InstructorTemplateDetail },
  { pattern: "/instructor/recruitment-rounds", component: InstructorRecruitmentRounds },
  { pattern: "/instructor/recruitment-rounds/:id", component: InstructorRecruitmentRounds },
  { pattern: "/instructor/sessions", component: InstructorSessions },
  { pattern: "/instructor/sessions/:id", component: InstructorSessionDetail },
  { pattern: "/instructor/sprints", component: InstructorSprints },
  { pattern: "/instructor/sprints/:id", component: SprintWorkspace },
  { pattern: "/instructor/tasks/:id", component: InstructorTaskDetailRoute },
  { pattern: "/instructor/participation", component: InstructorParticipation },
  { pattern: "/instructor/sharing", component: InstructorSharing },
  { pattern: "/instructor/evaluations", component: InstructorEvaluations },
  { pattern: "/instructor/performance", component: InstructorPerformance },
  { pattern: "/instructor/reports", component: InstructorReports },
];
