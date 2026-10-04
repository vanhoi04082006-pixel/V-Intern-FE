"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CircleAlert,
  Clock,
  ListChecks,
  Mic,
  Paperclip,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

import {
  INTERVIEW_HEADING,
  INTERVIEW_MAX_ANSWER_LENGTH,
  INTERVIEW_QUESTIONS,
  INTERVIEW_TIMER_LABEL,
  INTERVIEW_TOTAL_MINUTES,
  RECRUITMENT_ROLES,
  formatQuestionPrompt,
  getRoleLabel,
} from "./data/recruitment-mock-data";
import { OnboardingProgress, StepBadge, TagPill } from "./onboarding-primitives";
import { useRecruitmentFlow } from "./recruitment-provider";

/**
 * Màn 3 — Phỏng vấn cùng AI Recruiter (Bước 3/4).
 *
 * Nội dung chính: header vai trò đang ứng tuyển + tags, panel AI Recruiter
 * (tái sử dụng robot-v2.png có sẵn), card câu hỏi hiện tại, khu trả lời
 * (đã ghi nhận → xem/sửa; chưa → textarea + đếm ký tự), tab Văn bản/Giọng
 * nói, đính kèm mock, nút gửi câu trả lời, link "Rời phỏng vấn".
 * Rail phải: thời gian, tiến độ (derive từ vị trí câu hiện tại/tổng), danh
 * sách 8 câu hỏi highlight câu đang trả lời.
 *
 * MOCK-ONLY có chủ đích (theo task):
 * - Timer hiển thị giá trị tĩnh theo reference — KHÔNG đếm ngược thật.
 * - Tab "Giọng nói" và đính kèm là UI mô phỏng bị vô hiệu (disabled) kèm
 *   giải thích — không gọi micro/upload API nào.
 * - Gửi câu trả lời chỉ ghi nhận vào mock state rồi chuyển câu tiếp theo.
 */

type AnswerMode = "text" | "voice";

