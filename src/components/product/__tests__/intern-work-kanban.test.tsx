import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { InternWork } from "../intern-work";
import type { Task } from "@/lib/api/work";

const api = vi.hoisted(() => ({
  listTasks: vi.fn(),
  getTask: vi.fn(),
  getComments: vi.fn(),
  getHistory: vi.fn(),
  updateOwnTask: vi.fn(),
}));
vi.mock("@/lib/api/work", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/work")>()),
  ...api,
}));
vi.mock("../task-spec", () => ({ TaskSpec: () => null }));
vi.mock("../code-submissions", () => ({ CodeSubmissions: () => null }));
let task: Task;
const page = (items: Task[]) => ({
  items,
  page: 1,
  pageSize: 8,
  total: items.length,
  totalPages: items.length ? 1 : 0,
});
beforeEach(() => {
  vi.clearAllMocks();
  task = {
    id: "task-1",
    code: "TASK-1",
    title: "Implement endpoint",
    description: null,
    projectId: "project-1",
    sprintId: null,
    status: "todo",
    priority: "high",
    assigneeId: "intern-1",
    dueDate: null,
    progress: 0,
    storyPoints: 3,
    version: 1,
  };
  api.listTasks.mockImplementation(async (query: URLSearchParams) => {
    if (query.has("search") && !query.get("search")?.trim()) throw new Error("Backend search requires at least one character");
    return page(
      !query.get("status") || query.get("status") === task.status
        ? [{ ...task }]
        : [],
    );
  });
  api.getTask.mockImplementation(async () => ({ ...task }));
  api.getComments.mockResolvedValue(page([]));
  api.getHistory.mockResolvedValue(page([]));
  api.updateOwnTask.mockImplementation(async () => {
    task = { ...task, status: "doing", version: task.version + 1 };
    return task;
  });
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});

describe("Kanban task mutation synchronization", () => {
  it('shows actual sprint, progress and repository readiness without fetching per card', async () => {
    task = { ...task, sprintId: 'sprint-1', sprint: { id: 'sprint-1', code: 'SP-1', name: 'Nền tảng', status: 'active' }, repository: { status: 'ready', fullName: 'teacher/vintern-project' }, progress: 35 } as Task;
    render(<InternWork />);
    fireEvent.click(screen.getByRole('button', { name: 'Bảng Kanban' }));
    const card = await within(screen.getByRole('region', { name: 'Cần làm' })).findByRole('button', { name: /TASK-1/ });
    expect(within(card).getByText('Sprint: Nền tảng')).toBeInTheDocument();
    expect(within(card).getByText('35%')).toBeInTheDocument();
    expect(within(card).getByText('Cao')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Cao' })).toHaveValue('high');
    expect(within(card).getByText('teacher/vintern-project · Sẵn sàng')).toBeInTheDocument();
    expect(api.getTask).not.toHaveBeenCalled();
  });

  it("moves a card to its new column after starting work in its detail dialog", async () => {
    render(<InternWork />);
    fireEvent.click(screen.getByRole("button", { name: "Bảng Kanban" }));
    const todo = screen.getByRole("region", { name: "Cần làm" });
    fireEvent.click(
      await within(todo).findByRole("button", { name: /TASK-1/ }),
    );
    const dialog = screen.getByRole("dialog", { name: "Chi tiết nhiệm vụ" });
    fireEvent.click(
      await within(dialog).findByRole("button", {
        name: "Chuyển sang Đang làm",
      }),
    );
    await waitFor(() => expect(api.updateOwnTask).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(
        within(screen.getByRole("region", { name: "Đang làm" })).getByRole(
          "button",
          { name: /TASK-1/ },
        ),
      ).toBeInTheDocument(),
    );
    expect(
      within(screen.getByRole("region", { name: "Cần làm" })).queryByRole(
        "button",
        { name: /TASK-1/ },
      ),
    ).not.toBeInTheDocument();
  });
  it.each([
    ['provisioning', 'Đang tạo repository'],
    ['failed', 'Cần giảng viên xử lý'],
  ] as const)('keeps the %s repository state visible instead of declaring it ready', async (status, label) => {
    task = { ...task, repository: { status, fullName: 'teacher/vintern-project' } };
    render(<InternWork />);
    fireEvent.click(screen.getByRole('button', { name: 'Bảng Kanban' }));
    const card = await within(screen.getByRole('region', { name: 'Cần làm' })).findByRole('button', { name: /TASK-1/ });
    expect(within(card).getByText(`teacher/vintern-project · ${label}`)).toBeInTheDocument();
    expect(within(card).queryByText(/Sẵn sàng/)).toBeNull();
  });
});
