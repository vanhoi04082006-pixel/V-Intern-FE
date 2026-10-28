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
    <ul className="space-y-4">
      {facts.map((f) => (
        <li
          key={f}
          className="flex items-start gap-3 rounded-lg bg-accent/60 p-3 text-xs leading-relaxed text-muted-foreground"
        >
          <CircleCheck size={16} className="shrink-0 text-brand" />
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
    does: [
      "Theo dõi trạng thái chờ phân công",
      "Đọc thông tin dự án được giao",
    ],
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
    does: [
      "Xem mục tiêu và thời gian Sprint",
      "Theo dõi các cột trạng thái nhiệm vụ",
    ],
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
    does: [
      "Đặt câu hỏi về công việc đang thực hiện",
      "Xem lại các cuộc hội thoại của mình",
    ],
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
    does: [
      "Đọc điểm và nhận xét đã chốt",
      "Theo dõi hiệu suất, KPI và lương ảo",
    ],
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

/* ---------- Detail ---------- */

function StepDetail({ step }: { step: Step }) {
  return (
    <div className="mt-5 border-t border-border/80 pt-5">
      <p className="text-sm leading-relaxed text-muted-foreground">{step.detail}</p>

      <div className="mt-5 space-y-5">
        <div>
          <p className="text-xs font-bold text-navy">Bạn làm</p>
          <ul className="mt-2.5 space-y-2">
            {step.does.map((item) => (
              <li
                key={item}
                className="flex gap-2 text-xs leading-relaxed text-muted-foreground"
              >
                <Check
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand"
                  strokeWidth={3}
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-bold text-navy">Bạn nhận</p>
          <p className="mt-2.5 flex gap-2 text-xs leading-relaxed text-muted-foreground">
            <Check
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand"
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
      className="rounded-2xl bg-card p-5 ring-1 ring-border"
    >
      <p className="font-mono text-[10px] uppercase leading-none tracking-[0.18em] text-muted-foreground">
        {step.artifact}
      </p>
      <div className="mt-3 h-px bg-border" aria-hidden="true" />
      <div className="mt-3.5">{step.preview}</div>
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
      className="bg-card py-20 scroll-mt-20"
      aria-label="Quy trình thực tập ảo"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <FadeIn>
          <SectionHeading
            title="Quy trình thực tập ảo"
            subtitle="Bảy bước, từ lúc bạn bước vào phòng phỏng vấn đến ngày nhận chứng nhận."
          />
        </FadeIn>

        <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-16">
          <div className="relative">
            <span
              aria-hidden="true"
              className="absolute bottom-[30px] left-[22px] top-0 w-px bg-border"
            />

            {PHASES.map((phase) => (
              <div key={phase.name}>
                <div className="flex items-baseline justify-between gap-4 py-3 pl-[60px] pr-1">
                  <h3 className="text-xs font-bold leading-none text-navy">
                    {phase.name}
                  </h3>
                  <p className="font-mono text-[11px] leading-none text-muted-foreground">
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
                          className="group flex w-full items-center gap-4 rounded-2xl py-2 pr-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent0 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                        >
                          <span
                            className={
                              isActive
                                ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy text-white ring-4 ring-accent"
                                : isDone
                                  ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-colors"
                                  : "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-card text-muted-foreground ring-1 ring-border transition-colors group-hover:text-brand group-hover:ring-brand/60"
                            }
                          >
                            <item.icon
                              className="h-[18px] w-[18px]"
                              aria-hidden="true"
                            />
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline gap-2">
                              <span className="font-mono text-[11px] leading-none text-muted-foreground">
                                {String(index + 1).padStart(2, "0")}
                              </span>
                              <span
                                className={
                                  isActive
                                    ? "text-sm font-bold leading-none text-navy"
                                    : "text-sm font-bold leading-none text-foreground"
                                }
                              >
                                {item.name}
                              </span>
                            </span>
                            <span
                              className={
                                isActive
                                  ? "mt-1.5 block text-xs leading-relaxed text-muted-foreground"
                                  : "mt-1.5 block text-xs leading-relaxed text-muted-foreground"
                              }
                            >
                              {item.summary}
                            </span>
                          </span>
                        </motion.button>

                        {isActive ? (
                          <div
                            className="pb-6 pl-[60px] lg:hidden"
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

          <div className="hidden lg:block">
            <div className="sticky top-24 rounded-3xl bg-gradient-to-br from-accent to-card p-7 ring-1 ring-border/80">
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
                      <p className="font-mono text-[11px] leading-none text-muted-foreground">
                        {step.range}
                      </p>
                      <h3 className="mt-2 text-lg font-bold leading-tight text-navy">
                        {step.phase}
                      </h3>
                      <span className="mt-4 block h-px w-10 bg-brand" />
                      <h4 className="mt-5 text-base font-bold text-navy">
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
    </section>
  );
}
