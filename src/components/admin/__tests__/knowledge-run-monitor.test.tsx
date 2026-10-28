import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { KnowledgeRunMonitor } from "../knowledge-run-monitor";
import type { KnowledgeRun } from "@/lib/api/knowledge-runs";

const run = (overrides: Partial<KnowledgeRun> = {}): KnowledgeRun => ({
  id: "run-1",
  requestId: "req-1",
  agentId: "knowledge-assistant",
  agentVersion: "1",
  status: "succeeded",
  steps: 3,
  attempts: 1,
  inputTokens: 120,
  outputTokens: 55,
  errorCode: null,
  retryable: false,
  output: {
    answer: "Paracetamol.",
    insufficientEvidence: false,
    citations: [{ source: "handbook" }],
  },
  createdAt: "2026-10-28T09:00:00Z",
  updatedAt: "2026-10-28T09:01:00Z",
  deadlineAt: "2026-10-28T09:10:00Z",
  ...overrides,
});

describe("KnowledgeRunMonitor", () => {
  it("creates a run from the form and shows the live status", async () => {
    const create = vi.fn().mockResolvedValue(run({ status: "queued", output: null }));
    render(<KnowledgeRunMonitor create={create} />);
    fireEvent.change(screen.getByLabelText("Câu hỏi"), {
      target: { value: "Liều thuốc nào cho cơn đau đầu?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Chạy truy vấn" }));
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        "Liều thuốc nào cho cơn đau đầu?",
        undefined,
      ),
    );
    expect(await screen.findByText("Đang chờ")).toBeTruthy();
  });

  it("sends the optional role code when filled", async () => {
    const create = vi.fn().mockResolvedValue(run({ status: "running" }));
    render(<KnowledgeRunMonitor create={create} />);
    fireEvent.change(screen.getByLabelText("Câu hỏi"), {
      target: { value: "Câu hỏi về vai trò" },
    });
    fireEvent.change(screen.getByLabelText("Mã vai trò (tùy chọn)"), {
      target: { value: "nurse" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Chạy truy vấn" }));
    await waitFor(() => expect(create).toHaveBeenCalledWith("Câu hỏi về vai trò", "nurse"));
  });

  it("offers cancel for an in-flight run and applies the returned state", async () => {
    const cancel = vi.fn().mockResolvedValue(run({ status: "cancelled" }));
    render(
      <KnowledgeRunMonitor
        cancel={cancel}
        initialRun={run({ status: "running", output: null })}
      />,
    );
    const button = await screen.findByRole("button", { name: "Hủy lượt chạy" });
    fireEvent.click(button);
    await waitFor(() => expect(cancel).toHaveBeenCalledWith("run-1"));
    expect(await screen.findByText("Đã hủy")).toBeTruthy();
  });

  it("offers resume only for a retryable failed run", async () => {
    const resume = vi.fn().mockResolvedValue({ id: "run-1", accepted: true });
    const get = vi.fn().mockResolvedValue(run({ status: "queued" }));
    render(
      <KnowledgeRunMonitor
        get={get}
        resume={resume}
        initialRun={run({
          status: "failed",
          retryable: true,
          attempts: 1,
          errorCode: "AI_PROVIDER_5XX",
          output: null,
        })}
      />,
    );
    const button = await screen.findByRole("button", { name: "Chạy lại" });
    fireEvent.click(button);
    await waitFor(() => expect(resume).toHaveBeenCalledWith("run-1"));
  });

  it("shows the error code without a resume action when the failure is terminal", () => {
    render(
      <KnowledgeRunMonitor
        initialRun={run({
          status: "failed",
          retryable: false,
          errorCode: "AGENT_RUN_EXPIRED",
          output: null,
        })}
      />,
    );
    expect(screen.queryByRole("button", { name: "Chạy lại" })).toBeNull();
    expect(screen.getByText("AGENT_RUN_EXPIRED")).toBeTruthy();
  });

  it("shows the grounded answer once the run succeeds", () => {
    render(<KnowledgeRunMonitor initialRun={run()} />);
    expect(screen.getByText("Paracetamol.")).toBeTruthy();
    expect(screen.getByText("Token vào/ra: 120 / 55")).toBeTruthy();
  });
});
