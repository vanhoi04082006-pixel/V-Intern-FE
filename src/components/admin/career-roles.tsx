"use client";
import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Archive, History, Plus } from 'lucide-react';
import { archiveCareerRole, careerStatuses, listCareerRoles, listCareerRoleRevisions, type CareerRole } from '@/lib/api/career-roles';
import { useResource } from '@/lib/api/use-resource';
import { ErrorState, LoadingState } from '@/components/shared/data-state';
import { buttonClass, Empty, inputClass, Modal, PageTitle, Pager, StatusDot } from '@/components/product/primitives';
import { useAction } from '@/components/product/use-action';
import { CareerRoleEditor } from './career-role-editor';

export const careerStatusLabels = { draft: 'Bản nháp', published: 'Đã xuất bản', archived: 'Đã lưu trữ' };
export function CareerRoles() {
  const [page, setPage] = useState(1), [search, setSearch] = useState(''), [status, setStatus] = useState('');
  const [editor, setEditor] = useState<CareerRole | 'new' | null>(null), [archiving, setArchiving] = useState<CareerRole | null>(null), [history, setHistory] = useState<CareerRole | null>(null);
  const [notice, setNotice] = useState('');
  const state = useResource(useCallback((signal: AbortSignal) => listCareerRoles(new URLSearchParams({ page: String(page), search, ...(status ? { status } : {}) }), signal), [page, search, status]));
  const action = useAction();
  const saved = (message: string) => { setEditor(null); setNotice(message); state.reload(); };
  return <div className="space-y-6">
    <PageTitle title="Thư viện nghề nghiệp" subtitle="Định nghĩa vị trí tuyển dụng, năng lực và trạng thái nhận hồ sơ. Nghề nghiệp tách biệt với vai trò và quyền tài khoản." action={<button className={buttonClass} onClick={() => { setNotice(''); setEditor('new'); }}><Plus size={16} aria-hidden />Thêm nghề nghiệp</button>} />
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
      <p className="max-w-2xl text-sm leading-6 text-slate-600">Soạn bản nháp → hoàn thiện kỹ năng và trọng số → xuất bản → mở nhận hồ sơ. Trước khi phỏng vấn, cần đủ câu hỏi cho nghề đã chọn.</p>
      <Link className="text-sm font-semibold text-blue-700 hover:underline" href="/admin/questions">Quản lý câu hỏi →</Link>
    </div>
    {notice && <p role="status" className="border-l-2 border-emerald-500 pl-3 text-sm text-emerald-800">{notice}</p>}
    <div className="flex flex-wrap gap-4">
      <label className="min-w-0 flex-1 text-sm font-medium">Tìm nghề nghiệp<input className={inputClass} placeholder="Tên hoặc mã nghề nghiệp" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></label>
      <label className="w-full text-sm font-medium sm:w-52">Trạng thái<select className={inputClass} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">Tất cả trạng thái</option>{careerStatuses.map(status => <option key={status} value={status}>{careerStatusLabels[status]}</option>)}</select></label>
    </div>
    {state.loading && !state.data ? <LoadingState /> : state.error ? <ErrorState error={state.error} onRetry={state.reload} /> : state.data?.items.length ? <ul className="divide-y divide-slate-200 border-y border-slate-200" aria-label="Danh sách nghề nghiệp">
      {state.data.items.map(role => <li key={role.code} className="grid gap-4 py-5 lg:grid-cols-[minmax(0,1fr)_12rem_auto] lg:items-center">
        <div className="min-w-0"><div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><h2 className="text-base font-semibold text-navy">{role.name}</h2><span className="break-all font-mono text-xs text-slate-500">{role.code}</span></div><p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{role.description || 'Chưa có mô tả. Hoàn thiện trước khi xuất bản.'}</p><p className="mt-2 text-xs text-slate-500">{role.requiredSkills.join(' · ') || 'Chưa xác định kỹ năng'} · Phiên bản {role.version}</p></div>
        <div className="space-y-1"><StatusDot tone={role.status === 'published' ? 'green' : role.status === 'archived' ? 'slate' : 'amber'}>{careerStatusLabels[role.status]}</StatusDot><p className="text-xs text-slate-500">{role.acceptingApplications ? 'Đang nhận hồ sơ' : 'Đóng nhận hồ sơ'}</p></div>
        <div className="flex flex-wrap items-center gap-3 text-sm"><button className="font-semibold text-blue-700 hover:underline" aria-label={`Chỉnh sửa ${role.name}`} onClick={() => setEditor(role)}>Chỉnh sửa</button><button className="inline-flex items-center gap-1 text-slate-600 hover:text-navy" aria-label={`Lịch sử ${role.name}`} onClick={() => setHistory(role)}><History size={15} aria-hidden />Lịch sử</button>{role.status !== 'archived' && <button className="inline-flex items-center gap-1 text-slate-600 hover:text-rose-700" aria-label={`Lưu trữ ${role.name}`} onClick={() => setArchiving(role)}><Archive size={15} aria-hidden />Lưu trữ</button>}</div>
      </li>)}
    </ul> : <Empty>Chưa có nghề nghiệp phù hợp. Thử thay đổi bộ lọc hoặc tạo bản nháp mới.</Empty>}
    {state.data && <Pager page={page} total={state.data.total} totalPages={Math.ceil(state.data.total / state.data.pageSize)} onChange={setPage} unit="nghề nghiệp" />}
    {editor && <Modal title={editor === 'new' ? 'Thêm nghề nghiệp' : `Chỉnh sửa ${editor.name}`} wide onClose={() => setEditor(null)}><CareerRoleEditor role={editor === 'new' ? undefined : editor} onSaved={saved} /></Modal>}
    {history && <Modal title={`Lịch sử ${history.name}`} wide onClose={() => setHistory(null)}><CareerHistory code={history.code} /></Modal>}
    {archiving && <Modal title={`Lưu trữ ${archiving.name}`} onClose={() => setArchiving(null)}><p className="text-sm leading-6 text-slate-600">Dừng nhận hồ sơ và bắt đầu phỏng vấn mới cho nghề này. Những buổi phỏng vấn đã bắt đầu, kết quả và lịch sử vẫn được giữ. Bạn có thể mở lại bằng một phiên bản mới.</p>{Boolean(action.error) && <ErrorState error={action.error} />}<button className={`${buttonClass} mt-5`} disabled={action.busy} onClick={() => void action.run(async () => { await archiveCareerRole(archiving.code, archiving.version); setNotice(`Đã lưu trữ ${archiving.name}.`); setArchiving(null); state.reload(); })}>{action.busy ? 'Đang lưu…' : 'Xác nhận lưu trữ'}</button></Modal>}
  </div>;
}

