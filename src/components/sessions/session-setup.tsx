"use client";
import Link from "next/link";
import { useCallback } from "react";
import { ErrorState } from "@/components/shared/data-state";
import { Empty, PageTitle, Panel, buttonClass } from "@/components/product/primitives";
import { useAction } from "@/components/product/use-action";
import { useResource } from "@/lib/api/use-resource";
import { getAcademic, getMembers, getProjectSlots, transitionSession, type SlotInfo } from "@/lib/api/academic";
import { getTemplateContext } from "@/lib/api/templates";
import { MemberSelector, type SelectorDeps } from "./member-selector";
import { AiPlanPanel, type PlanDeps } from "./ai-plan";
import { Can } from "@/components/auth/can";

export interface RequiredRole {
  code: string;
  title: string | null;
  countMin: number;
}

export interface SetupSession {
  code: string;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
}

export interface SetupProject {
  id: string;
  code: string;
  name: string;
  status: string;
}

export interface SetupMember {
  userId: string;
  displayName: string;
  email: string;
}

export interface SetupData {
  session: SetupSession;
  project: SetupProject | null;
  slots: SlotInfo[];
  members: SetupMember[];
  definition: Record<string, unknown> | null;
  templateVersion: number | null;
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
  getSession: (id: string, signal?: AbortSignal) => Promise<SetupSession>;
  getProject: (id: string, signal?: AbortSignal) => Promise<SetupProject>;
  getSlots: typeof getProjectSlots;
  getMembers: (sessionId: string, signal?: AbortSignal) => Promise<SetupMember[]>;
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
  planDeps,
  selectorDeps,
}: {
  sessionId: string;
  projectId: string | null;
  deps?: Partial<SetupDeps>;
  planDeps?: Partial<PlanDeps>;
  selectorDeps?: Partial<SelectorDeps>;
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
      async (signal: AbortSignal): Promise<SetupData> => {
        const session = await d.getSession(sessionId, signal);
        if (!projectId) {
          return {
            session, project: null, slots: [], members: [],
            definition: null, templateVersion: null,
          } as SetupData;
        }
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

  // Stale-while-revalidate: keep showing current data while reloading so child
  // state (e.g. action notices in MemberSelector) survives parent refreshes.
  // Unmounting on every reload would silently discard them.
  if (!data.data) {
    if (data.loading) return <p role="status" className="p-4 text-sm text-slate-500">Đang tải phiên setup...</p>;
    return <ErrorState error={data.error} onRetry={data.reload} />;
  }
  return <SetupBody sessionId={sessionId} projectId={projectId} data={data.data} onChanged={data.reload} planDeps={planDeps} selectorDeps={selectorDeps} refreshing={data.loading} />;
}

function SetupBody({
  sessionId,
  projectId,
  data,
  onChanged,
  planDeps,
  selectorDeps,
  refreshing,
}: {
  sessionId: string;
  projectId: string | null;
  data: SetupData;
  onChanged: () => void;
  planDeps?: Partial<PlanDeps>;
  selectorDeps?: Partial<SelectorDeps>;
  refreshing?: boolean;
}) {
  const { session, project, slots, members, definition, templateVersion } = data;
  const required = definition ? roleDetailsOf(definition) : [];
  const assessment = assessTeam(slots, required, members.length);
  const startAction = useAction(onChanged);

  return (
    <div className="space-y-4">
      <PageTitle
        title={`Setup: ${session.name}`}
        subtitle={`${session.code} · ${session.status}${templateVersion !== null ? ` · template v${templateVersion}` : ""}`}
        action={<Link className="text-xs font-semibold text-blue-600 hover:underline" href="/instructor/sessions">← Phiên thực tập</Link>}
      />
      {refreshing && <p role="status" className="text-[11px] text-slate-400">Đang cập nhật dữ liệu...</p>}
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
          {session.status === "upcoming" && (
            <Can perm={["assignments.manage", "assignments.view", "recruitment.view"]}><Panel title="Thêm sinh viên">
              <MemberSelector
                sessionId={sessionId}
                projectId={project.id}
                slots={slots}
                onChanged={onChanged}
                deps={selectorDeps}
                members={members}
              />
            </Panel></Can>
          )}
          <Panel title="Start Session">
            {session.status !== "upcoming" ? (
              <div className="space-y-3">
                <p role="status" className="text-sm text-slate-500">Phiên đang ở trạng thái {session.status}.</p>
                {project && <Can perm="sprints.manage"><AiPlanPanel autoPlanning={session.status === 'active'} sessionId={sessionId} projectId={project.id} onPublished={onChanged} deps={planDeps} /></Can>}
              </div>
            ) : (
              <div className="space-y-2">
                {assessment.ready ? (
                  <p role="status" className="text-sm font-medium text-emerald-700">Đội hình đã đủ điều kiện.</p>
                ) : assessment.missing.length > 0 ? (
                  <ul className="space-y-1 text-sm text-amber-700">
                    {assessment.missing.map((m) => (
                      <li key={m.roleCode}>Thiếu {m.need - m.have} {m.roleCode} (đang có {m.have}/{m.need}).</li>
                    ))}
                  </ul>
                ) : (
                  <p role="status" className="text-sm text-amber-700">Chưa có thành viên nào — hãy thêm sinh viên trước khi Start.</p>
                )}
                <Can perm="sessions.manage"><button
                  type="button"
                  disabled={startAction.busy}
                  className={buttonClass}
                  onClick={() => void startAction.run(() => transitionSession(sessionId, "active"))}
                >
                  {startAction.busy ? "Đang start..." : "Start Session"}
                </button></Can>
                {Boolean(startAction.error) && <ErrorState error={startAction.error} />}
                <p className="text-[11px] text-slate-400">Start chuyển phiên sang active, validate đội hình ở Backend rồi tự kích hoạt AI lập kế hoạch.</p>
              </div>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
