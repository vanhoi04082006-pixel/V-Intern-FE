"use client";

import Image from "next/image";
import {
  IconBadgeCheck,
  IconBot,
  IconBuilding,
  IconCodeXml,
  IconUserSearch,
  type IconComponent,
} from "@/components/v-intern/icons";
import { SectionHeading } from "@/components/v-intern/section-heading";
import { FadeIn } from "@/components/v-intern/reveal";
import { HandArrowRight, RouteTrailDoodle, Tape } from "@/components/v-intern/doodles";
import { NoteCard } from "@/components/workspace/notebook";

const STEPS: { icon: IconComponent; title: string; description: string }[] = [
  {
    icon: IconUserSearch,
    title: "Tuyển dụng AI",
    description: "Phỏng vấn AI, đánh giá năng lực và phản hồi tự động.",
  },
  {
    icon: IconBuilding,
    title: "Môi trường làm việc ảo",
    description: "Làm việc trong môi trường công ty ảo chuyên nghiệp.",
  },
  {
    icon: IconCodeXml,
    title: "Nhiệm vụ thực tế",
    description: "Thực hiện các tác vụ thực tế từ doanh nghiệp.",
  },
  {
    icon: IconBot,
    title: "Đánh giá AI",
    description: "Đồng nghiệp AI đánh giá, nhận phản hồi chi tiết và cải thiện.",
  },
  {
    icon: IconBadgeCheck,
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
              /* Băng keo xen kẽ màu — mỗi “tấm vé” dán bằng một cuộn washi khác */
              const tapeVariants = ["blue", "warm", "mint", "candy", "blue"] as const;
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
                    <Tape
                      className="-top-2.5 left-1/2 z-20 -translate-x-1/2"
                      rotate={index % 2 === 0 ? -3 : 4}
                      variant={tapeVariants[index]}
                    />
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

        {/* Bản đồ hành trình — polaroid rộng dán 2 cuộn washi, nét mực nối các chặng */}
        <FadeIn className="mt-12" delay={0.12}>
          <div className="relative mx-auto max-w-4xl">
            <Tape variant="mint" className="-top-2.5 left-10 z-20" rotate={-4} />
            <Tape variant="candy" className="-top-2.5 right-10 z-20" rotate={5} />
            <figure className="sketch-card rotate-[0.4deg] bg-raised p-2.5 dog-ear">
              <Image
                src="/images/landing/journey-map.png"
                alt="Bản đồ vẽ tay của hành trình V-Intern: đường mòn loang vòng qua những cột mốc sách vở, laptop, giấy chứng nhận, đến đỉnh có huy hiệu và tên lửa giấy"
                width={1008}
                height={576}
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="w-full rounded-lg border-2 border-ink/10"
              />
              <figcaption className="flex flex-wrap items-baseline justify-between gap-2 px-1.5 pb-1 pt-2.5">
                <span className="font-hand text-[17px] leading-tight text-ink-soft">
                  từ trang phỏng vấn đến trang chứng nhận — mỗi chặng một vệt mực
                </span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-blue">
                  bản đồ hành trình · 7 chặng
                </span>
              </figcaption>
            </figure>
            <RouteTrailDoodle className="absolute -bottom-9 left-1/2 hidden -translate-x-1/2 text-blue/45 lg:block" />
          </div>
        </FadeIn>

        {/* Ghi chú dán lề — mẹo nhỏ cho người mới, giữ chất sổ tay */}
        <FadeIn className="mt-12" delay={0.15}>
          <div className="mx-auto max-w-md">
            <NoteCard tape rotate={1.2} title="Mẹo nhỏ">
              Không cần CV đẹp — hãy kể cho AI nghe bạn đã tự học được gì, đam
              mê nằm ở đâu. Sổ tay này ghi lại từng bước để bạn nhìn lại hành
              trình của mình.
            </NoteCard>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
