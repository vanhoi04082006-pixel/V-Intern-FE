"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  BadgeCheck,
  Clock,
  FileText,
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
 * Màn 3 — Phỏng vấn cùng AI Recruiter (Bước 3/4) — DASHBOARD desktop
 * theo reference "03 AI Recruitment": toàn bộ nội dung chính nằm trong
 * MỘT viewport (shell sidebar đã khóa 100dvh, không body scroll lg+).
 *
 * Cấu trúc:
 * - Header 1 hàng compact: Bước 3/4 + tiêu đề + vai trò + tags + "Rời
 *   phỏng vấn" (top-right như reference, KHÔNG nằm đáy card).
 * - Hàng hero main: panel AI Recruiter (robot-v2.png) | card câu hỏi
 *   hiện tại — xếp NGANG (reference), không full-width intro card.
 * - Composer: tabs Văn bản/Giọng nói (mock) + textarea + đính kèm + gửi.
 * - Rail phải: timer + tiến độ gộp 1 card + danh sách 8 câu ngắn gọn
 *   (shortTitle) — list tự scroll nội bộ nếu thiếu chỗ, page không cuộn.
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
      className="grid min-w-0 grid-cols-1 gap-4 lg:min-h-0 xl:grid-cols-[minmax(0,1fr)_312px]"
    >
      {/* Cột chính */}
      <div className="flex min-w-0 flex-col gap-4">
        {/* Header 1 hàng compact: step + title + role + tags + leave */}
        <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <StepBadge step={3} />
          <h1
            id="interview-heading"
            className="text-xl font-extrabold tracking-tight text-navy sm:text-2xl"
          >
            {INTERVIEW_HEADING}
          </h1>
          {RoleIcon ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[13px] font-semibold text-navy">
              <RoleIcon className="size-4 text-brand" aria-hidden="true" />
              {roleLabel}
            </span>
          ) : null}
          <ul
            className="flex flex-wrap items-center gap-1.5"
            aria-label="Nhóm kỹ năng của vị trí"
          >
            {role?.tags.map((tag) => (
              <li key={tag}>
                <TagPill tone={role.tone}>{tag}</TagPill>
              </li>
            ))}
          </ul>
          <Link
            href="/intern/onboarding"
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          >
            Rời phỏng vấn
          </Link>
        </header>

        {/* Hàng hero: AI Recruiter | câu hỏi hiện tại — ngang như reference */}
        <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)]">
          <section
            aria-labelledby="recruiter-panel-heading"
            className="flex min-w-0 flex-col items-center rounded-xl border border-slate-200 bg-white p-4 text-center shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
          >
            <div
              aria-hidden="true"
              className="relative h-32 w-28 shrink-0"
            >
              <Image
                src="/images/robot-v2.png"
                alt=""
                fill
                sizes="112px"
                className="object-contain"
              />
            </div>
            <h2
              id="recruiter-panel-heading"
              className="mt-2 flex items-center gap-2 text-[15px] font-bold text-navy"
            >
              AI Recruiter
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-brand">
                Đang phỏng vấn
              </span>
            </h2>
            <p className="mt-1 line-clamp-3 text-[13px] leading-relaxed text-slate-600">
              Chào bạn, mình sẽ cùng bạn hoàn thành {total} câu hỏi cho vị
              trí <strong className="font-semibold text-navy">{roleLabel}</strong>.
              Câu trả lời được ghi nhận ngay khi bạn gửi.
            </p>
          </section>

          <section
            aria-labelledby="current-question-heading"
            className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
          >
            <h2
              id="current-question-heading"
              className="flex flex-wrap items-center gap-2.5 text-base font-bold text-navy"
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
            <p className="mt-2.5 text-[15px] font-medium leading-relaxed text-slate-800">
              {formatQuestionPrompt(currentQuestion, roleLabel)}
            </p>
            {currentQuestion.hint ? (
              <p className="mt-1.5 text-[13px] italic leading-relaxed text-slate-500">
                Gợi ý: {currentQuestion.hint}
              </p>
            ) : null}

            {recordedAnswer ? (
              <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
                <p
                  aria-live="polite"
                  className="flex items-center gap-1.5 text-[13px] font-bold text-emerald-700"
                >
                  <BadgeCheck className="size-4" aria-hidden="true" />
                  Đã ghi nhận câu trả lời cho câu này
                </p>
                <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-slate-700">
                  {recordedAnswer}
                </p>
              </div>
            ) : null}
          </section>
        </div>

        {/* Composer: tabs + textarea + đính kèm + gửi — 1 card compact */}
        <section
          aria-label="Soạn câu trả lời"
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
        >
          <div
            role="group"
            aria-label="Chế độ trả lời"
            className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1"
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
              <FileText className="size-4" aria-hidden="true" />
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
                rows={4}
                className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-navy outline-none transition-shadow placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-brand/40"
              />
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
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
            <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3.5">
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

          <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={mode === "text" && draft.trim().length === 0}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              <Send className="size-4" aria-hidden="true" />
              {recordedAnswer ? "Cập nhật câu trả lời" : "Gửi câu trả lời"}
            </button>
          </div>
        </section>
      </div>

      {/* Rail phải: timer + tiến độ (gộp 1 card) + danh sách câu hỏi */}
      <div className="flex min-w-0 flex-col gap-4 lg:min-h-0">
        <section
          aria-label="Thời gian và tiến độ phỏng vấn"
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
        >
          <div className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-slate-500">
            <Clock className="size-4 text-brand" aria-hidden="true" />
            Thời gian còn lại
          </div>
          <div className="mt-1 flex items-end justify-between gap-2">
            <p className="text-3xl font-extrabold tabular-nums leading-none tracking-tight text-navy">
              {INTERVIEW_TIMER_LABEL}
            </p>
            <p className="text-xs text-slate-500">
              Tổng thời gian {INTERVIEW_TOTAL_MINUTES} phút · mô phỏng
            </p>
          </div>

          <div className="mt-3 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-slate-500">
                <ListChecks className="size-4 text-brand" aria-hidden="true" />
                Tiến độ phỏng vấn
              </p>
              <span className="text-sm font-bold text-navy">
                {position}/{total}
              </span>
            </div>
            <OnboardingProgress
              value={progressPercent}
              label={`Tiến độ phỏng vấn: câu ${position} trên ${total}`}
              className="mt-2"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Hoàn thành {progressPercent}% ({position} trên {total} câu hỏi)
            </p>
          </div>
        </section>

        <nav
          aria-label="Danh sách câu hỏi phỏng vấn"
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
        >
          <h2 className="text-[13px] font-bold uppercase tracking-wide text-slate-500">
            Danh sách câu hỏi
          </h2>
          {/* Chỉ list được phép scroll nội bộ khi thiếu chỗ — page không cuộn */}
          <ol className="mt-2.5 flex flex-col gap-0.5 lg:max-h-[400px] lg:overflow-y-auto">
            {INTERVIEW_QUESTIONS.map((question, index) => {
              const itemPosition = index + 1;
              const isCurrent = index === currentQuestionIndex;
              const isAnswered = Boolean(answers[question.id]);
              return (
                <li key={question.id} aria-current={isCurrent ? "step" : undefined}>
                  <span
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] leading-snug",
                      isCurrent
                        ? "bg-blue-50 font-bold text-navy"
                        : "text-slate-600"
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold",
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
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">
                        {question.shortTitle}
                      </span>
                      <span
                        className={cn(
                          "block text-[11px] font-semibold",
                          question.category === "Technical"
                            ? "text-blue-600"
                            : "text-emerald-600"
                        )}
                      >
                        {question.category}
                      </span>
                    </span>
                    {isCurrent ? (
                      <span
                        aria-hidden="true"
                        className="text-[11px] font-bold text-brand"
                      >
                        ▸
                      </span>
                    ) : null}
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
      </Link>
      <p className="mt-4 text-xs text-slate-400">
        Kết quả hiển thị là dữ liệu mẫu — chưa kết nối API thật.
      </p>
    </section>
  );
}
