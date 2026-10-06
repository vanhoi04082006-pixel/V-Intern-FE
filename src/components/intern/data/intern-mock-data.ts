import type { LucideIcon } from "lucide-react";
import {
  Award,
  Bell,
  Bot,
  CalendarDays,
  ChartColumn,
  CircleCheck,
  ClipboardCheck,
  Clock,
  CodeXml,
  FolderKanban,
  Home,
  Layers,
  ListChecks,
  ListTodo,
  Settings,
  SquareKanban,
  Star,
  Timer,
  Wallet,
} from "lucide-react";

import type { InternPreviewState } from "../intern-preview";
import type { InternTone } from "../intern-ui-tones";

/**
 * Mock/presentation data cho Intern Workspace (/intern).
 *
 * QUAN TRỌNG — đây là dữ liệu trình bày tĩnh để dựng UI theo 2 reference:
 * - KHÔNG map vào backend endpoint nào, KHÔNG gọi API intern/task/sprint.
 * - Các hành động (Xem Sprint Board, Nộp PR, Hỏi Mentor...) chỉ là
 *   visual-only, không state, không persistence.
 * - Auth/RBAC thật không đổi: access token in-memory, refresh token
 *   HttpOnly cookie, session khôi phục bằng `refreshSession()`.
 *
 * Quy ước domain V-Intern dùng cho toàn bộ mock data (giống instructor):
 *   Internship Program → Project → LabSession → Sprint → Task
 * - ID task: "VIN-xxx" (chỉ trong ngữ cảnh task/sprint/PR).
 * - Một mốc thời gian "hiện tại" duy nhất cho cả dashboard:
 *   21/05/2024, 14:21 → "Hôm nay, 16:00" = deadline VIN-103.
 * - Số liệu derive được thì derive (tổng cột board, unread notification,
 *   phần trăm progress) — không rải con số trùng lặp ở nhiều chỗ.
 */

/* ------------------------------- Helpers --------------------------------- */

/** Phần trăm làm tròn — dùng cho mọi progress để tránh lệch số liệu. */
function percentOf(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

const VND_FORMATTER = new Intl.NumberFormat("vi-VN");

/** Format lương ảo theo convention vi-VN của repo: "2.500.000 VNĐ". */
export function formatVnd(amount: number): string {
  return `${VND_FORMATTER.format(amount)} VNĐ`;
}

/* ------------------------------ Sidebar nav ------------------------------ */

export interface InternNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Route thật — task này chỉ "Tổng quan" có destination. */
  href?: string;
  /** Số chưa đọc. Khi có thể, derive từ dataset (unread notifications). */
  badge?: number;
  /**
   * Mục chưa khả dụng ở state waiting (Sprint/Dự án cần Project đã được
   * phân công) — render muted + disabled, không giả link. State active
   * không dùng flag này.
   */
  unavailable?: boolean;
}

export interface InternNavGroup {
  id: string;
  /** Nhóm có tiêu đề (state active) hoặc không (state empty — chỉ divider). */
  label?: string;
  items: InternNavItem[];
}

export const INTERN_OVERVIEW_NAV_ID = "tong-quan";

export const INTERN_BOTTOM_NAV: InternNavItem = {
  id: "cai-dat",
  label: "Cài đặt",
  icon: Settings,
};

/* ---------------------------- Current user ------------------------------- */

export interface InternWorkspaceUser {
  name: string;
  /** Label hiển thị dưới tên trên topbar ("Sinh viên" / "Intern"). */
  roleLabel: string;
  initials: string;
  /**
   * Badge chuông thông báo trên topbar: `number` = đếm cụ thể (state active,
   * derive từ unread notifications), `null` = chỉ chấm đỏ không số
   * (state empty — chưa có hệ thống thông báo để đếm).
   */
  notificationBadge: number | null;
}

export const INTERN_SEARCH_PLACEHOLDER_ACTIVE =
  "Tìm kiếm task, tài liệu, hoặc hỏi Mentor...";
export const INTERN_SEARCH_PLACEHOLDER_EMPTY =
  "Tìm kiếm dự án, tài liệu, thông báo...";

/* ------------------------- Workspace state model ------------------------- */

export interface InternWelcomeBadge {
  id: string;
  label: string;
  icon: LucideIcon;
  tone: InternTone;
}

