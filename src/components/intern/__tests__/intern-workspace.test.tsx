import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { InternWorkspace } from "@/components/intern/intern-workspace";
import {
  INTERN_VIRTUAL_SALARY,
  formatVnd,
  resolveInternWorkspaceState,
} from "@/components/intern/data/intern-mock-data";
import {
  INTERN_PREVIEW_STATES,
  parseInternPreviewParam,
} from "@/components/intern/intern-preview";
import type { InternWorkspaceState } from "@/components/intern/data/intern-mock-data";

/**
 * Test Intern Workspace (/intern) — 1 route, 2 business state, mock-only.
 * Tránh test pixel; tập trung nội dung, ARIA, dữ liệu derive và preview
 * dev-only. Preview KHÔNG bypass auth — auth đã được cover bởi
 * workspace-guard.test.tsx (guard) và login-form.test.tsx (redirect).
 */

function renderActive() {
  return render(<InternWorkspace previewState="active" />);
}

function renderEmpty() {
  return render(<InternWorkspace previewState="empty" />);
}

function getActiveState(): Extract<
  InternWorkspaceState,
  { status: "active" }
> {
  const state = resolveInternWorkspaceState("active");
  if (state.status !== "active") {
    throw new Error("Active state expected");
  }
  return state;
}

describe("InternWorkspace — state EMPTY (unassigned)", () => {
  it("render tiêu đề + subtitle + welcome với badges", () => {
    renderEmpty();

    expect(
      screen.getByRole("heading", { level: 1, name: "Intern Workspace" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Không gian làm việc và thực tập của bạn tại V-Intern")
    ).toBeInTheDocument();
    expect(screen.getByText("Xin chào, Nguyễn Văn A 👋")).toBeInTheDocument();
    // Frontend Developer xuất hiện ở welcome badge + chip Vai trò.
    expect(
      screen.getAllByText("Frontend Developer").length
    ).toBeGreaterThan(0);
    expect(screen.getByText("Đã hoàn thành tuyển dụng")).toBeInTheDocument();
    // Badge công bố dữ liệu mock (giống Instructor Workspace).
    expect(screen.getByText("Dữ liệu mẫu")).toBeInTheDocument();
  });

  it("card chính: Chưa có dự án được phân công + mô tả + 2 hành động", () => {
    renderEmpty();

    expect(
      screen.getByRole("heading", { name: "Chưa có dự án được phân công" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Bạn đã hoàn thành tuyển dụng tại V-Intern. Giảng viên sẽ phân bạn vào một Project và Internship Session phù hợp. Khi được phân công, Sprint và Task sẽ xuất hiện tại đây."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Xem hồ sơ tuyển dụng/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Xem hướng dẫn/ })
    ).toBeInTheDocument();
  });

  it("Thông tin thực tập: project/session/sprint chưa phân, Task 0, Chờ phân công", () => {
    renderEmpty();

    const info = screen.getByRole("region", { name: "Thông tin thực tập" });

    expect(within(info).getByText("Vai trò")).toBeInTheDocument();
    expect(within(info).getByText("Frontend Developer")).toBeInTheDocument();
    expect(within(info).getByText("Project")).toBeInTheDocument();
    expect(within(info).getAllByText("Chưa được phân công")).toHaveLength(2);
    expect(within(info).getByText("Sprint")).toBeInTheDocument();
    expect(within(info).getByText("Chưa có")).toBeInTheDocument();
    expect(within(info).getByText("Task")).toBeInTheDocument();
    expect(within(info).getByText("0")).toBeInTheDocument();
    expect(within(info).getByText("Trạng thái")).toBeInTheDocument();
    expect(within(info).getByText("Chờ phân công")).toBeInTheDocument();
  });

  it("Quy trình tiếp theo đủ 3 bước theo đúng thứ tự", () => {
    renderEmpty();

    const steps = screen.getByRole("region", { name: "Quy trình tiếp theo" });

    expect(
      within(steps).getByText("Giảng viên phân công dự án")
    ).toBeInTheDocument();
    expect(
      within(steps).getByText("Bạn nhận thông báo tham gia phiên thực tập")
    ).toBeInTheDocument();
    expect(
      within(steps).getByText("Sprint và Task xuất hiện trong workspace")
    ).toBeInTheDocument();
  });

  it("Hoạt động gần đây 3 mốc + Lưu ý đủ 4 điều", () => {
    renderEmpty();

    const activity = screen.getByRole("region", {
      name: "Hoạt động gần đây",
    });
    expect(
      within(activity).getByText("Hoàn thành phỏng vấn AI Recruiter")
    ).toBeInTheDocument();
    expect(
      within(activity).getByText("Nhận role Frontend Developer")
    ).toBeInTheDocument();
    expect(
      within(activity).getByText("Đang chờ phân công dự án")
    ).toBeInTheDocument();

    const notes = screen.getByRole("region", { name: "Lưu ý" });
    expect(within(notes).getByText("Bạn không tự chọn Project.")).toBeInTheDocument();
    expect(within(notes).getByText("Bạn không tự vào Session.")).toBeInTheDocument();
    expect(
      within(notes).getByText(
        "Project và phiên thực tập sẽ do giảng viên phân công."
      )
    ).toBeInTheDocument();
    expect(
      within(notes).getByText(
        "Bạn sẽ nhận được thông báo khi có dự án và phiên thực tập phù hợp."
      )
    ).toBeInTheDocument();
  });

  it("sidebar empty: 2 nhóm không tiêu đề, không badge thông báo", () => {
    renderEmpty();

    const nav = screen.getByRole("navigation", {
      name: "Điều hướng thực tập sinh",
    });

    for (const label of [
      "Tổng quan",
      "Công việc của tôi",
      "Sprint",
      "Dự án",
      "AI Mentor",
      "Thông báo",
      "KPI",
      "Chứng nhận",
      "Cài đặt",
    ]) {
      expect(within(nav).getAllByText(label).length).toBeGreaterThan(0);
    }
    // Empty state chưa có hệ thống thông báo → không badge số.
    expect(
      within(nav).queryByText(/^\d+$/)
    ).not.toBeInTheDocument();
  });
});

describe("InternWorkspace — state ACTIVE", () => {
  it("render header: vai trò/lab session/sprint/trạng thái + 2 hành động", () => {
    renderActive();

    expect(screen.getByText("Vai trò:")).toBeInTheDocument();
    expect(screen.getAllByText("Frontend Developer").length).toBeGreaterThan(0);
    expect(screen.getByText("Lab Session:")).toBeInTheDocument();
    expect(screen.getAllByText("Session 01").length).toBeGreaterThan(0);
    expect(screen.getByText("Sprint hiện tại:")).toBeInTheDocument();
    expect(screen.getAllByText("Sprint 03").length).toBeGreaterThan(0);
    expect(screen.getByText("Trạng thái:")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Xem Sprint Board/ })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Nộp PR/ })).toBeInTheDocument();
    expect(screen.getByText("Dữ liệu mẫu")).toBeInTheDocument();
  });

  it("5 KPI đúng giá trị mock (Sprint 67%, Task 6/9, Review 82/100, Deadline VIN-103, Lương ảo)", () => {
    renderActive();

    const kpis = screen.getByRole("list", { name: "Chỉ số tổng quan" });

    expect(within(kpis).getByText("Tiến độ Sprint")).toBeInTheDocument();
    expect(within(kpis).getByText("67%")).toBeInTheDocument();
    expect(within(kpis).getByText("12 / 18 points")).toBeInTheDocument();

    expect(within(kpis).getByText("Task của tôi")).toBeInTheDocument();
    expect(within(kpis).getByText("6 / 9")).toBeInTheDocument();
    expect(within(kpis).getByText("hoàn thành")).toBeInTheDocument();

    expect(
      within(kpis).getByText("Điểm review trung bình")
    ).toBeInTheDocument();
    expect(within(kpis).getByText("82 / 100")).toBeInTheDocument();

    expect(within(kpis).getByText("Deadline gần nhất")).toBeInTheDocument();
    expect(within(kpis).getByText("VIN-103")).toBeInTheDocument();
    expect(within(kpis).getByText("Hôm nay, 16:00")).toBeInTheDocument();

    expect(within(kpis).getByText("Lương ảo tạm tính")).toBeInTheDocument();
    expect(within(kpis).getByText(formatVnd(INTERN_VIRTUAL_SALARY))).toBeInTheDocument();
    expect(within(kpis).getByText("+12% so với sprint trước")).toBeInTheDocument();
  });

  it("Task Board 4 cột đúng số task, VIN-103 nằm trong Doing", () => {
    renderActive();

    const board = screen.getByRole("region", { name: "Task Board" });
    const active = getActiveState();

    for (const column of active.boardColumns) {
      const columnItem = within(board).getByRole("listitem", {
        name: `${column.title}, ${column.tasks.length} task`,
      });
      // Mỗi task của cột render đúng ID bên trong cột đó.
      for (const task of column.tasks) {
        expect(within(columnItem).getByText(task.id)).toBeInTheDocument();
      }
    }

    // VIN-103 nằm trong cột Doing (không ở cột khác).
    const doing = within(board).getByRole("listitem", { name: "Doing, 2 task" });
    expect(within(doing).getByText("VIN-103")).toBeInTheDocument();
    expect(within(doing).getByText("Integrate Login API")).toBeInTheDocument();
    expect(within(doing).getByText("Hôm nay, 16:00")).toBeInTheDocument();

    // Tổng 9 task trên board — derive từ dataset, khớp số card render.
    const boardTotal = active.boardColumns.reduce(
      (sum, column) => sum + column.tasks.length,
      0
    );
    expect(boardTotal).toBe(9);
    expect(
      within(board).getAllByText(/^VIN-\d{3}$/).length
    ).toBe(boardTotal);
  });

  it("Task đang tập trung VIN-103: wording KHÔNG gợi ý localStorage", () => {
    renderActive();

    const focused = screen.getByRole("region", {
      name: "Task đang tập trung",
    });

    expect(
      within(focused).getByText(
        "Tích hợp API đăng nhập, xử lý response và quản lý phiên đăng nhập theo cơ chế xác thực hiện tại của hệ thống."
      )
    ).toBeInTheDocument();
    expect(
      within(focused).getByText(
        "Quản lý session/token theo cơ chế auth hiện tại của hệ thống"
      )
    ).toBeInTheDocument();
    expect(within(focused).getByText("5 points")).toBeInTheDocument();
    expect(
      within(focused).getByText("Hạn nộp: Hôm nay, 16:00")
    ).toBeInTheDocument();

    // Toàn trang không wording "local storage" (mâu thuẫn auth thật:
    // access token in-memory + refresh token HttpOnly cookie).
    expect(
      screen.queryByText(/local\s?storage/i)
    ).not.toBeInTheDocument();
  });

  it("AI Mentor: hội thoại mock 4 bước xử lý 401, KHÔNG gọi AI API", () => {
    renderActive();

    const mentor = screen.getByRole("region", { name: "AI Mentor" });

    expect(
      within(mentor).getByText(
        "Ngữ cảnh task hiện tại: VIN-103 – Integrate Login API"
      )
    ).toBeInTheDocument();
    expect(
      within(mentor).getByText("API login trả 401, em nên kiểm tra gì?")
    ).toBeInTheDocument();
    expect(
      within(mentor).getByText(
        "Bạn hãy kiểm tra lần lượt: (1) request payload có đúng định dạng không, (2) thông tin xác thực cần thiết, (3) response/error code từ endpoint, (4) session/token có còn hợp lệ không. Bạn cũng có thể kiểm tra tab Network trong DevTools."
      )
    ).toBeInTheDocument();
    // Input visual-only với label accessible.
    expect(within(mentor).getByLabelText("Hỏi AI Mentor về task này")).toBeInTheDocument();
  });

  it("PR & AI Review: PR #42 / feat/login-api / 82/100 / Passed + 2 feedback", () => {
    renderActive();

    const pr = screen.getByRole("region", { name: "Pull Request & AI Review" });

    expect(within(pr).getByText("PR #42")).toBeInTheDocument();
    expect(within(pr).getByText("feat/login-api")).toBeInTheDocument();
    expect(within(pr).getByText("Submitted")).toBeInTheDocument();
    expect(within(pr).getByText("AI Review: 82/100")).toBeInTheDocument();
    expect(within(pr).getByText("Passed")).toBeInTheDocument();
    expect(
      within(pr).getByText(
        "Cần xử lý lỗi 401 rõ hơn trong trường hợp session/token hết hạn"
      )
    ).toBeInTheDocument();
    expect(
      within(pr).getByText("Nên bổ sung test case cho invalid credentials")
    ).toBeInTheDocument();
  });

  it("Thông báo: 4 mục, số chưa đọc derive từ dataset", () => {
    renderActive();

    const active = getActiveState();
    const unread = active.notifications.filter((item) => item.unread).length;

    const notifications = screen.getByRole("region", {
      name: /Thông báo gần đây/,
    });

    for (const item of active.notifications) {
      expect(within(notifications).getByText(item.text)).toBeInTheDocument();
    }
    expect(
      within(notifications).getByText(`${unread} chưa đọc`)
    ).toBeInTheDocument();
    expect(unread).toBe(3);
  });

  it("Hiệu suất thực tập: 6 metric theo reference (Sprint 01 – 03)", () => {
    renderActive();

    const performance = screen.getByRole("region", {
      name: "Hiệu suất thực tập (Sprint 01 – 03)",
    });

    expect(within(performance).getByText("14 / 21")).toBeInTheDocument();
    expect(within(performance).getByText("42 / 60")).toBeInTheDocument();
    expect(within(performance).getByText("82 / 100")).toBeInTheDocument();
    expect(within(performance).getByText("84 / 100")).toBeInTheDocument();
    expect(within(performance).getByText("Đạt kỳ vọng")).toBeInTheDocument();
    expect(
      within(performance).getByText(formatVnd(INTERN_VIRTUAL_SALARY))
    ).toBeInTheDocument();
    expect(within(performance).getByText("+12% so với kỳ trước")).toBeInTheDocument();
    expect(within(performance).getByText("Chưa sẵn sàng")).toBeInTheDocument();
    expect(
      within(performance).getByText("Hoàn thành 3/6 sprint")
    ).toBeInTheDocument();
  });

  it("sidebar active: nhóm Workspace + Hiệu suất & Phát triển, badge thông báo = unread", () => {
    renderActive();

    const nav = screen.getByRole("navigation", {
      name: "Điều hướng thực tập sinh",
    });

    expect(within(nav).getByText("Workspace")).toBeInTheDocument();
    expect(within(nav).getByText("Hiệu suất & Phát triển")).toBeInTheDocument();
    expect(within(nav).getByText("Sprint Board")).toBeInTheDocument();
    expect(within(nav).getByText("KPI & Lương ảo")).toBeInTheDocument();

    const overview = within(nav).getByRole("link", { name: "Tổng quan" });
    expect(overview).toHaveAttribute("href", "/intern");
    expect(overview).toHaveAttribute("aria-current", "page");

    // Badge "Thông báo" derive từ unread notifications (3).
    const unread = getActiveState().notifications.filter(
      (item) => item.unread
    ).length;
    expect(within(nav).getByText(String(unread))).toBeInTheDocument();
  });
});

