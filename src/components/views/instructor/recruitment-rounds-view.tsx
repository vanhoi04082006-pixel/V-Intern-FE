"use client";

import * as React from "react";
import {
  ArrowLeft,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  FileText,
  Inbox,
  KeyRound,
  Lock,
  Mail,
  MailPlus,
  Plus,
  RotateCcw,
  SearchX,
  Send,
  Sparkles,
  Trash2,
  Unlock,
  UserCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  careerRoleApi,
  recruitmentRoundApi,
  type ApplicationStatus,
  type ApplicationRecordRow,
  type ApplySlot,
  type RoundStatus,
  type PublicCareerRole,
} from "@/lib/client/api";
import { ApiError } from "@/lib/client/http";
import { useResource } from "@/lib/client/use-resource";
import { formatDate, formatDateTime, relativeTime } from "@/lib/client/labels";
import { ViewFrame } from "@/components/shared/view";
import {
  Panel,
  PanelHeader,
  PageHeader,
  MetricCard,
  Empty,
  Pager,
  ToneBadge,
  AnimatedProgressBar,
  KeyValue,
} from "@/components/shared/primitives";
import { RoleBadge } from "@/components/shared/badges";
import { LoadingBlock, ErrorBlock, InlineSpinner } from "@/components/shared/states";
import { FilterBar, SearchInput, FilterSelect } from "@/components/shared/toolbar";
import { ConfirmDialog } from "@/components/shared/confirm";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScoreRing } from "./shared";

/* ==================== Nhãn & tone ==================== */

const roundStatusLabels: Record<RoundStatus, string> = {
  draft: "Bản nháp",
  open: "Đang mở",
  closed: "Đã đóng",
};

const roundStatusTones: Record<RoundStatus, "zinc" | "emerald" | "rose"> = {
  draft: "zinc",
  open: "emerald",
  closed: "rose",
};

function RoundStatusBadge({ status }: { status: RoundStatus }) {
  return (
    <ToneBadge tone={roundStatusTones[status] ?? "zinc"} dot>
      {roundStatusLabels[status] ?? status}
    </ToneBadge>
  );
}

/** 9 trạng thái hồ sơ ứng tuyển công khai — nhãn VI chuẩn theo spec. */
const applicationStatusMeta: Record<ApplicationStatus, { label: string; tone: "zinc" | "teal" | "amber" | "orange" | "violet" | "emerald" | "rose" }> = {
  unverified: { label: "Chưa xác minh", tone: "zinc" },
  queued: { label: "Đã xác minh", tone: "teal" },
  analyzing: { label: "Đang xử lý", tone: "amber" },
  needs_information: { label: "Chờ bổ sung", tone: "orange" },
  waitlisted: { label: "Danh sách chờ", tone: "violet" },
  booked: { label: "Đã đặt lịch", tone: "emerald" },
  cancelled: { label: "Đã hủy", tone: "zinc" },
  deferred: { label: "Tạm hoãn", tone: "amber" },
  failed: { label: "Thất bại", tone: "rose" },
};

function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const meta = applicationStatusMeta[status] ?? { label: status, tone: "zinc" as const };
  return (
    <ToneBadge tone={meta.tone} dot>
      {meta.label}
    </ToneBadge>
  );
}

const applicationStatusOptions = (Object.keys(applicationStatusMeta) as ApplicationStatus[]).map((value) => ({
  value,
  label: applicationStatusMeta[value].label,
}));

/** Toast lỗi chuẩn — 409 version conflict → thông báo tải lại. */
function toastError(err: unknown, fallback: string) {
  if (err instanceof ApiError && err.status === 409) {
    toast.error("Dữ liệu vừa được cập nhật bởi người khác — tải lại để tránh ghi đè.");
    return;
  }
  toast.error(err instanceof Error ? err.message : fallback);
}

const APPLICATIONS_PAGE_SIZE = 25;

/* ==================== View chính (2 tầng) ==================== */

export function InstructorRecruitmentRounds({ params }: { params: Record<string, string> }) {
  /** Tầng đang xem: null = danh sách đợt, có id = workspace đợt đó. */
  const [selectedId, setSelectedId] = React.useState<string | null>(params.id ?? null);

  return (
    <ViewFrame>
      {selectedId ? (
        <RoundWorkspace
          roundId={selectedId}
          onBack={() => setSelectedId(null)}
        />
      ) : (
        <RoundList onOpen={setSelectedId} />
      )}
    </ViewFrame>
  );
}

/* ==================== Tầng 1: danh sách đợt ==================== */

