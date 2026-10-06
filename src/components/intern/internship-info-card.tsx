import { ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";

import { SectionCard, StatusBadge } from "./intern-primitives";
import { INTERN_TONES } from "./intern-ui-tones";
import type { InternInfoRow } from "./data/intern-mock-data";

/**
 * Card "Thông tin thực tập" (state empty): từng dòng label → chip giá trị.
 * Trạng thái chưa phân công hiển thị chip xám/amber — không chỉ dựa màu,
 * chữ value đã nói rõ ("Chưa được phân công", "Chờ phân công").
 *
 * Round 2: chiều cao dòng điều khiển qua token `--iw-row-py` (globals.css)
 * để 6 dòng gọn trong viewport desktop một màn hình.
 */
export function InternshipInfoCard({
  rows,
  className,
}: {
  rows: InternInfoRow[];
  className?: string;
}) {
  return (
    <SectionCard
      id="thong-tin-thuc-tap"
      icon={rows[0]?.icon ?? ListTodo}
      tone="blue"
      title="Thông tin thực tập"
      className={className}
      headerClassName="xl:px-4 xl:py-2"
      bodyClassName="p-4 sm:p-5 xl:px-4 xl:py-2.5"
    >
      <dl className="flex flex-col divide-y divide-slate-100">
        {rows.map((row) => {
          const toneStyle = INTERN_TONES[row.tone];
          const RowIcon = row.icon;

          return (
            <div
              key={row.id}
              className="flex items-center justify-between gap-3 py-[var(--iw-row-py)] first:pt-0 last:pb-0"
            >
              <dt className="flex min-w-0 items-center gap-2.5 text-[13px] font-medium text-slate-500">
                <RowIcon
                  className="size-4 shrink-0 text-slate-400"
                  aria-hidden="true"
                />
                <span className="truncate">{row.label}</span>
              </dt>
              <dd className="min-w-0">
                <StatusBadge tone={row.tone} withDot={row.tone !== "blue"}>
                  <RowIcon
                    className={cn("size-3.5 shrink-0", toneStyle.icon)}
                    aria-hidden="true"
                  />
                  <span className="max-w-[180px] truncate">{row.value}</span>
                </StatusBadge>
              </dd>
            </div>
          );
        })}
      </dl>
    </SectionCard>
  );
}
