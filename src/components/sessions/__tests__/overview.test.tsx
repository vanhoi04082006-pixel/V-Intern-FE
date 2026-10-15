import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SessionList } from "../session-list";
import { SessionOverview, type DetailDeps } from "../session-overview";

const overviewRow = {
  id: "s1", code: "SS-1", name: "K48", status: "active",
  startDate: "2026-11-01", endDate: "2026-12-31",
  project: { id: "p1", code: "PRJ-1", name: "Shop", templateVersion: 2 },
  memberCount: 2, sprintCount: 2, taskTotal: 4, taskDone: 1, taskPercent: 25,
};

describe("SessionList (M6)", () => {
  it("renders aggregated rows with progress and detail links", async () => {
    const list = vi.fn(async () => ({ items: [overviewRow], total: 1, page: 1, pageSize: 10, totalPages: 1 }));
    render(<SessionList list={list} />);
    expect(await screen.findByText("K48")).toBeInTheDocument();
    expect(screen.getByText(/1\/4 tasks \(25%\)/)).toBeInTheDocument();
    expect(screen.getByText(/template v2/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /chi tiết/i }).getAttribute("href")).toBe("/instructor/sessions/s1");
    expect(list).toHaveBeenCalledTimes(1);
  });
  it("offers setup only for upcoming sessions with a project", async () => {
    const upcoming = { ...overviewRow, status: "upcoming" };
    const list = vi.fn(async () => ({ items: [upcoming], total: 1, page: 1, pageSize: 10, totalPages: 1 }));
    render(<SessionList list={list} />);
    expect(await screen.findByText("K48")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /setup/i }).getAttribute("href"))
      .toBe("/instructor/sessions/s1/setup?project=p1");
  });
  it("hides setup for active sessions", async () => {
    const list = vi.fn(async () => ({ items: [overviewRow], total: 1, page: 1, pageSize: 10, totalPages: 1 }));
    render(<SessionList list={list} />);
    expect(await screen.findByText("K48")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /setup/i })).toBeNull();
  });
  it("shows an empty state pointing at the library", async () => {
    const list = vi.fn(async () => ({ items: [], total: 0, page: 1, pageSize: 10, totalPages: 1 }));
    render(<SessionList list={list} />);
    expect(await screen.findByText(/thư viện dự án/i)).toBeInTheDocument();
  });
});

describe("SessionOverview (M6)", () => {
  const session = { code: "SS-1", name: "K48", status: "active", startDate: "2026-11-01", endDate: "2026-12-31",
    overview: { ...overviewRow, sprintCount: 1, taskTotal: 2, taskDone: 1, taskPercent: 50 },
    members: [], milestones: [], projectSnapshot: null,
    sprintProgress: [{ id: 'sp1', status: 'active', taskTotal: 2, taskDone: 1, taskReview: 0 }],
  };
  const sprints = [
    { id: "sp1", code: "S-1", name: "Sprint 1", goal: "Ship", status: "active", projectId: "p1", sessionId: "s1", startDate: "2026-11-01", endDate: "2026-11-14", progress: null },
  ];
  const tasks = [
    { id: "t1", code: "T-1", title: "FE", status: "done", priority: "high", progress: 100, dueDate: null, assigneeId: "u1", description: null, projectId: "p1", sprintId: "sp1", storyPoints: 3, version: 1 },
    { id: "t2", code: "T-2", title: "BE", status: "todo", priority: "medium", progress: 0, dueDate: "2026-11-10", assigneeId: null, description: null, projectId: "p1", sprintId: "sp1", storyPoints: 5, version: 1 },
  ];
  function deps(): Partial<DetailDeps> {
    return {
      getSession: vi.fn(async () => session),
      listSprints: vi.fn(async () => ({ items: sprints, total: 1, page: 1, pageSize: 50, totalPages: 1 })),
      listTasks: vi.fn(async () => ({ items: tasks, total: 2, page: 1, pageSize: 100, totalPages: 1 })),
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
    expect(screen.getByText(/confirmed/)).toBeInTheDocument();
  });
  it("shows an empty state before any plan is confirmed", async () => {
    const d = deps();
    d.listSprints = vi.fn(async () => ({ items: [], total: 1, page: 1, pageSize: 50, totalPages: 1 }));
    d.listTasks = vi.fn(async () => ({ items: [], total: 0, page: 1, pageSize: 100, totalPages: 1 }));
    d.listPlans = vi.fn(async () => []);
    render(<SessionOverview sessionId="s1" deps={d} />);
    expect(await screen.findByText(/confirm kế hoạch AI/i)).toBeInTheDocument();
    expect(screen.getByText("chưa có")).toBeInTheDocument();
  });
  it("uses backend totals beyond the loaded task page and keeps instructor links", async () => {
    const d = deps();
    d.getSession = vi.fn(async () => ({ ...session, overview: { ...session.overview, taskTotal: 250, taskDone: 150, taskPercent: 60 } })) as unknown as DetailDeps['getSession'];
    render(<SessionOverview sessionId="s1" deps={d} />);
    expect(await screen.findByText('150 hoàn thành (60%)')).toBeInTheDocument();
    expect((await screen.findByRole('link', { name: 'FE' })).getAttribute('href')).toBe('/instructor/tasks/t1');
    expect(screen.getByRole('link', { name: 'Sprint 1' }).getAttribute('href')).toBe('/instructor/sprints/sp1');
  });
  it('keeps admin drill-down inside admin routes and does not mount the instructor planning action', async () => {
    render(<SessionOverview sessionId="s1" deps={deps()} basePath="/admin" />);
    expect((await screen.findByRole('link', { name: 'FE' })).getAttribute('href')).toBe('/admin/tasks/t1');
    expect(screen.getByRole('link', { name: 'Sprint & Task' }).getAttribute('href')).toContain('/admin/sprints?');
    expect(screen.queryByRole('link', { name: 'Đội hình & thiết lập' })).toBeNull();
    expect(screen.getAllByRole('link').some(link => link.getAttribute('href')?.startsWith('/instructor/'))).toBe(false);
  });
});
