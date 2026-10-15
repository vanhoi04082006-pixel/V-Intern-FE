"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { AcademicPicker } from "@/components/product/academic-picker";
import { Empty, inputClass, PageTitle, Pager, Panel } from "@/components/product/primitives";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { listMemberOptions, listSprints, listTasks, taskStatuses } from "@/lib/api/delivery";
import { statusLabels } from "@/lib/api/work";
import { useResource } from "@/lib/api/use-resource";

export function DeliveryOverview({ initialProjectId = "", initialSessionId = "", basePath = '/instructor' }: { initialProjectId?: string; initialSessionId?: string; basePath?: '/instructor' | '/admin' }) {
  const [kind, setKind] = useState<"sprints" | "tasks">("sprints");
  const [projectId, setProject] = useState(initialProjectId);
  const [sessionId, setSession] = useState(initialSessionId);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [assigneeId, setAssignee] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [memberPage, setMemberPage] = useState(1);
  const [dueFrom, setDueFrom] = useState("");
  const [dueTo, setDueTo] = useState("");
  const sprints = useResource(useCallback((signal: AbortSignal) => kind === "sprints" ? listSprints({ projectId, sessionId, page, pageSize: 20, status, search, assigneeId, dueFrom: dueFrom ? `${dueFrom}T00:00:00.000Z` : undefined, dueTo: dueTo ? `${dueTo}T23:59:59.999Z` : undefined }, signal) : Promise.resolve(null), [kind, projectId, sessionId, page, status, search, assigneeId, dueFrom, dueTo]));
  const tasks = useResource(useCallback((signal: AbortSignal) => kind === "tasks" ? listTasks({ projectId, sessionId, page, pageSize: 20, status, search, assigneeId, dueFrom: dueFrom ? `${dueFrom}T00:00:00.000Z` : undefined, dueTo: dueTo ? `${dueTo}T23:59:59.999Z` : undefined, sortBy: "dueDate", sortOrder: "ASC" }, signal) : Promise.resolve(null), [kind, projectId, sessionId, page, status, search, assigneeId, dueFrom, dueTo]));
  const members = useResource(useCallback((signal: AbortSignal) => listMemberOptions({ projectId, sessionId, page: memberPage, q: memberSearch }, signal), [projectId, sessionId, memberPage, memberSearch]));
  function resetScope() { setPage(1); setAssignee(""); setMemberPage(1); }
  const resource = kind === "sprints" ? sprints : tasks;
  const data = kind === "sprints" ? sprints.data : tasks.data;
  return <div className="space-y-5">
    <PageTitle title="Sprint & Task" subtitle="Theo dõi công việc trong các dự án và phiên thực tập bạn quản lý." />
    <Panel title="Phạm vi công việc">
      <div className="grid gap-4 md:grid-cols-2">
        <AcademicPicker compact kind="projects" label="Dự án" value={projectId} onChange={id => { setProject(id); setSession(""); resetScope(); }} />
        <AcademicPicker compact kind="sessions" label="Phiên thực tập" projectId={projectId} value={sessionId} onChange={id => { setSession(id); resetScope(); }} />
      </div>
    </Panel>
    <div className="flex gap-2" aria-label="Loại công việc">{(["sprints", "tasks"] as const).map(tab => <button key={tab} aria-pressed={kind === tab} className="rounded-lg border bg-white px-5 py-2 aria-pressed:bg-blue-600 aria-pressed:text-white" onClick={() => { setKind(tab); setStatus(""); setPage(1); }}>{tab === "sprints" ? "Sprint" : "Task"}</button>)}</div>
    <Panel title={kind === "sprints" ? "Danh sách Sprint" : "Danh sách Task"}>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm">Trạng thái<select aria-label="Trạng thái" className={inputClass} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">Tất cả</option>{(kind === "sprints" ? ["planned", "active", "completed", "cancelled"] : taskStatuses).map(s => <option key={s} value={s}>{s in statusLabels ? statusLabels[s as keyof typeof statusLabels] : s}</option>)}</select></label>
        <>
          <label className="text-sm">{kind === 'tasks' ? 'Tìm Task' : 'Tìm Sprint'}<input maxLength={100} className={inputClass} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></label>
          <label className="text-sm">Hạn từ<input type="date" className={inputClass} value={dueFrom} max={dueTo || undefined} onChange={e => { setDueFrom(e.target.value); setPage(1); }} /></label>
          <label className="text-sm">Hạn đến<input type="date" className={inputClass} value={dueTo} min={dueFrom || undefined} onChange={e => { setDueTo(e.target.value); setPage(1); }} /></label>
        </>
      </div>
      <div className="mb-4 max-w-xl space-y-2">
        <label className="block text-sm">Tìm thành viên<input className={inputClass} value={memberSearch} onChange={e => { setMemberSearch(e.target.value); setMemberPage(1); }} /></label>
        <label className="block text-sm">Người phụ trách<select className={inputClass} value={assigneeId} onChange={e => { setAssignee(e.target.value); setPage(1); }}><option value="">Tất cả</option>{assigneeId && !members.data?.items.some(m => m.userId === assigneeId) && <option value={assigneeId}>Thành viên đã chọn</option>}{members.data?.items.map(m => <option key={m.userId} value={m.userId}>{m.displayName} · {m.email}</option>)}</select></label>
        {members.loading && <LoadingState />}{Boolean(members.error) && <ErrorState error={members.error} onRetry={members.reload} />}{members.data && <Pager {...members.data} onChange={setMemberPage} />}
      </div>
      {resource.loading && <LoadingState />}{Boolean(resource.error) && <ErrorState error={resource.error} onRetry={resource.reload} />}
      {data && data.items.length === 0 && <Empty />}
      {kind === "sprints" && sprints.data?.items.map(s => <article key={s.id} className="flex flex-wrap items-center justify-between gap-3 border-b py-4"><div><Link className="font-semibold text-blue-700 hover:underline" href={`${basePath}/sprints/${s.id}`}>{s.name}</Link><p className="text-sm text-slate-500">{s.code} · {s.status} · {s.endDate?.slice(0, 10) ?? "Chưa có hạn"}</p></div>{s.sessionId && <Link className="text-sm text-blue-700" href={`${basePath}/sessions/${s.sessionId}`}>Xem phiên</Link>}</article>)}
      {kind === "tasks" && tasks.data?.items.map(t => <article key={t.id} className="flex flex-wrap items-center justify-between gap-3 border-b py-4"><div><Link className="font-semibold text-blue-700 hover:underline" href={`${basePath}/tasks/${t.id}`}>{t.title}</Link><p className="text-sm text-slate-500">{t.code} · {statusLabels[t.status]} · {t.priority} · {t.dueDate?.slice(0, 10) ?? "Chưa có hạn"}</p></div>{t.sprintId && <Link className="text-sm text-blue-700" href={`${basePath}/sprints/${t.sprintId}`}>Xem Sprint</Link>}</article>)}
      {data && <Pager {...data} onChange={setPage} />}
    </Panel>
  </div>;
}
