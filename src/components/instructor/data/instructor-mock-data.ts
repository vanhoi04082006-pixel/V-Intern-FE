import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChartColumn,
  CircleCheck,
  Clock,
  CodeXml,
  FileText,
  FolderKanban,
  Home,
  Landmark,
  Layers,
  ListChecks,
  ListTodo,
  Plus,
  Rocket,
  ScanSearch,
  Settings,
  Sparkles,
  Star,
  UserPlus,
  Users,
} from "lucide-react";

import type { InstructorTone } from "../instructor-ui-tones";

/**
 * Mock/presentation data cho Instructor Workspace (/instructor).
 *
 * QUAN TRỌNG — đây là dữ liệu trình bày tĩnh để dựng UI theo reference:
 * - KHÔNG map vào backend endpoint nào, KHÔNG gọi API instructor/class/*.
 * - Các hành động (tạo phiên, duyệt PR, giao việc, xuất báo cáo...) chỉ là
 *   visual-only, không state, không persistence.
 * - Khi backend instructor API có contract thật, thay các hằng số dưới đây
 *   bằng fetch ở adapter riêng — giữ nguyên shape nếu có thể.
 */

/* ------------------------------ Sidebar nav ------------------------------ */

export interface InstructorNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Route thật — task này chỉ "Tổng quan" có destination. */
  href?: string;
  badge?: number;
}

/** Item đang active theo reference: "Tổng quan" */
export const INSTRUCTOR_OVERVIEW_NAV_ID = "tong-quan";

export const INSTRUCTOR_NAV_ITEMS: InstructorNavItem[] = [
  { id: INSTRUCTOR_OVERVIEW_NAV_ID, label: "Tổng quan", icon: Home, href: "/instructor" },
  { id: "lop-hoc", label: "Lớp học", icon: BookOpen },
  { id: "phien-thuc-tap", label: "Phiên thực tập", icon: CalendarDays },
  { id: "project-library", label: "Project Library", icon: FolderKanban },
  { id: "sprint-task", label: "Sprint & Task", icon: ListChecks },
  { id: "danh-gia-ai", label: "Đánh giá AI", icon: Sparkles },
  { id: "hieu-suat-sinh-vien", label: "Hiệu suất sinh viên", icon: Users },
  { id: "bao-cao", label: "Báo cáo", icon: FileText },
  { id: "thong-bao", label: "Thông báo", icon: Bell, badge: 3 },
];

export const INSTRUCTOR_BOTTOM_NAV: InstructorNavItem = {
  id: "cai-dat",
  label: "Cài đặt",
  icon: Settings,
};

/* ------------------------------ Current user ----------------------------- */

export interface InstructorCurrentUser {
  name: string;
  role: string;
  initials: string;
  notifications: number;
}

export const INSTRUCTOR_CURRENT_USER: InstructorCurrentUser = {
  name: "Nguyễn Minh Anh",
  role: "Giảng viên",
  initials: "NA",
  notifications: 3,
};

export const INSTRUCTOR_SEARCH_PLACEHOLDER =
  "Tìm kiếm sinh viên, lớp học, project, task...";

/* ---------------------------- Workspace header --------------------------- */

export interface InstructorMetaItem {
  id: string;
  label: string;
  value: string;
  icon: LucideIcon;
}

export const INSTRUCTOR_WORKSPACE_META: InstructorMetaItem[] = [
  { id: "vai-tro", label: "Vai trò", value: "Giảng viên / Technical Lead", icon: CodeXml },
  { id: "he-thong", label: "Hệ thống", value: "V-Intern Platform", icon: Landmark },
  { id: "phien-hien-tai", label: "Phiên hiện tại", value: "Session 01", icon: CalendarDays },
  { id: "sprint-hien-tai", label: "Sprint hiện tại", value: "Sprint 03", icon: Layers },
  { id: "cap-nhat-luc", label: "Cập nhật lúc", value: "16/05/2024, 14:21", icon: Clock },
];