function CareerHistory({ code }: { code: string }) {
  const [page, setPage] = useState(1);
  const state = useResource(useCallback((signal: AbortSignal) => listCareerRoleRevisions(code, page, signal), [code, page]));
  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />;
  if (!state.data) return <LoadingState />;
  return <><p className="mb-4 text-sm text-slate-600">Mỗi lần lưu tạo một phiên bản riêng. Chỉnh sửa mới không ghi đè bản cũ.</p><ol className="divide-y divide-slate-200">{state.data.items.map(revision => <li className="py-4" key={revision.version}><h3 className="text-sm font-semibold">Phiên bản {revision.version} · {careerStatusLabels[revision.snapshot.status]}</h3><p className="mt-1 text-xs text-slate-500">{new Date(revision.createdAt).toLocaleString('vi-VN')} · {revision.createdBy ? 'Quản trị viên' : 'Khởi tạo hệ thống'}</p><p className="mt-3 font-medium">{revision.snapshot.name}</p><p className="mt-1 text-sm text-slate-600">{revision.snapshot.description || 'Chưa có mô tả.'}</p><p className="mt-2 text-sm">{Object.entries(revision.snapshot.competencyWeights).map(([skill, weight]) => `${skill} · ${weight}%`).join(' / ') || 'Chưa cấu hình trọng số.'}</p><p className="mt-1 text-xs text-slate-500">Tùy chọn: {revision.snapshot.optionalSkills.join(' · ') || 'Chưa có'} · {revision.snapshot.acceptingApplications ? 'Nhận hồ sơ' : 'Đóng nhận hồ sơ'}</p></li>)}</ol><Pager page={page} total={state.data.total} totalPages={Math.ceil(state.data.total / state.data.pageSize)} onChange={setPage} unit="phiên bản" /></>;
}
