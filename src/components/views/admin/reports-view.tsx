"use client";

import * as React from "react";
import { Download, FileBarChart, FilePlus2 } from "lucide-react";
import { toast } from "sonner";
import {
  reportApi,
  sessionApi,
  type ReportKind,
  type ReportSnapshot,
} from "@/lib/client/api";
import { downloadFile } from "@/lib/client/http";
import { useResource } from "@/lib/client/use-resource";
import { formatDateTime, formatPercent, relativeTime } from "@/lib/client/labels";
import {
  Empty,
  MetricCard,
  PageHeader,
  Panel,
  ToneBadge,
} from "@/components/shared/primitives";
import { PriorityBadge, TaskStatusBadge } from "@/components/shared/badges";
import { LoadingBlock, ErrorBlock, InlineSpinner } from "@/components/shared/states";
import { FilterBar, FilterSelect } from "@/components/shared/toolbar";
import { ViewFrame } from "@/components/shared/view";
import { Button } from "@/components/ui/button";
import {
  AdminDialog,
  BrandButton,
  Field,
  FormInput,
  FormSelect,
  LineButton,
  TableShell,
  TBody,
  Td,
  THead,
  Th,
  Tr,
  useToastAction,
} from "./admin-shared";

/* ============================ nhãn ============================ */

const reportKindMeta: Record<ReportKind, { label: string; tone: "teal" | "emerald" | "amber" | "brand" | "rose" }> = {
  progress: { label: "Tiến độ", tone: "teal" },
  performance: { label: "Hiệu suất", tone: "emerald" },
  evaluation: { label: "Đánh giá", tone: "amber" },
  review: { label: "Duyệt bài", tone: "brand" },
  risk: { label: "Rủi ro", tone: "rose" },
};

const KIND_OPTIONS = (Object.keys(reportKindMeta) as ReportKind[]).map((k) => ({
  value: k,
  label: reportKindMeta[k].label,
}));

const riskTones: Record<string, "emerald" | "amber" | "rose"> = {
  low: "emerald",
  medium: "amber",
  high: "rose",
};

const riskLabels: Record<string, string> = {
  low: "Rủi ro thấp",
  medium: "Rủi ro trung bình",
  high: "Rủi ro cao",
};

function ReportKindBadge({ kind }: { kind: ReportKind }) {
  const meta = reportKindMeta[kind] ?? reportKindMeta.progress;
  return <ToneBadge tone={meta.tone}>{meta.label}</ToneBadge>;
}

/* ============================ dialog tạo báo cáo ============================ */

function CreateReportDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const [kind, setKind] = React.useState<ReportKind>("progress");
  const [title, setTitle] = React.useState("");
  const [sessionId, setSessionId] = React.useState("");

  const sessions = useResource(
    () => (open ? sessionApi.overview({ page: 1, pageSize: 50 }) : Promise.resolve(null)),
    [open]
  );
  const sessionOptions = (sessions.data?.data ?? []).map((s) => ({
    value: s.id,
    label: `${s.code} · ${s.name}`,
  }));

  React.useEffect(() => {
    if (open) {
      setKind("progress");
      setTitle("");
      setSessionId("");
    }
  }, [open]);

  const action = useToastAction(() => onOpenChange(false));

  const submit = () => {
    action.run(async () => {
      const res = await reportApi.create({
        kind,
        sessionId: sessionId || undefined,
        title: title.trim() || undefined,
      });
      toast.success(
        res.deduped
          ? "Báo cáo tương tự vừa được tạo — mở bản mới nhất."
          : "Đã tạo báo cáo mới từ dữ liệu phiên thực tập."
      );
      onCreated(res.id);
    });
  };

  return (
    <AdminDialog
      open={open}
      onOpenChange={(o) => !action.busy && onOpenChange(o)}
      title="Tạo báo cáo"
      description="Snapshot dữ liệu theo loại báo cáo — tải CSV để gửi lớp hoặc nhà trường."
      footer={
        <>
          <LineButton onClick={() => onOpenChange(false)} disabled={action.busy}>
            Hủy
          </LineButton>
          <BrandButton onClick={submit} disabled={action.busy}>
            {action.busy ? <InlineSpinner className="size-4" /> : <FilePlus2 className="size-4 icon" />}
            {action.busy ? "Đang tạo…" : "Tạo báo cáo"}
          </BrandButton>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Tiêu đề" hint="Bỏ trống để dùng tiêu đề tự sinh.">
          <FormInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Báo cáo tiến độ giữa kỳ"
          />
        </Field>
        <Field label="Loại báo cáo">
          <FormSelect
            value={kind}
            onChange={(v) => setKind(v as ReportKind)}
            options={KIND_OPTIONS}
            ariaLabel="Chọn loại báo cáo"
          />
        </Field>
        <Field label="Phạm vi (phiên thực tập)" hint="Bỏ trống nếu muốn lấy phạm vi toàn nền tảng.">
          {sessions.loading ? (
            <p className="text-xs text-faint">Đang tải danh sách phiên…</p>
          ) : (
            <FormSelect
              value={sessionId}
              onChange={setSessionId}
              options={[{ value: "", label: "Tất cả phiên (toàn nền tảng)" }, ...sessionOptions]}
              ariaLabel="Chọn phiên thực tập"
            />
          )}
        </Field>
      </div>
    </AdminDialog>
  );
}