describe("InternWorkspace — default state & preview (dev-only)", () => {
  it("không có preview → default derive từ dataset (hiện là ACTIVE)", () => {
    render(<InternWorkspace />);

    // Default là ACTIVE: Task Board xuất hiện, Empty card không.
    expect(
      screen.getByRole("region", { name: "Task Board" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Chưa có dự án được phân công" })
    ).not.toBeInTheDocument();
  });

  it("resolveInternWorkspaceState: empty→unassigned, active→active, null→active", () => {
    expect(resolveInternWorkspaceState("empty").status).toBe("unassigned");
    expect(resolveInternWorkspaceState("active").status).toBe("active");
    expect(resolveInternWorkspaceState(null).status).toBe("active");
  });

  it("parseInternPreviewParam (development): nhận giá trị hợp lệ, từ chối giá trị lạ", () => {
    vi.stubEnv("NODE_ENV", "development");

    for (const value of INTERN_PREVIEW_STATES) {
      expect(parseInternPreviewParam(value)).toBe(value);
    }
    expect(parseInternPreviewParam("hack")).toBeNull();
    expect(parseInternPreviewParam(undefined)).toBeNull();
    expect(parseInternPreviewParam(["empty"])).toBeNull();
  });

  it("parseInternPreviewParam (production): bỏ qua param — không fake state", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(parseInternPreviewParam("empty")).toBeNull();
    expect(parseInternPreviewParam("active")).toBeNull();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });
});

describe("InternWorkspace — chrome & accessibility", () => {
  it("skip link tới nội dung chính", () => {
    renderActive();

    const skipLink = screen.getByRole("link", {
      name: "Bỏ qua tới nội dung chính",
    });
    expect(skipLink).toHaveAttribute("href", "#intern-main-content");
  });

  it("drawer mobile: mở → focus vào mục đầu, Escape đóng, trả focus nút menu", async () => {
    const user = userEvent.setup();
    renderActive();

    const menuButton = screen.getByRole("button", {
      name: "Mở menu điều hướng",
    });
    await user.click(menuButton);

    const dialog = screen.getByRole("dialog", {
      name: "Menu thực tập sinh",
    });
    await waitFor(() => {
      expect(
        within(dialog).getByRole("link", { name: "Tổng quan" })
      ).toHaveFocus();
    });

    fireEvent.keyDown(window, { key: "Escape" });

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Menu thực tập sinh" })
      ).not.toBeInTheDocument();
    });
    expect(menuButton).toHaveFocus();
  });
});
