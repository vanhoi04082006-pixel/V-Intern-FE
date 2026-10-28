"use client";

import * as React from "react";
import {
  AlertTriangle,
  ArrowRightLeft,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileWarning,
  Gavel,
  GitBranch,
  History,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Undo2,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  participationApi,
  type ParticipationIncident,
  type ParticipationPolicy,
  type ReplacementCandidate,
  type ReplacementPreview,
  type ReplacementRecord,
  type RepositoryAccessJob,
  type RepoJobStatus,
} from "@/lib/client/api-org";
import { ApiError } from "@/lib/client/http";
import { sessionApi } from "@/lib/client/api";
import { useResource } from "@/lib/client/use-resource";
import { formatDate, formatDateTime, relativeTime } from "@/lib/client/labels";
import { useRoute } from "@/lib/client/router";
import { ViewFrame } from "@/components/shared/view";
import {
  Panel,
  PanelHeader,
  PageHeader,
  MetricCard,
  Empty,
  ToneBadge,
  KeyValue,
  UserAvatar,
} from "@/components/shared/primitives";
import { RoleBadge } from "@/components/shared/badges";
import { LoadingBlock, ErrorBlock, InlineSpinner } from "@/components/shared/states";
import { FilterSelect } from "@/components/shared/toolbar";
import { ConfirmDialog } from "@/components/shared/confirm";
import { ChatBubble, TypingDots } from "@/components/shared/chat";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ==================== Nhãn & tone ==================== */

const incidentKindLabels: Record<string, string> = {
  late: "Nộp trễ",
  missing: "Không nộp",
};

const incidentKindTones: Record<string, "amber" | "rose"> = {
  late: "amber",
  missing: "rose",
};

function IncidentKindBadge({ kind }: { kind: string }) {
  return (
    <ToneBadge tone={incidentKindTones[kind] ?? "zinc"}>{incidentKindLabels[kind] ?? kind}</ToneBadge>
  );
}

const incidentStatusLabels: Record<string, string> = {
  active: "Đang hiệu lực",
  excused: "Đã miễn trừ",
  reversed: "Đã hoàn tác",
};

const incidentStatusTones: Record<string, "rose" | "emerald" | "teal"> = {
  active: "rose",
  excused: "emerald",
  reversed: "teal",
};

function IncidentStatusBadge({ status }: { status: string }) {
  return (
    <ToneBadge tone={incidentStatusTones[status] ?? "zinc"} dot>
      {incidentStatusLabels[status] ?? status}
    </ToneBadge>
  );
}

const repoJobStatusMeta: Record<RepoJobStatus, { label: string; tone: "zinc" | "amber" | "teal" | "emerald" | "rose" | "violet" }> = {
  pending: { label: "Đang chờ", tone: "amber" },
  leased: { label: "Đang xử lý", tone: "teal" },
  retry: { label: "Chờ thử lại", tone: "violet" },
  waiting_user: { label: "Chờ người dùng", tone: "amber" },
  done: { label: "Hoàn tất", tone: "emerald" },
  failed: { label: "Thất bại", tone: "rose" },
  review_required: { label: "Cần xem xét", tone: "violet" },
};

function RepoJobStatusBadge({ status }: { status: RepoJobStatus }) {
  const meta = repoJobStatusMeta[status] ?? { label: status, tone: "zinc" as const };
  return (
    <ToneBadge tone={meta.tone} dot>
      {meta.label}
    </ToneBadge>
  );
}

/** Toast lỗi chuẩn — 409 conflict → nhắc tải lại. */
function toastError(err: unknown, fallback: string) {
  if (err instanceof ApiError && err.status === 409) {
    toast.error("Dữ liệu vừa được cập nhật bởi người khác — đang tải lại để tránh ghi đè.");
    return;
  }
  toast.error(err instanceof Error ? err.message : fallback);
}

const INCIDENTS_PAGE_SIZE = 10;

/* ==================== View chính ==================== */

