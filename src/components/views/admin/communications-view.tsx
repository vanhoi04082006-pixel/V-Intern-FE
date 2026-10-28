"use client";

import * as React from "react";
import { Eye, Info, Mail, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import {
  communicationApi,
  type MailKind,
  type MailPreview,
  type MailRecordRow,
  type MailStatus,
} from "@/lib/client/api";
import { ApiError } from "@/lib/client/http";
import { useResource } from "@/lib/client/use-resource";
import { formatDateTime, relativeTime } from "@/lib/client/labels";
import {
  Empty,
  PageHeader,
  Pager,
  Panel,
  ToneBadge,
} from "@/components/shared/primitives";
import { LoadingBlock, ErrorBlock, InlineSpinner } from "@/components/shared/states";
import { ConfirmDialog } from "@/components/shared/confirm";
import { FilterBar, FilterSelect } from "@/components/shared/toolbar";
import { ViewFrame } from "@/components/shared/view";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AdminDialog,
  BrandButton,
  LineButton,
  TableShell,
  TBody,
  Td,
  THead,
  Th,
  Tr,
  useToastAction,
} from "./admin-shared";

const PAGE_SIZE = 10;

const kindLabels: Record<MailKind, string> = {
  verify: "Xác minh",
  schedule: "Lịch phỏng vấn",
  credentials: "Tài khoản",
  "existing-account": "Tài khoản sẵn có",
  cancelled: "Hủy",
};

const kindTones: Record<MailKind, "teal" | "brand" | "amber" | "orange" | "zinc"> = {
  verify: "teal",
  schedule: "brand",
  credentials: "amber",
  "existing-account": "orange",
  cancelled: "zinc",
};

const KIND_OPTIONS = (Object.keys(kindLabels) as MailKind[]).map((k) => ({
  value: k,
  label: kindLabels[k],
}));

/** 9 trạng thái thật của MailStatus + 2 nhãn dự phòng. */
const statusMeta: Record<string, { label: string; tone: "amber" | "teal" | "brand" | "emerald" | "rose" | "zinc" | "violet" }> = {
  pending: { label: "Chờ gửi", tone: "amber" },
  sending: { label: "Đang gửi", tone: "teal" },
  accepted: { label: "Đã nhận", tone: "brand" },
  delivered: { label: "Đã gửi", tone: "emerald" },
  uncertain: { label: "Không chắc", tone: "violet" },
  bounced: { label: "Bounce", tone: "rose" },
  dead: { label: "Chết", tone: "rose" },
  blocked: { label: "Bị chặn", tone: "zinc" },
  failed: { label: "Thất bại", tone: "rose" },
  cancelled: { label: "Đã hủy", tone: "zinc" },
  expired: { label: "Hết hạn", tone: "zinc" },
};

const STATUS_OPTIONS = Object.entries(statusMeta)
  .filter(([k]) => ["pending", "sending", "accepted", "delivered", "uncertain", "bounced", "dead", "blocked", "failed"].includes(k))
  .map(([value, meta]) => ({ value, label: meta.label }));

function MailKindBadge({ kind }: { kind: MailKind }) {
  return (
    <ToneBadge tone={kindTones[kind] ?? "zinc"}>
      {kindLabels[kind] ?? kind}
    </ToneBadge>
  );
}

function MailStatusBadge({ status }: { status: MailStatus }) {
  const meta = statusMeta[status] ?? { label: status, tone: "zinc" as const };
  return (
    <ToneBadge tone={meta.tone} dot>
      {meta.label}
    </ToneBadge>
  );
}

/* ============================ dialog xem trước ============================ */

function PreviewDialog({ mail, onOpenChange }: { mail: MailRecordRow | null; onOpenChange: (open: boolean) => void }) {
  const preview = useResource(
    () => (mail ? communicationApi.preview(mail.id) : Promise.resolve(null)),
    [mail?.id]
  );
  const data: MailPreview | null = preview.data;

  return (
    <AdminDialog
      open={Boolean(mail)}
      onOpenChange={onOpenChange}
      title="Xem trước email"
      description={data ? `${data.subject} → ${data.recipientHint}` : "Đang tải nội dung thư…"}
      maxWidth="max-w-3xl"
      footer={<LineButton onClick={() => onOpenChange(false)}>Đóng</LineButton>}
    >
      {preview.loading ? (
        <LoadingBlock rows={4} />
      ) : preview.error || !data ? (
        <ErrorBlock error={preview.error ?? new Error("Không tải được nội dung")} onRetry={preview.reload} />
      ) : (
        <Tabs defaultValue="html">
          <TabsList className="mb-3 flex h-auto w-full gap-1 rounded-xl border border-line bg-deep/60 p-1 sm:w-fit">
            <TabsTrigger
              value="html"
              className="h-8 rounded-lg px-3.5 text-xs font-medium text-dim data-[state=active]:bg-brand/12 data-[state=active]:text-brand-bright data-[state=active]:shadow-none"
            >
              Bản HTML
            </TabsTrigger>
            <TabsTrigger
              value="text"
              className="h-8 rounded-lg px-3.5 text-xs font-medium text-dim data-[state=active]:bg-brand/12 data-[state=active]:text-brand-bright data-[state=active]:shadow-none"
            >
              Bản chữ
            </TabsTrigger>
          </TabsList>
          <TabsContent value="html">
            <iframe
              title={`Xem trước HTML — ${data.subject}`}
              sandbox=""
              srcDoc={data.html}
              className="h-[420px] w-full rounded-xl border border-line bg-canvas"
            />
          </TabsContent>
          <TabsContent value="text">
            <pre className="max-h-[420px] overflow-y-auto whitespace-pre-wrap rounded-xl border border-line bg-deep/60 p-4 font-mono text-xs leading-relaxed text-ink">
              {data.text}
            </pre>
          </TabsContent>
        </Tabs>
      )}
    </AdminDialog>
  );
}

