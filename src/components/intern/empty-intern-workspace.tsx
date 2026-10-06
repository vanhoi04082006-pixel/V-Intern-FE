import Image from "next/image";
import { BookOpen, FileText, Info, Send } from "lucide-react";

import {
  OutlineAction,
  PrimaryAction,
  SectionCard,
  StatusBadge,
} from "./intern-primitives";
import { InternshipInfoCard } from "./internship-info-card";
import { NextProcessCard } from "./next-process-card";
import { RecentActivityCard } from "./recent-activity";
import type { InternWorkspaceState } from "./data/intern-mock-data";

/**
 * State A — UNASSIGNED/WAITING của Intern Workspace (reference "Waiting
 * State (2)"). COMPOSITION DESKTOP (≥xl) theo reference:
 *
 *   TOPBAR
 *   ┌──────────────────────────────┬──────────────────┐
 *   │ TITLE + SUBTITLE             │ Thông tin thực tập│
 *   │ Welcome (mascot lớn)         │                  │
 *   │ Empty hero (flex-1, đặc)     ├──────────────────┤
 *   │ Hoạt động gần đây | Lưu ý    │ Quy trình tiếp theo│
 *   └──────────────────────────────┴──────────────────┘
 *
 * - Right rail bắt đầu NGAY dưới topbar (ngang hàng page title) — KHÔNG
 *   còn header full-width đẩy rail xuống thấp.
 * - Shell (intern-workspace.tsx) giới hạn main = 100dvh − topbar khi ≥xl;
 *   grid bên trong tự phân bổ (hero + quy trình là hàng co giãn min-h-0)
 *   → toàn bộ Waiting nằm trong MỘT viewport desktop, không scroll body,
 *   không cắt nội dung, KHÔNG dùng zoom/scale/font hack (density điều
 *   khiển qua token --iw-* trong globals.css).
 * - <xl (tablet/mobile): 1 cột, scroll bình thường — mascot welcome vẫn
 *   inline nhỏ, thứ tự title → welcome → hero → bottom → rail.
 *
 * Minh hoạ hero là khối thuần CSS/SVG (không pull ảnh ngoài). Mascot welcome
 * tái sử dụng asset có sẵn của repo (student-mascot-v2.png, nền trong suốt) —
 * phong cách 3D khớp reference; chỉ trang trí (alt rỗng + aria-hidden).
 */
