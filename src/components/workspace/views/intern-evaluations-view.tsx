"use client";

/**
 * Đánh giá — kết quả các kỳ đánh giá của mentor: điểm tổng, tiêu chí và nhận xét.
 */

import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, Star } from "lucide-react";
import { fetchMyEvaluations, type MyEvaluation } from "@/lib/api/intern";
import { errorMessage } from "@/lib/api/transport";
import { fmtDateTime } from "@/lib/api/client";
import {
  EmptyState,
  ErrorState,
  ListTable,
  LoadingState,
  PageHeader,
  ProgressBar,
  SectionCard,
  StatusBadge,
  type Column,
} from "@/components/shared/kit";

interface CriterionRow {
  code: string;
  name: string;
  weight: number;
  score: number | null;
  maxScore: number | null;
  comment: string | null;
}

function EvaluationCard({ evaluation }: { evaluation: MyEvaluation }) {
  const columns: Column<CriterionRow>[] = [
    {
      key: "name",
      header: "Tiêu chí",
      render: (row) => <span className="font-bold text-ink">{row.name}</span>,
    },
    {
      key: "weight",
      header: "Trọng số",
      render: (row) => <span className="text-ink-soft">{row.weight}%</span>,
    },
    {
      key: "score",
      header: "Điểm",
      render: (row) => (
        <span className="font-extrabold text-blue">
          {row.score ?? "—"}
          {row.maxScore != null ? <span className="text-ink-faint">/{row.maxScore}</span> : null}
        </span>
      ),
    },
    {
      key: "comment",
      header: "Nhận xét",
      render: (row) =>
        row.comment ? (
          <span className="text-[13px] italic leading-relaxed text-ink-soft">{row.comment}</span>
        ) : (
          <span className="text-ink-faint">—</span>
        ),
    },
  ];

  return (
    <SectionCard>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-extrabold text-ink">{evaluation.cycleName ?? "Kỳ đánh giá"}</p>
            <StatusBadge status={evaluation.status} />
          </div>
          {evaluation.finalizedAt ? (
            <p className="font-mono text-[11px] text-ink-faint">Chốt ngày {fmtDateTime(evaluation.finalizedAt)}</p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-4xl font-extrabold leading-none text-blue">
            {evaluation.overallScore ?? "—"}
            <span className="text-lg text-ink-faint">/10</span>
          </p>
          <p className="mt-1 flex items-center justify-end gap-1 text-[11px] font-bold text-ink-faint">
            <Star className="h-3 w-3 text-amber-500" aria-hidden="true" />
            điểm tổng
          </p>
        </div>
      </div>

      {evaluation.overallScore != null ? (
        <ProgressBar value={evaluation.overallScore} max={10} className="mt-4" />
      ) : null}

      {evaluation.summary ? (
        <blockquote className="mt-4 rounded-2xl border-2 border-dashed border-blue/40 bg-blue-mist/50 p-4 text-sm italic leading-relaxed text-ink">
          “{evaluation.summary}”
        </blockquote>
      ) : null}

      <div className="mt-4">
        {evaluation.criteria.length === 0 ? (
          <p className="rounded-xl border-2 border-dashed border-ink/15 bg-paper px-4 py-6 text-center text-[13px] text-ink-soft">
            Kỳ này chưa chấm chi tiết theo tiêu chí.
          </p>
        ) : (
          <ListTable
            columns={columns}
            rows={evaluation.criteria}
            rowKey={(row) => row.code || row.name}
            emptyTitle="Chưa có tiêu chí nào"
          />
        )}
      </div>
    </SectionCard>
  );
}

export function InternEvaluationsView() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["intern-evaluations"],
    queryFn: ({ signal }) => fetchMyEvaluations(signal),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Đánh giá"
        description="Kết quả mentor chấm điểm cho bạn theo từng kỳ — đọc nhận xét để tiến bộ mỗi ngày nhé."
      />

      {isLoading ? (
        <LoadingState label="Đang tải đánh giá…" />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="Chưa có kỳ đánh giá nào"
          description="Khi kết thúc sprint hoặc đồ án, mentor sẽ chấm điểm và kết quả hiện ở đây."
        />
      ) : (
        <>
          {data.map((evaluation) => (
            <EvaluationCard key={evaluation.id} evaluation={evaluation} />
          ))}
          <p className="flex items-center justify-center gap-1.5 text-center font-hand text-[16px] text-ink-faint">
            <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
            điểm số chỉ là nhất thời — điều quan trọng là bạn tiến bộ từng ngày ✦
          </p>
        </>
      )}
    </div>
  );
}