export interface InternWelcomeContent {
  greeting: string;
  message: string;
  badges: InternWelcomeBadge[];
}

export interface InternInfoRow {
  id: string;
  label: string;
  value: string;
  icon: LucideIcon;
  tone: InternTone;
}

export interface InternNextStep {
  order: number;
  title: string;
  description: string;
}

export interface InternActivityItem {
  id: string;
  title: string;
  description: string;
  timeLabel: string;
  tone: InternTone;
}

export interface InternAssignment {
  /** "Frontend Developer" */
  role: string;
  /** "E-commerce Platform" */
  project: string;
  /** "Session 01" */
  session: string;
  /** "Sprint 03" */
  sprint: string;
  /** "Active" */
  statusLabel: string;
  breadcrumb: { org: string; project: string; sprint: string };
  /** Meta row dưới H1: Vai trò / Lab Session / Sprint hiện tại / Trạng thái */
  meta: { id: string; label: string; value: string; icon: LucideIcon }[];
}

export interface InternTask {
  id: string;
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  points: number;
  /** "17/05/2024" hoặc "Hôm nay, 16:00" (deadline hôm nay → tô đỏ). */
  dueLabel: string;
  /** `red` khi dueLabel là deadline hôm nay, `slate` cho ngày thường. */
  dueTone: InternTone;
}

export type InternBoardColumnId = "todo" | "doing" | "review" | "done";

export interface InternBoardColumn {
  id: InternBoardColumnId;
  title: string;
  tone: InternTone;
  tasks: InternTask[];
}

export interface InternFocusedTask {
  taskId: string;
  title: string;
  priority: "High" | "Medium" | "Low";
  points: number;
  deadlineLabel: string;
  /**
   * Wording cố ý KHÔNG nói "lưu token vào localStorage" — auth thật của
   * hệ thống: access token in-memory + refresh token HttpOnly cookie.
   * Đây chỉ là nội dung mock task, không thay đổi auth implementation.
   */
  description: string;
  dod: { label: string; done: boolean }[];
}

export interface InternMentorMessage {
  id: string;
  author: "intern" | "mentor";
  text: string;
  timeLabel: string;
}

export interface InternMentorConversation {
  contextLine: string;
  messages: InternMentorMessage[];
  inputPlaceholder: string;
}

export interface InternPullRequestReview {
  prLabel: string;
  branch: string;
  statusLabel: string;
  reviewScore: string;
  resultLabel: string;
  feedback: string[];
}

export interface InternNotification {
  id: string;
  text: string;
  timeLabel: string;
  tone: InternTone;
  unread: boolean;
}

export interface InternPerformanceMetric {
  id: string;
  label: string;
  value: string;
  icon: LucideIcon;
  tone: InternTone;
  /** Progress bar mini (0-100) khi metric có tỷ lệ. */
  percent?: number;
  note?: string;
  noteTone?: InternTone;
}

export interface InternPerformanceSummary {
  title: string;
  metrics: InternPerformanceMetric[];
}

export interface InternKpi {
  id: string;
  label: string;
  value: string;
  icon: LucideIcon;
  tone: InternTone;
  note?: string;
  noteTone?: InternTone;
  /** Progress bar (0-100) — KPI có tỷ lệ (Sprint, Task, Review). */
  progress?: number;
}

/**
 * Discriminated union cho 2 business state của workspace — chỉ 1 route
 * `/intern`, KHÔNG có /intern-empty hay /intern-active.
 */
export type InternWorkspaceState =
  | {
      status: "unassigned";
      user: InternWorkspaceUser;
      assignment: null;
      navGroups: InternNavGroup[];
      searchPlaceholder: string;
      pageSubtitle: string;
      welcome: InternWelcomeContent;
      emptyCard: {
        title: string;
        description: string;
        primaryAction: string;
        secondaryAction: string;
      };
      infoRows: InternInfoRow[];
      nextSteps: InternNextStep[];
      recentActivities: InternActivityItem[];
      activitiesActionLabel: string;
      notes: string[];
      notesFooter: string;
    }
  | {
      status: "active";
      user: InternWorkspaceUser;
      assignment: InternAssignment;
      navGroups: InternNavGroup[];
      searchPlaceholder: string;
      headerActions: { id: string; label: string; primary: boolean }[];
      kpis: InternKpi[];
      boardColumns: InternBoardColumn[];
      focusedTask: InternFocusedTask;
      mentor: InternMentorConversation;
      pullRequest: InternPullRequestReview;
      notifications: InternNotification[];
      notificationsActionLabel: string;
      performance: InternPerformanceSummary;
    };

