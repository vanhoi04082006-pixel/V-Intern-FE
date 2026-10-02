import { BookOpen, FileText, Info } from "lucide-react";

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
 * State A — UNASSIGNED/EMPTY của Intern Workspace (reference image 2):
 * welcome card (badge vai trò + hoàn thành tuyển dụng), card chính "Chưa có
 * dự án được phân công", Thông tin thực tập, Quy trình tiếp theo, Hoạt động
 * gần đây, Lưu ý. Chỉ render SAU khi WorkspaceGuard xác thực role intern.
 *
 * Minh hoạ trong reference là illustration 3D — thay bằng khối minh hoạ
 * thuần CSS/icon (không pull ảnh ngoài theo quy ước repo).
 */
export function EmptyInternWorkspace({
  state,
}: {
  state: Extract<InternWorkspaceState, { status: "unassigned" }>;
}) {
  const { welcome, emptyCard, infoRows, nextSteps, recentActivities, notes } =
    state;

  return (
    <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      {/* Cột trái: welcome + empty card + (hoạt động | lưu ý) */}
      <div className="flex min-w-0 flex-col gap-5">
        {/* Welcome card */}
        <section
          aria-labelledby="intern-welcome"
          className="relative overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-6"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-14 hidden size-44 rounded-full bg-blue-100/60 blur-2xl sm:block"
          />
          <div className="relative flex flex-wrap items-center gap-x-5 gap-y-4">
            <span
              aria-hidden="true"
              className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand text-2xl font-extrabold text-white shadow-sm"
            >
              {state.user.initials}
            </span>
            <div className="min-w-0 flex-1">
              <h2
                id="intern-welcome"
                className="text-lg font-bold tracking-tight text-navy sm:text-xl"
              >
                {welcome.greeting}
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600">
                {welcome.message}
              </p>
              <ul className="mt-3 flex flex-wrap items-center gap-2">
                {welcome.badges.map((badge) => (
                  <li key={badge.id}>
                    <StatusBadge tone={badge.tone}>
                      <badge.icon className="size-3.5" aria-hidden="true" />
                      {badge.label}
                    </StatusBadge>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Card chính: chưa có dự án được phân công */}
        <section
          aria-labelledby="intern-empty-assignment"
          className="flex flex-col items-center rounded-xl border border-slate-200 bg-white px-5 py-10 text-center shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:px-8"
        >
          {/* Minh hoạ thuần CSS: khung trình duyệt + mã nguồn + hộp mở */}
          <div aria-hidden="true" className="relative mb-6">
            <div className="flex h-24 w-52 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-1 border-b border-slate-100 bg-slate-50 px-2.5 py-1.5">
                <span className="size-1.5 rounded-full bg-slate-300" />
                <span className="size-1.5 rounded-full bg-slate-300" />
                <span className="size-1.5 rounded-full bg-slate-300" />
              </div>
              <div className="flex flex-1 items-center justify-center">
                <span className="font-mono text-lg font-bold text-brand">
                  {"</>"}
                </span>
              </div>
            </div>
            <div className="absolute -bottom-3 -right-6 flex h-12 w-16 items-end justify-center rounded-b-lg border-x border-b border-slate-200 bg-blue-50 [clip-path:polygon(0_0,100%_0,78%_100%,22%_100%)]">
              <span className="mb-2 size-1.5 rounded-full bg-brand/50" />
            </div>
          </div>

          <h2
            id="intern-empty-assignment"
            className="text-xl font-bold tracking-tight text-navy sm:text-2xl"
          >
            {emptyCard.title}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
            {emptyCard.description}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
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

        <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2">
          <RecentActivityCard
            activities={recentActivities}
            actionLabel={state.activitiesActionLabel}
          />

          {/* Lưu ý */}
          <SectionCard
            id="luu-y"
            icon={Info}
            tone="amber"
            title="Lưu ý"
            bodyClassName="bg-amber-50/60"
          >
            <ul className="flex list-disc flex-col gap-2 pl-4 text-[13px] leading-relaxed text-slate-700 marker:text-amber-500">
              {notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
            <p className="mt-3 rounded-lg bg-amber-100/70 px-3 py-2.5 text-[13px] font-medium leading-relaxed text-amber-800">
              {state.notesFooter}
            </p>
          </SectionCard>
        </div>
      </div>

      {/* Cột phải: thông tin thực tập + quy trình tiếp theo */}
      <div className="flex min-w-0 flex-col gap-5">
        <InternshipInfoCard rows={infoRows} />
        <NextProcessCard steps={nextSteps} />
      </div>
    </div>
  );
}
