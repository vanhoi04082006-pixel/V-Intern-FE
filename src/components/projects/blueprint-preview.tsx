import { BlueprintArchitecture, BlueprintTask } from './blueprint-architecture';
import { parseRoleDetail } from '@/lib/api/templates';
import { Panel } from '@/components/product/primitives';
const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
function List({ value }: { value: unknown }) { const items = Array.isArray(value) ? value.filter((s): s is string => typeof s === 'string') : []; return items.length ? <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">{items.map((text, index) => <li className="[overflow-wrap:anywhere]" key={index}>{text}</li>)}</ul> : <p className="text-xs text-slate-500">Chưa khai báo.</p>; }
/** Read-only view also works for immutable historic session definitions. */
export function BlueprintPreview({ definition: d }: { definition: Record<string, unknown> }) {
  const objectives = object(d.objectives), outputs = object(d.expectedOutputs), acceptance = object(d.acceptance);
  return <div className="space-y-4">
    {typeof d.description === 'string' && <p className="text-sm leading-relaxed text-slate-600">{d.description}</p>}
    <Panel title="Mục tiêu & phạm vi">{typeof objectives.business === 'string' && <p className="mb-3 text-sm">{objectives.business}</p>}<div className="grid min-w-0 gap-4 sm:grid-cols-2">{[['Học tập', objectives.learning], ['Sản phẩm', objectives.product], ['Trong phạm vi', d.scopeIn], ['Ngoài phạm vi', d.scopeOut]].map(([title, value]) => <div className="min-w-0" key={String(title)}><h3 className="mb-2 text-sm font-semibold">{String(title)}</h3><List value={value} /></div>)}</div></Panel>
    <Panel title="Vai trò và kỹ năng"><ul className="space-y-3">{Array.isArray(d.roleDetails) ? d.roleDetails.map((raw, index) => { const role = parseRoleDetail(raw); return <li key={index} className="rounded-lg bg-slate-50 p-3 text-sm"><h3 className="font-semibold">{role.title ?? role.code} · {role.countMin ?? 1}–{role.countMax ?? 1} người</h3><List value={role.responsibilities} /><p className="mt-2 text-xs text-slate-500">Kỹ năng: {role.requiredSkills.join(', ')} · Nên có: {role.recommendedSkills.join(', ')}</p></li>; }) : <List value={d.roles} />}</ul></Panel>
    <Panel title="Yêu cầu"><h3 className="mb-2 text-sm font-semibold">Chức năng</h3><List value={d.functionalRequirements} /><h3 className="mb-2 mt-4 text-sm font-semibold">Phi chức năng</h3><List value={d.nonFunctionalRequirements} /></Panel>
    <Panel title="Sprint & task mẫu"><div className="space-y-4">{Array.isArray(d.sprints) && d.sprints.map((raw, index) => { const s = object(raw); return <div className="space-y-2" key={index}><h3 className="text-sm font-semibold">{typeof s.name === 'string' ? s.name : `Sprint ${index + 1}`} · {typeof s.durationDays === 'number' ? `${s.durationDays} ngày` : ''}</h3>{typeof s.goal === 'string' && <p className="text-sm text-slate-500">{s.goal}</p>}{Array.isArray(s.tasks) && s.tasks.map((task, taskIndex) => <BlueprintTask key={taskIndex} value={task} />)}</div>; })}</div></Panel>
    <BlueprintArchitecture definition={d} />
    <Panel title="Bàn giao & nghiệm thu">{[['Sản phẩm bàn giao', outputs.deliverables], ['Bằng chứng', outputs.artifacts], ['Hoàn thành', acceptance.definitionOfDone ?? d.dod], ['Quality gates', acceptance.qualityGates]].map(([title, value]) => <div className="mb-3" key={String(title)}><h3 className="mb-2 text-sm font-semibold">{String(title)}</h3><List value={value} /></div>)}</Panel>
  </div>;
}
