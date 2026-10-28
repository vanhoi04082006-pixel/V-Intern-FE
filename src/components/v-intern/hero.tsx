"use client";

import Image from "next/image";
import Link from "next/link";
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

const SIDEBAR_ITEMS = [
  { label: "Bảng điều khiển", icon: LayoutDashboard, active: true },
  { label: "Nhiệm vụ của tôi", icon: ListTodo, active: false },
  { label: "Sprint", icon: CalendarDays, active: false },
  { label: "Dự án", icon: FolderKanban, active: false },
  { label: "AI Mentor", icon: Bot, active: false },
  { label: "Hiệu suất", icon: TrendingUp, active: false },
  { label: "Cài đặt", icon: Settings, active: false },
];

function DashboardOverview() {
  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-2xl shadow-blue-900/10 ring-1 ring-border/60">
      <div className="flex">
        <aside
          className="hidden w-44 shrink-0 flex-col gap-1 bg-navy p-4 md:flex"
          aria-hidden="true"
        >
          <div className="mb-4 px-1">
            <Logo inverse className="text-sm" />
          </div>
          {SIDEBAR_ITEMS.map((item) => (
            <span
              key={item.label}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground"
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </span>
          ))}
        </aside>
        <div className="min-w-0 flex-1 bg-canvas p-5">
          <p className="text-base font-bold text-navy">
            Không gian thực tập của bạn
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Đăng nhập để xem dự án, Sprint và nhiệm vụ được phân công.
          </p>
          <div className="mt-5 space-y-3">
            {[
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
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-xl border border-border/80 bg-card p-4"
              >
                <item.icon className="h-5 w-5 shrink-0 text-brand" />
                <div>
                  <strong className="text-xs text-navy">{item.title}</strong>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            Giới thiệu các chức năng · dữ liệu cá nhân hiển thị sau đăng nhập
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
      className="relative overflow-hidden bg-canvas scroll-mt-20"
    >
      {/* Soft radial gradient blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-[-10%] h-[480px] w-[480px] rounded-full bg-brand/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-20%] left-[-8%] h-[420px] w-[420px] rounded-full bg-indigo-200/40 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8 lg:py-24">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)] lg:gap-12">
          {/* Left column */}
          <FadeIn>
            <span className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-brand-600">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Nền tảng thực tập ảo ứng dụng AI
            </span>

            <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-navy sm:text-5xl lg:text-6xl">
              Kỹ năng thật.
              <br />
              Dự án thật.
              <br />
              <span className="text-brand">Tương lai của bạn.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              V-Intern mô phỏng môi trường làm việc thực tế, giúp sinh viên trải
              nghiệm quy trình phát triển phần mềm chuyên nghiệp với sự hỗ trợ
              của AI.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/login"
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-brand px-6 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition-colors hover:bg-brand-600"
              >
                Bắt đầu ngay
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex h-12 items-center rounded-lg border border-border bg-card px-6 text-sm font-semibold text-foreground transition-colors hover:border-brand/60 hover:text-brand"
              >
                Tìm hiểu thêm
              </a>
            </div>
          </FadeIn>

          {/* Right column — dashboard mockup */}
          <FadeIn
            className="relative mx-auto w-full max-w-[600px] lg:max-w-none"
            delay={0.15}
          >
            <div className="lg:px-4 lg:py-2">
              <DashboardOverview />
            </div>

            {/* Floating card: Đánh giá AI — nhích lên trên để không che dòng chào */}
            <div className="absolute -top-6 right-0 hidden animate-float items-center gap-3 rounded-2xl bg-card p-3.5 shadow-xl shadow-blue-900/10 ring-1 ring-border/60 sm:flex md:-top-16 md:-right-2">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100">
                <Sparkles
                  className="h-5 w-5 text-violet-600"
                  aria-hidden="true"
                />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-navy">Đánh giá AI</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  Gợi ý tham khảo theo công việc
                </p>
                <p className="text-[11px] font-bold text-brand">
                  Giảng viên chốt điểm chính thức
                </p>
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
              <span className="mb-10 rounded-2xl rounded-bl-md bg-card px-4 py-2.5 text-xs font-semibold text-brand shadow-lg shadow-blue-900/10 ring-1 ring-border/60">
                Cùng xây dựng tương lai nhé!
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
