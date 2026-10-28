"use client";

import * as React from "react";
import { Download, FileBarChart, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  reportApi,
  sessionApi,
  type ReportKind,
  type ReportSnapshot,
} from "@/lib/client/api";
import { downloadFile } from "@/lib/client/http";
import { useResource } from "@/lib/client/use-resource";
import { formatDate, formatDateTime, formatPercent, relativeTime } from "@/lib/client/labels";
import { ViewFrame, Stagger, StaggerItem } from "@/components/shared/view";
import {
  Panel,
  PanelHeader,
  PageHeader,
  Empty,
  MetricCard,
  ToneBadge,
  SectionHeading,
} from "@/components/shared/primitives";
import { TaskStatusBadge, PriorityBadge } from "@/components/shared/badges";
import { LoadingBlock, ErrorBlock, InlineSpinner } from "@/components/shared/states";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { reportKinds, reportKindMeta, ReportKindBadge, TimelineActionIcon } from "./shared";

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

export function InstructorReports() {
  const reports = useResource(() => reportApi.list(), []);
  const sessions = useResource(() => sessionApi.overview({ page: 1, pageSize: 50 }), []);

  const [kind, setKind] = React.useState<ReportKind>("progress");
  const [sessionId, setSessionId] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [openReportId, setOpenReportId] = React.useState<string | null>(null);

  const sessionOptions = (sessions.data?.data ?? []).map((s) => ({
    value: s.id,
    label: `${s.code} · ${s.name}`,
  }));

  const items = reports.data?.items ?? [];
  const counts = reports.data?.counts ?? [];
  const countOf = (k: ReportKind) => counts.find((c) => c.kind === k)?.count ?? 0;

  const handleCreate = () => {
    setCreating(true);
    reportApi
      .create({
        kind,
        sessionId: sessionId || undefined,
        title: title.trim() || undefined,
      })
      .then((res) => {
        toast.success(
          res.deduped
            ? "Báo cáo tương tự vừa được tạo — mở bản mới nhất"
            : "Đã tạo báo cáo mới từ dữ liệu buổi thực tập"
        );
        setTitle("");
        reports.reload();
        setOpenReportId(res.id);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Không tạo được báo cáo"))
      .finally(() => setCreating(false));
  };

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Đánh giá & báo cáo"
        title="Báo cáo"
        description="Tạo snapshot báo cáo tiến độ, hiệu suất, đánh giá, duyệt bài hoặc rủi ro — tải CSV gửi lớp/nhà trường."
      />

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        {/* Trái: form tạo báo cáo */}
        <div className="space-y-4">
          <Panel className="p-5">
            <SectionHeading>Tạo báo cáo mới</SectionHeading>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-dim">Loại báo cáo</Label>
                <div className="grid grid-cols-1 gap-1.5">
                  {reportKinds.map((k) => {
                    const meta = reportKindMeta[k];
                    const Icon = meta.icon;
                    const active = kind === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setKind(k)}
                        aria-pressed={active}
                        className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-[13px] font-medium transition-all active:scale-[0.98] ${
                          active
                            ? "border-brand/50 bg-brand/[0.08] text-brand-bright"
                            : "border-line bg-deep/60 text-dim hover:border-line-strong hover:text-ink"
                        }`}
                      >
                        <Icon className="size-4 icon" />
                        {meta.label}
                        {active ? <span className="ml-auto size-1.5 rounded-full bg-brand" /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-dim">Buổi thực tập</Label>
                <Select value={sessionId} onValueChange={setSessionId}>
                  <SelectTrigger className="h-10 w-full rounded-lg border-line bg-deep text-sm text-ink">
                    <SelectValue placeholder="Chọn buổi thực tập…" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56 border-line bg-panel-2 text-ink">
                    {sessionOptions.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="report-title" className="text-xs font-medium text-dim">
                  Tiêu đề (tùy chọn)
                </Label>
                <Input
                  id="report-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Báo cáo tiến độ giữa kỳ"
                  className="h-10 rounded-lg border-line bg-deep text-sm text-ink focus-visible:ring-brand/30"
                />
              </div>

              <Button className="w-full rounded-lg bg-brand font-semibold text-on-brand hover:bg-brand-bright" disabled={creating} onClick={handleCreate}>
                {creating ? <InlineSpinner /> : <Plus className="icon" />}
                Tạo báo cáo
              </Button>
            </div>
          </Panel>

          {/* Kind counts */}
          <Panel className="p-5">
            <SectionHeading>Báo cáo theo loại</SectionHeading>
            <div className="flex flex-wrap gap-1.5">
              {counts.map((c) => (
                <ToneBadge key={c.kind} tone={reportKindMeta[c.kind]?.tone ?? "zinc"}>
                  {reportKindMeta[c.kind]?.label ?? c.kind}: {c.count}
                </ToneBadge>
              ))}
            </div>
          </Panel>
        </div>

        {/* Phải: danh sách / chi tiết */}
        {openReportId ? (
          <ReportDetailPanel
            reportId={openReportId}
            onBack={() => setOpenReportId(null)}
          />
        ) : (
          <div>
            <SectionHeading>Báo cáo đã lưu</SectionHeading>
            {reports.loading ? (
              <LoadingBlock rows={5} />
            ) : reports.error ? (
              <ErrorBlock error={reports.error} onRetry={reports.reload} />
            ) : items.length === 0 ? (
              <Panel>
                <Empty
                  icon={<FileBarChart />}
                  title="Chưa có báo cáo nào"
                  description="Tạo báo cáo đầu tiên từ form bên trái."
                />
              </Panel>
            ) : (
              <Stagger className="space-y-2">
                {items.map((r) => {
                  const meta = reportKindMeta[r.kind] ?? reportKindMeta.progress;
                  const Icon = meta.icon;
                  const toneClass =
                    meta.tone === "teal"
                      ? "bg-teal/10 text-teal"
                      : meta.tone === "emerald"
                        ? "bg-brand/10 text-brand-bright"
                        : meta.tone === "amber"
                          ? "bg-amber/10 text-amber"
                          : meta.tone === "rose"
                            ? "bg-rose/10 text-rose"
                            : "bg-panel-2 text-dim";
                  return (
                    <StaggerItem key={r.id}>
                      <Panel hoverable className="group cursor-pointer p-4">
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => setOpenReportId(r.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setOpenReportId(r.id);
                            }
                          }}
                          className="flex items-center gap-3.5 text-left"
                        >
                          <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${toneClass}`}>
                            <Icon className="size-4 icon" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-semibold text-ink group-hover:text-brand-bright">
                              {r.title}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-faint">
                              {r.scope} · {r.authorName}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <ReportKindBadge kind={r.kind} />
                            <p className="mt-1 text-[10px] text-faint">{relativeTime(r.createdAt)}</p>
                          </div>
                        </div>
                      </Panel>
                    </StaggerItem>
                  );
                })}
              </Stagger>
            )}
          </div>
        )}
      </div>
    </ViewFrame>
  );
}

