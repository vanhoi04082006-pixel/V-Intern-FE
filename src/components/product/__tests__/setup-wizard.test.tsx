import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SetupWizard } from "../setup-wizard";

vi.mock("@/lib/api/academic", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/api/academic")>();
  return {
    ...mod,
    saveAcademic: vi.fn(),
    getAcademic: vi.fn(),
    assignIntern: vi.fn(),
    listAcademic: vi.fn(),
    listCandidates: vi.fn(),
  };
});
vi.mock("@/lib/api/management", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/api/management")>();
  return { ...mod, saveSprint: vi.fn(), transitionSprint: vi.fn(), saveManagedTask: vi.fn() };
});
vi.mock("@/lib/api/instructor-setup", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/api/instructor-setup")>();
  return { ...mod, activateAcademic: vi.fn() };
});

import { saveAcademic, assignIntern, listCandidates } from "@/lib/api/academic";
import { saveSprint, transitionSprint, saveManagedTask } from "@/lib/api/management";
import { activateAcademic } from "@/lib/api/instructor-setup";

const saveAcademicMock = vi.mocked(saveAcademic);
const assignInternMock = vi.mocked(assignIntern);
const listCandidatesMock = vi.mocked(listCandidates);
const saveSprintMock = vi.mocked(saveSprint);
const transitionSprintMock = vi.mocked(transitionSprint);
const saveManagedTaskMock = vi.mocked(saveManagedTask);
const activateAcademicMock = vi.mocked(activateAcademic);

const candidate = { userId: "intern-1", displayName: "Sinh Viên Một", email: "sv1@x.edu", status: "passed" };

beforeEach(() => {
  vi.clearAllMocks();
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
  listCandidatesMock.mockResolvedValue({ items: [candidate], total: 1, page: 1, pageSize: 20, totalPages: 1 });
  saveAcademicMock.mockImplementation(async (_kind, id, form: Record<string, string>) => ({
    id: (id as string) ?? "new-id",
    code: form.code ?? "CODE",
    name: form.name ?? "Tên",
    status: form.status ?? "draft",
    description: null,
    startDate: null,
    endDate: null,
    leadInstructorId: null,
    mentorId: null,
    sessionId: null,
    domainCategory: null,
    difficulty: null,
    capacity: null,
    technologies: [],
    meetingSchedule: null,
    meetingLocation: null,
    progress: 0,
  }));
  saveSprintMock.mockImplementation(async (_id, body) => ({
    id: "sprint-1",
    code: "SP-1",
    name: body.name,
    status: "planned",
    projectId: "project-1",
    sessionId: null,
    startDate: body.startDate,
    endDate: body.endDate,
    description: null,
    goal: null,
  }));
  activateAcademicMock.mockResolvedValue({ status: "active" });
  transitionSprintMock.mockResolvedValue({ status: "active" } as Awaited<ReturnType<typeof transitionSprint>>);
  saveManagedTaskMock.mockResolvedValue({ id: "task-1", title: "Task" } as Awaited<ReturnType<typeof saveManagedTask>>);
});

async function fillSession() {
  fireEvent.change(screen.getByLabelText(/mã phiên/i), { target: { value: "SS-WZ-01" } });
  fireEvent.change(screen.getByLabelText(/tên phiên/i), { target: { value: "Phiên wizard" } });
  fireEvent.change(screen.getByLabelText(/bắt đầu/i), { target: { value: "2026-11-01T00:00" } });
  fireEvent.change(screen.getByLabelText(/kết thúc/i), { target: { value: "2026-12-31T00:00" } });
  fireEvent.click(screen.getByRole("button", { name: /tiếp tục/i }));
  await waitFor(() => expect(saveAcademicMock).toHaveBeenCalledTimes(1));
}

