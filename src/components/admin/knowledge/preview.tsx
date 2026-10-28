import type { ReactNode } from 'react';
import type { JsonValue, KnowledgeDraft } from '@/lib/api/knowledge';
import { audienceHints, audienceLabels, kindLabels, purposeLabels } from './presentation';

/** Readable subset, rendered as React text. No HTML, embedded requests or executable links. */
function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n'), blocks: ReactNode[] = [];
  for (let i = 0; i < lines.length;) {
    if (!lines[i].trim()) { i++; continue; }
    const start = i;
    if (lines[i].startsWith('```')) {
      const code: string[] = []; i++;
      while (i < lines.length && !lines[i].startsWith('```')) code.push(lines[i++]);
      if (i < lines.length) i++;
      blocks.push(<pre key={start} className="max-w-full overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs leading-6 text-slate-100"><code>{code.join('\n')}</code></pre>);
    } else if (/^#{1,6}\s/.test(lines[i])) {
      blocks.push(<h4 className="text-base font-semibold text-navy" key={start}>{lines[i++].replace(/^#{1,6}\s+/, '')}</h4>);
    } else if (/^(?:[-*]|\d+\.)\s/.test(lines[i])) {
      const ordered = /^\d+\./.test(lines[i]), first = Number(lines[i].match(/^\d+/)?.[0] ?? 1), items: string[] = [];
      const pattern = ordered ? /^\d+\.\s/ : /^[-*]\s/;
      while (i < lines.length && pattern.test(lines[i])) items.push(lines[i++].replace(/^(?:[-*]|\d+\.)\s+/, ''));
      const children = items.map((item, index) => <li key={index} className="whitespace-pre-wrap break-words">{item}</li>);
      blocks.push(ordered ? <ol key={start} start={first} className="list-decimal space-y-1 pl-5">{children}</ol> : <ul key={start} className="list-disc space-y-1 pl-5">{children}</ul>);
    } else {
      const paragraph = [lines[i++]];
      while (i < lines.length && lines[i].trim() && !/^(?:```|#{1,6}\s|[-*]\s|\d+\.\s)/.test(lines[i])) paragraph.push(lines[i++]);
      blocks.push(<p key={start} className="whitespace-pre-wrap break-words">{paragraph.join('\n')}</p>);
    }
  }
  return <div className="min-w-0 space-y-4 text-sm leading-7 text-slate-700 [overflow-wrap:anywhere]">{blocks.length ? blocks : <p className="text-slate-400">Chưa có nội dung.</p>}</div>;
}
function Value({ value }: { value: JsonValue | undefined }) {
  if (typeof value === 'string') return value.trim() ? <MarkdownText text={value} /> : <p className="text-sm text-slate-400">Chưa biên soạn.</p>;
  if (Array.isArray(value) && value.every(item => typeof item === 'string')) return value.length ? <ol className="list-decimal space-y-3 pl-5 text-sm leading-7 text-slate-700">{value.map((item, index) => <li key={index} className="whitespace-pre-wrap break-words">{item || <span className="text-slate-400">Mục này còn trống.</span>}</li>)}</ol> : <p className="text-sm text-slate-400">Chưa biên soạn.</p>;
  return value === undefined ? <p className="text-sm text-slate-400">Chưa biên soạn.</p> : <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-slate-50 p-3 text-xs leading-6">{JSON.stringify(value, null, 2)}</pre>;
}
function RubricPreview({ value }: { value: JsonValue | undefined }) {
  const valid = Array.isArray(value) && value.length > 0 && value.length <= 12 && value.every(row => row && typeof row === 'object' && !Array.isArray(row) && typeof row.criterion === 'string' && typeof row.description === 'string' && typeof row.weight === 'number');
  if (!valid) return <Value value={value} />;
  const rows = value as { criterion: string; description: string; weight: number }[];
  return <table className="w-full table-fixed text-left text-sm"><caption className="sr-only">Rubric đánh giá</caption><thead><tr className="border-b border-slate-200"><th scope="col" className="pb-3 pr-4 font-medium text-slate-500">Tiêu chí và bằng chứng</th><th scope="col" className="w-20 pb-3 text-right font-medium text-slate-500">Trọng số</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row, index) => <tr key={index}><td className="py-4 pr-4 [overflow-wrap:anywhere]"><p className="font-semibold text-navy">{row.criterion || 'Tiêu chí chưa có tên'}</p><p className="mt-1 whitespace-pre-wrap leading-6 text-slate-600">{row.description || 'Chưa mô tả bằng chứng.'}</p></td><td className="py-4 text-right align-top font-semibold tabular-nums text-navy">{row.weight}%</td></tr>)}</tbody><tfoot><tr className="border-t border-slate-200"><th scope="row" className="pt-3 font-medium">Tổng trọng số</th><td className="pt-3 text-right font-semibold tabular-nums">{rows.reduce((sum, row) => sum + row.weight, 0)}%</td></tr></tfoot></table>;
}
export function KnowledgePreview({ draft, code }: { draft: KnowledgeDraft; code?: string }) {
  const fields = draft.kind === 'qa' ? [['question', 'Câu hỏi'], ['expectedConcepts', 'Ý chính mong đợi'], ['validAnswers', 'Các cách trả lời đúng'], ['exampleAnswer', 'Câu trả lời minh họa'], ['commonMistakes', 'Lỗi thường gặp'], ['followUps', 'Câu hỏi đào sâu'], ['weakAnswerExamples', 'Ví dụ chưa đạt'], ['rubric', 'Rubric và trọng số']]
    : draft.kind === 'rubric' ? [['guidance', 'Hướng dẫn chấm'], ['rubric', 'Rubric và trọng số']] : [['markdown', 'Nội dung']];
  return <article className="min-w-0 space-y-7">
    <header className="space-y-3 border-b border-slate-200 pb-5"><p className="text-xs font-medium text-slate-500">{kindLabels[draft.kind]}{code ? ` · ${code}` : ''}</p><h3 className="break-words text-xl font-bold leading-8 text-navy">{draft.title || 'Tài liệu chưa có tiêu đề'}</h3><p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{draft.summary || 'Chưa có mô tả.'}</p><p className="text-xs leading-5 text-slate-500">{audienceLabels[draft.audience]} · {audienceHints[draft.audience]}</p><dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-xs text-slate-500">Mục đích</dt><dd className="mt-1">{draft.purposes.map(value => purposeLabels[value]).join(', ') || 'Chưa chọn'}</dd></div><div><dt className="text-xs text-slate-500">Nghề liên quan</dt><dd className="mt-1 break-words">{draft.roleCodes.join(', ') || 'Dùng chung'}</dd></div></dl></header>
    {fields.map(([key, label]) => <section key={key} className="min-w-0 space-y-3"><h4 className="font-semibold text-navy">{label}</h4>{key === 'rubric' ? <RubricPreview value={draft.body[key]} /> : <Value value={draft.body[key]} />}</section>)}
    <section className="space-y-3 border-t border-slate-200 pt-5"><h4 className="font-semibold text-navy">Nguồn tham khảo</h4>{draft.sources.length ? <ol className="list-decimal space-y-4 pl-5 text-sm">{draft.sources.map((source, index) => <li key={index} className="space-y-1 break-words"><p className="font-medium text-navy">{source.title || 'Nguồn chưa có tên'}</p>{source.url && <SourceLink url={source.url} />}{source.reference && <p className="whitespace-pre-wrap leading-6 text-slate-600">{source.reference}</p>}</li>)}</ol> : <p className="text-sm text-slate-400">Chưa có nguồn. Cần bổ sung trước khi xuất bản.</p>}</section>
  </article>;
}
function SourceLink({ url }: { url: string }) {
  let safe = false;
  try { const value = new URL(url); safe = value.protocol === 'https:' && !!value.hostname && !value.username && !value.password; } catch { /* Render invalid drafts as inert text. */ }
  return safe ? <a className="inline-block max-w-full break-all text-blue-700 underline underline-offset-4 hover:text-blue-900" href={url} target="_blank" rel="noopener noreferrer">{url}</a> : <p className="break-all text-slate-500">{url} · URL chưa hợp lệ</p>;
}
