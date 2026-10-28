"use client";

import * as React from "react";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Eye,
  Hourglass,
  ListTodo,
  Rocket,
  Sparkles,
  Target,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { navigate } from "@/lib/client/router";
import { useSession } from "@/lib/client/session";
import {
  notificationApi,
  outcomeApi,
  workspaceApi,
  type AppNotification,
  type InternWorkspace,
} from "@/lib/client/api";
import { useResource } from "@/lib/client/use-resource";
import {
  formatDate,
  formatVnd,
  notificationCategoryLabels,
  relativeTime,
  roleLabels,
  workspaceStatusCopy,
} from "@/lib/client/labels";
import {
  AnimatedProgressBar,
  Empty,
  KeyValue,
  MetricCard,
  PageHeader,
  Panel,
  PanelHeader,
  ToneBadge,
  ViewFrame,
} from "@/components/shared/primitives";
import { AnimatedNumber } from "@/components/shared/counters";
import { PriorityBadge, RoleBadge, TaskStatusBadge } from "@/components/shared/badges";
import { ErrorBlock, LoadingBlock } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/* --------------------------- helpers --------------------------- */

function greetingOf(hour: number): string {
  if (hour >= 5 && hour < 11) return "Chào buổi sáng";
  if (hour >= 11 && hour < 13) return "Chào buổi trưa";
  if (hour >= 13 && hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

/** Link seed cũ → route mới của app (chỉ map phía FE). */
const LINK_ALIASES: Record<string, string> = {
  "/recruitment": "/intern/onboarding",
  "/intern/salary": "/intern/virtual-salary",
  "/intern/board": "/intern/sprint",
};

function resolveLink(link: string | null): string | null {
  if (!link) return null;
  const raw = link.startsWith("#") ? link.slice(1) : link;
  if (!raw.startsWith("/")) return null;
  return LINK_ALIASES[raw] ?? raw;
}

function daysLeft(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return null;
  return Math.ceil((d - Date.now()) / 86400000);
}

/* ---------------------- notifications card ---------------------- */

function NotificationsCard() {
  const res = useResource(() => notificationApi.list({ pageSize: 3 }));
  const notifications = res.data?.data ?? [];

  async function open(n: AppNotification) {
    try {
      if (!n.read) await notificationApi.markRead(n.id);
    } catch {
      /* vẫn điều hướng dù đánh dấu thất bại */
    }
    const link = resolveLink(n.link);
    if (link) navigate(link);
    else toast.info("Thông báo này chưa có liên kết đích.");
  }

  return (
    <Panel>
      <PanelHeader
        icon={<Bell className="size-4 icon" />}
        title="Thông báo mới"
        description="3 thông báo gần nhất — bấm để xem chi tiết."
        actions={
          <Button
            variant="ghost"
            size="sm"
            className="h-7 rounded-lg px-2 text-[11px] text-dim hover:bg-panel-2 hover:text-ink"
            onClick={() => navigate("/intern/notifications")}
          >
            Xem tất cả <ArrowRight className="size-3 icon" />
          </Button>
        }
      />
      {res.loading ? (
        <div className="space-y-3 px-5 py-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="size-8 rounded-lg skeleton-shimmer" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-4/5 rounded-md skeleton-shimmer" />
                <Skeleton className="h-3 w-1/3 rounded-md skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      ) : res.error ? (
        <div className="px-5 py-6">
          <ErrorBlock error={res.error} onRetry={res.reload} className="border-0 py-6 shadow-none" />
        </div>
      ) : notifications.length > 0 ? (
        <div className="divide-y divide-line">
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => void open(n)}
              className={cn(
                "flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-panel-2",
                !n.read && "bg-brand/[0.045]"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border",
                  n.read
                    ? "border-line bg-panel-2 text-faint"
                    : "border-brand/25 bg-brand/10 text-brand-bright"
                )}
              >
                <Bell className="size-3.5 icon" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "truncate text-[13px]",
                      n.read ? "font-medium text-dim" : "font-semibold text-ink"
                    )}
                  >
                    {n.title}
                  </span>
                  {!n.read ? <span className="size-1.5 shrink-0 rounded-full bg-brand-bright" /> : null}
                </span>
                <span className="mt-0.5 flex items-center gap-2 text-[11px] text-faint">
                  <span className="truncate">
                    {notificationCategoryLabels[n.category] ?? n.category}
                  </span>
                  <span>·</span>
                  <span>{relativeTime(n.createdAt)}</span>
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <Empty
          icon={<Bell className="size-5 icon" />}
          title="Chưa có thông báo nào"
          description="Các thông báo về task, đánh giá và lương ảo sẽ xuất hiện tại đây."
        />
      )}
    </Panel>
  );
}

