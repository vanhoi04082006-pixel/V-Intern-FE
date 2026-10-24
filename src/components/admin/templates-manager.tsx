"use client";
import { useCallback, useEffect, useState } from 'react';
import { getTemplate, listTemplates, setTemplateStatus, type TemplateDetail, type TemplateSummary } from '@/lib/api/templates';
import { useResource } from '@/lib/api/use-resource';
import { ErrorState, LoadingState } from '@/components/shared/data-state';
import { Badge, buttonClass, Empty, inputClass, Modal, PageTitle, Pager, Panel } from '@/components/product/primitives';
import { useAction } from '@/components/product/use-action';
import { BlueprintPreview } from '@/components/projects/blueprint-preview';
import { TemplateEditor } from './template-editor';
import { TemplateMaterials } from '@/components/projects/template-materials';
export function TemplatesManager() {
  const [page, setPage] = useState(1), [query, setQuery] = useState(''), [search, setSearch] = useState(''), [status, setStatus] = useState<'active' | 'archived'>('active');
  const [editor, setEditor] = useState<{ source?: TemplateDetail; copy?: boolean } | null>(null), [detail, setDetail] = useState<TemplateDetail | null>(null), [archive, setArchive] = useState<TemplateSummary | null>(null);
  useEffect(() => { const timer = setTimeout(() => { setSearch(query.trim()); setPage(1); }, 300); return () => clearTimeout(timer); }, [query]);
  const resource = useResource(useCallback((signal: AbortSignal) => listTemplates({ page, pageSize: 9, search, status }, signal), [page, search, status]));
  const action = useAction();
  const load = (template: TemplateSummary, mode: 'read' | 'edit' | 'copy') => void action.run(async () => { const source = await getTemplate(template.id); if (mode === 'read') setDetail(source); else setEditor({ source, copy: mode === 'copy' }); });
  return <div className="space-y-5"><PageTitle title="Quản trị project template" subtitle="Blueprint có phiên bản, có thể nhân bản; phiên đã tạo giữ nguyên snapshot." action={<button className={buttonClass} onClick={() => setEditor({})}>Thêm mẫu mới</button>} />
    {Boolean(action.error) && <ErrorState error={action.error} />}<Panel title="Thư viện mẫu"><div className="mb-4 grid gap-3 sm:grid-cols-2"><label className="text-sm">Tìm project template<input className={inputClass} value={query} onChange={e => setQuery(e.target.value)} /></label><label className="text-sm">Trạng thái mẫu<select aria-label="Trạng thái mẫu" className={inputClass} value={status} onChange={e => { setStatus(e.target.value as typeof status); setPage(1); }}><option value="active">Đang sử dụng</option><option value="archived">Đã lưu trữ</option></select></label></div>
      {resource.loading ? <LoadingState /> : resource.error ? <ErrorState error={resource.error} onRetry={resource.reload} /> : resource.data?.items.length ? <ul className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{resource.data.items.map(template => <li key={template.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap gap-2"><Badge>{template.category ?? 'Chưa phân loại'}</Badge><Badge>v{template.version}</Badge></div><h3 className="mt-3 font-semibold">{template.name}</h3><p className="mt-1 break-words text-xs text-slate-500">{template.code} · {template.techStack.join(', ')}</p><p className="mt-2 text-sm">{template.teamSize} người · {template.sprintCount} sprint</p><div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-blue-700"><button disabled={action.busy} onClick={() => load(template, 'read')}>Xem blueprint</button><button disabled={action.busy} onClick={() => load(template, 'edit')}>Chỉnh sửa</button><button disabled={action.busy} onClick={() => load(template, 'copy')}>Nhân bản</button><button disabled={action.busy} onClick={() => setArchive(template)}>{template.status === 'archived' ? 'Khôi phục' : 'Lưu trữ'}</button></div></li>)}</ul> : <Empty>Chưa có project template trong bộ lọc.</Empty>}
      {resource.data && <Pager page={page} total={resource.data.total} totalPages={resource.data.totalPages} onChange={setPage} />}
    </Panel>
    {editor && <Modal title={editor.source && !editor.copy ? 'Chỉnh sửa blueprint' : 'Tạo project template'} wide onClose={() => setEditor(null)}><TemplateEditor source={editor.source} copy={editor.copy} onSaved={() => { setEditor(null); resource.reload(); }} /></Modal>}
    {detail && <Modal title={detail.name} wide onClose={() => setDetail(null)}><div className="space-y-4"><TemplateMaterials key={`${detail.id}:${detail.version}`} source={detail} /><BlueprintPreview definition={detail.definition} /><p className="text-xs text-slate-500">{detail.runs.length} phiên gần nhất sử dụng mẫu này; lịch sử phiên giữ nguyên khi chỉnh sửa mẫu.</p></div></Modal>}
    {archive && <Modal title={archive.status === 'archived' ? 'Khôi phục mẫu' : 'Lưu trữ mẫu'} onClose={() => setArchive(null)}><p className="text-sm text-slate-600">{archive.status === 'archived' ? 'Cho phép tạo phiên mới từ mẫu này.' : 'Ngừng tạo phiên mới từ mẫu này. Các phiên đang chạy và lịch sử vẫn được giữ nguyên.'}</p>{Boolean(action.error) && <ErrorState error={action.error} />}<button className={`${buttonClass} mt-4`} disabled={action.busy} onClick={() => void action.run(async () => { await setTemplateStatus(archive, archive.status === 'archived' ? 'active' : 'archived'); setArchive(null); resource.reload(); })}>Xác nhận</button></Modal>}
  </div>;
}