function RoundList({ onOpen }: { onOpen: (id: string) => void }) {
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [createOpen, setCreateOpen] = React.useState(false);

  const rounds = useResource(
    () =>
      recruitmentRoundApi.list({
        page,
        pageSize: 8,
        status: (status || undefined) as RoundStatus | undefined,
      }),
    [page, status]
  );

  const items = rounds.data?.data ?? [];
  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (r) =>
        r.name.toLowerCase().includes(needle) ||
        r.code.toLowerCase().includes(needle)
    );
  }, [items, q]);

  const totals = React.useMemo(() => {
    const open = items.filter((r) => r.status === "open").length;
    const apps = items.reduce((n, r) => n + r.applicationCount, 0);
    const booked = items.reduce((n, r) => n + r.bookedCount, 0);
    return { open, apps, booked };
  }, [items]);

  return (
    <>
      <PageHeader
        eyebrow="Tuyển dụng"
        title="Đợt tuyển & hồ sơ CV"
        description="Tạo đợt tuyển công khai, xếp khung giờ phỏng vấn theo vai trò và theo dõi hồ sơ ứng viên được Agent phân tích."
        actions={
          <Button className="rounded-lg bg-brand font-semibold text-on-brand hover:bg-brand-bright" onClick={() => setCreateOpen(true)}>
            <Plus className="icon" /> Tạo đợt mới
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <MetricCard label="Đợt đang mở" value={rounds.loading ? "…" : totals.open} hint="Nhận CV từ cổng công khai" icon={<CalendarPlus />} tone="brand" />
        <MetricCard label="Hồ sơ đã nộp" value={rounds.loading ? "…" : totals.apps} hint="Tổng các đợt trên trang" icon={<Inbox />} tone="teal" />
        <MetricCard label="Đã đặt lịch phỏng vấn" value={rounds.loading ? "…" : totals.booked} hint="Ứng viên đã nhận khung giờ" icon={<CalendarClock />} tone="amber" />
      </div>

      <FilterBar
        hasActive={Boolean(q || status)}
        onReset={() => {
          setQ("");
          setStatus("");
        }}
      >
        <SearchInput value={q} onChange={setQ} placeholder="Tìm theo mã, tên đợt…" className="w-full sm:w-72" />
        <FilterSelect
          value={status}
          onChange={setStatus}
          options={[
            { value: "draft", label: "Bản nháp" },
            { value: "open", label: "Đang mở" },
            { value: "closed", label: "Đã đóng" },
          ]}
          placeholder="Trạng thái"
          className="w-44"
          ariaLabel="Lọc theo trạng thái đợt"
        />
      </FilterBar>

      {rounds.loading ? (
        <LoadingBlock variant="cards" rows={4} />
      ) : rounds.error ? (
        <ErrorBlock error={rounds.error} onRetry={rounds.reload} />
      ) : filtered.length === 0 ? (
        <Panel>
          <Empty
            icon={<CalendarPlus />}
            title={q || status ? "Không có đợt tuyển khớp bộ lọc" : "Chưa có đợt tuyển nào"}
            description={
              q || status
                ? "Thử xóa bộ lọc hoặc đổi từ khóa tìm kiếm."
                : "Tạo đợt tuyển đầu tiên để mở cổng nộp CV công khai cho ứng viên."
            }
            action={
              <Button className="rounded-lg bg-brand text-on-brand hover:bg-brand-bright" onClick={() => setCreateOpen(true)}>
                <Plus className="icon" /> Tạo đợt mới
              </Button>
            }
          />
        </Panel>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map((r) => (
            <Panel key={r.id} hoverable className="group cursor-pointer p-5">
              <div
                role="button"
                tabIndex={0}
                onClick={() => onOpen(r.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpen(r.id);
                  }
                }}
                className="flex h-full flex-col text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] font-semibold tracking-wider text-brand-bright/80">{r.code}</div>
                    <h3 className="mt-0.5 line-clamp-1 text-sm font-semibold text-ink group-hover:text-brand-bright">{r.name}</h3>
                  </div>
                  <RoundStatusBadge status={r.status} />
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-dim">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-3.5 icon text-faint" />
                    {formatDate(r.opensAt)} — {formatDate(r.closesAt)}
                  </span>
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
                  <ToneBadge tone="teal">
                    <Users className="size-3 icon" /> {r.applicationCount} hồ sơ
                  </ToneBadge>
                  <ToneBadge tone="brand">
                    <CalendarClock className="size-3 icon" /> {r.openSlotCount}/{r.slotCount} khung giờ mở
                  </ToneBadge>
                  <ToneBadge tone="amber">
                    <UserCheck className="size-3 icon" /> {r.bookedCount} đã đặt
                  </ToneBadge>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}

      {rounds.data && rounds.data.meta.totalPages > 1 ? (
        <Panel className="mt-4">
          <Pager page={rounds.data.meta.page} totalPages={rounds.data.meta.totalPages} total={rounds.data.meta.total} onChange={setPage} />
        </Panel>
      ) : null}

      <CreateRoundDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          rounds.reload();
        }}
      />
    </>
  );
}

/* ==================== Dialog tạo đợt ==================== */

function CreateRoundDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [name, setName] = React.useState("");
  const [opensAt, setOpensAt] = React.useState("");
  const [closesAt, setClosesAt] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setName("");
      setOpensAt("");
      setClosesAt("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên đợt tuyển");
      return;
    }
    if (!opensAt || !closesAt) {
      toast.error("Vui lòng chọn thời gian mở và đóng nhận CV");
      return;
    }
    if (new Date(closesAt) <= new Date(opensAt)) {
      toast.error("Thời gian đóng phải sau thời gian mở");
      return;
    }
    setSubmitting(true);
    try {
      const round = await recruitmentRoundApi.create({
        name: name.trim(),
        opensAt: new Date(opensAt).toISOString(),
        closesAt: new Date(closesAt).toISOString(),
      });
      toast.success(`Đã tạo đợt tuyển ${round.code} — trạng thái bản nháp`);
      onOpenChange(false);
      onCreated();
    } catch (err) {
      toastError(err, "Không tạo được đợt tuyển");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl border-line bg-panel p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-line px-6 pt-6">
          <DialogTitle className="text-left text-base font-semibold text-ink">Tạo đợt tuyển mới</DialogTitle>
          <DialogDescription className="text-left text-xs leading-relaxed text-dim">
            Đợt mới ở trạng thái bản nháp. Thêm khung giờ phỏng vấn rồi mở nhận CV khi sẵn sàng.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <Label htmlFor="round-name" className="text-xs font-medium text-dim">
              Tên đợt tuyển <span className="text-rose">*</span>
            </Label>
            <Input
              id="round-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Thực tập Hè 2027"
              className="h-10 rounded-lg border-line bg-deep text-sm text-ink focus-visible:ring-brand/30"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="round-opens" className="text-xs font-medium text-dim">
                Mở nhận CV <span className="text-rose">*</span>
              </Label>
              <Input
                id="round-opens"
                type="datetime-local"
                value={opensAt}
                onChange={(e) => setOpensAt(e.target.value)}
                className="h-10 rounded-lg border-line bg-deep text-sm text-ink focus-visible:ring-brand/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="round-closes" className="text-xs font-medium text-dim">
                Đóng nhận CV <span className="text-rose">*</span>
              </Label>
              <Input
                id="round-closes"
                type="datetime-local"
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
                className="h-10 rounded-lg border-line bg-deep text-sm text-ink focus-visible:ring-brand/30"
              />
            </div>
          </div>
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
            {submitting ? <InlineSpinner /> : <Plus className="icon" />}
            Tạo đợt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ==================== Tầng 2: workspace một đợt ==================== */

function RoundWorkspace({ roundId, onBack }: { roundId: string; onBack: () => void }) {
  const [closingSlot, setClosingSlot] = React.useState<ApplySlot | null>(null);
  const [closingBusy, setClosingBusy] = React.useState(false);
  const [statusBusy, setStatusBusy] = React.useState(false);
  const [slotDialogOpen, setSlotDialogOpen] = React.useState(false);
  const [tab, setTab] = React.useState("slots");

  const round = useResource(() => recruitmentRoundApi.detail(roundId), [roundId]);

  const data = round.data;
  const record = data?.round ?? null;

  const handleCloseSlot = () => {
    if (!closingSlot) return;
    setClosingBusy(true);
    recruitmentRoundApi
      .closeSlot(roundId, closingSlot.id)
      .then(() => {
        toast.success(`Đã đóng khung giờ ${closingSlot.roleLabel} — ${formatDateTime(closingSlot.startsAt)}`);
        setClosingSlot(null);
        round.reload();
      })
      .catch((err) => toastError(err, "Không đóng được khung giờ"))
      .finally(() => setClosingBusy(false));
  };

  const handleSetStatus = (status: RoundStatus) => {
    setStatusBusy(true);
    recruitmentRoundApi
      .setStatus(roundId, status)
      .then(() => {
        toast.success(
          status === "open"
            ? "Đã mở nhận CV — cổng công khai bắt đầu hiển thị đợt này"
            : "Đã đóng nhận CV"
        );
        round.reload();
      })
      .catch((err) => toastError(err, "Không đổi được trạng thái đợt"))
      .finally(() => setStatusBusy(false));
  };

  if (round.loading) {
    return <LoadingBlock variant="detail" rows={7} />;
  }

  if (round.error || !data || !record) {
    return <ErrorBlock error={round.error ?? new Error("Không tìm thấy đợt tuyển")} onRetry={round.reload} />;
  }

  const nextStatus: RoundStatus | null =
    record.status === "draft" ? "open" : record.status === "open" ? "closed" : "open";

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-dim transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5 icon" /> Về danh sách đợt tuyển
      </button>

      <PageHeader
        eyebrow={record.code}
        title={record.name}
        description={`Mở CV ${formatDateTime(record.opensAt)} · Đóng ${formatDateTime(record.closesAt)}`}
        actions={<RoundStatusBadge status={record.status} />}
      />

      {/* Panel mở/đóng nhận CV + thống kê nhanh */}
      <Panel className="mb-6 p-5">
        <div className="grid gap-4 lg:grid-cols-4">
          <KeyValue label="Hồ sơ đã nộp">
            <span className="font-mono text-lg font-bold">{record.applicationCount}</span>
          </KeyValue>
          <KeyValue label="Khung giờ">
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="size-3.5 icon text-faint" />
              {record.openSlotCount}/{record.slotCount} đang mở
            </span>
          </KeyValue>
          <KeyValue label="Chính sách đổi lịch">
            <span className="text-[13px]">
              Tối đa {data.policy.maxRebookingAttempts} lần · chờ {data.policy.rebookingCooldownMinutes} phút
            </span>
          </KeyValue>
          <KeyValue label="Nhận CV">
            <Button
              size="sm"
              variant={nextStatus === "closed" ? "outline" : "default"}
              disabled={statusBusy}
              className={
                nextStatus === "closed"
                  ? "rounded-lg border-rose/40 bg-transparent text-rose hover:bg-rose/10"
                  : "rounded-lg bg-brand text-on-brand hover:bg-brand-bright"
              }
              onClick={() => nextStatus && handleSetStatus(nextStatus)}
            >
              {statusBusy ? (
                <InlineSpinner />
              ) : nextStatus === "open" ? (
                <Unlock className="icon" />
              ) : (
                <Lock className="icon" />
              )}
              {record.status === "draft" ? "Mở nhận CV" : record.status === "open" ? "Đóng nhận CV" : "Mở lại nhận CV"}
            </Button>
          </KeyValue>
        </div>
      </Panel>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl border border-line bg-deep/60 p-1 sm:w-fit">
          <TabsTrigger
            value="slots"
            className="h-9 gap-1.5 rounded-lg px-3.5 text-[13px] font-medium text-dim data-[state=active]:bg-brand/12 data-[state=active]:text-brand-bright data-[state=active]:shadow-none"
          >
            <CalendarClock className="size-3.5 icon" /> Khung giờ phỏng vấn
          </TabsTrigger>
          <TabsTrigger
            value="applications"
            className="h-9 gap-1.5 rounded-lg px-3.5 text-[13px] font-medium text-dim data-[state=active]:bg-brand/12 data-[state=active]:text-brand-bright data-[state=active]:shadow-none"
          >
            <FileText className="size-3.5 icon" /> Hồ sơ ứng viên
            <span className="font-mono text-[11px] text-faint">{record.applicationCount}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="slots">
          <SlotsTab
            roundId={roundId}
            slots={data.slots}
            policyMinPrep={data.policy.minimumPreparationMinutesDefault}
            policyLead={data.policy.credentialsLeadMinutesDefault}
            onAddSlot={() => setSlotDialogOpen(true)}
            onCloseSlot={setClosingSlot}
          />
        </TabsContent>
        <TabsContent value="applications">
          <ApplicationsTab roundId={roundId} />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={Boolean(closingSlot)}
        onOpenChange={(open) => {
          if (!closingBusy && !open) setClosingSlot(null);
        }}
        title="Đóng khung giờ phỏng vấn?"
        description={
          closingSlot
            ? `Khung giờ ${closingSlot.roleLabel} ngày ${formatDateTime(closingSlot.startsAt)} sẽ không nhận thêm đặt lịch. ${closingSlot.bookedCount} lịch đã đặt vẫn được giữ nguyên.`
            : ""
        }
        confirmLabel="Đóng khung giờ"
        destructive
        busy={closingBusy}
        onConfirm={handleCloseSlot}
      />

      <AddSlotDialog
        open={slotDialogOpen}
        onOpenChange={setSlotDialogOpen}
        roundId={roundId}
        defaultPrep={data.policy.minimumPreparationMinutesDefault}
        defaultLead={data.policy.credentialsLeadMinutesDefault}
        onAdded={() => round.reload()}
      />
    </>
  );
}

/* ==================== Tab: khung giờ ==================== */

