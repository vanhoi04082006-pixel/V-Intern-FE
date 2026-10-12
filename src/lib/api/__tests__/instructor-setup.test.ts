import { describe, expect, it, vi } from "vitest";
import {
  activateAcademic,
  canActivate,
  deriveChecklist,
  type ChecklistInput,
} from "../instructor-setup";

const empty: ChecklistInput = {
  sessionCount: 0,
  projectsTotal: 0,
  projectsActive: 0,
  internCount: 0,
  sprintCount: 0,
  taskCount: 0,
};

describe("deriveChecklist", () => {
  it("marks every step undone for a blank instructor", () => {
    const steps = deriveChecklist(empty);
    expect(steps).toHaveLength(5);
    expect(steps.every((s) => !s.done)).toBe(true);
    expect(steps.map((s) => s.key)).toEqual([
      "session",
      "project",
      "assign",
      "sprint",
      "task",
    ]);
  });
  it("ticks steps from real counts only", () => {
    const steps = deriveChecklist({
      ...empty,
      sessionCount: 2,
      projectsTotal: 3,
      projectsActive: 1,
      internCount: 4,
      sprintCount: 1,
      taskCount: 7,
    });
    expect(steps.every((s) => s.done)).toBe(true);
  });
  it("requires an ACTIVE project, not just any project", () => {
    const steps = deriveChecklist({ ...empty, projectsTotal: 2 });
    expect(steps.find((s) => s.key === "project")?.done).toBe(false);
  });
});

describe("activateAcademic", () => {
  it("patches status to active and nothing else", async () => {
    const patch = vi.fn(async () => ({ status: "active" }));
    const out = await activateAcademic("projects", "p1", { patch });
    expect(patch).toHaveBeenCalledWith("projects", "p1", {
      status: "active",
    });
    expect(out.status).toBe("active");
  });
  it("propagates backend domain errors untouched", async () => {
    const patch = vi.fn(async () => {
      throw Object.assign(new Error("capacity full"), { code: "X" });
    });
    await expect(
      activateAcademic("projects", "p1", { patch }),
    ).rejects.toThrow("capacity full");
  });
  it("calls patch exactly once even when retried rapidly (caller guards busy)", async () => {
    let calls = 0;
    const patch = vi.fn(async () => {
      calls += 1;
      return { status: "active" };
    });
    await activateAcademic("projects", "p1", { patch });
    expect(calls).toBe(1);
  });
  it("activates sprints through the state-machine transition, not PATCH", async () => {
    const patch = vi.fn();
    const transition = vi.fn(async () => ({ status: "active" }));
    const out = await activateAcademic("sprints", "s1", { patch, transition });
    expect(transition).toHaveBeenCalledWith("s1", "active");
    expect(patch).not.toHaveBeenCalled();
    expect(out.status).toBe("active");
  });
});

describe("canActivate", () => {
  it.each([
    ["projects", "draft", true],
    ["projects", "recruiting", true],
    ["projects", "active", false],
    ["projects", "archived", false],
    ["sessions", "upcoming", true],
    ["sessions", "active", false],
    ["sessions", "completed", false],
    // CT-002: BE machine forbids ending→active and sessions have no paused state.
    ["sessions", "ending", false],
    ["sessions", "paused", false],
    ["sprints", "planned", true],
    ["sprints", "active", false],
    ["sprints", "completed", false],
  ] as const)("canActivate(%s, %s) = %s", (kind, status, expected) => {
    expect(canActivate(kind, status)).toBe(expected);
  });
});
