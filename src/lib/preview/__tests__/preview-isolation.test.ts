import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * ISOLATION PREVIEW (Section 10.2): chứng minh bằng test tự động rằng
 * mock chỉ hoạt động khi build-time flag mở; không flag → apiFetch giữ nguyên
 * hành vi thật (thậm chí không thử gọi transport preview).
 *
 * QUY TẮC CÔ LẬP MÔI TRƯỜNG ĐẦU VÀO (fix run 44822285512):
 * CI thường không đặt NEXT_PUBLIC_API_BASE_URL, nhưng full-stack gate
 * (phase7-fullstack.yml) đặt job-level NEXT_PUBLIC_API_BASE_URL cho
 * Real-Backend E2E và chạy `npm test` TRƯỚC khi boot Nest. Các test ở đây
 * không được phụ thuộc biến ambient của runner — mọi test phải tự pin
 * trạng thái cấu hình API mà nó muốn kiểm chứng, và phải cho cùng kết quả
 * trong cả hai cấu hình (có/không có NEXT_PUBLIC_API_BASE_URL ambient).
 */
describe("Preview isolation", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    vi.resetModules();
    vi.unstubAllEnvs();
    // Mặc định của khối: môi trường “chưa cấu hình API” (base URL rỗng).
    // vi.unstubAllEnvs trả lại giá trị ambient (full-stack CI có sẵn
    // http://localhost:8080/api/v1) nên phải pin lại sau khi unstub.
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");
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
    // Base URL vẫn rỗng (pin ở beforeEach) — gate mở phải đủ để coi như configured.
    const { isApiConfigured } = await import("@/lib/auth/api-client");
    expect(isApiConfigured()).toBe(true);
    // Đóng gate lại nhưng GIỮ đầu vào đã pin (không dùng unstubAllEnvs vì
    // nó trả về biến ambient của runner — chính là bug run 44822285512).
    vi.stubEnv("NEXT_PUBLIC_PREVIEW", "0");
    vi.resetModules();
    const offline = await import("@/lib/auth/api-client");
    expect(offline.isApiConfigured()).toBe(false);
    // Hợp đồng ngược: gate đóng + base URL có sẵn (đúng như full-stack CI)
    // phải coi như configured — E2E thật được phép chạy trong môi trường đó.
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:8080/api/v1");
    vi.resetModules();
    const live = await import("@/lib/auth/api-client");
    expect(live.isApiConfigured()).toBe(true);
  });

  it("base URL đã cấu hình nhưng không thể kết nối → NETWORK_ERROR, không nhầm với API_CONFIG_MISSING", async () => {
    // Full-stack CI đặt NEXT_PUBLIC_API_BASE_URL rồi mới chạy `npm test`
    // (Nest chưa boot). Hợp đồng lỗi lúc đó là NETWORK_ERROR của fetch thật;
    // nhầm thành API_CONFIG_MISSING sẽ che mất lỗi cấu hình/mạng thật.
    // Port 1 trên 127.0.0.1 chắc chắn từ chối kết nối ngay lập tức — an toàn
    // và deterministic ở mọi runner.
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://127.0.0.1:1/api/v1");
    const { apiFetch } = await import("@/lib/auth/api-client");
    await expect(apiFetch("/auth/me")).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      name: "ApiError",
    });
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
