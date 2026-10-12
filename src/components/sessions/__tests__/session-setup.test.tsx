import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SessionSetup, assessTeam } from "../session-setup";

const session = { code: "SS-1", name: "K48", status: "upcoming", startDate: "2026-11-01", endDate: "2026-12-31" };
const project = { id: "p1", code: "PRJ-1", name: "Shop", status: "active" };
const slots = [
  { roleCode: "frontend", requiredCount: 1, filledCount: 1, members: [{ userId: "u1", displayName: "SV A" }] },
  { roleCode: "backend", requiredCount: 1, filledCount: 0, members: [] },
];
const members = [{ userId: "u1", displayName: "SV A", email: "a@x.edu" }];
const definition = {
  roleDetails: [
    { code: "frontend", countMin: 1 },
    { code: "backend", countMin: 1 },
  ],
};
const deps = {
  getSession: vi.fn(async () => session),
  getProject: vi.fn(async () => project),
  getSlots: vi.fn(async () => slots),
  getMembers: vi.fn(async () => members),
  getContext: vi.fn(async () => ({ definition, templateVersion: 2 })),
};

describe("assessTeam (M3)", () => {
  it("flags missing required slots", () => {
    expect(assessTeam(slots, [{ code: "frontend", title: null, countMin: 1 }, { code: "backend", title: null, countMin: 1 }], 1))
      .toEqual({ ready: false, missing: [{ roleCode: "backend", need: 1, have: 0 }] });
  });
  it("is ready when all required slots are filled", () => {
    const full = [{ ...slots[0] }, { ...slots[1], filledCount: 1 }];
    expect(assessTeam(full, [{ code: "frontend", title: null, countMin: 1 }, { code: "backend", title: null, countMin: 1 }], 2).ready).toBe(true);
  });
  it("requires any member when the template has no role details", () => {
    expect(assessTeam([], [], 0).ready).toBe(false);
    expect(assessTeam([], [], 1).ready).toBe(true);
  });
});

describe("SessionSetup (M3)", () => {
  it("renders template context, slots with holders, members and readiness", async () => {
    render(<SessionSetup sessionId="s1" projectId="p1" deps={deps} />);
    expect(await screen.findByText(/Setup: K48/)).toBeInTheDocument();
    expect(screen.getByText(/template v2/)).toBeInTheDocument();
    expect(screen.getByText(/frontend · 1\/1/)).toBeInTheDocument();
    expect(screen.getByText(/backend · 0\/1/)).toBeInTheDocument();
    expect(screen.getAllByText(/SV A/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Thiếu 1 backend/)).toBeInTheDocument();
  });
  it("guides when opened without a project", async () => {
    render(
      <SessionSetup
        sessionId="s1"
        projectId={null}
        deps={{ ...deps, getProject: vi.fn(), getSlots: vi.fn(), getMembers: vi.fn(), getContext: vi.fn() }}
      />,
    );
    expect(await screen.findByText(/chưa gắn project/i)).toBeInTheDocument();
  });
  it("notes non-upcoming sessions and shows their AI plans", async () => {
    const planDeps = {
      list: vi.fn(async () => []),
      get: vi.fn(),
      generate: vi.fn(),
      confirm: vi.fn(),
    };
    render(
      <SessionSetup
        sessionId="s1"
        projectId="p1"
        planDeps={planDeps}
        deps={{ ...deps, getSession: vi.fn(async () => ({ ...session, status: "active" })) }}
      />,
    );
    expect(await screen.findByText(/đang ở trạng thái active/i)).toBeInTheDocument();
    expect(planDeps.list).toHaveBeenCalled();
  });
  it("starts the session when the team is ready", async () => {
    const full = {
      ...deps,
      getSlots: vi.fn(async () => [
        { roleCode: "frontend", requiredCount: 1, filledCount: 1, members: [] },
        { roleCode: "backend", requiredCount: 1, filledCount: 1, members: [] },
      ]),
      getMembers: vi.fn(async () => [
        { userId: "u1", displayName: "SV A", email: "a@x.edu" },
        { userId: "u2", displayName: "SV B", email: "b@x.edu" },
      ]),
    };
    render(<SessionSetup sessionId="s1" projectId="p1" deps={full} />);
    const btn = await screen.findByRole("button", { name: /start session/i });
    expect(screen.getByText(/đội hình đã đủ điều kiện/i)).toBeInTheDocument();
    expect(btn).toBeEnabled();
  });
});
