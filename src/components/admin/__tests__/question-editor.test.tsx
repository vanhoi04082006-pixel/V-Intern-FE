import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QuestionEditor } from '../question-editor';
import { saveQuestion, type BankQuestion } from '@/lib/api/question-bank';
vi.mock('@/lib/api/question-bank', async original => ({ ...await original<typeof import('@/lib/api/question-bank')>(), saveQuestion: vi.fn() }));
const question: BankQuestion = { id: 'q', roleCode: 'backend', phase: 'technical', difficulty: 'medium', language: 'vi', prompt: 'Giải thích transaction và rollback?', exampleAnswer: 'Các bước phải hoàn tất nguyên tử.', scoringRubric: 'Chấm theo tính đúng và bằng chứng.', expectedConcepts: ['SQL'], followUpHints: ['Hỏi ví dụ thực tế'], tags: ['SQL'], isActive: true, version: 3, sortOrder: 1000, updatedAt: '2026-10-15' };
beforeEach(() => { vi.mocked(saveQuestion).mockResolvedValue(question); });
describe('private question editing', () => {
  it('preserves the version and private guidance while editing bounded fields', async () => {
    const onSaved = vi.fn(); render(<QuestionEditor roles={[{ code: "backend", name: "Backend Developer" }, { code: "data_analyst", name: "Data Analyst" }]} question={question} onSaved={onSaved} />);
    expect(screen.getByLabelText('Vai trò')).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Ý chính mong đợi (mỗi dòng một ý)'), { target: { value: 'SQL\nrollback\nSQL' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu câu hỏi' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    expect(saveQuestion).toHaveBeenCalledWith(expect.objectContaining({ expectedConcepts: ['SQL', 'rollback'], exampleAnswer: question.exampleAnswer }), expect.objectContaining({ id: 'q', version: 3 }));
  });
  it('forces the English language for English interview questions', () => {
    render(<QuestionEditor roles={[{ code: "backend", name: "Backend Developer" }, { code: "data_analyst", name: "Data Analyst" }]} onSaved={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Nhóm câu hỏi'), { target: { value: 'english' } });
    expect(screen.getByLabelText('Ngôn ngữ')).toHaveValue('en'); expect(screen.getByLabelText('Ngôn ngữ')).toBeDisabled();
  });
});
