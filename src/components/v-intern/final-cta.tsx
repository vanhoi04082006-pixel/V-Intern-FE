"use client";

import Link from "next/link";
import { FadeIn } from "@/components/v-intern/reveal";
import { GradientBackground } from "@/components/animate-ui/backgrounds/gradient";
import { LiquidButton } from "@/components/animate-ui/buttons/liquid";
import {
  PaperPlaneDoodle,
  RouteTrailDoodle,
  SparkleDoodle,
  SquiggleUnderline,
  StarDoodle,
} from "@/components/v-intern/doodles";
import { StampMoc } from "@/components/workspace/notebook";
import {
  IconArrowRight,
} from "@/components/v-intern/icons";

/** Lời chào cuối trang — trang bìa xanh trước khi gấp sổ lại. */
export function FinalCta() {
  return (
    <section
      className="relative overflow-hidden py-20 lg:py-24"
      aria-label="Bắt đầu hành trình với V-Intern"
    >
      {/* Lớp mực xanh loang chậm — gradient royal trôi nhẹ như tiết mực
          trên trang bìa, 18s/vòng, tự ngắt khi giảm chuyển động. */}
      <GradientBackground
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-[#5b8df6] via-[#2060f0] to-[#0f2a86] bg-[length:200%_200%]"
        transition={{ duration: 18, ease: "easeInOut", repeat: Infinity }}
      />

      {/* Nền phấn — chấm bi trắng mờ như bảng đen */}
      <div
        aria-hidden="true"
        className="mask-fade-edges pointer-events-none absolute inset-0 bg-dots-chalk opacity-60"
      />
      <StarDoodle className="absolute left-[8%] top-12 hidden h-8 w-8 text-white/30 lg:block" />
      <SparkleDoodle className="absolute bottom-12 left-[18%] hidden h-6 w-6 text-white/25 lg:block" />
      <StarDoodle className="absolute bottom-16 right-[10%] hidden h-10 w-10 rotate-12 text-white/25 lg:block" />
      <SparkleDoodle className="absolute right-[22%] top-10 hidden h-7 w-7 text-white/30 lg:block" />
      {/* Đường bay hành trình — giấy bay lớn phía trên headline */}
      <RouteTrailDoodle className="absolute left-1/2 top-6 hidden w-[520px] -translate-x-1/2 text-white/25 lg:block" />
      <PaperPlaneDoodle className="absolute right-[14%] top-14 hidden h-14 w-16 animate-float text-white/40 motion-reduce:animate-none lg:block" />

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
            <LiquidButton
              asChild
              delay="0.35s"
              fillHeight="4px"
              className="group inline-flex h-[52px] items-center gap-2 rounded-xl border-2 border-coal bg-white px-8 text-sm font-extrabold text-coal shadow-[5px_5px_0_0_var(--coal)] hover:shadow-[7px_7px_0_0_var(--coal)] active:shadow-[2px_2px_0_0_var(--coal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-royal [--liquid-button-background-color:var(--paper)] [--liquid-button-color:var(--coal)] hover:text-white"
            >
              <Link href="/login">
                Viết trang đầu tiên
                <IconArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </LiquidButton>
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
