"use client";
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  IconBookOpen,
  IconFilter,
  IconPlus,
  IconSearch,
  IconUpload,
} from '@/components/v-intern/icons';
import { knowledgeAudiences, knowledgeKinds, knowledgePurposes, knowledgeStatuses, listKnowledge, getKnowledge, type KnowledgeMetadata } from '@/lib/api/knowledge';
import { allCareerRoles } from '@/lib/api/career-roles';
import { useResource } from '@/lib/api/use-resource';
import { btn, Empty, Field, inputClass, InlineAlert, Modal, PageTitle, Pager, StatusDot, TableSkeleton } from '@/components/product/primitives';
import { ErrorState, LoadingState } from '@/components/shared/data-state';
import { useKnowledgeAccess } from './access';
import { audienceLabels, kindLabels, purposeLabels, statusLabels, statusTone } from './presentation';
import { KnowledgePreview } from './preview';
import { KnowledgeImport } from './import-preview';

export function KnowledgeLibrary() {
  const access = useKnowledgeAccess();
  return access.read ? <LibraryContent manage={access.manage} /> : <InlineAlert tone="danger" title="Chưa có quyền đọc kho tri thức">Kho biên soạn chỉ dành cho Admin có quyền đọc tri thức.</InlineAlert>;
}
function LibraryContent({ manage }: { manage: boolean }) {
  const [search, setSearch] = useState(''), [query, setQuery] = useState(''), [page, setPage] = useState(1);
  const [status, setStatus] = useState(''), [kind, setKind] = useState(''), [audience, setAudience] = useState(''), [purpose, setPurpose] = useState(''), [role, setRole] = useState('');
  const [preview, setPreview] = useState<KnowledgeMetadata | null>(null), [importing, setImporting] = useState(false);
  useEffect(() => { const timer = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 300); return () => clearTimeout(timer); }, [search]);
  const careers = useResource(useCallback((signal: AbortSignal) => allCareerRoles(signal), []));
  const state = useResource(useCallback((signal: AbortSignal) => listKnowledge(new URLSearchParams({ page: String(page), pageSize: '12', ...(query ? { search: query } : {}), ...(status ? { status } : {}), ...(kind ? { kind } : {}), ...(audience ? { audience } : {}), ...(purpose ? { purpose } : {}), ...(role ? { roleCode: role } : {}) }), signal), [page, query, status, kind, audience, purpose, role]));
  const filter = (set: (value: string) => void, value: string) => { set(value); setPage(1); };
  const filtered = !!(query || status || kind || audience || purpose || role);
  return <div className="min-w-0 space-y-6">
    <PageTitle title="Kho tri thức Agent" subtitle="Biên soạn nội dung có nguồn, duyệt phiên bản và giữ lịch sử." action={manage && <><button className={btn('secondary')} onClick={() => setImporting(true)}><IconUpload size={16} aria-hidden />Kiểm tra import</button><Link className={btn()} href="/admin/knowledge/new"><IconPlus size={16} aria-hidden />Soạn tài liệu</Link></>} />
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5"><p className="max-w-2xl text-body leading-6 text-muted-foreground">Bản nháp → kiểm tra nội dung và nguồn → xuất bản. Kho này chưa được nối vào các lượt chạy AI hiện tại.</p><Link href="/admin/questions" className="text-body font-medium text-primary hover:underline">Ngân hàng phỏng vấn hiện hành</Link></div>
    {!manage && <InlineAlert tone="info">Bạn đang ở chế độ chỉ đọc. Các thao tác biên soạn cần quyền quản lý tri thức.</InlineAlert>}
    <div className="flex flex-wrap gap-x-6 gap-y-2 border-b border-border" aria-label="Lọc trạng thái tài liệu">{(['', ...knowledgeStatuses] as const).map(value => <button key={value} type="button" aria-pressed={status === value} onClick={() => filter(setStatus, value)} className={`min-h-11 border-b-2 px-1 pb-2 text-body transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${status === value ? 'border-primary font-semibold text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>{value ? statusLabels[value] : 'Tất cả'}</button>)}</div>
    <div className="grid min-w-0 gap-4 md:grid-cols-[minmax(0,1fr)_15rem]"><Field label="Tìm tài liệu" htmlFor="knowledge-search"><div className="relative"><IconSearch size={16} aria-hidden className="pointer-events-none absolute left-3 top-3.5 text-muted-foreground" /><input id="knowledge-search" className={`${inputClass} pl-10`} type="search" value={search} placeholder="Tên hoặc mã tài liệu" onChange={e => setSearch(e.target.value)} /></div></Field><Field label="Loại tài liệu" htmlFor="knowledge-kind-filter"><select id="knowledge-kind-filter" className={inputClass} value={kind} onChange={e => filter(setKind, e.target.value)}><option value="">Tất cả loại</option>{knowledgeKinds.map(value => <option key={value} value={value}>{kindLabels[value]}</option>)}</select></Field></div>
    <details className="border-b border-border pb-5"><summary className="w-fit cursor-pointer rounded-md py-2 text-body font-medium text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"><span className="inline-flex items-center gap-2"><IconFilter size={15} aria-hidden />Phạm vi, mục đích và nghề</span></summary><div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><Field label="Phạm vi" htmlFor="knowledge-audience-filter"><select id="knowledge-audience-filter" className={inputClass} value={audience} onChange={e => filter(setAudience, e.target.value)}><option value="">Tất cả phạm vi</option>{knowledgeAudiences.map(value => <option key={value} value={value}>{audienceLabels[value]}</option>)}</select></Field><Field label="Mục đích" htmlFor="knowledge-purpose-filter"><select id="knowledge-purpose-filter" className={inputClass} value={purpose} onChange={e => filter(setPurpose, e.target.value)}><option value="">Tất cả mục đích</option>{knowledgePurposes.map(value => <option key={value} value={value}>{purposeLabels[value]}</option>)}</select></Field><Field label="Nghề" htmlFor="knowledge-role-filter"><select id="knowledge-role-filter" className={inputClass} value={role} onChange={e => filter(setRole, e.target.value)}><option value="">Tất cả nghề</option>{careers.data?.map(value => <option key={value.code} value={value.code}>{value.name}</option>)}</select>{Boolean(careers.error) && <button className="mt-2 text-caption text-destructive underline" onClick={careers.reload}>Chưa tải được nghề. Thử lại</button>}</Field></div></details>
    <div className="flex flex-wrap items-center justify-between gap-3 text-body"><p className="text-muted-foreground" aria-live="polite">{state.loading ? 'Đang cập nhật danh sách…' : `${state.data?.total ?? 0} tài liệu${filtered ? ' phù hợp' : ''}`}</p>{filtered && <button className="font-medium text-primary hover:underline" onClick={() => { setSearch(''); setQuery(''); setStatus(''); setKind(''); setAudience(''); setPurpose(''); setRole(''); setPage(1); }}>Xóa bộ lọc</button>}</div>
    {state.loading && !state.data ? <TableSkeleton rows={4} cols={3} /> : state.error ? <ErrorState error={state.error} onRetry={state.reload} /> : state.data?.items.length ? <ul aria-label="Danh sách tri thức" className="divide-y divide-border border-y border-border">{state.data.items.map(item => <li key={item.code} className="grid min-w-0 gap-4 py-5 lg:grid-cols-[minmax(0,1fr)_11rem_auto] lg:items-center"><div className="min-w-0"><p className="mb-1 text-caption font-medium text-muted-foreground">{kindLabels[item.kind]} · Phiên bản {item.version}</p><h2 className="break-words text-subsection font-semibold text-foreground"><button className="text-left hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring" onClick={() => setPreview(item)}>{item.title}</button></h2><p className="mt-1 line-clamp-2 text-body leading-6 text-muted-foreground">{item.summary || 'Bản nháp chưa có mô tả.'}</p><p className="mt-2 break-all text-caption text-muted-foreground">{item.code}</p></div><div className="space-y-2"><StatusDot tone={statusTone(item.status)}>{statusLabels[item.status]}</StatusDot><p className="text-caption text-muted-foreground">{audienceLabels[item.audience]}</p></div><Link href={`/admin/knowledge/${encodeURIComponent(item.code)}`} className={btn('secondary', 'sm')}>{manage ? 'Mở biên soạn' : 'Xem chi tiết'}<span className="sr-only"> {item.title}</span></Link></li>)}</ul> : <Empty icon={IconBookOpen} title={filtered ? 'Không tìm thấy tài liệu' : 'Kho tri thức đang trống'} description={filtered ? 'Thử thay đổi từ khóa hoặc bộ lọc.' : 'Bắt đầu từ một hướng dẫn có nguồn hoặc bộ câu hỏi có nhiều cách trả lời đúng.'} action={manage ? <Link className={btn()} href="/admin/knowledge/new">Soạn tài liệu đầu tiên</Link> : undefined} />}
    {state.data && <Pager page={page} total={state.data.total} totalPages={Math.ceil(state.data.total / state.data.pageSize)} unit="tài liệu" onChange={setPage} />}
    {preview && <Modal title="Xem nội dung tài liệu" wide onClose={() => setPreview(null)}><InspectKnowledge code={preview.code} /></Modal>}
    {importing && <Modal title="Kiểm tra lô import" wide onClose={() => setImporting(false)}><KnowledgeImport /></Modal>}
  </div>;
}
function InspectKnowledge({ code }: { code: string }) {
  const state = useResource(useCallback((signal: AbortSignal) => getKnowledge(code, signal), [code]));
  return state.error ? <ErrorState error={state.error} onRetry={state.reload} /> : !state.data ? <LoadingState /> : <><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><StatusDot tone={statusTone(state.data.status)}>{statusLabels[state.data.status]} · Phiên bản {state.data.version}</StatusDot><Link className={btn('secondary', 'sm')} href={`/admin/knowledge/${encodeURIComponent(code)}`}>Mở trang chi tiết</Link></div><KnowledgePreview code={code} draft={state.data.snapshot} /></>;
}
