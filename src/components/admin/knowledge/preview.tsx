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
      blocks.push(<pre key={start} className="max-w-full overflow-x-auto rounded-control bg-secondary p-4 text-caption leading-6 text-foreground"><code>{code.join('\n')}</code></pre>);
    } else if (/^#{1,6}\s/.test(lines[i])) {
      blocks.push(<h4 className="text-subsection font-semibold text-foreground" key={start}>{lines[i++].replace(/^#{1,6}\s+/, '')}</h4>);
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
  return <div className="min-w-0 space-y-4 text-body leading-7 text-foreground [overflow-wrap:anywhere]">{blocks.length ? blocks : <p className="text-muted-foreground">Chưa có nội dung.</p>}</div>;
}
function Value({ value }: { value: JsonValue | undefined }) {
  if (typeof value === 'string') return value.trim() ? <MarkdownText text={value} /> : <p className="text-body text-muted-foreground">Chưa biên soạn.</p>;
  if (Array.isArray(value) && value.every(item => typeof item === 'string')) return value.length ? <ol className="list-decimal space-y-3 pl-5 text-body leading-7 text-foreground">{value.map((item, index) => <li key={index} className="whitespace-pre-wrap break-words">{item || <span className="text-muted-foreground">Mục này còn trống.</span>}</li>)}</ol> : <p className="text-body text-muted-foreground">Chưa biên soạn.</p>;
  return value === undefined ? <p className="text-body text-muted-foreground">Chưa biên soạn.</p> : <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-control bg-muted/50 p-3 text-caption leading-6">{JSON.stringify(value, null, 2)}</pre>;
}
function RubricPreview({ value }: { value: JsonValue | undefined }) {
  const valid = Array.isArray(value) && value.length > 0 && value.length <= 12 && value.every(row => row && typeof row === 'object' && !Array.isArray(row) && typeof row.criterion === 'string' && typeof row.description === 'string' && typeof row.weight === 'number');
  if (!valid) return <Value value={value} />;
  const rows = value as { criterion: string; description: string; weight: number }[];
  return <table className="w-full table-fixed text-left text-body"><caption className="sr-only">Rubric đánh giá</caption><thead><tr className="border-b border-border"><th scope="col" className="pb-3 pr-4 font-medium text-muted-foreground">Tiêu chí và bằng chứng</th><th scope="col" className="w-20 pb-3 text-right font-medium text-muted-foreground">Trọng số</th></tr></thead><tbody className="divide-y divide-border">{rows.map((row, index) => <tr key={index}><td className="py-4 pr-4 [overflow-wrap:anywhere]"><p className="font-semibold text-foreground">{row.criterion || 'Tiêu chí chưa có tên'}</p><p className="mt-1 whitespace-pre-wrap leading-6 text-muted-foreground">{row.description || 'Chưa mô tả bằng chứng.'}</p></td><td className="py-4 text-right align-top font-semibold tabular-nums text-foreground">{row.weight}%</td></tr>)}</tbody><tfoot><tr className="border-t border-border"><th scope="row" className="pt-3 font-medium">Tổng trọng số</th><td className="pt-3 text-right font-semibold tabular-nums">{rows.reduce((sum, row) => sum + row.weight, 0)}%</td></tr></tfoot></table>;
}
export function KnowledgePreview({ draft, code }: { draft: KnowledgeDraft; code?: string }) {
  const fields = draft.kind === 'qa' ? [['question', 'Câu hỏi'], ['expectedConcepts', 'Ý chính mong đợi'], ['validAnswers', 'Các cách trả lời đúng'], ['exampleAnswer', 'Câu trả lời minh họa'], ['commonMistakes', 'Lỗi thường gặp'], ['followUps', 'Câu hỏi đào sâu'], ['weakAnswerExamples', 'Ví dụ chưa đạt'], ['rubric', 'Rubric và trọng số']]
    : draft.kind === 'rubric' ? [['guidance', 'Hướng dẫn chấm'], ['rubric', 'Rubric và trọng số']] : [['markdown', 'Nội dung']];
  return <article className="min-w-0 space-y-7">
    <header className="space-y-3 border-b border-border pb-5"><p className="text-caption font-medium text-muted-foreground">{kindLabels[draft.kind]}{code ? ` · ${code}` : ''}</p><h3 className="break-words text-section font-bold leading-8 text-foreground">{draft.title || 'Tài liệu chưa có tiêu đề'}</h3><p className="whitespace-pre-wrap text-body leading-6 text-muted-foreground">{draft.summary || 'Chưa có mô tả.'}</p><p className="text-caption leading-5 text-muted-foreground">{audienceLabels[draft.audience]} · {audienceHints[draft.audience]}</p><dl className="grid gap-3 text-body sm:grid-cols-2"><div><dt className="text-caption text-muted-foreground">Mục đích</dt><dd className="mt-1">{draft.purposes.map(value => purposeLabels[value]).join(', ') || 'Chưa chọn'}</dd></div><div><dt className="text-caption text-muted-foreground">Nghề liên quan</dt><dd className="mt-1 break-words">{draft.roleCodes.join(', ') || 'Dùng chung'}</dd></div></dl></header>
    {fields.map(([key, label]) => <section key={key} className="min-w-0 space-y-3"><h4 className="font-semibold text-foreground">{label}</h4>{key === 'rubric' ? <RubricPreview value={draft.body[key]} /> : <Value value={draft.body[key]} />}</section>)}
    <section className="space-y-3 border-t border-border pt-5"><h4 className="font-semibold text-foreground">Nguồn tham khảo</h4>{draft.sources.length ? <ol className="list-decimal space-y-4 pl-5 text-body">{draft.sources.map((source, index) => <li key={index} className="space-y-1 break-words"><p className="font-medium text-foreground">{source.title || 'Nguồn chưa có tên'}</p>{source.url && <SourceLink url={source.url} />}{source.reference && <p className="whitespace-pre-wrap leading-6 text-muted-foreground">{source.reference}</p>}</li>)}</ol> : <p className="text-body text-muted-foreground">Chưa có nguồn. Cần bổ sung trước khi xuất bản.</p>}</section>
  </article>;
}
function SourceLink({ url }: { url: string }) {
  let safe = false;
  try { const value = new URL(url); safe = value.protocol === 'https:' && !!value.hostname && !value.username && !value.password; } catch { /* Render invalid drafts as inert text. */ }
  return safe ? <a className="inline-block max-w-full break-all text-primary underline underline-offset-4 hover:text-info" href={url} target="_blank" rel="noopener noreferrer">{url}</a> : <p className="break-all text-muted-foreground">{url} · URL chưa hợp lệ</p>;
}
