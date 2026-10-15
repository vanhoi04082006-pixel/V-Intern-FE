import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { CodeSubmissions } from "../code-submissions";
import type { Task } from "@/lib/api/work";

const api = vi.hoisted(() => ({
  listSubmissions: vi.fn(),
  listCodeReviews: vi.fn(),
}));
vi.mock("@/lib/api/submissions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/submissions")>()),
  ...api,
}));
vi.mock("@/lib/auth/session", () => ({
  getSessionUser: () => ({ id: "instructor-1" }),
}));
const task: Task = {
  id: "task-1",
  code: "TASK-1",
  title: "Build endpoint",
  description: null,
  projectId: "project-1",
  sprintId: null,
  status: "review",
  priority: "high",
  assigneeId: "intern-1",
  dueDate: null,
  progress: 100,
  storyPoints: 3,
  version: 2,
};
const submission = {
  id: "submission-1",
  taskId: task.id,
  internId: "intern-1",
  prUrl: "https://github.com/teacher/project/pull/1",
  summary: "Implemented and tested endpoint",
  status: "submitted",
  score: null,
  feedback: null,
  headSha: "abcdef",
  submittedAt: "2026-10-14T10:00:00Z",
};
const rubric = {
  functional: 90,
  quality: 82,
  testing: 75,
  errors: 81,
  security: 88,
  dod: 94,
};
beforeEach(() => {
  vi.clearAllMocks();
  api.listSubmissions.mockResolvedValue([submission]);
});

describe("instructor AI rubric handoff", () => {
  it('shows a changed-source observation without replacing the submitted commit', async () => {
    api.listSubmissions.mockResolvedValue([{ ...submission, observedHeadSha: 'b'.repeat(40), sourceChangedAt: '2026-10-15T01:00:00Z' }]);
    api.listCodeReviews.mockResolvedValue([]);
    render(<CodeSubmissions task={task} managed onUpdated={vi.fn()} />);
    expect(await screen.findByText('GitHub ghi nhận code thay đổi sau khi nộp bài.')).toBeInTheDocument();
    expect(screen.getByText('Commit được nộp: abcdef')).toBeInTheDocument();
  });
  it("initializes the confirmation form from the asynchronously loaded AI rubric", async () => {
    api.listCodeReviews.mockResolvedValue([
      {
        id: "review-1",
        status: "awaiting_instructor",
        result: {
          rubric,
          summary: "Implementation meets requirements.",
          score: 86,
          findings: [],
          limitations: [],
        },
        model: "test-model",
        headSha: "abcdef",
        inputHash: "hash",
        evidence: null,
        errorCode: null,
      },
    ]);
    render(<CodeSubmissions task={task} managed onUpdated={vi.fn()} />);
    await screen.findByText("AI đề xuất đạt · Chờ giảng viên xác nhận");
    await waitFor(() =>
      expect(screen.getByRole("spinbutton", { name: "Chức năng" })).toHaveValue(
        90,
      ),
    );
    expect(screen.getByRole("spinbutton", { name: "Kiểm thử" })).toHaveValue(
      75,
    );
  });
});
