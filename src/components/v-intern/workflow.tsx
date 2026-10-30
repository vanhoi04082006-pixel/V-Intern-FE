"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Award,
  Bot,
  CalendarDays,
  Check,
  CircleCheck,
  Code2,
  FolderOpen,
  UserSearch,
  type LucideIcon,
} from "lucide-react";
import { SectionHeading } from "@/components/v-intern/section-heading";
import { FadeIn } from "@/components/v-intern/reveal";
import { Tape } from "@/components/v-intern/doodles";

type Step = {
  icon: LucideIcon;
  name: string;
  summary: string;
  phase: string;
  range: string;
  detail: string;
  does: string[];
  gets: string;
  artifact: string;
  preview: ReactNode;
};

function ArtifactFacts({ facts }: { facts: string[] }) {
  return (
    <ul className="space-y-3">
      {facts.map((f) => (
        <li
          key={f}
          className="flex items-start gap-3 rounded-lg border-2 border-dashed border-ink/15 bg-blue-mist/60 p-3 text-xs leading-relaxed text-ink-soft"
        >
          <CircleCheck size={16} className="shrink-0 text-blue" />
          {f}
        </li>
      ))}
    </ul>
  );
}

const STEPS: Step[] = [
  {
    icon: UserSearch,
    name: "Phỏng vấn",
    summary: "Khám phá năng lực ban đầu",
    phase: "Bắt đầu",
    range: "01–02",
    detail:
      "Chọn lĩnh vực thực tập và trả lời bộ câu hỏi phù hợp. Theo dõi kết quả cùng hướng dẫn bước tiếp theo.",
    does: ["Chọn lĩnh vực muốn thực tập", "Trả lời và gửi bài phỏng vấn"],
    gets: "Kết quả tuyển dụng và nhận xét",
    artifact: "Kết quả tuyển dụng",
    preview: (
      <ArtifactFacts
        facts={[
          "Câu trả lời được lưu trong phiên phỏng vấn",
          "Kết quả quyết định bước onboarding tiếp theo",
        ]}
      />
    ),
  },
  {
    icon: FolderOpen,
    name: "Dự án",
    summary: "Nhận phân công từ giảng viên",
    phase: "Bắt đầu",
    range: "01–02",
    detail:
      "Sau khi đạt tuyển dụng, giảng viên phân công dự án và phiên thực tập. Không gian làm việc cập nhật theo phân công của bạn.",
    does: ["Theo dõi trạng thái chờ phân công", "Đọc thông tin dự án được giao"],
    gets: "Dự án và người hướng dẫn phù hợp",
    artifact: "Thông tin dự án",
    preview: (
      <ArtifactFacts
        facts={[
          "Xem công nghệ, thời gian và người hướng dẫn",
          "Chưa được phân công sẽ có trạng thái chờ rõ ràng",
        ]}
      />
    ),
  },
  {
    icon: CalendarDays,
    name: "Sprint",
    summary: "Theo dõi chu kỳ công việc",
    phase: "Thực chiến",
    range: "03–05",
    detail:
      "Theo dõi Sprint hiện tại và các nhiệm vụ thuộc phạm vi thực tập. Thời gian và mục tiêu do giảng viên thiết lập.",
    does: ["Xem mục tiêu và thời gian Sprint", "Theo dõi các cột trạng thái nhiệm vụ"],
    gets: "Bảng Sprint và tiến độ công việc",
    artifact: "Sprint Board",
    preview: (
      <ArtifactFacts
        facts={[
          "Cần làm → Đang làm → Chờ duyệt → Hoàn thành",
          "Chỉ nhiệm vụ được giao xuất hiện trong workspace của bạn",
        ]}
      />
    ),
  },
  {
    icon: Code2,
    name: "Nhiệm vụ",
    summary: "Thực hiện và gửi duyệt",
    phase: "Thực chiến",
    range: "03–05",
    detail:
      "Cập nhật tiến độ, trao đổi bằng bình luận và gửi nhiệm vụ để giảng viên duyệt. Lịch sử trạng thái giúp theo dõi thay đổi.",
    does: ["Đọc yêu cầu và hạn nhiệm vụ", "Cập nhật tiến độ và gửi duyệt"],
    gets: "Kết quả được giảng viên xem xét",
    artifact: "Chi tiết nhiệm vụ",
    preview: (
      <ArtifactFacts
        facts={[
          "Bình luận và lịch sử gắn với nhiệm vụ thật",
          "Giảng viên quyết định hoàn thành hoặc yêu cầu làm lại",
        ]}
      />
    ),
  },
  {
    icon: Bot,
    name: "AI Mentor",
    summary: "Hỗ trợ học tập theo ngữ cảnh",
    phase: "Thực chiến",
    range: "03–05",
    detail:
      "Trao đổi với AI Mentor về dự án và công việc. Các gợi ý hỗ trợ bạn suy nghĩ và học tập; AI không thay giảng viên quyết định kết quả.",
    does: ["Đặt câu hỏi về công việc đang thực hiện", "Xem lại các cuộc hội thoại của mình"],
    gets: "Hướng dẫn tham khảo cho bước tiếp theo",
    artifact: "Cuộc hội thoại",
    preview: (
      <ArtifactFacts
        facts={[
          "Lịch sử hội thoại chỉ dành cho chủ sở hữu",
          "Khi dịch vụ chưa khả dụng, bạn có thể thử lại",
        ]}
      />
    ),
  },
  {
    icon: Check,
    name: "Đánh giá",
    summary: "Giảng viên chốt kết quả chính thức",
    phase: "Công nhận",
    range: "06–07",
    detail:
      "Giảng viên đánh giá theo tiêu chí và chốt điểm chính thức. AI có thể đưa gợi ý tham khảo, còn KPI và lương ảo dựa trên kết quả đã được xác nhận.",
    does: ["Đọc điểm và nhận xét đã chốt", "Theo dõi hiệu suất, KPI và lương ảo"],
    gets: "Kết quả đánh giá chính thức",
    artifact: "Đánh giá & KPI",
    preview: (
      <ArtifactFacts
        facts={[
          "Điểm AI đề xuất không tự trở thành điểm chính thức",
          "Lương ảo là giá trị trong chương trình, không phải bảng lương thực tế",
        ]}
      />
    ),
  },
  {
    icon: Award,
    name: "Chứng nhận",
    summary: "Tra cứu và chia sẻ chứng nhận",
    phase: "Công nhận",
    range: "06–07",
    detail:
      "Khi đáp ứng chính sách của chương trình và được cấp chứng nhận, bạn có thể tải PDF và chia sẻ liên kết xác minh công khai.",
    does: ["Kiểm tra trạng thái chứng nhận", "Tải PDF và mở liên kết xác minh"],
    gets: "Chứng nhận có mã xác minh",
    artifact: "Chứng nhận",
    preview: (
      <ArtifactFacts
        facts={[
          "Chứng nhận chỉ được cấp theo chính sách chương trình",
          "Liên kết công khai thể hiện cả trạng thái thu hồi",
        ]}
      />
    ),
  },
];

