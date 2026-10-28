"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Archive, ArrowLeft, Eye, History, Save } from 'lucide-react';
import { ApiError } from '@/lib/auth/api-client';
import { allCareerRoles } from '@/lib/api/career-roles';
import { archiveKnowledge, createKnowledge, getKnowledge, publishKnowledge, restoreKnowledge, toKnowledgeDraft, updateKnowledge, knowledgeKinds, type KnowledgeDocument, type KnowledgeDraft, type KnowledgeKind } from '@/lib/api/knowledge';
import { useResource } from '@/lib/api/use-resource';
import { useAction } from '@/components/product/use-action';
import { btn, Field, inputClass, InlineAlert, Modal, PageTitle, StatusDot } from '@/components/product/primitives';
import { ErrorState, LoadingState } from '@/components/shared/data-state';
import { useKnowledgeAccess } from './access';
import { authoringDraft, blankKnowledgeDraft, gradingKind, kindLabels, statusLabels, statusTone } from './presentation';
import { KnowledgeContentEditor } from './content-editor';
import { KnowledgeScopeEditor } from './scope-editor';
import { KnowledgeSourcesEditor } from './sources-editor';
import { KnowledgePreview } from './preview';
import { KnowledgePublicationReview } from './publication-review';
import { KnowledgeHistory } from './history';
import { KnowledgeCompareLatest } from './compare-latest';
import { KnowledgeFailure } from './failure';

