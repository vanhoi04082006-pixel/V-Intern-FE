"use client";

/**
 * KPI — điểm tổng hợp theo kỳ, gồm hạng và điểm từng thành phần.
 */

import { useQuery } from "@tanstack/react-query";
import { Medal, TrendingUp } from "lucide-react";
import { fetchMyKpi, type KpiResult } from "@/lib/api/intern";
import { errorMessage } from "@/lib/api/transport";
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

interface ComponentRow {
  code: string;
  name: string;
  score: number | null;
  weight: number | null;
  detail: string | null;
}

function KpiCard({ result }: { result: KpiResult }) {
  const columns: Column<ComponentRow>[] = [
    {
      key: "name",
      header: "Thành phần",
      render: (row) => <span className="font-bold text-ink">{row.name}</span>,
    },
    {
      key: "weight",
      header: "Trọng số",
      render: (row) => <span className="text-ink-soft">{row.weight != null ? `${row.weight}%` : "—"}</span>,
    },
    {
      key: "score",
      header: "Điểm",
      render: (row) =>
        row.score != null ? (
          <span className="font-extrabold text-blue">{Math.round(row.score * 10) / 10}</span>
        ) : (
          <span className="text-ink-faint">—</span>
        ),
    },
    {
      key: "detail",
      header: "Chi tiết",
      render: (row) =>
        row.detail ? (
          <span className="text-[13px] leading-relaxed text-ink-soft">{row.detail}</span>
        ) : (
          <span className="text-ink-faint">—</span>
        ),
    },
  ];

  return (
    <SectionCard>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-extrabold text-ink">{result.periodName ?? "Kỳ KPI"}</p>
            {result.periodStatus ? <StatusBadge status={result.periodStatus} /> : null}
          </div>
          {result.rank != null ? (
            <p className="inline-flex items-center gap-1.5 rounded-full border-2 border-amber-300 bg-amber-50 px-3 py-1 text-[12px] font-extrabold text-amber-700">
              <Medal className="h-3.5 w-3.5" aria-hidden="true" />
              Hạng #{result.rank}
            </p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-4xl font-extrabold leading-none text-blue">
            {result.totalScore ?? "—"}
            <span className="text-lg text-ink-faint">/100</span>
          </p>
          <p className="mt-1 text-[11px] font-bold text-ink-faint">tổng điểm KPI</p>
        </div>
      </div>

      {result.totalScore != null ? (
        <ProgressBar label="Tổng điểm KPI" value={result.totalScore} className="mt-4" />
      ) : null}

      <div className="mt-4">
        {result.components.length === 0 ? (
          <p className="rounded-xl border-2 border-dashed border-ink/15 bg-paper px-4 py-6 text-center text-[13px] text-ink-soft">
            Kỳ này chưa có chi tiết thành phần điểm.
          </p>
        ) : (
          <ListTable
            columns={columns}
            rows={result.components}
            rowKey={(row) => row.code || row.name}
            emptyTitle="Chưa có thành phần nào"
          />
        )}
      </div>
    </SectionCard>
  );
}

export function InternKpiView() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["intern-kpi"],
    queryFn: ({ signal }) => fetchMyKpi(signal),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="KPI"
        description="Chỉ số đo lường kết quả thực tập theo kỳ — điểm cao thì lương ảo cũng cao theo nhé."
      />

      {isLoading ? (
        <LoadingState label="Đang tải KPI…" />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="Chưa có kết quả KPI nào"
          description="Kết thúc mỗi kỳ KPI, hệ thống sẽ tính điểm và xếp hạng cho bạn."
        />
      ) : (
        <>
          {data.map((result) => (
            <KpiCard key={result.id} result={result} />
          ))}
          <p className="flex items-center justify-center gap-1.5 text-center font-hand text-[16px] text-ink-faint">
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
            KPI chỉ đo một phần — quan trọng là kỹ năng của bạn thật lên mỗi ngày ✦
          </p>
        </>
      )}
    </div>
  );
}
