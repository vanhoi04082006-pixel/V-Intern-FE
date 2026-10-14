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
  ListTodo,
  Settings,
  SquareKanban,
} from "lucide-react";
import type {
  InternNavGroup,
  InternNavItem,
  InternWorkspaceState,
} from "./data/intern-mock-data";
import { roleLabel, type InternWorkspace } from "@/lib/api/workspace";
import type { SessionUser } from "@/lib/auth/session";
export const INTERN_OVERVIEW_NAV_ID = "tong-quan";
export const INTERN_BOTTOM_NAV: InternNavItem = {
  id: "cai-dat",
  label: "Cài đặt",
  icon: Settings,
  href: "/intern/profile",
};
export function workspaceNav(active = false): InternNavGroup[] {
  return [
    {
      id: "workspace",
      label: "Workspace",
      items: [
        {
          id: INTERN_OVERVIEW_NAV_ID,
          label: "Tổng quan",
          icon: Home,
          href: "/intern",
        },
        ...[
          { id: "work", label: "Công việc của tôi", icon: ListTodo },
          { id: "sprint", label: "Sprint Board", icon: SquareKanban },
          { id: "project", label: "Dự án", icon: FolderKanban },
          { id: "mentor", label: "AI Mentor", icon: Bot },
          { id: "notifications", label: "Thông báo", icon: Bell },
          { id: "github", label: "GitHub", icon: CodeXml },
        ].map((item) => ({
          ...item,
          href:
            active || ["notifications", "github"].includes(item.id)
              ? `/intern/${item.id}`
              : undefined,
          unavailable: !active && !["notifications", "github"].includes(item.id),
        })),
      ],
    },
    {
      id: "performance",
      label: "Hiệu suất & Phát triển",
      items: [
        { id: "evaluations", label: "Đánh giá", icon: ClipboardCheck },
        { id: "kpi", label: "KPI & Lương ảo", icon: ChartColumn },
        { id: "certificates", label: "Chứng nhận", icon: Award },
        ...(active
          ? [
              { id: "performance", label: "Hiệu suất", icon: ChartColumn },
              { id: "recommendations", label: "Gợi ý phát triển", icon: Bot },
            ]
          : []),
      ].map((item) => ({
        ...item,
        href: active ? `/intern/${item.id}` : undefined,
        unavailable: !active,
      })),
    },
  ];
}
export function workspaceUser(user: SessionUser) {
  return {
    name: user.displayName,
    roleLabel: "Intern",
    initials: user.displayName
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((part) => part[0])
      .join("")
      .toUpperCase(),
    notificationBadge: null,
  };
}
export function waitingPresentation(
  workspace: InternWorkspace,
  user: SessionUser,
): Extract<InternWorkspaceState, { status: "unassigned" }> {
  if (workspace.status !== "unassigned")
    throw new Error("Waiting requires unassigned lifecycle");
  const recruitedAt = workspace.recruitment?.recruitedAt;
  return {
    status: "unassigned",
    assignment: null,
    user: workspaceUser(user),
    navGroups: workspaceNav(),
    searchPlaceholder: "Tìm kiếm dự án, tài liệu, thông báo...",
    pageSubtitle: "Không gian làm việc và thực tập của bạn",
    welcome: {
      greeting: `Xin chào, ${user.displayName} 👋`,
      message:
        "Bạn đã hoàn thành tuyển dụng. Không gian làm việc sẽ được cập nhật khi có phân công từ giảng viên.",
      badges: [
        {
          id: "passed",
          label: "Đã hoàn thành tuyển dụng",
          icon: CircleCheck,
          tone: "green",
        },
        {
          id: "waiting",
          label: "Đang chờ phân công",
          icon: Clock,
          tone: "blue",
        },
      ],
    },
    emptyCard: {
      title: "Chưa có dự án được phân công",
      description:
        "Bạn đang chờ giảng viên phân công dự án và phiên thực tập. Hãy quay lại để kiểm tra trạng thái mới nhất.",
      primaryAction: "Xem kết quả tuyển dụng",
      secondaryAction: "Tải lại trạng thái",
    },
    infoRows: [
      {
        id: "role",
        label: "Vai trò",
        value: roleLabel(workspace.recruitment?.selectedRole ?? null),
        icon: CodeXml,
        tone: "blue",
      },
      {
        id: "project",
        label: "Dự án",
        value: "Chưa phân công",
        icon: FolderKanban,
        tone: "slate",
      },
      {
        id: "session",
        label: "Phiên thực tập",
        value: "Chưa phân công",
        icon: CalendarDays,
        tone: "slate",
      },
      {
        id: "sprint",
        label: "Sprint",
        value: "Chưa có",
        icon: SquareKanban,
        tone: "slate",
      },
      {
        id: "task",
        label: "Task",
        value: "Chưa có",
        icon: ListTodo,
        tone: "slate",
      },
      {
        id: "status",
        label: "Trạng thái",
        value: "Đang chờ phân công",
        icon: Clock,
        tone: "amber",
      },
    ],
    nextSteps: [
      {
        order: 1,
        title: "Nhận phân công dự án",
        description: "Giảng viên phân công dự án và phiên thực tập phù hợp.",
      },
      {
        order: 2,
        title: "Tham gia Sprint",
        description: "Theo dõi Sprint khi dự án đã được phân công.",
      },
      {
        order: 3,
        title: "Thực hiện Task",
        description: "Bắt đầu công việc từ nhiệm vụ được giao.",
      },
    ],
    recentActivities: recruitedAt
      ? [
          {
            id: "recruited",
            title: "Hoàn thành tuyển dụng",
            description: `Vị trí: ${roleLabel(workspace.recruitment?.selectedRole ?? null)}`,
            timeLabel: new Date(recruitedAt).toLocaleDateString("vi-VN"),
            tone: "green",
          },
        ]
      : [],
    activitiesActionLabel: "",
    notes: [
      "Trạng thái phân công được cập nhật từ hệ thống.",
      "Bạn chưa có dự án, Sprint hoặc Task được giao.",
    ],
    notesFooter: "Hãy theo dõi thông tin phân công từ giảng viên.",
  };
}
