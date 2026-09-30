"use client";

import { Fragment } from "react";
import { ArrowRight, BadgeCheck, Bot, Building2, Code2, UserSearch } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SectionHeading } from "@/components/v-intern/section-heading";
import { FadeIn } from "@/components/v-intern/reveal";

const STEPS: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: UserSearch,
    title: "AI Recruitment",
    description: "Phỏng vấn AI, đánh giá năng lực và phản hồi tự động.",
  },
  {
    icon: Building2,
    title: "Virtual Workplace",
    description: "Làm việc trong môi trường công ty ảo chuyên nghiệp.",
  },
  {
    icon: Code2,
    title: "Real Tasks",
    description: "Thực hiện các tác vụ thực tế từ doanh nghiệp.",
  },
  {
    icon: Bot,
    title: "AI Review",
    description: "Đồng nghiệp AI đánh giá, nhận phản hồi chi tiết và cải thiện.",
  },
  {
    icon: BadgeCheck,
    title: "Performance",
    description: "Theo dõi tiến độ, KPI và nhận chứng nhận hoàn thành.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-white py-20 scroll-mt-20"
      aria-label="Cách V-Intern hoạt động"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <FadeIn>
          <SectionHeading
            title="How V-Intern Works"
            subtitle="Từ phỏng vấn AI đến chứng nhận hoàn thành, V-Intern mô phỏng toàn bộ quy trình thực tập chuyên nghiệp trong môi trường doanh nghiệp."
          />
        </FadeIn>

        <FadeIn className="mt-14" delay={0.1}>
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-0">
            {STEPS.map((step, index) => (
              <Fragment key={step.title}>
                {index > 0 ? (
                  <ArrowRight
                    className="mx-1 mt-[18px] hidden h-5 w-5 shrink-0 self-start text-blue-300 lg:block"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="flex flex-1 flex-col items-center text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                    <step.icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-sm font-bold text-navy sm:text-base">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 max-w-[230px] text-xs leading-relaxed text-slate-500 sm:text-sm">
                    {step.description}
                  </p>
                </div>
              </Fragment>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
