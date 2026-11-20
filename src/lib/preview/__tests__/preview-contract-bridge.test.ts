import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * CONTRACT BRIDGE: mọi endpoint mock phải đi qua request() THẬT của app
 * (client.ts → apiFetch → previewFetch → router) và parser fail-closed của
 * từng module — đúng đường mà trang dùng trong browser. Test này là rào chặn
 * "shape trông có vẻ đúng nhưng items()/parsePage() từ chối" (bug từng xảy ra
 * với kpi/evaluations/certificates/notifications khi mới dựng preview).
 */
beforeEach(() => {
  window.sessionStorage.clear();
});

async function withPreview<T>(fn: () => Promise<T>): Promise<T> {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_PREVIEW", "1");
  vi.stubEnv("NODE_ENV", "test");
  try {
    return await fn();
  } finally {
    vi.unstubAllEnvs();
    vi.resetModules();
  }
}

/** Kỳ vọng: gọi thành công KHÔNG ném (parser chấp nhận shape mock). */
async function expectOk(label: string, run: () => Promise<unknown>) {
  const err = await run().then(
    () => null,
    (e) => e as unknown,
  );
  expect(err, `${label} phải parse được shape mock`).toBeNull();
}

describe("Preview mock qua request() + parser thật của từng trang", () => {
  it("nhóm intern: workspace, outcomes, work board, participation, mentor", async () => {
    await withPreview(async () => {
      const outcomes = await import("@/lib/api/outcomes");
      const work = await import("@/lib/api/work");
      const participation = await import("@/lib/api/participation");
      const mentor = await import("@/lib/api/mentor");
      const workspace = await import("@/lib/api/workspace");
      const query = new URLSearchParams("page=1&pageSize=20");

      await expectOk("getWorkspace", () => workspace.getWorkspace());
      await expectOk("fetchUnreadCount", () => outcomes.fetchUnreadCount());
      await expectOk("getSalary", () => outcomes.getSalary());
      await expectOk("getLedger", () => outcomes.getLedger(1));
      await expectOk("getKpis", () => outcomes.getKpis());
      await expectOk("getKpi", () => outcomes.getKpi("kpi-2026-10"));
      await expectOk("getNotifications", () => outcomes.getNotifications(1, false));
      await expectOk("getNotificationPreferences", () => outcomes.getNotificationPreferences());
      await expectOk("getEvaluations", () => outcomes.getEvaluations());
      await expectOk("getEvaluation", () => outcomes.getEvaluation("ev-2026-mid"));
      await expectOk("getPerformance", () => outcomes.getPerformance());
      await expectOk("getCertificates", () => outcomes.getCertificates());
      await expectOk("getCertificate", () => outcomes.getCertificate("cert-01"));
      await expectOk("verifyCertificate", () =>
        outcomes.verifyCertificate("VC-2026-000123-XK4T"));
      await expectOk("getRecommendations", () => outcomes.getRecommendations());
      await expectOk("getOwnBoard", () => work.getOwnBoard());
      await expectOk("getOwnSprintBoard", () => work.getOwnSprintBoard("sp-03"));
      await expectOk("getOwnSprints", () => work.getOwnSprints(1));
      await expectOk("getOwnProject", () => work.getOwnProject());
      await expectOk("listTasks", () => work.listTasks(query));
      await expectOk("getTask", () => work.getTask("ts-20"));
      await expectOk("getComments", () => work.getComments("ts-20"));
      await expectOk("getHistory", () => work.getHistory("ts-20"));
      await expectOk("getSprintCompletion", () => work.getSprintCompletion("sp-03"));
      await expectOk("ownParticipation", () => participation.ownParticipation(1));
      await expectOk("listConversations", () => mentor.listConversations(1, "active"));
      await expectOk("getConversation", () => mentor.getConversation("mc-1"));
    });
  });

  it("nhóm admin/instructor: dashboard + users/roles/groups/audit/activity", async () => {
    await withPreview(async () => {
      const dash = await import("@/lib/api/dashboard");
      const admin = await import("@/lib/api/admin");
      await expectOk("getAdminDashboard", () => dash.getAdminDashboard());
      await expectOk("getInstructorDashboard", () => dash.getInstructorDashboard());
      await expectOk("listUsers", () => admin.listUsers(1, "", ""));
      await expectOk("listRoles", () => admin.listRoles(1));
      await expectOk("listGroups", () => admin.listGroups(1, ""));
      await expectOk("listAudits", () => admin.listAudits(1, {}));
      await expectOk("listActivity", () => admin.listActivity(1, {}));
    });
  });

  it("scenario empty vẫn parse được (empty state thay vì crash)", async () => {
    await withPreview(async () => {
      const { setPreviewScenario } = await import("../store");
      setPreviewScenario("empty");
      const outcomes = await import("@/lib/api/outcomes");
      await expectOk("getEvaluations (empty)", () => outcomes.getEvaluations());
      await expectOk("getKpis (empty)", () => outcomes.getKpis());
      await expectOk("getNotifications (empty)", () => outcomes.getNotifications(1, false));
      await expectOk("getCertificates (empty)", () => outcomes.getCertificates());
      const work = await import("@/lib/api/work");
      await expectOk("getOwnBoard (empty)", () => work.getOwnBoard());
      await expectOk("listTasks (empty)", () =>
        work.listTasks(new URLSearchParams("page=1&pageSize=20")));
    });
  });

  it("scenario large: phân trang đúng meta", async () => {
    await withPreview(async () => {
      const { setPreviewScenario } = await import("../store");
      setPreviewScenario("large");
      const outcomes = await import("@/lib/api/outcomes");
      const page1 = await outcomes.getNotifications(1, false);
      expect(page1.items).toHaveLength(20);
      expect(page1.total).toBeGreaterThan(100);
      expect(page1.totalPages).toBeGreaterThan(5);
    });
  });
});
