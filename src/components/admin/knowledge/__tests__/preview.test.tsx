import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { KnowledgePreview } from '../preview';
import { blankKnowledgeDraft } from '../presentation';

it('previews untrusted Markdown as text and keeps invalid source URLs inert', () => {
  const { container } = render(<KnowledgePreview draft={{ ...blankKnowledgeDraft(), title: 'Tài liệu nhập ngoài', sources: [{ title: 'Nguồn chưa hợp lệ', url: 'javascript:alert(1)' }], body: { markdown: '# Tiêu đề\n\n<img src=x onerror=alert(1)>\n\n[Liên kết giả](javascript:alert(1))\n\n```html\n<script>alert(1)</script>\n```' } }} />);
  expect(container.querySelector('img,script')).toBeNull();
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
  expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument();
  expect(screen.getByText(/URL chưa hợp lệ/)).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Tiêu đề' })).toBeInTheDocument();
});
it('renders independent multiline answers and opens only validated HTTPS citations', () => {
  render(<KnowledgePreview draft={{ ...blankKnowledgeDraft('qa'), title: 'Xử lý bất đồng bộ', body: { validAnswers: ['Dùng try/catch\nGiữ ví dụ thứ nhất.', 'Dùng Promise.catch\nGiữ ví dụ thứ hai.'] }, sources: [{ title: 'MDN', url: 'https://developer.mozilla.org/' }] }} />);
  expect(screen.getByText('Dùng try/catch Giữ ví dụ thứ nhất.')).toHaveTextContent('Dùng try/catch');
  expect(screen.getByText('Dùng Promise.catch Giữ ví dụ thứ hai.')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'https://developer.mozilla.org/' })).toHaveAttribute('rel', 'noopener noreferrer');
});
