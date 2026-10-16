import { describe, expect, it } from 'vitest';
import { githubSourceLink, parseSessionEvent, parseSessionWorkTask } from '../session-work';

const task = { id: 't1', code: 'T-1', title: 'Build', status: 'review', priority: 'high', progress: 50, dueDate: null, assigneeId: 'u1', description: null, projectId: 'p1', sprintId: 'sp1', storyPoints: 2, version: 1,
  delivery: { blocked: false, submission: { id: 'sub1', status: 'approved', prUrl: 'https://github.com/owner/repo/pull/1', headSha: 'a'.repeat(40), submittedAt: '2026-10-01', instructorScore: 90.5, instructorFeedback: null, aiStatus: 'awaiting_instructor', aiScore: 98, aiSummary: 'OK' } } };
describe('live session delivery contracts', () => {
  it('keeps AI suggestions separate from the recorded instructor decision and missing facts null', () => {
    expect(parseSessionWorkTask(task).delivery?.submission).toMatchObject({ status: 'approved', aiScore: 98, instructorScore: 90.5 });
    expect(parseSessionWorkTask({ ...task, delivery: null }).delivery).toBeNull();
    expect(() => parseSessionWorkTask({ ...task, delivery: { blocked: 'false' } })).toThrow();
    expect(() => parseSessionWorkTask({ ...task, delivery: { ...task.delivery, submission: { ...task.delivery.submission, aiStatus: 'auto_approved' } } })).toThrow();
  });
  it('renders only actual HTTPS GitHub source links', () => {
    expect(githubSourceLink(task.delivery.submission.prUrl)).toBe(task.delivery.submission.prUrl);
    for (const url of ['javascript:alert(1)', 'https://github.com.evil.test/a/b/pull/1', 'https://token@github.com/a/b/pull/1', 'http://github.com/a/b/pull/1', 'https://github.com/']) expect(githubSourceLink(url)).toBeNull();
  });
  it('validates public timeline fields and does not substitute a numeric date', () => {
    expect(parseSessionEvent({ id: 'e1', action: 'task.completed', summary: null, actorName: null, createdAt: '2026-10-01' })).toMatchObject({ summary: null, actorName: null });
    expect(() => parseSessionEvent({ id: 'e1', action: 'task.completed', summary: null, actorName: null, createdAt: 123 })).toThrow();
  });
});
