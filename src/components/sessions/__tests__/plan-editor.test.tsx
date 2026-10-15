import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PlanEditor } from '../plan-editor';
import { getProjectSlots } from '@/lib/api/academic';
vi.mock('@/lib/api/academic', () => ({ getProjectSlots: vi.fn(async () => []) }));
describe('plan editor relationships', () => {
  it('keeps the selected assignee when SQL and plan UUID casing differ', async () => {
    vi.mocked(getProjectSlots).mockResolvedValueOnce([{ roleCode: 'frontend', requiredCount: 1, filledCount: 1, members: [{ userId: 'ABC-DEF', displayName: 'Linh' }] }]);
    const task = { title: 'Form', description: null, priority: 'medium', storyPoints: 3, dueDate: null, suggestedRole: 'frontend', assigneeId: 'abc-def' };
    render(<PlanEditor projectId="p1" disabled={false} draft={{ sprints: [{ code: null, name: 'UI', goal: null, startDate: '2026-11-01', endDate: '2026-11-07', tasks: [task] }] }} onChange={vi.fn()} />);
    await screen.findByRole('option', { name: 'Linh · frontend' });
    expect(screen.getByLabelText('Người nhận task 1.1')).toHaveValue('ABC-DEF');
  });
  it('moves a task between sprints while preserving keys, outputs, dependencies and milestones', async () => {
    const task = { key: 'api', title: 'API', description: 'Validate input', priority: 'high', storyPoints: 3, dueDate: '2026-11-04', suggestedRole: 'backend', assigneeId: null, dependsOn: [], expectedOutput: 'Endpoint with tests' };
    const sprint = { code: null, name: 'Foundation', goal: null, startDate: '2026-11-01', endDate: '2026-11-07', tasks: [task] };
    const milestones = [{ key: 'm1', title: 'Demo', dueDate: '2026-11-14', taskKeys: ['api'] }];
    const onChange = vi.fn();
    render(<PlanEditor projectId="p1" disabled={false} draft={{ milestones, sprints: [sprint, { ...sprint, name: 'Delivery', tasks: [] }] }} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Chuyển task 1.1 sang Sprint'), { target: { value: '1' } });
    const updated = onChange.mock.calls[0][0];
    expect(updated.milestones).toEqual(milestones);
    expect(updated.sprints[0].tasks).toEqual([]);
    expect(updated.sprints[1].tasks[0]).toMatchObject({ key: 'api', expectedOutput: 'Endpoint with tests', dependsOn: [] });
    expect(screen.getByLabelText('Đầu ra task 1.1')).toHaveValue('Endpoint with tests');
  });
});
