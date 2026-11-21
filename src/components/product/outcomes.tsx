"use client";
import { StudentOutcomeHeading } from "@/components/intern/student-outcome-heading";
import { StudentPerformance } from "@/components/intern/student-performance";
import { StudentScore } from "@/components/intern/student-score";
import {
  StudentBadge,
  StudentCallout,
  StudentLink,
  StudentPanel,
} from "@/components/intern/student-ui";
import type { IconComponent } from "@/components/v-intern/icons";
import {
  IconArrowLeft,
  IconArrowUpRight,
  IconAward,
  IconCheck,
  IconCircleCheck,
  IconClock,
  IconCompass,
  IconCopy,
  IconDownload,
  IconFileText,
  IconInfo,
  IconShieldCheck,
  IconTarget,
  IconWallet,
} from "@/components/v-intern/icons";
import { Sparkles as SparklesIcon } from "@/components/animate-ui/icons/sparkles";
import { BellRing as BellRingIcon } from "@/components/animate-ui/icons/bell-ring";
import { PartyPopper } from "@/components/animate-ui/icons/party-popper";
import { MarginNote, StampMoc } from "@/components/workspace/notebook";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useResource } from "@/lib/api/use-resource";
import { useToast } from "@/components/shared/toast";
import { ApiError } from "@/lib/auth/api-client";
import {
  getCertificate,
  getCertificatePdf,
  getCertificates,
  getEvaluation,
  getEvaluations,
  getKpi,
  getKpis,
  getLedger,
  getNotifications,
  notificationLinkForRole,
  getNotificationPreferences,
  setNotificationPreference,
  getPerformance,
  getRecommendations,
  getSalary,
  markAllNotifications,
  markNotification,
  refreshRecommendations,
  verifyCertificate,
} from "@/lib/api/outcomes";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { Tape } from "@/components/v-intern/doodles";
import { ChartFrame, EmptyNotebook } from "@/components/notebook/kit";
import { NotificationText } from "./notification-text";
import {
  buttonClass,
  Empty,
  Field,
  inputClass,
  PageTitle,
  Pager,
  Panel,
  StatusDot,
} from "./primitives";

const kpiMetricLabels: Record<string, string> = {
  delivery: "Tiến độ bàn giao",
  quality: "Chất lượng",
  timeliness: "Đúng hạn",
};

const recommendationMetricLabels: Record<string, string> = {
  taskCompletionRate: "Tỷ lệ hoàn thành nhiệm vụ",
  storyPointCompletionRate: "Tỷ lệ hoàn thành story points",
  onTimeCompletionRate: "Tỷ lệ hoàn thành đúng hạn",
  averageEvaluationScore: "Điểm đánh giá trung bình đã chốt",
  kpiFinalScore: "Điểm KPI đã chốt",
  overdueOpenTaskCount: "Số nhiệm vụ đang mở quá hạn",
  activeSprintProgress: "Tiến độ Sprint đang chạy",
  completedTaskCount: "Số nhiệm vụ đã hoàn thành",
  totalTaskCount: "Tổng số nhiệm vụ",
  completedStoryPoints: "Story points đã hoàn thành",
  committedStoryPoints: "Story points đã cam kết",
};

/** Icon Sparkles (animate-ui) dạng IconComponent cho StudentPanel. */
const SparklesPanelIcon: IconComponent = ({ size }) => (
  <SparklesIcon size={typeof size === "number" ? size : 24} aria-hidden="true" />
);

/** Icon chuông (animate-ui) dạng IconComponent cho OutcomeFrame. */
const BellPanelIcon: IconComponent = ({ size }) => (
  <BellRingIcon size={typeof size === "number" ? size : 24} aria-hidden="true" />
);

const ledgerMeta: Record<
  string,
  { label: string; tone: "green" | "blue" | "amber" | "rose" | "slate" }
> = {
  kpi_earning: { label: "Tích lũy KPI", tone: "green" },
  bonus: { label: "Thưởng", tone: "blue" },
  penalty: { label: "Khấu trừ", tone: "rose" },
  adjustment: { label: "Điều chỉnh", tone: "amber" },
  reversal: { label: "Hoàn tác", tone: "slate" },
};

/** Panel dùng chung: giữ giao diện cũ cho admin/giảng viên, dùng panel sinh viên
 * khi đang ở khu vực /intern. */
function OutcomeFrame({
  intern,
  title,
  icon,
  action,
  children,
}: {
  intern: boolean;
  title: ReactNode;
  icon?: IconComponent;
  action?: ReactNode;
  children: ReactNode;
}) {
  return intern ? (
    <StudentPanel title={title} icon={icon} action={action}>
      {children}
    </StudentPanel>
  ) : (
    <Panel title={title} action={action}>
      {children}
    </Panel>
  );
}

function Resource<T>({
  resource,
  children,
}: {
  resource: { loading: boolean; error?: unknown; data?: T; reload: () => void };
  children: (data: T) => ReactNode;
}) {
  return resource.loading ? (
    <LoadingState />
  ) : resource.error ? (
    <ErrorState error={resource.error} onRetry={resource.reload} />
  ) : resource.data !== undefined ? (
    children(resource.data)
  ) : null;
}
export function Metrics({ values }: { values: [string, number | null][] }) {
  return (
    <dl
      className={`workspace-metrics workspace-stat-strip grid gap-y-4 sm:grid-cols-2 nb-stagger ${values.length === 5 ? "xl:grid-cols-5" : "xl:grid-cols-4"}`}
    >
      {values.map(([name, value]) => (
        <div
          key={name}
          className="min-w-0 px-4 py-3"
        >
          <dt className="text-caption font-medium text-muted-foreground">
            {name}
          </dt>
          <dd
            className={`mt-3 text-page font-bold tracking-tight tabular-nums ${value === null ? "text-muted-foreground" : "text-foreground"}`}
          >
            {value === null ? "Chưa đo được" : value.toLocaleString("vi-VN")}
          </dd>
        </div>
      ))}
    </dl>
  );
}
/* ------------------------------------------------------------------ */
/* v3 — Radar tiêu chí & xu hướng KPI (SVG vẽ tay, không npm mới).      */
/* Cùng tinh thần hand-rolled của workspace-charts.tsx: lưới nét đứt,  */
/* nhãn viết tay, mọi con số là dữ liệu thật từ API.                   */
/* ------------------------------------------------------------------ */

/** Trục radar: tên tiêu chí + điểm gốc (score / maxScore thật từ API). */
type RadarDatum = { label: string; score: number; max: number };