/* -------------------------------- KPI cards ------------------------------ */

export interface InstructorKpi {
  id: string;
  label: string;
  value: string;
  note: string;
  noteTone: InstructorTone;
  icon: LucideIcon;
  tone: InstructorTone;
  /** Chiều cao cột của mini bar chart trang trí (phần trăm, 0-100) */
  bars: number[];
  /** Nếu có progress bar (thay mini bars) — ví dụ tỷ lệ hoàn thành sprint */
  progress?: number;
}

export const INSTRUCTOR_KPIS: InstructorKpi[] = [
  {
    id: "phien-dang-hoat-dong",
    label: "Phiên đang hoạt động",
    value: "3 / 4",
    note: "+1 phiên so với tháng trước",
    noteTone: "green",
    icon: Layers,
    tone: "blue",
    bars: [45, 70, 55, 85],
  },
  {
    id: "sinh-vien-tham-gia",
    label: "Sinh viên tham gia",
    value: "84",
    note: "+12% so với tháng trước",
    noteTone: "green",
    icon: Users,
    tone: "blue",
    bars: [50, 66, 46, 82],
  },
  {
    id: "ty-le-hoan-thanh-sprint",
    label: "Tỷ lệ hoàn thành sprint",
    value: "67%",
    note: "142 / 212 task",
    noteTone: "slate",
    icon: CircleCheck,
    tone: "green",
    bars: [],
    progress: 67,
  },
  {
    id: "diem-ai-trung-binh",
    label: "Điểm AI trung bình",
    value: "82 / 100",
    note: "+6% so với sprint trước",
    noteTone: "green",
    icon: Star,
    tone: "amber",
    bars: [55, 76, 62, 90],
  },
  {
    id: "task-pr-cho-duyet",
    label: "Task / PR chờ duyệt",
    value: "12",
    note: "4 task quá hạn",
    noteTone: "red",
    icon: Clock,
    tone: "red",
    bars: [72, 52, 82, 60],
  },
];

/* ------------------------ Phiên thực tập đang hoạt động ------------------- */

export type SessionStatus = "ongoing" | "ending";

export interface ActiveSession {
  id: string;
  sessionLabel: string;
  project: string;
  projectDetail: string;
  students: number;
  extraStudents: number;
  /** Initials cho avatar stack placeholder (3 avatar đầu của nhóm) */
  avatarInitials: string[];
  progress: number;
  status: SessionStatus;
  statusLabel: string;
  timeframe: string;
}

export const SESSION_STATUS_TONES: Record<SessionStatus, InstructorTone> = {
  ongoing: "green",
  ending: "amber",
};

export const ACTIVE_SESSIONS: ActiveSession[] = [
  {
    id: "VIN-103",
    sessionLabel: "Session 01",
    project: "Integrate Login API",
    projectDetail: "Xây dựng hệ thống đăng nhập cho ứng dụng web",
    students: 28,
    extraStudents: 24,
    avatarInitials: ["TN", "QM", "PH"],
    progress: 72,
    status: "ongoing",
    statusLabel: "Đang diễn ra",
    timeframe: "01/05/2024 – 30/06/2024",
  },
  {
    id: "VIN-104",
    sessionLabel: "Session 01",
    project: "Form Validation",
    projectDetail: "Xây dựng validation cho form đăng ký và đăng nhập",
    students: 18,
    extraStudents: 14,
    avatarInitials: ["MT", "AD", "NK"],
    progress: 58,
    status: "ongoing",
    statusLabel: "Đang diễn ra",
    timeframe: "17/05/2024 – 25/06/2024",
  },
  {
    id: "VIN-102",
    sessionLabel: "Session 01",
    project: "Design Login UI",
    projectDetail: "Thiết kế giao diện đăng nhập theo design system",
    students: 20,
    extraStudents: 16,
    avatarInitials: ["HV", "TB", "QN"],
    progress: 81,
    status: "ongoing",
    statusLabel: "Đang diễn ra",
    timeframe: "13/05/2024 – 20/06/2024",
  },
  {
    id: "VIN-099",
    sessionLabel: "Session 01",
    project: "Register Flow",
    projectDetail: "Xây dựng luồng đăng ký tài khoản sinh viên",
    students: 16,
    extraStudents: 12,
    avatarInitials: ["DL", "PN", "TM"],
    progress: 45,
    status: "ending",
    statusLabel: "Sắp kết thúc",
    timeframe: "20/04/2024 – 18/05/2024",
  },
];

