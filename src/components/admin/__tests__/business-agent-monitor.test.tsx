import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BusinessAgentMonitor } from "../business-agent-monitor";
import type { BusinessRuns } from "@/lib/api/business-agents";
const data: BusinessRuns = {
  definitions: [
    {
      id: "learning-mentor",
      version: "1",
      promptVersion: "business-learning-mentor-v1",
      features: ["ai-mentor"],
      maxToolCalls: 2,
    },
  ],
  items: [
    {
      id: "real-sql-run-id",
      agentId: "learning-mentor",
      agentVersion: "1",
      promptVersion: "business-learning-mentor-v1",
      status: "succeeded",
      model: "gemini-result-model",
      stepCount: 4,
      attempts: 1,
      toolCalls: 1,
      inputTokens: 100,
      outputTokens: 40,
      errorCode: null,
      createdAt: "2026-10-24T10:00:00Z",
    },
  ],
  total: 1,
  page: 1,
  pageSize: 20,
};
describe("business Agent operations metadata", () => {
  it("renders actual model, run ID, version and usage; filters through the read-only API", async () => {
    const get = vi.fn().mockResolvedValue(data);
    render(<BusinessAgentMonitor get={get} />);
    expect(await screen.findByText("real-sql-run-id")).toBeVisible();
    expect(screen.getByText("gemini-result-model")).toBeVisible();
    expect(screen.getByText("Token vào/ra: 100 / 40")).toBeVisible();
    fireEvent.change(screen.getByLabelText("Lọc trạng thái Agent"), {
      target: { value: "failed" },
    });
    await waitFor(() =>
      expect(get).toHaveBeenLastCalledWith(
        1,
        "",
        "failed",
        expect.any(AbortSignal),
      ),
    );
  });
  it("shows an honest empty state and does not manufacture history", async () => {
    const get = vi.fn().mockResolvedValue({ ...data, items: [], total: 0 });
    render(<BusinessAgentMonitor get={get} />);
    expect(
      await screen.findByText(/Chưa có lượt chạy trong bộ lọc này/),
    ).toBeVisible();
    expect(screen.queryByText("real-sql-run-id")).not.toBeInTheDocument();
    expect(get).toHaveBeenCalledOnce();
  });
  it("recovers a metadata request failure through explicit retry", async () => {
    const get = vi
      .fn()
      .mockRejectedValueOnce(Error("Unavailable"))
      .mockResolvedValue(data);
    render(<BusinessAgentMonitor get={get} />);
    fireEvent.click(await screen.findByRole("button", { name: "Thử lại" }));
    expect(await screen.findByText("real-sql-run-id")).toBeVisible();
  });
});
