import type { UiIcon } from "@/lib/ui/icon";
import type { InternTone } from "./intern-ui-tones";

/**
 * Type contracts for the intern workspace presentation layer.
 *
 * These shapes were originally defined beside the legacy mock dataset; the
 * mock values are gone — every runtime value now derives from the live
 * `GET /intern/me/workspace` payload via `workspace-presentation.ts`.
 */

/* ------------------------------ Sidebar nav ------------------------------ */

export interface InternNavItem {
  id: string;
  label: string;
  icon: UiIcon;
  /** Route thật — hiện chỉ "Tổng quan" có destination. */
  href?: string;
  /** Số chưa đọc (derive từ unread notifications). */
  badge?: number;
  /**
   * Mục chưa khả dụng (Sprint Board/Dự án cần Project đã được phân công) —
   * do `buildInternNavGroups` derive theo state, KHÔNG set tay; render
   * muted + disabled, không giả link.
   */
  unavailable?: boolean;
}

export interface InternNavGroup {
  id: string;
  /** Tiêu đề nhóm ("Workspace" / "Hiệu suất & Phát triển"). */
  label?: string;
  items: InternNavItem[];
}

/* ---------------------------- Current user ------------------------------- */

export interface InternWorkspaceUser {
  name: string;
  /** Label hiển thị dưới tên trên topbar ("Sinh viên" / "Intern"). */
  roleLabel: string;
  initials: string;
  /**
   * Badge chuông thông báo trên topbar: `number` = đếm cụ thể, `null` = chỉ
   * chấm đỏ không số (chưa có hệ thống thông báo để đếm).
   */
  notificationBadge: number | null;
}

/* ------------------------- Workspace state model ------------------------- */

export interface InternWelcomeBadge {
  id: string;
  label: string;
  icon: UiIcon;
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
  icon: UiIcon;
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
  role: string;
  project: string;
  session: string;
  sprint: string;
  statusLabel: string;
  breadcrumb: { org: string; project: string; sprint: string };
  /** Meta row dưới H1: Vai trò / Lab Session / Sprint hiện tại / Trạng thái */
  meta: { id: string; label: string; value: string; icon: UiIcon }[];
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
  icon: UiIcon;
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
  icon: UiIcon;
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
