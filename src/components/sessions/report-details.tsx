"use client";
import { useState } from 'react';
import { type parseReportDetails } from '@/lib/api/report-details';
import { Badge, Empty, Pager } from '@/components/product/primitives';
const states: Record<string, string> = { todo: 'Chưa bắt đầu', doing: 'Đang làm', review: 'Chờ duyệt', done: 'Hoàn thành', awaiting_instructor: 'Chờ giảng viên', needs_changes: 'Cần sửa', inconclusive: 'Chưa đủ bằng chứng', running: 'Đang chấm', failed: 'Lỗi chấm', submitted: 'Đã nộp', approved: 'Đã duyệt', rework: 'Cần làm lại', withdrawn: 'Đã rút' };
export function ReportDetails({ data }: { data: ReturnType<typeof parseReportDetails> }) {
  const [page, setPage] = useState(1), summary = data.summary;
  return <div className="mt-5 space-y-5">
    <dl className="grid grid-cols-2 gap-5 border-y border-border py-5 sm:grid-cols-3 xl:grid-cols-5">
      {[["Task trong phạm vi", summary.total], ["Hoàn thành", summary.completed], ["Trễ hạn", summary.overdue], ["Chờ phụ thuộc", summary.blocked], ["Chưa phân công", summary.unassigned]].map(([label, value]) => <div key={label}><dt className="text-label text-muted-foreground">{label}</dt><dd className="mt-2 text-metric font-semibold tabular-nums">{value}</dd></div>)}
    </dl>
    <section className={`ins-report-risk rounded-control p-4 ${summary.risk === 'high' ? 'bg-destructive-subtle text-destructive' : summary.risk === 'medium' ? 'bg-warning-subtle text-warning' : 'bg-success-subtle text-success'}`}>
      <h4 className="text-subsection font-semibold">Cảnh báo tiến độ: {summary.risk === 'high' ? 'Cao' : summary.risk === 'medium' ? 'Cần theo dõi' : 'Chưa có dấu hiệu trễ'}</h4>
      {summary.reasons.length > 0 && <ul className="mt-2 list-inside list-disc text-body">{summary.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>}
      <p className="mt-2 text-caption">Dựa trên task trễ, phụ thuộc, thiếu người phụ trách và sprint hết hạn tại thời điểm chụp. Không phải dự báo ngày hoàn thành.</p>
    </section>
    <section>
      <h4 className="mb-3 text-subsection font-semibold">Tiến độ sprint</h4>
      <ul className="grid gap-x-6 sm:grid-cols-2">{data.sprints.map(s => <li className="border-b border-border py-4" key={s.id}><p className="text-body font-semibold">{s.name}</p><p className="mt-1 text-caption text-muted-foreground">{s.completed}/{s.total} task, Trễ {s.overdue}, Chờ {s.blocked}</p><progress className="mt-2 h-2 w-full accent-primary" max={Math.max(1, s.total)} value={s.completed} aria-label={`Tiến độ ${s.name}`} /></li>)}</ul>
    </section>
    <section>
      <h4 className="mb-3 text-subsection font-semibold">Ai đang làm gì?</h4>
      {data.tasks.length ? <ul className="divide-y divide-border">{data.tasks.slice((page - 1) * 15, page * 15).map(t => <li key={t.id} className="ins-report-task py-4 text-body"><div className="flex flex-wrap items-center gap-2"><strong>{t.code}, {t.title}</strong><Badge>{states[t.status] ?? t.status}</Badge>{t.blocked && <Badge>Chờ phụ thuộc</Badge>}</div><p className="mt-2 text-muted-foreground">{t.assigneeName ?? 'Chưa phân công'}, {t.sprintName ?? 'Chưa có sprint'}{t.dueDate ? `, Hạn ${new Date(t.dueDate).toLocaleDateString('vi-VN')}` : ''}</p><p className="mt-2 text-caption text-muted-foreground">Bài nộp: {t.submissionStatus ? states[t.submissionStatus] ?? t.submissionStatus : 'Chưa nộp'}, AI: {t.aiStatus ? states[t.aiStatus] ?? t.aiStatus : 'Chưa chấm'}{t.aiScore === null ? '' : ` (${t.aiScore}/100)`}, Giảng viên: {t.instructorScore === null ? 'Chưa chấm' : `${t.instructorScore}/100`}</p></li>)}</ul> : <Empty>Không có task trong bộ lọc.</Empty>}
      <Pager page={page} total={data.tasks.length} totalPages={Math.ceil(data.tasks.length / 15)} onChange={setPage} unit="task trong bản chụp" />
    </section>
    <details className="border-t border-border py-4"><summary className="min-h-10 cursor-pointer text-body font-semibold">Lịch sử trạng thái gần nhất ({data.timeline.length}, tối đa 100)</summary><ol className="mt-3 space-y-2 text-body">{data.timeline.map((event, index) => <li key={index} className="border-b border-border py-2">{event.taskCode}: {states[event.toStatus] ?? event.toStatus}<time className="ml-2 text-caption text-muted-foreground">{new Date(event.createdAt).toLocaleString('vi-VN')}</time></li>)}</ol></details>
  </div>;
}
