"use client";
import {
  instructorDate,
  instructorPlanStatus,
} from "@/components/instructor/instructor-ui";
import { priorityLabels } from "@/lib/api/work";
import { useCallback, useEffect, useRef, useState } from "react";
import { ErrorState } from "@/components/shared/data-state";
import { Empty, Panel, buttonClass } from "@/components/product/primitives";
import { useAction } from "@/components/product/use-action";
import { useResource } from "@/lib/api/use-resource";
import { PlanEditor } from "./plan-editor";
import {
  confirmPlan,
  generatePlan,
  getPlan,
  listPlans,
  type PlanDetail,
  type PlanSummary,
} from "@/lib/api/planning";

export interface PlanDeps {
  list: typeof listPlans;
  get: typeof getPlan;
  generate: typeof generatePlan;
  confirm: typeof confirmPlan;
}

/**
 * AI Plan workspace (M5): generation status with polling, draft review,
 * regenerate, confirm/publish. Confirm uses a stable requestId per plan so
 * retries never duplicate sprints/tasks.
 */
export function AiPlanPanel(props: Parameters<typeof AiPlanWorkspace>[0]) {
  return (
    <AiPlanWorkspace key={`${props.projectId}:${props.sessionId}`} {...props} />
  );
}

function AiPlanWorkspace({
  sessionId,
  projectId,
  onPublished,
  deps,
  autoPlanning = false,
}: {
  sessionId: string;
  projectId: string;
  onPublished?: () => void;
  deps?: Partial<PlanDeps>;
  autoPlanning?: boolean;
}) {
  const {
    list = listPlans,
    get = getPlan,
    generate = generatePlan,
    confirm = confirmPlan,
  } = deps ?? {};
  const [revision, setRevision] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmRequestId, setConfirmRequestId] = useState(() =>
    crypto.randomUUID(),
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [edited, setEdited] = useState<{
    planId: string;
    draft: NonNullable<PlanDetail["draft"]>;
  } | null>(null);
  const action = useAction();
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const plans = useResource(
    useCallback(
      (signal: AbortSignal) => list(sessionId, signal),
      [list, sessionId],
    ),
    revision,
  );
  const items: PlanSummary[] = plans.data ?? [];
  const generating = items.some((p) => p.status === "generating");
  useEffect(() => {
    if (!generating && !(autoPlanning && items.length === 0)) return;
    const t = setInterval(() => setRevision((r) => r + 1), 4000);
    return () => clearInterval(t);
  }, [generating, autoPlanning, items.length]);

  // Prefer the newest plan that actually carries a draft; publish bookkeeping
  // rows never own the view.
  const currentId =
    selectedId ??
    items.find((p) => p.hasDraft)?.planId ??
    items[0]?.planId ??
    null;
  const detail = useResource(
    useCallback(
      (signal: AbortSignal) =>
        currentId ? get(currentId, signal) : Promise.resolve(null),
      [get, currentId],
    ),
    revision,
  );
  const plan: PlanDetail | null = detail.data ?? null;

  async function regenerate() {
    setNotice(null);
    // useAction reports success only — capture the created plan through an
    // outer binding so the in-flight plan renders immediately.
    let created: { planId: string } | null = null;
    const ok = await action.run(async () => {
      created = await generate({
        projectId,
        sessionId,
        ...(plan?.status === "ready" ? { regenerate: true } : {}),
      });
    });
    if (mounted.current && ok && created) {
      const done: { planId: string } = created;
      setSelectedId(done.planId);
      setRevision((r) => r + 1);
      setConfirmRequestId(crypto.randomUUID());
    }
  }

  async function confirmDraft() {
    if (!plan?.draft) return;
    setNotice(null);
    const ok = await action.run(() =>
      confirm({
        projectId,
        sessionId,
        draft: edited?.planId === plan.planId ? edited.draft : plan.draft,
        requestId: confirmRequestId,
        planId: plan.planId,
      }),
    );
    if (mounted.current && ok) {
      setNotice("Đã publish Sprint/Task từ kế hoạch.");
      setRevision((r) => r + 1);
      onPublished?.();
    }
  }

  return (
    <Panel title="Kế hoạch AI">
      {plans.loading ? (
        <p role="status" className="p-2 text-sm text-slate-500">
          Đang tải kế hoạch...
        </p>
      ) : plans.error ? (
        <ErrorState error={plans.error} onRetry={plans.reload} />
      ) : items.length === 0 ? (
        <div className="space-y-3">
          <Empty>
            Chưa có kế hoạch AI cho phiên này. Nhấn Bắt đầu phiên để hệ thống tự
            lập kế hoạch.
          </Empty>
          {autoPlanning && (
            <>
              <p className="text-xs text-slate-500">
                Nếu quá trình tự động chưa bắt đầu, bạn có thể yêu cầu tạo kế
                hoạch. Backend sẽ dùng lại yêu cầu đang chạy.
              </p>
              <button
                className={buttonClass}
                disabled={action.busy}
                onClick={() => void regenerate()}
              >
                {action.busy ? "Đang yêu cầu…" : "Tạo kế hoạch AI"}
              </button>
            </>
          )}
          {Boolean(action.error) && <ErrorState error={action.error} />}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Chọn kế hoạch"
              className="min-w-0 max-w-full rounded border border-slate-200 px-2 py-1 text-xs"
              value={currentId ?? ""}
              onChange={(e) => setSelectedId(e.target.value || null)}
            >
              {items.map((p) => (
                <option key={p.planId} value={p.planId}>
                  {new Date(p.createdAt).toLocaleString("vi-VN")} ·{" "}
                  {instructorPlanStatus(p.status)} · {p.sprintCount} Sprint/
                  {p.taskCount} nhiệm vụ
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={
                action.busy || generating || plan?.status === "confirmed"
              }
              className="rounded border border-slate-200 px-2 py-1 text-xs"
              onClick={() => void regenerate()}
            >
              {action.busy ? "..." : "Tạo lại"}
            </button>
          </div>
          {generating && (
            <p role="status" className="text-xs text-blue-600">
              AI đang lập kế hoạch — tự làm mới...
            </p>
          )}
          {detail.loading ? (
            <p role="status" className="p-2 text-xs text-slate-500">
              Đang tải chi tiết...
            </p>
          ) : detail.error ? (
            <ErrorState error={detail.error} />
          ) : plan?.status === "failed" ? (
            <div role="alert" className="space-y-2 text-sm">
              <p className="text-rose-600">
                Tạo kế hoạch thất bại — không có gì được ghi. Hãy thử tạo lại.
              </p>
              <button
                type="button"
                disabled={action.busy}
                className={buttonClass}
                onClick={() => void regenerate()}
              >
                Thử lại
              </button>
            </div>
          ) : plan?.draft ? (
            <div className="space-y-3">
              {plan.status === "ready" && (
                <button
                  type="button"
                  disabled={action.busy}
                  className="text-sm font-semibold text-blue-600"
                  onClick={() =>
                    setEdited({
                      planId: plan.planId,
                      draft: structuredClone(plan.draft!),
                    })
                  }
                >
                  Chỉnh sửa bản nháp
                </button>
              )}
              {edited?.planId === plan.planId && plan.status === "ready" && (
                <PlanEditor
                  projectId={projectId}
                  draft={edited.draft}
                  disabled={action.busy}
                  onChange={(draft) =>
                    setEdited({ planId: plan.planId, draft })
                  }
                />
              )}
              {plan.warnings.length > 0 && (
                <ul className="space-y-1 rounded bg-amber-50 p-2 text-[11px] text-amber-700">
                  {plan.warnings.map((w, i) => (
                    <li key={i}>
                      {w.taskTitle}: {w.message}
                    </li>
                  ))}
                </ul>
              )}
              {plan.draft.sprints.map((s, i) => (
                <div
                  key={s.name + i}
                  className="rounded border border-slate-100 p-2"
                >
                  <p className="text-sm font-semibold">
                    {i + 1}. {s.name}
                  </p>
                  {s.goal && (
                    <p className="text-xs text-slate-500">
                      {s.goal} · {instructorDate(s.startDate)} →{" "}
                      {instructorDate(s.endDate)}
                    </p>
                  )}
                  <ul className="mt-1 space-y-1">
                    {s.tasks.map((t, j) => (
                      <li key={t.title + j} className="text-xs text-slate-600">
                        • {t.title}
                        {t.assigneeId ? "" : " (chưa gán)"} ·{" "}
                        {priorityLabels[
                          t.priority as keyof typeof priorityLabels
                        ] ?? t.priority}
                        {t.storyPoints !== null ? ` · ${t.storyPoints}pt` : ""}
                        {t.dueDate ? ` · hạn ${instructorDate(t.dueDate)}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {plan.status !== "confirmed" ? (
                <button
                  type="button"
                  disabled={action.busy}
                  className={buttonClass}
                  onClick={() => void confirmDraft()}
                >
                  {action.busy ? "Đang publish..." : "Xác nhận & publish"}
                </button>
              ) : (
                <p
                  role="status"
                  className="text-xs font-medium text-emerald-700"
                >
                  Kế hoạch đã được phát hành thành Sprint và nhiệm vụ.
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Kế hoạch chưa có bản nháp để xem.
            </p>
          )}
          {notice && (
            <p
              role="status"
              className="rounded bg-emerald-50 p-2 text-xs text-emerald-700"
            >
              {notice}
            </p>
          )}
          {Boolean(action.error) && <ErrorState error={action.error} />}
        </div>
      )}
    </Panel>
  );
}
