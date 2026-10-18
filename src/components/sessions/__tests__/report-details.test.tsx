import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReportDetails } from '../report-details';
import { parseReportDetails } from '@/lib/api/report-details';
import { reportScope } from '@/lib/api/reports';
describe('report evidence', () => {
  it('shows assignments, blockers and measured review values without substituting missing scores', () => {
    const data = parseReportDetails({ summary: { total: 1, completed: 0, overdue: 1, blocked: 1, unassigned: 0, risk: 'high', reasons: ['Một task quá hạn'] }, tasks: [{ id: 't', code: 'T1', title: 'Xây API', status: 'doing', assigneeId: 'u', assigneeName: 'Người làm', sprintName: 'Sprint một', dueDate: null, blocked: true, submissionStatus: 'submitted', aiStatus: 'inconclusive', aiScore: null, instructorScore: null }], sprints: [{ id: 's', name: 'Sprint một', status: 'active', total: 1, completed: 0, overdue: 1, blocked: 1 }], timeline: [{ taskId: 't', taskCode: 'T1', toStatus: 'doing', createdAt: '2026-10-15T00:00:00Z' }] });
    render(<ReportDetails data={data} />);
    expect(screen.getByText('Ai đang làm gì?')).toBeInTheDocument();
    expect(screen.getByText(/Người làm/)).toBeInTheDocument();
    expect(screen.getByText(/Chưa đủ bằng chứng/)).toBeInTheDocument();
    expect(screen.getByText(/Giảng viên: Chưa chấm/)).toBeInTheDocument();
    expect(screen.getByText('Một task quá hạn')).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Lịch sử trạng thái gần nhất/));
    expect(screen.getByText(/T1: Đang làm/)).toBeInTheDocument();
  });
  it('preserves sprint/student scope and inclusive final date when creating a snapshot', () => {
    expect(reportScope('p', 'se', '2026-10-01', '2026-10-15', 'sp', 'u')).toEqual({ projectId: 'p', sessionId: 'se', sprintId: 'sp', studentId: 'u', from: '2026-10-01T00:00:00.000Z', to: '2026-10-16T00:00:00.000Z' });
  });
});