function percentOf(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

export function InterviewStep() {
  const {
    selectedRoleId,
    answers,
    currentQuestionIndex,
    isInterviewCompleted,
    submitAnswer,
  } = useRecruitmentFlow();

  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState<AnswerMode>("text");

  const total = INTERVIEW_QUESTIONS.length;
  const roleLabel = getRoleLabel(selectedRoleId);
  const role = RECRUITMENT_ROLES.find((item) => item.id === selectedRoleId);
  const position = Math.min(currentQuestionIndex + 1, total);
  const progressPercent = percentOf(position, total);
  const currentQuestion = INTERVIEW_QUESTIONS[currentQuestionIndex];
  const recordedAnswer = currentQuestion
    ? answers[currentQuestion.id]
    : undefined;

  const RoleIcon = role?.icon;

  function handleSubmit() {
    const text = draft.trim();
    if (text.length === 0) return;
    submitAnswer(text);
    setDraft("");
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Submit nhanh bằng Ctrl/⌘ + Enter — không bắt các phím khác.
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      handleSubmit();
    }
  }

  if (isInterviewCompleted || !currentQuestion) {
    return <InterviewCompleted roleLabel={roleLabel} />;
  }

  return (
    <div
      aria-labelledby="interview-heading"
      className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]"
    >
      <div className="min-w-0">
        <header>
          <StepBadge step={3} />
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1
              id="interview-heading"
              className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl"
            >
              {INTERVIEW_HEADING}
            </h1>
            {RoleIcon ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[13px] font-semibold text-navy">
                <RoleIcon className="size-4 text-brand" aria-hidden="true" />
                {roleLabel}
              </span>
            ) : null}
          </div>
          <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Nhóm kỹ năng của vị trí">
            {role?.tags.map((tag) => (
              <li key={tag}>
                <TagPill tone={role.tone}>{tag}</TagPill>
              </li>
            ))}
          </ul>
        </header>

        {/* Panel AI Recruiter */}
        <section
          aria-labelledby="recruiter-panel-heading"
          className="mt-5 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center sm:p-5"
        >
          <div
            aria-hidden="true"
            className="relative mx-auto h-24 w-20 shrink-0 sm:mx-0"
          >
            <Image
              src="/images/robot-v2.png"
              alt=""
              fill
              sizes="80px"
              className="object-contain"
            />
          </div>
          <div className="min-w-0 text-center sm:text-left">
            <h2
              id="recruiter-panel-heading"
              className="flex items-center justify-center gap-2 text-base font-bold text-navy sm:justify-start"
            >
              AI Recruiter
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-brand">
                Đang phỏng vấn
              </span>
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-600">
              Chào bạn, mình sẽ cùng bạn hoàn thành 8 câu hỏi cho vị trí{" "}
              <strong className="font-semibold text-navy">{roleLabel}</strong>.
              Câu trả lời được ghi nhận ngay khi bạn gửi — cứ chọn câu đang
              làm trong danh sách bên phải.
            </p>
          </div>
        </section>

        {/* Card câu hỏi hiện tại */}
        <section
          aria-labelledby="current-question-heading"
          className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2
              id="current-question-heading"
              className="flex items-center gap-2.5 text-base font-bold text-navy"
            >
              <span
                aria-hidden="true"
                className="grid size-8 place-items-center rounded-lg bg-blue-50 text-sm font-bold text-brand"
              >
                {position}
              </span>
              Câu {position} / {total}
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-semibold",
                  currentQuestion.category === "Technical"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-emerald-50 text-emerald-700"
                )}
              >
                {currentQuestion.category}
              </span>
            </h2>
          </div>
          <p className="mt-3 text-[15px] font-medium leading-relaxed text-slate-800">
            {formatQuestionPrompt(currentQuestion, roleLabel)}
          </p>
          {currentQuestion.hint ? (
            <p className="mt-2 text-[13px] italic leading-relaxed text-slate-500">
              Gợi ý: {currentQuestion.hint}
            </p>
          ) : null}

          {recordedAnswer ? (
            <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50/60 p-3.5">
              <p
                aria-live="polite"
                className="flex items-center gap-1.5 text-[13px] font-bold text-emerald-700"
              >
                <BadgeCheck className="size-4" aria-hidden="true" />
                Đã ghi nhận câu trả lời cho câu này
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-700">
                {recordedAnswer}
              </p>
            </div>
          ) : null}

          {/* Chế độ trả lời: Văn bản / Giọng nói (mock) */}
          <div
            role="group"
            aria-label="Chế độ trả lời"
            className="mt-4 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1"
          >
            <button
              type="button"
              aria-pressed={mode === "text"}
              onClick={() => setMode("text")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors",
                mode === "text"
                  ? "bg-white text-navy shadow-sm"
                  : "text-slate-500 hover:text-navy"
              )}
            >
              Văn bản
            </button>
            <button
              type="button"
              aria-pressed={mode === "voice"}
              onClick={() => setMode("voice")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors",
                mode === "voice"
                  ? "bg-white text-navy shadow-sm"
                  : "text-slate-500 hover:text-navy"
              )}
            >
              <Mic className="size-4" aria-hidden="true" />
              Giọng nói
            </button>
          </div>

          {mode === "text" ? (
            <div className="mt-3">
              <label htmlFor="interview-answer" className="sr-only">
                Câu trả lời của bạn cho câu {position}
              </label>
              <textarea
                id="interview-answer"
                value={draft}
                maxLength={INTERVIEW_MAX_ANSWER_LENGTH}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập câu trả lời của bạn..."
                rows={5}
                className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm leading-relaxed text-navy outline-none transition-shadow placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-brand/40"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  disabled
                  title="Mô phỏng UI — tính năng đính kèm chưa được kết nối"
                  className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[13px] font-semibold text-slate-400"
                >
                  <Paperclip className="size-4" aria-hidden="true" />
                  Đính kèm tệp
                </button>
                <p aria-live="polite" className="text-xs text-slate-400">
                  {draft.length}/{INTERVIEW_MAX_ANSWER_LENGTH} ký tự · Nhấn
                  Ctrl/⌘ + Enter để gửi nhanh
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
              <p className="flex items-center gap-2 text-[13px] font-semibold text-slate-600">
                <Mic className="size-4 text-slate-400" aria-hidden="true" />
                Trả lời bằng giọng nói (mô phỏng)
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                Tính năng ghi âm chưa được kết nối — hiện chỉ mô phỏng giao
                diện. Vui lòng chuyển về tab{" "}
                <button
                  type="button"
                  aria-label="Chuyển về chế độ Văn bản"
                  onClick={() => setMode("text")}
                  className="font-semibold text-brand underline underline-offset-2"
                >
                  Văn bản
                </button>{" "}
                để trả lời.
              </p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={mode === "text" && draft.trim().length === 0}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              <Send className="size-4" aria-hidden="true" />
              {recordedAnswer ? "Cập nhật câu trả lời" : "Gửi câu trả lời"}
            </button>
            <Link
              href="/intern/onboarding"
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] font-semibold text-red-600 transition-colors hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            >
              Rời phỏng vấn
            </Link>
          </div>
        </section>
      </div>

      {/* Rail phải: thời gian + tiến độ + danh sách câu hỏi */}
      <div className="flex min-w-0 flex-col gap-4">
        <section
          aria-labelledby="interview-timer-heading"
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
        >
          <h2
            id="interview-timer-heading"
            className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-slate-500"
          >
            <Clock className="size-4 text-brand" aria-hidden="true" />
            Thời gian
          </h2>
          <p className="mt-2 text-3xl font-extrabold tabular-nums tracking-tight text-navy">
            {INTERVIEW_TIMER_LABEL}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Tổng thời gian {INTERVIEW_TOTAL_MINUTES} phút · bộ đếm mô phỏng
          </p>
        </section>

        <section
          aria-labelledby="interview-progress-heading"
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
        >
          <div className="flex items-center justify-between gap-2">
            <h2
              id="interview-progress-heading"
              className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-slate-500"
            >
              <ListChecks className="size-4 text-brand" aria-hidden="true" />
              Tiến độ phỏng vấn
            </h2>
            <span className="text-sm font-bold text-navy">
              {position}/{total}
            </span>
          </div>
          <OnboardingProgress
            value={progressPercent}
            label={`Tiến độ phỏng vấn: câu ${position} trên ${total}`}
            className="mt-3"
          />
          <p className="mt-2 text-xs text-slate-500">
            Hoàn thành {progressPercent}% ({position} trên {total} câu hỏi)
          </p>
        </section>

        <nav
          aria-label="Danh sách câu hỏi phỏng vấn"
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
        >
          <h2 className="text-[13px] font-bold uppercase tracking-wide text-slate-500">
            Danh sách câu hỏi
          </h2>
          <ol className="mt-3 flex flex-col gap-1">
            {INTERVIEW_QUESTIONS.map((question, index) => {
              const itemPosition = index + 1;
              const isCurrent = index === currentQuestionIndex;
              const isAnswered = Boolean(answers[question.id]);
              return (
                <li key={question.id} aria-current={isCurrent ? "step" : undefined}>
                  <span
                    className={cn(
                      "flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-[13px] leading-snug",
                      isCurrent
                        ? "bg-blue-50 font-bold text-navy"
                        : "text-slate-600"
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                        isCurrent
                          ? "bg-brand text-white"
                          : isAnswered
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {isAnswered && !isCurrent ? (
                        <BadgeCheck className="size-3.5" />
                      ) : (
                        itemPosition
                      )}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "block text-[11px] font-semibold uppercase tracking-wide",
                          question.category === "Technical"
                            ? "text-blue-600"
                            : "text-emerald-600"
                        )}
                      >
                        {question.category}
                      </span>
                      <span className="line-clamp-2">{question.prompt}</span>
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </div>
  );
}

/** Card hoàn thành phỏng vấn — hiện khi đã trả lời đủ 8 câu (mock state). */
function InterviewCompleted({ roleLabel }: { roleLabel: string }) {
  return (
    <section
      aria-labelledby="interview-completed-heading"
      className="mx-auto max-w-[640px] rounded-xl border border-slate-200 bg-white p-6 text-center shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-8"
    >
      <span
        aria-hidden="true"
        className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50"
      >
        <BadgeCheck className="size-7 text-emerald-600" />
      </span>
      <h1
        id="interview-completed-heading"
        className="mt-4 text-2xl font-extrabold tracking-tight text-navy"
      >
        Bạn đã hoàn thành phỏng vấn!
      </h1>
      <p className="mx-auto mt-2 max-w-[440px] text-sm leading-relaxed text-slate-600">
        AI Recruiter đã ghi nhận đủ 8 câu trả lời của bạn cho vị trí{" "}
        <strong className="font-semibold text-navy">{roleLabel}</strong>. Xem
        kết quả tuyển dụng ở bước cuối.
      </p>
      <Link
        href="/intern/onboarding/result"
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1"
      >
        Xem kết quả
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400">
        <CircleAlert className="size-3.5" aria-hidden="true" />
        Kết quả hiển thị là dữ liệu mẫu — chưa kết nối API thật.
      </p>
    </section>
  );
}
