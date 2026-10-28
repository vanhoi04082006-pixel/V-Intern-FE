import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { DeliveryOverview } from "../delivery-overview";
import { listMemberOptions, listSprints, listTasks } from "@/lib/api/delivery";

vi.mock("@/components/product/academic-picker", () => ({ AcademicPicker: ({ label }: { label: string }) => <span>{label}</span> }));
vi.mock("@/lib/api/delivery", () => ({
  taskStatuses: ["todo", "doing", "review", "done"],
  listSprints: vi.fn(), listTasks: vi.fn(), listMemberOptions: vi.fn(),
}));
const page = { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
beforeEach(() => { vi.mocked(listSprints).mockResolvedValue(page); vi.mocked(listTasks).mockResolvedValue(page); vi.mocked(listMemberOptions).mockResolvedValue({ ...page, items: [{ userId: "u1", displayName: "Intern One", email: "one@test.local" }] }); });
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
