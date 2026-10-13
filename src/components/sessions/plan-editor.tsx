"use client";
import { useCallback } from "react";
import { getProjectSlots } from "@/lib/api/academic";
import { useResource } from "@/lib/api/use-resource";
import type { PlannedSprint, PlannedTask } from "@/lib/api/planning";
import { inputClass } from "@/components/product/primitives";
import { ErrorState } from "@/components/shared/data-state";

export function PlanEditor({ projectId, draft, onChange, disabled }: {
  projectId: string;
  draft: { sprints: PlannedSprint[] };
  onChange: (draft: { sprints: PlannedSprint[] }) => void;
  disabled: boolean;
}) {
  const roster = useResource(useCallback((signal: AbortSignal) => getProjectSlots(projectId, signal), [projectId]));
  const members = (roster.data ?? []).flatMap((slot) => slot.members.map((m) => ({ ...m, role: slot.roleCode })));
  function updateSprint(index: number, patch: Partial<PlannedSprint>) {
    onChange({ sprints: draft.sprints.map((s, i) => i === index ? { ...s, ...patch } : s) });
  }
  function updateTask(si: number, ti: number, patch: Partial<PlannedTask>) {
    updateSprint(si, { tasks: draft.sprints[si].tasks.map((t, i) => i === ti ? { ...t, ...patch } : t) });
  }
  return <fieldset disabled={disabled} className="space-y-4 rounded border border-blue-100 p-3">
    <legend className="px-1 text-sm font-semibold">Chỉnh sửa kế hoạch trước khi publish</legend>
    <p className="text-xs text-slate-500">Thay đổi được lưu khi xác nhận. Kiểm tra người nhận, thời hạn và tiêu chí hoàn thành từng task.</p>
    {roster.error ? <ErrorState error={roster.error} onRetry={roster.reload} /> : null}
    {draft.sprints.map((s, si) => <div key={si} className="space-y-2">
      <label className="block text-xs">Tên Sprint {si + 1}<input className={inputClass} maxLength={256} value={s.name} onChange={(e) => updateSprint(si, { name: e.target.value })} /></label>
      <label className="block text-xs">Mục tiêu Sprint {si + 1}<textarea className={inputClass} maxLength={512} value={s.goal ?? ""} onChange={(e) => updateSprint(si, { goal: e.target.value })} /></label>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs">Bắt đầu Sprint {si + 1}<input className={inputClass} type="date" value={s.startDate.slice(0, 10)} onChange={(e) => updateSprint(si, { startDate: e.target.value })} /></label>
        <label className="text-xs">Kết thúc Sprint {si + 1}<input className={inputClass} type="date" value={s.endDate.slice(0, 10)} onChange={(e) => updateSprint(si, { endDate: e.target.value })} /></label>
      </div>
      {s.tasks.map((t, ti) => {
        const key = `${si + 1}.${ti + 1}`;
        return <div key={ti} className="space-y-2 rounded bg-slate-50 p-3">
          <label className="block text-xs">Tên task {key}<input className={inputClass} maxLength={256} value={t.title} onChange={(e) => updateTask(si, ti, { title: e.target.value })} /></label>
          <label className="block text-xs">Mô tả task {key}<textarea className={inputClass} maxLength={4000} value={t.description ?? ""} onChange={(e) => updateTask(si, ti, { description: e.target.value })} /></label>
          <label className="block text-xs">Tiêu chí hoàn thành task {key}<textarea className={inputClass} value={(t.acceptanceCriteria ?? []).join("\n")} onChange={(e) => updateTask(si, ti, { acceptanceCriteria: e.target.value.split("\n") })} /></label>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs">Người nhận task {key}<select className={inputClass} value={t.assigneeId ?? ""} onChange={(e) => updateTask(si, ti, { assigneeId: e.target.value || null })}>
              <option value="">Chưa gán</option>
              {t.assigneeId && !members.some((m) => m.userId === t.assigneeId) && <option value={t.assigneeId}>{t.assigneeId}</option>}
              {members.map((m) => <option key={m.userId} value={m.userId}>{m.displayName ?? m.userId} · {m.role}</option>)}
            </select></label>
            <label className="text-xs">Hạn task {key}<input className={inputClass} type="date" value={t.dueDate?.slice(0, 10) ?? ""} onChange={(e) => updateTask(si, ti, { dueDate: e.target.value || null })} /></label>
            <label className="text-xs">Ưu tiên task {key}<select className={inputClass} value={t.priority} onChange={(e) => updateTask(si, ti, { priority: e.target.value })}>{["low", "medium", "high", "critical"].map((p) => <option key={p}>{p}</option>)}</select></label>
            <label className="text-xs">Story points task {key}<input className={inputClass} type="number" min={0} max={100} value={t.storyPoints ?? ""} onChange={(e) => updateTask(si, ti, { storyPoints: e.target.value === "" ? null : Number(e.target.value) })} /></label>
          </div>
        </div>;
      })}
    </div>)}
  </fieldset>;
}
