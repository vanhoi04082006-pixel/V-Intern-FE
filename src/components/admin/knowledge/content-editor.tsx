import { Field, inputClass, InlineAlert, btn } from '@/components/product/primitives';
import type { JsonValue, KnowledgeDraft } from '@/lib/api/knowledge';
import { TextListField } from './text-list-field';
import { RubricField } from './rubric-field';

export function KnowledgeContentEditor({ draft, onChange, disabled }: { draft: KnowledgeDraft; onChange: (body: KnowledgeDraft['body']) => void; disabled: boolean }) {
  const { body, kind } = draft;
  const set = (key: string, value: JsonValue) => onChange({ ...body, [key]: value });
  const keys = kind === 'qa' ? ['question', 'expectedConcepts', 'validAnswers', 'exampleAnswer', 'commonMistakes', 'followUps', 'weakAnswerExamples', 'rubric'] : kind === 'rubric' ? ['guidance', 'rubric'] : ['markdown'];
  const extras = Object.keys(body).filter(key => !keys.includes(key));
  const text = (key: string, label: string, maxLength: number, rows = 3) => <Field label={label} htmlFor={`knowledge-${key}`}>
    {body[key] !== undefined && typeof body[key] !== 'string' ? <InlineAlert tone="warning" title="Giữ nguyên dữ liệu gốc"><pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all text-xs">{JSON.stringify(body[key], null, 2)}</pre><button className={`${btn('secondary', 'sm')} mt-2`} type="button" disabled={disabled} onClick={() => set(key, '')}>Đặt lại {label.toLowerCase()}</button></InlineAlert>
      : <textarea id={`knowledge-${key}`} className={inputClass} rows={rows} maxLength={maxLength} disabled={disabled} value={typeof body[key] === 'string' ? body[key] : ''} onChange={e => set(key, e.target.value)} />}
  </Field>;
  return <div className="min-w-0 space-y-7">
    {extras.length > 0 && <InlineAlert tone="warning" title="Bản nháp có trường bổ sung"><p>Những trường này vẫn được giữ khi lưu: {extras.join(', ')}. Cấu trúc xuất bản không nhận các trường bổ sung.</p><details><summary className="mt-2 cursor-pointer">Xem trước khi loại bỏ</summary><pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all text-xs">{JSON.stringify(Object.fromEntries(extras.map(key => [key, body[key]])), null, 2)}</pre></details><button type="button" disabled={disabled} className={`${btn('secondary', 'sm')} mt-3`} onClick={() => onChange(Object.fromEntries(keys.filter(key => body[key] !== undefined).map(key => [key, body[key]])))}>Bỏ các trường bổ sung khỏi bản đang soạn</button></InlineAlert>}
    {kind === 'qa' ? <>
      {text('question', 'Câu hỏi', 4000)}
      <TextListField label="Ý chính mong đợi" id="concepts" maxLength={200} value={body.expectedConcepts} onChange={value => set('expectedConcepts', value)} disabled={disabled} hint="Những năng lực cần nhận diện, không yêu cầu học thuộc nguyên văn." />
      <TextListField label="Cách trả lời đúng" id="valid-answers" max={8} maxLength={4000} value={body.validAnswers} onChange={value => set('validAnswers', value)} disabled={disabled} hint="Cần ít nhất hai cách trả lời đúng khác nhau khi xuất bản. Mỗi ô có thể viết nhiều dòng." />
      {text('exampleAnswer', 'Câu trả lời minh họa', 4000, 4)}
      <div className="grid gap-7 xl:grid-cols-2"><TextListField label="Lỗi thường gặp" id="mistakes" maxLength={500} value={body.commonMistakes} onChange={value => set('commonMistakes', value)} disabled={disabled} /><TextListField label="Câu hỏi đào sâu" id="follow-ups" max={8} maxLength={1000} value={body.followUps} onChange={value => set('followUps', value)} disabled={disabled} /></div>
      <TextListField label="Ví dụ chưa đạt" id="weak-answers" max={8} maxLength={2000} value={body.weakAnswerExamples} onChange={value => set('weakAnswerExamples', value)} disabled={disabled} />
      <RubricField value={body.rubric} onChange={value => set('rubric', value)} disabled={disabled} />
    </> : kind === 'rubric' ? <>{text('guidance', 'Hướng dẫn chấm', 4000, 4)}<RubricField value={body.rubric} onChange={value => set('rubric', value)} disabled={disabled} /></>
      : <>{text('markdown', 'Nội dung Markdown', 40000, 14)}<p className="text-xs leading-5 text-slate-500">Có thể dùng đoạn văn, tiêu đề, danh sách và khối mã. Bản xem trước không thực thi HTML hoặc ảnh nhúng.</p></>}
  </div>;
}
