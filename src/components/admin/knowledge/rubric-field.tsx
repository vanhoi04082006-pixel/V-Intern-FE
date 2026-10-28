import { Plus, Trash2 } from 'lucide-react';
import { btn, Field, inputClass, InlineAlert } from '@/components/product/primitives';
import type { JsonValue } from '@/lib/api/knowledge';

type Criterion = { [key: string]: JsonValue; criterion: string; description: string; weight: number };
const isCriterion = (value: JsonValue): value is Criterion => !!value && typeof value === 'object' && !Array.isArray(value) && typeof value.criterion === 'string' && typeof value.description === 'string' && typeof value.weight === 'number';
export function RubricField({ value, onChange, disabled = false }: { value: JsonValue | undefined; onChange: (value: JsonValue) => void; disabled?: boolean }) {
  if (value !== undefined && (!Array.isArray(value) || value.length > 12 || !value.every(isCriterion))) return <InlineAlert tone="warning" title="Rubric cần kiểm tra định dạng"><p>Dữ liệu gốc vẫn được giữ. Bạn có thể bắt đầu lại phần rubric để dùng trình soạn.</p><details className="mt-2"><summary className="cursor-pointer">Xem rubric gốc</summary><pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all text-caption">{JSON.stringify(value, null, 2)}</pre></details><button type="button" disabled={disabled} className={`${btn('secondary', 'sm')} mt-3`} onClick={() => onChange([])}>Đặt lại rubric</button></InlineAlert>;
  const rows = (value ?? []) as Criterion[], total = rows.reduce((sum, row) => sum + row.weight, 0);
  const update = (index: number, patch: Partial<Criterion>) => onChange(rows.map((row, i) => i === index ? { ...row, ...patch } as Criterion : row));
  return <fieldset disabled={disabled} className="space-y-4">
    <legend className="text-body font-semibold text-foreground">Rubric và trọng số</legend>
    <div><div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-body"><p>Mỗi tiêu chí cần mô tả bằng chứng để cho điểm.</p><strong className={total === 100 ? 'text-success' : 'text-warning'}>{total}% / 100%</strong></div><progress className="h-1.5 w-full accent-sky-600" aria-label="Tổng trọng số rubric" value={Math.min(100, Math.max(0, total))} max={100} /></div>
    {rows.map((row, index) => <div key={index} className="space-y-3 border-t border-border py-4">
      <div className="flex items-start gap-3"><Field className="min-w-0 flex-1" label={`Tiêu chí ${index + 1}`} htmlFor={`criterion-${index}`}><input id={`criterion-${index}`} className={inputClass} maxLength={120} value={row.criterion} onChange={e => update(index, { criterion: e.target.value })} /></Field><Field className="w-28 shrink-0" label={`Trọng số ${index + 1} (%)`} htmlFor={`weight-${index}`}><input id={`weight-${index}`} className={inputClass} type="number" min={0} max={100} step={1} value={row.weight} onChange={e => update(index, { weight: e.target.value === '' ? 0 : Number(e.target.value) })} /></Field><button type="button" className={`${btn('ghost', 'icon')} mt-6`} aria-label={`Xóa tiêu chí ${index + 1}`} onClick={() => onChange(rows.filter((_, i) => i !== index))}><Trash2 size={16} aria-hidden /></button></div>
      <Field label={`Mô tả tiêu chí ${index + 1}`} htmlFor={`criterion-description-${index}`}><textarea id={`criterion-description-${index}`} className={inputClass} rows={2} maxLength={1000} value={row.description} onChange={e => update(index, { description: e.target.value })} /></Field>
    </div>)}
    <button type="button" className={btn('secondary', 'sm')} disabled={rows.length >= 12} onClick={() => onChange([...rows, { criterion: '', description: '', weight: 0 }])}><Plus size={14} aria-hidden />Thêm tiêu chí</button>
  </fieldset>;
}
