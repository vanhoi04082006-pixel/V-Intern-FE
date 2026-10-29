"use client";

/**
 * Phỏng vấn đầu vào — hành trình nhiều bước:
 * chọn vai trò nghề → phỏng vấn AI (hội thoại + trả lời từng câu) → kết quả.
 * Trạng thái điều khiển bằng recruitment/me (none → role_selected → in_progress → passed/failed).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Loader2,
  MessageCircleQuestion,
  Send,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  askClarification,
  fetchCareerRoleCatalog,
  fetchInterview,
  fetchInterviewConversation,
  fetchInterviewQuestions,
  fetchMyInterviews,
  fetchRecruitmentProfile,
  fetchRecruitmentResult,
  requestNextQuestion,
  retryInterviewEvaluation,
  saveFollowUp,
  saveInterviewAnswer,
  selectRecruitmentRole,
  startInterview,
  submitInterview,
  type ConversationTurn,
  type InterviewQuestion,
  type InterviewSummary,
  type RecruitmentProfile,
} from "@/lib/api/recruitment";
import { errorMessage } from "@/lib/api/transport";
import { fmtDate, fmtDateTime } from "@/lib/api/client";
import {
  Chip,
  ErrorState,
  LoadingState,
  PageHeader,
  ProgressBar,
  SectionCard,
  StatusBadge,
} from "@/components/shared/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const SECTION_LABELS: Record<string, string> = {
  technical: "Kỹ thuật",
  soft: "Kỹ năng mềm",
  soft_skill: "Kỹ năng mềm",
  soft_skills: "Kỹ năng mềm",
  behavioral: "Hành vi",
  intro: "Giới thiệu",
  introduction: "Giới thiệu",
  project: "Đồ án",
  general: "Chung",
};

const PRIMARY_BTN =
  "h-12 rounded-xl border-2 border-ink bg-royal px-6 font-bold text-white shadow-[4px_4px_0_0_var(--ink)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5";

/* ─────────────────── Bước 1: chọn vai trò nghề ─────────────────── */

