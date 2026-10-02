import { ListChecks } from "lucide-react";

import { SectionCard } from "./intern-primitives";
import type { InternNextStep } from "./data/intern-mock-data";

/**
 * Card "Quy trình tiếp theo" (state empty): 3 bước đánh số nối đường line
 * dọc — người thực tập mới biết chuyện gì sắp xảy ra sau khi được phân công.
 */
export function NextProcessCard({ steps }: { steps: InternNextStep[] }) {
  return (
    <SectionCard
      id="quy-trinh-tiep-theo"
      icon={ListChecks}
      tone="blue"
      title="Quy trình tiếp theo"
    >
      <ol className="relative flex flex-col gap-5">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;

          return (
            <li key={step.order} className="relative flex gap-3.5">
              {/*
                Đường nối dọc giữa các bước — chỉ vẽ khi không phải bước cuối,
                chạy từ dưới số hiện tại xuống đầu mục kế tiếp.
              */}
              <span aria-hidden="true" className="relative flex flex-col items-center">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-blue-50 text-[13px] font-bold text-brand">
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
                <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
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
