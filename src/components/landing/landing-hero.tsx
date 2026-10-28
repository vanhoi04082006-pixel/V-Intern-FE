"use client";

import * as React from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Award,
  BadgeCheck,
  Bot,
  KanbanSquare,
  LayoutDashboard,
  MessageSquare,
  ScanSearch,
  Sparkles,
  Star,
  Wallet,
} from "lucide-react";
import { navigate } from "@/lib/client/router";
import { FadeIn } from "@/components/shared/view";
import { AnimatedNumber } from "@/components/shared/counters";
import { AvatarStack, StatusDot } from "@/components/shared/primitives";
import { LogoMark } from "@/components/shared/logo";
import { cn } from "@/lib/utils";
import { CtaPrimary } from "./landing-ui";

/* ============================== Stats ============================== */

const HERO_STATS = [
  { render: <AnimatedNumber value={1250} suffix="+" className="font-mono" />, label: "sinh viên tham gia" },
  { render: <AnimatedNumber value={38} className="font-mono" />, label: "dự án thật" },
  { render: <AnimatedNumber value={92} suffix="%" className="font-mono" />, label: "hoàn thành chứng chỉ" },
  { render: <AnimatedNumber value={4.9} decimals={1} className="font-mono" />, label: "đánh giá trung bình", star: true },
];

/* ======================== Mockup dashboard ======================== */

type MockStatus = "todo" | "doing" | "review";

interface MockTask {
  id: string;
  code: string;
  title: string;
  priority: "low" | "medium" | "high" | "critical";
  status: MockStatus;
}

const INITIAL_TASKS: MockTask[] = [
  { id: "t1", code: "TSK-01", title: "Trang danh sách sản phẩm", priority: "high", status: "doing" },
  { id: "t2", code: "TSK-02", title: "API giỏ hàng", priority: "critical", status: "todo" },
  { id: "t3", code: "TSK-03", title: "Skeleton loading", priority: "low", status: "todo" },
  { id: "t4", code: "TSK-04", title: "Fix leak useEffect", priority: "medium", status: "review" },
  { id: "t5", code: "TSK-05", title: "Thanh toán VNPAY", priority: "high", status: "doing" },
  { id: "t6", code: "TSK-06", title: "Dashboard KPI", priority: "medium", status: "todo" },
];

const COLUMNS: { id: MockStatus; label: string; tone: "zinc" | "teal" | "amber" }[] = [
  { id: "todo", label: "Cần làm", tone: "zinc" },
  { id: "doing", label: "Đang làm", tone: "teal" },
  { id: "review", label: "Chờ duyệt", tone: "amber" },
];

const PRIORITY_BAR: Record<MockTask["priority"], string> = {
  low: "bg-zinc-400",
  medium: "bg-teal",
  high: "bg-orange",
  critical: "bg-rose",
};

const STATUS_ORDER: MockStatus[] = ["todo", "doing", "review"];

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Tổng quan", active: true },
  { icon: KanbanSquare, label: "Công việc", active: false },
  { icon: MessageSquare, label: "Mentor AI", active: false },
  { icon: Award, label: "Chứng chỉ", active: false },
];

const RUBRIC = [
  { label: "Chuẩn code", pct: 92, cls: "bg-brand" },
  { label: "Bảo mật", pct: 84, cls: "bg-teal" },
  { label: "Hiệu năng", pct: 78, cls: "bg-amber" },
];

