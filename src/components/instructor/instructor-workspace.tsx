"use client";

import { useEffect, useRef, useState } from "react";

import { FlaskConical } from "lucide-react";

import { InstructorActivityCard } from "./instructor-activity-card";
import { InstructorKpiCard } from "./instructor-kpi-card";
import { InstructorPrReviewCard } from "./instructor-pr-review-card";
import { InstructorSessionsCard } from "./instructor-sessions-card";
import { InstructorSidebar } from "./instructor-sidebar";
import { InstructorSprintBurndownCard } from "./instructor-sprint-burndown-card";
import { InstructorStudentsCard } from "./instructor-students-card";
import { InstructorTaskOverviewCard } from "./instructor-task-overview-card";
import { InstructorTopbar } from "./instructor-topbar";
import {
  INSTRUCTOR_KPIS,
  INSTRUCTOR_WORKSPACE_META,
} from "./data/instructor-mock-data";

/**
 * Selector phần tử focus được trong drawer: link, nút/input/select/textarea
 * còn enabled và KHÔNG bị loại khỏi tab order (tabindex="-1", ví dụ nút phủ
 * overlay chỉ dùng cho chuột). Giữ local cho drawer này, không dựng
 * framework modal dùng chung.
 */
const DRAWER_FOCUSABLE_SELECTOR =
  'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])';

/**
 * Instructor Workspace (/instructor) — layout tổng theo ảnh reference:
 * - Desktop (≥lg): sidebar cố định trái + content phải, grid dày đặc.
 *   - Hàng 1: 5 KPI.
 *   - Hàng 2: Phiên thực tập (rộng) + Sprint & Burndown.
 *   - Hàng 3: Hiệu suất sinh viên (Top 5) + Review PR.
 *   - Hàng 4: Tổng quan Task + Hoạt động gần đây.
 * - Tablet/mobile: sidebar vào drawer, mọi card xếp 1 cột, bảng scroll
 *   ngang trong container, không overflow trang.
 *
 * Toàn bộ dữ liệu là mock presentation (xem data/instructor-mock-data.ts).
 * Tách hoàn toàn khỏi Admin Workspace — không import chéo component admin.
 */
export function InstructorWorkspace() {
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
      // drawer, không thoát ra topbar/search/nội dung nền. Không đổi visual.
      if (event.key !== "Tab") return;
      const container = drawerRef.current;
      if (!container) return;
      const items = Array.from(
        container.querySelectorAll<HTMLElement>(DRAWER_FOCUSABLE_SELECTOR)
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
      // Đưa focus vào mục điều hướng đầu drawer: keyboard user vào menu ngay
      // thay vì tab lạc ra nội dung nền sau overlay. Không đổi visual.
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
        href="#instructor-main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand focus:shadow-md"
      >
        Bỏ qua tới nội dung chính
      </a>

      {/* Sidebar desktop */}
      <InstructorSidebar className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-[240px] lg:border-r lg:border-slate-200" />

      {/* Drawer mobile */}
      {menuOpen ? (
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu giảng viên"
          className="fixed inset-0 z-50 lg:hidden"
        >
          <button
            type="button"
            aria-label="Đóng menu giảng viên"
            tabIndex={-1}
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-slate-900/50"
          />
          <InstructorSidebar
            className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] border-r border-slate-200 shadow-xl"
            onNavigate={() => setMenuOpen(false)}
          />
        </div>
      ) : null}

      <div className="flex min-h-dvh flex-col lg:pl-[240px]">
        <InstructorTopbar
          menuOpen={menuOpen}
          onOpenMenu={() => setMenuOpen(true)}
          menuButtonRef={openMenuButtonRef}
        />

        <main
          id="instructor-main-content"
          className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-5 sm:px-6 sm:py-6 2xl:px-8"
        >
          <header>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="text-[26px] font-extrabold tracking-tight text-navy sm:text-3xl">
                Instructor Workspace
              </h1>
              <span
                title="Số liệu mô phỏng để trình bày UI — chưa kết nối dữ liệu live"
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700"
              >
                <FlaskConical className="size-3.5" aria-hidden="true" />
                Dữ liệu mẫu
              </span>
            </div>
            <ul className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
              {INSTRUCTOR_WORKSPACE_META.map((meta) => (
                <li
                  key={meta.id}
                  className="flex items-center gap-2 text-[13px] text-slate-500"
                >
                  <meta.icon className="size-4 text-slate-400" aria-hidden="true" />
                  <span>{meta.label}:</span>
                  <span className="font-semibold text-navy">{meta.value}</span>
                </li>
              ))}
            </ul>
          </header>

          <ul
            aria-label="Chỉ số tổng quan"
            className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
          >
            {INSTRUCTOR_KPIS.map((kpi) => (
              <li key={kpi.id}>
                <InstructorKpiCard kpi={kpi} />
              </li>
            ))}
          </ul>

          {/* Hàng 2: phiên thực tập + sprint burndown */}
          <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[2fr_1fr]">
            <div className="min-w-0">
              <InstructorSessionsCard />
            </div>
            <div className="min-w-0">
              <InstructorSprintBurndownCard />
            </div>
          </div>

          {/* Hàng 3: top 5 sinh viên + review PR */}
          <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_1fr]">
            <div className="min-w-0">
              <InstructorStudentsCard />
            </div>
            <div className="min-w-0">
              <InstructorPrReviewCard />
            </div>
          </div>

          {/* Hàng 4: tổng quan task và hoạt động gần đây */}
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-2">
            <div className="min-w-0">
              <InstructorTaskOverviewCard />
            </div>
            <div className="min-w-0 lg:col-span-2 xl:col-span-1">
              <InstructorActivityCard />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
