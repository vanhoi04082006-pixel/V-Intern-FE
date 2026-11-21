import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { EvaluationManagement } from "@/components/product/evaluation-management";
import * as api from "@/lib/api/management";
import { ApiError } from "@/lib/auth/api-client";

vi.mock("next/navigation", () => ({ usePathname: () => "/instructor/evaluations" }));
vi.mock("@/components/auth/can", () => ({ Can: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/lib/api/management", async (original) => ({
  ...(await original<typeof import("@/lib/api/management")>()),
  listCycles: vi.fn(), listManagedEvaluations: vi.fn(), getCriteria: vi.fn(),
  updateCriterion: vi.fn(), transitionCycle: vi.fn(),
}));
const cycle = { id: "cycle-qa", code: "QA", name: "Kỳ QA", status: "draft" as const, type: "sprint", projectId: "project-qa", sessionId: "session-qa", startDate: "2026-11-17T02:00:00Z", endDate: "2026-11-22T03:00:00Z" };
const criterion = { id: "criterion-qa", code: "quality", name: "Chất lượng", weight: 99, maxScore: 100, isRequired: true };
beforeEach(() => {
  vi.clearAllMocks();
  // jsdom lacks the native dialog methods; browser acceptance covers focus and the top layer.
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
  vi.mocked(api.listCycles).mockResolvedValue({ items: [cycle], total: 1, page: 1, pageSize: 10, totalPages: 1 });
  vi.mocked(api.listManagedEvaluations).mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 });
  vi.mocked(api.getCriteria).mockResolvedValue([criterion]);
  vi.mocked(api.transitionCycle).mockRejectedValue(new ApiError(409, "EVALUATION_WEIGHT_INVALID", "Internal detail"));
});

it("clears the stale opening rejection after successfully correcting criterion weights", async () => {
  vi.mocked(api.updateCriterion).mockImplementation(async () => {
    vi.mocked(api.getCriteria).mockResolvedValue([{ ...criterion, weight: 100 }]);
    return { ...criterion, weight: 100 };
  });
  render(<EvaluationManagement />);
  fireEvent.click(await screen.findByRole("button", { name: "Tiêu chí / trạng thái" }));
  const weight = await screen.findByRole("spinbutton", { name: "Trọng số quality" });
  fireEvent.click(screen.getByRole("button", { name: "Mở kỳ đánh giá" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Tổng trọng số tiêu chí phải bằng 100%");
  fireEvent.change(weight, { target: { value: "100" } });
  fireEvent.click(screen.getByRole("button", { name: "Lưu tiêu chí" }));
  await waitFor(() => expect(api.updateCriterion).toHaveBeenCalledWith(cycle.id, criterion.id, { name: criterion.name, weight: 100, maxScore: 100 }));
  await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  expect(await screen.findByRole("spinbutton", { name: "Trọng số quality" })).toHaveValue(100);
});
