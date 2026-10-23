import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SessionList } from "../session-list";
import { SessionOverview, type DetailDeps } from "../session-overview";

const overviewRow = {
  id: "s1",
  code: "SS-1",
  name: "K48",
  status: "active",
  startDate: "2026-11-01",
  endDate: "2026-12-31",
  project: { id: "p1", code: "PRJ-1", name: "Shop", templateVersion: 2 },
  memberCount: 2,
  sprintCount: 2,
  taskTotal: 4,
  taskDone: 1,
  taskPercent: 25,
};

describe("SessionList (M6)", () => {
  it("shows active Sprint and backend alerts, and sends sorting to the server", async () => {
    const list = vi.fn(async () => ({
      items: [
        {
          ...overviewRow,
          currentSprint: { id: "sp1", code: "SP-1", name: "Giao diện" },
          alerts: { overdueTasks: 2, pendingReview: 1, sessionOverdue: true },
        },
      ],
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    }));
    render(<SessionList list={list} />);
    expect(
      await screen.findByText(/Sprint đang chạy: Giao diện/),
    ).toBeInTheDocument();
    expect(screen.getByText("2 nhiệm vụ quá hạn")).toBeInTheDocument();
    expect(screen.getByText("1 nhiệm vụ chờ duyệt")).toBeInTheDocument();
    expect(screen.getByText("Phiên đã quá ngày kết thúc")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Sắp xếp phiên"), {
      target: { value: "progress:asc" },
    });
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 1,
          sortBy: "progress",
          sortDirection: "asc",
        }),
        expect.any(AbortSignal),
      ),
    );
  });
  it("renders aggregated rows with progress and detail links", async () => {
    const list = vi.fn(async () => ({
      items: [overviewRow],
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    }));
    render(<SessionList list={list} />);
    expect(await screen.findByRole("heading", { name: "K48", level: 3 })).toBeInTheDocument();
    expect(screen.getByText(/1\/4 nhiệm vụ \(25%\)/)).toBeInTheDocument();
    expect(screen.getByText(/mẫu v2/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /chi tiết/i }).getAttribute("href"),
    ).toBe("/instructor/sessions/s1");
    expect(list).toHaveBeenCalledTimes(1);
  });
  it("offers setup only for upcoming sessions with a project", async () => {
    const upcoming = { ...overviewRow, status: "upcoming" };
    const list = vi.fn(async () => ({
      items: [upcoming],
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    }));
    render(<SessionList list={list} />);
    expect(await screen.findByRole("heading", { name: "K48", level: 3 })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /thiết lập/i }).getAttribute("href"),
    ).toBe("/instructor/sessions/s1/setup?project=p1");
  });
  it("hides setup for active sessions", async () => {
    const list = vi.fn(async () => ({
      items: [overviewRow],
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    }));
    render(<SessionList list={list} />);
    expect(await screen.findByRole("heading", { name: "K48", level: 3 })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /thiết lập/i })).toBeNull();
  });
  it("shows an empty state pointing at the library", async () => {
    const list = vi.fn(async () => ({
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    }));
    render(<SessionList list={list} />);
    expect(await screen.findByText(/thư viện dự án/i)).toBeInTheDocument();
  });
});

