import {
  IconAward,
  IconBell,
  IconBot,
  IconCalendarDays,
  IconChartColumn,
  IconCircleCheck,
  IconClipboardCheck,
  IconClock,
  IconCodeXml,
  IconFolderKanban,
  IconHome,
  IconListTodo,
  IconSettings,
  IconSquareKanban,
} from "@/components/v-intern/icons";
import type {
  InternNavGroup,
  InternNavItem,
  InternWorkspaceState,
} from "./intern-workspace-types";
import { roleLabel, type InternWorkspace } from "@/lib/api/workspace";
import type { SessionUser } from "@/lib/auth/session";
export const INTERN_OVERVIEW_NAV_ID = "tong-quan";
export const INTERN_BOTTOM_NAV: InternNavItem = {
  id: "cai-dat",
  label: "Cài đặt",
  icon: IconSettings,
  href: "/intern/profile",
};
export function workspaceNav(
  active = false,
  outcomesAvailable = active,
): InternNavGroup[] {
  return [
    {
      id: "workspace",
      label: "Không gian làm việc",
      items: [
        {
          id: INTERN_OVERVIEW_NAV_ID,
          label: "Tổng quan",
          icon: IconHome,
          href: "/intern",
        },
        ...[
          { id: "work", label: "Công việc của tôi", icon: IconListTodo },
          { id: "sprint", label: "Sprint Board", icon: IconSquareKanban },
          { id: "project", label: "Dự án", icon: IconFolderKanban },
          { id: "mentor", label: "AI Mentor", icon: IconBot },
          { id: "notifications", label: "Thông báo", icon: IconBell },
          { id: "github", label: "GitHub", icon: IconCodeXml },
          { id: "participation", label: "Thời hạn & ghi nhận", icon: IconClipboardCheck },
        ].map((item) => ({
          ...item,
          href:
            active || ["notifications", "github", "participation"].includes(item.id)
              ? `/intern/${item.id}`
              : undefined,
          unavailable:
            !active && !["notifications", "github", "participation"].includes(item.id),
        })),
      ],
    },
    {
      id: "performance",
      label: "Hiệu suất & Phát triển",
      items: [
        { id: "evaluations", label: "Đánh giá", icon: IconClipboardCheck },
        { id: "kpi", label: "KPI & Lương ảo", icon: IconChartColumn },
        { id: "certificates", label: "Chứng nhận", icon: IconAward },
        ...(outcomesAvailable
          ? [{ id: "performance", label: "Hiệu suất", icon: IconChartColumn }]
          : []),
        ...(active
          ? [{ id: "recommendations", label: "Gợi ý phát triển", icon: IconBot }]
          : []),
      ].map((item) => ({
        ...item,
        href: outcomesAvailable ? `/intern/${item.id}` : undefined,
        unavailable: !outcomesAvailable,
      })),
    },
  ];
}
export function workspaceUser(user: SessionUser) {
  return {
    name: user.displayName,
    roleLabel: "Sinh viên",
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
          icon: IconCircleCheck,
          tone: "green",
        },
        {
          id: "waiting",
          label: "Đang chờ phân công",
          icon: IconClock,
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
        icon: IconCodeXml,
        tone: "blue",
      },
      {
        id: "project",
        label: "Dự án",
        value: "Chưa phân công",
        icon: IconFolderKanban,
        tone: "slate",
      },
      {
        id: "session",
        label: "Phiên thực tập",
        value: "Chưa phân công",
        icon: IconCalendarDays,
        tone: "slate",
      },
      {
        id: "sprint",
        label: "Sprint",
        value: "Chưa có",
        icon: IconSquareKanban,
        tone: "slate",
      },
      {
        id: "task",
        label: "Task",
        value: "Chưa có",
        icon: IconListTodo,
        tone: "slate",
      },
      {
        id: "status",
        label: "Trạng thái",
        value: "Đang chờ phân công",
        icon: IconClock,
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
