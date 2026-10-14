"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import { CalendarDays, Users, CheckCircle2, Star, Clock, Layers, Plus, ArrowRight, FolderKanban, Rocket } from "lucide-react";
import { getInstructorDashboard } from "@/lib/api/dashboard";
import { getBoard } from "@/lib/api/work";
import { useResource } from "@/lib/api/use-resource";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { Badge, Empty, inputClass, Modal, PageTitle, PageMeta, MetricCard, Panel, StatusDot, AvatarStack, ProgressBar, buttonClass } from "./primitives";
import { Person } from "./identity";
import { TaskDetail } from "./intern-work";
import { Burndown } from './sprint-overview';
import { ImportedReviews } from './imported-reviews';

const date = (value: string) => new Date(value).toLocaleDateString("vi-VN");
const percentage = (done: number, total: number) => total ? Math.round(done / total * 100) : 0;


export function InstructorDashboard() {
  const resource = useResource(useCallback((s: AbortSignal) => getInstructorDashboard(s), []));
  const [selectedSprint, setSelectedSprint] = useState(""), [reviewTask, setReviewTask] = useState("");
  if (resource.loading) return <LoadingState />;
  if (resource.error) return <ErrorState error={resource.error} onRetry={resource.reload} />;
  if (!resource.data) return null;
  const d = resource.data, m = d.metrics, sprintId = selectedSprint || d.sprints[0]?.id;
  const doneRate = percentage(m.doneCount, m.taskCount);
  const cards = [
    { icon: Layers, label: "Phiên đang hoạt động", value: `${m.activeSessions} / ${m.sessionCount}`, sub: "Trong phạm vi quản lý" },
    { icon: Users, label: "Sinh viên tham gia", value: m.internCount.toLocaleString("vi-VN"), sub: "Đã được phân công vào dự án" },
    { icon: CheckCircle2, label: "Tỷ lệ hoàn thành sprint", value: `${doneRate}%`, sub: `${m.doneCount} / ${m.taskCount} task` },
    { icon: Star, label: "Điểm AI trung bình", value: m.averageScore === null ? "—" : `${m.averageScore.toFixed(1)} / 100`, sub: m.averageScore === null ? "Chưa có đánh giá được chốt" : "Đánh giá chính thức của giảng viên" },
    { icon: Clock, label: "Task / PR chờ duyệt", value: m.reviewCount.toLocaleString("vi-VN"), sub: `${m.overdueCount} task quá hạn`, subTone: "text-red-600" },
  ];
  return <div className="instructor-overview">
    <PageTitle title="Instructor Workspace" subtitle="Theo dõi và quản lý chương trình thực tập" action={<Link className={buttonClass} href="/instructor/projects"><Rocket size={16} /> Khởi tạo phiên từ thư viện</Link>} />
    <PageMeta items={[
      { icon: Users, label: "Vai trò", value: "Giảng viên / Technical Lead" },
      { icon: Layers, label: "Hệ thống", value: "V-Intern Platform" },
      { icon: CalendarDays, label: "Phiên hiện tại", value: d.sessions[0]?.code ?? "Chưa có" },
      { icon: FolderKanban, label: "Sprint hiện tại", value: d.sprints[0]?.name ?? "Chưa có" },
      { icon: Clock, label: "Cập nhật lúc", value: new Date(d.generatedAt).toLocaleString("vi-VN") },
    ]} />
    <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{cards.map((c, i) => <MetricCard key={c.label} icon={c.icon} label={c.label} index={i} value={c.value} sub={c.sub} subTone={c.subTone ?? "text-slate-500"} />)}</div>
    <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <Panel title="Phiên thực tập đang hoạt động" action={<span className="flex items-center gap-3"><Link href="/instructor/sessions" className="text-xs text-blue-600">Xem tất cả phiên →</Link><Link href="/instructor/sessions" className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"><Plus size={14} />Tạo phiên mới</Link></span>}>
        {!d.sessions.length ? <Empty>Chưa có phiên trong phạm vi quản lý.</Empty> : <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead className="bg-[#f0f5fa]"><tr>{["Phiên", "Project", "Số sinh viên", "Tiến độ", "Trạng thái", "Thời gian", "Hành động"].map((h) => <th className="px-2 py-2 font-medium" key={h}>{h}</th>)}</tr></thead><tbody className="divide-y divide-blue-50">{d.sessions.map((s) => <tr key={s.id}><td className="max-w-52 px-2 py-2"><strong className="block text-blue-600">{s.code}</strong><span className="mt-1 line-clamp-1 block text-[10px] text-slate-500">{s.name}</span></td><td className="max-w-36 px-2 py-2"><span className="block font-semibold text-navy">{s.projectName ?? "Chưa có dự án"}</span></td><td className="px-2 py-2"><AvatarStack count={s.memberCount} /></td><td className="min-w-28 px-2 py-2"><ProgressBar value={percentage(s.doneCount, s.taskCount)} /></td><td className="px-2 py-2"><SessionStatus status={s.status} /></td><td className="whitespace-nowrap px-2 py-2 text-[11px]">{date(s.startDate)}<br />{date(s.endDate)}</td><td className="whitespace-nowrap px-2 py-2"><Link href={`/instructor/sessions/${s.id}`} className="rounded border border-blue-100 px-2 py-1 text-blue-600">Xem chi tiết</Link> <RowMenu label={`Thao tác phiên ${s.code}`} href={`/instructor/sessions/${s.id}`} /></td></tr>)}</tbody></table></div>}
      </Panel>
      <Panel title="Tiến độ Sprint" action={<select aria-label="Chọn sprint tổng quan" className={`${inputClass} max-w-52 text-xs`} value={sprintId ?? ""} onChange={(e) => setSelectedSprint(e.target.value)}>{d.sprints.map((s) => <option key={s.id} value={s.id}>{s.projectName} · {s.name}</option>)}</select>}>{sprintId ? <SprintProgress id={sprintId} asOf={d.generatedAt} /> : <Empty>Chưa có sprint.</Empty>}</Panel>
      <Panel title="Hiệu suất sinh viên (Top 5)" action={<Link href="/instructor/performance" className="text-xs text-blue-600">Xem tất cả →</Link>}>
        {!d.students.length ? <Empty>Chưa có sinh viên được phân công.</Empty> : <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-xs"><thead className="bg-[#f0f5fa]"><tr>{["Sinh viên", "Dự án", "Task hoàn thành", "Điểm đánh giá", "Hành động"].map((t) => <th key={t} className="px-2 py-2 font-medium">{t}</th>)}</tr></thead><tbody className="divide-y divide-blue-50">{d.students.map((s) => <tr key={s.id}><td className="px-2 py-2"><Person name={s.displayName} secondary={s.email} /></td><td className="px-2 py-2">{s.projectName}</td><td className="px-2 py-2"><strong>{s.doneCount} / {s.taskCount}</strong><progress className="mt-1 h-1.5 w-full accent-blue-600" value={s.doneCount} max={s.taskCount || 1} aria-label={`Task của ${s.displayName}`} /></td><td className="px-2 py-2 font-semibold text-navy">{s.averageScore?.toFixed(1) ?? "Chưa chấm"}</td><td className="px-2 py-2"><Link href="/instructor/performance" className="text-blue-600">Xem</Link></td></tr>)}</tbody></table></div>}
      </Panel>
      <div className="min-w-0 space-y-3">
        <Panel title="Review & Đánh giá (Pull Request)" action={<Link href="/instructor/sprints" className="text-xs text-blue-600">Xem tất cả →</Link>}>
          {d.reviews.length ? <div className="overflow-x-auto"><table className="w-full min-w-[500px] text-left text-[11px]"><thead className="bg-[#f0f5fa]"><tr>{["PR / Task", "Sinh viên", "Điểm", "Trạng thái", "Hành động"].map(h => <th key={h} className="px-2 py-2 font-medium">{h}</th>)}</tr></thead><tbody className="divide-y divide-blue-50">{d.reviews.map(r => <tr key={r.id}><td className="max-w-44 px-2 py-2"><button title={r.taskTitle} className="line-clamp-1 text-left font-semibold text-blue-600 hover:underline" onClick={() => setReviewTask(r.taskId)}>{r.taskTitle}</button><p className="mt-1 text-[10px] text-slate-500">{r.taskCode}</p></td><td className="max-w-44 px-2 py-2"><Person name={r.displayName} /></td><td className="px-2 py-2 font-semibold text-navy">{r.score ?? "—"}</td><td className="px-2 py-2"><Badge>{r.status}</Badge></td><td className="px-2 py-2"><button className="rounded border border-blue-100 px-2 py-1 text-blue-600 hover:bg-blue-50" aria-label={`Xem bài nộp ${r.taskTitle}`} onClick={() => setReviewTask(r.taskId)}>{r.status === "submitted" ? "Chấm bài" : "Xem"}</button></td></tr>)}</tbody></table></div> : <Empty>Chưa có bài nộp trong phạm vi quản lý.</Empty>}
          <p className="mt-2 text-[10px] text-slate-500">Năm bài nộp gần nhất. Điểm hiển thị là điểm giảng viên đã chốt.</p>
        </Panel>
      </div>
      <Panel title="Tổng quan Task (Tất cả phiên)">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[["To Do", m.todoCount, `${m.overdueCount} task quá hạn`], ["Doing", m.doingCount, "Đang thực hiện"], ["Review", m.reviewCount, `${m.reviewCount} đang chờ review`], ["Done", m.doneCount, `${doneRate}% hoàn thành`]].map(([label, count, sub]) => <Link href="/instructor/sprints" key={label} className="rounded-md border border-blue-100 bg-slate-50/50 p-3"><span className="block text-xs font-semibold text-navy">{label}</span><strong className="mt-1 block text-xl text-navy">{count}</strong><span className="mt-1 block text-[10px] text-slate-500">{sub}</span></Link>)}</div>
      </Panel>
      <div className="grid min-w-0 items-start gap-3 2xl:grid-cols-2">
      <Panel title="Hoạt động gần đây" action={<Link href="/admin/activity" className="text-xs text-blue-600">Xem tất cả →</Link>}><ul aria-label="Hoạt động gần đây" tabIndex={0} className="max-h-44 space-y-3 overflow-y-auto pr-2 focus-visible:outline-2 focus-visible:outline-blue-600">{d.activity.map((a) => <li key={a.id} className="flex gap-3 text-xs"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" /><div className="min-w-0 flex-1"><p className="text-navy">{a.summary ?? a.action}</p><p className="mt-1 text-[10px] text-slate-400">{a.displayName}</p></div><time className="shrink-0 text-[10px] text-slate-400">{new Date(a.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</time></li>)}</ul></Panel></div>
    </div>
    <div className="mt-4"><ImportedReviews /></div>
    {reviewTask && <Modal wide title="Chi tiết bài nộp & đánh giá" onClose={() => setReviewTask("")}><TaskDetail id={reviewTask} managed onUpdated={resource.reload} /></Modal>}
  </div>;
}

function SessionStatus({ status }: { status: string }) {
  const tone = status === "active" ? "green" : status === "ending" ? "amber" : status === "upcoming" ? "blue" : status === "completed" ? "gray" : "gray";
  const label = { active: "Đang diễn ra", ending: "Sắp kết thúc", upcoming: "Sắp bắt đầu", completed: "Hoàn thành", cancelled: "Đã hủy" }[status] ?? status;
  return <StatusDot tone={tone as "green"}>{label}</StatusDot>;
}

export function RowMenu({ label, href, onOpen, items }: { label: string; href?: string; onOpen?: () => void; items?: { label: string; onSelect: () => void }[] }) {
  const entries = items ?? [];
  return (
    <details className="relative inline-block">
      <summary aria-label={label} className="cursor-pointer list-none rounded border border-blue-100 px-2 py-1 text-blue-600 [&::-webkit-details-marker]:hidden">⋯</summary>
      <div className="absolute right-0 top-full z-30 mt-1 min-w-32 rounded-lg border border-blue-100 bg-white p-1 shadow-lg">
        {href ? <Link href={href} className="block rounded-md px-3 py-2 text-xs text-navy hover:bg-blue-50">Mở chi tiết →</Link>
        : onOpen && !entries.length ? <button className="block w-full rounded-md px-3 py-2 text-left text-xs text-navy hover:bg-blue-50" onClick={onOpen}>Mở chi tiết →</button>
        : entries.map(e => <button key={e.label} className="block w-full rounded-md px-3 py-2 text-left text-xs text-navy hover:bg-blue-50" onClick={e.onSelect}>{e.label}</button>)}
      </div>
    </details>
  );
}

function SprintProgress({ id, asOf }: { id: string; asOf: string }) {
  const resource = useResource(useCallback((s: AbortSignal) => getBoard(id, s), [id]));
  if (resource.loading) return <LoadingState />;
  if (resource.error) return <ErrorState error={resource.error} onRetry={resource.reload} />;
  if (!resource.data) return null;
  const b = resource.data, done = b.columns.find((c) => c.status === "done")?.count ?? 0;
  const remaining = Math.max(0, Math.ceil((Date.parse(b.sprint.endDate) - Date.parse(asOf)) / 86400000));
  return <><div className="mb-3 grid grid-cols-3 gap-2">{[["Thời gian còn lại", `${remaining} ngày`], ["Task hoàn thành", `${done} / ${b.total}`], ["Task còn lại", `${b.total - done} task`]].map(([label, value]) => <div key={label} className="rounded-md border border-blue-100 p-3"><p className="text-[10px] text-slate-500">{label}</p><strong className="mt-1 block text-base text-navy">{value}</strong></div>)}</div><progress className="h-1.5 w-full accent-blue-600" max={b.total || 1} value={done} aria-label="Tiến độ Sprint tổng quan" /><Burndown id={id} compact /><div className="mt-3 flex items-center justify-between text-xs text-slate-500"><span>{date(b.sprint.startDate)} – {date(b.sprint.endDate)}</span><Link href="/instructor/sprints" className="text-blue-600">Sprint Board <ArrowRight size={14} className="inline" /></Link></div></>;
}
