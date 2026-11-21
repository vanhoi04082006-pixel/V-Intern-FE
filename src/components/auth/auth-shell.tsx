"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  IconArrowLeft,
  IconArrowUpRight,
  IconChartColumn,
  IconCodeXml,
  IconUsers,
} from "@/components/v-intern/icons";
import { VQuote } from "@/components/icons/v-icons";
import { MarginNote } from "@/components/workspace/notebook";
import { AsteriskDoodle, SparkleDoodle, Tape } from "@/components/v-intern/doodles";
import { Logo } from "@/components/v-intern/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { AuthGlyphLayer } from "@/components/auth/auth-glyph-layer";
import { cn } from "@/lib/utils";

const BENEFITS = [
  { icon: IconCodeXml, title: "Dự án thực tế", desc: "Làm việc với các project mô phỏng doanh nghiệp." },
  { icon: IconUsers, title: "Quy trình chuyên nghiệp", desc: "Sprint, Task, PR, Review như một team thật." },
  { icon: IconChartColumn, title: "Phát triển kỹ năng", desc: "Tích lũy kinh nghiệm và nhận đánh giá rõ ràng." },
] as const;

/** Câu nói chân trang xoay vòng ở cột trái (mỗi 5 giây đổi một câu) — port
 *  sandbox auth-screen TESTIMONIALS; nội dung thật của sản phẩm, không thêm
 *  bớt. */
const TESTIMONIALS = [
  {
    quote:
      "Sprint đầu nhìn bảng task mà hoa mắt — đến sprint thứ ba mình đã được giao review code của bạn cùng nhóm.",
    name: "Minh",
    meta: "thực tập sinh Frontend · kỳ 2026A",
  },
  {
    quote:
      "Theo dõi 30 sinh viên trên V-Intern dễ hơn chấm bài giấy. Điểm AI chỉ để tham khảo — tôi chỉ việc chốt.",
    name: "Cô Lan",
    meta: "giảng viên hướng dẫn",
  },
  {
    quote:
      "Lương ảo thôi mà, nhưng KPI hàng tuần thì thật — cứ thế mà ráng hết sprint này sang sprint khác.",
    name: "Khánh Vy",
    meta: "thực tập sinh · sprint 4",
  },
] as const;

/** Thẻ "lời ghi chân trang" — blockquote dán băng dính washi, tự xoay vòng
 *  5 giây/câu (sandbox auth-screen rotator). Rê chuột / focus vào thẻ thì
 *  tạm dừng để đọc hết; bấm chấm để chọn câu muốn xem. aria-live polite để
 *  screen reader đọc kịp câu đang hiện. Giảm chuyển động → đổi câu tức thì
 *  (duration 0), không animate. */