/* --------------------------- Sprint & Burndown ---------------------------- */

export const SPRINT_SELECTOR_LABEL = "Sprint 03 (13/05 - 26/05)";

export interface SprintMetric {
  id: string;
  label: string;
  value: string;
  note?: string;
  noteTone?: InstructorTone;
  icon: LucideIcon;
  tone: InstructorTone;
}

export const SPRINT_METRICS: SprintMetric[] = [
  {
    id: "thoi-gian-con-lai",
    label: "Thời gian còn lại",
    value: "8 ngày",
    icon: CalendarDays,
    tone: "blue",
  },
  {
    id: "task-hoan-thanh",
    label: "Task hoàn thành",
    value: "42 / 60",
    note: "70%",
    noteTone: "green",
    icon: CircleCheck,
    tone: "green",
  },
  {
    id: "diem-trung-binh",
    label: "Điểm trung bình",
    value: "82 / 100",
    icon: Star,
    tone: "amber",
  },
  {
    id: "burn-con-lai",
    label: "Burn còn lại",
    value: "18 task",
    icon: ChartColumn,
    tone: "blue",
  },
];

export interface BurndownPoint {
  /** Nhãn trục x, ví dụ "13/05" */
  date: string;
  /** Task còn lại thực tế — null khi chưa tới ngày (phần dự kiến) */
  actual: number | null;
  /** Đường lý tưởng (reference) */
  ideal: number;
}

export const BURNDOWN_CHART = {
  /** Trục y: 0 → 80 task */
  max: 80,
  yTicks: [0, 20, 40, 60, 80],
  /** Index của các mốc ngày được gắn nhãn trên trục x */
  xLabelIndices: [0, 2, 4, 6, 8, 9, 10],
  points: [
    { date: "13/05", actual: 60, ideal: 60 },
    { date: "14/05", actual: 57, ideal: 55 },
    { date: "15/05", actual: 54, ideal: 51 },
    { date: "16/05", actual: 50, ideal: 46 },
    { date: "17/05", actual: 46, ideal: 42 },
    { date: "18/05", actual: 42, ideal: 37 },
    { date: "19/05", actual: 38, ideal: 32 },
    { date: "20/05", actual: 33, ideal: 28 },
    { date: "21/05", actual: 28, ideal: 23 },
    { date: "23/05", actual: null, ideal: 14 },
    { date: "26/05", actual: null, ideal: 0 },
  ] as BurndownPoint[],
  legend: {
    actual: "Task còn lại (thực tế)",
    ideal: "Đường lý tưởng",
  },
  /** Tooltip-style annotation ghim tại điểm dữ liệu thực tế cuối */
  annotation: { index: 8, date: "21/05/2024", actual: 28, ideal: 23 },
  description:
    "Task còn lại thực tế giảm từ 60 xuống 28 tính đến 21/05, đường lý tưởng về 0 vào 26/05",
};

/* --------------------------- Hiệu suất sinh viên -------------------------- */

export type StudentPerformanceStatus = "excellent" | "good" | "improving";

export interface TopStudent {
  rank: number;
  name: string;
  email: string;
  initials: string;
  tone: InstructorTone;
  role: string;
  roleTone: InstructorTone;
  tasksDone: number;
  tasksTotal: number;
  completion: number;
  aiScore: number;
  /** +6 nghĩa là tăng 6%, -2 nghĩa là giảm 2% so với sprint trước */
  scoreDelta: number;
  status: StudentPerformanceStatus;
  statusLabel: string;
}