/* --------------------------- Derived mock data ---------------------------- */

/**
 * Lương ảo tạm tính — hằng số gốc duy nhất; mọi nơi hiển thị đều format
 * từ đây (`formatVnd(INTERN_VIRTUAL_SALARY)`).
 */
export const INTERN_VIRTUAL_SALARY = 2_500_000;

/** Salary delta so với sprint trước (%) — chỉ 1 nguồn truth. */
export const INTERN_SALARY_DELTA_PERCENT = 12;

/**
 * LƯU Ý VỀ SCOPE SỐ LIỆU TASK — có 3 metric RỜI NHAU, không cùng dataset:
 * 1. "Tiến độ Sprint" (12/18 = 67%): metric ĐIỂM CAM KẾT sprint-level,
 *    chốt tại sprint planning của Sprint 03. KHÔNG phải phép cộng story
 *    points của các card đang hiển thị trên Task Board (points card được
 *    ước lượng lại trong sprint nên không còn khớp commitment gốc).
 * 2. "Task Sprint hiện tại" (2/9 hoàn thành): DERIVE trực tiếp từ
 *    INTERN_BOARD_COLUMNS bên dưới (task cột Done / tổng task) — chỉ
 *    phản ánh snapshot board Sprint 03.
 * 3. "Task hoàn thành (Sprint 01 – 03)" (14/21): metric TÍCH LŨY toàn
 *    program, chỉ xuất hiện ở INTERN_PERFORMANCE với label nói rõ phạm vi.
 * Không được mô tả/gộp 3 metric này như cùng một nguồn số liệu.
 */

/* ------------------------------ Empty state ------------------------------- */

const INTERN_USER_EMPTY: InternWorkspaceUser = {
  name: "Nguyễn Văn A",
  roleLabel: "Sinh viên",
  initials: "NA",
  notificationBadge: null,
};

const INTERN_NAV_EMPTY: InternNavGroup[] = [
  {
    id: "nhom-chinh",
    items: [
      {
        id: INTERN_OVERVIEW_NAV_ID,
        label: "Tổng quan",
        icon: Home,
        href: "/intern",
      },
      { id: "cong-viec-cua-toi", label: "Công việc của tôi", icon: ListTodo },
      {
        id: "sprint",
        label: "Sprint",
        icon: Timer,
        unavailable: true,
      },
      {
        id: "du-an",
        label: "Dự án",
        icon: FolderKanban,
        unavailable: true,
      },
    ],
  },
  {
    id: "nhom-ho-tro",
    items: [
      { id: "ai-mentor", label: "AI Mentor", icon: Bot },
      { id: "thong-bao", label: "Thông báo", icon: Bell },
      { id: "kpi", label: "KPI", icon: ChartColumn },
      { id: "chung-nhan", label: "Chứng nhận", icon: Award },
    ],
  },
];

const INTERN_WELCOME: InternWelcomeContent = {
  greeting: "Xin chào, Nguyễn Văn A 👋",
  message:
    "Chào mừng bạn đến với không gian thực tập tại V-Intern. Hãy sẵn sàng cho hành trình học hỏi và phát triển sắp tới!",
  badges: [
    {
      id: "badge-vai-tro",
      label: "Frontend Developer",
      icon: CodeXml,
      tone: "blue",
    },
    {
      id: "badge-tuyen-dung",
      label: "Đã hoàn thành tuyển dụng",
      icon: CircleCheck,
      tone: "green",
    },
  ],
};

