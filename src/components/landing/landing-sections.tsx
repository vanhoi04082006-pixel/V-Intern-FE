"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  BarChart3,
  Bot,
  Check,
  ChevronDown,
  Code2,
  GraduationCap,
  Info,
  KanbanSquare,
  Presentation,
  Rocket,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Users,
  CircleCheck,
} from "lucide-react";
import { navigate } from "@/lib/client/router";
import { FadeIn } from "@/components/shared/view";
import { ChatBubble, TypingDots } from "@/components/shared/chat";
import { StatusDot } from "@/components/shared/primitives";
import { cn } from "@/lib/utils";
import { CtaGhost, CtaPrimary, LandingHeading, SectionShell } from "./landing-ui";

/* ============================ 3. Trust band ============================ */

const PARTNERS = [
  "ĐH Bách Khoa Hà Nội",
  "ĐH FPT",
  "ĐH Công nghệ — ĐHQGHN",
  "ĐH Kinh tế Quốc dân",
  "NEU",
  "UIT — ĐHQG TP.HCM",
  "HUST",
  "ĐH Sư phạm Kỹ thuật TP.HCM",
  "ĐH Ngoại thương",
  "ĐH Thủy lợi",
];

export function TrustBand() {
  return (
    <section className="relative border-y border-line bg-deep/40 py-9">
      <p className="mb-6 px-4 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-faint">
        Sinh viên đến từ các trường đại học
      </p>
      <div className="group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_14%,black_86%,transparent)]">
        <div className="animate-marquee flex w-max group-hover:[animation-play-state:paused]">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 gap-14 pr-14" aria-hidden={copy === 1}>
              {PARTNERS.map((name) => (
                <span
                  key={name}
                  className="whitespace-nowrap text-lg font-semibold tracking-tight text-faint transition-colors duration-300 hover:text-ink"
                >
                  {name}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========================== 4. Quy trình 4 bước ========================== */

const STEPS = [
  {
    num: "01",
    icon: Bot,
    title: "Đăng ký & phỏng vấn AI",
    desc: "AI đánh giá năng lực trong 15 phút qua chat — biết ngay điểm mạnh và điểm cần cải thiện.",
  },
  {
    num: "02",
    icon: Users,
    title: "Nhận dự án & vai trò",
    desc: "Được match vào team theo điểm mạnh: Frontend, Backend, QA hoặc Business Analyst.",
  },
  {
    num: "03",
    icon: Rocket,
    title: "Làm việc theo Sprint",
    desc: "Kanban, pull request, AI review code — mọi quy trình như một công ty phần mềm thật.",
  },
  {
    num: "04",
    icon: Award,
    title: "Đánh giá & nhận chứng chỉ",
    desc: "KPI minh bạch, lương ảo theo đóng góp và chứng chỉ số tra cứu công khai.",
  },
];

export function HowItWorks() {
  return (
    <SectionShell id="how">
      <LandingHeading
        eyebrow="Quy trình"
        title={
          <>
            Từ phỏng vấn đến chứng chỉ,{" "}
            <span className="text-gradient">chỉ 4 bước</span>
          </>
        }
        sub="Không bài giảng dài dòng — bạn vào dự án thật ngay sau buổi phỏng vấn đầu tiên."
      />

      <div className="relative mt-14">
        {/* Đường nối gradient giữa các bước */}
        <div
          className="absolute left-[12.5%] right-[12.5%] top-[46px] hidden h-px bg-gradient-to-r from-brand/5 via-brand/40 to-brand/5 lg:block"
          aria-hidden
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <FadeIn key={step.num} delay={i * 0.08}>
              <div className="card-surface group relative h-full p-6 transition-all duration-300 hover:border-line-strong hover:bg-panel-2">
                <div className="flex items-start justify-between gap-3">
                  <span className="font-mono text-4xl font-bold leading-none text-gradient">
                    {step.num}
                  </span>
                  <span className="grid size-11 shrink-0 place-items-center rounded-full border border-brand/25 bg-brand/10 text-brand-bright transition-transform duration-300 group-hover:scale-110">
                    <step.icon className="size-5 icon" />
                  </span>
                </div>
                <h3 className="mt-5 text-[15px] font-semibold tracking-tight text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-dim">{step.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* Ảnh phỏng vấn AI + caption chat */}
      <div className="mt-16 grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <FadeIn className="dark relative">
          {/* Scope .dark: card chứa ảnh nền tối — giữ surface tối ở cả 2 theme */}
          <div className="card-surface rotate-[-1.5deg] p-2 transition-transform duration-500 ease-out hover:rotate-0">
            <Image
              src="/images/ai-interview.png"
              alt="Giao diện buổi phỏng vấn AI trên V-Intern"
              width={1344}
              height={768}
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="w-full rounded-xl"
              priority={false}
            />
          </div>
          <span className="absolute -bottom-3 left-6 inline-flex items-center gap-2 rounded-full border border-line bg-deep/90 px-3 py-1.5 text-[11px] font-medium text-dim backdrop-blur">
            <StatusDot tone="teal" pulse />
            Buổi phỏng vấn AI tiêu biểu
          </span>
        </FadeIn>

        <FadeIn delay={0.12}>
          <div className="space-y-4">
            <div className="space-y-4">
              <ChatBubble role="assistant" time="14:02">
                Chào An, tôi là người phỏng vấn AI của V-Intern. Buổi hôm nay gồm 5 câu hỏi về
                React và tư duy giải quyết vấn đề — sẵn sàng chứ?
              </ChatBubble>
              <ChatBubble role="user" name="An Nguyễn" time="14:02">
                Sẵn sàng ạ, em bắt đầu được ngay.
              </ChatBubble>
              <TypingDots label="AI đang chọn câu hỏi tiếp theo…" />
            </div>
            <p className="pl-1 text-xs leading-relaxed text-faint">
              Câu hỏi thích ứng theo từng câu trả lời — càng trả lời tốt, thử thách càng thật.
            </p>
          </div>
        </FadeIn>
      </div>
    </SectionShell>
  );
}

/* ========================== 5. Bento features ========================== */

const BENTO_SMALL = [
  {
    icon: Bot,
    title: "Phỏng vấn AI thông minh",
    desc: "Bộ câu hỏi thích ứng do AI điều phối — 15 phút định vị đúng trình độ và vị trí phù hợp.",
    span: "lg:col-span-5",
  },
  {
    icon: Code2,
    title: "AI Code Review 6 tiêu chí",
    desc: "Mỗi pull request được chấm điểm kèm nhận xét chi tiết và gợi ý sửa cụ thể từng dòng.",
    span: "lg:col-span-5",
  },
  {
    icon: Sparkles,
    title: "Mentor AI 24/7",
    desc: "Cố vấn kỹ thuật luôn trực — hỏi bất cứ lúc nào, có câu trả lời kèm ví dụ code.",
    span: "lg:col-span-4",
  },
  {
    icon: BarChart3,
    title: "KPI & lương ảo minh bạch",
    desc: "Điểm số và thu nhập mô phỏng tính theo đóng góp thật — nhìn thấy từng đồng bạn kiếm được.",
    span: "lg:col-span-4",
  },
  {
    icon: ShieldCheck,
    title: "Chứng chỉ tra cứu công khai",
    desc: "Mỗi chứng chỉ có mã riêng — nhà tuyển dụng xác thực trong một cú click.",
    span: "lg:col-span-4",
  },
];

export function FeaturesBento() {
  return (
    <SectionShell id="features">
      <LandingHeading
        eyebrow="Tính năng"
        title={
          <>
            Mọi thứ một <span className="text-gradient">môi trường thực tập thật</span>
          </>
        }
        sub="Không phải mô phỏng bằng bài tập giả — đây là quy trình sản xuất phần mềm thật, thu nhỏ về đúng tầm cho sinh viên."
      />

      <div className="mt-14 grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-12">
        {/* Card lớn */}
        <FadeIn className="md:col-span-2 lg:col-span-7 lg:row-span-2">
          {/* Scope .dark: feature-showcase.png có nền tối — card tối nổi bật trên trang sáng */}
          <div className="card-surface dark group relative min-h-[280px] overflow-hidden md:min-h-[340px] lg:h-full lg:min-h-0">
            <Image
              src="/images/feature-showcase.png"
              alt="Bảng Kanban dự án và quy trình làm việc trên V-Intern"
              fill
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-canvas/95 via-canvas/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand-bright backdrop-blur">
                <KanbanSquare className="size-3 icon" />
                Trái tim sản phẩm
              </span>
              <h3 className="mt-3 text-xl font-bold tracking-tight text-ink md:text-2xl">
                Sản phẩm mô phỏng toàn diện
              </h3>
              <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-dim">
                Sprint 2 tuần, story point, pull request, đánh giá đồng nghiệp — cả một vòng đời
                sản phẩm phần mại được tái hiện trọn vẹn.
              </p>
            </div>
          </div>
        </FadeIn>

        {/* 5 card nhỏ */}
        {BENTO_SMALL.map((card, i) => (
          <FadeIn key={card.title} delay={0.06 * (i + 1)} className={card.span}>
            <div className="card-surface group h-full p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:bg-panel-2">
              <span className="grid size-10 place-items-center rounded-lg bg-brand/10 text-brand-bright transition-transform duration-300 group-hover:scale-110">
                <card.icon className="size-5 icon" />
              </span>
              <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-ink">
                {card.title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-dim">{card.desc}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </SectionShell>
  );
}

/* ============================ 6. AI showcase ============================ */

const RING_RADIUS = 52;
const RING_CIRC = 2 * Math.PI * RING_RADIUS;

const FINDINGS = [
  {
    icon: TriangleAlert,
    tone: "bg-amber/10 text-amber",
    file: "board.tsx",
    line: 42,
    desc: "Thiếu dependency projectId trong useEffect — nên đưa vào danh sách deps.",
  },
  {
    icon: Info,
    tone: "bg-teal/10 text-teal",
    file: "api-client.ts",
    line: 18,
    desc: "Nên cache response để tránh gọi lặp khi chuyển tab nhanh.",
  },
  {
    icon: CircleCheck,
    tone: "bg-brand/10 text-brand-bright",
    file: "auth-guard.tsx",
    line: 7,
    desc: "Không phát hiện rủi ro bảo mật — xử lý token đúng chuẩn.",
  },
];

function CodeInline({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md border border-line bg-deep px-1.5 py-0.5 font-mono text-[12px] text-brand-bright">
      {children}
    </code>
  );
}

export function AiShowcase() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div
        className="dot-bg absolute inset-0 opacity-70 [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6">
        <LandingHeading
          eyebrow="Trải nghiệm AI"
          title={
            <>
              AI ở mọi khâu — từ <span className="text-gradient">phỏng vấn đến review code</span>
            </>
          }
          sub="Hai trợ lý được sinh viên dùng nhiều nhất, nguyên trạng thái thật trong sản phẩm."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {/* Mentor AI chat */}
          <FadeIn>
            <div className="card-surface flex h-full flex-col p-5 md:p-6">
              <div className="mb-5 flex items-center justify-between gap-3 border-b border-line pb-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-lg border border-brand/25 bg-brand/10 text-brand-bright">
                    <Sparkles className="size-4 icon" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">Mentor AI</p>
                    <p className="text-[11px] text-faint">Cố vấn kỹ thuật cá nhân</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-line bg-deep px-2.5 py-1 text-[11px] font-medium text-dim">
                  <StatusDot tone="emerald" pulse />
                  Trực 24/7
                </span>
              </div>
              <div className="flex-1 space-y-4">
                <ChatBubble role="user" name="An Nguyễn" time="21:14">
                  Em bị lỗi <CodeInline>useEffect</CodeInline> chạy 2 lần, tìm mãi không ra
                  nguyên nhân ạ.
                </ChatBubble>
                <ChatBubble role="assistant" time="21:14">
                  Ở môi trường dev, <CodeInline>StrictMode</CodeInline> cố ý gọi effect hai lần
                  để phát hiện side-effect ẩn. Thử thêm cleanup nhé:{" "}
                  <CodeInline>return () =&gt; controller.abort()</CodeInline> — nếu log hết chạy
                  2 lần thì code của em đã sạch.
                </ChatBubble>
                <TypingDots label="Mentor AI đang soạn…" />
              </div>
            </div>
          </FadeIn>

          {/* AI Code Review */}
          <FadeIn delay={0.1}>
            <div className="card-surface flex h-full flex-col p-5 md:p-6">
              <div className="mb-5 flex items-center justify-between gap-3 border-b border-line pb-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-lg border border-brand/25 bg-brand/10 text-brand-bright">
                    <ScanSearch className="size-4 icon" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">AI Code Review</p>
                    <p className="text-[11px] text-faint">Đề xuất điểm theo 6 tiêu chí</p>
                  </div>
                </div>
                <span className="rounded-full border border-line bg-deep px-2.5 py-1 font-mono text-[11px] font-semibold text-dim">
                  PR #48
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div className="relative mx-auto shrink-0">
                  <svg viewBox="0 0 120 120" className="size-[120px]" role="img" aria-label="Điểm review 87 trên 100">
                    <circle cx="60" cy="60" r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" className="stroke-track" />
                    <motion.circle
                      cx="60"
                      cy="60"
                      r={RING_RADIUS}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="9"
                      strokeLinecap="round"
                      strokeDasharray={RING_CIRC}
                      initial={{ strokeDashoffset: RING_CIRC }}
                      whileInView={{ strokeDashoffset: RING_CIRC * (1 - 0.87) }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.1, ease: [0.21, 1.02, 0.73, 1] }}
                      transform="rotate(-90 60 60)"
                      style={{ stroke: "var(--brand)" }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-mono text-[28px] font-bold leading-none text-ink">87</span>
                    <span className="mt-1 text-[10px] font-medium text-faint">/ 100 điểm</span>
                  </span>
                </div>
                <div className="min-w-[180px] flex-1">
                  <p className="text-sm font-semibold text-ink">Đạt ngưỡng duyệt</p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-dim">
                    Vượt mốc 80 điểm để merge. Điểm trên là{" "}
                    <span className="font-medium text-ink">đề xuất</span> — giảng viên chốt
                    quyết định cuối.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex-1 space-y-2.5">
                {FINDINGS.map((f) => (
                  <div key={f.file} className="flex items-start gap-3 rounded-xl border border-line bg-deep/50 p-3">
                    <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg", f.tone)}>
                      <f.icon className="size-3.5 icon" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] text-faint">
                        {f.file} · dòng {f.line}
                      </p>
                      <p className="mt-0.5 text-[13px] leading-snug text-dim">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

/* ============================= 7. Đối tượng ============================= */

const ROLES = [
  {
    icon: GraduationCap,
    role: "Sinh viên",
    tagline: "Trải nghiệm việc làm thật trước khi ra trường.",
    email: "an.nguyen@student.edu.vn",
    benefits: [
      "Dự án & sprint như công ty thật",
      "Mentor AI hỗ trợ mọi lúc, mọi nơi",
      "KPI và lương ảo minh bạch",
      "Chứng chỉ số tra cứu công khai",
      "Portfolio dự án thật khi xin việc",
    ],
  },
  {
    icon: Presentation,
    role: "Giảng viên",
    tagline: "Dẫn dắt lớp thực tập bằng dữ liệu.",
    email: "hong.le@gv.edu.vn",
    benefits: [
      "Giao việc & theo dõi tiến độ tự động",
      "Ngân hàng dự án theo học phần",
      "AI đề xuất điểm đánh giá từng sinh viên",
      "Báo cáo lớp trực quan từng tuần",
    ],
  },
  {
    icon: ShieldCheck,
    role: "Quản trị viên",
    tagline: "Vận hành toàn bộ nền tảng.",
    email: "admin@vintern.edu.vn",
    benefits: [
      "Quản lý người dùng, vai trò, kỳ thực tập",
      "Ngân hàng câu hỏi phỏng vấn AI",
      "Giám sát toàn bộ hoạt động AI",
      "Cấu hình KPI & chính sách chứng chỉ",
    ],
  },
];

export function RolesSection() {
  return (
    <SectionShell id="roles">
      <LandingHeading
        eyebrow="Đối tượng"
        title={
          <>
            Một nền tảng — <span className="text-gradient">ba vai trò</span>
          </>
        }
        sub="Mỗi vai trò có không gian làm việc riêng, demo sẵn dữ liệu để khám phá ngay."
      />

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {ROLES.map((r, i) => (
          <FadeIn key={r.role} delay={i * 0.08} className="h-full">
            <div className="card-surface flex h-full flex-col p-6 transition-all duration-300 hover:border-line-strong">
              <div className="flex items-center gap-3.5">
                <span className="grid size-11 place-items-center rounded-xl bg-brand/10 text-brand-bright">
                  <r.icon className="size-5 icon" />
                </span>
                <div>
                  <h3 className="text-base font-bold tracking-tight text-ink">{r.role}</h3>
                  <p className="text-xs text-dim">{r.tagline}</p>
                </div>
              </div>
              <ul className="mt-5 flex-1 space-y-2.5">
                {r.benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-[13px] leading-snug text-dim">
                    <Check className="mt-0.5 size-4 shrink-0 icon text-brand-bright" />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t border-line pt-5">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-line bg-deep/60 text-sm font-medium text-ink transition-all hover:border-brand/40 hover:bg-panel-2 active:scale-[0.98]"
                >
                  Đăng nhập thử nghiệm
                </button>
                <p className="mt-2 truncate text-center font-mono text-[10px] text-faint">
                  {r.email}
                </p>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </SectionShell>
  );
}

/* ============================== FAQ ============================== */

const FAQS = [
  {
    q: "V-Intern có miễn phí không?",
    a: "Có. Đây là nền tảng giáo dục demo — toàn bộ trải nghiệm thực tập, AI review code và chứng chỉ đều miễn phí với tài khoản sinh viên.",
  },
  {
    q: "Buổi phỏng vấn AI diễn ra thế nào?",
    a: "Khoảng 15 phút qua giao diện chat: AI đặt câu hỏi thích ứng theo trình độ của bạn. Kết thúc buổi phỏng vấn, bạn nhận báo cáo điểm mạnh — điểm yếu và vị trí phù hợp nhất trong team.",
  },
  {
    q: "AI review code có chính xác không?",
    a: "AI chấm theo 6 tiêu chí cố định: chuẩn code, bảo mật, hiệu năng, kiểm thử, tài liệu và kiến trúc. Kết quả luôn ghi rõ là 'đề xuất' — quyết định cuối cùng vẫn thuộc về giảng viên.",
  },
  {
    q: "Lương ảo là gì?",
    a: "Là thu nhập mô phỏng tính theo KPI và đóng góp thật của bạn trong từng sprint. Sổ lương ghi chép minh bạch từng dòng để bạn hiểu mình 'được trả' theo những gì.",
  },
  {
    q: "Chứng chỉ có dùng được khi xin việc không?",
    a: "Mỗi chứng chỉ có một mã tra cứu công khai. Nhà tuyển dụng nhập mã vào trang xác thực của V-Intern là thấy ngay kết quả học tập thật của bạn — không thể làm giả.",
  },
];

export function FaqSection() {
  const [open, setOpen] = React.useState(0);

  return (
    <SectionShell id="faq" className="pt-0 md:pt-0">
      <LandingHeading
        eyebrow="Câu hỏi"
        title="Bạn thắc mắc, chúng tôi trả lời"
        sub="Những điều sinh viên hỏi nhiều nhất trước khi bắt đầu."
      />
      <div className="mx-auto mt-12 max-w-3xl space-y-3">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <FadeIn key={f.q} delay={i * 0.05}>
              <div className="card-surface overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-panel-2"
                >
                  <span className="text-sm font-semibold tracking-tight text-ink">{f.q}</span>
                  <ChevronDown
                    className={cn(
                      "size-4 icon shrink-0 text-faint transition-transform duration-300",
                      isOpen && "rotate-180 text-brand-bright"
                    )}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.21, 1.02, 0.73, 1] }}
                    >
                      <p className="border-t border-line px-5 pb-5 pt-4 text-[13px] leading-relaxed text-dim">
                        {f.a}
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </FadeIn>
          );
        })}
      </div>
    </SectionShell>
  );
}

/* ============================== CTA band ============================== */

export function CtaBand() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div
        className="absolute -left-24 bottom-0 size-[380px] rounded-full bg-brand/15 blur-[120px] animate-aurora"
        aria-hidden
      />
      <div
        className="absolute -right-24 top-0 size-[380px] rounded-full bg-teal/15 blur-[120px] animate-aurora [animation-delay:-8s]"
        aria-hidden
      />
      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6">
        <FadeIn>
          <div className="rounded-3xl bg-gradient-to-r from-brand/40 via-teal/30 to-transparent p-[1px]">
            <div className="noise relative overflow-hidden rounded-[calc(1.5rem-1px)] bg-panel px-6 py-14 text-center md:px-12 md:py-16">
              <div className="grid-bg absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" aria-hidden />
              <div className="relative">
                <h2 className="mx-auto max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-ink md:text-4xl">
                  Sẵn sàng bắt đầu <span className="text-gradient">sự nghiệp</span> của bạn?
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-dim md:text-[15px]">
                  Tạo tài khoản miễn phí — 15 phút sau, bạn đã ngồi trong buổi phỏng vấn AI đầu
                  tiên của mình.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <CtaPrimary to="/register">Bắt đầu miễn phí</CtaPrimary>
                  <CtaGhost onClick={() => navigate("/login")}>Dùng tài khoản demo</CtaGhost>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
