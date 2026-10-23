import { describeTaskDeadline } from './task-deadline';
import { describe, expect, it } from 'vitest';

const today = new Date(2026, 9, 22, 12);
describe('Deadline presentation', () => {
  it('distinguishes an overdue open task from a completed task', () => {
    expect(describeTaskDeadline('2026-10-20', 'doing', today)).toMatchObject({ tone: 'danger', relative: 'Quá hạn 2 ngày' });
    expect(describeTaskDeadline('2026-10-20', 'done', today)).toMatchObject({ tone: 'neutral', relative: null });
  });
  it('explains today and tomorrow without marking them overdue', () => {
    expect(describeTaskDeadline('2026-10-22', 'todo', today)).toMatchObject({ tone: 'warning', relative: 'Hôm nay' });
    expect(describeTaskDeadline('2026-10-23', 'todo', today)).toMatchObject({ tone: 'warning', relative: 'Ngày mai' });
  });
  it('keeps distant dates quiet and exposes their calendar date', () => {
    expect(describeTaskDeadline('2026-10-29', 'review', today)).toMatchObject({ tone: 'neutral', relative: null, date: '29/10/2026' });
  });
  it('does not invent a deadline for missing or invalid data', () => {
    expect(describeTaskDeadline(null, 'todo', today)).toMatchObject({ date: 'Chưa có hạn', relative: null });
    expect(describeTaskDeadline('bad-date', 'todo', today)).toMatchObject({ date: 'Chưa có hạn', relative: null });
  });
});
