import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { TextListField } from '../text-list-field';
import { RubricField } from '../rubric-field';
import { authoringDraft, blankKnowledgeDraft } from '../presentation';
import type { JsonValue } from '@/lib/api/knowledge';

it('edits a multiline alternative without splitting it or rewriting other correct answers', () => {
  const onChange = vi.fn(), values = ['Cách một\nCó ví dụ riêng.', 'Cách hai\nCó cách diễn đạt khác.'];
  render(<TextListField id="answers" label="Cách trả lời đúng" value={values} onChange={onChange} max={8} />);
  fireEvent.change(screen.getByLabelText('Cách trả lời đúng 1'), { target: { value: 'Bản sửa\nVẫn nhiều dòng.' } });
  expect(onChange).toHaveBeenLastCalledWith(['Bản sửa\nVẫn nhiều dòng.', values[1]]);
  expect(values[0]).toBe('Cách một\nCó ví dụ riêng.');
});
it('keeps unsupported imported draft fields until the editor explicitly resets them', () => {
  const onChange = vi.fn();
  render(<TextListField id="answers" label="Cách trả lời đúng" value={{ legacy: 'Giữ bản gốc' }} onChange={onChange} />);
  expect(screen.getByText(/Giữ nguyên dữ liệu gốc/)).toBeInTheDocument(); expect(onChange).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Đặt lại cách trả lời đúng' }));
  expect(onChange).toHaveBeenCalledWith([]);
});
it('preserves unknown draft rubric properties while changing only the selected criterion', () => {
  const onChange = vi.fn();
  const value: Record<string, JsonValue>[] = [{ criterion: 'Tư duy', description: 'Giải thích bằng bằng chứng.', weight: 60, legacyNote: 'Giữ lại' }, { criterion: 'Kiểm thử', description: 'Có bài kiểm tra phù hợp.', weight: 40 }];
  render(<RubricField value={value} onChange={onChange} />);
  expect(screen.getByRole('progressbar')).toHaveValue(100);
  fireEvent.change(screen.getByLabelText('Trọng số 1 (%)'), { target: { value: '50' } });
  expect(onChange).toHaveBeenLastCalledWith([{ ...value[0], weight: 50 }, value[1]]);
});
it('removes only fully blank source placeholders and keeps partial sources for validation', () => {
  const draft = { ...blankKnowledgeDraft(), sources: [{ title: '', url: '' }, { title: 'Nguồn đang soạn' }, { title: 'MDN', url: 'https://developer.mozilla.org/' }], body: { markdown: 'Nội dung', extraDraftField: ['Giữ lại'] } };
  const body = authoringDraft(draft);
  expect(body.sources).toEqual([{ title: 'Nguồn đang soạn' }, { title: 'MDN', url: 'https://developer.mozilla.org/' }]);
  expect(body.body).toEqual(draft.body); expect(draft.sources).toHaveLength(3);
});
