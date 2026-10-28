"use client";
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { getStudentDetail, type parseStudentDetail } from '@/lib/api/student-detail';
import { useResource } from '@/lib/api/use-resource';
import { roleLabel } from '@/lib/api/workspace';
import { ErrorState, LoadingState } from '@/components/shared/data-state';
import { CandidateInterviewSummary } from '@/components/sessions/candidate-interview-summary';
import { Badge, Empty, Pager, Panel } from './primitives';
import { Metrics } from './outcomes';
const status: Record<string, string> = { todo: 'Chưa bắt đầu', doing: 'Đang làm', review: 'Chờ duyệt', done: 'Hoàn thành', submitted: 'Đã nộp', approved: 'Đã duyệt', rework: 'Cần sửa', withdrawn: 'Đã rút', awaiting_instructor: 'Chờ giảng viên', needs_changes: 'Cần cải thiện', inconclusive: 'Chưa đủ bằng chứng', failed: 'Lỗi đánh giá', running: 'Đang đánh giá' };
type Trend = ReturnType<typeof parseStudentDetail>['trend'];
export function PerformanceTrend({ data }: { data: Trend }) {
  const max = Math.max(1, ...data.flatMap(p => [p.created, p.completed]));
  return <div><div className="grid grid-cols-6 gap-2" role="img" aria-label="Số task nhận và hoàn thành lần đầu theo tháng UTC">
    {data.map(point => <div key={point.month} className="min-w-0 text-center text-caption"><div className="flex h-28 items-end justify-center gap-1 border-b border-border"><div className="w-3 rounded-t bg-primary" style={{ height: `${point.created / max * 100}%` }} title={`Nhận: ${point.created}`} /><div className="w-3 rounded-t bg-success" style={{ height: `${point.completed / max * 100}%` }} title={`Hoàn thành lần đầu: ${point.completed}`} /></div><p className="mt-2 text-muted-foreground">{point.month.slice(5)}/{point.month.slice(2, 4)}</p><p className="mt-1 text-foreground">{point.created} / {point.completed}</p></div>)}
  </div><p className="mt-3 text-caption leading-relaxed text-muted-foreground">Xanh dương: task nhận; Xanh lá: chuyển Done lần đầu. Dữ liệu lịch sử theo tháng UTC, trong tập task của bộ lọc; task mở lại không bị tính hoàn thành lần hai.</p></div>;
}
export function StudentPerformanceDetail({ id, scope, basePath = '/instructor' }: { id: string; scope: string; basePath?: '/instructor' | '/admin' }) {
  const [page, setPage] = useState(1);
  const state = useResource(useCallback((signal: AbortSignal) => getStudentDetail(id, page, scope, signal), [id, page, scope]));
  if (state.loading) return <LoadingState />;
  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />;
  if (!state.data) return null;
  const { profile, interview, metrics: m, assignments, tasks, trend } = state.data;
  return <div className="space-y-5">
    <div><h3 className="text-section font-bold text-foreground">{profile.displayName ?? 'Sinh viên'}</h3><p className="break-all text-body text-muted-foreground">{profile.email}</p><p className="mt-1 text-body">{roleLabel(profile.selectedRole)}</p></div>
    <Metrics values={[["Task", m.totalTaskCount], ["Hoàn thành", m.completedTaskCount], ["Quá hạn", m.overdueOpenTaskCount], ["Đúng hạn (%)", m.onTimeCompletionRate], ["Điểm đã chốt", m.averageEvaluationScore]]} />
    <Panel title="Dự án & phiên gần nhất">{assignments.length ? <ul className="space-y-3">{assignments.map(a => <li key={a.id} className="border-b border-border py-3 text-body"><Link className="font-semibold text-primary" href={`${basePath}/sessions/${a.sessionId}`}>{a.sessionName}</Link><p className="mt-1 text-muted-foreground">{a.projectName}; {roleLabel(a.role)}; {a.status === 'active' ? 'Đang tham gia' : 'Đã hoàn tất'}</p></li>)}</ul> : <Empty>Chưa có phân công trong bộ lọc.</Empty>}</Panel>
    <Panel title="Kết quả phỏng vấn">{interview && typeof interview.overallScore === 'number' && <p className="mb-3 text-section font-bold text-primary">{interview.overallScore}/100</p>}<CandidateInterviewSummary detail={{ result: interview }} /></Panel>
    <Panel title="Xu hướng công việc; 6 tháng"><PerformanceTrend data={trend} /></Panel>
    <Panel title="Task & đánh giá bài nộp">
      {!tasks.items.length ? <Empty>Chưa có task trong phạm vi này.</Empty> : <ul className="space-y-3">{tasks.items.map(t => <li key={t.id} className="border-b border-border py-4 text-body"><div className="flex flex-wrap items-start justify-between gap-2"><h4 className="min-w-0 font-semibold text-foreground">{t.code}; {t.title}</h4><Badge>{status[t.status] ?? t.status}</Badge></div><p className="mt-1 text-caption text-muted-foreground">{t.sprintName ?? 'Chưa có sprint'}{t.dueDate ? `; Hạn ${new Date(t.dueDate).toLocaleDateString('vi-VN')}` : ''}</p>{t.submissionId ? <div className="mt-3 space-y-2 border-t border-border pt-3"><p>Bài nộp: {status[t.submissionStatus ?? ''] ?? t.submissionStatus}{t.headSha && <span className="ml-2 font-mono text-caption">{t.headSha.slice(0, 12)}</span>}</p><p>AI: {t.aiReviewStatus ? status[t.aiReviewStatus] ?? t.aiReviewStatus : 'Chưa chấm'}{t.aiScore !== null ? `; ${t.aiScore}/100` : ''}</p>{t.aiSummary && <p className="text-muted-foreground">{t.aiSummary}</p>}<p>Giảng viên: {t.instructorScore === null ? 'Chưa chấm' : `${t.instructorScore}/100`}</p>{t.instructorFeedback && <p className="text-muted-foreground">{t.instructorFeedback}</p>}{t.sessionId && <Link className="inline-block font-semibold text-primary" href={`${basePath}/sessions/${t.sessionId}?tab=work`}>Mở phiên để xem bài nộp</Link>}</div> : <p className="mt-2 text-caption text-muted-foreground">Chưa nộp bài.</p>}</li>)}</ul>}
      <Pager page={page} total={tasks.total} totalPages={Math.ceil(tasks.total / tasks.pageSize)} onChange={setPage} unit="task" />
    </Panel>
  </div>;
}