/* ------------------------- salary mini card ------------------------- */

function SalaryMiniCard() {
  const res = useResource(() => outcomeApi.virtualSalary());

  return (
    <Panel hoverable className="group p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-medium text-dim">
            <Wallet className="size-4 icon text-amber" />
            Ví lương ảo
          </div>
          {res.loading ? (
            <Skeleton className="mt-3 h-8 w-36 rounded-md skeleton-shimmer" />
          ) : res.error ? (
            <div className="mt-3">
              <p className="font-mono text-[26px] font-bold leading-none text-faint">— ₫</p>
              <p className="mt-1.5 text-xs text-faint">
                Không tải được số dư.{" "}
                <button
                  type="button"
                  className="font-semibold text-brand-bright underline-offset-2 hover:underline"
                  onClick={res.reload}
                >
                  Thử lại
                </button>
              </p>
            </div>
          ) : res.data ? (
            <p className="mt-3 font-mono text-[26px] font-bold leading-none tracking-tight text-ink">
              <AnimatedNumber value={res.data.balance} suffix=" ₫" />
            </p>
          ) : null}
          <p className="mt-1.5 text-xs text-faint">
            {res.data
              ? `Thu kỳ này: ${formatVnd(res.data.earnedThisPeriod)} (ảo)`
              : "Số dư tiền ảo của bạn"}
          </p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-amber/25 bg-amber/10 text-amber transition-transform group-hover:scale-105">
          <Wallet className="size-4 icon" />
        </span>
      </div>
      <button
        type="button"
        onClick={() => navigate("/intern/virtual-salary")}
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-bright transition-colors hover:text-brand"
      >
        Xem sổ lương <ArrowRight className="size-3.5 icon transition-transform group-hover:translate-x-0.5" />
      </button>
    </Panel>
  );
}

/* --------------------------- mentor card --------------------------- */

function MentorCard() {
  return (
    <Panel className="relative overflow-hidden p-5">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/[0.08] via-transparent to-transparent" />
      <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-brand/10 blur-2xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-medium text-dim">
              <Sparkles className="size-4 icon text-brand-bright" />
              Mentor AI · trực 24/7
            </div>
            <p className="mt-3 text-sm font-semibold leading-snug text-ink">
              Kẹt ở task nào chưa? Hỏi Mentor AI ngay.
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-dim">
              Giải đáp kỹ thuật, gợi ý cách triển khai và review hướng đi — trả lời trong vài giây.
            </p>
          </div>
          <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-brand/25 bg-brand/10 text-brand-bright glow-brand">
            <Sparkles className="size-4 icon" />
          </span>
        </div>
        <Button
          size="sm"
          className="mt-4 rounded-lg bg-brand text-on-brand hover:bg-brand-bright active:scale-[0.98]"
          onClick={() => navigate("/intern/mentor")}
        >
          Hỏi Mentor AI <ArrowRight className="size-3.5 icon" />
        </Button>
      </div>
    </Panel>
  );
}

/* ------------------------ focused task card ------------------------ */

