"use client";

import * as React from "react";
import {
  Activity,
  Award,
  Bell,
  BookOpen,
  Bot,
  BrainCircuit,
  Briefcase,
  ChevronRight,
  ClipboardCheck,
  FileBarChart,
  FolderKanban,
  FolderGit2,
  Gauge,
  Github,
  Home,
  KanbanSquare,
  KeyRound,
  LayoutDashboard,
  Library,
  Lightbulb,
  ListChecks,
  ListTodo,
  LogOut,
  type LucideIcon,
  Mail,
  Megaphone,
  Menu,
  Presentation,
  Rocket,
  ScrollText,
  Server,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  Users,
  UsersRound,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, navigate, useRoute } from "@/lib/client/router";
import { authApi, notificationApi, type AppNotification } from "@/lib/client/api";
import { useSession, type Role } from "@/lib/client/session";
import { relativeTime } from "@/lib/client/labels";
import { Logo } from "@/components/shared/logo";
import { UserAvatar } from "@/components/shared/primitives";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";

/* ------------------------- nav config ------------------------- */

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}
interface NavGroup {
  label: string;
  items: NavItem[];
}

const internNav: NavGroup[] = [
  {
    label: "Không gian làm việc",
    items: [
      { to: "/intern", label: "Tổng quan", icon: LayoutDashboard },
      { to: "/intern/onboarding", label: "Vòng tuyển dụng", icon: Bot },
      { to: "/intern/work", label: "Công việc", icon: KanbanSquare },
      { to: "/intern/sprint", label: "Sprint của tôi", icon: Rocket },
      { to: "/intern/project", label: "Dự án", icon: FolderGit2 },
      { to: "/intern/participation", label: "Kỷ luật của tôi", icon: ShieldCheck },
      { to: "/intern/mentor", label: "Mentor AI", icon: Sparkles },
    ],
  },
  {
    label: "Kết quả & tăng trưởng",
    items: [
      { to: "/intern/evaluations", label: "Đánh giá", icon: ClipboardCheck },
      { to: "/intern/performance", label: "Hiệu suất", icon: TrendingUp },
      { to: "/intern/kpi", label: "KPI", icon: Target },
      { to: "/intern/virtual-salary", label: "Lương ảo", icon: Wallet },
      { to: "/intern/certificates", label: "Chứng chỉ", icon: Award },
      { to: "/intern/recommendations", label: "Gợi ý phát triển", icon: Lightbulb },
    ],
  },
  {
    label: "Tài khoản",
    items: [
      { to: "/intern/notifications", label: "Thông báo", icon: Bell },
      { to: "/intern/github", label: "GitHub", icon: Github },
      { to: "/intern/profile", label: "Hồ sơ", icon: UserRound },
    ],
  },
];

const instructorNav: NavGroup[] = [
  {
    label: "Quản lý lớp học",
    items: [
      { to: "/instructor", label: "Trang chủ", icon: Home },
      { to: "/instructor/recruitment-rounds", label: "Đợt tuyển dụng", icon: Megaphone },
      { to: "/instructor/projects", label: "Dự án mẫu", icon: FolderKanban },
      { to: "/instructor/sessions", label: "Buổi thực tập", icon: Presentation },
      { to: "/instructor/sprints", label: "Sprint & giao việc", icon: Rocket },
    ],
  },
  {
    label: "Vận hành phiên",
    items: [
      { to: "/instructor/participation", label: "Kỷ luật phiên", icon: ShieldCheck },
      { to: "/instructor/sharing", label: "Chia sẻ dữ liệu", icon: Share2 },
    ],
  },
  {
    label: "Đánh giá & báo cáo",
    items: [
      { to: "/instructor/evaluations", label: "Đánh giá", icon: ClipboardCheck },
      { to: "/instructor/performance", label: "Hiệu suất", icon: TrendingUp },
      { to: "/instructor/reports", label: "Báo cáo", icon: FileBarChart },
    ],
  },
  {
    label: "Tài khoản",
    items: [
      { to: "/instructor/notifications", label: "Thông báo", icon: Bell },
      { to: "/instructor/github", label: "GitHub", icon: Github },
      { to: "/instructor/profile", label: "Hồ sơ", icon: UserRound },
    ],
  },
];

