"use client";
import { useCallback, useEffect, useState } from 'react';
import { listPerformance } from '@/lib/api/management';
import { useResource } from '@/lib/api/use-resource';
import { ErrorState, LoadingState } from '@/components/shared/data-state';
import { inputClass, Pager } from './primitives';
export function PerformanceMemberPicker({ value, onChange, scope = '', label = 'Sinh viên', required = false }: { value: string; onChange: (id: string) => void; scope?: string; label?: string; required?: boolean }) {
  const [page, setPage] = useState(1), [query, setQuery] = useState(''), [debounced, setDebounced] = useState('');
  const [selectedName, setSelectedName] = useState('Sinh viên đã chọn');
  useEffect(() => { const timer = setTimeout(() => { setDebounced(query.trim()); setPage(1); }, 300); return () => clearTimeout(timer); }, [query]);
  const members = useResource(useCallback((signal: AbortSignal) => { const params = new URLSearchParams(scope); params.set('page', String(page)); params.set('pageSize', '10'); if (debounced) params.set('q', debounced); return listPerformance(params, signal); }, [scope, page, debounced]));
  return <div className="space-y-2">
    <label className="block text-sm">Tìm {label.toLowerCase()}<input className={inputClass} value={query} onChange={e => setQuery(e.target.value)} /></label>
    <label className="block text-sm">{label}<select className={inputClass} required={required} value={value} onChange={e => { const id = e.target.value; setSelectedName(members.data?.items.find(m => m.userId === id)?.displayName ?? 'Sinh viên đã chọn'); onChange(id); }}>
      <option value="">Chọn sinh viên</option>
      {value && !members.data?.items.some(m => m.userId === value) && <option value={value}>{selectedName}</option>}
      {members.data?.items.map(m => <option value={m.userId} key={m.userId}>{m.displayName ?? m.userId}</option>)}
    </select></label>
    {members.loading && <LoadingState />}{Boolean(members.error) && <ErrorState error={members.error} onRetry={members.reload} />}
    {members.data && <Pager page={page} total={members.data.total} totalPages={Math.ceil(members.data.total / members.data.pageSize)} onChange={setPage} unit="sinh viên" />}
  </div>;
}
