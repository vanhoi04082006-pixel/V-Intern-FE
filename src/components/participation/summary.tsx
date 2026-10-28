export function ParticipationSummary({
  total,
  active,
  registeredPenalty,
}: {
  total: number;
  active: number;
  registeredPenalty: number;
}) {
  return (
    <dl className="my-6 grid grid-cols-3 gap-3 border-y border-border py-5 sm:gap-8">
      {[
        ["Ghi nhận", total],
        ["Còn hiệu lực", active],
        ["Điểm phạt ghi nhận", registeredPenalty],
      ].map(([label, value]) => (
        <div key={label}>
          <dt className="text-caption text-muted-foreground sm:text-body">{label}</dt>
          <dd className="mt-2 text-metric font-semibold tabular-nums text-foreground">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
