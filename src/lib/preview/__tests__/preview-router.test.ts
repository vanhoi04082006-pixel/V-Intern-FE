import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/auth/api-client";
import { parseWorkspace } from "@/lib/api/workspace";
import {
  parseSalary,
  parseKpi,
  parseEvaluation,
  parseCertificate,
  parsePerformance,
} from "@/lib/api/outcomes";

/**
 * ROUTER + TRANSPORT PREVIEW: dữ liệu mock phải đi qua đúng parser fail-closed
 * của repo — nếu shape sai, parser ném lỗi và test fail ngay (không thể giả
 * "trông có vẻ đầy đủ"). Đây là ràng buộc trung thực của Section 10.
 */
async function withPreview<T>(fn: () => Promise<T>): Promise<T> {
  window.sessionStorage.clear();
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

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("Preview transport + scenarios", () => {
  it("login demo đúng mật khẩu → LoginSuccessBody; sai → 401", async () => {
    await withPreview(async () => {
      const { previewFetch } = await import("../transport");
      const ok = (await previewFetch("/auth/login", {
        method: "POST",
        body: { email: "sinhvien1@vintern.preview", password: "Preview@12345" },
      })) as { accessToken: string; user: { roles: string[] } };
      expect(ok.accessToken).toContain("pv-intern-1");
      expect(ok.user.roles).toEqual(["intern"]);
      await expect(
        previewFetch("/auth/login", {
          method: "POST",
          body: { email: "sinhvien1@vintern.preview", password: "sai" },
        }),
      ).rejects.toMatchObject({ statusCode: 401 });
    });
  });

  it("workspace pv-intern-1 đi qua parser fail-closed của FE", async () => {
    await withPreview(async () => {
      const { previewFetch } = await import("../transport");
      const raw = await previewFetch("/intern/me/workspace", { token: null });
      const parsed = parseWorkspace(raw);
      expect(parsed.status).toBe("active");
      expect(parsed.taskSummary.total).toBe(24);
      expect(parsed.currentSprint?.code).toBe("SP-03");
    });
  });

  it("workspace pv-intern-3 (mới) → recruitment_required như BE thật", async () => {
    await withPreview(async () => {
      const { setPreviewAccount } = await import("../store");
      setPreviewAccount("pv-intern-3");
      const { previewFetch } = await import("../transport");
      const parsed = parseWorkspace(
        await previewFetch("/intern/me/workspace", { token: null }),
      );
      expect(parsed.status).toBe("recruitment_required");
      expect(parsed.recruitment?.selectedRole).toBeNull();
    });
  });

  it("dashboard admin + instructor qua parser dashboard thật", async () => {
    await withPreview(async () => {
      // Import động SAU khi resetModules + stubEnv: api-client mới thấy
      // PREVIEW_ENABLED=true (instance static ở đầu file giữ gate đóng).
      const { getAdminDashboard } = await import("@/lib/api/dashboard");
      const { setPreviewAccount } = await import("../store");
      const { previewFetch } = await import("../transport");
      setPreviewAccount("pv-admin-1");
      const dash = await getAdminDashboard();
      expect(dash.metrics.userCount).toBeGreaterThan(0);
      expect(dash.roles.map((r) => r.code)).toEqual([
        "admin",
        "instructor",
        "intern",
      ]);
      setPreviewAccount("pv-inst-1");
      const raw = await previewFetch("/dashboard/instructor", { token: null });
      expect(raw).toMatchObject({ metrics: { sessionCount: 3 } });
    });
  });

  it("salary + kpi + evaluations + certificates đi qua parser outcomes thật", async () => {
    await withPreview(async () => {
      const { previewFetch } = await import("../transport");
      const salary = parseSalary(
        await previewFetch("/intern/me/virtual-salary", { token: null }),
      );
      expect(salary.virtual).toBe(true);
      expect(salary.balance).toBeGreaterThan(0);
      const kpis = ((await previewFetch("/intern/me/kpi", {
        token: null,
      })) as { items: unknown[] }).items;
      kpis.forEach((k) => {
        expect(() => parseKpi(k)).not.toThrow();
      });
      const evals = ((await previewFetch("/intern/me/evaluations", {
        token: null,
      })) as { items: unknown[] }).items;
      evals.forEach((e) => {
        expect(() => parseEvaluation(e)).not.toThrow();
      });
      const certs = ((await previewFetch("/intern/me/certificates", {
        token: null,
      })) as { items: unknown[] }).items;
      certs.forEach((c) => {
        expect(() => parseCertificate(c)).not.toThrow();
      });
      const perf = await previewFetch("/intern/me/performance", { token: null });
      expect(() => parsePerformance(perf)).not.toThrow();
    });
  });

  it("notifications: đánh dấu đã đọc cập nhật count (stateful nhất quán)", async () => {
    await withPreview(async () => {
      const { previewFetch } = await import("../transport");
      const before = (await previewFetch("/notifications/unread-count", {
        token: null,
      })) as { count: number };
      expect(before.count).toBeGreaterThan(0);
      const updated = (await previewFetch("/notifications/read-all", {
        method: "POST",
        token: null,
      })) as { updated: number };
      expect(updated.updated).toBe(before.count);
      const after = (await previewFetch("/notifications/unread-count", {
        token: null,
      })) as { count: number };
      expect(after.count).toBe(0);
    });
  });

  it("endpoint chưa mock → 501 PREVIEW_ENDPOINT_NOT_MOCKED (không bịa)", async () => {
    await withPreview(async () => {
      const { previewFetch } = await import("../transport");
      await expect(
        previewFetch("/admin/users?query=chưa-mock", { token: null }),
      ).rejects.toMatchObject({ code: "PREVIEW_ENDPOINT_NOT_MOCKED" });
    });
  });

  it.each([
    ["error", 500, "PREVIEW_FORCED_ERROR"],
    ["forbidden", 403, "FORBIDDEN"],
    ["network", 0, "NETWORK_ERROR"],
  ] as const)(
    "scenario %s được áp lên mọi request dữ liệu",
    async (scenario, statusCode, code) => {
      await withPreview(async () => {
        const { setPreviewScenario } = await import("../store");
        setPreviewScenario(scenario);
        const { previewFetch } = await import("../transport");
        await expect(
          previewFetch("/intern/me/workspace", { token: null }),
        ).rejects.toMatchObject({ statusCode, code });
      });
    },
  );

  it("scenario unauthorized: 401 cả refresh → app sẽ clearSession đúng luồng", async () => {
    await withPreview(async () => {
      const { setPreviewScenario } = await import("../store");
      setPreviewScenario("unauthorized");
      const { previewFetch } = await import("../transport");
      await expect(
        previewFetch("/auth/refresh", { method: "POST" }),
      ).rejects.toMatchObject({ statusCode: 401 });
      // Login vẫn hoạt động để có thể quay lại demo.
      const ok = await previewFetch("/auth/login", {
        method: "POST",
        body: { email: "admin@vintern.preview", password: "Preview@12345" },
      });
      expect(ok).toMatchObject({ accessToken: expect.any(String) });
    });
  });

  it("scenario validation: GET giữ dữ liệu, POST bị 422 kèm details", async () => {
    await withPreview(async () => {
      const { setPreviewScenario } = await import("../store");
      setPreviewScenario("validation");
      const { previewFetch } = await import("../transport");
      const got = await previewFetch("/intern/me/workspace", { token: null });
      expect(got).toBeDefined();
      const err = (await previewFetch("/notifications/read-all", {
        method: "POST",
        token: null,
      }).catch((e) => e)) as ApiError;
      expect(err.statusCode).toBe(422);
      expect(Array.isArray(err.details)).toBe(true);
    });
  });

  it("scenario empty: danh sách rỗng, số liệu 0 — dùng được cho empty state", async () => {
    await withPreview(async () => {
      const { setPreviewScenario } = await import("../store");
      setPreviewScenario("empty");
      const { previewFetch } = await import("../transport");
      const evals = (await previewFetch("/intern/me/evaluations", {
        token: null,
      })) as { items: unknown[] };
      expect(evals.items).toEqual([]);
      const dash = (await previewFetch("/dashboard/admin", { token: null })) as {
        metrics: { userCount: number };
        users: unknown[];
      };
      expect(dash.metrics.userCount).toBe(0);
      expect(dash.users).toEqual([]);
    });
  });

  it("scenario large: 120 thông báo phân trang theo pageSize", async () => {
    await withPreview(async () => {
      const { setPreviewScenario } = await import("../store");
      setPreviewScenario("large");
      const { previewFetch } = await import("../transport");
      const page1 = (await previewFetch(
        "/notifications?page=1&pageSize=20",
        { token: null },
      )) as { data: unknown[]; meta: { total: number; totalPages: number } };
      expect(page1.meta.total).toBeGreaterThan(100);
      expect(page1.data).toHaveLength(20);
      expect(page1.meta.totalPages).toBeGreaterThan(5);
    });
  });

  it("verify chứng nhận public: mã hợp lệ và mã lạ", async () => {
    await withPreview(async () => {
      const { previewFetch } = await import("../transport");
      const ok = (await previewFetch("/certificates/verify/VC-2026-000123-XK4T", {
        token: null,
      })) as { valid: boolean; status: string };
      expect(ok.valid).toBe(true);
      expect(ok.status).toBe("issued");
      await expect(
        previewFetch("/certificates/verify/VC-KHONG-TON-TAI", { token: null }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
