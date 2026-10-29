"use client";

import {
  BookOpen,
  GitBranch,
  Github,
  Layers,
  Palette,
  Server,
  Sparkles,
  Target,
} from "lucide-react";
import type { WorkspaceData } from "@/lib/types";
import { formatDateVi } from "@/components/workspace/badges";

const TECH_STACK = [
  { icon: Palette, label: "Next.js + Tailwind" },
  { icon: Server, label: "API Routes" },
  { icon: Layers, label: "Prisma + SQLite" },
  { icon: Sparkles, label: "AI Mentor (LLM)" },
];

/** Dự án đang thực tập — góc nhìn "kho dự án" với các mốc từ sprint. */
export function ProjectsView({ data }: { data: WorkspaceData }) {
  const doneSprints = data.sprints.filter((s) => s.status === "done").length;

  return (
    <div className="space-y-6">
      {/* Thẻ dự án chính */}
      <article className="sketch-card relative overflow-hidden p-6 sm:p-8">
        <div className="tape -top-2 left-10 z-20" />
        <div
          aria-hidden="true"
          className="absolute -bottom-10 -right-10 h-44 w-44 -rotate-6 rounded-3xl bg-blue-mist/60"
        />

        <div className="relative">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex -rotate-1 items-center gap-1.5 rounded-full border-2 border-ink bg-blue-mist px-3.5 py-1 text-xs font-bold text-blue">
              <Target className="h-3.5 w-3.5" aria-hidden="true" />
              Dự án thực tập · đang diễn ra
            </span>
            <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-ink-faint">
              repo: v-intern/workspace-app
            </span>
          </div>

          <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Sổ tay hành trình —
            <br />
            <span className="marker">V-Intern Workspace App</span>
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft">
            Xây dựng ứng dụng workspace cho nền tảng thực tập ảo V-Intern: bảng điều
            khiển cá nhân, quản lý nhiệm vụ kiểu kanban, theo dõi sprint và trò chuyện
            cùng AI Mentor. Dự án được chia thành 4 sprint — mỗi sprint kết thúc là một
            lần demo trước cả nhóm.
          </p>

          {/* Chỉ số nhanh */}
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { value: `${data.sprints.length}`, label: "sprint" },
              { value: `${doneSprints}`, label: "sprint đã xong" },
              { value: `${data.tasks.length}`, label: "nhiệm vụ" },
              {
                value: `${data.tasks.reduce((s, t) => s + t.point, 0)}đ`,
                label: "tổng điểm",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border-2 border-ink/12 bg-paper p-4 text-center"
              >
                <p className="text-2xl font-extrabold text-ink">{s.value}</p>
                <p className="mt-1 text-[11px] font-semibold text-ink-soft">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </article>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Công nghệ */}
        <section className="rounded-2xl border-2 border-ink/10 bg-raised p-6">
          <div className="flex items-center gap-2.5">
            <BookOpen className="h-5 w-5 text-blue" aria-hidden="true" />
            <h3 className="text-base font-extrabold text-ink">Công nghệ & công cụ</h3>
          </div>
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {TECH_STACK.map((t) => (
              <li
                key={t.label}
                className="flex items-center gap-3 rounded-xl border-2 border-ink/10 bg-paper p-3.5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-mist text-blue">
                  <t.icon className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <span className="text-[13px] font-bold text-ink">{t.label}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-center gap-3 rounded-xl border-2 border-dashed border-ink/20 bg-paper p-4">
            <Github className="h-5 w-5 shrink-0 text-ink" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-ink">Quy trình làm việc</p>
              <p className="text-xs leading-relaxed text-ink-soft">
                Fork repo → tạo nhánh theo nhiệm vụ → Pull Request → mentor review →
                merge. Mỗi PR gắn với một nhiệm vụ trong sprint.
              </p>
            </div>
          </div>
        </section>

        {/* Mốc quan trọng */}
        <section className="rounded-2xl border-2 border-ink/10 bg-raised p-6">
          <div className="flex items-center gap-2.5">
            <GitBranch className="h-5 w-5 text-blue" aria-hidden="true" />
            <h3 className="text-base font-extrabold text-ink">Mốc quan trọng</h3>
          </div>
          <ol className="mt-4 space-y-3">
            {data.sprints.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-3.5 rounded-xl border-2 border-ink/10 bg-paper p-4"
              >
                <span
                  className={
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold " +
                    (s.status === "done"
                      ? "bg-emerald-500/15 text-emerald-600"
                      : s.status === "active"
                        ? "bg-royal text-white"
                        : "bg-blue-mist text-blue")
                  }
                  aria-hidden="true"
                >
                  S{s.order}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-ink">
                    {s.name.replace(/^Sprint \d+ — /, "")}
                  </p>
                  <p className="text-xs text-ink-faint">
                    kết thúc {formatDateVi(s.endDate)} · {s.done}/{s.total} nhiệm vụ
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
