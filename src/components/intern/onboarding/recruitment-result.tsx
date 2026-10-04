"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  CircleAlert,
  FileSearch,
  RefreshCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

import type {
  RecruitmentResultData,
  RoleId,
} from "./data/recruitment-mock-data";
import { HiredRoleCard, NextStepsCard, ResultNotesCard } from "./next-steps-card";
import {
  RecruiterFeedback,
  RoleRecommendation,
} from "./recruiter-feedback";
import { useRecruitmentFlow } from "./recruitment-provider";
import { ScoreBreakdown } from "./score-breakdown";

/**
 * Màn 4 — Kết quả tuyển dụng (Bước 4/4), DÙNG CHUNG cho Đạt/Chưa đạt:
 * pass/fail là 2 DATA STATE của cùng một screen (không phải 2 route).
 *
 * COMPOSITION desktop theo reference 4A/4B — dashboard 1 viewport:
 * - KHÔNG render stepper ngang trong main (trước đây bị duplicate với
 *   stepper dọc của shell — đã bỏ; vị trí bước chỉ nằm ở rail trái).
 * - Cột chính: hero compact (không-card) → score card → nhận xét AI →
 *   hàng CTA (luôn visible trong viewport).
 * - Rail phải bắt đầu ngay đỉnh content:
 *   + Pass: Bước tiếp theo → Vị trí đã tuyển dụng → Lưu ý.
 *   + Fail: Đề xuất từ AI Recruiter (card compact, KHÔNG full-width
 *     dưới main như bản cũ) → Bước tiếp theo → Lưu ý.
 * - CTA chính "Tiếp tục với {vai trò đề xuất}" nằm ở hàng CTA chính
 *   (giống reference), không nhân bản trong card đề xuất.
 *
 * CTA "Vào Workspace" giữ production đích /intern — hành vi Workspace
 * (empty/active) do trạng thái phân công thật quyết định, không force.
 */
export function RecruitmentResult({
  result,
}: {
  result: RecruitmentResultData;
}) {
  const router = useRouter();
  const { continueWithRole } = useRecruitmentFlow();

  // Fail luôn có vai trò đề xuất (buildRecruitmentResult đảm bảo) — const
  // để TS narrow, tránh non-null assertion trong JSX.
  const suggestedRole = result.passed ? null : result.suggestedRole;

  function handleContinueWithRole(roleId: RoleId) {
    // Cập nhật CHỈ mock recruitment state (đổi vai trò + reset phỏng vấn)
    // rồi đưa user về bước Chọn vị trí — không persist, không gọi API.
    continueWithRole(roleId);
    router.push("/intern/onboarding/role");
  }

  return (
    <div
      aria-labelledby="result-heading"
      className="grid min-w-0 grid-cols-1 gap-4 lg:min-h-0 xl:grid-cols-[minmax(0,1fr)_320px]"
    >
      {/* Cột chính */}
      <div className="flex min-w-0 flex-col gap-4">
        {/* Hero compact không-card: icon + headline + subtitle (có vai trò) */}
        <header className="flex items-start gap-3.5">
          <span
            aria-hidden="true"
            className={cn(
              "grid size-12 shrink-0 place-items-center rounded-2xl",
              result.passed ? "bg-emerald-100" : "bg-amber-100"
            )}
          >
            {result.passed ? (
              <BadgeCheck className="size-7 text-emerald-600" />
            ) : (
              <CircleAlert className="size-7 text-amber-600" />
            )}
          </span>
          <div className="min-w-0">
            <h1
              id="result-heading"
              className="text-2xl font-extrabold tracking-tight text-navy sm:text-[28px]"
            >
              {result.headline}
            </h1>
            <p className="mt-1 max-w-[640px] text-sm leading-relaxed text-slate-600">
              {result.subtitle}
            </p>
          </div>
        </header>

        <ScoreBreakdown result={result} />
        <RecruiterFeedback result={result} />

        {/* Hàng CTA — luôn trong viewport desktop, compact */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/intern/onboarding/interview"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1"
          >
            <FileSearch className="size-4" aria-hidden="true" />
            Xem chi tiết bài làm
          </Link>
          {result.passed ? (
            <Link
              href="/intern"
              className="ml-auto inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1"
            >
              Vào Workspace
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          ) : (
            <>
              <Link
                href="/intern/onboarding/role"
                className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-600 transition-colors hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                <RefreshCcw className="size-4" aria-hidden="true" />
                Xem lại tiêu chí đánh giá
              </Link>
              {suggestedRole ? (
                <button
                  type="button"
                  onClick={() => handleContinueWithRole(suggestedRole.id)}
                  className="ml-auto inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1"
                >
                  <ArrowRight className="size-4" aria-hidden="true" />
                  Tiếp tục với {suggestedRole.label}
                </button>
              ) : null}
            </>
          )}
        </div>
        <p className="text-xs leading-relaxed text-slate-400">
          {result.passed
            ? "Sau khi vào Workspace, bạn sẽ ở trạng thái chờ giảng viên phân công Project và Internship Session."
            : "Tiếp tục với vai trò đề xuất sẽ đưa bạn về bước Chọn vị trí — chỉ đổi mock state trong phiên này."}
        </p>
      </div>

      {/* Rail phải — bắt đầu ngay đỉnh content theo reference */}
      <aside
        aria-label="Thông tin kết quả và bước tiếp theo"
        className="flex min-w-0 flex-col gap-3 lg:min-h-0"
      >
        {!result.passed ? <RoleRecommendation result={result} /> : null}
        <NextStepsCard steps={result.nextSteps} />
        {result.passed ? <HiredRoleCard result={result} /> : null}
        <ResultNotesCard result={result} />
      </aside>
    </div>
  );
}
