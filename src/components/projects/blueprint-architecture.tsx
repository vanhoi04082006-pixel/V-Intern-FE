import { Panel } from '@/components/product/primitives';
const object = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};
const strings = (v: unknown): string[] => Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : [];
function List({ value }: { value: unknown }) {
  const items = strings(value);
  return items.length ? <ul className="min-w-0 list-disc space-y-2 pl-5 text-sm text-slate-600">{items.map(item => <li className="[overflow-wrap:anywhere]" key={item}>{item}</li>)}</ul> : <p className="text-sm text-slate-500">Mẫu này chưa bổ sung thông tin.</p>;
}
export function BlueprintArchitecture({ definition: d }: { definition: Record<string, unknown> }) {
  const architecture = object(d.architecture);
  const milestones = Array.isArray(d.milestones) ? d.milestones.map(object) : [];
  return <>
    {d.businessRules !== undefined && <Panel title="Quy tắc nghiệp vụ"><List value={d.businessRules} /></Panel>}
    {d.architecture !== undefined && <Panel title="Kiến trúc đề xuất">
      {typeof architecture.overview === 'string' && <p className="mb-4 text-sm leading-relaxed text-slate-700">{architecture.overview}</p>}
      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2"><div className="min-w-0"><h3 className="mb-2 text-sm font-semibold">Dữ liệu & thực thể</h3><List value={architecture.entities} /></div><div className="min-w-0"><h3 className="mb-2 text-sm font-semibold">API / hợp đồng dữ liệu</h3><List value={architecture.apiSuggestions} /></div><div className="min-w-0"><h3 className="mb-2 text-sm font-semibold">Trang giao diện</h3><List value={architecture.frontendPages} /></div></div>
    </Panel>}
    {milestones.length > 0 && <Panel title="Mốc nghiệm thu"><ol className="grid gap-4 md:grid-cols-2">{milestones.map((m, index) => <li key={index} className="rounded-xl border border-blue-100 bg-blue-50/40 p-4"><p className="text-xs font-semibold text-blue-600">Ngày {typeof m.day === 'number' ? m.day : '—'}</p><h3 className="mt-1 font-semibold text-slate-900">{typeof m.title === 'string' ? m.title : `Mốc ${index + 1}`}</h3><p className="mt-2 text-sm text-slate-600">{typeof m.acceptance === 'string' ? m.acceptance : ''}</p><p className="mt-2 text-xs text-slate-500">Task: {strings(m.taskKeys).join(', ')}</p></li>)}</ol></Panel>}
    {typeof d.expectedOutcome === 'string' && <Panel title="Sản phẩm cuối"><p className="text-sm leading-relaxed text-slate-700">{d.expectedOutcome}</p></Panel>}
    {typeof d.documentation === 'string' && <Panel title="Hướng dẫn triển khai & bàn giao"><p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{d.documentation}</p></Panel>}
  </>;
}
export function BlueprintTask({ value }: { value: unknown }) {
  const t = object(value), dependencies = strings(t.dependsOn);
  if (typeof t.title !== 'string') return null;
  return <details className="rounded-lg bg-slate-50 p-3 text-sm">
    <summary className="cursor-pointer font-medium text-slate-800">{typeof t.key === 'string' ? `${t.key} · ` : ''}{t.title}</summary>
    <div className="mt-3 space-y-2 text-slate-600"><p>{typeof t.requirements === 'string' ? t.requirements : ''}</p><p className="text-xs">Vai trò: {String(t.role ?? '—')} · {typeof t.estimatedHours === 'number' ? `${t.estimatedHours} giờ` : 'Chưa ước tính'} · {String(t.priority ?? 'medium')} · {String(t.complexity ?? '—')}</p>{dependencies.length > 0 && <p className="text-xs">Phụ thuộc: {dependencies.join(', ')}</p>}{typeof t.expectedOutput === 'string' && <p>{t.expectedOutput}</p>}<List value={t.dod} />{strings(t.skillTags).length > 0 && <p className="text-xs">Kỹ năng: {strings(t.skillTags).join(', ')}</p>}</div>
  </details>;
}
