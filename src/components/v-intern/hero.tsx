"use client";

import Image from "next/image";
import { ArrowRight, Bot, CalendarDays, FolderKanban, LayoutDashboard, ListTodo, Settings, Sparkles, TrendingUp } from "lucide-react";
import { FadeIn } from "@/components/v-intern/reveal";
import { FeatureStrip } from "@/components/v-intern/feature-strip";
import { Logo } from "@/components/v-intern/logo";

const SIDEBAR_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "My Tasks", icon: ListTodo, active: false },
  { label: "Sprint", icon: CalendarDays, active: false },
  { label: "Project", icon: FolderKanban, active: false },
  { label: "AI Mentor", icon: Bot, active: false },
  { label: "Performance", icon: TrendingUp, active: false },
  { label: "Settings", icon: Settings, active: false },
];

const KANBAN_COLUMNS = [
  {
    title: "To Do",
    dot: "bg-red-500",
    tasks: [
      { code: "PRO-100", name: "Integrate Login API", due: "Due in 2 days" },
      { code: "PRO-104", name: "Form Validation", due: "Due in 3 days" },
      { code: "PRO-108", name: "Error Handling", due: "Due in 5 days" },
    ],
  },
  {
    title: "In Progress",
    dot: "bg-blue-500",
    tasks: [
      { code: "PRO-102", name: "Setup Project", due: "Due tomorrow" },
      { code: "PRO-105", name: "UI Components", due: "Due in 4 days" },
    ],
  },
  {
    title: "Review",
    dot: "bg-amber-500",
    tasks: [
      { code: "PRO-101", name: "Register Flow", due: "Due in 2 days" },
      { code: "PRO-107", name: "Payment Integration", due: "Due in 6 days" },
    ],
  },
];

const PROGRESS_BARS = [
  { height: "h-3", color: "bg-blue-200" },
  { height: "h-5", color: "bg-blue-400" },
  { height: "h-4", color: "bg-teal-300" },
  { height: "h-7", color: "bg-blue-500" },
  { height: "h-5", color: "bg-teal-400" },
  { height: "h-8", color: "bg-blue-600" },
  { height: "h-6", color: "bg-blue-300" },
];