/* ============================ dialog chi tiết ============================ */

function ReportDetailDialog({
  reportId,
  onOpenChange,
}: {
  reportId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const detail = useResource(
    () => (reportId ? reportApi.detail(reportId) : Promise.resolve(null)),
    [reportId]
  );
  const data: ReportSnapshot | null = detail.data;
  const [downloading, setDownloading] = React.useState(false);

  const handleCsv = () => {
    if (!data) return;
    setDownloading(true);
    const filename = `${data.title.replace(/[^\p{L}\p{N} ]/gu, "").trim() || "bao-cao"}.csv`;
    downloadFile(`reports/${data.id}/csv`, filename)
      .then(() => toast.success("Đã tải xuống file CSV"))
      .catch(() => toast.error("Không tải được CSV"))
      .finally(() => setDownloading(false));
  };

  return (
    <AdminDialog
      open={Boolean(reportId)}
      onOpenChange={(o) => !downloading && onOpenChange(o)}
      title={data ? data.title : "Chi tiết báo cáo"}
      description={data ? `${data.projectName} · ${data.scope} · ${formatDateTime(data.createdAt)}` : "Đang tải…"}
      maxWidth="max-w-3xl"
      footer={
        <>
          <LineButton onClick={() => onOpenChange(false)} disabled={downloading}>
            Đóng
          </LineButton>
          <BrandButton onClick={handleCsv} disabled={downloading || !data}>
            {downloading ? <InlineSpinner className="size-4" /> : <Download className="size-4 icon" />} Tải CSV
          </BrandButton>
        </>
      }
    >
      {detail.loading ? (
        <LoadingBlock rows={5} />
      ) : detail.error || !data ? (
        <ErrorBlock error={detail.error ?? new Error("Không tìm thấy báo cáo")} onRetry={detail.reload} />
      ) : (
        <div className="max-h-[56vh] space-y-4 overflow-y-auto pr-1">
          <div className="flex flex-wrap items-center gap-2">
            <ReportKindBadge kind={data.kind} />
            <ToneBadge tone={riskTones[data.summary.risk] ?? "zinc"} dot>
              {riskLabels[data.summary.risk] ?? data.summary.risk}
            </ToneBadge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Tổng nhiệm vụ" value={data.summary.total} />
            <MetricCard label="Hoàn thành" value={data.summary.completed} tone="brand" />
            <MetricCard label="Trễ hạn" value={data.summary.overdue} tone={data.summary.overdue > 0 ? "rose" : "default"} />
            <MetricCard label="Bị chặn" value={data.summary.blocked} tone={data.summary.blocked > 0 ? "amber" : "default"} />
            <MetricCard label="Chưa gán" value={data.summary.unassigned} tone={data.summary.unassigned > 0 ? "amber" : "default"} />
          </div>

          {data.summary.reasons.length > 0 ? (
            <div className="rounded-xl border border-line bg-deep/60 p-3.5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">Lý do đánh giá rủi ro</p>
              <ul className="space-y-1.5">
                {data.summary.reasons.map((reason) => (
                  <li key={reason} className="flex items-start gap-2 text-xs leading-relaxed text-dim">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {data.members.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-line">
              <p className="border-b border-line bg-deep/50 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
                Hiệu suất thành viên
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs" style={{ minWidth: 520 }}>
                  <thead className="text-faint">
                    <tr>
                      <th className="px-3.5 py-2 font-semibold uppercase tracking-wide">Thành viên</th>
                      <th className="px-3.5 py-2 font-semibold uppercase tracking-wide">Nhiệm vụ</th>
                      <th className="px-3.5 py-2 font-semibold uppercase tracking-wide">Hoàn thành</th>
                      <th className="px-3.5 py-2 text-right font-semibold uppercase tracking-wide">Duyệt / Làm lại</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.members.map((m) => (
                      <tr key={m.displayName} className="border-t border-line">
                        <td className="px-3.5 py-2 font-medium text-ink">{m.displayName}</td>
                        <td className="px-3.5 py-2 font-mono text-dim">
                          {m.completedTaskCount}/{m.totalTaskCount}
                        </td>
                        <td className="px-3.5 py-2 font-mono text-brand-bright">
                          {formatPercent(m.taskCompletionRate, 0)}
                        </td>
                        <td className="px-3.5 py-2 text-right font-mono text-dim">
                          <span className="text-brand-bright">{m.approvedCount}</span>
                          <span className="text-faint"> / </span>
                          <span className="text-amber">{m.reworkCount}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {data.tasks.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-line">
              <p className="border-b border-line bg-deep/50 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
                Danh sách nhiệm vụ ({data.tasks.length})
              </p>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs" style={{ minWidth: 560 }}>
                  <tbody>
                    {data.tasks.map((t) => (
                      <tr key={t.code} className="border-t border-line">
                        <td className="px-3.5 py-2 font-mono text-[10px] text-brand-bright/80">{t.code}</td>
                        <td className="max-w-56 truncate px-2 py-2 text-ink">{t.title}</td>
                        <td className="px-2 py-2 text-dim">{t.assigneeName ?? "—"}</td>
                        <td className="px-2 py-2">
                          <TaskStatusBadge status={t.status} />
                        </td>
                        <td className="px-2 py-2">
                          <PriorityBadge priority={t.priority} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </AdminDialog>
  );
}

/* ============================ view chính ============================ */

export function AdminReports() {
  const reports = useResource(() => reportApi.list(), []);
  const [kind, setKind] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [detailId, setDetailId] = React.useState<string | null>(null);

  const items = (reports.data?.items ?? []).filter((r) => !kind || r.kind === kind);
  const counts = reports.data?.counts ?? [];

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Quản trị hệ thống"
        title="Báo cáo"
        description="Tạo và xem các snapshot báo cáo toàn nền tảng: tiến độ, hiệu suất, đánh giá, duyệt bài và rủi ro."
        actions={
          <BrandButton onClick={() => setCreateOpen(true)}>
            <FilePlus2 className="size-4 icon" /> Tạo báo cáo
          </BrandButton>
        }
      />

      <FilterBar hasActive={Boolean(kind)} onReset={() => setKind("")}>
        <FilterSelect
          value={kind}
          onChange={setKind}
          options={KIND_OPTIONS}
          placeholder="Loại báo cáo"
          ariaLabel="Lọc theo loại báo cáo"
          className="w-44"
        />
        {counts.length > 0 ? (
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            {counts.map((c) => (
              <ToneBadge key={c.kind} tone={reportKindMeta[c.kind]?.tone ?? "zinc"}>
                {reportKindMeta[c.kind]?.label ?? c.kind}: {c.count}
              </ToneBadge>
            ))}
          </div>
        ) : null}
      </FilterBar>

      {reports.loading ? (
        <LoadingBlock rows={6} />
      ) : reports.error ? (
        <ErrorBlock error={reports.error} onRetry={reports.reload} />
      ) : items.length === 0 ? (
        <Panel>
          <Empty
            icon={<FileBarChart className="icon" />}
            title="Chưa có báo cáo nào"
            description="Tạo báo cáo đầu tiên từ dữ liệu phiên thực tập."
            action={
              <BrandButton onClick={() => setCreateOpen(true)}>
                <FilePlus2 className="size-4 icon" /> Tạo báo cáo
              </BrandButton>
            }
          />
        </Panel>
      ) : (
        <TableShell minWidth={820}>
          <THead>
            <tr>
              <Th>Tiêu đề</Th>
              <Th>Loại</Th>
              <Th>Phạm vi</Th>
              <Th>Người tạo</Th>
              <Th>Thời điểm</Th>
              <Th className="text-right">Thao tác</Th>
            </tr>
          </THead>
          <TBody>
            {items.map((r) => (
              <Tr key={r.id}>
                <Td>
                  <p className="max-w-80 truncate text-sm font-medium text-ink">{r.title}</p>
                </Td>
                <Td>
                  <ReportKindBadge kind={r.kind} />
                </Td>
                <Td>
                  <span className="text-xs text-dim">{r.scope}</span>
                </Td>
                <Td>
                  <span className="text-xs text-dim">{r.authorName}</span>
                </Td>
                <Td>
                  <span className="whitespace-nowrap text-xs text-dim" title={formatDateTime(r.createdAt)}>
                    {relativeTime(r.createdAt)}
                  </span>
                </Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-lg text-dim hover:bg-panel-2 hover:text-ink"
                      onClick={() => setDetailId(r.id)}
                      aria-label={`Xem chi tiết ${r.title}`}
                    >
                      <FileBarChart className="size-4 icon" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-lg text-dim hover:bg-panel-2 hover:text-brand-bright"
                      onClick={() => {
                        const filename = `${r.title.replace(/[^\p{L}\p{N} ]/gu, "").trim() || "bao-cao"}.csv`;
                        downloadFile(`reports/${r.id}/csv`, filename)
                          .then(() => toast.success("Đã tải xuống file CSV"))
                          .catch(() => toast.error("Không tải được CSV"));
                      }}
                      aria-label={`Tải CSV ${r.title}`}
                    >
                      <Download className="size-4 icon" />
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </TBody>
        </TableShell>
      )}

      <CreateReportDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(id) => {
          reports.reload();
          setDetailId(id);
        }}
      />
      <ReportDetailDialog reportId={detailId} onOpenChange={(o) => !o && setDetailId(null)} />
    </ViewFrame>
  );
}
