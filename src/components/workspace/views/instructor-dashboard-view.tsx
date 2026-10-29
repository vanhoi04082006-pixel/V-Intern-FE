"use client";

/**
 * Tổng quan giảng viên — số liệu nhanh + tình hình từng phiên thực tập
 * + lối tắt đến các khu vực làm việc chính.
 */

import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, Inbox, ListTodo, Users2 } from "lucide-react";
import { fetchInstructorDashboard } from "@/lib/api/insight";
import { errorMessage } from "@/lib/api/transport";
import { useAppStore } from "@/lib/store";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  ProgressBar,
  SectionCard,
  StatCard,
  StatusBadge,
} from "@/components/shared/kit";
import { Button } from "@/components/ui/button";

const SESSION_STATUS_FLOW: { value: string; label: string }[] = [
  { value: "planned", label: "Đã lên lịch" },
  { value: "active", label: "Đang hoạt động" },
  { value: "completed", label: "Hoàn thành" },
];

export function InstructorDashboardView() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["instructor-dashboard"],
    queryFn: ({ signal }) => fetchInstructorDashboard(signal),
  });

  const goSection = (section: string) => useAppStore.getState().goSection(section);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tổng quan"
        description="Bức tranh nhanh về các phiên thực tập đang dẫn dắt — sinh viên, nhiệm vụ, bài nộp và đánh giá."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => goSection("sessions")} className="gap-2">
              <Users2 className="h-3.5 w-3.5" aria-hidden="true" />
              Phiên thực tập
            </Button>
            <Button size="sm" onClick={() => goSection("tasks")} className="gap-2">
              <ListTodo className="h-3.5 w-3.5" aria-hidden="true" />
              Quản lý nhiệm vụ
            </Button>
          </>
        }
      />

      {isLoading ? (
        <LoadingState label="Đang tải số liệu tổng quan…" />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : !data ? null : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard
              label="Phiên đang hoạt động"
              value={data.activeSessions}
              hint="Các phiên thực tập đang mở"
              icon={Users2}
              tone="blue"
            />
            <StatCard
              label="Tổng sinh viên"
              value={data.totalInterns}
              hint="Đang theo học toàn chương trình"
              icon={Users2}
              tone="ink"
            />
            <StatCard
              label="Nhiệm vụ mở"
              value={data.openTasks}
              hint="Chưa hoàn thành trên bảng nhiệm vụ"
              icon={ListTodo}
              tone="amber"
            />
            <StatCard
              label="Bài chờ duyệt"
              value={data.submissionsPending}
              hint="Bài nộp đang chờ bạn chấm"
              icon={Inbox}
              tone="rose"
            />
            <StatCard
              label="Đánh giá sắp tới"
              value={data.upcomingEvaluations}
              hint="Kỳ đánh giá cần hoàn thành"
              icon={ClipboardCheck}
              tone="green"
            />
          </div>

          <SectionCard
            title="Việc cần làm ngay"
            description="Lối tắt tới những khu vực hay phải sử dụng hằng ngày."
          >
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => goSection("sessions")} className="gap-2">
                <Users2 className="h-3.5 w-3.5" aria-hidden="true" />
                Quản lý phiên thực tập
              </Button>
              <Button variant="outline" size="sm" onClick={() => goSection("tasks")} className="gap-2">
                <ListTodo className="h-3.5 w-3.5" aria-hidden="true" />
                Giao & chấm nhiệm vụ
              </Button>
              <Button variant="outline" size="sm" onClick={() => goSection("evaluations")} className="gap-2">
                <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Chấm đánh giá
              </Button>
            </div>
          </SectionCard>

          <SectionCard title="Tình hình các phiên thực tập" description="Số sinh viên và khối lượng nhiệm vụ đang mở của từng phiên.">
            {data.sessionSummaries.length === 0 ? (
              <EmptyState
                title="Chưa có phiên thực tập nào"
                description="Tạo phiên thực tập đầu tiên trong mục “Phiên thực tập” để bắt đầu hành trình."
                action={
                  <Button size="sm" onClick={() => goSection("sessions")}>
                    Tạo phiên thực tập
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {data.sessionSummaries.map((s) => (
                  <article
                    key={s.id}
                    className="rounded-2xl border-2 border-ink/12 bg-paper p-4 shadow-[3px_3px_0_0_rgba(23,23,28,0.06)] transition-transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-ink">{s.name}</p>
                        <p className="mt-0.5 font-hand text-[15px] leading-none text-ink-faint">
                          {s.internCount} sinh viên · {SESSION_STATUS_FLOW.find((x) => x.value === s.status)?.label ?? s.status}
                        </p>
                      </div>
                      <StatusBadge status={s.status} />
                    </div>
                    <div className="mt-3">
                      <ProgressBar
                        label={`${s.openTasks} nhiệm vụ đang mở`}
                        value={s.openTasks}
                        max={Math.max(s.internCount * 5, s.openTasks, 1)}
                      />
                      <p className="mt-1 font-hand text-[13px] text-ink-faint">≈ 5 nhiệm vụ mỗi sinh viên là tải chuẩn.</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}
