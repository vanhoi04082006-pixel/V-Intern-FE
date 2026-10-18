import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemberSelector, ineligibilityReason, openRolesFor, slotRemaining } from "../member-selector";
import { clearSession, setSession } from "@/lib/auth/session";
const instructor = { id: "instructor1", displayName: "Instructor", email: "instructor@test.local", roles: ["instructor"], permissions: ["assignments.view", "assignments.manage", "recruitment.view"] };
beforeEach(() => setSession("test-token", instructor));
afterEach(clearSession);

const slots = [
  { roleCode: "frontend", requiredCount: 1, filledCount: 0 },
  { roleCode: "backend", requiredCount: 1, filledCount: 0 },
];

const alice = {
  userId: "u1", displayName: "SV A", email: "a@x.edu", status: "passed",
  selectedRole: "frontend", attemptCount: 1, recruitedAt: "2026-01-01",
  hasActiveAssignment: false, activeProjectId: null,
  result: { overallScore: 81, technicalScore: 85, softSkillScore: 72, englishScore: 74, strengths: ['React'], weaknesses: ['TypeScript'], decision: "passed", evaluatedAt: "2026-01-02" },
};
const bob = {
  ...alice, userId: "u2", displayName: "SV B", email: "b@x.edu", status: "failed", result: null,
};

function deps(over: Record<string, unknown> = {}) {
  return {
    search: vi.fn(async () => ({ items: [alice, bob], total: 2, page: 1, pageSize: 10, totalPages: 1 })),
    detail: vi.fn(async () => ({ result: { feedback: 'Có nền tảng tốt', strengths: ['React'], weaknesses: ['TypeScript'], criteria: [{ code: 'english', score: 74, feedback: 'Trao đổi rõ ràng' }] } })),
    assign: vi.fn(async () => "assign-1"),
    cancel: vi.fn(async () => "assign-1"),
    listAssignments: vi.fn(async () => []),
    ...over,
  };
}

describe("slot helpers (M4)", () => {
  it("computes remaining capacity without going negative", () => {
    expect(slotRemaining({ requiredCount: 2, filledCount: 0 })).toBe(2);
    expect(slotRemaining({ requiredCount: 1, filledCount: 3 })).toBe(0);
  });
  it("only offers open slots matching the passed interview role", () => {
    expect(openRolesFor(alice, slots)).toEqual(["frontend"]);
    expect(openRolesFor(alice, [{ ...slots[0], filledCount: 1 }, slots[1]])).toEqual([]);
    expect(openRolesFor(alice, [])).toEqual([]);
  });
});

describe("ineligibilityReason (M4)", () => {
  it("passes eligible interns and explains the rest", () => {
    expect(ineligibilityReason(alice)).toBeNull();
    expect(ineligibilityReason(bob)).toMatch(/PASSED/);
    expect(ineligibilityReason({ ...alice, hasActiveAssignment: true })).toMatch(/có assignment/i);
  });
});

