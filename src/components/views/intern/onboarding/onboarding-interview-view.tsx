"use client";

import * as React from "react";
import {
  Bot,
  CheckCircle2,
  Lightbulb,
  MessageCircleQuestion,
  Send,
  SkipForward,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import { navigate } from "@/lib/client/router";
import { useSession } from "@/lib/client/session";
import {
  recruitmentApi,
  type InterviewConversation,
} from "@/lib/client/api";
import { roleLabels } from "@/lib/client/labels";
import {
  AnimatedProgressBar,
  PageHeader,
  Panel,
  PanelHeader,
  ToneBadge,
  ViewFrame,
} from "@/components/shared/primitives";
import { RoleBadge } from "@/components/shared/badges";
import { ChatBubble, ChatComposer, TypingDots } from "@/components/shared/chat";
import { ErrorBlock, InlineSpinner } from "@/components/shared/states";
import { ConfirmDialog } from "@/components/shared/confirm";
import { CountdownTimer } from "@/components/shared/counters";
import { Button } from "@/components/ui/button";
import { OnboardingStepper } from "./stepper";

type Phase = "boot" | "chat" | "finished" | "evaluating" | "expired" | "error";

const QUESTION_PHASE_LABELS: Record<string, string> = {
  introduction: "Giới thiệu",
  technical: "Kỹ thuật",
  english: "Tiếng Anh",
  communication: "Giao tiếp",
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Trạng thái "generating" (AI đang soạn câu) — kiểm tra qua string cho tương thích contract mở rộng. */
function isGenerating(q: { status: string } | null | undefined): boolean {
  return q?.status === "generating";
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export function OnboardingInterviewView() {
  const { user } = useSession();
  const [phase, setPhase] = React.useState<Phase>("boot");
  const [conv, setConv] = React.useState<InterviewConversation | null>(null);
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [bootError, setBootError] = React.useState<unknown>(null);
  const [reloadKey, setReloadKey] = React.useState(0);

  const [draft, setDraft] = React.useState("");
  const [busyAnswer, setBusyAnswer] = React.useState(false);
  const [busyAction, setBusyAction] = React.useState(false);
  const [awaitNext, setAwaitNext] = React.useState(false);
  const [skipOpen, setSkipOpen] = React.useState(false);
  const [submitOpen, setSubmitOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [evalProgress, setEvalProgress] = React.useState(0);

  const [secondsLeft, setSecondsLeft] = React.useState<number | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  /* --------------------------- core helpers --------------------------- */

  const applyConversation = React.useCallback((c: InterviewConversation) => {
    setConv(c);
    if (c.evaluating || c.session.status === "evaluating") {
      setPhase("evaluating");
      return;
    }
    if (c.session.status === "completed") {
      toast.success("Đã chấm xong bài phỏng vấn — xem kết quả ngay!");
      navigate("/intern/onboarding/result");
      return;
    }
    if (c.session.status === "evaluation_failed" || c.session.status === "expired") {
      setPhase("expired");
      return;
    }
    if (c.currentQuestion) {
      setPhase("chat");
      setAwaitNext(isGenerating(c.currentQuestion));
      return;
    }
    setPhase("finished");
    setAwaitNext(false);
  }, []);

  const resync = React.useCallback(async () => {
    const id = sessionId;
    if (!id) return;
    const c = await recruitmentApi.conversation(id);
    applyConversation(c);
  }, [sessionId, applyConversation]);

  const resyncQuiet = React.useCallback(async () => {
    try {
      await resync();
    } catch {
      /* giữ nguyên trạng thái hiện tại */
    }
  }, [resync]);

  /* ------------------------------ boot ------------------------------ */

  React.useEffect(() => {
    let cancelled = false;
    setPhase("boot");
    setConv(null);
    setSessionId(null);
    setBootError(null);
    (async () => {
      try {
        const me = await recruitmentApi.me();
        if (cancelled) return;

        if (me.currentInterviewSessionId) {
          // Có phiên dở (in_progress / evaluating) → khôi phục hội thoại
          const restored = await recruitmentApi.conversation(me.currentInterviewSessionId);
          if (cancelled) return;
          setSessionId(me.currentInterviewSessionId);
          applyConversation(restored);
          return;
        }

        if (me.status === "not_started") {
          navigate("/intern/onboarding/role", { replace: true });
          return;
        }
        if (me.status === "role_selected") {
          const started = await recruitmentApi.startInterview();
          if (cancelled) return;
          setSessionId(started.session.id);
          toast.success("Buổi phỏng vấn bắt đầu — chúc bạn tự tin!");
          const first = await recruitmentApi.conversation(started.session.id);
          if (cancelled) return;
          applyConversation(first);
          return;
        }
        if (me.status === "evaluation_pending") {
          navigate("/intern/onboarding", { replace: true });
          return;
        }
        // passed / failed → xem kết quả
        navigate("/intern/onboarding/result", { replace: true });
      } catch (err) {
        if (cancelled) return;
        const status = (err as { status?: number }).status;
        if (status === 409) {
          // Đã có phiên chạy trước đó (race) → tải lại trạng thái
          setReloadKey((k) => k + 1);
          return;
        }
        setBootError(err);
        setPhase("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey, applyConversation]);

  /* --------------------------- đồng hồ đếm --------------------------- */

  React.useEffect(() => {
    if (conv?.session) setSecondsLeft(conv.session.secondsRemaining);
  }, [conv?.session]);

  React.useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      if (phase === "chat") void resyncQuiet();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => (s === null ? null : s - 1)), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, phase, resyncQuiet]);

  /* ------------------------------ polls ------------------------------ */

  // Đang chấm: poll 3s đến khi có kết quả
  React.useEffect(() => {
    if (phase !== "evaluating" || !sessionId) return;
    const t = setInterval(async () => {
      try {
        await resync();
      } catch {
        /* thử lại ở chu kỳ sau */
      }
    }, 3000);
    return () => clearInterval(t);
  }, [phase, sessionId, resync]);

  // Câu hỏi đang được AI soạn (generating): poll 2s
  React.useEffect(() => {
    if (phase !== "chat" || !sessionId) return;
    if (!isGenerating(conv?.currentQuestion)) return;
    const t = setInterval(async () => {
      try {
        await resync();
      } catch {
        /* thử lại ở chu kỳ sau */
      }
    }, 2000);
    return () => clearInterval(t);
  }, [phase, sessionId, conv?.currentQuestion?.status, resync]);

  // Thanh tiến trình "fake" mượt trong lúc chờ chấm
  React.useEffect(() => {
    if (phase !== "evaluating") return;
    setEvalProgress(6);
    const t = setInterval(() => {
      setEvalProgress((p) => (p >= 92 ? 92 : p + Math.random() * 7 + 2));
    }, 420);
    return () => clearInterval(t);
  }, [phase]);

  // Tự cuộn xuống cuối hội thoại
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [conv?.messages.length, awaitNext, phase]);

  /* ----------------------------- actions ----------------------------- */

  function appendLocalUserMessage(text: string) {
    setConv((prev) =>
      prev
        ? {
            ...prev,
            messages: [
              ...prev.messages,
              { id: `local_${Date.now()}`, role: "user" as const, content: text, at: new Date().toISOString() },
            ],
          }
        : prev
    );
  }

  async function sendAnswer() {
    if (!sessionId || !conv?.currentQuestion || busyAnswer || awaitNext) return;
    const text = draft.trim();
    if (!text) return;
    const q = conv.currentQuestion;
    setBusyAnswer(true);
    appendLocalUserMessage(text);
    setDraft("");
    setAwaitNext(true);
    try {
      await recruitmentApi.answer(sessionId, q.id, text);
      const nextRes = await recruitmentApi.next(sessionId);
      if (!nextRes.currentQuestion || nextRes.finished) {
        await resync(); // hết câu hỏi → màn nộp bài
      } else if (isGenerating(nextRes.currentQuestion)) {
        await resync(); // giữ TypingDots, poll effect sẽ nhận tiếp
      } else {
        await wait(900); // khoảnh khắc AI "soạn" câu kế
        await resync();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không gửi được câu trả lời — thử lại nhé.");
      try {
        await recruitmentApi.next(sessionId);
      } catch {
        /* bỏ qua */
      }
      await resyncQuiet();
    } finally {
      setBusyAnswer(false);
    }
  }

  async function handleClarify() {
    if (!sessionId || busyAction) return;
    setBusyAction(true);
    try {
      await recruitmentApi.clarify(sessionId);
      await resync();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không lấy được giải thích thêm.");
    } finally {
      setBusyAction(false);
    }
  }

  async function handleSkip() {
    if (!sessionId || busyAction) return;
    setSkipOpen(false);
    setBusyAction(true);
    setAwaitNext(true);
    try {
      const res = await recruitmentApi.skip(sessionId);
      if (res.currentQuestion && !isGenerating(res.currentQuestion)) {
        await wait(700);
      }
      await resync();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không bỏ qua được câu hỏi.");
      await resyncQuiet();
    } finally {
      setBusyAction(false);
    }
  }

  async function handleSubmit() {
    if (!sessionId || submitting) return;
    setSubmitting(true);
    try {
      await recruitmentApi.submit(sessionId);
      setSubmitOpen(false);
      setPhase("evaluating");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không nộp được bài — thử lại.");
      setSubmitOpen(false);
      await resyncQuiet();
    } finally {
      setSubmitting(false);
    }
  }

  /* ------------------------------ render ------------------------------ */

  const currentQuestion = phase === "chat" ? conv?.currentQuestion ?? null : null;
  const answeredCount = conv?.answeredCount ?? 0;
  const totalQuestions = conv?.totalQuestions ?? 0;
  const progressPct = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const canInteract = phase === "chat" && !!currentQuestion && !busyAnswer && !awaitNext;

  const chatBody = (() => {
    if (phase === "boot") {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <span className="grid size-12 place-items-center rounded-2xl border border-brand/30 bg-brand/10 text-brand-bright">
            <Bot className="size-5 icon animate-pulse-soft" />
          </span>
          <p className="text-sm font-semibold text-ink">Đang chuẩn bị phòng phỏng vấn…</p>
          <p className="text-xs text-dim">Đồng bộ câu hỏi và hội thoại của bạn.</p>
        </div>
      );
    }

    if (phase === "error") {
      return (
        <div className="p-5">
          <ErrorBlock
            error={bootError}
            onRetry={() => setReloadKey((k) => k + 1)}
            className="border-0 shadow-none"
          />
        </div>
      );
    }

    if (phase === "expired") {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <span className="grid size-12 place-items-center rounded-2xl border border-rose/30 bg-rose/10 text-rose">
            <Timer className="size-5 icon" />
          </span>
          <p className="text-sm font-semibold text-ink">Phiên phỏng vấn đã đóng</p>
          <p className="max-w-sm text-xs leading-relaxed text-dim">
            Phiên đã hết hạn hoặc bị đóng trước khi nộp bài. Lần thi này không được tính điểm —
            hãy quay lại vòng tuyển dụng để thi lại khi đủ điều kiện.
          </p>
          <Button
            size="sm"
            className="mt-2 rounded-lg bg-brand text-on-brand hover:bg-brand-bright"
            onClick={() => navigate("/intern/onboarding")}
          >
            Về trang tuyển dụng
          </Button>
        </div>
      );
    }

    if (phase === "evaluating") {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          <TypingDots label="AI đang chấm điểm…" />
          <div className="flex items-center gap-2 text-xs text-dim">
            <InlineSpinner /> Đang tổng hợp điểm theo từng tiêu chí
          </div>
          <div className="w-full max-w-sm space-y-3">
            <AnimatedProgressBar value={evalProgress} tone="brand" />
            <p className="text-xs text-dim">
              Hệ thống đang chấm {answeredCount}/{totalQuestions} câu trả lời theo 5 tiêu chí.
              Kết quả sẽ tự mở trong vài giây — bạn không cần làm gì cả.
            </p>
          </div>
        </div>
      );
    }

    return (
      <>
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5">
          {conv?.messages.map((m) => (
            <ChatBubble
              key={m.id}
              role={m.role === "ai" ? "assistant" : "user"}
              name={m.role === "ai" ? "AI Phỏng vấn" : user?.displayName ?? "Bạn"}
              time={fmtTime(m.at)}
            >
              {m.content}
            </ChatBubble>
          ))}
          {awaitNext || busyAnswer ? (
            <TypingDots label={busyAnswer ? "Đang gửi câu trả lời…" : "AI đang soạn câu hỏi tiếp…"} />
          ) : null}
        </div>

        <div className="border-t border-line px-4 py-4 sm:px-5">
          {phase === "finished" ? (
            <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <CheckCircle2 className="size-4 icon text-brand-bright" />
                  Bạn đã trả lời hết {answeredCount}/{totalQuestions} câu hỏi
                </p>
                <p className="mt-0.5 text-xs text-dim">
                  Nộp bài để AI chấm điểm — sau khi nộp sẽ không thể thay đổi câu trả lời.
                </p>
              </div>
              <Button
                className="w-full shrink-0 rounded-lg bg-brand px-5 text-on-brand hover:bg-brand-bright active:scale-[0.98] sm:w-auto"
                onClick={() => setSubmitOpen(true)}
              >
                <Send className="size-4 icon" /> Nộp bài phỏng vấn
              </Button>
            </div>
          ) : (
            <>
              {currentQuestion ? (
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <ToneBadge tone="brand">
                    Câu {currentQuestion.position}/{totalQuestions}
                  </ToneBadge>
                  <ToneBadge tone="zinc">
                    {QUESTION_PHASE_LABELS[currentQuestion.phase] ?? currentQuestion.phase}
                  </ToneBadge>
                  {currentQuestion.kind === "follow_up" ? (
                    <ToneBadge tone="teal">Câu hỏi phụ</ToneBadge>
                  ) : null}
                </div>
              ) : null}
              <ChatComposer
                value={draft}
                onChange={setDraft}
                onSubmit={() => void sendAnswer()}
                busy={busyAnswer}
                disabled={!canInteract}
                placeholder={
                  canInteract
                    ? "Nhập câu trả lời của bạn…"
                    : awaitNext
                      ? "AI đang soạn câu hỏi tiếp…"
                      : "Đang chờ câu hỏi…"
                }
                submitLabel="Gửi trả lời"
                rows={3}
              />
            </>
          )}
        </div>
      </>
    );
  })();

  const sideBusy = busyAction || busyAnswer || awaitNext || phase !== "chat";

  return (
    <ViewFrame>
      <PageHeader
        eyebrow="Vòng tuyển dụng · Bước 3"
        title="Phỏng vấn AI đầu vào"
        description="Trò chuyện với AI phỏng vấn viên — trả lời tự nhiên, đi thẳng vào trọng tâm. Câu hỏi bị bỏ qua sẽ không được tính điểm."
      />

      <div className="space-y-5">
        <OnboardingStepper current={2} />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Panel className="flex h-[64vh] min-h-[440px] flex-col overflow-hidden lg:h-[calc(100vh-330px)] lg:min-h-[540px]">
            <PanelHeader
              icon={<Bot className="size-4 icon" />}
              title={`Buổi phỏng vấn AI${conv ? ` · Lần #${conv.session.attemptNumber}` : ""}`}
              description="Trả lời như đang trò chuyện — không có câu trả lời hoàn hảo tuyệt đối."
              actions={
                <div className="lg:hidden">
                  <CountdownTimer secondsRemaining={secondsLeft ?? 0} warnUnder={300} />
                </div>
              }
            />
            {chatBody}
          </Panel>

          <div className="space-y-4">
            <Panel className="p-5">
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-dim">
                Trạng thái buổi phỏng vấn
              </h3>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-xs text-dim">Thời gian còn lại</span>
                <CountdownTimer secondsRemaining={secondsLeft ?? 0} warnUnder={300} />
              </div>
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-xs text-dim">Tiến độ</span>
                  <span className="font-mono text-xs font-semibold text-ink">
                    {answeredCount}/{totalQuestions} câu
                  </span>
                </div>
                <AnimatedProgressBar value={progressPct} tone="brand" showLabel />
              </div>
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
                <span className="text-xs text-dim">Vai trò ứng tuyển</span>
                {conv ? (
                  <RoleBadge role={conv.session.roleCode} />
                ) : (
                  <span className="text-xs text-faint">Đang tải…</span>
                )}
              </div>
            </Panel>

            <Panel className="space-y-2.5 p-5">
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-dim">
                Công cụ hỗ trợ
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start rounded-lg border-line bg-transparent text-dim hover:border-line-strong hover:bg-panel-2 hover:text-ink"
                disabled={sideBusy}
                onClick={() => void handleClarify()}
              >
                <MessageCircleQuestion className="size-4 icon" />
                {busyAction ? "Đang xử lý…" : "Giải thích lại câu hỏi"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start rounded-lg border-line bg-transparent text-dim hover:border-rose/40 hover:bg-rose/[0.06] hover:text-rose disabled:hover:bg-transparent disabled:hover:text-dim"
                disabled={sideBusy}
                onClick={() => setSkipOpen(true)}
              >
                <SkipForward className="size-4 icon" />
                Bỏ qua câu hiện tại
              </Button>
              <p className="pt-1 text-[11px] leading-relaxed text-faint">
                Câu bị bỏ qua sẽ không được tính điểm. Giải thích lại chỉ làm rõ thêm câu hỏi,
                không đổi nội dung cần trả lời.
              </p>
            </Panel>

            <Panel className="relative overflow-hidden p-5">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/[0.07] via-transparent to-transparent" />
              <div className="relative flex gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-amber/10 text-amber">
                  <Lightbulb className="size-4 icon" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-ink">Mẹo trả lời tốt hơn</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-dim">
                    Trình bày theo cấu trúc: ý chính → cơ chế → ví dụ thực tế. Câu tiếng Anh chỉ
                    cần 3–5 câu đủ ý là đạt.
                  </p>
                </div>
              </div>
            </Panel>

            {conv ? (
              <p className="px-1 text-center text-[11px] text-faint">
                Vai trò {roleLabels[conv.session.roleCode] ?? conv.session.roleCode} · Bắt đầu{" "}
                {fmtTime(conv.session.startedAt)} · ID phiên{" "}
                <span className="font-mono">{conv.session.id}</span>
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={skipOpen}
        onOpenChange={setSkipOpen}
        title="Bỏ qua câu hỏi này?"
        description="Câu hỏi sẽ bị đánh dấu bỏ qua và không được tính điểm. Bạn không thể quay lại câu này sau khi bỏ qua."
        confirmLabel="Bỏ qua câu hỏi"
        destructive
        busy={busyAction}
        onConfirm={() => void handleSkip()}
      />

      <ConfirmDialog
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        title="Nộp bài phỏng vấn?"
        description={
          <>
            Bạn đã trả lời <span className="font-semibold text-ink">{answeredCount}/{totalQuestions}</span>{" "}
            câu hỏi. Sau khi nộp, AI sẽ chấm điểm ngay và bạn không thể thay đổi câu trả lời nào nữa.
          </>
        }
        confirmLabel="Nộp bài ngay"
        busy={submitting}
        onConfirm={() => void handleSubmit()}
      />
    </ViewFrame>
  );
}
