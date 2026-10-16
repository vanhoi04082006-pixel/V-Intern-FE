import type { parseSessionWorkTask } from '@/lib/api/session-work';
import { githubSourceLink } from '@/lib/api/session-work';

const submissionLabels = { submitted: 'Đã nộp · Chờ giảng viên', approved: 'Giảng viên đã duyệt', rework: 'Giảng viên yêu cầu sửa', withdrawn: 'Đã rút bài' };
const aiLabels = { running: 'Đang chấm', awaiting_instructor: 'Đề xuất đạt', needs_changes: 'Đề xuất sửa', inconclusive: 'Chưa đủ bằng chứng', failed: 'Chưa chấm được' };
export function SessionTaskDelivery({ data }: { data: ReturnType<typeof parseSessionWorkTask>['delivery'] }) {
  if (!data) return null;
  const sub = data.submission, source = sub ? githubSourceLink(sub.prUrl) : null;
  return <div className="mt-2 space-y-1.5 text-xs text-slate-600">
    {data.blocked && <p className="font-semibold text-amber-800">Chờ phụ thuộc</p>}
    {!sub ? <p>Chưa nộp bài.</p> : <>
      <p className="font-semibold">{submissionLabels[sub.status]}</p>
      <p>AI: {sub.aiStatus ? aiLabels[sub.aiStatus] : 'Chưa chấm'}{sub.aiScore === null ? '' : ` · ${sub.aiScore}/100`} <span className="text-slate-500">(đề xuất)</span></p>
      {sub.aiSummary && <p>{sub.aiSummary}</p>}
      <p>Giảng viên: {sub.instructorScore === null ? 'Chưa chấm' : `${sub.instructorScore}/100`}</p>
      {sub.instructorFeedback && <p>{sub.instructorFeedback}</p>}
      <p>Nộp {new Date(sub.submittedAt).toLocaleString('vi-VN')}{sub.headSha && <span className="ml-2 font-mono">SHA {sub.headSha.slice(0, 12)}</span>}</p>
      {source && <a className="inline-block font-semibold text-blue-700 hover:underline" href={source} target="_blank" rel="noreferrer">Mở bài nộp trên GitHub</a>}
    </>}
  </div>;
}
