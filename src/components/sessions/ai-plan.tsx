"use client";
import { SessionSection as Panel } from "./session-section";
import {
  instructorDate,
  instructorPlanStatus,
} from "@/components/instructor/instructor-ui";
import { priorityLabels } from "@/lib/api/work";
import { useCallback, useEffect, useRef, useState } from "react";
import { ErrorState } from "@/components/shared/data-state";
import { Empty, buttonClass, inputClass } from "@/components/product/primitives";
import { useAction } from "@/components/product/use-action";
import { useResource } from "@/lib/api/use-resource";
import { PlanEditor } from "./plan-editor";
import {
  confirmPlan,
  draftSprintPlan,
  generatePlan,
  getPlan,
  listPlans,
  type PlanDetail,
  type PlanSummary,
  type SprintPlan,
} from "@/lib/api/planning";

export interface PlanDeps {
  list: typeof listPlans;
  get: typeof getPlan;
  generate: typeof generatePlan;
  confirm: typeof confirmPlan;
  draft?: typeof draftSprintPlan;
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
    draft = draftSprintPlan,
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
  const [preview, setPreview] = useState<{
    draft: SprintPlan;
    warnings: Array<{ taskTitle: string; message: string }>;
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
    // useAction reports success only , capture the created plan through an
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

  /** Draft preview: nothing persisted server-side; user reviews then confirms. */
  async function previewDraft() {
    setNotice(null);
    let created: Awaited<ReturnType<typeof draft>> | null = null;
    const ok = await action.run(async () => {
      created = await draft({ projectId, sessionId });
    });
    if (mounted.current && ok && created) {
      const done: Awaited<ReturnType<typeof draft>> = created;
      setPreview({ draft: done.draft, warnings: done.warnings });
    }
  }

  return (
    <Panel title="Kế hoạch AI">
      {plans.loading ? (
        <p role="status" className="p-2 text-body text-muted-foreground">
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
              <p className="text-caption text-muted-foreground">
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
              className={inputClass}
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
              className="min-h-10 rounded-control border border-input bg-card px-3 py-2 text-small hover:bg-accent disabled:opacity-50"
              onClick={() => void regenerate()}
            >
              {action.busy ? "..." : "Tạo lại"}
            </button>
            <button
              type="button"
              disabled={action.busy || generating || plan?.status === "confirmed"}
              className="min-h-10 rounded-control border border-input bg-card px-3 py-2 text-small hover:bg-accent disabled:opacity-50"
              onClick={() => void previewDraft()}
            >
              {action.busy ? "..." : "Xem bản nháp"}
            </button>
          </div>
          {generating && (
            <p role="status" className="text-caption text-primary">
              AI đang lập kế hoạch , tự làm mới...
            </p>
          )}
          {detail.loading ? (
            <p role="status" className="p-2 text-caption text-muted-foreground">
              Đang tải chi tiết...
            </p>
          ) : detail.error ? (
            <ErrorState error={detail.error} />
          ) : plan?.status === "failed" ? (
            <div role="alert" className="space-y-2 text-body">
              <p className="text-destructive">
                Tạo kế hoạch thất bại , không có gì được ghi. Hãy thử tạo lại.
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
                  className="text-body font-semibold text-primary"
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
                plan.status === "confirmed" ? (
                  <details className="text-caption text-muted-foreground">
                    <summary className="cursor-pointer py-2 font-medium">Đối chiếu điều kiện hiện tại</summary>
                    <p className="mb-2 max-w-prose leading-6">Thông tin tham khảo theo đội hình hiện tại, không làm thay đổi kế hoạch đã phát hành. Sinh viên đã hoàn tất phân công có thể không còn trong đội hình đang hoạt động.</p>
                    <ul className="space-y-1 border-l-2 border-border pl-3">
                      {plan.warnings.map((w, i) => <li key={i}>{w.taskTitle}: {w.message}</li>)}
                    </ul>
                  </details>
                ) : (
                  <ul className="space-y-1 rounded bg-warning-subtle p-2 text-caption text-warning">
                    {plan.warnings.map((w, i) => <li key={i}>{w.taskTitle}: {w.message}</li>)}
                  </ul>
                )
              )}
              {plan.draft.sprints.map((s, i) => (
                <div
                  key={s.name + i}
                  className="border-b border-border py-4"
                >
                  <p className="text-body font-semibold">
                    {i + 1}. {s.name}
                  </p>
                  {s.goal && (
                    <p className="text-caption text-muted-foreground">
                      {s.goal} · {instructorDate(s.startDate)} →{" "}
                      {instructorDate(s.endDate)}
                    </p>
                  )}
                  <ul className="mt-1 space-y-1">
                    {s.tasks.map((t, j) => (
                      <li key={t.title + j} className="text-caption text-muted-foreground">
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
                  className="text-caption font-medium text-success"
                >
                  Kế hoạch đã được phát hành thành Sprint và nhiệm vụ.
                </p>
              )}
            </div>
          ) : (
            <p className="text-caption text-muted-foreground">
              Kế hoạch chưa có bản nháp để xem.
            </p>
          )}
          {notice && (
            <p
              role="status"
              className="rounded bg-success-subtle p-2 text-caption text-success"
            >
              {notice}
            </p>
          )}
          {Boolean(action.error) && <ErrorState error={action.error} />}
          <SprintPlanPreview preview={preview} />
        </div>
      )}
    </Panel>
  );
}

/** "Xem bản nháp" result: proposed plan + warnings, confirm happens on the draft flow above. */
function SprintPlanPreview({
  preview,
}: {
  preview: {
    draft: SprintPlan;
    warnings: Array<{ taskTitle: string; message: string }>;
  } | null;
}) {
  if (!preview) return null;
  return (
    <div className="space-y-2 rounded-control border border-border bg-card p-3">
      <p className="text-body font-semibold">Bản nháp chưa lưu</p>
      <p className="text-caption text-muted-foreground">
        Bản nháp chỉ để xem trước — chưa ghi vào hệ thống. Chọn “Tạo lại” hoặc
        lưu một kế hoạch trước khi publish.
      </p>
      {preview.warnings.length > 0 && (
        <ul className="space-y-1 rounded bg-warning-subtle p-2 text-caption text-warning">
          {preview.warnings.map((w, i) => (
            <li key={i}>
              {w.taskTitle}: {w.message}
            </li>
          ))}
        </ul>
      )}
      {preview.draft.sprints.map((s, i) => (
        <div key={s.name + i} className="border-b border-border py-2">
          <p className="text-body font-semibold">
            {i + 1}. {s.name}
          </p>
          {s.goal && (
            <p className="text-caption text-muted-foreground">
              {s.goal} · {instructorDate(s.startDate)} →{" "}
              {instructorDate(s.endDate)}
            </p>
          )}
          <ul className="mt-1 space-y-1">
            {s.tasks.map((t, j) => (
              <li
                key={t.title + j}
                className="text-caption text-muted-foreground"
              >
                • {t.title}
                {t.assigneeId ? "" : " (chưa gán)"} ·{" "}
                {priorityLabels[t.priority as keyof typeof priorityLabels] ??
                  t.priority}
                {t.storyPoints !== null ? ` · ${t.storyPoints}pt` : ""}
                {t.dueDate ? ` · hạn ${instructorDate(t.dueDate)}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
