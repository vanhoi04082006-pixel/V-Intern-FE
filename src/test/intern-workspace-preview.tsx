"use client";

import { useEffect, useRef, useState } from "react";

import { FlaskConical } from "lucide-react";

import { ActiveInternWorkspace } from "@/components/intern/active-intern-workspace";
import { EmptyInternWorkspace } from "@/components/intern/empty-intern-workspace";
import {
  resolveInternWorkspaceState,
  type InternWorkspaceState,
} from "@/components/intern/data/intern-mock-data";
import type { InternPreviewState } from "@/components/intern/intern-preview";
import { InternSidebar } from "@/components/intern/intern-sidebar";
import { InternTopbar } from "@/components/intern/intern-topbar";
import {
  OutlineAction,
  PrimaryAction,
} from "@/components/intern/intern-primitives";

/**
 * Selector phần tử focus được trong drawer — giữ local (cùng pattern với
 * InstructorWorkspace), không dựng framework modal dùng chung.
 */
const DRAWER_FOCUSABLE_SELECTOR =
  'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])';

/**
 * Intern Workspace (/intern) — 1 route, 2 business state (discriminated
 * union trong data/intern-mock-data.ts):
 * - "unassigned": welcome + "Chưa có dự án được phân công" + Thông tin
 *   thực tập + Quy trình tiếp theo + Hoạt động gần đây + Lưu ý (reference 2).
 * - "active": KPI + Task Board + Task đang tập trung + AI Mentor + PR &
 *   AI Review + Thông báo + Hiệu suất thực tập (reference 1).
 *
 * - Desktop (≥lg): sidebar cố định trái; tablet/mobile: sidebar vào drawer
 *   với focus trap + Escape, mọi card xếp 1 cột, board scroll ngang.
 * - Component phải render bên trong `WorkspaceGuard allowedRoles=["intern"]`
 *   (page.tsx lo) — shell này KHÔNG tự kiểm tra auth.
 * - Toàn bộ dữ liệu là mock presentation (data/intern-mock-data.ts); tách
 *   hoàn toàn khỏi Admin/Instructor Workspace — không import chéo.
 *
 * COMPOSITION THEO STATE (Round 2 — one-viewport waiting desktop):
 * - ACTIVE giữ nguyên: header spanning full width (h1 + badge "Dữ liệu mẫu"
 *   + meta) rồi nội dung — KHÔNG ép layout one-viewport của Waiting lên
 *   Active (tránh regression).
 * - WAITING: right rail (Thông tin thực tập + Quy trình tiếp theo) bắt đầu
 *   NGAY dưới topbar, ngang hàng với page title nằm trong MAIN column
 *   (EmptyInternWorkspace tự render header + grid 2 cột). Desktop ≥xl shell
 *   cao 100dvh + overflow-hidden scoped CHỈ cho waiting — không đụng
 *   html/body overflow; tablet/mobile scroll bình thường. Badge "Dữ liệu
 *   mẫu" chỉ còn ở Active (reference waiting không có debug/demo noise).
 *
 * Round 3 (design-system sync với Instructor): topbar MỘT composition cho
 * cả 2 state — breadcrumb trái (Waiting: V-Intern > Intern Workspace >
 * Tổng quan; Active: org > project > sprint), search phải, h-16.
 */
