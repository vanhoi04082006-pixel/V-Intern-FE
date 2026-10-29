"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Award,
  Bell,
  BookOpen,
  Bot,
  Briefcase,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  FileBarChart,
  FolderKanban,
  Github,
  GraduationCap,
  HelpCircle,
  KeyRound,
  LayoutDashboard,
  ListTodo,
  ListTree,
  Loader2,
  LogOut,
  Mail,
  Menu,
  ScrollText,
  Settings,
  Share2,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  UserCog,
  UserSearch,
  Users,
  Users2,
  Wallet,
  Wand2,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import {
  hasAnyPermission,
  hasPermission,
  primaryRole,
  ROLE_LABELS,
  type SessionUser,
} from "@/lib/auth/session";
import { fetchUnreadCount } from "@/lib/api/insight";
import { Logo } from "@/components/landing/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InitialAvatar } from "@/components/workspace/initial-avatar";
import { cn } from "@/lib/utils";

/* ─────────────────────── Views: Intern ─────────────────────── */
import { InternDashboardView } from "@/components/workspace/views/intern-dashboard-view";
import { RecruitmentView } from "@/components/workspace/views/recruitment-view";
import { InternProjectView } from "@/components/workspace/views/intern-project-view";
import { InternSprintView } from "@/components/workspace/views/intern-sprint-view";
import { InternTasksView } from "@/components/workspace/views/intern-tasks-view";
import { MentorView } from "@/components/workspace/views/mentor-view";
import { InternPerformanceView } from "@/components/workspace/views/intern-performance-view";
import { InternEvaluationsView } from "@/components/workspace/views/intern-evaluations-view";
import { InternKpiView } from "@/components/workspace/views/intern-kpi-view";
import { InternSalaryView } from "@/components/workspace/views/intern-salary-view";
import { InternCertificatesView } from "@/components/workspace/views/intern-certificates-view";
import { InternRecommendationsView } from "@/components/workspace/views/intern-recommendations-view";

/* ─────────────────── Views: Giảng viên ─────────────────── */
import { InstructorDashboardView } from "@/components/workspace/views/instructor-dashboard-view";
import { SessionsView } from "@/components/workspace/views/sessions-view";
import { ClassesView } from "@/components/workspace/views/classes-view";
import { ProjectsView } from "@/components/workspace/views/projects-view";
import { SprintsView } from "@/components/workspace/views/sprints-view";
import { TasksView } from "@/components/workspace/views/tasks-view";
import { CandidatesView } from "@/components/workspace/views/candidates-view";
import { StaffEvaluationsView } from "@/components/workspace/views/staff-evaluations-view";
import { ImportedReviewsView } from "@/components/workspace/views/imported-reviews-view";
import { PerformanceView } from "@/components/workspace/views/performance-view";
import { ReportsView } from "@/components/workspace/views/reports-view";
import { ParticipationView } from "@/components/workspace/views/participation-view";
import { AiPlanView } from "@/components/workspace/views/ai-plan-view";
import { SharingView } from "@/components/workspace/views/sharing-view";

/* ───────────────────── Views: Quản trị ───────────────────── */
import { AdminDashboardView } from "@/components/workspace/views/admin-dashboard-view";
import { AdminUsersView } from "@/components/workspace/views/admin-users-view";
import { AdminRbacView } from "@/components/workspace/views/admin-rbac-view";
import { AdminGroupsView } from "@/components/workspace/views/admin-groups-view";
import { AssignmentsView } from "@/components/workspace/views/assignments-view";
import { AdminRoundsView } from "@/components/workspace/views/admin-rounds-view";
import { AdminCareerRolesView } from "@/components/workspace/views/admin-career-roles-view";
import { AdminQuestionBankView } from "@/components/workspace/views/admin-question-bank-view";
import { AdminKpiView } from "@/components/workspace/views/admin-kpi-view";
import { AdminSalaryView } from "@/components/workspace/views/admin-salary-view";
import { AdminCertificatesView } from "@/components/workspace/views/admin-certificates-view";
import { AdminKnowledgeView } from "@/components/workspace/views/admin-knowledge-view";
import { AdminCatalogsView } from "@/components/workspace/views/admin-catalogs-view";
import { AdminAuditView } from "@/components/workspace/views/admin-audit-view";
import { AdminAgentsView } from "@/components/workspace/views/admin-agents-view";
import { AdminCommunicationsView } from "@/components/workspace/views/admin-communications-view";
import { AdminSettingsView } from "@/components/workspace/views/admin-settings-view";
import { AdminSystemView } from "@/components/workspace/views/admin-system-view";

