import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { InternWorkspacePreview as InternWorkspace } from "@/test/intern-workspace-preview";
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
 * dev-only. Component KHÔNG tự kiểm tra auth; nhánh preview dev render
 * không guard còn nhánh guard được cover ở intern-page.test.tsx (page),
 * workspace-guard.test.tsx (guard) và login-form.test.tsx (redirect).
 */

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
function renderActive() {
  return render(<InternWorkspace previewState="active" />);
}

function renderEmpty() {
  return render(<InternWorkspace previewState="empty" />);
}

function getActiveState(): Extract<InternWorkspaceState, { status: "active" }> {
  const state = resolveInternWorkspaceState("active");
  if (state.status !== "active") {
    throw new Error("Active state expected");
  }
  return state;
}

/**
 * Derive số liệu board TỪ DATASET — test dùng chính cơ chế derive này để
 * assert KPI "Task Sprint hiện tại" không hardcode. Riêng "Tiến độ Sprint"
 * là commitment metric (dataset sprint planning riêng) — KHÔNG assert
 * sprint progress bằng tổng points của board.
 */
function getBoardStats(
  state: Extract<InternWorkspaceState, { status: "active" }>,
) {
  const doneColumn = state.boardColumns.find((column) => column.id === "done");
  const totalTasks = state.boardColumns.reduce(
    (sum, column) => sum + column.tasks.length,
    0,
  );
  const totalPoints = state.boardColumns.reduce(
    (sum, column) =>
      sum + column.tasks.reduce((acc, task) => acc + task.points, 0),
    0,
  );
  return {
    totalTasks,
    doneTasks: doneColumn?.tasks.length ?? 0,
    totalPoints,
    donePoints:
      doneColumn?.tasks.reduce((acc, task) => acc + task.points, 0) ?? 0,
  };
}

/**
 * Round 3.1 — navigation consistency: Waiting và Active phải cùng 1 nav
 * model nên thứ tự item (theo DOM) phải giống hệt nhau. Badge "3" của
 * Thông báo nằm trong cùng button → cắt digits cuối để so label thuần.
 * ("Cài đặt" ở bottom nav không nằm trong <li> — không thuộc list này.)
 */
const EXPECTED_INTERN_NAV_ITEM_ORDER = [
  "Tổng quan",
  "Công việc của tôi",
  "Sprint Board",
  "Dự án",
  "AI Mentor",
  "Thông báo",
  "Đánh giá",
  "KPI & Lương ảo",
  "Chứng nhận",
];

function getSidebarNavLabels(nav: HTMLElement): string[] {
  return within(nav)
    .getAllByRole("listitem")
    .map((li) =>
      (li.querySelector("a, button")?.textContent ?? "")
        .replace(/\d+$/, "")
        .trim(),
    );
}

/** Unread count từ dataset thông báo — nguồn truth duy nhất của badge. */
function getUnreadNotificationCount(): number {
  return getActiveState().notifications.filter((item) => item.unread).length;
}

