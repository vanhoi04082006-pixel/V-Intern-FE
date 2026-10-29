"use client";

import { AlertTriangle, CheckCircle2, GraduationCap, TrendingUp } from "lucide-react";
import type { RosterMember } from "@/lib/types";
import { InitialAvatar } from "@/components/workspace/initial-avatar";

function QualityMeter({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2.5 w-24 overflow-hidden rounded-full border-2 border-ink/12 bg-paper">
        <div
          className="h-full rounded-full bg-royal"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      <span className="font-mono text-xs font-bold text-blue">{value}</span>
    </div>
  );
}

/** Danh sách sinh viên — giành cho giảng viên & quản trị. */
export function RosterView({ roster }: { roster: RosterMember[] }) {
  const stats = {
    total: roster.length,
    onTrack: roster.filter((r) => r.overdueCount === 0).length,
    needAttention: roster.filter((r) => r.overdueCount > 0 || r.completion < 40).length,
    avg: roster.length
      ? Math.round(roster.reduce((s, r) => s + r.completion, 0) / roster.length)
      : 0,
  };

  return (
    <div className="space-y-6">
      {/* Thẻ tổng quan */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { icon: GraduationCap, value: stats.total, label: "Sinh viên đang theo dõi" },
          { icon: CheckCircle2, value: stats.onTrack, label: "Đang đúng tiến độ" },
          { icon: AlertTriangle, value: stats.needAttention, label: "Cần chú ý" },
          { icon: TrendingUp, value: `${stats.avg}%`, label: "Tiến độ trung bình" },
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

      {/* Bảng sinh viên */}
      <section className="overflow-hidden rounded-2xl border-2 border-ink/10 bg-raised">
        <div className="border-b-2 border-dashed border-ink/12 p-5">
          <h3 className="text-base font-extrabold text-ink">Danh sách sinh viên</h3>
          <p className="mt-1 text-xs text-ink-faint">
            tiến độ tính từ nhiệm vụ thực tế trong các sprint
          </p>
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-ink/10 bg-blue-mist/50 text-xs font-bold uppercase tracking-wide text-ink-soft">
                <th scope="col" className="px-5 py-3.5">Sinh viên</th>
                <th scope="col" className="px-5 py-3.5">Chuyên ngành</th>
                <th scope="col" className="px-5 py-3.5 text-center">Nhiệm vụ</th>
                <th scope="col" className="px-5 py-3.5">Tiến độ</th>
                <th scope="col" className="px-5 py-3.5">Đánh giá</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-ink/8 transition-colors last:border-0 hover:bg-blue-mist/30"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <InitialAvatar name={r.name} id={r.id} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-bold text-ink">{r.name}</p>
                        <p className="truncate text-xs text-ink-faint">{r.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-[13px] font-medium text-ink-soft">
                      {r.major ?? "—"}
                    </p>
                    <p className="text-xs text-ink-faint">{r.university ?? ""}</p>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="font-mono text-[13px] font-bold text-ink">
                      {r.doneCount}/{r.taskCount}
                    </span>
                    {r.overdueCount > 0 ? (
                      <p className="text-[11px] font-bold text-destructive">
                        {r.overdueCount} trễ hạn
                      </p>
                    ) : null}
                  </td>
                  <td className="px-5 py-4">
                    <QualityMeter value={r.completion} />
                  </td>
                  <td className="px-5 py-4">
                    <QualityMeter value={r.quality} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <ul className="divide-y-2 divide-dashed divide-ink/10 md:hidden">
          {roster.map((r) => (
            <li key={r.id} className="p-4">
              <div className="flex items-center gap-3">
                <InitialAvatar name={r.name} id={r.id} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{r.name}</p>
                  <p className="truncate text-xs text-ink-faint">{r.major ?? r.email}</p>
                </div>
                <span className="font-mono text-sm font-bold text-blue">
                  {r.doneCount}/{r.taskCount}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                <QualityMeter value={r.completion} />
                {r.overdueCount > 0 ? (
                  <p className="text-[11px] font-bold text-destructive">
                    {r.overdueCount} nhiệm vụ trễ hạn
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
