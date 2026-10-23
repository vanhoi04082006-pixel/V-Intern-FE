import { useCallback } from 'react';
import { checkKnowledgePublication, type KnowledgeDocument } from '@/lib/api/knowledge';
import { useResource } from '@/lib/api/use-resource';
import { ErrorState, LoadingState } from '@/components/shared/data-state';
import { btn, InlineAlert } from '@/components/product/primitives';
import { KnowledgePreview } from './preview';

export function KnowledgePublicationReview({ document, busy, onPublish }: { document: KnowledgeDocument; busy: boolean; onPublish: () => void }) {
  const result = useResource(useCallback((signal: AbortSignal) => checkKnowledgePublication(document.code, signal), [document.code]));
  if (result.error) return <ErrorState error={result.error} onRetry={result.reload} />;
  if (!result.data) return <LoadingState label="Đang kiểm tra điều kiện xuất bản…" />;
  const row = result.data, current = row.currentVersion === document.version && row.sha256 === document.sha256;
  const ready = row.publishable && current && row.status === 'draft' && document.status === 'draft';
  return <div className="space-y-6">
    {!current ? <InlineAlert tone="warning" title="Phiên bản trên hệ thống đã thay đổi">Đóng phần kiểm tra và đối chiếu bản mới trước khi xuất bản. Bản bạn đang xem là phiên bản {document.version}; hệ thống hiện có phiên bản {row.currentVersion}.</InlineAlert>
      : ready ? <InlineAlert tone="success" title="Đã đủ cấu trúc xuất bản">Cần kiểm chuyên môn, nguồn và phạm vi bên dưới. Xuất bản xác nhận bạn đã duyệt nội dung này; kho chưa được nối vào các lượt chạy AI hiện tại.</InlineAlert>
        : <InlineAlert tone="warning" title="Cần hoàn thiện trước khi xuất bản"><ul className="list-disc space-y-1 pl-4">{row.issues.map((issue, index) => <li key={index}>{issue}</li>)}</ul></InlineAlert>}
    <KnowledgePreview draft={document.snapshot} code={document.code} />
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5"><p className="max-w-lg text-xs leading-5 text-slate-500">Sẽ tạo một phiên bản đã xuất bản mới. Phiên bản đang xem và lịch sử vẫn được giữ.</p><button type="button" className={btn()} disabled={!ready || busy} onClick={onPublish}>{busy ? 'Đang xuất bản…' : 'Xác nhận xuất bản'}</button></div>
  </div>;
}
