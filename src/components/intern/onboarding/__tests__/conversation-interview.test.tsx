import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ConversationInterview } from "../conversation-interview";

const mocks = vi.hoisted(() => ({
  view: vi.fn(),
  next: vi.fn(),
  clarify: vi.fn(),
  start: vi.fn(),
  saveAnswer: vi.fn(),
  submit: vi.fn(),
  reload: vi.fn(),
  attemptsRemaining: 2,
  scheduled: false,
}));
vi.mock("@/lib/api/recruitment", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/recruitment")>()),
  conversationView: mocks.view,
  conversationNext: mocks.next,
  conversationClarify: mocks.clarify,
}));
vi.mock("../recruitment-provider", () => ({
  useRecruitmentFlow: () => ({
    interview: { session: { id: "session-1", questionCount: 10 } },
    profile: { attemptsRemaining: mocks.attemptsRemaining,interviewSchedule:mocks.scheduled?{managed:true}:undefined },
    busy: false,
    notice: null,
    start: mocks.start,
    saveAnswer: mocks.saveAnswer,
    submit: mocks.submit,
    reload: mocks.reload,
  }),
}));

function conversation(status: "expired" | "cancelled" | "in_progress") {
  return {
    session: {
      id: "session-1",
      questionCount: 10,
      status,
      serverNow: new Date().toISOString(),
      secondsRemaining: status === "in_progress" ? 600 : null,
      expiresAt: null,
    },
    messages: [
      {
        questionId: "q1",
        position: 1,
        role: "assistant",
        content: "Your persisted question",
      },
      {
        questionId: "q1",
        position: 1,
        role: "user",
        content: "Your persisted answer",
      },
    ],
    answeredCount: 1,
    currentQuestion: {
      id: "q2",
      position: 2,
      phase: "technical",
      status: "not_started",
      errorCode: null,
    },
  };
}
it('requires a fresh scheduled appointment after a managed interview expires',async()=>{
  mocks.scheduled=true;mocks.view.mockResolvedValue(conversation('expired'));
  render(<ConversationInterview/>);
  expect(await screen.findByRole('link',{name:'Xem lịch phỏng vấn tiếp theo'})).toHaveAttribute('href','/intern/onboarding/role');
  expect(screen.queryByRole('button',{name:'Bắt đầu lần phỏng vấn mới'})).not.toBeInTheDocument();expect(mocks.start).not.toHaveBeenCalled();
});
beforeEach(() => {
  vi.clearAllMocks();
  mocks.attemptsRemaining = 2;
  mocks.scheduled=false;
  const ready = conversation('in_progress');
  ready.currentQuestion.status = 'ready';
  mocks.next.mockResolvedValue(ready);
});

describe("conversation recovery", () => {
  it('requests the first delivered question automatically after starting an active interview', async () => {
    const initial = conversation('in_progress');
    mocks.view.mockResolvedValue(initial);
    mocks.next.mockResolvedValue({ ...initial, currentQuestion: { ...initial.currentQuestion, status: 'ready' }, messages: [...initial.messages, { questionId: 'q2', role: 'assistant', position: 2, content: 'AI asks the current server question.' }] });
    render(<ConversationInterview />);
    expect(await screen.findByText('AI asks the current server question.')).toBeInTheDocument();
    expect(mocks.next).toHaveBeenCalledExactlyOnceWith('session-1');
    expect(screen.getByRole('textbox', { name: 'Tin nhắn của bạn' })).toBeEnabled();
    expect(mocks.saveAnswer).not.toHaveBeenCalled();
  });
  it('keeps a failed delivery recoverable without automatically retrying the provider', async () => {
    const failed = conversation('in_progress');
    failed.currentQuestion.status = 'failed';
    mocks.view.mockResolvedValue(failed);
    render(<ConversationInterview />);
    expect(await screen.findByRole('button', { name: 'Thử lại câu hỏi' })).toBeEnabled();
    expect(mocks.next).not.toHaveBeenCalled();
    expect(screen.getByText('Your persisted answer')).toBeInTheDocument();
  });
  it('shows and updates the countdown from the server-provided remaining time', async () => {
    vi.useFakeTimers();
    const payload = conversation('in_progress');
    payload.currentQuestion.status = 'ready';
    mocks.view.mockResolvedValue(payload);
    const view = render(<ConversationInterview />);
    try {
      await act(async () => { await vi.advanceTimersByTimeAsync(0); });
      expect(screen.getByLabelText('Thời gian còn lại')).toHaveTextContent('10:00');
      await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
      expect(screen.getByLabelText('Thời gian còn lại')).toHaveTextContent('9:59');
    } finally { view.unmount(); vi.useRealTimers(); }
  });
  it.each(["expired", "cancelled"] as const)(
    "allows restarting a server-confirmed %s session and retains its transcript",
    async (status) => {
      mocks.view.mockResolvedValue(conversation(status));
      render(<ConversationInterview />);
      const restart = await screen.findByRole("button", {
        name: "Bắt đầu lần phỏng vấn mới",
      });
      expect(screen.getByText("Your persisted answer")).toBeInTheDocument();
      fireEvent.click(restart);
      expect(mocks.start).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    },
  );

  it("does not permit a restart after the last attempt", async () => {
    mocks.attemptsRemaining = 0;
    mocks.view.mockResolvedValue(conversation("expired"));
    render(<ConversationInterview />);
    expect(
      await screen.findByRole("button", { name: "Bắt đầu lần phỏng vấn mới" }),
    ).toBeDisabled();
    expect(mocks.start).not.toHaveBeenCalled();
  });

  it("does not offer a new attempt while a session remains active", async () => {
    mocks.view.mockResolvedValue(conversation("in_progress"));
    render(<ConversationInterview />);
    await screen.findByText("Your persisted answer");
    expect(
      screen.queryByRole("button", { name: "Bắt đầu lần phỏng vấn mới" }),
    ).not.toBeInTheDocument();
  });
});
