"use client";

import { BadgeCheck, Bot, Building2, Code2, UserSearch } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SectionHeading } from "@/components/v-intern/section-heading";
import { FadeIn } from "@/components/v-intern/reveal";
import { HandArrowRight } from "@/components/v-intern/doodles";

const STEPS: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: UserSearch,
    title: "Tuyển dụng AI",
    description: "Phỏng vấn AI, đánh giá năng lực và phản hồi tự động.",
  },
  {
    icon: Building2,
    title: "Môi trường làm việc ảo",
    description: "Làm việc trong môi trường công ty ảo chuyên nghiệp.",
  },
  {
    icon: Code2,
    title: "Nhiệm vụ thực tế",
    description: "Thực hiện các tác vụ thực tế từ doanh nghiệp.",
  },
  {
    icon: Bot,
    title: "Đánh giá AI",
    description: "Đồng nghiệp AI đánh giá, nhận phản hồi chi tiết và cải thiện.",
  },
  {
    icon: BadgeCheck,
    title: "Hiệu suất",
    description: "Theo dõi tiến độ, KPI và nhận chứng nhận hoàn thành.",
  },
];

/**
 * 5 bước quy trình — mỗi bước là một "tấm vé" dán lệch,
 * nối nhau bằng mũi tên vẽ tay trên desktop.
 */
export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-y-2 border-ink/10 bg-raised py-20 lg:py-24"
      aria-label="Cách V-Intern hoạt động"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <FadeIn>
          <SectionHeading
            eyebrow="Quy trình 5 bước"
            title="Cách V-Intern"
            highlight="hoạt động"
            subtitle="Từ phỏng vấn AI đến chứng nhận hoàn thành, V-Intern mô phỏng toàn bộ quy trình thực tập chuyên nghiệp trong môi trường doanh nghiệp."
          />
        </FadeIn>

        <FadeIn className="mt-16" delay={0.1}>
          <div className="flex flex-col gap-5 sm:grid sm:grid-cols-2 lg:flex-row lg:items-stretch lg:gap-0">
            {STEPS.map((step, index) => {
              const rotations = [
                "-rotate-2",
                "rotate-1",
                "-rotate-1",
                "rotate-2",
                "-rotate-2",
              ];
              return (
                <div key={step.title} className="contents">
                  {index > 0 ? (
                    <div
                      className="hidden shrink-0 items-center justify-center px-1 lg:flex lg:self-center"
                      aria-hidden="true"
                    >
                      <HandArrowRight className="h-9 w-9 shrink-0 text-blue/60" />
                    </div>
                  ) : null}

                  <article
                    className={
                      "sketch-card-sm group relative flex h-full flex-col items-center px-4 py-6 text-center transition-all duration-300 ease-out hover:-translate-y-1.5 hover:rotate-0 hover:shadow-[5px_5px_0_0_var(--hard-shadow)] lg:min-w-0 lg:flex-1 " +
                      rotations[index] +
                      (index > 0 ? " lg:ml-3" : "")
                    }
                  >
                    <span className="font-hand text-3xl leading-none text-blue">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="mt-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink bg-blue-mist text-blue transition-transform duration-300 group-hover:-rotate-12 group-hover:bg-royal group-hover:text-white">
                      <step.icon className="h-[22px] w-[22px]" aria-hidden="true" />
                    </span>

                    <h3 className="mt-4 text-sm font-extrabold text-ink">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
                      {step.description}
                    </p>
                  </article>
                </div>
              );
            })}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
