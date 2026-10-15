import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemberPerformance } from '../member-performance';
import { PerformanceMemberPicker } from '../performance-member-picker';
import { PerformanceTrend } from '../student-performance-detail';
import { listPerformance } from '@/lib/api/management';
vi.mock('@/components/product/academic-picker', () => ({ AcademicPicker: () => null }));
vi.mock('@/lib/api/management', async original => ({ ...await original<typeof import('@/lib/api/management')>(), listPerformance: vi.fn() }));
const member = { userId: 'student1', displayName: 'Sinh viên đầu', totalTaskCount: 4, completedTaskCount: 3, taskCompletionRate: 75, storyPointCompletionRate: null, averageEvaluationScore: null, rank: 1 };
beforeEach(() => { vi.mocked(listPerformance).mockImplementation(async query => ({ items: [{ ...member, displayName: query.get('q') ? 'Sinh viên tìm thấy' : 'Sinh viên đầu' }], total: 12, page: Number(query.get('page') ?? 1), pageSize: 10 })); });
describe('server ranked performance', () => {
  it('paginates and searches the full server directory without requiring prior grades', async () => {
    render(<MemberPerformance />);
    expect(await screen.findByText('Top 10 sinh viên hiệu suất tốt nhất')).toBeInTheDocument();
    expect(screen.getAllByText('Sinh viên đầu').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Sau' }));
    await waitFor(() => expect(vi.mocked(listPerformance).mock.calls.some(([query]) => query.get('page') === '2')).toBe(true));
    fireEvent.change(screen.getByLabelText('Tìm sinh viên'), { target: { value: 'ngoài top10' } });
    await screen.findAllByText('Sinh viên tìm thấy');
    expect(vi.mocked(listPerformance).mock.lastCall?.[0].get('page')).toBe('1');
    expect(vi.mocked(listPerformance).mock.lastCall?.[0].get('q')).toBe('ngoài top10');
  });
  it('keeps a chosen evaluation member selectable after changing result pages', async () => {
    render(<PerformanceMemberPicker value="outside" onChange={vi.fn()} label="Intern đánh giá" />);
    expect(await screen.findByRole('option', { name: 'Sinh viên đầu' })).toBeInTheDocument();
    expect(screen.getByLabelText('Intern đánh giá')).toHaveValue('outside');
    fireEvent.click(screen.getByRole('button', { name: 'Sau' }));
    await waitFor(() => expect(vi.mocked(listPerformance).mock.lastCall?.[0].get('page')).toBe('2'));
    expect(screen.getByLabelText('Intern đánh giá')).toHaveValue('outside');
  });
  it('renders measured monthly counts with their definition', () => {
    render(<PerformanceTrend data={[{ month: '2026-10', created: 4, completed: 2 }]} />);
    expect(screen.getByRole('img', { name: /theo tháng UTC/ })).toBeInTheDocument();
    expect(screen.getByText('4 / 2')).toBeInTheDocument();
    expect(screen.getByText(/không bị tính hoàn thành lần hai/)).toBeInTheDocument();
  });
});