const INTERN_INFO_ROWS: InternInfoRow[] = [
  {
    id: "vai-tro",
    label: "Vai trò",
    value: "Frontend Developer",
    icon: CodeXml,
    tone: "blue",
  },
  {
    id: "project",
    label: "Project",
    value: "Chưa được phân công",
    icon: FolderKanban,
    tone: "slate",
  },
  {
    id: "session",
    label: "Session",
    value: "Chưa được phân công",
    icon: CalendarDays,
    tone: "slate",
  },
  {
    id: "sprint",
    label: "Sprint",
    value: "Chưa có",
    icon: Timer,
    tone: "slate",
  },
  {
    id: "task",
    label: "Task",
    value: "0",
    icon: ListTodo,
    tone: "slate",
  },
  {
    id: "trang-thai",
    label: "Trạng thái",
    value: "Chờ phân công",
    icon: Clock,
    tone: "amber",
  },
];

const INTERN_NEXT_STEPS: InternNextStep[] = [
  {
    order: 1,
    title: "Giảng viên phân công dự án",
    description:
      "Bạn sẽ được giảng viên phân vào một dự án phù hợp với vai trò và định hướng.",
  },
  {
    order: 2,
    title: "Bạn nhận thông báo tham gia phiên thực tập",
    description:
      "Sau khi có dự án, bạn sẽ nhận thông báo về phiên thực tập cụ thể.",
  },
  {
    order: 3,
    title: "Sprint và Task xuất hiện trong workspace",
    description:
      "Khi dự án và phiên được kích hoạt, các Sprint và Task sẽ hiển thị tại đây.",
  },
];

const INTERN_RECENT_ACTIVITIES: InternActivityItem[] = [
  {
    id: "hoat-dong-1",
    title: "Hoàn thành phỏng vấn AI Recruiter",
    description: "Bạn đã hoàn thành phỏng vấn và đạt yêu cầu.",
    timeLabel: "15/04/2024 10:24",
    tone: "green",
  },
  {
    id: "hoat-dong-2",
    title: "Nhận role Frontend Developer",
    description: "Bạn được tuyển dụng vào vai trò Frontend Developer.",
    timeLabel: "15/04/2024 10:45",
    tone: "green",
  },
  {
    id: "hoat-dong-3",
    title: "Đang chờ phân công dự án",
    description:
      "Giảng viên sẽ sớm phân bạn vào dự án và phiên thực tập phù hợp.",
    timeLabel: "15/04/2024 10:45",
    tone: "blue",
  },
];

const INTERN_NOTES: string[] = [
  "Bạn không tự chọn Project.",
  "Bạn không tự vào Session.",
  "Project và phiên thực tập sẽ do giảng viên phân công.",
];

const INTERN_NOTES_FOOTER =
  "Bạn sẽ nhận được thông báo khi có dự án và phiên thực tập phù hợp.";

export const INTERN_WORKSPACE_EMPTY_STATE: InternWorkspaceState = {
  status: "unassigned",
  user: INTERN_USER_EMPTY,
  assignment: null,
  navGroups: INTERN_NAV_EMPTY,
  searchPlaceholder: INTERN_SEARCH_PLACEHOLDER_EMPTY,
  pageSubtitle: "Không gian làm việc và thực tập của bạn tại V-Intern",
  welcome: INTERN_WELCOME,
  emptyCard: {
    title: "Chưa có dự án được phân công",
    description:
      "Bạn đã hoàn thành tuyển dụng tại V-Intern. Giảng viên sẽ phân bạn vào một Project và Internship Session phù hợp. Khi được phân công, Sprint và Task sẽ xuất hiện tại đây.",
    primaryAction: "Xem hồ sơ tuyển dụng",
    secondaryAction: "Xem hướng dẫn",
  },
  infoRows: INTERN_INFO_ROWS,
  nextSteps: INTERN_NEXT_STEPS,
  recentActivities: INTERN_RECENT_ACTIVITIES,
  activitiesActionLabel: "Xem tất cả",
  notes: INTERN_NOTES,
  notesFooter: INTERN_NOTES_FOOTER,
};

/* ------------------------------ Active state ------------------------------ */

/**
 * Unread count derive ở đây để sidebar/topbar không hardcode "3" — badge
 * luôn khớp dataset thông báo.
 */
function countUnreadNotifications(
  notifications: InternNotification[]
): number {
  return notifications.filter((item) => item.unread).length;
}

const INTERN_USER_ACTIVE: InternWorkspaceUser = {
  name: "Nguyễn Văn A",
  roleLabel: "Intern",
  initials: "NA",
  // Gán sau khi khai báo NOTIFICATIONS (hằng bên dưới) — dùng placeholder,
  // được ghi đè ngay dưới đây để giữ 1 nguồn truth.
  notificationBadge: 0,
};