const adminNav: NavGroup[] = [
  {
    label: "Tổng quan",
    items: [
      { to: "/admin", label: "Bảng điều khiển", icon: Gauge },
      { to: "/admin/activity", label: "Hoạt động", icon: Activity },
    ],
  },
  {
    label: "Quản trị dữ liệu",
    items: [
      { to: "/admin/users", label: "Người dùng", icon: Users },
      { to: "/admin/career-roles", label: "Nghề nghiệp", icon: Briefcase },
      { to: "/admin/questions", label: "Ngân hàng câu hỏi", icon: ListChecks },
      { to: "/admin/knowledge", label: "Kho tri thức AI", icon: BookOpen },
      { to: "/admin/templates", label: "Dự án mẫu", icon: FolderKanban },
      { to: "/admin/sessions", label: "Buổi thực tập", icon: Presentation },
    ],
  },
  {
    label: "Điều hành & báo cáo",
    items: [
      { to: "/admin/tasks", label: "Nhiệm vụ", icon: ListTodo },
      { to: "/admin/sprints", label: "Sprint", icon: Rocket },
      { to: "/admin/performance", label: "Hiệu suất", icon: TrendingUp },
      { to: "/admin/reports", label: "Báo cáo", icon: FileBarChart },
      { to: "/admin/communications", label: "Hàng đợi email", icon: Mail },
    ],
  },
  {
    label: "Phân quyền & danh mục",
    items: [
      { to: "/admin/groups", label: "Nhóm người dùng", icon: UsersRound },
      { to: "/admin/roles", label: "Vai trò & quyền", icon: KeyRound },
      { to: "/admin/catalogs", label: "Danh mục dùng chung", icon: Library },
    ],
  },
  {
    label: "Hệ thống",
    items: [
      { to: "/admin/ai", label: "Cấu hình AI", icon: BrainCircuit },
      { to: "/admin/services", label: "Dịch vụ hệ thống", icon: Server },
      { to: "/admin/settings", label: "Cài đặt", icon: Settings },
      { to: "/admin/audit", label: "Kiểm toán", icon: ScrollText },
    ],
  },
  {
    label: "Tài khoản",
    items: [
      { to: "/admin/notifications", label: "Thông báo", icon: Bell },
      { to: "/admin/profile", label: "Hồ sơ", icon: UserRound },
    ],
  },
];

export function navForRole(role: Role): NavGroup[] {
  if (role === "admin") return adminNav;
  if (role === "instructor") return instructorNav;
  return internNav;
}

/* ------------------------- sidebar ------------------------- */

