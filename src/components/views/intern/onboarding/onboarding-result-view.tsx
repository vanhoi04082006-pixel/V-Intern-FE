"use client";

import * as React from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  Check,
  LayoutDashboard,
  MessageSquareQuote,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { navigate } from "@/lib/client/router";
import {
  recruitmentApi,
  type InterviewResult,
  type RecruitmentMe,
} from "@/lib/client/api";
import { useResource } from "@/lib/client/use-resource";
import { formatDate, formatDateTime, roleLabels } from "@/lib/client/labels";
import {
  AnimatedProgressBar,
  Empty,
  MetricCard,
  PageHeader,
  Panel,
  PanelHeader,
  ToneBadge,
  ViewFrame,
} from "@/components/shared/primitives";
import { LoadingBlock } from "@/components/shared/states";
import { RoleBadge } from "@/components/shared/badges";
import { AnimatedNumber } from "@/components/shared/counters";
import { Button } from "@/components/ui/button";
import { OnboardingStepper } from "./stepper";

/** Màu theo ngưỡng điểm: ≥80 brand · ≥60 teal · ≥40 amber · còn lại rose. */
function scoreTone(score: number): "brand" | "teal" | "amber" | "rose" {
  if (score >= 80) return "brand";
  if (score >= 60) return "teal";
  if (score >= 40) return "amber";
  return "rose";
}

const TONE_STROKE: Record<string, string> = {
  brand: "var(--brand-bright)",
  teal: "var(--teal)",
  amber: "var(--amber)",
  rose: "var(--rose)",
};

/** Vòng điểm tổng (SVG ring) vẽ dần khi mount. */
function ScoreRing({ score, passed }: { score: number; passed: boolean }) {
  const R = 62;
  const C = 2 * Math.PI * R;
  const [drawn, setDrawn] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 80);
    return () => clearTimeout(t);
  }, []);
  const tone = passed ? "brand" : scoreTone(score);
  return (
    <div className="relative grid size-40 shrink-0 place-items-center">
      <svg viewBox="0 0 160 160" className="size-40 -rotate-90">
        <circle cx="80" cy="80" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="11" />
        <circle
          cx="80"
          cy="80"
          r={R}
          fill="none"
          stroke={TONE_STROKE[tone]}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={drawn ? C * (1 - Math.max(0, Math.min(100, score)) / 100) : C}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.21,1.02,0.73,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-mono text-[34px] font-bold leading-none text-ink">
            <AnimatedNumber value={score} />
          </div>
          <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-dim">
            / 100 điểm
          </div>
        </div>
      </div>
    </div>
  );
}

