import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SprintForm, TaskForm } from "../sprint-management";
import { AcademicDetail } from "../academic";

vi.mock("@/lib/api/management", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/api/management")>();
  return { ...mod, saveSprint: vi.fn(), saveManagedTask: vi.fn() };
});
vi.mock("@/lib/api/academic", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/api/academic")>();
  return {
    ...mod,
    getAcademic: vi.fn(async () => ({
      id: "project-9", code: "PJ-9", name: "Dự án chín", status: "active",
      description: "Mô tả", startDate: null, endDate: null, leadInstructorId: null,
      mentorId: null, sessionId: null, domainCategory: null, difficulty: null,
      capacity: null, technologies: [], meetingSchedule: null, meetingLocation: null, progress: 0,
    })),
    listAcademic: vi.fn(async () => ({ items: [], total: 0, page: 1, pageSize: 6, totalPages: 0 })),
    getMembers: vi.fn(async () => []),
    listCandidates: vi.fn(async () => ({ items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 })),
  };
});
vi.mock("../project-changes", () => ({ ProjectChanges: () => null }));

import { saveSprint, saveManagedTask } from "@/lib/api/management";

beforeEach(() => {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    };
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
      this.removeAttribute("open");
    };
  }
});

describe("context inheritance", () => {
  it("SprintForm hides the project picker and keeps the fixed project", async () => {
    const save = vi.mocked(saveSprint);
    save.mockResolvedValue({
      id: "s1", code: "SP-1", name: "Sprint", status: "planned",
      projectId: "project-9", sessionId: null, startDate: "2026-11-01T00:00:00.000Z",
      endDate: "2026-11-30T00:00:00.000Z", description: null, goal: null,
    });
    const onSaved = vi.fn();
    render(<SprintForm fixedProjectId="project-9" fixedProjectName="Dự án chín" onSaved={onSaved} />);
    expect(screen.queryByLabelText("Dự án", { exact: true })).toBeNull();
    expect(screen.getByText(/dự án chín/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/mã sprint/i), { target: { value: "SP-9" } });
    fireEvent.change(screen.getByLabelText(/tên sprint/i), { target: { value: "Sprint chín" } });
    fireEvent.change(screen.getByLabelText(/bắt đầu \(utc\)/i), { target: { value: "2026-11-01T00:00" } });
    fireEvent.change(screen.getByLabelText(/kết thúc \(utc\)/i), { target: { value: "2026-11-30T00:00" } });
    fireEvent.click(screen.getByRole("button", { name: /lưu sprint/i }));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(save).toHaveBeenCalledWith(undefined, expect.objectContaining({ projectId: "project-9", code: "SP-9" }));
    expect(onSaved).toHaveBeenCalled();
  });
  it("SprintForm still asks for project without fixed context", async () => {
    render(<SprintForm onSaved={vi.fn()} />);
    expect(screen.getByRole("combobox", { name: "Dự án" })).toBeInTheDocument();
  });
  it("TaskForm hides pickers when project and sprint are fixed", async () => {
    const save = vi.mocked(saveManagedTask);
    save.mockResolvedValue({ id: "t1" } as never);
    render(<TaskForm projectId="project-9" sprintId="sprint-9" onSaved={vi.fn()} />);
    expect(screen.queryByLabelText(/dự án nhiệm vụ/i)).toBeNull();
    expect(await screen.findByLabelText(/người thực hiện/i)).toBeInTheDocument();
    const title = screen.getByLabelText(/tên nhiệm vụ/i) as HTMLInputElement;
    fireEvent.change(title, { target: { value: "Task chín" } });
    fireEvent.click(screen.getByRole("button", { name: /lưu nhiệm vụ/i }));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(save).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({ projectId: "project-9", sprintId: "sprint-9", title: "Task chín" }),
    );
  });
  it("project detail opens sprint creation with inherited context", async () => {
    render(<AcademicDetail kind="projects" id="project-9" onClose={vi.fn()} onChanged={vi.fn()} />);
    expect(await screen.findByText("Dự án chín")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /tạo sprint/i }));
    expect(await screen.findByText(/đã kế thừa, không cần chọn lại/i)).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Dự án" })).toBeNull();
  });
});
