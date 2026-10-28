"use client";

import Image from "next/image";
import { Bot } from "lucide-react";
import { FadeIn } from "@/components/v-intern/reveal";

/**
 * Ba chấm nhấp nháy mô phỏng AI đang gõ — mỗi chấm trễ một nhịp
 * cho chuyển động tự nhiên hơn. Thuần CSS, tôn trọng giảm chuyển động.
 */
function TypingDots() {
  return (
    <span className="flex items-center gap-1" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand motion-reduce:animate-none"
          style={{ animationDelay: `${index * 0.18}s` }}
        />
      ))}
    </span>
  );
}

/** Vòng tròn avatar của người phỏng vấn AI dùng chung cho bong bóng chat. */
function InterviewerAvatar() {
  return (
    <span
      aria-hidden="true"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-brand ring-1 ring-border"
    >
      <Bot className="h-4 w-4" />
    </span>
  );
}

/**
 * Showcase buổi phỏng vấn AI: ảnh tiêu biểu kèm huy hiệu nổi bật
 * bên trái, mô phỏng đoạn hội thoại thật bên phải.
 */
export function AiInterviewShowcase() {
  return (
    <section
      id="ai-interview"
      className="bg-canvas py-20 scroll-mt-20"
      aria-label="Buổi phỏng vấn AI trên V-Intern"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Ảnh buổi phỏng vấn AI + huy hiệu nổi bật */}
          <FadeIn className="relative">
            <div className="rounded-2xl bg-card p-2 shadow-2xl shadow-navy/10 ring-1 ring-border rotate-[-1.5deg] motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:hover:rotate-0">
              <Image
                src="/images/landing/ai-interview.png"
                alt="Sinh viên nữ trong buổi phỏng vấn AI trên V-Intern, phía sau là màn hình hiển thị giao diện phỏng vấn kèm điểm số 82/100"
                width={1344}
                height={768}
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="w-full rounded-xl"
              />
            </div>
            <span className="absolute -bottom-3 left-6 inline-flex items-center gap-2 rounded-full bg-card/90 px-3 py-1.5 text-[11px] font-medium text-muted-foreground ring-1 ring-border backdrop-blur">
              <span
                aria-hidden="true"
                className="h-2 w-2 animate-pulse rounded-full bg-brand motion-reduce:animate-none"
              />
              Buổi phỏng vấn AI tiêu biểu
            </span>
          </FadeIn>

          {/* Mô phỏng hội thoại với người phỏng vấn AI */}
          <FadeIn delay={0.12}>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <InterviewerAvatar />
                <div className="min-w-0 max-w-[85%]">
                  <div className="rounded-2xl rounded-tl-md bg-card px-4 py-3 text-sm leading-relaxed text-muted-foreground ring-1 ring-border">
                    Chào An, tôi là người phỏng vấn AI của V-Intern. Buổi hôm
                    nay gồm 5 câu hỏi về React và tư duy giải quyết vấn đề —
                    sẵn sàng chứ?
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Người phỏng vấn AI · 14:02
                  </p>
                </div>
              </div>

              <div className="flex flex-row-reverse items-start gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-white ring-1 ring-border"
                >
                  AN
                </span>
                <div className="min-w-0 max-w-[85%] text-right">
                  <div className="rounded-2xl rounded-tr-md bg-accent px-4 py-3 text-left text-sm leading-relaxed text-muted-foreground ring-1 ring-border">
                    Sẵn sàng ạ, em bắt đầu được ngay.
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    An Nguyễn · 14:02
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <InterviewerAvatar />
                <div className="flex items-center gap-2.5 rounded-2xl rounded-tl-md bg-card px-4 py-3 ring-1 ring-border">
                  <TypingDots />
                  <span className="text-xs text-muted-foreground">
                    AI đang chọn câu hỏi tiếp theo…
                  </span>
                </div>
              </div>

              <p className="pl-1 text-sm leading-relaxed text-muted-foreground">
                Câu hỏi thích ứng theo từng câu trả lời — càng trả lời tốt,
                thử thách càng thật.
              </p>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
