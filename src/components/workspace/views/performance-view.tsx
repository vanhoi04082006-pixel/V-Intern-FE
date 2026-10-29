"use client";

import {
  Award,
  CheckCircle2,
  Flame,
  ListTodo,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WorkspaceData } from "@/lib/types";

/** Hiệu suất cá nhân — tính trực tiếp từ dữ liệu nhiệm vụ thật. */
export function PerformanceView({ data }: { data: WorkspaceData }) {
  const done = data.tasks.filter((t) => t.status === "done");
  const open = data.tasks.filter((t) => t.status !== "done");
  const points = done.reduce((s, t) => s + t.point, 0);
  const completion = data.tasks.length
    ? Math.round((done.length / data.tasks.length) * 100)
    : 0;

  // Kỹ năng: suy ra từ phân bố trạng thái — minh bạch, không bịa
  const inProgress = data.tasks.filter((t) => t.status === "in_progress").length;
  const review = data.tasks.filter((t) => t.status === "review").length;
  const skills = [
    {
      name: "Thực hiện nhiệm vụ",
      value: Math.min(100, done.length * 12 + 10),
      note: `${done.length} nhiệm vụ hoàn thành`,
    },
    {
      name: "Tốc độ xử lý",
      value: Math.min(100, inProgress * 15 + 25),
      note: `${inProgress} việc đang song song`,
    },
    {
      name: "Chủ động gửi duyệt",
      value: Math.min(100, review * 20 + 20),
      note: `${review} việc chờ mentor chấm`,
    },
    {
      name: "Ổn định tiến độ",
      value: Math.min(100, completion + 8),
      note: `${completion}% tổng thể`,
    },
  ];

  const chartData = data.sprints.map((s) => ({
    name: `S${s.order}`,
    "Nhiệm vụ xong": s.done,
    "Tổng nhiệm vụ": s.total,
  }));

  return (
    <div className="space-y-6">
      {/* Thẻ KPI */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { icon: Target, value: `${completion}%`, label: "Tiến độ tổng thể" },
          { icon: CheckCircle2, value: done.length, label: "Nhiệm vụ hoàn thành" },
          { icon: ListTodo, value: open.length, label: "Đang còn mở" },
          { icon: Flame, value: `${points}đ`, label: "Điểm tích luỹ" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl border-2 border-ink/10 bg-raised p-5 transition-all hover:-translate-y-0.5 hover:border-blue/40"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-mist text-blue">
              <kpi.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-4 text-3xl font-extrabold leading-none text-ink">{kpi.value}</p>
            <p className="mt-1.5 text-[13px] font-semibold text-ink-soft">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,55fr)_minmax(0,45fr)]">
        {/* Biểu đồ theo sprint */}
        <section className="sketch-card p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-base font-extrabold text-ink">
              <TrendingUp className="h-4.5 w-4.5 text-blue" aria-hidden="true" />
              Nhiệm vụ theo sprint
            </h3>
            <span className="font-hand text-[15px] text-ink-faint">số liệu thật từ sổ tay</span>
          </div>
          <div className="mt-5 h-[300px] w-full" role="img" aria-label="Biểu đồ cột số nhiệm vụ hoàn thành trên tổng nhiệm vụ của từng sprint">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={6}>
                <CartesianGrid strokeDasharray="4 6" stroke="rgba(23,23,28,0.12)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fontWeight: 700, fill: "currentColor" }}
                  axisLine={{ stroke: "rgba(23,23,28,0.2)" }}
                  tickLine={false}
                  className="text-ink-soft"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "currentColor" }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                  className="text-ink-soft"
                />
                <Tooltip
                  cursor={{ fill: "rgba(32,96,240,0.08)" }}
                  contentStyle={{
                    background: "var(--paper-raised)",
                    border: "2px solid var(--ink)",
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 600,
                    boxShadow: "4px 4px 0 0 var(--hard-shadow)",
                  }}
                  labelStyle={{ fontWeight: 800, color: "var(--ink)" }}
                />
                <Bar dataKey="Tổng nhiệm vụ" fill="var(--blue-mist)" stroke="var(--blue)" strokeDasharray="4 3" radius={[7, 7, 0, 0]} />
                <Bar dataKey="Nhiệm vụ xong" fill="#2060f0" stroke="var(--ink)" strokeWidth={1.5} radius={[7, 7, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Kỹ năng + chứng nhận */}
        <div className="space-y-6">
          <section className="rounded-2xl border-2 border-ink/10 bg-raised p-6">
            <h3 className="text-base font-extrabold text-ink">Bức tranh kỹ năng</h3>
            <p className="mt-1 text-xs text-ink-faint">
              tự đánh giá từ dữ liệu nhiệm vụ — cập nhật theo thời gian thực
            </p>
            <ul className="mt-5 space-y-4">
              {skills.map((s) => (
                <li key={s.name}>
                  <div className="flex items-center justify-between gap-2 text-[13px]">
                    <span className="font-bold text-ink">{s.name}</span>
                    <span className="font-mono text-xs font-bold text-blue">{s.value}%</span>
                  </div>
                  <div className="mt-1.5 h-3 overflow-hidden rounded-full border-2 border-ink/12 bg-paper">
                    <div
                      className="h-full rounded-full bg-royal transition-[width] duration-700"
                      style={{ width: `${s.value}%` }}
                    />
                  </div>
                  <p className="mt-1 font-hand text-[14px] text-ink-faint">{s.note}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="relative overflow-hidden rounded-2xl border-2 border-ink bg-royal p-6 text-white shadow-[5px_5px_0_0_var(--hard-shadow)]">
            <div className="absolute inset-0 bg-dots-chalk" aria-hidden="true" />
            <div className="relative">
              <Award className="h-8 w-8" aria-hidden="true" />
              <p className="mt-4 text-lg font-extrabold leading-snug">
                Chứng nhận hoàn thành
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/85">
                Hoàn thành đủ 4 sprint và đạt tối thiểu 70% nhiệm vụ để mở khoá chứng nhận
                thực tập số kèm Portfolio badge chia sẻ lên LinkedIn.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl border-2 border-white/40 bg-white/10 px-4 py-2 backdrop-blur-sm">
                <span className="font-mono text-xs font-bold tracking-wider">
                  {completion}% / 70% yêu cầu
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
