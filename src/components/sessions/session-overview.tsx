"use client";
import { SessionRepositoryCard } from '@/components/product/github-connection';
import { getSessionUser } from '@/lib/auth/session';
import Link from "next/link";
import { useCallback, useState } from "react";
import { ErrorState } from "@/components/shared/data-state";
import { Badge, Empty, PageTitle, Pager, Panel } from "@/components/product/primitives";
import { useResource } from "@/lib/api/use-resource";
import { getSessionDetail } from "@/lib/api/sessions";
import { listSprints, listTasks } from "@/lib/api/delivery";
import { listPlans } from "@/lib/api/planning";
import { statusLabels } from "@/lib/api/work";
import { AiPlanPanel } from "./ai-plan";
import { Can } from "@/components/auth/can";

export interface DetailDeps {
  getSession: typeof getSessionDetail;
  listSprints: typeof listSprints;
  listTasks: typeof listTasks;
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
  const { getSession = getSessionDetail, listSprints: loadSprints = listSprints, listTasks: loadTasks = listTasks, listPlans: loadPlans = listPlans } = deps ?? {};

  const [sprintPage, setSprintPage] = useState(1);
  const [taskPage, setTaskPage] = useState(1);
  const data = useResource(useCallback((signal: AbortSignal) => getSession(sessionId, signal), [getSession, sessionId]));
  const delivery = useResource(
    useCallback(
      async (signal: AbortSignal) => {
        const [sprintsPage, tasksPage] = await Promise.all([
          loadSprints({ sessionId, page: sprintPage, pageSize: 10 }, signal),
          loadTasks({ sessionId, page: taskPage, pageSize: 20 }, signal),
        ]);
        return { sprintsPage, tasksPage };
      },
      [sessionId, sprintPage, taskPage, loadSprints, loadTasks],
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
          <p className="text-2xl font-bold text-[#10164b]">{session.overview.sprintCount}</p>
          <p className="text-xs text-slate-500">{session.sprintProgress.filter((s) => s.status === "active").length} đang chạy</p>
        </Panel>
        <Panel title="Task">
          <p className="text-2xl font-bold text-[#10164b]">{totalTasks}</p>
          <p className="text-xs text-slate-500">{progress.done} hoàn thành ({progress.percent}%)</p>
        </Panel>
        <Panel title="Còn lại">
          <p className="text-2xl font-bold text-[#10164b]">{totalTasks - progress.done}</p>
          <p className="text-xs text-slate-500">{session.sprintProgress.reduce((sum, s) => sum + s.taskReview, 0)} chờ duyệt</p>
        </Panel>
        <Panel title="Kế hoạch AI">
          <p className="text-sm font-semibold text-[#10164b]">
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
        {session.members.length ? <ul className="space-y-1 text-sm">{session.members.map((m) => <li key={m.userId}>{m.displayName} · {m.email}</li>)}</ul> : <Empty>Chưa có thành viên.</Empty>}
      </Panel>
      {session.projectSnapshot && <Panel title={`Dự án · ${session.overview.project?.name ?? "Snapshot"}`}>
        <p className="mb-3 text-sm">{typeof session.projectSnapshot.description === 'string' ? session.projectSnapshot.description : ''}</p>
        {(['techStack', 'objectives', 'functionalRequirements', 'expectedOutputs', 'dod'] as const).map((key) => {
          const values = session.projectSnapshot?.[key];
          const label = { techStack: 'Công nghệ', objectives: 'Mục tiêu', functionalRequirements: 'Yêu cầu', expectedOutputs: 'Sản phẩm bàn giao', dod: 'Tiêu chí hoàn thành' }[key];
          return Array.isArray(values) ? <div key={key} className="mb-3 text-sm"><h3 className="font-semibold">{label}</h3><ul className="list-inside list-disc">{values.filter((v): v is string => typeof v === 'string').map((v, i) => <li key={i}>{v}</li>)}</ul></div> : null;
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
        {tasks.length === 0 ? (
          <Empty>Chưa có task.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-1 pr-3">Task</th>
                  <th className="py-1 pr-3">Trạng thái</th>
                  <th className="py-1 pr-3">Ưu tiên</th>
                  <th className="py-1 pr-3">Người nhận</th>
                  <th className="py-1 pr-3">Hạn</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id} className="border-t border-slate-50">
                    <td className="py-1.5 pr-3">
                      <Link className="font-semibold text-blue-600 hover:underline" href={`${basePath}/tasks/${t.id}`}>
                        {t.title}
                      </Link>
                      <span className="ml-1 text-slate-400">{t.code}</span>
                    </td>
                    <td className="py-1.5 pr-3">{statusLabels[t.status as keyof typeof statusLabels] ?? t.status}</td>
                    <td className="py-1.5 pr-3">{t.priority}</td>
                    <td className="py-1.5 pr-3 text-xs text-slate-600">{t.assigneeId ? session.members.find(m => m.userId.toLowerCase() === t.assigneeId?.toLowerCase())?.displayName ?? 'Đã phân công' : 'Chưa phân công'}</td>
                    <td className="py-1.5 pr-3">{t.dueDate?.slice(0, 10) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {delivery.data && <Pager {...delivery.data.tasksPage} onChange={setTaskPage} />}
      </Panel>
    </div>
  );
}
