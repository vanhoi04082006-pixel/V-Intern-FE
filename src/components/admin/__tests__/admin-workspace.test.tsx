import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";

import { AdminWorkspace } from "@/components/admin/admin-workspace";

describe("AdminWorkspace", () => {
  it("render tiêu đề Admin Workspace + metadata vai trò/hệ thống", () => {
    render(<AdminWorkspace />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Admin Workspace" })
    ).toBeInTheDocument();
    expect(screen.getByText("Vai trò:")).toBeInTheDocument();
    expect(screen.getAllByText("System Admin").length).toBeGreaterThan(0);
    expect(screen.getByText("V-Intern Platform")).toBeInTheDocument();
    expect(screen.getByText("Production")).toBeInTheDocument();
  });

  it("sidebar render đủ mục điều hướng, Tổng quan là active link tới /admin", () => {
    render(<AdminWorkspace />);

    const nav = screen.getByRole("navigation", { name: "Điều hướng quản trị" });

    const overview = within(nav).getByRole("link", { name: "Tổng quan" });
    expect(overview).toHaveAttribute("href", "/admin");
    expect(overview).toHaveAttribute("aria-current", "page");

    for (const label of [
      "Người dùng",
      "Vai trò & quyền",
      "Nhóm người dùng",
      "Danh mục dùng chung",
      "Cài đặt hệ thống",
      "Nhật ký hệ thống",
      "Trạng thái dịch vụ",
      "Hoạt động gần đây",
      "Audit log",
      "Cài đặt",
    ]) {
      expect(within(nav).getByText(label)).toBeInTheDocument();
    }
  });

  it("render breadcrumb về landing và /admin", () => {
    render(<AdminWorkspace />);

    const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(breadcrumb).getByRole("link", { name: /V-Intern/ })).toHaveAttribute(
      "href",
      "/"
    );
    expect(
      within(breadcrumb).getByRole("link", { name: "Admin Workspace" })
    ).toHaveAttribute("href", "/admin");
    expect(within(breadcrumb).getByText("Tổng quan")).toBeInTheDocument();
  });

  it("render đủ 5 KPI card", () => {
    render(<AdminWorkspace />);

    const kpiList = screen.getByRole("list", { name: "Chỉ số tổng quan" });

    for (const label of [
      "Tổng người dùng",
      "Giảng viên",
      "Sinh viên",
      "Phiên đang hoạt động",
      "Dịch vụ AI",
    ]) {
      expect(within(kpiList).getByText(label)).toBeInTheDocument();
    }

    const totalCard = within(kpiList)
      .getByText("Tổng người dùng")
      .closest("article") as HTMLElement;
    expect(within(totalCard).getByText("1,284")).toBeInTheDocument();
    expect(
      within(totalCard).getByText("+12% so với tháng trước")
    ).toBeInTheDocument();
  });

  it("render bảng quản lý người dùng với filter và dữ liệu mock", () => {
    render(<AdminWorkspace />);

    const section = screen.getByRole("region", { name: "Quản lý người dùng" });

    expect(
      within(section).getByRole("heading", { name: "Quản lý người dùng" })
    ).toBeInTheDocument();
    expect(
      within(section).getByRole("button", { name: "Thêm người dùng" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Tìm kiếm người dùng")).toBeInTheDocument();
    expect(screen.getByLabelText("Lọc theo vai trò")).toBeInTheDocument();
    expect(screen.getByLabelText("Lọc theo trạng thái")).toBeInTheDocument();

    expect(within(section).getByText("Nguyễn Minh Anh")).toBeInTheDocument();
    expect(within(section).getByText("anhnguyen@uit.edu.vn")).toBeInTheDocument();
    expect(within(section).getByText("Trần Thị Bảo Ngọc")).toBeInTheDocument();

    const table = within(section).getByRole("table", {
      name: "Danh sách người dùng hệ thống",
    });
    expect(within(table).getByText("Tạm khóa")).toBeInTheDocument();
    expect(within(section).getByText(USER_SUMMARY_TEXT)).toBeInTheDocument();
  });

  it("render vai trò & phân quyền và phân bổ tài khoản", () => {
    render(<AdminWorkspace />);

    const roleSection = screen.getByRole("region", {
      name: "Vai trò & phân quyền",
    });
    expect(
      within(roleSection).getByRole("heading", { name: "Vai trò & phân quyền" })
    ).toBeInTheDocument();
    expect(within(roleSection).getByText("QA Reviewer")).toBeInTheDocument();
    expect(
      within(roleSection).getAllByText("quyền được cấp").length
    ).toBeGreaterThan(0);

    const distributionSection = screen.getByRole("region", {
      name: "Phân bổ tài khoản",
    });
    expect(within(distributionSection).getByText("85.3%")).toBeInTheDocument();
    expect(within(distributionSection).getByText("người dùng")).toBeInTheDocument();
  });

  it("render trạng thái hệ thống, nhật ký, cảnh báo, thiết lập nhanh", () => {
    render(<AdminWorkspace />);

    expect(
      screen.getByRole("heading", { name: "Trạng thái hệ thống" })
    ).toBeInTheDocument();
    expect(screen.getByText("Backend API (v1)")).toBeInTheDocument();
    expect(screen.getByText("99.98%")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Nhật ký hoạt động" })
    ).toBeInTheDocument();
    expect(screen.getByText("Đăng nhập hệ thống")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Cảnh báo hệ thống" })
    ).toBeInTheDocument();
    expect(screen.getByText("Tỷ lệ lỗi API tăng cao (5.2%)")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Thiết lập nhanh" })
    ).toBeInTheDocument();
    expect(screen.getByText("Sao lưu & khôi phục")).toBeInTheDocument();
  });
});

const USER_SUMMARY_TEXT = "Hiển thị 1 - 5 trong tổng số 1.284 người dùng";
