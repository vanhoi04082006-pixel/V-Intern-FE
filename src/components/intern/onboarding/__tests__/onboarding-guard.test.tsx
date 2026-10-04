import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import {
  InternOnboardingGuard,
  isOnboardingDevPreviewEnabled,
} from "@/components/intern/onboarding/onboarding-guard";
import { refreshSession } from "@/lib/auth/auth-service";
import { clearSession, setSession } from "@/lib/auth/session";

/**
 * Test bảo vệ role cho Onboarding flow (/intern/onboarding/*):
 * layout bọc `InternOnboardingGuard` → tái sử dụng WorkspaceGuard thật
 * với allowedRoles = PROTECTED_ROUTES["/intern"] (chỉ role `intern`).
 *
 * Trường hợp tổng quát của guard đã được cover trong
 * workspace-guard.test.tsx — ở đây chốt đúng hành vi với Onboarding:
 * chưa đăng nhập → /login; intern → render; admin/teacher → về workspace
 * đúng của họ, không lộ nội dung onboarding.
 *
 * Riêng NODE_ENV=development: guard cho xem UI không cần auth (dev-only
 * preview cho local UI review không cần Backend) — phải chứng minh 2 chiều:
 * dev render trực tiếp KHÔNG đụng auth, production KHÔNG bao giờ bypass.
 */

const replace = vi.fn();
const routerStub = { replace, push: vi.fn(), refresh: vi.fn() };

vi.mock("next/navigation", () => ({
  useRouter: () => routerStub,
}));

vi.mock("@/lib/auth/auth-service", () => ({
  refreshSession: vi.fn(),
}));

const mockRefresh = vi.mocked(refreshSession);

const USER_BASE = {
  id: "u1",
  email: "user@vintern.local",
  displayName: "User",
  permissions: [],
};

function ProtectedOnboarding() {
  return <p>Nội dung onboarding</p>;
}

describe("InternOnboardingGuard — bảo vệ /intern/onboarding/*", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSession();
    mockRefresh.mockResolvedValue(null);
  });

  it("chưa đăng nhập → chuyển hướng /login, không render onboarding", async () => {
    render(
      <InternOnboardingGuard>
        <ProtectedOnboarding />
      </InternOnboardingGuard>
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/login");
    });
    expect(screen.queryByText("Nội dung onboarding")).not.toBeInTheDocument();
  });

  it("role intern → render onboarding", async () => {
    setSession("token", { ...USER_BASE, roles: ["intern"] });

    render(
      <InternOnboardingGuard>
        <ProtectedOnboarding />
      </InternOnboardingGuard>
    );

    expect(
      await screen.findByText("Nội dung onboarding")
    ).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("role admin → chuyển hướng về /admin, không render onboarding", async () => {
    setSession("token", { ...USER_BASE, roles: ["admin"] });

    render(
      <InternOnboardingGuard>
        <ProtectedOnboarding />
      </InternOnboardingGuard>
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/admin");
    });
    expect(screen.queryByText("Nội dung onboarding")).not.toBeInTheDocument();
  });

  it("role teacher → chuyển hướng về /instructor, không render onboarding", async () => {
    setSession("token", { ...USER_BASE, roles: ["teacher"] });

    render(
      <InternOnboardingGuard>
        <ProtectedOnboarding />
      </InternOnboardingGuard>
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/instructor");
    });
    expect(screen.queryByText("Nội dung onboarding")).not.toBeInTheDocument();
  });
});

describe("InternOnboardingGuard — dev-only preview bypass", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSession();
    mockRefresh.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("helper chỉ bật khi NODE_ENV=development", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(isOnboardingDevPreviewEnabled()).toBe(true);

    vi.stubEnv("NODE_ENV", "production");
    expect(isOnboardingDevPreviewEnabled()).toBe(false);
  });

  it("NODE_ENV=development → render trực tiếp không cần auth (không refresh, không redirect)", () => {
    vi.stubEnv("NODE_ENV", "development");

    // Không set session nào, refreshSession được mock → null (không BE)
    render(
      <InternOnboardingGuard>
        <ProtectedOnboarding />
      </InternOnboardingGuard>
    );

    // Nội dung render NGAY — không qua trạng thái checking của guard
    expect(screen.getByText("Nội dung onboarding")).toBeInTheDocument();
    // Không đụng auth: không gọi refresh, không redirect
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("NODE_ENV=production → KHÔNG bypass: chưa đăng nhập vẫn qua WorkspaceGuard về /login", async () => {
    vi.stubEnv("NODE_ENV", "production");

    render(
      <InternOnboardingGuard>
        <ProtectedOnboarding />
      </InternOnboardingGuard>
    );

    // Guard thật chạy: gọi refreshSession (BE) rồi redirect /login
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/login");
    });
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Nội dung onboarding")).not.toBeInTheDocument();
  });

  it("NODE_ENV khác development (test) → KHÔNG bypass: đi qua WorkspaceGuard", async () => {
    // Vitest chạy với NODE_ENV=test → phải rơi vào nhánh production
    expect(isOnboardingDevPreviewEnabled()).toBe(false);

    render(
      <InternOnboardingGuard>
        <ProtectedOnboarding />
      </InternOnboardingGuard>
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/login");
    });
    expect(screen.queryByText("Nội dung onboarding")).not.toBeInTheDocument();
  });
});
