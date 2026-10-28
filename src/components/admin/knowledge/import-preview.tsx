import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { knowledgeDryRun } from '@/lib/api/knowledge';
import { btn, Field, inputClass, InlineAlert, StatusDot } from '@/components/product/primitives';
import { ErrorState } from '@/components/shared/data-state';
import { useAction } from '@/components/product/use-action';

export function KnowledgeImport() {
  const [batch, setBatch] = useState<{ entries: unknown[]; name: string; generation: number } | null>(null), [error, setError] = useState('');
  const generation = useRef(0);
  async function select(file?: File) {
    const current = ++generation.current; setBatch(null); setError('');
    if (!file) return;
    if (file.size > 80000) { setError('File vượt 80 KB. Hãy chia thành lô nhỏ hơn để kiểm tra.'); return; }
    try {
      const parsed: unknown = JSON.parse(await file.text());
      const entries = Array.isArray(parsed) ? parsed : parsed && typeof parsed === 'object' && 'entries' in parsed ? parsed.entries : undefined;
      if (!Array.isArray(entries) || entries.length < 1 || entries.length > 50) throw Error('shape');
      if (current === generation.current) setBatch({ entries, name: file.name, generation: current });
    } catch { if (current === generation.current) setError('File cần JSON hợp lệ, gồm mảng hoặc object entries với 1–50 hàng {code, draft}.'); }
  }
  return <div className="space-y-5">
    <p className="text-body leading-6 text-muted-foreground">Kiểm tra dữ liệu trước khi biên soạn. Thao tác này chỉ báo lỗi và khả năng xuất bản; không nhập, ghi đè hoặc xuất bản tài liệu.</p>
    <Field label="File JSON cần kiểm tra" htmlFor="knowledge-import-file" hint="Tối đa 80 KB và 50 hàng. Có thể dùng mảng hoặc object có trường entries."><input id="knowledge-import-file" className={inputClass} type="file" accept=".json,application/json" onChange={event => void select(event.target.files?.[0])} /></Field>
    {error && <InlineAlert tone="danger">{error}</InlineAlert>}
    {batch && <CheckBatch key={batch.generation} entries={batch.entries} name={batch.name} />}
  </div>;
}
function CheckBatch({ entries, name }: { entries: unknown[]; name: string }) {
  const action = useAction(), controller = useRef<AbortController | null>(null);
  const [result, setResult] = useState<Awaited<ReturnType<typeof knowledgeDryRun>>>();
  useEffect(() => () => controller.current?.abort(), []);
  return <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><p className="min-w-0 break-all text-body text-muted-foreground">{name}, {entries.length} hàng</p><button className={btn()} type="button" disabled={action.busy} onClick={() => void action.run(async () => { controller.current = new AbortController(); setResult(undefined); setResult(await knowledgeDryRun(entries, controller.current.signal)); })}>{action.busy ? 'Đang kiểm tra…' : 'Kiểm tra lô'}</button></div>
    {Boolean(action.error) && <ErrorState error={action.error} title="Chưa kiểm tra được lô dữ liệu" />}
    {result && <><InlineAlert tone="success" title="Đã kiểm tra, không ghi dữ liệu">{result.total} hàng, {result.validDrafts} bản nháp hợp lệ, {result.publishable} mục đủ cấu trúc xuất bản. Nội dung vẫn cần người quản trị duyệt chuyên môn.</InlineAlert><ol className="divide-y divide-border border-y border-border" aria-label="Kết quả kiểm tra import">{result.items.map(row => <li key={row.index} className="space-y-3 py-4"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="min-w-0 break-all text-body font-semibold">Hàng {row.index + 1}, {row.code ?? 'Mã chưa hợp lệ'}</h3><StatusDot tone={row.publishable ? 'green' : row.validDraft ? 'amber' : 'red'}>{row.publishable ? 'Đủ cấu trúc xuất bản' : row.validDraft ? 'Có thể lưu nháp' : 'Cần sửa dữ liệu'}</StatusDot></div>{row.exists && row.code && <p className="text-caption text-muted-foreground">Mã đã có, phiên bản {row.currentVersion}. <Link className="font-medium text-primary underline" href={`/admin/knowledge/${encodeURIComponent(row.code)}`}>Mở bản hiện tại để đối chiếu</Link></p>}{row.issues.length > 0 && <ul className="list-disc space-y-1 pl-5 text-body leading-6 text-destructive">{row.issues.map((issue, index) => <li key={index}>{issue}</li>)}</ul>}{row.publicationIssues.length > 0 && <ul className="list-disc space-y-1 pl-5 text-body leading-6 text-warning">{row.publicationIssues.map((issue, index) => <li key={index}>{issue}</li>)}</ul>}</li>)}</ol><p className="text-caption leading-5 text-muted-foreground">File hợp lệ không tự trở thành tài liệu đã duyệt. Tạo hoặc cập nhật từng bản nháp; khi lưu và xuất bản, hệ thống kiểm quyền và phiên bản lại.</p></>}
  </div>;
}
