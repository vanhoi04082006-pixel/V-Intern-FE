"use client";

import { CheckCircle2, CircleDotDashed, Rocket, Sparkles } from "lucide-react";
import type { WorkspaceData } from "@/lib/types";
import { formatDateVi } from "@/components/workspace/badges";

/** Dòng thời gian các sprint — như các chương trong cuốn sổ hành trình. */
export function SprintView({ data }: { data: WorkspaceData }) {
  return (
    <div className="space-y-5">
      <div className="sketch-card p-6">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-blue">
          dòng thời gian
        </p>
        <h2 className="mt-2 text-xl font-extrabold text-ink">
          Hành trình 4 sprint của bạn
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
          Mỗi sprint là một chương của cuốn sổ — có mục tiêu riêng, có deadline riêng, và
          cả những trang đã hoàn thành để bạn nhìn lại.
        </p>
      </div>

      <ol className="relative space-y-5">
        {/* Đường dọc nối các mốc */}
        <span
          aria-hidden="true"
          className="absolute bottom-6 left-[23px] top-6 w-0.5 border-l-2 border-dashed border-ink/20"
        />

        {data.sprints.map((s) => {
          const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
          const isActive = s.status === "active";
          const isDone = s.status === "done";
          const isUpcoming = s.status === "upcoming";

          return (
            <li key={s.id} className="relative pl-16">
              {/* Mốc tròn */}
              <span
                aria-hidden="true"
                className={
                  "absolute left-0 top-5 flex h-12 w-12 items-center justify-center rounded-full border-2 " +
                  (isActive
                    ? "border-royal bg-royal text-white shadow-[0_0_0_4px_rgba(32,96,240,0.2)]"
                    : isDone
                      ? "border-emerald-600/60 bg-emerald-500/10 text-emerald-600"
                      : "border-dashed border-ink/30 bg-raised text-ink-faint")
                }
              >
                {isDone ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : isActive ? (
                  <Rocket className="h-5 w-5" />
                ) : (
                  <CircleDotDashed className="h-5 w-5" />
                )}
              </span>

              <article
                className={
                  "rounded-2xl border-2 p-5 transition-all sm:p-6 " +
                  (isActive
                    ? "border-ink bg-raised shadow-[5px_5px_0_0_var(--hard-shadow)]"
                    : "border-ink/12 bg-raised hover:border-blue/40")
                }
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-extrabold text-ink">{s.name}</h3>
                  <span
                    className={
                      "rounded-full border-2 px-3 py-0.5 text-[11px] font-bold " +
                      (isActive
                        ? "border-royal bg-royal text-white"
                        : isDone
                          ? "border-emerald-600/50 bg-emerald-500/10 text-emerald-600"
                          : "border-ink/20 bg-blue-mist text-blue")
                    }
                  >
                    {isActive ? "Đang chạy" : isDone ? "Hoàn thành" : "Sắp tới"}
                  </span>
                </div>

                <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">{s.goal}</p>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-ink-faint">
                  <span>
                    {formatDateVi(s.startDate)} → {formatDateVi(s.endDate)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-blue" aria-hidden="true" />
                    {s.done}/{s.total} nhiệm vụ
                  </span>
                </div>

                <div className="mt-3 h-3 overflow-hidden rounded-full border-2 border-ink/12 bg-paper">
                  <div
                    className={
                      "h-full rounded-full transition-[width] duration-700 " +
                      (isDone ? "bg-emerald-500" : "bg-royal")
                    }
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {isActive ? (
                  <p className="mt-3 font-hand text-[17px] text-blue">
                    {pct >= 70
                      ? "gần đích rồi — giữ phong độ này!"
                      : "một ngày một trang, không vội cũng không chậm."}
                  </p>
                ) : null}
              </article>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
