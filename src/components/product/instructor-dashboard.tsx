"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import {
  IconArrowRight,
  IconCalendarDays,
  IconCircleCheck,
  IconClock,
  IconFolderKanban,
  IconLayers,
  IconPlus,
  IconRocket,
  IconStar,
  IconUsers,
} from "@/components/v-intern/icons";
import { getInstructorDashboard } from "@/lib/api/dashboard";
import { getBoard } from "@/lib/api/work";
import { useResource } from "@/lib/api/use-resource";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { Badge, Empty, inputClass, Modal, PageTitle, PageMeta, MetricCard, Panel, StatusDot, AvatarStack, ProgressBar, buttonClass, tdClass, thClass } from "./primitives";
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
    { icon: IconLayers, label: "Phiên đang hoạt động", value: `${m.activeSessions} / ${m.sessionCount}`, sub: "Trong phạm vi quản lý" },
    { icon: IconUsers, label: "Sinh viên tham gia", value: m.internCount.toLocaleString("vi-VN"), sub: "Đã được phân công vào dự án" },
    { icon: IconCircleCheck, label: "Tỷ lệ hoàn thành sprint", value: `${doneRate}%`, sub: `${m.doneCount} / ${m.taskCount} nhiệm vụ` },
    { icon: IconStar, label: "Điểm AI trung bình", value: m.averageScore === null ? "—" : `${m.averageScore.toFixed(1)} / 100`, sub: m.averageScore === null ? "Chưa có đánh giá được chốt" : "Đánh giá chính thức của giảng viên" },
    { icon: IconClock, label: "Bài nộp chờ duyệt", value: m.reviewCount.toLocaleString("vi-VN"), sub: `${m.overdueCount} nhiệm vụ quá hạn`, subTone: "text-destructive" },
  ];
  const reviewStatusNames: Record<string, string> = { submitted: "Chờ duyệt", approved: "Đã duyệt", rework: "Cần làm lại", withdrawn: "Đã rút" };
  return <div className="instructor-overview">
    <PageTitle title="Tổng quan giảng viên" subtitle="Theo dõi và quản lý chương trình thực tập" action={<Link className={buttonClass} href="/instructor/projects"><IconRocket size={16} aria-hidden="true" /> Khởi tạo phiên từ thư viện</Link>} />
    <PageMeta items={[
      { icon: IconUsers, label: "Vai trò", value: "Giảng viên / Technical Lead" },
      { icon: IconLayers, label: "Hệ thống", value: "V-Intern Platform" },
      { icon: IconCalendarDays, label: "Phiên hiện tại", value: d.sessions[0]?.code ?? "Chưa có" },
      { icon: IconFolderKanban, label: "Sprint hiện tại", value: d.sprints[0]?.name ?? "Chưa có" },
      { icon: IconClock, label: "Cập nhật lúc", value: new Date(d.generatedAt).toLocaleString("vi-VN") },
    ]} />
    <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{cards.map((c, i) => <MetricCard key={c.label} icon={c.icon} label={c.label} index={i} value={c.value} sub={c.sub} subTone={c.subTone ?? "text-muted-foreground"} />)}</div>
    <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <Panel title="Phiên thực tập đang hoạt động" action={<span className="flex items-center gap-3"><Link href="/instructor/sessions" className="rounded-control px-1 text-caption font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">Xem tất cả phiên</Link><Link href="/instructor/sessions" className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-caption font-semibold text-primary-foreground shadow-app-xs transition-[background-color,translate] duration-200 hover:bg-primary/90 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"><IconPlus size={14} aria-hidden="true" />Tạo phiên mới</Link></span>}>
        {!d.sessions.length ? <Empty>Chưa có phiên trong phạm vi quản lý.</Empty> : <div className="notebook-scroll overflow-x-auto"><table className="product-table w-full min-w-[720px] border-collapse text-caption"><thead><tr>{["Phiên", "Dự án", "Số sinh viên", "Tiến độ", "Trạng thái", "Thời gian", "Hành động"].map((h) => <th className={thClass} key={h}>{h}</th>)}</tr></thead><tbody>{d.sessions.map((s) => <tr key={s.id}><td className={`${tdClass} max-w-52`}><strong className="block text-primary">{s.code}</strong><span className="mt-1 line-clamp-1 block text-caption text-muted-foreground">{s.name}</span></td><td className={`${tdClass} max-w-36`}><span className="block font-semibold text-foreground">{s.projectName ?? "Chưa có dự án"}</span></td><td className={tdClass}><AvatarStack count={s.memberCount} /></td><td className={`${tdClass} min-w-28`}><ProgressBar value={percentage(s.doneCount, s.taskCount)} /></td><td className={tdClass}><SessionStatus status={s.status} /></td><td className={`${tdClass} whitespace-nowrap`}>{date(s.startDate)}<br />{date(s.endDate)}</td><td className={`${tdClass} whitespace-nowrap`}><Link href={`/instructor/sessions/${s.id}`} className="rounded border border-primary px-2 py-1 text-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">Xem chi tiết</Link> <RowMenu label={`Thao tác phiên ${s.code}`} href={`/instructor/sessions/${s.id}`} /></td></tr>)}</tbody></table></div>}
      </Panel>
      <Panel title="Tiến độ Sprint" action={<select aria-label="Chọn sprint tổng quan" className={`${inputClass} max-w-52 text-caption`} value={sprintId ?? ""} onChange={(e) => setSelectedSprint(e.target.value)}>{d.sprints.map((s) => <option key={s.id} value={s.id}>{s.projectName} · {s.name}</option>)}</select>}>{sprintId ? <SprintProgress id={sprintId} asOf={d.generatedAt} /> : <Empty>Chưa có sprint nào.</Empty>}</Panel>
      <Panel title="Hiệu suất sinh viên (Top 5)" action={<Link href="/instructor/performance" className="rounded-control px-1 text-caption font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">Xem tất cả</Link>}>
        {!d.students.length ? <Empty>Chưa có sinh viên được phân công.</Empty> : <div className="notebook-scroll overflow-x-auto"><table className="product-table w-full min-w-[520px] border-collapse text-caption"><thead><tr>{["Sinh viên", "Dự án", "Task hoàn thành", "Điểm đánh giá", "Hành động"].map((t) => <th key={t} className={thClass}>{t}</th>)}</tr></thead><tbody>{d.students.map((s) => <tr key={s.id}><td className={tdClass}><Person name={s.displayName} secondary={s.email} /></td><td className={tdClass}>{s.projectName}</td><td className={tdClass}><strong>{s.doneCount} / {s.taskCount}</strong><progress className="mt-1 h-1.5 w-full accent-primary" value={s.doneCount} max={s.taskCount || 1} aria-label={`Task của ${s.displayName}`} /></td><td className={`${tdClass} font-semibold`}>{s.averageScore?.toFixed(1) ?? "Chưa chấm"}</td><td className={tdClass}><Link href="/instructor/performance" className="rounded-control px-1 text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">Xem</Link></td></tr>)}</tbody></table></div>}
      </Panel>
      <div className="min-w-0 space-y-3">
        <Panel title="Review & Đánh giá (Pull Request)" action={<Link href="/instructor/sprints" className="rounded-control px-1 text-caption font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">Xem tất cả</Link>}>
          {d.reviews.length ? <div className="notebook-scroll overflow-x-auto"><table className="product-table w-full min-w-[500px] border-collapse text-caption"><thead><tr>{["PR / Task", "Sinh viên", "Điểm", "Trạng thái", "Hành động"].map(h => <th key={h} className={thClass}>{h}</th>)}</tr></thead><tbody>{d.reviews.map(r => <tr key={r.id}><td className={`${tdClass} max-w-44`}><button title={r.taskTitle} className="line-clamp-1 rounded-control text-left font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40" onClick={() => setReviewTask(r.taskId)}>{r.taskTitle}</button><p className="mt-1 text-caption text-muted-foreground">{r.taskCode}</p></td><td className={`${tdClass} max-w-44`}><Person name={r.displayName} /></td><td className={`${tdClass} font-semibold`}>{r.score ?? "—"}</td><td className={tdClass}><Badge tone={r.status === "approved" ? "green" : r.status === "rework" ? "amber" : "blue"}>{reviewStatusNames[r.status] ?? r.status}</Badge></td><td className={tdClass}><button className="rounded border border-primary px-2 py-1 text-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40" aria-label={`Xem bài nộp ${r.taskTitle}`} onClick={() => setReviewTask(r.taskId)}>{r.status === "submitted" ? "Chấm bài" : "Xem"}</button></td></tr>)}</tbody></table></div> : <Empty>Chưa có bài nộp trong phạm vi quản lý.</Empty>}
          <p className="mt-2 text-caption text-muted-foreground">Năm bài nộp gần nhất. Điểm hiển thị là điểm giảng viên đã chốt.</p>
        </Panel>
      </div>
      <Panel title="Tổng quan nhiệm vụ (tất cả phiên)">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Cần làm", m.todoCount, `${m.overdueCount} nhiệm vụ quá hạn`], ["Đang làm", m.doingCount, "Đang thực hiện"], ["Chờ duyệt", m.reviewCount, `${m.reviewCount} bài đang chờ duyệt`], ["Hoàn thành", m.doneCount, `${doneRate}% hoàn thành`]].map(([label, count, sub]) => <Link href="/instructor/sprints" key={label} className="rounded-md border border-primary bg-background/50 p-3 transition-[translate,box-shadow] duration-200 hover:shadow-app-xs active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"><span className="block text-caption font-semibold text-foreground">{label}</span><strong className="mt-1 block text-section text-foreground">{count}</strong><span className="mt-1 block text-caption text-muted-foreground">{sub}</span></Link>)}</div>
      </Panel>
      <div className="grid min-w-0 items-start gap-3 2xl:grid-cols-2">
      <Panel title="Hoạt động gần đây" action={<Link href="/admin/activity" className="rounded-control px-1 text-caption font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">Xem tất cả</Link>}><ul aria-label="Hoạt động gần đây" tabIndex={0} className="notebook-scroll max-h-44 space-y-3 overflow-y-auto pr-2 focus-visible:outline-2 focus-visible:outline-ring">{d.activity.map((a) => <li key={a.id} className="flex gap-3 text-caption"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" /><div className="min-w-0 flex-1"><p className="text-foreground">{a.summary ?? a.action}</p><p className="mt-1 text-caption text-muted-foreground">{a.displayName}</p></div><time className="shrink-0 text-caption text-muted-foreground">{new Date(a.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</time></li>)}</ul></Panel></div>
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
      <summary aria-label={label} className="cursor-pointer list-none rounded border border-primary px-2 py-1 text-primary transition-colors duration-200 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 [&::-webkit-details-marker]:hidden">⋯</summary>
      <div className="absolute right-0 top-full z-30 mt-1 min-w-32 rounded-control border border-primary bg-card p-1 shadow-popover">
        {href ? <Link href={href} className="block rounded-md px-3 py-2 text-caption text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">Mở chi tiết</Link>
        : onOpen && !entries.length ? <button className="block w-full rounded-md px-3 py-2 text-left text-caption text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40" onClick={onOpen}>Mở chi tiết</button>
        : entries.map(e => <button key={e.label} className="block w-full rounded-md px-3 py-2 text-left text-caption text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40" onClick={e.onSelect}>{e.label}</button>)}
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
  return <><div className="mb-3 grid grid-cols-3 gap-2">{[["Thời gian còn lại", `${remaining} ngày`], ["Task hoàn thành", `${done} / ${b.total}`], ["Task còn lại", `${b.total - done} task`]].map(([label, value]) => <div key={label} className="rounded-md border border-primary p-3"><p className="text-caption text-muted-foreground">{label}</p><strong className="mt-1 block text-subsection text-foreground">{value}</strong></div>)}</div><progress className="h-1.5 w-full accent-primary" max={b.total || 1} value={done} aria-label="Tiến độ Sprint tổng quan" /><Burndown id={id} compact /><div className="mt-3 flex items-center justify-between text-caption text-muted-foreground"><span>{date(b.sprint.startDate)} đến {date(b.sprint.endDate)}</span><Link href="/instructor/sprints" className="text-primary">Sprint Board <IconArrowRight size={14} className="inline" /></Link></div></>;
}
