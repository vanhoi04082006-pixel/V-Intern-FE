import { useCallback, useState } from 'react';
import { listKnowledgeHistory, type KnowledgeDocument } from '@/lib/api/knowledge';
import { useResource } from '@/lib/api/use-resource';
import { btn, InlineAlert, Pager, StatusDot } from '@/components/product/primitives';
import { ErrorState, LoadingState } from '@/components/shared/data-state';
import { KnowledgePreview } from './preview';
import { statusLabels, statusTone } from './presentation';

type Revision = Awaited<ReturnType<typeof listKnowledgeHistory>>['items'][number];
export function KnowledgeHistory({ document, canRestore, busy, onRestore }: { document: KnowledgeDocument; canRestore: boolean; busy: boolean; onRestore: (sourceVersion: number) => void }) {
  const [page, setPage] = useState(1), [selected, setSelected] = useState<Revision | null>(null), [confirm, setConfirm] = useState(false);
  const result = useResource(useCallback((signal: AbortSignal) => listKnowledgeHistory(document.code, page, signal), [document.code, page]));
  if (result.error) return <ErrorState error={result.error} onRetry={result.reload} />;
  if (!result.data) return <LoadingState />;
  if (selected) return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><button type="button" className={btn('ghost', 'sm')} onClick={() => { setSelected(null); setConfirm(false); }}>Quay lại lịch sử</button><StatusDot tone={statusTone(selected.snapshot.status)}>Phiên bản {selected.version} · {statusLabels[selected.snapshot.status]}</StatusDot></div>
    <KnowledgePreview code={document.code} draft={selected.snapshot} />
    <details className="border-t border-border pt-4 text-caption text-muted-foreground"><summary className="cursor-pointer">Dấu kiểm chứng và người thực hiện</summary><dl className="mt-3 space-y-2"><div><dt>SHA-256</dt><dd className="mt-1 break-all font-mono">{selected.sha256}</dd></div><div><dt>Mã người thực hiện</dt><dd className="mt-1 break-all">{selected.createdBy}</dd></div></dl></details>
    {!canRestore && <p className="text-caption leading-5 text-muted-foreground">Để khôi phục, cần quyền biên soạn và lưu hoặc bỏ các thay đổi đang soạn trước.</p>}
    {canRestore && (confirm ? <InlineAlert tone="warning" title={`Khôi phục nội dung phiên bản ${selected.version}?`}><p>Sẽ chép thành bản nháp mới sau phiên bản {document.version}; không sửa lịch sử hoặc tự xuất bản. Nội dung hiện tại vẫn được giữ trong lịch sử.</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={busy} className={btn('secondary', 'sm')} onClick={() => setConfirm(false)}>Chưa khôi phục</button><button type="button" disabled={busy} className={btn('primary', 'sm')} onClick={() => onRestore(selected.version)}>{busy ? 'Đang khôi phục…' : 'Xác nhận khôi phục'}</button></div></InlineAlert>
      : <button type="button" className={btn('secondary')} onClick={() => setConfirm(true)}>Khôi phục phiên bản {selected.version}</button>)}
  </div>;
  return <><p className="mb-5 text-body leading-6 text-muted-foreground">Mỗi lần lưu, xuất bản, lưu trữ hoặc khôi phục tạo một phiên bản riêng. Bấm một phiên bản để xem đầy đủ nội dung và nguồn.</p><ol className="divide-y divide-border">{result.data.items.map(row => <li key={row.version} className="flex flex-wrap items-center justify-between gap-4 py-4"><div><p className="text-body font-semibold text-foreground">Phiên bản {row.version}{row.version === document.version ? ' · Hiện tại' : ''}</p><p className="mt-1 text-caption text-muted-foreground">{new Date(row.createdAt).toLocaleString('vi-VN')}</p><div className="mt-2"><StatusDot tone={statusTone(row.snapshot.status)}>{statusLabels[row.snapshot.status]}</StatusDot></div></div><button type="button" className={btn('secondary', 'sm')} onClick={() => setSelected(row)}>Xem phiên bản {row.version}</button></li>)}</ol><Pager page={page} total={result.data.total} totalPages={Math.ceil(result.data.total / result.data.pageSize)} unit="phiên bản" onChange={setPage} /></>;
}
