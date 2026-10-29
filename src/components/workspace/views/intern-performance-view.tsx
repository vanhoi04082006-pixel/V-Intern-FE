"use client";

/**
 * Hiệu suất — các chỉ số chính của intern: hoàn thành nhiệm vụ, điểm câu chuyện,
 * nộp đúng hạn, điểm đánh giá trung bình và số nhiệm vụ trễ hạn.
 */

import { useQuery } from "@tanstack/react-query";
import { AlarmClock, ClipboardCheck, Gauge, Star, Timer, Zap } from "lucide-react";
import { fetchMyPerformance } from "@/lib/api/intern";
import { errorMessage } from "@/lib/api/transport";
import { fmtDateTime } from "@/lib/api/client";
import {
  ErrorState,
  LoadingState,
  PageHeader,
  ProgressBar,
  SectionCard,
  StatCard,
} from "@/components/shared/kit";

function pct(value: number | null): string {
  return value == null ? "—" : `${Math.round(value)}%`;
}

export function InternPerformanceView() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["intern-performance"],
    queryFn: ({ signal }) => fetchMyPerformance(signal),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hiệu suất"
        description="Bức tranh tổng quan về mức độ ổn định của bạn qua các chỉ số hệ thống theo dõi."
      />

      {isLoading ? (
        <LoadingState label="Đang tải hiệu suất…" />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : !data ? null : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard
              label="Tỷ lệ hoàn thành nhiệm vụ"
              value={pct(data.taskCompletionRate)}
              hint="bao nhiêu nhiệm vụ đã xong / tổng nhận"
              icon={ClipboardCheck}
              tone="blue"
            />
            <StatCard
              label="Hoàn thành điểm câu chuyện"
              value={pct(data.storyPointCompletionRate)}
              hint="theo story points đã giao"
              icon={Zap}
              tone="ink"
            />
            <StatCard
              label="Nộp đúng hạn"
              value={pct(data.onTimeCompletionRate)}
              hint="bài nộp trước hạn chót"
              icon={Timer}
              tone="green"
            />
            <StatCard
              label="Điểm đánh giá trung bình"
              value={data.averageEvaluationScore == null ? "—" : `${data.averageEvaluationScore}/10`}
              hint="từ các kỳ đánh giá của mentor"
              icon={Star}
              tone="blue"
            />
          </div>

          <StatCard
            label="Nhiệm vụ trễ hạn đang mở"
            value={data.overdueOpenTaskCount}
            hint={data.overdueOpenTaskCount > 0 ? "xử lý mấy việc này trước nhé!" : "tuyệt vời, không việc gì trễ"}
            icon={AlarmClock}
            tone="amber"
          />

          <SectionCard
            title="Chi tiết theo chỉ số"
            description="Thanh dài hơn = tốt hơn. Mục tiêu là giữ mọi chỉ số trên 80% nhé."
          >
            <div className="space-y-5">
              <ProgressBar label="Hoàn thành nhiệm vụ" value={data.taskCompletionRate ?? 0} />
              <ProgressBar label="Hoàn thành điểm câu chuyện" value={data.storyPointCompletionRate ?? 0} />
              <ProgressBar label="Nộp đúng hạn" value={data.onTimeCompletionRate ?? 0} />
              <ProgressBar
                label="Điểm đánh giá trung bình (trên thang 10)"
                value={data.averageEvaluationScore ?? 0}
                max={10}
              />
            </div>
          </SectionCard>

          <p className="flex items-center justify-center gap-1.5 text-center font-hand text-[16px] text-ink-faint">
            <Gauge className="h-4 w-4" aria-hidden="true" />
            số liệu cập nhật lúc {fmtDateTime(data.generatedAt)} ✦
          </p>
        </>
      )}
    </div>
  );
}
