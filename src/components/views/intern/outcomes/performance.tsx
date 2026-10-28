"use client";

import * as React from "react";
import {
  AlarmClockOff,
  Boxes,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Gauge,
  ListChecks,
  ListTodo,
  Rocket,
  TrendingUp,
} from "lucide-react";
import { navigate } from "@/lib/client/router";
import { outcomeApi, type PerformanceMetrics } from "@/lib/client/api";
import { useResource } from "@/lib/client/use-resource";
import { Stagger, StaggerItem, ViewFrame } from "@/components/shared/view";
import {
  AnimatedProgressBar,
  PageHeader,
  Panel,
  PanelHeader,
  SectionHeading,
} from "@/components/shared/primitives";
import { AnimatedNumber } from "@/components/shared/counters";
import { ErrorBlock, LoadingBlock } from "@/components/shared/states";
import { Button } from "@/components/ui/button";

/* 4 thẻ số liệu chính */
function MainMetrics({ m }: { m: PerformanceMetrics }) {
  return (
    <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StaggerItem>
        <Panel className="h-full p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-dim">Tỷ lệ hoàn thành task</span>
            <span className="grid size-8 place-items-center rounded-lg bg-brand/10 text-brand-bright">
              <ListChecks className="size-4 icon" />
            </span>
          </div>
          <div className="mt-3 font-mono text-4xl font-bold leading-none tracking-tight text-ink">
            <AnimatedNumber value={m.taskCompletionRate} decimals={1} suffix="%" />
          </div>
          <div className="mt-2 text-xs text-faint">
            {m.completedTaskCount}/{m.totalTaskCount} nhiệm vụ đã hoàn thành
          </div>
          <AnimatedProgressBar value={m.taskCompletionRate} className="mt-3" tone="brand" />
        </Panel>
      </StaggerItem>

      <StaggerItem>
        <Panel className="h-full p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-dim">Hoàn thành story point</span>
            <span className="grid size-8 place-items-center rounded-lg bg-teal/10 text-teal">
              <Boxes className="size-4 icon" />
            </span>
          </div>
          <div className="mt-3 font-mono text-4xl font-bold leading-none tracking-tight text-ink">
            <AnimatedNumber value={m.storyPointCompletionRate} decimals={1} suffix="%" />
          </div>
          <div className="mt-2 text-xs text-faint">
            {m.completedStoryPoints}/{m.committedStoryPoints} SP đã cam kết
          </div>
          <AnimatedProgressBar value={m.storyPointCompletionRate} className="mt-3" tone="teal" />
        </Panel>
      </StaggerItem>

      <StaggerItem>
        <Panel className="h-full p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-dim">Đúng hạn</span>
            <span className="grid size-8 place-items-center rounded-lg bg-amber/10 text-amber">
              <CalendarCheck className="size-4 icon" />
            </span>
          </div>
          <div className="mt-3 font-mono text-4xl font-bold leading-none tracking-tight text-ink">
            <AnimatedNumber value={m.onTimeCompletionRate} decimals={1} suffix="%" />
          </div>
          <div className="mt-2 text-xs text-faint">
            Nhiệm vụ hoàn thành đúng hạn đã chốt
          </div>
          <AnimatedProgressBar
            value={m.onTimeCompletionRate}
            className="mt-3"
            tone={m.onTimeCompletionRate >= 80 ? "brand" : "amber"}
          />
        </Panel>
      </StaggerItem>

      <StaggerItem>
        <Panel className="h-full p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-dim">Điểm đánh giá trung bình</span>
            <span className="grid size-8 place-items-center rounded-lg bg-orange/10 text-orange">
              <ClipboardCheck className="size-4 icon" />
            </span>
          </div>
          <div className="mt-3 font-mono text-4xl font-bold leading-none tracking-tight text-ink">
            {m.averageEvaluationScore === null ? (
              "—"
            ) : (
              <AnimatedNumber value={m.averageEvaluationScore} decimals={0} />
            )}
          </div>
          <div className="mt-2 text-xs text-faint">
            Từ {m.finalizedEvaluationCount} đánh giá đã chốt
          </div>
        </Panel>
      </StaggerItem>
    </Stagger>
  );
}

