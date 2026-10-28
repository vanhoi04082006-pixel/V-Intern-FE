"use client";

import * as React from "react";
import {
  BarChart3,
  ClipboardCheck,
  FilePlus2,
  Flag,
  GitPullRequest,
  Presentation,
  Rocket,
  ScanSearch,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { ToneBadge } from "@/components/shared/primitives";
import { sessionApi, type ReportKind } from "@/lib/client/api";

/* ============ Difficulty ============ */

export const difficultyLabels: Record<string, string> = {
  beginner: "Sơ cấp",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
};

const difficultyTones: Record<string, "teal" | "amber" | "rose"> = {
  beginner: "teal",
  intermediate: "amber",
  advanced: "rose",
};

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  return (
    <ToneBadge tone={difficultyTones[difficulty] ?? "zinc"}>
      {difficultyLabels[difficulty] ?? difficulty}
    </ToneBadge>
  );
}

/* ============ Chu kỳ đánh giá ============ */

export const cycleStatusLabels: Record<string, string> = {
  draft: "Bản nháp",
  open: "Đang mở",
  closed: "Đã đóng",
  archived: "Lưu trữ",
};

const cycleStatusTones: Record<string, "zinc" | "emerald" | "amber"> = {
  draft: "zinc",
  open: "emerald",
  closed: "amber",
  archived: "zinc",
};

export function CycleStatusBadge({ status }: { status: string }) {
  return (
    <ToneBadge tone={cycleStatusTones[status] ?? "zinc"} dot>
      {cycleStatusLabels[status] ?? status}
    </ToneBadge>
  );
}

/** Flow chuyển trạng thái chu kỳ: draft → open → closed → archived. */
export const cycleNextStatus: Record<string, string | null> = {
  draft: "open",
  open: "closed",
  closed: "archived",
  archived: null,
};

/* ============ Trạng thái sprint ============ */

export const sprintStatusLabels: Record<string, string> = {
  todo: "Chưa bắt đầu",
  active: "Đang diễn ra",
  review: "Đang duyệt",
  done: "Hoàn tất",
};

const sprintStatusTones: Record<string, "zinc" | "teal" | "amber" | "emerald"> = {
  todo: "zinc",
  active: "teal",
  review: "amber",
  done: "emerald",
};

export function SprintStatusBadge({ status }: { status: string }) {
  return (
    <ToneBadge tone={sprintStatusTones[status] ?? "zinc"} dot>
      {sprintStatusLabels[status] ?? status}
    </ToneBadge>
  );
}

/* ============ Loại báo cáo ============ */

export const reportKindMeta: Record<
  ReportKind,
  { label: string; icon: LucideIcon; tone: "teal" | "emerald" | "amber" | "brand" | "rose" }
> = {
  progress: { label: "Tiến độ", icon: BarChart3, tone: "teal" },
  performance: { label: "Hiệu suất", icon: TrendingUp, tone: "emerald" },
  evaluation: { label: "Đánh giá", icon: ClipboardCheck, tone: "amber" },
  review: { label: "Duyệt bài", icon: ScanSearch, tone: "brand" },
  risk: { label: "Rủi ro", icon: ShieldAlert, tone: "rose" },
};

export const reportKinds: ReportKind[] = ["progress", "performance", "evaluation", "review", "risk"];

export function ReportKindBadge({ kind }: { kind: ReportKind }) {
  const meta = reportKindMeta[kind] ?? reportKindMeta.progress;
  const Icon = meta.icon;
  return (
    <ToneBadge tone={meta.tone}>
      <Icon className="size-3 icon" /> {meta.label}
    </ToneBadge>
  );
}

/* ============ Icon timeline theo action ============ */

const timelineIcons: Record<string, LucideIcon> = {
  session_created: Presentation,
  member_joined: UserPlus,
  member_removed: UserPlus,
  plan_published: Sparkles,
  plan_generated: Sparkles,
  sprint_started: Rocket,
  sprint_completed: Flag,
  submission_submitted: GitPullRequest,
  submission_approved: ClipboardCheck,
  submission_rework: GitPullRequest,
  submission_reviewed: ClipboardCheck,
  evaluation_finalized: ClipboardCheck,
  evaluation_submitted: ClipboardCheck,
  task_created: FilePlus2,
  report_created: BarChart3,
};

export function TimelineActionIcon({ action }: { action: string }) {
  const Icon = timelineIcons[action] ?? Sparkles;
  const tone =
    action.includes("rework") || action.includes("risk")
      ? "bg-rose/10 text-rose"
      : action.startsWith("submission") || action.startsWith("evaluation")
        ? "bg-brand/10 text-brand-bright"
        : action.startsWith("sprint")
          ? "bg-teal/10 text-teal"
          : "bg-panel-2 text-dim";
  return (
    <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${tone}`}>
      <Icon className="size-4 icon" />
    </span>
  );
}

/* ============ Rubric code review ============ */

export const rubricLabels: Record<string, string> = {
  functional: "Chức năng",
  quality: "Chất lượng code",
  testing: "Kiểm thử",
  errors: "Xử lý lỗi",
  security: "Bảo mật",
  dod: "Đạt DoD",
};

export const rubricKeys = ["functional", "quality", "testing", "errors", "security", "dod"] as const;
export type RubricKey = (typeof rubricKeys)[number];

/* ============ Vòng điểm số (SVG ring) ============ */

export function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = clamped >= 80 ? "var(--emerald)" : clamped >= 60 ? "var(--teal)" : clamped >= 40 ? "var(--amber)" : "var(--rose)";
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * clamped) / 100}
          style={{ transition: "stroke-dashoffset .7s cubic-bezier(.21,1.02,.73,1)" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-mono text-lg font-bold leading-none text-ink">{Math.round(clamped)}</div>
        <div className="text-[9px] font-medium uppercase tracking-wide text-faint">/100</div>
      </div>
    </div>
  );
}

/* ============ Hooks ============ */

/** Debounce giá trị (dùng cho ô tìm kiếm). */
export function useDebounced<T>(value: T, ms = 350): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/**
 * Tìm projectId (và sessionId) sở hữu sprint — dùng khi board trống và
 * người dùng muốn tạo task đầu tiên cho sprint.
 */
export async function resolveSprintContext(
  sprintId: string
): Promise<{ projectId: string; sessionId: string } | null> {
  try {
    const overview = await sessionApi.overview({ page: 1, pageSize: 50 });
    for (const s of overview.data) {
      try {
        const detail = await sessionApi.detail(s.id);
        if (detail.sprints.some((sp) => sp.id === sprintId)) {
          if (detail.project) return { projectId: detail.project.id, sessionId: detail.id };
        }
      } catch {
        /* bỏ qua session lỗi */
      }
    }
  } catch {
    /* bỏ qua */
  }
  return null;
}
