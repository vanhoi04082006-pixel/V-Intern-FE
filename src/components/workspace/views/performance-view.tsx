"use client";

/**
 * Hiệu suất sinh viên — tỷ lệ hoàn thành nhiệm vụ, story points, đúng hạn,
 * nhiệm vụ quá hạn và điểm đánh giá trung bình.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, TrendingUp } from "lucide-react";
import { fetchInternPerformances } from "@/lib/api/insight";
import { errorMessage } from "@/lib/api/transport";
import {
  EmptyState,
  ErrorState,
  ListTable,
  LoadingState,
  PageHeader,
  Pager,
  ProgressBar,
  SectionCard,
} from "@/components/shared/kit";
import { Input } from "@/components/ui/input";

const INPUT_CLS =
  "h-11 rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25";

function MiniBar({ value }: { value: number | null }) {
  if (value == null) return <span className="text-ink-faint">—</span>;
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="w-28">
      <ProgressBar value={clamped} />
      <p className="mt-0.5 text-[11px] font-bold text-ink-soft">{Math.round(clamped)}%</p>
    </div>
  );
}

export function PerformanceView() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["intern-performances", q, page],
    queryFn: ({ signal }) => fetchInternPerformances({ q: q.trim() || undefined, page }, signal),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hiệu suất sinh viên"
        description="Bức tranh tổng hợp về mức độ hoàn thành nhiệm vụ, story points, tiến độ đúng hạn và điểm đánh giá."
      />

      <SectionCard>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm sinh viên theo tên hoặc email…"
            className={`${INPUT_CLS} pl-10`}
          />
        </div>

        <div className="mt-4">
          {isLoading ? (
            <LoadingState label="Đang tải hiệu suất…" />
          ) : error ? (
            <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
          ) : !data || data.data.length === 0 ? (
            <EmptyState
              title="Chưa có dữ liệu hiệu suất"
              description="Khi sinh viên bắt đầu nhận nhiệm vụ và được đánh giá, số liệu sẽ hiện ở đây."
            />
          ) : (
            <>
              <ListTable
                rows={data.data}
                rowKey={(p) => p.userId}
                emptyTitle="Không tìm thấy sinh viên phù hợp"
                emptyDescription="Thử đổi từ khoá tìm kiếm."
                columns={[
                  {
                    key: "name",
                    header: "Sinh viên",
                    render: (p) => (
                      <div>
                        <p className="font-bold">{p.displayName}</p>
                        <p className="text-[12px] text-ink-faint">{p.email}</p>
                      </div>
                    ),
                  },
                  { key: "taskRate", header: "Hoàn thành NV", render: (p) => <MiniBar value={p.taskCompletionRate} /> },
                  { key: "spRate", header: "Điểm câu chuyện", render: (p) => <MiniBar value={p.storyPointCompletionRate} /> },
                  { key: "onTime", header: "Đúng hạn", render: (p) => <MiniBar value={p.onTimeCompletionRate} /> },
                  {
                    key: "overdue",
                    header: "NV quá hạn",
                    render: (p) => (
                      <span className={p.overdueOpenTaskCount > 0 ? "font-extrabold text-rose-600" : "text-ink-soft"}>
                        {p.overdueOpenTaskCount}
                      </span>
                    ),
                  },
                  {
                    key: "avg",
                    header: "Điểm đánh giá TB",
                    render: (p) =>
                      p.averageEvaluationScore != null ? (
                        <span className="inline-flex items-center gap-1 font-extrabold text-blue">
                          <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                          {p.averageEvaluationScore.toFixed(1)}
                        </span>
                      ) : (
                        "—"
                      ),
                  },
                ]}
              />
              <Pager page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />
            </>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
