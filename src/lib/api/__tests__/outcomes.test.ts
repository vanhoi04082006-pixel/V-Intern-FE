import { describe, expect, it } from "vitest";
import {
  parsePerformance,
  parseSalary,
  parseVerification,
  parseKpi,
  safeNotificationLink,
  parsePreferences,
  notificationLinkForRole,
} from "../outcomes";
describe("Outcome truth boundaries", () => {
  it("maps task notices into the current workspace without crossing role guards", () => {
    const link = "/intern/tasks/12345678-1234-1234-1234-123456789012";
    expect(notificationLinkForRole(link, "instructor")).toBe(
      "/instructor/sprints",
    );
    expect(notificationLinkForRole(link, "admin")).toBe("/admin/tasks");
    expect(notificationLinkForRole("/admin/users", "intern")).toBeNull();
  });
  it("rejects allowed-looking paths when the actual workspace route does not exist", () => {
    expect(
      notificationLinkForRole("/instructor/work", "instructor"),
    ).toBeNull();
    expect(
      notificationLinkForRole(
        "/admin/users/12345678-1234-1234-1234-123456789012",
        "admin",
      ),
    ).toBeNull();
  });
  it("preserves disabled notification preferences without coercing string booleans", () => {
    expect(
      parsePreferences({ preferences: [{ category: "task", enabled: false }] }),
    ).toEqual([{ category: "task", enabled: false }]);
    expect(() =>
      parsePreferences({
        preferences: [{ category: "task", enabled: "false" }],
      }),
    ).toThrow();
  });
  it("rejects unknown notification category instead of inventing a preference", () => {
    expect(() =>
      parsePreferences({ preferences: [{ category: "fake", enabled: true }] }),
    ).toThrow();
  });
  it.each([
    ["/intern/me/certificates", "/intern/certificates"],
    ["/intern/me/kpi", "/intern/kpi"],
    [
      "/intern/assignments/12345678-1234-1234-1234-123456789012",
      "/intern/project",
    ],
    [
      "/intern/tasks/12345678-1234-1234-1234-123456789012",
      "/intern/work/12345678-1234-1234-1234-123456789012",
    ],
  ])("maps Backend notification %s to a functional UI", (source, target) =>
    expect(safeNotificationLink(source)).toBe(target),
  );
  it.each([
    "/intern/nonexistent",
    "/intern/work/../admin",
    "/intern/%2f%2fevil.test",
  ])("rejects unknown notification route %s", (source) =>
    expect(safeNotificationLink(source)).toBeNull(),
  );
  it("preserves unavailable metrics", () => {
    const p = parsePerformance({
      metrics: {
        totalTaskCount: 0,
        completedTaskCount: 0,
        taskCompletionRate: null,
        committedStoryPoints: 0,
        completedStoryPoints: 0,
        storyPointCompletionRate: null,
        onTimeCompletionRate: null,
        overdueOpenTaskCount: 0,
        averageEvaluationScore: null,
        finalizedEvaluationCount: 0,
        activeSprintProgress: null,
      },
    });
    expect(p.taskCompletionRate).toBeNull();
    expect(p.averageEvaluationScore).toBeNull();
  });
  it("rejects missing metrics rather than invent zero", () =>
    expect(() => parsePerformance({ metrics: {} })).toThrow());
  it("requires virtual salary flag", () =>
    expect(() =>
      parseSalary({
        balance: 1000,
        unit: "VND",
        virtual: false,
        earnedThisPeriod: 1000,
        latestEntries: [],
      }),
    ).toThrow());
  it("preserves legitimate zero balance", () =>
    expect(
      parseSalary({
        balance: 0,
        unit: "VND_VIRTUAL",
        virtual: true,
        earnedThisPeriod: 0,
        latestEntries: [],
      }).balance,
    ).toBe(0));
  it("never carries private verification fields", () => {
    const parsed = parseVerification({
      valid: true,
      status: "issued",
      certificateNumber: "C1",
      holderName: "Nguyễn A",
      role: "backend",
      projectName: "P",
      issuedAt: "date",
      email: "private@example.test",
      userId: "secret",
      overallScore: 80,
    });
    expect(parsed).not.toHaveProperty("email");
    expect(parsed).not.toHaveProperty("userId");
    expect(parsed).not.toHaveProperty("overallScore");
  });
  it("rejects inconsistent revoked certificate", () =>
    expect(() =>
      parseVerification({
        valid: true,
        status: "revoked",
        certificateNumber: "C1",
        holderName: null,
        role: null,
        projectName: null,
        issuedAt: "date",
        revokedAt: "date",
      }),
    ).toThrow());
  it("keeps insufficient KPI data null", () =>
    expect(
      parseKpi({
        id: "k",
        ruleVersion: "kpi-v1",
        status: "insufficient_data",
        finalScore: null,
        calculatedAt: "date",
      }).finalScore,
    ).toBeNull());
  it.each([
    "https://evil.test",
    "//evil.test",
    "javascript:alert(1)",
    "/api/v1/auth/logout",
  ])("blocks unsafe notification link %s", (link) =>
    expect(safeNotificationLink(link)).toBeNull(),
  );
  it("allows known internal workspace routes", () =>
    expect(safeNotificationLink("/intern/work?task=VIN-1")).toBe(
      "/intern/work?task=VIN-1",
    ));
});
