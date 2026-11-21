"use client";
import { InkCountUp } from "@/components/v-intern/motion";

/** The official value stays explicit; progress adds a quick visual comparison.
 *
 * v3 polish: điểm nguyên đếm dần bằng mực (InkCountUp) như sandbox — giá trị
 * cuối vẫn là điểm thật từ API. Điểm thập phân giữ nguyên độ chính xác (không
 * làm tròn để chạy animation — cùng quy tắc InkMetrics của member-performance);
 * null vẫn hiển thị "—". */
export function StudentScore({
  value,
  label,
  tone = "blue",
}: {
  value: number | null;
  label: string;
  tone?: "blue" | "green" | "amber";
}) {
  return (
    <div className="student-score" data-tone={tone}>
      <p>{label}</p>
      <div className="student-score-value">
        <strong>
          {value === null ? (
            "—"
          ) : Number.isInteger(value) ? (
            <InkCountUp value={value} />
          ) : (
            Number(value.toFixed(1))
          )}
        </strong>
        <span>/100</span>
      </div>
      {value !== null && <progress aria-label={label} value={Math.max(0, Math.min(100, value))} max={100} />}
    </div>
  );
}
