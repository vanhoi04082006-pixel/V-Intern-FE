import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminOverview } from "@/components/product/admin-management";

/* Master prompt V6 (Phase E): /admin phải dùng đúng aggregate thật của BE —
 * GET /dashboard/admin — thay vì tự tính từ trang đầu tiên của các list.
 * Test chốt contract mới: metrics + statuses (GROUP BY SQL) + users + roles
 * đều lấy từ một nguồn duy nhất getAdminDashboard. */
const api = vi.hoisted(() => ({ listActivity: vi.fn() }));
vi.mock("@/lib/api/admin", () => api);
const dashboard = vi.hoisted(() => ({ getAdminDashboard: vi.fn() }));
vi.mock("@/lib/api/dashboard", () => dashboard);

const snapshot = (overrides?: Partial<Record<string, unknown>>) => ({
  metrics: {
    userCount: 17,
    instructorCount: 4,
    internCount: 9,
    activeSessions: 2,
    aiRunsToday: 5,
  },
  users: [
    {
      id: "user-1",
      displayName: "Nguyễn Vận Hành",
      email: "admin@example.test",
      status: "active",
      lastLoginAt: null,
    },
  ],
  roles: [{ id: "role-1", code: "admin", name: "Quản trị", permissionCount: 52 }],
  activity: [],
  statuses: [
    { status: "active", count: 15 },
    { status: "pending", count: 2 },
  ],
  generatedAt: "2026-11-20T00:00:00Z",
  ...overrides,
});
const emptySnapshot = () => ({
  metrics: { userCount: 0, instructorCount: 0, internCount: 0, activeSessions: 0, aiRunsToday: 0 },
  users: [],
  roles: [],
  activity: [],
  statuses: [],
  generatedAt: "2026-11-20T00:00:00Z",
});

beforeEach(() => {
  vi.resetAllMocks();
  dashboard.getAdminDashboard.mockResolvedValue(snapshot());
  api.listActivity.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 10 });
});

describe("Admin root route", () => {
  it("renders exact backend aggregates from GET /dashboard/admin", async () => {
    render(<AdminOverview />);
    expect(await screen.findAllByText("17")).not.toHaveLength(0);
    for (const value of ["4", "9", "2", "5"]) expect(screen.getAllByText(value).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { level: 1, name: "Trang quản trị" })).toBeInTheDocument();
    expect(dashboard.getAdminDashboard).toHaveBeenCalledWith(expect.any(AbortSignal));
    expect(screen.queryByText("1.266")).not.toBeInTheDocument();
    expect(screen.queryByText("Dữ liệu mẫu")).not.toBeInTheDocument();
  });

  it("draws the status donut from SQL GROUP BY rows, not first-page samples", async () => {
    render(<AdminOverview />);
    expect(await screen.findByText("Phân bố trạng thái tài khoản")).toBeInTheDocument();
    expect(screen.getByText("Toàn hệ thống · 17 tài khoản")).toBeInTheDocument();
    expect(screen.getAllByText("Đang hoạt động").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Chờ kích hoạt").length).toBeGreaterThan(0);
  });

  it("counts pending accounts from the exact statuses aggregate", async () => {
    render(<AdminOverview />);
    expect(await screen.findByText("Tài khoản chờ duyệt")).toBeInTheDocument();
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
  });

  it("lists newest users and role permission counts from the same snapshot", async () => {
    render(<AdminOverview />);
    expect(await screen.findByText("Nguyễn Vận Hành")).toBeInTheDocument();
    expect(screen.getByText("admin@example.test")).toBeInTheDocument();
    expect(screen.getByText("Quản trị")).toBeInTheDocument();
    expect(screen.getAllByText("52").length).toBeGreaterThan(0);
  });

  it("keeps a genuine empty database at zero", async () => {
    dashboard.getAdminDashboard.mockResolvedValue(emptySnapshot());
    render(<AdminOverview />);
    await waitFor(() => expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(5));
    expect(screen.queryByText("1.096")).not.toBeInTheDocument();
    expect(screen.queryByText("Tài khoản chờ duyệt")).not.toBeInTheDocument();
  });

  it("reports a failed dashboard request and reloads successfully on retry", async () => {
    dashboard.getAdminDashboard.mockRejectedValueOnce(new Error("offline"));
    render(<AdminOverview />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Không thể hoàn tất yêu cầu");
    expect(screen.queryByText("17")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findAllByText("17")).not.toHaveLength(0);
    expect(dashboard.getAdminDashboard).toHaveBeenCalledTimes(2);
  });

  it("shows backend activity and links into actual administration routes", async () => {
    api.listActivity.mockResolvedValue({
      items: [
        {
          id: "event",
          module: "users",
          summary: "Đã cập nhật vai trò từ API",
          action: "users.update",
          createdAt: "2026-10-18T12:00:00Z",
        },
      ],
      total: 1,
      page: 1,
      pageSize: 10,
    });
    render(<AdminOverview />);
    expect(await screen.findByText("Đã cập nhật vai trò từ API")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Quản lý người dùng/ })).toHaveAttribute("href", "/admin/users");
    expect(screen.getByRole("link", { name: /Kiểm tra dịch vụ/ })).toHaveAttribute("href", "/admin/services");
    expect(screen.queryByText("99.98%")).not.toBeInTheDocument();
  });
});
