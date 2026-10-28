"use client";
import { useCallback, useState } from 'react';
import { listSprints } from '@/lib/api/delivery';
import { useResource } from '@/lib/api/use-resource';
import { ErrorState } from '@/components/shared/data-state';
import { PerformanceMemberPicker } from '@/components/product/performance-member-picker';
import { inputClass, Pager } from '@/components/product/primitives';
export function ReportScopePickers({ projectId, sessionId, sprintId, studentId, onSprint, onStudent }: { projectId: string; sessionId: string; sprintId: string; studentId: string; onSprint: (id: string) => void; onStudent: (id: string) => void }) {
  const [page, setPage] = useState(1), [selectedName, setSelectedName] = useState('Sprint đã chọn');
  const sprints = useResource(useCallback((signal: AbortSignal) => listSprints({ projectId, sessionId, page, pageSize: 10 }, signal), [projectId, sessionId, page]));
  return <div className="grid gap-4 md:grid-cols-2">
    <div><label className="block text-body">Sprint<select className={inputClass} value={sprintId} onChange={e => { const id = e.target.value; setSelectedName(sprints.data?.items.find(s => s.id === id)?.name ?? 'Sprint đã chọn'); onSprint(id); }}><option value="">Tất cả sprint</option>{sprintId && !sprints.data?.items.some(s => s.id === sprintId) && <option value={sprintId}>{selectedName}</option>}{sprints.data?.items.map(s => <option value={s.id} key={s.id}>{s.name}</option>)}</select></label>{Boolean(sprints.error) && <ErrorState error={sprints.error} onRetry={sprints.reload} />}{sprints.data && <Pager page={page} total={sprints.data.total} totalPages={sprints.data.totalPages} onChange={setPage} unit="sprint" />}</div>
    <PerformanceMemberPicker label="Sinh viên báo cáo" value={studentId} onChange={onStudent} scope={new URLSearchParams({ projectId, sessionId }).toString()} />
  </div>;
}
