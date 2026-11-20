"use client";

import { Fragment } from "react";
import { VStampTool } from "@/components/icons/v-icons";
import { FadeIn, Stagger, StaggerItem } from "@/components/notebook/reveal";
import { Eyebrow, NoteCard, PolaroidFrame, Tape } from "@/components/notebook/ui";
import { HandArrowRight } from "@/components/notebook/doodles";

type TicketTape = "blue" | "warm" | "candy" | "mint" | "slate" | "gold";

const TICKETS: {
  no: string;
  title: string;
  desc: string;
  tape: TicketTape;
  rotate: number;
}[] = [
  {
    no: "01",
    title: "Tuyển dụng AI",
    desc: "AI phỏng vấn, chấm điểm và gợi ý vai trò phù hợp",
    tape: "blue",
    rotate: -1.5,
  },
  {
    no: "02",
    title: "Môi trường làm việc ảo",
    desc: "Lớp học dạng công ty thật: phiên, sprint, GitHub",
    tape: "warm",
    rotate: 1.2,
  },
  {
    no: "03",
    title: "Nhiệm vụ thực tế",
    desc: "Task có story point, deadline và PR review",
    tape: "candy",
    rotate: -1,
  },
  {
    no: "04",
    title: "Đánh giá AI",
    desc: "AI chấm nháp, giảng viên chốt điểm chính thức",
    tape: "mint",
    rotate: 1.4,
  },
  {
    no: "05",
    title: "Hiệu suất",
    desc: "KPI, lương ảo và chứng nhận cuối kỳ",
    tape: "gold",
    rotate: -1.2,
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-label="Cách V-Intern hoạt động"
      className="scroll-mt-24 border-y-2 border-[var(--ink)] bg-[var(--paper)] py-16 lg:py-24"
    >
      {/* Tấm vé dán nghiêng — hover thẳng lại như bóc sticker khỏi trang */}
      <style>{`
        .hw-ticket {
          transform: rotate(var(--tilt, 0deg));
        }
        .hw-ticket:hover {
          transform: rotate(0deg) translate(-2px, -3px);
        }
      `}</style>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <Eyebrow>Quy trình 5 bước</Eyebrow>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--ink)] sm:text-4xl">
            Cách V-Intern <span className="hw-marker">hoạt động</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--ink-soft)]">
            Từ phỏng vấn AI đến chứng nhận hoàn thành — mỗi bước đều là một
            trang trong cuốn sổ hành trình của bạn.
          </p>
        </FadeIn>

        {/* 5 tấm "vé" nghiêng — dọc trên di động, ngang kèm mũi tên tay trên desktop */}
        <Stagger className="mt-12 flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-1">
          {TICKETS.map((ticket, index) => (
            <Fragment key={ticket.no}>
              {index > 0 && (
                <HandArrowRight
                  className="mx-1 hidden h-7 w-10 shrink-0 self-center text-[var(--royal)]/60 lg:block"
                />
              )}
              <StaggerItem className="flex-1">
                <article
                  className="hw-ticket sticker-pop nb-sketch-card nb-sketch-card-hover relative h-full p-5 pt-7"
                  style={{ ["--tilt" as string]: `${ticket.rotate}deg` }}
                >
                  {/* Con dấu mực lớn mờ sau chữ — dấu triện của bước */}
                  <VStampTool
                    aria-hidden="true"
                    size={64}
                    className="pointer-events-none absolute -right-2 -top-3 z-[-1] rotate-[8deg] text-[var(--ink)] opacity-[0.06]"
                  />
                  <Tape
                    variant={ticket.tape === "gold" ? "warm" : ticket.tape}
                    rotate={ticket.rotate * -2}
                    peel
                    className={`-top-3 ${ticket.tape === "gold" ? "tape-gold" : ""}`}
                    style={{ width: 72, left: "calc(50% - 36px)" }}
                  />
                  <p className="font-mono text-xs font-bold tracking-[0.18em] text-[var(--royal)]">
                    {ticket.no}
                  </p>
                  <h3 className="mt-2 text-[0.95rem] font-bold leading-snug text-[var(--ink)]">
                    {ticket.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink-soft)] sm:text-[13px]">
                    {ticket.desc}
                  </p>
                </article>
              </StaggerItem>
            </Fragment>
          ))}
        </Stagger>

        {/* Bản đồ hành trình + ghi chú mẹo */}
        <FadeIn delay={0.1} className="mt-14 lg:mt-20">
          <div className="flex flex-col items-center gap-10 md:flex-row md:justify-center md:gap-16">
            <PolaroidFrame
              src="/images/landing/journey-map.png"
              alt="Bản đồ minh hoạ hành trình 7 chặng của kỳ thực tập ảo"
              caption="bản đồ hành trình · 7 chặng"
              rotate={-2.5}
              tapeVariant="blue"
              className="w-full max-w-md"
            />
            <div className="relative max-w-xs md:pt-8">
              <HandArrowRight
                className="absolute -left-16 top-16 hidden w-14 -scale-x-100 text-[var(--royal)]/60 md:block"
              />
              <NoteCard title="Mẹo nhỏ" tone="mint" rotate={2} tapeVariant="mint">
                Không cần CV đẹp — hãy kể cho AI nghe bạn đã <b>tự học được gì</b>,
                <b>làm được gì</b>. Sự thật thú vị hơn trang trí.
              </NoteCard>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
