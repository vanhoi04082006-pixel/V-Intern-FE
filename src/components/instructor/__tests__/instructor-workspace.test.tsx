import { describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { InstructorWorkspace } from "@/components/instructor/instructor-workspace";

/**
 * Test Instructor Workspace (/instructor) — mock UI theo reference image.
 * Tránh test pixel/giá trị style; tập trung nội dung, vai trò ARIA và
 * hành vi drawer accessibility.
 */
describe("InstructorWorkspace", () => {
  it("render tiêu đề Instructor Workspace + metadata + badge Dữ liệu mẫu", () => {
    render(<InstructorWorkspace />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Instructor Workspace" })
    ).toBeInTheDocument();

    expect(screen.getByText("Vai trò:")).toBeInTheDocument();
    expect(screen.getByText("Giảng viên / Technical Lead")).toBeInTheDocument();
    expect(screen.getByText("Hệ thống:")).toBeInTheDocument();
    expect(screen.getByText("V-Intern Platform")).toBeInTheDocument();
    expect(screen.getByText("Phiên hiện tại:")).toBeInTheDocument();
    expect(screen.getByText("Sprint hiện tại:")).toBeInTheDocument();
    expect(screen.getByText("Sprint 03")).toBeInTheDocument();
    expect(screen.getByText("Cập nhật lúc:")).toBeInTheDocument();
    expect(screen.getByText("16/05/2024, 14:21")).toBeInTheDocument();

    // Badge công bố dữ liệu mock (chưa nối instructor backend).
    expect(screen.getByText("Dữ liệu mẫu")).toBeInTheDocument();
  });

  it("sidebar render đủ mục điều hướng, Tổng quan là active link tới /instructor", () => {
    render(<InstructorWorkspace />);

    const nav = screen.getByRole("navigation", { name: "Điều hướng giảng viên" });

    const overview = within(nav).getByRole("link", { name: "Tổng quan" });
    expect(overview).toHaveAttribute("href", "/instructor");
    expect(overview).toHaveAttribute("aria-current", "page");

    for (const label of [
      "Lớp học",
      "Phiên thực tập",
      "Project Library",
      "Sprint & Task",
      "Đánh giá AI",
      "Hiệu suất sinh viên",
      "Báo cáo",
      "Cài đặt",
    ]) {
      expect(within(nav).getByText(label)).toBeInTheDocument();
    }

    // Thông báo có badge số 3 trong sidebar.
    const thongBao = within(nav).getByText("Thông báo").closest("button");
    expect(thongBao).not.toBeNull();
    expect(within(thongBao as HTMLElement).getByText("3")).toBeInTheDocument();
  });

  it("render breadcrumb về landing và /instructor", () => {
    render(<InstructorWorkspace />);

    const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(
      within(breadcrumb).getByRole("link", { name: /V-Intern/ })
    ).toHaveAttribute("href", "/");
    expect(
      within(breadcrumb).getByRole("link", { name: "Instructor Workspace" })
    ).toHaveAttribute("href", "/instructor");
    expect(within(breadcrumb).getByText("Tổng quan")).toBeInTheDocument();
  });

  it("render đủ 5 KPI card với đúng giá trị và ghi chú", () => {
    render(<InstructorWorkspace />);

    const kpiList = screen.getByRole("list", { name: "Chỉ số tổng quan" });
    expect(within(kpiList).getAllByRole("article")).toHaveLength(5);

    const expectations: Array<[string, string, string]> = [
      ["Phiên đang hoạt động", "3 / 4", "+1 phiên so với tháng trước"],
      ["Sinh viên tham gia", "84", "+12% so với tháng trước"],
      ["Tỷ lệ hoàn thành sprint", "67%", "142 / 212 task"],
      ["Điểm AI trung bình", "82 / 100", "+6% so với sprint trước"],
      ["Task / PR chờ duyệt", "12", "4 task quá hạn"],
    ];

    for (const [label, value, note] of expectations) {
      const card = within(kpiList)
        .getByText(label)
        .closest("article") as HTMLElement;
      expect(within(card).getByText(value)).toBeInTheDocument();
      expect(within(card).getByText(note)).toBeInTheDocument();
    }
  });

  it("render bảng phiên thực tập đang hoạt động với 4 phiên mock", () => {
    render(<InstructorWorkspace />);

    const section = screen.getByRole("region", {
      name: "Phiên thực tập đang hoạt động",
    });
    expect(
      within(section).getByRole("button", { name: "Tạo phiên mới" })
    ).toBeInTheDocument();

    const table = within(section).getByRole("table", {
      name: "Danh sách phiên thực tập đang hoạt động",
    });
    const rows = within(table).getAllByRole("row");
    expect(rows).toHaveLength(5); // 1 header + 4 phiên

    for (const sessionId of ["VIN-103", "VIN-104", "VIN-102", "VIN-099"]) {
      expect(within(table).getByText(sessionId)).toBeInTheDocument();
    }
    for (const project of [
      "Integrate Login API",
      "Form Validation",
      "Design Login UI",
      "Register Flow",
    ]) {
      expect(within(table).getByText(project)).toBeInTheDocument();
    }

    // Trạng thái semantic theo reference.
    expect(within(table).getAllByText("Đang diễn ra")).toHaveLength(3);
    expect(within(table).getByText("Sắp kết thúc")).toBeInTheDocument();

    // Hành động từng dòng (visual-only).
    expect(
      within(table).getAllByRole("button", { name: /^Xem chi tiết phiên/ })
    ).toHaveLength(4);

    // Thời gian rendered tách 2 dòng nhưng vẫn đủ cặp ngày.
    expect(within(table).getByText("01/05/2024")).toBeInTheDocument();
    expect(within(table).getByText("30/06/2024")).toBeInTheDocument();
  });

  it("render card Tiến độ Sprint & Burndown với selector, 4 chỉ số, legend và chart accessible", () => {
    render(<InstructorWorkspace />);

    const section = screen.getByRole("region", {
      name: "Tiến độ Sprint & Burndown",
    });

    expect(
      within(section).getByRole("button", {
        name: "Chọn sprint: Sprint 03 (13/05 - 26/05)",
      })
    ).toBeInTheDocument();

    const metricList = within(section).getByRole("list", {
      name: "Chỉ số sprint hiện tại",
    });
    expect(within(metricList).getByText("Thời gian còn lại")).toBeInTheDocument();
    expect(within(metricList).getByText("8 ngày")).toBeInTheDocument();
    expect(within(metricList).getByText("Task hoàn thành")).toBeInTheDocument();
    expect(within(metricList).getByText("42 / 60")).toBeInTheDocument();
    expect(within(metricList).getByText("70%")).toBeInTheDocument();
    expect(within(metricList).getByText("Điểm trung bình")).toBeInTheDocument();
    expect(within(metricList).getByText("Burn còn lại")).toBeInTheDocument();
    expect(within(metricList).getByText("18 task")).toBeInTheDocument();

    // Legend + chart với accessible label (SVG role="img").
    const legend = within(section).getByRole("list", {
      name: "Chú giải biểu đồ burndown",
    });
    expect(within(legend).getByText("Task còn lại (thực tế)")).toBeInTheDocument();
    expect(within(legend).getByText("Đường lý tưởng")).toBeInTheDocument();

    const chart = within(section).getByRole("img", {
      name: /Burndown Sprint 03/,
    });
    expect(chart).toBeInTheDocument();

    // Annotation tooltip ghim tại điểm thực tế cuối.
    expect(within(section).getByText("21/05/2024")).toBeInTheDocument();
  });

  it("render bảng Hiệu suất sinh viên (Top 5) đủ 5 sinh viên", () => {
    render(<InstructorWorkspace />);

    const section = screen.getByRole("region", {
      name: "Hiệu suất sinh viên (Top 5)",
    });
    const table = within(section).getByRole("table", {
      name: "Bảng xếp hạng hiệu suất sinh viên",
    });

    const rows = within(table).getAllByRole("row");
    expect(rows).toHaveLength(6); // 1 header + 5 sinh viên

    for (const name of [
      "Trần Thị Bảo Ngọc",
      "Lê Hoàng",
      "Nguyễn Văn Minh",
      "Phạm Quang Duy",
      "Nguyễn Thu Hà",
    ]) {
      expect(within(table).getByText(name)).toBeInTheDocument();
    }

    for (const role of ["Frontend", "Backend", "Fullstack", "UI/UX"]) {
      expect(within(table).getAllByText(role).length).toBeGreaterThan(0);
    }

    expect(within(table).getByText("Xuất sắc")).toBeInTheDocument();
    expect(within(table).getAllByText("Tốt")).toHaveLength(2);
    expect(within(table).getAllByText("Đang cải thiện")).toHaveLength(2);

    // Điểm AI top 1 và delta dương/âm.
    expect(within(table).getByText("92")).toBeInTheDocument();
    expect(within(table).getByText("+6%")).toBeInTheDocument();
    expect(within(table).getByText("-2%")).toBeInTheDocument();
  });

  it("render bảng Review & Đánh giá (Pull Request) với 5 PR và trạng thái semantic", () => {
    render(<InstructorWorkspace />);

    const section = screen.getByRole("region", {
      name: "Review & Đánh giá (Pull Request)",
    });
    const table = within(section).getByRole("table", {
      name: "Danh sách pull request chờ đánh giá",
    });

    for (const [number, title] of [
      [42, "login-api"],
      [41, "ui-login"],
      [40, "register-flow"],
      [39, "user-profile"],
      [38, "dashboard-ui"],
    ] as const) {
      expect(within(table).getByText(`#${number}`)).toBeInTheDocument();
      expect(within(table).getByText(title)).toBeInTheDocument();
    }

    expect(within(table).getAllByText("Passed")).toHaveLength(3);
    expect(within(table).getByText("Cần xem xét")).toBeInTheDocument();
    expect(within(table).getByText("Failed")).toBeInTheDocument();

    // Hành động: Duyệt cho PR passed, Xem cho PR cần xem xét/failed.
    expect(
      within(table).getAllByRole("button", { name: /^Duyệt pull request/ })
    ).toHaveLength(3);
    expect(
      within(table).getAllByRole("button", { name: /^Xem pull request/ })
    ).toHaveLength(2);
  });

  it("render Tổng quan Task với 4 trạng thái và Thiết lập nhanh với 6 shortcut", () => {
    render(<InstructorWorkspace />);

    const taskSection = screen.getByRole("region", {
      name: "Tổng quan Task (Tất cả phiên)",
    });
    const taskList = within(taskSection).getByRole("list", {
      name: "Tổng quan task theo trạng thái",
    });

    const taskExpectations: Array<[string, string, string]> = [
      ["To Do", "38", "3 task quá hạn"],
      ["Doing", "24", "4 đang chờ review"],
      ["Review", "12", "2 đã quá hạn"],
      ["Done", "142", "67% hoàn thành"],
    ];
    for (const [label, count, note] of taskExpectations) {
      const cell = within(taskList).getByText(label).closest("li") as HTMLElement;
      expect(within(cell).getByText(count)).toBeInTheDocument();
      expect(within(cell).getByText(note)).toBeInTheDocument();
    }

    const quickSection = screen.getByRole("region", { name: "Thiết lập nhanh" });
    for (const action of [
      "Bắt đầu phiên",
      "Tạo task mới",
      "Chọn project",
      "Giao việc",
      "Đánh giá AI",
      "Xuất báo cáo",
    ]) {
      expect(
        within(quickSection).getByRole("button", { name: action })
      ).toBeInTheDocument();
    }
  });

  it("render Hoạt động gần đây với 5 sự kiện mock", () => {
    render(<InstructorWorkspace />);

    const section = screen.getByRole("region", { name: "Hoạt động gần đây" });
    const log = within(section).getByRole("list", {
      name: "Nhật ký hoạt động gần đây",
    });

    for (const text of [
      "Nguyễn Văn Minh đã submit PR #41",
      "Trần Thị Bảo Ngọc hoàn thành task VIN-103-T12",
      "Hệ thống đã đánh giá 5 PR #40 (85 điểm)",
      "Phạm Quang Duy đã tạo task mới",
      "Phiên VIN-099 sắp kết thúc (còn 3 ngày)",
    ]) {
      expect(within(log).getByText(text)).toBeInTheDocument();
    }

    expect(within(log).getByText("14:21")).toBeInTheDocument();
    expect(within(log).getByText("09:42")).toBeInTheDocument();
  });

  it("topbar có ô tìm kiếm placeholder theo reference và nút thông báo badge 3", () => {
    render(<InstructorWorkspace />);

    const search = screen.getByLabelText("Tìm kiếm trong không gian giảng viên");
    expect(search).toHaveAttribute(
      "placeholder",
      "Tìm kiếm sinh viên, lớp học, project, task..."
    );

    expect(
      screen.getByRole("button", { name: "Thông báo, có 3 thông báo mới" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Tài khoản Nguyễn Minh Anh, Giảng viên" })
    ).toBeInTheDocument();
  });

  it("không leakage từ Admin Workspace", () => {
    render(<InstructorWorkspace />);

    expect(screen.queryByText("Admin Workspace")).not.toBeInTheDocument();
    expect(screen.queryByText("Quản lý người dùng")).not.toBeInTheDocument();
    expect(screen.queryByText("Trạng thái hệ thống")).not.toBeInTheDocument();
  });

  it("drawer mobile: mở menu đưa focus vào điều hướng, Escape đóng và trả focus", async () => {
    const user = userEvent.setup();
    render(<InstructorWorkspace />);

    const menuButton = screen.getByRole("button", {
      name: "Mở menu điều hướng",
    });
    await user.click(menuButton);

    const dialog = await screen.findByRole("dialog", {
      name: "Menu giảng viên",
    });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(
      within(dialog).getByRole("link", { name: "Tổng quan" })
    ).toHaveFocus();

    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Menu giảng viên" })
      ).not.toBeInTheDocument();
    });
    expect(menuButton).toHaveFocus();
  });

  it("focus trap drawer: Tab/Shift+Tab quấn vòng trong, không thoát ra nền", async () => {
    const user = userEvent.setup();
    render(<InstructorWorkspace />);

    const menuButton = screen.getByRole("button", {
      name: "Mở menu điều hướng",
    });
    await user.click(menuButton);

    const dialog = await screen.findByRole("dialog", {
      name: "Menu giảng viên",
    });
    const firstItem = within(dialog).getByRole("link", {
      name: "Tổng quan",
    });
    const lastItem = within(dialog).getByRole("button", { name: "Cài đặt" });

    // Nút phủ overlay chỉ dùng cho chuột, không nằm trong tab order.
    expect(
      within(dialog).getByRole("button", { name: "Đóng menu giảng viên" })
    ).toHaveAttribute("tabindex", "-1");

    // Focus khởi đầu ở "Tổng quan".
    expect(firstItem).toHaveFocus();

    // Shift+Tab từ ĐẦU -> quấn tới CUỐI ("Cài đặt").
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(lastItem).toHaveFocus();

    // Tab từ CUỐI -> quấn về ĐẦU, không rơi ra topbar/nội dung nền.
    await user.keyboard("{Tab}");
    expect(firstItem).toHaveFocus();
    expect(dialog.contains(document.activeElement)).toBe(true);
  });
});
