"use client";
import { useCallback, useEffect, useState } from 'react';
import { roleLabel as legacyRoleLabel } from '@/lib/api/workspace';
import { allCareerRoles } from '@/lib/api/career-roles';
import { listQuestionBank, questionPhases, retireQuestion, type BankQuestion } from '@/lib/api/question-bank';
import { useResource } from '@/lib/api/use-resource';
import { ErrorState, LoadingState } from '@/components/shared/data-state';
import { buttonClass, Empty, inputClass, Modal, PageTitle, Pager, Panel, StatusDot } from '@/components/product/primitives';
import { useAction } from '@/components/product/use-action';
import { linkButtonClass, NeutralDot } from './ui-bits';
import { FilterChips } from '@/components/notebook/kit';
import { InkBadge } from '@/components/notebook/ui';
import { InkCountUp } from '@/components/v-intern/motion';
import { VAlert, VFlag, VNotebookPen, VSmile, type VIconComponent } from '@/components/icons/v-icons';
import { QuestionEditor } from './question-editor';
export const phaseLabels: Record<string, string> = { technical: 'Chuyên môn', introduction: 'Giới thiệu', english: 'Tiếng Anh', communication: 'Giao tiếp' };

/* Độ khó — mã thật của backend (easy/medium/hard) kèm biểu tượng vẽ tay:
 * mặt cười / cờ / báo động đúng tinh thần ngân hàng câu sandbox. */
