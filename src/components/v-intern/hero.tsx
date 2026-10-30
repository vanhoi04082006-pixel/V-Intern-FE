"use client";

import Image from "next/image";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  Settings,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { FadeIn } from "@/components/v-intern/reveal";
import { FeatureStrip } from "@/components/v-intern/feature-strip";
import { Logo } from "@/components/v-intern/logo";
import {
  HandArrowDown,
  SparkleDoodle,
  StarDoodle,
  Tape,
} from "@/components/v-intern/doodles";

const SIDEBAR_ITEMS = [
  { label: "Bảng điều khiển", icon: LayoutDashboard, active: true },
  { label: "Nhiệm vụ của tôi", icon: ListTodo, active: false },
  { label: "Sprint", icon: CalendarDays, active: false },
  { label: "Dự án", icon: FolderKanban, active: false },
  { label: "AI Mentor", icon: Bot, active: false },
  { label: "Hiệu suất", icon: TrendingUp, active: false },
  { label: "Cài đặt", icon: Settings, active: false },
];

const OVERVIEW_ITEMS = [
  {
    title: "Dự án & Sprint",
    text: "Theo dõi mục tiêu và công việc được giao",
    icon: FolderKanban,
  },
  {
    title: "Nhiệm vụ",
    text: "Cập nhật tiến độ, trao đổi và gửi duyệt",
    icon: ListTodo,
  },
  {
    title: "AI Mentor",
    text: "Nhận hướng dẫn tham khảo khi cần hỗ trợ",
    icon: Bot,
  },
];

