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
    <dl className="my-6 grid grid-cols-3 gap-3 border-y border-slate-200/80 py-5 sm:gap-8">
      {[
        ["Ghi nhận", total],
        ["Còn hiệu lực", active],
        ["Điểm phạt ghi nhận", registeredPenalty],
      ].map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs text-slate-500 sm:text-sm">{label}</dt>
          <dd className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