describe("MemberSelector (M4)", () => {
  it('removes a roster member even when the eligible search correctly excludes assigned students', async () => {
    const d = deps({ search: vi.fn(async () => ({ items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 })), listAssignments: vi.fn(async () => [{ id: 'assigned-one', internId: 'u1', status: 'active' }]) });
    render(<MemberSelector sessionId="s1" projectId="p1" slots={slots} deps={d} members={[{ userId: 'u1', displayName: 'SV A', email: 'a@x.edu' }]} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Gỡ SV A khỏi phiên' }));
    await screen.findByText(/Đã gỡ SV A/);
    expect(d.listAssignments).toHaveBeenCalledWith('s1', undefined, 'u1');
    expect(d.cancel).toHaveBeenCalledWith('assigned-one');
  });
  it("hides assignment mutations when the instructor lacks manage permission", async () => {
    setSession("test-token", { ...instructor, permissions: ["assignments.view"] });
    render(<MemberSelector sessionId="s1" projectId="p1" slots={slots} deps={deps()} />);
    await screen.findByText("SV A");
    expect(screen.queryAllByRole("button", { name: "Thêm" })).toHaveLength(0);
    expect(screen.queryAllByRole("button", { name: "Gỡ" })).toHaveLength(0);
  });
  it("keeps the latest candidate detail when responses finish out of order", async () => {
    let resolveAlice!: (value: Record<string, unknown>) => void;
    const d = deps({ detail: vi.fn((id: string) => id === "u1" ? new Promise<Record<string, unknown>>(resolve => { resolveAlice = resolve; }) : Promise.resolve({ result: { feedback: "Bob interview" } })) });
    render(<MemberSelector sessionId="s1" projectId="p1" slots={slots} deps={d} />);
    await screen.findByText("SV A");
    fireEvent.click(screen.getAllByRole("button", { name: "Chi tiết" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Chi tiết" })[0]);
    await screen.findByText(/Bob interview/);
    await act(async () => resolveAlice({ result: { feedback: "Alice interview" } }));
    expect(screen.getByText(/Bob interview/)).toBeInTheDocument();
    expect(screen.queryByText(/Alice interview/)).not.toBeInTheDocument();
  });
  it("reports a failed removal preflight and leaves the assignment intact", async () => {
    const listAssignments = vi.fn().mockResolvedValueOnce([{ id: "as1", internId: "u1", status: "active" }]).mockRejectedValue(new Error("offline"));
    const d = deps({ listAssignments });
    render(<MemberSelector sessionId="s1" projectId="p1" slots={slots} deps={d} />);
    fireEvent.click(await screen.findByRole("button", { name: "Gỡ" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(d.cancel).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Gỡ" })).toBeEnabled();
  });
  it("searches server-side with scores and disables ineligible add", async () => {
    const d = deps();
    render(<MemberSelector sessionId="s1" projectId="p1" slots={slots} deps={d} />);
    expect(await screen.findByText("SV A")).toBeInTheDocument();
    expect(screen.getByText(/Tổng điểm 81/)).toBeInTheDocument();
    expect(screen.getByText(/Tiếng Anh 74/)).toBeInTheDocument();
    expect(d.search).toHaveBeenCalledTimes(1);
    expect(d.search).toHaveBeenCalledWith(expect.objectContaining({ eligibility: 'available' }), expect.any(AbortSignal));
    expect(screen.queryByLabelText('Lọc theo availability')).toBeNull();
    // Eligible Alice has an enabled add; failed Bob keeps a disabled one with reason.
    const addButtons = screen.getAllByRole("button", { name: "Thêm" });
    expect(addButtons).toHaveLength(2);
    expect(addButtons[0]).toBeEnabled();
    expect(addButtons[1]).toBeDisabled();
    expect(screen.getByText(/cần PASSED/)).toBeInTheDocument();
  });
  it("debounces typing into a single refetch", async () => {
    const d = deps();
    render(<MemberSelector sessionId="s1" projectId="p1" slots={slots} deps={d} />);
    expect(await screen.findByText("SV A")).toBeInTheDocument();
    const input = screen.getByLabelText(/tìm sinh viên/i);
    fireEvent.change(input, { target: { value: "x" } });
    fireEvent.change(input, { target: { value: "xy" } });
    expect(d.search).toHaveBeenCalledTimes(1);
  });
  it("expands interview detail on demand", async () => {
    const d = deps();
    render(<MemberSelector sessionId="s1" projectId="p1" slots={slots} deps={d} />);
    expect(await screen.findByText("SV A")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Chi tiết" })[0]);
    expect(await screen.findByText('Có nền tảng tốt')).toBeInTheDocument();
    expect(screen.getByText('Trao đổi rõ ràng')).toBeInTheDocument();
    expect(document.querySelector('pre')).toBeNull();
    expect(d.detail).toHaveBeenCalledWith("u1");
  });
  it("assigns with the recruited role slot so slots count the member", async () => {
    const d = deps();
    const changed = vi.fn();
    render(<MemberSelector sessionId="s1" projectId="p1" slots={slots} onChanged={changed} deps={d} />);
    expect(await screen.findByText("SV A")).toBeInTheDocument();
    // The role picker defaults to the recruited role when that slot is open.
    const picker = screen.getByLabelText("Vai trò cho SV A") as HTMLSelectElement;
    expect(picker.value).toBe("frontend");
    fireEvent.click(screen.getAllByRole("button", { name: "Thêm" })[0]);
    expect(await screen.findByText(/đã phân công SV A/i)).toBeInTheDocument();
    expect(d.assign).toHaveBeenCalledWith({ internId: "u1", projectId: "p1", sessionId: "s1", role: "frontend" });
    expect(changed).toHaveBeenCalled();
  });
  it("does not offer incompatible roles even when another slot is open", async () => {
    const d = deps();
    render(<MemberSelector sessionId="s1" projectId="p1" slots={slots} deps={d} />);
    expect(await screen.findByText("SV A")).toBeInTheDocument();
    expect(screen.getByLabelText("Vai trò cho SV A").querySelector('option[value="backend"]')).toBeNull();
    fireEvent.click(screen.getAllByRole("button", { name: "Thêm" })[0]);
    expect(await screen.findByText(/đã phân công SV A/i)).toBeInTheDocument();
    expect(d.assign).toHaveBeenCalledWith({ internId: "u1", projectId: "p1", sessionId: "s1", role: "frontend" });
  });
  it("blocks add when no slot remains and explains it", async () => {
    const full = [
      { roleCode: "frontend", requiredCount: 1, filledCount: 1 },
      { roleCode: "backend", requiredCount: 1, filledCount: 1 },
    ];
    const d = deps();
    render(<MemberSelector sessionId="s1" projectId="p1" slots={full} deps={d} />);
    expect(await screen.findByText("SV A")).toBeInTheDocument();
    const addButtons = screen.getAllByRole("button", { name: "Thêm" });
    expect(addButtons[0]).toBeDisabled();
    expect(addButtons[0].getAttribute("title")).toMatch(/không còn slot vai trò/i);
    expect(d.assign).not.toHaveBeenCalled();
  });
  it("removes an assigned intern through the active assignment", async () => {
    const d = deps({ listAssignments: vi.fn(async () => [{ id: "as1", internId: "u1", status: "active" }]) });
    render(<MemberSelector sessionId="s1" projectId="p1" slots={slots} deps={d} />);
    expect(await screen.findByText("SV A")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gỡ" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Gỡ" }));
    expect(await screen.findByText(/đã gỡ SV A/i)).toBeInTheDocument();
    expect(d.cancel).toHaveBeenCalledWith("as1");
  });
});