export function EmptyInternWorkspace({
  state,
}: {
  state: Extract<InternWorkspaceState, { status: "unassigned" }>;
}) {
  const { welcome, emptyCard, infoRows, nextSteps, recentActivities, notes } =
    state;

  return (
    <div className="intern-waiting grid min-w-0 grid-cols-1 gap-5 xl:h-full xl:min-h-0 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-x-[var(--iw-gap)] xl:gap-y-0 2xl:grid-cols-[minmax(0,1fr)_432px]">
      {/* Cột trái: page title + welcome + empty hero + (hoạt động | lưu ý) */}
      <div className="flex min-w-0 flex-col gap-5 xl:min-h-0 xl:gap-[var(--iw-gap)]">
        {/* Page header — compact, chỉ nằm trong main column (reference) */}
        <header className="shrink-0">
          <h1 className="text-[26px] font-extrabold tracking-tight text-navy sm:text-3xl xl:text-[length:var(--iw-h1)] xl:leading-none">
            Intern Workspace
          </h1>
          <p className="mt-1 text-sm text-slate-500 xl:mt-0.5 xl:text-[13px]">
            {state.pageSubtitle}
          </p>
        </header>

        {/* Welcome card — compact, mascot lớn neo đáy trái (reference) */}
        <section
          aria-labelledby="intern-welcome"
          className="relative shrink-0 overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-r from-blue-100 via-blue-50 to-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-6 xl:h-[var(--iw-welcome-h)] xl:py-0 xl:pl-6 xl:pr-5"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-14 hidden size-44 rounded-full bg-blue-100/60 blur-2xl sm:block"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-16 right-24 hidden size-40 rounded-full border-[14px] border-white/50 blur-[2px] sm:block"
          />
          <div className="relative flex flex-wrap items-center gap-x-5 gap-y-4 xl:h-full xl:flex-nowrap xl:items-stretch xl:gap-x-7">
            {/* Mascot — asset có sẵn trong repo (nền đã trong suốt), thuần trang trí.
                Desktop: lớn hơn hẳn, neo đáy card như reference. */}
            <span aria-hidden="true" className="shrink-0 xl:flex xl:items-end">
              <Image
                src="/images/student-mascot-v2.png"
                alt=""
                width={136}
                height={181}
                priority
                className="h-28 w-auto drop-shadow-[0_10px_18px_rgba(37,99,235,0.18)] sm:h-32 xl:h-[var(--iw-mascot-h)]"
              />
            </span>
            <div className="min-w-0 flex-1 xl:flex xl:flex-col xl:justify-center xl:py-2">
              <h2
                id="intern-welcome"
                className="text-lg font-bold tracking-tight text-navy sm:text-xl xl:text-[length:var(--iw-greet)]"
              >
                {welcome.greeting}
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600 xl:max-w-lg xl:text-[13px] xl:leading-[1.35]">
                {welcome.message}
              </p>
              <ul className="mt-3 flex flex-wrap items-center gap-2 xl:mt-2">
                {welcome.badges.map((badge) => (
                  <li key={badge.id}>
                    <StatusBadge
                      tone={badge.tone}
                      className={
                        badge.tone === "blue"
                          ? "border border-blue-200 bg-white"
                          : "border border-emerald-200 bg-white"
                      }
                    >
                      <badge.icon className="size-3.5" aria-hidden="true" />
                      {badge.label}
                    </StatusBadge>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Card chính: chưa có dự án được phân công — hàng co giãn, nội dung
            căn giữa; chiếm đúng phần height còn lại của viewport desktop. */}
        <section
          aria-labelledby="intern-empty-assignment"
          className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-10 text-center shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:px-8 xl:px-6 xl:py-4"
        >
          {/* Minh hoạ thuần CSS/SVG: khung trình duyệt + mã nguồn + hộp mở +
              máy bay giấy bay ra cùng đường nối nét đứt (theo reference) —
              desktop chiếm nhiều presence hơn (reference: minh hoạ to). */}
          <div
            aria-hidden="true"
            className="relative mb-6 xl:mb-3 xl:h-[var(--iw-illu-h)]"
          >
            <svg
              viewBox="0 0 110 70"
              fill="none"
              className="absolute -right-16 -top-8 hidden h-[70px] w-[110px] sm:block xl:-right-12 xl:top-0"
            >
              <path
                d="M6 66 C 34 62, 62 48, 88 16"
                stroke="#93C5FD"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="1 8"
              />
            </svg>
            <Send className="absolute -right-[72px] -top-11 hidden size-6 -rotate-12 fill-blue-100 text-brand sm:block xl:-right-14 xl:top-0 xl:size-7" />
            <div className="flex h-24 w-52 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm xl:h-full xl:w-[var(--iw-win-w)]">
              <div className="flex items-center gap-1 border-b border-slate-100 bg-slate-50 px-2.5 py-1.5">
                <span className="size-1.5 rounded-full bg-slate-300" />
                <span className="size-1.5 rounded-full bg-slate-300" />
                <span className="size-1.5 rounded-full bg-slate-300" />
              </div>
              <div className="flex flex-1 items-center justify-center">
                <span className="font-mono text-lg font-bold text-brand xl:text-xl">
                  {"</>"}
                </span>
              </div>
            </div>
            <div className="absolute -bottom-3 -right-6 flex h-12 w-16 items-end justify-center rounded-b-lg border-x border-b border-slate-200 bg-blue-50 [clip-path:polygon(0_0,100%_0,78%_100%,22%_100%)] xl:-bottom-2 xl:-right-7 xl:h-11 xl:w-[4.25rem]">
              <span className="mb-2 size-1.5 rounded-full bg-brand/50" />
            </div>
          </div>

          <h2
            id="intern-empty-assignment"
            className="text-xl font-bold tracking-tight text-navy sm:text-2xl xl:text-[length:var(--iw-h2)]"
          >
            {emptyCard.title}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 xl:mt-1 xl:max-w-lg xl:text-[13px] xl:leading-[1.35]">
            {emptyCard.description}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 xl:mt-3 xl:gap-2.5">
            <PrimaryAction>
              <FileText className="size-4" aria-hidden="true" />
              {emptyCard.primaryAction}
            </PrimaryAction>
            <OutlineAction>
              <BookOpen className="size-4" aria-hidden="true" />
              {emptyCard.secondaryAction}
            </OutlineAction>
          </div>
        </section>

        {/* Reference: hoạt động rộng hơn lưu ý (~1.6:1) — nằm trong viewport */}
        <div className="grid min-w-0 shrink-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] xl:gap-[var(--iw-gap)]">
          <RecentActivityCard
            activities={recentActivities}
            actionLabel={state.activitiesActionLabel}
            className="xl:min-h-0"
          />

          {/* Lưu ý */}
          <SectionCard
            id="luu-y"
            icon={Info}
            tone="amber"
            title="Lưu ý"
            headerClassName="xl:px-4 xl:py-2"
            bodyClassName="bg-amber-50/60 xl:px-4 xl:py-2.5"
          >
            <ul className="flex list-disc flex-col gap-2 pl-4 text-[13px] leading-relaxed text-slate-700 marker:text-amber-500 xl:gap-1 xl:text-xs xl:leading-[var(--iw-lead)]">
              {notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
            <p className="mt-3 rounded-lg bg-amber-100/70 px-3 py-2.5 text-[13px] font-medium leading-relaxed text-amber-800 xl:mt-2 xl:py-1.5 xl:text-xs xl:leading-[1.35]">
              {state.notesFooter}
            </p>
          </SectionCard>
        </div>
      </div>

      {/* Cột phải (right rail): bắt đầu NGAY dưới topbar, ngang hàng page
          title — Thông tin thực tập + Quy trình tiếp theo vừa đủ viewport */}
      <aside
        aria-label="Thông tin thực tập và quy trình tiếp theo"
        className="flex min-w-0 flex-col gap-5 xl:min-h-0 xl:gap-[var(--iw-gap)]"
      >
        <InternshipInfoCard rows={infoRows} className="xl:shrink-0" />
        <NextProcessCard steps={nextSteps} className="xl:min-h-0 xl:flex-1" />
      </aside>
    </div>
  );
}