const difficultyMeta: Record<string, { label: string; tone: string; icon: VIconComponent }> = {
  easy: { label: 'Dễ', tone: 'green', icon: VSmile },
  medium: { label: 'Trung bình', tone: 'amber', icon: VFlag },
  hard: { label: 'Khó', tone: 'red', icon: VAlert },
};
const difficultyOptions: { value: '' | 'easy' | 'medium' | 'hard'; label: string }[] = [
  { value: '', label: 'Tất cả' },
  { value: 'easy', label: 'Dễ' },
  { value: 'medium', label: 'Trung bình' },
  { value: 'hard', label: 'Khó' },
];
function DifficultyBadge({ value }: { value: string }) {
  const meta = difficultyMeta[value];
  if (!meta) return <span className="text-caption text-muted-foreground">{value}</span>;
  const Icon = meta.icon;
  return <InkBadge tone={meta.tone} className="text-[0.65rem]!"><Icon size={12} aria-hidden="true" />{meta.label}</InkBadge>;
}
export function QuestionBank() {
  const careers = useResource(useCallback((signal: AbortSignal) => allCareerRoles(signal), []));
  const questionRoles = (careers.data ?? []).map(role => role.code);
  const roleLabel = (code: string) => careers.data?.find(role => role.code === code)?.name ?? legacyRoleLabel(code);
  const [search, setSearch] = useState(''), [debounced, setDebounced] = useState(''), [role, setRole] = useState(''), [phase, setPhase] = useState(''), [status, setStatus] = useState('active'), [page, setPage] = useState(1);
  /* Độ khó lọc phía client trên trang đang tải — máy chủ chưa exposing
     query lọc độ khó, ghi chú rõ để không gây hiểu lầm phạm vi. */
  const [difficulty, setDifficulty] = useState<'' | 'easy' | 'medium' | 'hard'>('');
  const [editor, setEditor] = useState<BankQuestion | 'new' | null>(null), [retiring, setRetiring] = useState<BankQuestion | null>(null);
  /* Confetti 6 hạt khi lưu câu hỏi thành công — bật đúng 1 lần ~0.95s. */
  const [confetti, setConfetti] = useState(false);
  useEffect(() => { const timer = setTimeout(() => { setDebounced(search.trim()); setPage(1); }, 300); return () => clearTimeout(timer); }, [search]);
  const state = useResource(useCallback((signal: AbortSignal) => listQuestionBank(new URLSearchParams({ page: String(page), pageSize: '10', ...(debounced ? { search: debounced } : {}), ...(role ? { roleCode: role } : {}), ...(phase ? { phase } : {}), ...(status ? { status } : {}) }), signal), [page, debounced, role, phase, status]));
  const action = useAction();
  const [notice, setNotice] = useState('');
  const items = state.data?.items ?? [];
  const visible = difficulty ? items.filter(q => q.difficulty === difficulty) : items;
  const activeOnPage = items.filter(q => q.isActive).length;
  const saved = (created: boolean) => { setNotice('Đã lưu câu hỏi. Nội dung mới áp dụng cho phỏng vấn tương lai.'); setEditor(null); if (created) { setConfetti(true); window.setTimeout(() => setConfetti(false), 950); } state.reload(); };
  return <div className="space-y-6">
    <PageTitle eyebrow="NGÂN HÀNG CÂU HỎI" stamp="PHỎNG VẤN" title="Ngân hàng câu hỏi phỏng vấn" subtitle="Nội dung và hướng dẫn chấm riêng tư; thay đổi chỉ áp dụng cho phỏng vấn tương lai." action={<button className={buttonClass} disabled={!careers.data?.length || careers.loading || Boolean(careers.error)} onClick={() => setEditor('new')}>Thêm câu hỏi</button>} />
    {notice && !action.busy && !action.error && <p role="status" className="border-l border-success pl-3 text-body text-success">{notice}</p>}
    {Boolean(careers.error) && <ErrorState error={careers.error} onRetry={careers.reload} />}
    {state.data && <Panel title="Độ phủ câu hỏi đang dùng"><div className="min-w-0 overflow-x-auto" role="region" aria-label="Số câu hỏi đang dùng theo nghề nghiệp và nhóm câu hỏi" tabIndex={0}><table className="admin-coverage-table min-w-[36rem]"><caption className="sr-only">Số câu hỏi đang dùng theo nghề nghiệp và nhóm câu hỏi</caption><thead><tr>{['Nghề nghiệp', 'Chuyên môn', 'Giới thiệu', 'Tiếng Anh', 'Sẵn sàng phỏng vấn'].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{questionRoles.map(code => { const count = (type: string) => state.data!.coverage.find(c => c.roleCode === code && c.phase === type)?.count ?? 0; const ready = count('technical') >= 6 && count('introduction') >= 2 && count('english') >= 2; return <tr key={code}><th scope="row">{roleLabel(code)}</th><td>{count('technical')}</td><td>{count('introduction')}</td><td>{count('english')}</td><td><StatusDot tone={ready ? 'green' : 'amber'}>{ready ? 'Đủ số lượng tối thiểu cho 10 câu' : 'Cần bổ sung trước khi mở phỏng vấn'}</StatusDot></td></tr>; })}</tbody></table></div></Panel>}
    <Panel title="Danh sách câu hỏi"><div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><label className="text-body">Tìm nội dung<input className={inputClass} placeholder="Nhập từ khóa trong nội dung câu hỏi…" value={search} onChange={e => setSearch(e.target.value)} /></label><label className="text-body">Vai trò<select className={inputClass} value={role} onChange={e => { setRole(e.target.value); setPage(1); }}><option value="">Tất cả</option>{questionRoles.map(code => <option key={code} value={code}>{roleLabel(code)}</option>)}</select></label><label className="text-body">Nhóm câu hỏi<select className={inputClass} value={phase} onChange={e => { setPhase(e.target.value); setPage(1); }}><option value="">Tất cả</option>{questionPhases.map(code => <option key={code} value={code}>{phaseLabels[code]}</option>)}</select></label><label className="text-body">Trạng thái<select aria-label="Trạng thái" className={inputClass} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="active">Đang sử dụng</option><option value="retired">Đã ngừng sử dụng</option><option value="">Tất cả</option></select></label></div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="eyebrow shrink-0 text-[0.6rem]!">Độ khó</span>
        <FilterChips ariaLabel="Lọc câu hỏi theo độ khó" options={difficultyOptions} value={difficulty} onChange={setDifficulty} />
        {difficulty && <span className="text-caption text-muted-foreground">Áp dụng cho trang hiện tại ({items.length} câu)</span>}
      </div>
      {state.loading ? <LoadingState /> : state.error ? <ErrorState error={state.error} onRetry={state.reload} /> : visible.length ? <ul className="nb-stagger divide-y divide-border">{visible.map(q => <li key={q.id} className="py-5 first:pt-0"><div className="flex flex-wrap items-center justify-between gap-3 text-caption text-muted-foreground"><p className="flex flex-wrap items-center gap-x-1.5 gap-y-1">{roleLabel(q.roleCode)} / {phaseLabels[q.phase]} / {q.language.toUpperCase()} / <DifficultyBadge value={q.difficulty} /></p>{q.isActive ? <StatusDot tone="green">Đang dùng</StatusDot> : <NeutralDot>Đã ngừng</NeutralDot>}</div><p className="mt-3 whitespace-pre-wrap text-body leading-relaxed text-foreground">{q.prompt}</p><div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2"><button className={`${linkButtonClass} text-primary hover:underline underline-offset-4`} onClick={() => setEditor(q)}>Xem & chỉnh sửa</button>{q.isActive && <button className={`${linkButtonClass} text-destructive hover:underline underline-offset-4`} onClick={() => setRetiring(q)}>Ngừng sử dụng</button>}<span className="text-caption text-muted-foreground">Phiên bản {q.version}</span></div></li>)}</ul> : <Empty title={difficulty ? 'Không có câu hỏi nào khớp độ khó trên trang này' : 'Chưa có câu hỏi nào'} description={difficulty ? 'Thử chọn Tất cả độ khó, hoặc chuyển sang trang khác.' : 'Thử thay đổi bộ lọc, hoặc thêm câu hỏi mới để bổ sung ngân hàng phỏng vấn.'} />}
      {/* Thống kê chân bảng — số chạy dần (InkCountUp) từ dữ liệu thật: tổng
          toàn hệ thống theo máy chủ và số đang dùng trong trang hiện tải. */}
      {state.data && <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 border-t-2 border-dashed border-border px-1 pt-3 text-caption text-muted-foreground">
        <VNotebookPen size={14} className="shrink-0" aria-hidden="true" />
        <p className="tabular-nums"><InkCountUp value={state.data.total} /> câu hỏi toàn hệ thống · <strong className="text-foreground"><InkCountUp value={activeOnPage} /></strong> đang dùng trong {items.length} câu của trang này</p>
      </div>}
      {state.data && <Pager page={page} total={state.data.total} totalPages={Math.ceil(state.data.total / state.data.pageSize)} onChange={setPage} unit="câu hỏi" />}
    </Panel>
    {editor && <Modal title={editor === 'new' ? 'Thêm câu hỏi' : 'Chỉnh sửa câu hỏi'} wide onClose={() => setEditor(null)}><QuestionEditor roles={careers.data ?? []} question={editor === 'new' ? undefined : editor} onSaved={() => saved(editor === 'new')} /></Modal>}
    {retiring && <Modal title="Ngừng sử dụng câu hỏi" onClose={() => setRetiring(null)}><p className="text-body text-muted-foreground">Câu hỏi sẽ không được chọn cho phỏng vấn mới. Nội dung các buổi phỏng vấn đã bắt đầu vẫn được giữ nguyên.</p>{Boolean(action.error) && <ErrorState error={action.error} />}<div className="mt-4 flex justify-end gap-3"><button className={buttonClass} disabled={action.busy} onClick={() => void action.run(async () => { await retireQuestion(retiring); setNotice('Đã ngừng sử dụng câu hỏi cho phỏng vấn mới.'); setRetiring(null); state.reload(); })}>{action.busy ? 'Đang lưu…' : 'Xác nhận ngừng sử dụng'}</button></div></Modal>}
    {confetti && <span aria-hidden="true" className="confetti-pop play" />}
  </div>;
}