function RoleCatalogStep() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: roles, isLoading, error, refetch } = useQuery({
    queryKey: ["career-roles"],
    queryFn: ({ signal }) => fetchCareerRoleCatalog(signal),
  });

  const selectRole = useMutation({
    mutationFn: (code: string) => selectRecruitmentRole(code),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["recruitment-profile"] });
      toast({ title: "Đã chọn vai trò ✦", description: "Giờ thì bắt đầu buổi phỏng vấn AI nhé!" });
    },
    onError: (e) =>
      toast({ title: "Chưa chọn được vai trò", description: errorMessage(e), variant: "destructive" }),
  });

  return (
    <SectionCard>
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-blue/40 bg-blue-mist text-blue">
          <Bot className="h-8 w-8" aria-hidden="true" />
        </span>
        <div>
          <p className="text-lg font-extrabold text-ink">Phỏng vấn AI đầu vào</p>
          <p className="mx-auto mt-1.5 max-w-xl text-[13px] leading-relaxed text-ink-soft">
            Trước khi bắt đầu hành trình thực tập, bạn sẽ trò chuyện với người phỏng vấn AI: trả lời
            lần lượt các câu hỏi về chuyên môn và kỹ năng mềm. Hệ thống chấm điểm ngay sau khi bạn
            nộp bài — không căng thẳng, cứ thoải mái như đang nói chuyện nhé!
          </p>
          <p className="mt-2 font-hand text-[15px] text-ink-faint">
            mẹo nhỏ: trả lời chân thành và có ví dụ cụ thể sẽ được điểm cao hơn đấy ✦
          </p>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="mb-3 text-base font-extrabold text-ink">
          Chọn vai trò nghề bạn muốn ứng tuyển
        </h3>
        {isLoading ? (
          <LoadingState label="Đang tải danh sách vai trò…" />
        ) : error ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : !roles || roles.length === 0 ? (
          <p className="rounded-2xl border-2 border-dashed border-ink/15 bg-paper px-6 py-8 text-center text-sm text-ink-soft">
            Hiện chưa có vai trò nghề nào mở ứng tuyển. Bạn quay lại sau nhé!
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {roles.map((role) => (
              <div
                key={role.code}
                className={cn(
                  "flex flex-col gap-3 rounded-2xl border-2 border-ink/12 bg-paper p-5 shadow-[3px_3px_0_0_rgba(23,23,28,0.06)] transition-all",
                  role.acceptingApplications && "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-blue/40",
                  !role.acceptingApplications && "opacity-60",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-[11px] font-bold uppercase tracking-wide text-blue">{role.code}</p>
                    <p className="mt-0.5 text-base font-extrabold leading-snug text-ink">{role.name}</p>
                  </div>
                  <Chip tone="blue">{role.level}</Chip>
                </div>
                {role.description ? (
                  <p className="text-[13px] leading-relaxed text-ink-soft">{role.description}</p>
                ) : null}
                <div className="flex flex-wrap gap-1.5">
                  {role.requiredSkills.map((skill) => (
                    <Chip key={skill}>{skill}</Chip>
                  ))}
                </div>
                <Button
                  className={cn(PRIMARY_BTN, "mt-auto h-11 self-start px-5 text-sm")}
                  disabled={!role.acceptingApplications || selectRole.isPending}
                  onClick={() => selectRole.mutate(role.code)}
                >
                  {selectRole.isPending && selectRole.variables === role.code ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                  )}
                  {role.acceptingApplications ? "Chọn vai trò này" : "Đang đóng ứng tuyển"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </SectionCard>
  );
}

/* ─────────────────── Bước 2: buổi phỏng vấn AI ─────────────────── */

function ConversationBubbles({ turns }: { turns: ConversationTurn[] }) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [turns.length]);

  const visible = turns.filter((t) => t.role !== "system");

  return (
    <div className="max-h-[46vh] space-y-3 overflow-y-auto rounded-2xl border-2 border-dashed border-ink/15 bg-paper p-4">
      {visible.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-ink-faint">
          Buổi phỏng vấn sẽ bắt đầu khi bạn sang câu đầu tiên nhé.
        </p>
      ) : (
        visible.map((turn, i) => (
          <div key={i} className={cn("flex", turn.role === "candidate" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] whitespace-pre-wrap rounded-2xl border-2 px-4 py-2.5 text-sm leading-relaxed",
                turn.role === "candidate"
                  ? "border-ink bg-ink text-white"
                  : "border-blue/30 bg-blue-mist text-ink",
              )}
            >
              {turn.content}
            </div>
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
}

function ActiveInterview({ interviewId }: { interviewId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: interview, isLoading: loadingInterview } = useQuery({
    queryKey: ["interview", interviewId],
    queryFn: ({ signal }) => fetchInterview(interviewId, signal),
  });

  const { data: questions, isLoading: loadingQuestions } = useQuery({
    queryKey: ["interview-questions", interviewId],
    queryFn: ({ signal }) => fetchInterviewQuestions(interviewId, signal),
  });

  const { data: turns = [] } = useQuery({
    queryKey: ["interview-conversation", interviewId],
    queryFn: ({ signal }) => fetchInterviewConversation(interviewId, signal),
  });

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, string>>({});
  const [savedFollowUps, setSavedFollowUps] = useState<Record<string, boolean>>({});
  const [activeQId, setActiveQId] = useState<string | null>(null);
  const [clarifyInput, setClarifyInput] = useState("");

  const sorted = useMemo(
    () => [...(questions ?? [])].sort((a, b) => a.order - b.order),
    [questions],
  );

  const currentQ: InterviewQuestion | null = activeQId
    ? (sorted.find((q) => q.id === activeQId) ?? null)
    : (sorted.find((q) => !q.answerText) ?? null);

  const answeredCount = interview?.answeredCount ?? sorted.filter((q) => q.answerText).length;
  const questionCount = interview?.questionCount ?? Math.max(sorted.length, 1);
  const allAnswered = sorted.length > 0 && sorted.every((q) => (q.answerText ?? "").trim().length > 0);

  const invalidateInterview = () => {
    void queryClient.invalidateQueries({ queryKey: ["interview", interviewId] });
    void queryClient.invalidateQueries({ queryKey: ["interview-questions", interviewId] });
    void queryClient.invalidateQueries({ queryKey: ["interview-conversation", interviewId] });
    void queryClient.invalidateQueries({ queryKey: ["my-interviews"] });
  };

  const saveAnswer = useMutation({
    mutationFn: ({ questionId, answerText }: { questionId: string; answerText: string }) =>
      saveInterviewAnswer(interviewId, questionId, answerText),
    onSuccess: () => {
      setActiveQId(null);
      invalidateInterview();
      toast({ title: "Đã lưu câu trả lời ✦" });
    },
    onError: (e) =>
      toast({ title: "Chưa lưu được câu trả lời", description: errorMessage(e), variant: "destructive" }),
  });

  const nextQuestion = useMutation({
    mutationFn: () => requestNextQuestion(interviewId),
    onSuccess: (next) => {
      setActiveQId(next?.id ?? null);
      invalidateInterview();
    },
    onError: (e) =>
      toast({ title: "Chưa lấy được câu tiếp theo", description: errorMessage(e), variant: "destructive" }),
  });

  const clarify = useMutation({
    mutationFn: (question: string) => askClarification(interviewId, question),
    onSuccess: ({ reply }) => {
      setClarifyInput("");
      void queryClient.invalidateQueries({ queryKey: ["interview-conversation", interviewId] });
      toast({ title: "AI Mentor đã trả lời", description: reply.slice(0, 120) + (reply.length > 120 ? "…" : "") });
    },
    onError: (e) =>
      toast({ title: "Chưa hỏi được", description: errorMessage(e), variant: "destructive" }),
  });

  const saveFollowUpAnswer = useMutation({
    mutationFn: ({ questionId, answerText }: { questionId: string; answerText: string }) =>
      saveFollowUp(interviewId, questionId, answerText),
    onSuccess: (_data, variables) => {
      setSavedFollowUps((prev) => ({ ...prev, [variables.questionId]: true }));
      invalidateInterview();
      toast({ title: "Đã lưu câu trả lời bổ sung ✦" });
    },
    onError: (e) =>
      toast({ title: "Chưa lưu được phần bổ sung", description: errorMessage(e), variant: "destructive" }),
  });

  const submit = useMutation({
    mutationFn: () => submitInterview(interviewId),
    onSuccess: () => {
      invalidateInterview();
      void queryClient.invalidateQueries({ queryKey: ["recruitment-profile"] });
      void queryClient.invalidateQueries({ queryKey: ["recruitment-result"] });
      toast({ title: "Đã nộp bài phỏng vấn ✦", description: "Hệ thống đang chấm điểm, chờ chút nhé!" });
    },
    onError: (e) =>
      toast({ title: "Chưa nộp được bài", description: errorMessage(e), variant: "destructive" }),
  });

  if (loadingInterview || loadingQuestions) {
    return <LoadingState label="Đang tải buổi phỏng vấn…" />;
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Buổi phỏng vấn AI"
        description="Trả lời từng câu hỏi của người phỏng vấn — bạn có thể hỏi làm rõ bất cứ lúc nào."
      >
        <div className="space-y-4">
          <ProgressBar label={`Đã trả lời ${answeredCount}/${questionCount} câu`} value={answeredCount} max={questionCount} />
          <ConversationBubbles turns={turns} />
        </div>
      </SectionCard>

      {currentQ ? (
        <SectionCard
          title={`Câu hỏi hiện tại`}
          description={`Mục: ${SECTION_LABELS[currentQ.section] ?? currentQ.section}`}
          actions={<Chip tone="blue">Câu số {currentQ.order}</Chip>}
        >
          <div className="space-y-4">
            <p className="rounded-2xl border-2 border-blue/30 bg-blue-mist/60 p-4 text-[15px] font-bold leading-relaxed text-ink">
              {currentQ.prompt}
            </p>

            <div className="space-y-2">
              <label htmlFor="interview-answer" className="text-[13px] font-bold text-ink">
                Câu trả lời của bạn
              </label>
              <Textarea
                id="interview-answer"
                rows={6}
                value={answers[currentQ.id] ?? currentQ.answerText ?? ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [currentQ.id]: e.target.value }))}
                placeholder="Viết câu trả lời của bạn ở đây… cứ nói chuyện tự nhiên như với người thật nhé."
                className="min-h-32 rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25"
              />
            </div>

            {currentQ.followUp ? (
              <div className="space-y-2 rounded-2xl border-2 border-dashed border-amber-400/60 bg-amber-50/60 p-4">
                <p className="text-[13px] font-extrabold text-amber-700">
                  Câu hỏi bổ sung từ người phỏng vấn:
                </p>
                <p className="text-sm font-bold leading-relaxed text-ink">{currentQ.followUp}</p>
                <Textarea
                  rows={3}
                  value={followUpAnswers[currentQ.id] ?? ""}
                  onChange={(e) => setFollowUpAnswers((prev) => ({ ...prev, [currentQ.id]: e.target.value }))}
                  placeholder="Trả lời thêm phần này nhé…"
                  className="rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 border-amber-400/70 text-amber-700 hover:bg-amber-50"
                  disabled={!(followUpAnswers[currentQ.id] ?? "").trim() || saveFollowUpAnswer.isPending}
                  onClick={() =>
                    saveFollowUpAnswer.mutate({
                      questionId: currentQ.id,
                      answerText: (followUpAnswers[currentQ.id] ?? "").trim(),
                    })
                  }
                >
                  {saveFollowUpAnswer.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : null}
                  {savedFollowUps[currentQ.id] ? "Lưu lại chỉnh sửa" : "Gửi câu trả lời bổ sung"}
                </Button>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <Button
                className="gap-2"
                disabled={!(answers[currentQ.id] ?? currentQ.answerText ?? "").trim() || saveAnswer.isPending}
                onClick={() =>
                  saveAnswer.mutate({
                    questionId: currentQ.id,
                    answerText: (answers[currentQ.id] ?? currentQ.answerText ?? "").trim(),
                  })
                }
              >
                {saveAnswer.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                )}
                Lưu câu trả lời
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                disabled={nextQuestion.isPending}
                onClick={() => nextQuestion.mutate()}
              >
                {nextQuestion.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                )}
                Câu tiếp theo
              </Button>
            </div>

            <div className="flex flex-col gap-2 rounded-2xl border-2 border-dashed border-ink/15 bg-paper p-4 sm:flex-row sm:items-center">
              <Input
                value={clarifyInput}
                onChange={(e) => setClarifyInput(e.target.value)}
                placeholder="Chưa rõ câu hỏi? Hỏi người phỏng vấn ở đây…"
                className="h-11 flex-1 rounded-xl border-2 border-ink/20 bg-raised px-4 text-sm font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/25"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && clarifyInput.trim()) clarify.mutate(clarifyInput.trim());
                }}
              />
              <Button
                variant="outline"
                className="h-11 gap-2"
                disabled={!clarifyInput.trim() || clarify.isPending}
                onClick={() => clarify.mutate(clarifyInput.trim())}
              >
                {clarify.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <MessageCircleQuestion className="h-4 w-4" aria-hidden="true" />
                )}
                Hỏi làm rõ
              </Button>
            </div>
          </div>
        </SectionCard>
      ) : (
        <SectionCard title="Hoàn thành phần trả lời" description="Tuyệt vời — bạn đã trả lời hết các câu hỏi!">
          <p className="text-sm leading-relaxed text-ink-soft">
            Kiểm tra lại hội thoại phía trên rồi nộp bài nhé. Sau khi nộp, hệ thống sẽ chấm điểm kỹ
            thuật và kỹ năng mềm của bạn.
          </p>
        </SectionCard>
      )}

      <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-ink/12 bg-paper-raised p-6 text-center shadow-[3px_3px_0_0_rgba(23,23,28,0.06)]">
        <p className="text-sm font-bold text-ink">
          {allAnswered
            ? "Bạn đã sẵn sàng nộp bài phỏng vấn!"
            : "Nộp bài khi đã trả lời đủ các câu hỏi nhé."}
        </p>
        <p className="font-hand text-[15px] text-ink-faint">sau khi nộp là không sửa được nữa đâu, đọc kỹ lại nha</p>
        <Button
          className={cn(PRIMARY_BTN, "gap-2")}
          disabled={!allAnswered || submit.isPending}
          onClick={() => submit.mutate()}
        >
          {submit.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-4 w-4" aria-hidden="true" />
          )}
          Nộp bài phỏng vấn
        </Button>
      </div>
    </div>
  );
}