function DashboardMockup() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-2xl shadow-blue-900/10 ring-1 ring-slate-900/5">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden w-44 shrink-0 flex-col gap-1 bg-navy p-4 md:flex" aria-hidden="true">
          <div className="mb-4 px-1">
            <Logo inverse className="text-sm" />
          </div>
          {SIDEBAR_ITEMS.map((item) => (
            <span
              key={item.label}
              className={
                item.active
                  ? "flex items-center gap-2.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm"
                  : "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-300/80 transition-colors hover:bg-white/10 hover:text-white"
              }
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </span>
          ))}
        </aside>

        {/* Main area */}
        <div className="min-w-0 flex-1 bg-[#F7F9FE] p-4 sm:p-5">
          <p className="truncate text-sm font-bold text-navy sm:text-base">
            Good morning, Nguyễn Văn A 👋
          </p>
          <p className="mt-0.5 truncate text-[11px] text-slate-500 sm:text-xs">
            Frontend Developer · Intern · Sprint 02
          </p>

          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
              <span>Sprint Progress</span>
              <span className="text-blue-600">70%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-blue-100">
              <div className="h-full w-[70%] rounded-full bg-gradient-to-r from-blue-500 to-blue-600" />
            </div>
          </div>

          {/* Mini kanban — horizontally scrollable on small screens */}
          <div className="mt-4 overflow-x-auto pb-1">
            <div className="grid min-w-[420px] grid-cols-3 gap-2.5 md:min-w-0">
              {KANBAN_COLUMNS.map((column) => (
                <div
                  key={column.title}
                  className="rounded-xl border border-slate-200/80 bg-white/70 p-2"
                >
                  <div className="mb-2 flex items-center gap-1.5 px-0.5">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${column.dot}`} />
                    <span className="text-[11px] font-semibold text-slate-700">
                      {column.title}
                    </span>
                    <span className="ml-auto text-[10px] font-medium text-slate-400">
                      {column.tasks.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {column.tasks.map((task) => (
                      <div
                        key={task.code}
                        className="rounded-lg border border-slate-200/80 bg-white p-2 shadow-sm"
                      >
                        <span className="text-[10px] font-bold text-blue-600">
                          {task.code}
                        </span>
                        <p className="mt-0.5 text-[11px] font-medium leading-snug text-slate-800">
                          {task.name}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-400">{task.due}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section
      id="platform"
      aria-label="Giới thiệu nền tảng V-Intern"
      className="relative overflow-hidden bg-[#F5F8FF] scroll-mt-20"
    >
      {/* Soft radial gradient blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-[-10%] h-[480px] w-[480px] rounded-full bg-blue-300/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-20%] left-[-8%] h-[420px] w-[420px] rounded-full bg-indigo-200/40 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8 lg:py-24">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)] lg:gap-12">
          {/* Left column */}
          <FadeIn>
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-xs font-semibold text-blue-700">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              AI-Powered Virtual Internship Platform
            </span>

            <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-navy sm:text-5xl lg:text-6xl">
              Real Skills.
              <br />
              Real Projects.
              <br />
              <span className="text-blue-600">Your Future.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 md:text-lg">
              V-Intern mô phỏng môi trường làm việc thực tế, giúp sinh viên trải
              nghiệm quy trình phát triển phần mềm chuyên nghiệp với sự hỗ trợ
              của AI.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#for-students"
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-700"
              >
                Bắt đầu ngay
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="#how-it-works"
                className="inline-flex h-12 items-center rounded-lg border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-600"
              >
                Tìm hiểu thêm
              </a>
            </div>
          </FadeIn>

          {/* Right column — dashboard mockup */}
          <FadeIn className="relative mx-auto w-full max-w-[600px] lg:max-w-none" delay={0.15}>
            <div className="lg:px-4 lg:py-2">
              <DashboardMockup />
            </div>

            {/* Floating card: AI Review — nhích lên trên để không che dòng chào */}
            <div className="absolute -top-6 right-0 hidden animate-float items-center gap-3 rounded-2xl bg-white p-3.5 shadow-xl shadow-blue-900/10 ring-1 ring-slate-900/5 sm:flex md:-top-16 md:-right-2">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100">
                <Sparkles className="h-5 w-5 text-violet-600" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-navy">AI Review</p>
                <p className="truncate text-[11px] text-slate-500">
                  Task PRO-100 has been reviewed
                </p>
                <p className="text-[11px] font-bold text-blue-600">Score: 82/100</p>
              </div>
            </div>

            {/* Floating card: Your Progress */}
            <div className="absolute -bottom-8 right-2 hidden animate-float-delayed rounded-2xl bg-white p-4 shadow-xl shadow-blue-900/10 ring-1 ring-slate-900/5 sm:block md:right-6">
              <p className="text-[11px] font-semibold text-slate-500">
                Your Progress
              </p>
              <p className="mt-0.5 text-2xl font-extrabold text-blue-600">
                82<span className="text-base font-bold text-slate-400">/100</span>
              </p>
              <div className="mt-2 flex h-8 items-end gap-1" aria-hidden="true">
                {PROGRESS_BARS.map((bar, index) => (
                  <span
                    key={index}
                    className={`w-1.5 rounded-full ${bar.height} ${bar.color}`}
                  />
                ))}
              </div>
            </div>

            {/* Robot linh vật cut-out + bong bóng chat (theo ảnh tham chiếu) */}
            <div className="absolute -bottom-2 left-0 hidden animate-float-soft items-end gap-1.5 md:flex md:-left-4">
              <Image
                src="/images/robot-v2.png"
                alt="Robot linh vật của V-Intern"
                width={739}
                height={866}
                className="h-28 w-auto drop-shadow-xl lg:h-32"
                priority
              />
              <span className="mb-10 rounded-2xl rounded-bl-md bg-white px-4 py-2.5 text-xs font-semibold text-blue-600 shadow-lg shadow-blue-900/10 ring-1 ring-slate-900/5">
                Let&apos;s build your future!
              </span>
            </div>
          </FadeIn>
        </div>

        {/* Feature strip */}
        <FadeIn className="mt-20 lg:mt-24" delay={0.1}>
          <FeatureStrip />
        </FadeIn>
      </div>
    </section>
  );
}
