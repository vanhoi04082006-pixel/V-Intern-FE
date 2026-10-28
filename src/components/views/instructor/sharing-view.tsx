"use client";

import * as React from "react";
import {
  ArrowRightLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  FolderKanban,
  Inbox,
  Lock,
  Presentation,
  Send,
  Share2,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  accountApi,
  type SessionShareRequestRow,
  type SessionShareSnapshot,
  type ShareStatus,
} from "@/lib/client/api-org";
import { sessionApi } from "@/lib/client/api";
import { ApiError } from "@/lib/client/http";
import { useSession } from "@/lib/client/session";
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
  KeyValue,
  UserAvatar,
} from "@/components/shared/primitives";
import { RoleBadge } from "@/components/shared/badges";
import { LoadingBlock, ErrorBlock, InlineSpinner } from "@/components/shared/states";
import { ConfirmDialog } from "@/components/shared/confirm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/* ==================== Nhãn & tone ==================== */

const shareStatusMeta: Record<ShareStatus, { label: string; tone: "amber" | "emerald" | "rose" | "zinc" }> = {
  pending: { label: "Chờ duyệt", tone: "amber" },
  approved: { label: "Đã duyệt", tone: "emerald" },
  denied: { label: "Từ chối", tone: "rose" },
  revoked: { label: "Đã thu hồi", tone: "zinc" },
};

function ShareStatusBadge({ status }: { status: ShareStatus }) {
  const meta = shareStatusMeta[status] ?? { label: status, tone: "zinc" as const };
  return (
    <ToneBadge tone={meta.tone} dot>
      {meta.label}
    </ToneBadge>
  );
}

/** Toast lỗi chuẩn — 409 conflict → nhắc tải lại. */
function toastError(err: unknown, fallback: string) {
  if (err instanceof ApiError && err.status === 409) {
    toast.error("Trạng thái yêu cầu vừa được cập nhật — đang tải lại để tránh thao tác trùng.");
    return;
  }
  toast.error(err instanceof Error ? err.message : fallback);
}

/* ==================== View chính ==================== */

