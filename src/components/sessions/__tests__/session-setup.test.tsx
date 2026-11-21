import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { SessionSetup, assessTeam } from "../session-setup";
import { clearSession, setSession } from "@/lib/auth/session";
import * as academic from "@/lib/api/academic";
import { ApiError } from "@/lib/auth/api-client";
const instructor = {
  id: "instructor1",
  displayName: "Instructor",
  email: "instructor@test.local",
  roles: ["instructor"],
  permissions: [
    "sessions.view",
    "sessions.manage",
    "projects.manage",
    "assignments.view",
    "assignments.manage",
    "recruitment.view",
    "sprints.manage",
  ],
};
beforeEach(() => {
  setSession("test-token", instructor);
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
afterEach(() => { clearSession(); vi.restoreAllMocks(); });

const session = {
  code: "SS-1",
  name: "K48",
  status: "upcoming",
  startDate: "2026-11-01",
  endDate: "2026-12-31",
};
const project = { id: "p1", code: "PRJ-1", name: "Shop", status: "active" };
const slots = [
  {
    roleCode: "frontend",
    requiredCount: 1,
    filledCount: 1,
    members: [{ userId: "u1", displayName: "SV A" }],
  },
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
    expect(
      assessTeam(
        slots,
        [
          { code: "frontend", title: null, countMin: 1 },
          { code: "backend", title: null, countMin: 1 },
        ],
        1,
      ),
    ).toEqual({
      ready: false,
      missing: [{ roleCode: "backend", need: 1, have: 0 }],
    });
  });
  it("is ready when all required slots are filled", () => {
    const full = [{ ...slots[0] }, { ...slots[1], filledCount: 1 }];
    expect(
      assessTeam(
        full,
        [
          { code: "frontend", title: null, countMin: 1 },
          { code: "backend", title: null, countMin: 1 },
        ],
        2,
      ).ready,
    ).toBe(true);
  });
  it("requires any member when the template has no role details", () => {
    expect(assessTeam([], [], 0).ready).toBe(false);
    expect(assessTeam([], [], 1).ready).toBe(true);
  });
});