/* ============================ dialog gửi lại uncertain ============================ */

function UncertainResendDialog({
  mail,
  busy,
  onConfirm,
  onOpenChange,
}: {
  mail: MailRecordRow | null;
  busy: boolean;
  onConfirm: (acknowledge: boolean) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [ack, setAck] = React.useState(false);
  React.useEffect(() => {
    if (mail) setAck(false);
  }, [mail]);

  return (
    <ConfirmDialog
      open={Boolean(mail)}
      onOpenChange={(o) => !busy && !o && onOpenChange(false)}
      title={mail ? `Gửi lại thư "${mail.subject}"?` : ""}
      description="Thư chứa thông tin nhạy cảm hoặc trạng thái gửi lần trước là “Không chắc” — gửi lại có nguy cơ ứng viên nhận trùng email."
      confirmLabel={ack ? "Gửi lại" : "Chấp nhận để gửi lại"}
      busy={busy}
      onConfirm={() => onConfirm(ack)}
    >
      <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-amber/30 bg-amber/[0.07] px-3.5 py-3">
        <Checkbox checked={ack} onCheckedChange={(v) => setAck(v === true)} aria-label="Chấp nhận nguy cơ gửi trùng" className="mt-0.5" />
        <span className="text-[13px] leading-relaxed text-ink">
          Tôi chấp nhận nguy cơ gửi trùng và muốn gửi lại thư này.
        </span>
      </label>
    </ConfirmDialog>
  );
}

/* ============================ view chính ============================ */

export function AdminCommunications() {
  const [page, setPage] = React.useState(1);
  const [kind, setKind] = React.useState("");
  const [status, setStatus] = React.useState("");

  const list = useResource(
    () =>
      communicationApi.list({
        page,
        pageSize: PAGE_SIZE,
        kind: (kind || undefined) as MailKind | undefined,
        status: (status || undefined) as MailStatus | undefined,
      }),
    [page, kind, status]
  );
  const rows = list.data?.data ?? [];
  const meta = list.data?.meta;

  const resetPage = () => setPage(1);

  const [previewing, setPreviewing] = React.useState<MailRecordRow | null>(null);
  const [uncertain, setUncertain] = React.useState<MailRecordRow | null>(null);
  const resendAction = useToastAction(() => list.reload());

  const resend = (mail: MailRecordRow, acknowledgeUncertain?: boolean) => {
    resendAction.run(async () => {
      try {
        await communicationApi.resend(mail.id, acknowledgeUncertain);
        toast.success(`Đã đưa thư "${mail.subject}" vào hàng đợi gửi lại.`);
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.status === 429) {
            toast.error("Vui lòng đợi 60 giây giữa hai lần gửi.");
            return;
          }
          if (err.status === 400) {
            toast.error(err.message);
            return;
          }
          if (err.status === 409) {
            toast.error("Dữ liệu vừa được cập nhật — đang tải lại.");
            list.reload();
            return;
          }
        }
        throw err;
      }
    });
  };

  const resendBlockedReason = (mail: MailRecordRow): string | null => {
    if (mail.cooldownRemainingSeconds > 0) {
      return `Đang trong thời gian chờ — thử lại sau ${mail.cooldownRemainingSeconds}s.`;
    }
    if (!mail.resendable) {
      const label = statusMeta[mail.status]?.label ?? mail.status;
      return `Trạng thái “${label}” không được phép gửi lại (chỉ dead/accepted/bounced/uncertain).`;
    }
    return null;
  };

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Quản trị hệ thống"
        title="Hàng đợi email"
        description="Giám sát các email demo của luồng tuyển dụng: xác minh, lịch phỏng vấn và thông tin đăng nhập."
      />

      {/* Banner info */}
      <Panel className="mb-4 flex items-start gap-3 p-4">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand-bright">
          <Info className="size-4 icon" />
        </span>
        <p className="text-[13px] leading-relaxed text-dim">
          Hàng đợi email demo của luồng tuyển dụng — xem trước và gửi lại có kiểm soát.
        </p>
      </Panel>

      <FilterBar
        hasActive={Boolean(kind || status)}
        onReset={() => {
          setKind("");
          setStatus("");
          resetPage();
        }}
      >
        <FilterSelect
          value={kind}
          onChange={(v) => {
            setKind(v);
            resetPage();
          }}
          options={KIND_OPTIONS}
          placeholder="Loại thư"
          ariaLabel="Lọc theo loại thư"
          className="w-48"
        />
        <FilterSelect
          value={status}
          onChange={(v) => {
            setStatus(v);
            resetPage();
          }}
          options={STATUS_OPTIONS}
          placeholder="Trạng thái"
          ariaLabel="Lọc theo trạng thái"
          className="w-44"
        />
        {meta ? (
          <span className="ml-auto font-mono text-xs text-faint">{meta.total} thư</span>
        ) : null}
      </FilterBar>

      {list.loading ? (
        <LoadingBlock rows={6} />
      ) : list.error ? (
        <ErrorBlock error={list.error} onRetry={list.reload} />
      ) : rows.length === 0 ? (
        <div className="card-surface">
          <Empty
            icon={<Mail className="icon" />}
            title="Không có email nào khớp bộ lọc"
            description="Thư xuất hiện khi có ứng viên nộp hồ sơ, đặt lịch hoặc được khôi phục tài khoản."
          />
        </div>
      ) : (
        <TableShell minWidth={1020}>
          <THead>
            <tr>
              <Th>Loại thư</Th>
              <Th>Người nhận</Th>
              <Th>Sẵn sàng lúc</Th>
              <Th>Lượt gửi</Th>
              <Th>Trạng thái</Th>
              <Th>Mã lỗi</Th>
              <Th className="text-right">Thao tác</Th>
            </tr>
          </THead>
          <TBody>
            {rows.map((mail) => {
              const blocked = resendBlockedReason(mail);
              return (
                <Tr key={mail.id}>
                  <Td>
                    <div className="flex flex-col gap-1">
                      <MailKindBadge kind={mail.kind} />
                      <p className="max-w-56 truncate text-xs text-dim" title={mail.subject}>
                        {mail.subject}
                      </p>
                    </div>
                  </Td>
                  <Td>
                    <span className="font-mono text-xs text-ink">{mail.recipientHint}</span>
                    {mail.applicationName ? (
                      <p className="text-[11px] text-faint">{mail.applicationName}</p>
                    ) : null}
                  </Td>
                  <Td>
                    <span className="whitespace-nowrap text-xs text-dim" title={formatDateTime(mail.availableAt)}>
                      {relativeTime(mail.availableAt)}
                    </span>
                  </Td>
                  <Td>
                    <span className="font-mono text-xs text-dim">{mail.attempts}</span>
                  </Td>
                  <Td>
                    <MailStatusBadge status={mail.status} />
                  </Td>
                  <Td>
                    {mail.lastCode ? (
                      <span className="font-mono text-[11px] text-rose" title={mail.lastCode}>
                        {mail.lastCode}
                      </span>
                    ) : (
                      <span className="text-xs text-faint">—</span>
                    )}
                  </Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg text-dim hover:bg-panel-2 hover:text-ink"
                        onClick={() => setPreviewing(mail)}
                        aria-label={`Xem trước ${mail.subject}`}
                      >
                        <Eye className="size-4 icon" />
                      </Button>
                      {blocked ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled
                                className="size-8 rounded-lg text-faint"
                                aria-label="Không thể gửi lại"
                              >
                                <RefreshCw className="size-4 icon" />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-56 border-line bg-panel-2 text-ink">
                            {blocked}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-lg text-dim hover:bg-panel-2 hover:text-brand-bright"
                          onClick={() => {
                            if (mail.status === "uncertain" || mail.kind === "credentials" || mail.kind === "verify") {
                              setUncertain(mail);
                            } else {
                              resend(mail);
                            }
                          }}
                          aria-label={`Gửi lại ${mail.subject}`}
                        >
                          {resendAction.busy ? <InlineSpinner className="size-4" /> : <Send className="size-4 icon" />}
                        </Button>
                      )}
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </TBody>
        </TableShell>
      )}

      {meta && rows.length > 0 ? (
        <div className="mt-4">
          <Pager page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />
        </div>
      ) : null}

      <PreviewDialog mail={previewing} onOpenChange={(o) => !o && setPreviewing(null)} />

      <UncertainResendDialog
        mail={uncertain}
        busy={resendAction.busy}
        onConfirm={(ack) => {
          if (uncertain) resend(uncertain, ack);
          setUncertain(null);
        }}
        onOpenChange={() => setUncertain(null)}
      />

      <p className="mt-4 flex items-center gap-1.5 text-xs text-faint">
        <Info className="size-3.5 icon" /> Thư chứa thông tin nhạy cảm (tài khoản / xác minh) cần xác nhận nguy cơ gửi trùng trước khi gửi lại.
      </p>
    </ViewFrame>
  );
}
