"use client";
import { useCallback, useEffect, useState } from 'react';
import { getTemplate, listTemplates, setTemplateStatus, type TemplateDetail, type TemplateSummary } from '@/lib/api/templates';
import { useResource } from '@/lib/api/use-resource';
import { ErrorState, LoadingState } from '@/components/shared/data-state';
import { buttonClass, Empty, inputClass, Modal, PageTitle, Pager, Panel } from '@/components/product/primitives';
import { useAction } from '@/components/product/use-action';
import { BlueprintPreview } from '@/components/projects/blueprint-preview';
import { InkBadge, NoteCard, SketchCard, StampMoc, Tape } from '@/components/notebook/ui';
import { TemplateEditor } from './template-editor';
import { TemplateMaterials } from '@/components/projects/template-materials';

/* Băng dính washi xoay theo vị trí thẻ trong lưới — 4 màu luân phiên như
 * bảng mẫu dán trên bảng nút (port từ sandbox Journey Notebook v3). */
const TAPE_VARIANTS: { variant: 'blue' | 'warm' | 'candy' | 'mint'; rotate: number }[] = [
  { variant: 'blue', rotate: -4 },
  { variant: 'warm', rotate: 3 },
  { variant: 'candy', rotate: -3 },
  { variant: 'mint', rotate: 4 },
];

