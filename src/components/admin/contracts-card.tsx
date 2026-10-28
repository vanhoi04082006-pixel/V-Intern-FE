"use client";
import { useCallback, useState } from 'react';
import { getSystemContracts, validateSystemContractsDraft, parseSystemContracts } from '@/lib/api/system-admin';
import { useResource } from '@/lib/api/use-resource';
import { Badge, buttonClass, Empty, inputClass, Panel } from '@/components/product/primitives';
import { ErrorState, LoadingState } from '@/components/shared/data-state';
type ContractResult = ReturnType<typeof parseSystemContracts>;

function formatDate(value: string | null): string {
  if (!value) return 'Chưa có';
  const at = new Date(value);
  return Number.isNaN(at.getTime()) ? value : at.toLocaleString('vi-VN');
}

export function ContractsCard() {
  const state = useResource(useCallback((signal: AbortSignal) => getSystemContracts(signal), []));
  const [draft, setDraft] = useState('');
  const [draftError, setDraftError] = useState<string | null>(null);
  const [draftResult, setDraftResult] = useState<ContractResult | null>(null);
  const [checking, setChecking] = useState(false);
  const data = state.data;
  const validateDraft = useCallback(async () => {
    if (checking) return; // in-flight guard: one validation round at a time
    const payload = draft.trim();
    if (!payload) { setDraftError('Dán JSON hợp đồng (backendSuites) cần kiểm tra.'); return; }
    setChecking(true); setDraftError(null);
    try { setDraftResult(await validateSystemContractsDraft(payload)); } catch (e) { setDraftResult(null); setDraftError(e instanceof Error ? e.message : 'Kiểm tra không thành công.'); } finally { setChecking(false); }
  }, [draft, checking]);
  return <Panel title="Hợp đồng chấm điểm đã seal (chỉ đọc)">
    {state.loading ? <LoadingState /> : state.error ? <ErrorState error={state.error} onRetry={state.reload} /> : data ? (
      <div className="space-y-4">
        <p className="break-words text-caption text-muted-foreground">Nguồn: {data.source}. Bản seal không hợp lệ sẽ không được runner dùng để chấm; bản kế thừa thiếu metadata operator cần re-seal theo phiên bản mới (GRADING_CONTRACTS.md).</p>
        {data.error ? (
          <p role="alert" className="rounded-control border border-destructive/20 bg-destructive-subtle p-3 text-body text-destructive">JSON seal hiện tại không hợp lệ: {data.error}</p>
        ) : data.contracts.length ? (
          <ul className="divide-y divide-border">
            {data.contracts.map(c => (
              <li className="py-3 text-body" key={c.key}>
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="break-all">{c.key}</strong>
                  <Badge>{c.status === 'active' ? (c.operator.complete ? 'active · đầy đủ metadata' : 'active · còn thiếu metadata') : 'invalid'}</Badge>
                </div>
                <p className="mt-1 break-words text-muted-foreground">ID: {c.suiteId ?? 'Chưa có'}, digest: {c.digest ? `${c.digest.slice(0, 12)}…${c.digest.slice(-8)}` : 'Chưa có'}</p>
                <p className="mt-1 break-words text-caption text-muted-foreground">Phiên bản {c.operator.version ?? 'Chưa có'}, seal bởi {c.operator.reviewer ?? 'Chưa có'}, sealedAt {formatDate(c.operator.sealedAt)}, runtime {c.operator.images.runtime ?? 'Chưa có'}, tester {c.operator.images.tester ?? 'Chưa có'}</p>
                {c.issues.length > 0 && <ul className="mt-2 space-y-1">{c.issues.map(i => <li role="alert" className="break-words text-caption text-warning" key={`${i.code}:${i.detail.slice(0, 24)}`}><strong>{i.code}</strong> , {i.detail}</li>)}</ul>}
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Chưa có hợp đồng nào được seal trên nền này.</Empty>
        )}
        <div className="admin-contract-check text-body">
          <h3 className="font-semibold">Kiểm tra bản nháp trước khi seal</h3>
          <p className="mt-1 text-caption text-muted-foreground">Chỉ phân tích cục bộ JSON backendSuites của operator , không lưu, không kích hoạt. Sau khi seal bằng cấu hình BE, khởi động lại để áp dụng.</p>
          <textarea aria-label="Nội dung JSON cần kiểm tra" className={`${inputClass} mt-2 h-28 font-mono text-caption`} value={draft} onChange={e => { setDraft(e.target.value); setDraftError(null); setDraftResult(null); }} />
          <button className={`${buttonClass} mt-2`} onClick={validateDraft} disabled={checking}>{checking ? 'Đang kiểm tra…' : 'Kiểm tra JSON'}</button>
          {draftError && <p role="alert" className="mt-2 text-caption text-destructive">{draftError}</p>}
          {draftResult && <ul className="mt-3 space-y-2">{draftResult.error ? <li role="alert" className="text-caption text-destructive">{draftResult.error}</li> : draftResult.contracts.length === 0 ? <li className="text-caption text-muted-foreground">JSON rỗng , không có hợp đồng nào.</li> : draftResult.contracts.map(c => <li className="text-caption" key={c.key}><Badge>{c.status === 'active' ? 'Sẵn sàng seal' : 'Chặn seal'}</Badge> <span className="break-all">{c.key}</span>{c.issues.length > 0 && <span>, {c.issues.map(i => i.code).join(', ')}</span>}</li>)}</ul>}
        </div>
      </div>
    ) : null}
  </Panel>;
}
