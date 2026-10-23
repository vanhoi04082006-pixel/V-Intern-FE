import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RateComparison, SessionProgressComparison, TaskDistribution } from "./workspace-charts";

describe("Workspace data visualizations", () => {
  it("labels score comparisons as points rather than percentages", () => {
    render(<RateComparison unit="điểm" label="Phỏng vấn" items={[{label:"Kiến thức",value:65}]} />);
    expect(screen.getByText("65 điểm")).toBeInTheDocument();
    expect(screen.queryByText("65%")).not.toBeInTheDocument();
  });
  it("explores a state with the keyboard and returns to the total without changing data", async () => {
    const user = userEvent.setup();
    render(<TaskDistribution items={[
      { label: "Cần làm", value: 3, tone: "neutral" },
      { label: "Đang làm", value: 1, tone: "primary" },
    ]} />);
    expect(screen.getByText(/4 nhiệm vụ trong phạm vi/)).toBeInTheDocument();
    await user.tab();
    expect(screen.getByRole("button", { name: "Cần làm 3 75%" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Cần làm 3 75%" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Cần làm: 3 / 4 nhiệm vụ. Chọn lại để xem tổng.")).toBeInTheDocument();
    await user.keyboard(" ");
    expect(screen.getByRole("button", { name: "Cần làm 3 75%" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText(/4 nhiệm vụ trong phạm vi/)).toBeInTheDocument();
  });

  it("handles an empty snapshot without non-finite SVG geometry", () => {
    const { container } = render(<TaskDistribution items={[{ label: "Cần làm", value: 0, tone: "neutral" }]} />);
    expect(screen.getByText("Chưa có nhiệm vụ trong phạm vi này.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cần làm 0 0%" })).toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
  });

  it("keeps unknown percentages distinct from a measured zero", () => {
    render(<RateComparison label="Hiệu suất" items={[
      { label: "Đúng hạn", value: null },
      { label: "Hoàn thành", value: 0 },
      { label: "Sprint", value: 75 },
    ]} />);
    expect(screen.getByText("Chưa đo được")).toBeInTheDocument();
    expect(screen.getAllByText("0%")).toHaveLength(2); // axis and the actual measured value
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("links each comparison to its real session and exposes the actual task counts", () => {
    render(<SessionProgressComparison items={[{ id: "session-one", name: "Phiên thực tập", done: 2, total: 5 }]} />);
    expect(screen.getByRole("link", { name: "Phiên thực tập" })).toHaveAttribute("href", "/instructor/sessions/session-one");
    expect(screen.getByText("2 / 5")).toBeInTheDocument();
  });
});