export function InstructorParticipation({ params }: { params: Record<string, string> }) {
  const { search } = useRoute();
  const [sessionId, setSessionId] = React.useState<string>(params.sessionId ?? search.get("sessionId") ?? "ses_2025_01");
  const [policyOpen, setPolicyOpen] = React.useState(false);
  const [wizardIncident, setWizardIncident] = React.useState<ParticipationIncident | "picker" | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const sessions = useResource(() => sessionApi.overview({ page: 1, pageSize: 50 }), []);

  // Nếu sessionId mặc định không có trong danh sách → dùng phiên đầu tiên
  React.useEffect(() => {
    const list = sessions.data?.data ?? [];
    if (list.length > 0 && !list.some((s) => s.id === sessionId)) {
      setSessionId(list[0].id);
    }
  }, [sessions.data, sessionId]);

  const report = useResource(
    () => participationApi.sessionReport(sessionId, { page: 1, pageSize: INCIDENTS_PAGE_SIZE }),
    [sessionId]
  );

  const replacements = useResource(
    () => participationApi.sessionReplacements(sessionId, { page: 1, pageSize: 5 }),
    [sessionId]
  );

  const repoJobs = useResource(
    () => participationApi.repoAccessJobs(sessionId, { page: 1, pageSize: 10 }),
    [sessionId]
  );

  const reloadAll = React.useCallback(() => {
    report.reload();
    replacements.reload();
    repoJobs.reload();
  }, [report, replacements, repoJobs]);

  const handleRefresh = () => {
    setRefreshing(true);
    participationApi
      .refresh(sessionId)
      .then((res) => {
        toast.success(`Đã quét lại phiên — ${res.incidentCount} sự việc vi phạm kỷ luật`);
        reloadAll();
      })
      .catch((err) => toastError(err, "Không quét lại được"))
      .finally(() => setRefreshing(false));
  };

  const data = report.data;
  const policy = data?.policy ?? null;

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Kỷ luật phiên"
        title="Thời hạn & kỷ luật phiên"
        description="Cấu hình ngưỡng trễ hạn, xử lý sự việc vi phạm, gia hạn — miễn trừ — hoàn tác và thay thành viên qua wizard đối chiếu Agent."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
              disabled={refreshing}
              onClick={handleRefresh}
            >
              {refreshing ? <InlineSpinner /> : <RefreshCw className="icon" />}
              Quét lại
            </Button>
            <Button
              className="rounded-lg bg-brand font-semibold text-on-brand hover:bg-brand-bright"
              onClick={() => setWizardIncident("picker")}
            >
              <UserPlus className="icon" /> Thay thành viên
            </Button>
          </div>
        }
      />

      {/* Chọn phiên */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-panel/60 p-3">
        <span className="inline-flex items-center gap-1.5 pl-1 text-xs font-medium text-dim">
          <ClipboardCheck className="size-3.5 icon text-faint" /> Buổi thực tập:
        </span>
        <FilterSelect
          value={sessionId}
          onChange={setSessionId}
          options={(sessions.data?.data ?? []).map((s) => ({ value: s.id, label: `${s.code} — ${s.name}` }))}
          allLabel="Chọn phiên"
          placeholder="Chọn phiên"
          className="w-full sm:w-80"
          ariaLabel="Chọn buổi thực tập"
        />
        {sessions.loading ? <InlineSpinner className="text-faint" /> : null}
      </div>

      {/* MetricCards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Tổng vi phạm"
          value={report.loading ? "…" : (data?.report.totalIncidents ?? 0)}
          hint="Mọi sự việc đã ghi nhận"
          icon={<FileWarning />}
          tone="default"
        />
        <MetricCard
          label="Đang hiệu lực"
          value={report.loading ? "…" : (data?.report.active ?? 0)}
          hint="Chưa miễn trừ/hoàn tác"
          icon={<AlertTriangle />}
          tone={(data?.report.active ?? 0) > 0 ? "rose" : "default"}
        />
        <MetricCard
          label="Miễn trừ / hoàn tác"
          value={report.loading ? "…" : `${data?.report.excused ?? 0}/${data?.report.reversed ?? 0}`}
          hint="Đã xử lý xong"
          icon={<ShieldCheck />}
          tone="teal"
        />
        <MetricCard
          label="Tổng điểm phạt"
          value={report.loading ? "…" : (data?.report.penaltyPointsTotal ?? 0)}
          hint={`Trần mỗi sinh viên: ${policy?.penaltyCap ?? "—"} điểm`}
          icon={<Gavel />}
          tone="amber"
        />
        <MetricCard
          label="Sinh viên ảnh hưởng"
          value={report.loading ? "…" : (data?.report.affectedInterns ?? 0)}
          hint="Có ít nhất 1 vi phạm"
          icon={<Users />}
          tone="brand"
        />
      </div>

      {/* Chính sách trễ hạn */}
      <section className="mb-6">
        {policy ? (
          <Panel>
            <PanelHeader
              title="Chính sách trễ hạn"
              description={`Áp dụng từ ${formatDate(policy.activeFrom)} · cập nhật ${relativeTime(policy.updatedAt)} bởi ${policy.updatedBy}`}
              icon={<Gavel className="size-4 icon" />}
              actions={
                <div className="flex items-center gap-2">
                  <ToneBadge tone="brand">Phiên bản v{policy.version}</ToneBadge>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
                    onClick={() => setPolicyOpen(true)}
                  >
                    Chỉnh sửa
                  </Button>
                </div>
              }
            />
            <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 lg:grid-cols-4">
              <KeyValue label="Cảnh báo từ">
                <span className="font-mono text-base font-bold">{policy.warningFrom}h</span>
              </KeyValue>
              <KeyValue label="Trừ điểm từ">
                <span className="font-mono text-base font-bold text-amber">{policy.penaltyFrom}h</span>
              </KeyValue>
              <KeyValue label="Xét thay người từ">
                <span className="font-mono text-base font-bold text-rose">{policy.replacementFrom}h</span>
              </KeyValue>
              <KeyValue label="Điểm phạt / trần">
                <span className="font-mono text-base font-bold">
                  {policy.penaltyPoints}đ <span className="text-faint">/ {policy.penaltyCap}đ</span>
                </span>
              </KeyValue>
            </div>
            <p className="border-t border-line px-5 py-3 text-xs leading-relaxed text-dim">
              <b className="text-ink">Lý do phiên hiện tại:</b> {policy.reason}
            </p>
          </Panel>
        ) : (
          <Panel>
            <Empty
              icon={<Gavel />}
              title="Chưa kích hoạt kỷ luật phiên"
              description="Chưa có chính sách trễ hạn cho buổi thực tập này. Tạo chính sách để hệ thống bắt đầu ghi nhận cảnh báo, trừ điểm và đề xuất thay người."
              action={
                <Button className="rounded-lg bg-brand text-on-brand hover:bg-brand-bright" onClick={() => setPolicyOpen(true)}>
                  <Gavel className="icon" /> Tạo chính sách
                </Button>
              }
            />
          </Panel>
        )}
      </section>

      {/* Danh sách incidents */}
      <section className="mb-6">
        {report.loading ? (
          <LoadingBlock rows={5} />
        ) : report.error ? (
          <ErrorBlock error={report.error} onRetry={report.reload} />
        ) : (
          <IncidentListPanel
            sessionId={sessionId}
            incidents={data?.data ?? []}
            penaltyPoints={policy?.penaltyPoints ?? null}
            onChanged={reloadAll}
            onOpenWizard={setWizardIncident}
          />
        )}
      </section>

      {/* Wizard thay thành viên + lịch sử + repo jobs */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ReplacementsPanel rows={replacements.data?.data ?? []} loading={replacements.loading} error={replacements.error} onRetry={replacements.reload} />
        <RepoJobsPanel
          sessionId={sessionId}
          jobs={repoJobs.data?.data ?? []}
          loading={repoJobs.loading}
          error={repoJobs.error}
          onRetry={repoJobs.reload}
          onChanged={repoJobs.reload}
        />
      </div>

      <PolicyDialog
        open={policyOpen}
        onOpenChange={setPolicyOpen}
        sessionId={sessionId}
        policy={policy}
        onSaved={() => {
          report.reload();
        }}
      />

      {wizardIncident ? (
        <ReplacementWizardDialog
          sessionId={sessionId}
          incidents={data?.data ?? []}
          initialIncident={wizardIncident === "picker" ? null : wizardIncident}
          onClose={() => setWizardIncident(null)}
          onChanged={reloadAll}
        />
      ) : null}
    </ViewFrame>
  );
}

/* ==================== Danh sách sự việc vi phạm ==================== */

