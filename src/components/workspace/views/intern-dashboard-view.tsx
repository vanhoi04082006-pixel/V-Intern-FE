"use client";

/**
 * Bảng điều khiển thực tập — tổng quan nhanh: đếm nhiệm vụ, phiên hiện tại,
 * nhiệm vụ đang tập trung và lối tắt đến các mục hay dùng.
 */

import { useQuery } from "@tanstack/react-query";
import {
  Bot,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  FolderKanban,
  ListTodo,
  MessagesSquare,
  Target,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { fetchMyWorkspace } from "@/lib/api/intern";
import { errorMessage } from "@/lib/api/transport";
import { fmtDate } from "@/lib/api/client";
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

const QUICK_LINKS: { section: string; label: string; description: string; icon: typeof Bot }[] = [
  {
    section: "sprint",
    label: "Sprint",
    description: "Bảng nhiệm vụ theo cột trạng thái",
    icon: CalendarDays,
  },
  {
    section: "tasks",
    label: "Nhiệm vụ",
    description: "Danh sách & bàn giao bài",
    icon: ListTodo,
  },
  {
    section: "mentor",
    label: "AI Mentor",
    description: "Trò chuyện cùng người hướng dẫn ảo",
    icon: MessagesSquare,
  },
  {
    section: "recruitment",
    label: "Phỏng vấn đầu vào",
    description: "Hành trình phỏng vấn với AI",
    icon: Bot,
  },
];

export function InternDashboardView() {
  const user = useAppStore((s) => s.user);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["intern-workspace"],
    queryFn: ({ signal }) => fetchMyWorkspace(signal),
  });

  const firstName = (user?.displayName ?? data?.identity.displayName ?? "bạn").split(" ")[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bảng điều khiển"
        description={`Chào ${firstName}, đây là sơ lược hành trình thực tập của bạn — nhiệm vụ, phiên đang chạy và những việc cần chú ý nhé ✦`}
      />

      {isLoading ? (
        <LoadingState label="Đang tải bảng điều khiển…" />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : !data ? null : data.project ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Cần làm"
              value={data.taskSummary.todo ?? 0}
              hint="việc đang chờ bạn bắt đầu"
              icon={ClipboardList}
              tone="ink"
            />
            <StatCard
              label="Đang làm"
              value={data.taskSummary.doing ?? 0}
              hint="giữ nhịp nhé!"
              icon={CircleDot}
              tone="blue"
            />
            <StatCard
              label="Chờ duyệt"
              value={data.taskSummary.review ?? 0}
              hint="đang chờ mentor xem bài"
              icon={Target}
              tone="amber"
            />
            <StatCard
              label="Xong"
              value={data.taskSummary.done ?? 0}
              hint="cứ thế này là đẹp"
              icon={CheckCircle2}
              tone="green"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard title="Phiên hiện tại" description="Sprint đang chạy của đồ án bạn tham gia.">
              {data.sprint ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-base font-extrabold text-ink">{data.sprint.name}</p>
                      <p className="mt-0.5 text-[13px] text-ink-soft">
                        Đồ án <span className="font-bold text-ink">{data.project.name}</span>
                        {data.sprint.endDate ? ` · kết thúc ${fmtDate(data.sprint.endDate)}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={data.sprint.status} />
                  </div>
                  <ProgressBar
                    label="Tiến độ nhiệm vụ (đã xong / tổng)"
                    value={data.taskSummary.done ?? 0}
                    max={Object.values(data.taskSummary).reduce((a, b) => a + b, 0)}
                  />
                </div>
              ) : (
                <EmptyState
                  title="Chưa có sprint nào"
                  description="Khi mentor lên kế hoạch sprint cho đồ án, thông tin sẽ hiện ở đây."
                />
              )}
            </SectionCard>

            <SectionCard title="Nhiệm vụ đang tập trung" description="Việc quan trọng nhất bạn cần chú ý lúc này.">
              {data.focusedTask ? (
                <div className="flex h-full flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={data.focusedTask.status} />
                      {data.focusedTask.dueDate ? (
                        <span className="text-[12px] font-bold text-ink-soft">
                          Hạn: {fmtDate(data.focusedTask.dueDate)}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-base font-extrabold leading-snug text-ink">{data.focusedTask.title}</p>
                    <p className="font-hand text-[15px] text-ink-faint">một việc nhỏ mỗi ngày, dần dần sẽ xong nhé</p>
                  </div>
                  <Button
                    onClick={() => useAppStore.getState().goSection("tasks")}
                    className="h-12 self-start rounded-xl border-2 border-ink bg-royal px-6 font-bold text-white shadow-[4px_4px_0_0_var(--ink)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                  >
                    <ListTodo className="h-4 w-4" aria-hidden="true" />
                    Đi đến nhiệm vụ của tôi
                  </Button>
                </div>
              ) : (
                <EmptyState
                  title="Không có nhiệm vụ nào đang tập trung"
                  description="Hãy kiểm tra danh sách nhiệm vụ để nhận việc mới nhé."
                />
              )}
            </SectionCard>
          </div>

          <div>
            <h2 className="mb-3 text-base font-extrabold text-ink">Lối tắt nhanh</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {QUICK_LINKS.map((link) => (
                <button
                  key={link.section}
                  type="button"
                  onClick={() => useAppStore.getState().goSection(link.section)}
                  className="group rounded-2xl border-2 border-ink/12 bg-paper-raised p-5 text-left shadow-[3px_3px_0_0_rgba(23,23,28,0.06)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-blue/40"
                >
                  <span className="inline-flex rounded-xl border-2 border-blue/30 bg-blue-mist p-2 text-blue">
                    <link.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <p className="mt-3 text-sm font-extrabold text-ink">{link.label}</p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-ink-soft">{link.description}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          title="Chưa có phân công đồ án"
          description="Bạn chưa được phân công vào đồ án nào. Hãy hoàn thành phỏng vấn đầu vào và chờ mentor sắp xếp nhé!"
          action={
            <Button
              onClick={() => useAppStore.getState().goSection("recruitment")}
              className="h-12 rounded-xl border-2 border-ink bg-royal px-6 font-bold text-white shadow-[4px_4px_0_0_var(--ink)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
            >
              <Bot className="h-4 w-4" aria-hidden="true" />
              Đến phỏng vấn đầu vào
            </Button>
          }
        />
      )}

      <p className="flex items-center justify-center gap-1.5 text-center font-hand text-[16px] text-ink-faint">
        <FolderKanban className="h-4 w-4" aria-hidden="true" />
        ghi chú nhỏ: ghé mục Nhiệm vụ mỗi ngày để không bỏ lỡ hạn nhé ✦
      </p>
    </div>
  );
}
