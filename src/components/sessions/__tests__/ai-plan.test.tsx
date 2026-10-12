import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AiPlanPanel } from "../ai-plan";

const readyPlan = {
  planId: "pl1", projectId: "p1", sessionId: "s1", templateVersion: 2,
  status: "ready", createdAt: "2026-11-02T00:00:00.000Z",
  sprintCount: 1, taskCount: 2, hasDraft: true,
};
const detail = {
  ...readyPlan,
  draft: {
    sprints: [{
      code: null, name: "Sprint 1", goal: "Foundation",
      startDate: "2026-11-01T00:00:00.000Z", endDate: "2026-11-14T00:00:00.000Z",
      tasks: [
        { title: "FE task", description: null, priority: "high", storyPoints: 3, dueDate: "2026-11-05", suggestedRole: "frontend", assigneeId: "u1" },
        { title: "BE task", description: null, priority: "medium", storyPoints: 5, dueDate: null, suggestedRole: null, assigneeId: null },
      ],
    }],
  },
  warnings: [{ taskTitle: "BE task", message: "Chưa gán người thực hiện." }],
  error: null,
  deduped: false,
};

function deps(over: Record<string, unknown> = {}) {
  return {
    list: vi.fn(async () => [readyPlan]),
    get: vi.fn(async () => detail),
    generate: vi.fn(async () => ({ planId: "pl2", status: "ready", deduped: false })),
    confirm: vi.fn(async () => ({ sprintIds: ["sp1"], taskIds: ["t1", "t2"], sprintCount: 1, taskCount: 2, deduped: false })),
    ...over,
  };
}

describe("AiPlanPanel (M5)", () => {
  it("shows empty state when no plan exists", async () => {
    render(<AiPlanPanel sessionId="s1" projectId="p1" deps={deps({ list: vi.fn(async () => []) })} />);
    expect(await screen.findByText(/chưa có kế hoạch AI/i)).toBeInTheDocument();
  });
  it("reviews draft sprints, tasks, warnings and confirms", async () => {
    const d = deps();
    const published = vi.fn();
    render(<AiPlanPanel sessionId="s1" projectId="p1" onPublished={published} deps={d} />);
    expect(await screen.findByText(/Sprint 1/)).toBeInTheDocument();
    expect(screen.getByText(/FE task/)).toBeInTheDocument();
    expect(screen.getByText(/Chưa gán người/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /xác nhận & publish/i }));
    expect(await screen.findByText(/đã publish Sprint\/Task/i)).toBeInTheDocument();
    expect(d.confirm).toHaveBeenCalledTimes(1);
    const body = (d.confirm.mock.calls as unknown as Array<[unknown]>)[0]?.[0] as
      | { projectId: string; planId: string; requestId: unknown }
      | undefined;
    expect(body?.projectId).toBe("p1");
    expect(body?.planId).toBe("pl1");
    expect(typeof body?.requestId).toBe("string");
    expect(published).toHaveBeenCalled();
  });
  it("shows failure with retry and regenerates", async () => {
    const d = deps({
      list: vi.fn(async () => [{ ...readyPlan, status: "failed", hasDraft: false }]),
      get: vi.fn(async () => ({ ...detail, status: "failed", draft: null })),
    });
    render(<AiPlanPanel sessionId="s1" projectId="p1" deps={d} />);
    expect(await screen.findByText(/tạo kế hoạch thất bại/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /thử lại/i }));
    expect(d.generate).toHaveBeenCalledWith({ projectId: "p1", sessionId: "s1" });
  });
});