function SlotsTab({
  roundId,
  slots,
  policyMinPrep,
  policyLead,
  onAddSlot,
  onCloseSlot,
}: {
  roundId: string;
  slots: ApplySlot[];
  policyMinPrep: number;
  policyLead: number;
  onAddSlot: () => void;
  onCloseSlot: (slot: ApplySlot) => void;
}) {
  if (slots.length === 0) {
    return (
      <Panel>
        <Empty
          icon={<CalendarClock />}
          title="Chưa có khung giờ nào"
          description="Thêm khung giờ phỏng vấn theo vai trò — chỉ vai trò đã xuất bản và đủ ≥10 câu hỏi trong ngân hàng mới mở được."
          action={
            <Button className="rounded-lg bg-brand text-on-brand hover:bg-brand-bright" onClick={onAddSlot}>
              <Plus className="icon" /> Thêm khung giờ
            </Button>
          }
        />
      </Panel>
    );
  }

  return (
    <Panel>
      <PanelHeader
        title="Khung giờ phỏng vấn"
        description={`${slots.length} khung giờ · ${slots.filter((s) => s.status === "open").length} đang mở`}
        icon={<CalendarClock className="size-4 icon" />}
        actions={
          <Button size="sm" className="rounded-lg bg-brand text-on-brand hover:bg-brand-bright" onClick={onAddSlot}>
            <Plus className="icon" /> Thêm khung giờ
          </Button>
        }
      />
      <ul className="divide-y divide-line">
        {slots.map((slot) => {
          const pct = slot.capacity > 0 ? Math.round((slot.bookedCount / slot.capacity) * 100) : 0;
          return (
            <li key={slot.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <RoleBadge role={slot.roleCode} />
                  <span className="text-[13px] font-semibold text-ink">{slot.roleLabel}</span>
                  <ToneBadge tone={slot.status === "open" ? "emerald" : "zinc"} dot>
                    {slot.status === "open" ? "Đang mở" : "Đã đóng"}
                  </ToneBadge>
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-dim">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="size-3 icon text-faint" />
                    {formatDateTime(slot.startsAt)} — {formatDateTime(slot.endsAt)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="size-3 icon text-faint" />
                    Chuẩn bị tối thiểu {slot.minimumPreparationMinutes} phút
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <KeyRound className="size-3 icon text-faint" />
                    Gửi credential trước {slot.credentialsLeadMinutes} phút
                  </span>
                </p>
                <p className="mt-0.5 truncate text-[11px] text-faint">{slot.location}</p>
              </div>
              <div className="w-full sm:w-40">
                <div className="mb-1 flex items-center justify-between text-[11px] text-dim">
                  <span>Đã đặt</span>
                  <span className="font-mono font-semibold text-ink">
                    {slot.bookedCount}/{slot.capacity}
                  </span>
                </div>
                <AnimatedProgressBar value={pct} tone={slot.remaining > 0 ? "brand" : "rose"} />
              </div>
              {slot.status === "open" ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg border-rose/30 text-rose hover:bg-rose/10"
                  onClick={() => onCloseSlot(slot)}
                >
                  <Lock className="icon" /> Đóng
                </Button>
              ) : (
                <ToneBadge tone="zinc">Khung giờ đóng</ToneBadge>
              )}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

/* ==================== Dialog thêm khung giờ ==================== */

function AddSlotDialog({
  open,
  onOpenChange,
  roundId,
  defaultPrep,
  defaultLead,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roundId: string;
  defaultPrep: number;
  defaultLead: number;
  onAdded: () => void;
}) {
  const [roleCode, setRoleCode] = React.useState("");
  const [startsAt, setStartsAt] = React.useState("");
  const [endsAt, setEndsAt] = React.useState("");
  const [capacity, setCapacity] = React.useState("4");
  const [location, setLocation] = React.useState("");
  const [prep, setPrep] = React.useState(String(defaultPrep));
  const [lead, setLead] = React.useState(String(defaultLead));
  const [submitting, setSubmitting] = React.useState(false);

  const roles = useResource(() => careerRoleApi.publicList(), []);

  React.useEffect(() => {
    if (open) {
      setRoleCode("");
      setStartsAt("");
      setEndsAt("");
      setCapacity("4");
      setLocation("");
      setPrep(String(defaultPrep));
      setLead(String(defaultLead));
    }
  }, [open, defaultPrep, defaultLead]);

  const roleOptions = roles.data?.data ?? [];

  const handleSubmit = async () => {
    if (!roleCode) {
      toast.error("Vui lòng chọn vai trò phỏng vấn");
      return;
    }
    if (!startsAt || !endsAt) {
      toast.error("Vui lòng chọn thời gian bắt đầu và kết thúc");
      return;
    }
    if (new Date(endsAt) <= new Date(startsAt)) {
      toast.error("Thời gian kết thúc phải sau thời gian bắt đầu");
      return;
    }
    const cap = Number(capacity);
    if (!Number.isFinite(cap) || cap < 1) {
      toast.error("Sức chứa phải ≥ 1");
      return;
    }
    setSubmitting(true);
    try {
      const slot = await recruitmentRoundApi.addSlot(roundId, {
        roleCode,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        capacity: cap,
        minimumPreparationMinutes: Number(prep) || defaultPrep,
        credentialsLeadMinutes: Number(lead) || defaultLead,
        location: location.trim() || undefined,
      });
      toast.success(`Đã thêm khung giờ ${slot.roleLabel} — ${formatDateTime(slot.startsAt)}`);
      onOpenChange(false);
      onAdded();
    } catch (err) {
      if (err instanceof ApiError && (err.code === "ROLE_NOT_PUBLISHED" || err.code === "INSUFFICIENT_QUESTIONS")) {
        toast.error(err.message);
        return;
      }
      toastError(err, "Không thêm được khung giờ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl border-line bg-panel p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-line px-6 pt-6">
          <DialogTitle className="text-left text-base font-semibold text-ink">Thêm khung giờ phỏng vấn</DialogTitle>
          <DialogDescription className="text-left text-xs leading-relaxed text-dim">
            Khung giờ chỉ đặt được cho vai trò đã xuất bản (published) và có đủ câu hỏi phỏng vấn trong ngân hàng.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-dim">
              Vai trò <span className="text-rose">*</span>
            </Label>
            {roles.loading ? (
              <div className="flex items-center gap-2 py-2 text-xs text-dim">
                <InlineSpinner /> Đang tải thư viện nghề…
              </div>
            ) : roleOptions.length === 0 ? (
              <p className="rounded-lg border border-line bg-deep/60 px-3 py-2 text-xs text-dim">
                Chưa có vai trò nào đang nhận hồ sơ.
              </p>
            ) : (
              <Select value={roleCode} onValueChange={setRoleCode}>
                <SelectTrigger className="h-10 w-full rounded-lg border-line bg-deep text-sm text-ink">
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent className="border-line bg-panel-2 text-ink">
                  {roleOptions.map((r: PublicCareerRole) => (
                    <SelectItem key={r.code} value={r.code}>
                      {r.name} ({r.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="slot-starts" className="text-xs font-medium text-dim">
                Bắt đầu <span className="text-rose">*</span>
              </Label>
              <Input
                id="slot-starts"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="h-10 rounded-lg border-line bg-deep text-sm text-ink focus-visible:ring-brand/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slot-ends" className="text-xs font-medium text-dim">
                Kết thúc <span className="text-rose">*</span>
              </Label>
              <Input
                id="slot-ends"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="h-10 rounded-lg border-line bg-deep text-sm text-ink focus-visible:ring-brand/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slot-cap" className="text-xs font-medium text-dim">
                Sức chứa <span className="text-rose">*</span>
              </Label>
              <Input
                id="slot-cap"
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="h-10 rounded-lg border-line bg-deep text-sm text-ink focus-visible:ring-brand/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slot-location" className="text-xs font-medium text-dim">
                Địa điểm
              </Label>
              <Input
                id="slot-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Phòng ảo A.101 — Google Meet"
                className="h-10 rounded-lg border-line bg-deep text-sm text-ink focus-visible:ring-brand/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slot-prep" className="text-xs font-medium text-dim">
                Chuẩn bị tối thiểu (phút)
              </Label>
              <Input
                id="slot-prep"
                type="number"
                min={0}
                value={prep}
                onChange={(e) => setPrep(e.target.value)}
                className="h-10 rounded-lg border-line bg-deep text-sm text-ink focus-visible:ring-brand/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slot-lead" className="text-xs font-medium text-dim">
                Gửi credential trước (phút)
              </Label>
              <Input
                id="slot-lead"
                type="number"
                min={0}
                value={lead}
                onChange={(e) => setLead(e.target.value)}
                className="h-10 rounded-lg border-line bg-deep text-sm text-ink focus-visible:ring-brand/30"
              />
            </div>
          </div>
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
            {submitting ? <InlineSpinner /> : <Plus className="icon" />}
            Thêm khung giờ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ==================== Tab: hồ sơ ứng viên ==================== */

function ApplicationsTab({ roundId }: { roundId: string }) {
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [detailId, setDetailId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setPage(1);
  }, [q, status]);

  const apps = useResource(
    () =>
      recruitmentRoundApi.applications(roundId, {
        page,
        pageSize: APPLICATIONS_PAGE_SIZE,
        status: (status || undefined) as ApplicationStatus | undefined,
        search: q || undefined,
      }),
    [roundId, page, status, q]
  );

  const rows = apps.data?.data ?? [];

  return (
    <div className="space-y-4">
      <FilterBar
        hasActive={Boolean(q || status)}
        onReset={() => {
          setQ("");
          setStatus("");
        }}
      >
        <SearchInput value={q} onChange={setQ} placeholder="Tìm theo tên, email…" className="w-full sm:w-72" />
        <FilterSelect
          value={status}
          onChange={setStatus}
          options={applicationStatusOptions}
          placeholder="Trạng thái hồ sơ"
          className="w-48"
          ariaLabel="Lọc theo trạng thái hồ sơ"
        />
      </FilterBar>

      {apps.loading ? (
        <LoadingBlock rows={6} />
      ) : apps.error ? (
        <ErrorBlock error={apps.error} onRetry={apps.reload} />
      ) : rows.length === 0 ? (
        <Panel>
          <Empty
            icon={<SearchX />}
            title={q || status ? "Không có hồ sơ khớp bộ lọc" : "Chưa có hồ sơ nào"}
            description={
              q || status
                ? "Thử xóa bộ lọc hoặc đổi từ khóa tìm kiếm."
                : "Hồ sơ sẽ xuất hiện khi ứng viên nộp CV qua cổng công khai của đợt này."
            }
          />
        </Panel>
      ) : (
        <Panel className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-line hover:bg-transparent">
                <TableHead className="px-4 text-[11px] uppercase tracking-wide text-faint">Ứng viên</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide text-faint">Email</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide text-faint">Trạng thái</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide text-faint">Vai trò khớp</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide text-faint">Confidence</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide text-faint">Nộp lúc</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer border-line transition-colors hover:bg-panel-2"
                  onClick={() => setDetailId(row.id)}
                >
                  <TableCell className="max-w-[220px] px-4 py-3">
                    <p className="truncate text-[13px] font-semibold text-ink">{row.fullName}</p>
                    <p className="truncate text-[11px] text-faint">{row.cvFileName ?? "Chưa có CV"}</p>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="font-mono text-[11px] text-dim">{row.emailHint}</span>
                  </TableCell>
                  <TableCell className="py-3">
                    <ApplicationStatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="py-3">
                    {row.matchedRole ? <RoleBadge role={row.matchedRole} /> : <span className="text-xs text-faint">—</span>}
                  </TableCell>
                  <TableCell className="py-3">
                    {row.confidence !== null ? (
                      <span className="font-mono text-xs font-semibold text-ink">{row.confidence}%</span>
                    ) : (
                      <span className="text-xs text-faint">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-[11px] text-faint">{formatDate(row.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {apps.data && apps.data.meta.totalPages > 1 ? (
            <Pager
              page={apps.data.meta.page}
              totalPages={apps.data.meta.totalPages}
              total={apps.data.meta.total}
              onChange={setPage}
            />
          ) : null}
        </Panel>
      )}

      {detailId ? (
        <ApplicationDetailDialog
          roundId={roundId}
          applicationId={detailId}
          onOpenChange={(open) => {
            if (!open) {
              setDetailId(null);
              apps.reload();
            }
          }}
        />
      ) : null}
    </div>
  );
}

/* ==================== Dialog chi tiết hồ sơ ==================== */

const timelineKindIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  submitted: FileText,
  email_sent: Mail,
  email_verified: CheckCircle2,
  analysis_completed: Sparkles,
  needs_information: Inbox,
  cv_updated: FileText,
  status_changed: RotateCcw,
  waitlisted: Users,
  slot_booked: CalendarPlus,
  slot_rescheduled: CalendarClock,
  slot_released: RotateCcw,
  cancelled: Trash2,
  credentials_sent: KeyRound,
  credentials_resent: Send,
  credentials_recovered: KeyRound,
};

function ApplicationDetailDialog({
  roundId,
  applicationId,
  onOpenChange,
}: {
  roundId: string;
  applicationId: string;
  onOpenChange: (open: boolean) => void;
}) {
  const detail = useResource(
    () => recruitmentRoundApi.applicationDetail(roundId, applicationId),
    [roundId, applicationId]
  );
  const [busy, setBusy] = React.useState(false);

  /* --- dời lịch --- */
  const [rescheduleOpen, setRescheduleOpen] = React.useState(false);
  const [rescheduleSlot, setRescheduleSlot] = React.useState("");
  const [rescheduleNote, setRescheduleNote] = React.useState("");

  /* --- hủy hồ sơ --- */
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState("");

  /* --- khôi phục tài khoản --- */
  const [recoveryInfo, setRecoveryInfo] = React.useState<{
    canRecover: boolean;
    reason: string | null;
    expectedRevision: number;
    hasAccount: boolean;
  } | null>(null);
  const [recoveryOpen, setRecoveryOpen] = React.useState(false);
  const [recoveryReason, setRecoveryReason] = React.useState("");

  /* --- gửi lại credential --- */
  const [resendAck, setResendAck] = React.useState(false);
  const [needAck, setNeedAck] = React.useState(false);

  const data = detail.data;

  const refresh = React.useCallback(() => detail.reload(), [detail]);

  const handleResend = async () => {
    setBusy(true);
    try {
      const res = await recruitmentRoundApi.resendCredentials(roundId, applicationId, needAck && resendAck ? true : undefined);
      toast.success(
        `Đã xếp hàng gửi lại email đăng nhập (trạng thái: ${res.status}) — mật khẩu tạm chỉ hiển thị trong email của ứng viên`
      );
      setNeedAck(false);
      setResendAck(false);
      refresh();
    } catch (err) {
      if (err instanceof ApiError && err.code === "UNCERTAIN_ACKNOWLEDGE_REQUIRED") {
        setNeedAck(true);
        toast.error("Email trước đó ở trạng thái không xác định — cần xác nhận trước khi gửi lại");
        return;
      }
      toastError(err, "Không gửi lại được email");
    } finally {
      setBusy(false);
    }
  };

  const openRecovery = () => {
    setRecoveryInfo(null);
    setRecoveryReason("");
    setRecoveryOpen(true);
    recruitmentRoundApi
      .credentialRecovery(roundId, applicationId)
      .then((info) => setRecoveryInfo(info))
      .catch((err) => toastError(err, "Không kiểm tra được điều kiện khôi phục"));
  };

  const handleRecover = () => {
    if (!recoveryInfo) return;
    if (recoveryReason.trim().length < 10) {
      toast.error("Lý do khôi phục cần tối thiểu 10 ký tự");
      return;
    }
    setBusy(true);
    recruitmentRoundApi
      .recoverCredentials(roundId, applicationId, {
        expectedRevision: recoveryInfo.expectedRevision,
        reason: recoveryReason.trim(),
      })
      .then((res) => {
        toast.success(
          res.accountCreated
            ? "Đã tạo tài khoản intern (pending) và gửi email mật khẩu tạm — mật khẩu chỉ nằm trong email của ứng viên"
            : "Email đã được gửi tới tài khoản hiện có — mật khẩu tạm chỉ hiển thị trong email của ứng viên"
        );
        setRecoveryOpen(false);
        refresh();
      })
      .catch((err) => toastError(err, "Không khôi phục được tài khoản"))
      .finally(() => setBusy(false));
  };

  const handleCancelApplication = () => {
    if (cancelReason.trim().length < 10) {
      toast.error("Lý do hủy cần tối thiểu 10 ký tự");
      return;
    }
    setBusy(true);
    recruitmentRoundApi
      .cancelApplication(roundId, applicationId, cancelReason.trim())
      .then(() => {
        toast.success("Đã hủy hồ sơ — nếu có lịch phỏng vấn, khung giờ được giải phóng");
        setCancelOpen(false);
        setCancelReason("");
        refresh();
      })
      .catch((err) => toastError(err, "Không hủy được hồ sơ"))
      .finally(() => setBusy(false));
  };

  const handleReschedule = () => {
    if (!rescheduleSlot) {
      toast.error("Vui lòng chọn khung giờ mới");
      return;
    }
    setBusy(true);
    recruitmentRoundApi
      .reschedule(roundId, applicationId, rescheduleSlot)
      .then(() => {
        toast.success(
          rescheduleNote.trim()
            ? `Đã dời lịch${rescheduleNote.trim() ? ` — ghi chú: ${rescheduleNote.trim()}` : ""} (không tốn lượt đổi của ứng viên)`
            : "Đã dời lịch phỏng vấn — không tốn lượt đổi của ứng viên"
        );
        setRescheduleOpen(false);
        setRescheduleSlot("");
        setRescheduleNote("");
        refresh();
      })
      .catch((err) => toastError(err, "Không dời được lịch"))
      .finally(() => setBusy(false));
  };

  const app = data?.application ?? null;
  const analysis = data?.analysis ?? null;
  const policy = data?.rebookingPolicy ?? null;
  const timeline = data?.timeline ?? [];

  return (
    <>
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto rounded-2xl border-line bg-panel p-0">
          {detail.loading ? (
            <div className="px-6 py-10">
              <LoadingBlock rows={5} />
            </div>
          ) : detail.error || !app ? (
            <div className="px-6 py-10">
              <ErrorBlock error={detail.error ?? new Error("Không tìm thấy hồ sơ")} onRetry={refresh} />
            </div>
          ) : (
            <>
              <DialogHeader className="border-b border-line px-6 pt-6">
                <div className="flex flex-wrap items-center gap-2">
                  <ApplicationStatusBadge status={app.status} />
                  {app.matchedRole ? <RoleBadge role={app.matchedRole} /> : null}
                  {app.hasAccount ? <ToneBadge tone="brand">Đã có tài khoản</ToneBadge> : null}
                  <span className="ml-auto font-mono text-[10px] text-faint">Nộp {relativeTime(app.createdAt)}</span>
                </div>
                <DialogTitle className="text-left text-lg font-semibold text-ink">{app.fullName}</DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 text-left text-xs text-dim">
                  <span className="font-mono">{app.emailHint}</span>
                  {app.cvFileName ? <span>CV: {app.cvFileName}</span> : <span>Chưa nộp CV</span>}
                  {app.booking ? (
                    <span className="inline-flex items-center gap-1 text-emerald">
                      <CalendarClock className="size-3 icon" /> {formatDateTime(app.booking.startsAt)}
                    </span>
                  ) : null}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 px-6 py-5">
                {/* Phân tích Agent */}
                <section>
                  <h4 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">
                    <Sparkles className="size-3.5 icon text-brand-bright" /> Phân tích CV bởi Agent
                  </h4>
                  {analysis ? (
                    <div className="rounded-xl border border-line bg-deep/60 p-4">
                      <div className="flex flex-wrap items-center gap-4">
                        <ScoreRing score={analysis.confidence} size={84} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-ink">
                            Vai trò khớp nhất: {analysis.matchedRoleLabel}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-dim">{analysis.summary}</p>
                          <p className="mt-1 text-[10px] text-faint">Phân tích lúc {formatDateTime(analysis.analyzedAt)}</p>
                        </div>
                      </div>
                      {analysis.facts.length > 0 ? (
                        <div className="mt-4 border-t border-line pt-3">
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
                            Bằng chứng kỹ năng
                          </p>
                          <ul className="space-y-1.5">
                            {analysis.facts.map((f) => (
                              <li key={f.skill} className="flex flex-wrap items-baseline gap-2 text-xs">
                                <ToneBadge tone="teal">{f.skill}</ToneBadge>
                                <span className="min-w-0 flex-1 text-dim">{f.evidence}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {analysis.missing.length > 0 ? (
                        <div className="mt-3 border-t border-line pt-3">
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
                            Kỹ năng còn thiếu
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {analysis.missing.map((m) => (
                              <ToneBadge key={m} tone="amber">
                                {m}
                              </ToneBadge>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="rounded-xl border border-line bg-deep/60 px-4 py-3 text-xs text-dim">
                      Agent chưa phân tích CV — hồ sơ đang chờ trong hàng đợi.
                    </p>
                  )}
                </section>

                {/* Timeline dọc */}
                <section>
                  <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
                    Dòng thời gian xử lý
                  </h4>
                  {timeline.length === 0 ? (
                    <p className="rounded-xl border border-line bg-deep/60 px-4 py-3 text-xs text-dim">
                      Chưa có sự kiện nào.
                    </p>
                  ) : (
                    <ol className="relative rounded-xl border border-line bg-deep/60 px-4 py-4">
                      {timeline.map((e, i) => {
                        const Icon = timelineKindIcons[e.kind] ?? FileText;
                        return (
                          <li key={e.id} className="relative flex gap-3 pb-4 last:pb-0">
                            {i < timeline.length - 1 ? (
                              <span
                                className="absolute left-[15px] top-8 h-full w-px bg-gradient-to-b from-line to-line/40"
                                aria-hidden
                              />
                            ) : null}
                            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-panel-2 text-dim">
                              <Icon className="size-3.5 icon" />
                            </span>
                            <div className="min-w-0 flex-1 pt-1">
                              <p className="text-xs leading-relaxed text-ink">{e.message}</p>
                              <p className="mt-0.5 text-[10px] text-faint">
                                {e.actor} · {formatDateTime(e.at)}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </section>

                {/* Chính sách đặt lại lịch */}
                {policy ? (
                  <section className="rounded-xl border border-line bg-deep/60 p-4">
                    <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
                      Chính sách dời lịch của ứng viên
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <KeyValue label="Lượt đổi còn">
                        <span className="font-mono text-base font-bold text-ink">{policy.attemptsRemaining}</span>
                      </KeyValue>
                      <KeyValue label="Đã dùng">
                        <span className="font-mono">{policy.attemptsUsed}</span>
                      </KeyValue>
                      <KeyValue label="Vai trò cho phép">
                        <span className="flex flex-wrap gap-1">
                          {policy.allowedRoleCodes.map((c) => (
                            <RoleBadge key={c} role={c} />
                          ))}
                        </span>
                      </KeyValue>
                    </div>
                    {policy.nextEligibleAt ? (
                      <p className="mt-2 text-[11px] text-amber">
                        Lượt đổi kế tiếp từ {formatDateTime(policy.nextEligibleAt)}
                      </p>
                    ) : null}
                  </section>
                ) : null}

                {/* Hành động */}
                <section className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
                    disabled={busy || app.status === "cancelled"}
                    onClick={() => {
                      setRescheduleSlot("");
                      setRescheduleNote("");
                      setRescheduleOpen(true);
                    }}
                  >
                    <CalendarClock className="icon" /> Dời lịch
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
                    disabled={busy}
                    onClick={openRecovery}
                  >
                    <KeyRound className="icon" /> Khôi phục tài khoản
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
                    disabled={busy}
                    onClick={handleResend}
                  >
                    {busy ? <InlineSpinner /> : <MailPlus className="icon" />} Gửi lại email đăng nhập
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg border-rose/30 text-rose hover:bg-rose/10"
                    disabled={busy || app.status === "cancelled"}
                    onClick={() => {
                      setCancelReason("");
                      setCancelOpen(true);
                    }}
                  >
                    <Trash2 className="icon" /> Hủy hồ sơ
                  </Button>
                </section>

                {needAck ? (
                  <label className="flex items-start gap-2.5 rounded-xl border border-amber/30 bg-amber/[0.06] px-4 py-3 text-xs leading-relaxed text-dim">
                    <Checkbox checked={resendAck} onCheckedChange={(v) => setResendAck(v === true)} className="mt-0.5" />
                    <span>
                      Email đăng nhập gần nhất ở trạng thái <b className="text-amber">không xác định</b>. Tôi xác nhận đã
                      kiểm tra với ứng viên và muốn gửi lại một mật khẩu tạm mới.
                    </span>
                  </label>
                ) : null}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog chọn khung giờ dời lịch */}
      <RescheduleDialog
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        roundId={roundId}
        application={data?.application ?? null}
        busy={busy}
        selectedSlot={rescheduleSlot}
        onSelectSlot={setRescheduleSlot}
        note={rescheduleNote}
        onNoteChange={setRescheduleNote}
        onConfirm={handleReschedule}
      />

      {/* Dialog hủy hồ sơ */}
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={(open) => {
          if (!busy) setCancelOpen(open);
        }}
        title="Hủy hồ sơ ứng viên?"
        description={
          app
            ? `Hồ sơ của ${app.fullName} chuyển sang đã hủy. ${app.booking ? "Khung giờ đã đặt sẽ được giải phóng cho người khác." : ""} Hành động không thể hoàn tác.`
            : ""
        }
        confirmLabel="Xác nhận hủy"
        destructive
        busy={busy}
        onConfirm={handleCancelApplication}
      >
        <div className="space-y-1.5">
          <Label htmlFor="cancel-reason" className="text-xs font-medium text-dim">
            Lý do hủy (tối thiểu 10 ký tự) <span className="text-rose">*</span>
          </Label>
          <Textarea
            id="cancel-reason"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="VD: Ứng viên xin rút hồ sơ vì trúng tuyển chỗ khác…"
            className="min-h-20 rounded-lg border-line bg-deep text-sm text-ink placeholder:text-faint focus-visible:ring-brand/30"
          />
        </div>
      </ConfirmDialog>

      {/* Dialog khôi phục tài khoản */}
      <Dialog open={recoveryOpen} onOpenChange={(v) => !busy && setRecoveryOpen(v)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl border-line bg-panel p-0 sm:max-w-lg">
          <DialogHeader className="border-b border-line px-6 pt-6">
            <DialogTitle className="text-left text-base font-semibold text-ink">Khôi phục tài khoản đăng nhập</DialogTitle>
            <DialogDescription className="text-left text-xs leading-relaxed text-dim">
              Xem trước điều kiện khôi phục, sau đó xác nhận để thực hiện. Mật khẩu tạm chỉ được gửi qua email cho ứng
              viên — giảng viên không xem được nội dung.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 py-5">
            {recoveryInfo === null ? (
              <div className="flex items-center gap-2 py-4 text-xs text-dim">
                <InlineSpinner /> Đang kiểm tra điều kiện khôi phục…
              </div>
            ) : !recoveryInfo.canRecover ? (
              <p className="rounded-xl border border-amber/30 bg-amber/[0.06] px-4 py-3 text-xs leading-relaxed text-amber">
                {recoveryInfo.reason ?? "Hiện không thể khôi phục tài khoản cho hồ sơ này."}
              </p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <KeyValue label="Tài khoản hiện có">
                    {recoveryInfo.hasAccount ? (
                      <ToneBadge tone="emerald" dot>Đã có — gửi email hướng dẫn</ToneBadge>
                    ) : (
                      <ToneBadge tone="teal" dot>Sẽ tạo tài khoản intern (pending)</ToneBadge>
                    )}
                  </KeyValue>
                  <KeyValue label="Phiên bản khóa">
                    <span className="font-mono">rev {recoveryInfo.expectedRevision}</span>
                  </KeyValue>
                </div>
                <p className="rounded-xl border border-line bg-deep/60 px-4 py-3 text-xs leading-relaxed text-dim">
                  Sau khi xác nhận, hệ thống gửi email chứa mật khẩu tạm đến ứng viên (email đã tồn tại thì gửi theo
                  hướng dẫn "tài khoản hiện có"). Nội dung mật khẩu chỉ hiển thị trong email của ứng viên.
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="recovery-reason" className="text-xs font-medium text-dim">
                    Lý do khôi phục (tối thiểu 10 ký tự) <span className="text-rose">*</span>
                  </Label>
                  <Textarea
                    id="recovery-reason"
                    value={recoveryReason}
                    onChange={(e) => setRecoveryReason(e.target.value)}
                    placeholder="VD: Ứng viên báo mất email mật khẩu, xác minh danh tính qua điện thoại…"
                    className="min-h-20 rounded-lg border-line bg-deep text-sm text-ink placeholder:text-faint focus-visible:ring-brand/30"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter className="border-t border-line bg-deep/40 px-6 py-4">
            <Button
              variant="outline"
              className="rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
              disabled={busy}
              onClick={() => setRecoveryOpen(false)}
            >
              Đóng
            </Button>
            <Button
              className="rounded-lg bg-brand font-semibold text-on-brand hover:bg-brand-bright"
              disabled={busy || !recoveryInfo?.canRecover}
              onClick={handleRecover}
            >
              {busy ? <InlineSpinner /> : <KeyRound className="icon" />}
              Khôi phục & gửi email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ==================== Dialog dời lịch (chọn slot còn chỗ) ==================== */

function RescheduleDialog({
  open,
  onOpenChange,
  roundId,
  application,
  busy,
  selectedSlot,
  onSelectSlot,
  note,
  onNoteChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roundId: string;
  application: ApplicationRecordRow | null;
  busy: boolean;
  selectedSlot: string;
  onSelectSlot: (slotId: string) => void;
  note: string;
  onNoteChange: (note: string) => void;
  onConfirm: () => void;
}) {
  const round = useResource(() => (open ? recruitmentRoundApi.detail(roundId) : Promise.resolve(null)), [roundId, open]);

  const slots = round.data?.slots ?? [];
  const allowed = application?.matchedRole ? slots.filter((s) => s.roleCode === application.matchedRole) : slots;
  const available = allowed.filter((s) => s.status === "open" && s.remaining > 0 && s.id !== application?.booking?.slotId);

  return (
    <Dialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl border-line bg-panel p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-line px-6 pt-6">
          <DialogTitle className="text-left text-base font-semibold text-ink">Dời lịch phỏng vấn</DialogTitle>
          <DialogDescription className="text-left text-xs leading-relaxed text-dim">
            Khung giờ mới phải còn chỗ và cùng vai trò khớp. Hành động này không tốn lượt đổi lịch của ứng viên.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-6 py-5">
          {round.loading ? (
            <div className="flex items-center gap-2 py-3 text-xs text-dim">
              <InlineSpinner /> Đang tải khung giờ…
            </div>
          ) : available.length === 0 ? (
            <p className="rounded-xl border border-line bg-deep/60 px-4 py-3 text-xs text-dim">
              Không còn khung giờ trống{application?.matchedRole ? ` cho vai trò ${application.matchedRoleLabel}` : ""}. Hãy
              thêm khung giờ mới hoặc đóng/hủy hồ sơ.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {available.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => onSelectSlot(s.id)}
                    className={`flex w-full flex-wrap items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                      selectedSlot === s.id
                        ? "border-brand/40 bg-brand/[0.06]"
                        : "border-line bg-deep/60 hover:border-line-strong"
                    }`}
                  >
                    <RoleBadge role={s.roleCode} />
                    <span className="min-w-0 flex-1 truncate text-xs text-ink">{formatDateTime(s.startsAt)}</span>
                    <span className="font-mono text-[10px] text-faint">
                      {s.bookedCount}/{s.capacity}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="reschedule-note" className="text-xs font-medium text-dim">
              Ghi chú cho ứng viên (không bắt buộc)
            </Label>
            <Textarea
              id="reschedule-note"
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="VD: Dời sớm 1 ngày theo yêu cầu của em…"
              className="min-h-16 rounded-lg border-line bg-deep text-sm text-ink placeholder:text-faint focus-visible:ring-brand/30"
            />
          </div>
        </div>
        <DialogFooter className="border-t border-line bg-deep/40 px-6 py-4">
          <Button
            variant="outline"
            className="rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            Hủy
          </Button>
          <Button
            className="rounded-lg bg-brand font-semibold text-on-brand hover:bg-brand-bright"
            disabled={busy || !selectedSlot}
            onClick={onConfirm}
          >
            {busy ? <InlineSpinner /> : <CalendarClock className="icon" />}
            Xác nhận dời lịch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
