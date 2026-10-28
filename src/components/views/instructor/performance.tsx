"use client";

import * as React from "react";
import { Award, Briefcase, ClipboardCheck, Medal, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  performanceApi,
  type InternPerformanceDetail,
  type InternPerformanceRow,
} from "@/lib/client/api";
import { useResource } from "@/lib/client/use-resource";
import { formatDate, formatPercent } from "@/lib/client/labels";
import { ViewFrame } from "@/components/shared/view";
import {
  Panel,
  PanelHeader,
  PageHeader,
  Empty,
  Pager,
  UserAvatar,
  AnimatedProgressBar,
  KeyValue,
} from "@/components/shared/primitives";
import { RoleBadge, ScoreBadge, TaskStatusBadge } from "@/components/shared/badges";
import { LoadingBlock, ErrorBlock } from "@/components/shared/states";
import { SearchInput } from "@/components/shared/toolbar";
import { useDebounced } from "./shared";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 10;

export function InstructorPerformance() {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const debouncedSearch = useDebounced(search);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const ranking = useResource(
    () =>
      performanceApi.interns({
        search: debouncedSearch || undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
    [debouncedSearch, page]
  );

  const [detailUserId, setDetailUserId] = React.useState<string | null>(null);

  const rows = ranking.data?.data ?? [];

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Đánh giá & báo cáo"
        title="Hiệu suất sinh viên"
        description="Bảng xếp hạng thực tập sinh theo tỷ lệ hoàn thành nhiệm vụ, story points, điểm đánh giá và tiến độ đúng hạn."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2.5 rounded-2xl border border-line bg-panel/60 p-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Tìm thực tập sinh…"
          className="w-full sm:w-72"
        />
        {ranking.data ? (
          <span className="ml-auto font-mono text-xs text-faint">
            {ranking.data.meta.total} thực tập sinh
          </span>
        ) : null}
      </div>

      {ranking.loading ? (
        <LoadingBlock rows={6} />
      ) : ranking.error ? (
        <ErrorBlock error={ranking.error} onRetry={ranking.reload} />
      ) : rows.length === 0 ? (
        <Panel>
          <Empty
            icon={<TrendingUp />}
            title="Chưa có dữ liệu hiệu suất"
            description="Dữ liệu hiệu suất xuất hiện khi buổi thực tập có nhiệm vụ được giao."
          />
        </Panel>
      ) : (
        <Panel className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-line hover:bg-transparent">
                <TableHead className="w-16 px-4 text-[11px] uppercase tracking-wide text-faint">Hạng</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide text-faint">Thực tập sinh</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide text-faint">Vai trò</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide text-faint">Hoàn thành task</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide text-faint">Story points</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide text-faint">Điểm đánh giá</TableHead>
                <TableHead className="px-4 text-right text-[11px] uppercase tracking-wide text-faint">Đúng hạn</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.userId}
                  className="cursor-pointer border-line"
                  onClick={() => setDetailUserId(row.userId)}
                >
                  <TableCell className="px-4 py-3">
                    <RankBadge rank={row.rank} />
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="flex items-center gap-2.5">
                      <UserAvatar name={row.displayName} size={30} />
                      <span className="text-[13px] font-medium text-ink">{row.displayName}</span>
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <RoleBadge role={row.role} />
                  </TableCell>
                  <TableCell className="w-40 py-3">
                    <div className="flex items-center gap-2">
                      <AnimatedProgressBar value={row.taskCompletionRate} className="w-24" />
                      <span className="font-mono text-[11px] font-semibold text-dim">
                        {formatPercent(row.taskCompletionRate, 0)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="w-40 py-3">
                    <div className="flex items-center gap-2">
                      <AnimatedProgressBar value={row.storyPointCompletionRate} tone="teal" className="w-24" />
                      <span className="font-mono text-[11px] font-semibold text-dim">
                        {formatPercent(row.storyPointCompletionRate, 0)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <ScoreBadge score={row.averageEvaluationScore} />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right font-mono text-xs text-dim">
                    {formatPercent(row.onTimeCompletionRate, 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {ranking.data && ranking.data.meta.totalPages > 1 ? (
            <Pager
              page={ranking.data.meta.page}
              totalPages={ranking.data.meta.totalPages}
              total={ranking.data.meta.total}
              onChange={setPage}
            />
          ) : null}
        </Panel>
      )}

      <PerformanceDetailDialog userId={detailUserId} onOpenChange={(v) => !v && setDetailUserId(null)} />
    </ViewFrame>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="grid size-8 place-items-center rounded-lg bg-amber/15 text-amber" title="Hạng 1">
        <Medal className="size-4 icon" />
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="grid size-8 place-items-center rounded-lg bg-zinc-500/15 text-zinc-300" title="Hạng 2">
        <Medal className="size-4 icon" />
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="grid size-8 place-items-center rounded-lg bg-orange/15 text-orange" title="Hạng 3">
        <Medal className="size-4 icon" />
      </span>
    );
  }
  return <span className="grid size-8 place-items-center font-mono text-sm font-semibold text-faint">#{rank}</span>;
}

/* ==================== Dialog chi tiết ==================== */

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

  const trend = React.useMemo(
    () =>
      (data?.trend ?? []).map((t) => ({
        ...t,
        monthLabel: t.month.slice(5), // "2026-09" → "09"
      })),
    [data]
  );

  return (
    <Dialog open={Boolean(userId)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto rounded-2xl border-line bg-panel p-0">
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
            <DialogTitle className="text-left text-base font-semibold text-ink">
              Chi tiết hiệu suất
            </DialogTitle>
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
            {/* Metrics grid */}
            <div className="grid gap-3 sm:grid-cols-3">
              <MiniMetric
                label="Hoàn thành nhiệm vụ"
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
                value={
                  data.metrics.averageEvaluationScore !== null
                    ? `${data.metrics.averageEvaluationScore}`
                    : "—"
                }
                sub={`${data.metrics.finalizedEvaluationCount} đánh giá đã chốt`}
              />
              <MiniMetric
                label="Tiến độ sprint hiện tại"
                value={
                  data.metrics.activeSprintProgress !== null
                    ? formatPercent(data.metrics.activeSprintProgress, 0)
                    : "—"
                }
                sub="Sprint đang diễn ra"
              />
              <MiniMetric
                label="Phỏng vấn đầu vào"
                value={data.interviewSummary ? `${data.interviewSummary.overallScore}` : "—"}
                sub={
                  data.interviewSummary
                    ? `${data.interviewSummary.decision === "passed" ? "Đạt" : "Chưa đạt"} · tech ${data.interviewSummary.technicalScore} · soft ${data.interviewSummary.softSkillScore}`
                    : "Không có dữ liệu"
                }
              />
            </div>

            {/* Trend BarChart */}
            <Panel className="p-4">
              <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
                <TrendingUp className="size-3.5 icon text-brand-bright" /> Xu hướng 6 tháng (đã tạo vs hoàn thành)
              </p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" vertical={false} />
                    <XAxis
                      dataKey="monthLabel"
                      tick={{ fill: "#6B7671", fontSize: 11 }}
                      axisLine={{ stroke: "rgba(255,255,255,.08)" }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "#6B7671", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,.04)" }}
                      contentStyle={{
                        background: "#171D1B",
                        border: "1px solid rgba(255,255,255,.14)",
                        borderRadius: 12,
                        fontSize: 12,
                        color: "#EDF2EF",
                      }}
                      labelStyle={{ color: "#9AA5A0" }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, color: "#9AA5A0" }} />
                    <Bar dataKey="created" name="Đã tạo" fill="#2DD4BF" radius={[4, 4, 0, 0]} maxBarSize={22} />
                    <Bar dataKey="completed" name="Hoàn thành" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            {/* Assignments + tasks gần đây */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Panel className="p-4">
                <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
                  <Briefcase className="size-3.5 icon" /> Phân công
                </p>
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
                <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
                  <ClipboardCheck className="size-3.5 icon" /> Nhiệm vụ gần đây
                </p>
                {data.tasks.items.length === 0 ? (
                  <p className="text-xs text-faint">Chưa có nhiệm vụ.</p>
                ) : (
                  <ul className="max-h-64 space-y-1.5 overflow-y-auto">
                    {data.tasks.items.slice(0, 8).map((t) => (
                      <li
                        key={t.id}
                        className="flex items-center gap-2 rounded-lg border border-line bg-deep/60 px-3 py-2"
                      >
                        <span className="font-mono text-[10px] text-brand-bright/80">{t.code}</span>
                        <span className="min-w-0 flex-1 truncate text-xs text-ink">{t.title}</span>
                        <TaskStatusBadge status={t.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>

            {/* Interview summary */}
            {data.interviewSummary ? (
              <Panel className="p-4">
                <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
                  <Award className="size-3.5 icon text-amber" /> Kết quả phỏng vấn AI đầu vào
                </p>
                <div className="grid gap-3 sm:grid-cols-4">
                  <KeyValue label="Quyết định">
                    <ToneLabel passed={data.interviewSummary.decision === "passed"} />
                  </KeyValue>
                  <KeyValue label="Tổng điểm">{data.interviewSummary.overallScore}/100</KeyValue>
                  <KeyValue label="Kỹ thuật">{data.interviewSummary.technicalScore}/100</KeyValue>
                  <KeyValue label="Kỹ năng mềm">{data.interviewSummary.softSkillScore}/100</KeyValue>
                </div>
              </Panel>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ToneLabel({ passed }: { passed: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
        passed
          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
          : "border-rose-500/25 bg-rose-500/10 text-rose-300"
      }`}
    >
      {passed ? "Đạt" : "Chưa đạt"}
    </span>
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