describe("SessionOverview (M6)", () => {
  const session = {
    code: "SS-1",
    name: "K48",
    status: "active",
    startDate: "2026-11-01",
    endDate: "2026-12-31",
    overview: {
      ...overviewRow,
      sprintCount: 1,
      taskTotal: 2,
      taskDone: 1,
      taskPercent: 50,
    },
    members: [],
    milestones: [],
    projectSnapshot: null,
    sprintProgress: [
      { id: "sp1", status: "active", taskTotal: 2, taskDone: 1, taskReview: 0 },
    ],
  };
  const sprints = [
    {
      id: "sp1",
      code: "S-1",
      name: "Sprint 1",
      goal: "Ship",
      status: "active",
      projectId: "p1",
      sessionId: "s1",
      startDate: "2026-11-01",
      endDate: "2026-11-14",
      progress: null,
    },
  ];
  const tasks = [
    {
      id: "t1",
      code: "T-1",
      title: "FE",
      status: "done",
      priority: "high",
      progress: 100,
      dueDate: null,
      assigneeId: "u1",
      description: null,
      projectId: "p1",
      sprintId: "sp1",
      storyPoints: 3,
      version: 1,
    },
    {
      id: "t2",
      code: "T-2",
      title: "BE",
      status: "todo",
      priority: "medium",
      progress: 0,
      dueDate: "2026-11-10",
      assigneeId: null,
      description: null,
      projectId: "p1",
      sprintId: "sp1",
      storyPoints: 5,
      version: 1,
    },
  ];
  function deps(): Partial<DetailDeps> {
    return {
      getSession: vi.fn(async () => session),
      listSprints: vi.fn(async () => ({
        items: sprints,
        total: 1,
        page: 1,
        pageSize: 50,
        totalPages: 1,
      })),
      listTasks: vi.fn(async () => ({
        items: tasks,
        total: 2,
        page: 1,
        pageSize: 100,
        totalPages: 1,
      })),
      listPlans: vi.fn(async () => [{ planId: "pl1", status: "confirmed" }]),
    } as unknown as Partial<DetailDeps>;
  }
  it("renders counters, sprints with progress and a task table", async () => {
    render(<SessionOverview sessionId="s1" deps={deps()} />);
    expect(await screen.findByText("K48")).toBeInTheDocument();
    expect(screen.getByText("1 hoàn thành (50%)")).toBeInTheDocument();
    expect(screen.getByText("Sprint 1")).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();
    expect(screen.getByText("FE")).toBeInTheDocument();
    expect(screen.getByText("Đã xác nhận")).toBeInTheDocument();
  });
  it("does not announce empty Sprint or task lists while delivery is loading", async () => {
    const d = deps();
    d.listSprints = vi.fn(
      () => new Promise(() => {}),
    ) as DetailDeps["listSprints"];
    d.listTasks = vi.fn(() => new Promise(() => {})) as DetailDeps["listTasks"];
    render(<SessionOverview sessionId="s1" deps={d} />);
    await screen.findByText("K48");
    expect(
      screen.getByText("Đang tải danh sách Sprint..."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Đang tải danh sách nhiệm vụ..."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Chưa có Sprint\./)).not.toBeInTheDocument();
    expect(screen.queryByText("Chưa có task.")).not.toBeInTheDocument();
  });
  it("opens the review queue from a dashboard link with the server filter applied", async () => {
    const d = deps();
    render(
      <SessionOverview sessionId="s1" initialTaskStatus="review" deps={d} />,
    );
    await screen.findByText("K48");
    await waitFor(() =>
      expect(d.listTasks).toHaveBeenLastCalledWith(
        expect.objectContaining({ sessionId: "s1", status: "review", page: 1 }),
        expect.any(AbortSignal),
      ),
    );
    expect(screen.getByLabelText("Trạng thái task trong phiên")).toHaveValue(
      "review",
    );
  });
  it("brings a linked section into view after the session resources finish loading", async () => {
    const originalScroll = HTMLElement.prototype.scrollIntoView;
    const previousHash = window.location.hash;
    const scroll = vi.fn();
    HTMLElement.prototype.scrollIntoView = scroll;
    window.history.replaceState(null, "", "#session-work");
    try {
      render(<SessionOverview sessionId="s1" deps={deps()} />);
      await screen.findByText("K48");
      await waitFor(() => expect(scroll).toHaveBeenCalled());
      expect(scroll.mock.contexts[0]).toBe(
        document.getElementById("session-work"),
      );
      expect(scroll).toHaveBeenCalledWith({ block: "start", behavior: "auto" });
    } finally {
      HTMLElement.prototype.scrollIntoView = originalScroll;
      window.history.replaceState(
        null,
        "",
        previousHash || window.location.pathname,
      );
    }
  });
  it("shows member role, dependency, immutable source and separate AI/human decisions", async () => {
    const d = deps();
    d.getSession = vi.fn(async () => ({
      ...session,
      members: [
        {
          userId: "u1",
          displayName: "Lan",
          email: "lan@example.test",
          role: "frontend",
          assignmentStatus: "active",
        },
      ],
      projectSnapshot: {
        objectives: { business: "Ghi chú an toàn", learning: ["Kiểm thử API"] },
        expectedOutputs: { artifacts: ["README triển khai"] },
      },
    })) as unknown as DetailDeps["getSession"];
    d.listTasks = vi.fn(async () => ({
      items: [
        {
          ...tasks[1],
          delivery: {
            blocked: true,
            submission: {
              id: "sub1",
              status: "approved",
              prUrl: "https://github.com/owner/repo/pull/1",
              headSha: "a".repeat(40),
              submittedAt: "2026-10-01",
              aiStatus: "awaiting_instructor",
              aiScore: 98,
              aiSummary: "Đạt tiêu chí",
              instructorScore: 90.5,
              instructorFeedback: "Đã duyệt độc lập",
            },
          },
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    })) as unknown as DetailDeps["listTasks"];
    render(<SessionOverview sessionId="s1" deps={d} />);
    expect(await screen.findByText(/Frontend Developer/)).toBeInTheDocument();
    expect(screen.getByText("Chờ phụ thuộc")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Mở bài nộp trên GitHub" }),
    ).toHaveAttribute("href", "https://github.com/owner/repo/pull/1");
    expect(screen.getByText(/90.5\/100/)).toBeInTheDocument();
    expect(screen.getByText("Đã duyệt độc lập")).toBeInTheDocument();
    expect(screen.getByText("Ghi chú an toàn")).toBeInTheDocument();
    expect(screen.getByText("README triển khai")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Trạng thái task trong phiên"), {
      target: { value: "review" },
    });
    await waitFor(() =>
      expect(d.listTasks).toHaveBeenLastCalledWith(
        expect.objectContaining({ sessionId: "s1", status: "review", page: 1 }),
        expect.any(AbortSignal),
      ),
    );
  });
  it("shows an empty state before any plan is confirmed", async () => {
    const d = deps();
    d.listSprints = vi.fn(async () => ({
      items: [],
      total: 1,
      page: 1,
      pageSize: 50,
      totalPages: 1,
    }));
    d.listTasks = vi.fn(async () => ({
      items: [],
      total: 0,
      page: 1,
      pageSize: 100,
      totalPages: 1,
    }));
    d.listPlans = vi.fn(async () => []);
    render(<SessionOverview sessionId="s1" deps={d} />);
    expect(
      await screen.findByText(
        /Xác nhận kế hoạch AI để tạo Sprint và nhiệm vụ/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("chưa có")).toBeInTheDocument();
  });
  it("uses backend totals beyond the loaded task page and keeps instructor links", async () => {
    const d = deps();
    d.getSession = vi.fn(async () => ({
      ...session,
      overview: {
        ...session.overview,
        taskTotal: 250,
        taskDone: 150,
        taskPercent: 60,
      },
    })) as unknown as DetailDeps["getSession"];
    render(<SessionOverview sessionId="s1" deps={d} />);
    expect(await screen.findByText("150 hoàn thành (60%)")).toBeInTheDocument();
    expect(
      (await screen.findByRole("link", { name: "FE" })).getAttribute("href"),
    ).toBe("/instructor/tasks/t1");
    expect(
      screen.getByRole("link", { name: "Sprint 1" }).getAttribute("href"),
    ).toBe("/instructor/sprints/sp1");
  });
  it("keeps admin drill-down inside admin routes and does not mount the instructor planning action", async () => {
    render(<SessionOverview sessionId="s1" deps={deps()} basePath="/admin" />);
    expect(
      (await screen.findByRole("link", { name: "FE" })).getAttribute("href"),
    ).toBe("/admin/tasks/t1");
    expect(
      screen.getByRole("link", { name: "Sprint & Task" }).getAttribute("href"),
    ).toContain("/admin/sprints?");
    expect(
      screen.queryByRole("link", { name: "Đội hình & thiết lập" }),
    ).toBeNull();
    expect(
      screen
        .getAllByRole("link")
        .some((link) => link.getAttribute("href")?.startsWith("/instructor/")),
    ).toBe(false);
  });
});