export function InstructorSharing() {
  const { user } = useSession();
  const [tab, setTab] = React.useState("incoming");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [approveFor, setApproveFor] = React.useState<SessionShareRequestRow | null>(null);
  const [denyFor, setDenyFor] = React.useState<SessionShareRequestRow | null>(null);
  const [revokeFor, setRevokeFor] = React.useState<SessionShareRequestRow | null>(null);
  const [snapshotFor, setSnapshotFor] = React.useState<SessionShareRequestRow | null>(null);
  const [busy, setBusy] = React.useState(false);

  const requests = useResource(() => accountApi.shareRequests({ page: 1, pageSize: 50 }), []);

  const rows = requests.data?.data ?? [];
  const myEmail = (user?.email ?? "").toLowerCase();
  // Yêu cầu với tôi = tôi là chủ sở hữu dữ liệu (owner)
  const incoming = rows.filter((r) => r.ownerEmail.toLowerCase() === myEmail);
  // Được chia sẻ với tôi = tôi là người gửi yêu cầu
  const outgoing = rows.filter((r) => r.requesterId === user?.id);

  const reload = React.useCallback(() => requests.reload(), [requests]);

  const decide = (row: SessionShareRequestRow | null, decision: "approve" | "deny" | "revoke", sessionId?: string) => {
    if (!row) return;
    setBusy(true);
    accountApi
      .shareDecision(row.id, decision, sessionId)
      .then((res) => {
        toast.success(
          decision === "approve"
            ? `Đã duyệt chia sẻ${res.sessionName ? ` cho phiên ${res.sessionName}` : ""} — hết hạn ${formatDate(res.expiresAt)}`
            : decision === "deny"
              ? "Đã từ chối yêu cầu chia sẻ"
              : "Đã thu hồi quyền chia sẻ"
        );
        setApproveFor(null);
        setDenyFor(null);
        setRevokeFor(null);
        reload();
      })
      .catch((err) => toastError(err, "Không xử lý được yêu cầu"))
      .finally(() => setBusy(false));
  };

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Chia sẻ dữ liệu"
        title="Chia sẻ dữ liệu phiên"
        description="Quản lý yêu cầu xem dữ liệu phiên thực tập: duyệt hoặc từ chối yêu cầu từ đồng nghiệp, xem snapshot phiên được chia sẻ với mình."
        actions={
          <Button className="rounded-lg bg-brand font-semibold text-on-brand hover:bg-brand-bright" onClick={() => setCreateOpen(true)}>
            <Send className="icon" /> Gửi yêu cầu mới
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Yêu cầu chờ duyệt"
          value={requests.loading ? "…" : incoming.filter((r) => r.status === "pending").length}
          hint="Người khác xin xem dữ liệu của bạn"
          icon={<Inbox />}
          tone="amber"
        />
        <MetricCard
          label="Đang được chia sẻ"
          value={requests.loading ? "…" : incoming.filter((r) => r.status === "approved").length}
          hint="Bạn đã duyệt cho người khác xem"
          icon={<Share2 />}
          tone="brand"
        />
        <MetricCard
          label="Phiên bạn được xem"
          value={requests.loading ? "…" : outgoing.filter((r) => r.status === "approved").length}
          hint="Yêu cầu của bạn đã được duyệt"
          icon={<Eye />}
          tone="teal"
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl border border-line bg-deep/60 p-1 sm:w-fit">
          <TabsTrigger
            value="incoming"
            className="h-9 gap-1.5 rounded-lg px-3.5 text-[13px] font-medium text-dim data-[state=active]:bg-brand/12 data-[state=active]:text-brand-bright data-[state=active]:shadow-none"
          >
            <Inbox className="size-3.5 icon" /> Yêu cầu với tôi
            <span className="font-mono text-[11px] text-faint">{incoming.length}</span>
          </TabsTrigger>
          <TabsTrigger
            value="outgoing"
            className="h-9 gap-1.5 rounded-lg px-3.5 text-[13px] font-medium text-dim data-[state=active]:bg-brand/12 data-[state=active]:text-brand-bright data-[state=active]:shadow-none"
          >
            <Eye className="size-3.5 icon" /> Được chia sẻ với tôi
            <span className="font-mono text-[11px] text-faint">{outgoing.length}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming">
          <IncomingTab
            rows={incoming}
            loading={requests.loading}
            error={requests.error}
            onRetry={reload}
            onApprove={setApproveFor}
            onDeny={setDenyFor}
            onRevoke={setRevokeFor}
          />
        </TabsContent>

        <TabsContent value="outgoing">
          <OutgoingTab
            rows={outgoing}
            loading={requests.loading}
            error={requests.error}
            onRetry={reload}
            onViewSnapshot={setSnapshotFor}
          />
        </TabsContent>
      </Tabs>

      {/* Dialog duyệt — chọn phiên gắn với yêu cầu */}
      <ApproveDialog
        row={approveFor}
        busy={busy}
        onClose={() => setApproveFor(null)}
        onConfirm={(sessionId) => decide(approveFor, "approve", sessionId)}
      />

      <ConfirmDialog
        open={Boolean(denyFor)}
        onOpenChange={(open) => {
          if (!busy && !open) setDenyFor(null);
        }}
        title="Từ chối yêu cầu chia sẻ?"
        description={
          denyFor
            ? `${denyFor.requesterName} sẽ không xem được dữ liệu phiên của bạn qua yêu cầu này. Họ có thể gửi yêu cầu mới kèm lý do rõ hơn.`
            : ""
        }
        confirmLabel="Từ chối"
        destructive
        busy={busy}
        onConfirm={() => decide(denyFor, "deny")}
      />

      <ConfirmDialog
        open={Boolean(revokeFor)}
        onOpenChange={(open) => {
          if (!busy && !open) setRevokeFor(null);
        }}
        title="Thu hồi quyền chia sẻ?"
        description={
          revokeFor
            ? `${revokeFor.requesterName} sẽ mất quyền xem dữ liệu phiên ${revokeFor.sessionName ?? ""} ngay lập tức.`
            : ""
        }
        confirmLabel="Thu hồi"
        destructive
        busy={busy}
        onConfirm={() => decide(revokeFor, "revoke")}
      />

      <CreateShareRequestDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={reload} />

      <SnapshotDialog row={snapshotFor} onClose={() => setSnapshotFor(null)} />
    </ViewFrame>
  );
}

