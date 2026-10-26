import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { InternWorkspace } from '@/lib/api/workspace';
import { StudentGithub } from '../student-github';

vi.mock('@/components/product/github-connection', () => ({
  GithubConnection: () => <div>Kết nối danh tính GitHub</div>,
  SessionRepositoryCard: ({ sessionId }: { sessionId: string }) => <div>Repository phiên {sessionId}</div>,
}));

const waiting: InternWorkspace = {
  status: 'unassigned', assignment: null, hasAssignmentHistory: false,
  recruitment: { status: 'passed', selectedRole: 'frontend', attemptCount: 1, recruitedAt: null },
  currentSprint: null, focusedTask: null, taskSummary: { todo: 0, doing: 0, review: 0, done: 0, total: 0 },
};

describe('GitHub after assignment history', () => {
  it('keeps the first-assignment instructions for a new intern', () => {
    render(<StudentGithub workspace={waiting} />);
    expect(screen.getByRole('heading', { name: 'Repository sẽ xuất hiện sau khi phân công' })).toBeVisible();
  });

  it('does not send a former intern back to first-assignment waiting', () => {
    render(<StudentGithub workspace={{ ...waiting, hasAssignmentHistory: true }} />);
    expect(screen.getByRole('heading', { name: 'Kết nối cho hành trình tiếp theo' })).toBeVisible();
    expect(screen.queryByText('Repository sẽ xuất hiện sau khi phân công')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Xem kết quả đã ghi nhận/ })).toHaveAttribute('href', '/intern/evaluations');
    expect(screen.queryByText(/Bạn đã hoàn thành/)).not.toBeInTheDocument();
  });

  it('keeps the active session repository and work action', () => {
    render(<StudentGithub workspace={{ ...waiting, status: 'active', hasAssignmentHistory: true, assignment: {
      id: 'assignment', assignedAt: '2026-10-26T00:00:00Z',
      project: { id: 'project', name: 'Notes', code: 'NOTES', status: 'active' },
      session: { id: 'active-session', name: 'Practice', code: 'PRACTICE', status: 'active' },
    } }} />);
    expect(screen.getByText('Repository phiên active-session')).toBeVisible();
    expect(screen.getByRole('link', { name: /Đi đến công việc/ })).toHaveAttribute('href', '/intern/work');
    expect(screen.queryByText('Kết nối cho hành trình tiếp theo')).not.toBeInTheDocument();
  });
});
