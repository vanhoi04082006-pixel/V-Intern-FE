import { ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

import { SectionCard } from "./intern-primitives";
import type { InternNextStep } from "./data/intern-mock-data";

/**
 * Card "Quy trình tiếp theo" (state empty): 3 bước đánh số nối đường line
 * dọc — người thực tập mới biết chuyện gì sắp xảy ra sau khi được phân công.
 *
 * Round 2: gap bước + line-height điều khiển qua token `--iw-step-gap` /
 * `--iw-lead` (globals.css) để CẢ 3 bước luôn hiển thị cùng lúc trong
 * viewport desktop một màn hình (không scroll nội bộ). Card là hàng co giãn
 * (flex-1 min-h-0) của right rail.
 */
export function NextProcessCard({
  steps,
  className,
}: {
  steps: InternNextStep[];
  className?: string;
}) {
  return (
    <SectionCard
      id="quy-trinh-tiep-theo"
      icon={ListChecks}
      tone="blue"
      title="Quy trình tiếp theo"
      className={className}
      headerClassName="xl:px-4 xl:py-2"
      bodyClassName="p-4 sm:p-5 xl:px-4 xl:py-3"
    >
      {/* Desktop: nhịp bước cố định theo R01; connector dọc nối số.
          Ba bước hiển thị cùng lúc, không giãn kín chiều cao card. */}
      <ol className="relative flex flex-col gap-4 xl:gap-8">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          // Reference: bước 1 (sắp tới) đậm màu blue, các bước sau trung tính.
          const isNextUp = index === 0;

          return (
            <li
              key={step.order}
              className="relative flex gap-4 xl:min-h-0 xl:min-h-16"
            >
              {/*
                Đường nối dọc giữa các bước — chỉ vẽ khi không phải bước cuối,
                chạy từ dưới số hiện tại xuống đầu mục kế tiếp.
              */}
              <span
                aria-hidden="true"
                className="relative flex flex-col items-center"
              >
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full text-small font-bold",
                    isNextUp
                      ? "bg-primary text-primary-foreground shadow-app-xs"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {step.order}
                </span>
                {!isLast ? (
                  <span className="absolute top-8 -bottom-8 w-px bg-muted" />
                ) : null}
              </span>
              <div className="min-w-0 pb-1">
                <p className="text-body font-semibold leading-snug text-foreground">
                  {step.title}
                </p>
                <p className="mt-1 text-small leading-relaxed text-muted-foreground xl:text-caption xl:leading-[var(--iw-lead)]">
                  {step.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </SectionCard>
  );
}