const INTERN_ASSIGNMENT: InternAssignment = {
  role: "Frontend Developer",
  project: "E-commerce Platform",
  session: "Session 01",
  sprint: "Sprint 03",
  statusLabel: "Active",
  breadcrumb: {
    org: "LingoSoft",
    project: "E-commerce Platform",
    sprint: "Sprint 03",
  },
  meta: [
    {
      id: "vai-tro",
      label: "Vai trò",
      value: "Frontend Developer",
      icon: CodeXml,
    },
    {
      id: "lab-session",
      label: "Lab Session",
      value: "Session 01",
      icon: CalendarDays,
    },
    {
      id: "sprint-hien-tai",
      label: "Sprint hiện tại",
      value: "Sprint 03",
      icon: Layers,
    },
  ],
};

const INTERN_NAV_ACTIVE: InternNavGroup[] = [
  {
    id: "nhom-workspace",
    label: "Workspace",
    items: [
      {
        id: INTERN_OVERVIEW_NAV_ID,
        label: "Tổng quan",
        icon: Home,
        href: "/intern",
      },
      { id: "cong-viec-cua-toi", label: "Công việc của tôi", icon: ListTodo },
      { id: "sprint-board", label: "Sprint Board", icon: SquareKanban },
      { id: "du-an", label: "Dự án", icon: FolderKanban },
      { id: "ai-mentor", label: "AI Mentor", icon: Bot },
      { id: "thong-bao", label: "Thông báo", icon: Bell },
    ],
  },
  {
    id: "nhom-hieu-suat",
    label: "Hiệu suất & Phát triển",
    items: [
      { id: "danh-gia", label: "Đánh giá", icon: ClipboardCheck },
      { id: "kpi-luong-ao", label: "KPI & Lương ảo", icon: ChartColumn },
      { id: "chung-nhan", label: "Chứng nhận", icon: Award },
    ],
  },
];

/**
 * Task Board — snapshot Sprint 03 (mốc hiện tại 21/05/2024 14:21).
 * Nguồn truth cho: placement task (3/2/2/2), tổng 9 task và KPI
 * "Task Sprint hiện tại" (task cột Done / tổng task — derive bên dưới).
 * KHÔNG phải nguồn của "Tiến độ Sprint" (12/18 điểm cam kết — metric
 * sprint planning, xem scope note đầu file) hay "Task hoàn thành
 * (Sprint 01 – 03)" (metric tích lũy ở INTERN_PERFORMANCE).
 */
const INTERN_BOARD_COLUMNS: InternBoardColumn[] = [
  {
    id: "todo",
    title: "To Do",
    tone: "slate",
    tasks: [
      {
        id: "VIN-104",
        title: "Form Validation",
        description:
          "Xây dựng validation cho form đăng ký và hiển thị lỗi phù hợp.",
        priority: "Medium",
        points: 3,
        dueLabel: "17/05/2024",
        dueTone: "slate",
      },
      {
        id: "VIN-108",
        title: "User Profile Page",
        description: "Xây dựng trang thông tin cá nhân của người dùng.",
        priority: "Low",
        points: 2,
        dueLabel: "18/05/2024",
        dueTone: "slate",
      },
      {
        id: "VIN-112",
        title: "UI/UX Improvements",
        description: "Tinh chỉnh giao diện responsive cho mobile.",
        priority: "Low",
        points: 2,
        dueLabel: "20/05/2024",
        dueTone: "slate",
      },
    ],
  },
  {
    id: "doing",
    title: "Doing",
    tone: "blue",
    tasks: [
      {
        id: "VIN-103",
        title: "Integrate Login API",
        description: "Tích hợp API đăng nhập và xử lý các trường hợp lỗi.",
        priority: "High",
        points: 5,
        dueLabel: "Hôm nay, 16:00",
        dueTone: "red",
      },
      {
        id: "VIN-107",
        title: "Error Handling",
        description:
          "Xử lý lỗi chung cho toàn bộ ứng dụng (API errors, network errors).",
        priority: "Medium",
        points: 3,
        dueLabel: "16/05/2024",
        dueTone: "slate",
      },
    ],
  },
  {
    id: "review",
    title: "Review",
    tone: "amber",
    tasks: [
      {
        id: "VIN-099",
        title: "Register Flow",
        description: "Xây dựng luồng đăng ký tài khoản mới.",
        priority: "High",
        points: 5,
        dueLabel: "15/05/2024",
        dueTone: "slate",
      },
      {
        id: "VIN-105",
        title: "Product Listing UI",
        description: "Hiển thị danh sách sản phẩm từ API.",
        priority: "Medium",
        points: 3,
        dueLabel: "16/05/2024",
        dueTone: "slate",
      },
    ],
  },
  {
    id: "done",
    title: "Done",
    tone: "green",
    tasks: [
      {
        id: "VIN-101",
        title: "Setup Project",
        description: "Cấu hình môi trường, cài đặt các dependency.",
        priority: "Low",
        points: 2,
        dueLabel: "12/05/2024",
        dueTone: "slate",
      },
      {
        id: "VIN-102",
        title: "Design Login UI",
        description: "Thiết kế giao diện đăng nhập theo Figma.",
        priority: "Medium",
        points: 3,
        dueLabel: "13/05/2024",
        dueTone: "slate",
      },
    ],
  },
];

