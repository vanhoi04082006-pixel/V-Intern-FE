import type { CareerRole } from '@/lib/api/career-roles';
import { knowledgeAudiences, knowledgePurposes, type KnowledgeDraft } from '@/lib/api/knowledge';
import { Field, inputClass } from '@/components/product/primitives';
import { audienceLabels, audienceHints, gradingKind, purposeLabels } from './presentation';
import { TextListField } from './text-list-field';

const toggle = <T,>(values: T[], value: T) => values.includes(value) ? values.filter(item => item !== value) : [...values, value];
export function KnowledgeScopeEditor({ draft, onChange, careers, disabled }: { draft: KnowledgeDraft; onChange: (draft: KnowledgeDraft) => void; careers: CareerRole[]; disabled: boolean }) {
  const missingRoles = draft.roleCodes.filter(code => !careers.some(role => role.code === code));
  return <fieldset disabled={disabled} className="min-w-0 space-y-6">
    <Field label="Phạm vi nội dung" htmlFor="knowledge-audience" hint={audienceHints[draft.audience]}><select id="knowledge-audience" className={inputClass} value={draft.audience} disabled={disabled || gradingKind(draft.kind)} onChange={e => onChange({ ...draft, audience: e.target.value as KnowledgeDraft['audience'] })}>{knowledgeAudiences.map(value => <option key={value} value={value}>{audienceLabels[value]}</option>)}</select></Field>
    {gradingKind(draft.kind) && <p className="text-xs leading-5 text-slate-500">Q&A, lời giải và rubric luôn nằm trong phạm vi riêng cho chấm.</p>}
    <fieldset className="space-y-3"><legend className="mb-2 text-sm font-semibold text-navy">Mục đích sử dụng</legend>{knowledgePurposes.map(value => <label key={value} className="flex min-h-9 cursor-pointer items-start gap-2 text-sm leading-6 text-slate-600"><input className="mt-1 size-4 shrink-0 accent-blue-600" type="checkbox" checked={draft.purposes.includes(value)} onChange={() => onChange({ ...draft, purposes: toggle(draft.purposes, value) })} />{purposeLabels[value]}</label>)}</fieldset>
    <fieldset className="space-y-3 border-t border-slate-200 pt-5"><legend className="text-sm font-semibold text-navy">Nghề liên quan</legend><p className="text-xs leading-5 text-slate-500">Không chọn nghề: nội dung dùng chung. Đây không phải quyền đọc mọi dữ liệu.</p><div className="max-h-64 space-y-1 overflow-y-auto">{careers.map(role => <label key={role.code} className="flex min-h-10 items-start gap-2 text-sm leading-6 text-slate-600"><input className="mt-1 size-4 shrink-0 accent-blue-600" type="checkbox" checked={draft.roleCodes.includes(role.code)} onChange={() => onChange({ ...draft, roleCodes: toggle(draft.roleCodes, role.code) })} /><span>{role.name}{role.status === 'archived' && <span className="block text-xs text-slate-400">Đã đóng tuyển</span>}</span></label>)}{missingRoles.map(code => <label key={code} className="flex min-h-10 items-center gap-2 text-sm"><input className="size-4 accent-blue-600" type="checkbox" checked onChange={() => onChange({ ...draft, roleCodes: draft.roleCodes.filter(value => value !== code) })} /><span className="break-all">{code} <span className="text-slate-500">· Chưa tải được tên nghề</span></span></label>)}</div></fieldset>
    <div className="border-t border-slate-200 pt-5"><TextListField id="knowledge-tags" label="Nhãn tìm kiếm" value={draft.tags} onChange={tags => onChange({ ...draft, tags })} max={30} maxLength={80} disabled={disabled} /></div>
  </fieldset>;
}
