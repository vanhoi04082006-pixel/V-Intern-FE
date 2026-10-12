"use client";
import Link from "next/link";
import { useCallback } from "react";
import { ErrorState } from "@/components/shared/data-state";
import { Empty, PageTitle, Panel } from "@/components/product/primitives";
import { useResource } from "@/lib/api/use-resource";
import { getAcademic, getMembers, getProjectSlots, type SlotInfo } from "@/lib/api/academic";
import { getTemplateContext } from "@/lib/api/templates";

export interface RequiredRole {
  code: string;
  title: string | null;
  countMin: number;
}

export interface TeamAssessment {
  ready: boolean;
  missing: Array<{ roleCode: string; need: number; have: number }>;
}

/** Pure team readiness: every required slot (countMin>0) filled; no roleDetails → any member. */
export function assessTeam(
  slots: SlotInfo[],
  required: RequiredRole[],
  memberCount: number,
): TeamAssessment {
  const filled = new Map(slots.map((s) => [s.roleCode, s.filledCount]));
  if (required.length === 0) return { ready: memberCount > 0, missing: [] };
  const missing = required
    .filter((r) => r.countMin > 0)
    .map((r) => ({ roleCode: r.code, need: r.countMin, have: filled.get(r.code) ?? 0 }))
    .filter((m) => m.have < m.need);
  return { ready: missing.length === 0, missing };
}

function roleDetailsOf(definition: Record<string, unknown>): RequiredRole[] {
  if (!Array.isArray(definition.roleDetails)) return [];
  return definition.roleDetails
    .filter((r): r is Record<string, unknown> => typeof r === "object" && r !== null)
    .map((r) => ({
      code: typeof r.code === "string" ? r.code : "",
      title: typeof r.title === "string" ? r.title : null,
      countMin: typeof r.countMin === "number" ? r.countMin : 1,
    }))
    .filter((r) => r.code.length > 0);
}

export interface SetupDeps {
  getSession: (id: string, signal?: AbortSignal) => Promise<{ code: string; name: string; status: string; startDate: string | null; endDate: string | null }>;
  getProject: (id: string, signal?: AbortSignal) => Promise<{ code: string; name: string; status: string }>;
  getSlots: typeof getProjectSlots;
  getMembers: (sessionId: string, signal?: AbortSignal) => Promise<Array<{ userId: string; displayName: string; email: string }>>;
  getContext: typeof getTemplateContext;
}

/**
 * Session Setup workspace (M3): template context, time range, role slots with
 * holders, member list, team validation. Member add/remove arrives in M4,
 * the Start button in M5 — intentionally absent here, no dead affordances.
 */
export function SessionSetup({
  sessionId,
  projectId,
  deps,
}: {
  sessionId: string;
  projectId: string | null;
  deps?: Partial<SetupDeps>;
}) {
  const d: SetupDeps = {
    getSession: (id, signal) => getAcademic("sessions", id, signal),
    getProject: (id, signal) => getAcademic("projects", id, signal),
    getSlots: getProjectSlots,
    getMembers: (id, signal) => getMembers("sessions", id, signal),
    getContext: getTemplateContext,
    ...deps,
  };
  const data = useResource(
    useCallback(
      async (signal: AbortSignal) => {
        const session = await d.getSession(sessionId, signal);
        if (!projectId) return { session, project: null, slots: [], members: [], definition: null, templateVersion: null as number | null };
        const [project, slots, members, context] = await Promise.all([
          d.getProject(projectId, signal),
          d.getSlots(projectId, signal),
          d.getMembers(sessionId, signal),
          d.getContext(projectId, signal).catch(() => null),
        ]);
        return {
          session,
          project,
          slots,
          members,
          definition: context?.definition ?? null,
          templateVersion: context?.templateVersion ?? null,
        };
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [sessionId, projectId],
    ),
  );

  if (data.loading) return <p role="status" className="p-4 text-sm text-slate-500">Đang tải phiên setup...</p>;
  if (data.error || !data.data) return <ErrorState error={data.error} onRetry={data.reload} />;
  const { session, project, slots, members, definition, templateVersion } = data.data;
  const required = definition ? roleDetailsOf(definition) : [];
  const assessment = assessTeam(slots, required, members.length);

  return (
    <div className="space-y-4">
      <PageTitle
        title={`Setup: ${session.name}`}
        subtitle={`${session.code} · ${session.status}${templateVersion !== null ? ` · template v${templateVersion}` : ""}`}
        action={<Link className="text-xs font-semibold text-blue-600 hover:underline" href="/instructor/sessions">← Phiên thực tập</Link>}
      />
      {!projectId || !project ? (
        <Empty>
          Phiên chưa gắn project. Hãy mở trang này từ nút “Khởi tạo phiên thực tập” của một Project Template.
        </Empty>
      ) : (
        <>
          <Panel title="Project">
            <p className="text-sm font-semibold">{project.name}</p>
            <p className="font-mono text-[11px] text-slate-400">{project.code} · {project.status}</p>
            <p className="text-xs text-slate-500">
              Thời gian: {session.startDate ?? "—"} → {session.endDate ?? "—"}
            </p>
          </Panel>
          <Panel title={`Đội hình yêu cầu (${slots.length} slots)`}>
            {slots.length === 0 ? (
              <p className="text-xs text-slate-400">Project chưa định nghĩa role slots.</p>
            ) : (
              <ul className="space-y-2">
                {slots.map((s) => (
                  <li key={s.roleCode} className="rounded border border-slate-100 p-2">
                    <p className="text-sm font-semibold">
                      {s.roleCode} · {s.filledCount}/{s.requiredCount}
                      {s.filledCount >= s.requiredCount ? (
                        <span className="ml-2 text-xs font-medium text-emerald-600">Đủ</span>
                      ) : (
                        <span className="ml-2 text-xs font-medium text-amber-600">Còn thiếu</span>
                      )}
                    </p>
                    {s.members.length > 0 ? (
                      <p className="text-xs text-slate-500">{s.members.map((m) => m.displayName ?? m.userId.slice(0, 8)).join(", ")}</p>
                    ) : (
                      <p className="text-xs text-slate-400">Chưa có thành viên — chọn ở bước tiếp theo.</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title={`Thành viên (${members.length})`}>
            {members.length === 0 ? (
              <p className="text-xs text-slate-400">Chưa phân công sinh viên nào.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {members.map((m) => (
                  <li key={m.userId}>{m.displayName} <span className="text-xs text-slate-400">{m.email}</span></li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Sẵn sàng Start">
            {session.status !== "upcoming" ? (
              <p role="status" className="text-sm text-slate-500">Phiên đang ở trạng thái {session.status} — setup chỉ áp dụng cho phiên upcoming.</p>
            ) : assessment.ready ? (
              <p role="status" className="text-sm font-medium text-emerald-700">Đội hình đã đủ điều kiện — sẵn sàng Start Session ở bước tiếp theo.</p>
            ) : assessment.missing.length > 0 ? (
              <ul className="space-y-1 text-sm text-amber-700">
                {assessment.missing.map((m) => (
                  <li key={m.roleCode}>Thiếu {m.need - m.have} {m.roleCode} (đang có {m.have}/{m.need}).</li>
                ))}
              </ul>
            ) : (
              <p role="status" className="text-sm text-amber-700">Chưa có thành viên nào — hãy thêm sinh viên trước khi Start.</p>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
