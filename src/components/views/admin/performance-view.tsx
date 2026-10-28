"use client";

import * as React from "react";
import { Download, Medal, UserSearch } from "lucide-react";
import { toast } from "sonner";
import {
  performanceApi,
  sessionApi,
  type InternPerformanceDetail,
  type InternPerformanceRow,
} from "@/lib/client/api";
import { useResource } from "@/lib/client/use-resource";
import { formatPercent } from "@/lib/client/labels";
import {
  AnimatedProgressBar,
  Empty,
  PageHeader,
  Pager,
  Panel,
  UserAvatar,
} from "@/components/shared/primitives";
import { RoleBadge, ScoreBadge, TaskStatusBadge } from "@/components/shared/badges";
import { LoadingBlock, ErrorBlock } from "@/components/shared/states";
import { FilterBar, FilterSelect, SearchInput } from "@/components/shared/toolbar";
import { ViewFrame } from "@/components/shared/view";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  TableShell,
  TBody,
  Td,
  THead,
  Th,
  Tr,
  useDebounced,
} from "./admin-shared";

const PAGE_SIZE = 10;

/* ---------- xuất CSV client-side (không cần endpoint) ---------- */

function csvEscape(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadCsv(rows: InternPerformanceRow[]): void {
  if (rows.length === 0) {
    toast.error("Chưa có dữ liệu để xuất.");
    return;
  }
  const header = [
    "Hạng",
    "Thực tập sinh",
    "Vai trò",
    "Nhiệm vụ hoàn thành",
    "Tổng nhiệm vụ",
    "Tỷ lệ hoàn thành (%)",
    "Story points (%)",
    "Điểm đánh giá TB",
    "Đúng hạn (%)",
  ];
  const lines = [header.join(",")];
  rows.forEach((r) => {
    lines.push(
      [
        r.rank,
        r.displayName,
        r.role,
        r.completedTaskCount,
        r.totalTaskCount,
        r.taskCompletionRate,
        r.storyPointCompletionRate,
        r.averageEvaluationScore ?? "",
        r.onTimeCompletionRate,
      ]
        .map(csvEscape)
        .join(",")
    );
  });
  // BOM để Excel đọc đúng tiếng Việt.
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hieu-suat-thuc-tap-sinh-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast.success(`Đã xuất CSV ${rows.length} thực tập sinh (trang hiện tại).`);
}

/* ---------- badge hạng ---------- */

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="grid size-8 place-items-center rounded-lg bg-amber/15 text-amber" title="Hạng 1">
        <Medal className="size-4 icon" />
      </span>
    );
  }
  return <span className="grid size-8 place-items-center font-mono text-sm font-semibold text-faint">#{rank}</span>;
}

/* ---------- dialog chi tiết ---------- */