describe("SetupWizard", () => {
  it("walks four steps and keeps session context without re-asking", async () => {
    render(<SetupWizard onClose={vi.fn()} onFinished={vi.fn()} />);
    expect(screen.getByRole("heading", { name: /khởi tạo đợt thực tập/i })).toBeInTheDocument();
    await fillSession();
    expect(await screen.findByText("Bước 2 / 4")).toBeInTheDocument();
    expect(screen.queryByLabelText(/phiên thực tập/i)).toBeNull();
  });
  it("creates a project and activates it when checked", async () => {
    render(<SetupWizard onClose={vi.fn()} onFinished={vi.fn()} />);
    await fillSession();
    fireEvent.change(screen.getByLabelText(/mã dự án|mã project/i), { target: { value: "PJ-WZ-01" } });
    fireEvent.change(screen.getByLabelText(/tên dự án|tên project/i), { target: { value: "Dự án wizard" } });
    fireEvent.change(screen.getByLabelText(/mô tả/i), { target: { value: "Mô tả dự án wizard đủ dài." } });
    expect(screen.getByLabelText(/kích hoạt dự án ngay/i)).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: /tiếp tục/i }));
    await waitFor(() => expect(saveAcademicMock).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(activateAcademicMock).toHaveBeenCalledWith("projects", "new-id"));
  });
  it("skips activation when unchecked", async () => {
    render(<SetupWizard onClose={vi.fn()} onFinished={vi.fn()} />);
    await fillSession();
    fireEvent.change(screen.getByLabelText(/mã dự án|mã project/i), { target: { value: "PJ-WZ-02" } });
    fireEvent.change(screen.getByLabelText(/tên dự án|tên project/i), { target: { value: "Dự án wizard 2" } });
    fireEvent.change(screen.getByLabelText(/mô tả/i), { target: { value: "Mô tả dự án wizard 2." } });
    fireEvent.click(screen.getByLabelText(/kích hoạt dự án ngay/i));
    fireEvent.click(screen.getByRole("button", { name: /tiếp tục/i }));
    await waitFor(() => expect(saveAcademicMock).toHaveBeenCalledTimes(2));
    expect(activateAcademicMock).not.toHaveBeenCalled();
    expect(await screen.findByText("Bước 3 / 4")).toBeInTheDocument();
  });
  it("recovers a failed activation without duplicates", async () => {
    activateAcademicMock.mockRejectedValueOnce(new Error("PROJECT_CAPACITY_FULL"));
    render(<SetupWizard onClose={vi.fn()} onFinished={vi.fn()} />);
    await fillSession();
    fireEvent.change(screen.getByLabelText(/mã dự án|mã project/i), { target: { value: "PJ-WZ-02" } });
    fireEvent.change(screen.getByLabelText(/tên dự án|tên project/i), { target: { value: "Dự án wizard 2" } });
    fireEvent.change(screen.getByLabelText(/mô tả/i), { target: { value: "Mô tả dự án wizard 2." } });
    fireEvent.click(screen.getByRole("button", { name: /tiếp tục/i }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(saveAcademicMock).toHaveBeenCalledTimes(2);
    activateAcademicMock.mockResolvedValueOnce({ status: "active" });
    fireEvent.click(screen.getByRole("button", { name: /thử lại kích hoạt/i }));
    await waitFor(() => expect(activateAcademicMock).toHaveBeenCalledTimes(2));
    expect(saveAcademicMock).toHaveBeenCalledTimes(2);
    expect(await screen.findByText("Bước 3 / 4")).toBeInTheDocument();
  });
  it("assigns selected interns and reports partial failures honestly", async () => {
    assignInternMock.mockRejectedValueOnce(Object.assign(new Error("conflict"), { code: "ASSIGNMENT_CONFLICT" }));
    assignInternMock.mockResolvedValueOnce("assign-1");
    render(<SetupWizard onClose={vi.fn()} onFinished={vi.fn()} />);
    await fillSession();
    fireEvent.change(screen.getByLabelText(/mã dự án|mã project/i), { target: { value: "PJ-WZ-03" } });
    fireEvent.change(screen.getByLabelText(/tên dự án|tên project/i), { target: { value: "Dự án wizard 3" } });
    fireEvent.change(screen.getByLabelText(/mô tả/i), { target: { value: "Mô tả dự án wizard 3." } });
    fireEvent.click(screen.getByLabelText(/kích hoạt dự án ngay/i));
    fireEvent.click(screen.getByRole("button", { name: /tiếp tục/i }));
    expect(await screen.findByText("Bước 3 / 4")).toBeInTheDocument();
    expect(await screen.findByText("Sinh Viên Một")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: /sinh viên một/i }));
    fireEvent.click(screen.getByRole("button", { name: /phân công 1 sinh viên|tiếp tục/i }));
    await waitFor(() => expect(assignInternMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Bước 4 / 4")).toBeInTheDocument();
  });
  it("creates and activates the sprint, allows finishing without the optional task", async () => {
    const onFinished = vi.fn();
    render(<SetupWizard onClose={vi.fn()} onFinished={onFinished} />);
    await fillSession();
    fireEvent.change(screen.getByLabelText(/mã dự án|mã project/i), { target: { value: "PJ-WZ-04" } });
    fireEvent.change(screen.getByLabelText(/tên dự án|tên project/i), { target: { value: "Dự án wizard 4" } });
    fireEvent.change(screen.getByLabelText(/mô tả/i), { target: { value: "Mô tả dự án wizard 4." } });
    fireEvent.click(screen.getByLabelText(/kích hoạt dự án ngay/i));
    fireEvent.click(screen.getByRole("button", { name: /tiếp tục/i }));
    expect(await screen.findByText("Bước 3 / 4")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /bỏ qua/i }));
    expect(await screen.findByText("Bước 4 / 4")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/mã sprint/i), { target: { value: "SP-WZ-01" } });
    fireEvent.change(screen.getByLabelText(/tên sprint/i), { target: { value: "Sprint wizard" } });
    fireEvent.change(screen.getByLabelText(/bắt đầu \(utc\)/i), { target: { value: "2026-11-01T00:00" } });
    fireEvent.change(screen.getByLabelText(/kết thúc \(utc\)/i), { target: { value: "2026-11-30T00:00" } });
    fireEvent.click(screen.getByRole("button", { name: /tạo sprint/i }));
    await waitFor(() => expect(saveSprintMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(transitionSprintMock).toHaveBeenCalledWith("sprint-1", "active"));
    fireEvent.click(screen.getByRole("button", { name: /hoàn tất/i }));
    await waitFor(() => expect(screen.getByText(/tóm tắt đợt thực tập/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("link", { name: /vào không gian làm việc/i }));
    expect(onFinished).toHaveBeenCalled();
  });
  it("prevents duplicate creates on rapid double click", async () => {
    render(<SetupWizard onClose={vi.fn()} onFinished={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/mã phiên/i), { target: { value: "SS-WZ-09" } });
    fireEvent.change(screen.getByLabelText(/tên phiên/i), { target: { value: "Phiên wizard 9" } });
    fireEvent.change(screen.getByLabelText(/bắt đầu/i), { target: { value: "2026-11-01T00:00" } });
    fireEvent.change(screen.getByLabelText(/kết thúc/i), { target: { value: "2026-12-31T00:00" } });
    const next = screen.getByRole("button", { name: /tiếp tục/i });
    fireEvent.click(next);
    fireEvent.click(next);
    await waitFor(() => expect(saveAcademicMock).toHaveBeenCalledTimes(1));
  });
  it("asks for confirmation before abandoning a dirty wizard", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const onClose = vi.fn();
    render(<SetupWizard onClose={onClose} onFinished={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/mã phiên/i), { target: { value: "SS-WZ-10" } });
    fireEvent.click(screen.getByRole("button", { name: "Đóng wizard" }));
    expect(confirm).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    confirm.mockRestore();
  });
});
