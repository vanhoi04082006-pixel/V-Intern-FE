import type { LucideIcon } from "lucide-react";
import {
  Activity,
  CalendarDays,
  ClipboardList,
  Clock,
  Code2,
  Crown,
  Database,
  FileText,
  GraduationCap,
  Home,
  ListTree,
  MemoryStick,
  Server,
  Settings,
  Settings2,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  UsersRound,
} from "lucide-react";

import type { ToneKey } from "../admin-ui-tones";

/**
 * Mock/presentation data cho Admin Workspace (/admin).
 *
 * QUAN TRỌNG — đây là dữ liệu trình bày tĩnh để dựng UI theo reference:
 * - KHÔNG map vào backend endpoint nào, KHÔNG gọi API /admin/* hay /users.
 * - Các hành động (thêm/sửa/xóa/import, cài đặt) chỉ là visual-only.
 * - Khi backend admin API có contract thật, thay các hằng số dưới đây
 *   bằng fetch ở adapter riêng — giữ nguyên shape nếu có thể.
 */

/* ------------------------------ Sidebar nav ------------------------------ */

export interface AdminNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface AdminNavSection {
  id: string;
  label: string;
  items: AdminNavItem[];
}

/** Item đang active theo reference: "Tổng quan" */
export const ADMIN_OVERVIEW_NAV_ID = "tong-quan";

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    id: "quan-tri-he-thong",
    label: "Quản trị hệ thống",
    items: [
      { id: ADMIN_OVERVIEW_NAV_ID, label: "Tổng quan", icon: Home },
      { id: "nguoi-dung", label: "Người dùng", icon: Users },
      { id: "vai-tro-quyen", label: "Vai trò & quyền", icon: ShieldCheck },
      { id: "nhom-nguoi-dung", label: "Nhóm người dùng", icon: UsersRound },
      { id: "danh-muc-dung-chung", label: "Danh mục dùng chung", icon: ListTree },
      { id: "cai-dat-he-thong", label: "Cài đặt hệ thống", icon: Settings },
      { id: "nhat-ky-he-thong", label: "Nhật ký hệ thống", icon: FileText },
    ],
  },
  {
    id: "giam-sat",
    label: "Giám sát",
    items: [
      { id: "trang-thai-dich-vu", label: "Trạng thái dịch vụ", icon: Activity },
      { id: "hoat-dong-gan-day", label: "Hoạt động gần đây", icon: Clock },
      { id: "audit-log", label: "Audit log", icon: ClipboardList },
    ],
  },
];

export const ADMIN_BOTTOM_NAV: AdminNavItem = {
  id: "cai-dat",
  label: "Cài đặt",
  icon: Settings2,
};

/* ------------------------------ Current user ----------------------------- */

export interface AdminCurrentUser {
  name: string;
  role: string;
  initials: string;
  notifications: number;
}

export const ADMIN_CURRENT_USER: AdminCurrentUser = {
  name: "Nguyễn Hoàng Long",
  role: "System Admin",
  initials: "NL",
  notifications: 3,
};

/* ---------------------------- Workspace header --------------------------- */

export interface WorkspaceMetaItem {
  id: string;
  label: string;
  value: string;
  icon: LucideIcon;
}

export const WORKSPACE_META: WorkspaceMetaItem[] = [
  { id: "vai-tro", label: "Vai trò", value: "System Admin", icon: Code2 },
  { id: "he-thong", label: "Hệ thống", value: "V-Intern Platform", icon: CalendarDays },
  { id: "moi-truong", label: "Môi trường", value: "Production", icon: Server },
  { id: "cap-nhat", label: "Cập nhật lần cuối", value: "16/05/2024 14:21", icon: Clock },
];

/* -------------------------------- KPI cards ------------------------------ */

export interface AdminKpi {
  id: string;
  label: string;
  value: string;
  delta: string;
  icon: LucideIcon;
  tone: ToneKey;
  /** Chiều cao cột của mini bar chart (phần trăm, 0-100) */
  bars: number[];
  footnote?: string;
}

