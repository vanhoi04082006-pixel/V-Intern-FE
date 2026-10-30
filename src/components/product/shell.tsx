"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { WorkspaceStage } from "@/components/workspace/workspace-stage";
import { usePathname } from "next/navigation";
import type { UiIcon } from "@/lib/ui/icon";
import {
  IconAward,
  IconBell,
  IconBook,
  IconCap,
  IconChart,
  IconChecklist,
  IconChevronRight,
  IconClipboardCheck,
  IconCoins,
  IconFile,
  IconFolder,
  IconHelp,
  IconHome,
  IconKanban,
  IconLayers,
  IconBulb,
  IconLock,
  IconMenu,
  IconPulse,
  IconRobot,
  IconShield,
  IconSliders,
  IconSparkles,
  IconTemplate,
  IconUser,
  IconUsers,
  IconWallet,
  IconClose,
} from "@/components/v-intern/icons";
import { Logo } from "@/components/v-intern/logo";
import { LogoutButton } from "@/components/auth/logout-button";
import { NotificationBell } from "@/components/shared/notification-bell";
import { ThemeToggle } from "@/components/shared/theme-toggle";
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
        ["participation", "Thời hạn & ghi nhận"],
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
        ["recruitment-rounds", "Hồ sơ CV & lịch tuyển"],
        ["sessions", "Phiên thực tập"],
        ["sprints", "Sprint & Task"],
        ["participation", "Thời hạn & kỷ luật"],
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
        ["recruitment-rounds", "Hồ sơ CV & lịch tuyển"],
        ["knowledge", "Kho tri thức Agent"],
        ["catalogs", "Danh mục dùng chung"],
      ],
    },
    {
      heading: "Phân tích",
      items: [
        ["performance", "Hiệu suất sinh viên"],
        ["kpi", "Kỳ KPI"],
        ["salary", "Lương ảo"],
        ["certificates", "Chứng nhận"],
        ["reports", "Báo cáo"],
      ],
    },
    {
      heading: "Hệ thống",
      items: [
        ["ai", "Cấu hình AI"],
        ["services", "Trạng thái dịch vụ"],
        ["communications", "Email & lịch gửi"],
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

const navIcons: Record<string, UiIcon> = {
  "": IconHome,
  work: IconChecklist,
  sessions: IconLayers,
  projects: IconFolder,
  sprints: IconKanban,
  tasks: IconChecklist,
  participation: IconClipboardCheck,
  evaluations: IconClipboardCheck,
  performance: IconChart,
  reports: IconFile,
  github: IconRobot,
  mentor: IconRobot,
  kpi: IconWallet,
  salary: IconCoins,
  certificates: IconAward,
  recommendations: IconBulb,
  notifications: IconBell,
  profile: IconUser,
  users: IconUsers,
  roles: IconShield,
  groups: IconUsers,
  catalogs: IconBook,
  questions: IconHelp,
  "career-roles": IconCap,
  knowledge: IconBook,
  templates: IconTemplate,
  ai: IconSparkles,
  settings: IconSliders,
  services: IconPulse,
  activity: IconPulse,
  audit: IconFile,
};

const roleLabels: Record<ProductRole, string> = {
  admin: "Quản trị viên",
  instructor: "Giảng viên",
  intern: "Sinh viên",
};

const roleFooters: Record<
  ProductRole,
  { icon: UiIcon; title: string; text: string }
> = {
  admin: {
    icon: IconShield,
    title: "Vận hành an toàn",
    text: "Phân quyền, cấu hình và nhật ký hệ thống đều được kiểm soát tại đây.",
  },
  instructor: {
    icon: IconCap,
    title: "Đồng hành cùng sinh viên",
    text: "Phiên, dự án và phản hồi giúp sinh viên tiến bộ từng bước.",
  },
  intern: {
    icon: IconCap,
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
      <div className="workspace-brand mb-6 border-b border-border px-3 pb-5">
        <Logo />
        
      </div>
      <p className="mb-3 px-3 text-caption font-medium text-muted-foreground">
        {roleLabels[role]}
      </p>
      <nav aria-label="Điều hướng workspace" className="space-y-4">
        {menus[role].map((group, groupIndex) => (
          <div
            key={group.heading ?? `group-${groupIndex}`}
            className="space-y-1"
          >
            {group.heading && (
              <p className="workspace-nav-label notebook-nav-group mb-1.5 px-3 text-caption font-semibold  text-muted-foreground">
                {group.heading}
              </p>
            )}
            {group.items.map(([key, label]) => {
              const href = `/${role}${key ? `/${key}` : ""}`;
              const current =
                path === href || Boolean(key && path.startsWith(href + "/"));
              const Icon = navIcons[key] ?? IconLayers;
              const unavailable =
                role === "intern" &&
                !activeAssignment &&
                ["work", "sprint", "project"].includes(key);
              return unavailable ? (
                <span
                  key={key}
                  aria-disabled="true"
                  title="Cần được phân công dự án để mở"
                  className="flex min-h-11 items-center gap-3 rounded-control px-3 py-3 text-small font-medium text-muted-foreground"
                >
                  <Icon size={18} aria-hidden="true" />
                  {label}
                  <IconLock size={13} className="ml-auto" aria-hidden="true" />
                </span>
              ) : (
                <Link
                  key={key}
                  href={href}
                  onClick={() => setOpen(false)}
                  aria-current={current ? "page" : undefined}
                  className={`workspace-nav-item flex min-h-11 items-center gap-3 rounded-control px-3 py-3 text-small font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                    current
                      ? "bg-accent font-semibold text-primary ring-1 ring-inset ring-ring"
                      : "text-muted-foreground hover:bg-background hover:text-foreground"
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
        <div className="product-shell-footer-card mt-8 rounded-panel border border-primary/35 bg-accent/60 p-4">
          <FooterIcon
            className="mb-2 text-primary"
            size={22}
            aria-hidden="true"
          />
          <p className="text-caption font-semibold text-foreground">{footer.title}</p>
          <p className="mt-1 text-caption leading-5 text-muted-foreground">{footer.text}</p>
        </div>
      )}
    </>
  );

  return (
    <div
      className={cn(
        "product-shell min-h-dvh bg-background text-foreground",
        `product-shell-${role}`,
      )}
    >
      <a
        href="#product-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-control focus:bg-card focus:px-4 focus:py-3 focus:text-body focus:font-semibold focus:text-foreground focus:shadow-popover focus:outline-2 focus:outline-offset-2 focus:outline-ring"
      >
        Bỏ qua tới nội dung chính
      </a>
      <aside
        aria-label="Thanh điều hướng workspace"
        className="product-sidebar fixed inset-y-0 left-0 hidden overflow-y-auto border-r border-border/70 bg-card p-3 lg:block"
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
        className="product-drawer fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-[280px] max-w-[85vw] overflow-y-auto bg-card p-3 backdrop:bg-foreground/50"
        aria-label="Menu workspace"
      >
        <div className="page-curl flex min-h-full flex-col">
          <button
            aria-label="Đóng menu"
            className="mb-3 self-start rounded-control p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setOpen(false)}
          >
            <IconClose aria-hidden="true" />
          </button>
          {navigation}
        </div>
      </dialog>
      <div className="aurora-shell-content">
        <header className="product-topbar sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-card/95 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 text-body">
            <button
              aria-label="Mở menu"
              className="grid size-10 shrink-0 place-items-center rounded-control text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
              onClick={() => setOpen(true)}
            >
              <IconMenu aria-hidden="true" />
            </button>
            <nav
              aria-label="Breadcrumb"
              className="flex min-w-0 items-center gap-2"
            >
              <Link
                href={`/${role}`}
                className="shrink-0 rounded font-medium text-primary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              >
                V-Intern
              </Link>
              <IconChevronRight
                size={14}
                className="shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              {section ? (
                <>
                  <Link
                    href={`/${role}/${section[0]}`}
                    className="truncate rounded text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                  >
                    {section[1]}
                  </Link>
                  <IconChevronRight
                    size={14}
                    className="shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span
                    aria-current="page"
                    className="truncate font-medium text-foreground"
                  >
                    Chi tiết
                  </span>
                </>
              ) : (
                <span
                  aria-current="page"
                  className="truncate font-medium text-foreground"
                >
                  {title}
                </span>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle className="hidden sm:inline-flex" />
            <NotificationBell href={`/${role}/notifications`} />
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
            <div className="product-topbar-user max-w-24 truncate text-caption sm:max-w-36">
              <strong
                className="block truncate text-foreground"
                title={user?.displayName}
              >
                {user?.displayName}
              </strong>
              <span className="text-muted-foreground">{roleLabels[role]}</span>
            </div>
            <LogoutButton />
          </div>
        </header>
        <main
          id="product-content"
          className="product-main mx-auto max-w-none p-4 sm:p-6"
        >
          {role === "instructor" ? <WorkspaceStage role="instructor">{children}</WorkspaceStage> : children}
        </main>
      </div>
    </div>
  );
}
