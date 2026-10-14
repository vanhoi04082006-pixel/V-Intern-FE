"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Send, User, RefreshCw } from "lucide-react";
import {
  conversationNext,
  conversationView,
  conversationClarify,
  remainingSeconds,
} from "@/lib/api/recruitment";
import { errorMessage } from "@/lib/auth/api-client";
import { useRecruitmentFlow } from "./recruitment-provider";

const phaseLabels: Record<string, string> = {
  introduction: "Làm quen",
  technical: "Chuyên môn",
  english: "Tiếng Anh",
  soft: "Kỹ năng giao tiếp",
};
export function ConversationInterview() {
  const {
    interview,
    busy,
    notice,
    saveAnswer,
    submit,
    reload,
    start,
    profile,
  } = useRecruitmentFlow();
  const sessionId = interview!.session.id;
  const [chat, setChat] =
    useState<Awaited<ReturnType<typeof conversationView>>>();
  const [elapsed, setElapsed] = useState(0);
  const [draft, setDraft] = useState(""),
    [working, setWorking] = useState(false),
    [error, setError] = useState("");
  const end = useRef<HTMLDivElement>(null),
    sending = useRef(false);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const data = await conversationView(sessionId, signal);
        if (!signal?.aborted) {
          setChat(data);
          setElapsed(0);
          setError("");
        }
      } catch (e) {
        if (!signal?.aborted) setError(errorMessage(e));
      }
    },
    [sessionId],
  );
  useEffect(() => {
    const c = new AbortController();
    void Promise.resolve().then(() => load(c.signal));
    return () => c.abort();
  }, [load]);
  useEffect(() => {
    if (chat?.currentQuestion?.status !== "generating") return;
    const c = new AbortController();
    const timer = setTimeout(() => void load(c.signal), 3000);
    return () => {
      clearTimeout(timer);
      c.abort();
    };
  }, [chat, load]);
  useEffect(() => {
    const start = performance.now();
    const timer = setInterval(
      () => setElapsed(performance.now() - start),
      1000,
    );
    return () => clearInterval(timer);
  }, [chat?.session.serverNow]);
  useEffect(() => {
    end.current?.scrollIntoView?.({ block: "nearest" });
  }, [chat?.messages.length]);
  async function next() {
    if (sending.current) return;
    sending.current = true;
    setWorking(true);
    setError("");
    try {
      setChat(await conversationNext(sessionId));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      sending.current = false;
      setWorking(false);
    }
  }
  async function send(text: string) {
    if (sending.current || !chat?.currentQuestion || !text.trim()) return;
    sending.current = true;
    setWorking(true);
    setError("");
    try {
      if (await saveAnswer(chat.currentQuestion.id, text)) {
        setDraft("");
        setChat(await conversationNext(sessionId));
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      sending.current = false;
      setWorking(false);
    }
  }
  async function clarify() {
    if (sending.current) return;
    sending.current = true;
    setWorking(true);
    setError("");
    try {
      setChat(await conversationClarify(sessionId));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      sending.current = false;
      setWorking(false);
    }
  }
  const active = chat?.session.status === "in_progress";
  const current = chat?.currentQuestion;
  const disabled = busy || working || !active || current?.status !== "ready";
  const expired = Boolean(
    chat && remainingSeconds(chat.session, elapsed) === 0,
  );
  return (
    <section className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
      <header className="flex flex-wrap items-center gap-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white p-5">
        <span className="grid size-12 place-items-center rounded-2xl bg-brand text-white">
          <Bot aria-hidden="true" />
        </span>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-navy">
            Trò chuyện cùng AI Recruiter
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {chat?.answeredCount ?? 0}/{interview!.session.questionCount} câu ·{" "}
            {current ? phaseLabels[current.phase] : "Kết thúc hội thoại"}
          </p>
        </div>
        {active && chat?.session.expiresAt && (
          <p className="text-xs text-slate-500">
            Hạn gửi:{" "}
            {new Date(chat.session.expiresAt).toLocaleTimeString("vi-VN")}
          </p>
        )}
      </header>
      <div className="h-1 bg-slate-100">
        <div
          className="h-full bg-brand transition-[width] motion-reduce:transition-none"
          style={{
            width: `${((chat?.answeredCount ?? 0) / interview!.session.questionCount) * 100}%`,
          }}
        />
      </div>
      {(notice || error) && (
        <p
          role="alert"
          className="m-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900"
        >
          {notice || error}
        </p>
      )}
      <div
        role="log"
        aria-label="Hội thoại phỏng vấn"
        aria-live="polite"
        className="max-h-[55dvh] min-h-64 space-y-5 overflow-y-auto p-4 sm:p-6"
      >
        {chat?.messages.map((m, i) => (
          <article
            key={`${m.questionId}-${m.role}-${i}`}
            className={`flex items-start gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <span
              aria-label={m.role === "assistant" ? "AI Recruiter" : "Bạn"}
              className={`grid size-8 shrink-0 place-items-center rounded-full ${m.role === "assistant" ? "bg-blue-100 text-brand" : "bg-slate-100 text-slate-600"}`}
            >
              {m.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
            </span>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-7 ${m.role === "assistant" ? "bg-slate-50 text-slate-700" : "bg-brand text-white"}`}
            >
              {m.content}
            </div>
          </article>
        ))}
        {!chat && !error && <p role="status">Đang khôi phục hội thoại…</p>}
        {(working || current?.status === "generating") && (
          <p role="status" className="text-sm text-slate-500">
            AI đang chuẩn bị câu hỏi tiếp theo…
          </p>
        )}
        {current?.status === "failed" && (
          <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm">
            AI chưa gửi được câu hỏi. Câu trả lời đã gửi vẫn được giữ nguyên;
            bạn có thể thử lại.
          </p>
        )}
        {!current && chat && (
          <p role="status" className="rounded-xl bg-emerald-50 p-4">
            Bạn đã trả lời xong các câu hỏi. Bấm kết thúc để AI đánh giá.
          </p>
        )}
        <div ref={end} />
      </div>
      <div className="border-t border-slate-100 bg-slate-50/60 p-4 sm:p-6">
        {active && current && (
          <>
            {(current.status === "not_started" ||
              current.status === "failed" ||
              (current.status === "generating" && !working)) && (
              <button
                disabled={working || busy}
                onClick={() => void next()}
                className="mb-4 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {current.status === "failed"
                  ? "Thử lại câu hỏi"
                  : "Tiếp tục hội thoại"}
              </button>
            )}
            <button
              disabled={disabled || expired}
              onClick={() => void clarify()}
              className="mb-3 text-sm text-blue-700 disabled:opacity-40"
            >
              Giải thích lại câu hỏi
            </button>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send(draft);
              }}
            >
              <label
                htmlFor="conversation-answer"
                className="mb-2 block text-sm font-semibold"
              >
                Tin nhắn của bạn
              </label>
              <textarea
                id="conversation-answer"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                required
                maxLength={5000}
                rows={3}
                disabled={disabled || expired}
                placeholder="Chia sẻ câu trả lời của bạn. Bạn có thể nói rõ điều mình chưa biết."
                className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:bg-slate-100"
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="mr-auto text-xs text-slate-500">
                  {draft.length}/5000 ký tự
                </span>
                <button
                  type="button"
                  disabled={disabled || expired}
                  onClick={() =>
                    void send("[Bỏ qua câu này — tôi chưa có câu trả lời.]")
                  }
                  className="rounded-lg px-3 py-2 text-sm text-slate-600 disabled:opacity-40"
                >
                  Bỏ qua câu này
                </button>
                <button
                  disabled={disabled || expired || !draft.trim()}
                  className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
                >
                  <Send size={16} />
                  Gửi câu trả lời
                </button>
              </div>
            </form>
          </>
        )}
        {!current && chat && active && (
          <button
            disabled={busy || working}
            onClick={() => void submit()}
            className="rounded-xl bg-brand px-5 py-3 font-semibold text-white disabled:opacity-40"
          >
            Kết thúc và chờ kết quả
          </button>
        )}
        {chat && ["expired", "cancelled"].includes(chat.session.status) && (
          <button
            disabled={busy || working || profile.attemptsRemaining <= 0}
            onClick={() => void start()}
            className="mr-3 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            Bắt đầu lần phỏng vấn mới
          </button>
        )}
        {(!active || expired) && chat && (
          <p role="status">
            Phiên đang ở trạng thái{" "}
            {expired ? "hết thời gian" : chat.session.status}. Bạn không thể gửi
            thêm câu trả lời.
          </p>
        )}
        <button
          disabled={busy || working}
          onClick={() => {
            void load();
            void reload();
          }}
          className="mt-4 flex items-center gap-2 text-sm text-blue-700"
        >
          <RefreshCw size={14} />
          Tải lại trạng thái
        </button>
      </div>
    </section>
  );
}