describe("SessionSetup (M3)", () => {
  it.each(["active", "ending", "completed"])("lets an instructor complete an active assignment in a %s session and preserves the member", async (status) => {
    let assignmentStatus = "active";
    const list = vi.spyOn(academic, "listSessionAssignments").mockResolvedValue([{ id: "a1", internId: "u1", status: "active" }]);
    const complete = vi.spyOn(academic, "completeAssignment").mockImplementation(async () => { assignmentStatus = "completed"; return "a1"; });
    render(<SessionSetup sessionId="s1" projectId="p1" planDeps={{ list: async () => [] }} deps={{ ...deps,
      getSession: async () => ({ ...session, status }),
      getMembers: async () => [{ ...members[0], assignmentStatus }],
    }} />);
    fireEvent.click(await screen.findByRole("button", { name: "Hoàn thành phân công của SV A" }));
    const dialog = screen.getByRole("dialog", { name: "Hoàn thành phân công" });
    expect(complete).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Giữ phân công" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hoàn thành phân công của SV A" }));
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận hoàn thành phân công" }));
    await screen.findByText("Phân công đã hoàn thành");
    expect(list).toHaveBeenCalledWith("s1", undefined, "u1");
    expect(complete).toHaveBeenCalledExactlyOnceWith("a1");
    expect(screen.getByText("a@x.edu")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hoàn thành phân công của SV A" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/tìm sinh viên/i)).not.toBeInTheDocument();
  });
  it("keeps a failed assignment completion open for retry without losing the member", async () => {
    vi.spyOn(academic, "listSessionAssignments").mockResolvedValue([{ id: "a1", internId: "u1", status: "active" }]);
    const complete = vi.spyOn(academic, "completeAssignment").mockRejectedValueOnce(new ApiError(503, "SERVICE_UNAVAILABLE", "Unavailable")).mockResolvedValue("a1");
    render(<SessionSetup sessionId="s1" projectId="p1" planDeps={{ list: async () => [] }} deps={{ ...deps,
      getSession: async () => ({ ...session, status: "ending" }),
      getMembers: async () => [{ ...members[0], assignmentStatus: complete.mock.calls.length > 1 ? "completed" : "active" }],
    }} />);
    fireEvent.click(await screen.findByRole("button", { name: "Hoàn thành phân công của SV A" }));
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận hoàn thành phân công" }));
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveTextContent(/Unavailable|tạm thời|dịch vụ/i));
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận hoàn thành phân công" }));
    await screen.findByText("Phân công đã hoàn thành");
    expect(complete).toHaveBeenCalledTimes(2);
  });
  it("refuses a stale or mismatched assignment rather than completing another member", async () => {
    vi.spyOn(academic, "listSessionAssignments").mockResolvedValue([{ id: "other", internId: "u2", status: "active" }]);
    const complete = vi.spyOn(academic, "completeAssignment").mockResolvedValue("other");
    render(<SessionSetup sessionId="s1" projectId="p1" planDeps={{ list: async () => [] }} deps={{ ...deps,
      getSession: async () => ({ ...session, status: "completed" }),
      getMembers: async () => [{ ...members[0], assignmentStatus: "active" }],
    }} />);
    fireEvent.click(await screen.findByRole("button", { name: "Hoàn thành phân công của SV A" }));
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận hoàn thành phân công" }));
    await screen.findByText(/Trạng thái đã thay đổi.*tải lại/);
    expect(complete).not.toHaveBeenCalled();
  });
  it.each(["upcoming", "cancelled"])("does not offer assignment completion in %s setup", async (status) => {
    render(<SessionSetup sessionId="s1" projectId="p1" planDeps={{ list: async () => [] }} deps={{ ...deps,
      getSession: async () => ({ ...session, status }),
      getMembers: async () => [{ ...members[0], assignmentStatus: "active" }],
    }} />);
    await screen.findByText(/Thiết lập: K48/);
    expect(screen.queryByRole("button", { name: "Hoàn thành phân công của SV A" })).not.toBeInTheDocument();
  });
  it("keeps assignment completion unavailable to a session viewer", async () => {
    setSession("test-token", { ...instructor, permissions: ["sessions.view"] });
    render(<SessionSetup sessionId="s1" projectId="p1" deps={{ ...deps,
      getSession: async () => ({ ...session, status: "completed" }),
      getMembers: async () => [{ ...members[0], assignmentStatus: "active" }],
    }} />);
    await screen.findByText(/Thiết lập: K48/);
    expect(screen.queryByRole("button", { name: "Hoàn thành phân công của SV A" })).not.toBeInTheDocument();
  });
  it("does not offer a completion lookup without assignments.view", async () => {
    setSession("test-token", { ...instructor, permissions: ["sessions.view", "assignments.manage"] });
    render(<SessionSetup sessionId="s1" projectId="p1" deps={{ ...deps,
      getSession: async () => ({ ...session, status: "completed" }),
      getMembers: async () => [{ ...members[0], assignmentStatus: "active" }],
    }} />);
    await screen.findByText(/Thiết lập: K48/);
    expect(screen.queryByRole("button", { name: "Hoàn thành phân công của SV A" })).not.toBeInTheDocument();
  });
  it("keeps session details visible without offering unauthorized Start or assignment", async () => {
    setSession("test-token", { ...instructor, permissions: ["sessions.view"] });
    render(<SessionSetup sessionId="s1" projectId="p1" deps={deps} />);
    await screen.findByText(/Thiết lập: K48/);
    expect(
      screen.queryByRole("button", { name: /bắt đầu phiên/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/tìm sinh viên/i)).not.toBeInTheDocument();
  });
  it("does not fetch or mount AI plans without sprints.manage", async () => {
    setSession("test-token", { ...instructor, permissions: ["sessions.view"] });
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
        deps={{
          ...deps,
          getSession: vi.fn(async () => ({ ...session, status: "active" })),
        }}
      />,
    );
    await screen.findByText(/đang ở trạng thái đang hoạt động/i);
    expect(screen.queryByText("Kế hoạch AI")).not.toBeInTheDocument();
    expect(planDeps.list).not.toHaveBeenCalled();
  });
  it("renders template context, slots with holders, members and readiness", async () => {
    render(<SessionSetup sessionId="s1" projectId="p1" deps={deps} />);
    expect(await screen.findByText(/Thiết lập: K48/)).toBeInTheDocument();
    expect(screen.getByText(/mẫu v2/)).toBeInTheDocument();
    expect(screen.getByText(/Frontend Developer · 1\/1/)).toBeInTheDocument();
    expect(screen.getByText(/Backend Developer · 0\/1/)).toBeInTheDocument();
    expect(screen.getAllByText(/SV A/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Thiếu 1 Backend Developer/)).toBeInTheDocument();
  });
  it("guides when opened without a project", async () => {
    render(
      <SessionSetup
        sessionId="s1"
        projectId={null}
        deps={{
          ...deps,
          getProject: vi.fn(),
          getSlots: vi.fn(),
          getMembers: vi.fn(),
          getContext: vi.fn(),
        }}
      />,
    );
    expect(await screen.findByText(/chưa gắn dự án/i)).toBeInTheDocument();
  });
  it("keeps action notices across parent reloads (no unmount on refresh)", async () => {
    vi.spyOn(academic, "transitionSession").mockRejectedValue(new ApiError(409, "SESSION_TEAM_INCOMPLETE", "Incomplete team"));
    const alice = {
      userId: "u1",
      displayName: "SV A",
      email: "a@x.edu",
      status: "passed",
      selectedRole: "frontend",
      attemptCount: 1,
      recruitedAt: null,
      hasActiveAssignment: false,
      activeProjectId: null,
      result: null,
    };
    let calls = 0;
    const selDeps = {
      search: vi.fn(async () => ({
        items: [alice],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      })),
      detail: vi.fn(async () => ({})),
      assign: vi.fn(async () => "as1"),
      cancel: vi.fn(async () => "as1"),
      listAssignments: vi.fn(async () => []),
      careers: vi.fn(async () => [{ code: 'frontend', label: 'Frontend Developer' }, { code: 'backend', label: 'Backend Developer' }]),
    };
    const getMembers = vi.fn(async () => {
      calls += 1;
      return calls === 1
        ? []
        : [{ userId: "u1", displayName: "SV A", email: "a@x.edu" }];
    });
    const getSlots = vi
      .fn()
      .mockResolvedValueOnce([
        { ...slots[0], filledCount: 0, members: [] },
        slots[1],
      ])
      .mockResolvedValue(slots);
    render(
      <SessionSetup
        sessionId="s1"
        projectId="p1"
        selectorDeps={selDeps}
        deps={{ ...deps, getMembers, getSlots }}
      />,
    );
    expect(await screen.findByText(/Thiết lập: K48/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Bắt đầu phiên" }));
    await screen.findByText("Chưa đủ thành viên cho các vai trò bắt buộc.");
    fireEvent.change(screen.getByLabelText(/tìm sinh viên/i), {
      target: { value: "sv" },
    });
    // Wait for the selector row itself (slot holders also contain "SV A").
    expect(
      await screen.findByText(/Frontend Developer · Đã đậu phỏng vấn/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Thêm" })[0]);
    // Notice survives the parent reload triggered by onChanged, and the
    // refreshed member list arrives in the same tree.
    expect(await screen.findByText(/đã phân công SV A/i)).toBeInTheDocument();
    expect(screen.queryByText("Chưa đủ thành viên cho các vai trò bắt buộc.")).not.toBeInTheDocument();
    expect((await screen.findAllByText("SV A")).length).toBeGreaterThanOrEqual(
      1,
    );
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
        deps={{
          ...deps,
          getSession: vi.fn(async () => ({ ...session, status: "active" })),
        }}
      />,
    );
    expect(
      await screen.findByText(/đang ở trạng thái đang hoạt động/i),
    ).toBeInTheDocument();
    await waitFor(() => expect(planDeps.list).toHaveBeenCalled());
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
    const btn = await screen.findByRole("button", { name: /bắt đầu phiên/i });
    expect(screen.getByText(/đội hình đã đủ điều kiện/i)).toBeInTheDocument();
    expect(btn).toBeEnabled();
  });
});