function DashboardMockup() {
  const reduce = useReducedMotion();
  const [tasks, setTasks] = React.useState<MockTask[]>(INITIAL_TASKS);
  const [showToast, setShowToast] = React.useState(true);
  const tickRef = React.useRef(0);

  // Đảo trạng thái task mỗi 2.5s cho Kanban "sống"
  React.useEffect(() => {
    if (reduce) return;
    const timer = setInterval(() => {
      const i = tickRef.current % INITIAL_TASKS.length;
      tickRef.current += 1;
      setTasks((prev) => {
        const next = [...prev];
        const cur = STATUS_ORDER.indexOf(next[i].status);
        next[i] = { ...next[i], status: STATUS_ORDER[(cur + 1) % STATUS_ORDER.length] };
        return next;
      });
    }, 2500);
    return () => clearInterval(timer);
  }, [reduce]);

  // Toast lương ảo nhấp nháy
  React.useEffect(() => {
    if (reduce) return;
    const timer = setInterval(() => setShowToast((v) => !v), 4200);
    return () => clearInterval(timer);
  }, [reduce]);

  return (
    <div className="dark relative">
      {/* Scope .dark: mockup luôn là "feature card tối" ở cả 2 theme */}
      {/* Hào quang hero-orb phía dưới mockup */}
      <Image
        src="/images/hero-orb.png"
        alt=""
        aria-hidden
        priority
        width={640}
        height={640}
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 w-[560px] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-35 [mask-image:radial-gradient(closest-side,black_38%,transparent_78%)]"
      />

      <div className="glass glow-brand relative z-10 flex overflow-hidden rounded-3xl border border-line text-left">
        {/* Sidebar giả */}
        <aside className="hidden w-40 shrink-0 flex-col gap-1 border-r border-line bg-deep/70 p-3 md:flex">
          <div className="mb-2 flex items-center gap-2 px-1 py-1">
            <LogoMark size={18} />
            <span className="text-xs font-bold tracking-tight text-ink">V-Intern</span>
          </div>
          {SIDEBAR_ITEMS.map((item) => (
            <span
              key={item.label}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[11px] font-medium",
                item.active ? "bg-brand/12 text-brand-bright" : "text-dim"
              )}
            >
              <item.icon className="size-3.5 icon" />
              {item.label}
            </span>
          ))}
          <span className="mt-auto flex items-center gap-2 rounded-lg border border-line bg-panel/70 px-2.5 py-2">
            <AvatarStack names={["An Nguyễn"]} size={18} />
            <span className="truncate text-[10px] font-medium text-dim">An Nguyễn</span>
            <StatusDot tone="emerald" className="ml-auto" />
          </span>
        </aside>

        {/* Khu nội dung */}
        <div className="relative min-w-0 flex-1 p-3.5 sm:p-4">
          {/* Toast lương ảo */}
          <AnimatePresence>
            {showToast ? (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.35, ease: [0.21, 1.02, 0.73, 1] }}
                className="absolute right-3 top-12 z-20 flex items-center gap-2.5 rounded-xl border border-brand/30 bg-deep/95 px-3 py-2 shadow-[0_12px_44px_rgba(16,185,129,0.28)] backdrop-blur sm:right-4"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand/15 text-brand-bright">
                  <Wallet className="size-3.5 icon" />
                </span>
                <span className="leading-tight">
                  <span className="block font-mono text-xs font-bold text-brand-bright">
                    +480.000 ₫
                  </span>
                  <span className="block text-[10px] text-dim">Lương ảo · Sprint 2</span>
                </span>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Topbar giả */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="grid size-6 shrink-0 place-items-center rounded-md bg-brand/12 text-brand-bright">
                <KanbanSquare className="size-3 icon" />
              </span>
              <span className="truncate text-[11px] font-semibold text-ink">
                Sprint 2 · Website TMĐT
              </span>
              <span className="hidden rounded-full border border-line bg-panel-2 px-2 py-0.5 font-mono text-[10px] text-dim sm:inline">
                62%
              </span>
            </div>
            <AvatarStack names={["An Nguyễn", "Bình Trần", "Hằng Lê"]} size={20} />
          </div>

          {/* Kanban 3 cột */}
          <div className="mt-3.5 grid grid-cols-3 gap-2 sm:gap-2.5">
            {COLUMNS.map((col) => {
              const items = tasks.filter((t) => t.status === col.id);
              return (
                <div key={col.id} className="min-w-0 rounded-xl border border-line bg-deep/50 p-2">
                  <div className="mb-2 flex items-center gap-1.5 px-0.5">
                    <StatusDot tone={col.tone} />
                    <span className="truncate text-[10px] font-semibold text-dim">{col.label}</span>
                    <span className="ml-auto font-mono text-[10px] text-faint">{items.length}</span>
                  </div>
                  <div className="flex min-h-[132px] flex-col gap-1.5">
                    {items.map((task) => (
                      <motion.div
                        key={task.id}
                        layoutId={`mock-task-${task.id}`}
                        layout
                        transition={{ type: "spring", stiffness: 340, damping: 30 }}
                        className="rounded-lg border border-line bg-panel-2 px-2 py-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.25)]"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={cn("h-3 w-0.5 rounded-full", PRIORITY_BAR[task.priority])} />
                          <span className="font-mono text-[9px] text-faint">{task.code}</span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-[10px] font-medium leading-snug text-ink">
                          {task.title}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Thẻ AI Code Review */}
          <div className="mt-3 rounded-xl border border-brand/20 bg-brand/[0.06] p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <ScanSearch className="size-3.5 icon shrink-0 text-brand-bright" />
                <span className="text-[11px] font-semibold text-ink">AI Code Review</span>
              </span>
              <span className="font-mono text-sm font-bold text-brand-bright">
                87<span className="text-[10px] font-medium text-faint">/100</span>
              </span>
            </div>
            <div className="mt-2.5 space-y-1.5">
              {RUBRIC.map((r) => (
                <span key={r.label} className="flex items-center gap-2">
                  <span className="w-14 shrink-0 text-[9px] text-faint">{r.label}</span>
                  <span className="h-1 flex-1 overflow-hidden rounded-full bg-track">
                    <span className={cn("block h-full rounded-full", r.cls)} style={{ width: `${r.pct}%` }} />
                  </span>
                  <span className="w-6 text-right font-mono text-[9px] text-dim">{r.pct}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Badge nổi quanh mockup */}
      <div className="absolute -left-3 top-20 z-20 hidden animate-float items-center gap-2 rounded-xl border border-line bg-deep/90 px-3 py-2 shadow-[0_10px_36px_rgba(0,0,0,0.45)] backdrop-blur sm:flex lg:-left-8">
        <span className="grid size-6 place-items-center rounded-md bg-teal/10 text-teal">
          <Bot className="size-3.5 icon" />
        </span>
        <span className="whitespace-nowrap text-[11px] font-medium text-ink">Phỏng vấn AI · 12 phút</span>
      </div>
      <div className="absolute -right-3 top-44 z-20 hidden animate-float items-center gap-2 rounded-xl border border-line bg-deep/90 px-3 py-2 shadow-[0_10px_36px_rgba(0,0,0,0.45)] backdrop-blur [animation-delay:-2s] sm:flex lg:-right-6">
        <span className="grid size-6 place-items-center rounded-md bg-brand/10 text-brand-bright">
          <KanbanSquare className="size-3.5 icon" />
        </span>
        <span className="whitespace-nowrap text-[11px] font-medium text-ink">Sprint 2 · 62%</span>
      </div>
      <div className="absolute -bottom-5 left-10 z-20 flex animate-float items-center gap-2 rounded-xl border border-line bg-deep/90 px-3 py-2 shadow-[0_10px_36px_rgba(0,0,0,0.45)] backdrop-blur [animation-delay:-4s]">
        <span className="grid size-6 place-items-center rounded-md bg-amber/10 text-amber">
          <BadgeCheck className="size-3.5 icon" />
        </span>
        <span className="whitespace-nowrap text-[11px] font-medium text-ink">Chứng chỉ đã xác thực</span>
      </div>
    </div>
  );
}

/* ================================ Hero ================================ */

export function LandingHero() {
  return (
    <section className="noise relative overflow-hidden">
      {/* Nền: grid + aurora orbs */}
      <div className="grid-bg mask-fade-b absolute inset-0" aria-hidden />
      <div
        className="absolute -left-28 -top-32 size-[480px] rounded-full bg-brand/20 blur-[120px] animate-aurora"
        aria-hidden
      />
      <div
        className="absolute -right-28 top-24 size-[440px] rounded-full bg-teal/20 blur-[120px] animate-aurora [animation-delay:-8s]"
        aria-hidden
      />

      <div className="relative mx-auto grid w-full max-w-7xl gap-14 px-4 pb-16 pt-14 sm:px-6 md:pt-20 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-10 lg:pb-24">
        {/* Cột trái */}
        <div className="min-w-0">
          <FadeIn y={16}>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/[0.07] px-3.5 py-1.5 text-xs font-medium text-brand-bright">
              <Sparkles className="size-3.5 icon" />
              Nền tảng thực tập ảo với AI
            </span>
          </FadeIn>

          <FadeIn delay={0.08} y={20}>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl xl:text-6xl">
              Thực tập như <span className="text-gradient">đi làm thật</span> — AI làm đồng nghiệp
              của bạn
            </h1>
          </FadeIn>

          <FadeIn delay={0.16} y={20}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-dim">
              V-Intern mô phỏng trọn vẹn môi trường làm việc phần mềm: phỏng vấn AI xếp đội,
              sprint &amp; Kanban thật, AI review code từng dòng, KPI minh bạch và chứng chỉ số
              tra cứu công khai.
            </p>
          </FadeIn>

          <FadeIn delay={0.24} y={20}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <CtaPrimary to="/register">Đăng ký miễn phí</CtaPrimary>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="group inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-panel px-6 text-sm font-medium text-ink transition-all hover:border-line-strong hover:bg-panel-2 active:scale-[0.98]"
              >
                Xem demo
                <span className="inline-flex items-center gap-1.5 rounded-md bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand-bright">
                  tài khoản mẫu
                </span>
              </button>
            </div>
          </FadeIn>

          <FadeIn delay={0.32} y={20}>
            <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-7 border-t border-line pt-7 sm:grid-cols-4 lg:gap-x-4">
              {HERO_STATS.map((stat) => (
                <div key={stat.label} className="min-w-0">
                  <p className="flex items-center gap-1.5 text-2xl font-bold tracking-tight text-ink">
                    {stat.render}
                    {stat.star ? <Star className="size-4 fill-amber text-amber icon" aria-label="sao" /> : null}
                  </p>
                  <p className="mt-1.5 text-xs leading-snug text-dim">{stat.label}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>

        {/* Cột phải: mockup dashboard */}
        <FadeIn delay={0.2} y={32} className="relative mx-auto w-full max-w-xl lg:max-w-none">
          <DashboardMockup />
        </FadeIn>
      </div>
    </section>
  );
}
