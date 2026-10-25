import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { InternWork } from "../intern-work";
import { SprintBoard } from "../intern-entry";
import type { Task } from "@/lib/api/work";

const api = vi.hoisted(() => ({
  listTasks: vi.fn(),
  getTask: vi.fn(),
  getComments: vi.fn(),
  getHistory: vi.fn(),
  updateOwnTask: vi.fn(),
  getOwnSprintBoard: vi.fn(),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => '/intern/sprint' }));
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
  it('opens the submission intent with clear conditions instead of bypassing code submission', async () => {
    task.status = 'doing';
    render(<InternWork />);
    fireEvent.click(screen.getByRole('button', { name: 'Bảng Kanban' }));
    await screen.findByText('Implement endpoint');
    fireEvent.drop(screen.getByTestId('drop-review'), { dataTransfer: { getData: () => 'task-1:doing' } });
    const dialog = await screen.findByRole('dialog', { name: 'Nộp bài để chuyển sang Chờ duyệt' });
    // The dialog opens before its task request resolves; verify the loaded content.
    expect(await within(dialog).findByText(/Kéo thả chỉ mở nhiệm vụ/)).toBeInTheDocument();
    expect(api.updateOwnTask).not.toHaveBeenCalled();
  });

  it('keeps the card in place and reports a failed save', async () => {
    api.updateOwnTask.mockRejectedValueOnce(new Error('Không thể cập nhật'));
    render(<InternWork />);
    fireEvent.click(screen.getByRole('button', { name: 'Bảng Kanban' }));
    await screen.findByText('Implement endpoint');
    fireEvent.drop(screen.getByTestId('drop-doing'), { dataTransfer: { getData: () => 'task-1:todo' } });
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Cần làm' })).getByText('Implement endpoint')).toBeInTheDocument();
  });

  it('also enables dragging and refreshes the student Sprint Board after saving', async () => {
    api.getOwnSprintBoard.mockImplementation(async () => ({ sprint: { id: 'sprint-1', name: 'Sprint', status: 'active', startDate: '2026-10-19', endDate: '2026-10-30' }, total: 1,
      columns: (['todo', 'doing', 'review', 'done'] as const).map(status => ({ status, count: task.status === status ? 1 : 0, tasks: task.status === status ? [{ ...task }] : [] })) }));
    render(<SprintBoard id="sprint-1" own />);
    expect((await screen.findByText('TASK-1')).closest('article')).toHaveAttribute('draggable', 'true');
    fireEvent.drop(screen.getByTestId('drop-doing'), { dataTransfer: { getData: () => 'task-1:todo' } });
    await waitFor(() => expect(within(screen.getByTestId('drop-doing')).getByText('TASK-1')).toBeInTheDocument());
    expect(api.getOwnSprintBoard).toHaveBeenCalledTimes(2);
  });
  it('drags a task into an empty column and saves its current version', async () => {
    render(<InternWork />);
    fireEvent.click(screen.getByRole('button', { name: 'Bảng Kanban' }));
    const card = await within(screen.getByRole('region', { name: 'Cần làm' })).findByRole('button', { name: /TASK-1/ });
    expect(card).toHaveAttribute('draggable', 'true');
    const values = new Map<string, string>();
    const transfer = { setData: (k: string, v: string) => values.set(k, v), getData: (k: string) => values.get(k) ?? '', effectAllowed: '', dropEffect: '' };
    fireEvent.dragStart(card, { dataTransfer: transfer });
    // Browsers protect the data store until drop: getData is empty during dragover.
    const target = screen.getByTestId('drop-doing');
    expect(fireEvent.dragOver(target, { dataTransfer: { ...transfer, getData: () => '' } })).toBe(false);
    fireEvent.drop(target, { dataTransfer: transfer });
    await waitFor(() => expect(api.updateOwnTask).toHaveBeenCalledWith('task-1', { status: 'doing', expectedVersion: 1 }));
    expect(await within(screen.getByRole('region', { name: 'Đang làm' })).findByRole('button', { name: /TASK-1/ })).toBeInTheDocument();
  });

  it('rejects a drop straight to done', async () => {
    render(<InternWork />);
    fireEvent.click(screen.getByRole('button', { name: 'Bảng Kanban' }));
    await screen.findByText('Implement endpoint');
    fireEvent.drop(screen.getByTestId('drop-done'), { dataTransfer: { getData: () => 'task-1:todo' } });
    expect(api.updateOwnTask).not.toHaveBeenCalled();
  });
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
