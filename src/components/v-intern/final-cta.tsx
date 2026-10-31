"use client";

import { FadeIn } from "@/components/v-intern/reveal";
import { SparkleDoodle, SquiggleUnderline, StarDoodle } from "@/components/v-intern/doodles";
import { StampMoc } from "@/components/workspace/notebook";
import {
  IconArrowRight,
} from "@/components/v-intern/icons";

/** Lời chào cuối trang — trang bìa xanh trước khi gấp sổ lại. */
export function FinalCta() {
  return (
    <section
      className="relative overflow-hidden bg-royal py-20 lg:py-24"
      aria-label="Bắt đầu hành trình với V-Intern"
    >
      <StarDoodle className="absolute left-[8%] top-12 hidden h-8 w-8 text-white/30 lg:block" />
      <SparkleDoodle className="absolute bottom-12 left-[18%] hidden h-6 w-6 text-white/25 lg:block" />
      <StarDoodle className="absolute bottom-16 right-[10%] hidden h-10 w-10 rotate-12 text-white/25 lg:block" />
      <SparkleDoodle className="absolute right-[22%] top-10 hidden h-7 w-7 text-white/30 lg:block" />

      <div className="relative mx-auto max-w-3xl px-4 text-center md:px-6">
        <FadeIn>
          <p className="font-hand text-2xl leading-none text-white/90">
            vẫn còn đó, một trang sổ trắng đang chờ bạn viết tiếp…
          </p>

          <h2 className="mt-5 text-3xl font-extrabold leading-[1.12] tracking-tight text-white sm:text-4xl lg:text-5xl">
            Sẵn sàng bắt đầu
            <br />
            <span className="relative inline-block">
              hành trình thực tập đầu tiên?
              <SquiggleUnderline className="absolute -bottom-2 left-0 w-full text-white/80" />
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/95">
            Tạo tài khoản, chọn lĩnh vực bạn yêu thích và để AI hướng bạn qua
            từng bước — hoàn toàn miễn phí cho sinh viên.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <a
              href="/login"
              className="group inline-flex h-[52px] items-center gap-2 rounded-xl border-2 border-coal bg-white px-8 text-sm font-extrabold text-coal shadow-[5px_5px_0_0_var(--coal)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_0_var(--coal)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0_0_var(--coal)]"
            >
              Viết trang đầu tiên
              <IconArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </a>
          </div>

          {/* Mộc xác nhận trên nền xanh — dấu "MIỄN PHÍ" đóng nghiêng */}
          <FadeIn delay={0.1} className="mt-7 flex justify-center">
            <StampMoc tone="blue" rotate={-4} className="text-white/90">
              Miễn phí cho sinh viên
            </StampMoc>
          </FadeIn>

          <p className="mt-6 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-white/90">
            hẹn gặp bạn bên trong ✦
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
