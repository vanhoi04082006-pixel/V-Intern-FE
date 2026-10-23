import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InstructorHome } from "../instructor-home";

const api = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock("@/lib/api/sessions", () => ({ listSessionOverview: api.list }));
const row = { id: "s-local", code: "LOCAL-18", name: "Phiên từ API", status: "active", startDate: "2026-10-01", endDate: "2026-12-31", project: { id: "p", code: "P", name: "Dự án hiện tại", templateVersion: 2 }, memberCount: 2, sprintCount: 1, taskTotal: 8, taskDone: 3, taskPercent: 37.5 };
const page = { items: [row], total: 1, page: 1, pageSize: 10, totalPages: 1 };
beforeEach(() => { vi.resetAllMocks(); api.list.mockResolvedValue(page); });

describe("Instructor root route", () => {
  it("loads scoped sessions and progress through the real route composition", async () => {
    render(<InstructorHome />);
    expect(await screen.findByRole("heading", { name: "Phiên từ API", level: 3 })).toBeInTheDocument();
    expect(screen.getByText(/3\/8 nhiệm vụ \(37.5%\)/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Chi tiết/ })).toHaveAttribute("href", "/instructor/sessions/s-local");
    expect(api.list).toHaveBeenCalledWith(expect.objectContaining({ page: 1, pageSize: 10 }), expect.any(AbortSignal));
    expect(screen.queryByText("Dữ liệu mẫu")).not.toBeInTheDocument();
    expect(screen.queryByText("LAB-001")).not.toBeInTheDocument();
  });

  it("offers the library workflow when no session has been assigned", async () => {
    api.list.mockResolvedValue({ ...page, items: [], total: 0, totalPages: 0 });
    render(<InstructorHome />);
    expect(await screen.findByText(/Chưa có phiên thực tập/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Khởi tạo phiên từ thư viện" })).toHaveAttribute("href", "/instructor/projects");
    expect(screen.queryByRole("link", { name: /Chi tiết/ })).not.toBeInTheDocument();
  });

  it("retains an actionable retry when the scoped session request fails", async () => {
    api.list.mockRejectedValueOnce(new Error("offline"));
    render(<InstructorHome />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Không thể tải dữ liệu");
    await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByRole("heading", { name: "Phiên từ API", level: 3 })).toBeInTheDocument();
    expect(api.list).toHaveBeenCalledTimes(2);
  });
});