function FocusedTaskCard({ ws }: { ws: InternWorkspace }) {
  const task = ws.focusedTask;
  if (!task) {
    return (
      <Panel className="h-full">
        <PanelHeader
          icon={<Target className="size-4 icon" />}
          title="Task tập trung"
          description="Task quan trọng nhất của bạn trong sprint hiện tại."
        />
        <Empty
          icon={<CheckCircle2 className="size-5 icon" />}
          title="Không có task đang mở"
          description="Bạn đã hoàn thành mọi task được giao. Kiểm tra bảng công việc để nhận task mới hoặc xem lại kết quả."
          action={
            <Button
              size="sm"
              className="rounded-lg bg-brand text-on-brand hover:bg-brand-bright"
              onClick={() => navigate("/intern/work")}
            >
              Xem danh sách công việc
            </Button>
          }
        />
      </Panel>
    );
  }

  const left = daysLeft(task.dueDate);
  const overdue = left !== null && left < 0;
  const soon = left !== null && left >= 0 && left <= 2;

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        icon={<Target className="size-4 icon" />}
        title="Task tập trung"
        description="Task đang mở quan trọng nhất — ưu tiên/high hoặc hạn gần nhất."
        actions={<TaskStatusBadge status={task.status} />}
      />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-line bg-deep px-2 py-0.5 font-mono text-[11px] font-semibold text-brand-bright">
            {task.code}
          </span>
          <PriorityBadge priority={task.priority} />
        </div>
        <h3 className="mt-3 text-lg font-bold leading-snug tracking-tight text-ink">
          {task.title}
        </h3>

        <dl className="mt-4 grid grid-cols-2 gap-4">
          <KeyValue label="Hạn hoàn thành">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5 icon text-faint" />
              {formatDate(task.dueDate)}
            </span>
          </KeyValue>
          <KeyValue label="Còn lại">
            {left === null ? (
              <span className="text-dim">Không có hạn</span>
            ) : overdue ? (
              <ToneBadge tone="rose">Quá hạn {Math.abs(left)} ngày</ToneBadge>
            ) : soon ? (
              <ToneBadge tone="amber">Còn {left} ngày</ToneBadge>
            ) : (
              <ToneBadge tone="teal">Còn {left} ngày</ToneBadge>
            )}
          </KeyValue>
        </dl>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-dim">Tiến độ công việc</span>
            <span className="font-mono text-xs font-bold text-ink">{task.progress}%</span>
          </div>
          <AnimatedProgressBar value={task.progress} tone={task.progress >= 70 ? "brand" : "teal"} />
        </div>

        <div className="mt-auto pt-6">
          <Button
            className="w-full rounded-lg bg-brand text-on-brand hover:bg-brand-bright active:scale-[0.98]"
            onClick={() => navigate(`/intern/work/${task.id}`)}
          >
            Làm tiếp task này <ArrowRight className="size-4 icon" />
          </Button>
          <p className="mt-2.5 text-center text-[11px] text-faint">
            Trong tổng {ws.taskSummary.total} task · {ws.taskSummary.done} đã hoàn thành
          </p>
        </div>
      </div>
    </Panel>
  );
}

/* ------------------------- active dashboard ------------------------- */

function ActiveDashboard({ ws }: { ws: InternWorkspace }) {
  const { user } = useSession();
  const firstName = (user?.displayName ?? "bạn").split(" ")[0];
  const sprint = ws.currentSprint;
  const ts = ws.taskSummary;

  return (
    <div className="space-y-5">
      {/* Dải chào mừng */}
      <Panel className="noise relative overflow-hidden rounded-3xl">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/[0.10] via-transparent to-transparent" />
        <div className="relative flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-7">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-bright">
              {ws.assignment?.session?.name ?? "Kỳ thực tập"}
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-ink md:text-2xl">
              {greetingOf(new Date().getHours())}, {firstName}
              <span className="text-gradient">.</span>
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {ws.assignment ? <RoleBadge role={ws.assignment.role} /> : null}
              {ws.assignment?.project ? (
                <ToneBadge tone="zinc">
                  Dự án {ws.assignment.project.name}
                </ToneBadge>
              ) : null}
              {ws.notificationsUnread > 0 ? (
                <ToneBadge tone="amber" dot>
                  {ws.notificationsUnread} thông báo chưa đọc
                </ToneBadge>
              ) : null}
            </div>
          </div>
          {sprint ? (
            <div className="w-full shrink-0 rounded-2xl border border-line bg-deep/50 p-4 md:w-80">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] font-semibold text-brand-bright">
                  {sprint.code}
                </span>
                <span className="text-[11px] text-faint">
                  {formatDate(sprint.startDate)} → {formatDate(sprint.endDate)}
                </span>
              </div>
              <p className="mt-2 truncate text-sm font-semibold text-ink" title={sprint.name}>
                {sprint.name}
              </p>
              <AnimatedProgressBar value={sprint.progress} tone="brand" showLabel className="mt-3" />
            </div>
          ) : null}
        </div>
      </Panel>

      {/* 4 chỉ số task */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MetricCard
          label="Cần làm"
          value={<AnimatedNumber value={ts.todo} />}
          hint={`${ts.total} task tổng cộng`}
          icon={<ListTodo className="size-4 icon" />}
          tone="default"
        />
        <MetricCard
          label="Đang làm"
          value={<AnimatedNumber value={ts.doing} />}
          hint="Đang trong quá trình thực hiện"
          icon={<CircleDot className="size-4 icon" />}
          tone="teal"
        />
        <MetricCard
          label="Chờ duyệt"
          value={<AnimatedNumber value={ts.review} />}
          hint="Chờ mentor / AI review"
          icon={<Eye className="size-4 icon" />}
          tone="amber"
        />
        <MetricCard
          label="Hoàn thành"
          value={<AnimatedNumber value={ts.done} />}
          hint={`Tỷ lệ ${ts.total > 0 ? Math.round((ts.done / ts.total) * 100) : 0}%`}
          icon={<CheckCircle2 className="size-4 icon" />}
          tone="brand"
        />
      </div>

      {/* Task tập trung + cột phải */}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <FocusedTaskCard ws={ws} />
        <div className="space-y-4">
          <NotificationsCard />
          <MentorCard />
          <SalaryMiniCard />
        </div>
      </div>
    </div>
  );
}

