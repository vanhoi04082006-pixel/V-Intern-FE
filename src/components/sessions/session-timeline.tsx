"use client";
import { useCallback, useState } from 'react';
import { listSessionTimeline } from '@/lib/api/session-work';
import { useResource } from '@/lib/api/use-resource';
import { ErrorState, LoadingState } from '@/components/shared/data-state';
import { Empty, Pager, Panel } from '@/components/product/primitives';

export function SessionTimeline({ sessionId, load = listSessionTimeline }: { sessionId: string; load?: typeof listSessionTimeline }) {
  const [page, setPage] = useState(1);
  const state = useResource(useCallback((signal: AbortSignal) => load(sessionId, page, signal), [load, sessionId, page]));
  return <Panel title="Hoạt động của phiên">
    {state.loading ? <LoadingState /> : state.error ? <ErrorState error={state.error} onRetry={state.reload} /> : state.data && <>
      {state.data.items.length ? <ol className="space-y-3">{state.data.items.map(e => <li key={e.id} className="border-l-2 border-blue-100 pl-3 text-sm">
        <p>{e.summary ?? e.action}</p><p className="mt-1 text-xs text-slate-500">{e.actorName ?? 'Hệ thống'} · <time dateTime={e.createdAt}>{new Date(e.createdAt).toLocaleString('vi-VN')}</time></p>
      </li>)}</ol> : <Empty>Chưa có hoạt động được ghi nhận trong phiên.</Empty>}
      <Pager {...state.data} onChange={setPage} unit="hoạt động" />
    </>}
  </Panel>;
}