/* ───────────────────── Views: dùng chung ───────────────────── */
import { NotificationsView } from "@/components/workspace/views/notifications-view";
import { GitHubView } from "@/components/workspace/views/github-view";
import { AccountSettingsView } from "@/components/workspace/views/account-settings-view";

/* ───────────────────────── Cấu hình nav ───────────────────────── */

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Nếu có: cần ít nhất một quyền trong mảng. Admin (*) luôn qua. */
  anyOf?: string[];
  component: React.ComponentType;
}

const NAV: Record<"intern" | "instructor" | "admin", NavItem[]> = {
  intern: [
    { id: "dashboard", label: "Bảng điều khiển", icon: LayoutDashboard, component: InternDashboardView },
    { id: "recruitment", label: "Phỏng vấn đầu vào", icon: Bot, anyOf: ["recruitment.start.own"], component: RecruitmentView },
    { id: "project", label: "Đồ án của tôi", icon: FolderKanban, component: InternProjectView },
    { id: "sprint", label: "Sprint", icon: CalendarDays, component: InternSprintView },
    { id: "tasks", label: "Nhiệm vụ", icon: ListTodo, component: InternTasksView },
    { id: "mentor", label: "AI Mentor", icon: Bot, anyOf: ["ai.mentor.use"], component: MentorView },
    { id: "performance", label: "Hiệu suất", icon: TrendingUp, anyOf: ["performance.view.own"], component: InternPerformanceView },
    { id: "evaluations", label: "Đánh giá", icon: ClipboardCheck, anyOf: ["evaluations.view.own"], component: InternEvaluationsView },
    { id: "kpi", label: "KPI", icon: Target, anyOf: ["kpi.view.own"], component: InternKpiView },
    { id: "salary", label: "Lương ảo", icon: Wallet, anyOf: ["virtual_salary.view.own"], component: InternSalaryView },
    { id: "certificates", label: "Chứng nhận", icon: Award, anyOf: ["certificates.view.own"], component: InternCertificatesView },
    { id: "recommendations", label: "Gợi ý AI", icon: Sparkles, anyOf: ["ai.recommendations.view.own"], component: InternRecommendationsView },
    { id: "notifications", label: "Thông báo", icon: Bell, component: NotificationsView },
    { id: "github", label: "GitHub", icon: Github, component: GitHubView },
    { id: "settings", label: "Tài khoản", icon: Settings, component: AccountSettingsView },
  ],
  instructor: [
    { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard, component: InstructorDashboardView },
    { id: "sessions", label: "Phiên thực tập", icon: Users2, anyOf: ["sessions.view"], component: SessionsView },
    { id: "classes", label: "Lớp học", icon: GraduationCap, anyOf: ["classes.view"], component: ClassesView },
    { id: "projects", label: "Đồ án", icon: FolderKanban, anyOf: ["projects.view"], component: ProjectsView },
    { id: "sprints", label: "Sprint", icon: CalendarDays, anyOf: ["sprints.view"], component: SprintsView },
    { id: "tasks", label: "Nhiệm vụ", icon: ListTodo, anyOf: ["tasks.view"], component: TasksView },
    { id: "candidates", label: "Ứng viên", icon: UserSearch, anyOf: ["recruitment.view"], component: CandidatesView },
    { id: "evaluations", label: "Đánh giá", icon: ClipboardCheck, anyOf: ["evaluations.view"], component: StaffEvaluationsView },
    { id: "imported-reviews", label: "Review PR", icon: ClipboardCheck, anyOf: ["evaluations.view"], component: ImportedReviewsView },
    { id: "performance", label: "Hiệu suất SV", icon: TrendingUp, anyOf: ["performance.view"], component: PerformanceView },
    { id: "reports", label: "Báo cáo", icon: FileBarChart, anyOf: ["performance.view"], component: ReportsView },
    { id: "participation", label: "Chuyên cần", icon: ShieldAlert, anyOf: ["sessions.manage"], component: ParticipationView },
    { id: "ai-plan", label: "Lập kế hoạch AI", icon: Wand2, anyOf: ["sprints.manage"], component: AiPlanView },
    { id: "sharing", label: "Chia sẻ truy cập", icon: Share2, component: SharingView },
    { id: "notifications", label: "Thông báo", icon: Bell, component: NotificationsView },
    { id: "github", label: "GitHub", icon: Github, component: GitHubView },
    { id: "settings", label: "Tài khoản", icon: Settings, component: AccountSettingsView },
  ],
  admin: [
    { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard, component: AdminDashboardView },
    { id: "users", label: "Người dùng", icon: Users, anyOf: ["users.read"], component: AdminUsersView },
    { id: "rbac", label: "Vai trò & quyền", icon: KeyRound, anyOf: ["roles.read", "permissions.read"], component: AdminRbacView },
    { id: "groups", label: "Nhóm", icon: Users2, anyOf: ["groups.read"], component: AdminGroupsView },
    { id: "sessions", label: "Phiên thực tập", icon: Users2, anyOf: ["sessions.view"], component: SessionsView },
    { id: "classes", label: "Lớp học", icon: GraduationCap, anyOf: ["classes.view"], component: ClassesView },
    { id: "projects", label: "Đồ án", icon: FolderKanban, anyOf: ["projects.view"], component: ProjectsView },
    { id: "sprints", label: "Sprint", icon: CalendarDays, anyOf: ["sprints.view"], component: SprintsView },
    { id: "tasks", label: "Nhiệm vụ", icon: ListTodo, anyOf: ["tasks.view"], component: TasksView },
    { id: "assignments", label: "Phân công", icon: UserCog, anyOf: ["assignments.view"], component: AssignmentsView },
    { id: "rounds", label: "Đợt tuyển dụng", icon: CalendarClock, anyOf: ["applications.manage"], component: AdminRoundsView },
    { id: "candidates", label: "Ứng viên", icon: UserSearch, anyOf: ["recruitment.view"], component: CandidatesView },
    { id: "career-roles", label: "Vai trò nghề", icon: Briefcase, anyOf: ["recruitment.manage"], component: AdminCareerRolesView },
    { id: "question-bank", label: "Ngân hàng câu hỏi", icon: HelpCircle, anyOf: ["recruitment.manage"], component: AdminQuestionBankView },
    { id: "evaluations", label: "Đánh giá", icon: ClipboardCheck, anyOf: ["evaluations.view"], component: StaffEvaluationsView },
    { id: "kpi", label: "KPI", icon: Target, anyOf: ["kpi.view"], component: AdminKpiView },
    { id: "salary", label: "Lương ảo", icon: Wallet, anyOf: ["virtual_salary.view"], component: AdminSalaryView },
    { id: "certificates", label: "Chứng nhận", icon: Award, anyOf: ["certificates.view"], component: AdminCertificatesView },
    { id: "knowledge", label: "Kho tri thức", icon: BookOpen, anyOf: ["knowledge.read"], component: AdminKnowledgeView },
    { id: "catalogs", label: "Danh mục", icon: ListTree, anyOf: ["catalogs.read"], component: AdminCatalogsView },
    { id: "reports", label: "Báo cáo", icon: FileBarChart, anyOf: ["performance.view"], component: ReportsView },
    { id: "audit", label: "Nhật ký hệ thống", icon: ScrollText, anyOf: ["audit.read", "activity.read"], component: AdminAuditView },
    { id: "agents", label: "AI Agents", icon: Bot, anyOf: ["knowledge.read"], component: AdminAgentsView },
    { id: "communications", label: "Hàng đợi email", icon: Mail, anyOf: ["communications.manage"], component: AdminCommunicationsView },
    { id: "system-settings", label: "Cấu hình hệ thống", icon: Settings, anyOf: ["settings.read"], component: AdminSettingsView },
    { id: "system", label: "Trạng thái hệ thống", icon: Activity, anyOf: ["settings.read"], component: AdminSystemView },
    { id: "notifications", label: "Thông báo", icon: Bell, component: NotificationsView },
    { id: "github", label: "GitHub", icon: Github, component: GitHubView },
    { id: "settings", label: "Tài khoản", icon: Settings, component: AccountSettingsView },
  ],
};

