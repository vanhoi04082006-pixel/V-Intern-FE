import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ScheduledInterview } from "../scheduled-interview";
const flow = vi.hoisted(() => ({
  profile: {
    attemptsRemaining: 3,
    attemptNumber: 0,
    nextEligibleAt: null,
    interviewSchedule: {
      managed: true,
      phase: "waiting",
      roleCode: "frontend",
      roleName: "Frontend",
      startsAt: "2026-10-25T02:00:00Z",
      endsAt: "2026-10-25T02:30:00Z",
      deadlineAt: "2026-10-25T02:15:00Z",
      timezone: "Asia/Ho_Chi_Minh",
      serverNow: "2026-10-25T01:59:00Z",
      sessionId: null as string | null,
    },
  },
  busy: false,
  notice: null,
  interview: null as { session: { status: string } } | null,
  start: vi.fn(),
  reload: vi.fn(),
}));
vi.mock("../recruitment-provider", () => ({ useRecruitmentFlow: () => flow }));
beforeEach(() => {
  vi.clearAllMocks();
  flow.profile.interviewSchedule.phase = "waiting";
  flow.profile.interviewSchedule.serverNow = "2026-10-25T01:59:00Z";
  flow.profile.interviewSchedule.sessionId = null;
  flow.profile.attemptsRemaining = 3;
  flow.interview = null;
  flow.start.mockResolvedValue(true);
});
afterEach(() => vi.useRealTimers());
it("shows the assigned role and schedule without a role selector, blocking early starts", () => {
  render(<ScheduledInterview />);
  expect(screen.getByText("Frontend")).toBeInTheDocument();
  expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Bắt đầu phỏng vấn" }),
  ).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Cập nhật lịch" }));
  expect(flow.reload).toHaveBeenCalledTimes(1);
});
it("enables T+14:59 and disables at T+15 without trusting a browser mutation to start the API", () => {
  vi.useFakeTimers();
  flow.profile.interviewSchedule.phase = "ready";
  flow.profile.interviewSchedule.serverNow = "2026-10-25T02:14:59Z";
  render(<ScheduledInterview />);
  const start = screen.getByRole("button", { name: "Bắt đầu phỏng vấn" });
  expect(start).toBeEnabled();
  act(() => vi.advanceTimersByTime(1000));
  expect(start).toBeDisabled();
  expect(screen.getByText(/Hồ sơ chờ đợt tiếp theo/)).toBeInTheDocument();
  expect(flow.start).not.toHaveBeenCalled();
});
it("links back to the admitted session instead of consuming another attempt", () => {
  flow.profile.interviewSchedule.phase = "started";
  flow.profile.interviewSchedule.sessionId = "session";
  flow.interview = { session: { status: "in_progress" } };
  render(<ScheduledInterview />);
  expect(
    screen.getByRole("link", { name: "Tiếp tục phiên phỏng vấn" }),
  ).toHaveAttribute("href", "/intern/onboarding/interview");
  expect(
    screen.getByRole("button", { name: "Bắt đầu phỏng vấn" }),
  ).toBeDisabled();
});
