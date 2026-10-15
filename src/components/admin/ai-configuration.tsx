"use client";
import { useCallback, useState } from 'react';
import { getAiConfiguration, saveAiConfiguration, type parseAiConfiguration } from '@/lib/api/system-admin';
import { useResource } from '@/lib/api/use-resource';
import { ErrorState, LoadingState } from '@/components/shared/data-state';
import { Badge, buttonClass, inputClass, PageTitle, Panel } from '@/components/product/primitives';
import { useAction } from '@/components/product/use-action';
export function AiConfiguration() {
  const state = useResource(useCallback((signal: AbortSignal) => getAiConfiguration(signal), []));
  return <div className="space-y-5"><PageTitle title="Cấu hình AI" subtitle="Model và giới hạn áp dụng cho lời gọi mới; từng kết quả vẫn lưu model và phiên bản prompt thực tế." />{state.loading ? <LoadingState /> : state.error ? <ErrorState error={state.error} onRetry={state.reload} /> : state.data ? <AiConfigurationForm key={state.data.policy.version} config={state.data} onSaved={state.reload} /> : null}</div>;
}
function AiConfigurationForm({ config, onSaved }: { config: ReturnType<typeof parseAiConfiguration>; onSaved: () => void }) {
  const [policy, setPolicy] = useState(config.policy), action = useAction();
  return <Panel title="Model & thực thi"><form className="space-y-4" onSubmit={e => { e.preventDefault(); void action.run(async () => { await saveAiConfiguration(policy); onSaved(); }); }}>
    <div className="flex flex-wrap gap-2"><Badge>Provider: {config.provider ?? 'Chưa bật'}</Badge><Badge>{config.credentialsConfigured ? 'Đã có credential ở server' : 'Chưa có credential ở server'}</Badge><Badge>Phiên bản {policy.version}</Badge></div>
    <p className="text-sm text-slate-600">API key được quản lý tại máy chủ. Lưu model không tự bật provider hoặc xác nhận model có quyền truy cập. Nếu model/provider từ chối, lỗi được ghi vào lịch sử gọi AI.</p>
    {config.source === 'invalid_database_fallback' && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Cấu hình database không hợp lệ; đang dùng cấu hình môi trường. Hãy lưu lại cấu hình hợp lệ.</p>}
    <label className="block text-sm">Gemini model ID<input className={inputClass} required pattern="gemini[a-z0-9._-]+" maxLength={106} value={policy.model} onChange={e => setPolicy({ ...policy, model: e.target.value })} /></label>
    <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Timeout mỗi lần gọi (ms)<input className={inputClass} type="number" required min={10000} max={180000} value={policy.timeoutMs} onChange={e => setPolicy({ ...policy, timeoutMs: Number(e.target.value) })} /></label><label className="text-sm">Số retry lỗi tạm thời<input className={inputClass} type="number" required min={0} max={3} value={policy.maxRetries} onChange={e => setPolicy({ ...policy, maxRetries: Number(e.target.value) })} /></label></div>
    <p className="text-xs text-slate-500">Không retry lỗi credential/permission. Structured output sai chỉ được sửa một lần ở các module có schema repair; không bỏ qua validation hoặc tự tạo điểm đạt.</p>
    {Boolean(action.error) && <ErrorState error={action.error} />}<button className={buttonClass} disabled={action.busy}>{action.busy ? 'Đang lưu…' : 'Lưu cấu hình AI'}</button>
  </form></Panel>;
}
