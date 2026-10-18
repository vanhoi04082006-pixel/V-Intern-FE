import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
it.each([
  ['branch', 'feature/notes', 'Nhánh: feature/notes'],
  ['pull', '1', 'Pull request #1'],
  ['commit', 'abcdef', 'Commit/ref: abcdef'],
])('shows a stored %s source without confusing its ref with another kind', async (sourceKind, sourceRef, label) => {
  api.listSubmissions.mockResolvedValue([{ ...submission, sourceKind, sourceRef }]);
  api.listCodeReviews.mockResolvedValue([]);
  render(<CodeSubmissions task={task} managed onUpdated={vi.fn()} />);
  expect(await screen.findByText(label)).toBeInTheDocument();
  expect(screen.getByText('Commit được nộp: abcdef')).toBeInTheDocument();
});
beforeEach(() => {
  vi.clearAllMocks();
  api.listSubmissions.mockResolvedValue([submission]);
});

describe("instructor AI rubric handoff", () => {
  it("shows the completed instructor decision without leaving AI approval pending", async () => {
    api.listSubmissions.mockResolvedValue([{ ...submission, status: "approved", score: 90.5, feedback: "Reviewed and approved." }]);
    api.listCodeReviews.mockResolvedValue([{ id: "review-approved", status: "awaiting_instructor", result: { rubric, summary: "Requirements met.", score: 98, findings: [], limitations: [] }, model: "test-model", headSha: "abcdef", inputHash: "hash", evidence: null, errorCode: null }]);
    render(<CodeSubmissions task={{ ...task, status: "done" }} managed onUpdated={vi.fn()} />);
    await userEvent.click(await screen.findByRole("button", { name: "Xem đánh giá và bằng chứng" }));
    expect(await screen.findByText("AI đề xuất đạt · Giảng viên đã duyệt")).toBeInTheDocument();
    expect(screen.queryByText("AI đề xuất đạt · Chờ giảng viên xác nhận")).not.toBeInTheDocument();
    expect(screen.queryByRole("spinbutton", { name: "Chức năng" })).not.toBeInTheDocument();
  });
  it('shows signed execution timing and failed criteria alongside the AI review', async () => {
    api.listCodeReviews.mockResolvedValue([{ id: 'review-tests', status: 'needs_changes', result: { rubric, summary: 'Fix input validation.', score: 70, findings: [], limitations: [] }, model: 'test-model', headSha: 'abcdef', inputHash: 'hash', errorCode: null,
      evidence: { complete: true, warnings: [], tests: { status: 'completed', passed: 1, failed: 1, summary: 'One acceptance check failed.', executionTimeMs: 1234, score: 50, checks: [
        { name: 'Create valid note', passed: true, log: 'Acceptance behavior verified.' }, { name: 'Reject empty title', passed: false, log: 'Expected acceptance behavior was not satisfied.' },
      ] } } }]);
    render(<CodeSubmissions task={task} managed onUpdated={vi.fn()} />);
    expect(await screen.findByText('Thực thi: 1.23 giây · Điểm test: 50/100')).toBeInTheDocument();
    expect(screen.getByText('Chưa đạt · Reject empty title')).toBeInTheDocument();
    expect(screen.getByText('Expected acceptance behavior was not satisfied.')).toBeInTheDocument();
  });
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
