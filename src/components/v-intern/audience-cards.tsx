"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  Droplet,
  Sparkles,
} from "lucide-react";
import { FadeIn } from "@/components/v-intern/reveal";

type Audience = {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
  checklist: string[];
  cta: string;
  ctaHref: string;
  image: string;
  imageAlt: string;
  visualBasis: string;
  imagePositionClass: string;
  scriptLines: string[];
  scriptIndents: number[];
  scriptColor: string;
  scriptWrapClass: string;
  accent: "drop" | "sparkles";
  gradient: string;
  buttonColor: string;
  checkColor: string;
};

const AUDIENCES: Audience[] = [
  {
    id: "students",
    badge: "Dành cho sinh viên",
    badgeColor: "text-brand",
    title: "Phát triển kỹ năng - Kiến tạo sự nghiệp",
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
    image: "/images/student-v2.png",
    imageAlt: "Sinh viên thực tập ảo đang làm việc với laptop và tai nghe",
    visualBasis: "md:basis-[52%]",
    imagePositionClass: "bottom-0 right-0 max-h-[64%] max-w-full sm:max-h-[72%]",
    scriptLines: ["Học", "Làm", "Vươn xa"],
    scriptIndents: [0, 16, 34],
    scriptColor: "text-brand",
    scriptWrapClass: "left-1 top-3 -rotate-6 sm:left-7 sm:top-5",
    accent: "drop",
    gradient: "bg-gradient-to-br from-[#EAF1FE] to-[#F7FAFF]",
    buttonColor: "bg-brand hover:bg-brand-600 shadow-brand/25",
    checkColor: "bg-brand",
  },
  {
    id: "instructors",
    badge: "Dành cho giảng viên",
    badgeColor: "text-violet-600",
    title: "Dễ dàng quản lý - Hiệu quả vượt trội",
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
    image: "/images/instructor-v3.png",
    imageAlt: "Giảng viên quản lý lớp thực tập ảo trên tablet",
    visualBasis: "md:basis-[46%]",
    imagePositionClass: "bottom-0 right-0 max-h-[56%] max-w-full sm:max-h-[66%]",
    scriptLines: ["Sinh viên", "tốt hơn", "Tương lai", "rộng hơn"],
    scriptIndents: [0, 14, 6, 20],
    scriptColor: "text-violet-600",
    scriptWrapClass: "right-2 top-3 rotate-2 sm:right-4 sm:top-4",
    accent: "sparkles",
    gradient: "bg-gradient-to-br from-[#F1EDFE] to-[#FAF8FF]",
    buttonColor: "bg-violet-600 hover:bg-violet-700 shadow-violet-600/25",
    checkColor: "bg-violet-600",
  },
];

function ScriptNote({ audience }: { audience: Audience }) {
  const isLast = (index: number) => index === audience.scriptLines.length - 1;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute z-10 select-none font-handwriting font-bold leading-[1.05] ${audience.scriptColor} ${audience.scriptWrapClass}`}
    >
      {audience.scriptLines.map((line, index) => (
        <span
          key={`${line}-${index}`}
          className="block text-2xl sm:text-[28px]"
          style={{ paddingLeft: `${audience.scriptIndents[index] ?? 0}px` }}
        >
          {line}
          {isLast(index) && audience.accent === "drop" && (
            <ArrowDownRight
              className="ml-1 inline h-5 w-5 -translate-y-0.5"
              strokeWidth={2.5}
            />
          )}
          {isLast(index) && audience.accent === "sparkles" && (
            <Sparkles className="ml-1 inline h-4 w-4 opacity-70" />
          )}
        </span>
      ))}

      {audience.accent === "drop" && (
        <Droplet className="absolute -top-3 right-2 h-4 w-4 rotate-12 fill-brand/30 opacity-70" />
      )}
      {audience.accent === "sparkles" && (
        <Sparkles className="absolute -right-4 top-1/2 h-4 w-4 opacity-50" />
      )}
    </div>
  );
}

function AudienceCard({ audience }: { audience: Audience }) {
  return (
    <article
      id={audience.id === "instructors" ? "for-instructors" : undefined}
      className={`relative flex h-full flex-col overflow-hidden rounded-3xl scroll-mt-24 md:flex-row md:items-stretch ${audience.gradient}`}
    >
      <div className="flex flex-1 flex-col items-start p-6 sm:p-8 md:py-9 md:pl-9 md:pr-4 lg:pr-6">
        <span className="inline-flex items-center rounded-full bg-card px-4 py-1.5 text-xs font-semibold shadow-sm">
          <span className={audience.badgeColor}>{audience.badge}</span>
        </span>

        <h3 className="mt-4 text-xl font-bold leading-snug text-navy sm:text-2xl">
          {audience.title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {audience.description}
        </p>

        <ul className="mt-5 space-y-2.5">
          {audience.checklist.map((item) => (
            <li key={item} className="flex items-center gap-2.5">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${audience.checkColor}`}
              >
                <Check
                  className="h-3 w-3 text-white"
                  strokeWidth={3.5}
                  aria-hidden="true"
                />
              </span>
              <span className="text-sm text-foreground">{item}</span>
            </li>
          ))}
        </ul>

        <Link
          href={audience.ctaHref}
          className={`mt-7 inline-flex h-11 items-center gap-2 rounded-lg px-5 text-sm font-semibold text-white shadow-lg transition-colors ${audience.buttonColor}`}
        >
          {audience.cta}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div
        className={`relative mt-6 h-[300px] w-full shrink-0 sm:h-[340px] md:mt-0 md:h-auto md:self-stretch md:w-auto ${audience.visualBasis}`}
      >
        <Image
          src={audience.image}
          alt={audience.imageAlt}
          width={864}
          height={1152}
          className={`absolute bottom-0 right-0 h-auto w-auto mix-blend-multiply ${audience.imagePositionClass}`}
        />
        <ScriptNote audience={audience} />
      </div>
    </article>
  );
}

export function AudienceCards() {
  return (
    <section
      id="for-students"
      className="bg-card pb-20 pt-4 scroll-mt-20"
      aria-label="Đối tượng sử dụng V-Intern"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 md:px-6 lg:grid-cols-2 lg:px-8">
        {AUDIENCES.map((audience, index) => (
          <FadeIn key={audience.id} delay={index * 0.1} className="h-full">
            <AudienceCard audience={audience} />
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
