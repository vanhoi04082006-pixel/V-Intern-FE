"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, Menu, X } from "lucide-react";
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
    ["classes", "Lớp học"],
    ["sessions", "Phiên thực tập"],
    ["projects", "Thư viện dự án"],
    ["sprints", "Sprint & Task"],
    ["evaluations", "Đánh giá AI"],
    ["performance", "Hiệu suất thành viên"],
    ["reports", "Báo cáo"],
    ["notifications", "Thông báo"],
    ["profile", "Hồ sơ"],
  ],
  admin: [
    ["", "Tổng quan"],
    ["users", "Người dùng"],
    ["roles", "Vai trò & quyền"],
    ["groups", "Nhóm người dùng"],
    ["catalogs", "Danh mục dùng chung"],
    ["settings", "Cài đặt hệ thống"],
    ["services", "Trạng thái dịch vụ"],
    ["activity", "Hoạt động gần đây"],
    ["audit", "Audit log"],
    ["tasks", "Nhiệm vụ"],
    ["notifications", "Thông báo"],
    ["profile", "Hồ sơ"],
  ],
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
              aria-current={path === href ? "page" : undefined}
              className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${path === href ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"}`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
  const title =
    menus[role].find(
      ([key]) => path === `/${role}${key ? `/${key}` : ""}`,
    )?.[1] ?? "Chi tiết";
  return (
    <div className="min-h-dvh bg-[#f5f8fd] text-slate-700">
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
        <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 bg-white px-4 py-3 sm:px-6">
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