export const ADMIN_KPIS: AdminKpi[] = [
  {
    id: "tong-nguoi-dung",
    label: "Tổng người dùng",
    value: "1.266",
    delta: "+12% so với tháng trước",
    icon: Users,
    tone: "blue",
    bars: [40, 62, 48, 70, 58, 82, 66, 90],
  },
  {
    id: "giang-vien",
    label: "Giảng viên",
    value: "142",
    delta: "+5% so với tháng trước",
    icon: User,
    tone: "green",
    bars: [52, 44, 66, 50, 72, 58, 80, 62],
  },
  {
    id: "sinh-vien",
    label: "Sinh viên",
    value: "1.096",
    delta: "+15% so với tháng trước",
    icon: GraduationCap,
    tone: "purple",
    bars: [36, 58, 70, 46, 64, 78, 54, 88],
  },
  {
    id: "phien-hoat-dong",
    label: "Phiên đang hoạt động",
    value: "320",
    delta: "+8% so với 24 giờ trước",
    icon: Activity,
    tone: "amber",
    bars: [60, 72, 54, 80, 66, 90, 74, 96],
  },
];

/* --------------------------- User management ----------------------------- */

export type AdminUserRole = "Admin" | "Giảng viên" | "Sinh viên";
export type AdminUserStatus = "active" | "locked";

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  lastLogin: string;
  /** Initials hiển thị trên avatar khi không có ảnh */
  initials: string;
  tone: ToneKey;
}

export const ADMIN_USERS: AdminUserRow[] = [
  {
    id: "u1",
    name: "Nguyễn Minh Anh",
    email: "anhnguyen@uit.edu.vn",
    role: "Giảng viên",
    status: "active",
    lastLogin: "Hôm nay, 14:20",
    initials: "NA",
    tone: "blue",
  },
  {
    id: "u2",
    name: "Trần Thị Bảo Ngọc",
    email: "ngoc.tb@vnu.edu.vn",
    role: "Admin",
    status: "active",
    lastLogin: "Hôm nay, 10:15",
    initials: "TN",
    tone: "red",
  },
  {
    id: "u3",
    name: "Lê Hoàng",
    email: "hoang.le@student.edu.vn",
    role: "Sinh viên",
    status: "active",
    lastLogin: "Hôm qua, 22:41",
    initials: "LH",
    tone: "purple",
  },
  {
    id: "u4",
    name: "Phạm Quang Duy",
    email: "duy.pq@hcmut.edu.vn",
    role: "Sinh viên",
    status: "active",
    lastLogin: "15/05/2024, 16:32",
    initials: "PD",
    tone: "purple",
  },
  {
    id: "u5",
    name: "Nguyễn Thị Mai",
    email: "mai.nt@ftu.edu.vn",
    role: "Giảng viên",
    status: "locked",
    lastLogin: "12/05/2024, 09:18",
    initials: "NM",
    tone: "blue",
  },
];

export const USER_TABLE_SUMMARY = "Hiển thị 1 - 5 trong tổng số 1.266 người dùng";

/* ----------------------------- Role summary ------------------------------ */

export interface AdminRoleSummary {
  id: string;
  name: string;
  description: string;
  permissions: number;
  icon: LucideIcon;
  tone: ToneKey;
}

export const ADMIN_ROLES: AdminRoleSummary[] = [
  {
    id: "admin",
    name: "Admin",
    description: "Toàn quyền quản trị hệ thống, quản lý người dùng, cấu hình.",
    permissions: 24,
    icon: Crown,
    tone: "red",
  },
  {
    id: "giang-vien",
    name: "Giảng viên",
    description: "Quản lý lớp học, đánh giá sinh viên, theo dõi tiến độ.",
    permissions: 12,
    icon: User,
    tone: "blue",
  },
  {
    id: "sinh-vien",
    name: "Sinh viên",
    description: "Tham gia chương trình thực tập, thực hiện sprint, tương tác mentor.",
    permissions: 8,
    icon: GraduationCap,
    tone: "purple",
  },
];