/* ------------------------ unassigned dashboard ------------------------ */

const WAITING_STEPS = [
  {
    icon: BadgeCheck,
    state: "done" as const,
    title: "Hồ sơ đã được duyệt",
    desc: "Bạn đã vượt qua phỏng vấn AI đầu vào — hồ sơ đã vào danh sách ứng viên.",
  },
  {
    icon: Hourglass,
    state: "active" as const,
    title: "Chờ giảng viên phân dự án",
    desc: "Khi có phiên thực tập phù hợp với vai trò của bạn, giảng viên sẽ chọn bạn vào đội.",
  },
  {
    icon: Rocket,
    state: "upcoming" as const,
    title: "Bắt đầu thực tập thật",
    desc: "Nhận task thật, làm việc theo sprint và tích lũy lương ảo theo KPI.",
  },
];

function UnassignedDashboard({ ws }: { ws: InternWorkspace }) {
  const { user } = useSession();
  const firstName = (user?.displayName ?? "bạn").split(" ")[0];
  const copy = workspaceStatusCopy.unassigned;

  return (
    <div className="space-y-5">
      <Panel className="noise relative overflow-hidden rounded-3xl">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/[0.12] via-transparent to-transparent" />
        <div className="relative flex flex-col items-center gap-5 px-6 py-10 text-center sm:flex-row sm:items-center sm:gap-7 sm:p-10 sm:text-left">
          <span className="grid size-16 shrink-0 place-items-center rounded-3xl border border-brand/30 bg-brand/12 text-brand-bright glow-brand">
            <BadgeCheck className="size-8 icon" />
          </span>
          <div className="min-w-0 flex-1">
            <ToneBadge tone="brand" dot>
              ĐÃ TRÚNG TUYỂN
            </ToneBadge>
            <h2 className="mt-3 text-xl font-bold tracking-tight text-ink sm:text-2xl">
              Chúc mừng {firstName} — {copy.title}
            </h2>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-dim">{copy.desc}</p>
            {ws.recruitment ? (
              <p className="mt-2 text-[11px] text-faint">
                Vai trò {roleLabels[ws.recruitment.selectedRole ?? ""] ?? ws.recruitment.selectedRole}{" "}
                · Trúng tuyển {formatDate(ws.recruitment.recruitedAt)}
              </p>
            ) : null}
          </div>
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Panel>
          <PanelHeader
            icon={<Rocket className="size-4 icon" />}
            title="3 bước tiếp theo của bạn"
            description="Diễn ra tự động — bạn sẽ nhận thông báo ở mỗi bước chuyển."
          />
          <ol className="p-5">
            {WAITING_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="relative flex gap-4 pb-7 last:pb-0">
                  {i < WAITING_STEPS.length - 1 ? (
                    <span
                      className={cn(
                        "absolute left-[19px] top-11 h-[calc(100%-44px)] w-0.5 rounded-full",
                        step.state === "done" ? "bg-gradient-to-b from-brand to-brand/40" : "bg-white/[0.07]"
                      )}
                    />
                  ) : null}
                  <span
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-xl border",
                      step.state === "done" && "border-brand bg-brand text-on-brand",
                      step.state === "active" &&
                        "border-amber/40 bg-amber/10 text-amber shadow-[0_0_0_4px_rgba(251,191,36,0.10)]",
                      step.state === "upcoming" && "border-line bg-panel-2 text-faint"
                    )}
                  >
                    {step.state === "done" ? (
                      <CheckCircle2 className="size-4 icon" />
                    ) : (
                      <Icon className={cn("size-4 icon", step.state === "active" && "animate-pulse-soft")} />
                    )}
                  </span>
                  <div className="min-w-0 pt-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
                      Bước {i + 1}. {step.title}
                      {step.state === "active" ? (
                        <ToneBadge tone="amber">Đang diễn ra</ToneBadge>
                      ) : step.state === "done" ? (
                        <ToneBadge tone="brand">Hoàn tất</ToneBadge>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-dim">{step.desc}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Panel>

        <div className="space-y-4">
          <Panel className="p-5">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-dim">
              Việc bạn có thể làm ngay
            </h3>
            <div className="mt-4 space-y-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-between rounded-lg border-line bg-transparent text-dim hover:border-line-strong hover:bg-panel-2 hover:text-ink"
                onClick={() => navigate("/intern/onboarding/result")}
              >
                Xem lại kết quả phỏng vấn <ArrowRight className="size-3.5 icon" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-between rounded-lg border-line bg-transparent text-dim hover:border-line-strong hover:bg-panel-2 hover:text-ink"
                onClick={() => navigate("/intern/mentor")}
              >
                Hỏi Mentor AI chuẩn bị trước <ArrowRight className="size-3.5 icon" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-between rounded-lg border-line bg-transparent text-dim hover:border-line-strong hover:bg-panel-2 hover:text-ink"
                onClick={() => navigate("/intern/notifications")}
              >
                Kiểm tra thông báo <ArrowRight className="size-3.5 icon" />
              </Button>
            </div>
          </Panel>
          <MentorCard />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ root view ------------------------------ */

export function InternDashboardView() {
  const wsRes = useResource(() => workspaceApi.my());
  const ws = wsRes.data;
  const needsRecruitment =
    !!ws &&
    ["recruitment_required", "recruitment_in_progress", "recruitment_failed"].includes(ws.status);

  // Chưa hoàn tất tuyển dụng → chuyển thẳng vào onboarding
  React.useEffect(() => {
    if (needsRecruitment) {
      navigate("/intern/onboarding", { replace: true });
    }
  }, [needsRecruitment]);

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Không gian làm việc"
        title="Tổng quan"
        description="Bức tranh toàn cảnh về kỳ thực tập của bạn — sprint, công việc và đồng nghiệp AI."
      />

      {wsRes.loading ? (
        <div className="space-y-5">
          <LoadingBlock variant="detail" rows={2} />
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[104px] rounded-2xl skeleton-shimmer" />
            ))}
          </div>
          <LoadingBlock rows={3} />
        </div>
      ) : wsRes.error ? (
        <ErrorBlock error={wsRes.error} onRetry={wsRes.reload} />
      ) : !ws ? null : needsRecruitment ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <span className="grid size-11 place-items-center rounded-xl bg-brand/10 text-brand-bright">
            <Sparkles className="size-5 icon animate-pulse-soft" />
          </span>
          <p className="text-sm font-semibold text-ink">Đang chuyển đến vòng tuyển dụng…</p>
          <p className="text-xs text-dim">
            Bạn cần hoàn thành phỏng vấn AI đầu vào trước khi vào không gian làm việc.
          </p>
        </Panel>
      ) : ws.status === "unassigned" ? (
        <UnassignedDashboard ws={ws} />
      ) : (
        <ActiveDashboard ws={ws} />
      )}
    </ViewFrame>
  );
}
