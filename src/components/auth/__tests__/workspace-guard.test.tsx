import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { WorkspaceGuard } from "@/components/auth/workspace-guard";
import { refreshSession } from "@/lib/auth/auth-service";
import { PROTECTED_ROUTES } from "@/lib/auth/role-landing";
import { clearSession, setSession } from "@/lib/auth/session";

const replace = vi.fn();

const routerStub = { replace, push: vi.fn(), refresh: vi.fn() };

vi.mock("next/navigation", () => ({
  useRouter: () => routerStub,
}));

vi.mock("@/lib/auth/auth-service", () => ({
  refreshSession: vi.fn(),
}));

const mockRefresh = vi.mocked(refreshSession);

const ADMIN_USER = {
  id: "u1",
  email: "admin@vintern.local",
  displayName: "Admin",
  roles: ["admin"],
  permissions: [],
};

function ProtectedContent() {
  return <p>Nội dung admin</p>;
}

describe("WorkspaceGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSession();
    mockRefresh.mockResolvedValue(null);
  });

  it("chưa đăng nhập (không cookie) → chuyển hướng /login, không render nội dung", async () => {
    render(
      <WorkspaceGuard allowedRoles={["admin"]}>
        <ProtectedContent />
      </WorkspaceGuard>
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/login");
    });
    expect(screen.queryByText("Nội dung admin")).not.toBeInTheDocument();
  });

  it("session trong bộ nhớ đủ role → render nội dung, KHÔNG gọi refresh", async () => {
    setSession("token", ADMIN_USER);

    render(
      <WorkspaceGuard allowedRoles={["admin"]}>
        <ProtectedContent />
      </WorkspaceGuard>
    );

    expect(await screen.findByText("Nội dung admin")).toBeInTheDocument();
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("reload trang → khôi phục phiên bằng refresh cookie rồi render nội dung", async () => {
    mockRefresh.mockResolvedValue(ADMIN_USER);

    render(
      <WorkspaceGuard allowedRoles={["admin"]}>
        <ProtectedContent />
      </WorkspaceGuard>
    );

    expect(await screen.findByText("Nội dung admin")).toBeInTheDocument();
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(replace).not.toHaveBeenCalled();
  });

  it("sai role → chuyển hướng về workspace đúng của user, không render nội dung", async () => {
    setSession("token", { ...ADMIN_USER, roles: ["teacher"] });

    render(
      <WorkspaceGuard allowedRoles={["admin"]}>
        <ProtectedContent />
      </WorkspaceGuard>
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/instructor");
    });
    expect(screen.queryByText("Nội dung admin")).not.toBeInTheDocument();
  });

  it("intern mở /intern đủ role → render nội dung", async () => {
    setSession("token", { ...ADMIN_USER, roles: ["intern"] });

    render(
      <WorkspaceGuard allowedRoles={PROTECTED_ROUTES["/intern"]}>
        <ProtectedContent />
      </WorkspaceGuard>
    );

    expect(await screen.findByText("Nội dung admin")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("admin mở /intern → chuyển hướng về /admin, không render nội dung intern", async () => {
    setSession("token", ADMIN_USER);

    render(
      <WorkspaceGuard allowedRoles={PROTECTED_ROUTES["/intern"]}>
        <ProtectedContent />
      </WorkspaceGuard>
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/admin");
    });
    expect(screen.queryByText("Nội dung admin")).not.toBeInTheDocument();
  });

  it("teacher mở /intern → chuyển hướng về /instructor", async () => {
    setSession("token", { ...ADMIN_USER, roles: ["teacher"] });

    render(
      <WorkspaceGuard allowedRoles={PROTECTED_ROUTES["/intern"]}>
        <ProtectedContent />
      </WorkspaceGuard>
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/instructor");
    });
    expect(screen.queryByText("Nội dung admin")).not.toBeInTheDocument();
  });

  it("hiển thị trạng thái đang kiểm tra trước khi xác thực xong", async () => {
    // Refresh chưa xong → guard phải giữ trạng thái checking, không lộ nội dung.
    mockRefresh.mockReturnValue(new Promise(() => {}));

    render(
      <WorkspaceGuard allowedRoles={["admin"]}>
        <ProtectedContent />
      </WorkspaceGuard>
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Đang kiểm tra phiên đăng nhập..."
    );
    expect(screen.queryByText("Nội dung admin")).not.toBeInTheDocument();
  });
});
