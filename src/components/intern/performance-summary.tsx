import { ChartColumn } from "lucide-react";
import { cn } from "@/lib/utils";

import { ProgressBar, SectionCard } from "./intern-primitives";
import { INTERN_TONES } from "./intern-ui-tones";
import type { InternWorkspaceState } from "./data/intern-mock-data";

/**
 * Dải "Hiệu suất thực tập (Sprint 01 – 03)" full-width cuối trang state
 * active — 6 metric tiles (reference): task hoàn thành, story points, điểm
 * review, KPI tạm tính, lương ảo, chứng nhận. Metric có `percent` hiển thị
 * progress bar mini; note màu semantic; value luôn dạng text (không chỉ màu).
 */
export function PerformanceSummary({
  performance,
}: {
  performance: Extract<
    InternWorkspaceState,
    { status: "active" }
  >["performance"];
}) {
  return (
    <SectionCard
      id="hieu-suat-thuc-tap"
      icon={ChartColumn}
      tone="blue"
      title={performance.title}
    >
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {performance.metrics.map((metric) => {
          const toneStyle = INTERN_TONES[metric.tone];
          const noteToneStyle = metric.noteTone
            ? INTERN_TONES[metric.noteTone]
            : undefined;
          const MetricIcon = metric.icon;

          return (
            <li
              key={metric.id}
              className="flex min-w-0 flex-col rounded-control border border-border bg-background p-4"
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-control bg-card",
                    toneStyle.icon
                  )}
                >
                  <MetricIcon className="size-4" />
                </span>
                <p className="min-w-0 truncate text-caption font-medium text-muted-foreground">
                  {metric.label}
                </p>
              </div>
              <p className="mt-2 text-section font-bold leading-tight tracking-tight text-foreground">
                {metric.value}
              </p>
              {typeof metric.percent === "number" ? (
                <ProgressBar
                  value={metric.percent}
                  tone={metric.tone}
                  className="mt-2"
                />
              ) : null}
              {metric.note ? (
                <p
                  className={cn(
                    "mt-2 text-caption font-semibold",
                    noteToneStyle?.icon ?? "text-muted-foreground"
                  )}
                >
                  {metric.note}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
