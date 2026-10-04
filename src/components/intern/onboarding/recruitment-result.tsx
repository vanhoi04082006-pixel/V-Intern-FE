"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, FileSearch, PartyPopper, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

import type {
  RecruitmentResultData,
  RoleId,
} from "./data/recruitment-mock-data";
import { formatScore } from "./recruitment-scoring";
import { HorizontalStepper } from "./onboarding-stepper";
import { StepBadge } from "./onboarding-primitives";
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
 * - Pass: banner chúc mừng + donut Overall + phân tích điểm + nhận xét AI
 *   + "Vị trí đã tuyển dụng" + bước tiếp theo + CTA "Vào Workspace" (/intern).
 * - Fail: banner "Chưa đạt" + thêm card đề xuất vai trò từ AI Recruiter +
 *   CTA "Tiếp tục với {vai trò đề xuất}" (chỉ đổi mock state client-side).
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

  function handleContinueWithRole(roleId: RoleId) {
    // Cập nhật CHỈ mock recruitment state (đổi vai trò + reset phỏng vấn)
    // rồi đưa user về bước Chọn vị trí — không persist, không gọi API.
    continueWithRole(roleId);
    router.push("/intern/onboarding/role");
  }

  return (
    <div>
      <StepBadge step={4} />

      <header className="mt-3">
        <div
          className={cn(
            "flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6",
            result.passed
              ? "border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-white"
              : "border-amber-200 bg-gradient-to-r from-amber-50 via-white to-white"
          )}
        >
          <div className="min-w-0">
            <h1 className="flex flex-wrap items-center gap-2.5 text-[26px] font-extrabold tracking-tight text-navy sm:text-3xl">
              {result.passed ? (
                <PartyPopper className="size-7 text-amber-500" aria-hidden="true" />
              ) : (
                <RefreshCcw className="size-7 text-amber-600" aria-hidden="true" />
              )}
              {result.headline}
            </h1>
            <p className="mt-2 max-w-[560px] text-sm leading-relaxed text-slate-600">
              {result.subtitle}
            </p>
            <p className="mt-3 text-[13px] font-semibold text-slate-500">
              Vị trí ứng tuyển:{" "}
              <span className="font-bold text-navy">{result.appliedRoleLabel}</span>
            </p>
          </div>
          <span
            role="status"
            className={cn(
              "inline-flex shrink-0 items-center gap-2 self-start rounded-full px-4 py-2 text-sm font-bold sm:self-auto",
              result.passed
                ? "bg-emerald-500 text-white"
                : "bg-amber-500 text-white"
            )}
          >
            {result.passed ? "Đạt yêu cầu" : "Chưa đạt"}
            <span aria-hidden="true">·</span>
            {formatScore(result.overall)}/100
          </span>
        </div>
      </header>

      <div className="mt-6">
        <HorizontalStepper activeStep={4} />
      </div>

      <div className="mt-6 grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Cột trái: điểm + nhận xét AI + (fail) đề xuất */}
        <div className="flex min-w-0 flex-col gap-5">
          <ScoreBreakdown result={result} />
          <RecruiterFeedback result={result} />
          {!result.passed ? (
            <RoleRecommendation
              result={result}
              onContinue={handleContinueWithRole}
            />
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/intern/onboarding/interview"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1"
            >
              <FileSearch className="size-4" aria-hidden="true" />
              Xem chi tiết bài làm
            </Link>
            {result.passed ? (
              <Link
                href="/intern"
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1"
              >
                Vào Workspace
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            ) : (
              <Link
                href="/intern/onboarding/role"
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1"
              >
                Xem lại tiêu chí đánh giá
              </Link>
            )}
          </div>
          <p className="text-xs leading-relaxed text-slate-400">
            {result.passed
              ? "Sau khi vào Workspace, bạn sẽ ở trạng thái chờ giảng viên phân công Project và Internship Session."
              : "Bạn có thể chọn lại vai trò bất kỳ lúc nào ở bước Chọn vị trí ứng tuyển."}
          </p>
        </div>

        {/* Cột phải: bước tiếp theo + (pass) vai trò trúng tuyển + lưu ý */}
        <div className="flex min-w-0 flex-col gap-4">
          <NextStepsCard steps={result.nextSteps} />
          {result.passed ? <HiredRoleCard result={result} /> : null}
          <ResultNotesCard result={result} />
        </div>
      </div>
    </div>
  );
}
