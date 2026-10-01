import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";

import { AdminWorkspace } from "@/components/admin/admin-workspace";

describe("AdminWorkspace", () => {
  it("render tiêu đề Admin Workspace + metadata + badge Dữ liệu mẫu", () => {
    render(<AdminWorkspace />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Admin Workspace" })
    ).toBeInTheDocument();
    expect(screen.getByText("Vai trò:")).toBeInTheDocument();
    expect(screen.getAllByText("System Admin").length).toBeGreaterThan(0);
    expect(screen.getByText("V-Intern Platform")).toBeInTheDocument();
    expect(screen.getByText("Production")).toBeInTheDocument();

    // Badge công bố dữ liệu mock (chưa nối admin backend).
    expect(screen.getByText("Dữ liệu mẫu")).toBeInTheDocument();
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

  it("render đủ 4 KPI card, không còn KPI Dịch vụ AI", () => {
    render(<AdminWorkspace />);

    const kpiList = screen.getByRole("list", { name: "Chỉ số tổng quan" });

    for (const label of [
      "Tổng người dùng",
      "Giảng viên",
      "Sinh viên",
      "Phiên đang hoạt động",
    ]) {
      expect(within(kpiList).getByText(label)).toBeInTheDocument();
    }

    // KPI "Dịch vụ AI" đã bị xóa khỏi mock data (xóa hẳn, không phải CSS hide).
    // "2,480" chỉ thuộc KPI này nên không được xuất hiện ở bất kỳ đâu trên trang.
    expect(within(kpiList).getAllByRole("article")).toHaveLength(4);
    expect(screen.queryByText("Dịch vụ AI")).not.toBeInTheDocument();
    expect(screen.queryByText("2,480")).not.toBeInTheDocument();

    const totalCard = within(kpiList)
      .getByText("Tổng người dùng")
      .closest("article") as HTMLElement;
    expect(within(totalCard).getByText("1.266")).toBeInTheDocument();
    expect(
      within(totalCard).getByText("+12% so với tháng trước")
    ).toBeInTheDocument();

    // KPI Sinh viên dùng format số tiếng Việt (dấu chấm ngăn cách nghìn).
    const studentCard = within(kpiList)
      .getByText("Sinh viên")
      .closest("article") as HTMLElement;
    expect(within(studentCard).getByText("1.096")).toBeInTheDocument();

    // Không còn format en-US render ở bất kỳ đâu trên trang.
    expect(screen.queryByText("1,266")).not.toBeInTheDocument();
    expect(screen.queryByText("1,096")).not.toBeInTheDocument();
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

  it("render vai trò & phân quyền (3 vai trò) và phân bổ tài khoản (3 nhóm, tổng 1.266)", () => {
    render(<AdminWorkspace />);

    const roleSection = screen.getByRole("region", {
      name: "Vai trò & phân quyền",
    });
    expect(
      within(roleSection).getByRole("heading", { name: "Vai trò & phân quyền" })
    ).toBeInTheDocument();
    for (const roleName of ["Admin", "Giảng viên", "Sinh viên"]) {
      expect(within(roleSection).getByText(roleName)).toBeInTheDocument();
    }

    // Role bị xóa ở pass trước nay bị xóa cả khỏi dữ liệu Phân bổ tài khoản —
    // assertion toàn trang: bất kỳ text node nào khớp tên role này đều fail.
    expect(screen.queryByText("QA Reviewer")).not.toBeInTheDocument();

    const distributionSection = screen.getByRole("region", {
      name: "Phân bổ tài khoản",
    });

    // Tổng population mock: 1.266 = 1.096 (Sinh viên) + 142 (Giảng viên) + 28 (Admin)
    // — hiển thị theo format số tiếng Việt.
    expect(within(distributionSection).getByText("1.266")).toBeInTheDocument();
    expect(within(distributionSection).getByText("người dùng")).toBeInTheDocument();

    // Legend Sinh viên hiển thị "1.096" theo format tiếng Việt.
    expect(within(distributionSection).getByText("1.096")).toBeInTheDocument();

    // Donut + legend chỉ còn đúng 3 nhóm, percent tính trên tổng 1.266 (xấp xỉ 100%).
    expect(within(distributionSection).getAllByRole("listitem")).toHaveLength(3);
    for (const [label, percent] of [
      ["Sinh viên", "86.6%"],
      ["Giảng viên", "11.2%"],
      ["Admin", "2.2%"],
    ] as const) {
      expect(within(distributionSection).getByText(label)).toBeInTheDocument();
      expect(within(distributionSection).getByText(percent)).toBeInTheDocument();
    }
  });

  it("render trạng thái hệ thống, nhật ký, cảnh báo, thiết lập nhanh", () => {
    render(<AdminWorkspace />);

    expect(
      screen.getByRole("heading", { name: "Trạng thái hệ thống" })
    ).toBeInTheDocument();
    expect(screen.getByText("Backend API (v1)")).toBeInTheDocument();
    expect(screen.getByText("99.98%")).toBeInTheDocument();

    // Gemini giữ nguyên trong pass chuẩn hóa format số.
    expect(screen.getByText("Gemini API (AI Mentoring)")).toBeInTheDocument();

    // Database label trình bày mới (mock text, không health check thật).
    expect(screen.getByText("Database (SQL Server)")).toBeInTheDocument();
    expect(screen.queryByText(/PostgreSQL/)).not.toBeInTheDocument();

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

const USER_SUMMARY_TEXT = "Hiển thị 1 - 5 trong tổng số 1.266 người dùng";