/* --------------- Derived sprint stats (nguồn duy nhất: board) -------------- */

const INTERN_DONE_COLUMN = INTERN_BOARD_COLUMNS.find(
  (column) => column.id === "done"
);

/** Tổng số task của Sprint 03 — derive từ board (hiện tại 9). */
const INTERN_SPRINT_TOTAL_TASKS = INTERN_BOARD_COLUMNS.reduce(
  (sum, column) => sum + column.tasks.length,
  0
);
/** Số task đã hoàn thành (cột Done) — derive từ board (hiện tại 2). */
const INTERN_SPRINT_DONE_TASKS = INTERN_DONE_COLUMN?.tasks.length ?? 0;

/**
 * Điểm cam kết Sprint 03 — chốt tại sprint planning (sprint-level
 * commitment). KHÔNG derive từ points các card trên board: card points
 * được ước lượng lại trong sprint nên không còn khớp commitment gốc
 * (xem scope note đầu file — 3 metric, 3 dataset khác nhau).
 */
const INTERN_SPRINT_COMMITTED_POINTS = 18;
/** Phần commitment đã hoàn thành tính đến mốc snapshot (hiện tại 12). */
const INTERN_SPRINT_COMPLETED_COMMITTED_POINTS = 12;

const INTERN_KPIS: InternKpi[] = [
  {
    id: "tien-do-sprint",
    label: "Tiến độ Sprint",
    // Scope: ĐIỂM CAM KẾT sprint-level (sprint planning 12/18 → 67%),
    // KHÔNG phải tổng points các card trên board — note ghi rõ để tách
    // scope với "Task Sprint hiện tại" (derive từ board).
    value: `${percentOf(
      INTERN_SPRINT_COMPLETED_COMMITTED_POINTS,
      INTERN_SPRINT_COMMITTED_POINTS
    )}%`,
    note: `${INTERN_SPRINT_COMPLETED_COMMITTED_POINTS} / ${INTERN_SPRINT_COMMITTED_POINTS} điểm cam kết`,
    noteTone: "slate",
    icon: ListChecks,
    tone: "blue",
    progress: percentOf(
      INTERN_SPRINT_COMPLETED_COMMITTED_POINTS,
      INTERN_SPRINT_COMMITTED_POINTS
    ),
  },
  {
    id: "task-sprint-hien-tai",
    label: "Task Sprint hiện tại",
    // Derive từ board: số task Done / tổng task của Sprint 03. Scope là
    // SPRINT HIỆN TẠI — metric tích lũy program nằm ở Performance
    // "Task hoàn thành (Sprint 01 – 03)", hai số này không cùng phạm vi.
    value: `${INTERN_SPRINT_DONE_TASKS} / ${INTERN_SPRINT_TOTAL_TASKS}`,
    note: "hoàn thành",
    noteTone: "slate",
    icon: CircleCheck,
    tone: "green",
    progress: percentOf(INTERN_SPRINT_DONE_TASKS, INTERN_SPRINT_TOTAL_TASKS),
  },
  {
    id: "diem-review-trung-binh",
    label: "Điểm review trung bình",
    value: "82 / 100",
    icon: Star,
    tone: "amber",
    progress: 82,
  },
  {
    id: "deadline-gan-nhat",
    label: "Deadline gần nhất",
    value: "VIN-103",
    note: "Hôm nay, 16:00",
    noteTone: "red",
    icon: Clock,
    tone: "red",
  },
  {
    id: "luong-ao-tam-tinh",
    label: "Lương ảo tạm tính",
    value: formatVnd(INTERN_VIRTUAL_SALARY),
    note: `+${INTERN_SALARY_DELTA_PERCENT}% so với sprint trước`,
    noteTone: "green",
    icon: Wallet,
    tone: "violet",
  },
];

