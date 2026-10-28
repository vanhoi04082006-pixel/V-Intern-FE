"use client";
import { useCallback } from "react";
import { getProjectSlots } from "@/lib/api/academic";
import { useResource } from "@/lib/api/use-resource";
import type { PlannedSprint, PlannedTask, SprintPlan } from "@/lib/api/planning";
import { inputClass } from "@/components/product/primitives";
import { ErrorState } from "@/components/shared/data-state";

export function PlanEditor({ projectId, draft, onChange, disabled }: {
  projectId: string;
  draft: SprintPlan;
  onChange: (draft: SprintPlan) => void;
  disabled: boolean;
}) {
  const roster = useResource(useCallback((signal: AbortSignal) => getProjectSlots(projectId, signal), [projectId]));
  const members = (roster.data ?? []).flatMap((slot) => slot.members.map((m) => ({ ...m, role: slot.roleCode })));
  const allTasks = draft.sprints.flatMap(s => s.tasks);
  function updateSprint(index: number, patch: Partial<PlannedSprint>) {
    onChange({ ...draft, sprints: draft.sprints.map((s, i) => i === index ? { ...s, ...patch } : s) });
  }
  function moveTask(si: number, ti: number, destination: number) {
    if (si === destination) return;
    const task = draft.sprints[si].tasks[ti];
    onChange({ ...draft, sprints: draft.sprints.map((s, i) => ({ ...s, tasks: i === si ? s.tasks.filter((_, index) => index !== ti) : i === destination ? [...s.tasks, task] : s.tasks })) });
  }
  function updateTask(si: number, ti: number, patch: Partial<PlannedTask>) {
    updateSprint(si, { tasks: draft.sprints[si].tasks.map((t, i) => i === ti ? { ...t, ...patch } : t) });
  }
  return <fieldset disabled={disabled} className="ins-plan-editor space-y-6">
    <legend className="px-1 text-body font-semibold">Chỉnh sửa kế hoạch trước khi publish</legend>
    <p className="text-caption text-muted-foreground">Thay đổi được lưu khi xác nhận. Kiểm tra người nhận, thời hạn và tiêu chí hoàn thành từng task.</p>
    {roster.error ? <ErrorState error={roster.error} onRetry={roster.reload} /> : null}
    {(draft.milestones ?? []).map((m, mi) => <div key={m.key} className="grid gap-4 border-b border-border py-4 sm:grid-cols-2">
      <label className="text-caption">Mốc bàn giao {mi + 1}<input className={inputClass} maxLength={256} value={m.title} onChange={e => onChange({ ...draft, milestones: draft.milestones!.map((value, i) => i === mi ? { ...value, title: e.target.value } : value) })} /></label>
      <label className="text-caption">Hạn mốc {mi + 1}<input className={inputClass} type="date" value={m.dueDate.slice(0, 10)} onChange={e => onChange({ ...draft, milestones: draft.milestones!.map((value, i) => i === mi ? { ...value, dueDate: e.target.value } : value) })} /></label>
      <p className="text-caption text-muted-foreground sm:col-span-2">Nghiệm thu: {m.taskKeys.map(key => allTasks.find(t => t.key === key)?.title ?? key).join(' · ')}</p>
    </div>)}
    {draft.sprints.map((s, si) => <div key={si} className="ins-plan-sprint space-y-4">
      <label className="block text-caption">Tên Sprint {si + 1}<input className={inputClass} maxLength={256} value={s.name} onChange={(e) => updateSprint(si, { name: e.target.value })} /></label>
      <label className="block text-caption">Mục tiêu Sprint {si + 1}<textarea className={inputClass} maxLength={512} value={s.goal ?? ""} onChange={(e) => updateSprint(si, { goal: e.target.value })} /></label>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-caption">Bắt đầu Sprint {si + 1}<input className={inputClass} type="date" value={s.startDate.slice(0, 10)} onChange={(e) => updateSprint(si, { startDate: e.target.value })} /></label>
        <label className="text-caption">Kết thúc Sprint {si + 1}<input className={inputClass} type="date" value={s.endDate.slice(0, 10)} onChange={(e) => updateSprint(si, { endDate: e.target.value })} /></label>
      </div>
      {s.tasks.map((t, ti) => {
        const key = `${si + 1}.${ti + 1}`;
        const selectedAssignee = members.find(m => m.userId.toLowerCase() === t.assigneeId?.toLowerCase())?.userId ?? t.assigneeId ?? '';
        return <div key={ti} className="ins-plan-task space-y-3">
          <label className="block text-caption">Tên task {key}<input className={inputClass} maxLength={256} value={t.title} onChange={(e) => updateTask(si, ti, { title: e.target.value })} /></label>
          <label className="block text-caption">Mô tả task {key}<textarea className={inputClass} maxLength={4000} value={t.description ?? ""} onChange={(e) => updateTask(si, ti, { description: e.target.value })} /></label>
          <label className="block text-caption">Tiêu chí hoàn thành task {key}<textarea className={inputClass} value={(t.acceptanceCriteria ?? []).join("\n")} onChange={(e) => updateTask(si, ti, { acceptanceCriteria: e.target.value.split("\n") })} /></label>
          <label className="block text-caption">Đầu ra task {key}<textarea className={inputClass} maxLength={2000} value={t.expectedOutput ?? ''} onChange={e => updateTask(si, ti, { expectedOutput: e.target.value })} /></label>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-caption">Chuyển task {key} sang Sprint<select className={inputClass} value={si} onChange={e => moveTask(si, ti, Number(e.target.value))}>{draft.sprints.map((sprint, index) => <option key={index} value={index}>{sprint.name}</option>)}</select></label>
            <label className="text-caption">Giờ ước lượng task {key}<input className={inputClass} type="number" min={0.5} max={160} step={0.5} value={t.estimatedHours ?? ''} onChange={e => updateTask(si, ti, { estimatedHours: e.target.value ? Number(e.target.value) : null })} /></label>
            <label className="text-caption">Độ khó task {key}<select className={inputClass} value={t.complexity ?? 'beginner'} onChange={e => updateTask(si, ti, { complexity: e.target.value })}><option value="beginner">Cơ bản</option><option value="intermediate">Trung bình</option><option value="advanced">Nâng cao</option></select></label>
            <label className="text-caption">Kỹ năng task {key}<input className={inputClass} maxLength={1000} placeholder="React, TypeScript" value={(t.skillTags ?? []).join(', ')} onChange={e => updateTask(si, ti, { skillTags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} /></label>
            {t.key && <><label className="text-caption">Task cha của {key}<select className={inputClass} value={t.parentKey ?? ''} onChange={e => updateTask(si, ti, { parentKey: e.target.value || null })}><option value="">Task độc lập</option>{allTasks.filter(item => item.key && item.key !== t.key).map(item => <option key={item.key} value={item.key}>{item.title}</option>)}</select></label>
            <fieldset className="border-t border-border py-3"><legend className="px-1 text-caption">Cần hoàn thành trước task {key}</legend>{allTasks.filter(item => item.key && item.key !== t.key).map(item => <label key={item.key} className="flex items-center gap-2 py-1 text-caption"><input type="checkbox" checked={(t.dependsOn ?? []).includes(item.key!)} onChange={e => updateTask(si, ti, { dependsOn: e.target.checked ? [...(t.dependsOn ?? []), item.key!] : (t.dependsOn ?? []).filter(k => k !== item.key) })} />{item.title}</label>)}</fieldset></>}
            <label className="text-caption">Người nhận task {key}<select className={inputClass} value={selectedAssignee} onChange={(e) => updateTask(si, ti, { assigneeId: e.target.value || null })}>
              <option value="">Chưa gán</option>
              {t.assigneeId && !members.some((m) => m.userId.toLowerCase() === t.assigneeId!.toLowerCase()) && <option value={t.assigneeId}>Thành viên không còn trong đội , cần gán lại</option>}
              {members.map((m) => <option key={m.userId} value={m.userId}>{m.displayName ?? m.userId} · {m.role}</option>)}
            </select></label>
            <label className="text-caption">Hạn task {key}<input className={inputClass} type="date" value={t.dueDate?.slice(0, 10) ?? ""} onChange={(e) => updateTask(si, ti, { dueDate: e.target.value || null })} /></label>
            <label className="text-caption">Ưu tiên task {key}<select className={inputClass} value={t.priority} onChange={(e) => updateTask(si, ti, { priority: e.target.value })}>{["low", "medium", "high", "critical"].map((p) => <option key={p}>{p}</option>)}</select></label>
            <label className="text-caption">Story points task {key}<input className={inputClass} type="number" min={0} max={100} value={t.storyPoints ?? ""} onChange={(e) => updateTask(si, ti, { storyPoints: e.target.value === "" ? null : Number(e.target.value) })} /></label>
          </div>
        </div>;
      })}
    </div>)}
  </fieldset>;
}
