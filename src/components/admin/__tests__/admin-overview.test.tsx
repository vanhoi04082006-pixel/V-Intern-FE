import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminOverview } from "@/components/product/admin-management";

const api = vi.hoisted(() => ({ listUsers: vi.fn(), listGroups: vi.fn(), listRoles: vi.fn(), listAudits: vi.fn(), listActivity: vi.fn() }));
vi.mock("@/lib/api/admin", () => api);
const page = (total: number) => ({ items: [], total, page: 1, pageSize: 10, totalPages: Math.ceil(total / 10) });
beforeEach(() => {
  vi.resetAllMocks();
  api.listUsers.mockResolvedValue(page(17));
  api.listGroups.mockResolvedValue(page(3));
  api.listRoles.mockResolvedValue(page(4));
  api.listAudits.mockResolvedValue(page(28));
  api.listActivity.mockResolvedValue(page(0));
});

describe("Admin root route", () => {
  it("shows complete backend totals instead of prototype users or fixed statistics", async () => {
    render(<AdminOverview />);
    expect(await screen.findByText("17")).toBeInTheDocument();
    for (const value of ["3", "4", "28"]) expect(screen.getByText(value)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Trang quản trị" })).toBeInTheDocument();
    expect(api.listUsers).toHaveBeenCalledWith(1, "", "", expect.any(AbortSignal));
    expect(screen.queryByText("1.266")).not.toBeInTheDocument();
    expect(screen.queryByText("Dữ liệu mẫu")).not.toBeInTheDocument();
  });

  it("keeps a genuine empty database at zero", async () => {
    for (const fn of [api.listUsers, api.listGroups, api.listRoles, api.listAudits]) fn.mockResolvedValue(page(0));
    render(<AdminOverview />);
    await waitFor(() => expect(screen.getAllByText("0")).toHaveLength(4));
    expect(screen.queryByText("1.096")).not.toBeInTheDocument();
  });

  it("waits for all counts instead of displaying a partial successful snapshot", async () => {
    let resolve!: (value: ReturnType<typeof page>) => void;
    api.listRoles.mockReturnValue(new Promise(r => { resolve = r; }));
    render(<AdminOverview />);
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);
    await waitFor(() => expect(api.listRoles).toHaveBeenCalledOnce());
    expect(screen.queryByText("17")).not.toBeInTheDocument();
    resolve(page(4));
    expect(await screen.findByText("17")).toBeInTheDocument();
  });

  it("reports a failed count request and reloads successfully on retry", async () => {
    api.listUsers.mockRejectedValueOnce(new Error("offline"));
    render(<AdminOverview />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Không thể tải dữ liệu");
    expect(screen.queryByText("17")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByText("17")).toBeInTheDocument();
    expect(api.listUsers).toHaveBeenCalledTimes(2);
  });

  it("shows backend activity and links into actual administration routes", async () => {
    api.listActivity.mockResolvedValue({ ...page(1), items: [{ id: "event", module: "users", summary: "Đã cập nhật vai trò từ API", action: "users.update", createdAt: "2026-10-18T12:00:00Z" }] });
    render(<AdminOverview />);
    expect(await screen.findByText("Đã cập nhật vai trò từ API")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Quản lý người dùng/ })).toHaveAttribute("href", "/admin/users");
    expect(screen.getByRole("link", { name: /Kiểm tra dịch vụ/ })).toHaveAttribute("href", "/admin/services");
    expect(screen.queryByText("99.98%")).not.toBeInTheDocument();
  });
});
