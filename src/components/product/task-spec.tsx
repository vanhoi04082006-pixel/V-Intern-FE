"use client";
import { useCallback } from 'react';
import { getTaskSpec } from '@/lib/api/templates';
import { useResource } from '@/lib/api/use-resource';
import { ErrorState, LoadingState } from '@/components/shared/data-state';
import { Panel } from './primitives';

export function TaskSpec({ id }: { id: string }) {
  const data = useResource(useCallback((signal: AbortSignal) => getTaskSpec(id, signal), [id]));
  if (data.loading) return <LoadingState />;
  if (data.error) return <ErrorState error={data.error} onRetry={data.reload} />;
  if (!data.data) return null;
  return <Panel title="Tiêu chí hoàn thành & tài liệu"><p className="mb-3 whitespace-pre-wrap text-sm">{data.data.requirements}</p><p className="text-xs text-slate-500">Vai trò: {data.data.role}</p><ul className="my-3 list-inside list-disc text-sm">{data.data.dod.map((v, i) => <li key={i}>{v}</li>)}</ul><details><summary className="cursor-pointer text-sm font-semibold text-blue-600">Tài liệu dự án</summary><p className="whitespace-pre-wrap text-sm">{data.data.documentation}</p></details></Panel>;
}
