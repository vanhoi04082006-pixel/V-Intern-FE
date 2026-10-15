"use client";
import { useCallback, useState } from 'react';
import Link from 'next/link';
import { recruitmentApi } from '@/lib/api/recruitment';
import { roleLabel } from '@/lib/api/workspace';
import { useResource } from '@/lib/api/use-resource';
import { ErrorState, LoadingState } from '@/components/shared/data-state';
import { Badge, Empty, Pager, Panel } from '@/components/product/primitives';

const criterionLabels: Record<string, string> = {
  knowledge: 'Kiến thức', communication: 'Giao tiếp', problem_solving: 'Giải quyết vấn đề',
  english: 'Tiếng Anh', confidence: 'Sự tự tin', reasoning: 'Lập luận',
};
const statusLabels: Record<string, string> = {
  completed: 'Đã đánh giá', expired: 'Hết thời gian', cancelled: 'Đã hủy',
  evaluation_failed: 'Cần thử chấm lại', submitted: 'Đã nộp', evaluating: 'Đang chấm',
  in_progress: 'Đang phỏng vấn', created: 'Đã tạo',
};
export function WaitingRecruitmentSummary() {
  const [page, setPage] = useState(1);
  const state = useResource(useCallback(async (signal: AbortSignal) => {
    const [profile, history] = await Promise.all([recruitmentApi.me(signal), recruitmentApi.history(page, signal)]);
    return { profile, history };
  }, [page]));
  if (state.loading) return <LoadingState label="Đang tải kết quả và lịch sử phỏng vấn..." />;
  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />;
  if (!state.data) return null;
  const { profile, history } = state.data;
  const result = profile.result;
  return <div className="space-y-5">
    <Panel title="Đã vượt qua phỏng vấn — đang chờ giảng viên phân dự án" action={<Link className="text-sm font-semibold text-blue-600" href="/intern/notifications">Xem thông báo</Link>}>
      <p className="mb-4 text-sm text-slate-600">Vị trí đã đăng ký: <strong>{roleLabel(profile.selectedRole)}</strong></p>
      {result ? <>
        <dl className="grid gap-3 sm:grid-cols-3">
          {[["Tổng điểm", result.overallScore], ["Chuyên môn", result.technicalScore], ["Giao tiếp & tiếng Anh", result.softSkillScore]].map(([label, score]) => <div key={label} className="rounded-xl bg-blue-50 p-4"><dt className="text-sm text-slate-600">{label}</dt><dd className="mt-1 text-2xl font-bold text-navy">{score}/100</dd></div>)}
        </dl>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div><h3 className="font-semibold text-navy">Kỹ năng & điểm mạnh</h3>{result.strengths.length ? <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600">{result.strengths.map(s => <li key={s}>{s}</li>)}</ul> : <p className="mt-2 text-sm text-slate-500">Chưa có nhận xét kỹ năng.</p>}</div>
          <div><h3 className="font-semibold text-navy">Định hướng cải thiện</h3>{result.weaknesses.length ? <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600">{result.weaknesses.map(s => <li key={s}>{s}</li>)}</ul> : <p className="mt-2 text-sm text-slate-500">Chưa có đề xuất cải thiện.</p>}</div>
        </div>
        {result.criteria.length > 0 && <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{result.criteria.map(c => <div key={c.code} className="rounded-xl border border-slate-200 p-3"><dt className="text-sm font-semibold">{criterionLabels[c.code] ?? c.code}: {c.score}/100</dt><dd className="mt-1 text-sm text-slate-500">{c.feedback}</dd></div>)}</dl>}
      </> : <Empty>Kết quả chưa sẵn sàng. Hãy tải lại để đồng bộ trạng thái.</Empty>}
    </Panel>
    <Panel title="Lịch sử phỏng vấn" action={<Link className="text-sm font-semibold text-blue-600" href="/intern/onboarding/result">Xem kết quả tuyển dụng</Link>}>
      {history.items.length ? <ol className="divide-y divide-slate-100">{history.items.map(s => <li key={s.id} className="py-3 first:pt-0">
        <div className="flex flex-wrap items-center gap-2"><strong className="text-sm">Lần {s.attemptNumber} · {roleLabel(s.roleCode)}</strong><Badge>{s.result ? (s.result.decision === 'passed' ? 'Đã đậu' : 'Chưa đạt') : statusLabels[s.status] ?? s.status}</Badge>{s.result && <span className="text-sm font-semibold">{s.result.overallScore}/100</span>}</div>
        {s.startedAt && <p className="mt-1 text-xs text-slate-500">{new Date(s.startedAt).toLocaleString('vi-VN')}</p>}
        {s.result && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{s.result.feedback}</p>}
      </li>)}</ol> : <Empty>Chưa có phiên phỏng vấn.</Empty>}
      {history.total > 5 && <Pager page={page} total={history.total} totalPages={Math.ceil(history.total / 5)} onChange={setPage} unit="lần phỏng vấn" />}
    </Panel>
  </div>;
}