export function InternWorkspacePreview({
  previewState = null,
}: {
  /** Dev-only: `?_preview=empty|active` — page đã parse; dev preview render
   * không mount guard (review UI không cần Backend), production luôn `null`
   * và render sau `WorkspaceGuard` như cũ. */
  previewState?: InternPreviewState | null;
}) {
  const state = resolveInternWorkspaceState(previewState);
  const isWaiting = state.status !== "active";

  const [menuOpen, setMenuOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const openMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const drawerWasOpenRef = useRef(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      // Focus trap tối thiểu cho drawer modal: Tab/Shift+Tab quấn vòng trong
      // drawer. Cùng hành vi với InstructorWorkspace — không đổi visual.
      if (event.key !== "Tab") return;
      const container = drawerRef.current;
      if (!container) return;
      const items = Array.from(
        container.querySelectorAll<HTMLElement>(DRAWER_FOCUSABLE_SELECTOR),
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const inside = !!active && container.contains(active);
      const wrapBackward = event.shiftKey && (!inside || active === first);
      const wrapForward = !event.shiftKey && (!inside || active === last);
      if (wrapBackward || wrapForward) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    if (menuOpen) {
      drawerWasOpenRef.current = true;
      // Đưa focus vào mục điều hướng đầu drawer khi mở.
      drawerRef.current
        ?.querySelector<HTMLElement>("nav a[href], nav button:not([disabled])")
        ?.focus();
    } else if (drawerWasOpenRef.current) {
      drawerWasOpenRef.current = false;
      openMenuButtonRef.current?.focus();
    }
  }, [menuOpen]);

  return (
    <div className="min-h-dvh bg-[#F4F6FB]">
      <a
        href="#intern-main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand focus:shadow-md"
      >
        Bỏ qua tới nội dung chính
      </a>

      {/* Sidebar desktop */}
      <InternSidebar
        groups={state.navGroups}
        className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-[240px] lg:border-r lg:border-slate-200"
      />

      {/* Drawer mobile */}
      {menuOpen ? (
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu thực tập sinh"
          className="fixed inset-0 z-50 lg:hidden"
        >
          <button
            type="button"
            aria-label="Đóng menu thực tập sinh"
            tabIndex={-1}
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-slate-900/50"
          />
          <InternSidebar
            groups={state.navGroups}
            className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] border-r border-slate-200 shadow-xl"
            onNavigate={() => setMenuOpen(false)}
          />
        </div>
      ) : null}

      <div
        className={cnJoin(
          "flex min-h-dvh flex-col lg:pl-[240px]",
          isWaiting && "xl:h-dvh xl:min-h-0",
        )}
      >
        <InternTopbar
          breadcrumb={buildBreadcrumb(state)}
          searchPlaceholder={state.searchPlaceholder}
          user={state.user}
          menuOpen={menuOpen}
          onOpenMenu={() => setMenuOpen(true)}
          menuButtonRef={openMenuButtonRef}
        />

        {state.status === "active" ? (
          <main
            id="intern-main-content"
            className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-5 sm:px-6 sm:py-6 2xl:px-8"
          >
            <header>
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <h1 className="text-[26px] font-extrabold tracking-tight text-navy sm:text-3xl">
                    Intern Workspace
                  </h1>
                  <span
                    title="Số liệu mô phỏng để trình bày UI — chưa kết nối dữ liệu live"
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700"
                  >
                    <FlaskConical className="size-3.5" aria-hidden="true" />
                    Dữ liệu mẫu
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {state.headerActions.map((action) =>
                    action.primary ? (
                      <PrimaryAction key={action.id}>
                        {action.label}
                      </PrimaryAction>
                    ) : (
                      <OutlineAction key={action.id}>
                        {action.label}
                      </OutlineAction>
                    ),
                  )}
                </div>
              </div>

              <ul className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
                {state.assignment.meta.map((meta) => (
                  <li
                    key={meta.id}
                    className="flex items-center gap-2 text-[13px] text-slate-500"
                  >
                    <meta.icon
                      className="size-4 text-slate-400"
                      aria-hidden="true"
                    />
                    <span>{meta.label}:</span>
                    <span className="font-semibold text-navy">
                      {meta.value}
                    </span>
                  </li>
                ))}
                <li className="flex items-center gap-2 text-[13px] text-slate-500">
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-full bg-emerald-500"
                  />
                  <span>Trạng thái:</span>
                  <span className="font-semibold text-emerald-700">
                    {state.assignment.statusLabel}
                  </span>
                </li>
              </ul>
            </header>

            <div className="mt-5">
              <ActiveInternWorkspace state={state} />
            </div>
          </main>
        ) : (
          /* Waiting: main chứa toàn bộ chiều cao còn lại của viewport,
           * grid 2 cột bên trong tự phân bổ — desktop không scroll body. */
          <main
            id="intern-main-content"
            className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-4 sm:px-6 sm:py-5 xl:min-h-0 xl:overflow-hidden xl:px-6 xl:py-2 2xl:px-8"
          >
            <EmptyInternWorkspace state={state} />
          </main>
        )}
      </div>
    </div>
  );
}

/** Join className strings với điều kiện (tránh thêm dependency mới). */
function cnJoin(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * Breadcrumb theo state, cùng ngôn ngữ shell với Instructor Workspace:
 * - Waiting: V-Intern > Intern Workspace > Tổng quan (current = mục nav active).
 * - Active: V-Intern > org > project > sprint hiện tại.
 */
function buildBreadcrumb(state: InternWorkspaceState) {
  if (state.status === "active") {
    const { org, project, sprint } = state.assignment.breadcrumb;
    return [
      { id: "org", label: org, href: "/intern" },
      { id: "project", label: project, href: "/intern" },
      { id: "sprint", label: sprint, current: true },
    ];
  }
  return [
    { id: "workspace", label: "Intern Workspace", href: "/intern" },
    { id: "overview", label: "Tổng quan", current: true },
  ];
}
