"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { WorkspaceStage } from "@/components/workspace/workspace-stage";
import { usePathname } from "next/navigation";
import {
  Activity,
  Award,
  Bell,
  BookOpen,
  Bot,
  ChartNoAxesCombined,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  FileText,
  FolderKanban,
  Github,
  GraduationCap,
  Home,
  KanbanSquare,
  LayoutTemplate,
  Layers,
  Lightbulb,
  ListTodo,
  Lock,
  Menu,
  Settings,
  Share2,
  Shield,
  Sparkles,
  UserRound,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/v-intern/logo";
import { LogoutButton } from "@/components/auth/logout-button";
import { getSessionUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { trapDialogFocus } from "@/lib/ui/dialog-focus";

export type ProductRole = "intern" | "instructor" | "admin";

type NavItem = [key: string, label: string];
type NavGroup = { heading?: string; items: NavItem[] };

/**
 * Menu theo nhóm để dễ quét: nhóm không tiêu đề giữ "Tổng quan" đầu tiên,
 * "Hồ sơ" luôn là mục cuối (drawer mobile dựa vào thứ tự này để trap focus).
 */
const menus: Record<ProductRole, NavGroup[]> = {
  intern: [
    { items: [["", "Tổng quan"]] },
    {
      heading: "Học tập",
      items: [
        ["work", "Công việc của tôi"],
        ["sprint", "Sprint Board"],
        ["project", "Dự án"],
        ["mentor", "AI Mentor"],
      ],
    },
    {
      heading: "Kết quả",
      items: [
        ["evaluations", "Đánh giá"],
        ["performance", "Hiệu suất"],
        ["kpi", "KPI & Lương ảo"],
        ["certificates", "Chứng nhận"],
        ["recommendations", "Khuyến nghị"],
      ],
    },
    {
      heading: "Cá nhân",
      items: [
        ["notifications", "Thông báo"],
        ["profile", "Hồ sơ"],
      ],
    },
  ],
  instructor: [
    { items: [["", "Tổng quan"]] },
    {
      heading: "Lớp & phiên",
      items: [
        ["sessions", "Phiên thực tập"],
        ["sprints", "Sprint & Task"],
      ],
    },
    {
      heading: "Dự án & đánh giá",
      items: [
        ["projects", "Thư viện dự án"],
        ["evaluations", "Đánh giá AI"],
        ["performance", "Hiệu suất thành viên"],
      ],
    },
    {
      heading: "Báo cáo & kết nối",
      items: [
        ["reports", "Báo cáo"],
        ["sharing", "Chia sẻ dữ liệu"],
        ["github", "Kết nối GitHub"],
      ],
    },
    {
      heading: "Cá nhân",
      items: [
        ["notifications", "Thông báo"],
        ["profile", "Hồ sơ"],
      ],
    },
  ],
  admin: [
    { items: [["", "Tổng quan"]] },
    {
      heading: "Con người",
      items: [
        ["users", "Người dùng"],
        ["roles", "Vai trò & quyền"],
        ["groups", "Nhóm người dùng"],
      ],
    },
    {
      heading: "Học tập",
      items: [
        ["sessions", "Phiên thực tập"],
        ["sprints", "Sprint & Task"],
        ["tasks", "Nhiệm vụ"],
        ["templates", "Project template"],
        ["questions", "Ngân hàng câu hỏi"],
        ["career-roles", "Thư viện nghề nghiệp"],
        ["catalogs", "Danh mục dùng chung"],
      ],
    },
    {
      heading: "Phân tích",
      items: [
        ["performance", "Hiệu suất sinh viên"],
        ["reports", "Báo cáo"],
      ],
    },
    {
      heading: "Hệ thống",
      items: [
        ["ai", "Cấu hình AI"],
        ["services", "Trạng thái dịch vụ"],
        ["settings", "Cài đặt hệ thống"],
        ["activity", "Hoạt động gần đây"],
        ["audit", "Audit log"],
      ],
    },
    {
      heading: "Cá nhân",
      items: [
        ["notifications", "Thông báo"],
        ["profile", "Hồ sơ"],
      ],
    },
  ],
};

const navIcons: Record<string, LucideIcon> = {
  "": Home,
  work: ListTodo,
  sessions: Layers,
  projects: FolderKanban,
  sprints: KanbanSquare,
  tasks: ListTodo,
  evaluations: ClipboardCheck,
  performance: ChartNoAxesCombined,
  reports: FileText,
  sharing: Share2,
  github: Github,
  mentor: Bot,
  kpi: Wallet,
  certificates: Award,
  recommendations: Lightbulb,
  notifications: Bell,
  profile: UserRound,
  users: Users,
  roles: Shield,
  groups: Users,
  catalogs: BookOpen,
  questions: CircleHelp,
  "career-roles": GraduationCap,
  templates: LayoutTemplate,
  ai: Sparkles,
  settings: Settings,
  services: Activity,
  activity: Activity,
  audit: FileText,
};

const roleLabels: Record<ProductRole, string> = {
  admin: "Quản trị viên",
  instructor: "Giảng viên",
  intern: "Sinh viên",
};

const roleFooters: Record<
  ProductRole,
  { icon: LucideIcon; title: string; text: string }
> = {
  admin: {
    icon: Shield,
    title: "Vận hành an toàn",
    text: "Phân quyền, cấu hình và nhật ký hệ thống đều được kiểm soát tại đây.",
  },
  instructor: {
    icon: GraduationCap,
    title: "Đồng hành cùng sinh viên",
    text: "Phiên, dự án và phản hồi giúp sinh viên tiến bộ từng bước.",
  },
  intern: {
    icon: GraduationCap,
    title: "Học qua dự án thực tế",
    text: "Từng bước học tập, phản hồi và tiến bộ đều được ghi nhận.",
  },
};

export function ProductShell({
  role,
  children,
  activeAssignment = true,
}: {
  role: ProductRole;
  children: ReactNode;
  activeAssignment?: boolean;
}) {
  const path = usePathname();
  const user = getSessionUser();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);

  useEffect(() => {
    const breakpoint = window.matchMedia?.("(min-width: 1024px)");
    if (!breakpoint) return;
    const closeOnDesktop = () => {
      if (breakpoint.matches) setOpen(false);
    };
    breakpoint.addEventListener("change", closeOnDesktop);
    return () => breakpoint.removeEventListener("change", closeOnDesktop);
  }, []);

  const flatItems = menus[role].flatMap((group) => group.items);
  const match = flatItems.find(
    ([key]) => path === `/${role}${key ? `/${key}` : ""}`,
  );
  const section = flatItems.find(
    ([key]) => key && path.startsWith(`/${role}/${key}/`),
  );
  const title = match?.[1] ?? "Chi tiết";
  const footer = roleFooters[role];
  const FooterIcon = footer.icon;

  const navigation = (
    <>
      <div className="workspace-brand mb-6 border-b border-slate-100 px-3 pb-5">
        <Logo />
        <p className="mt-1 text-[9px] uppercase tracking-widest text-slate-400">
          Learn · Build · Belong
        </p>
      </div>
      <p className="mb-3 px-3 text-xs font-medium text-slate-500">
        {roleLabels[role]}
      </p>
      <nav aria-label="Điều hướng workspace" className="space-y-4">
        {menus[role].map((group, groupIndex) => (
          <div
            key={group.heading ?? `group-${groupIndex}`}
            className="space-y-1"
          >
            {group.heading && (
              <p className="workspace-nav-label mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {group.heading}
              </p>
            )}
            {group.items.map(([key, label]) => {
              const href = `/${role}${key ? `/${key}` : ""}`;
              const current =
                path === href || Boolean(key && path.startsWith(href + "/"));
              const Icon = navIcons[key] ?? Layers;
              const unavailable =
                role === "intern" &&
                !activeAssignment &&
                ["work", "sprint", "project"].includes(key);
              return unavailable ? (
                <span
                  key={key}
                  aria-disabled="true"
                  title="Cần được phân công dự án để mở"
                  className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-300"
                >
                  <Icon size={18} aria-hidden="true" />
                  {label}
                  <Lock size={13} className="ml-auto" aria-hidden="true" />
                </span>
              ) : (
                <Link
                  key={key}
                  href={href}
                  onClick={() => setOpen(false)}
                  aria-current={current ? "page" : undefined}
                  className={`workspace-nav-item flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 ${
                    current
                      ? "bg-blue-50 font-semibold text-blue-700 ring-1 ring-inset ring-blue-100"
                      : "text-slate-600 hover:bg-slate-50 hover:text-navy"
                  }`}
                >
                  <Icon size={18} aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      {role === "instructor" ? (
        <div className="workspace-sidebar-account">
          <div className="aurora-account-link">
            <span className="aurora-account-monogram" aria-hidden="true">{user?.displayName?.charAt(0) || "G"}</span>
            <span><strong>{user?.displayName || "Giảng viên"}</strong><span>Không gian giảng dạy</span></span>
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
          <FooterIcon
            className="mb-2 text-blue-600"
            size={22}
            aria-hidden="true"
          />
          <p className="text-xs font-semibold text-navy">{footer.title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{footer.text}</p>
        </div>
      )}
    </>
  );

  return (
    <div
      className={cn(
        "product-shell min-h-dvh bg-canvas text-slate-700",
        `product-shell-${role}`,
      )}
    >
      <a
        href="#product-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-navy focus:shadow-lg focus:outline-2 focus:outline-offset-2 focus:outline-blue-600"
      >
        Bỏ qua tới nội dung chính
      </a>
      <aside
        aria-label="Thanh điều hướng workspace"
        className="product-sidebar fixed inset-y-0 left-0 hidden w-[240px] overflow-y-auto border-r border-slate-200/70 bg-white p-3 lg:block"
      >
        {navigation}
      </aside>
      <dialog
        ref={dialog}
        onKeyDown={trapDialogFocus}
        onClick={(event) => {
          if (event.target === dialog.current) setOpen(false);
        }}
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
        className="product-drawer fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-[280px] max-w-[85vw] overflow-y-auto bg-white p-3 backdrop:bg-slate-900/50"
        aria-label="Menu workspace"
      >
        <div className="flex min-h-full flex-col">
          <button
            aria-label="Đóng menu"
            className="mb-3 self-start rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            onClick={() => setOpen(false)}
          >
            <X aria-hidden="true" />
          </button>
          {navigation}
        </div>
      </dialog>
      <div className="aurora-shell-content lg:pl-[240px]">
        <header className="product-topbar sticky top-0 z-30 flex min-h-[72px] flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-6">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <button
              aria-label="Mở menu"
              className="grid size-10 shrink-0 place-items-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 lg:hidden"
              onClick={() => setOpen(true)}
            >
              <Menu aria-hidden="true" />
            </button>
            <nav
              aria-label="Breadcrumb"
              className="flex min-w-0 items-center gap-2"
            >
              <Link
                href={`/${role}`}
                className="shrink-0 rounded font-medium text-blue-700 transition-colors hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
              >
                V-Intern
              </Link>
              <ChevronRight
                size={14}
                className="shrink-0 text-slate-300"
                aria-hidden="true"
              />
              {section ? (
                <>
                  <Link
                    href={`/${role}/${section[0]}`}
                    className="truncate rounded text-slate-500 transition-colors hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
                  >
                    {section[1]}
                  </Link>
                  <ChevronRight
                    size={14}
                    className="shrink-0 text-slate-300"
                    aria-hidden="true"
                  />
                  <span
                    aria-current="page"
                    className="truncate font-medium text-navy"
                  >
                    Chi tiết
                  </span>
                </>
              ) : (
                <span
                  aria-current="page"
                  className="truncate font-medium text-navy"
                >
                  {title}
                </span>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              aria-label="Thông báo"
              href={`/${role}/notifications`}
              className="grid size-10 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
            >
              <Bell size={19} aria-hidden="true" />
            </Link>
            {role === "instructor" && user ? (
              <span className="product-avatar" aria-hidden="true">
                {user.displayName
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toLocaleUpperCase("vi")}
              </span>
            ) : null}
            <div className="product-topbar-user max-w-24 truncate text-xs sm:max-w-36">
              <strong
                className="block truncate text-navy"
                title={user?.displayName}
              >
                {user?.displayName}
              </strong>
              <span className="text-slate-400">{roleLabels[role]}</span>
            </div>
            <LogoutButton />
          </div>
        </header>
        <main
          id="product-content"
          className="product-main mx-auto max-w-[1680px] p-4 sm:p-6"
        >
          {role === "instructor" ? <WorkspaceStage role="instructor">{children}</WorkspaceStage> : children}
        </main>
      </div>
    </div>
  );
}
