import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WaitingRecruitmentSummary } from '../waiting-recruitment-summary';

vi.mock('@/lib/api/recruitment', () => ({ recruitmentApi: {
  me: vi.fn().mockResolvedValue({ selectedRole: 'backend', result: {
    technicalScore: 82, softSkillScore: 76, overallScore: 80.2,
    strengths: ['Thiết kế API'], weaknesses: ['Cần bổ sung kiểm thử'],
    criteria: [{ code: 'reasoning', score: 85, feedback: 'Lý giải rõ ràng' }],
  } }),
  history: vi.fn().mockResolvedValue({ total: 1, items: [{
    id: 's1', roleCode: 'backend', attemptNumber: 1, status: 'completed',
    startedAt: '2026-10-15T00:00:00Z',
    result: { decision: 'passed', overallScore: 80.2, feedback: 'Có nền tảng tốt' },
  }] }),
} }));

describe('waiting recruitment summary', () => {
  it('shows persisted scores, skills and owned history without opening project features', async () => {
    render(<WaitingRecruitmentSummary />);
    expect(await screen.findAllByText('80.2/100')).toHaveLength(2);
    expect(screen.getByText('Thiết kế API')).toBeInTheDocument();
    expect(screen.getByText('Cần bổ sung kiểm thử')).toBeInTheDocument();
    expect(screen.getByText('Có nền tảng tốt')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Xem thông báo' })).toHaveAttribute('href', '/intern/notifications');
    expect(screen.queryByRole('link', { name: /Mentor|Task|Sprint/ })).not.toBeInTheDocument();
  });
});