const PHASES: { name: string; range: string; from: number; to: number }[] = [
  { name: "Bắt đầu", range: "01–02", from: 0, to: 1 },
  { name: "Thực chiến", range: "03–05", from: 2, to: 4 },
  { name: "Công nhận", range: "06–07", from: 5, to: 6 },
];

/* ---------- Chi tiết một bước ---------- */

function StepDetail({ step }: { step: Step }) {
  return (
    <div className="mt-5 border-t-2 border-dashed border-ink/15 pt-5">
      <p className="text-sm leading-relaxed text-ink-soft">{step.detail}</p>

      <div className="mt-5 space-y-5">
        <div>
          <p className="font-hand text-lg leading-none text-blue">bạn làm</p>
          <ul className="mt-2.5 space-y-2">
            {step.does.map((item) => (
              <li
                key={item}
                className="flex gap-2.5 text-xs leading-relaxed text-ink-soft"
              >
                <Check
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue"
                  strokeWidth={3}
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-hand text-lg leading-none text-blue">bạn nhận</p>
          <p className="mt-2.5 flex gap-2.5 text-xs leading-relaxed text-ink-soft">
            <Check
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue"
              strokeWidth={3}
              aria-hidden="true"
            />
            {step.gets}
          </p>
        </div>
      </div>
    </div>
  );
}

function ArtifactPreview({ step }: { step: Step }) {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl border-2 border-dashed border-ink/25 bg-raised p-5"
    >
      {/* ink-soft: ink-faint on paper-raised fails AA (2.7:1) at 10-11px */}
      <p className="font-mono text-[10px] font-bold uppercase leading-none tracking-[0.18em] text-ink-soft">
        {step.artifact}
      </p>
      <div className="mt-3 h-[2px] rounded-full bg-ink/10" aria-hidden="true" />
      <div className="mt-4">{step.preview}</div>
    </div>
  );
}

/* ---------- Section ---------- */

export function Workflow() {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();
  const step = STEPS[active];

  return (
    <section
      id="workflow"
      className="relative scroll-mt-20 overflow-hidden border-t-2 border-ink/10 bg-paper py-20 lg:py-24"
      aria-label="Quy trình thực tập ảo"
    >
      <div
        aria-hidden="true"
        className="mask-fade-edges pointer-events-none absolute inset-0 bg-grid-paper opacity-70"
      />

      <div className="relative mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <FadeIn>
          <SectionHeading
            eyebrow="Mục lục hành trình"
            title="Quy trình"
            highlight="thực tập ảo"
            subtitle="Bảy bước, từ lúc bạn bước vào phòng phỏng vấn đến ngày nhận chứng nhận."
          />
        </FadeIn>

        <div className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-14">
          {/* Mục lục bước */}
          <div className="relative">
            <span
              aria-hidden="true"
              className="absolute bottom-[30px] left-[23px] top-0 w-0 border-l-2 border-dashed border-ink/20"
            />

            {PHASES.map((phase) => (
              <div key={phase.name}>
                <div className="flex items-baseline justify-between gap-4 py-3 pl-[64px] pr-1">
                  <h3 className="font-hand text-xl leading-none text-ink">
                    {phase.name}
                  </h3>
                  <p className="font-mono text-[11px] leading-none text-ink-soft">
                    {phase.range}
                  </p>
                </div>

                <ol>
                  {STEPS.slice(phase.from, phase.to + 1).map((item, offset) => {
                    const index = phase.from + offset;
                    const isActive = index === active;
                    const isDone = index < active;

                    return (
                      <li key={item.name} className="relative">
                        <motion.button
                          type="button"
                          onClick={() => setActive(index)}
                          onMouseEnter={() => setActive(index)}
                          aria-current={isActive ? "step" : undefined}
                          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: "-40px" }}
                          transition={{
                            duration: reduceMotion ? 0 : 0.5,
                            delay: reduceMotion ? 0 : index * 0.06,
                            ease: [0.21, 0.47, 0.32, 0.98],
                          }}
                          className="group flex w-full items-center gap-4 rounded-2xl py-2 pr-3 text-left"
                        >
                          <span
                            className={
                              isActive
                                ? "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-royal text-white ring-4 ring-blue-mist transition-all"
                                : isDone
                                  ? "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-ink text-paper transition-colors"
                                  : "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-ink/25 bg-raised text-ink-soft transition-all group-hover:-rotate-6 group-hover:border-blue group-hover:text-blue"
                            }
                          >
                            <item.icon
                              className="h-[19px] w-[19px]"
                              aria-hidden="true"
                            />
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline gap-2">
                              <span className="font-mono text-[11px] font-bold leading-none text-ink-soft">
                                {String(index + 1).padStart(2, "0")}
                              </span>
                              <span
                                className={
                                  "text-sm font-extrabold leading-none " +
                                  (isActive ? "text-blue" : "text-ink")
                                }
                              >
                                {item.name}
                              </span>
                            </span>
                            <span className="mt-1.5 block text-xs leading-relaxed text-ink-soft">
                              {item.summary}
                            </span>
                          </span>
                        </motion.button>

                        {isActive ? (
                          <div
                            className="pb-6 pl-[64px] lg:hidden"
                            aria-live="polite"
                          >
                            <StepDetail step={item} />
                            <div className="mt-5">
                              <ArtifactPreview step={item} />
                            </div>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </div>

          {/* Trang chi tiết dính băng dính */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <div className="sketch-card relative rotate-[0.5deg] p-7">
                <Tape className="-top-3 right-10" rotate={6} />
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={step.name}
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.25,
                      ease: [0.21, 0.47, 0.32, 0.98],
                    }}
                    aria-live="polite"
                  >
                    <div className="grid gap-8 sm:grid-cols-2">
                      <div>
                        <p className="font-mono text-[11px] font-bold leading-none text-ink-soft">
                          {step.range}
                        </p>
                        <h3 className="mt-2 text-lg font-extrabold leading-tight text-ink">
                          {step.phase}
                        </h3>
                        <span className="mt-4 block h-[3px] w-10 rounded-full bg-blue" />
                        <h4 className="mt-5 flex items-center gap-2.5 text-base font-extrabold text-ink">
                          <step.icon className="h-5 w-5 text-blue" aria-hidden="true" />
                          {step.name}
                        </h4>

                        <StepDetail step={step} />
                      </div>

                      <ArtifactPreview step={step} />
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
