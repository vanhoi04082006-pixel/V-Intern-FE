"use client";
import { SessionRepositoryCard } from '@/components/product/github-connection';
import { getSessionUser } from '@/lib/auth/session';
import Link from "next/link";
import { useCallback, useState } from "react";
import { ErrorState } from "@/components/shared/data-state";
import { Badge, Empty, PageTitle, Pager, Panel, inputClass } from "@/components/product/primitives";
import { useResource } from "@/lib/api/use-resource";
import { getSessionDetail } from "@/lib/api/sessions";
import { listSprints } from "@/lib/api/delivery";
import { listSessionWork } from '@/lib/api/session-work';
import { listPlans } from "@/lib/api/planning";
import { statusLabels, taskStatuses, priorities, priorityLabels } from "@/lib/api/work";
import { AiPlanPanel } from "./ai-plan";
import { Can } from "@/components/auth/can";
import { roleLabel } from '@/lib/api/workspace';
import { SessionTaskDelivery } from './session-task-delivery';
import { SessionTimeline } from './session-timeline';
import { MemberPerformance } from '@/components/product/member-performance';
import { ReportsWorkspace } from './reports-workspace';

function snapshotItems(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
  if (typeof value === 'string') return [value];
  if (value && typeof value === 'object') return Object.values(value).flatMap(v => typeof v === 'string' ? [v] : Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : []);
  return [];
}

export interface DetailDeps {
  getSession: typeof getSessionDetail;
  listSprints: typeof listSprints;
  listTasks: typeof listSessionWork;
  listPlans: typeof listPlans;
}

/**
 * Session detail (M6): real overview — sprints, tasks, AI plan status and
 * progress, all from live endpoints. No mock numbers anywhere.
 */
