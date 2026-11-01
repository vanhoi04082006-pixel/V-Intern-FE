"use client";

import Image from "next/image";
import Link from "next/link";
import {
  IconArrowDownRight,
  IconArrowRight,
  IconCheck,
} from "@/components/v-intern/icons";
import { Sparkles } from "@/components/animate-ui/icons/sparkles";
import { FadeIn } from "@/components/v-intern/reveal";
import { SectionHeading } from "@/components/v-intern/section-heading";
import { Tape } from "@/components/v-intern/doodles";

type Audience = {
  id: string;
  badge: string;
  title: string;
  description: string;
  checklist: string[];
  cta: string;
  ctaHref: string;
  image: string;
  imageAlt: string;
  scriptLines: string[];
  scriptIndents: number[];
  accent: "drop" | "sparkles";
  theme: "light" | "dark";
};

const AUDIENCES: Audience[] = [
  {
    id: "students",
    badge: "Dành cho sinh viên",
    title: "Phát triển kỹ năng — Kiến tạo sự nghiệp",
    description:
      "Trải nghiệm quy trình làm việc thực tế, học hỏi kỹ năng chuyên môn và mềm, được hỗ trợ bởi AI Mentor và kết nối với cộng đồng.",
    checklist: [
      "Thực hành trên các dự án thực tế",
      "Nhận phản hồi từ AI và người hướng dẫn",
      "Theo dõi tiến độ và KPI cá nhân",
      "Nhận chứng nhận hoàn thành",
    ],
    cta: "Bắt đầu hành trình của bạn",
    ctaHref: "/login",
    image: "/images/landing/student.png",
    imageAlt: "Minh hoạ sinh viên thực tập ảo đang làm việc với laptop và tai nghe",
    scriptLines: ["Học", "Làm", "Vươn xa"],
    scriptIndents: [0, 16, 34],
    accent: "drop",
    theme: "light",
  },
  {
    id: "instructors",
    badge: "Dành cho giảng viên",
    title: "Dễ dàng quản lý — Hiệu quả vượt trội",
    description:
      "Tạo và quản lý các đợt thực tập, theo dõi tiến độ sinh viên, đánh giá năng lực và xuất báo cáo chi tiết, trực quan.",
    checklist: [
      "Quản lý dự án, nhiệm vụ, sprint",
      "Theo dõi tiến độ và hiệu suất sinh viên",
      "Đánh giá và phê duyệt kết quả",
      "Báo cáo và thống kê tự động",
    ],
    cta: "Khám phá tính năng",
    ctaHref: "#platform",
    image: "/images/landing/instructor.png",
    imageAlt: "Minh hoạ giảng viên quản lý lớp thực tập ảo trên máy tính bảng",
    scriptLines: ["Sinh viên", "tốt hơn", "Tương lai", "rộng hơn"],
    scriptIndents: [0, 14, 6, 20],
    accent: "sparkles",
    theme: "dark",
  },
];

function ScriptNote({ audience }: { audience: Audience }) {
  const isLast = (index: number) => index === audience.scriptLines.length - 1;

  return (
    <div
      aria-hidden="true"
      className={
        "pointer-events-none absolute left-4 top-4 z-10 select-none font-hand text-[26px] font-bold leading-[1.08] sm:left-7 sm:top-6 sm:text-[29px] -rotate-6 " +
        "text-royal"
      }
    >
      {audience.scriptLines.map((line, index) => (
        <span
          key={`${line}-${index}`}
          className="block"
          style={{ paddingLeft: `${audience.scriptIndents[index] ?? 0}px` }}
        >
          {line}
          {isLast(index) && audience.accent === "drop" && (
            <IconArrowDownRight
              className="ml-1 inline h-5 w-5 -translate-y-0.5"
              strokeWidth={2.5}
            />
          )}
          {isLast(index) && audience.accent === "sparkles" && (
            <Sparkles
              size={16}
              className="ml-1 inline opacity-70"
              animateOnView
              aria-hidden="true"
            />
          )}
        </span>
      ))}
    </div>
  );
}

