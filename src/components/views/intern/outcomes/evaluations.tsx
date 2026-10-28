"use client";

import * as React from "react";
import {
  CalendarCheck,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  MessageSquareText,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { navigate } from "@/lib/client/router";
import { outcomeApi, type MyEvaluation } from "@/lib/client/api";
import { useResource } from "@/lib/client/use-resource";
import { formatDate } from "@/lib/client/labels";
import { Stagger, StaggerItem, ViewFrame } from "@/components/shared/view";
import { Button } from "@/components/ui/button";
import { Empty, PageHeader, Panel, PanelHeader } from "@/components/shared/primitives";
import { EvaluationStatusBadge, ScoreBadge } from "@/components/shared/badges";
import { ErrorBlock, LoadingBlock } from "@/components/shared/states";
import { BackButton, ScoreBar, ScoreRing, scoreTextClass } from "./parts";

/* ==================== DANH SÁCH ĐÁNH GIÁ ==================== */

function EvaluationCard({ evaluation }: { evaluation: MyEvaluation }) {
  const dateLine =
    evaluation.finalizedAt
      ? `Chốt ngày ${formatDate(evaluation.finalizedAt)}`
      : evaluation.submittedAt
        ? `Nộp ngày ${formatDate(evaluation.submittedAt)}`
        : "Giảng viên đang soạn nháp";

  return (
    <button
      type="button"
      onClick={() => navigate(`/intern/evaluations/${evaluation.id}`)}
      className="card-surface group flex w-full items-start justify-between gap-4 p-5 text-left transition-colors hover:border-line-strong hover:bg-panel-2"
    >
      <div className="min-w-0">
        <h3 className="truncate text-sm font-semibold tracking-tight text-ink">
          {evaluation.cycleName}
        </h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-dim">
          <UserRound className="size-3.5 shrink-0 icon text-faint" />
          {evaluation.evaluatorName}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-faint">
          <CalendarCheck className="size-3.5 shrink-0 icon text-faint" />
          {dateLine}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <EvaluationStatusBadge status={evaluation.status} />
          <ScoreBadge score={evaluation.overallScore} />
        </div>
      </div>
      <ChevronRight className="mt-1 size-4 shrink-0 icon text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-dim" />
    </button>
  );
}

export function EvaluationsView() {
  const res = useResource(() => outcomeApi.evaluations());
  const items = res.data?.data ?? [];

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Kết quả & tăng trưởng"
        title="Đánh giá của tôi"
        description="Kết quả đánh giá theo từng chu kỳ từ giảng viên hướng dẫn — điểm tổng hợp và nhận xét chi tiết theo tiêu chí."
      />

      {res.loading ? (
        <LoadingBlock rows={3} variant="cards" />
      ) : res.error ? (
        <ErrorBlock error={res.error} onRetry={res.reload} />
      ) : items.length === 0 ? (
        <div className="card-surface">
          <Empty
            icon={<ClipboardCheck />}
            title="Chưa có đánh giá nào"
            description="Đánh giá từ giảng viên sẽ xuất hiện ở đây sau khi chu kỳ đánh giá được mở và chốt."
            action={
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
                onClick={() => navigate("/intern/work")}
              >
                Xem công việc của tôi
              </Button>
            }
          />
        </div>
      ) : (
        <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((evaluation) => (
            <StaggerItem key={evaluation.id}>
              <EvaluationCard evaluation={evaluation} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </ViewFrame>
  );
}

/* ==================== CHI TIẾT ĐÁNH GIÁ ==================== */

function EvaluationMeta({ evaluation }: { evaluation: MyEvaluation }) {
  return (
    <Panel className="relative overflow-hidden p-6 md:p-8">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="relative flex flex-col items-center text-center">
        <ScoreRing score={evaluation.overallScore} size={188} caption="tổng điểm" />
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <EvaluationStatusBadge status={evaluation.status} />
          <ScoreBadge score={evaluation.overallScore} />
        </div>
        <p className="mt-4 text-sm leading-relaxed text-dim">
          Đánh giá bởi{" "}
          <span className="font-semibold text-ink">{evaluation.evaluatorName}</span>
        </p>
        <p className="mt-1 text-xs text-faint">
          {evaluation.finalizedAt
            ? `Chốt ngày ${formatDate(evaluation.finalizedAt)}`
            : evaluation.submittedAt
              ? `Nộp ngày ${formatDate(evaluation.submittedAt)}`
              : "Đang trong quá trình chấm"}
        </p>
      </div>
    </Panel>
  );
}

export function EvaluationDetailView({ params }: { params: Record<string, string> }) {
  const res = useResource(() => outcomeApi.evaluations());
  const evaluation =
    res.data?.data.find((item) => item.id === params.id) ?? null;

  return (
    <ViewFrame>
      <BackButton to="/intern/evaluations" label="Tất cả đánh giá" />

      {res.loading ? (
        <LoadingBlock variant="detail" rows={6} />
      ) : res.error ? (
        <ErrorBlock error={res.error} onRetry={res.reload} />
      ) : !evaluation ? (
        <div className="card-surface">
          <Empty
            icon={<ClipboardList />}
            title="Không tìm thấy đánh giá"
            description="Đánh giá này không tồn tại hoặc đã bị ẩn khỏi tài khoản của bạn."
            action={
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink"
                onClick={() => navigate("/intern/evaluations")}
              >
                Về danh sách đánh giá
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          <PageHeader
            eyebrow={evaluation.status === "finalized" ? "Đã chốt" : "Đang chấm"}
            title={evaluation.cycleName}
            description={`Điểm tổng hợp theo ${evaluation.scores.length} tiêu chí từ giảng viên ${evaluation.evaluatorName}.`}
          />

          <EvaluationMeta evaluation={evaluation} />

          <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <Panel className="overflow-hidden">
              <PanelHeader
                icon={<ClipboardList />}
                title="Điểm theo tiêu chí"
                description="Ngưỡng: ≥80 Xuất sắc · ≥60 Tốt · ≥40 Trung bình · <40 Cần cải thiện"
              />
              <div className="divide-y divide-line">
                {evaluation.scores.map((score) => (
                  <div key={score.criterionCode} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">{score.label}</p>
                        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-faint">
                          {score.criterionCode}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "font-mono text-lg font-bold tabular-nums",
                          scoreTextClass(score.score)
                        )}
                      >
                        {score.score ?? "—"}
                        <span className="ml-0.5 text-[11px] font-medium text-faint">/100</span>
                      </span>
                    </div>
                    <ScoreBar score={score.score} className="mt-2.5" />
                    {score.comment ? (
                      <p className="mt-2.5 text-xs italic leading-relaxed text-dim">
                        “{score.comment}”
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </Panel>

            <Panel className="flex h-full flex-col">
              <PanelHeader
                icon={<MessageSquareText />}
                title="Nhận xét tổng quan"
                description="Tổng kết của giảng viên hướng dẫn"
              />
              {evaluation.summary ? (
                <p className="flex-1 px-5 py-4 text-sm leading-relaxed text-dim">
                  {evaluation.summary}
                </p>
              ) : (
                <p className="flex-1 px-5 py-4 text-sm italic text-faint">
                  Giảng viên chưa viết nhận xét tổng quan cho đợt đánh giá này.
                </p>
              )}
              <div className="border-t border-line px-5 py-4">
                <p className="text-[11px] leading-relaxed text-faint">
                  Điểm tổng hợp là trung bình có trọng số của các tiêu chí đã chấm.
                </p>
              </div>
            </Panel>
          </div>
        </div>
      )}
    </ViewFrame>
  );
}
