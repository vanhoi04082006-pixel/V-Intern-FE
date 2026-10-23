import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StudentPerformance } from '../student-performance';
import { InternWorkspaceContext } from '../intern-workspace-context';
import { active, waiting } from '@/test/nest-fixtures';

const metrics = {
  totalTaskCount: 4, completedTaskCount: 4, taskCompletionRate: 100,
  committedStoryPoints: 12, completedStoryPoints: 12, storyPointCompletionRate: 100,
  onTimeCompletionRate: 100, overdueOpenTaskCount: 0,
  averageEvaluationScore: 85.5, finalizedEvaluationCount: 1, activeSprintProgress: null,
};

describe('performance next steps', () => {
  it('directs a completed placement to its outcomes instead of locked work', () => {
    render(<InternWorkspaceContext.Provider value={{ workspace: { ...waiting, hasAssignmentHistory: true }, reload: () => {} }}>
      <StudentPerformance data={metrics} />
    </InternWorkspaceContext.Provider>);
    expect(screen.queryByRole('link', { name: 'Xem công việc' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Xem đánh giá' })).toHaveAttribute('href', '/intern/evaluations');
    expect(screen.getByRole('link', { name: 'Gợi ý phát triển' })).toHaveAttribute('href', '/intern/recommendations');
  });

  it('keeps the work action for an active placement', () => {
    render(<InternWorkspaceContext.Provider value={{ workspace: active, reload: () => {} }}>
      <StudentPerformance data={metrics} />
    </InternWorkspaceContext.Provider>);
    expect(screen.getByRole('link', { name: 'Xem công việc' })).toHaveAttribute('href', '/intern/work');
  });
});
