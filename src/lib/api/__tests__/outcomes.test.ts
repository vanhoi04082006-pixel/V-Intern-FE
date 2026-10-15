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
      "/instructor/tasks/12345678-1234-1234-1234-123456789012",
    );
    expect(notificationLinkForRole(link, "admin")).toBe("/admin/tasks/12345678-1234-1234-1234-123456789012");
    expect(notificationLinkForRole("/admin/users", "intern")).toBeNull();
  });
  it.each(['instructor', 'admin'])('retains the actual %s task deep link while rejecting a foreign workspace', role => {
    const link = `/${role}/tasks/12345678-1234-1234-1234-123456789012`;
    expect(notificationLinkForRole(link, role)).toBe(link);
    expect(notificationLinkForRole(link, 'intern')).toBeNull();
  });
  it.each(['intern', 'instructor', 'admin'])('accepts uppercase SQL GUIDs in %s task notifications', role => {
    const id = 'B2D1F16A-D64E-48BA-853E-82BF28854FF4';
    const section = role === 'intern' ? 'work' : 'tasks';
    expect(notificationLinkForRole(`/${role}/${section}/${id}`, role)).toBe(`/${role}/${section}/${id}`);
  });
  it('keeps sharing and GitHub events in their existing instructor pages', () => {
    expect(notificationLinkForRole('/instructor/sharing', 'instructor')).toBe('/instructor/sharing');
    expect(notificationLinkForRole('/instructor/github', 'instructor')).toBe('/instructor/github');
    expect(notificationLinkForRole('/instructor/sharing', 'intern')).toBeNull();
  });
  it('preserves the own recruitment-result page without crossing workspace guards', () => {
    expect(notificationLinkForRole('/intern/onboarding/result', 'intern')).toBe('/intern/onboarding/result');
    expect(notificationLinkForRole('/intern/onboarding/result', 'instructor')).toBeNull();
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
      sessionName: "Session A",
      completedAt: "2026-10-15T08:00:00.000Z",
      issuedAt: "date",
      email: "private@example.test",
      userId: "secret",
      overallScore: 80,
    });
    expect(parsed).not.toHaveProperty("email");
    expect(parsed).not.toHaveProperty("userId");
    expect(parsed).not.toHaveProperty("overallScore");
    expect(parsed.sessionName).toBe('Session A');
    expect(parsed.completedAt).toBe('2026-10-15T08:00:00.000Z');
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