/* ==================== Tab: yêu cầu với tôi (chủ sở hữu) ==================== */

function IncomingTab({
  rows,
  loading,
  error,
  onRetry,
  onApprove,
  onDeny,
  onRevoke,
}: {
  rows: SessionShareRequestRow[];
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  onApprove: (row: SessionShareRequestRow) => void;
  onDeny: (row: SessionShareRequestRow) => void;
  onRevoke: (row: SessionShareRequestRow) => void;
}) {
  if (loading) {
    return <LoadingBlock rows={4} />;
  }
  if (error) {
    return <ErrorBlock error={error} onRetry={onRetry} />;
  }
  if (rows.length === 0) {
    return (
      <Panel>
        <Empty
          icon={<Inbox />}
          title="Chưa có yêu cầu nào với bạn"
          description="Khi giảng viên hoặc quản trị viên muốn xem dữ liệu phiên bạn phụ trách, yêu cầu sẽ xuất hiện ở đây để duyệt."
        />
      </Panel>
    );
  }
  return (
    <Panel>
      <PanelHeader
        title="Yêu cầu xem dữ liệu của bạn"
        description={`${rows.length} yêu cầu — duyệt kèm chọn phiên hoặc từ chối kèm lý do ngắn`}
        icon={<Share2 className="size-4 icon" />}
      />
      <ul className="divide-y divide-line">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-start gap-3 px-5 py-4">
            <UserAvatar name={r.requesterName} size={38} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-semibold text-ink">{r.requesterName}</span>
                <ArrowRightLeft className="size-3 icon text-faint" />
                <span className="text-[13px] text-dim">{r.ownerName}</span>
                <ShareStatusBadge status={r.status} />
              </div>
              <p className="mt-1 text-xs leading-relaxed text-dim">{r.reason}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-faint">
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="size-3 icon" /> Gửi {relativeTime(r.createdAt)}
                </span>
                {r.sessionName ? (
                  <span className="inline-flex items-center gap-1">
                    <Presentation className="size-3 icon" /> {r.sessionName}
                  </span>
                ) : null}
                {r.expiresAt ? (
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="size-3 icon" /> Hết hạn {formatDate(r.expiresAt)}
                  </span>
                ) : null}
                {r.decidedBy ? <span>Duyệt bởi {r.decidedBy}</span> : null}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {r.status === "pending" ? (
                <>
                  <Button
                    size="sm"
                    className="h-8 rounded-lg bg-brand text-xs font-semibold text-on-brand hover:bg-brand-bright"
                    onClick={() => onApprove(r)}
                  >
                    <CheckCircle2 className="size-3.5 icon" /> Duyệt
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-lg border-rose/30 bg-transparent text-rose hover:bg-rose/10"
                    onClick={() => onDeny(r)}
                  >
                    <XCircle className="size-3.5 icon" /> Từ chối
                  </Button>
                </>
              ) : null}
              {r.status === "approved" ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
                  onClick={() => onRevoke(r)}
                >
                  <Lock className="size-3.5 icon" /> Thu hồi
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ==================== Tab: được chia sẻ với tôi ==================== */

function OutgoingTab({
  rows,
  loading,
  error,
  onRetry,
  onViewSnapshot,
}: {
  rows: SessionShareRequestRow[];
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  onViewSnapshot: (row: SessionShareRequestRow) => void;
}) {
  if (loading) {
    return <LoadingBlock rows={4} />;
  }
  if (error) {
    return <ErrorBlock error={error} onRetry={onRetry} />;
  }
  if (rows.length === 0) {
    return (
      <Panel>
        <Empty
          icon={<Eye />}
          title="Chưa có dữ liệu phiên nào được chia sẻ với bạn"
          description="Gửi yêu cầu mới tới chủ sở hữu dữ liệu (giảng viên hoặc quản trị viên). Khi được duyệt, bạn xem được snapshot phiên ở đây."
        />
      </Panel>
    );
  }
  return (
    <Panel>
      <PanelHeader
        title="Phiên được chia sẻ với tôi"
        description={`${rows.length} yêu cầu — mở snapshot phiên đã được duyệt`}
        icon={<Eye className="size-4 icon" />}
      />
      <ul className="divide-y divide-line">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-start gap-3 px-5 py-4">
            <UserAvatar name={r.ownerName} size={38} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-semibold text-ink">{r.ownerName}</span>
                <span className="text-[11px] text-faint">{r.ownerEmail}</span>
                <ShareStatusBadge status={r.status} />
              </div>
              <p className="mt-1 text-xs leading-relaxed text-dim">{r.reason}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-faint">
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="size-3 icon" /> Gửi {relativeTime(r.createdAt)}
                </span>
                {r.sessionName ? (
                  <span className="inline-flex items-center gap-1">
                    <Presentation className="size-3 icon" /> {r.sessionName}
                  </span>
                ) : null}
                {r.expiresAt ? <span>Hết hạn {formatDate(r.expiresAt)}</span> : null}
              </p>
            </div>
            {r.status === "approved" ? (
              <Button
                size="sm"
                className="h-8 rounded-lg bg-brand text-xs font-semibold text-on-brand hover:bg-brand-bright"
                onClick={() => onViewSnapshot(r)}
              >
                <Eye className="size-3.5 icon" /> Xem snapshot
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ==================== Dialog duyệt (chọn phiên) ==================== */

function ApproveDialog({
  row,
  busy,
  onClose,
  onConfirm,
}: {
  row: SessionShareRequestRow | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: (sessionId: string) => void;
}) {
  const [sessionId, setSessionId] = React.useState("");
  const sessions = useResource(
    () => (row ? sessionApi.overview({ page: 1, pageSize: 50 }) : Promise.resolve(null)),
    [row?.id]
  );

  React.useEffect(() => {
    if (row) setSessionId("");
  }, [row]);

  const list = sessions.data?.data ?? [];

  return (
    <Dialog open={Boolean(row)} onOpenChange={(open) => !busy && !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl border-line bg-panel p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-line px-6 pt-6">
          <DialogTitle className="text-left text-base font-semibold text-ink">
            Duyệt chia sẻ cho {row?.requesterName ?? ""}
          </DialogTitle>
          <DialogDescription className="text-left text-xs leading-relaxed text-dim">
            Chọn phiên mà bạn cho phép người này xem dữ liệu (dự án, thành viên, nhiệm vụ, sprint). Quyền hết hạn sau 30
            ngày.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-6 py-5">
          <p className="rounded-xl border border-line bg-deep/60 px-4 py-3 text-xs leading-relaxed text-dim">
            <b className="text-ink">Lý do:</b> {row?.reason}
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-dim">
              Phiên được chia sẻ <span className="text-rose">*</span>
            </Label>
            {sessions.loading ? (
              <div className="flex items-center gap-2 py-2 text-xs text-dim">
                <InlineSpinner /> Đang tải danh sách phiên…
              </div>
            ) : list.length === 0 ? (
              <p className="rounded-xl border border-line bg-deep/60 px-4 py-3 text-xs text-dim">
                Bạn chưa phụ trách phiên nào để chia sẻ.
              </p>
            ) : (
              <Select value={sessionId} onValueChange={setSessionId}>
                <SelectTrigger className="h-10 w-full rounded-lg border-line bg-deep text-sm text-ink">
                  <SelectValue placeholder="Chọn phiên…" />
                </SelectTrigger>
                <SelectContent className="border-line bg-panel-2 text-ink">
                  {list.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <DialogFooter className="border-t border-line bg-deep/40 px-6 py-4">
          <Button
            variant="outline"
            className="rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
            disabled={busy}
            onClick={onClose}
          >
            Hủy
          </Button>
          <Button
            className="rounded-lg bg-brand font-semibold text-on-brand hover:bg-brand-bright"
            disabled={busy || !sessionId}
            onClick={() => onConfirm(sessionId)}
          >
            {busy ? <InlineSpinner /> : <CheckCircle2 className="icon" />}
            Duyệt chia sẻ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ==================== Dialog gửi yêu cầu mới ==================== */

function CreateShareRequestDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [ownerEmail, setOwnerEmail] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setOwnerEmail("");
      setReason("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!ownerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail.trim())) {
      toast.error("Vui lòng nhập email hợp lệ của chủ sở hữu dữ liệu");
      return;
    }
    if (reason.trim().length < 10) {
      toast.error("Lý do cần tối thiểu 10 ký tự");
      return;
    }
    setSubmitting(true);
    try {
      await accountApi.createShareRequest(ownerEmail.trim(), reason.trim());
      toast.success(`Đã gửi yêu cầu chia sẻ tới ${ownerEmail.trim()}`);
      onOpenChange(false);
      onCreated();
    } catch (err) {
      toastError(err, "Không gửi được yêu cầu");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl border-line bg-panel p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-line px-6 pt-6">
          <DialogTitle className="text-left text-base font-semibold text-ink">Gửi yêu cầu chia sẻ dữ liệu</DialogTitle>
          <DialogDescription className="text-left text-xs leading-relaxed text-dim">
            Xin quyền xem dữ liệu phiên của chủ sở hữu khác (giảng viên hoặc quản trị viên). Chủ sở hữu sẽ duyệt kèm
            phiên cụ thể.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <Label htmlFor="share-owner" className="text-xs font-medium text-dim">
              Email chủ sở hữu <span className="text-rose">*</span>
            </Label>
            <Input
              id="share-owner"
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              placeholder="VD: admin@vintern.edu.vn"
              className="h-10 rounded-lg border-line bg-deep text-sm text-ink focus-visible:ring-brand/30"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="share-reason" className="text-xs font-medium text-dim">
              Lý do (tối thiểu 10 ký tự) <span className="text-rose">*</span>
            </Label>
            <Textarea
              id="share-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Cần đối chiếu tiến độ nhóm frontend giữa hai phiên để tổng hợp báo cáo giữa kỳ…"
              className="min-h-24 rounded-lg border-line bg-deep text-sm text-ink placeholder:text-faint focus-visible:ring-brand/30"
            />
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
            {submitting ? <InlineSpinner /> : <Send className="icon" />}
            Gửi yêu cầu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ==================== Dialog snapshot phiên ==================== */

const SNAPSHOT_TASKS_PAGE_SIZE = 10;

function SnapshotDialog({ row, onClose }: { row: SessionShareRequestRow | null; onClose: () => void }) {
  const [page, setPage] = React.useState(1);
  const snapshot = useResource(
    () => (row ? accountApi.shareSnapshot(row.id, { page, pageSize: SNAPSHOT_TASKS_PAGE_SIZE }) : Promise.resolve(null)),
    [row?.id, page]
  );

  React.useEffect(() => {
    if (row) setPage(1);
  }, [row]);

  const data: SessionShareSnapshot | null = snapshot.data;
  const tasks = data?.tasks.data ?? [];

  return (
    <Dialog open={Boolean(row)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto rounded-2xl border-line bg-panel p-0">
        <DialogHeader className="border-b border-line px-6 pt-6">
          <div className="flex flex-wrap items-center gap-2 pb-2">
            <ShareStatusBadge status={row?.status ?? "approved"} />
            <span className="font-mono text-[10px] text-faint">
              Hết hạn {formatDate(row?.expiresAt)}
            </span>
          </div>
          <DialogTitle className="text-left text-base font-semibold text-ink">
            Snapshot phiên {data?.session.code ?? ""}
          </DialogTitle>
          <DialogDescription className="text-left text-xs text-dim">
            Dữ liệu chỉ đọc — do {row?.ownerName} chia sẻ · sinh lúc {formatDateTime(data?.generatedAt)}
          </DialogDescription>
        </DialogHeader>

        {snapshot.loading ? (
          <div className="px-6 py-8">
            <LoadingBlock rows={5} />
          </div>
        ) : snapshot.error || !data ? (
          <div className="px-6 py-8">
            <ErrorBlock error={snapshot.error ?? new Error("Không tải được snapshot")} onRetry={snapshot.reload} />
          </div>
        ) : (
          <div className="space-y-5 px-6 py-5">
            {/* Thông tin phiên */}
            <div className="grid gap-3 rounded-xl border border-line bg-deep/60 p-4 sm:grid-cols-2">
              <KeyValue label="Phiên">
                <span className="text-[13px]">
                  {data.session.name} <span className="font-mono text-[10px] text-faint">({data.session.code})</span>
                </span>
              </KeyValue>
              <KeyValue label="Thời gian">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 icon text-faint" />
                  {formatDate(data.session.startDate)} — {formatDate(data.session.endDate)}
                </span>
              </KeyValue>
              <KeyValue label="Trạng thái">
                <ToneBadge tone={data.session.status === "active" ? "emerald" : "zinc"} dot>
                  {data.session.status === "active" ? "Đang diễn ra" : data.session.status}
                </ToneBadge>
              </KeyValue>
              <KeyValue label="Thành viên / sprint">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-3.5 icon text-faint" />
                  {data.members.length} thành viên · {data.sprints.length} sprint
                </span>
              </KeyValue>
            </div>

            {/* Dự án */}
            <section>
              <h4 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">
                <FolderKanban className="size-3.5 icon" /> Dự án
              </h4>
              {data.projects.length === 0 ? (
                <p className="rounded-xl border border-line bg-deep/60 px-4 py-3 text-xs text-dim">Phiên chưa có dự án.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.projects.map((p) => (
                    <div key={p.id} className="rounded-xl border border-line bg-deep/60 p-3.5">
                      <p className="text-[13px] font-semibold text-ink">{p.name}</p>
                      <p className="font-mono text-[10px] text-brand-bright/80">{p.code}</p>
                      <p className="mt-1 line-clamp-2 text-[11px] text-dim">{p.description}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {p.techStack.slice(0, 5).map((t) => (
                          <ToneBadge key={t} tone="teal">
                            {t}
                          </ToneBadge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Thành viên */}
            <section>
              <h4 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">
                <Users className="size-3.5 icon" /> Thành viên
              </h4>
              <ul className="grid gap-2 sm:grid-cols-2">
                {data.members.map((m) => (
                  <li key={m.userId} className="flex items-center gap-2.5 rounded-xl border border-line bg-deep/60 px-3 py-2.5">
                    <UserAvatar name={m.name} size={30} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-ink">{m.name}</p>
                      <p className="truncate text-[10px] text-faint">{m.email}</p>
                    </div>
                    <RoleBadge role={m.role} />
                  </li>
                ))}
              </ul>
            </section>

            {/* Nhiệm vụ (bảng nhỏ + phân trang) */}
            <section>
              <h4 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">
                <Presentation className="size-3.5 icon" /> Nhiệm vụ ({data.tasks.meta.total})
              </h4>
              {tasks.length === 0 ? (
                <p className="rounded-xl border border-line bg-deep/60 px-4 py-3 text-xs text-dim">Phiên chưa có nhiệm vụ.</p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-line bg-deep/60">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-line hover:bg-transparent">
                        <TableHead className="px-3 text-[10px] uppercase tracking-wide text-faint">Mã</TableHead>
                        <TableHead className="text-[10px] uppercase tracking-wide text-faint">Tiêu đề</TableHead>
                        <TableHead className="text-[10px] uppercase tracking-wide text-faint">Người nhận</TableHead>
                        <TableHead className="px-3 text-right text-[10px] uppercase tracking-wide text-faint">Trạng thái</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.map((t) => {
                        const task = t as {
                          id: string;
                          code: string;
                          title: string;
                          status: string;
                          assigneeName: string | null;
                        };
                        return (
                          <TableRow key={task.id} className="border-line">
                            <TableCell className="px-3 py-2.5 font-mono text-[10px] text-brand-bright/80">{task.code}</TableCell>
                            <TableCell className="max-w-[260px] py-2.5">
                              <span className="block truncate text-xs text-ink">{task.title}</span>
                            </TableCell>
                            <TableCell className="py-2.5 text-[11px] text-dim">{task.assigneeName ?? "Chưa gán"}</TableCell>
                            <TableCell className="px-3 py-2.5 text-right">
                              <ToneBadge
                                tone={
                                  task.status === "done"
                                    ? "emerald"
                                    : task.status === "review"
                                      ? "amber"
                                      : task.status === "doing"
                                        ? "teal"
                                        : "zinc"
                                }
                              >
                                {task.status === "done"
                                  ? "Hoàn thành"
                                  : task.status === "review"
                                    ? "Chờ duyệt"
                                    : task.status === "doing"
                                      ? "Đang làm"
                                      : "Cần làm"}
                              </ToneBadge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {data.tasks.meta.totalPages > 1 ? (
                    <Pager
                      page={data.tasks.meta.page}
                      totalPages={data.tasks.meta.totalPages}
                      total={data.tasks.meta.total}
                      onChange={setPage}
                    />
                  ) : null}
                </div>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
