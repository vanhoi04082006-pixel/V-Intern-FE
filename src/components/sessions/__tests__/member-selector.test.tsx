import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemberSelector, ineligibilityReason } from "../member-selector";

const alice = {
  userId: "u1", displayName: "SV A", email: "a@x.edu", status: "passed",
  selectedRole: "frontend", attemptCount: 1, recruitedAt: "2026-01-01",
  hasActiveAssignment: false, activeProjectId: null,
  result: { overallScore: 81, technicalScore: 85, softSkillScore: 72, decision: "passed", evaluatedAt: "2026-01-02" },
};
const bob = {
  ...alice, userId: "u2", displayName: "SV B", email: "b@x.edu", status: "failed", result: null,
};

function deps(over: Record<string, unknown> = {}) {
  return {
    search: vi.fn(async () => ({ items: [alice, bob], total: 2, page: 1, pageSize: 10, totalPages: 1 })),
    detail: vi.fn(async () => ({ scores: "ok" })),
    assign: vi.fn(async () => "assign-1"),
    cancel: vi.fn(async () => "assign-1"),
    listAssignments: vi.fn(async () => []),
    ...over,
  };
}

describe("ineligibilityReason (M4)", () => {
  it("passes eligible interns and explains the rest", () => {
    expect(ineligibilityReason(alice)).toBeNull();
    expect(ineligibilityReason(bob)).toMatch(/PASSED/);
    expect(ineligibilityReason({ ...alice, hasActiveAssignment: true })).toMatch(/có assignment/i);
  });
});

describe("MemberSelector (M4)", () => {
  it("searches server-side with scores and disables ineligible add", async () => {
    const d = deps();
    render(<MemberSelector sessionId="s1" projectId="p1" deps={d} />);
    expect(await screen.findByText("SV A")).toBeInTheDocument();
    expect(screen.getByText(/Overall 81/)).toBeInTheDocument();
    expect(d.search).toHaveBeenCalledTimes(1);
    // Eligible Alice has an enabled add; failed Bob keeps a disabled one with reason.
    const addButtons = screen.getAllByRole("button", { name: "Thêm" });
    expect(addButtons).toHaveLength(2);
    expect(addButtons[0]).toBeEnabled();
    expect(addButtons[1]).toBeDisabled();
    expect(screen.getByText(/cần PASSED/)).toBeInTheDocument();
  });
  it("debounces typing into a single refetch", async () => {
    const d = deps();
    render(<MemberSelector sessionId="s1" projectId="p1" deps={d} />);
    expect(await screen.findByText("SV A")).toBeInTheDocument();
    const input = screen.getByLabelText(/tìm sinh viên/i);
    fireEvent.change(input, { target: { value: "x" } });
    fireEvent.change(input, { target: { value: "xy" } });
    expect(d.search).toHaveBeenCalledTimes(1);
  });
  it("expands interview detail on demand", async () => {
    const d = deps();
    render(<MemberSelector sessionId="s1" projectId="p1" deps={d} />);
    expect(await screen.findByText("SV A")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Chi tiết" })[0]);
    expect(await screen.findByText(/scores/)).toBeInTheDocument();
    expect(d.detail).toHaveBeenCalledWith("u1");
  });
  it("adds an intern and notifies the parent", async () => {
    const d = deps();
    const changed = vi.fn();
    render(<MemberSelector sessionId="s1" projectId="p1" onChanged={changed} deps={d} />);
    expect(await screen.findByText("SV A")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Thêm" })[0]);
    expect(await screen.findByText(/đã phân công SV A/i)).toBeInTheDocument();
    expect(d.assign).toHaveBeenCalledWith({ internId: "u1", projectId: "p1", sessionId: "s1" });
    expect(changed).toHaveBeenCalled();
  });
  it("removes an assigned intern through the active assignment", async () => {
    const d = deps({ listAssignments: vi.fn(async () => [{ id: "as1", internId: "u1", status: "active" }]) });
    render(<MemberSelector sessionId="s1" projectId="p1" deps={d} />);
    expect(await screen.findByText("SV A")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gỡ" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Gỡ" }));
    expect(await screen.findByText(/đã gỡ SV A/i)).toBeInTheDocument();
    expect(d.cancel).toHaveBeenCalledWith("as1");
  });
});