function ListColumn({
  title,
  items,
  tone,
  emptyText,
}: {
  title: string;
  items: string[];
  tone: "emerald" | "amber";
  emptyText: string;
}) {
  const HeaderIcon = tone === "emerald" ? Check : ArrowUpRight;
  return (
    <Panel>
      <PanelHeader
        title={title}
        icon={<HeaderIcon className="size-4 icon" />}
      />
      <div className="p-5">
        {items.length > 0 ? (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span
                  className={
                    tone === "emerald"
                      ? "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-emerald-300"
                      : "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-amber/10 text-amber"
                  }
                >
                  <HeaderIcon className="size-3 icon" />
                </span>
                <span className="text-sm leading-relaxed text-ink">{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-faint">{emptyText}</p>
        )}
      </div>
    </Panel>
  );
}

function ResultBody({
  result,
  profile,
}: {
  result: InterviewResult;
  profile: RecruitmentMe | null;
}) {
  const passed = result.decision === "passed";
  const canRetry =
    !passed && !!profile && profile.attemptsRemaining > 0;
  const eligibleAt = profile?.nextEligibleAt ? new Date(profile.nextEligibleAt).getTime() : 0;
  const eligibleNow = eligibleAt <= Date.now();

  return (
    <div className="space-y-5">
      {/* Hero kết quả */}
      <Panel className="noise relative overflow-hidden rounded-3xl">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
        <div
          className={
            passed
              ? "pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/[0.14] via-transparent to-transparent"
              : "pointer-events-none absolute inset-0 bg-gradient-to-br from-rose/[0.10] via-transparent to-transparent"
          }
        />
        <div className="relative flex flex-col items-center gap-5 px-6 py-10 text-center sm:flex-row sm:items-center sm:gap-8 sm:p-10 sm:text-left">
          <span
            className={
              passed
                ? "grid size-16 shrink-0 place-items-center rounded-3xl border border-brand/30 bg-brand/12 text-brand-bright glow-brand"
                : "grid size-16 shrink-0 place-items-center rounded-3xl border border-rose/30 bg-rose/10 text-rose"
            }
          >
            {passed ? <BadgeCheck className="size-8 icon" /> : <XCircle className="size-8 icon" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <ToneBadge tone={passed ? "brand" : "rose"} dot>
                {passed ? "TRÚNG TUYỂN" : "CHƯA ĐẠT"}
              </ToneBadge>
              <RoleBadge role={result.roleCode} />
              {result.recommendedRole && result.recommendedRole !== result.roleCode ? (
                <ToneBadge tone="teal">Đề xuất: {roleLabels[result.recommendedRole]}</ToneBadge>
              ) : null}
            </div>
            <h2 className="mt-3 text-xl font-bold tracking-tight text-ink sm:text-2xl">
              {passed ? "Chúc mừng, bạn đã trúng tuyển!" : "Chưa đạt lần này"}
            </h2>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-dim">
              {passed
                ? "Hồ sơ của bạn đã đủ điều kiện vào kỳ thực tập. Giảng viên sẽ sớm phân bạn vào một dự án phù hợp với vai trò vừa phỏng vấn."
                : `Tổng điểm ${result.overallScore}/100 chưa đạt chuẩn đầu vào (60 điểm). Xem nhận xét bên dưới để ôn tập đúng trọng tâm, rồi thử lại lần sau.`}
            </p>
            <p className="mt-2 text-[11px] text-faint">
              Vai trò {roleLabels[result.roleCode] ?? result.roleCode} · Chấm xong{" "}
              {formatDateTime(result.evaluatedAt)}
            </p>
          </div>
          <ScoreRing score={result.overallScore} passed={passed} />
        </div>
      </Panel>

      {/* 3 thẻ điểm */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Kỹ thuật"
          value={<AnimatedNumber value={result.technicalScore} />}
          hint="Câu hỏi kỹ thuật của vai trò"
          tone="teal"
          icon={<Check className="size-4 icon" />}
        />
        <MetricCard
          label="Kỹ năng mềm"
          value={<AnimatedNumber value={result.softSkillScore} />}
          hint="Giới thiệu & giao tiếp"
          tone="amber"
          icon={<MessageSquareQuote className="size-4 icon" />}
        />
        <MetricCard
          label="Tổng điểm"
          value={<AnimatedNumber value={result.overallScore} />}
          hint="50% kỹ thuật · 30% mềm · 20% tiếng Anh"
          tone={passed ? "brand" : "rose"}
          icon={<BadgeCheck className="size-4 icon" />}
        />
      </div>

      {/* Tiêu chí chấm */}
      <Panel>
        <PanelHeader
          title="Chi tiết từng tiêu chí"
          description="Điểm theo thang 100 — màu thể hiện ngưỡng: brand ≥80, teal ≥60, amber ≥40, rose dưới 40."
        />
        <div className="divide-y divide-line">
          {result.criteria.map((c) => (
            <div key={c.code} className="px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <span className="min-w-0 truncate text-sm font-medium text-ink">{c.label}</span>
                <span className="font-mono text-sm font-bold text-ink">{c.score}/100</span>
              </div>
              <AnimatedProgressBar
                value={c.score}
                tone={scoreTone(c.score)}
                className="mt-2"
              />
              {c.feedback ? (
                <p className="mt-2 text-xs leading-relaxed text-dim">{c.feedback}</p>
              ) : null}
            </div>
          ))}
        </div>
      </Panel>

      {/* Mạnh / yếu */}
      <div className="grid gap-4 md:grid-cols-2">
        <ListColumn
          title="Điểm mạnh"
          items={result.strengths}
          tone="emerald"
          emptyText="Chưa có điểm mạnh nổi bật được ghi nhận lần này."
        />
        <ListColumn
          title="Cần cải thiện"
          items={result.weaknesses}
          tone="amber"
          emptyText="Không có điểm nào cần cải thiện lớn — tuyệt vời!"
        />
      </div>

      {/* Feedback tổng */}
      <Panel>
        <PanelHeader
          icon={<MessageSquareQuote className="size-4 icon" />}
          title="Nhận xét tổng quan của AI"
          description="Gợi ý mang tính tham khảo — đề xuất từ hệ thống."
        />
        <p className="p-5 text-sm leading-relaxed text-ink">{result.feedback}</p>
      </Panel>

      {/* CTA theo kết quả */}
      <Panel className="flex flex-col items-center justify-between gap-4 px-5 py-4 sm:flex-row">
        {passed ? (
          <>
            <p className="text-xs text-dim">
              Bước tiếp theo: chờ giảng viên phân dự án — bạn sẽ nhận thông báo khi có phiên thực
              tập phù hợp.
            </p>
            <Button
              className="w-full shrink-0 rounded-lg bg-brand px-5 text-on-brand hover:bg-brand-bright active:scale-[0.98] sm:w-auto"
              onClick={() => navigate("/intern")}
            >
              <LayoutDashboard className="size-4 icon" /> Về tổng quan
            </Button>
          </>
        ) : canRetry ? (
          <>
            <p className="text-xs text-dim">
              Còn <span className="font-semibold text-ink">{profile?.attemptsRemaining}</span> lần
              thi lại
              {profile?.nextEligibleAt
                ? ` · Đủ điều kiện thi lại từ ${formatDateTime(profile.nextEligibleAt)}`
                : ""}
              .
            </p>
            <Button
              className="w-full shrink-0 rounded-lg bg-brand px-5 text-on-brand hover:bg-brand-bright active:scale-[0.98] sm:w-auto"
              disabled={!eligibleNow}
              onClick={() => navigate("/intern/onboarding/role")}
            >
              <RotateCcw className="size-4 icon" />
              {eligibleNow ? "Thi lại ngay bây giờ" : "Chưa đủ điều kiện thi lại"}
            </Button>
          </>
        ) : (
          <>
            <p className="text-xs text-dim">
              Bạn đã dùng hết lượt phỏng vấn cho phép. Hãy liên hệ giảng viên hoặc quản trị viên
              để được hỗ trợ thêm.
            </p>
            <Button
              variant="outline"
              className="w-full shrink-0 rounded-lg border-line bg-transparent text-dim hover:bg-panel-2 hover:text-ink sm:w-auto"
              onClick={() => navigate("/intern/onboarding")}
            >
              Về trang tuyển dụng
            </Button>
          </>
        )}
      </Panel>
    </div>
  );
}

export function OnboardingResultView() {
  const resultRes = useResource(() => recruitmentApi.result());
  const profileRes = useResource(() => recruitmentApi.me());
  const result = resultRes.data;
  const profile = profileRes.data;

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Vòng tuyển dụng · Bước 4"
        title="Kết quả phỏng vấn AI"
        description="Tổng hợp điểm, tiêu chí chấm và nhận xét từ buổi phỏng vấn gần nhất của bạn."
      />

      {resultRes.loading ? (
        <LoadingBlock variant="detail" rows={6} />
      ) : resultRes.error ? (
        <Panel className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <p className="text-sm font-semibold text-ink">Không tải được kết quả phỏng vấn</p>
          <p className="text-xs text-dim">
            {resultRes.error instanceof Error ? resultRes.error.message : "Vui lòng thử lại."}
          </p>
          <Button size="sm" variant="outline" className="rounded-lg" onClick={resultRes.reload}>
            Thử lại
          </Button>
        </Panel>
      ) : !result ? (
        <Panel>
          <Empty
            icon={<BadgeCheck className="size-5 icon" />}
            title="Chưa có kết quả phỏng vấn"
            description="Hoàn thành một buổi phỏng vấn AI đầu vào để nhận kết quả chấm điểm chi tiết tại đây."
            action={
              <Button
                size="sm"
                className="rounded-lg bg-brand text-on-brand hover:bg-brand-bright"
                onClick={() => navigate("/intern/onboarding")}
              >
                Về trang tuyển dụng
              </Button>
            }
          />
        </Panel>
      ) : (
        <div className="space-y-5">
          <OnboardingStepper current={4} />
          <ResultBody result={result} profile={profile} />
          <p className="pb-2 text-center text-[11px] text-faint">
            Kết quả chấm tự động bởi AI · Ngày chấm {formatDate(result.evaluatedAt)} · Mã kết quả{" "}
            <span className="font-mono">{result.id}</span>
          </p>
        </div>
      )}
    </ViewFrame>
  );
}
