"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, Menu, X, Home, Layers, FolderKanban, KanbanSquare, ClipboardCheck, ChartNoAxesCombined, FileText, Share2, Github, UserRound, Users, Shield, Settings, Activity, GraduationCap } from "lucide-react";
import { Logo } from "@/components/v-intern/logo";
import { LogoutButton } from "@/components/auth/logout-button";
import { getSessionUser } from "@/lib/auth/session";
import { trapDialogFocus } from "@/lib/ui/dialog-focus";
export type ProductRole = "intern" | "instructor" | "admin";
const menus: Record<ProductRole, [string, string][]> = {
  intern: [
    ["", "Tổng quan"],
    ["work", "Công việc của tôi"],
    ["sprint", "Sprint Board"],
    ["project", "Dự án"],
    ["mentor", "AI Mentor"],
    ["evaluations", "Đánh giá"],
    ["performance", "Hiệu suất"],
    ["kpi", "KPI & Lương ảo"],
    ["certificates", "Chứng nhận"],
    ["recommendations", "Khuyến nghị"],
    ["notifications", "Thông báo"],
    ["profile", "Hồ sơ"],
  ],
  instructor: [
    ["", "Tổng quan"],
    ["sessions", "Phiên thực tập"],
    ["projects", "Thư viện dự án"],
    ["sprints", "Sprint & Task"],
    ["evaluations", "Đánh giá AI"],
    ["performance", "Hiệu suất thành viên"],
    ["reports", "Báo cáo"],
    ["sharing", "Chia sẻ dữ liệu"],
    ["github", "Kết nối GitHub"],
    ["notifications", "Thông báo"],
    ["profile", "Hồ sơ"],
  ],
  admin: [
    ["", "Tổng quan"],
    ["users", "Người dùng"],
    ["roles", "Vai trò & quyền"],
    ["groups", "Nhóm người dùng"],
    ["catalogs", "Danh mục dùng chung"],
    ["questions", "Ngân hàng câu hỏi"],
    ["templates", "Project template"],
    ["sessions", "Phiên thực tập"],
    ["performance", "Hiệu suất sinh viên"],
    ["reports", "Báo cáo"],
    ["ai", "Cấu hình AI"],
    ["settings", "Cài đặt hệ thống"],
    ["services", "Trạng thái dịch vụ"],
    ["activity", "Hoạt động gần đây"],
    ["audit", "Audit log"],
    ["tasks", "Nhiệm vụ"],
    ["notifications", "Thông báo"],
    ["profile", "Hồ sơ"],
  ],
};
const navIcons: Record<string, typeof Home> = { "": Home, sessions: Layers, projects: FolderKanban, sprints: KanbanSquare, evaluations: ClipboardCheck, performance: ChartNoAxesCombined, reports: FileText, sharing: Share2, github: Github, notifications: Bell, profile: UserRound, users: Users, roles: Shield, groups: Users, catalogs: Layers, settings: Settings, services: Activity, activity: Activity, audit: FileText, tasks: KanbanSquare };
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
    const closeOnDesktop = () => { if (breakpoint.matches) setOpen(false); };
    breakpoint.addEventListener("change", closeOnDesktop);
    return () => breakpoint.removeEventListener("change", closeOnDesktop);
  }, []);
  const navigation = (
    <>
      <div className="mb-6 border-b border-slate-100 px-3 pb-5">
        <Logo />
        <p className="mt-1 text-[9px] uppercase tracking-widest text-slate-400">
          Learn · Build · Belong
        </p>
      </div>
      <p className="mb-3 px-3 text-xs text-slate-500">
        {role === "admin"
          ? "Quản trị hệ thống"
          : role === "instructor"
            ? "Giảng viên"
            : "Workspace"}
      </p>
      <nav aria-label="Điều hướng workspace" className="space-y-1">
        {menus[role].map(([key, label]) => {
          const href = `/${role}${key ? `/${key}` : ""}`;
          const current = path === href || Boolean(key && path.startsWith(href + "/"));
          const Icon = navIcons[key] ?? Layers;
          const unavailable =
            role === "intern" &&
            !activeAssignment &&
            ["work", "sprint", "project"].includes(key);
          return unavailable ? (
            <span
              key={key}
              aria-disabled="true"
              className="block rounded-lg px-3 py-2.5 text-sm text-slate-300"
            >
              {label}
            </span>
          ) : (
            <Link
              key={key}
              href={href}
              onClick={() => setOpen(false)}
              aria-current={current ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 ${current ? "bg-blue-50 font-semibold text-blue-700 ring-1 ring-inset ring-blue-100" : "text-slate-600 hover:bg-slate-50 hover:text-navy"}`}
            >
              <Icon size={18} aria-hidden="true" />{label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/60 p-4"><GraduationCap className="mb-2 text-blue-600" size={22} aria-hidden="true" /><p className="text-xs font-semibold text-navy">Học qua dự án thực tế</p><p className="mt-1 text-xs leading-5 text-slate-500">Từng bước học tập, phản hồi và tiến bộ đều được ghi nhận.</p></div>
    </>
  );
  const title =
    menus[role].find(
      ([key]) => path === `/${role}${key ? `/${key}` : ""}`,
    )?.[1] ?? "Chi tiết";
  return (
    <div className="min-h-dvh bg-[#f4f6fb] text-slate-700">
      <a
        href="#product-content"
        className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-white focus:p-3"
      >
        Bỏ qua tới nội dung chính
      </a>
      <aside className="fixed inset-y-0 left-0 hidden w-[240px] overflow-y-auto border-r border-slate-200/70 bg-white p-3 lg:block">
        {navigation}
      </aside>
      <dialog
        ref={dialog}
        onKeyDown={trapDialogFocus}
        onCancel={(e) => {
          e.preventDefault();
          setOpen(false);
        }}
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-[280px] max-w-[85vw] overflow-y-auto bg-white p-3 backdrop:bg-slate-900/50"
        aria-label="Menu workspace"
      >
        <button
          aria-label="Đóng menu"
          className="mb-3 rounded-lg p-2"
          onClick={() => setOpen(false)}
        >
          <X />
        </button>
        {navigation}
      </dialog>
      <div className="lg:pl-[240px]">
        <header className="sticky top-0 z-30 flex min-h-[72px] flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-2 text-sm">
            <button
              aria-label="Mở menu"
              className="rounded-lg p-2 lg:hidden"
              onClick={() => setOpen(true)}
            >
              <Menu />
            </button>
            <Link href={`/${role}`} className="text-blue-700">
              V-Intern
            </Link>
            <ChevronRight size={14} />
            <span>{title}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link aria-label="Thông báo" href={`/${role}/notifications`}>
              <Bell size={19} />
            </Link>
            <div className="max-w-36 truncate text-xs">
              <strong className="block text-navy">{user?.displayName}</strong>
              <span>{role}</span>
            </div>
            <LogoutButton />
          </div>
        </header>
        <main
          id="product-content"
          className="mx-auto max-w-[1680px] p-4 sm:p-6"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