/* Các thẻ số liệu phụ */
function SecondaryMetrics({ m }: { m: PerformanceMetrics }) {
  const hasOverdue = m.overdueOpenTaskCount > 0;
  const cards: { label: string; icon: React.ReactNode; chip: string; value: React.ReactNode; hint: string }[] = [
    {
      label: "Tổng nhiệm vụ",
      icon: <ListTodo className="size-4 icon" />,
      chip: "bg-panel-2 text-dim",
      value: <AnimatedNumber value={m.totalTaskCount} />,
      hint: "Được giao trong kỳ thực tập",
    },
    {
      label: "Nhiệm vụ hoàn thành",
      icon: <CheckCircle2 className="size-4 icon" />,
      chip: "bg-brand/10 text-brand-bright",
      value: <AnimatedNumber value={m.completedTaskCount} />,
      hint: "Đã được duyệt bài nộp",
    },
    {
      label: "Task trễ hạn còn mở",
      icon: <AlarmClockOff className="size-4 icon" />,
      chip: hasOverdue ? "bg-rose/10 text-rose" : "bg-panel-2 text-dim",
      value: <AnimatedNumber value={m.overdueOpenTaskCount} />,
      hint: hasOverdue ? "Cần được xử lý sớm" : "Không có task trễ hạn",
    },
    {
      label: "Đánh giá đã chốt",
      icon: <ClipboardCheck className="size-4 icon" />,
      chip: "bg-teal/10 text-teal",
      value: <AnimatedNumber value={m.finalizedEvaluationCount} />,
      hint: "Chu kỳ đánh giá hoàn tất",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="card-surface p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-dim">{card.label}</span>
            <span className={`grid size-7 shrink-0 place-items-center rounded-lg ${card.chip}`}>
              {card.icon}
            </span>
          </div>
          <div
            className={`mt-2 font-mono text-[26px] font-bold leading-none tracking-tight ${
              card.label === "Task trễ hạn còn mở" && hasOverdue ? "text-rose" : "text-ink"
            }`}
          >
            {card.value}
          </div>
          <div className="mt-1.5 text-xs text-faint">{card.hint}</div>
        </div>
      ))}
    </div>
  );
}

/* Thẻ tổng quan nhiệm vụ */
function TaskOverview({ m }: { m: PerformanceMetrics }) {
  return (
    <Panel>
      <PanelHeader
        icon={<Gauge />}
        title="Tổng quan nhiệm vụ"
        description="Tổng hợp tiến độ nhiệm vụ và sprint hiện tại của bạn"
      />
      <div className="space-y-5 p-5">
        <p className="text-sm leading-relaxed text-dim">
          Bạn đang có <span className="font-semibold text-ink">{m.totalTaskCount} nhiệm vụ</span>{" "}
          được giao, trong đó{" "}
          <span className="font-semibold text-ink">{m.completedTaskCount} đã hoàn thành</span> và{" "}
          <span className="font-semibold text-brand-bright">
            {m.completedStoryPoints}/{m.committedStoryPoints} story point
          </span>{" "}
          đã bàn giao.{" "}
          {m.overdueOpenTaskCount > 0
            ? `Hiện còn ${m.overdueOpenTaskCount} nhiệm vụ trễ hạn đang mở — hãy ưu tiên xử lý sớm.`
            : "Hiện không có nhiệm vụ trễ hạn — giữ nhịp tốt nhé."}
        </p>

        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <div className="mb-1.5 flex items-baseline justify-between text-xs">
              <span className="text-dim">Hoàn thành nhiệm vụ</span>
              <span className="font-mono font-semibold text-ink">
                {m.taskCompletionRate.toLocaleString("vi-VN")}%
              </span>
            </div>
            <AnimatedProgressBar value={m.taskCompletionRate} tone="brand" />
          </div>
          <div>
            <div className="mb-1.5 flex items-baseline justify-between text-xs">
              <span className="text-dim">Story point</span>
              <span className="font-mono font-semibold text-ink">
                {m.storyPointCompletionRate.toLocaleString("vi-VN")}%
              </span>
            </div>
            <AnimatedProgressBar value={m.storyPointCompletionRate} tone="teal" />
          </div>
          <div>
            <div className="mb-1.5 flex items-baseline justify-between text-xs">
              <span className="flex items-center gap-1.5 text-dim">
                <Rocket className="size-3.5 icon text-faint" />
                Sprint hiện tại
              </span>
              <span className="font-mono font-semibold text-ink">
                {m.activeSprintProgress === null ? "—" : `${m.activeSprintProgress}%`}
              </span>
            </div>
            <AnimatedProgressBar value={m.activeSprintProgress ?? 0} tone="amber" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-line pt-4">
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
            onClick={() => navigate("/intern/work")}
          >
            <ListTodo className="size-3.5 icon" /> Xem công việc
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
            onClick={() => navigate("/intern/sprint")}
          >
            <Rocket className="size-3.5 icon" /> Sprint của tôi
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
            onClick={() => navigate("/intern/kpi")}
          >
            <TrendingUp className="size-3.5 icon" /> Xem KPI
          </Button>
        </div>
      </div>
    </Panel>
  );
}

export function PerformanceView() {
  const res = useResource(() => outcomeApi.performance());
  const m = res.data;

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Kết quả & tăng trưởng"
        title="Hiệu suất"
        description="Bức tranh tổng thể về tiến độ, chất lượng và điểm số của bạn trong kỳ thực tập hiện tại."
      />

      {res.loading ? (
        <LoadingBlock rows={4} variant="cards" />
      ) : res.error ? (
        <ErrorBlock error={res.error} onRetry={res.reload} />
      ) : m ? (
        <div className="space-y-4">
          <MainMetrics m={m} />
          <div>
            <SectionHeading>Chỉ số chi tiết</SectionHeading>
            <SecondaryMetrics m={m} />
          </div>
          <TaskOverview m={m} />
        </div>
      ) : null}
    </ViewFrame>
  );
}
