import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { DeliveryOverview } from "../delivery-overview";
import { listMemberOptions, listSprints, listTasks } from "@/lib/api/delivery";
import { clearSession, setSession } from "@/lib/auth/session";
import { saveSprint, parseSprint } from "@/lib/api/management";

vi.mock("@/lib/api/management", async original => ({ ...await original<typeof import("@/lib/api/management")>(), saveSprint: vi.fn() }));
beforeAll(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value() { this.setAttribute("open", ""); } },
    close: { configurable: true, value() { this.removeAttribute("open"); } },
  });
});
afterEach(clearSession);

vi.mock("@/components/product/academic-picker", () => ({ AcademicPicker: ({ label }: { label: string }) => <span>{label}</span> }));
vi.mock("@/lib/api/delivery", () => ({
  taskStatuses: ["todo", "doing", "review", "done"],
  listSprints: vi.fn(), listTasks: vi.fn(), listMemberOptions: vi.fn(),
}));
const page = { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
beforeEach(() => { vi.clearAllMocks(); vi.mocked(listSprints).mockResolvedValue(page); vi.mocked(listTasks).mockResolvedValue(page); vi.mocked(listMemberOptions).mockResolvedValue({ ...page, items: [{ userId: "u1", displayName: "Intern One", email: "one@test.local" }] }); });
it("keeps session context and sends task status, assignee and inclusive deadline filters to the server", async () => {
  render(<DeliveryOverview initialProjectId="p1" initialSessionId="s1" />);
  await waitFor(() => expect(listSprints).toHaveBeenCalledWith(expect.objectContaining({ projectId: "p1", sessionId: "s1" }), expect.any(AbortSignal)));
  fireEvent.click(screen.getByRole("button", { name: "Task" }));
  fireEvent.click(screen.getByText("Bộ lọc nâng cao"));
  await screen.findByRole("option", { name: /Intern One/ });
  fireEvent.change(screen.getByLabelText("Người phụ trách"), { target: { value: "u1" } });
  fireEvent.change(screen.getByLabelText("Trạng thái"), { target: { value: "review" } });
  fireEvent.change(screen.getByLabelText("Hạn đến"), { target: { value: "2026-12-31" } });
  await waitFor(() => expect(listTasks).toHaveBeenLastCalledWith(expect.objectContaining({ projectId: "p1", sessionId: "s1", assigneeId: "u1", status: "review", dueTo: "2026-12-31T23:59:59.999Z", pageSize: 20 }), expect.any(AbortSignal)));
  fireEvent.click(screen.getByRole('button', { name: 'Sprint' }));
  await waitFor(() => expect(listSprints).toHaveBeenLastCalledWith(expect.objectContaining({ assigneeId: 'u1', status: '', dueTo: '2026-12-31T23:59:59.999Z' }), expect.any(AbortSignal)));
});
it("lets a Sprint manager create a Sprint in the selected project/session and refreshes the list", async () => {
  setSession("test-token", { id: "teacher", displayName: "Teacher", email: "teacher@test.local", roles: ["instructor"], permissions: ["sprints.manage"] });
  vi.mocked(saveSprint).mockResolvedValue(parseSprint({ id: "sp-new", code: "SP-QA", name: "Sprint QA", status: "planned", projectId: "p1", sessionId: "s1", startDate: "2026-11-20T01:00:00Z", endDate: "2026-11-22T01:00:00Z", description: "", goal: "" }));
  render(<DeliveryOverview initialProjectId="p1" initialSessionId="s1" />);
  await waitFor(() => expect(listSprints).toHaveBeenCalledOnce());
  fireEvent.click(screen.getByRole("button", { name: "Tạo Sprint" }));
  const form = within(screen.getByRole("dialog", { name: "Tạo Sprint" }));
  fireEvent.change(form.getByLabelText("Mã Sprint"), { target: { value: "SP-QA" } });
  fireEvent.change(form.getByLabelText("Tên Sprint"), { target: { value: "Sprint QA" } });
  fireEvent.change(form.getByLabelText("Bắt đầu (UTC)"), { target: { value: "2026-11-20T01:00" } });
  fireEvent.change(form.getByLabelText("Kết thúc (UTC)"), { target: { value: "2026-11-22T01:00" } });
  fireEvent.click(form.getByRole("button", { name: "Lưu Sprint" }));
  await waitFor(() => expect(saveSprint).toHaveBeenCalledWith(undefined, expect.objectContaining({ code: "SP-QA", name: "Sprint QA", projectId: "p1", sessionId: "s1", startDate: "2026-11-20T01:00:00.000Z", endDate: "2026-11-22T01:00:00.000Z" })));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(listSprints).toHaveBeenCalledTimes(2);
});
it("hides Sprint creation from viewers without management permission", async () => {
  setSession("test-token", { id: "viewer", displayName: "Viewer", email: "viewer@test.local", roles: [], permissions: ["sprints.view"] });
  render(<DeliveryOverview />);
  await waitFor(() => expect(listSprints).toHaveBeenCalledOnce());
  expect(screen.queryByRole("button", { name: "Tạo Sprint" })).not.toBeInTheDocument();
});
it("offers Sprint creation in the Sprint tab while keeping the Task tab focused on tasks", async () => {
  setSession("test-token", { id: "teacher", displayName: "Teacher", email: "teacher@test.local", roles: ["instructor"], permissions: ["sprints.manage"] });
  render(<DeliveryOverview />);
  expect(await screen.findByRole("button", { name: "Tạo Sprint" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Task" }));
  expect(screen.queryByRole("button", { name: "Tạo Sprint" })).not.toBeInTheDocument();
});