/** Tách nhãn dài thành tối đa 2 dòng cân bằng — đủ tên tiêu chí, không cắt cụt. */
function wrap2(label: string): string[] {
  if (label.length <= 14) return [label];
  const words = label.split(" ");
  let best = 1;
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const diff = Math.abs(
      words.slice(0, i).join(" ").length -
        words.slice(i).join(" ").length,
    );
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

/** Màu thanh/đỉnh theo tỷ lệ đạt: ≥80% xanh · ≥65% vàng · đỏ. */
function ratioTone(pct: number): string {
  if (pct >= 80) return "var(--success)";
  if (pct >= 65) return "var(--warning)";
  return "var(--danger)";
}

/**
 * Bảng tiêu chí kỳ đánh giá dạng radar nét mực — dựng thủ công bằng SVG
 * (không thêm gói npm): lưới lục giác nét đứt, nhãn trục viết tay
 * (font-hand), mực loang theo tỷ lệ đạt score/maxScore. Bảng điểm gốc
 * trong <details> vẫn là "bảng dữ liệu" tiếp cận được; radar chỉ là hình
 * hoá của đúng các con số đó (role="img" + tóm tắt bằng văn bản).
 */
function CriteriaRadar({ scores }: { scores: RadarDatum[] }) {
  const n = scores.length;
  const width = 360,
    height = 300,
    cx = 180,
    cy = 150,
    r = 92;
  const angle = (i: number) => ((-90 + (360 / n) * i) * Math.PI) / 180;
  const point = (i: number, ratio: number): [number, number] => {
    const a = angle(i);
    return [cx + Math.cos(a) * r * ratio, cy + Math.sin(a) * r * ratio];
  };
  const data = scores.map((s) => ({
    ...s,
    pct: Math.max(0, Math.min(100, (s.score / s.max) * 100)),
  }));
  const ring = (ratio: number) =>
    scores
      .map((_, i) => {
        const [x, y] = point(i, ratio);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  const shape = data
    .map((d, i) => {
      const [x, y] = point(i, d.pct / 100);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const summary = `Biểu đồ radar tỷ lệ đạt theo tiêu chí (0 đến 100%): ${data
    .map((d) => `${d.label} ${Math.round(d.pct)}%`)
    .join(", ")}.`;
  return (
    <figure className="workspace-chart" aria-label={summary}>
      <figcaption>
        <IconCompass
          size={15}
          className="mr-1 inline-block align-[-2px]"
          aria-hidden="true"
        />
        Bảng tiêu chí dạng radar
        <span>
          Tỷ lệ đạt của từng tiêu chí (0–100%) — điểm gốc nằm trong bảng chi
          tiết
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={summary}
        fill="none"
        className="mx-auto mt-3 block w-full max-w-[420px]"
      >
        {/* Lưới lục giác nét đứt — 4 vòng 25/50/75/100%. */}
        {[0.25, 0.5, 0.75, 1].map((ratio) => (
          <polygon
            key={ratio}
            points={ring(ratio)}
            fill="none"
            stroke="color-mix(in srgb, var(--ink) 45%, transparent)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}
        {/* Trục từ tâm ra từng đỉnh tiêu chí. */}
        {scores.map((_, i) => {
          const [x, y] = point(i, 1);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="color-mix(in srgb, var(--ink) 45%, transparent)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          );
        })}
        {/* Vùng mực loang theo tỷ lệ đạt thật của từng tiêu chí. */}
        <polygon
          points={shape}
          fill="var(--primary)"
          fillOpacity="0.22"
          stroke="var(--primary)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {data.map((d, i) => {
          const [x, y] = point(i, d.pct / 100);
          return (
            <circle
              key={`${d.label}-${i}`}
              cx={x}
              cy={y}
              r="2.5"
              fill="var(--primary)"
              stroke="var(--ink)"
              strokeWidth="1"
            />
          );
        })}
        {/* Nhãn trục viết tay — 2 dòng cân bằng khi tên dài. */}
        {data.map((d, i) => {
          const a = angle(i);
          const lx = cx + Math.cos(a) * (r + 18);
          const ly = cy + Math.sin(a) * (r + 18);
          const lines = wrap2(d.label);
          const anchor =
            lx < cx - 50 ? "end" : lx > cx + 50 ? "start" : "middle";
          const dy = Math.sin(a) < -0.5 ? -8 : Math.sin(a) > 0.5 ? 16 : 4;
          return (
            <text
              key={`${d.label}-${i}`}
              x={lx.toFixed(1)}
              y={(ly + dy).toFixed(1)}
              textAnchor={anchor}
              fontSize="11.5"
              fill="var(--ink-soft)"
              className="font-hand"
            >
              {lines.map((l, k) => (
                <tspan key={l} x={lx.toFixed(1)} dy={k === 0 ? 0 : 12}>
                  {l}
                </tspan>
              ))}
            </text>
          );
        })}
      </svg>
    </figure>
  );
}

/** Điểm KPI mỗi lần tổng hợp — thời điểm và điểm số đều thật từ API. */
type KpiTrendPoint = { id: string; at: Date; score: number };

/** Ngưỡng đạt của chương trình — cùng hằng số semantics với tone hero
 * (finalScore >= 70 => xanh) đã có trong section Kpi. */
const KPI_PASS_THRESHOLD = 70;

/**
 * Xu hướng điểm KPI qua các lần tổng hợp — area chart vẽ tay bằng SVG:
 * đường mực primary + vùng loang gradient + ReferenceLine ngưỡng đạt 70
 * nét đỏ đứt. Chỉ dựng từ các bản ghi có finalScore thật; component gọi
 * chịu trách nhiệm chỉ render khi có >= 2 điểm (không bịa xu hướng từ
 * một thời điểm duy nhất).
 */
function KpiTrendChart({ points }: { points: KpiTrendPoint[] }) {
  const gradId = `kpi-trend-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  const width = 640,
    height = 220,
    pad = { top: 16, right: 18, bottom: 28, left: 40 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const n = points.length;
  if (n < 2) return null;
  const x = (i: number) => pad.left + (n > 1 ? (i / (n - 1)) * innerW : 0);
  const y = (v: number) =>
    pad.top + innerH - (Math.max(0, Math.min(100, v)) / 100) * innerH;
  const dayLabel = (d: Date) =>
    d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  const line = points
    .map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.score).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${x(n - 1).toFixed(1)},${y(0).toFixed(1)} L${x(0).toFixed(1)},${y(0).toFixed(1)} Z`;
  const last = points[n - 1];
  const labelEvery = Math.max(1, Math.ceil(n / 6));
  return (
    <figure
      className="workspace-chart"
      aria-label={`Xu hướng điểm KPI qua ${n} lần tổng hợp, ngưỡng đạt ${KPI_PASS_THRESHOLD}`}
    >
      <figcaption>
        Xu hướng qua các lần tổng hợp
        <span>
          Điểm tổng hợp xếp theo thời gian — đường đỏ là ngưỡng đạt{" "}
          {KPI_PASS_THRESHOLD}
        </span>
      </figcaption>
      <div className="mt-3" aria-hidden="true">
        <svg viewBox={`0 0 ${width} ${height}`} fill="none" role="presentation">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.04" />
            </linearGradient>
          </defs>
          {/* Lưới ngang mờ + nhãn trục viết tay (0/50/100). */}
          {[0, 50, 100].map((v) => (
            <g key={v}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={y(v)}
                y2={y(v)}
                stroke="color-mix(in srgb, var(--ink) 30%, transparent)"
                strokeWidth="1"
                strokeDasharray="4 5"
              />
              <text
                x={pad.left - 6}
                y={y(v) + 3.5}
                textAnchor="end"
                fontSize="10"
                fill="var(--ink-soft)"
                className="font-hand"
              >
                {v}
              </text>
            </g>
          ))}
          {/* Ngưỡng đạt 70 — nét đỏ đứt (tương đương ReferenceLine). */}
          <line
            x1={pad.left}
            x2={width - pad.right}
            y1={y(KPI_PASS_THRESHOLD)}
            y2={y(KPI_PASS_THRESHOLD)}
            stroke="var(--danger)"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          <text
            x={pad.left + 4}
            y={y(KPI_PASS_THRESHOLD) - 6}
            fontSize="10"
            fill="var(--danger)"
          >
            Ngưỡng đạt {KPI_PASS_THRESHOLD}
          </text>
          <path d={area} fill={`url(#${gradId})`} />
          <path
            d={line}
            stroke="var(--primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {points.map((p, i) => (
            <circle
              key={p.id}
              cx={x(i)}
              cy={y(p.score)}
              r="3.5"
              fill="var(--primary)"
              stroke="var(--ink)"
              strokeWidth="1"
            />
          ))}
          {points.map((p, i) =>
            i % labelEvery === 0 || i === n - 1 ? (
              <text
                key={p.id}
                x={x(i)}
                y={height - 8}
                textAnchor="middle"
                fontSize="11"
                fill="var(--ink-soft)"
                className="font-hand"
              >
                {dayLabel(p.at)}
              </text>
            ) : null,
          )}
        </svg>
      </div>
      <p
        className="workspace-chart-selection"
        aria-live="polite"
        aria-atomic="true"
      >
        {n} lần tổng hợp. Kỳ gần nhất ({dayLabel(last.at)}): {last.score} điểm
        —{" "}
        {last.score >= KPI_PASS_THRESHOLD
          ? "đạt"
          : "chưa đạt"}{" "}
        ngưỡng {KPI_PASS_THRESHOLD}.
      </p>
      <ul className="workspace-chart-legend mt-3">
        <li>
          <i data-tone="primary" aria-hidden="true" />
          <span>Điểm KPI</span>
          <strong>{last.score}</strong>
        </li>
        <li>
          <i
            aria-hidden="true"
            style={{ background: "var(--danger)" }}
          />
          <span>Ngưỡng đạt</span>
          <strong>{KPI_PASS_THRESHOLD}</strong>
        </li>
      </ul>
    </figure>
  );
}

export function Evaluations({ id }: { id?: string }) {
  const evaluations = useResource(
    useCallback(
      (signal: AbortSignal) =>
        id
          ? getEvaluation(id, signal).then((x) => [x])
          : getEvaluations(signal),
      [id],
    ),
  );
  return (
    <>
      <StudentOutcomeHeading
        title="Đánh giá của tôi"
        subtitle="Chỉ hiển thị kết quả đã được giảng viên chốt chính thức"
        action={
          id ? (
            <Link
              className="student-action student-action-secondary"
              href="/intern/evaluations"
            >
              <IconArrowLeft size={15} aria-hidden="true" />
              Tất cả đánh giá
            </Link>
          ) : undefined
        }
      />
      <Resource resource={evaluations}>
        {(data) =>
          data.length ? (
            <div className="student-stack student-record-collection">
              {data.map((e, index) => {
                /* v3: dữ liệu radar — chỉ lấy tiêu chí có thang điểm (maxScore)
                   để chuẩn hoá thành tỷ lệ đạt; thiếu thang thì bỏ khỏi radar
                   (bảng gốc vẫn giữ nguyên dòng đó, không bịa số). */
                const radarScores = e.scores
                  .map((s, i) => ({
                    label: s.criterionName ?? `Tiêu chí ${i + 1}`,
                    score: s.score,
                    max: s.maxScore ?? 0,
                  }))
                  .filter((s) => s.max > 0);
                return (
                <StudentPanel
                  key={e.id}
                  className="student-outcome-record"
                  icon={IconAward}
                  title="Đánh giá chính thức"
                  description={
                    e.finalizedAt
                      ? `Chốt lúc ${new Date(e.finalizedAt).toLocaleString("vi-VN")}`
                      : "Giảng viên đã gửi, chưa chốt"
                  }
                  action={
                    !id && (
                      <StudentLink
                        secondary
                        href={`/intern/evaluations/${e.id}`}
                      >
                        Chi tiết
                      </StudentLink>
                    )
                  }
                >
                  <div className="student-kpi-hero">
                    <StudentScore
                      value={e.overallScore}
                      label="Điểm chính thức"
                      tone="green"
                    />
                    <div>
                      <p className="text-caption font-bold  text-muted-foreground">
                        Nhận xét của giảng viên
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-small leading-8 text-muted-foreground">
                        {e.summary ?? "Chưa có nhận xét."}
                      </p>
                    </div>
                  </div>
                  <div className="student-eval-meta">
                    <StampMoc tone="blue" size="sm" thump>
                      Đã chốt
                    </StampMoc>
                    <span>Lần hiệu chỉnh: {e.revisionNumber}</span>
                    <time>
                      {e.finalizedAt &&
                        new Date(e.finalizedAt).toLocaleString("vi-VN")}
                    </time>
                  </div>

                  {/* v3: kỳ mới nhất có bảng radar tiêu chí — radar nét mực
                      dựng từ đúng điểm score/maxScore của API, đặt trong khung
                      ChartFrame như các biểu đồ workspace khác. */}
                  {index === 0 && radarScores.length >= 3 && (
                    <ChartFrame className="mt-5">
                      <CriteriaRadar scores={radarScores} />
                      <MarginNote className="mt-2">
                        mực loang càng rộng — kỹ năng càng đều
                      </MarginNote>
                    </ChartFrame>
                  )}

                  <details open={Boolean(id)} className="student-help-disclosure">
                    <summary>Tiêu chí & nhận xét chi tiết ({e.scores.length})</summary>
                  <div
                    className="student-table-wrap mt-4"
                    role="region"
                    aria-label="Bảng điểm đánh giá"
                    tabIndex={0}
                  >
                    <table className="student-table">
                      <thead>
                        <tr>
                          {["Tiêu chí", "Điểm", "Nhận xét"].map((x) => (
                            <th key={x}>{x}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {e.scores.map((s, index) => {
                          /* v3: thanh mực nhỏ dưới điểm — chỉ vẽ khi có thang
                              điểm (maxScore) để tính tỷ lệ đạt; rút mực từ 0
                              bằng nb-fill, màu theo tỷ lệ thật. */
                          const ratio =
                            s.maxScore !== null && s.maxScore > 0
                              ? Math.max(
                                  0,
                                  Math.min(100, (s.score / s.maxScore) * 100),
                                )
                              : null;
                          return (
                          <tr key={s.id}>
                            <td>
                              <span className="font-semibold text-foreground">
                                {s.criterionName ?? `Tiêu chí ${index + 1}`}
                              </span>
                              {s.weight !== null && <p className="mt-1 text-caption text-muted-foreground">Trọng số {s.weight}%</p>}
                              <details className="mt-1 text-caption text-muted-foreground">
                                <summary className="cursor-pointer">
                                  Mã tham chiếu
                                </summary>
                                <span className="student-code-inline break-all">
                                  {s.criterionId}
                                </span>
                              </details>
                            </td>
                            <td className="student-table-num font-semibold">
                              {s.score}{s.maxScore !== null ? ` / ${s.maxScore}` : ""}
                              {ratio !== null && (
                                <span
                                  className="mt-1.5 block h-1.5 overflow-hidden rounded-full border border-border/70 bg-muted"
                                  aria-hidden="true"
                                >
                                  <span
                                    className="nb-fill block h-full rounded-full"
                                    style={{
                                      width: `${ratio}%`,
                                      background: ratioTone(ratio),
                                    }}
                                  />
                                </span>
                              )}
                            </td>
                            <td>{s.comment ?? "Chưa có"}</td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  </details>
                </StudentPanel>
                );
              })}
            </div>
          ) : (
            <div className="student-outcome-empty-layout">
              <EmptyNotebook
                doodle={<IconAward size={42} aria-hidden="true" />}
                title="Chưa có đánh giá được chốt."
                description="Nhận xét và điểm chính thức sẽ xuất hiện sau khi giảng viên hoàn tất đánh giá."
                action={
                  <StudentLink secondary href="/intern/performance">
                    Xem tiến độ hiện tại
                  </StudentLink>
                }
              />
              <StudentPanel title="Đánh giá diễn ra thế nào?" icon={IconInfo}>
                <ol className="student-step-list">
                  <li>
                    <div>
                      <strong>Giảng viên tổng hợp</strong>
                      <p>
                        Công việc đã hoàn thành, bài nộp và phản hồi được đối
                        chiếu với tiêu chí của dự án.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div>
                      <strong>Điểm được chốt</strong>
                      <p>
                        Điểm và nhận xét chỉ hiển thị khi giảng viên xác nhận
                        chính thức, không dùng điểm tạm.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div>
                      <strong>Bạn xem lại bất cứ lúc nào</strong>
                      <p>
                        Kết quả đã chốt được giữ nguyên để bạn đối chiếu với KPI
                        và chứng nhận sau này.
                      </p>
                    </div>
                  </li>
                </ol>
              </StudentPanel>
            </div>
          )
        }
      </Resource>
    </>
  );
}
export function Performance() {
  const performance = useResource(
    useCallback((signal: AbortSignal) => getPerformance(signal), []),
  );
  return (
    <>
      <StudentOutcomeHeading
        title="Hiệu suất của tôi"
        subtitle="Chỉ số được tính từ nhiệm vụ và đánh giá chính thức"
      />
      <Resource resource={performance}>
        {(m) => <StudentPerformance data={m} />}
      </Resource>
    </>
  );
}
export function Kpi({ id }: { id?: string }) {
  const results = useResource(
    useCallback(
      (signal: AbortSignal) =>
        id ? getKpi(id, signal).then((x) => [x]) : getKpis(signal),
      [id],
    ),
  );
  return (
    <>
      <StudentOutcomeHeading
        title={id ? "Nguồn tính KPI" : "KPI & Lương ảo"}
        subtitle={
          id
            ? "Cách điểm KPI của kết quả này được tính từ dữ liệu thật"
            : "Điểm KPI có nguồn tính rõ ràng, Lương ảo phục vụ chương trình thực tập"
        }
        action={
          id ? (
            <Link
              className="student-action student-action-secondary"
              href="/intern/kpi"
            >
              <IconArrowLeft size={15} aria-hidden="true" />
              Quay lại danh sách
            </Link>
          ) : undefined
        }
      />
      <Resource resource={results}>
        {(data) => {
          /* v3: chuỗi xu hướng — chỉ từ các bản ghi có finalScore thật,
             xếp theo calculatedAt (cũ → mới). Payload KPI không có nhãn
             kỳ/period nên KHÔNG dựng bộ chip chọn kỳ (sẽ là bịa ngữ cảnh);
             mỗi bản ghi đã hiển thị đầy đủ trong danh sách phía trên. */
          const trend: KpiTrendPoint[] = [];
          for (const k of data) {
            if (
              typeof k.finalScore === "number" &&
              Number.isFinite(k.finalScore)
            )
              trend.push({
                id: k.id,
                at: new Date(k.calculatedAt),
                score: k.finalScore,
              });
          }
          trend.sort((a, b) => a.at.getTime() - b.at.getTime());
          return data.length ? (
            <>
              <div className="student-stack student-record-collection">
                {data.map((k) => (
                <StudentPanel
                  key={k.id}
                  className="student-outcome-record"
                  title="Kết quả KPI"
                  icon={IconTarget}
                  description={`Quy tắc ${k.ruleVersion}, cập nhật ${new Date(k.calculatedAt).toLocaleString("vi-VN")}`}
                  action={
                    !id && (
                      <StudentLink secondary href={`/intern/kpi/${k.id}`}>
                        Nguồn tính
                      </StudentLink>
                    )
                  }
                >
                  <div className="student-kpi-hero">
                    <StudentScore
                      value={k.finalScore}
                      label="Điểm KPI"
                      tone={
                        k.finalScore !== null && k.finalScore >= 70
                          ? "green"
                          : "blue"
                      }
                    />
                    <div className="min-w-0">
                      <p className="text-small leading-7 text-muted-foreground">
                        {k.finalScore === null
                          ? "Chưa đủ dữ liệu để tính điểm. Các chỉ số còn thiếu được giữ nguyên, không tự quy về 0."
                          : "Điểm được tính theo quy tắc của chương trình. Mở nguồn tính để xem các chỉ số và trọng số đóng góp."}
                      </p>
                      {k.finalScore !== null && (
                        <div className="mt-3">
                          <StampMoc tone="blue" size="sm" thump>
                            Đã tổng hợp
                          </StampMoc>
                        </div>
                      )}
                    </div>
                  </div>
                  {"metrics" in k && Array.isArray(k.metrics) && (
                    <div className="student-kpi-metrics nb-stagger">
                      {k.metrics.map((m) => (
                        <div key={m.metricCode} className="student-kpi-row">
                          <div className="student-kpi-name">
                            <strong>
                              {kpiMetricLabels[m.metricCode] ?? m.metricCode}
                            </strong>
                            <span>{m.metricCode}</span>
                          </div>
                          <div>
                            <span>Giá trị</span>
                            <strong>{m.sourceValue ?? "Chưa đo"}</strong>
                          </div>
                          <div>
                            <span>Trọng số</span>
                            <strong>
                              {m.effectiveWeight === null
                                ? "Chưa có"
                                : `${m.effectiveWeight}%`}
                            </strong>
                          </div>
                          <div>
                            <span>Đóng góp</span>
                            <strong>
                              {m.weightedContribution ?? "Chưa có"}
                            </strong>
                          </div>
                          <details className="student-kpi-source">
                            <summary>Nguồn dữ liệu</summary>
                            <pre>{m.sourceJson}</pre>
                          </details>
                        </div>
                      ))}
                    </div>
                  )}
                </StudentPanel>
              ))}
              </div>
              {/* v3: biểu đồ xu hướng điểm KPI — chỉ vẽ khi có >= 2 lần tổng
                  hợp có điểm (một điểm không tạo ra xu hướng); đường đỏ đứt
                  là ngưỡng đạt 70 cùng semantics với tone hero. */}
              {!id && trend.length >= 2 && (
                <ChartFrame className="mt-6">
                  <KpiTrendChart points={trend} />
                </ChartFrame>
              )}
            </>
          ) : (
            <div className="student-dashboard-grid student-outcome-empty-grid">
              <EmptyNotebook
                doodle={
                  <SparklesIcon size={36} animateOnView aria-hidden="true" />
                }
                title="Chưa có kết quả KPI"
                description="Khi có đủ dữ liệu và kết quả được tính, bạn sẽ xem được điểm, trọng số và nguồn tính tại đây."
                action={
                  <StudentLink secondary href="/intern/performance">
                    Xem hiệu suất hiện tại
                  </StudentLink>
                }
              />
              <StudentPanel title="KPI được tổng hợp thế nào?" icon={IconInfo}>
                <ol className="student-step-list">
                  <li>
                    <div>
                      <strong>Nhiệm vụ được xác nhận</strong>
                      <p>
                        Công việc hoàn thành và được giảng viên duyệt là nguồn
                        dữ liệu đầu vào.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div>
                      <strong>Đánh giá được chốt</strong>
                      <p>
                        Điểm chính thức được khóa theo từng kỳ, không thay đổi
                        khi xem lại.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div>
                      <strong>KPI tổng hợp theo trọng số</strong>
                      <p>
                        Ba chỉ số tiến độ, chất lượng và đúng hạn được tính theo
                        quy tắc công khai.
                      </p>
                    </div>
                  </li>
                </ol>
              </StudentPanel>
            </div>
          )
        }}
      </Resource>
      <div className="student-salary-section">
        <Salary />
      </div>
    </>
  );
}
export function Salary() {
  const balance = useResource(
    useCallback((signal: AbortSignal) => getSalary(signal), []),
  );
  const [page, setPage] = useState(1);
  const ledger = useResource(
    useCallback((signal: AbortSignal) => getLedger(page, signal), [page]),
  );
  return (
    <div className="student-stack">
      <StudentPanel
        title="Lương ảo"
        icon={IconWallet}
        description="Đơn vị ảo, không phải tiền lương thực tế. Chỉ dùng trong chương trình thực tập."
      >
        <Resource resource={balance}>
          {(b) => (
            <div className="student-balance-grid">
              <div className="student-balance-card" data-tone="blue">
                <span>Số dư từ sổ giao dịch</span>
                <strong>
                  {b.balance.toLocaleString("vi-VN")}
                  <small>{b.unit === "VND_VIRTUAL" ? "đồng ảo" : b.unit}</small>
                </strong>
                <p>Tổng tích lũy từ các giao dịch đã được ghi nhận.</p>
              </div>
              <div className="student-balance-card" data-tone="green">
                <span>Tích lũy từ KPI</span>
                <strong>
                  {b.earnedThisPeriod.toLocaleString("vi-VN")}
                  <small>{b.unit === "VND_VIRTUAL" ? "đồng ảo" : b.unit}</small>
                </strong>
                <p>Phần thưởng ghi nhận trong kỳ hiện tại.</p>
              </div>
            </div>
          )}
        </Resource>
      </StudentPanel>
      <StudentPanel
        className="student-ledger"
        title="Sổ giao dịch"
        icon={IconClock}
        description="Mọi thay đổi số dư đều có nguồn và thời điểm rõ ràng."
        action={
          ledger.data ? (
            <span className="flex flex-wrap items-center gap-2">
              <span className="student-badge" data-tone="slate">
                {ledger.data.total} giao dịch
              </span>
              <StampMoc tone="blue" size="sm" thump>
                Đã đối chiếu
              </StampMoc>
            </span>
          ) : undefined
        }
      >
        <Resource resource={ledger}>
          {(data) => (
            <>
              {data.items.length ? (
                <div
                  className="student-table-wrap"
                  role="region"
                  aria-label="Sổ giao dịch lương ảo"
                  tabIndex={0}
                >
                  <table className="student-table">
                    <thead>
                      <tr>
                        {["Thời gian", "Loại", "Số tiền ảo", "Nội dung"].map(
                          (x, i) => (
                            <th key={x} className={i === 2 ? "student-table-num" : undefined}>
                              {x}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((l) => {
                        const meta = ledgerMeta[l.type] ?? {
                          label: l.type,
                          tone: "slate" as const,
                        };
                        return (
                          <tr key={l.id}>
                            <td className="whitespace-nowrap tabular-nums">
                              {new Date(l.createdAt).toLocaleString("vi-VN")}
                            </td>
                            <td>
                              <StudentBadge tone={meta.tone}>
                                {meta.label}
                              </StudentBadge>
                            </td>
                            <td className="workspace-ledger-amount student-table-num whitespace-nowrap font-semibold" data-negative={l.amount < 0 ? "true" : undefined}>
                              {l.amount > 0 ? "+" : ""}{l.amount.toLocaleString("vi-VN")}{" "}
                              <span className="text-caption font-normal text-muted-foreground">
                                {l.unit === "VND_VIRTUAL" ? "đồng ảo" : l.unit}
                              </span>
                            </td>
                            <td>{l.description}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty
                  icon={IconWallet}
                  title="Chưa có giao dịch lương ảo"
                  description="Khi KPI được chốt hoặc có điều chỉnh, giao dịch sẽ xuất hiện tại đây kèm nguồn và thời điểm."
                />
              )}
              {data.totalPages > 1 && <Pager {...data} onChange={setPage} />}
            </>
          )}
        </Resource>
      </StudentPanel>
    </div>
  );
}
export function Certificates({ id }: { id?: string }) {
  const certificates = useResource(
    useCallback(
      (signal: AbortSignal) =>
        id
          ? getCertificate(id, signal).then((x) => [x])
          : getCertificates(signal),
      [id],
    ),
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(),
    [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(timer);
  }, [copied]);
  async function copyVerificationCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setError(undefined);
      setCopied(true);
    } catch {
      setError(
        new Error(
          "Không thể sao chép mã xác minh. Hãy chọn mã và sao chép thủ công.",
        ),
      );
    }
  }
  async function download(certificateId: string, number: string) {
    setBusy(true);
    setError(undefined);
    try {
      const blob = await getCertificatePdf(certificateId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${number}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <StudentOutcomeHeading
        title={id ? "Chi tiết chứng nhận" : "Chứng nhận"}
        subtitle={
          id
            ? "Thông tin xác minh và bản PDF chính thức của chứng nhận"
            : "Chứng nhận được cấp sau khi đáp ứng chính sách chương trình"
        }
        action={
          id ? (
            <Link
              className="student-action student-action-secondary"
              href="/intern/certificates"
            >
              <IconArrowLeft size={15} aria-hidden="true" />
              Quay lại danh sách
            </Link>
          ) : undefined
        }
      />
      {Boolean(error) && <ErrorState error={error} />}
      <Resource resource={certificates}>
        {(data) =>
          data.length ? (
            id ? (
              <CertificateDetail
                certificate={data[0]}
                busy={busy}
                copied={copied}
                onDownload={() =>
                  void download(data[0].id, data[0].certificateNumber)
                }
                onCopy={() =>
                  void copyVerificationCode(data[0].verificationCode)
                }
              />
            ) : (
              <div className="student-cert-grid">
                {data.map((c) => (
                  <article key={c.id} className="student-cert-card">
                    <div className="student-cert-head">
                      <span className="student-cert-seal" aria-hidden="true">
                        <IconAward size={24} />
                      </span>
                      <div className="min-w-0">
                        <h2>{c.certificateNumber}</h2>
                        <p>
                          {[c.projectName, c.sessionName]
                            .filter(Boolean)
                            .join(", ") || "Chứng nhận thực tập V-Intern"}
                        </p>
                      </div>
                      <StudentBadge
                        tone={c.status === "issued" ? "green" : "rose"}
                      >
                        {c.status === "issued" ? "Đã cấp" : "Đã thu hồi"}
                      </StudentBadge>
                    </div>
                    <dl className="student-cert-meta">
                      <div>
                        <dt>Ngày cấp</dt>
                        <dd>
                          {new Date(c.issuedAt).toLocaleDateString("vi-VN")}
                        </dd>
                      </div>
                      <div>
                        <dt>Hoàn thành</dt>
                        <dd>
                          {c.completedAt
                            ? new Date(c.completedAt).toLocaleDateString(
                                "vi-VN",
                              )
                            : "Chưa ghi nhận"}
                        </dd>
                      </div>
                      <div>
                        <dt>Chính sách</dt>
                        <dd>
                          {c.policyCode}, v{c.policyVersion}
                        </dd>
                      </div>
                    </dl>
                    {c.status === "revoked" && (
                      <div role="status" className="mt-3">
                        <StudentCallout
                          tone="rose"
                          title="Chứng nhận đã bị thu hồi"
                        >
                          {c.revokedAt &&
                            new Date(c.revokedAt).toLocaleDateString("vi-VN")}
                          {c.revokedAt ? ", " : ""}
                          {c.revokeReason}
                        </StudentCallout>
                      </div>
                    )}
                    <div className="student-cert-actions">
                      <button
                        className="student-action student-action-sm"
                        disabled={busy || c.status !== "issued"}
                        onClick={() => void download(c.id, c.certificateNumber)}
                      >
                        <IconDownload size={15} aria-hidden="true" />
                        {busy ? "Đang tải…" : "Tải PDF"}
                      </button>
                      {!id && (
                        <Link
                          className="student-action student-action-secondary student-action-sm"
                          href={`/intern/certificates/${c.id}`}
                        >
                          Chi tiết
                        </Link>
                      )}
                      <Link
                        className="student-link ml-auto"
                        href={`/verify?code=${encodeURIComponent(c.verificationCode)}`}
                      >
                        <IconShieldCheck size={15} aria-hidden="true" />
                        Xác minh công khai
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )
          ) : (
            <div className="student-outcome-empty-layout">
              <EmptyNotebook
                doodle={<IconAward size={48} aria-hidden="true" />}
                title="Chưa có chứng nhận được cấp."
                description="Chứng nhận được cấp theo chính sách chương trình sau khi kết quả thực tập được xác nhận."
                action={
                  <StudentLink secondary href="/intern/evaluations">
                    Xem đánh giá của tôi
                  </StudentLink>
                }
              />
              <StudentPanel title="Điều kiện cấp chứng nhận" icon={IconShieldCheck}>
                <ol className="student-step-list">
                  <li>
                    <div>
                      <strong>Hoàn thành chương trình</strong>
                      <p>
                        Các nhiệm vụ và kỳ đánh giá của bạn được giảng viên xác
                        nhận hoàn tất.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div>
                      <strong>Đáp ứng chính sách</strong>
                      <p>
                        Kết quả thực tập đạt điều kiện tối thiểu theo chính sách
                        chương trình đang áp dụng.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div>
                      <strong>Nhận chứng nhận</strong>
                      <p>
                        Chứng nhận có mã xác minh và bản PDF; bạn có thể gửi
                        link xác minh cho nhà tuyển dụng.
                      </p>
                    </div>
                  </li>
                </ol>
              </StudentPanel>
            </div>
          )
        }
      </Resource>
    </>
  );
}
type Certificate = Awaited<ReturnType<typeof getCertificate>>;
function CertificateDetail({
  certificate: c,
  busy,
  copied,
  onDownload,
  onCopy,
}: {
  certificate: Certificate;
  busy: boolean;
  copied: boolean;
  onDownload: () => void;
  onCopy: () => void;
}) {
  const issued = c.status === "issued";
  const issuedAt = new Date(c.issuedAt).toLocaleDateString("vi-VN");
  const completedAt = c.completedAt
    ? new Date(c.completedAt).toLocaleDateString("vi-VN")
    : "Chưa ghi nhận";
  return (
    <div className="student-cert-detail">
      {issued && (
        <p className="inline-flex items-center gap-2 font-semibold text-success">
          <PartyPopper size={20} animateOnView aria-hidden="true" />
          Chúc mừng! Bạn đã hoàn thành chương trình thực tập.
        </p>
      )}
      <article
        className="student-cert-document"
        aria-labelledby="certificate-title"
      >
        <div className="student-cert-document-head">
          <span className="student-cert-document-seal" aria-hidden="true">
            <IconAward size={30} />
          </span>
          <div>
            <p className="student-cert-document-brand">
              V-INTERN, LEARN, BUILD, BELONG
            </p>
            <p className="student-cert-document-type">
              Chứng nhận hoàn thành thực tập
            </p>
          </div>
        </div>
        {issued && (
          <StampMoc tone="red" thump rotate={7} className="student-cert-stamp">
            Đã cấp
          </StampMoc>
        )}
        <h2 id="certificate-title">
          {c.projectName ?? "Chương trình thực tập V-Intern"}
        </h2>
        {c.sessionName && (
          <p className="student-cert-document-session">{c.sessionName}</p>
        )}
        <dl className="student-cert-document-meta">
          <div>
            <dt>Số chứng nhận</dt>
            <dd>{c.certificateNumber}</dd>
          </div>
          <div>
            <dt>Ngày cấp</dt>
            <dd>{issuedAt}</dd>
          </div>
          <div>
            <dt>Hoàn thành</dt>
            <dd>{completedAt}</dd>
          </div>
        </dl>
        <p className="student-cert-document-note">
          Chứng nhận được cấp theo chính sách {c.policyCode}, phiên bản{" "}
          {c.policyVersion}. Mã xác minh công khai ở cột bên cạnh giúp đơn vị
          tuyển dụng kiểm tra tính hợp lệ của chứng nhận.
        </p>
      </article>

      <aside className="student-cert-detail-side">
        {/* Official file panel first: the download is the page's primary
            action, so it must not sit below a long verification list. */}
        <StudentPanel title="Tệp chính thức" icon={IconFileText}>
          <p className="text-caption leading-6 text-muted-foreground">
            Bản PDF có cùng thông tin với chứng nhận trực tuyến và có thể lưu
            trữ hoặc chia sẻ.
          </p>
          <div className="student-cert-detail-actions">
            <button
              type="button"
              className="student-action"
              disabled={busy || !issued}
              onClick={onDownload}
            >
              <IconDownload size={15} aria-hidden="true" />
              {busy ? "Đang tải…" : "Tải PDF"}
            </button>
            <Link
              className="student-action student-action-secondary"
              href={`/verify?code=${encodeURIComponent(c.verificationCode)}`}
            >
              <IconShieldCheck size={15} aria-hidden="true" />
              Xác minh công khai
            </Link>
          </div>
        </StudentPanel>

        <StudentPanel title="Thông tin xác minh" icon={IconShieldCheck}>
          <dl className="student-cert-detail-list">
            <div>
              <dt>Trạng thái</dt>
              <dd>
                <StudentBadge tone={issued ? "green" : "rose"}>
                  {issued ? "Đã cấp" : "Đã thu hồi"}
                </StudentBadge>
              </dd>
            </div>
            <div>
              <dt>Dự án</dt>
              <dd>{c.projectName ?? "Chưa ghi nhận"}</dd>
            </div>
            <div>
              <dt>Phiên thực tập</dt>
              <dd>{c.sessionName ?? "Chưa ghi nhận"}</dd>
            </div>
            <div>
              <dt>Chính sách</dt>
              <dd>
                {c.policyCode}, v{c.policyVersion}
              </dd>
            </div>
          </dl>
          <div className="student-cert-code">
            <span>Mã xác minh công khai</span>
            <code>{c.verificationCode}</code>
            <button
              type="button"
              className="student-action student-action-secondary student-action-sm"
              onClick={onCopy}
            >
              {copied ? (
                <IconCheck size={14} aria-hidden="true" />
              ) : (
                <IconCopy size={14} aria-hidden="true" />
              )}
              {copied ? "Đã sao chép" : "Sao chép mã"}
            </button>
          </div>
          <p className="sr-only" role="status">
            {copied ? "Đã sao chép mã xác minh" : ""}
          </p>
          {c.status === "revoked" && (
            <div className="mt-4">
              <StudentCallout tone="rose" title="Chứng nhận đã bị thu hồi">
                {c.revokedAt
                  ? `${new Date(c.revokedAt).toLocaleDateString("vi-VN")}, `
                  : ""}
                {c.revokeReason ?? "Không có lý do được ghi nhận."}
              </StudentCallout>
            </div>
          )}
        </StudentPanel>
      </aside>
    </div>
  );
}
export function Verify({ initialCode = "" }: { initialCode?: string }) {
  const [code, setCode] = useState(initialCode),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(),
    [result, setResult] =
      useState<Awaited<ReturnType<typeof verifyCertificate>>>();
  async function verify() {
    setBusy(true);
    setError(undefined);
    setResult(undefined);
    try {
      setResult(await verifyCertificate(code.trim()));
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="app-surface min-h-dvh bg-grid-paper">
    <main className="mx-auto max-w-2xl px-5 py-10 sm:pt-16">
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded text-body font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2"
      >
        V-Intern
      </Link>
      <div className="mt-8">
        <PageTitle
          eyebrow="CHỨNG NHẬN"
          stamp="XÁC MINH"
          title="Xác minh chứng nhận"
          subtitle="Nhập mã xác minh in trên chứng nhận để kiểm tra hiệu lực — kết quả đọc trực tiếp từ hệ thống."
        />
      </div>
      <Panel title="Tra cứu theo mã" className="sketch-card relative p-6">
        <Tape className="-top-3 right-8" rotate={-4} />
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void verify();
          }}
        >
          <Field
            label="Mã xác minh"
            htmlFor="verify-code"
            required
            hint="Tối đa 128 ký tự; mã nằm ở góc chứng nhận hoặc trong email cấp chứng nhận."
          >
            <input
              id="verify-code"
              required
              maxLength={128}
              value={code}
              placeholder="Dán mã xác minh"
              onChange={(e) => setCode(e.target.value)}
              className={inputClass}
            />
          </Field>
          <button disabled={busy || !code.trim()} className={buttonClass}>
            {busy ? "Đang xác minh…" : "Xác minh"}
          </button>
        </form>
      </Panel>
      {Boolean(error) && (
        <div className="mt-4">
          <ErrorState title="Không thể xác minh" error={error} />
        </div>
      )}
      {result && (
        <div className="mt-4">
          {result.valid ? (
            <Panel title="Chứng nhận hợp lệ" className="sketch-card p-6">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <StatusDot tone="green">Còn hiệu lực</StatusDot>
                <StampMoc tone="blue" thump>HỢP LỆ</StampMoc>
              </div>
              <dl className="grid gap-x-8 text-body sm:grid-cols-2">
                <div className="border-b border-border py-4">
                  <dt className="text-caption text-muted-foreground">Số chứng nhận</dt>
                  <dd className="mt-1 font-semibold text-foreground">
                    {result.certificateNumber}
                  </dd>
                </div>
                <div className="border-b border-border py-4">
                  <dt className="text-caption text-muted-foreground">Người nhận</dt>
                  <dd className="mt-1 font-semibold text-foreground">
                    {result.holderName ?? "Chưa có"}
                  </dd>
                </div>
                <div className="border-b border-border py-4">
                  <dt className="text-caption text-muted-foreground">Vai trò</dt>
                  <dd className="mt-1 text-foreground">{result.role ?? "Chưa có"}</dd>
                </div>
                <div className="border-b border-border py-4">
                  <dt className="text-caption text-muted-foreground">Dự án</dt>
                  <dd className="mt-1 text-foreground">
                    {result.projectName ?? "Chưa có"}
                  </dd>
                </div>
                <div className="border-b border-border py-4">
                  <dt className="text-caption text-muted-foreground">Phiên thực tập</dt>
                  <dd className="mt-1 text-foreground">
                    {result.sessionName ?? "Chưa ghi nhận"}
                  </dd>
                </div>
                <div className="border-b border-border py-4">
                  <dt className="text-caption text-muted-foreground">Ngày hoàn thành</dt>
                  <dd className="mt-1 text-foreground">
                    {result.completedAt
                      ? new Date(result.completedAt).toLocaleDateString("vi-VN")
                      : "Chưa ghi nhận"}
                  </dd>
                </div>
              </dl>
            </Panel>
          ) : (
            <Panel title="Chứng nhận đã thu hồi" className="sketch-card p-6">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <StatusDot tone="red">Không còn hiệu lực</StatusDot>
                <StampMoc tone="red" thump>THU HỒI</StampMoc>
              </div>
              <p role="status" className="text-body leading-6 text-destructive">
                Chứng nhận không còn hiệu lực. Ngày thu hồi:{" "}
                {result.revokedAt
                  ? new Date(result.revokedAt).toLocaleDateString("vi-VN")
                  : "Chưa có"}
              </p>
              <p className="mt-2 text-body text-muted-foreground">
                Số chứng nhận: {result.certificateNumber}
              </p>
            </Panel>
          )}
        </div>
      )}
    </main>
    </div>
  );
}
export function Notifications() {
  const role = usePathname().split("/")[1];
  const intern = role === "intern";
  /* v7: phản hồi thao tác chuyển sang toast tạm thời (Section 8) — người dùng
     bấm xong có thể cuộn tiếp mà vẫn thấy xác nhận ở góc màn hình. */
  const toast = useToast();
  /** Toast xác nhận thao tác gần nhất — thao tác mới dismiss để không còn
      success cũ treo lơ lửng khi lượt sau thất bại (giữ đúng ngữ nghĩa test). */
  const feedbackId = useRef<number>(0);
  const [preferencePending, setPreferencePending] = useState<{
    category: string;
    enabled: boolean;
  }>();
  const [page, setPage] = useState(1),
    [unread, setUnread] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>();
  const notifications = useResource(
    useCallback(
      (signal: AbortSignal) => getNotifications(page, unread, signal),
      [page, unread],
    ),
  );
  const preferences = useResource(
    useCallback(
      (signal: AbortSignal) => getNotificationPreferences(signal),
      [],
    ),
  );
  const preferenceLabels = {
    system: "Hệ thống",
    task: "Nhiệm vụ",
    session: "Phiên thực tập",
    evaluation: "Đánh giá",
    announcement: "Thông báo chung",
    recruitment: "Tuyển dụng",
    kpi: "KPI",
    salary: "Lương ảo",
    certificate: "Chứng nhận",
  };
  async function read(id?: string) {
    setBusy(true);
    setError(undefined);
    if (feedbackId.current) toast.dismiss(feedbackId.current);
    try {
      if (id) {
        await markNotification(id);
        feedbackId.current = toast.success({ title: 'Đã đánh dấu thông báo là đã đọc.' });
      } else {
        const updated = await markAllNotifications();
        feedbackId.current = toast.success(
          updated
            ? { title: `Đã đánh dấu ${updated.toLocaleString('vi-VN')} thông báo là đã đọc.` }
            : { title: 'Không có thông báo chưa đọc cần cập nhật.' },
        );
      }
      notifications.reload();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <StudentOutcomeHeading
        title="Thông báo"
        subtitle="Cập nhật mới nhất từ phiên thực tập, nhiệm vụ, đánh giá và hệ thống"
        action={
          <button
            disabled={busy}
            className={intern ? "student-action" : buttonClass}
            onClick={() => void read()}
          >
            {intern && <IconCircleCheck size={16} aria-hidden="true" />}
            {busy && !preferencePending ? 'Đang cập nhật…' : 'Đánh dấu tất cả đã đọc'}
          </button>
        }
      />
      {role === "instructor" && (
        <MarginNote className="mb-4 max-w-md">
          bật lọc “chỉ hiện chưa đọc” để xử lý thông báo gọn hơn ✎
        </MarginNote>
      )}
      <label
        className={
          intern
            ? "student-filter-chip mb-4"
            : "mb-4 inline-flex cursor-pointer select-none items-center gap-3 rounded-panel border border-border bg-card px-4 py-2 text-body font-medium text-muted-foreground shadow-app-xs transition-colors hover:border-border focus-within:ring-2 focus-within:ring-ring"
        }
      >
        <input
          type="checkbox"
          className="size-4 accent-primary"
          checked={unread}
          onChange={(e) => {
            setUnread(e.target.checked);
            setPage(1);
          }}
        />
        Chỉ hiện chưa đọc
      </label>
      {Boolean(error) && <ErrorState error={error} />}
      <div
        className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_280px]"
      >
        <OutcomeFrame
          intern={intern}
          icon={BellPanelIcon}
          title={
            <span className="flex items-center gap-2">
              Thông báo của bạn
              {notifications.data && (
                <span className="student-board-count">
                  {notifications.data.total}
                </span>
              )}
            </span>
          }
        >
          <Resource resource={notifications}>
            {(data) => (
              <>
                {data.items.length ? (
                  <div className="workspace-notification-feed nb-stagger">
                    {data.items
                      .map((n) => ({
                        ...n,
                        linkUrl: notificationLinkForRole(n.linkUrl, role),
                      }))
                      .map((n, index) => (
                        <div key={n.id}>
                        {(index === 0 || new Date(data.items[index - 1].createdAt).toLocaleDateString("vi-VN") !== new Date(n.createdAt).toLocaleDateString("vi-VN")) && <p className="workspace-notification-day"><time dateTime={n.createdAt}>{new Date(n.createdAt).toLocaleDateString("vi-VN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</time></p>}
                        <article
                          className={
                            intern
                              ? "student-notification"
                              : "workspace-notification"
                          }
                          data-unread={n.readAt ? undefined : "true"}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <h3
                              className={
                                intern
                                  ? "student-notification-title"
                                  : "font-semibold text-foreground"
                              }
                            >
                              {n.title}
                            </h3>
                            {!n.readAt && intern && (
                              <StudentBadge tone="blue">Chưa đọc</StudentBadge>
                            )}
                            {!n.readAt && !intern && (
                              /* Neutral tone: the unread article already tints
                                 bg-accent, and an accent chip on accent fails
                                 AA in dark mode (axe color-contrast). */
                              <StatusDot tone="gray">Chưa đọc</StatusDot>
                            )}
                          </div>
                          <NotificationText
                            body={n.body}
                            className={
                              intern
                                ? "student-notification-body"
                                : "mt-2 whitespace-pre-wrap text-body leading-6 text-muted-foreground"
                            }
                          />
                          <div
                            className={
                              intern
                                ? "student-notification-foot"
                                : "mt-3 flex flex-wrap items-center justify-between gap-3"
                            }
                          >
                            <time
                              className={
                                intern
                                  ? "student-notification-time"
                                  : "text-caption text-muted-foreground font-mono tabular-nums"
                              }
                              dateTime={n.createdAt}
                            >
                              {new Date(n.createdAt).toLocaleString("vi-VN")}
                            </time>
                            <div className="flex flex-wrap items-center gap-2">
                              {n.linkUrl && (
                                <Link
                                  href={n.linkUrl}
                                  className={
                                    intern
                                      ? "student-action student-action-secondary student-action-sm"
                                      : "rounded text-body font-medium text-primary transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1"
                                  }
                                >
                                  Mở nội dung
                                  {intern && (
                                    <IconArrowUpRight
                                      size={14}
                                      aria-hidden="true"
                                    />
                                  )}
                                </Link>
                              )}
                              {!n.readAt ? (
                                <button
                                  disabled={busy}
                                  aria-label={`Đánh dấu đã đọc: ${n.title}`}
                                  onClick={() => void read(n.id)}
                                  className={
                                    intern
                                      ? "student-action student-action-ghost student-action-sm"
                                      : "rounded text-body font-medium text-primary transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 disabled:opacity-50"
                                  }
                                >
                                  Đánh dấu đã đọc
                                </button>
                              ) : <span className="notebook-notification-read"><IconCircleCheck size={13} aria-hidden="true" />Đã đọc</span>}
                            </div>
                          </div>
                        </article>
                        </div>
                      ))}
                  </div>
                ) : intern ? (
                  <Empty
                    icon={BellPanelIcon}
                    title="Chưa có thông báo phù hợp"
                    description={
                      unread
                        ? "Bạn đã đọc hết thông báo. Bỏ lọc để xem lại toàn bộ."
                        : "Cập nhật từ phiên thực tập, nhiệm vụ và đánh giá sẽ xuất hiện tại đây."
                    }
                  />
                ) : (
                  <Empty
                    title="Chưa có thông báo phù hợp"
                    description={
                      unread
                        ? "Bạn đã đọc hết thông báo. Bỏ lọc để xem lại toàn bộ."
                        : "Cập nhật từ phiên thực tập, nhiệm vụ và đánh giá sẽ xuất hiện tại đây."
                    }
                  />
                )}
                {data.totalPages > 1 && <Pager {...data} onChange={setPage} />}
              </>
            )}
          </Resource>
        </OutcomeFrame>
        <div>
          <OutcomeFrame
            intern={intern}
            icon={BellPanelIcon}
            title="Tùy chọn nhận thông báo"
          >
            {role === "intern" && (
              <p className="mb-4 text-caption leading-6 text-muted-foreground">
                Chọn những cập nhật bạn muốn nhận. Thay đổi sẽ được lưu khi bạn
                bật hoặc tắt từng mục.
              </p>
            )}
            <Resource resource={preferences}>
              {(data) => (
                <div
                  className="grid gap-x-6 sm:grid-cols-2 xl:grid-cols-1 nb-stagger"
                >
                  {data.map((p) => (
                    <label
                      key={p.category}
                      className={
                        intern
                          ? "student-pref-row notebook-pref-row"
                          : "notebook-pref-row"
                      }
                    >
                      <input
                        type="checkbox"
                        className="size-4 accent-primary"
                        checked={
                          preferencePending?.category === p.category
                            ? preferencePending.enabled
                            : p.enabled
                        }
                        disabled={busy}
                        onChange={async (e) => {
                          const enabled = e.target.checked;
                          setPreferencePending({
                            category: p.category,
                            enabled,
                          });
                          setBusy(true);
                          setError(undefined);
                          try {
                            await setNotificationPreference(
                              p.category,
                              enabled,
                            );
                            toast.success({
                              title: `Đã ${enabled ? 'bật' : 'tắt'} thông báo ${preferenceLabels[p.category].toLowerCase()}.`,
                            });
                            preferences.reload();
                          } catch (e) {
                            setError(e);
                          } finally {
                            setBusy(false);
                            setPreferencePending(undefined);
                          }
                        }}
                      />
                      {preferenceLabels[p.category]}
                    </label>
                  ))}
                </div>
              )}
            </Resource>
          </OutcomeFrame>
        </div>
      </div>
    </>
  );
}
export function Recommendations() {
  const recommendations = useResource(
    useCallback((signal: AbortSignal) => getRecommendations(signal), []),
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>();
  async function refresh() {
    setBusy(true);
    setError(undefined);
    try {
      await refreshRecommendations();
      recommendations.reload();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <StudentOutcomeHeading
        title="Khuyến nghị phát triển"
        subtitle="Gợi ý AI từ các chỉ số thực tế, không thay đổi đánh giá/KPI"
        action={
          <button
            className="student-action"
            disabled={busy}
            onClick={() => void refresh()}
          >
            <SparklesIcon
              size={16}
              animation="blink"
              animate={busy}
              loop
              aria-hidden="true"
            />
            {busy ? "Đang cập nhật…" : "Cập nhật khuyến nghị"}
          </button>
        }
      />
      {Boolean(error) && <ErrorState error={error} />}
      {recommendations.error instanceof ApiError &&
      recommendations.error.statusCode === 404 ? (
        <div className="student-dashboard-grid">
          <EmptyNotebook
            doodle={
              <SparklesIcon
                size={42}
                animateOnView
                className="text-primary"
                aria-hidden="true"
              />
            }
            title="Một kế hoạch phát triển dành cho bạn"
            description="Chưa có khuyến nghị. Cập nhật để yêu cầu AI phân tích dữ liệu hiện tại: kết quả công việc, điểm đã chốt và các chỉ số hiệu suất."
            action={
              <StudentLink secondary href="/intern/performance">
                Xem hiệu suất của tôi
              </StudentLink>
            }
          />
          <StudentPanel title="Dữ liệu được dùng" icon={IconInfo}>
            <ol className="student-step-list">
              <li>
                <div>
                  <strong>Kết quả công việc</strong>
                  <p>
                    Nhiệm vụ đã hoàn thành và được giảng viên xác nhận trong
                    phiên thực tập.
                  </p>
                </div>
              </li>
              <li>
                <div>
                  <strong>Điểm đánh giá đã chốt</strong>
                  <p>
                    Chỉ điểm chính thức được khóa theo kỳ, không dùng điểm tạm
                    hoặc dữ liệu nháp.
                  </p>
                </div>
              </li>
              <li>
                <div>
                  <strong>Chỉ số hiệu suất</strong>
                  <p>
                    Tiến độ, chất lượng và đúng hạn được tổng hợp từ dữ liệu
                    thật của bạn.
                  </p>
                </div>
              </li>
            </ol>
            <p className="mt-4 text-caption leading-6 text-muted-foreground">
              Khuyến nghị chỉ giúp định hướng học tập, không thay đổi điểm số
              hay KPI.
            </p>
          </StudentPanel>
        </div>
      ) : (
        <Resource resource={recommendations}>
          {(data) => (
            <div className="student-stack">
              <StudentPanel
                title="Tổng hợp AI"
                icon={SparklesPanelIcon}
                className="student-panel-accent"
                description={`Tạo lúc ${new Date(data.createdAt).toLocaleString("vi-VN")}`}
              >
                <p className="text-small leading-8 text-muted-foreground">
                  {data.summary}
                </p>
                <MarginNote className="mt-3">
                  gợi ý của AI — chỉ để tham khảo, giảng viên mới là người chốt
                  đánh giá chính thức
                </MarginNote>
              </StudentPanel>
              {data.recommendations.map((r, i) => (
                <StudentPanel
                  key={i}
                  className="student-recommendation-record"
                  title={r.title}
                  icon={IconTarget}
                  action={
                    <StudentBadge
                      tone={
                        r.priority === "high"
                          ? "rose"
                          : r.priority === "medium"
                            ? "amber"
                            : "slate"
                      }
                    >
                      {{
                        high: "Ưu tiên cao",
                        medium: "Ưu tiên vừa",
                        low: "Ưu tiên thấp",
                      }[r.priority] ?? r.priority}
                    </StudentBadge>
                  }
                >
                  <p className="text-small leading-7 text-muted-foreground">
                    {r.reason}
                  </p>
                  <ol className="student-step-list mt-4">
                    {r.actions.map((a) => (
                      <li key={a}>
                        <div>
                          <p>{a}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-4 border-t border-border pt-3 text-caption text-muted-foreground">
                    Chỉ số tham chiếu:{" "}
                    {r.evidenceMetricCodes
                      .map((code) => recommendationMetricLabels[code] ?? code)
                      .join(", ")}
                  </p>
                </StudentPanel>
              ))}
            </div>
          )}
        </Resource>
      )}
    </>
  );
}
export { Profile } from "./profile";
