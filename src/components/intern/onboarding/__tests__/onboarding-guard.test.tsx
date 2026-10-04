import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import { InternOnboardingGuard } from "@/components/intern/onboarding/onboarding-guard";
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
