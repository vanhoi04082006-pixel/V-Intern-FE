import { describe, expect, it } from "vitest";
import { parseSessionOverview } from "../sessions";
import { parseSprint, taskProgress } from "../delivery";

const row = {
  id: "s1", code: "SS-1", name: "K48", status: "active",
  startDate: "2026-11-01", endDate: "2026-12-31",
  project: { id: "p1", code: "PRJ-1", name: "Shop", templateVersion: 2 },
  memberCount: 2, sprintCount: 1, taskTotal: 4, taskDone: 1, taskPercent: 25,
};

describe("session overview parsers (M6)", () => {
  it("parses aggregated rows with a project", () => {
    expect(parseSessionOverview(row)).toMatchObject({ id: "s1", memberCount: 2, taskPercent: 25 });
    expect(parseSessionOverview(row).project?.templateVersion).toBe(2);
  });
  it("parses sessions without a template project", () => {
    expect(parseSessionOverview({ ...row, project: null }).project).toBeNull();
  });
  it("rejects malformed rows fail-closed", () => {
    expect(() => parseSessionOverview({ ...row, taskTotal: "x" })).toThrow();
    expect(() => parseSessionOverview(null)).toThrow();
  });
  it("parses sprint summaries and task progress", () => {
    const sprint = parseSprint({
      id: "sp1", code: "S-1", name: "Sprint 1", goal: "Ship", status: "active",
      projectId: "p1", sessionId: "s1", startDate: null, endDate: null, progress: null,
    });
    expect(sprint).toMatchObject({ name: "Sprint 1", sessionId: "s1", progress: null });
    expect(taskProgress([{ status: "done" }, { status: "todo" }, { status: "review" }, { status: "done" }]))
      .toEqual({ done: 2, total: 4, percent: 50 });
    expect(taskProgress([])).toEqual({ done: 0, total: 0, percent: 0 });
  });
});