const INTERN_FOCUSED_TASK: InternFocusedTask = {
  taskId: "VIN-103",
  title: "Integrate Login API",
  priority: "High",
  points: 5,
  deadlineLabel: "Hạn nộp: Hôm nay, 16:00",
  description:
    "Tích hợp API đăng nhập, xử lý response và quản lý phiên đăng nhập theo cơ chế xác thực hiện tại của hệ thống.",
  dod: [
    { label: "Gọi được API login với dữ liệu hợp lệ", done: true },
    { label: "Xử lý trường hợp 401, 400, 500", done: true },
    // Wording khớp auth thật: access token in-memory + refresh cookie
    // HttpOnly — không nói "lưu token vào localStorage".
    {
      label: "Quản lý session/token theo cơ chế auth hiện tại của hệ thống",
      done: false,
    },
    { label: "Hiển thị thông báo lỗi phù hợp", done: false },
    { label: "Có test case cơ bản", done: false },
  ],
};

const INTERN_MENTOR: InternMentorConversation = {
  contextLine: "Ngữ cảnh task hiện tại: VIN-103 – Integrate Login API",
  messages: [
    {
      id: "msg-1",
      author: "intern",
      text: "API login trả 401, em nên kiểm tra gì?",
      timeLabel: "14:20",
    },
    {
      id: "msg-2",
      author: "mentor",
      text: "Bạn hãy kiểm tra lần lượt: (1) request payload có đúng định dạng không, (2) thông tin xác thực cần thiết, (3) response/error code từ endpoint, (4) session/token có còn hợp lệ không. Bạn cũng có thể kiểm tra tab Network trong DevTools.",
      timeLabel: "14:21",
    },
  ],
  inputPlaceholder: "Hỏi Mentor về task này...",
};

const INTERN_PULL_REQUEST: InternPullRequestReview = {
  prLabel: "PR #42",
  branch: "feat/login-api",
  statusLabel: "Submitted",
  reviewScore: "AI Review: 82/100",
  resultLabel: "Passed",
  feedback: [
    "Cần xử lý lỗi 401 rõ hơn trong trường hợp session/token hết hạn",
    "Nên bổ sung test case cho invalid credentials",
  ],
};

const INTERN_NOTIFICATIONS: InternNotification[] = [
  {
    id: "tb-1",
    text: "AI Reviewer đã hoàn tất đánh giá cho VIN-103",
    timeLabel: "14:21",
    tone: "green",
    unread: true,
  },
  {
    id: "tb-2",
    text: "PM đã tạo Change Request mới cho tính năng thanh toán",
    timeLabel: "13:10",
    tone: "blue",
    unread: true,
  },
  {
    id: "tb-3",
    text: "Sprint Review sẽ diễn ra lúc 15:30 hôm nay",
    timeLabel: "11:30",
    tone: "amber",
    unread: true,
  },
  {
    id: "tb-4",
    text: "Mentor đã trả lời câu hỏi của bạn",
    timeLabel: "10:15",
    tone: "slate",
    unread: false,
  },
];