export const STUDENT_STATUS_TONES: Record<
  StudentPerformanceStatus,
  InstructorTone
> = {
  excellent: "green",
  good: "blue",
  improving: "amber",
};

export const TOP_STUDENTS: TopStudent[] = [
  {
    rank: 1,
    name: "Trần Thị Bảo Ngọc",
    email: "ngoc.tb@vnu.edu.vn",
    initials: "TN",
    tone: "blue",
    role: "Frontend",
    roleTone: "sky",
    tasksDone: 12,
    tasksTotal: 14,
    completion: 86,
    aiScore: 92,
    scoreDelta: 6,
    status: "excellent",
    statusLabel: "Xuất sắc",
  },
  {
    rank: 2,
    name: "Lê Hoàng",
    email: "hoang.l@vnu.edu.vn",
    initials: "LH",
    tone: "violet",
    role: "Backend",
    roleTone: "sky",
    tasksDone: 11,
    tasksTotal: 14,
    completion: 79,
    aiScore: 88,
    scoreDelta: 4,
    status: "good",
    statusLabel: "Tốt",
  },
  {
    rank: 3,
    name: "Nguyễn Văn Minh",
    email: "minh.nv@vnu.edu.vn",
    initials: "NM",
    tone: "green",
    role: "Frontend",
    roleTone: "sky",
    tasksDone: 10,
    tasksTotal: 14,
    completion: 71,
    aiScore: 84,
    scoreDelta: 8,
    status: "good",
    statusLabel: "Tốt",
  },
  {
    rank: 4,
    name: "Phạm Quang Duy",
    email: "duy.pq@vnu.edu.vn",
    initials: "PD",
    tone: "amber",
    role: "Fullstack",
    roleTone: "violet",
    tasksDone: 9,
    tasksTotal: 14,
    completion: 64,
    aiScore: 78,
    scoreDelta: 3,
    status: "improving",
    statusLabel: "Đang cải thiện",
  },
  {
    rank: 5,
    name: "Nguyễn Thu Hà",
    email: "ha.nt@vnu.edu.vn",
    initials: "NH",
    tone: "fuchsia",
    role: "UI/UX",
    roleTone: "fuchsia",
    tasksDone: 8,
    tasksTotal: 14,
    completion: 57,
    aiScore: 76,
    scoreDelta: -2,
    status: "improving",
    statusLabel: "Đang cải thiện",
  },
];

/* ------------------------ Review & Đánh giá (PR) -------------------------- */

export type PrReviewStatus = "passed" | "needs-review" | "failed";

export interface PrReviewRow {
  id: string;
  number: number;
  title: string;
  detail: string;
  student: string;
  initials: string;
  tone: InstructorTone;
  score: number;
  status: PrReviewStatus;
  statusLabel: string;
  action: "approve" | "view";
}

export const PR_STATUS_TONES: Record<PrReviewStatus, InstructorTone> = {
  passed: "green",
  "needs-review": "amber",
  failed: "red",
};

