"use client";

import * as React from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Circle,
  FolderKanban,
  ListChecks,
  Loader2,
  Plus,
  Rocket,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  candidateApi,
  planApi,
  sessionApi,
  templateApi,
  type Assignment,
  type PlanDetail,
  type ProjectBlueprint,
  type TemplateSummary,
} from "@/lib/client/api";
import { useResource } from "@/lib/client/use-resource";
import { formatDate, roleLabels } from "@/lib/client/labels";
import { navigate } from "@/lib/client/router";
import {
  Panel,
  PanelHeader,
  Empty,
  ToneBadge,
  KeyValue,
  UserAvatar,
} from "@/components/shared/primitives";
import { RoleBadge } from "@/components/shared/badges";
import { LoadingBlock, ErrorBlock, InlineSpinner } from "@/components/shared/states";
import { SearchInput, FilterSelect } from "@/components/shared/toolbar";
import { ConfirmDialog } from "@/components/shared/confirm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

/* ==================== Stepper ngang ==================== */

const WIZARD_STEPS = [
  { n: 1, label: "Dự án", icon: FolderKanban },
  { n: 2, label: "Đội hình", icon: Users },
  { n: 3, label: "Kế hoạch AI", icon: Sparkles },
] as const;

function SetupStepper({
  step,
  reached,
  onGo,
}: {
  step: number;
  reached: number;
  onGo: (step: number) => void;
}) {
  return (
    <ol className="flex w-full items-center gap-2 overflow-x-auto px-5 py-4">
      {WIZARD_STEPS.map((s, i) => {
        const done = step > s.n;
        const active = step === s.n;
        const reachable = reached >= s.n;
        const Icon = s.icon;
        return (
          <React.Fragment key={s.n}>
            {i > 0 ? (
              <span aria-hidden className={`h-px min-w-8 flex-1 ${step > s.n - 1 ? "bg-brand/50" : "bg-line"}`} />
            ) : null}
            <li>
              <button
                type="button"
                disabled={!reachable}
                onClick={() => reachable && onGo(s.n)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-all ${
                  active
                    ? "border-brand/40 bg-brand/10"
                    : done
                      ? "border-line bg-deep/60 hover:border-line-strong"
                      : "border-line bg-deep/40"
                } ${reachable ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
              >
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-full border text-[11px] font-bold transition-colors ${
                    done
                      ? "border-brand bg-brand text-on-brand"
                      : active
                        ? "border-brand bg-brand/15 text-brand-bright"
                        : "border-line bg-panel-2 text-faint"
                  }`}
                >
                  {done ? <CheckCircle2 className="size-4 icon" /> : s.n}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold">
                  <Icon className={`size-3.5 icon ${active ? "text-brand-bright" : "text-faint"}`} />
                  <span className={active ? "text-brand-bright" : done ? "text-ink" : "text-faint"}>{s.label}</span>
                </span>
              </button>
            </li>
          </React.Fragment>
        );
      })}
    </ol>
  );
}

/* ==================== View chính ==================== */

/**
 * Wizard khởi tạo buổi thực tập 3 bước: Dự án → Đội hình → Kế hoạch AI.
 * Standalone section — main nhúng vào session-detail (tab "Thành viên" hoặc "Kế hoạch AI").
 */
export function SessionSetupWizard({ sessionId, onDone }: { sessionId: string; onDone?: () => void }) {
  const [step, setStep] = React.useState(1);

  const session = useResource(() => sessionApi.detail(sessionId), [sessionId]);
  const assignments = useResource(() => candidateApi.assignments(sessionId), [sessionId]);
  const blueprint = useResource(() => loadBlueprintForSession(sessionId), [sessionId]);

  const reloadAll = React.useCallback(() => {
    session.reload();
    assignments.reload();
    onDone?.();
  }, [session, assignments, onDone]);

  const data = session.data;
  const activeAssignments = (assignments.data?.data ?? []).filter((a) => a.status === "active");

  /* Đội hình theo role: requiredCount từ blueprint (countMin), fallback 1 */
  const slots = React.useMemo(() => {
    const roleDetails = blueprint.data?.roleDetails ?? null;
    const map = new Map<string, { role: string; required: number; max: number; members: Assignment[] }>();
    const ensure = (role: string, required: number, max: number) => {
      if (!map.has(role)) map.set(role, { role, required, max, members: [] });
      return map.get(role)!;
    };
    if (roleDetails) {
      roleDetails.forEach((r) => ensure(r.code, r.countMin, r.countMax));
    }
    activeAssignments.forEach((a) => {
      const slot = ensure(a.role, 1, 2);
      slot.members.push(a);
    });
    return Array.from(map.values()).sort((a, b) => a.role.localeCompare(b.role));
  }, [activeAssignments, blueprint.data]);

  const missingSlots = slots.filter((s) => s.members.length < s.required);
  const hasProject = Boolean(data?.project);
  const planStatus = data?.plan.status ?? "none";
  const reached = hasProject ? (missingSlots.length === 0 ? 3 : 2) : 1;

  if (session.loading && !data) {
    return (
      <Panel>
        <LoadingBlock rows={5} />
      </Panel>
    );
  }
  if (session.error || !data) {
    return (
      <Panel>
        <ErrorBlock error={session.error ?? new Error("Không tải được buổi thực tập")} onRetry={session.reload} />
      </Panel>
    );
  }

  return (
    <Panel className="overflow-hidden">
      <PanelHeader
        title="Khởi tạo buổi thực tập"
        description="Ba bước: chọn dự án mẫu → xếp đội hình theo vai trò → sinh kế hoạch AI và khởi động phiên."
        icon={<Rocket className="size-4 icon" />}
        actions={
          data.status === "planning" ? (
            <ToneBadge tone="amber" dot>
              Đang chuẩn bị
            </ToneBadge>
          ) : (
            <ToneBadge tone="emerald" dot>
              {data.status === "active" ? "Đã khởi động" : data.status === "completed" ? "Đã kết thúc" : "Đã hủy"}
            </ToneBadge>
          )
        }
      />
      <div className="border-b border-line bg-deep/40">
        <SetupStepper step={step} reached={reached} onGo={setStep} />
      </div>

      <div className="p-5">
        {step === 1 ? (
          <StepProject session={data} onChanged={reloadAll} onNext={() => setStep(2)} />
        ) : null}
        {step === 2 ? (
          <StepTeam
            sessionId={sessionId}
            slots={slots}
            missingCount={missingSlots.length}
            loading={assignments.loading || blueprint.loading}
            onChanged={reloadAll}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        ) : null}
        {step === 3 ? (
          <StepPlan
            sessionId={sessionId}
            planStatus={planStatus}
            planId={data.plan.planId}
            memberCount={activeAssignments.length}
            onChanged={reloadAll}
            onBack={() => setStep(2)}
          />
        ) : null}
      </div>
    </Panel>
  );
}

/* ==================== Bước 1: Dự án ==================== */

interface SessionLike {
  id: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  project: { id: string; code: string; name: string; description?: string; techStack?: string[] } | null;
}

function StepProject({
  session,
  onChanged,
  onNext,
}: {
  session: SessionLike;
  onChanged: () => void;
  onNext: () => void;
}) {
  const [picking, setPicking] = React.useState(false);

  return (
    <div className="space-y-5">
      {session.project ? (
        <>
          <div className="rounded-xl border border-line bg-deep/60 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                  <FolderKanban className="size-4 icon text-brand-bright" />
                  {session.project.name}
                  <span className="font-mono text-[10px] text-brand-bright/80">{session.project.code}</span>
                </p>
                {session.project.description ? (
                  <p className="mt-1 line-clamp-2 max-w-xl text-xs leading-relaxed text-dim">{session.project.description}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(session.project.techStack ?? []).map((t) => (
                    <ToneBadge key={t} tone="teal">
                      {t}
                    </ToneBadge>
                  ))}
                </div>
              </div>
              <ToneBadge tone="emerald" dot>
                Đã chọn
              </ToneBadge>
            </div>
            <div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
              <KeyValue label="Thời gian bắt đầu">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 icon text-faint" />
                  {formatDate(session.startDate)}
                </span>
              </KeyValue>
              <KeyValue label="Thời gian kết thúc">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 icon text-faint" />
                  {formatDate(session.endDate)}
                </span>
              </KeyValue>
            </div>
          </div>
          {!picking ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] leading-relaxed text-faint">
                Muốn dùng dự án khác? Thao tác này sẽ khởi tạo một buổi thực tập mới từ mẫu bạn chọn.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
                  onClick={() => setPicking(true)}
                >
                  <FolderKanban className="icon" /> Đổi dự án
                </Button>
                <Button className="rounded-lg bg-brand font-semibold text-on-brand hover:bg-brand-bright" onClick={onNext}>
                  Tiếp tục đội hình <ArrowRight className="icon" />
                </Button>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="rounded-xl border border-amber/30 bg-amber/[0.05] px-4 py-3 text-xs leading-relaxed text-dim">
          Phiên này chưa gắn dự án. Chọn một dự án mẫu bên dưới — hệ thống sẽ khởi tạo buổi thực tập mới từ mẫu đó và
          chuyển bạn sang phiên mới để tiếp tục thiết lập.
        </div>
      )}

      {picking || !session.project ? <TemplatePicker session={session} onChanged={onChanged} /> : null}
    </div>
  );
}

function TemplatePicker({ session, onChanged }: { session: SessionLike; onChanged: () => void }) {
  const templates = useResource(() => templateApi.list({ page: 1, pageSize: 12, status: "active" }), []);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [startDate, setStartDate] = React.useState(session.startDate.slice(0, 10));
  const [endDate, setEndDate] = React.useState(session.endDate.slice(0, 10));
  const [submitting, setSubmitting] = React.useState(false);

  const items = templates.data?.data ?? [];

  const handleApply = () => {
    if (!selected) {
      toast.error("Vui lòng chọn một dự án mẫu");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Vui lòng chọn thời gian bắt đầu và kết thúc");
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      toast.error("Thời gian kết thúc phải sau thời gian bắt đầu");
      return;
    }
    setSubmitting(true);
    templateApi
      .start(selected, {
        name: session.name,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      })
      .then((res) => {
        toast.success(
          `Đã khởi tạo buổi thực tập ${res.sessionCode} từ dự án mẫu — chuyển sang phiên mới để tiếp tục thiết lập`
        );
        onChanged();
        navigate(`/instructor/sessions/${res.sessionId}`);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Không khởi tạo được phiên từ mẫu"))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="space-y-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">Dự án mẫu có sẵn</p>
      {templates.loading ? (
        <LoadingBlock variant="cards" rows={3} />
      ) : templates.error ? (
        <ErrorBlock error={templates.error} onRetry={templates.reload} />
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-line bg-deep/60 px-4 py-3 text-xs text-dim">
          Chưa có dự án mẫu nào đang hoạt động.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              selected={selected === t.id}
              onSelect={() => setSelected(t.id)}
            />
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="wizard-start" className="text-xs font-medium text-dim">
            Bắt đầu <span className="text-rose">*</span>
          </Label>
          <Input
            id="wizard-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-10 rounded-lg border-line bg-deep text-sm text-ink focus-visible:ring-brand/30"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wizard-end" className="text-xs font-medium text-dim">
            Kết thúc <span className="text-rose">*</span>
          </Label>
          <Input
            id="wizard-end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-10 rounded-lg border-line bg-deep text-sm text-ink focus-visible:ring-brand/30"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          className="rounded-lg bg-brand font-semibold text-on-brand hover:bg-brand-bright"
          disabled={!selected || submitting}
          onClick={handleApply}
        >
          {submitting ? <InlineSpinner /> : <Rocket className="icon" />}
          {session.project ? "Khởi tạo phiên mới từ mẫu" : "Khởi tạo từ mẫu"}
        </Button>
      </div>
    </div>
  );
}

function TemplateCard({
  template,
  selected,
  onSelect,
}: {
  template: TemplateSummary;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex h-full flex-col rounded-xl border p-4 text-left transition-all ${
        selected
          ? "border-brand/50 bg-brand/[0.07] shadow-[0_0_0_1px_rgba(16,185,129,0.25)]"
          : "border-line bg-deep/60 hover:border-line-strong"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-mono text-[10px] font-semibold tracking-wider text-brand-bright/80">{template.code}</div>
          <p className="mt-0.5 line-clamp-1 text-[13px] font-semibold text-ink">{template.name}</p>
        </div>
        {selected ? <CheckCircle2 className="size-4 shrink-0 icon text-brand-bright" /> : <Circle className="size-4 shrink-0 icon text-faint" />}
      </div>
      <p className="mt-1.5 line-clamp-2 flex-1 text-[11px] leading-relaxed text-dim">{template.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <ToneBadge tone="teal">{template.sprintCount} sprint</ToneBadge>
        <ToneBadge tone="zinc">
          {template.teamSize.min}–{template.teamSize.max} người
        </ToneBadge>
        <ToneBadge tone="brand">{template.roles.length} vai trò</ToneBadge>
      </div>
    </button>
  );
}

/* ==================== Bước 2: Đội hình ==================== */

interface TeamSlot {
  role: string;
  required: number;
  max: number;
  members: Assignment[];
}

function StepTeam({
  sessionId,
  slots,
  missingCount,
  loading,
  onChanged,
  onBack,
  onNext,
}: {
  sessionId: string;
  slots: TeamSlot[];
  missingCount: number;
  loading: boolean;
  onChanged: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [addingRole, setAddingRole] = React.useState<string | null>(null);
  const [removing, setRemoving] = React.useState<Assignment | null>(null);
  const [busy, setBusy] = React.useState(false);

  const handleRemove = () => {
    if (!removing) return;
    setBusy(true);
    candidateApi
      .cancelAssignment(removing.id)
      .then(() => {
        toast.success(`Đã gỡ ${removing.internName} khỏi đội hình (phân công chuyển sang đã hủy)`);
        setRemoving(null);
        onChanged();
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Không gỡ được phân công"))
      .finally(() => setBusy(false));
  };

  if (loading) {
    return <LoadingBlock rows={5} />;
  }

  if (slots.length === 0) {
    return (
      <Empty
        icon={<Users />}
        title="Chưa có thông tin đội hình"
        description="Không xác định được vai trò yêu cầu — thêm thành viên ở tab Thành viên rồi quay lại."
      />
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-[11px] leading-relaxed text-dim">
        Số lượng tối thiểu theo thiết kế dự án mẫu. Vai trò thiếu người sẽ chặn bước kế hoạch AI — đảm bảo mọi vai trò
        (trừ vai trò tùy chọn) đạt đủ người.
      </p>

      <div className="grid gap-3 lg:grid-cols-2">
        {slots.map((slot) => {
          const filled = slot.members.length;
          const enough = filled >= slot.required;
          return (
            <div key={slot.role} className="rounded-xl border border-line bg-deep/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <RoleBadge role={slot.role} />
                  <span className="text-[13px] font-semibold text-ink">{roleLabels[slot.role] ?? slot.role}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] text-dim">
                    {filled}/{slot.required}
                    {slot.max > slot.required ? ` (tối đa ${slot.max})` : ""}
                  </span>
                  {slot.required === 0 ? (
                    <ToneBadge tone="zinc">Tùy chọn</ToneBadge>
                  ) : enough ? (
                    <ToneBadge tone="emerald" dot>
                      Đủ
                    </ToneBadge>
                  ) : (
                    <ToneBadge tone="rose" dot>
                      Còn thiếu
                    </ToneBadge>
                  )}
                </div>
              </div>

              {slot.members.length === 0 ? (
                <p className="mt-3 rounded-lg border border-dashed border-line px-3 py-2.5 text-xs text-faint">
                  Chưa có thành viên nào cho vai trò này.
                </p>
              ) : (
                <ul className="mt-3 space-y-1.5">
                  {slot.members.map((m) => (
                    <li key={m.id} className="group flex items-center gap-2.5 rounded-lg border border-line bg-panel px-3 py-2">
                      <UserAvatar name={m.internName} size={28} />
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-ink">{m.internName}</span>
                      <span className="shrink-0 text-[10px] text-faint">{formatDate(m.assignedAt)}</span>
                      <button
                        type="button"
                        aria-label={`Gỡ ${m.internName}`}
                        onClick={() => setRemoving(m)}
                        className="grid size-7 shrink-0 place-items-center rounded-lg text-faint opacity-0 transition-all hover:bg-rose/10 hover:text-rose group-hover:opacity-100 focus-visible:opacity-100"
                      >
                        <Trash2 className="size-3.5 icon" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <Button
                size="sm"
                variant="outline"
                className="mt-3 h-8 w-full rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
                onClick={() => setAddingRole(slot.role)}
              >
                <UserPlus className="size-3.5 icon" /> Thêm thành viên {roleLabels[slot.role] ?? slot.role}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <div>
          {missingCount > 0 ? (
            <p className="text-xs text-amber">
              Còn {missingCount} vai trò thiếu người — bổ sung trước khi sinh kế hoạch AI.
            </p>
          ) : (
            <p className="text-xs text-brand-bright">Đội hình đã đủ theo yêu cầu của dự án mẫu.</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
            onClick={onBack}
          >
            <ArrowLeft className="icon" /> Quay lại
          </Button>
          <Button
            className="rounded-lg bg-brand font-semibold text-on-brand hover:bg-brand-bright"
            disabled={missingCount > 0}
            onClick={onNext}
          >
            Tiếp tục kế hoạch AI <ArrowRight className="icon" />
          </Button>
        </div>
      </div>

      {/* Dialog thêm thành viên */}
      {addingRole ? (
        <AddMemberDialog
          sessionId={sessionId}
          role={addingRole}
          onClose={() => setAddingRole(null)}
          onAdded={() => {
            setAddingRole(null);
            onChanged();
          }}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => {
          if (!busy && !open) setRemoving(null);
        }}
        title={`Gỡ ${removing?.internName ?? ""} khỏi đội hình?`}
        description="Phân công chuyển sang đã hủy. Nhiệm vụ đang gán cho sinh viên này KHÔNG tự chuyển — dùng wizard thay thành viên ở trang kỷ luật phiên nếu cần bàn giao."
        confirmLabel="Gỡ khỏi đội hình"
        destructive
        busy={busy}
        onConfirm={handleRemove}
      />
    </div>
  );
}

function AddMemberDialog({
  sessionId,
  role,
  onClose,
  onAdded,
}: {
  sessionId: string;
  role: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [q, setQ] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState(role);
  const [adding, setAdding] = React.useState<string | null>(null);

  const candidates = useResource(
    () =>
      candidateApi.list({
        page: 1,
        pageSize: 20,
        search: q || undefined,
        role: roleFilter || undefined,
        status: "passed",
      }),
    [q, roleFilter]
  );

  const rows = candidates.data?.data ?? [];
  const eligible = rows.filter((c) => !c.hasActiveAssignment);

  const handleAdd = (userId: string, displayName: string, chosenRole: string | null) => {
    const useRole = chosenRole ?? roleFilter ?? role;
    if (!useRole) {
      toast.error("Ứng viên này chưa chọn vai trò — không tạo được phân công");
      return;
    }
    setAdding(userId);
    sessionApi
      .addMember(sessionId, userId, useRole)
      .then(() => {
        toast.success(`Đã thêm ${displayName} vào buổi thực tập với vai trò ${roleLabels[useRole] ?? useRole}`);
        onAdded();
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Không thêm được thành viên";
        toast.error(message.includes("ASSIGNMENT") ? "Sinh viên này đã có phân công đang hoạt động" : message);
      })
      .finally(() => setAdding(null));
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl border-line bg-panel p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-line px-6 pt-6">
          <DialogTitle className="text-left text-base font-semibold text-ink">
            Thêm thành viên — {roleLabels[roleFilter || role] ?? role}
          </DialogTitle>
          <DialogDescription className="text-left text-xs leading-relaxed text-dim">
            Ứng viên đã trúng tuyển phỏng vấn AI và chưa có phân công đang hoạt động.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 px-6 py-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <SearchInput value={q} onChange={setQ} placeholder="Tìm theo tên, email…" className="w-full sm:flex-1" />
            <FilterSelect
              value={roleFilter}
              onChange={setRoleFilter}
              options={[
                { value: "frontend", label: "Frontend" },
                { value: "backend", label: "Backend" },
                { value: "fullstack", label: "Full-stack" },
                { value: "qa", label: "QA / Tester" },
                { value: "business_analyst", label: "Business Analyst" },
              ]}
              placeholder="Vai trò"
              className="w-40"
              ariaLabel="Lọc ứng viên theo vai trò"
            />
          </div>

          {candidates.loading ? (
            <LoadingBlock rows={4} />
          ) : candidates.error ? (
            <ErrorBlock error={candidates.error} onRetry={candidates.reload} />
          ) : eligible.length === 0 ? (
            <Empty
              icon={<UserPlus />}
              title="Không có ứng viên phù hợp"
              description="Không còn ứng viên trúng tuyển nào khớp vai trò này và chưa có phân công. Thử đổi vai trò hoặc xóa tìm kiếm."
            />
          ) : (
            <ul className="max-h-[46vh] divide-y divide-line overflow-y-auto rounded-xl border border-line">
              {eligible.map((c) => (
                <li key={c.userId} className="flex items-center gap-3 px-4 py-3">
                  <UserAvatar name={c.displayName} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{c.displayName}</p>
                    <p className="truncate text-[11px] text-faint">{c.email}</p>
                  </div>
                  {c.selectedRole ? <RoleBadge role={c.selectedRole} /> : null}
                  {c.result ? (
                    <span className="shrink-0 font-mono text-[11px] font-semibold text-dim">{c.result.overallScore}đ</span>
                  ) : null}
                  <Button
                    size="sm"
                    className="h-8 shrink-0 rounded-lg bg-brand px-3 text-xs font-semibold text-on-brand hover:bg-brand-bright"
                    disabled={adding === c.userId}
                    onClick={() => handleAdd(c.userId, c.displayName, c.selectedRole)}
                  >
                    {adding === c.userId ? <InlineSpinner /> : <Plus className="icon" />}
                    Thêm
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <DialogFooter className="border-t border-line bg-deep/40 px-6 py-4">
          <Button
            variant="outline"
            className="rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
            onClick={onClose}
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ==================== Bước 3: Kế hoạch AI & khởi động ==================== */

function StepPlan({
  sessionId,
  planStatus,
  planId,
  memberCount,
  onChanged,
  onBack,
}: {
  sessionId: string;
  planStatus: "none" | "generating" | "draft" | "published";
  planId: string | null;
  memberCount: number;
  onChanged: () => void;
  onBack: () => void;
}) {
  const [status, setStatus] = React.useState(planStatus);
  const [currentPlanId, setCurrentPlanId] = React.useState(planId);
  const [generating, setGenerating] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [tick, setTick] = React.useState(0);

  // Đồng bộ khi cha reload session
  React.useEffect(() => {
    setStatus(planStatus);
    setCurrentPlanId(planId);
  }, [planStatus, planId]);

  const plan = useResource(
    () => (currentPlanId ? planApi.detail(currentPlanId) : Promise.resolve(null)),
    [currentPlanId, tick]
  );

  // Poll khi đang sinh kế hoạch
  React.useEffect(() => {
    if (status !== "generating") return;
    const t = setInterval(() => {
      setTick((n) => n + 1);
      planApi
        .list(sessionId)
        .then((res) => {
          const latest = res.data[0];
          if (latest && latest.status !== "generating") {
            setStatus(latest.status === "published" ? "published" : "draft");
            setCurrentPlanId(latest.planId);
            if (latest.status === "draft") {
              toast.success("Kế hoạch AI đã sẵn sàng — kiểm tra bản nháp trước khi công bố");
            }
          }
        })
        .catch(() => undefined);
    }, 3000);
    return () => clearInterval(t);
  }, [status, sessionId]);

  const handleGenerate = () => {
    setGenerating(true);
    planApi
      .generate(sessionId)
      .then((res) => {
        setStatus("generating");
        setCurrentPlanId(res.planId);
        toast.success("Đã gửi yêu cầu — AI đang sinh kế hoạch sprint");
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Không sinh được kế hoạch"))
      .finally(() => setGenerating(false));
  };

  const handlePublish = () => {
    if (!currentPlanId) return;
    setPublishing(true);
    planApi
      .confirm(currentPlanId)
      .then((res) => {
        setStatus("published");
        toast.success(
          `Đã công bố kế hoạch và khởi động phiên — ${res.sprintCount} sprint, ${res.taskCount} nhiệm vụ được tạo`
        );
        setConfirmOpen(false);
        onChanged();
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Không công bố được kế hoạch"))
      .finally(() => setPublishing(false));
  };

  /* --- đang sinh --- */
  if (status === "generating") {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <span className="grid size-16 place-items-center rounded-2xl bg-brand/10 text-brand-bright">
          <Loader2 className="size-7 animate-spin icon" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">AI đang sinh kế hoạch sprint…</p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-dim">
            Phân tích blueprint dự án, đề xuất sprint và nhiệm vụ kèm phụ thuộc. Vài giây nữa trang tự cập nhật.
          </p>
        </div>
      </div>
    );
  }

  /* --- chưa có kế hoạch --- */
  if (status === "none") {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-brand/10 text-brand-bright">
          <Sparkles className="size-6 icon" />
        </span>
        <div className="max-w-md">
          <h3 className="text-base font-semibold text-ink">Sinh kế hoạch sprint bằng AI</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-dim">
            AI đề xuất {`${memberCount > 0 ? "phân bổ nhiệm vụ theo " + memberCount + " thành viên, " : ""}`}sprint kèm
            phụ thuộc và cột mốc. Bạn xem bản nháp rồi công bố để khởi động phiên.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
            onClick={onBack}
          >
            <ArrowLeft className="icon" /> Quay lại
          </Button>
          <Button className="glow-brand rounded-lg" disabled={generating} onClick={handleGenerate}>
            {generating ? <InlineSpinner /> : <Sparkles className="icon" />}
            Sinh kế hoạch AI
          </Button>
        </div>
      </div>
    );
  }

  /* --- đã công bố --- */
  if (status === "published") {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <span className="grid size-16 place-items-center rounded-2xl bg-brand/10 text-brand-bright">
          <CheckCircle2 className="size-8 icon" />
        </span>
        <div>
          <h3 className="text-base font-semibold text-ink">Phiên đã khởi động</h3>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-dim">
            Kế hoạch đã được công bố: sprint và nhiệm vụ được tạo tự động. Theo dõi tiến độ trong Không gian sprint.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
            onClick={onBack}
          >
            <ArrowLeft className="icon" /> Quay lại
          </Button>
          <Button className="rounded-lg bg-brand text-on-brand hover:bg-brand-bright" onClick={() => navigate("/instructor/sprints")}>
            <Rocket className="icon" /> Đi tới Sprint & giao việc
          </Button>
        </div>
      </div>
    );
  }

  /* --- bản nháp --- */
  return (
    <div className="space-y-4">
      {plan.loading && !plan.data ? (
        <LoadingBlock rows={5} />
      ) : plan.error ? (
        <ErrorBlock error={plan.error} onRetry={plan.reload} />
      ) : plan.data ? (
        <PlanDraftPreview plan={plan.data} />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="max-w-md text-[11px] leading-relaxed text-dim">
          Công bố sẽ tạo sprint + nhiệm vụ thật và chuyển phiên sang <b className="text-ink">đang diễn ra</b>. Hành động
          không thể hoàn tác.
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
            onClick={onBack}
          >
            <ArrowLeft className="icon" /> Quay lại
          </Button>
          <Button
            variant="outline"
            className="rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
            disabled={generating}
            onClick={handleGenerate}
          >
            {generating ? <InlineSpinner /> : <Sparkles className="icon" />} Sinh lại
          </Button>
          <Button
            className="glow-brand rounded-lg font-semibold"
            disabled={!plan.data || publishing}
            onClick={() => setConfirmOpen(true)}
          >
            <Rocket className="icon" /> Công bố & khởi động
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!publishing) setConfirmOpen(open);
        }}
        title="Công bố kế hoạch và khởi động phiên?"
        description="Sprint và nhiệm vụ sẽ được tạo thật cho buổi thực tập, phiên chuyển sang đang diễn ra. Hành động này không thể hoàn tác."
        confirmLabel={publishing ? "Đang công bố…" : "Công bố & khởi động"}
        busy={publishing}
        onConfirm={handlePublish}
      />
    </div>
  );
}

function PlanDraftPreview({ plan }: { plan: PlanDetail }) {
  const draft = plan.draft;
  if (!draft) return null;
  const totalTasks = draft.sprints.reduce((n, s) => n + s.tasks.length, 0);
  return (
    <div className="rounded-xl border border-line bg-deep/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
          <Sparkles className="size-4 icon text-brand-bright" /> Bản nháp kế hoạch AI
        </p>
        <div className="flex items-center gap-1.5">
          <ToneBadge tone="amber" dot>
            Bản nháp
          </ToneBadge>
          <ToneBadge tone="teal">
            {draft.sprints.length} sprint · {totalTasks} nhiệm vụ
          </ToneBadge>
        </div>
      </div>

      {plan.warnings.length > 0 ? (
        <div className="mt-3 rounded-lg border border-amber/30 bg-amber/[0.06] px-3 py-2">
          {plan.warnings.map((w) => (
            <p key={w} className="text-[11px] text-amber">
              Lưu ý: {w}
            </p>
          ))}
        </div>
      ) : null}

      <div className="mt-4 space-y-4">
        {draft.sprints.map((sprint, idx) => (
          <div key={sprint.code} className="rounded-lg border border-line bg-panel p-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="grid size-6 place-items-center rounded-full bg-brand/10 font-mono text-[10px] font-bold text-brand-bright">
                {idx + 1}
              </span>
              <span className="font-mono text-[10px] font-semibold tracking-wider text-brand-bright/80">{sprint.code}</span>
              <span className="text-[13px] font-semibold text-ink">{sprint.name}</span>
              <ToneBadge tone="zinc">{sprint.tasks.length} nhiệm vụ</ToneBadge>
            </div>
            <p className="mt-1.5 text-[11px] italic leading-relaxed text-dim">Mục tiêu: {sprint.goal}</p>
            <ul className="mt-2.5 grid gap-1.5 md:grid-cols-2">
              {sprint.tasks.map((task) => (
                <li key={task.key} className="flex items-start gap-2 rounded-lg border border-line bg-deep/60 px-3 py-2">
                  <ListChecks className="mt-0.5 size-3.5 shrink-0 icon text-faint" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-ink">{task.title}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-faint">
                      <span className="font-mono">{task.key}</span>
                      <span>· {task.storyPoints} SP</span>
                      {task.dependsOn.length > 0 ? <span>· phụ thuộc {task.dependsOn.join(", ")}</span> : null}
                    </p>
                  </div>
                  <RoleBadge role={task.suggestedRole} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {draft.milestones.length > 0 ? (
        <div className="mt-4 border-t border-line pt-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">Cột mốc đề xuất</p>
          <div className="flex flex-wrap gap-2">
            {draft.milestones.map((m) => (
              <ToneBadge key={m.title} tone="teal">
                {m.title} · ngày {m.dueOffsetDays}
              </ToneBadge>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ==================== Helper: tìm blueprint của phiên ==================== */

async function loadBlueprintForSession(sessionId: string): Promise<ProjectBlueprint | null> {
  try {
    const list = await templateApi.list({ page: 1, pageSize: 30, status: "active" });
    for (const t of list.data) {
      try {
        const detail = await templateApi.detail(t.id);
        if (detail.runs.some((r) => r.sessionId === sessionId)) {
          return detail.blueprint;
        }
      } catch {
        /* bỏ qua template lỗi */
      }
    }
  } catch {
    /* bỏ qua */
  }
  return null;
}
