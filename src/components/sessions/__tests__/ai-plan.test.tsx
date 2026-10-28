import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
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
  it("explains current eligibility warnings separately from an already published plan", async () => {
    const warning = "Assignee is not assigned to this project/session.";
    render(<AiPlanPanel sessionId="s1" projectId="p1" deps={deps({
      list: vi.fn(async () => [{ ...readyPlan, status: "confirmed" }]),
      get: vi.fn(async () => ({ ...detail, status: "confirmed", warnings: [{ taskTitle: "FE task", message: warning }] })),
    })} />);
    const toggle = await screen.findByText("Đối chiếu điều kiện hiện tại");
    expect(toggle.closest("details")).not.toHaveAttribute("open");
    expect(screen.getByText(/không làm thay đổi kế hoạch đã phát hành/i)).toBeInTheDocument();
    expect(screen.getByText(warning, { exact: false })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Xác nhận & publish" })).not.toBeInTheDocument();
  });
  it("discards an old session generation response after switching session scope", async () => {
    let resolveGenerate!: (value: { planId: string; status: string; deduped: boolean }) => void;
    const summaryB = { ...readyPlan, planId: "plB", projectId: "pB", sessionId: "sB" };
    const detailB = { ...detail, ...summaryB, draft: { sprints: [{ ...detail.draft.sprints[0], name: "Session B sprint", tasks: [{ ...detail.draft.sprints[0].tasks[0], title: "Session B task" }] }] } };
    const d = deps({
      list: vi.fn(async (sessionId: string) => sessionId === "sB" ? [summaryB] : [readyPlan]),
      get: vi.fn(async (planId: string) => planId === "plB" ? detailB : detail),
      generate: vi.fn(() => new Promise(resolve => { resolveGenerate = resolve; })),
    });
    const view = render(<AiPlanPanel sessionId="s1" projectId="p1" deps={d} />);
    fireEvent.click(await screen.findByRole("button", { name: "Tạo lại" }));
    view.rerender(<AiPlanPanel sessionId="sB" projectId="pB" deps={d} />);
    await screen.findByText(/Session B task/);
    await act(async () => resolveGenerate({ planId: "lateA", status: "generating", deduped: false }));
    expect(screen.getByText(/Session B task/)).toBeInTheDocument();
    expect(d.get).not.toHaveBeenCalledWith("lateA", expect.any(AbortSignal));
  });
  it("does not show an old publish notice after switching session scope", async () => {
    let resolveConfirm!: () => void;
    const published = vi.fn();
    const summaryB = { ...readyPlan, planId: "plB", projectId: "pB", sessionId: "sB" };
    const d = deps({
      list: vi.fn(async (sessionId: string) => sessionId === "sB" ? [summaryB] : [readyPlan]),
      get: vi.fn(async (planId: string) => planId === "plB" ? { ...detail, ...summaryB } : detail),
      confirm: vi.fn(() => new Promise<void>(resolve => { resolveConfirm = resolve; })),
    });
    const view = render(<AiPlanPanel sessionId="s1" projectId="p1" deps={d} onPublished={published} />);
    fireEvent.click(await screen.findByRole("button", { name: "Xác nhận & publish" }));
    view.rerender(<AiPlanPanel sessionId="sB" projectId="pB" deps={d} />);
    await screen.findByRole("button", { name: "Xác nhận & publish" });
    await act(async () => resolveConfirm());
    expect(screen.queryByText("Đã publish Sprint/Task từ kế hoạch.")).not.toBeInTheDocument();
    expect(published).not.toHaveBeenCalled();
  });
  it('polls an active session even before the detached trigger reserves its plan', async () => {
    vi.useFakeTimers();
    const list = vi.fn().mockResolvedValueOnce([]).mockResolvedValue([readyPlan]);
    const view = render(<AiPlanPanel autoPlanning sessionId="s1" projectId="p1" deps={deps({ list })} />);
    try {
      await act(async () => {});
      expect(list).toHaveBeenCalledTimes(1);
      await act(async () => { await vi.advanceTimersByTimeAsync(4000); });
      expect(list).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('button', { name: 'Xác nhận & publish' })).toBeInTheDocument();
    } finally { view.unmount(); vi.useRealTimers(); }
  });
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
  it("publishes the instructor-edited draft rather than the original", async () => {
    const d = deps();
    render(<AiPlanPanel sessionId="s1" projectId="p1" deps={d} />);
    fireEvent.click(await screen.findByRole("button", { name: /chỉnh sửa bản nháp/i }));
    fireEvent.change(screen.getByLabelText("Tên task 1.1"), { target: { value: "Reviewed task" } });
    fireEvent.change(screen.getByLabelText("Mô tả task 1.1"), { target: { value: "Reviewed requirements" } });
    fireEvent.click(screen.getByRole("button", { name: /xác nhận & publish/i }));
    await screen.findByText(/đã publish Sprint\/Task/i);
    expect(d.confirm).toHaveBeenCalledWith(expect.objectContaining({
      draft: expect.objectContaining({ sprints: [expect.objectContaining({
        tasks: [expect.objectContaining({ title: "Reviewed task", description: "Reviewed requirements" }), expect.anything()],
      })] }),
    }));
  });
});
