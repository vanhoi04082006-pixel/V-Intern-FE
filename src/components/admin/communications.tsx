'use client';
import { useCallback, useEffect, useState } from 'react';
import { listMail, previewMail, resendMail, type parseMail } from '@/lib/api/communications';
import { useResource } from '@/lib/api/use-resource';
import { ErrorState, LoadingState } from '@/components/shared/data-state';
import { buttonClass, Empty, PageTitle, Pager, StatusDot } from '@/components/product/primitives';
import { useAction } from '@/components/product/use-action';

const labels: Record<string, string> = { pending: 'Chờ gửi', sending: 'Đang gửi', accepted: 'SMTP đã nhận', delivered: 'Đã tới hộp thư', bounced: 'Bị trả lại', uncertain: 'Chưa rõ đã gửi', dead: 'Cần xử lý', cancelled: 'Đã hủy', expired: 'Hết hạn' };
const kinds: Record<string, string> = { verify: 'Xác minh email', schedule: 'Lịch phỏng vấn', credentials: 'Đăng nhập', 'existing-account': 'Tài khoản hiện có', cancelled: 'Hủy lịch' };
export function Communications() {
  const [page, setPage] = useState(1), [preview, setPreview] = useState<Awaited<ReturnType<typeof previewMail>> | null>(null), [notice, setNotice] = useState('');
  const state = useResource(useCallback((signal: AbortSignal) => listMail(page, signal), [page]));
  return <div className="space-y-6">
    <PageTitle title="Email & lịch gửi" subtitle="Theo dõi từng lần gửi. SMTP nhận thư chưa xác nhận thư đã tới hộp thư người nhận." action={<button className={buttonClass} onClick={state.reload}>Làm mới</button>} />
    {state.data && !state.data.transportConfigured && <p role="status" className="border-l-2 border-amber-500 pl-3 text-sm text-amber-900">SMTP chưa được cấu hình. Hệ thống giữ email trong hàng đợi và không báo đã gửi.</p>}
    {notice && <p role="status" className="text-sm text-emerald-800">{notice}</p>}
    {state.loading && !state.data ? <LoadingState /> : state.error ? <ErrorState error={state.error} onRetry={state.reload} /> : state.data?.items.length ? <ul aria-label="Hàng đợi email" className="divide-y divide-slate-200 border-y border-slate-200">{state.data.items.map(mail => <MailRow key={mail.id} mail={mail} onPreview={setPreview} onSent={() => { setNotice('Đã xếp lại vào hàng đợi. Không thay đổi mật khẩu tài khoản.'); state.reload(); }} />)}</ul> : <Empty title="Chưa có email" description="Email xác minh và lịch phỏng vấn sẽ xuất hiện khi có hồ sơ ứng tuyển." />}
    {state.data && <Pager page={page} total={state.data.total} totalPages={Math.ceil(state.data.total / 25)} onChange={setPage} />}
    {preview && <section className="space-y-3 border-t border-slate-200 pt-6" aria-label="Xem trước email"><div className="flex justify-between"><h2 className="font-semibold">Nội dung email</h2><button className="text-sm font-medium text-blue-700" onClick={() => setPreview(null)}>Đóng nội dung</button></div>{preview.redacted ? <p className="text-sm text-slate-600">{preview.message}</p> : <><h3 className="font-medium">{preview.subject}</h3><iframe title="Email HTML an toàn" sandbox="" srcDoc={preview.html} className="h-[28rem] w-full border border-slate-200" /><details><summary className="cursor-pointer text-sm">Bản văn bản thuần</summary><pre className="mt-3 whitespace-pre-wrap break-words text-sm">{preview.text}</pre></details></>}</section>}
  </div>;
}
function MailRow({ mail, onPreview, onSent }: { mail: ReturnType<typeof parseMail>; onPreview: (v: Awaited<ReturnType<typeof previewMail>>) => void; onSent: () => void }) {
  const [ack, setAck] = useState(false), [cooldown, setCooldown] = useState(false), [loadedAt] = useState(() => Date.now()), action = useAction();
  useEffect(() => { if (!cooldown) return; const timer = setTimeout(() => setCooldown(false), 60000); return () => clearTimeout(timer); }, [cooldown]);
  const resendable = ['dead', 'accepted', 'bounced', 'uncertain'].includes(mail.status) && !['credentials', 'verify'].includes(mail.kind) && new Date(mail.expiresAt).getTime() > loadedAt;
  return <li className="grid gap-3 py-5 lg:grid-cols-[minmax(0,1fr)_14rem_auto] lg:items-center">
    <div className="min-w-0"><p className="font-semibold text-navy">{kinds[mail.kind] ?? mail.kind}</p><p className="break-all text-sm text-slate-600">{mail.recipientHint}</p><p className="mt-1 text-xs text-slate-500">Lịch gửi: {new Date(mail.availableAt).toLocaleString('vi-VN')} · {mail.attempts} lần thử</p>{mail.lastCode && <p className="mt-1 text-xs text-slate-500">Mã xử lý: {mail.lastCode}</p>}</div>
    <div className="space-y-2"><StatusDot tone={mail.status === 'uncertain' || mail.status === 'dead' ? 'amber' : mail.status === 'accepted' || mail.status === 'delivered' ? 'green' : 'slate'}>{labels[mail.status]}</StatusDot>{mail.status === 'uncertain' && <label className="flex gap-2 text-xs leading-5"><input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} />Tôi chấp nhận nguy cơ gửi trùng</label>}</div>
    <div className="flex flex-wrap gap-2"><button className={buttonClass} disabled={action.busy} onClick={() => void action.run(async () => onPreview(await previewMail(mail.id)))}>Xem nội dung</button><button className={buttonClass} disabled={action.busy || !resendable || cooldown || mail.status === 'uncertain' && !ack} onClick={() => void action.run(async () => { await resendMail(mail.id, ack); setCooldown(true); onSent(); })}>{cooldown ? 'Đã xếp gửi · chờ 60 giây' : 'Gửi lại'}</button></div>
    {action.error ? <div className="lg:col-span-3"><ErrorState error={action.error} /></div> : null}
  </li>;
}
