"use client";

import * as React from "react";
import { ChevronRight, Scale, Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { navigate } from "@/lib/client/router";
import { outcomeApi, type KpiDetail, type KpiMetric, type KpiSummary } from "@/lib/client/api";
import { useResource } from "@/lib/client/use-resource";
import { formatDate } from "@/lib/client/labels";
import { Stagger, StaggerItem, ViewFrame } from "@/components/shared/view";
import { PageHeader, Panel, PanelHeader, ToneBadge } from "@/components/shared/primitives";
import { Button } from "@/components/ui/button";
import { ScoreBadge } from "@/components/shared/badges";
import { ErrorBlock, LoadingBlock } from "@/components/shared/states";
import { BackButton, ScoreBar, ScoreRing, fmtNum } from "./parts";

/* ==================== DANH SÁCH KỲ KPI ==================== */

function KpiStatusBadge({ status }: { status: KpiSummary["status"] }) {
  return status === "calculated" ? (
    <ToneBadge tone="emerald" dot>
      Đã tính
    </ToneBadge>
  ) : (
    <ToneBadge tone="amber" dot>
      Chờ tính
    </ToneBadge>
  );
}

function KpiCard({ kpi }: { kpi: KpiSummary }) {
  return (
    <button
      type="button"
      onClick={() => navigate(`/intern/kpi/${kpi.id}`)}
      className="card-surface group flex w-full flex-col p-5 text-left transition-colors hover:border-line-strong hover:bg-panel-2"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-mono text-lg font-bold tracking-tight text-ink">{kpi.period}</h3>
          <p className="mt-1 text-xs text-faint">Tính ngày {formatDate(kpi.calculatedAt)}</p>
        </div>
        <ChevronRight className="mt-1 size-4 shrink-0 icon text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-dim" />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <ScoreBadge score={kpi.finalScore} />
        <KpiStatusBadge status={kpi.status} />
      </div>
    </button>
  );
}

export function KpiListView() {
  const res = useResource(() => outcomeApi.kpis());
  const items = res.data?.data ?? [];

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Kết quả & tăng trưởng"
        title="KPI"
        description="Điểm KPI tổng hợp có trọng số từ nhiều chỉ số: hoàn thành task, tiến độ, chất lượng code và mức độ tương tác."
      />

      {res.loading ? (
        <LoadingBlock rows={2} variant="cards" />
      ) : res.error ? (
        <ErrorBlock error={res.error} onRetry={res.reload} />
      ) : items.length === 0 ? (
        <div className="card-surface py-4">
          <Panel className="border-0 bg-transparent shadow-none">
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <span className="mb-4 grid size-12 place-items-center rounded-2xl border border-line bg-panel-2 text-dim">
                <Target className="size-5 icon" />
              </span>
              <p className="text-sm font-semibold text-ink">Chưa có kỳ KPI nào được tính</p>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-dim">
                KPI được hệ thống tính tự động theo kỳ. Hãy duy trì tiến độ để có điểm tốt ở kỳ tới.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-5 rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
                onClick={() => navigate("/intern/performance")}
              >
                Xem hiệu suất của tôi
              </Button>
            </div>
          </Panel>
        </div>
      ) : (
        <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((kpi) => (
            <StaggerItem key={kpi.id}>
              <KpiCard kpi={kpi} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </ViewFrame>
  );
}

/* ==================== CHI TIẾT KỲ KPI ==================== */

function ContributionBar({ metric }: { metric: KpiMetric }) {
  const max = metric.effectiveWeight * 100;
  const pct = max > 0 ? Math.max(0, Math.min(100, (metric.weightedContribution / max) * 100)) : 0;
  return (
    <div
      className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]"
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Mức độ đạt của ${metric.label}`}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand to-brand-bright transition-[width] duration-700 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function MetricRow({ metric }: { metric: KpiMetric }) {
  const configuredPct = (metric.configuredWeight * 100).toFixed(0);
  const effectivePct = (metric.effectiveWeight * 100).toFixed(0);
  const weightChanged = metric.effectiveWeight !== metric.configuredWeight;

  return (
    <div className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">{metric.label}</p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-faint">
            {metric.metricCode}
          </p>
        </div>
        <div className="text-right">
          <span className="font-mono text-lg font-bold tabular-nums text-ink">
            +{fmtNum(metric.weightedContribution)}
          </span>
          <span className="ml-1 font-mono text-[11px] text-faint">/{effectivePct} tối đa</span>
        </div>
      </div>

      <ContributionBar metric={metric} />

      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-faint">
        <span>
          Giá trị nguồn:{" "}
          <span className="font-mono font-semibold text-dim">{fmtNum(metric.sourceValue)}</span>
        </span>
        <span>
          Trọng số cấu hình:{" "}
          <span className="font-mono font-semibold text-dim">{configuredPct}%</span>
          {weightChanged ? (
            <span className="ml-1.5 font-mono font-semibold text-amber">
              → hiệu dụng {effectivePct}%
            </span>
          ) : (
            <span className="ml-1.5 font-mono text-dim">({effectivePct}% hiệu dụng)</span>
          )}
        </span>
      </div>

      <details className="group mt-2.5">
        <summary className="inline-flex cursor-pointer select-none list-none items-center gap-1 text-[11px] font-medium text-faint transition-colors hover:text-dim [&::-webkit-details-marker]:hidden">
          <ChevronRight className="size-3 icon transition-transform group-open:rotate-90" />
          Nguồn dữ liệu thô
        </summary>
        <pre className="mt-2 overflow-x-auto rounded-lg border border-line bg-deep/60 p-3 font-mono text-[11px] leading-relaxed text-dim">
          {JSON.stringify(metric.sourceJson, null, 2)}
        </pre>
      </details>
    </div>
  );
}

export function KpiDetailView({ params }: { params: Record<string, string> }) {
  const res = useResource(() => outcomeApi.kpi(params.id), [params.id]);
  const kpi: KpiDetail | null = res.data;

  const total = kpi ? kpi.metrics.reduce((acc, m) => acc + m.weightedContribution, 0) : 0;
  const matches = kpi ? Math.abs(total - kpi.finalScore) < 0.15 : false;

  return (
    <ViewFrame>
      <BackButton to="/intern/kpi" label="Tất cả kỳ KPI" />

      {res.loading ? (
        <LoadingBlock variant="detail" rows={6} />
      ) : res.error ? (
        <ErrorBlock error={res.error} onRetry={res.reload} />
      ) : !kpi ? (
        <div className="card-surface">
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <span className="mb-4 grid size-12 place-items-center rounded-2xl border border-line bg-panel-2 text-dim">
              <Target className="size-5 icon" />
            </span>
            <p className="text-sm font-semibold text-ink">Không tìm thấy kỳ KPI</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-5 rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
              onClick={() => navigate("/intern/kpi")}
            >
              Về danh sách KPI
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <PageHeader
            eyebrow="Kết quả & tăng trưởng"
            title={`KPI ${kpi.period}`}
            description={`Điểm tổng hợp có trọng số từ ${kpi.metrics.length} chỉ số hiệu suất.`}
            actions={<KpiStatusBadge status={kpi.status} />}
          />

          <Panel className="relative overflow-hidden p-6 md:p-8">
            <div className="grid-bg pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
            <div className="relative flex flex-col items-center text-center">
              <ScoreRing score={kpi.finalScore} size={188} caption="KPI cuối kỳ" />
              <p className="mt-4 text-sm text-dim">
                Kỳ đánh giá <span className="font-mono font-semibold text-ink">{kpi.period}</span>
              </p>
              <p className="mt-1 text-xs text-faint">
                Tính ngày {formatDate(kpi.calculatedAt)}
              </p>
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <PanelHeader
              icon={<Scale />}
              title="Chỉ số đóng góp"
              description="Điểm đóng góp = giá trị nguồn × trọng số hiệu dụng — bung “nguồn dữ liệu thô” để xem chi tiết."
            />
            <div className="divide-y divide-line">
              {kpi.metrics.map((metric) => (
                <MetricRow key={metric.metricCode} metric={metric} />
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-deep/40 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-ink">Tổng đóng góp</p>
                <p className="mt-0.5 font-mono text-[11px] text-faint">
                  {kpi.metrics.map((m) => fmtNum(m.weightedContribution)).join(" + ")}
                </p>
              </div>
              <div className="text-right">
                <span className="font-mono text-2xl font-bold tabular-nums text-brand-bright">
                  {fmtNum(total)}
                </span>
                <span className="ml-1 text-xs text-faint">điểm</span>
                <p
                  className={cn(
                    "mt-0.5 flex items-center justify-end gap-1 text-[11px]",
                    matches ? "text-brand-bright" : "text-amber"
                  )}
                >
                  <TrendingUp className="size-3 icon" />
                  {matches
                    ? `Khớp điểm KPI cuối kỳ (${fmtNum(kpi.finalScore)})`
                    : `Điểm KPI hệ thống: ${fmtNum(kpi.finalScore)}`}
                </p>
              </div>
            </div>
          </Panel>
        </div>
      )}
    </ViewFrame>
  );
}