function InterviewStep({ interviews }: { interviews: InterviewSummary[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const active = interviews.find((i) => i.status === "in_progress") ?? null;
  const past = interviews.filter((i) => i.status !== "in_progress");

  const start = useMutation({
    mutationFn: () => startInterview(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-interviews"] });
      void queryClient.invalidateQueries({ queryKey: ["recruitment-profile"] });
      toast({ title: "Bắt đầu buổi phỏng vấn ✦", description: "Thở sâu và cứ tự nhiên nhé!" });
    },
    onError: (e) =>
      toast({ title: "Chưa bắt đầu được", description: errorMessage(e), variant: "destructive" }),
  });

  if (active) return <ActiveInterview interviewId={active.id} />;

  return (
    <div className="space-y-6">
      <SectionCard>
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-ink/25 bg-paper text-blue">
            <BrainCircuit className="h-8 w-8" aria-hidden="true" />
          </span>
          <div>
            <p className="text-lg font-extrabold text-ink">Sẵn sàng chưa?</p>
            <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-ink-soft">
              Buổi phỏng vấn gồm các câu hỏi kỹ thuật và kỹ năng mềm. Bạn có thể hỏi làm rõ nếu chưa
              hiểu, và câu trả lời sẽ được lưu dần nên không sợ mất bài.
            </p>
          </div>
          <Button className={cn(PRIMARY_BTN, "gap-2")} disabled={start.isPending} onClick={() => start.mutate()}>
            {start.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Bot className="h-4 w-4" aria-hidden="true" />
            )}
            Bắt đầu phỏng vấn
          </Button>
        </div>
      </SectionCard>

      {past.length > 0 ? (
        <SectionCard title="Các buổi phỏng vấn trước" description="Lịch sử những lần thử của bạn.">
          <ul className="space-y-2">
            {past.map((i) => (
              <li
                key={i.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-ink/10 bg-paper px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={i.status} />
                  <span className="text-[13px] font-bold text-ink">{fmtDateTime(i.startedAt)}</span>
                </div>
                <span className="text-[13px] font-extrabold text-ink-soft">
                  {i.overallScore != null ? `${i.overallScore}/10 điểm` : "Chưa có điểm"}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}
    </div>
  );
}

/* ─────────────────── Bước 3: kết quả ─────────────────── */

function ResultStep({ profile, interviews }: { profile: RecruitmentProfile; interviews: InterviewSummary[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: result, isLoading, refetch } = useQuery({
    queryKey: ["recruitment-result"],
    queryFn: ({ signal }) => fetchRecruitmentResult(signal),
  });

  const retry = useMutation({
    mutationFn: (interviewId: string) => retryInterviewEvaluation(interviewId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["recruitment-result"] });
      void queryClient.invalidateQueries({ queryKey: ["my-interviews"] });
      void queryClient.invalidateQueries({ queryKey: ["recruitment-profile"] });
      toast({ title: "Đã gửi yêu cầu chấm lại ✦", description: "Đợi vài giây rồi tải lại nhé." });
    },
    onError: (e) =>
      toast({ title: "Chưa chấm lại được", description: errorMessage(e), variant: "destructive" }),
  });

  const startAgain = useMutation({
    mutationFn: () => startInterview(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-interviews"] });
      void queryClient.invalidateQueries({ queryKey: ["recruitment-profile"] });
      toast({ title: "Bắt đầu buổi phỏng vấn mới ✦", description: "Lần này sẽ ổn hơn thôi!" });
    },
    onError: (e) =>
      toast({ title: "Chưa bắt đầu được", description: errorMessage(e), variant: "destructive" }),
  });

  if (isLoading) return <LoadingState label="Đang tải kết quả phỏng vấn…" />;

  const fallback = profile.latestResult
    ? {
        status: profile.latestResult.status,
        passed: profile.latestResult.passed,
        overallScore: profile.latestResult.overallScore,
        technicalScore: null as number | null,
        softScore: null as number | null,
        decisionNote: null as string | null,
        evaluatedAt: null as string | null,
      }
    : null;
  const data = result ?? fallback;
  const latestInterviewId = interviews[0]?.id ?? null;
  const inCooldown =
    profile.cooldownUntil != null && new Date(profile.cooldownUntil).getTime() > Date.now();
  const canRetry =
    !profile.latestResult?.passed &&
    !inCooldown &&
    profile.attemptsUsed < profile.maxAttempts;

  if (!data || (data.overallScore == null && !data.decisionNote && data.status !== "failed" && data.status !== "passed")) {
    return (
      <SectionCard>
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-ink/25 bg-paper text-blue">
            <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
          </span>
          <div>
            <p className="text-lg font-extrabold text-ink">Đang chấm bài phỏng vấn…</p>
            <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-ink-soft">
              AI đang đọc các câu trả lời của bạn. Thường chỉ mất ít phút — nếu chờ lâu, bạn bấm
              “Chấm lại” giúp mình nhé.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => void refetch()}>
              Tải lại kết quả
            </Button>
            {latestInterviewId ? (
              <Button className="gap-2" disabled={retry.isPending} onClick={() => retry.mutate(latestInterviewId)}>
                {retry.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                Chấm lại
              </Button>
            ) : null}
          </div>
        </div>
      </SectionCard>
    );
  }

  const passed = data.passed || data.status === "passed";

  return (
    <div className="space-y-6">
      <SectionCard>
        <div className="flex flex-col items-center gap-5 py-6 text-center">
          <span
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-2xl border-2",
              passed
                ? "border-emerald-400/60 bg-emerald-50 text-emerald-600"
                : "border-rose-300 bg-rose-50 text-rose-500",
            )}
          >
            {passed ? (
              <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
            ) : (
              <XCircle className="h-8 w-8" aria-hidden="true" />
            )}
          </span>
          <div>
            <div className="flex items-center justify-center gap-2">
              <p className="text-lg font-extrabold text-ink">
                {passed ? "Chúc mừng — bạn đã ĐẠT!" : "Chưa đạt lần này"}
              </p>
              <StatusBadge status={passed ? "passed" : "failed"} />
            </div>
            <p className="mt-1.5 text-[13px] text-ink-soft">
              {data.evaluatedAt ? `Kết quả chấm ngày ${fmtDateTime(data.evaluatedAt)}` : null}
            </p>
          </div>

          <div className="flex flex-wrap items-end justify-center gap-8">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-ink-faint">Tổng điểm</p>
              <p className="text-5xl font-extrabold leading-none text-blue">
                {data.overallScore ?? "—"}
                <span className="text-2xl text-ink-faint">/10</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-ink-faint">Điểm kỹ thuật</p>
              <p className="text-3xl font-extrabold leading-none text-ink">
                {data.technicalScore ?? "—"}
                <span className="text-base text-ink-faint">/10</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-ink-faint">Điểm kỹ năng mềm</p>
              <p className="text-3xl font-extrabold leading-none text-ink">
                {data.softScore ?? "—"}
                <span className="text-base text-ink-faint">/10</span>
              </p>
            </div>
          </div>

          {data.decisionNote ? (
            <blockquote className="max-w-xl rounded-2xl border-2 border-dashed border-blue/40 bg-blue-mist/50 p-4 text-left text-sm italic leading-relaxed text-ink">
              “{data.decisionNote}”
            </blockquote>
          ) : null}

          {passed ? (
            <p className="max-w-md text-[13px] leading-relaxed text-ink-soft">
              Bạn đã hoàn thành vòng phỏng vấn đầu vào. Hãy đợi mentor phân công đồ án — sau đó
              bảng điều khiển sẽ hiện roadmap của riêng bạn ✦
            </p>
          ) : (
            <div className="space-y-1.5 text-center">
              <p className="text-sm font-bold text-ink">Lượt thử: {profile.attemptsUsed}/{profile.maxAttempts}</p>
              {inCooldown ? (
                <p className="text-[13px] text-amber-700">
                  Bạn có thể thử lại sau ngày {fmtDate(profile.cooldownUntil)}. Dùng thời gian này ôn
                  luyện thêm nhé!
                </p>
              ) : canRetry ? (
                <Button
                  className={cn(PRIMARY_BTN, "mt-2 gap-2")}
                  disabled={startAgain.isPending}
                  onClick={() => startAgain.mutate()}
                >
                  {startAgain.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <BrainCircuit className="h-4 w-4" aria-hidden="true" />
                  )}
                  Phỏng vấn lại
                </Button>
              ) : (
                <p className="text-[13px] text-ink-soft">
                  Bạn đã dùng hết lượt thử. Liên hệ mentor hoặc quản trị viên để được hỗ trợ thêm nhé.
                </p>
              )}
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

/* ─────────────────── View chính ─────────────────── */

export function RecruitmentView() {
  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: ["recruitment-profile"],
    queryFn: ({ signal }) => fetchRecruitmentProfile(signal),
  });

  const { data: interviews = [] } = useQuery({
    queryKey: ["my-interviews"],
    queryFn: ({ signal }) => fetchMyInterviews(signal),
    enabled: !!profile && profile.status !== "none",
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Phỏng vấn đầu vào"
        description="Chọn vai trò nghề, trò chuyện cùng người phỏng vấn AI và nhận kết quả chấm điểm ngay sau khi nộp bài."
        actions={
          profile ? <Chip tone="blue">Lượt thử: {profile.attemptsUsed}/{profile.maxAttempts}</Chip> : undefined
        }
      />

      {isLoading ? (
        <LoadingState label="Đang tải hành trình phỏng vấn…" />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : !profile ? null : profile.status === "none" ? (
        <RoleCatalogStep />
      ) : profile.status === "passed" || profile.status === "failed" ? (
        interviews.some((i) => i.status === "in_progress") ? (
          <InterviewStep interviews={interviews} />
        ) : (
          <ResultStep profile={profile} interviews={interviews} />
        )
      ) : (
        <InterviewStep interviews={interviews} />
      )}
    </div>
  );
}
