import { Plus, Trash2 } from 'lucide-react';
import { btn, Field, inputClass, InlineAlert } from '@/components/product/primitives';
import type { JsonValue } from '@/lib/api/knowledge';

export function TextListField({ label, id, value, onChange, max = 20, maxLength = 1000, hint, disabled = false }: {
  label: string; id: string; value: JsonValue | undefined; onChange: (value: string[]) => void;
  max?: number; maxLength?: number; hint?: string; disabled?: boolean;
}) {
  const supported = value === undefined || (Array.isArray(value) && value.length <= max && value.every(item => typeof item === 'string'));
  if (!supported) return <InlineAlert tone="warning" title={`${label}: định dạng cần kiểm tra`}>
    <p>Giữ nguyên dữ liệu gốc khi lưu. Trình soạn hỗ trợ tối đa {max} mục văn bản.</p>
    <details className="mt-2"><summary className="cursor-pointer">Xem dữ liệu đang có</summary><pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all text-xs">{JSON.stringify(value, null, 2)}</pre></details>
    <button type="button" className={`${btn('secondary', 'sm')} mt-3`} disabled={disabled} onClick={() => onChange([])}>Đặt lại {label.toLowerCase()}</button>
  </InlineAlert>;
  const values = (value ?? []) as string[];
  return <fieldset className="min-w-0 space-y-3" disabled={disabled}>
    <legend className="text-sm font-semibold text-navy">{label}</legend>
    {hint && <p className="text-xs leading-5 text-slate-500">{hint}</p>}
    {values.map((text, index) => <div key={index} className="flex items-start gap-2">
      <Field label={`${label} ${index + 1}`} htmlFor={`${id}-${index}`} className="min-w-0 flex-1"><textarea id={`${id}-${index}`} className={inputClass} rows={2} maxLength={maxLength} value={text} onChange={e => onChange(values.map((item, i) => i === index ? e.target.value : item))} /></Field>
      <button type="button" className={`${btn('ghost', 'icon')} mt-6 text-slate-500 hover:text-rose-700`} aria-label={`Xóa ${label.toLowerCase()} ${index + 1}`} onClick={() => onChange(values.filter((_, i) => i !== index))}><Trash2 size={16} aria-hidden /></button>
    </div>)}
    <button type="button" className={btn('secondary', 'sm')} disabled={values.length >= max} onClick={() => onChange([...values, ''])}><Plus size={14} aria-hidden />Thêm {label.toLowerCase()}</button>
    {values.length >= max && <p className="text-xs text-slate-500">Đã đạt giới hạn {max} mục.</p>}
  </fieldset>;
}
