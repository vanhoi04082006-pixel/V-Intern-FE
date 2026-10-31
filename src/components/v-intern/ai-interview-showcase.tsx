"use client";

import Image from "next/image";
import { FadeIn } from "@/components/v-intern/reveal";
import { StampBadge, Tape } from "@/components/v-intern/doodles";
import {
  IconBot,
} from "@/components/v-intern/icons";

/** Ba chấm nhấp nháy mô phỏng AI đang gõ — mỗi chấm trễ một nhịp. */
function TypingDots() {
  return (
    <span className="flex items-center gap-1" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="h-2 w-2 animate-blink-dot rounded-full bg-blue motion-reduce:animate-none"
          style={{ animationDelay: `${index * 0.18}s` }}
        />
      ))}
    </span>
  );
}

/** Avatar người phỏng vấn AI — vòng tròn viền mực. */
function InterviewerAvatar() {
  return (
    <span
      aria-hidden="true"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-blue-mist text-blue"
    >
      <IconBot className="h-4 w-4" />
    </span>
  );
}

/**
 * Showcase buổi phỏng vấn AI: tấm ảnh polaroid dán băng dính
 * bên trái, đoạn hội thoại như giấy note bên phải.
 */
export function AiInterviewShowcase() {
  return (
    <section
      id="ai-interview"
      className="relative scroll-mt-20 overflow-hidden bg-paper py-20 lg:py-24"
      aria-label="Buổi phỏng vấn AI trên V-Intern"
    >
      <div
        aria-hidden="true"
        className="mask-fade-edges pointer-events-none absolute inset-0 bg-dots-paper"
      />

      <div className="relative mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.12fr_0.88fr] lg:gap-16">
          {/* Tấm polaroid buổi phỏng vấn */}
          <FadeIn className="relative">
            <div className="relative mx-auto max-w-[640px]">
              <Tape className="-top-2.5 left-1/2 z-20 -translate-x-1/2" rotate={-3} variant="warm" />
              <figure className="sketch-card rotate-[-1.6deg] bg-raised p-3 pb-0 transition-transform duration-500 ease-out motion-safe:hover:rotate-0">
                <Image
                  src="/images/landing/ai-interview.png"
                  alt="Sinh viên trong buổi phỏng vấn AI trên V-Intern, xung quanh là bong bóng hội thoại và biểu tượng tích xanh"
                  width={1344}
                  height={768}
                  sizes="(min-width: 1024px) 56vw, 100vw"
                  className="w-full rounded-lg border-2 border-ink/10"
                />
                <figcaption className="flex items-center justify-between gap-3 px-2 py-3.5">
                  <span className="font-hand text-lg leading-tight text-ink-soft">
                    một buổi phỏng vấn thật dễ chịu
                  </span>
                  <StampBadge className="shrink-0 text-blue" rotate={-8}>
                    Tiêu biểu
                  </StampBadge>
                </figcaption>
              </figure>

              <span className="absolute -bottom-3.5 left-7 inline-flex -rotate-1 items-center gap-2 rounded-full border-2 border-ink bg-raised px-3.5 py-1.5 text-[11px] font-semibold text-ink-soft shadow-[2px_2px_0_0_var(--hard-shadow)]">
                <span
                  aria-hidden="true"
                  className="h-2 w-2 animate-pulse rounded-full bg-blue motion-reduce:animate-none"
                />
                Buổi phỏng vấn AI tiêu biểu
              </span>
            </div>
          </FadeIn>

          {/* Hội thoại với người phỏng vấn AI */}
          <FadeIn delay={0.12}>
            <div className="space-y-5">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-blue">
                ✦ Phỏng vấn thích ứng
              </p>

              <div className="flex items-start gap-3">
                <InterviewerAvatar />
                <div className="min-w-0 max-w-[85%]">
                  <div className="rounded-2xl rounded-tl-md border-2 border-ink/12 bg-raised px-4 py-3 text-sm leading-relaxed text-ink shadow-[2px_2px_0_0_var(--hard-shadow)]">
                    Chào An, tôi là người phỏng vấn AI của V-Intern. Buổi hôm
                    nay gồm 5 câu hỏi về React và tư duy giải quyết vấn đề —
                    sẵn sàng chứ?
                  </div>
                  <p className="mt-1.5 pl-1 font-mono text-[11px] text-ink-faint">
                    Người phỏng vấn AI · 14:02
                  </p>
                </div>
              </div>

              <div className="flex flex-row-reverse items-start gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-ink font-hand text-sm font-bold text-paper"
                >
                  AN
                </span>
                <div className="min-w-0 max-w-[85%] text-right">
                  <div className="rounded-2xl rounded-tr-md border-2 border-coal bg-royal px-4 py-3 text-left text-sm font-medium leading-relaxed text-white shadow-[2px_2px_0_0_var(--hard-shadow)]">
                    Sẵn sàng ạ, em bắt đầu được ngay.
                  </div>
                  <p className="mt-1.5 pr-1 font-mono text-[11px] text-ink-faint">
                    An Nguyễn · 14:02
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <InterviewerAvatar />
                <div className="flex items-center gap-2.5 rounded-2xl rounded-tl-md border-2 border-dashed border-ink/25 bg-raised px-4 py-3">
                  <TypingDots />
                  <span className="text-xs text-ink-soft">
                    AI đang chọn câu hỏi tiếp theo…
                  </span>
                </div>
              </div>

              <p className="rotate-[-0.6deg] border-l-4 border-blue pl-4 font-hand text-lg leading-snug text-ink-soft">
                câu hỏi thích ứng theo từng câu trả lời — càng trả lời tốt,
                thử thách càng thật!
              </p>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
