import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { AssessmentEditor, type AssessmentChange } from '../assessment-editor';
function Editor() {
  const [value, setValue] = useState<AssessmentChange>({ mode: 'keep', text: '' });
  return <><AssessmentEditor value={value} onChange={setValue} /><output aria-label="Dữ liệu chấm">{value.text}</output></>;
}
describe('private assessment authoring', () => {
  it('authors a private reference and rubric through labeled fields', () => {
    render(<Editor />);
    fireEvent.change(screen.getByLabelText('Cách xử lý tài liệu chấm'), { target: { value: 'replace' } });
    fireEvent.change(screen.getByLabelText('Lời giải · đường dẫn 1'), { target: { value: 'src/solution.cjs' } });
    fireEvent.change(screen.getByLabelText('Lời giải · nội dung 1'), { target: { value: 'module.exports = 42;' } });
    fireEvent.change(screen.getByLabelText('Tiêu chí chấm 1'), { target: { value: 'Đúng hợp đồng' } });
    fireEvent.change(screen.getByLabelText('Task key 1'), { target: { value: 'core' } });
    const data = JSON.parse(screen.getByLabelText('Dữ liệu chấm').textContent!);
    expect(data.solutionFiles).toEqual([{ path: 'src/solution.cjs', content: 'module.exports = 42;' }]);
    expect(data.rubric[0]).toMatchObject({ criterion: 'Đúng hợp đồng', weight: 100 });
    expect(data.taskSuites[0].taskKey).toBe('core');
  });
  it('preserves malformed advanced row data without crashing the field editor', () => {
    render(<Editor />);
    fireEvent.change(screen.getByLabelText('Cách xử lý tài liệu chấm'), { target: { value: 'replace' } });
    fireEvent.change(screen.getByLabelText('Assessment JSON riêng'), { target: { value: '{"schemaVersion":1,"solutionFiles":[null],"hiddenTestFiles":[],"rubric":[],"taskSuites":[]}' } });
    expect(screen.getByRole('alert')).toHaveTextContent('Cấu trúc JSON chưa đủ');
    expect((screen.getByLabelText('Assessment JSON riêng') as HTMLTextAreaElement).value).toContain('[null]');
  });
});
