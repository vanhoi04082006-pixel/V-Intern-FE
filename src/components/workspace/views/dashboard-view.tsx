"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Flame,
  ListTodo,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import type { SectionId } from "@/components/workspace/workspace";
import { useAppStore } from "@/lib/store";
import type { WorkspaceData } from "@/lib/types";
import { InitialAvatar } from "@/components/workspace/initial-avatar";
import { PriorityBadge, dueInfo, formatDateVi } from "@/components/workspace/badges";

function StatCard({
  icon: Icon,
  value,
  label,
  note,
  className,
}: {
  icon: typeof Bot;
  value: string | number;
  label: string;
  note?: string;
  className?: string;
}) {
  return (
    <div
      className={
        "rounded-2xl border-2 border-ink/10 bg-raised p-5 transition-all hover:-translate-y-0.5 hover:border-blue/40 " +
        (className ?? "")
      }
    >
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-mist text-blue">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        {note ? (
          <span className="font-hand text-[15px] leading-none text-ink-faint">{note}</span>
        ) : null}
      </div>
      <p className="mt-4 text-3xl font-extrabold leading-none text-ink">{value}</p>
      <p className="mt-1.5 text-[13px] font-semibold text-ink-soft">{label}</p>
    </div>
  );
}

function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div
      className={"h-3 overflow-hidden rounded-full border-2 border-ink/15 bg-raised " + (className ?? "")}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-royal transition-[width] duration-700 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/** Thẻ chào — như trang bìa nhỏ trong sổ. */