function navFor(user: SessionUser | null): NavItem[] {
  const role = primaryRole(user);
  const items = NAV[role] ?? NAV.intern;
  return items.filter((item) => !item.anyOf || hasAnyPermission(user, item.anyOf));
}

/* ─────────────────────────── Shell ─────────────────────────── */

export function Workspace() {
  const user = useAppStore((s) => s.user);
  const section = useAppStore((s) => s.section);
  const goSection = useAppStore((s) => s.goSection);
  const signOut = useAppStore((s) => s.signOut);
  const restoring = useAppStore((s) => s.restoring);
  const nav = useMemo(() => navFor(user), [user]);
  const role = primaryRole(user);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: unread = 0 } = useQuery({
    queryKey: ["unread-count"],
    queryFn: ({ signal }) => fetchUnreadCount(signal),
    refetchInterval: 60_000,
    enabled: !!user,
  });

  // Section không hợp lệ (không có quyền / không tồn tại) → về mặc định.
  // QUAN TRỌNG: chỉ redirect khi view hiện tại thật sự là "app" —
  // effect này có thể chạy trong commit chuyển cảnh rời workspace
  // (section đã bị xoá sang ""), nếu không sẽ giành quyền điều hướng.
  useEffect(() => {
    if (!user) return;
    if (nav.length === 0) return;
    const ok = nav.some((i) => i.id === section);
    if (!ok && useAppStore.getState().view === "app") goSection(nav[0].id);
  }, [user, nav, section, goSection]);

  if (restoring || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper text-ink">
        <Loader2 className="h-8 w-8 animate-spin text-blue" aria-hidden="true" />
        <p className="text-sm font-bold text-ink-soft">Đang khôi phục phiên đăng nhập…</p>
      </div>
    );
  }

  const current = nav.find((i) => i.id === section) ?? nav[0];
  const ActiveView = current.component;

  const sidebar = (
    <SidebarContent
      user={user}
      nav={nav}
      activeId={current.id}
      onSelect={(id) => {
        goSection(id);
        setDrawerOpen(false);
      }}
      unread={unread}
      onSignOut={() => void signOut()}
    />
  );

  return (
    <div className="flex min-h-screen bg-paper font-sans text-ink">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col border-r-2 border-ink/12 bg-raised lg:flex">
        {sidebar}
      </aside>

      {/* Drawer mobile */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        {sidebar}
      </MobileDrawer>

      {/* Vùng nội dung */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar mobile */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b-2 border-ink/12 bg-raised/95 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            aria-label="Mở menu"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border-2 border-ink/15 bg-raised text-ink transition-all hover:border-blue hover:text-blue"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <Logo className="text-base" />
          <InitialAvatar name={user.displayName} className="h-9 w-9 text-[13px]" />
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div key={current.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <ActiveView />
          </div>
        </main>

        <footer className="border-t-2 border-dashed border-ink/10 px-6 py-4 text-center font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink-faint">
          v-intern · {ROLE_LABELS[role] ?? role} workspace
        </footer>
      </div>
    </div>
  );
}

/* ─────────────────────── Nội dung sidebar ─────────────────────── */

function SidebarContent({
  user,
  nav,
  activeId,
  onSelect,
  unread,
  onSignOut,
}: {
  user: SessionUser;
  nav: NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  unread: number;
  onSignOut: () => void;
}) {
  const role = primaryRole(user);
  return (
    <>
      <div className="flex h-16 items-center gap-2.5 border-b-2 border-dashed border-ink/12 px-5">
        <Logo className="text-base" />
        <Badge className="rotate-[-1.5deg] border-2 border-ink bg-blue-mist text-[9px] font-extrabold uppercase tracking-wider text-blue">
          {ROLE_LABELS[role] ?? role}
        </Badge>
      </div>

      <nav aria-label="Điều hướng workspace" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex min-h-11 w-full items-center gap-3 rounded-xl border-2 px-3 text-left text-[13.5px] font-bold transition-all",
                active
                  ? "border-ink bg-blue-mist text-blue shadow-[2.5px_2.5px_0_0_var(--ink)]"
                  : "border-transparent text-ink-soft hover:border-ink/15 hover:bg-paper hover:text-ink",
              )}
            >
              <Icon className={cn("h-4.5 w-4.5 shrink-0", active ? "text-blue" : "text-ink-faint group-hover:text-blue")} aria-hidden="true" />
              <span className="flex-1 truncate">{item.label}</span>
              {item.id === "notifications" && unread > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-rose-400 bg-rose-500 px-1 text-[10px] font-extrabold text-white">
                  {unread > 99 ? "99+" : unread}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="border-t-2 border-dashed border-ink/12 p-4">
        <div className="flex items-center gap-3">
          <InitialAvatar name={user.displayName} className="h-10 w-10 text-sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-extrabold leading-tight">{user.displayName}</p>
            <p className="truncate text-[11px] text-ink-faint">{user.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onSignOut}
          className="mt-3 w-full gap-2 border-ink/20 font-bold text-ink-soft hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          Đăng xuất
        </Button>
      </div>
    </>
  );
}

/* ─────────────────────── Drawer mobile ─────────────────────── */

function MobileDrawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Overlay */}
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}
      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu workspace"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r-2 border-ink/12 bg-raised transition-transform duration-200 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng menu"
          className="absolute right-3 top-4 rounded-lg p-1.5 text-ink-faint hover:text-ink"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        {children}
      </aside>
    </>
  );
}
