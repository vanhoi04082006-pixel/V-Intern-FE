"use client";

import * as React from "react";
import { Check, Compass, Lightbulb, RotateCw, Sparkles, Wrench, Workflow } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { outcomeApi, type AiRecommendation } from "@/lib/client/api";
import { useResource, useAction } from "@/lib/client/use-resource";
import { relativeTime } from "@/lib/client/labels";
import { Stagger, StaggerItem, ViewFrame } from "@/components/shared/view";
import { PageHeader, Panel, PanelHeader } from "@/components/shared/primitives";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "@/components/shared/badges";
import { ErrorBlock, InlineSpinner, LoadingBlock } from "@/components/shared/states";

const TYPE_META: Record<
  AiRecommendation["type"],
  { icon: React.ElementType; label: string; chip: string }
> = {
  skill: { icon: Wrench, label: "Kỹ năng", chip: "bg-teal/10 text-teal" },
  process: { icon: Workflow, label: "Quy trình", chip: "bg-brand/10 text-brand-bright" },
  career: { icon: Compass, label: "Định hướng nghề nghiệp", chip: "bg-amber/10 text-amber" },
};

function RecommendationCard({ rec }: { rec: AiRecommendation }) {
  const meta = TYPE_META[rec.type] ?? TYPE_META.skill;
  const Icon = meta.icon;

  return (
    <Panel className="flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <span className={cn("grid size-9 place-items-center rounded-xl", meta.chip)}>
          <Icon className="size-[18px] icon" />
        </span>
        <PriorityBadge priority={rec.priority} />
      </div>
      <p className="mt-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
        {meta.label}
      </p>
      <h3 className="mt-1.5 text-sm font-semibold leading-snug tracking-tight text-ink">
        {rec.title}
      </h3>
      <p className="mt-2 text-xs leading-relaxed text-dim">{rec.reason}</p>

      <ul className="mt-4 space-y-2">
        {rec.actions.map((action) => (
          <li key={action} className="flex items-start gap-2 text-xs leading-relaxed text-dim">
            <Check className="mt-0.5 size-3.5 shrink-0 icon text-brand-bright" />
            {action}
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
        {rec.evidenceMetricCodes.map((code) => (
          <span
            key={code}
            className="rounded border border-line bg-deep/60 px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-faint"
          >
            {code}
          </span>
        ))}
      </div>
    </Panel>
  );
}

export function RecommendationsView() {
  const res = useResource(() => outcomeApi.recommendations());
  const refresh = useAction(res.reload);

  const onRefresh = () =>
    refresh.run(async () => {
      await outcomeApi.refreshRecommendations();
      toast.success("Đã làm mới gợi ý phát triển từ AI");
    });

  const set = res.data;

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Kết quả & tăng trưởng"
        title="Gợi ý phát triển"
        description="Đề xuất từ AI dựa trên dữ liệu thật của bạn — nhiệm vụ, bài nộp, điểm KPI và đánh giá."
        actions={
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
            onClick={onRefresh}
            disabled={refresh.busy}
          >
            {refresh.busy ? (
              <InlineSpinner className="size-3.5" />
            ) : (
              <RotateCw className={cn("size-3.5 icon", refresh.busy && "animate-spin")} />
            )}
            {refresh.busy ? "Đang phân tích…" : "Làm mới gợi ý"}
          </Button>
        }
      />

      {res.loading ? (
        <LoadingBlock rows={4} variant="cards" />
      ) : res.error ? (
        <ErrorBlock error={res.error} onRetry={res.reload} />
      ) : !set || set.recommendations.length === 0 ? (
        <div className="card-surface">
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <span className="mb-4 grid size-12 place-items-center rounded-2xl border border-line bg-panel-2 text-dim">
              <Lightbulb className="size-5 icon" />
            </span>
            <p className="text-sm font-semibold text-ink">Chưa có gợi ý nào</p>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-dim">
              AI cần thêm dữ liệu về nhiệm vụ và bài nộp của bạn để đưa ra gợi ý phù hợp.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Panel>
            <PanelHeader
              icon={<Sparkles />}
              title="Tổng quan từ AI"
              description={`Đề xuất được sinh lúc ${relativeTime(set.createdAt)} — luôn mang tính tham khảo.`}
              actions={
                <span className="hidden rounded-full border border-brand/30 bg-brand/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand-bright sm:inline-flex">
                  Đề xuất của AI
                </span>
              }
            />
            <p className="px-5 py-4 text-sm leading-relaxed text-dim">{set.summary}</p>
          </Panel>

          <Stagger className="grid gap-4 md:grid-cols-2">
            {set.recommendations.map((rec) => (
              <StaggerItem key={rec.title} className="h-full">
                <RecommendationCard rec={rec} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      )}
    </ViewFrame>
  );
}