const INTERN_PERFORMANCE: InternPerformanceSummary = {
  title: "Hiệu suất thực tập (Sprint 01 – 03)",
  metrics: [
    {
      // TÍCH LŨY toàn program (Sprint 01 – 03): 21 task được giao từ đầu,
      // 14 hoàn thành. KHÁC scope với KPI "Task Sprint hiện tại" (chỉ
      // Sprint 03, derive từ board) — label nói rõ phạm vi để không bị
      // đọc nhầm là cùng một số liệu.
      id: "task-hoan-thanh",
      label: "Task hoàn thành (Sprint 01 – 03)",
      value: "14 / 21",
      icon: CircleCheck,
      tone: "green",
      percent: percentOf(14, 21),
    },
    {
      id: "story-points",
      label: "Story Points",
      value: "42 / 60",
      icon: Layers,
      tone: "blue",
      percent: percentOf(42, 60),
    },
    {
      id: "diem-review",
      label: "Điểm review trung bình",
      value: "82 / 100",
      icon: Star,
      tone: "amber",
      percent: 82,
    },
    {
      id: "kpi-tam-tinh",
      label: "KPI tạm tính",
      value: "84 / 100",
      icon: ChartColumn,
      tone: "green",
      percent: 84,
      note: "Đạt kỳ vọng",
      noteTone: "green",
    },
    {
      id: "luong-ao",
      label: "Lương ảo tạm tính",
      value: formatVnd(INTERN_VIRTUAL_SALARY),
      icon: Wallet,
      tone: "violet",
      note: `+${INTERN_SALARY_DELTA_PERCENT}% so với kỳ trước`,
      noteTone: "green",
    },
    {
      id: "chung-nhan",
      label: "Chứng nhận",
      value: "Chưa sẵn sàng",
      icon: Award,
      tone: "red",
      note: "Hoàn thành 3/6 sprint",
      noteTone: "slate",
    },
  ],
};

const INTERN_NOTIFICATIONS_ACTIVE = INTERN_NOTIFICATIONS;

INTERN_USER_ACTIVE.notificationBadge = countUnreadNotifications(
  INTERN_NOTIFICATIONS_ACTIVE
);

const INTERN_NAV_ACTIVE_WITH_BADGE: InternNavGroup[] = INTERN_NAV_ACTIVE.map(
  (group) => ({
    ...group,
    items: group.items.map((item) =>
      item.id === "thong-bao"
        ? {
            ...item,
            badge: countUnreadNotifications(INTERN_NOTIFICATIONS_ACTIVE),
          }
        : item
    ),
  })
);

export const INTERN_WORKSPACE_ACTIVE_STATE: InternWorkspaceState = {
  status: "active",
  user: INTERN_USER_ACTIVE,
  assignment: INTERN_ASSIGNMENT,
  navGroups: INTERN_NAV_ACTIVE_WITH_BADGE,
  searchPlaceholder: INTERN_SEARCH_PLACEHOLDER_ACTIVE,
  headerActions: [
    { id: "xem-sprint-board", label: "Xem Sprint Board", primary: true },
    { id: "nop-pr", label: "Nộp PR", primary: false },
  ],
  kpis: INTERN_KPIS,
  boardColumns: INTERN_BOARD_COLUMNS,
  focusedTask: INTERN_FOCUSED_TASK,
  mentor: INTERN_MENTOR,
  pullRequest: INTERN_PULL_REQUEST,
  notifications: INTERN_NOTIFICATIONS_ACTIVE,
  notificationsActionLabel: "Xem tất cả",
  performance: INTERN_PERFORMANCE,
};

/* ------------------------------- Resolver --------------------------------- */

/**
 * Default state của workspace KHÔNG dựa vào query param: derive từ dataset
 * mock (assignment khác null → active; null → unassigned). Hiện dataset có
 * E-commerce Platform / Session 01 / Sprint 03 nên mặc định là ACTIVE.
 */
function deriveDefaultState(): InternWorkspaceState {
  return INTERN_WORKSPACE_ACTIVE_STATE.assignment !== null
    ? INTERN_WORKSPACE_ACTIVE_STATE
    : INTERN_WORKSPACE_EMPTY_STATE;
}

/**
 * Chọn business state cho `/intern`.
 * - Production / không có preview → derive từ dataset (hiện là ACTIVE).
 * - Dev + `?_preview=empty|active` → ép state tương ứng (chỉ SAU khi
 *   WorkspaceGuard đã xác thực role intern — preview không bypass auth).
 */
export function resolveInternWorkspaceState(
  preview: InternPreviewState | null
): InternWorkspaceState {
  if (preview === "empty") return INTERN_WORKSPACE_EMPTY_STATE;
  if (preview === "active") return INTERN_WORKSPACE_ACTIVE_STATE;
  return deriveDefaultState();
}
