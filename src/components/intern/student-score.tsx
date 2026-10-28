import type { CSSProperties } from "react";

/** Explicit score text is the accessible equivalent of the decorative ring. */
export function StudentScore({
  value,
  label,
  tone = "blue",
}: {
  value: number | null;
  label: string;
  tone?: "blue" | "green" | "amber";
}) {
  const color = { blue: "#2563eb", green: "#059669", amber: "#d97706" }[tone];
  return (
    <div className="student-score">
      <div
        className="student-score-ring"
        style={
          {
            "--score": `${Math.max(0, Math.min(100, value ?? 0))}%`,
            "--score-color": color,
          } as CSSProperties
        }
      >
        <div>
          <strong>{value === null ? "—" : Number(value.toFixed(1))}</strong>
          <span>/100</span>
        </div>
      </div>
      <p>{label}</p>
    </div>
  );
}
