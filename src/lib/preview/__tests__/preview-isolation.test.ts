import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * ISOLATION PREVIEW (Section 10.2): chứng minh bằng test tự động rằng
 * mock chỉ hoạt động khi build-time flag mở; không flag → apiFetch giữ nguyên
 * hành vi thật (thậm chí không thử gọi transport preview).
 */
describe("Preview isolation", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("PREVIEW_ENABLED = false khi không đặt NEXT_PUBLIC_PREVIEW (mặc định test)", async () => {
    const { PREVIEW_ENABLED } = await import("../enabled");
    expect(PREVIEW_ENABLED).toBe(false);
  });

  it("PREVIEW_ENABLED = true chỉ khi cả flag mở và NODE_ENV không phải production", async () => {
    vi.stubEnv("NEXT_PUBLIC_PREVIEW", "1");
    vi.stubEnv("NODE_ENV", "development");
    const { PREVIEW_ENABLED } = await import("../enabled");
    expect(PREVIEW_ENABLED).toBe(true);
  });

  it("NODE_ENV=production luôn tắt preview dù flag bị đặt nhầm", async () => {
    vi.stubEnv("NEXT_PUBLIC_PREVIEW", "1");
    vi.stubEnv("NODE_ENV", "production");
    const { PREVIEW_ENABLED } = await import("../enabled");
    expect(PREVIEW_ENABLED).toBe(false);
  });

  it("không flag → apiFetch không đi vào transport preview (giữ lỗi cấu hình thật)", async () => {
    const { apiFetch } = await import("@/lib/auth/api-client");
    await expect(apiFetch("/auth/me")).rejects.toMatchObject({
      code: "API_CONFIG_MISSING",
      name: "ApiError",
    });
  });

  it("có flag → apiFetch đi qua transport preview và trả dữ liệu mock", async () => {
    vi.stubEnv("NEXT_PUBLIC_PREVIEW", "1");
    vi.stubEnv("NODE_ENV", "test");
    const { apiFetch } = await import("@/lib/auth/api-client");
    const data = await apiFetch("/auth/me");
    expect(data).toMatchObject({
      roles: expect.arrayContaining(["intern"]),
      displayName: expect.any(String),
    });
  });

  it("URL parameter/localStorage không thể bật preview khi flag đóng", async () => {
    // Giả lập việc nhét flag vào localStorage/sessionStorage từ client.
    window.localStorage.setItem("NEXT_PUBLIC_PREVIEW", "1");
    window.sessionStorage.setItem("NEXT_PUBLIC_PREVIEW", "1");
    const { PREVIEW_ENABLED } = await import("../enabled");
    expect(PREVIEW_ENABLED).toBe(false);
    const { apiFetch } = await import("@/lib/auth/api-client");
    await expect(apiFetch("/dashboard/admin")).rejects.toMatchObject({
      code: "API_CONFIG_MISSING",
    });
  });

  it("isApiConfigured() coi preview như đã cấu hình khi gate mở", async () => {
    vi.stubEnv("NEXT_PUBLIC_PREVIEW", "1");
    vi.stubEnv("NODE_ENV", "test");
    const { isApiConfigured } = await import("@/lib/auth/api-client");
    expect(isApiConfigured()).toBe(true);
    vi.unstubAllEnvs();
    vi.resetModules();
    const offline = await import("@/lib/auth/api-client");
    expect(offline.isApiConfigured()).toBe(false);
  });
});

describe("Preview store (scenario/account)", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.resetModules();
    vi.unstubAllEnvs();
    // Store chỉ ghi khi gate mở — bật flag cho cả nhóm này.
    vi.stubEnv("NEXT_PUBLIC_PREVIEW", "1");
    vi.stubEnv("NODE_ENV", "test");
  });

  it("mặc định: scenario populated, chưa chọn tài khoản", async () => {
    const store = await import("../store");
    expect(store.currentScenario()).toBe("populated");
    expect(store.currentAccountId()).toBeNull();
  });

  it("đổi tài khoản + kịch bản được ghi lại và đọc lại đúng", async () => {
    const store = await import("../store");
    store.setPreviewAccount("pv-admin-1");
    store.setPreviewScenario("error");
    expect(store.currentAccountId()).toBe("pv-admin-1");
    expect(store.currentScenario()).toBe("error");
    // Sau reload module (đọc lại từ sessionStorage như tab mới), vẫn giữ lựa chọn.
    vi.resetModules();
    const fresh = await import("../store");
    expect(fresh.currentAccountId()).toBe("pv-admin-1");
    expect(fresh.currentScenario()).toBe("error");
  });

  it("kịch bản lạ bị từ chối (không fallback mù)", async () => {
    window.sessionStorage.setItem(
      "vintern-preview-state",
      JSON.stringify({ account: "pv-intern-1", scenario: "hacked" }),
    );
    const store = await import("../store");
    expect(store.currentScenario()).toBe("populated");
    expect(store.currentAccountId()).toBeNull();
  });

  it("reset xóa trạng thái đã chọn", async () => {
    const store = await import("../store");
    store.setPreviewAccount("pv-intern-2");
    store.setPreviewScenario("large");
    store.resetPreviewState();
    expect(store.currentScenario()).toBe("populated");
    expect(store.currentAccountId()).toBeNull();
  });
});
