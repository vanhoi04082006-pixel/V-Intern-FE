import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { KnowledgeEditor } from '../editor';
import { KnowledgePublicationReview } from '../publication-review';
import { KnowledgeHistory } from '../history';
import { KnowledgeImport } from '../import-preview';
import { blankKnowledgeDraft } from '../presentation';
import type { KnowledgeDocument } from '@/lib/api/knowledge';
import { ApiError } from '@/lib/auth/api-client';

const api = vi.hoisted(() => ({ getKnowledge: vi.fn(), createKnowledge: vi.fn(), updateKnowledge: vi.fn(), checkKnowledgePublication: vi.fn(), publishKnowledge: vi.fn(), archiveKnowledge: vi.fn(), restoreKnowledge: vi.fn(), listKnowledgeHistory: vi.fn(), knowledgeDryRun: vi.fn() }));
const access = vi.hoisted(() => ({ read: true, manage: true, publish: true }));
const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
vi.mock('@/lib/api/knowledge', async () => ({ ...await vi.importActual('@/lib/api/knowledge'), ...api }));
vi.mock('@/lib/api/career-roles', () => ({ allCareerRoles: vi.fn().mockResolvedValue([]) }));
vi.mock('../access', () => ({ useKnowledgeAccess: () => access }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

function document(version = 1, status: KnowledgeDocument['status'] = 'draft'): KnowledgeDocument {
  return { id: 'knowledge-id', code: 'git-errors', version, status, sha256: 'a'.repeat(64), snapshot: { ...blankKnowledgeDraft(), schemaVersion: 1, code: 'git-errors', version, status, title: 'Xử lý lỗi Git', summary: 'Đọc thông báo, đối chiếu trạng thái và kiểm chứng kết quả.', body: { markdown: 'Giữ nguyên nội dung nhiều dòng.\nCó bằng chứng riêng.', importedNote: 'Không làm mất dữ liệu' }, sources: [{ title: 'Git documentation', url: 'https://git-scm.com/docs' }] } };
}
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
beforeEach(() => {
  vi.clearAllMocks(); Object.assign(access, { read: true, manage: true, publish: true });
  api.getKnowledge.mockResolvedValue(document());
  api.checkKnowledgePublication.mockResolvedValue({ code: 'git-errors', currentVersion: 1, status: 'draft', sha256: 'a'.repeat(64), publishable: true, issues: [] });
});

it('creates a draft with explicit identity and navigates to the authoritative result', async () => {
  api.createKnowledge.mockResolvedValue(document());
  render(<KnowledgeEditor />);
  fireEvent.change(await screen.findByLabelText('Mã tài liệu'), { target: { value: 'git-errors' } });
  fireEvent.change(screen.getByLabelText('Tiêu đề'), { target: { value: 'Xử lý lỗi Git' } });
  fireEvent.change(screen.getByLabelText('Nội dung Markdown'), { target: { value: 'Nội dung\nNhiều dòng.' } });
  fireEvent.submit(screen.getByRole('form', { name: 'Biên soạn tài liệu' }));
  await waitFor(() => expect(api.createKnowledge).toHaveBeenCalledWith('git-errors', expect.objectContaining({ title: 'Xử lý lỗi Git', body: { markdown: 'Nội dung\nNhiều dòng.' } })));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/admin/knowledge/git-errors'));
  expect(api.publishKnowledge).not.toHaveBeenCalled();
});

it('does not fetch document content without read access or expose creation without manage', () => {
  access.read = false;
  const view = render(<KnowledgeEditor code="git-errors" />);
  expect(screen.getByRole('alert')).toHaveTextContent('Chưa có quyền biên soạn');
  expect(api.getKnowledge).not.toHaveBeenCalled();
  access.read = true; access.manage = false;
  view.rerender(<KnowledgeEditor />);
  expect(screen.getByRole('alert')).toHaveTextContent('Chưa có quyền biên soạn');
  expect(api.getKnowledge).not.toHaveBeenCalled();
});

it('requires confirmation to leave an unsaved draft through its library link', async () => {
  render(<KnowledgeEditor code="git-errors" />);
  fireEvent.change(await screen.findByLabelText('Tiêu đề'), { target: { value: 'Tên chưa lưu' } });
  fireEvent.click(screen.getByRole('link', { name: 'Kho tri thức' }));
  expect(screen.getByRole('dialog')).toHaveAccessibleName('Rời trình soạn?');
  expect(router.push).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục soạn' }));
  expect(screen.getByLabelText('Tiêu đề')).toHaveValue('Tên chưa lưu');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('retains a failed draft and requires explicit replacement after comparing the server version', async () => {
  api.updateKnowledge.mockRejectedValue(new ApiError(409, 'KNOWLEDGE_VERSION_CONFLICT', 'Version conflict'));
  render(<KnowledgeEditor code="git-errors" />);
  fireEvent.change(await screen.findByLabelText('Tiêu đề'), { target: { value: 'Nội dung tôi đang soạn' } });
  fireEvent.submit(screen.getByRole('form', { name: 'Biên soạn tài liệu' }));
  await screen.findByRole('button', { name: 'Đối chiếu bản mới' });
  expect(api.updateKnowledge).toHaveBeenCalledWith('git-errors', 1, expect.objectContaining({ body: document().snapshot.body }));
  expect(screen.getByLabelText('Tiêu đề')).toHaveValue('Nội dung tôi đang soạn');
  api.getKnowledge.mockResolvedValue({ ...document(2), snapshot: { ...document(2).snapshot, title: 'Bản mới đã lưu' } });
  fireEvent.click(screen.getByRole('button', { name: 'Đối chiếu bản mới' }));
  const dialog = screen.getByRole('dialog');
  await within(dialog).findByText('Bản mới đã lưu');
  expect(screen.getByLabelText('Tiêu đề')).toHaveValue('Nội dung tôi đang soạn');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Bỏ phần chưa lưu và dùng bản này' }));
  await waitFor(() => expect(screen.getByLabelText('Tiêu đề')).toHaveValue('Bản mới đã lưu'));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.queryByText('Nội dung đang soạn vẫn được giữ.')).not.toBeInTheDocument();
});

it('asks before replacing content on a kind change and preserves the safer audience', async () => {
  const row = document(); row.snapshot.audience = 'grading_only';
  api.getKnowledge.mockResolvedValue(row);
  render(<KnowledgeEditor code="git-errors" />);
  fireEvent.change(await screen.findByLabelText('Loại tài liệu'), { target: { value: 'qa' } });
  expect(screen.getByLabelText('Nội dung Markdown')).toHaveValue('Giữ nguyên nội dung nhiều dòng.\nCó bằng chứng riêng.');
  fireEvent.click(screen.getByRole('button', { name: 'Đổi loại và soạn lại nội dung' }));
  expect(screen.getByLabelText('Cách trả lời đúng 1')).toHaveValue('');
  api.updateKnowledge.mockResolvedValue(document(2));
  fireEvent.submit(screen.getByRole('form', { name: 'Biên soạn tài liệu' }));
  await waitFor(() => expect(api.updateKnowledge).toHaveBeenCalledWith('git-errors', 1, expect.objectContaining({ kind: 'qa', audience: 'grading_only', sources: row.snapshot.sources, title: row.snapshot.title })));
});

it('permits a publish-only Admin to review and publish without granting authoring or import rights', async () => {
  access.manage = false; api.publishKnowledge.mockResolvedValue(document(2, 'published'));
  render(<KnowledgeEditor code="git-errors" />);
  expect(await screen.findByLabelText('Tiêu đề')).toBeDisabled();
  expect(screen.queryByRole('button', { name: 'Lưu bản nháp' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra & xuất bản' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Xác nhận xuất bản' }));
  await waitFor(() => expect(api.publishKnowledge).toHaveBeenCalledWith('git-errors', 1));
  expect(api.knowledgeDryRun).not.toHaveBeenCalled(); expect(api.updateKnowledge).not.toHaveBeenCalled();
});

it.each([
  { currentVersion: 2, sha256: 'a'.repeat(64), publishable: true, issues: [] },
  { currentVersion: 1, sha256: 'b'.repeat(64), publishable: true, issues: [] },
  { currentVersion: 1, sha256: 'a'.repeat(64), publishable: false, issues: ['Cần ít nhất hai cách trả lời đúng.'] },
])('blocks confirmation for a stale or incomplete saved document %#', async result => {
  api.checkKnowledgePublication.mockResolvedValue({ ...result, status: 'draft', code: 'git-errors' });
  const onPublish = vi.fn();
  render(<KnowledgePublicationReview document={document()} busy={false} onPublish={onPublish} />);
  expect(await screen.findByRole('button', { name: 'Xác nhận xuất bản' })).toBeDisabled();
  expect(onPublish).not.toHaveBeenCalled();
});

it('restores only a selected historical version after explicit confirmation', async () => {
  api.listKnowledgeHistory.mockResolvedValue({ items: [{ version: 1, snapshot: document().snapshot, sha256: 'a'.repeat(64), createdBy: 'actor', createdAt: '2026-10-24T00:00:00Z' }], total: 1, page: 1, pageSize: 20 });
  const onRestore = vi.fn();
  render(<KnowledgeHistory document={document(3, 'archived')} busy={false} canRestore onRestore={onRestore} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Xem phiên bản 1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Khôi phục phiên bản 1' }));
  expect(onRestore).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận khôi phục' }));
  expect(onRestore).toHaveBeenCalledWith(1);
});

it('checks a file without creating, updating or publishing documents', async () => {
  const entries = [{ code: 'git-errors', draft: blankKnowledgeDraft() }];
  api.knowledgeDryRun.mockResolvedValue({ total: 1, validDrafts: 1, publishable: 0, mutationsPerformed: 0, items: [{ index: 0, code: 'git-errors', validDraft: true, publishable: false, exists: false, currentVersion: null, issues: [], publicationIssues: ['Cần nguồn tham khảo.'] }] });
  render(<KnowledgeImport />);
  const file = new File([JSON.stringify(entries)], 'knowledge.json', { type: 'application/json' });
  Object.defineProperty(file, 'text', { value: async () => JSON.stringify(entries) });
  fireEvent.change(screen.getByLabelText('File JSON cần kiểm tra'), { target: { files: [file] } });
  fireEvent.click(await screen.findByRole('button', { name: 'Kiểm tra lô' }));
  await screen.findByText('Đã kiểm tra, không ghi dữ liệu');
  expect(api.knowledgeDryRun).toHaveBeenCalledWith(entries, expect.any(AbortSignal));
  expect(api.createKnowledge).not.toHaveBeenCalled(); expect(api.updateKnowledge).not.toHaveBeenCalled(); expect(api.publishKnowledge).not.toHaveBeenCalled();
});
