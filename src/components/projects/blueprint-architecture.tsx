import { Panel } from '@/components/product/primitives';
const object = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};
const strings = (v: unknown): string[] => Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : [];
function List({ value }: { value: unknown }) {
  const items = strings(value);
  return items.length ? <ul className="min-w-0 list-disc space-y-2 pl-5 text-body text-muted-foreground">{items.map(item => <li className="[overflow-wrap:anywhere]" key={item}>{item}</li>)}</ul> : <p className="text-body text-muted-foreground">Mẫu này chưa bổ sung thông tin.</p>;
}
export function BlueprintArchitecture({ definition: d }: { definition: Record<string, unknown> }) {
  const architecture = object(d.architecture);
  const milestones = Array.isArray(d.milestones) ? d.milestones.map(object) : [];
  return <>
    {d.businessRules !== undefined && <Panel title="Quy tắc nghiệp vụ"><List value={d.businessRules} /></Panel>}
    {d.architecture !== undefined && <Panel title="Kiến trúc đề xuất">
      {typeof architecture.overview === 'string' && <p className="mb-4 text-body leading-relaxed text-foreground">{architecture.overview}</p>}
      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2"><div className="min-w-0"><h3 className="mb-2 text-body font-semibold">Dữ liệu & thực thể</h3><List value={architecture.entities} /></div><div className="min-w-0"><h3 className="mb-2 text-body font-semibold">API / hợp đồng dữ liệu</h3><List value={architecture.apiSuggestions} /></div><div className="min-w-0"><h3 className="mb-2 text-body font-semibold">Trang giao diện</h3><List value={architecture.frontendPages} /></div></div>
    </Panel>}
    {milestones.length > 0 && <Panel title="Mốc nghiệm thu"><ol className="grid gap-4 md:grid-cols-2">{milestones.map((m, index) => <li key={index} className="rounded-control border border-primary bg-accent/40 p-4"><p className="text-caption font-semibold text-primary">Ngày {typeof m.day === 'number' ? m.day : '—'}</p><h3 className="mt-1 font-semibold text-foreground">{typeof m.title === 'string' ? m.title : `Mốc ${index + 1}`}</h3><p className="mt-2 text-body text-muted-foreground">{typeof m.acceptance === 'string' ? m.acceptance : ''}</p><p className="mt-2 text-caption text-muted-foreground">Task: {strings(m.taskKeys).join(', ')}</p></li>)}</ol></Panel>}
    {typeof d.expectedOutcome === 'string' && <Panel title="Sản phẩm cuối"><p className="text-body leading-relaxed text-foreground">{d.expectedOutcome}</p></Panel>}
    {typeof d.documentation === 'string' && <Panel title="Hướng dẫn triển khai & bàn giao"><p className="whitespace-pre-wrap text-body leading-relaxed text-muted-foreground">{d.documentation}</p></Panel>}
  </>;
}
export function BlueprintTask({ value }: { value: unknown }) {
  const t = object(value), dependencies = strings(t.dependsOn);
  if (typeof t.title !== 'string') return null;
  return <details className="rounded-control bg-background p-3 text-body">
    <summary className="cursor-pointer font-medium text-foreground">{typeof t.key === 'string' ? `${t.key} · ` : ''}{t.title}</summary>
    <div className="mt-3 space-y-2 text-muted-foreground"><p>{typeof t.requirements === 'string' ? t.requirements : ''}</p><p className="text-caption">Vai trò: {String(t.role ?? '—')} · {typeof t.estimatedHours === 'number' ? `${t.estimatedHours} giờ` : 'Chưa ước tính'} · {String(t.priority ?? 'medium')} · {String(t.complexity ?? '—')}</p>{dependencies.length > 0 && <p className="text-caption">Phụ thuộc: {dependencies.join(', ')}</p>}{typeof t.expectedOutput === 'string' && <p>{t.expectedOutput}</p>}<List value={t.dod} />{strings(t.skillTags).length > 0 && <p className="text-caption">Kỹ năng: {strings(t.skillTags).join(', ')}</p>}</div>
  </details>;
}