function TestimonialNote() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % TESTIMONIALS.length),
      5000,
    );
    return () => window.clearInterval(id);
  }, [paused]);

  const t = TESTIMONIALS[index];

  return (
    <div
      className="relative mt-10 max-w-md"
      aria-label="Lời chia sẻ từ người dùng V-Intern"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Băng dính mặc định rộng 96px — canh giữa bằng margin âm thay vì
          translate (transform của .tape đã dùng cho rotate), không đụng CSS. */}
      <Tape
        variant="mint"
        rotate={-2}
        className="absolute -top-3 left-1/2 -ml-12"
      />
      <div className="rounded-[12px_15px_11px_14px] border-2 border-[var(--ink)] bg-[var(--paper-raised)] p-5 shadow-nb-ink-3">
        <div className="flex items-center gap-2">
          <VQuote size={18} aria-hidden="true" className="text-[var(--royal)]" />
          <p className="font-mono text-[0.58rem] font-medium uppercase tracking-[0.22em] text-[var(--ink-soft)]">
            lời ghi chân trang
          </p>
        </div>
        <div aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: reduced ? 0 : 0.32, ease: "easeOut" }}
              className="mt-3 min-h-[104px]"
            >
              <p className="font-hand text-[1.06rem] leading-relaxed text-[var(--ink)]">
                “{t.quote}”
              </p>
              <footer className="mt-2.5 text-xs text-[var(--ink-soft)]">
                — <b className="text-[var(--ink)]">{t.name}</b> · {t.meta}
              </footer>
            </motion.blockquote>
          </AnimatePresence>
        </div>
        <div className="mt-3 flex items-center gap-0.5">
          {TESTIMONIALS.map((tt, i) => {
            const active = i === index;
            return (
              <button
                key={tt.name}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Xem lời chia sẻ của ${tt.name}`}
                aria-current={active ? "true" : undefined}
                className="grid size-6 place-items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-1.5 w-1.5 rounded-full border transition-colors duration-200",
                    active
                      ? "border-[var(--royal)] bg-[var(--royal)]"
                      : "border-[var(--ink-soft)] bg-transparent",
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return <AuthGlyphLayer>
    <header className="support-header"><Logo /><div className="flex items-center gap-3"><ThemeToggle /><Link href="/" aria-label="Quay lại trang chủ" className="support-back"><IconArrowLeft size={16} aria-hidden />Quay lại</Link></div></header>
    {/* paper-grain: lớp feTurbulence mịn (4%/8% dark) phủ vùng nội dung auth —
        chất giấy sổ tay như màn auth sandbox, thuần trang trí qua ::before. */}
    <main className="auth-layout paper-grain">
      <section className="auth-context nb-fade nb-delay-1" aria-label="Giới thiệu V-Intern">
        <AsteriskDoodle
          className="pointer-events-none absolute -right-4 -top-7 h-5 w-5 text-blue/25 animate-float motion-reduce:animate-none"
        />
        <SparkleDoodle
          className="pointer-events-none absolute -left-9 top-1/3 hidden h-5 w-5 text-blue/20 animate-bob motion-reduce:animate-none xl:block"
        />
        <h2>Thực tập như một <span className="marker animate-marker-blot motion-reduce:animate-none">lập trình viên thực thụ</span>.</h2>
        <p>Làm việc trên dự án thực tế, nhận task, sử dụng GitHub, làm việc theo Sprint và nhận phản hồi trong suốt quá trình.</p>
        <ul className="auth-benefits">{BENEFITS.map(({ icon: Icon, title, desc }) => <li key={title}><Icon size={20} aria-hidden /><div><h3>{title}</h3><p>{desc}</p></div></li>)}</ul>
        <MarginNote className="mt-4">sổ tay này ghi lại từng bước của bạn ✎</MarginNote>
        <Link href="/apply" className="support-context-link">Ứng tuyển chương trình thực tập<IconArrowUpRight size={16} aria-hidden /></Link>
        {/* Câu nói chân trang — thẻ giấy dán băng dính washi, xoay vòng 5 giây/câu.
            Port sandbox Journey v3: tự động đổi câu, bấm chấm chọn câu, tạm dừng
            khi rê chuột/focus. */}
        <TestimonialNote />
        {/* Tấm polaroid sinh viên bước đi — mở đầu hành trình, chỉ hiện ≥lg */}
        <figure className="relative mt-6 hidden w-[228px] rotate-[-1.4deg] xl:block">
          <Tape className="-top-2.5 left-8 z-10" rotate={-5} variant="mint" />
          <div className="sketch-card-sm bg-raised p-2 dog-ear">
            <Image
              src="/images/characters/student-walker.png"
              alt="Minh hoạ sinh viên đeo ba lô đang bước theo vệt mực, phía trước là cờ nhỏ"
              width={228}
              height={304}
              sizes="228px"
              priority
              className="w-full rounded-lg border-2 border-ink/10"
            />
            <figcaption className="px-1 pb-0.5 pt-1.5 font-hand text-[15px] leading-tight text-ink-soft">
              trang đầu tiên bắt đầu từ đây →
            </figcaption>
          </div>
        </figure>
      </section>
      <div className="auth-form-region">{children}</div>
    </main>
  </AuthGlyphLayer>;
}
