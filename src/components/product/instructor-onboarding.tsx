"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Rocket } from "lucide-react";
import { listAcademic } from "@/lib/api/academic";
import { useResource } from "@/lib/api/use-resource";
import { errorMessage } from "@/lib/auth/api-client";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { buttonClass, Panel } from "./primitives";
import {
  activateAcademic,
  canActivate,
  deriveChecklist,
  type ActivatableKind,
  type ChecklistInput,
  type ChecklistStep,
} from "@/lib/api/instructor-setup";

export function ActivateButton({
  kind,
  id,
  status,
  onChanged,
  deps,
}: {
  kind: ActivatableKind;
  id: string;
  status: string;
  onChanged: () => void;
  deps?: { patch: (kind: ActivatableKind, id: string, body: { status: string }) => Promise<{ status: string }>; transition?: (id: string, status: string) => Promise<{ status: string }> };
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  if (!canActivate(kind, status)) return null;
  async function run() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await activateAcademic(kind, id, deps);
      onChanged();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => void run()}
        className="rounded border border-success bg-success-subtle px-3 py-1 text-caption font-semibold text-success hover:bg-success-subtle disabled:opacity-50"
      >
        {busy ? "Đang kích hoạt…" : "Kích hoạt"}
      </button>
      {Boolean(error) && <span role="alert" className="text-caption text-destructive">{errorMessage(error)}</span>}
    </span>
  );
}

export function OnboardingChecklist({
  steps,
  onSetup,
}: {
  steps: ChecklistStep[];
  onSetup?: () => void;
}) {
  const complete = steps.length > 0 && steps.every((s) => s.done);
  if (complete) {
    return (
      <p role="status" className="rounded-control bg-success-subtle p-3 text-body text-success">
        Đã hoàn tất thiết lập đợt thực tập. Chúc giảng viên một học kỳ hiệu quả.
      </p>
    );
  }
  return (
    <div className="space-y-4">
      <ol className="space-y-2">
        {steps.map((s, i) => (
          <li
            key={s.key}
            data-done={s.done}
            className="flex items-start gap-3 rounded-md border border-primary p-2.5"
          >
            {s.done ? (
              <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-success" aria-label="Hoàn thành" />
            ) : (
              <Circle size={19} className="mt-0.5 shrink-0 text-muted-foreground" aria-label={`Bước ${i + 1}`} />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-body font-semibold text-foreground">
                <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                {s.label}
              </p>
              <p className="mt-0.5 text-caption text-muted-foreground">{s.hint}</p>
            </div>
            {!s.done && (
              <Link href={s.href} className="shrink-0 text-caption font-semibold text-primary hover:underline">
                Thực hiện
              </Link>
            )}
          </li>
        ))}
      </ol>
      {onSetup && (
        <button className={buttonClass} onClick={onSetup}>
          <Rocket size={16} /> Khởi tạo đợt thực tập
        </button>
      )}
    </div>
  );
}

export function InstructorSetupPanel({
  input,
  onSetup,
}: {
  input: Omit<ChecklistInput, "projectsTotal" | "projectsActive">;
  onSetup?: () => void;
}) {
  const projects = useResource(
    useCallback(async (signal: AbortSignal) => {
      const [total, active] = await Promise.all([
        listAcademic("projects", 1, "", "", signal),
        listAcademic("projects", 1, "", "active", signal),
      ]);
      return { total: total.total, active: active.total };
    }, []),
  );
  if (projects.loading) return <LoadingState />;
  if (projects.error) return <ErrorState error={projects.error} onRetry={projects.reload} />;
  if (!projects.data) return null;
  const steps = deriveChecklist({
    ...input,
    projectsTotal: projects.data.total,
    projectsActive: projects.data.active,
  });
  const complete = steps.every((s) => s.done);
  return (
    <Panel title="Bắt đầu" action={onSetup && !complete ? <button className="text-caption text-primary" onClick={onSetup}>Mở wizard</button> : undefined}>
      <OnboardingChecklist steps={steps} onSetup={complete ? undefined : onSetup} />
    </Panel>
  );
}