function IncidentListPanel({
  sessionId,
  incidents,
  penaltyPoints,
  onChanged,
  onOpenWizard,
}: {
  sessionId: string;
  incidents: ParticipationIncident[];
  penaltyPoints: number | null;
  onChanged: () => void;
  onOpenWizard: (incident: ParticipationIncident) => void;
}) {
  const [extendFor, setExtendFor] = React.useState<ParticipationIncident | null>(null);
  const [excuseFor, setExcuseFor] = React.useState<ParticipationIncident | null>(null);
  const [reverseFor, setReverseFor] = React.useState<ParticipationIncident | null>(null);
  const [reason, setReason] = React.useState("");
  const [newDueAt, setNewDueAt] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (extendFor) {
      setReason("");
      setNewDueAt(extendFor.dueAt ? extendFor.dueAt.slice(0, 16) : "");
    }
  }, [extendFor]);

  React.useEffect(() => {
    if (excuseFor || reverseFor) setReason("");
  }, [excuseFor, reverseFor]);

  const handleExtend = () => {
    if (!extendFor?.taskId) return;
    if (!newDueAt) {
      toast.error("Vui lòng chọn thời hạn mới");
      return;
    }
    if (reason.trim().length < 10) {
      toast.error("Lý do cần tối thiểu 10 ký tự");
      return;
    }
    setBusy(true);
    participationApi
      .extendTask(sessionId, extendFor.taskId, {
        newDueAt: new Date(newDueAt).toISOString(),
        reason: reason.trim(),
      })
      .then(() => {
        toast.success(`Đã gia hạn ${extendFor.taskCode} tới ${formatDateTime(new Date(newDueAt).toISOString())}`);
        setExtendFor(null);
        onChanged();
      })
      .catch((err) => toastError(err, "Không gia hạn được nhiệm vụ"))
      .finally(() => setBusy(false));
  };

  const handleResolve = (action: "excused" | "reversed") => {
    const target = action === "excused" ? excuseFor : reverseFor;
    if (!target) return;
    if (reason.trim().length < 10) {
      toast.error("Lý do cần tối thiểu 10 ký tự");
      return;
    }
    setBusy(true);
    participationApi
      .resolveIncident(sessionId, target.id, { action, reason: reason.trim() })
      .then(() => {
        toast.success(
          action === "excused"
            ? `Đã miễn trừ vi phạm ${target.taskCode} — điểm phạt được hoàn về sinh viên`
            : `Đã hoàn tác vi phạm ${target.taskCode}`
        );
        setExcuseFor(null);
        setReverseFor(null);
        onChanged();
      })
      .catch((err) => toastError(err, "Không xử lý được vi phạm"))
      .finally(() => setBusy(false));
  };

  if (incidents.length === 0) {
    return (
      <Panel>
        <Empty
          icon={<ShieldCheck />}
          title="Không có sự việc vi phạm nào"
          description="Phiên này chưa ghi nhận vi phạm trễ hạn hoặc thiếu nộp. Quét lại để cập nhật."
        />
      </Panel>
    );
  }

  return (
    <>
      <Panel>
        <PanelHeader
          title="Sự việc vi phạm"
          description={`${incidents.length} bản ghi · gia hạn / miễn trừ / hoàn tác trực tiếp từng dòng`}
          icon={<FileWarning className="size-4 icon" />}
        />
        <ul className="divide-y divide-line">
          {incidents.map((inc) => {
            const severe = inc.status === "active" && (inc.kind === "missing" || (penaltyPoints !== null && inc.points >= penaltyPoints));
            return (
              <li key={inc.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start gap-3">
                  <UserAvatar name={inc.internName ?? "?"} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-semibold text-ink">{inc.internName ?? "Sinh viên"}</span>
                      <span className="font-mono text-[10px] font-semibold text-brand-bright/80">{inc.taskCode}</span>
                      <IncidentKindBadge kind={inc.kind} />
                      <IncidentStatusBadge status={inc.status} />
                      {severe ? (
                        <ToneBadge tone="rose" dot>
                          Nghiêm trọng
                        </ToneBadge>
                      ) : null}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-dim">{inc.taskTitle}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-faint">
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="size-3 icon" />
                        Hạn {formatDateTime(inc.dueAt)}
                      </span>
                      {inc.submittedAt ? <span>Nộp {formatDateTime(inc.submittedAt)}</span> : <span>Chưa nộp</span>}
                      <span>
                        Lần vi phạm thứ {inc.ordinal} · <b className="text-amber">-{inc.points}đ</b>
                      </span>
                      <span>
                        Trừ: {inc.latePenalty}đ · Điểm hiện tại: {inc.score}/{inc.baseScore}
                      </span>
                    </p>
                    {inc.status !== "active" && inc.resolveReason ? (
                      <p className="mt-1.5 rounded-lg border border-line bg-deep/60 px-3 py-1.5 text-[11px] leading-relaxed text-dim">
                        {inc.status === "excused" ? "Miễn trừ" : "Hoàn tác"} bởi {inc.resolvedBy} — {inc.resolveReason}
                      </p>
                    ) : null}
                  </div>
                  {inc.status === "active" ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
                        disabled={!inc.taskId}
                        onClick={() => setExtendFor(inc)}
                      >
                        <CalendarClock className="size-3.5 icon" /> Gia hạn
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
                        onClick={() => setExcuseFor(inc)}
                      >
                        <ShieldCheck className="size-3.5 icon" /> Miễn trừ
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
                        onClick={() => setReverseFor(inc)}
                      >
                        <Undo2 className="size-3.5 icon" /> Hoàn tác
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 rounded-lg bg-brand text-xs font-semibold text-on-brand hover:bg-brand-bright"
                        onClick={() => onOpenWizard(inc)}
                      >
                        <UserPlus className="size-3.5 icon" /> Thay thành viên
                      </Button>
                    </div>
                  ) : (
                    <ToneBadge tone="zinc">Đã xử lý</ToneBadge>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <p className="border-t border-line px-5 py-2.5 text-[10px] text-faint">
          Hiển thị {incidents.length} bản ghi mới nhất của phiên.
        </p>
      </Panel>

      {/* Dialog gia hạn */}
      <Dialog open={Boolean(extendFor)} onOpenChange={(v) => !busy && !v && setExtendFor(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl border-line bg-panel p-0 sm:max-w-lg">
          <DialogHeader className="border-b border-line px-6 pt-6">
            <DialogTitle className="text-left text-base font-semibold text-ink">
              Gia hạn hạn chót {extendFor?.taskCode}
            </DialogTitle>
            <DialogDescription className="text-left text-xs leading-relaxed text-dim">
              Sinh viên {extendFor?.internName} sẽ nhận thông báo về thời hạn mới. Sự việc vi phạm vẫn được ghi nhận.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 py-5">
            <div className="space-y-1.5">
              <Label htmlFor="extend-due" className="text-xs font-medium text-dim">
                Thời hạn mới <span className="text-rose">*</span>
              </Label>
              <Input
                id="extend-due"
                type="datetime-local"
                value={newDueAt}
                onChange={(e) => setNewDueAt(e.target.value)}
                className="h-10 rounded-lg border-line bg-deep text-sm text-ink focus-visible:ring-brand/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="extend-reason" className="text-xs font-medium text-dim">
                Lý do gia hạn (tối thiểu 10 ký tự) <span className="text-rose">*</span>
              </Label>
              <Textarea
                id="extend-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="VD: Sinh viên báo ốm có giấy xác nhận, gia hạn 48 giờ…"
                className="min-h-20 rounded-lg border-line bg-deep text-sm text-ink placeholder:text-faint focus-visible:ring-brand/30"
              />
            </div>
          </div>
          <DialogFooter className="border-t border-line bg-deep/40 px-6 py-4">
            <Button
              variant="outline"
              className="rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
              disabled={busy}
              onClick={() => setExtendFor(null)}
            >
              Hủy
            </Button>
            <Button className="rounded-lg bg-brand font-semibold text-on-brand hover:bg-brand-bright" disabled={busy} onClick={handleExtend}>
              {busy ? <InlineSpinner /> : <CalendarClock className="icon" />}
              Xác nhận gia hạn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog miễn trừ / hoàn tác */}
      <ConfirmDialog
        open={Boolean(excuseFor)}
        onOpenChange={(open) => {
          if (!busy && !open) setExcuseFor(null);
        }}
        title={`Miễn trừ vi phạm ${excuseFor?.taskCode ?? ""}?`}
        description={
          excuseFor
            ? `Điểm phạt -${excuseFor.points}đ của ${excuseFor.internName} sẽ được hoàn về (${excuseFor.baseScore}đ). Sự việc chuyển sang trạng thái đã miễn trừ.`
            : ""
        }
        confirmLabel="Miễn trừ"
        busy={busy}
        onConfirm={() => handleResolve("excused")}
      >
        <div className="space-y-1.5">
          <Label htmlFor="excuse-reason" className="text-xs font-medium text-dim">
            Lý do miễn trừ (tối thiểu 10 ký tự) <span className="text-rose">*</span>
          </Label>
          <Textarea
            id="excuse-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="VD: Ốm có giấy xin phép của bác sĩ…"
            className="min-h-20 rounded-lg border-line bg-deep text-sm text-ink placeholder:text-faint focus-visible:ring-brand/30"
          />
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(reverseFor)}
        onOpenChange={(open) => {
          if (!busy && !open) setReverseFor(null);
        }}
        title={`Hoàn tác vi phạm ${reverseFor?.taskCode ?? ""}?`}
        description={
          reverseFor
            ? `Xóa bỏ hiệu lực của vi phạm ${reverseFor.taskCode} đối với ${reverseFor.internName} — điểm hoàn về ${reverseFor.baseScore}đ.`
            : ""
        }
        confirmLabel="Hoàn tác"
        destructive
        busy={busy}
        onConfirm={() => handleResolve("reversed")}
      >
        <div className="space-y-1.5">
          <Label htmlFor="reverse-reason" className="text-xs font-medium text-dim">
            Lý do hoàn tác (tối thiểu 10 ký tự) <span className="text-rose">*</span>
          </Label>
          <Textarea
            id="reverse-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="VD: Ghi nhận nhầm — sinh viên đã nộp đúng hạn qua PR khác…"
            className="min-h-20 rounded-lg border-line bg-deep text-sm text-ink placeholder:text-faint focus-visible:ring-brand/30"
          />
        </div>
      </ConfirmDialog>
    </>
  );
}

/* ==================== Dialog chính sách ==================== */

function PolicyDialog({
  open,
  onOpenChange,
  sessionId,
  policy,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  policy: ParticipationPolicy | null;
  onSaved: () => void;
}) {
  const [warningFrom, setWarningFrom] = React.useState("24");
  const [penaltyFrom, setPenaltyFrom] = React.useState("48");
  const [replacementFrom, setReplacementFrom] = React.useState("72");
  const [penaltyPoints, setPenaltyPoints] = React.useState("5");
  const [penaltyCap, setPenaltyCap] = React.useState("15");
  const [activeFrom, setActiveFrom] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (policy) {
      setWarningFrom(String(policy.warningFrom));
      setPenaltyFrom(String(policy.penaltyFrom));
      setReplacementFrom(String(policy.replacementFrom));
      setPenaltyPoints(String(policy.penaltyPoints));
      setPenaltyCap(String(policy.penaltyCap));
      setActiveFrom(policy.activeFrom.slice(0, 10));
      setReason("");
    } else {
      setWarningFrom("24");
      setPenaltyFrom("48");
      setReplacementFrom("72");
      setPenaltyPoints("5");
      setPenaltyCap("15");
      setActiveFrom("");
      setReason("");
    }
  }, [open, policy]);

  const handleSubmit = async () => {
    const w = Number(warningFrom);
    const p = Number(penaltyFrom);
    const r = Number(replacementFrom);
    const points = Number(penaltyPoints);
    const cap = Number(penaltyCap);
    if (![w, p, r, points, cap].every((n) => Number.isFinite(n) && n >= 0)) {
      toast.error("Các ngưỡng và điểm phải là số không âm");
      return;
    }
    if (w > p || p > r) {
      toast.error("Thứ tự ngưỡng phải là: cảnh báo ≤ trừ điểm ≤ xét thay người");
      return;
    }
    if (points > cap) {
      toast.error("Điểm phạt mỗi lần không được vượt trần điểm");
      return;
    }
    if (!activeFrom) {
      toast.error("Vui lòng chọn ngày áp dụng");
      return;
    }
    if (reason.trim().length < 10) {
      toast.error("Lý do cần tối thiểu 10 ký tự");
      return;
    }
    setSubmitting(true);
    try {
      await participationApi.upsertPolicy(sessionId, {
        warningFrom: w,
        penaltyFrom: p,
        replacementFrom: r,
        penaltyPoints: points,
        penaltyCap: cap,
        activeFrom: new Date(activeFrom).toISOString(),
        reason: reason.trim(),
        expectedVersion: policy?.version,
      });
      toast.success(
        policy
          ? `Đã cập nhật chính sách — phiên bản v${(policy.version ?? 0) + 1}`
          : "Đã kích hoạt chính sách trễ hạn cho phiên"
      );
      onOpenChange(false);
      onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.code === "POLICY_VERSION_CONFLICT") {
        toast.error("Dữ liệu vừa được cập nhật bởi người khác — đang tải lại chính sách.");
        onSaved();
        onOpenChange(false);
        return;
      }
      toastError(err, "Không lưu được chính sách");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl border-line bg-panel p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-line px-6 pt-6">
          <DialogTitle className="text-left text-base font-semibold text-ink">
            {policy ? `Chỉnh sửa chính sách (v${policy.version})` : "Kích hoạt chính sách trễ hạn"}
          </DialogTitle>
          <DialogDescription className="text-left text-xs leading-relaxed text-dim">
            Ba ngưỡng tính theo giờ trễ: cảnh báo → trừ điểm → đề xuất thay thành viên. Điểm phạt cộng dồn, không vượt
            trần mỗi sinh viên.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="policy-warning" className="text-xs font-medium text-dim">
                Cảnh báo từ (giờ) <span className="text-rose">*</span>
              </Label>
              <Input
                id="policy-warning"
                type="number"
                min={0}
                value={warningFrom}
                onChange={(e) => setWarningFrom(e.target.value)}
                className="h-10 rounded-lg border-line bg-deep text-sm text-ink focus-visible:ring-brand/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="policy-penalty" className="text-xs font-medium text-dim">
                Trừ điểm từ (giờ) <span className="text-rose">*</span>
              </Label>
              <Input
                id="policy-penalty"
                type="number"
                min={0}
                value={penaltyFrom}
                onChange={(e) => setPenaltyFrom(e.target.value)}
                className="h-10 rounded-lg border-line bg-deep text-sm text-ink focus-visible:ring-brand/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="policy-replacement" className="text-xs font-medium text-dim">
                Thay người từ (giờ) <span className="text-rose">*</span>
              </Label>
              <Input
                id="policy-replacement"
                type="number"
                min={0}
                value={replacementFrom}
                onChange={(e) => setReplacementFrom(e.target.value)}
                className="h-10 rounded-lg border-line bg-deep text-sm text-ink focus-visible:ring-brand/30"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="policy-points" className="text-xs font-medium text-dim">
                Điểm phạt / lần <span className="text-rose">*</span>
              </Label>
              <Input
                id="policy-points"
                type="number"
                min={0}
                value={penaltyPoints}
                onChange={(e) => setPenaltyPoints(e.target.value)}
                className="h-10 rounded-lg border-line bg-deep text-sm text-ink focus-visible:ring-brand/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="policy-cap" className="text-xs font-medium text-dim">
                Trần điểm / sinh viên <span className="text-rose">*</span>
              </Label>
              <Input
                id="policy-cap"
                type="number"
                min={0}
                value={penaltyCap}
                onChange={(e) => setPenaltyCap(e.target.value)}
                className="h-10 rounded-lg border-line bg-deep text-sm text-ink focus-visible:ring-brand/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="policy-active" className="text-xs font-medium text-dim">
                Áp dụng từ <span className="text-rose">*</span>
              </Label>
              <Input
                id="policy-active"
                type="date"
                value={activeFrom}
                onChange={(e) => setActiveFrom(e.target.value)}
                className="h-10 rounded-lg border-line bg-deep text-sm text-ink focus-visible:ring-brand/30"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="policy-reason" className="text-xs font-medium text-dim">
              Lý do thay đổi (tối thiểu 10 ký tự) <span className="text-rose">*</span>
            </Label>
            <Textarea
              id="policy-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Điều chỉnh ngưỡng trừ điểm theo phản ánh của lớp sau 2 sprint đầu…"
              className="min-h-20 rounded-lg border-line bg-deep text-sm text-ink placeholder:text-faint focus-visible:ring-brand/30"
            />
          </div>
          {policy ? (
            <p className="rounded-lg border border-line bg-deep/60 px-3 py-2 text-[11px] text-faint">
              Cập nhật dựa trên phiên bản v{policy.version}. Nếu người khác vừa sửa, hệ thống sẽ từ chối và yêu cầu tải
              lại.
            </p>
          ) : null}
        </div>
        <DialogFooter className="border-t border-line bg-deep/40 px-6 py-4">
          <Button
            variant="outline"
            className="rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            Hủy
          </Button>
          <Button className="rounded-lg bg-brand font-semibold text-on-brand hover:bg-brand-bright" disabled={submitting} onClick={handleSubmit}>
            {submitting ? <InlineSpinner /> : <Gavel className="icon" />}
            {policy ? "Lưu cập nhật" : "Kích hoạt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ==================== Stepper wizard ==================== */

function WizardStepper({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "Agent đối chiếu" },
    { n: 2, label: "Xem trước bàn giao" },
    { n: 3, label: "Phê duyệt" },
  ];
  return (
    <ol className="flex items-center gap-2">
      {steps.map((s, i) => {
        const done = step > s.n;
        const active = step === s.n;
        return (
          <React.Fragment key={s.n}>
            {i > 0 ? (
              <span
                aria-hidden
                className={`h-px w-8 shrink-0 sm:w-14 ${done ? "bg-brand/60" : "bg-line"}`}
              />
            ) : null}
            <li className="flex items-center gap-2">
              <span
                className={`grid size-6 shrink-0 place-items-center rounded-full border text-[11px] font-bold transition-colors ${
                  done
                    ? "border-brand bg-brand text-on-brand"
                    : active
                      ? "border-brand bg-brand/15 text-brand-bright"
                      : "border-line bg-panel-2 text-faint"
                }`}
              >
                {done ? <CheckCircle2 className="size-3.5 icon" /> : s.n}
              </span>
              <span
                className={`hidden text-[11px] font-semibold sm:inline ${
                  active ? "text-brand-bright" : done ? "text-dim" : "text-faint"
                }`}
              >
                {s.label}
              </span>
            </li>
          </React.Fragment>
        );
      })}
    </ol>
  );
}

/* ==================== Wizard thay thành viên (3 bước) ==================== */

function ReplacementWizardDialog({
  sessionId,
  incidents,
  initialIncident,
  onClose,
  onChanged,
}: {
  sessionId: string;
  incidents: ParticipationIncident[];
  initialIncident: ParticipationIncident | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const activeIncidents = incidents.filter((i) => i.status === "active");
  const [incidentId, setIncidentId] = React.useState<string | null>(initialIncident?.id ?? null);
  const [step, setStep] = React.useState<1 | 2 | 3>(1);

  /* bước 1 */
  const [adviceLoading, setAdviceLoading] = React.useState(false);
  const [candidates, setCandidates] = React.useState<ReplacementCandidate[] | null>(null);
  const [notes, setNotes] = React.useState<string[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = React.useState<string | null>(null);
  const [handoverHours, setHandoverHours] = React.useState("24");

  /* bước 2 */
  const [preview, setPreview] = React.useState<ReplacementPreview | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [confirmed, setConfirmed] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [approving, setApproving] = React.useState(false);

  /* bước 3 */
  const [result, setResult] = React.useState<ReplacementRecord | null>(null);

  const incident = incidents.find((i) => i.id === incidentId) ?? null;
  const candidate = candidates?.find((c) => c.userId === selectedCandidateId) ?? null;

  // Reset khi mở lại / đổi sự việc
  React.useEffect(() => {
    setAdviceLoading(false);
    setCandidates(null);
    setNotes([]);
    setSelectedCandidateId(null);
    setHandoverHours("24");
    setPreview(null);
    setConfirmed(false);
    setReason("");
    setResult(null);
    setStep(1);
  }, [incidentId]);

  const runAdvice = () => {
    if (!incidentId) {
      toast.error("Vui lòng chọn sự việc vi phạm trước");
      return;
    }
    setAdviceLoading(true);
    setCandidates(null);
    const started = Date.now();
    Promise.all([
      participationApi.replacementAdvice(sessionId, incidentId),
      // giữ nhịp "Agent đang đối chiếu" tối thiểu 1.5s cho chân thực
      new Promise((r) => setTimeout(r, Math.max(0, 1500 - (Date.now() - started)))),
    ])
      .then(([res]) => {
        setCandidates(res.candidates);
        setNotes(res.notes);
        toast.success(`Agent tìm được ${res.candidates.length} ứng viên phù hợp`);
      })
      .catch((err) => toastError(err, "Không lấy được gợi ý thay người"))
      .finally(() => setAdviceLoading(false));
  };

  const createPreview = () => {
    if (!incidentId || !selectedCandidateId) {
      toast.error("Vui lòng chọn ứng viên thay thế");
      return;
    }
    const hours = Number(handoverHours);
    if (!Number.isFinite(hours) || hours < 1 || hours > 168) {
      toast.error("Thời gian bàn giao phải từ 1 đến 168 giờ");
      return;
    }
    setPreviewLoading(true);
    participationApi
      .replacementPreview(sessionId, incidentId, {
        candidateUserId: selectedCandidateId,
        handoverHours: hours,
      })
      .then((res) => {
        setPreview(res);
        setConfirmed(false);
        setStep(2);
      })
      .catch((err) => toastError(err, "Không tạo được bản xem trước"))
      .finally(() => setPreviewLoading(false));
  };

  const approve = () => {
    if (!preview || !incidentId) return;
    const trimmed = reason.trim();
    if (trimmed.length < 10 || trimmed.length > 1000) {
      toast.error("Lý do phê duyệt cần 10–1000 ký tự");
      return;
    }
    setApproving(true);
    participationApi
      .approveReplacement(sessionId, preview.commandId, {
        expectedPreviewHash: preview.previewHash,
        reason: trimmed,
        confirmed: true,
      })
      .then((res) => {
        setResult(res.replacement);
        setStep(3);
        toast.success("Đã phê duyệt thay thành viên — nhiệm vụ được chuyển cho người mới");
        onChanged();
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 409) {
          toast.error("Bản xem trước đã hết hạn hoặc bị thay đổi — vui lòng tạo lại từ bước 1.");
          setStep(1);
          setPreview(null);
          return;
        }
        toastError(err, "Không phê duyệt được");
      })
      .finally(() => setApproving(false));
  };

  const reasonValid = reason.trim().length >= 10 && reason.trim().length <= 1000;

  return (
    <Dialog open onOpenChange={(open) => !approving && !open && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto rounded-2xl border-line bg-panel p-0">
        <DialogHeader className="border-b border-line px-6 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
            <div>
              <DialogTitle className="text-left text-base font-semibold text-ink">Wizard thay thành viên</DialogTitle>
              <DialogDescription className="mt-0.5 text-left text-xs text-dim">
                Ba bước: Agent đối chiếu ứng viên phù hợp → xem trước bàn giao → phê duyệt chính thức.
              </DialogDescription>
            </div>
            <WizardStepper step={step} />
          </div>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          {/* Bối cảnh sự việc */}
          {incident ? (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-rose/25 bg-rose/[0.05] px-4 py-3">
              <UserAvatar name={incident.internName ?? "?"} size={34} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-ink">
                  {incident.internName} — <span className="font-mono text-[11px]">{incident.taskCode}</span>
                </p>
                <p className="text-[11px] text-dim">
                  {incident.taskTitle} · {incidentKindLabels[incident.kind]} · -{incident.points}đ · hạn{" "}
                  {formatDateTime(incident.dueAt)}
                </p>
              </div>
              {!initialIncident && step === 1 ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
                  onClick={() => {
                    setIncidentId(null);
                  }}
                >
                  <RotateCcw className="icon" /> Đổi sự việc
                </Button>
              ) : null}
            </div>
          ) : null}

          {/* ===== Bước 1 ===== */}
          {step === 1 ? (
            <>
              {!incident ? (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-dim">
                    Chọn sự việc vi phạm đang hiệu lực <span className="text-rose">*</span>
                  </Label>
                  {activeIncidents.length === 0 ? (
                    <p className="rounded-xl border border-line bg-deep/60 px-4 py-3 text-xs text-dim">
                      Không có sự việc vi phạm nào đang hiệu lực — wizard chỉ áp dụng cho trường hợp cần thay người.
                    </p>
                  ) : (
                    <Select value={incidentId ?? ""} onValueChange={setIncidentId}>
                      <SelectTrigger className="h-10 w-full rounded-lg border-line bg-deep text-sm text-ink">
                        <SelectValue placeholder="Chọn sự việc…" />
                      </SelectTrigger>
                      <SelectContent className="border-line bg-panel-2 text-ink">
                        {activeIncidents.map((inc) => (
                          <SelectItem key={inc.id} value={inc.id}>
                            {inc.internName} · {inc.taskCode} ({incidentKindLabels[inc.kind]})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ) : null}

              {incidentId && candidates === null && !adviceLoading ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <Button className="glow-brand rounded-lg" onClick={runAdvice}>
                    <Sparkles className="icon" /> Bắt đầu đối chiếu với Agent
                  </Button>
                  <p className="max-w-sm text-[11px] leading-relaxed text-faint">
                    Agent đối chiếu vai trò, nhiệm vụ đã hoàn thành và điểm phỏng vấn của các ứng viên trúng tuyển còn
                    dư năng lực trong phiên.
                  </p>
                </div>
              ) : null}

              {adviceLoading ? (
                <div className="space-y-3 py-2">
                  <ChatBubble role="assistant">
                    Mình đang đối chiếu hồ sơ các ứng viên trúng tuyển với yêu cầu vai trò của{" "}
                    <b>{incident?.taskCode}</b>… kỳ qua các bạn cùng role, số task đã hoàn thành và điểm phỏng vấn AI.
                  </ChatBubble>
                  <TypingDots label="Agent đang đối chiếu ứng viên phù hợp…" />
                </div>
              ) : null}

              {candidates ? (
                <>
                  {notes.length > 0 ? (
                    <ChatBubble role="assistant">
                      <ul className="space-y-1">
                        {notes.map((n) => (
                          <li key={n}>• {n}</li>
                        ))}
                      </ul>
                    </ChatBubble>
                  ) : null}
                  {candidates.length === 0 ? (
                    <p className="rounded-xl border border-amber/30 bg-amber/[0.06] px-4 py-3 text-xs text-amber">
                      Không tìm thấy ứng viên phù hợp thay thế trong phiên này.
                    </p>
                  ) : (
                    <>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">
                        Ứng viên được đề xuất — chọn 1 người
                      </p>
                      <ul className="space-y-1.5">
                        {candidates.map((c) => {
                          const selected = c.userId === selectedCandidateId;
                          return (
                            <li key={c.userId}>
                              <button
                                type="button"
                                onClick={() => setSelectedCandidateId(c.userId)}
                                className={`flex w-full flex-wrap items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${
                                  selected
                                    ? "border-brand/40 bg-brand/[0.06]"
                                    : "border-line bg-deep/60 hover:border-line-strong"
                                }`}
                              >
                                <UserAvatar name={c.name} size={34} />
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[13px] font-semibold text-ink">{c.name}</span>
                                    <RoleBadge role={c.role} />
                                    <ToneBadge tone={c.matchScore >= 80 ? "emerald" : c.matchScore >= 65 ? "teal" : "amber"}>
                                      Khớp {c.matchScore}%
                                    </ToneBadge>
                                  </div>
                                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-dim">{c.reason}</p>
                                  <p className="mt-0.5 text-[10px] text-faint">
                                    {c.completedTasks} task hoàn thành · điểm TB {c.avgScore}
                                  </p>
                                </div>
                                {selected ? <CheckCircle2 className="size-4 shrink-0 icon text-brand-bright" /> : null}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="handover-hours" className="text-xs font-medium text-dim">
                            Thời gian bàn giao (giờ, 1–168) <span className="text-rose">*</span>
                          </Label>
                          <Input
                            id="handover-hours"
                            type="number"
                            min={1}
                            max={168}
                            value={handoverHours}
                            onChange={(e) => setHandoverHours(e.target.value)}
                            className="h-10 rounded-lg border-line bg-deep text-sm text-ink focus-visible:ring-brand/30"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          className="rounded-lg bg-brand font-semibold text-on-brand hover:bg-brand-bright"
                          disabled={!selectedCandidateId || previewLoading}
                          onClick={createPreview}
                        >
                          {previewLoading ? <InlineSpinner /> : <ArrowRightLeft className="icon" />}
                          Tạo bản xem trước bàn giao
                        </Button>
                      </div>
                    </>
                  )}
                </>
              ) : null}
            </>
          ) : null}

          {/* ===== Bước 2 ===== */}
          {step === 2 && preview ? (
            <>
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-deep/60 px-4 py-3">
                <UserAvatar name={preview.candidate.name} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-ink">
                    {preview.candidate.name} nhận bàn giao {preview.handoverHours} giờ
                  </p>
                  <p className="text-[11px] text-faint">
                    Mã lệnh: <span className="font-mono">{preview.previewHash.slice(0, 18)}…</span> · hết hạn{" "}
                    {formatDateTime(preview.expiresAt)}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-line bg-deep/60 p-4">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">
                    <ArrowRightLeft className="size-3.5 icon" /> Chuyển giao ({preview.transfers.length} nhiệm vụ mở)
                  </p>
                  {preview.transfers.length === 0 ? (
                    <p className="text-xs text-dim">Không có nhiệm vụ mở nào cần chuyển.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {preview.transfers.map((t) => (
                        <li key={t.taskId} className="flex items-center gap-2 text-xs">
                          <span className="font-mono text-[10px] font-semibold text-brand-bright/80">{t.taskCode}</span>
                          <span className="min-w-0 flex-1 truncate text-dim">{t.taskTitle}</span>
                          <span className="shrink-0 text-[10px] text-faint">
                            {t.fromName} → {t.toName}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="rounded-xl border border-line bg-deep/60 p-4">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">
                    <ShieldCheck className="size-3.5 icon" /> Giữ nguyên ({preview.preservedTasks.length} nhiệm vụ)
                  </p>
                  {preview.preservedTasks.length === 0 ? (
                    <p className="text-xs text-dim">Không có nhiệm vụ đã hoàn thành cần giữ.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {preview.preservedTasks.map((p) => (
                        <li key={p.taskCode} className="text-xs">
                          <span className="font-mono text-[10px] text-teal">{p.taskCode}</span>{" "}
                          <span className="text-dim">— {p.reason}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {preview.warnings.length > 0 ? (
                <div className="rounded-xl border border-amber/30 bg-amber/[0.06] px-4 py-3">
                  <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber">
                    <AlertTriangle className="size-3.5 icon" /> Cảnh báo
                  </p>
                  <ul className="space-y-1">
                    {preview.warnings.map((w) => (
                      <li key={w} className="text-[11px] leading-relaxed text-dim">
                        — {w}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <label className="flex items-start gap-2.5 rounded-xl border border-line bg-deep/60 px-4 py-3 text-xs leading-relaxed text-dim">
                <Checkbox checked={confirmed} onCheckedChange={(v) => setConfirmed(v === true)} className="mt-0.5" />
                <span>
                  Tôi đã kiểm tra kỹ danh sách nhiệm vụ chuyển giao, nhiệm vụ giữ nguyên và các cảnh báo trước khi phê
                  duyệt.
                </span>
              </label>

              <div className="space-y-1.5">
                <Label htmlFor="wizard-reason" className="text-xs font-medium text-dim">
                  Lý do phê duyệt (10–1000 ký tự) <span className="text-rose">*</span>
                </Label>
                <Textarea
                  id="wizard-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="VD: Vi phạm nhiều lần dù đã cảnh báo — thay bằng ứng viên cùng role còn dư năng lực…"
                  className="min-h-20 rounded-lg border-line bg-deep text-sm text-ink placeholder:text-faint focus-visible:ring-brand/30"
                />
                <p className={`text-[10px] ${reasonValid ? "text-faint" : "text-amber"}`}>
                  {reason.trim().length}/1000 ký tự (tối thiểu 10)
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  variant="outline"
                  className="rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
                  disabled={approving}
                  onClick={() => {
                    setStep(1);
                    setPreview(null);
                  }}
                >
                  <RotateCcw className="icon" /> Quay lại
                </Button>
                <Button
                  className="rounded-lg bg-brand font-semibold text-on-brand hover:bg-brand-bright"
                  disabled={!confirmed || !reasonValid || approving}
                  onClick={approve}
                >
                  {approving ? <InlineSpinner /> : <CheckCircle2 className="icon" />}
                  Phê duyệt & thay thành viên
                </Button>
              </div>
            </>
          ) : null}

          {/* ===== Bước 3: thành công ===== */}
          {step === 3 && result ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <span className="grid size-16 place-items-center rounded-2xl bg-brand/10 text-brand-bright">
                <CheckCircle2 className="size-8 icon" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">
                  Đã thay {result.fromName} bằng {result.toName}
                </p>
                <p className="mt-1 max-w-md text-xs leading-relaxed text-dim">
                  {result.transfers.length} nhiệm vụ mở đã chuyển giao · {result.preservedTaskCount} nhiệm vụ hoàn thành
                  được giữ nguyên · bàn giao trong {result.handoverHours} giờ.
                </p>
              </div>
              <div className="grid w-full max-w-md gap-2 rounded-xl border border-line bg-deep/60 p-4 text-left">
                <KeyValue label="Lý do">
                  <span className="text-[13px]">{result.reason}</span>
                </KeyValue>
                <KeyValue label="Nhiệm vụ chuyển">
                  <span className="font-mono text-[12px]">
                    {result.transfers.map((t) => t.taskCode).join(", ") || "—"}
                  </span>
                </KeyValue>
                <KeyValue label="Thực hiện bởi">{result.createdBy}</KeyValue>
              </div>
              <Button className="rounded-lg bg-brand text-on-brand hover:bg-brand-bright" onClick={onClose}>
                Hoàn tất
              </Button>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ==================== Lịch sử thay người ==================== */

function ReplacementsPanel({
  rows,
  loading,
  error,
  onRetry,
}: {
  rows: ReplacementRecord[];
  loading: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  return (
    <Panel>
      <PanelHeader
        title="Lịch sử thay thành viên"
        description={`${rows.length} lần thay đổi nhân sự của phiên`}
        icon={<History className="size-4 icon" />}
      />
      {loading ? (
        <LoadingBlock rows={3} />
      ) : error ? (
        <ErrorBlock error={error} onRetry={onRetry} />
      ) : rows.length === 0 ? (
        <Empty
          icon={<History />}
          title="Chưa có lần thay nào"
          description="Lịch sử thay thành viên của phiên sẽ được ghi lại ở đây."
        />
      ) : (
        <ul className="divide-y divide-line">
          {rows.map((r) => (
            <li key={r.id} className="px-5 py-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-semibold text-ink">{r.fromName}</span>
                <ArrowRightLeft className="size-3.5 icon text-brand-bright" />
                <span className="text-[13px] font-semibold text-ink">{r.toName}</span>
                <span className="ml-auto text-[10px] text-faint">{relativeTime(r.at)}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-dim">{r.reason}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <ToneBadge tone="brand">
                  {r.transfers.length} chuyển · {r.preservedTaskCount} giữ
                </ToneBadge>
                <ToneBadge tone="zinc">Bàn giao {r.handoverHours}h</ToneBadge>
                <span className="text-[10px] text-faint">bởi {r.createdBy}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/* ==================== Quyền GitHub sau bàn giao ==================== */

function RepoJobsPanel({
  sessionId,
  jobs,
  loading,
  error,
  onRetry,
  onChanged,
}: {
  sessionId: string;
  jobs: RepositoryAccessJob[];
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  onChanged: () => void;
}) {
  const [retryFor, setRetryFor] = React.useState<RepositoryAccessJob | null>(null);
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (retryFor) setReason("");
  }, [retryFor]);

  const handleRetry = () => {
    if (!retryFor) return;
    if (reason.trim().length < 10) {
      toast.error("Lý do cần tối thiểu 10 ký tự");
      return;
    }
    setBusy(true);
    participationApi
      .retryRepoAccessJob(sessionId, retryFor.id, {
        expectedRevision: retryFor.revision,
        reason: reason.trim(),
      })
      .then((res) => {
        toast.success(`Đã kích hoạt cấp lại quyền GitHub cho ${res.job.userName}`);
        setRetryFor(null);
        onChanged();
      })
      .catch((err) => {
        if (err instanceof ApiError && err.code === "REVISION_CONFLICT") {
          toast.error("Dữ liệu vừa được cập nhật bởi người khác — đang tải lại danh sách.");
          setRetryFor(null);
          onChanged();
          return;
        }
        toastError(err, "Không cấp lại được quyền");
      })
      .finally(() => setBusy(false));
  };

  return (
    <>
      <Panel>
        <PanelHeader
          title="Quyền GitHub sau bàn giao"
          description="Tự động cấp quyền repo khi thay thành viên — thử lại khi lời mời bị kẹt."
          icon={<GitBranch className="size-4 icon" />}
        />
        {loading ? (
          <LoadingBlock rows={3} />
        ) : error ? (
          <ErrorBlock error={error} onRetry={onRetry} />
        ) : jobs.length === 0 ? (
          <Empty
            icon={<GitBranch />}
            title="Không có job quyền nào"
            description="Các job cấp quyền GitHub phát sinh khi thay thành viên hoặc thêm người vào phiên."
          />
        ) : (
          <ul className="divide-y divide-line">
            {jobs.map((j) => (
              <li key={j.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <UserAvatar name={j.userName} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-semibold text-ink">{j.userName}</span>
                    <RepoJobStatusBadge status={j.displayStatus} />
                    <span className="font-mono text-[10px] text-faint">rev {j.revision}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-dim">{j.note}</p>
                  <p className="text-[10px] text-faint">{formatDateTime(j.at)}</p>
                </div>
                {j.displayStatus !== "done" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
                    onClick={() => setRetryFor(j)}
                  >
                    <RotateCcw className="size-3.5 icon" /> Thử lại
                  </Button>
                ) : (
                  <CheckCircle2 className="size-4 icon text-brand-bright" />
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <ConfirmDialog
        open={Boolean(retryFor)}
        onOpenChange={(open) => {
          if (!busy && !open) setRetryFor(null);
        }}
        title={`Cấp lại quyền GitHub cho ${retryFor?.userName ?? ""}?`}
        description="Hệ thống đối chiếu phiên bản khóa (revision) để tránh cấp trùng. Nếu người khác vừa thao tác, yêu cầu sẽ bị từ chối."
        confirmLabel="Thử lại"
        busy={busy}
        onConfirm={handleRetry}
      >
        <div className="space-y-1.5">
          <Label htmlFor="retry-reason" className="text-xs font-medium text-dim">
            Lý do thử lại (tối thiểu 10 ký tự) <span className="text-rose">*</span>
          </Label>
          <Textarea
            id="retry-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="VD: Lời mời collaborator bị kẹt sau bàn giao, kiểm tra lại…"
            className="min-h-20 rounded-lg border-line bg-deep text-sm text-ink placeholder:text-faint focus-visible:ring-brand/30"
          />
        </div>
      </ConfirmDialog>
    </>
  );
}
