import { describe, expect, it } from "vitest";
import { lifecyclePath, parseWorkspace } from "@/lib/api/workspace";
import { parsePage, string } from "@/lib/api/parse";
import { remainingSeconds } from "@/lib/api/recruitment";
import { active, blocked, interview, waiting } from "@/test/nest-fixtures";
describe("authoritative lifecycle boundary", () => {
  it.each([
    ["recruitment_required", "/intern/onboarding"],
    ["recruitment_in_progress", "/intern/onboarding/interview"],
    ["recruitment_failed", "/intern/onboarding/result"],
    ["unassigned", "/intern"],
    ["active", "/intern"],
  ] as const)("routes %s exhaustively", (status, target) =>
    expect(
      lifecyclePath(
        status === "active"
          ? active
          : status === "unassigned"
            ? waiting
            : blocked(status),
      ),
    ).toBe(target),
  );
  it("resumes selected role and pending evaluation", () => {
    expect(
      lifecyclePath({
        ...blocked("recruitment_required"),
        recruitment: {
          status: "role_selected",
          selectedRole: "qa",
          attemptCount: 0,
          recruitedAt: null,
        },
      }),
    ).toBe("/intern/onboarding/role");
    expect(
      lifecyclePath({
        ...blocked("recruitment_in_progress"),
        recruitment: {
          status: "evaluation_pending",
          selectedRole: "qa",
          attemptCount: 1,
          recruitedAt: null,
        },
      }),
    ).toBe("/intern/onboarding/result");
  });
  it("rejects unknown lifecycle rather than choosing Active", () =>
    expect(() => parseWorkspace({ ...waiting, status: "unknown" })).toThrow());
  it("rejects Active without passed recruitment", () =>
    expect(() => parseWorkspace({ ...active, recruitment: null })).toThrow());
  it("rejects business data leaked into Waiting", () =>
    expect(() =>
      parseWorkspace({ ...waiting, assignment: active.assignment }),
    ).toThrow());
  it("adapts Nest pagination only at the boundary", () =>
    expect(
      parsePage(
        {
          data: ["one"],
          meta: { page: 2, pageSize: 5, total: 6, totalPages: 2 },
        },
        string,
      ),
    ).toEqual({
      items: ["one"],
      page: 2,
      pageSize: 5,
      total: 6,
      totalPages: 2,
    }));
  it("timer uses backend remaining seconds despite client clock skew", () => {
    expect(remainingSeconds(interview.session, 12340)).toBe(588);
    expect(remainingSeconds(interview.session, 9999999)).toBe(0);
    expect(interview.session.status).toBe("in_progress");
  });
});