export const PR_REVIEWS: PrReviewRow[] = [
  {
    id: "pr-42",
    number: 42,
    title: "login-api",
    detail: "Cải thiện xác thực token",
    student: "Trần Thị Bảo Ngọc",
    initials: "TN",
    tone: "blue",
    score: 92,
    status: "passed",
    statusLabel: "Passed",
    action: "approve",
  },
  {
    id: "pr-41",
    number: 41,
    title: "ui-login",
    detail: "Fix responsive layout",
    student: "Nguyễn Văn Minh",
    initials: "NM",
    tone: "green",
    score: 78,
    status: "needs-review",
    statusLabel: "Cần xem xét",
    action: "view",
  },
  {
    id: "pr-40",
    number: 40,
    title: "register-flow",
    detail: "Thêm validate email",
    student: "Lê Hoàng",
    initials: "LH",
    tone: "violet",
    score: 85,
    status: "passed",
    statusLabel: "Passed",
    action: "approve",
  },
  {
    id: "pr-39",
    number: 39,
    title: "user-profile",
    detail: "Cập nhật thông tin cá nhân",
    student: "Phạm Quang Duy",
    initials: "PD",
    tone: "amber",
    score: 68,
    status: "failed",
    statusLabel: "Failed",
    action: "view",
  },
  {
    id: "pr-38",
    number: 38,
    title: "dashboard-ui",
    detail: "Tối ưu hiệu năng",
    student: "Nguyễn Thu Hà",
    initials: "NH",
    tone: "fuchsia",
    score: 82,
    status: "passed",
    statusLabel: "Passed",
    action: "approve",
  },
];

/* ------------------------------ Tổng quan Task ---------------------------- */

export interface TaskOverviewCell {
  id: string;
  label: string;
  count: number;
  note: string;
  noteTone: InstructorTone;
  icon: LucideIcon;
  tone: InstructorTone;
}

export const TASK_OVERVIEW: TaskOverviewCell[] = [
  {
    id: "todo",
    label: "To Do",
    count: 38,
    note: "3 task quá hạn",
    noteTone: "red",
    icon: ListTodo,
    tone: "blue",
  },
  {
    id: "doing",
    label: "Doing",
    count: 24,
    note: "4 đang chờ review",
    noteTone: "slate",
    icon: Clock,
    tone: "blue",
  },
  {
    id: "review",
    label: "Review",
    count: 12,
    note: "2 đã quá hạn",
    noteTone: "red",
    icon: ScanSearch,
    tone: "amber",
  },
  {
    id: "done",
    label: "Done",
    count: 142,
    note: "67% hoàn thành",
    noteTone: "green",
    icon: CircleCheck,
    tone: "green",
  },
];

/* ----------------------------- Thiết lập nhanh ---------------------------- */

export interface InstructorQuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  tone: InstructorTone;
}

export const INSTRUCTOR_QUICK_ACTIONS: InstructorQuickAction[] = [
  { id: "bat-dau-phien", label: "Bắt đầu phiên", icon: Rocket, tone: "blue" },
  { id: "tao-task-moi", label: "Tạo task mới", icon: Plus, tone: "green" },
  { id: "chon-project", label: "Chọn project", icon: FolderKanban, tone: "violet" },
  { id: "giao-viec", label: "Giao việc", icon: UserPlus, tone: "amber" },
  { id: "danh-gia-ai", label: "Đánh giá AI", icon: Star, tone: "sky" },
  { id: "xuat-bao-cao", label: "Xuất báo cáo", icon: FileText, tone: "green" },
];

/* ---------------------------- Hoạt động gần đây --------------------------- */

export type ActivityDotTone = Extract<
  InstructorTone,
  "green" | "blue" | "violet" | "amber"
>;

export interface RecentActivityItem {
  id: string;
  text: string;
  time: string;
  tone: ActivityDotTone;
}

export const RECENT_ACTIVITY: RecentActivityItem[] = [
  {
    id: "act-1",
    text: "Nguyễn Văn Minh đã submit PR #41",
    time: "14:21",
    tone: "green",
  },
  {
    id: "act-2",
    text: "Trần Thị Bảo Ngọc hoàn thành task VIN-103-T12",
    time: "13:50",
    tone: "green",
  },
  {
    id: "act-3",
    text: "Hệ thống đã đánh giá 5 PR #40 (85 điểm)",
    time: "11:30",
    tone: "blue",
  },
  {
    id: "act-4",
    text: "Phạm Quang Duy đã tạo task mới",
    time: "10:15",
    tone: "violet",
  },
  {
    id: "act-5",
    text: "Phiên VIN-099 sắp kết thúc (còn 3 ngày)",
    time: "09:42",
    tone: "amber",
  },
];
