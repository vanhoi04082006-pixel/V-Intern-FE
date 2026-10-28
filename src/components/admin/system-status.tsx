"use client";
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { getSystemStatus, listSystemRepositories } from '@/lib/api/system-admin';
import { useResource } from '@/lib/api/use-resource';
import { ErrorState, LoadingState } from '@/components/shared/data-state';
import { Badge, buttonClass, Empty, inputClass, Pager, Panel } from '@/components/product/primitives';
import { ContractsCard } from '@/components/admin/contracts-card';
import { Metrics } from '@/components/product/outcomes';
export function AdminSystemStatus() {
  const state = useResource(useCallback((signal: AbortSignal) => getSystemStatus(signal), []));
  const data = state.data;
  return <div className="mt-5 space-y-5"><Panel title="Hệ thống & tích hợp" action={<button className={buttonClass} onClick={state.reload}>Tải lại</button>}>
    {state.loading ? <LoadingState /> : state.error ? <ErrorState error={state.error} onRetry={state.reload} /> : data ? <div className="space-y-4"><Metrics values={[["Người dùng", data.counts.users], ["Phiên active", data.counts.activeSessions], ["Câu hỏi active", data.counts.activeQuestions], ["Template active", data.counts.activeTemplates], ["Migration", data.counts.migrations], ["Review đang chạy", data.counts.runningReviews]]} />
      <div className="admin-integration-grid"><div className="space-y-3"><h3 className="font-semibold">GitHub OAuth</h3><Badge>{data.github.configured ? 'Đã cấu hình' : 'Thiếu cấu hình'}</Badge>{data.github.missing.length > 0 && <p className="mt-2 break-words text-caption text-muted-foreground">{data.github.missing.join(', ')}</p>}</div><div className="space-y-3"><h3 className="font-semibold">Webhook</h3><Badge>{data.webhook ? 'Đã cấu hình' : 'Chưa cấu hình'}</Badge><p className="mt-2 text-caption text-muted-foreground">Xem delivery gần nhất theo từng repository bên dưới.</p></div><div className="space-y-3"><h3 className="font-semibold">Trusted runner</h3><Badge>{data.runner.configured ? 'Đã cấu hình endpoint' : 'Thiếu cấu hình'}</Badge><p className="mt-2 text-caption text-muted-foreground">{data.runner.sealedSuites} suite đã seal trong cấu hình BE · {data.runner.valid ? 'JSON hợp lệ' : 'JSON không hợp lệ'}. Chưa probe kết nối.</p></div></div>
      <p className="text-caption text-muted-foreground">Trạng thái cấu hình không xác nhận lời gọi dịch vụ thành công. Kiểm tra lúc {new Date(data.checkedAt).toLocaleString('vi-VN')} · SQL {data.latency}ms.</p>
      <div className="admin-alert-scan text-body"><h3 className="font-semibold">Cảnh báo quá hạn & sự cố phiên</h3><p className="mt-1 text-muted-foreground">{data.alerts.enabled ? `Đang bật · chu kỳ ${data.alerts.intervalSeconds} giây` : 'Đang tắt'}{data.alerts.running ? ' · Đang quét' : ''}</p><p className="mt-1 break-words text-caption text-muted-foreground">{data.alerts.lastScanAt ? `Lần quét cuối: ${new Date(data.alerts.lastScanAt).toLocaleString('vi-VN')}` : 'Chưa có lần quét trong tiến trình hiện tại.'}{data.alerts.lastResult ? ` · Đã gửi ${data.alerts.lastResult.created}, tắt theo tùy chọn ${data.alerts.lastResult.muted}, xét ${data.alerts.lastResult.processed} sự kiện.` : ''}</p>{data.alerts.error && <p role="alert" className="mt-2 break-words text-destructive">Lần quét gần nhất gặp lỗi ({data.alerts.error}). Kiểm tra log dịch vụ và migration.</p>}</div>
      <Link href="/admin/ai" className="inline-block text-body font-semibold text-primary">Cấu hình model và giới hạn AI</Link>
      <h3 className="font-semibold">Lời gọi AI trong 24 giờ</h3>{data.ai.length ? <div className="overflow-x-auto"><table className="w-full text-left text-body"><thead><tr>{['Tính năng', 'Trạng thái', 'Số lượt', 'Latency TB (ms)'].map(label => <th className="p-2" key={label}>{label}</th>)}</tr></thead><tbody>{data.ai.map(row => <tr key={`${row.feature}:${row.status}`} className="border-t border-border"><td className="break-words p-2">{row.feature}</td><td className="break-words p-2">{row.status}</td><td className="p-2">{row.count}</td><td className="p-2">{row.latency ?? 'Chưa đo'}</td></tr>)}</tbody></table></div> : <Empty>Chưa có lời gọi được ghi nhận trong 24 giờ.</Empty>}
    </div> : null}
  </Panel><ContractsCard /><RepositoryStatus /></div>;
}

function RepositoryStatus() {
  const [page, setPage] = useState(1), [query, setQuery] = useState(''), [search, setSearch] = useState(''), [status, setStatus] = useState('');
  useEffect(() => { const timer = setTimeout(() => { setSearch(query.trim()); setPage(1); }, 300); return () => clearTimeout(timer); }, [query]);
  const state = useResource(useCallback((signal: AbortSignal) => listSystemRepositories(new URLSearchParams({ page: String(page), pageSize: '10', ...(search ? { search } : {}), ...(status ? { status } : {}) }), signal), [page, search, status]));
  return <Panel title="GitHub theo phiên"><div className="mb-4 grid gap-3 sm:grid-cols-2"><label className="text-body">Tìm phiên/repository<input className={inputClass} value={query} onChange={e => setQuery(e.target.value)} /></label><label className="text-body">Trạng thái repository<select className={inputClass} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">Tất cả</option>{['ready', 'failed', 'provisioning', 'not_configured'].map(value => <option value={value} key={value}>{value}</option>)}</select></label></div>
    {state.loading ? <LoadingState /> : state.error ? <ErrorState error={state.error} onRetry={state.reload} /> : state.data?.items.length ? <ul className="divide-y divide-border">{state.data.items.map(repo => <li className="break-words py-3 text-body" key={repo.sessionId}><strong>{repo.sessionName}</strong><p className="mt-1 break-words text-muted-foreground">{repo.instructorName ?? 'Giảng viên'} · {repo.ownerLogin && repo.repoName ? `${repo.ownerLogin}/${repo.repoName}` : 'Chưa tạo repository'}</p><p className="mt-2 break-words text-caption text-muted-foreground">Repository {repo.status} · Webhook {repo.webhookStatus}{repo.lastEventAt ? ` · Sự kiện cuối ${new Date(repo.lastEventAt).toLocaleString('vi-VN')}` : ' · Chưa nhận sự kiện'}{repo.error ? ` · ${repo.error}` : ''}</p></li>)}</ul> : <Empty>Chưa có repository trong bộ lọc.</Empty>}
    {state.data && <Pager page={page} total={state.data.total} totalPages={Math.ceil(state.data.total / state.data.pageSize)} onChange={setPage} />}
  </Panel>;
}