function PerformanceDetailDialog({
  userId,
  onOpenChange,
}: {
  userId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const detail = useResource(
    () => (userId ? performanceApi.internDetail(userId) : Promise.resolve(null)),
    [userId]
  );
  const data: InternPerformanceDetail | null = detail.data;

  return (
    <Dialog open={Boolean(userId)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto rounded-2xl border-line bg-panel p-0">
        <DialogHeader className="border-b border-line px-6 pt-6">
          {data ? (
            <div className="flex items-center gap-4">
              <UserAvatar name={data.profile.displayName} size={48} />
              <div>
                <DialogTitle className="text-left text-base font-semibold text-ink">
                  {data.profile.displayName}
                </DialogTitle>
                <DialogDescription className="text-left text-xs text-dim">
                  {data.profile.email} · <RoleBadge role={data.profile.role} />
                </DialogDescription>
              </div>
            </div>
          ) : (
            <DialogTitle className="text-left text-base font-semibold text-ink">Chi tiết hiệu suất</DialogTitle>
          )}
        </DialogHeader>

        {detail.loading ? (
          <div className="px-6 py-8">
            <LoadingBlock rows={4} />
          </div>
        ) : detail.error || !data ? (
          <div className="px-6 py-6">
            <ErrorBlock error={detail.error ?? new Error("Không có dữ liệu")} onRetry={detail.reload} />
          </div>
        ) : (
          <div className="space-y-5 px-6 py-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <MiniMetric
                label="Nhiệm vụ hoàn thành"
                value={`${data.metrics.completedTaskCount}/${data.metrics.totalTaskCount}`}
                sub={formatPercent(data.metrics.taskCompletionRate, 1)}
              />
              <MiniMetric
                label="Story points"
                value={`${data.metrics.completedStoryPoints}/${data.metrics.committedStoryPoints}`}
                sub={formatPercent(data.metrics.storyPointCompletionRate, 1)}
              />
              <MiniMetric
                label="Đúng hạn"
                value={formatPercent(data.metrics.onTimeCompletionRate, 0)}
                sub={`${data.metrics.overdueOpenTaskCount} trễ hạn chưa đóng`}
              />
              <MiniMetric
                label="Điểm đánh giá TB"
                value={data.metrics.averageEvaluationScore !== null ? String(data.metrics.averageEvaluationScore) : "—"}
                sub={`${data.metrics.finalizedEvaluationCount} đánh giá đã chốt`}
              />
              <MiniMetric
                label="Tiến độ sprint hiện tại"
                value={data.metrics.activeSprintProgress !== null ? formatPercent(data.metrics.activeSprintProgress, 0) : "—"}
                sub="Sprint đang diễn ra"
              />
              <MiniMetric
                label="Phỏng vấn đầu vào"
                value={data.interviewSummary ? String(data.interviewSummary.overallScore) : "—"}
                sub={
                  data.interviewSummary
                    ? `${data.interviewSummary.decision === "passed" ? "Đạt" : "Chưa đạt"} · tech ${data.interviewSummary.technicalScore} · soft ${data.interviewSummary.softSkillScore}`
                    : "Không có dữ liệu"
                }
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel className="p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-faint">Phân công</p>
                {data.assignments.length === 0 ? (
                  <p className="text-xs text-faint">Chưa có phân công.</p>
                ) : (
                  <ul className="space-y-2">
                    {data.assignments.map((a) => (
                      <li key={`${a.projectName}-${a.sessionName}`} className="rounded-lg border border-line bg-deep/60 p-3">
                        <p className="text-[13px] font-medium text-ink">{a.projectName}</p>
                        <p className="mt-0.5 text-[11px] text-faint">
                          {a.sessionName} · <RoleBadge role={a.role} />
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              <Panel className="p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-faint">Nhiệm vụ gần đây</p>
                {data.tasks.items.length === 0 ? (
                  <p className="text-xs text-faint">Chưa có nhiệm vụ.</p>
                ) : (
                  <ul className="max-h-64 space-y-1.5 overflow-y-auto">
                    {data.tasks.items.slice(0, 8).map((t) => (
                      <li key={t.id} className="flex items-center gap-2 rounded-lg border border-line bg-deep/60 px-3 py-2">
                        <span className="font-mono text-[10px] text-brand-bright/80">{t.code}</span>
                        <span className="min-w-0 flex-1 truncate text-xs text-ink">{t.title}</span>
                        <TaskStatusBadge status={t.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>

            <Panel className="p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-faint">Xu hướng 6 tháng</p>
              {data.trend.length === 0 ? (
                <p className="text-xs text-faint">Chưa có dữ liệu xu hướng.</p>
              ) : (
                <div className="flex items-end gap-3">
                  {data.trend.map((t) => {
                    const max = Math.max(...data.trend.map((x) => Math.max(x.created, x.completed)), 1);
                    return (
                      <div key={t.month} className="flex flex-1 flex-col items-center gap-1.5">
                        <div className="flex h-24 w-full items-end justify-center gap-1">
                          <div
                            className="w-3 rounded-t bg-teal/70"
                            style={{ height: `${Math.round((t.created / max) * 100)}%` }}
                            title={`Đã tạo: ${t.created}`}
                          />
                          <div
                            className="w-3 rounded-t bg-brand"
                            style={{ height: `${Math.round((t.completed / max) * 100)}%` }}
                            title={`Hoàn thành: ${t.completed}`}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-faint">{t.month.slice(5)}</span>
                      </div>
                    );
                  })}
                  <div className="flex flex-col gap-1.5 pl-2 text-[10px] text-faint">
                    <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-teal/70" /> Đã tạo</span>
                    <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-brand" /> Hoàn thành</span>
                  </div>
                </div>
              )}
            </Panel>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MiniMetric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-line bg-deep/60 p-3.5">
      <p className="text-[11px] font-medium text-dim">{label}</p>
      <p className="mt-1.5 font-mono text-xl font-bold leading-none text-ink">{value}</p>
      <p className="mt-1 text-[10px] text-faint">{sub}</p>
    </div>
  );
}

/* ============================ view chính ============================ */

export function AdminPerformance() {
  const [page, setPage] = React.useState(1);
  const [qInput, setQInput] = React.useState("");
  const q = useDebounced(qInput);
  const [sessionId, setSessionId] = React.useState("");

  const sessions = useResource(() => sessionApi.overview({ page: 1, pageSize: 50 }), []);
  const sessionOptions = (sessions.data?.data ?? []).map((s) => ({
    value: s.id,
    label: `${s.code} · ${s.name}`,
  }));

  const ranking = useResource(
    () =>
      performanceApi.interns({
        search: q || undefined,
        sessionId: sessionId || undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
    [q, sessionId, page]
  );

  const [detailUserId, setDetailUserId] = React.useState<string | null>(null);
  const rows = ranking.data?.data ?? [];

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Quản trị hệ thống"
        title="Hiệu suất thực tập sinh"
        description="Bảng xếp hạng toàn nền tảng theo phiên thực tập: tỷ lệ hoàn thành nhiệm vụ, story points, điểm đánh giá và tiến độ đúng hạn."
        actions={
          <button
            type="button"
            onClick={() => downloadCsv(rows)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-transparent px-3.5 text-[13px] font-medium text-dim transition-colors hover:border-line-strong hover:bg-panel-2 hover:text-ink"
          >
            <Download className="size-4 icon" /> Xuất CSV
          </button>
        }
      />

      <FilterBar
        hasActive={Boolean(qInput || sessionId)}
        onReset={() => {
          setQInput("");
          setSessionId("");
          setPage(1);
        }}
      >
        <SearchInput
          value={qInput}
          onChange={(v) => {
            setQInput(v);
            setPage(1);
          }}
          placeholder="Tìm thực tập sinh…"
          className="w-full sm:w-64"
        />
        <FilterSelect
          value={sessionId}
          onChange={(v) => {
            setSessionId(v);
            setPage(1);
          }}
          options={sessionOptions}
          placeholder="Phiên thực tập"
          allLabel="Tất cả phiên"
          ariaLabel="Lọc theo phiên thực tập"
          className="w-full sm:w-72"
        />
        {ranking.data ? (
          <span className="ml-auto font-mono text-xs text-faint">{ranking.data.meta.total} thực tập sinh</span>
        ) : null}
      </FilterBar>

      {ranking.loading ? (
        <LoadingBlock rows={6} />
      ) : ranking.error ? (
        <ErrorBlock error={ranking.error} onRetry={ranking.reload} />
      ) : rows.length === 0 ? (
        <Panel>
          <Empty
            icon={<UserSearch className="icon" />}
            title="Chưa có dữ liệu hiệu suất"
            description="Dữ liệu xuất hiện khi phiên thực tập có nhiệm vụ được giao cho sinh viên."
          />
        </Panel>
      ) : (
        <TableShell minWidth={980}>
          <THead>
            <tr>
              <Th>Hạng</Th>
              <Th>Thực tập sinh</Th>
              <Th>Vai trò</Th>
              <Th>Nhiệm vụ</Th>
              <Th>Story points</Th>
              <Th>Điểm đánh giá</Th>
              <Th className="text-right">Đúng hạn</Th>
            </tr>
          </THead>
          <TBody>
            {rows.map((row) => (
              <Tr key={row.userId} className="cursor-pointer">
                <td className="px-4 py-3 align-middle" onClick={() => setDetailUserId(row.userId)}>
                  <RankBadge rank={row.rank} />
                </td>
                <td className="px-4 py-3 align-middle text-ink" onClick={() => setDetailUserId(row.userId)}>
                  <span className="flex items-center gap-2.5">
                    <UserAvatar name={row.displayName} size={30} />
                    <span className="text-[13px] font-medium">{row.displayName}</span>
                  </span>
                </td>
                <td className="px-4 py-3 align-middle" onClick={() => setDetailUserId(row.userId)}>
                  <RoleBadge role={row.role} />
                </td>
                <td className="w-44 px-4 py-3 align-middle" onClick={() => setDetailUserId(row.userId)}>
                  <div className="flex items-center gap-2">
                    <AnimatedProgressBar value={row.taskCompletionRate} className="w-24" />
                    <span className="font-mono text-[11px] font-semibold text-dim">
                      {row.completedTaskCount}/{row.totalTaskCount}
                    </span>
                  </div>
                </td>
                <td className="w-44 px-4 py-3 align-middle" onClick={() => setDetailUserId(row.userId)}>
                  <div className="flex items-center gap-2">
                    <AnimatedProgressBar value={row.storyPointCompletionRate} tone="teal" className="w-24" />
                    <span className="font-mono text-[11px] font-semibold text-dim">
                      {formatPercent(row.storyPointCompletionRate, 0)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 align-middle" onClick={() => setDetailUserId(row.userId)}>
                  <ScoreBadge score={row.averageEvaluationScore} />
                </td>
                <td className="px-4 py-3 text-right align-middle font-mono text-xs text-dim" onClick={() => setDetailUserId(row.userId)}>
                  {formatPercent(row.onTimeCompletionRate, 0)}
                </td>
              </Tr>
            ))}
          </TBody>
        </TableShell>
      )}

      {ranking.data && ranking.data.meta.totalPages > 1 ? (
        <div className="mt-4">
          <Pager
            page={ranking.data.meta.page}
            totalPages={ranking.data.meta.totalPages}
            total={ranking.data.meta.total}
            onChange={setPage}
          />
        </div>
      ) : null}

      <PerformanceDetailDialog userId={detailUserId} onOpenChange={(v) => !v && setDetailUserId(null)} />
    </ViewFrame>
  );
}
