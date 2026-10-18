"use client";
import { useCallback } from 'react';
import { getTaskSpec } from '@/lib/api/templates';
import { useResource } from '@/lib/api/use-resource';
import { ErrorState, LoadingState } from '@/components/shared/data-state';
import { Panel } from './primitives';
import { roleLabel } from '@/lib/api/workspace';

export function TaskSpec({ id }: { id: string }) {
  const data = useResource(useCallback((signal: AbortSignal) => getTaskSpec(id, signal), [id]));
  if (data.loading) return <LoadingState />;
  if (data.error) return <ErrorState error={data.error} onRetry={data.reload} />;
  if (!data.data) return null;
  const spec = data.data;
  return <Panel title="Tiêu chí hoàn thành & tài liệu">
    <p className="mb-3 whitespace-pre-wrap text-sm">{spec.requirements}</p>
    <p className="text-xs text-slate-500">Vai trò: {roleLabel(spec.role)}{spec.estimatedHours ? ` · Ước lượng ${spec.estimatedHours} giờ` : ''}{spec.skillTags.length ? ` · ${spec.skillTags.join(', ')}` : ''}</p>
    {spec.expectedOutput && <p className="mt-3 whitespace-pre-wrap text-sm"><strong>Đầu ra cần bàn giao: </strong>{spec.expectedOutput}</p>}
    {(spec.blocked || spec.dependencies.length > 0) && <div className={`mt-4 rounded-xl p-3 text-sm ${spec.blocked ? 'bg-amber-50 text-amber-900' : 'bg-emerald-50 text-emerald-900'}`}><h3 className="font-semibold">{spec.blocked ? 'Đang chờ nhiệm vụ phụ thuộc' : 'Nhiệm vụ phụ thuộc đã hoàn thành'}</h3><ul className="mt-2 list-inside list-disc">{spec.dependencies.map(d => <li key={d.taskId}>{d.code} · {d.title} · {d.status === 'done' ? 'Đã hoàn thành' : 'Chưa được xác nhận hoàn thành'}</li>)}</ul></div>}
    <ul className="my-3 list-inside list-disc text-sm">{spec.dod.map((v, i) => <li key={i}>{v}</li>)}</ul>
    <details><summary className="cursor-pointer text-sm font-semibold text-blue-600">Tài liệu dự án</summary><p className="whitespace-pre-wrap text-sm">{spec.documentation}</p></details>
  </Panel>;
}
