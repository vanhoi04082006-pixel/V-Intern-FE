/** The official value stays explicit; progress adds a quick visual comparison. */
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
        <strong>{value === null ? "—" : Number(value.toFixed(1))}</strong>
        <span>/100</span>
      </div>
      {value !== null && <progress aria-label={label} value={Math.max(0, Math.min(100, value))} max={100} />}
    </div>
  );
}