/* -------------------------- Account distribution ------------------------- */

export interface AccountDistributionSlice {
  id: string;
  label: string;
  count: number;
  percent: number;
  /** Màu hex dùng cho SVG donut + legend */
  color: string;
}

export const ACCOUNT_DISTRIBUTION_TOTAL = {
  value: "1.266",
  label: "người dùng",
};

export const ACCOUNT_DISTRIBUTION: AccountDistributionSlice[] = [
  { id: "sinh-vien", label: "Sinh viên", count: 1096, percent: 86.6, color: "#8B5CF6" },
  { id: "giang-vien", label: "Giảng viên", count: 142, percent: 11.2, color: "#3B82F6" },
  { id: "admin", label: "Admin", count: 28, percent: 2.2, color: "#EF4444" },
];

/* ---------------------------- System status ------------------------------ */

export interface SystemServiceStatus {
  id: string;
  name: string;
  latencyMs: number;
  uptime: string;
  icon: LucideIcon;
}

export const SERVICE_STATE_LABEL = "Hoạt động tốt";

export const SYSTEM_SERVICES: SystemServiceStatus[] = [
  { id: "backend-api", name: "Backend API (v1)", latencyMs: 124, uptime: "99.98%", icon: Server },
  { id: "database", name: "Database (SQL Server)", latencyMs: 8, uptime: "99.99%", icon: Database },
  { id: "redis", name: "Redis (Cache)", latencyMs: 2, uptime: "99.97%", icon: MemoryStick },
  { id: "github", name: "GitHub (Integration)", latencyMs: 156, uptime: "99.95%", icon: Users },
  { id: "gemini", name: "Gemini API (AI Mentoring)", latencyMs: 312, uptime: "99.90%", icon: Sparkles },
];

/* ------------------------------ Activity log ----------------------------- */

export interface ActivityLogEntry {
  id: string;
  time: string;
  action: string;
  actor: string;
  /** Vai trò hiển thị trong ngoặc, ví dụ "(Admin)"; undefined = không hiển thị */
  role?: string;
  tone: "blue" | "red";
}

export const ACTIVITY_LOG: ActivityLogEntry[] = [
  { id: "a1", time: "14:21", action: "Đăng nhập hệ thống", actor: "Nguyễn Hoàng Long", role: "Admin", tone: "blue" },
  { id: "a2", time: "13:45", action: "Cập nhật vai trò người dùng", actor: "Trần Thị Bảo Ngọc", role: "Admin", tone: "blue" },
  { id: "a3", time: "12:30", action: "Tạo mới người dùng", actor: "Lê Minh Quân", role: "Admin", tone: "blue" },
  { id: "a4", time: "11:20", action: "Cập nhật cấu hình hệ thống", actor: "Nguyễn Hoàng Long", role: "Admin", tone: "blue" },
  { id: "a5", time: "10:15", action: "Người dùng đăng nhập thất bại", actor: "203.113.24.12", role: "IP lạ", tone: "red" },
  { id: "a6", time: "09:42", action: "Gọi API Gemini", actor: "Hệ thống", tone: "blue" },
];

/* ----------------------------- System alerts ----------------------------- */

export interface SystemAlert {
  id: string;
  time: string;
  message: string;
  severity: "warning" | "notice";
}

export const SYSTEM_ALERTS: SystemAlert[] = [
  { id: "w1", time: "12:20", message: "Tỷ lệ lỗi API tăng cao (5.2%)", severity: "warning" },
  { id: "w2", time: "10:15", message: "Dung lượng lưu trữ đạt 85%", severity: "warning" },
  { id: "w3", time: "08:30", message: "Phát hiện nhiều lần đăng nhập thất bại", severity: "warning" },
  { id: "w4", time: "15/05", message: "Dịch vụ Gemini API phản hồi chậm", severity: "notice" },
];
