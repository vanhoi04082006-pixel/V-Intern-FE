import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ScoreEditor } from "@/components/product/evaluation-management";
import { advanceEvaluation, saveEvaluation } from "@/lib/api/management";

vi.mock("next/navigation", () => ({
  usePathname: () => "/instructor/evaluations",
}));
vi.mock("@/components/auth/can", () => ({
  Can: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/lib/api/management", async (original) => ({
  ...(await original<typeof import("@/lib/api/management")>()),
  saveEvaluation: vi.fn(),
  advanceEvaluation: vi.fn(),
}));
const evaluation = {
  id: "evaluation-1",
  cycleId: "cycle-1",
  internId: "intern-1",
  evaluatorId: "teacher-1",
  status: "submitted" as const,
  overallScore: 80,
  summary: "Nhận xét đã lưu",
  revisionNumber: 1,
  scores: [{ criterionId: "criterion-1", score: 80, comment: "Đã kiểm tra" }],
};
const criteria = [
  {
    id: "criterion-1",
    code: "quality",
    name: "Chất lượng",
    weight: 100,
    maxScore: 100,
    isRequired: true,
  },
];
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(saveEvaluation).mockResolvedValue(evaluation);
  vi.mocked(advanceEvaluation).mockResolvedValue(evaluation);
});

it("requires saving edited scores before finalizing, then unlocks after persisted values return", async () => {
  const reload = vi.fn();
  const view = render(
    <ScoreEditor detail={{ evaluation, criteria }} reload={reload} />,
  );
  expect(screen.getByRole("button", { name: "Chốt đánh giá" })).toBeEnabled();
  fireEvent.change(
    screen.getByRole("spinbutton", { name: "Điểm Chất lượng" }),
    { target: { value: "90" } },
  );
  expect(screen.getByRole("button", { name: "Chốt đánh giá" })).toBeDisabled();
  expect(screen.getByText("Thay đổi chưa được lưu")).toBeInTheDocument();
  expect(advanceEvaluation).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Lưu điểm chính thức" }));
  await waitFor(() =>
    expect(saveEvaluation).toHaveBeenCalledWith(evaluation.id, {
      scores: [
        { criterionId: "criterion-1", score: 90, comment: "Đã kiểm tra" },
      ],
      summary: "Nhận xét đã lưu",
    }),
  );
  await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
  view.rerender(
    <ScoreEditor
      detail={{
        evaluation: {
          ...evaluation,
          scores: [{ ...evaluation.scores[0], score: 90 }],
        },
        criteria,
      }}
      reload={reload}
    />,
  );
  expect(screen.getByRole("button", { name: "Chốt đánh giá" })).toBeEnabled();
  fireEvent.click(screen.getByRole("button", { name: "Chốt đánh giá" }));
  await waitFor(() =>
    expect(advanceEvaluation).toHaveBeenCalledWith(evaluation.id, "finalize"),
  );
});

it("keeps a failed-save draft and prevents finalizing the older server values", async () => {
  vi.mocked(saveEvaluation).mockRejectedValue(new Error("Không lưu được"));
  render(<ScoreEditor detail={{ evaluation, criteria }} reload={vi.fn()} />);
  fireEvent.change(screen.getByRole("textbox", { name: "Tổng kết" }), {
    target: { value: "Nhận xét mới chưa lưu" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Lưu điểm chính thức" }));
  await screen.findByRole("alert");
  expect(screen.getByRole("textbox", { name: "Tổng kết" })).toHaveValue(
    "Nhận xét mới chưa lưu",
  );
  expect(screen.getByRole("button", { name: "Chốt đánh giá" })).toBeDisabled();
  expect(advanceEvaluation).not.toHaveBeenCalled();
});

it("keeps a finalized result read-only and makes the unavailable AI action explicit", () => {
  render(
    <ScoreEditor
      detail={{ evaluation: { ...evaluation, status: "finalized" }, criteria }}
      reload={vi.fn()}
    />,
  );
  expect(
    screen.getByRole("spinbutton", { name: "Điểm Chất lượng" }),
  ).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "Yêu cầu gợi ý AI" }),
  ).toBeDisabled();
  expect(
    screen.queryByRole("button", { name: "Chốt đánh giá" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByText(
      "Đánh giá đã chốt. Gợi ý AI mới không còn khả dụng cho kết quả này.",
    ),
  ).toBeInTheDocument();
});
