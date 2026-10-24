import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TemplateEditor } from '../template-editor';
import { saveTemplateDefinition, type TemplateDetail } from '@/lib/api/templates';
vi.mock('@/lib/api/templates', async original => ({ ...await original<typeof import('@/lib/api/templates')>(), saveTemplateDefinition: vi.fn() }));
const template: TemplateDetail = { id: 'tpl', code: 'TASKS', name: 'Task management', category: 'small-projects', difficulty: 'beginner', status: 'active', version: 3, techStack: ['React'], roles: ['frontend'], teamSize: 1, sprintCount: 1, createdAt: '2026-10-15', archivedAt: null, runs: [], definition: { description: 'A complete task management blueprint', architecture: { entities: ['Task'] }, sprints: [{ tasks: [{ key: 'task-one', dependsOn: [] }] }] } };
beforeEach(() => { vi.mocked(saveTemplateDefinition).mockResolvedValue({ id: 'tpl', version: 4 }); });
describe('versioned template editor', () => {
  it('retains full architecture/task metadata and submits the version', async () => {
    const onSaved = vi.fn(); render(<TemplateEditor source={template} onSaved={onSaved} />);
    fireEvent.change(screen.getByLabelText('Tên mẫu'), { target: { value: 'Reviewed task blueprint' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu phiên bản mới' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    expect(saveTemplateDefinition).toHaveBeenCalledWith(expect.objectContaining({ name: 'Reviewed task blueprint', architecture: template.definition.architecture, sprints: template.definition.sprints }), template);
  });
  it('blocks malformed JSON before sending it to the API', async () => {
    render(<TemplateEditor source={template} onSaved={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Blueprint JSON đầy đủ'), { target: { value: '{broken' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu phiên bản mới' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Blueprint JSON chưa hợp lệ/);
    expect(saveTemplateDefinition).not.toHaveBeenCalled();
  });
  it('edits public teaching content through fields without dropping advanced architecture', async () => {
    render(<TemplateEditor source={template} onSaved={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Công nghệ · mỗi dòng một mục'), { target: { value: 'Node.js\nSQL Server' } });
    fireEvent.change(screen.getByLabelText('Hướng dẫn dự án'), { target: { value: 'Đọc hợp đồng rồi kiểm chứng từng hành vi bằng dữ liệu mẫu.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu phiên bản mới' }));
    await waitFor(() => expect(saveTemplateDefinition).toHaveBeenCalledWith(expect.objectContaining({ techStack: ['Node.js', 'SQL Server'], documentation: 'Đọc hợp đồng rồi kiểm chứng từng hành vi bằng dữ liệu mẫu.', architecture: template.definition.architecture }), template));
  });
});
