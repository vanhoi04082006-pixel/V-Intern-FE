import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { Evaluations } from "@/components/product/outcomes";
import { getEvaluation } from "@/lib/api/outcomes";

vi.mock("next/navigation", () => ({ usePathname: () => "/intern/evaluations/evaluation-qa" }));
vi.mock("@/lib/api/outcomes", async (original) => ({
  ...(await original<typeof import("@/lib/api/outcomes")>()), getEvaluation: vi.fn(),
}));
const evaluation = { id: "evaluation-qa", cycleId: "cycle-qa", status: "finalized" as const, overallScore: 80, summary: "Nhận xét QA đã chốt", finalizedAt: "2026-11-17T02:00:00Z", revisionNumber: 0,
  scores: [{ id: "score-qa", criterionId: "criterion-qa", criterionName: "Chất lượng kỹ thuật", weight: 40, maxScore: 10, score: 8, comment: "Đã đối chiếu bằng chứng" }] };

it("explains the criterion name, weight and score scale in finalized student results", async () => {
  vi.mocked(getEvaluation).mockResolvedValue(evaluation);
  render(<Evaluations id={evaluation.id} />);
  expect(await screen.findByText("Chất lượng kỹ thuật")).toBeInTheDocument();
  expect(screen.getByText("Trọng số 40%")).toBeInTheDocument();
  expect(screen.getByText("8 / 10")).toBeInTheDocument();
  expect(screen.getByText("Đã đối chiếu bằng chứng")).toBeInTheDocument();
});

it("keeps older responses without criterion metadata readable", async () => {
  vi.mocked(getEvaluation).mockResolvedValue({ ...evaluation, scores: [{ ...evaluation.scores[0], criterionName: null, weight: null, maxScore: null }] });
  render(<Evaluations id={evaluation.id} />);
  expect(await screen.findByText("Tiêu chí 1")).toBeInTheDocument();
  expect(screen.getByText("8")).toBeInTheDocument();
  expect(screen.queryByText(/Trọng số/)).not.toBeInTheDocument();
});
