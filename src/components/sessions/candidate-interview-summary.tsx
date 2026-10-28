const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const texts = (value: unknown): string[] => Array.isArray(value) ? value.filter((s): s is string => typeof s === 'string') : [];
const labels: Record<string, string> = { knowledge: 'Kiến thức', communication: 'Giao tiếp', problem_solving: 'Giải quyết vấn đề', english: 'Tiếng Anh', confidence: 'Sự tự tin', reasoning: 'Lập luận' };
export function CandidateInterviewSummary({ detail }: { detail: Record<string, unknown> }) {
  if (typeof detail.error === 'string') return <p role="alert" className="text-destructive">{detail.error}</p>;
  const result = object(detail.result);
  if (!Object.keys(result).length) return <p>Chưa có kết quả phỏng vấn.</p>;
  return <div className="space-y-3 text-body">
    {typeof result.feedback === 'string' && <p className="whitespace-pre-wrap">{result.feedback}</p>}
    {[['Điểm mạnh & kỹ năng', result.strengths], ['Cần cải thiện', result.weaknesses]].map(([label, value]) => <div key={String(label)}><h4 className="font-semibold">{String(label)}</h4><ul className="mt-1 list-inside list-disc">{texts(value).map((s, i) => <li key={i}>{s}</li>)}</ul></div>)}
    {Array.isArray(result.criteria) && <dl className="grid gap-2 sm:grid-cols-2">{result.criteria.map((value, i) => {
      const c = object(value);
      return typeof c.code === 'string' && typeof c.score === 'number' ? <div key={i} className="border-b border-border py-3"><dt className="font-semibold">{labels[c.code] ?? `Tiêu chí ${i + 1}`}: {c.score}/100</dt><dd className="mt-1 text-muted-foreground">{typeof c.feedback === 'string' ? c.feedback : ''}</dd></div> : null;
    })}</dl>}
    {typeof result.evaluatedAt === 'string' && <p className="text-caption text-muted-foreground">Đánh giá lúc {new Date(result.evaluatedAt).toLocaleString('vi-VN')}</p>}
  </div>;
}
