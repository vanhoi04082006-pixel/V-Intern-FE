import { Plus, Trash2 } from 'lucide-react';
import { btn, Field, inputClass } from '@/components/product/primitives';
import type { KnowledgeSource } from '@/lib/api/knowledge';

export function KnowledgeSourcesEditor({ sources, onChange, disabled }: { sources: KnowledgeSource[]; onChange: (sources: KnowledgeSource[]) => void; disabled: boolean }) {
  const update = (index: number, patch: Partial<KnowledgeSource>) => onChange(sources.map((source, i) => i === index ? { ...source, ...patch } : source));
  return <fieldset disabled={disabled} className="space-y-5">
    <legend className="sr-only">Nguồn tham khảo</legend>
    <p className="text-sm leading-6 text-slate-600">Mỗi nguồn có tên và URL HTTPS hoặc tham chiếu tài liệu. Có thể lưu nháp chưa có nguồn; cần nguồn có ý nghĩa trước khi xuất bản.</p>
    {sources.map((source, index) => <div key={index} className="space-y-3 border-t border-slate-200 pt-4">
      <div className="flex items-start gap-2"><Field label={`Tên nguồn ${index + 1}`} htmlFor={`source-title-${index}`} className="min-w-0 flex-1"><input id={`source-title-${index}`} className={inputClass} maxLength={200} value={source.title} onChange={e => update(index, { title: e.target.value })} /></Field><button type="button" className={`${btn('ghost', 'icon')} mt-6`} aria-label={`Xóa nguồn ${index + 1}`} onClick={() => onChange(sources.filter((_, i) => i !== index))}><Trash2 size={16} aria-hidden /></button></div>
      <div className="grid gap-3 md:grid-cols-2"><Field label={`URL nguồn ${index + 1}`} htmlFor={`source-url-${index}`} hint="Chỉ HTTPS, không kèm tài khoản/mật khẩu trong URL."><input id={`source-url-${index}`} className={inputClass} type="url" maxLength={2000} value={source.url ?? ''} onChange={e => update(index, { url: e.target.value })} /></Field><Field label={`Tham chiếu nguồn ${index + 1}`} htmlFor={`source-ref-${index}`} hint="Ví dụ: tên tài liệu nội bộ, chương hoặc mục tham khảo."><textarea id={`source-ref-${index}`} className={inputClass} rows={2} maxLength={1000} value={source.reference ?? ''} onChange={e => update(index, { reference: e.target.value })} /></Field></div>
    </div>)}
    <button type="button" className={btn('secondary', 'sm')} disabled={sources.length >= 20} onClick={() => onChange([...sources, { title: '' }])}><Plus size={14} aria-hidden />Thêm nguồn</button>
  </fieldset>;
}
