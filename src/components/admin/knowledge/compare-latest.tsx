import { useCallback } from 'react';
import { getKnowledge, type KnowledgeDocument } from '@/lib/api/knowledge';
import { useResource } from '@/lib/api/use-resource';
import { btn, InlineAlert } from '@/components/product/primitives';
import { ErrorState, LoadingState } from '@/components/shared/data-state';
import { KnowledgePreview } from './preview';

export function KnowledgeCompareLatest({ code, onReplace }: { code: string; onReplace: (document: KnowledgeDocument) => void }) {
  const state = useResource(useCallback((signal: AbortSignal) => getKnowledge(code, signal), [code]));
  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />;
  if (!state.data) return <LoadingState label="Đang tải bản mới để đối chiếu…" />;
  const latest = state.data;
  return <div className="space-y-6"><InlineAlert tone="info" title={`Bản trên hệ thống: phiên bản ${latest.version}`}>Bản đang soạn vẫn giữ ở phía sau. Đóng đối chiếu để tiếp tục soạn, hoặc chọn thay bằng bản này để bỏ phần chưa lưu. Hệ thống không tự gộp hay ghi đè.</InlineAlert><KnowledgePreview code={code} draft={latest.snapshot} /><button type="button" className={btn('secondary')} onClick={() => onReplace(latest)}>Bỏ phần chưa lưu và dùng bản này</button></div>;
}