/** Khung "polaroid" chứa ảnh chụp màn hình workspace — như tấm hình được dán lên sổ. */
function DashboardPolaroid() {
  return (
    <div className="sketch-card rotate-[-1.2deg] p-2.5 transition-transform duration-500 ease-out motion-safe:hover:rotate-0">
      <div className="flex overflow-hidden rounded-xl border-2 border-ink/10">
        {/* Thanh bên mô phỏng */}
        <aside
          className="hidden w-44 shrink-0 flex-col gap-1 bg-coal p-4 md:flex"
          aria-hidden="true"
        >
          <div className="mb-4 px-1">
            <Logo inverse className="text-base" />
          </div>
          {SIDEBAR_ITEMS.map((item) => (
            <span
              key={item.label}
              className={
                item.active
                  ? "flex items-center gap-2.5 rounded-lg bg-royal px-3 py-2 text-xs font-semibold text-white"
                  : "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-white/55"
              }
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </span>
          ))}
        </aside>

        {/* Nội dung chính mô phỏng */}
        <div className="min-w-0 flex-1 bg-paper p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-base font-extrabold text-ink">
              Không gian thực tập của bạn
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-dashed border-blue/50 bg-blue-mist px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-blue">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue opacity-60 motion-reduce:animate-none" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue" />
              </span>
              Đang mở
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-ink-soft">
            Đăng nhập để xem dự án, Sprint và nhiệm vụ được phân công.
          </p>

          <div className="mt-5 space-y-3">
            {OVERVIEW_ITEMS.map((item, index) => (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-xl border-2 border-ink/10 bg-raised p-4 transition-colors hover:border-blue/50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-mist text-blue">
                  <item.icon className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <strong className="text-xs font-bold text-ink">
                    {item.title}
                  </strong>
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                    {item.text}
                  </p>
                </div>
                {index === 0 ? (
                  <SparkleDoodle className="ml-auto mt-0.5 h-4 w-4 shrink-0 text-blue/60" />
                ) : null}
              </div>
            ))}
          </div>

          <p className="mt-5 border-t-2 border-dashed border-ink/10 pt-3 font-hand text-[15px] text-ink-soft">
            giới thiệu các chức năng · dữ liệu cá nhân hiển thị sau đăng nhập
          </p>
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
      className="relative scroll-mt-20 overflow-hidden bg-paper"
    >
      {/* Nền giấy ô ly, mờ dần ở mép */}
      <div
        aria-hidden="true"
        className="mask-fade-edges pointer-events-none absolute inset-0 bg-grid-paper"
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-14 md:px-6 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,46fr)_minmax(0,54fr)] lg:gap-12">
          {/* Cột trái */}
          <FadeIn>
            <span className="inline-flex -rotate-1 items-center gap-2 rounded-full border-2 border-ink bg-raised px-4 py-1.5 text-xs font-bold text-ink shadow-[2px_2px_0_0_var(--hard-shadow)]">
              <Sparkles className="h-3.5 w-3.5 text-blue" aria-hidden="true" />
              Nền tảng thực tập ảo ứng dụng AI
            </span>

            <h1 className="mt-7 text-[42px] font-extrabold leading-[1.06] tracking-tight text-ink sm:text-5xl lg:text-[64px]">
              Kỹ năng thật.
              <br />
              Dự án thật.
              <br />
              <span className="relative inline-block">
                <span className="marker">Tương lai của bạn.</span>
                <StarDoodle className="absolute -right-9 -top-4 hidden h-7 w-7 animate-wiggle text-blue sm:block" />
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-soft md:text-lg">
              V-Intern mô phỏng môi trường làm việc thực tế, giúp sinh viên trải
              nghiệm quy trình phát triển phần mềm chuyên nghiệp với sự hỗ trợ
              của AI.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href="/login"
                className="group inline-flex h-[52px] items-center gap-2 rounded-xl border-2 border-ink bg-royal px-7 text-sm font-bold text-white shadow-[4px_4px_0_0_var(--ink)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-royal-deep hover:shadow-[6px_6px_0_0_var(--ink)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0_0_var(--ink)]"
              >
                Bắt đầu ngay
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </a>
              <a
                href="#how-it-works"
                className="inline-flex h-[52px] items-center rounded-xl border-2 border-ink bg-raised px-7 text-sm font-bold text-ink shadow-[4px_4px_0_0_var(--hard-shadow)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-blue hover:text-blue hover:shadow-[6px_6px_0_0_var(--hard-shadow)] active:translate-x-0 active:translate-y-0"
              >
                Tìm hiểu thêm
              </a>
            </div>

            {/* Ghi chú viết tay kèm mũi tên chỉ CTA */}
            <div className="mt-8 hidden items-start gap-1 sm:flex">
              <p className="-rotate-2 font-hand text-lg leading-tight text-blue">
                miễn phí cho sinh viên —
                <br />
                chỉ cần mang theo tinh thần học hỏi!
              </p>
              <HandArrowDown className="ml-1 mt-1 h-14 w-10 rotate-[24deg] text-blue/80" />
            </div>
          </FadeIn>

          {/* Cột phải — tấm polaroid workspace */}
          <FadeIn
            className="relative mx-auto w-full max-w-[620px] lg:max-w-none"
            delay={0.15}
          >
            <div className="group relative px-1 pt-4">
              <Tape className="-top-1 left-8 z-20" rotate={-8} peel />
              <Tape className="-top-1 right-10 z-20" rotate={7} peel />
              <DashboardPolaroid />
            </div>

            {/* Sticky note "Đánh giá AI" — giấy note vàng dán lệch */}
            <div className="sticky-note absolute -top-3 right-0 z-20 hidden w-[228px] animate-float-soft items-start gap-3 rounded-lg p-3.5 sm:-top-6 sm:flex md:-right-3 md:-top-24">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-raised text-blue">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-extrabold">Đánh giá AI</p>
                <p className="mt-0.5 text-[11px] leading-snug text-(--note-ink-soft)">
                  Gợi ý tham khảo theo công việc
                </p>
                <p className="mt-1 font-hand text-[15px] leading-none text-(--note-blue)">
                  giảng viên chốt điểm chính thức
                </p>
              </div>
            </div>

            {/* Robot linh vật + bong bóng chat */}
            <div className="absolute -bottom-3 left-0 z-20 hidden animate-float items-end gap-2 [--float-rotate:0deg] md:flex md:-left-6">
              <div className="sketch-card-sm rotate-[2deg] overflow-hidden bg-raised p-1">
                <Image
                  src="/images/landing/robot-mascot.png"
                  alt="Robot linh vật của V-Intern đang vẫy tay chào"
                  width={1024}
                  height={1024}
                  className="h-32 w-auto lg:h-36"
                  priority
                />
              </div>
              <span className="mb-11 -rotate-2 rounded-2xl rounded-bl-sm border-2 border-ink bg-raised px-4 py-2.5 font-hand text-[17px] leading-tight text-blue shadow-[3px_3px_0_0_var(--hard-shadow)]">
                Cùng xây dựng tương lai nhé!
              </span>
            </div>
          </FadeIn>
        </div>

        {/* Dải tính năng */}
        <FadeIn className="mt-24 lg:mt-28" delay={0.1}>
          <FeatureStrip />
        </FadeIn>
      </div>
    </section>
  );
}
