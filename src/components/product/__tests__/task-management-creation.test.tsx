import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, expect, it, vi } from "vitest";
import { TaskManagement } from "../sprint-management";
import { listTasks, parseTask } from "@/lib/api/work";

vi.mock("@/lib/api/work", async original => ({ ...await original<typeof import("@/lib/api/work")>(), listTasks: vi.fn() }));
vi.mock("@/lib/api/academic", async original => ({ ...await original<typeof import("@/lib/api/academic")>(), getMembers: vi.fn(async () => []) }));
beforeAll(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value() { this.setAttribute("open", ""); } },
    close: { configurable: true, value() { this.removeAttribute("open"); } },
  });
});
beforeEach(() => {
  vi.mocked(listTasks).mockResolvedValue({ items: [parseTask({ id: "task-1", code: "T-1", title: "Retained work", status: "todo", priority: "medium", progress: 0, dueDate: null, assigneeId: null, description: "Keep prior work", projectId: "p1", sprintId: "sp1", storyPoints: 1, version: 1 })], total: 1, page: 1, pageSize: 10, totalPages: 1 });
});

it("hides new-task creation for a closed Sprint while keeping retained work editable", async () => {
  render(<TaskManagement projectId="p1" sprintId="sp1" allowCreate={false} />);
  await screen.findByText("Retained work");
  expect(screen.queryByRole("button", { name: "Tạo nhiệm vụ" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByLabelText("Thao tác T-1"));
  fireEvent.click(screen.getByRole("menuitem", { name: "Sửa nhiệm vụ" }));
  expect(screen.getByRole("dialog", { name: "Sửa nhiệm vụ" })).toBeInTheDocument();
  expect(screen.getByLabelText("Tên nhiệm vụ")).toHaveValue("Retained work");
});

it("keeps creation available in an open Sprint", async () => {
  render(<TaskManagement projectId="p1" sprintId="sp1" />);
  await screen.findByText("Retained work");
  fireEvent.click(screen.getByRole("button", { name: "Tạo nhiệm vụ" }));
  expect(screen.getByRole("dialog", { name: "Tạo nhiệm vụ" })).toBeInTheDocument();
});
