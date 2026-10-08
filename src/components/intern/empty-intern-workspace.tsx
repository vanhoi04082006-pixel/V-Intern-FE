"use client";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, FileText, Info } from "lucide-react";

import { SectionCard, StatusBadge } from "./intern-primitives";
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
  onReload,
}: {
  state: Extract<InternWorkspaceState, { status: "unassigned" }>;
  onReload?: () => void;
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

        {/* Welcome card — compact, mascot lớn neo đáy trái. Round 3: panel
            dashboard sạch theo design system Instructor (thẻ trắng, border
            mảnh, không gradient landing-page/decorative blur). */}
        <section
          aria-labelledby="intern-welcome"
          className="relative shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-r from-blue-50 via-white to-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-6 xl:h-[var(--iw-welcome-h)] xl:py-0 xl:pl-6 xl:pr-5"
        >
          <div className="relative flex flex-wrap items-center gap-x-5 gap-y-4 xl:h-full xl:flex-nowrap xl:items-stretch xl:gap-x-7">
            {/* Mascot — asset có sẵn trong repo (nền đã trong suốt), thuần trang trí.
                Desktop: lớn hơn hẳn, neo đáy card như reference. */}
            <span
              aria-hidden="true"
              className="shrink-0 xl:relative xl:h-full xl:w-[160px]"
            >
              <Image
                src="/images/student-mascot-v2.png"
                alt=""
                width={136}
                height={181}
                priority
                className="h-28 w-auto drop-shadow-[0_10px_18px_rgba(37,99,235,0.14)] sm:h-32 xl:absolute xl:left-0 xl:top-2 xl:h-[calc(var(--iw-welcome-h)*1.55)] xl:max-w-none"
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
          {/* R01: browser, open blue box and paper plane; decorative only. */}
          <svg
            aria-hidden="true"
            viewBox="0 0 400 180"
            fill="none"
            className="mb-5 h-36 w-[min(100%,360px)] xl:mb-3 xl:h-[var(--iw-illu-h)]"
          >
            <defs>
              <linearGradient
                id="waiting-window"
                x1="125"
                y1="30"
                x2="260"
                y2="155"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#DCE9FF" />
                <stop offset="1" stopColor="#F6F9FF" />
              </linearGradient>
              <linearGradient
                id="waiting-box"
                x1="230"
                y1="108"
                x2="312"
                y2="168"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#92BAFF" />
                <stop offset="1" stopColor="#397BEE" />
              </linearGradient>
            </defs>
            <path
              d="M40 149C10 125 41 105 63 107C30 66 78 45 112 70C113 16 195 11 207 44C253 9 282 35 280 69C325 44 360 76 342 110C385 99 385 166 345 166H62C46 167 35 157 40 149Z"
              fill="#EFF5FF"
            />
            <circle cx="51" cy="105" r="7" fill="#E0EDFF" />
            <circle cx="358" cy="143" r="10" fill="#E4EEFF" />
            <rect
              x="112"
              y="30"
              width="151"
              height="122"
              rx="9"
              fill="url(#waiting-window)"
            />
            <path
              d="M112 40A10 10 0 0 1 122 30H253A10 10 0 0 1 263 40V48H112Z"
              fill="#D0E1FF"
            />
            <circle cx="126" cy="39" r="3" fill="#6099FA" />
            <circle cx="137" cy="39" r="3" fill="#6099FA" />
            <circle cx="148" cy="39" r="3" fill="#6099FA" />
            <rect
              x="122"
              y="49"
              width="131"
              height="93"
              rx="4"
              fill="#FBFDFF"
            />
            <path
              d="m176 78-15 13 15 13m26-26 15 13-15 13m-9-30-10 34"
              stroke="#8AB4FF"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M98 72C47 85 54 126 107 140M267 80C318 82 338 49 359 29"
              stroke="#9BBEFF"
              strokeWidth="2.5"
              strokeDasharray="5 7"
              strokeLinecap="round"
            />
            <path d="m344 22 38-10-17 31-5-15-16-6Z" fill="#80ADFF" />
            <path d="m360 28 22-16-17 31-5-15Z" fill="#4D8BEF" />
            <path
              d="m67 143-12-21 24 12-7-27 25 39"
              stroke="#D4E5FF"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path d="M231 111H310V168H231Z" fill="url(#waiting-box)" />
            <path d="M270 111H310V168H270Z" fill="#609BF9" />
            <path d="m231 111 39 0-14 23-42-1 17-22Z" fill="#92BBFF" />
            <path d="m270 111 40 0 18 23-42 0-16-23Z" fill="#A8CBFF" />
            <path d="M270 112V168" stroke="#3D7FEA" strokeOpacity=".35" />
            <path
              d="M38 169H362"
              stroke="#E2ECFD"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
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
            <Link
              href="/intern/onboarding/result"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-[13px] font-semibold text-white"
            >
              <FileText className="size-4" aria-hidden="true" />
              {emptyCard.primaryAction}
            </Link>
            <button
              type="button"
              onClick={onReload}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-[13px] font-semibold text-slate-700"
            >
              <BookOpen className="size-4" aria-hidden="true" />
              {emptyCard.secondaryAction}
            </button>
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