function AudienceCard({ audience, index = 0 }: { audience: Audience; index?: number }) {
  const dark = audience.theme === "dark";
  /* Băng keo mỗi thẻ một cuộn — xanh / vàng so-le */
  const tapeVariant = index % 2 === 0 ? "blue" : "warm";

  return (
    <article
      id={audience.id === "instructors" ? "for-instructors" : undefined}
      className={
        "relative flex h-full scroll-mt-24 flex-col overflow-hidden rounded-3xl border-2 border-ink md:flex-row " +
        (dark
          ? "bg-coal text-chalk shadow-[8px_8px_0_0_rgba(32,96,240,0.9)]"
          : "bg-blue-mist text-ink shadow-[8px_8px_0_0_var(--hard-shadow)]")
      }
    >
      <Tape
        className="-top-1 left-1/2 z-20 -translate-x-1/2"
        rotate={-4}
        variant={tapeVariant}
      />

      <div className="flex flex-1 flex-col items-start p-7 sm:p-8 md:py-10 md:pl-10 md:pr-4 lg:pr-6">
        <span
          className={
            "inline-flex -rotate-1 items-center rounded-full border-2 px-4 py-1.5 text-xs font-bold " +
            (dark
              ? "border-chalk/40 bg-royal text-white"
              : "border-ink bg-raised text-blue")
          }
        >
          {audience.badge}
        </span>

        <h3
          className={
            "mt-5 text-[22px] font-extrabold leading-snug sm:text-2xl " +
            (dark ? "text-chalk" : "text-ink")
          }
        >
          {audience.title}
        </h3>
        <p
          className={
            "mt-3 text-sm leading-relaxed " +
            (dark ? "text-chalk-soft" : "text-ink-soft")
          }
        >
          {audience.description}
        </p>

        <ul className="mt-6 w-full space-y-3">
          {audience.checklist.map((item) => (
            <li key={item} className="flex items-center gap-3">
              <span
                className={
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 " +
                  (dark
                    ? "border-royal bg-royal text-white"
                    : "border-ink bg-royal text-white")
                }
              >
                <IconCheck className="h-3.5 w-3.5" strokeWidth={3.5} aria-hidden="true" />
              </span>
              <span
                className={
                  "text-sm font-medium " +
                  (dark ? "text-chalk/90" : "text-ink")
                }
              >
                {item}
              </span>
            </li>
          ))}
        </ul>

        <Link
          href={audience.ctaHref}
          className={
            "group mt-8 inline-flex h-12 items-center gap-2 rounded-xl border-2 px-6 text-sm font-bold transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 " +
            (dark
              ? "border-coal bg-chalk text-coal shadow-[4px_4px_0_0_rgba(32,96,240,0.9)] hover:shadow-[6px_6px_0_0_rgba(32,96,240,0.9)] focus-visible:ring-[#7d97ff] focus-visible:ring-offset-coal"
              : "border-ink bg-royal text-white shadow-[4px_4px_0_0_var(--ink)] hover:bg-royal-deep hover:shadow-[6px_6px_0_0_var(--ink)] focus-visible:ring-offset-blue-mist")
          }
        >
          {audience.cta}
          <IconArrowRight
            className="h-4 w-4 transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>
      </div>

      <div className="relative mt-6 h-[300px] w-full shrink-0 sm:h-[340px] md:mt-0 md:h-auto md:w-[42%] md:self-stretch">
        <ScriptNote audience={audience} />
        <div
          className={
            "absolute bottom-0 right-0 flex h-full w-full items-end justify-center overflow-hidden bg-white md:rounded-l-2xl"
          }
        >
          <Image
            src={audience.image}
            alt={audience.imageAlt}
            width={864}
            height={1152}
            className="h-full w-auto object-contain object-bottom drop-shadow-xl"
          />
        </div>
      </div>
    </article>
  );
}

export function AudienceCards() {
  return (
    <section
      id="for-students"
      className="scroll-mt-20 bg-paper py-20 lg:py-24"
      aria-label="Đối tượng sử dụng V-Intern"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        {/* v6 Gọn: mọi section nội dung đều có mục lục mở đầu — đúng
            nhịp SectionHeading như how-it-works / workflow. */}
        <FadeIn>
          <SectionHeading
            eyebrow="Đối tượng sử dụng"
            title="Hai vai trò"
            highlight="một hành trình"
            subtitle="Sinh viên viết trang kỹ năng, giảng viên viết trang quản lý — cùng một cuốn sổ V-Intern."
          />
        </FadeIn>
        <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {AUDIENCES.map((audience, index) => (
            <FadeIn key={audience.id} delay={index * 0.12} className="h-full">
              <AudienceCard audience={audience} index={index} />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
