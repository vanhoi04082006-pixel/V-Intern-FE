import type { InternWorkspace } from "@/lib/api/workspace";
import type {
  RecruitmentProfile,
  Interview,
  RecruitmentResult,
} from "@/lib/api/recruitment";
export const principal = {
  id: "intern-1",
  email: "intern@test.local",
  displayName: "Nguyễn Chờ Phân Công",
  roles: ["intern"],
  permissions: ["intern.workspace.view", "recruitment.view.own"],
};
export const waiting: InternWorkspace = {
  status: "unassigned",
  assignment: null,
  recruitment: {
    status: "passed",
    selectedRole: "backend",
    attemptCount: 1,
    recruitedAt: "2026-10-07T09:00:00Z",
  },
  currentSprint: null,
  taskSummary: { todo: 0, doing: 0, review: 0, done: 0, total: 0 },
  focusedTask: null,
};
export const active: InternWorkspace = {
  ...waiting,
  status: "active",
  assignment: {
    id: "assignment-1",
    assignedAt: "2026-10-07T10:00:00Z",
    project: {
      id: "project-1",
      code: "PRJ-REAL",
      name: "Dự án từ API",
      status: "active",
    },
    session: {
      id: "session-1",
      code: "SESSION-REAL",
      name: "Phiên từ API",
      status: "active",
    },
  },
  currentSprint: {
    id: "sprint-1",
    code: "SPR-REAL",
    name: "Sprint từ API",
    status: "active",
    startDate: "2026-10-01",
    endDate: "2026-10-14",
  },
  taskSummary: { todo: 2, doing: 1, review: 1, done: 3, total: 7 },
  focusedTask: {
    id: "task-1",
    code: "TASK-REAL",
    title: "Task từ API",
    status: "doing",
    priority: "high",
    progress: 42,
    dueDate: "2026-10-09",
  },
};
export const profile: RecruitmentProfile = {
  status: "not_started",
  selectedRole: null,
  selectedRoleLabel: null,
  attemptNumber: 0,
  attemptsRemaining: 3,
  nextEligibleAt: null,
  currentInterviewSessionId: null,
  recruitedAt: null,
  result: null,
};
export const interview: Interview = {
  session: {
    id: "interview-1",
    roleCode: "backend",
    status: "in_progress",
    startedAt: "2026-10-07T10:00:00Z",
    expiresAt: "2026-10-07T10:30:00Z",
    submittedAt: null,
    attemptNumber: 1,
    questionCount: 2,
    serverNow: "2026-10-07T10:20:00Z",
    secondsRemaining: 600,
  },
  questions: [
    {
      id: "question-1",
      position: 1,
      category: "technical",
      difficulty: "medium",
      prompt: "Câu hỏi kỹ thuật từ backend",
      answered: false,
      answeredAt: null,
    },
    {
      id: "question-2",
      position: 2,
      category: "soft",
      difficulty: "medium",
      prompt: "Câu hỏi kỹ năng mềm từ backend",
      answered: false,
      answeredAt: null,
    },
  ],
};
export const result: RecruitmentResult = {
  id: "result-1",
  sessionId: "interview-1",
  technicalScore: 12,
  softSkillScore: 34,
  overallScore: 88.7,
  decision: "passed",
  strengths: ["Điểm mạnh từ API"],
  weaknesses: [],
  criteria: [{ code: "technical", score: 12, feedback: "Chi tiết từ API" }],
  feedback: "Nhận xét từ API",
  recommendedRole: null,
  model: "test-provider",
  promptVersion: "test-v1",
  evaluatedAt: "2026-10-07T10:30:00Z",
};
export function blocked(status: InternWorkspace["status"]): InternWorkspace {
  return {
    ...waiting,
    status,
    recruitment: {
      status:
        status === "recruitment_failed"
          ? "failed"
          : status === "recruitment_in_progress"
            ? "interview_in_progress"
            : "not_started",
      selectedRole: null,
      attemptCount: 0,
      recruitedAt: null,
    },
  };
}
