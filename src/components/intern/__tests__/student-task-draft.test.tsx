import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TaskDetail } from "@/components/product/intern-work";
import { ApiError } from "@/lib/auth/api-client";
import type { Task } from "@/lib/api/work";

const api = vi.hoisted(() => ({
  getTask: vi.fn(),
  getComments: vi.fn(),
  getHistory: vi.fn(),
  updateOwnTask: vi.fn(),
}));
vi.mock("@/lib/api/work", async (original) => ({
  ...(await original<typeof import("@/lib/api/work")>()),
  ...api,
}));
vi.mock("@/components/product/task-spec", () => ({ TaskSpec: () => null }));
vi.mock("@/components/product/code-submissions", () => ({
  CodeSubmissions: () => null,
}));
const task: Task = {
  id: "task-1",
  code: "TASK-1",
  title: "Kiểm thử dữ liệu",
  description: null,
  projectId: "project-1",
  sprintId: null,
  storyPoints: 3,
  status: "doing",
  priority: "high",
  assigneeId: null,
  progress: 10,
  dueDate: null,
  version: 1,
};
beforeEach(() => {
  vi.clearAllMocks();
  api.getTask.mockResolvedValue(task);
  api.getComments.mockResolvedValue({
    items: [],
    total: 0,
    totalPages: 0,
    page: 1,
  });
  api.getHistory.mockResolvedValue({
    items: [],
    total: 0,
    totalPages: 0,
    page: 1,
  });
  api.updateOwnTask.mockResolvedValue({ ...task, version: 2, progress: 45 });
});

it("keeps an unsent comment and focus when saving progress refreshes the task", async () => {
  render(<TaskDetail id={task.id} />);
  const comment = await screen.findByRole("textbox", { name: "Bình luận mới" });
  fireEvent.change(comment, {
    target: { value: "Câu hỏi đang viết, chưa gửi" },
  });
  fireEvent.change(screen.getByRole("slider", { name: "Tiến độ nhiệm vụ" }), {
    target: { value: "45" },
  });
  comment.focus();
  let complete!: (value: Task) => void;
  api.getTask.mockImplementationOnce(
    () =>
      new Promise<Task>((resolve) => {
        complete = resolve;
      }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Lưu tiến độ" }));
  await waitFor(() => expect(api.getTask).toHaveBeenCalledTimes(2));
  expect(screen.getByRole("textbox", { name: "Bình luận mới" })).toBe(comment);
  expect(comment).toHaveFocus();
  expect(comment).toHaveValue("Câu hỏi đang viết, chưa gửi");
  expect(screen.getByRole("button", { name: "Lưu tiến độ" })).toBeDisabled();
  complete({ ...task, version: 2, progress: 45 });
  await waitFor(() =>
    expect(
      screen.getByRole("slider", { name: "Tiến độ nhiệm vụ" }),
    ).toHaveValue("45"),
  );
  expect(comment).toHaveValue("Câu hỏi đang viết, chưa gửi");
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Lưu tiến độ" })).toBeEnabled(),
  );
  expect(api.updateOwnTask).toHaveBeenCalledWith(task.id, {
    expectedVersion: 1,
    progress: 45,
  });
});

it("uses the latest server progress after a version conflict without deleting the comment draft", async () => {
  render(<TaskDetail id={task.id} />);
  const comment = await screen.findByRole("textbox", { name: "Bình luận mới" });
  fireEvent.change(comment, { target: { value: "Nội dung cần giữ" } });
  fireEvent.change(screen.getByRole("slider", { name: "Tiến độ nhiệm vụ" }), {
    target: { value: "45" },
  });
  api.updateOwnTask.mockRejectedValueOnce(
    new ApiError(409, "VERSION_CONFLICT", "Nhiệm vụ đã được cập nhật."),
  );
  api.getTask.mockResolvedValue({ ...task, progress: 70, version: 2 });
  fireEvent.click(screen.getByRole("button", { name: "Lưu tiến độ" }));
  await waitFor(() =>
    expect(
      screen.getByRole("slider", { name: "Tiến độ nhiệm vụ" }),
    ).toHaveValue("70"),
  );
  expect(screen.getByRole("textbox", { name: "Bình luận mới" })).toBe(comment);
  expect(comment).toHaveValue("Nội dung cần giữ");
  expect(api.updateOwnTask).toHaveBeenCalledTimes(1);
});