function GreetingCard({
  data,
  onOpenMentor,
}: {
  data: WorkspaceData;
  onOpenMentor: () => void;
}) {
  const firstName = data.me.name.split(" ").slice(-1)[0];
  const hour = new Date().getHours();
  const greeting =
    hour < 11 ? "Chào buổi sáng" : hour < 14 ? "Chào buổi trưa" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";

  return (
    <section className="sketch-card relative overflow-hidden p-6 sm:p-8">
      <div className="absolute -right-8 -top-8 h-36 w-36 rotate-12 rounded-3xl bg-blue-mist/70" aria-hidden="true" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-hand text-xl leading-none text-blue">
            {greeting}, ngày {new Date().toLocaleDateString("vi-VN")} ✦
          </p>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-[28px]">
            Mình đang đi tới đâu rồi nhỉ,{" "}
            <span className="marker">{firstName}?</span>
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-soft">
            {data.role === "intern"
              ? "Đây là bức tranh tổng quát hành trình thực tập của bạn — nhiệm vụ, sprint và một chút động lực mỗi ngày."
              : "Đây là bức tranh tổng quát về các sinh viên và tiến độ chung của đợt thực tập này."}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenMentor}
          className="group inline-flex min-h-12 shrink-0 items-center gap-2.5 rounded-xl border-2 border-ink bg-coal px-5 py-2.5 text-sm font-bold text-chalk shadow-[4px_4px_0_0_var(--blue)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--blue)] active:translate-x-0 active:translate-y-0"
        >
          <Bot className="h-4.5 w-4.5 text-blue" aria-hidden="true" />
          Hỏi AI Mentor
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

export function DashboardView({
  data,
  onNavigate,
}: {
  data: WorkspaceData;
  onNavigate: (id: SectionId) => void;
}) {
  const queryClient = useQueryClient();
  void queryClient;

  const activeSprint = data.sprints.find((s) => s.status === "active") ?? data.sprints[0];
  const openTasks = data.tasks.filter((t) => t.status !== "done");
  const doneTasks = data.tasks.filter((t) => t.status === "done");
  const myOpen = data.role === "intern" ? openTasks : openTasks;
  const urgent = [...myOpen]
    .filter((t) => t.dueDate !== null)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 4);

  const isIntern = data.role === "intern";
  const roster = data.roster ?? [];
  const avgCompletion = roster.length
    ? Math.round(roster.reduce((sum, r) => sum + r.completion, 0) / roster.length)
    : 0;

  return (
    <div className="space-y-6">
      <GreetingCard data={data} onOpenMentor={() => onNavigate("mentor")} />

      {/* Thống kê nhanh */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {isIntern ? (
          <>
            <StatCard icon={ListTodo} value={myOpen.length} label="Nhiệm vụ đang mở" note="cố lên!" />
            <StatCard
              icon={CheckCircle2}
              value={doneTasks.length}
              label="Nhiệm vụ đã xong"
              note="đẹp lắm!"
            />
            <StatCard
              icon={Flame}
              value={`${doneTasks.reduce((s, t) => s + t.point, 0)}đ`}
              label="Điểm tích luỹ"
            />
            <StatCard
              icon={CalendarDays}
              value={activeSprint ? activeSprint.name.replace(/^Sprint \d+ — /, "") : "—"}
              label="Sprint hiện tại"
            />
          </>
        ) : (
          <>
            <StatCard icon={Users} value={roster.length} label="Sinh viên đang theo dõi" />
            <StatCard
              icon={CheckCircle2}
              value={doneTasks.length}
              label="Nhiệm vụ hoàn thành (toàn lớp)"
            />
            <StatCard icon={ListTodo} value={openTasks.length} label="Nhiệm vụ đang mở" />
            <StatCard icon={TrendingUp} value={`${avgCompletion}%`} label="Tiến độ trung bình" />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,58fr)_minmax(0,42fr)]">
        {/* Nhiệm vụ sắp đến hạn */}
        <section className="sketch-card p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-extrabold text-ink">
              {isIntern ? "Sắp đến hạn rồi đây…" : "Nhiệm vụ sắp đến hạn"}
            </h3>
            <button
              type="button"
              onClick={() => onNavigate("tasks")}
              className="group inline-flex items-center gap-1 text-[13px] font-bold text-blue"
            >
              Xem tất cả
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </button>
          </div>

          {urgent.length === 0 ? (
            <p className="mt-6 rounded-xl border-2 border-dashed border-ink/15 p-6 text-center font-hand text-lg text-ink-faint">
              hôm nay không có gì sắp tới hạn — nghỉ một chút cũng là một phần của hành trình nhé!
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {urgent.map((t) => {
                const info = dueInfo(t.dueDate);
                return (
                  <li
                    key={t.id}
                    className="flex items-center gap-3.5 rounded-xl border-2 border-ink/10 bg-paper p-4 transition-colors hover:border-blue/40"
                  >
                    <ClipboardList className="h-5 w-5 shrink-0 text-blue" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">{t.title}</p>
                      <p className="mt-0.5 truncate text-xs text-ink-faint">{t.sprintName}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span
                        className={
                          "rounded-full border-2 px-2.5 py-0.5 text-[11px] font-bold " +
                          (info.overdue
                            ? "border-destructive/40 bg-destructive/10 text-destructive"
                            : info.soon
                              ? "border-amber-500/40 bg-amber-500/10 text-amber-600"
                              : "border-ink/15 bg-raised text-ink-soft")
                        }
                      >
                        {info.text}
                      </span>
                      <PriorityBadge priority={t.priority} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Tiến độ sprint + đồng đội */}
        <div className="space-y-6">
          {activeSprint ? (
            <section className="relative overflow-hidden rounded-2xl border-2 border-ink bg-coal p-6 text-chalk shadow-[5px_5px_0_0_var(--hard-shadow)]">
              <div className="absolute inset-0 bg-dots-chalk" aria-hidden="true" />
              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-extrabold text-chalk">{activeSprint.name}</h3>
                  <span className="rounded-full border-2 border-royal bg-royal px-2.5 py-0.5 text-[11px] font-bold text-white">
                    Đang chạy
                  </span>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-chalk-soft">
                  {activeSprint.goal}
                </p>
                <div className="mt-5 flex items-center justify-between text-xs font-bold text-chalk-soft">
                  <span>{formatDateVi(activeSprint.startDate)}</span>
                  <span>{formatDateVi(activeSprint.endDate)}</span>
                </div>
                <div className="mt-2 h-3.5 overflow-hidden rounded-full border-2 border-white/20 bg-white/10">
                  <div
                    className="h-full rounded-full bg-royal transition-[width] duration-700"
                    style={{
                      width: `${
                        activeSprint.total
                          ? Math.round((activeSprint.done / activeSprint.total) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <p className="mt-2.5 font-hand text-lg text-blue">
                  {activeSprint.done}/{activeSprint.total} nhiệm vụ đã hoàn thành —
                  {activeSprint.total && activeSprint.done === activeSprint.total
                    ? " xuất sắc!"
                    : " giữ nhịp này nhé!"}
                </p>
              </div>
            </section>
          ) : null}

          {isIntern && data.teammates && data.teammates.length > 0 ? (
            <section className="rounded-2xl border-2 border-ink/10 bg-raised p-6">
              <h3 className="text-base font-extrabold text-ink">Đồng hành cùng bạn</h3>
              <ul className="mt-4 space-y-3">
                {data.teammates.slice(0, 4).map((m) => (
                  <li key={m.id} className="flex items-center gap-3">
                    <InitialAvatar name={m.name} id={m.id} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold text-ink">{m.name}</p>
                      <p className="truncate text-[11px] text-ink-faint">
                        {m.major ?? "Thực tập sinh"}
                      </p>
                    </div>
                    <Sparkles className="h-4 w-4 shrink-0 text-blue/60" aria-hidden="true" />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {!isIntern && roster.length > 0 ? (
            <section className="rounded-2xl border-2 border-ink/10 bg-raised p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-extrabold text-ink">Sinh viên nổi bật</h3>
                <button
                  type="button"
                  onClick={() => onNavigate("roster")}
                  className="group inline-flex items-center gap-1 text-[13px] font-bold text-blue"
                >
                  Xem tất cả
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </button>
              </div>
              <ul className="mt-4 space-y-4">
                {[...roster]
                  .sort((a, b) => b.completion - a.completion)
                  .slice(0, 3)
                  .map((r) => (
                    <li key={r.id} className="flex items-center gap-3">
                      <InitialAvatar name={r.name} id={r.id} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-[13px] font-bold text-ink">{r.name}</p>
                          <span className="text-xs font-extrabold text-blue">{r.completion}%</span>
                        </div>
                        <ProgressBar value={r.completion} className="mt-1.5 h-2" />
                      </div>
                    </li>
                  ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
