import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { SessionTaskDelivery } from '../session-task-delivery';

const delivery = {
  blocked: false,
  submission: { id: 'sub', status: 'approved' as const, prUrl: 'https://github.com/qa/notes/pull/3',
    headSha: 'a'.repeat(40), submittedAt: '2026-10-26T00:00:00Z', aiStatus: 'inconclusive' as const,
    aiScore: 100, aiSummary: 'Thiếu dữ liệu lockfile.', instructorScore: 90,
    instructorFeedback: 'Đã đối chiếu độc lập; lý do được lưu trong audit.',
  },
};

describe('Compact task delivery evidence', () => {
  it('keeps distinct AI and instructor decisions, source and SHA visible before opening feedback', async () => {
    render(<SessionTaskDelivery data={delivery} />);
    expect(screen.getByText(/Chưa đủ bằng chứng/)).toBeVisible();
    expect(screen.getByText(/Giảng viên: 90\/100/)).toBeVisible();
    expect(screen.getByText(/SHA a{12}/)).toBeVisible();
    expect(screen.getByRole('link', { name: 'Mở bài nộp trên GitHub' })).toHaveAttribute('href', delivery.submission.prUrl);
    const summary = screen.getByText('Đọc nhận xét và bằng chứng');
    expect(summary.closest('details')).not.toHaveAttribute('open');
    await userEvent.click(summary);
    expect(summary.closest('details')).toHaveAttribute('open');
    expect(screen.getByText(delivery.submission.aiSummary)).toBeVisible();
    expect(screen.getByText(delivery.submission.instructorFeedback)).toBeVisible();
  });

  it('does not add an empty disclosure or imply a missing submission was reviewed', () => {
    render(<SessionTaskDelivery data={{ blocked: true, submission: null }} />);
    expect(screen.getByText('Chờ phụ thuộc')).toBeVisible();
    expect(screen.getByText('Chưa nộp bài.')).toBeVisible();
    expect(screen.queryByText('Đọc nhận xét và bằng chứng')).not.toBeInTheDocument();
  });
});