type Access = ReturnType<typeof useKnowledgeAccess>;
export function KnowledgeEditor({ code }: { code?: string }) {
  const access = useKnowledgeAccess();
  if (!access.read || (!code && !access.manage)) return <InlineAlert tone="danger" title="Chưa có quyền biên soạn">Cần quyền đọc tri thức và quyền biên soạn để tạo tài liệu mới.</InlineAlert>;
  return <EditorData key={code ?? 'new'} code={code} access={access} />;
}
function EditorData({ code, access }: { code?: string; access: Access }) {
  const state = useResource(useCallback((signal: AbortSignal) => code ? getKnowledge(code, signal) : Promise.resolve(null), [code]));
  const careers = useResource(useCallback((signal: AbortSignal) => allCareerRoles(signal), []));
  const [replacement, setReplacement] = useState<KnowledgeDocument>();
  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />;
  if (state.loading || state.data === undefined) return <LoadingState label="Đang mở bàn biên soạn…" />;
  const initial = replacement ?? state.data;
  return <EditorForm key={initial?.version ?? 'new'} initial={initial} access={access} careers={careers.data ?? []} careerError={careers.error} retryCareers={careers.reload} onReplace={setReplacement} />;
}
type Career = Awaited<ReturnType<typeof allCareerRoles>>[number];
const stamp = (code: string, draft: KnowledgeDraft) => JSON.stringify({ code: code.trim(), draft: authoringDraft(draft) });
function EditorForm({ initial, access, careers, careerError, retryCareers, onReplace }: {
  initial: KnowledgeDocument | null; access: Access; careers: Career[]; careerError: unknown; retryCareers: () => void; onReplace: (document: KnowledgeDocument) => void;
}) {
  const router = useRouter(), action = useAction(), errorRef = useRef<HTMLDivElement>(null);
  const [document, setDocument] = useState(initial), [code, setCode] = useState(initial?.code ?? '');
  const [draft, setDraft] = useState<KnowledgeDraft>(() => initial ? toKnowledgeDraft(initial.snapshot) : blankKnowledgeDraft());
  const [baseline, setBaseline] = useState(() => stamp(initial?.code ?? '', initial ? toKnowledgeDraft(initial.snapshot) : blankKnowledgeDraft()));
  const [notice, setNotice] = useState(''), [dialog, setDialog] = useState<'preview' | 'publish' | 'archive' | 'history' | 'compare' | 'leave' | null>(null), [nextKind, setNextKind] = useState<KnowledgeKind>();
  const dirty = stamp(code, draft) !== baseline, disabled = action.busy || !access.manage;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  function accept(result: KnowledgeDocument, message: string) {
    const next = toKnowledgeDraft(result.snapshot); setDocument(result); setCode(result.code); setDraft(next); setBaseline(stamp(result.code, next)); setNotice(message); setDialog(null);
  }
  async function save() {
    const ok = await action.run(async () => {
      const result = document ? await updateKnowledge(document.code, document.version, authoringDraft(draft)) : await createKnowledge(code.trim(), authoringDraft(draft));
      accept(result, 'Đã lưu bản nháp và giữ một phiên bản lịch sử mới.');
      if (!document) router.replace(`/admin/knowledge/${encodeURIComponent(result.code)}`);
    });
    if (!ok) errorRef.current?.focus();
  }
  const mutate = (operation: () => Promise<KnowledgeDocument>, message: string) => void action.run(async () => accept(await operation(), message));
  const conflict = action.error instanceof ApiError && action.error.code === 'KNOWLEDGE_VERSION_CONFLICT';
  const closeDialog = () => { if (!action.busy) setDialog(null); };
  return <div className="min-w-0 space-y-6">
    <Link href="/admin/knowledge" className="inline-flex min-h-10 items-center gap-2 rounded-md text-sm font-medium text-slate-500 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600" onClick={event => { if (dirty) { event.preventDefault(); setDialog('leave'); } }}><ArrowLeft size={15} aria-hidden />Kho tri thức</Link>
    <PageTitle title={document ? 'Biên soạn tài liệu' : 'Soạn tài liệu mới'} subtitle={document ? `Phiên bản ${document.version}. Mỗi lần lưu tạo một bản lịch sử riêng.` : 'Bắt đầu bằng bản nháp. Nội dung chỉ được duyệt khi bạn xác nhận xuất bản.'} action={<><button type="button" className={btn('secondary')} disabled={action.busy} onClick={() => setDialog('preview')}><Eye size={16} aria-hidden />Xem trước</button>{document && <button type="button" className={btn('secondary')} disabled={action.busy} onClick={() => setDialog('history')}><History size={16} aria-hidden />Lịch sử</button>}</>} />
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4"><div className="flex flex-wrap items-center gap-3">{document && <StatusDot tone={statusTone(document.status)}>{statusLabels[document.status]}</StatusDot>}<span className="text-xs text-slate-500">{dirty ? 'Có thay đổi chưa lưu' : document ? 'Đang xem bản đã lưu' : 'Chưa tạo tài liệu'}</span></div>{document && access.manage && document.status !== 'archived' && <button type="button" disabled={dirty || action.busy} className={btn('ghost', 'sm')} onClick={() => setDialog('archive')}><Archive size={14} aria-hidden />Lưu trữ</button>}</div>
    {notice && <p role="status" className="border-l-2 border-emerald-500 pl-3 text-sm leading-6 text-emerald-800">{notice}</p>}
    {!access.manage && <InlineAlert tone="info">Bạn đang xem nội dung ở chế độ chỉ đọc. Quyền duyệt xuất bản được kiểm tra riêng.</InlineAlert>}
    <div ref={errorRef} tabIndex={-1} className="focus-visible:outline-none">{Boolean(action.error) && !dialog && <div className="space-y-3"><KnowledgeFailure error={action.error} /><p className="text-sm text-slate-600">Nội dung đang soạn vẫn được giữ.</p>{conflict && <button type="button" className={btn('secondary')} onClick={() => setDialog('compare')}>Đối chiếu bản mới</button>}</div>}</div>
    <nav aria-label="Chuyển đến phần biên soạn" className="flex flex-wrap gap-x-6 gap-y-1 text-sm font-medium text-slate-500">{[['information', 'Thông tin'], ['content', 'Nội dung'], ['sources', 'Nguồn'], ['scope', 'Phạm vi']].map(([id, label]) => <a key={id} className="inline-flex min-h-10 items-center rounded-md hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600" href={`#knowledge-${id}`}>{label}</a>)}</nav>
    <form aria-label="Biên soạn tài liệu" className="min-w-0" onSubmit={event => { event.preventDefault(); void save(); }}>
      <div className="grid min-w-0 items-start gap-8 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0 space-y-9">
          <section id="knowledge-information" className="space-y-5"><div><h2 className="text-lg font-semibold text-navy">Thông tin tài liệu</h2><p className="mt-1 text-xs leading-5 text-slate-500">Tên dễ tìm và mô tả rõ mục đích giúp người duyệt hiểu nội dung.</p></div><fieldset disabled={disabled} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Mã tài liệu" htmlFor="knowledge-code" hint="2–80 ký tự thường, số, gạch dưới hoặc gạch ngang. Mã giữ nguyên sau khi tạo."><input id="knowledge-code" className={inputClass} required pattern="[a-z][a-z0-9_-]{1,79}" maxLength={80} disabled={disabled || !!document} value={code} onChange={event => setCode(event.target.value)} /></Field><Field label="Loại tài liệu" htmlFor="knowledge-kind"><select id="knowledge-kind" className={inputClass} value={draft.kind} onChange={event => { const value = event.target.value as KnowledgeKind; if (value !== draft.kind) setNextKind(value); }}>{knowledgeKinds.map(value => <option key={value} value={value}>{kindLabels[value]}</option>)}</select></Field></div><Field label="Tiêu đề" htmlFor="knowledge-title"><input id="knowledge-title" className={inputClass} required minLength={2} maxLength={200} value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} /></Field><Field label="Mô tả ngắn" htmlFor="knowledge-summary" hint="Trước khi xuất bản, cần ít nhất 20 ký tự và nêu rõ năng lực hoặc tình huống được hỗ trợ."><textarea id="knowledge-summary" className={inputClass} rows={3} maxLength={1000} value={draft.summary} onChange={event => setDraft({ ...draft, summary: event.target.value })} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Ngôn ngữ" htmlFor="knowledge-language"><select id="knowledge-language" className={inputClass} value={draft.language} onChange={event => setDraft({ ...draft, language: event.target.value as KnowledgeDraft['language'] })}><option value="vi">Tiếng Việt</option><option value="en">Tiếng Anh</option></select></Field><Field label="Độ khó" htmlFor="knowledge-difficulty"><select id="knowledge-difficulty" className={inputClass} value={draft.difficulty ?? ''} onChange={event => setDraft({ ...draft, difficulty: event.target.value ? event.target.value as KnowledgeDraft['difficulty'] : null })}><option value="">Không phân loại</option><option value="easy">Cơ bản</option><option value="medium">Trung bình</option><option value="hard">Nâng cao</option></select></Field></div></fieldset></section>
          <section id="knowledge-content" className="space-y-5 border-t border-slate-200 pt-7"><h2 className="text-lg font-semibold text-navy">Nội dung biên soạn</h2><KnowledgeContentEditor draft={draft} disabled={disabled} onChange={body => setDraft({ ...draft, body })} /></section>
          <section id="knowledge-sources" className="space-y-5 border-t border-slate-200 pt-7"><h2 className="text-lg font-semibold text-navy">Nguồn tham khảo</h2><KnowledgeSourcesEditor sources={draft.sources} disabled={disabled} onChange={sources => setDraft({ ...draft, sources })} /></section>
        </div>
        <aside id="knowledge-scope" className="min-w-0 space-y-6 border-t border-slate-200 pt-6 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0"><div><h2 className="text-base font-semibold text-navy">Phạm vi sử dụng</h2><p className="mt-2 text-xs leading-5 text-slate-500">Chọn công việc và loại nội dung được phép cung cấp. Đây không phải quyền đọc dữ liệu của sinh viên khác.</p></div>{Boolean(careerError) && <InlineAlert tone="warning">Chưa tải được tên nghề. Mã đang lưu vẫn được giữ.<button type="button" className="ml-2 underline" onClick={retryCareers}>Thử lại danh mục</button></InlineAlert>}<KnowledgeScopeEditor draft={draft} disabled={disabled} careers={careers} onChange={setDraft} /></aside>
      </div>
      <div className="sticky bottom-0 z-10 mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white/95 py-4 backdrop-blur-sm"><div className="max-w-xl text-xs leading-5 text-slate-500">{document?.status === 'published' ? 'Lưu thay đổi sẽ tạo bản nháp mới và cần duyệt xuất bản lại. Lịch sử cũ vẫn được giữ.' : dirty ? 'Lưu bản nháp trước khi kiểm tra xuất bản, lưu trữ hoặc khôi phục.' : 'Xuất bản là xác nhận đã duyệt nội dung và nguồn. Kho chưa nối vào AI hiện tại.'}</div><div className="flex flex-wrap gap-2">{access.manage && <button type="submit" className={btn(document && !dirty ? 'secondary' : 'primary')} disabled={action.busy || (!!document && !dirty)}><Save size={15} aria-hidden />{action.busy ? 'Đang xử lý…' : 'Lưu bản nháp'}</button>}{document && access.publish && document.status === 'draft' && <button type="button" className={btn(dirty ? 'secondary' : 'primary')} disabled={dirty || action.busy} onClick={() => setDialog('publish')}>Kiểm tra & xuất bản</button>}</div></div>
    </form>
    {dialog && <Modal title={dialog === 'preview' ? 'Xem trước bản đang soạn' : dialog === 'publish' ? 'Kiểm tra trước khi xuất bản' : dialog === 'history' ? 'Lịch sử tài liệu' : dialog === 'compare' ? 'Đối chiếu bản mới' : dialog === 'leave' ? 'Rời trình soạn?' : 'Lưu trữ tài liệu?'} wide={['preview', 'publish', 'history', 'compare'].includes(dialog)} onClose={closeDialog}>
      {Boolean(action.error) && dialog !== 'compare' && <div className="mb-5 space-y-3"><KnowledgeFailure error={action.error} />{conflict && <button type="button" className={btn('secondary', 'sm')} onClick={() => setDialog('compare')}>Đối chiếu bản mới</button>}</div>}
      {dialog === 'preview' && <KnowledgePreview code={code} draft={authoringDraft(draft)} />}
      {dialog === 'publish' && document && <KnowledgePublicationReview document={document} busy={action.busy} onPublish={() => mutate(() => publishKnowledge(document.code, document.version), 'Đã xuất bản phiên bản mới của tài liệu.')} />}
      {dialog === 'history' && document && <KnowledgeHistory document={document} canRestore={access.manage && !dirty} busy={action.busy} onRestore={version => mutate(() => restoreKnowledge(document.code, document.version, version), 'Đã khôi phục thành bản nháp mới. Cần kiểm tra và xuất bản lại.')} />}
      {dialog === 'archive' && document && <div className="space-y-5"><p className="text-sm leading-7 text-slate-600">Tạo phiên bản đã lưu trữ, dừng dùng tài liệu cho lượt chạy mới. Nội dung và mọi phiên bản cũ vẫn được giữ. Có thể khôi phục thành bản nháp sau này.</p><button type="button" className={btn()} disabled={action.busy} onClick={() => mutate(() => archiveKnowledge(document.code, document.version), 'Đã lưu trữ tài liệu và giữ nguyên lịch sử.')}>{action.busy ? 'Đang lưu trữ…' : 'Xác nhận lưu trữ'}</button></div>}
      {dialog === 'compare' && <KnowledgeCompareLatest code={document?.code ?? code.trim()} onReplace={result => { onReplace(result); if (!document) router.replace(`/admin/knowledge/${encodeURIComponent(result.code)}`); }} />}
      {dialog === 'leave' && <div className="space-y-4"><p className="text-sm leading-6 text-slate-600">Phần đang soạn chưa được lưu. Rời trang sẽ bỏ các thay đổi này; phiên bản đã lưu vẫn giữ nguyên.</p><div className="flex flex-wrap gap-2"><button type="button" className={btn('secondary')} onClick={closeDialog}>Tiếp tục soạn</button><button type="button" className={btn()} onClick={() => router.push('/admin/knowledge')}>Bỏ thay đổi và rời trang</button></div></div>}
    </Modal>}
    {nextKind && <Modal title="Đổi loại tài liệu?" onClose={() => setNextKind(undefined)}><p className="text-sm leading-6 text-slate-600">Phần nội dung đang soạn sẽ được thay bằng cấu trúc {kindLabels[nextKind].toLowerCase()}. Tiêu đề, nguồn và nghề vẫn giữ; mục đích được gợi ý lại. Phạm vi nội dung không tự hạ từ mức riêng tư hơn.</p><div className="mt-5 flex flex-wrap gap-2"><button type="button" className={btn('secondary')} onClick={() => setNextKind(undefined)}>Giữ loại hiện tại</button><button type="button" className={btn()} onClick={() => { const fresh = blankKnowledgeDraft(nextKind), rank = { student_safe: 0, staff_only: 1, grading_only: 2 }; setDraft({ ...draft, kind: nextKind, body: fresh.body, purposes: fresh.purposes, audience: gradingKind(nextKind) || rank[fresh.audience] > rank[draft.audience] ? fresh.audience : draft.audience }); setNextKind(undefined); }}>Đổi loại và soạn lại nội dung</button></div></Modal>}
  </div>;
}
