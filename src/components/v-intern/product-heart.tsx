"use client";

import { KanbanSquare } from "lucide-react";
import { FadeIn } from "@/components/v-intern/reveal";
import { CrossDoodle, SparkleDoodle, StarDoodle } from "@/components/v-intern/doodles";

const STATS = [
  "Sprint 2 tuần",
  "Story point",
  "Pull request",
  "Đánh giá đồng nghiệp",
];

const KANBAN_COLUMNS: {
  name: string;
  cards: { title: string; tag: string; points: number; active?: boolean; done?: boolean }[];
}[] = [
  {
    name: "Cần làm",
    cards: [
      { title: "Viết test cho module auth", tag: "Backend", points: 3 },
      { title: "Thiết kế màn hình CRUD", tag: "UI", points: 2 },
    ],
  },
  {
    name: "Đang làm",
    cards: [{ title: "API danh sách nhiệm vụ", tag: "Backend", points: 5, active: true }],
  },
  {
    name: "Chờ duyệt",
    cards: [{ title: "PR #128 — fix kanban", tag: "Frontend", points: 3 }],
  },
  {
    name: "Hoàn thành",
    cards: [
      { title: "Khung dự án & README", tag: "DevOps", points: 2, done: true },
      { title: "Đăng nhập JWT", tag: "Backend", points: 5, done: true },
    ],
  },
];

/** Bảng Kanban mô phỏng — dựng bằng HTML sắc nét trên nền đen. */
function KanbanBoard() {
  return (
    <div
      aria-hidden="true"
      className="rotate-[1.2deg] rounded-xl border-2 border-royal/60 bg-coal-soft/80 p-3 shadow-[6px_6px_0_0_rgba(32,96,240,0.55)] transition-transform duration-500 ease-out motion-safe:hover:rotate-0"
    >
      <div className="flex items-center justify-between gap-3 border-b-2 border-dashed border-chalk/15 px-2 pb-2.5">
        <p className="font-hand text-lg leading-none text-chalk">bảng sprint #4</p>
        <span className="rounded-full border-2 border-dashed border-blue/50 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-blue">
          Tuần 2/2
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {KANBAN_COLUMNS.map((column) => (
          <div key={column.name} className="rounded-lg bg-black/40 p-2">
            <div className="flex items-center justify-between gap-1.5 px-1 pb-2">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-chalk-soft">
                {column.name}
              </p>
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue/25 px-1 font-mono text-[9px] font-bold text-blue">
                {column.cards.length}
              </span>
            </div>
            <div className="space-y-2">
              {column.cards.map((card) => (
                <div
                  key={card.title}
                  className={
                    card.active
                      ? "rounded-md border-2 border-royal bg-royal p-2 text-white"
                      : card.done
                        ? "rounded-md border-2 border-chalk/15 bg-coal-soft p-2"
                        : "rounded-md border-2 border-chalk/15 bg-coal-soft p-2"
                  }
                >
                  <p
                    className={
                      "text-[11px] font-semibold leading-snug " +
                      (card.active
                        ? "text-white"
                        : card.done
                          ? "text-chalk-soft line-through decoration-royal/70"
                          : "text-chalk")
                    }
                  >
                    {card.title}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between gap-1">
                    <span
                      className={
                        "rounded px-1.5 py-px font-mono text-[9px] font-bold uppercase " +
                        (card.active
                          ? "bg-white text-royal-deep"
                          : "bg-royal/25 text-[#9db4ff]")
                      }
                    >
                      {card.tag}
                    </span>
                    <span
                      className={
                        "font-mono text-[9px] font-bold " +
                        (card.active ? "text-white" : "text-chalk-soft")
                      }
                    >
                      {card.points} SP
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Trái tim sản phẩm — trang sổ nền đen mực,
 * kanban dựng bằng HTML hiển thị trọn vòng đời sprint.
 */
export function ProductHeart() {
  return (
    <section
      id="product-heart"
      className="relative scroll-mt-20 overflow-hidden bg-coal py-20 lg:py-24"
      aria-label="Trái tim sản phẩm"
    >
      {/* Lưới chấm mờ trên nền đen */}
      <div
        aria-hidden="true"
        className="mask-fade-edges pointer-events-none absolute inset-0 bg-dots-chalk opacity-70"
      />
      <StarDoodle className="absolute left-[6%] top-14 hidden h-8 w-8 text-blue/40 lg:block" />
      <CrossDoodle className="absolute bottom-16 left-[42%] hidden h-5 w-5 text-chalk/20 lg:block" />
      <SparkleDoodle className="absolute right-[7%] top-20 hidden h-7 w-7 text-blue/50 lg:block" />

      <div className="relative mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <FadeIn>
            <p className="inline-flex items-center gap-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-blue">
              <span aria-hidden="true" className="inline-block h-[2px] w-7 rounded-full bg-blue" />
              Trái tim sản phẩm
            </p>

            <h2 className="mt-4 text-3xl font-extrabold leading-[1.15] tracking-tight text-chalk sm:text-4xl lg:text-[42px]">
              Sản phẩm mô phỏng{" "}
              <span className="relative inline-block text-blue">
                toàn diện
                <svg
                  aria-hidden="true"
                  viewBox="0 0 120 10"
                  preserveAspectRatio="none"
                  className="absolute -bottom-1.5 left-0 h-[8px] w-full text-blue"
                >
                  <path
                    d="M2 7 Q 14 2.5, 27 6 T 52 5.5 T 77 6.5 T 102 5 T 118 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h2>

            <p className="mt-5 text-base leading-relaxed text-chalk-soft">
              Sprint 2 tuần, story point, pull request, đánh giá đồng nghiệp —
              cả một vòng đời sản phẩm phần mềm được tái hiện trọn vẹn, như
              công ty thật thu nhỏ.
            </p>

            <ul className="mt-7 flex flex-wrap gap-2.5">
              {STATS.map((stat) => (
                <li
                  key={stat}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-dashed border-chalk/25 px-3.5 py-1.5 text-xs font-semibold text-chalk"
                >
                  <KanbanSquare className="h-3.5 w-3.5 text-[#7d97ff]" aria-hidden="true" />
                  {stat}
                </li>
              ))}
            </ul>

            <p className="mt-7 -rotate-1 font-hand text-lg leading-snug text-[#7d97ff]">
              nghỉ ngơi vài phút, ghim bảng sprint lên tường nhé →
            </p>
          </FadeIn>

          <FadeIn delay={0.12}>
            <KanbanBoard />
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