export function SessionOverview({
  sessionId,
  deps,
  basePath = '/instructor',
}: {
  sessionId: string;
  deps?: Partial<DetailDeps>;
  basePath?: '/instructor' | '/admin';
}) {
  const { getSession = getSessionDetail, listSprints: loadSprints = listSprints, listTasks: loadTasks = listSessionWork, listPlans: loadPlans = listPlans } = deps ?? {};

  const [sprintPage, setSprintPage] = useState(1);
  const [taskPage, setTaskPage] = useState(1);
  const [filters, setFilters] = useState({ status: '', priority: '', assigneeId: '', sprintId: '' });
  const [showPerformance, setShowPerformance] = useState(false), [showReports, setShowReports] = useState(false);
  function filter(key: keyof typeof filters, value: string) { setFilters(old => ({ ...old, [key]: value })); setTaskPage(1); }
  const data = useResource(useCallback((signal: AbortSignal) => getSession(sessionId, signal), [getSession, sessionId]));
  const delivery = useResource(
    useCallback(
      async (signal: AbortSignal) => {
        const [sprintsPage, tasksPage] = await Promise.all([
          loadSprints({ sessionId, page: sprintPage, pageSize: 10 }, signal),
          loadTasks({ sessionId, page: taskPage, pageSize: 20, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) }, signal),
        ]);
        return { sprintsPage, tasksPage };
      },
      [sessionId, sprintPage, taskPage, loadSprints, loadTasks, filters],
    ),
  );

  const plans = useResource(
    useCallback((signal: AbortSignal) => loadPlans(sessionId, signal), [sessionId, loadPlans]),
  );

  if (data.loading) return <p role="status" className="p-4 text-sm text-slate-500">Đang tải phiên...</p>;
  if (data.error || !data.data) return <ErrorState error={data.error} onRetry={data.reload} />;
  const session = data.data;
  const sprints = delivery.data?.sprintsPage.items ?? [];
  const tasks = delivery.data?.tasksPage.items ?? [];
  const totalTasks = session.overview.taskTotal;
  const progress = { done: session.overview.taskDone, percent: session.overview.taskPercent };
  const projectId = session.overview.project?.id;

  return (
    <div className="space-y-4">
      <PageTitle
        title={session.name}
        subtitle={`${session.code} · ${session.status}${session.startDate ? ` · ${session.startDate.slice(0, 10)} → ${session.endDate?.slice(0, 10) ?? ""}` : ""}`}
        action={
          <Link className="text-xs font-semibold text-blue-600 hover:underline" href={`${basePath}/sessions`}>
            ← Danh sách phiên
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Panel title="Sprint">
          <p className="text-2xl font-bold text-navy">{session.overview.sprintCount}</p>
          <p className="text-xs text-slate-500">{session.sprintProgress.filter((s) => s.status === "active").length} đang chạy</p>
        </Panel>
        <Panel title="Task">
          <p className="text-2xl font-bold text-navy">{totalTasks}</p>
          <p className="text-xs text-slate-500">{progress.done} hoàn thành ({progress.percent}%)</p>
        </Panel>
        <Panel title="Còn lại">
          <p className="text-2xl font-bold text-navy">{totalTasks - progress.done}</p>
          <p className="text-xs text-slate-500">{session.sprintProgress.reduce((sum, s) => sum + s.taskReview, 0)} chờ duyệt</p>
        </Panel>
        <Panel title="Kế hoạch AI">
          <p className="text-sm font-semibold text-navy">
            {plans.loading ? "..." : plans.error ? "không tải được" : plans.data?.[0]?.status ?? "chưa có"}
          </p>
          <p className="text-xs text-slate-500">{plans.data?.length ?? 0} bản kế hoạch</p>
        </Panel>
      </div>

      {projectId && <nav aria-label="Quản lý phiên" className="flex flex-wrap gap-4 text-sm font-semibold text-blue-600">
        {basePath === '/instructor' && <Link href={`/instructor/sessions/${sessionId}/setup?project=${projectId}`}>Đội hình & thiết lập</Link>}
        <Link href={`${basePath}/sprints?sessionId=${sessionId}&projectId=${projectId}`}>Sprint & Task</Link>
        <Link href={`${basePath}/performance?sessionId=${sessionId}&projectId=${projectId}`}>Hiệu suất</Link>
        <Link href={`${basePath}/reports?sessionId=${sessionId}&projectId=${projectId}`}>Báo cáo</Link>
      </nav>}
      <SessionRepositoryCard sessionId={sessionId} manage={session.leadInstructorId?.toLowerCase() === getSessionUser()?.id.toLowerCase()} />
      <Panel title={`Thành viên (${session.members.length})`}>
        {session.members.length ? <ul className="space-y-2 text-sm">{session.members.map((m) => <li className="break-words" key={m.userId}>{m.displayName} · {m.email}<p className="mt-1 text-xs text-slate-500">{m.role ? roleLabel(m.role) : 'Chưa có vai trò dự án'}{m.assignmentStatus === 'completed' ? ' · Đã hoàn tất phân công' : m.assignmentStatus === 'active' ? ' · Đang tham gia' : ''}</p></li>)}</ul> : <Empty>Chưa có thành viên.</Empty>}
      </Panel>
      {session.projectSnapshot && <Panel title={`Dự án · ${session.overview.project?.name ?? "Snapshot"}`}>
        <p className="mb-3 text-sm">{typeof session.projectSnapshot.description === 'string' ? session.projectSnapshot.description : ''}</p>
        {(['techStack', 'objectives', 'functionalRequirements', 'expectedOutputs', 'dod'] as const).map((key) => {
          const values = snapshotItems(session.projectSnapshot?.[key]);
          const label = { techStack: 'Công nghệ', objectives: 'Mục tiêu', functionalRequirements: 'Yêu cầu', expectedOutputs: 'Sản phẩm bàn giao', dod: 'Tiêu chí hoàn thành' }[key];
          return values.length ? <div key={key} className="mb-3 text-sm"><h3 className="font-semibold">{label}</h3><ul className="list-inside list-disc">{values.map((v, i) => <li key={i}>{v}</li>)}</ul></div> : null;
        })}
      </Panel>}
      <Panel title="Mốc thời gian">{session.milestones.length ? <ul className="space-y-2 text-sm">{session.milestones.map((m) => <li key={m.id}>{m.title} · {m.dueDate?.slice(0, 10) ?? 'Chưa có hạn'} · {m.status}</li>)}</ul> : <Empty>Chưa có mốc thời gian.</Empty>}</Panel>
      {projectId && basePath === '/instructor' && <Can perm="sprints.manage"><AiPlanPanel autoPlanning={session.status === 'active'} sessionId={sessionId} projectId={projectId} onPublished={() => { data.reload(); delivery.reload(); plans.reload(); }} /></Can>}
      {delivery.error ? <ErrorState error={delivery.error} onRetry={delivery.reload} /> : null}
      {delivery.loading && <p role="status">Đang tải Sprint/Task...</p>}

      <Panel title="Sprint">
        {sprints.length === 0 ? (
          <Empty>Chưa có sprint — confirm kế hoạch AI để tạo sprint/task.</Empty>
        ) : (
          <ul className="space-y-2">
            {sprints.map((s) => {
              const p = session.sprintProgress.find((p) => p.id.toLowerCase() === s.id.toLowerCase());
              return (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-100 p-2">
                  <div>
                    <Link className="text-sm font-semibold text-blue-600 hover:underline" href={`${basePath}/sprints/${s.id}`}>
                      {s.name}
                    </Link>
                    <p className="text-[11px] text-slate-500">{s.code} · {s.goal ?? "—"}</p>
                  </div>
                  <button className="text-xs font-semibold text-blue-700 hover:underline" onClick={() => filter('sprintId', s.id)}>Lọc task Sprint này</button>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{s.startDate?.slice(0, 10) ?? "—"} → {s.endDate?.slice(0, 10) ?? "—"}</span>
                    <Badge>{s.status}</Badge>
                    <span>{p?.taskDone ?? 0}/{p?.taskTotal ?? 0}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {delivery.data && <Pager {...delivery.data.sprintsPage} onChange={setSprintPage} />}
      </Panel>

      <Panel title={`Task (${totalTasks})`}>
        <div className="mb-4 flex flex-wrap gap-2">
          <select className={inputClass} aria-label="Trạng thái task trong phiên" value={filters.status} onChange={e => filter('status', e.target.value)}><option value="">Mọi trạng thái task</option>{taskStatuses.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}</select>
          <select className={inputClass} aria-label="Ưu tiên task trong phiên" value={filters.priority} onChange={e => filter('priority', e.target.value)}><option value="">Mọi mức ưu tiên</option>{priorities.map(p => <option key={p} value={p}>{priorityLabels[p]}</option>)}</select>
          <select className={inputClass} aria-label="Người nhận task trong phiên" value={filters.assigneeId} onChange={e => filter('assigneeId', e.target.value)}><option value="">Mọi thành viên</option>{session.members.map(m => <option key={m.userId} value={m.userId}>{m.displayName}</option>)}</select>
          {filters.sprintId && <button className="text-xs font-semibold text-blue-700" onClick={() => filter('sprintId', '')}>Bỏ lọc Sprint</button>}
        </div>
        {tasks.length === 0 ? (
          <Empty>Chưa có task.</Empty>
        ) : (
          <ul aria-label="Task và bài nộp trong phiên" className="grid gap-3 xl:grid-cols-2">
            {tasks.map(t => <li key={t.id} className="min-w-0 break-words rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <Link className="min-w-0 text-sm font-semibold text-blue-700 hover:underline" href={`${basePath}/tasks/${t.id}`}>{t.title}</Link>
                <Badge>{statusLabels[t.status]}</Badge>
              </div>
              <p className="mt-1 break-all font-mono text-[11px] text-slate-400">{t.code}</p>
              <p className="mt-2 text-xs text-slate-600">{t.sprint?.name ?? 'Chưa gắn Sprint'} · {t.progress}% · {priorityLabels[t.priority]}</p>
              <p className="mt-1 text-xs text-slate-600">{t.assigneeId ? session.members.find(m => m.userId.toLowerCase() === t.assigneeId?.toLowerCase())?.displayName ?? 'Đã phân công' : 'Chưa phân công'} · Hạn {t.dueDate?.slice(0, 10) ?? 'Chưa có hạn'}</p>
              <SessionTaskDelivery data={t.delivery} />
            </li>)}
          </ul>
        )}
        {delivery.data && <Pager {...delivery.data.tasksPage} onChange={setTaskPage} />}
      </Panel>
      <Can perm={['sessions.view', 'tasks.view']}><SessionTimeline key={sessionId} sessionId={sessionId} /></Can>
      <Can perm="performance.view"><Panel title="Hiệu suất sinh viên trong phiên">
        <button className="text-sm font-semibold text-blue-700" aria-expanded={showPerformance} onClick={() => setShowPerformance(v => !v)}>{showPerformance ? 'Thu gọn hiệu suất' : 'Xem hiệu suất sinh viên'}</button>
        {showPerformance && <div className="mt-4"><MemberPerformance key={sessionId} initialProjectId={projectId} initialSessionId={sessionId} basePath={basePath} lockedScope embedded /></div>}
      </Panel></Can>
      {projectId && <Can perm="performance.view"><Panel title="Báo cáo của phiên">
        <button className="text-sm font-semibold text-blue-700" aria-expanded={showReports} onClick={() => setShowReports(v => !v)}>{showReports ? 'Thu gọn báo cáo' : 'Mở báo cáo trong phiên'}</button>
        {showReports && <div className="mt-4"><ReportsWorkspace key={sessionId} initialProjectId={projectId} initialSessionId={sessionId} lockedScope embedded /></div>}
      </Panel></Can>}
    </div>
  );
}
