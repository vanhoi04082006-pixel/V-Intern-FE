import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ScoreEditor } from "@/components/product/evaluation-management";
import { reviseEvaluation, listEvaluationSuggestions } from "@/lib/api/management";
import { getSessionUser } from "@/lib/auth/session";

/* Master prompt V6 (Phase E — P1): BE có POST /evaluations/:id/revisions
 * (spec 14 — hiệu chỉnh chính thức trên đánh giá đã chốt, admin policy) nhưng
 * FE trước đó KHÔNG có UI. Regression: admin thấy đúng luồng hiệu chỉnh;
 * người không phải admin không thấy; payload gửi đúng contract
 * {scores, summary, reason}. */

vi.mock("next/navigation", () => ({ usePathname: () => "/instructor/evaluations" }));
vi.mock("@/components/auth/can", () => ({ Can: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/lib/auth/session", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/api/management", async (original) => ({
  ...(await original<typeof import("@/lib/api/management")>()),
  saveEvaluation: vi.fn(),
  advanceEvaluation: vi.fn(),
  reviseEvaluation: vi.fn(),
  listEvaluationSuggestions: vi.fn().mockResolvedValue([]),
  suggestEvaluation: vi.fn(),
}));

const evaluation = {
  id: "evaluation-1",
  cycleId: "cycle-1",
  internId: "intern-1",
  evaluatorId: "teacher-1",
  status: "finalized" as const,
  overallScore: 80,
  summary: "Nhận xét đã chốt",
  revisionNumber: 0,
  scores: [{ criterionId: "criterion-1", score: 80, comment: "Đã kiểm tra" }],
};
const criteria = [
  { id: "criterion-1", code: "quality", name: "Chất lượng", weight: 100, maxScore: 100, isRequired: true },
];
const admin = {
  id: "admin-1",
  email: "admin@test",
  displayName: "Admin",
  roles: ["admin"],
  permissions: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listEvaluationSuggestions).mockReset().mockResolvedValue([]);
  /* jsdom không có showModal()/close() — polyfill theo pattern
   * nested-modal.test / confirm-dialog.test. */
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});

describe("evaluation revision (spec 14 — admin-only correction of finalized scores)", () => {
  it("keeps the correction affordance hidden from non-admin viewers", () => {
    vi.mocked(getSessionUser).mockReturnValue(null);
    render(<ScoreEditor detail={{ evaluation, criteria }} reload={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Hiệu chỉnh điểm đã chốt" })).not.toBeInTheDocument();
    expect(screen.getByText(/Đánh giá đã khóa/i)).toBeInTheDocument();
    expect(vi.mocked(reviseEvaluation)).not.toHaveBeenCalled();
  });

  it("lets an admin open the revision dialog and submit a reasoned correction", async () => {
    vi.mocked(getSessionUser).mockReturnValue(admin);
    vi.mocked(reviseEvaluation).mockResolvedValue({
      evaluation: { ...evaluation, overallScore: 85, revisionNumber: 1 },
      revision: { revisionNumber: 1, previousOverallScore: 80, newOverallScore: 85, reason: "Sai số tiêu chí chất lượng" },
    });
    const reload = vi.fn();
    render(<ScoreEditor detail={{ evaluation, criteria }} reload={reload} />);

    fireEvent.click(screen.getByRole("button", { name: "Hiệu chỉnh điểm đã chốt" }));
    const dialog = await screen.findByRole("dialog");
    expect(screen.getByText(/Quyền quản trị · spec 14/i)).toBeInTheDocument();

    // Lý do bắt buộc — nút lưu khóa cho tới khi có lý do.
    const save = screen.getByRole("button", { name: "Lưu điều chỉnh" });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Lý do hiệu chỉnh/i), { target: { value: "Sai số tiêu chí chất lượng" } });
    fireEvent.change(screen.getByLabelText(/Điểm điều chỉnh Chất lượng/i), { target: { value: "85" } });

    fireEvent.click(save);
    await waitFor(() => expect(vi.mocked(reviseEvaluation)).toHaveBeenCalledOnce());
    expect(vi.mocked(reviseEvaluation).mock.calls[0][0]).toBe("evaluation-1");
    expect(vi.mocked(reviseEvaluation).mock.calls[0][1]).toMatchObject({
      summary: "Nhận xét đã chốt",
      reason: "Sai số tiêu chí chất lượng",
      scores: [{ criterionId: "criterion-1", score: 85, comment: "Đã kiểm tra" }],
    });
    expect(await screen.findByText("Điều chỉnh #1")).toBeInTheDocument();
    expect(screen.getByText(/80 →/i)).toBeInTheDocument();
    expect(screen.getByText("85")).toBeInTheDocument();
    expect(reload).toHaveBeenCalled();
    expect(dialog).toBeInTheDocument();
  });

  it("surfaces the server rejection instead of closing silently", async () => {
    vi.mocked(getSessionUser).mockReturnValue(admin);
    vi.mocked(reviseEvaluation).mockRejectedValueOnce(
      Object.assign(new Error("Yêu cầu bị từ chối"), { statusCode: 403 }),
    );
    render(<ScoreEditor detail={{ evaluation, criteria }} reload={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Hiệu chỉnh điểm đã chốt" }));
    fireEvent.change(await screen.findByLabelText(/Lý do hiệu chỉnh/i), { target: { value: "thử lỗi" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu điều chỉnh" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("Điều chỉnh #1")).not.toBeInTheDocument();
  });
});