export function TemplatesManager() {
  const [page, setPage] = useState(1), [query, setQuery] = useState(''), [search, setSearch] = useState(''), [status, setStatus] = useState<'active' | 'archived'>('active');
  const [editor, setEditor] = useState<{ source?: TemplateDetail; copy?: boolean } | null>(null), [detail, setDetail] = useState<TemplateDetail | null>(null), [archive, setArchive] = useState<TemplateSummary | null>(null);
  useEffect(() => { const timer = setTimeout(() => { setSearch(query.trim()); setPage(1); }, 300); return () => clearTimeout(timer); }, [query]);
  const resource = useResource(useCallback((signal: AbortSignal) => listTemplates({ page, pageSize: 9, search, status }, signal), [page, search, status]));
  const action = useAction();
  const [notice, setNotice] = useState('');
  const load = (template: TemplateSummary, mode: 'read' | 'edit' | 'copy') => void action.run(async () => { const source = await getTemplate(template.id); if (mode === 'read') setDetail(source); else setEditor({ source, copy: mode === 'copy' }); });
  return <div className="space-y-6"><PageTitle eyebrow="DỰ ÁN" stamp="SỔ MẪU" title="Quản trị project template" subtitle="Blueprint có phiên bản, có thể nhân bản; phiên đã tạo giữ nguyên snapshot." action={<button className={buttonClass} onClick={() => setEditor({})}>Thêm mẫu mới</button>} />
    {notice && !action.busy && !action.error && <p role="status" className="border-l border-success pl-3 text-body text-success">{notice}</p>}{Boolean(action.error) && <ErrorState error={action.error} />}<Panel title="Thư viện mẫu"><div className="mb-4 grid gap-3 sm:grid-cols-2"><label className="text-body">Tìm project template<input className={inputClass} placeholder="Nhập tên hoặc mã mẫu…" value={query} onChange={e => setQuery(e.target.value)} /></label><label className="text-body">Trạng thái mẫu<select aria-label="Trạng thái mẫu" className={inputClass} value={status} onChange={e => { setStatus(e.target.value as typeof status); setPage(1); }}><option value="active">Đang sử dụng</option><option value="archived">Đã lưu trữ</option></select></label></div>
      {resource.loading ? <LoadingState /> : resource.error ? <ErrorState error={resource.error} onRetry={resource.reload} /> : resource.data?.items.length ? <ul className="admin-template-grid nb-stagger">{resource.data.items.map((template, index) => {
        const tape = TAPE_VARIANTS[index % TAPE_VARIANTS.length];
        return <SketchCard key={template.id} as="li" className={`card-tilt relative flex h-full flex-col p-5 pt-8${template.status === 'archived' ? ' admin-template-archived' : ''}`}>
          <Tape variant={tape.variant} rotate={tape.rotate} className="-top-3 left-7 w-24!" />
          {/* Mộc trang trí theo trạng thái thật: mẫu đang dùng đã qua kiểm, mẫu lưu trữ đóng mộc đỏ. */}
          <span aria-hidden="true" className="absolute right-3 top-2 z-10">
            <StampMoc tone={template.status === 'archived' ? 'red' : 'blue'} rotate={template.status === 'archived' ? -9 : -5} className="px-2! py-0.5! text-[0.55rem]!">{template.status === 'archived' ? 'Lưu trữ' : 'Đã kiểm'}</StampMoc>
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="admin-template-code">{template.code}</span>
            <InkBadge tone={template.status === 'archived' ? 'neutral' : 'green'} className="text-[0.65rem]!">{template.status === 'archived' ? 'Đã lưu trữ' : 'Đang sử dụng'}</InkBadge>
          </div>
          <h3 className="mt-2.5 text-lg font-extrabold leading-snug text-[var(--ink)]">{template.name}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <InkBadge tone="blue" className="text-[0.65rem]!">{template.category ?? 'Chưa phân loại'}</InkBadge>
            <InkBadge tone="neutral" className="text-[0.65rem]!">v{template.version}</InkBadge>
          </div>
          <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-[var(--ink-soft)]">{template.techStack.join(', ')}</p>
          <p className="mt-3 flex items-center gap-1.5 text-xs font-bold tabular-nums text-[var(--ink-soft)]">{template.teamSize} người · {template.sprintCount} sprint</p>
          <div className="admin-template-actions">
            <button disabled={action.busy} onClick={() => load(template, 'read')}>Xem blueprint</button>
            <button disabled={action.busy} onClick={() => load(template, 'edit')}>Chỉnh sửa</button>
            <button disabled={action.busy} onClick={() => load(template, 'copy')}>Nhân bản</button>
            <button disabled={action.busy} onClick={() => setArchive(template)}>{template.status === 'archived' ? 'Khôi phục' : 'Lưu trữ'}</button>
          </div>
        </SketchCard>;
      })}</ul> : <Empty title="Chưa có mẫu nào trong bộ lọc" description="Thử đổi từ khóa, hoặc chuyển sang xem các mẫu đã lưu trữ." />}
      {resource.data && <Pager page={page} total={resource.data.total} totalPages={resource.data.totalPages} onChange={setPage} />}
      <div className="mt-6 max-w-md">
        <NoteCard tone="yellow" title="Snapshot theo phiên bản" tapeVariant="warm">
          Phiên đã tạo giữ nguyên <b>snapshot</b> của phiên bản mẫu; chỉnh sửa tạo phiên bản mới, lưu trữ chỉ chặn mở phiên mới.
        </NoteCard>
      </div>
    </Panel>
    {editor && <Modal title={editor.source && !editor.copy ? 'Chỉnh sửa blueprint' : 'Tạo project template'} wide onClose={() => setEditor(null)}><TemplateEditor source={editor.source} copy={editor.copy} onSaved={() => { setNotice('Đã lưu project template. Các phiên đã tạo vẫn giữ nguyên snapshot.'); setEditor(null); resource.reload(); }} /></Modal>}
    {detail && <Modal title={detail.name} wide onClose={() => setDetail(null)}><div className="space-y-4"><TemplateMaterials key={`${detail.id}:${detail.version}`} source={detail} /><BlueprintPreview definition={detail.definition} /><p className="text-caption text-muted-foreground">{detail.runs.length} phiên gần nhất sử dụng mẫu này; lịch sử phiên giữ nguyên khi chỉnh sửa mẫu.</p></div></Modal>}
    {archive && <Modal title={archive.status === 'archived' ? 'Khôi phục mẫu' : 'Lưu trữ mẫu'} onClose={() => setArchive(null)}><p className="text-body text-muted-foreground">{archive.status === 'archived' ? 'Cho phép tạo phiên mới từ mẫu này.' : 'Ngừng tạo phiên mới từ mẫu này. Các phiên đang chạy và lịch sử vẫn được giữ nguyên.'}</p>{Boolean(action.error) && <ErrorState error={action.error} />}<div className="mt-4 flex justify-end gap-3"><button className={buttonClass} disabled={action.busy} onClick={() => void action.run(async () => { await setTemplateStatus(archive, archive.status === 'archived' ? 'active' : 'archived'); setNotice(archive.status === 'archived' ? 'Đã khôi phục mẫu.' : 'Đã lưu trữ mẫu.'); setArchive(null); resource.reload(); })}>Xác nhận</button></div></Modal>}
  </div>;
}
