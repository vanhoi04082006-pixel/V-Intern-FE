import { describe, expect, it } from "vitest";
import { parsePlanDetail, parsePlanSummary } from "../planning";

const detailPayload = {
  planId: "pl1",
  projectId: "p1",
  sessionId: "s1",
  templateVersion: 2,
  status: "ready",
  createdAt: "2026-11-02T00:00:00.000Z",
  draft: {
    sprints: [
      {
        code: "S1",
        name: "Foundation",
        goal: "Setup",
        startDate: "2026-11-01T00:00:00.000Z",
        endDate: "2026-11-14T00:00:00.000Z",
        tasks: [
          { title: "Auth API", description: "JWT flow", priority: "high", storyPoints: 5, dueDate: "2026-11-05T00:00:00.000Z", suggestedRole: "backend", assigneeId: "u2" },
          { title: "No role", description: null, priority: "medium", storyPoints: null, dueDate: null, suggestedRole: null, assigneeId: null },
        ],
      },
    ],
  },
  warnings: [{ taskTitle: "No role", message: "Chưa gán người thực hiện." }],
  error: null,
  deduped: false,
};

describe("plan parsers (M5)", () => {
  it("parses the list shape with counts", () => {
    expect(
      parsePlanSummary({
        planId: "pl1", projectId: "p1", sessionId: "s1", templateVersion: 2,
        status: "ready", createdAt: "2026-11-02T00:00:00.000Z",
        sprintCount: 1, taskCount: 2, hasDraft: true,
      }),
    ).toMatchObject({ planId: "pl1", sprintCount: 1, taskCount: 2, hasDraft: true });
  });

  it("parses the detail shape, which omits list-only counts", () => {
    const parsed = parsePlanDetail(detailPayload);
    expect(parsed.status).toBe("ready");
    expect(parsed.sprintCount).toBeNull();
    expect(parsed.taskCount).toBeNull();
    expect(parsed.hasDraft).toBe(false);
    expect(parsed.draft?.sprints).toHaveLength(1);
    expect(parsed.draft?.sprints[0]?.tasks).toHaveLength(2);
    expect(parsed.warnings).toHaveLength(1);
    expect(parsed.deduped).toBe(false);
  });

  it("keeps counts when a payload carries both shapes", () => {
    const parsed = parsePlanDetail({ ...detailPayload, sprintCount: 1, taskCount: 2, hasDraft: true });
    expect(parsed).toMatchObject({ sprintCount: 1, taskCount: 2, hasDraft: true });
  });

  it("tolerates a null draft (failed generations)", () => {
    const parsed = parsePlanDetail({ ...detailPayload, status: "failed", draft: null, error: { code: "AI_UNAVAILABLE" } });
    expect(parsed.draft).toBeNull();
    expect(parsed.error).toMatchObject({ code: "AI_UNAVAILABLE" });
  });

  it("rejects malformed payloads fail-closed", () => {
    expect(() => parsePlanDetail({ ...detailPayload, planId: 12 })).toThrow();
    expect(() => parsePlanDetail(null)).toThrow();
  });
});