function SidebarNav({
  role,
  onNavigate,
}: {
  role: Role;
  onNavigate?: () => void;
}) {
  const { path } = useRoute();
  const groups = navForRole(role);

  return (
    <nav aria-label="Điều hướng chính" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {groups.map((group) => (
        <div key={group.label}>
          <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
            {group.label}
          </div>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active =
                path === item.to ||
                (item.to !== `/${role}` && path.startsWith(`${item.to}/`)) ||
                (item.to === `/${role}` && path === `/${role}`);
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all",
                      active
                        ? "bg-brand/12 text-brand-bright shadow-[inset_0_0_0_1px_var(--brand-ring)]"
                        : "text-dim hover:bg-panel-2 hover:text-ink"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 icon transition-transform group-hover:scale-105",
                        active ? "text-brand-bright" : "text-faint group-hover:text-dim"
                      )}
                    />
                    {item.label}
                    {active ? (
                      <ChevronRight className="ml-auto size-3.5 icon text-brand-bright/60" />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarUser({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useSession();
  if (!user) return null;
  const roleLabel =
    user.role === "admin" ? "Quản trị viên" : user.role === "instructor" ? "Giảng viên" : "Thực tập sinh";

  return (
    <div className="border-t border-line p-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl border border-line bg-panel/60 p-2.5 text-left transition-colors hover:border-line-strong hover:bg-panel-2"
          >
            <UserAvatar name={user.displayName} size={34} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-ink">
                {user.displayName}
              </span>
              <span className="block truncate text-[11px] text-dim">{roleLabel}</span>
            </span>
            <ChevronRight className="size-4 icon text-faint" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="start"
          className="w-56 border-line bg-panel-2 text-ink"
        >
          <DropdownMenuLabel className="text-[11px] text-faint">
            {user.email}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-line" />
          <DropdownMenuItem
            className="gap-2 text-[13px] hover:!bg-panel-2"
            onClick={() => {
              navigate(`/${user.role}/profile`);
              onNavigate?.();
            }}
          >
            <UserRound className="size-4 icon" /> Hồ sơ cá nhân
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2 text-[13px] hover:!bg-panel-2"
            onClick={() => {
              navigate("/change-password");
              onNavigate?.();
            }}
          >
            <KeyRound className="size-4 icon" /> Đổi mật khẩu
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2 text-[13px] hover:!bg-panel-2"
            onClick={() => {
              navigate(`/${user.role}/notifications`);
              onNavigate?.();
            }}
          >
            <Bell className="size-4 icon" /> Thông báo
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-line" />
          <DropdownMenuItem
            className="gap-2 text-[13px] text-rose hover:!bg-rose/10 hover:!text-rose"
            onClick={async () => {
              await authApi.logout();
              toast.success("Đã đăng xuất");
              navigate("/login", { replace: true });
            }}
          >
            <LogOut className="size-4 icon" /> Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/* ------------------------- notification bell ------------------------- */

function NotificationBell() {
  const { user } = useSession();
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<AppNotification[] | null>(null);
  const [unread, setUnread] = React.useState(0);

  const loadNotifications = React.useCallback(async () => {
    try {
      const res = await notificationApi.list({ page: 1, pageSize: 7 });
      setItems(res.data);
      const unreadRes = await notificationApi.list({ page: 1, pageSize: 1, unread: true });
      setUnread(unreadRes.meta.total);
    } catch {
      /* silent */
    }
  }, []);

  React.useEffect(() => {
    loadNotifications();
    const t = setInterval(loadNotifications, 90_000);
    return () => clearInterval(t);
  }, [loadNotifications]);

  const openLink = (n: AppNotification) => {
    if (n.link?.startsWith("/")) navigate(n.link);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={(v) => { setOpen(v); if (v) loadNotifications(); }}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Thông báo${unread ? ` (${unread} chưa đọc)` : ""}`}
          className="relative grid size-9 place-items-center rounded-lg border border-line bg-panel text-dim transition-colors hover:border-line-strong hover:text-ink"
        >
          <Bell className="size-4 icon" />
          {unread > 0 ? (
            <span className="absolute -right-1 -top-1 grid min-w-[17px] place-items-center rounded-full bg-brand px-1 font-mono text-[10px] font-bold text-on-brand">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] border-line bg-panel-2 p-0 text-ink">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="text-sm font-semibold">Thông báo</span>
          <button
            type="button"
            className="text-[11px] font-medium text-brand-bright hover:underline"
            onClick={async (e) => {
              e.stopPropagation();
              try {
                await notificationApi.markAllRead();
                loadNotifications();
                toast.success("Đã đánh dấu tất cả là đã đọc");
              } catch {
                toast.error("Không thể cập nhật");
              }
            }}
          >
            Đọc tất cả
          </button>
        </div>
        <div className="max-h-[340px] overflow-y-auto">
          {items === null ? (
            <div className="px-4 py-8 text-center text-xs text-faint">Đang tải…</div>
          ) : items.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-faint">Chưa có thông báo nào</div>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => openLink(n)}
                className={cn(
                  "flex w-full gap-3 border-b border-line/60 px-4 py-3 text-left transition-colors last:border-0 hover:bg-panel-2",
                  !n.read && "bg-brand/[0.05]"
                )}
              >
                <span
                  className={cn(
                    "mt-1.5 size-1.5 shrink-0 rounded-full",
                    n.read ? "bg-transparent ring-1 ring-faint" : "bg-brand"
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-ink">{n.title}</span>
                  <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-dim">
                    {n.content}
                  </span>
                  <span className="mt-1 block text-[10px] text-faint">
                    {relativeTime(n.createdAt)}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            navigate(`/${user?.role ?? "intern"}/notifications`);
          }}
          className="w-full border-t border-line py-2.5 text-center text-xs font-medium text-brand-bright transition-colors hover:bg-brand/[0.06]"
        >
          Xem tất cả thông báo
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ------------------------- topbar ------------------------- */

function currentSectionTitle(path: string, role: Role): string | null {
  for (const group of navForRole(role)) {
    for (const item of group.items) {
      if (path === item.to || path.startsWith(`${item.to}/`)) return item.label;
    }
  }
  return null;
}

/* ------------------------- shell ------------------------- */

export function AppShell({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const { path } = useRoute();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const title = currentSectionTitle(path, role);

  return (
    <div className="min-h-screen bg-canvas">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-line bg-deep lg:flex">
        <div className="flex h-[60px] items-center border-b border-line px-5">
          <Link to="/" aria-label="V-Intern — về trang chủ">
            <Logo size={28} />
          </Link>
        </div>
        <SidebarNav role={role} />
        <SidebarUser />
      </aside>

      {/* mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-[290px] border-line bg-deep p-0 [&>button]:text-dim"
        >
          <SheetTitle className="sr-only">Menu điều hướng</SheetTitle>
          <div className="flex h-[60px] items-center justify-between border-b border-line px-5">
            <Link to="/" onClick={() => setMobileOpen(false)}>
              <Logo size={26} />
            </Link>
          </div>
          <SidebarNav role={role} onNavigate={() => setMobileOpen(false)} />
          <SidebarUser onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-[264px]">
        <header className="glass sticky top-0 z-30 flex h-[60px] items-center gap-3 border-b border-line px-4 md:px-6">
          <button
            type="button"
            aria-label="Mở menu"
            onClick={() => setMobileOpen(true)}
            className="grid size-9 place-items-center rounded-lg border border-line bg-panel text-dim transition-colors hover:text-ink lg:hidden"
          >
            <Menu className="size-4 icon" />
          </button>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-ink">{title ?? "V-Intern"}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>

        <main
          id="main"
          className="mx-auto w-full max-w-[1400px] p-4 pb-20 md:p-6 md:pb-24"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