/* ==================== Chi tiết báo cáo ==================== */

function ReportDetailPanel({
  reportId,
  onBack,
}: {
  reportId: string;
  onBack: () => void;
}) {
  const detail = useResource(() => reportApi.detail(reportId), [reportId]);
  const [downloading, setDownloading] = React.useState(false);

  const data: ReportSnapshot | null = detail.data;

  const handleCsv = () => {
    if (!data) return;
    setDownloading(true);
    const filename = `${data.title.replace(/[^\p{L}\p{N} ]/gu, "").trim() || "bao-cao"}.csv`;
    downloadFile(`reports/${data.id}/csv`, filename)
      .then(() => toast.success("Đã tải xuống file CSV"))
      .catch(() => toast.error("Không tải được CSV"))
      .finally(() => setDownloading(false));
  };

  if (detail.loading) {
    return (
      <div>
        <LoadingBlock variant="detail" rows={6} />
      </div>
    );
  }
  if (detail.error || !data) {
    return <ErrorBlock error={detail.error ?? new Error("Không tìm thấy báo cáo")} onRetry={detail.reload} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-dim transition-colors hover:text-ink"
        >
          ← Về danh sách báo cáo
        </button>
        <Button
          size="sm"
          className="rounded-lg bg-brand text-on-brand hover:bg-brand-bright"
          disabled={downloading}
          onClick={handleCsv}
        >
          {downloading ? <InlineSpinner /> : <Download className="icon" />}
          Tải CSV
        </Button>
      </div>

      <Panel className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <ReportKindBadge kind={data.kind} />
              <span className="text-[11px] text-faint">{formatDateTime(data.createdAt)}</span>
            </div>
            <h2 className="mt-2 text-base font-semibold leading-snug text-ink">{data.title}</h2>
            <p className="mt-1 text-xs text-dim">{data.projectName} · {data.scope}</p>
          </div>
        </div>
      </Panel>

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Tổng nhiệm vụ" value={data.summary.total} />
        <MetricCard label="Hoàn thành" value={data.summary.completed} tone="brand" />
        <MetricCard label="Trễ hạn" value={data.summary.overdue} tone={data.summary.overdue > 0 ? "rose" : "default"} />
        <MetricCard label="Bị chặn" value={data.summary.blocked} tone={data.summary.blocked > 0 ? "amber" : "default"} />
        <MetricCard label="Chưa gán" value={data.summary.unassigned} tone={data.summary.unassigned > 0 ? "amber" : "default"} />
      </div>

      {/* Risk */}
      <Panel className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ToneBadge tone={riskTones[data.summary.risk] ?? "zinc"} dot>
              {riskLabels[data.summary.risk] ?? data.summary.risk}
            </ToneBadge>
            <span className="text-xs text-faint">
              Đánh giá rủi ro tổng thể từ dữ liệu buổi thực tập
            </span>
          </div>
        </div>
        {data.summary.reasons.length > 0 ? (
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {data.summary.reasons.map((reason) => (
              <li
                key={reason}
                className="flex items-start gap-2 rounded-lg border border-line bg-deep/60 px-3 py-2 text-xs leading-relaxed text-dim"
              >
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-amber" />
                {reason}
              </li>
            ))}
          </ul>
        ) : null}
      </Panel>

      {/* Members bảng */}
      {data.members.length > 0 ? (
        <Panel className="overflow-hidden">
          <PanelHeader title="Hiệu suất thành viên" icon={<FileBarChart className="size-4 icon" />} />
          <Table>
            <TableHeader>
              <TableRow className="border-line hover:bg-transparent">
                <TableHead className="px-4 text-[11px] uppercase tracking-wide text-faint">Thành viên</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide text-faint">Nhiệm vụ</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide text-faint">Hoàn thành</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide text-faint">Điểm đánh giá</TableHead>
                <TableHead className="px-4 text-right text-[11px] uppercase tracking-wide text-faint">Duyệt / Làm lại</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.members.map((m) => (
                <TableRow key={m.displayName} className="border-line">
                  <TableCell className="px-4 py-3 text-[13px] font-medium text-ink">{m.displayName}</TableCell>
                  <TableCell className="py-3 font-mono text-xs text-dim">
                    {m.completedTaskCount}/{m.totalTaskCount}
                  </TableCell>
                  <TableCell className="py-3 font-mono text-xs text-brand-bright">
                    {formatPercent(m.taskCompletionRate, 0)}
                  </TableCell>
                  <TableCell className="py-3">
                    {m.averageEvaluationScore !== null ? (
                      <span className="font-mono text-xs text-ink">{m.averageEvaluationScore}</span>
                    ) : (
                      <span className="text-xs text-faint">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right font-mono text-xs text-dim">
                    <span className="text-brand-bright">{m.approvedCount}</span>
                    <span className="text-faint"> / </span>
                    <span className="text-amber">{m.reworkCount}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      ) : null}

      {/* Tasks bảng */}
      {data.tasks.length > 0 ? (
        <Panel className="overflow-hidden">
          <PanelHeader
            title="Danh sách nhiệm vụ"
            description={`${data.tasks.length} nhiệm vụ trong snapshot`}
            icon={<FileBarChart className="size-4 icon" />}
          />
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-panel">
                <TableRow className="border-line hover:bg-transparent">
                  <TableHead className="px-4 text-[11px] uppercase tracking-wide text-faint">Mã</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide text-faint">Nhiệm vụ</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide text-faint">Người thực hiện</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide text-faint">Trạng thái</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide text-faint">Ưu tiên</TableHead>
                  <TableHead className="px-4 text-right text-[11px] uppercase tracking-wide text-faint">Hạn</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.tasks.map((t) => (
                  <TableRow key={t.code} className="border-line">
                    <TableCell className="px-4 py-2.5 font-mono text-[10px] text-brand-bright/80">{t.code}</TableCell>
                    <TableCell className="max-w-[320px] truncate py-2.5 text-xs text-ink">{t.title}</TableCell>
                    <TableCell className="py-2.5 text-xs text-dim">{t.assigneeName ?? "—"}</TableCell>
                    <TableCell className="py-2.5">
                      <TaskStatusBadge status={t.status} />
                    </TableCell>
                    <TableCell className="py-2.5">
                      <PriorityBadge priority={t.priority} />
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-right text-[11px] text-faint">
                      {formatDate(t.dueDate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Panel>
      ) : null}

      {/* Timeline */}
      {data.timeline.length > 0 ? (
        <Panel>
          <PanelHeader title="Dòng thời gian" icon={<FileBarChart className="size-4 icon" />} />
          <ol className="relative max-h-96 space-y-0 overflow-y-auto px-5 py-4">
            {data.timeline.map((e, i) => (
              <li key={`${e.at}-${i}`} className="flex gap-3.5 border-b border-line/50 py-3 last:border-0">
                <TimelineActionIcon action={e.action} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] leading-relaxed text-ink">{e.summary}</p>
                  <p className="mt-0.5 text-[11px] text-faint">
                    {e.actorName} · {formatDateTime(e.at)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
      ) : null}
    </div>
  );
}
