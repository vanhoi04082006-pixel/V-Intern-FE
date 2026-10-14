import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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
    profile: { attemptsRemaining: mocks.attemptsRemaining },
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
beforeEach(() => {
  vi.clearAllMocks();
  mocks.attemptsRemaining = 2;
});

describe("conversation recovery", () => {
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
