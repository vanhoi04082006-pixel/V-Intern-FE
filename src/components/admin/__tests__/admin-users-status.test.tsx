import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminUsers } from "@/components/product/admin-management";

const api = vi.hoisted(() => ({ listUsers: vi.fn(), listRoles: vi.fn() }));
vi.mock("@/lib/api/admin", () => api);

const usersPage = (items: unknown[]) => ({
  items,
  total: items.length,
  page: 1,
  pageSize: 10,
  totalPages: 1,
});
const user = (status: string) => ({
  id: `u-${status}`,
  email: "kiem.thu@example.edu.vn",
  username: `kiem.thu.${status}`,
  displayName: "Người Kiểm Thử",
  status,
  lastLoginAt: null,
  createdAt: "2026-10-01T00:00:00.000Z",
});

beforeEach(() => {
  vi.resetAllMocks();
  api.listRoles.mockResolvedValue(usersPage([]));
});

describe("AdminUsers status display", () => {
  it("renders Vietnamese lifecycle labels for backend status codes", async () => {
    api.listUsers.mockResolvedValue(
      usersPage([user("active"), user("pending"), user("locked")]),
    );
    render(<AdminUsers />);
    // Badge cells carry the .product-badge class; the distribution aside
    // and the filter options legitimately reuse the same Vietnamese labels.
    expect(
      await screen.findByText("Đang hoạt động", { selector: ".product-badge" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Chờ kích hoạt", { selector: ".product-badge" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Đã khóa", { selector: ".product-badge" }),
    ).toBeInTheDocument();
    // Raw backend codes must not leak into badges or the distribution aside.
    for (const raw of ["active", "pending", "locked"]) {
      expect(
        screen.queryByText(raw, { selector: "span", exact: true }),
      ).not.toBeInTheDocument();
    }
  });

  it("falls back to the raw code for unknown statuses instead of blank", async () => {
    api.listUsers.mockResolvedValue(usersPage([user("dormant")]));
    render(<AdminUsers />);
    expect(
      await screen.findByText("dormant", { selector: ".product-badge" }),
    ).toBeInTheDocument();
  });
});