describe("InternWorkspace — state EMPTY (unassigned)", () => {
  it("render tiêu đề + subtitle + welcome với badges", () => {
    renderEmpty();

    expect(
      screen.getByRole("heading", { level: 1, name: "Intern Workspace" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Không gian làm việc và thực tập của bạn tại V-Intern"),
    ).toBeInTheDocument();
    expect(screen.getByText("Xin chào, Nguyễn Văn A 👋")).toBeInTheDocument();
    // Frontend Developer xuất hiện ở welcome badge + chip Vai trò.
    expect(screen.getAllByText("Frontend Developer").length).toBeGreaterThan(0);
    expect(screen.getByText("Đã hoàn thành tuyển dụng")).toBeInTheDocument();
    // Round 2: reference Waiting KHÔNG có badge demo — badge "Dữ liệu mẫu"
    // chỉ còn ở Active workspace (không thêm visual noise cho waiting).
    expect(screen.queryByText("Dữ liệu mẫu")).not.toBeInTheDocument();
  });

  it("waiting topbar: breadcrumb V-Intern > Intern Workspace > Tổng quan + search", () => {
    renderEmpty();

    // Round 3 (sync Instructor shell): Waiting dùng CÙNG composition topbar
    // với Active/Instructor — breadcrumb trái, search phải, không variant.
    const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(
      within(breadcrumb).getByText("Intern Workspace"),
    ).toBeInTheDocument();
    const current = within(breadcrumb).getByText("Tổng quan");
    expect(current).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("searchbox", {
        name: "Tìm kiếm trong không gian thực tập",
      }),
    ).toBeInTheDocument();
  });

  it("card chính: Chưa có dự án được phân công + mô tả + 2 hành động", () => {
    renderEmpty();

    expect(
      screen.getByRole("heading", { name: "Chưa có dự án được phân công" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Bạn đã hoàn thành tuyển dụng tại V-Intern. Giảng viên sẽ phân bạn vào một Project và Internship Session phù hợp. Khi được phân công, Sprint và Task sẽ xuất hiện tại đây.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Xem hồ sơ tuyển dụng/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Xem hướng dẫn/ }),
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
      within(steps).getByText("Giảng viên phân công dự án"),
    ).toBeInTheDocument();
    expect(
      within(steps).getByText("Bạn nhận thông báo tham gia phiên thực tập"),
    ).toBeInTheDocument();
    expect(
      within(steps).getByText("Sprint và Task xuất hiện trong workspace"),
    ).toBeInTheDocument();
  });

  it("Hoạt động gần đây 3 mốc + Lưu ý đủ 4 điều", () => {
    renderEmpty();

    const activity = screen.getByRole("region", {
      name: "Hoạt động gần đây",
    });
    expect(
      within(activity).getByText("Hoàn thành phỏng vấn AI Recruiter"),
    ).toBeInTheDocument();
    expect(
      within(activity).getByText("Nhận role Frontend Developer"),
    ).toBeInTheDocument();
    expect(
      within(activity).getByText("Đang chờ phân công dự án"),
    ).toBeInTheDocument();

    const notes = screen.getByRole("region", { name: "Lưu ý" });
    expect(
      within(notes).getByText("Bạn không tự chọn Project."),
    ).toBeInTheDocument();
    expect(
      within(notes).getByText("Bạn không tự vào Session."),
    ).toBeInTheDocument();
    expect(
      within(notes).getByText(
        "Project và phiên thực tập sẽ do giảng viên phân công.",
      ),
    ).toBeInTheDocument();
    expect(
      within(notes).getByText(
        "Bạn sẽ nhận được thông báo khi có dự án và phiên thực tập phù hợp.",
      ),
    ).toBeInTheDocument();
  });

  it("sidebar waiting: cùng model với Active — 2 section heading, label chuẩn, badge unread chung", () => {
    renderEmpty();

    const nav = screen.getByRole("navigation", {
      name: "Điều hướng thực tập sinh",
    });

    // Round 3.1: heading section GIỐNG HỆT Active (không còn "2 nhóm
    // không tiêu đề" của waiting cũ).
    expect(within(nav).getByText("Workspace")).toBeInTheDocument();
    expect(within(nav).getByText("Hiệu suất & Phát triển")).toBeInTheDocument();

    // Label chuẩn hoá theo source of truth Active: "Sprint" → "Sprint
    // Board", "KPI" → "KPI & Lương ảo", bổ sung "Đánh giá".
    for (const label of [
      "Tổng quan",
      "Công việc của tôi",
      "Sprint Board",
      "Dự án",
      "AI Mentor",
      "Thông báo",
      "Đánh giá",
      "KPI & Lương ảo",
      "Chứng nhận",
      "Cài đặt",
    ]) {
      expect(within(nav).getAllByText(label).length).toBeGreaterThan(0);
    }
    // Không còn label cũ standalone trong nav.
    expect(
      within(nav).queryByRole("button", { name: "Sprint" }),
    ).not.toBeInTheDocument();
    expect(
      within(nav).queryByRole("button", { name: "KPI" }),
    ).not.toBeInTheDocument();

    // Badge "Thông báo" dùng CÙNG nguồn unread với Active (dataset thông
    // báo chung) — không hardcode số riêng cho waiting.
    const unread = getUnreadNotificationCount();
    expect(unread).toBeGreaterThan(0);
    expect(within(nav).getByText(String(unread))).toBeInTheDocument();
  });

  it("sidebar waiting: thứ tự item GIỐNG HỆT Active (1 nav model chung)", () => {
    renderEmpty();

    const nav = screen.getByRole("navigation", {
      name: "Điều hướng thực tập sinh",
    });
    expect(getSidebarNavLabels(nav)).toEqual(EXPECTED_INTERN_NAV_ITEM_ORDER);
  });

  it("sidebar waiting: Sprint Board + Dự án unavailable (disabled, aria-disabled, không giả link)", () => {
    renderEmpty();

    const nav = screen.getByRole("navigation", {
      name: "Điều hướng thực tập sinh",
    });

    // Chưa có Project → Sprint Board/Dự án: visible nhưng disabled +
    // aria-disabled, không giả link (không đổi icon/label theo state).
    const sprintBoard = within(nav).getByRole("button", {
      name: "Sprint Board",
    });
    expect(sprintBoard).toBeDisabled();
    expect(sprintBoard).toHaveAttribute("aria-disabled", "true");
    const duAn = within(nav).getByRole("button", { name: "Dự án" });
    expect(duAn).toBeDisabled();
    expect(duAn).toHaveAttribute("aria-disabled", "true");

    // Không tự tiện disable thêm mục nào — business behavior giữ nguyên.
    expect(
      within(nav).getByRole("button", { name: "Công việc của tôi" }),
    ).toBeEnabled();
    expect(
      within(nav).getByRole("button", { name: "AI Mentor" }),
    ).toBeEnabled();
    expect(within(nav).getByRole("button", { name: "Đánh giá" })).toBeEnabled();
    expect(
      within(nav).getByRole("button", { name: "KPI & Lương ảo" }),
    ).toBeEnabled();

    // Tổng quan vẫn là link thật và là mục active duy nhất.
    const overview = within(nav).getByRole("link", { name: "Tổng quan" });
    expect(overview).toHaveAttribute("href", "/intern");
    expect(overview).toHaveAttribute("aria-current", "page");
  });

  it("drawer mobile (waiting): cùng nav model — 2 section, đủ item, badge, Sprint Board/Dự án disabled", async () => {
    const user = userEvent.setup();
    renderEmpty();

    await user.click(
      screen.getByRole("button", { name: "Mở menu điều hướng" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Menu thực tập sinh" });

    // Drawer dùng CÙNG groups với desktop — không có list mobile riêng.
    const nav = within(dialog).getByRole("navigation", {
      name: "Điều hướng thực tập sinh",
    });
    expect(within(nav).getByText("Workspace")).toBeInTheDocument();
    expect(within(nav).getByText("Hiệu suất & Phát triển")).toBeInTheDocument();
    expect(getSidebarNavLabels(nav)).toEqual(EXPECTED_INTERN_NAV_ITEM_ORDER);
    expect(
      within(nav).getByText(String(getUnreadNotificationCount())),
    ).toBeInTheDocument();
    expect(
      within(nav).getByRole("button", { name: "Sprint Board" }),
    ).toBeDisabled();
    expect(within(nav).getByRole("button", { name: "Dự án" })).toBeDisabled();
  });

  it("welcome card: mascot minh hoạ là ảnh trang trí (không lỡ screen reader)", () => {
    const { container } = renderEmpty();

    // next/image render src qua optimizer URL → khớp một phần tên asset.
    const mascot = container.querySelector('img[src*="student-mascot"]');
    expect(mascot).not.toBeNull();
    // Ảnh thuần trang trí: alt rỗng + aria-hidden ở wrapper.
    expect(mascot).toHaveAttribute("alt", "");
    expect(mascot?.parentElement).toHaveAttribute("aria-hidden", "true");
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
      screen.getByRole("button", { name: /Xem Sprint Board/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Nộp PR/ })).toBeInTheDocument();
    expect(screen.getByText("Dữ liệu mẫu")).toBeInTheDocument();
  });

  it("5 KPI đúng giá trị derive từ dataset (Sprint points, Task Sprint hiện tại, Review, Deadline, Lương ảo)", () => {
    renderActive();

    const kpis = screen.getByRole("list", { name: "Chỉ số tổng quan" });
    const stats = getBoardStats(getActiveState());

    expect(within(kpis).getByText("Tiến độ Sprint")).toBeInTheDocument();
    // Sprint progress = metric ĐIỂM CAM KẾT sprint-level (sprint planning
    // 12/18 → 67%), KHÔNG phải phép cộng points các card trên board —
    // note phải ghi rõ "điểm cam kết" để tách scope khỏi board dataset.
    expect(within(kpis).getByText("12 / 18 điểm cam kết")).toBeInTheDocument();
    expect(within(kpis).getByText("67%")).toBeInTheDocument();

    // Scope rõ ràng: KPI task là SPRINT HIỆN TẠI (derive từ board), metric
    // tích lũy nằm riêng ở Performance "Task hoàn thành (Sprint 01 – 03)".
    expect(within(kpis).getByText("Task Sprint hiện tại")).toBeInTheDocument();
    expect(
      within(kpis).getByText(`${stats.doneTasks} / ${stats.totalTasks}`),
    ).toBeInTheDocument();
    expect(within(kpis).getByText("hoàn thành")).toBeInTheDocument();

    expect(
      within(kpis).getByText("Điểm review trung bình"),
    ).toBeInTheDocument();
    expect(within(kpis).getByText("82 / 100")).toBeInTheDocument();

    expect(within(kpis).getByText("Deadline gần nhất")).toBeInTheDocument();
    expect(within(kpis).getByText("VIN-103")).toBeInTheDocument();
    expect(within(kpis).getByText("Hôm nay, 16:00")).toBeInTheDocument();

    expect(within(kpis).getByText("Lương ảo tạm tính")).toBeInTheDocument();
    expect(
      within(kpis).getByText(formatVnd(INTERN_VIRTUAL_SALARY)),
    ).toBeInTheDocument();
    expect(
      within(kpis).getByText("+12% so với sprint trước"),
    ).toBeInTheDocument();
  });

  it("Task Board 4 cột 3/2/2/2, VIN-103 + VIN-107 ở Doing, tổng 9 task — derive từ dataset", () => {
    renderActive();

    const board = screen.getByRole("region", { name: "Task Board" });
    const active = getActiveState();

    // Business state gốc của board: To Do 3 / Doing 2 / Review 2 / Done 2.
    expect(active.boardColumns.map((column) => column.tasks.length)).toEqual([
      3, 2, 2, 2,
    ]);

    for (const column of active.boardColumns) {
      const columnItem = within(board).getByRole("listitem", {
        name: `${column.title}, ${column.tasks.length} task`,
      });
      // Mỗi task của cột render đúng ID bên trong cột đó.
      for (const task of column.tasks) {
        expect(within(columnItem).getByText(task.id)).toBeInTheDocument();
      }
    }

    // VIN-103 nằm trong cột Doing (không ở cột khác) — số task cột derive.
    const doingColumn = active.boardColumns.find(
      (column) => column.id === "doing",
    );
    expect(doingColumn).toBeDefined();
    const doing = within(board).getByRole("listitem", {
      name: `Doing, ${doingColumn!.tasks.length} task`,
    });
    expect(within(doing).getByText("VIN-103")).toBeInTheDocument();
    expect(within(doing).getByText("Integrate Login API")).toBeInTheDocument();
    expect(within(doing).getByText("Hôm nay, 16:00")).toBeInTheDocument();
    // VIN-107 vẫn nằm ở Doing — không chuyển task sang Done để ép KPI.
    expect(within(doing).getByText("VIN-107")).toBeInTheDocument();
    expect(within(doing).getByText("Error Handling")).toBeInTheDocument();

    // Tổng 9 task trên board — derive từ dataset, khớp số card render.
    const boardTotal = active.boardColumns.reduce(
      (sum, column) => sum + column.tasks.length,
      0,
    );
    expect(boardTotal).toBe(9);
    expect(within(board).getAllByText(/^VIN-\d{3}$/).length).toBe(boardTotal);
  });

  it("3 metric 3 scope: sprint commitment 12/18, board KPI derive 2/9, cumulative 14/21", () => {
    const active = getActiveState();
    const stats = getBoardStats(active);

    // Ràng buộc business state gốc: 3/2/2/2, tổng 9 task, Done = 2,
    // VIN-103 và VIN-107 vẫn ở Doing (không đẩy task sang Done ép KPI).
    expect(active.boardColumns.map((c) => c.tasks.length)).toEqual([
      3, 2, 2, 2,
    ]);
    expect(stats.totalTasks).toBe(9);
    expect(stats.doneTasks).toBe(2);
    const doing = active.boardColumns.find((column) => column.id === "doing");
    expect(doing?.tasks.some((task) => task.id === "VIN-103")).toBe(true);
    expect(doing?.tasks.some((task) => task.id === "VIN-107")).toBe(true);

    // Story points giữ nguyên dữ liệu gốc (không đổi points để ép KPI):
    // To Do 7 + Doing 8 + Review 8 + Done 5 = 28; Done = 5.
    expect(stats.totalPoints).toBe(28);
    expect(stats.donePoints).toBe(5);

    const sprintKpi = active.kpis.find((kpi) => kpi.id === "tien-do-sprint");
    const taskKpi = active.kpis.find(
      (kpi) => kpi.id === "task-sprint-hien-tai",
    );

    // Scope A — Sprint progress: commitment metric sprint-level, giá trị
    // 12/18 = 67% chốt từ sprint planning, KHÔNG derive từ board points
    // (28/5) — note "điểm cam kết" thể hiện scope trong UI.
    expect(sprintKpi?.value).toBe("67%");
    expect(sprintKpi?.note).toBe("12 / 18 điểm cam kết");
    expect(sprintKpi?.progress).toBe(67);

    // Scope B — KPI task derive TRỰC TIẾP từ board dataset (không
    // hardcode 2/9): dùng đúng stats derive từ dataset ở trên.
    expect(taskKpi?.value).toBe(`${stats.doneTasks} / ${stats.totalTasks}`);
    expect(taskKpi?.value).toBe("2 / 9");
    expect(taskKpi?.progress).toBe(
      Math.round((stats.doneTasks / stats.totalTasks) * 100),
    );

    // Scope C — Cumulative Sprint 01–03 nằm riêng ở Performance, khác
    // dataset với 2 KPI trên.
    expect(active.performance.title).toBe(
      "Hiệu suất thực tập (Sprint 01 – 03)",
    );
    expect(active.performance.metrics[0]?.label).toBe(
      "Task hoàn thành (Sprint 01 – 03)",
    );
    expect(active.performance.metrics[0]?.value).toBe("14 / 21");
  });

  it("Task đang tập trung VIN-103: wording KHÔNG gợi ý localStorage", () => {
    renderActive();

    const focused = screen.getByRole("region", {
      name: "Task đang tập trung",
    });

    expect(
      within(focused).getByText(
        "Tích hợp API đăng nhập, xử lý response và quản lý phiên đăng nhập theo cơ chế xác thực hiện tại của hệ thống.",
      ),
    ).toBeInTheDocument();
    expect(
      within(focused).getByText(
        "Quản lý session/token theo cơ chế auth hiện tại của hệ thống",
      ),
    ).toBeInTheDocument();
    expect(within(focused).getByText("5 points")).toBeInTheDocument();
    expect(
      within(focused).getByText("Hạn nộp: Hôm nay, 16:00"),
    ).toBeInTheDocument();

    // Trạng thái từng mục DoD có text cho screen reader, không chỉ màu.
    expect(within(focused).getAllByText("(hoàn thành)")).toHaveLength(2);
    expect(within(focused).getAllByText("(chưa hoàn thành)")).toHaveLength(3);

    // Toàn trang không wording "local storage" (mâu thuẫn auth thật:
    // access token in-memory + refresh token HttpOnly cookie).
    expect(screen.queryByText(/local\s?storage/i)).not.toBeInTheDocument();
  });

  it("AI Mentor: hội thoại mock 4 bước xử lý 401, KHÔNG gọi AI API", () => {
    renderActive();

    const mentor = screen.getByRole("region", { name: "AI Mentor" });

    expect(
      within(mentor).getByText(
        "Ngữ cảnh task hiện tại: VIN-103 – Integrate Login API",
      ),
    ).toBeInTheDocument();
    expect(
      within(mentor).getByText("API login trả 401, em nên kiểm tra gì?"),
    ).toBeInTheDocument();
    expect(
      within(mentor).getByText(
        "Bạn hãy kiểm tra lần lượt: (1) request payload có đúng định dạng không, (2) thông tin xác thực cần thiết, (3) response/error code từ endpoint, (4) session/token có còn hợp lệ không. Bạn cũng có thể kiểm tra tab Network trong DevTools.",
      ),
    ).toBeInTheDocument();
    // Input visual-only với label accessible.
    expect(
      within(mentor).getByLabelText("Hỏi AI Mentor về task này"),
    ).toBeInTheDocument();
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
        "Cần xử lý lỗi 401 rõ hơn trong trường hợp session/token hết hạn",
      ),
    ).toBeInTheDocument();
    expect(
      within(pr).getByText("Nên bổ sung test case cho invalid credentials"),
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
      within(notifications).getByText(`${unread} chưa đọc`),
    ).toBeInTheDocument();
    expect(unread).toBe(3);
  });

  it("Hiệu suất thực tập: 6 metric theo reference (Sprint 01 – 03)", () => {
    renderActive();

    const performance = screen.getByRole("region", {
      name: "Hiệu suất thực tập (Sprint 01 – 03)",
    });

    expect(within(performance).getByText("14 / 21")).toBeInTheDocument();
    // Metric tích lũy phải nói rõ scope để không đọc nhầm với KPI
    // "Task Sprint hiện tại" (chỉ Sprint 03).
    expect(
      within(performance).getByText("Task hoàn thành (Sprint 01 – 03)"),
    ).toBeInTheDocument();
    expect(within(performance).getByText("42 / 60")).toBeInTheDocument();
    expect(within(performance).getByText("82 / 100")).toBeInTheDocument();
    expect(within(performance).getByText("84 / 100")).toBeInTheDocument();
    expect(within(performance).getByText("Đạt kỳ vọng")).toBeInTheDocument();
    expect(
      within(performance).getByText(formatVnd(INTERN_VIRTUAL_SALARY)),
    ).toBeInTheDocument();
    expect(
      within(performance).getByText("+12% so với kỳ trước"),
    ).toBeInTheDocument();
    expect(within(performance).getByText("Chưa sẵn sàng")).toBeInTheDocument();
    expect(
      within(performance).getByText("Hoàn thành 3/6 sprint"),
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

    // Round 3.1: cùng nav model với waiting — thứ tự item phải giống hệt.
    expect(getSidebarNavLabels(nav)).toEqual(EXPECTED_INTERN_NAV_ITEM_ORDER);

    // Sprint Board + Dự án available ở active (regression waiting flag).
    expect(
      within(nav).getByRole("button", { name: "Sprint Board" }),
    ).toBeEnabled();
    expect(within(nav).getByRole("button", { name: "Dự án" })).toBeEnabled();

    // Badge "Thông báo" derive từ unread notifications (3).
    const unread = getUnreadNotificationCount();
    expect(within(nav).getByText(String(unread))).toBeInTheDocument();
  });

  it("sidebar active: không có mục nào bị disabled (regression waiting flag)", () => {
    renderActive();

    const nav = screen.getByRole("navigation", {
      name: "Điều hướng thực tập sinh",
    });

    // Flag `unavailable` chỉ dùng ở state waiting — active phải toàn bộ
    // item đều tương tác được.
    for (const button of within(nav)
      .getAllByRole("button")
      .filter((button) => button.textContent !== "Cài đặt")) {
      expect(button).toBeEnabled();
    }
  });

  it("active topbar: giữ breadcrumb org > project > sprint", () => {
    renderActive();

    // Round 3: không còn variant — Active giữ nguyên breadcrumb như cũ.
    expect(
      screen.getByRole("navigation", { name: "Breadcrumb" }),
    ).toBeInTheDocument();
  });
});

describe("InternWorkspace — default state & preview (dev-only)", () => {
  it("không có preview → default derive từ dataset (hiện là ACTIVE)", () => {
    render(<InternWorkspace />);

    // Default là ACTIVE: Task Board xuất hiện, Empty card không.
    expect(
      screen.getByRole("region", { name: "Task Board" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Chưa có dự án được phân công" }),
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
        within(dialog).getByRole("link", { name: "Tổng quan" }),
      ).toHaveFocus();
    });

    fireEvent.keyDown(window, { key: "Escape" });

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Menu thực tập sinh" }),
      ).not.toBeInTheDocument();
    });
    expect(menuButton).toHaveFocus();
  });
});
