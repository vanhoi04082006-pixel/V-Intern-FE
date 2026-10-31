"use client";
import { useEffect, useState } from "react";
import { remainingSeconds, type InterviewSession } from "@/lib/api/recruitment";
import { useRecruitmentFlow } from "./recruitment-provider";
import { RecruitmentPolicy } from "./recruitment-policy";
import { roleLabel } from "@/lib/api/workspace";
import { ConversationInterview } from "./conversation-interview";
import { ScheduledInterview } from './scheduled-interview';
import { Spinner } from "@/components/product/primitives";
import { NoteCard } from "@/components/workspace/notebook";
function InterviewCountdown({ session }: { session: InterviewSession }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const started = performance.now();
    const timer = setInterval(
      () => setElapsed(performance.now() - started),
      1000,
    );
    return () => clearInterval(timer);
  }, [session.serverNow]);
  const remaining = remainingSeconds(session, elapsed);
  return (
    <span aria-label="Thời gian còn lại">
      {remaining === null
        ? "Không có thời gian còn lại"
        : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`}
    </span>
  );
}
export function InterviewStep() {
  const {
    profile,
    interview,
    busy,
    evaluating,
    notice,
    saveAnswer,
    submit,
    start,
    reload,
  } = useRecruitmentFlow();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  if (!interview && profile.interviewSchedule) return <ScheduledInterview/>;
  if (evaluating) return (
    <section className="sketch-card mx-auto max-w-xl p-10 text-center" aria-busy="true">
      <div role="status" aria-label="AI đang chấm bài" aria-live="polite">
        <Spinner className="mx-auto mb-6 block size-12 text-primary" />
        <h1 className="text-page font-bold text-foreground">Đã kết thúc phỏng vấn</h1>
        <p className="mt-3 text-muted-foreground">Buổi phỏng vấn đã kết thúc. Vui lòng chờ hệ thống đánh giá kết quả.</p>
      </div>
      <button disabled className="mt-6 rounded-control bg-primary px-5 py-3 text-primary-foreground opacity-60">Đang chấm bài…</button>
      <button disabled className="ml-3 mt-3 rounded-control border p-3 opacity-60">Tải lại trạng thái</button>
    </section>
  );
  if (!interview)
    return (
      <div>
        <h1 className="text-page font-bold text-foreground">
          Chưa có phiên phỏng vấn
        </h1>
        <RecruitmentPolicy attemptNumber={profile.attemptNumber} attemptsRemaining={profile.attemptsRemaining} />
        <button
          type="button"
          disabled={busy || profile.attemptsRemaining <= 0}
          onClick={() => void start()}
          className="mt-4 rounded-control bg-primary px-4 py-2 text-primary-foreground"
        >
          Bắt đầu phỏng vấn
        </button>
        {notice && <p role="alert">{notice}</p>}
      </div>
    );
  if (interview.session.questionCount === 10) return <ConversationInterview key={interview.session.id} />;
  const { session, questions } = interview;
  const question =
    questions.find((q) => q.id === selectedId) ??
    questions.find((q) => !q.answered) ??
    questions[0];
  const active = session.status === "in_progress";
  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-page font-bold text-foreground">
            Phỏng vấn cùng AI Recruiter
          </h1>
          <p className="mt-2 text-body text-muted-foreground">
            {(profile.selectedRole === session.roleCode ? profile.selectedRoleLabel : null) ?? roleLabel(session.roleCode)} · Lần {session.attemptNumber} ·{" "}
            {questions.filter((q) => q.answered).length}/{session.questionCount}{" "}
            câu đã lưu
          </p>
        </div>
        <InterviewCountdown key={session.serverNow} session={session} />
      </header>
      {notice && (
        <p
          role="alert"
          className="mt-4 rounded-control bg-destructive-subtle p-3 text-body text-destructive"
        >
          {notice}
        </p>
      )}
      {!active && (
        <div role="status" className="mt-4 rounded-control bg-warning-subtle p-4">
          <p>Trạng thái phiên từ hệ thống: {session.status}</p>
          {(session.status === "expired" || session.status === "cancelled") && (
            <button
              type="button"
              disabled={busy || profile.attemptsRemaining <= 0}
              onClick={() => void start()}
              className="mt-3 rounded-control bg-primary px-4 py-2 text-primary-foreground"
            >
              Bắt đầu lần phỏng vấn mới
            </button>
          )}
        </div>
      )}
      <div className="mt-6 grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)]">
        <nav
          aria-label="Danh sách câu hỏi"
          className="sketch-card p-3"
        >
          <ol className="space-y-2">
            {questions.map((q) => (
              <li key={q.id}>
                <button
                  type="button"
                  disabled={busy}
                  aria-current={question?.id === q.id ? "step" : undefined}
                  onClick={() => {
                    setSelectedId(q.id);
                    setDraft("");
                  }}
                  className={`w-full rounded-control p-3 text-left text-body ${question?.id === q.id ? "bg-accent text-primary" : "text-muted-foreground"}`}
                >
                  Câu {q.position} ·{" "}
                  {q.category === "technical" ? "Technical" : "Soft Skill"}{" "}
                  {q.answered ? "✓ Đã lưu" : ""}
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <section className="sketch-card p-5">
          {question ? (
            <>
              <h2 className="text-section font-bold text-foreground">
                Câu {question.position}
              </h2>
              <p className="mt-3 whitespace-pre-wrap leading-relaxed">
                {question.prompt}
              </p>
              {question.answered && (
                <p className="mt-3 text-body text-success">
                  Câu trả lời đã được lưu trên hệ thống. Nội dung đã lưu không
                  được API trả về; bạn có thể nhập câu trả lời mới để cập nhật.
                </p>
              )}
              <form
                className="mt-5"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (await saveAnswer(question.id, draft)) {
                    setDraft("");
                    setSelectedId(null);
                  }
                }}
              >
                <label
                  htmlFor="interview-answer"
                  className="text-body font-semibold"
                >
                  Câu trả lời của bạn
                </label>
                <textarea
                  id="interview-answer"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={5000}
                  required
                  disabled={busy || !active}
                  rows={8}
                  className="mt-2 w-full rounded-control border border-border p-3 focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
                <p className="mt-1 text-caption text-muted-foreground">
                  {draft.length}/5000 ký tự
                </p>
                <button
                  type="submit"
                  disabled={!draft.trim() || busy || !active}
                  className="mt-4 rounded-control bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {busy ? "Đang lưu..." : "Lưu câu trả lời"}
                </button>
              </form>
            </>
          ) : (
            <p>Chưa có câu hỏi được trả về.</p>
          )}
        </section>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={
            busy ||
            !active ||
            !questions.length ||
            questions.some((q) => !q.answered)
          }
          onClick={() => void submit()}
          className="rounded-control bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-50"
        >
          Nộp bài phỏng vấn
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void reload()}
          className="rounded-control border border-border px-4 py-2"
        >
          Tải lại trạng thái
        </button>
      </div>
      <NoteCard tape title="Lưu ý nhỏ" className="mt-5 max-w-xl">
        Đồng hồ chỉ hiển thị thời gian từ hệ thống. Hệ thống kiểm tra thời hạn
        khi lưu và nộp bài.
      </NoteCard>
    </div>
  );
}
