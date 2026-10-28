"use client";

import {
  ArrowRight,
  FolderKanban,
  Presentation,
  Rocket,
  Sparkles,
  UserPlus,
  Users,
  Clock3,
} from "lucide-react";
import { sessionApi } from "@/lib/client/api";
import { useResource } from "@/lib/client/use-resource";
import { formatDate } from "@/lib/client/labels";
import { navigate } from "@/lib/client/router";
import { ViewFrame, Stagger, StaggerItem } from "@/components/shared/view";
import {
  Panel,
  PageHeader,
  MetricCard,
  Empty,
  AnimatedProgressBar,
} from "@/components/shared/primitives";
import { SessionStatusBadge } from "@/components/shared/badges";
import { LoadingBlock, ErrorBlock } from "@/components/shared/states";

const workflowSteps = [
  {
    step: "01",
    title: "Chọn dự án mẫu",
    description:
      "Duyệt thư viện dự án mẫu có sẵn blueprint: vai trò, sprint, nhiệm vụ và cột mốc. Khởi động buổi thực tập chỉ với một nút.",
    icon: FolderKanban,
    to: "/instructor/projects",
    cta: "Xem dự án mẫu",
  },
  {
    step: "02",
    title: "Mời sinh viên & cấu hình",
    description:
      "Thêm thực tập sinh đã trúng tuyển phỏng vấn AI vào buổi thực tập, gán vai trò và theo dõi tiến độ nhóm ngay trên một màn hình.",
    icon: UserPlus,
    to: "/instructor/sessions",
    cta: "Quản lý buổi thực tập",
  },
  {
    step: "03",
    title: "Kế hoạch AI & khởi động",
    description:
      "Sinh kế hoạch sprint bằng AI, xem bản nháp với phụ thuộc nhiệm vụ, công bố để tạo sẵn sprint + nhiệm vụ rồi khởi động.",
    icon: Sparkles,
    to: "/instructor/sprints",
    cta: "Sprint & giao việc",
  },
];

export function InstructorHome() {
  const sessions = useResource(() => sessionApi.overview({ page: 1, pageSize: 10 }), []);

  const items = sessions.data?.data ?? [];
  const activeCount = items.filter((s) => s.status === "active").length;
  const pendingReviewTotal = items.reduce((sum, s) => sum + (s.alerts?.pendingReview ?? 0), 0);

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Khu vực giảng viên"
        title="Trang chủ giảng viên"
        description="Tổng quan quy trình điều hành buổi thực tập: chọn dự án mẫu, mời sinh viên, sinh kế hoạch AI và giám sát tiến độ."
      />

      {/* 3 bước workflow */}
      <Stagger className="grid gap-4 md:grid-cols-3">
        {workflowSteps.map((w) => {
          const Icon = w.icon;
          return (
            <StaggerItem key={w.step}>
              <Panel hoverable className="group flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-11 place-items-center rounded-xl bg-brand/10 text-brand-bright">
                    <Icon className="size-5 icon" />
                  </span>
                  <span className="font-mono text-2xl font-bold text-gradient">{w.step}</span>
                </div>
                <h3 className="mt-4 text-sm font-semibold text-ink">{w.title}</h3>
                <p className="mt-1.5 flex-1 text-xs leading-relaxed text-dim">{w.description}</p>
                <button
                  type="button"
                  onClick={() => navigate(w.to)}
                  className="mt-4 inline-flex items-center gap-1.5 self-start rounded-lg border border-line px-3 py-2 text-xs font-semibold text-brand-bright transition-all hover:border-brand/40 hover:bg-brand/[0.06] active:scale-[0.98]"
                >
                  {w.cta}
                  <ArrowRight className="size-3.5 icon transition-transform group-hover:translate-x-0.5" />
                </button>
              </Panel>
            </StaggerItem>
          );
        })}
      </Stagger>

      {/* 2 MetricCard */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <MetricCard
          label="Buổi thực tập đang diễn ra"
          value={sessions.loading ? "…" : activeCount}
          hint={`${items.length} buổi thực tập tổng cộng`}
          icon={<Presentation />}
          tone="brand"
        />
        <MetricCard
          label="Bài nộp chờ duyệt"
          value={sessions.loading ? "…" : pendingReviewTotal}
          hint="Tổng từ cảnh báo các buổi thực tập"
          icon={<Clock3 />}
          tone={pendingReviewTotal > 0 ? "amber" : "default"}
        />
      </div>

      {/* Dải buổi thực tập mới nhất */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-dim">
            Buổi thực tập mới nhất
          </h2>
          <button
            type="button"
            onClick={() => navigate("/instructor/sessions")}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-bright transition-colors hover:text-brand"
          >
            Xem tất cả <ArrowRight className="size-3.5 icon" />
          </button>
        </div>

        {sessions.loading ? (
          <LoadingBlock variant="cards" rows={3} />
        ) : sessions.error ? (
          <ErrorBlock error={sessions.error} onRetry={sessions.reload} />
        ) : items.length === 0 ? (
          <Panel>
            <Empty
              icon={<Presentation />}
              title="Chưa có buổi thực tập nào"
              description="Khởi động buổi thực tập đầu tiên từ một dự án mẫu để bắt đầu."
              action={
                <button
                  type="button"
                  onClick={() => navigate("/instructor/projects")}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-on-brand transition-all hover:bg-brand-bright active:scale-[0.98]"
                >
                  <FolderKanban className="size-4 icon" /> Chọn dự án mẫu
                </button>
              }
            />
          </Panel>
        ) : (
          <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.slice(0, 3).map((s) => (
              <StaggerItem key={s.id}>
                <Panel
                  hoverable
                  className="cursor-pointer p-5"
                  /* thẻ có thể bấm — điều hướng sang chi tiết */
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/instructor/sessions/${s.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/instructor/sessions/${s.id}`);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-mono text-[10px] font-semibold tracking-wider text-brand-bright/80">
                          {s.code}
                        </div>
                        <h3 className="mt-0.5 truncate text-sm font-semibold text-ink">{s.name}</h3>
                      </div>
                      <SessionStatusBadge status={s.status} />
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-xs text-dim">
                      <Rocket className="size-3.5 icon text-faint" />
                      <span className="truncate">
                        {s.currentSprint ? s.currentSprint.name : "Chưa có sprint"}
                      </span>
                    </div>

                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between text-[11px] text-dim">
                        <span>Tiến độ nhiệm vụ</span>
                        <span className="font-mono font-semibold text-ink">
                          {s.taskDone}/{s.taskTotal}
                        </span>
                      </div>
                      <AnimatedProgressBar value={s.taskPercent} showLabel />
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
                      <span className="inline-flex items-center gap-1.5 text-xs text-dim">
                        <Users className="size-3.5 icon text-faint" />
                        {s.memberCount} thành viên
                      </span>
                      <span className="text-[11px] text-faint">
                        {formatDate(s.startDate)} — {formatDate(s.endDate)}
                      </span>
                    </div>
                  </div>
                </Panel>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </section>
    </ViewFrame>
  );
}
