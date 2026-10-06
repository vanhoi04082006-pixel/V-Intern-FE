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
      bodyClassName="p-4 sm:p-5 xl:px-4 xl:py-2.5"
    >
      {/* Desktop: ol cao full body, từng bước flex-1 → connector dọc kéo
          dài theo, 3 bước phân bổ đều và luôn hiển thị cùng lúc. */}
      <ol className="relative flex flex-col gap-[var(--iw-step-gap)] xl:h-full">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          // Reference: bước 1 (sắp tới) đậm màu blue, các bước sau trung tính.
          const isNextUp = index === 0;

          return (
            <li
              key={step.order}
              className="relative flex gap-3.5 xl:min-h-0 xl:flex-1"
            >
              {/*
                Đường nối dọc giữa các bước — chỉ vẽ khi không phải bước cuối,
                chạy từ dưới số hiện tại xuống đầu mục kế tiếp.
              */}
              <span aria-hidden="true" className="relative flex flex-col items-center">
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full text-[13px] font-bold",
                    isNextUp
                      ? "bg-brand text-white shadow-sm"
                      : "bg-slate-100 text-slate-500"
                  )}
                >
                  {step.order}
                </span>
                {!isLast ? (
                  <span className="mt-1 w-px flex-1 bg-slate-200" />
                ) : null}
              </span>
              <div className="min-w-0 pb-0.5">
                <p className="text-sm font-semibold leading-snug text-navy">
                  {step.title}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-500 xl:text-xs xl:leading-[var(--iw-lead)]">
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
