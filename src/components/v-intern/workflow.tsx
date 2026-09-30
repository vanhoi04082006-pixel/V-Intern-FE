"use client";

import { useId, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Bot,
  CalendarDays,
  Check,
  CircleCheck,
  Code2,
  FileCode2,
  Flame,
  FolderOpen,
  GitMerge,
  GitPullRequest,
  Star,
  TrendingDown,
  TrendingUp,
  UserSearch,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SectionHeading } from "@/components/v-intern/section-heading";
import { FadeIn } from "@/components/v-intern/reveal";

type Step = {
  icon: LucideIcon;
  name: string;
  summary: string;
  phase: string;
  range: string;
  detail: string;
  does: string[];
  gets: string;
  artifact: string;
  preview: ReactNode;
};

/* ---------- Artifact previews ---------- */

/* 01 · Scorecard — donut chart + thanh tiêu chí */

const SCORE_TOTAL = 82;
const SCORE_CRITERIA: [string, number][] = [
  ["Kiến thức nền", 88],
  ["Tư duy hệ thống", 81],
  ["Giao tiếp", 76],
];
const DONUT_R = 30;
const DONUT_C = 2 * Math.PI * DONUT_R;

function Scorecard() {
  const reduceMotion = useReducedMotion();
  const gradientId = useId();

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        <p className="text-[10px] font-medium uppercase leading-none tracking-wider text-slate-400">
          Kết quả phỏng vấn
        </p>
        <p className="font-mono text-[10px] leading-none text-slate-400 tabular-nums">
          Vòng 1 · 12 câu · 18 phút
        </p>
      </div>

      <div className="mt-3 flex items-center gap-4">
        <div className="relative h-[88px] w-[88px] shrink-0">
          <svg viewBox="0 0 88 88" className="h-full w-full -rotate-90">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#38BDF8" />
              </linearGradient>
            </defs>
            <circle
              cx="44"
              cy="44"
              r={DONUT_R}
              fill="none"
              strokeWidth="9"
              className="stroke-slate-100"
            />
            <motion.circle
              cx="44"
              cy="44"
              r={DONUT_R}
              fill="none"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={DONUT_C}
              stroke={`url(#${gradientId})`}
              initial={reduceMotion ? false : { strokeDashoffset: DONUT_C }}
              animate={{ strokeDashoffset: DONUT_C * (1 - SCORE_TOTAL / 100) }}
              transition={{
                duration: reduceMotion ? 0 : 0.9,
                ease: "easeOut",
                delay: reduceMotion ? 0 : 0.15,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold leading-none text-navy tabular-nums">
              {SCORE_TOTAL}
            </span>
            <span className="mt-1 font-mono text-[9px] leading-none text-slate-400">
              /100
            </span>
          </div>
        </div>

        <ul className="min-w-0 flex-1 space-y-2.5">
          {SCORE_CRITERIA.map(([label, value]) => (
            <li key={label}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[11px] text-slate-500">
                  {label}
                </span>
                <span className="font-mono text-[10px] font-semibold text-navy tabular-nums">
                  {value}
                </span>
              </div>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  className="h-full origin-left rounded-full bg-blue-500"
                  style={{ width: `${value}%` }}
                  initial={reduceMotion ? false : { scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.7,
                    ease: "easeOut",
                    delay: reduceMotion ? 0 : 0.25,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
          <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Đạt yêu cầu — vào thẳng vòng dự án
        </p>
        <p className="ml-auto font-mono text-[10px] leading-none text-slate-400 tabular-nums">
          Top 18% thí sinh
        </p>
      </div>
    </div>
  );
}

/* 02 · Repository — heatmap hoạt động + thanh ngôn ngữ */

const HEAT_CELLS = Array.from({ length: 16 * 7 }, (_, i) => {
  const wave = Math.sin(i / 6) + Math.cos(i / 2.2);
  return wave > 1.1 ? 4 : wave > 0.5 ? 3 : wave > 0 ? 2 : wave > -0.7 ? 1 : 0;
});
const HEAT_FILL = [
  "bg-slate-100",
  "bg-blue-100",
  "bg-blue-200",
  "bg-blue-400",
  "bg-blue-600",
];
const HEAT_MONTHS = ["T9", "T10", "T11", "T12"];

const REPO_LANGS: [string, number, string][] = [
  ["TypeScript", 58, "bg-blue-500"],
  ["Prisma", 22, "bg-navy"],
  ["CSS", 12, "bg-sky-300"],
  ["Khác", 8, "bg-slate-300"],
];

function Repository() {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="flex shrink-0 gap-1" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-rose-400" />
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <span className="min-w-0 truncate font-mono text-[11px] leading-none text-navy">
          v-intern/onboarding
        </span>
        <span className="ml-auto shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] leading-none text-slate-500">
          Private
        </span>
      </div>

      <div className="mt-2.5 flex items-center gap-1.5">
        <span className="text-[11px] font-semibold leading-none text-navy tabular-nums">
          128 commits
        </span>
        <Flame className="h-3 w-3 shrink-0 text-blue-600" aria-hidden="true" />
        <span className="font-mono text-[10px] leading-none text-slate-400">
          streak 6 tuần
        </span>
      </div>

      <div className="mt-3 flex gap-[3px]" aria-hidden="true">
        {HEAT_MONTHS.map((month) => (
          <span
            key={month}
            className="w-[45px] font-mono text-[9px] leading-none text-slate-400"
          >
            {month}
          </span>
        ))}
      </div>
      <div className="mt-1 grid grid-flow-col grid-rows-7 gap-[3px]">
        {HEAT_CELLS.map((level, index) => (
          <span
            key={index}
            className={`h-[9px] w-[9px] rounded-[2px] ${HEAT_FILL[level]}`}
          />
        ))}
      </div>
      <div className="mt-1.5 flex items-center justify-end gap-1.5 text-[9px] leading-none text-slate-400">
        Ít
        <span className="flex gap-[2px]" aria-hidden="true">
          {HEAT_FILL.map((fill) => (
            <span key={fill} className={`h-[7px] w-[7px] rounded-[2px] ${fill}`} />
          ))}
        </span>
        Nhiều
      </div>

      <div className="mt-4 flex h-1.5 w-full overflow-hidden rounded-full">
        {REPO_LANGS.map(([name, pct, color]) => (
          <span key={name} className={color} style={{ width: `${pct}%` }} />
        ))}
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-x-3.5 gap-y-1">
        {REPO_LANGS.map(([name, pct, color]) => (
          <li
            key={name}
            className="flex items-center gap-1.5 text-[10px] text-slate-500"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${color}`}
              aria-hidden="true"
            />
            {name}
            <span className="font-mono text-slate-400 tabular-nums">
              {pct}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* 03 · Sprint board — tiến độ + kanban với avatar + burndown */

const SPRINT_MEMBERS = [
  { src: "/images/avatar-dev-1.png", name: "Thành viên 1" },
  { src: "/images/avatar-dev-2.png", name: "Thành viên 2" },
];

const BURNDOWN_LINE =
  "M10 8 L50 14 L90 12 L130 20 L170 18 L210 26 L250 24 L290 33 L330 31";
const BURNDOWN_IDEAL = "M10 8 L330 40";
const BURNDOWN_AREA = `${BURNDOWN_LINE} L330 48 L10 48 Z`;

function Burndown() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="mt-4">
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-[10px] leading-none text-slate-400">
          Burndown
        </p>
        <p className="text-[10px] font-semibold leading-none text-blue-700">
          còn 9/24 task
        </p>
      </div>
      <svg
        viewBox="0 0 340 48"
        preserveAspectRatio="none"
        className="mt-1.5 h-11 w-full"
        aria-hidden="true"
      >
        <line
          x1="0"
          y1="14"
          x2="340"
          y2="14"
          vectorEffect="non-scaling-stroke"
          className="stroke-slate-100"
        />
        <line
          x1="0"
          y1="28"
          x2="340"
          y2="28"
          vectorEffect="non-scaling-stroke"
          className="stroke-slate-100"
        />
        <line
          x1="0"
          y1="48"
          x2="340"
          y2="48"
          vectorEffect="non-scaling-stroke"
          className="stroke-slate-200"
        />
        <path d={BURNDOWN_AREA} className="fill-blue-50" />
        <path
          d={BURNDOWN_IDEAL}
          fill="none"
          strokeDasharray="4 4"
          vectorEffect="non-scaling-stroke"
          className="stroke-slate-300"
        />
        <motion.path
          d={BURNDOWN_LINE}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          className="stroke-blue-600"
          initial={reduceMotion ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: reduceMotion ? 0 : 0.9,
            ease: "easeOut",
            delay: reduceMotion ? 0 : 0.2,
          }}
        />
      </svg>
      <div
        className="mt-1 flex justify-between px-[3%] font-mono text-[9px] leading-none text-slate-400"
        aria-hidden="true"
      >
        <span>D1</span>
        <span>D7</span>
        <span>D14</span>
      </div>
    </div>
  );
}

function BoardColumn({
  title,
  count,
  variant,
}: {
  title: string;
  count: number;
  variant: "todo" | "doing" | "done";
}) {
  return (
    <div>
      <p className="font-mono text-[10px] leading-none text-slate-400 tabular-nums">
        {title} · {count}
      </p>
      <ul className="mt-2.5 space-y-1.5">
        {Array.from({ length: count }).map((_, card) => {
          if (variant === "done") {
            return (
              <li
                key={card}
                className="flex h-5 items-center rounded bg-blue-100 px-1"
              >
                <span
                  className="mr-1.5 h-2 flex-1 rounded-sm bg-blue-200/80"
                  aria-hidden="true"
                />
                <Check
                  className="h-3 w-3 shrink-0 text-blue-600"
                  strokeWidth={3}
                  aria-hidden="true"
                />
              </li>
            );
          }

          if (variant === "doing") {
            const members = card === 0 ? SPRINT_MEMBERS : [SPRINT_MEMBERS[1]];
            return (
              <li
                key={card}
                className="flex h-5 items-center justify-end rounded bg-blue-500/90 px-1"
              >
                <span className="flex -space-x-1">
                  {members.map((member) => (
                    <Image
                      key={member.name}
                      src={member.src}
                      alt=""
                      width={14}
                      height={14}
                      className="h-3.5 w-3.5 rounded-full object-cover ring-2 ring-white"
                    />
                  ))}
                </span>
              </li>
            );
          }

          return (
            <li
              key={card}
              className="h-5 rounded border border-dashed border-slate-200 bg-slate-100"
            />
          );
        })}
      </ul>
    </div>
  );
}

function SprintBoard() {
  const reduceMotion = useReducedMotion();

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-[11px] font-bold text-navy">Sprint 08 · Onboarding</p>
        <p className="font-mono text-[10px] text-slate-400 tabular-nums">
          Ngày 7/14 · 62%
        </p>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className="h-full origin-left rounded-full bg-blue-600"
          style={{ width: "62%" }}
          initial={reduceMotion ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.7, ease: "easeOut" }}
        />
      </div>

      <div className="mt-3.5 grid grid-cols-3 gap-2.5">
        <BoardColumn title="Todo" count={2} variant="todo" />
        <BoardColumn title="Doing" count={2} variant="doing" />
        <BoardColumn title="Done" count={5} variant="done" />
      </div>

      <Burndown />
    </div>
  );
}

/* 04 · Commit — hash verified + diffstat + file diff card kiểu GitHub */

type DiffLine = {
  old: number | null;
  new: number | null;
  sign: "+" | "-" | " ";
  code: string;
};

const GUARD_DIFF: DiffLine[] = [
  { old: 1, new: 1, sign: " ", code: "export async function guard(" },
  { old: null, new: 2, sign: "+", code: "  const session = await auth();" },
  { old: null, new: 3, sign: "+", code: "  if (!session) redirect('/login')" },
  { old: 2, new: 4, sign: " ", code: "  return next()" },
  { old: 4, new: null, sign: "-", code: "  return true" },
];

function DiffBlock() {
  return (
    <div className="overflow-hidden rounded-lg bg-white ring-1 ring-slate-200/70">
      <div className="flex items-center gap-1.5 border-b border-slate-200/70 bg-slate-50 px-2.5 py-1.5">
        <FileCode2
          className="h-3 w-3 shrink-0 text-slate-400"
          aria-hidden="true"
        />
        <span className="min-w-0 truncate font-mono text-[10px] leading-none text-slate-600">
          src/middleware.ts
        </span>
        <span className="ml-auto shrink-0 font-mono text-[10px] leading-none tabular-nums">
          <span className="text-emerald-600">+30</span>{" "}
          <span className="text-rose-500">−4</span>
        </span>
      </div>
      <div className="px-1.5 py-1.5 font-mono text-[10px] leading-relaxed">
        {GUARD_DIFF.map((line, index) => (
          <p
            key={index}
            className={
              line.sign === "+"
                ? "flex rounded-sm bg-emerald-50 text-emerald-700"
                : line.sign === "-"
                  ? "flex rounded-sm bg-rose-50 text-rose-600"
                  : "flex text-slate-500"
            }
          >
            <span className="w-6 shrink-0 pr-1.5 text-right text-[9px] text-slate-300 tabular-nums">
              {line.new ?? line.old}
            </span>
            <span className="min-w-0 truncate">
              {line.sign} {line.code}
            </span>
          </p>
        ))}
      </div>
    </div>
  );
}

function Commit() {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="shrink-0 rounded bg-navy px-1.5 py-0.5 font-mono text-[10px] leading-none text-white">
          a91f3c2
        </span>
        <span className="min-w-0 font-mono text-[11px] leading-tight text-slate-600">
          feat: guard protected routes
        </span>
        <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 ring-1 ring-emerald-200">
          <BadgeCheck
            className="h-3 w-3 text-emerald-600"
            aria-hidden="true"
          />
          <span className="text-[9px] font-medium leading-none text-emerald-700">
            Verified
          </span>
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-2">
        <div className="flex h-1.5 w-full max-w-[110px] min-w-[84px] overflow-hidden rounded-full">
          <span className="h-full bg-emerald-500" style={{ width: "90.5%" }} />
          <span className="h-full bg-rose-400" style={{ width: "9.5%" }} />
        </div>
        <p className="font-mono text-[10px] leading-none tabular-nums">
          <span className="font-semibold text-emerald-600">+38</span>{" "}
          <span className="font-semibold text-rose-500">−4</span>
        </p>
        <p className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium leading-none text-emerald-700">
          <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
          24/24 test pass
        </p>
      </div>

      <div className="mt-3">
        <DiffBlock />
      </div>
    </div>
  );
}

/* 05 · Pull request — nhánh + diff GitHub + CI checks + reviewer + merge */

const PR_CHECKS: [string, string][] = [
  ["Lint & typecheck", "1.2s"],
  ["Unit tests · 24/24", "8.4s"],
  ["Build production", "42s"],
];

function PullRequest() {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="shrink-0 rounded bg-blue-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold leading-none text-blue-700">
          #142
        </span>
        <span className="min-w-0 truncate text-[11px] font-semibold leading-none text-navy">
          guard protected routes
        </span>
      </div>

      <div className="mt-2.5 flex items-center gap-1.5 font-mono text-[10px] leading-none">
        <span className="rounded bg-slate-100 px-1.5 py-1 text-slate-600">
          feat/guard-routes
        </span>
        <ArrowRight
          className="h-3 w-3 shrink-0 text-slate-400"
          aria-hidden="true"
        />
        <span className="rounded bg-slate-100 px-1.5 py-1 text-slate-600">
          main
        </span>
      </div>

      <div className="mt-3">
        <DiffBlock />
      </div>

      <ul className="mt-3 space-y-1.5">
        {PR_CHECKS.map(([name, duration]) => (
          <li key={name} className="flex items-center gap-2">
            <CircleCheck
              className="h-3.5 w-3.5 shrink-0 text-emerald-600"
              aria-hidden="true"
            />
            <span className="min-w-0 truncate text-[11px] text-slate-600">
              {name}
            </span>
            <span className="ml-auto shrink-0 font-mono text-[10px] text-slate-400 tabular-nums">
              {duration}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 font-mono text-[10px] leading-none text-slate-400">
        3/3 checks passed
      </p>

      <div className="mt-3 flex items-center gap-2">
        <Image
          src="/images/avatar-dev-2.png"
          alt=""
          width={20}
          height={20}
          className="h-5 w-5 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
        />
        <span className="min-w-0 truncate text-[10px] text-slate-600">
          Mai Anh đã phê duyệt
        </span>
        <CircleCheck
          className="ml-auto h-3.5 w-3.5 shrink-0 text-emerald-600"
          aria-hidden="true"
        />
      </div>

      <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
        <GitMerge className="h-3.5 w-3.5" aria-hidden="true" />
        Đã merge vào main
      </p>
    </div>
  );
}

/* 06 · AI review report — radar chart 5 trục rubric */

const RUBRIC_AXES: [string, number][] = [
  ["Dễ đọc", 9],
  ["Kiểm thử", 7.5],
  ["Đặt tên", 8.5],
  ["Xử lý lỗi", 6],
  ["Tài liệu", 7],
];
const LABEL_DY = [-2, 3, 6, 6, 3];
/* Tick điểm số: offset bán kính riêng từng trục để không đè label (đỉnh 9.0 dùng offset nhỏ hơn) */
const TICK_DR = [7, 5, 9, 9, 7];

function ReviewReport() {
  const cx = 105;
  const cy = 100;
  const maxR = 50;
  const labelR = 62;

  const point = (index: number, value: number) => {
    const angle = ((-90 + index * 72) * Math.PI) / 180;
    const r = (value / 10) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };
  const polygon = (value: number) =>
    RUBRIC_AXES.map((_, index) => point(index, value))
      .map((p) => `${p.x},${p.y}`)
      .join(" ");

  const average =
    RUBRIC_AXES.reduce((sum, [, value]) => sum + value, 0) /
    RUBRIC_AXES.length;

  return (
    <div>
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 ring-1 ring-blue-100">
          <Image
            src="/images/robot-v2.png"
            alt=""
            width={22}
            height={26}
            className="h-[26px] w-auto object-contain"
          />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold leading-none text-navy">
            V-Intern AI Review
          </p>
          <p className="mt-1 font-mono text-[10px] leading-none text-slate-400">
            Rubric v3 · tự động 100%
          </p>
        </div>
        <span className="ml-auto shrink-0 rounded-full bg-blue-50 px-2 py-1 font-mono text-[10px] font-semibold text-blue-700 tabular-nums">
          TB {average.toFixed(1)}/10
        </span>
      </div>

      <svg viewBox="0 0 210 162" className="mt-2 w-full" aria-hidden="true">
        <polygon points={polygon(5)} fill="none" className="stroke-slate-100" />
        <polygon points={polygon(10)} fill="none" className="stroke-slate-200" />
        {RUBRIC_AXES.map((_, index) => {
          const vertex = point(index, 10);
          return (
            <line
              key={index}
              x1={cx}
              y1={cy}
              x2={vertex.x}
              y2={vertex.y}
              className="stroke-slate-100"
            />
          );
        })}

        <polygon
          points={RUBRIC_AXES.map(([, value], index) => point(index, value))
            .map((p) => `${p.x},${p.y}`)
            .join(" ")}
          fill="#2563EB"
          fillOpacity={0.1}
          className="stroke-blue-600"
          strokeWidth={1.5}
        />
        {RUBRIC_AXES.map(([, value], index) => {
          const p = point(index, value);
          return (
            <circle
              key={index}
              cx={p.x}
              cy={p.y}
              r={2.5}
              fill="#2563EB"
              stroke="white"
              strokeWidth={1.5}
            />
          );
        })}

        {RUBRIC_AXES.map(([, value], index) => {
          const angle = ((-90 + index * 72) * Math.PI) / 180;
          const r = (value / 10) * maxR + TICK_DR[index];
          return (
            <text
              key={index}
              x={cx + r * Math.cos(angle)}
              y={cy + r * Math.sin(angle)}
              textAnchor={index === 0 ? "middle" : index < 3 ? "start" : "end"}
              fontSize={9}
              className="fill-slate-400 font-mono tabular-nums"
            >
              {value.toFixed(1)}
            </text>
          );
        })}

        {RUBRIC_AXES.map(([label], index) => {
          const angle = ((-90 + index * 72) * Math.PI) / 180;
          return (
            <text
              key={label}
              x={cx + labelR * Math.cos(angle)}
              y={cy + labelR * Math.sin(angle)}
              dy={LABEL_DY[index]}
              textAnchor={index === 0 ? "middle" : index < 3 ? "start" : "end"}
              fontSize={10}
              className="fill-slate-500"
            >
              {label}
            </text>
          );
        })}
      </svg>

      <div className="mt-1 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
          <TrendingUp className="h-3 w-3" aria-hidden="true" />
          Dễ đọc 9.0
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-600">
          <TrendingDown className="h-3 w-3" aria-hidden="true" />
          Xử lý lỗi 6.0
        </span>
      </div>
    </div>
  );
}

/* 07 · Certificate — dấu sao vàng + QR xác minh */

const QR_DOTS: [number, number][] = [
  // finder trên trái
  [0, 0], [1, 0], [2, 0], [0, 1], [2, 1], [0, 2], [1, 2], [2, 2], [1, 1],
  // finder trên phải
  [6, 0], [7, 0], [8, 0], [6, 1], [8, 1], [6, 2], [7, 2], [8, 2], [7, 1],
  // finder dưới trái
  [0, 6], [1, 6], [2, 6], [0, 7], [2, 7], [0, 8], [1, 8], [2, 8], [1, 7],
  // dữ liệu
  [4, 1], [3, 3], [5, 3], [4, 4], [6, 4], [3, 5], [5, 5], [7, 4], [4, 6],
  [6, 6], [5, 7], [7, 6], [3, 7],
];

function QrMark() {
  return (
    <svg viewBox="0 0 9 9" className="h-9 w-9" aria-hidden="true">
      {QR_DOTS.map(([x, y]) => (
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width="1"
          height="1"
          rx="0.15"
          className="fill-navy"
        />
      ))}
    </svg>
  );
}

function Certificate() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50/80 via-white to-white p-4 ring-1 ring-slate-200">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-1.5 rounded-lg border border-dashed border-blue-200/80"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-9 -right-3 select-none font-handwriting text-[90px] leading-none text-blue-600/[0.04]"
      >
        V
      </span>

      <div className="relative pr-12">
        <p className="font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.25em] text-blue-600">
          V-Intern
        </p>
        <p className="mt-2 text-[13px] font-bold leading-tight text-navy">
          Certificate of Completion
        </p>
        <p className="mt-2.5 font-handwriting text-2xl leading-none text-blue-600">
          Nguyễn Văn A
        </p>
        <p className="mt-1.5 text-[10px] text-slate-500">
          Virtual Internship · Fullstack Track
        </p>
      </div>

      <div className="relative mt-3">
        <svg viewBox="0 0 64 20" className="h-5 w-16" aria-hidden="true">
          <path
            d="M2 15 C8 5 13 4 17 10 C21 16 25 4 31 6 C37 8 35 16 41 13 C47 10 52 7 62 9"
            fill="none"
            strokeLinecap="round"
            strokeWidth={1.5}
            className="stroke-slate-400"
          />
        </svg>
        <p className="mt-1 text-[9px] leading-none text-slate-400">
          Trưởng chương trình đào tạo
        </p>
      </div>

      <div className="relative mt-3 flex items-end justify-between border-t border-slate-200/80 pt-3">
        <div>
          <p className="font-mono text-[10px] leading-none text-slate-400">
            Mã xác minh
          </p>
          <p className="mt-1 font-mono text-[11px] font-semibold leading-none text-navy">
            VI-2026-0481
          </p>
        </div>
        <QrMark />
      </div>

      <span aria-hidden="true" className="absolute right-3 top-3 h-11 w-11">
        <span className="absolute -bottom-1.5 left-1 h-4 w-2.5 rotate-12 bg-amber-400 [clip-path:polygon(0_0,100%_0,100%_100%,50%_72%,0_100%)]" />
        <span className="absolute -bottom-1.5 right-1 h-4 w-2.5 -rotate-12 bg-amber-500 [clip-path:polygon(0_0,100%_0,100%_100%,50%_72%,0_100%)]" />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 shadow-sm ring-2 ring-white">
          <Star className="h-[18px] w-[18px] fill-white text-white" />
        </span>
      </span>
    </div>
  );
}

/* ---------- Data ---------- */

const STEPS: Step[] = [
  {
    icon: UserSearch,
    name: "Interview",
    summary: "Phỏng vấn bởi AI",
    phase: "Bắt đầu",
    range: "01–02",
    detail:
      "Bộ phỏng vấn AI hỏi về kiến thức nền và cách bạn xử lý tình huống thật. Bạn trả lời bằng tiếng Việt hoặc tiếng Anh, và nhận kết quả ngay sau đó.",
    does: [
      "Chọn lĩnh vực bạn muốn thực tập",
      "Trả lời câu hỏi phỏng vấn và câu hỏi tình huống",
    ],
    gets: "Điểm năng lực kèm nhận xét chi tiết từ AI",
    artifact: "scorecard",
    preview: <Scorecard />,
  },
  {
    icon: FolderOpen,
    name: "Project",
    summary: "Chọn dự án thật",
    phase: "Bắt đầu",
    range: "01–02",
    detail:
      "Chọn một dự án đang mở từ doanh nghiệp đối tác, đọc đặc tả và làm quen codebase trước khi viết dòng đầu tiên.",
    does: [
      "Duyệt danh sách dự án đang tuyển người",
      "Đọc đặc tả và tiêu chí nghiệm thu",
    ],
    gets: "Repository riêng cùng người hướng dẫn phía doanh nghiệp",
    artifact: "repository",
    preview: <Repository />,
  },
  {
    icon: CalendarDays,
    name: "Sprint",
    summary: "Làm việc theo nhịp",
    phase: "Thực chiến",
    range: "03–05",
    detail:
      "Công việc được chia thành sprint hai tuần. Bạn họp điểm danh, cập nhật tiến độ và trao đổi với các thành viên khác trong team.",
    does: [
      "Lập kế hoạch sprint cùng team",
      "Cập nhật tiến độ mỗi ngày làm việc",
    ],
    gets: "Bảng theo dõi sprint và KPI cá nhân",
    artifact: "sprint board",
    preview: <SprintBoard />,
  },
  {
    icon: Code2,
    name: "Task",
    summary: "Nhận và hoàn thành nhiệm vụ",
    phase: "Thực chiến",
    range: "03–05",
    detail:
      "Nhận task từ backlog, viết code, chạy test và mở pull request kèm mô tả rõ thay đổi.",
    does: ["Nhận task từ backlog và viết test", "Commit theo từng thay đổi nhỏ"],
    gets: "Pull request đã qua kiểm tra tự động",
    artifact: "commit",
    preview: <Commit />,
  },
  {
    icon: GitPullRequest,
    name: "PR",
    summary: "Gửi mã nguồn để review",
    phase: "Thực chiến",
    range: "03–05",
    detail:
      "Mã nguồn của bạn được review, thảo luận rồi merge vào nhánh chính. Mọi ý kiến đều nằm lại trong lịch sử pull request.",
    does: ["Trả lời comment của reviewer", "Sửa và push lại khi được yêu cầu"],
    gets: "Pull request đã merge vào nhánh chính",
    artifact: "pull request",
    preview: <PullRequest />,
  },
  {
    icon: Bot,
    name: "AI Review",
    summary: "Đánh giá theo rubric",
    phase: "Công nhận",
    range: "06–07",
    detail:
      "AI đọc từng dòng code theo rubric của dự án, chấm điểm và góp ý cụ thể kèm ví dụ sửa.",
    does: [
      "Đọc nhận xét và sửa code lần hai",
      "Đối chiếu điểm qua từng vòng review",
    ],
    gets: "Báo cáo đánh giá theo từng tiêu chí",
    artifact: "review report",
    preview: <ReviewReport />,
  },
  {
    icon: Award,
    name: "Certificate",
    summary: "Nhận chứng nhận",
    phase: "Công nhận",
    range: "06–07",
    detail:
      "Khi mọi nhiệm vụ đã merge và điểm đạt ngưỡng, bạn nhận chứng nhận ghi tên kèm mã xác minh công khai.",
    does: ["Hoàn thành các nhiệm vụ còn lại", "Xác nhận thông tin trong hồ sơ"],
    gets: "Chứng nhận có mã xác minh để chia sẻ",
    artifact: "certificate",
    preview: <Certificate />,
  },
];

const PHASES: { name: string; range: string; from: number; to: number }[] = [
  { name: "Bắt đầu", range: "01–02", from: 0, to: 1 },
  { name: "Thực chiến", range: "03–05", from: 2, to: 4 },
  { name: "Công nhận", range: "06–07", from: 5, to: 6 },
];

/* ---------- Detail ---------- */

function StepDetail({ step }: { step: Step }) {
  return (
    <div className="mt-5 border-t border-slate-200/80 pt-5">
      <p className="text-sm leading-relaxed text-slate-600">{step.detail}</p>

      <div className="mt-5 space-y-5">
        <div>
          <p className="text-xs font-bold text-navy">Bạn làm</p>
          <ul className="mt-2.5 space-y-2">
            {step.does.map((item) => (
              <li
                key={item}
                className="flex gap-2 text-xs leading-relaxed text-slate-600"
              >
                <Check
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600"
                  strokeWidth={3}
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-bold text-navy">Bạn nhận</p>
          <p className="mt-2.5 flex gap-2 text-xs leading-relaxed text-slate-600">
            <Check
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600"
              strokeWidth={3}
              aria-hidden="true"
            />
            {step.gets}
          </p>
        </div>
      </div>
    </div>
  );
}

function ArtifactPreview({ step }: { step: Step }) {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl bg-white p-5 ring-1 ring-slate-200"
    >
      <p className="font-mono text-[10px] uppercase leading-none tracking-[0.18em] text-slate-400">
        {step.artifact}
      </p>
      <div className="mt-3 h-px bg-slate-100" aria-hidden="true" />
      <div className="mt-3.5">{step.preview}</div>
    </div>
  );
}

/* ---------- Section ---------- */

export function Workflow() {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();
  const step = STEPS[active];

  return (
    <section
      id="workflow"
      className="bg-white py-20 scroll-mt-20"
      aria-label="Quy trình thực tập ảo"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <FadeIn>
          <SectionHeading
            title="Virtual Internship Workflow"
            subtitle="Bảy bước, từ lúc bạn bước vào phòng phỏng vấn đến ngày nhận chứng nhận."
          />
        </FadeIn>

        <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-16">
          <div className="relative">
            <span
              aria-hidden="true"
              className="absolute bottom-[30px] left-[22px] top-0 w-px bg-slate-200"
            />

            {PHASES.map((phase) => (
              <div key={phase.name}>
                <div className="flex items-baseline justify-between gap-4 py-3 pl-[60px] pr-1">
                  <h3 className="text-xs font-bold leading-none text-navy">
                    {phase.name}
                  </h3>
                  <p className="font-mono text-[11px] leading-none text-slate-400">
                    {phase.range}
                  </p>
                </div>

                <ol>
                  {STEPS.slice(phase.from, phase.to + 1).map((item, offset) => {
                    const index = phase.from + offset;
                    const isActive = index === active;
                    const isDone = index < active;

                    return (
                      <li key={item.name} className="relative">
                        <motion.button
                          type="button"
                          onClick={() => setActive(index)}
                          onMouseEnter={() => setActive(index)}
                          aria-current={isActive ? "step" : undefined}
                          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: "-40px" }}
                          transition={{
                            duration: reduceMotion ? 0 : 0.5,
                            delay: reduceMotion ? 0 : index * 0.06,
                            ease: [0.21, 0.47, 0.32, 0.98],
                          }}
                          className="group flex w-full items-center gap-4 rounded-2xl py-2 pr-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                        >
                          <span
                            className={
                              isActive
                                ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy text-white ring-4 ring-blue-50"
                                : isDone
                                  ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition-colors"
                                  : "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-slate-400 ring-1 ring-slate-200 transition-colors group-hover:text-blue-500 group-hover:ring-blue-300"
                            }
                          >
                            <item.icon
                              className="h-[18px] w-[18px]"
                              aria-hidden="true"
                            />
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline gap-2">
                              <span className="font-mono text-[11px] leading-none text-slate-400">
                                {String(index + 1).padStart(2, "0")}
                              </span>
                              <span
                                className={
                                  isActive
                                    ? "text-sm font-bold leading-none text-navy"
                                    : "text-sm font-bold leading-none text-slate-700"
                                }
                              >
                                {item.name}
                              </span>
                            </span>
                            <span
                              className={
                                isActive
                                  ? "mt-1.5 block text-xs leading-relaxed text-slate-600"
                                  : "mt-1.5 block text-xs leading-relaxed text-slate-400"
                              }
                            >
                              {item.summary}
                            </span>
                          </span>
                        </motion.button>

                        {isActive ? (
                          <div
                            className="pb-6 pl-[60px] lg:hidden"
                            aria-live="polite"
                          >
                            <StepDetail step={item} />
                            <div className="mt-5">
                              <ArtifactPreview step={item} />
                            </div>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-24 rounded-3xl bg-gradient-to-br from-[#F7FAFF] to-white p-7 ring-1 ring-slate-200/80">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step.name}
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.25,
                    ease: [0.21, 0.47, 0.32, 0.98],
                  }}
                  aria-live="polite"
                >
                  <div className="grid gap-8 sm:grid-cols-2">
                    <div>
                      <p className="font-mono text-[11px] leading-none text-slate-400">
                        {step.range}
                      </p>
                      <h3 className="mt-2 text-lg font-bold leading-tight text-navy">
                        {step.phase}
                      </h3>
                      <span className="mt-4 block h-px w-10 bg-blue-400" />
                      <h4 className="mt-5 text-base font-bold text-navy">
                        {step.name}
                      </h4>

                      <StepDetail step={step} />
                    </div>

                    <ArtifactPreview step={step} />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
