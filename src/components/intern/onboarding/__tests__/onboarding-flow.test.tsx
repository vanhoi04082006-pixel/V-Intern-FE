import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecruitmentProvider } from "../recruitment-provider";
import { WelcomeStep } from "../welcome-step";
import { RoleSelectionStep } from "../role-selection-step";
import { InterviewStep } from "../interview-step";
import { RecruitmentResult } from "../recruitment-result";
import { OnboardingShell } from "../onboarding-shell";
import {
  blocked,
  interview as interviewFixture,
  profile as profileFixture,
  result,
  waiting,
  principal,
} from "@/test/nest-fixtures";
import { clearSession, setSession } from "@/lib/auth/session";
import type { RecruitmentProfile, Interview } from "@/lib/api/recruitment";
import type { InternWorkspace } from "@/lib/api/workspace";
const replace = vi.fn();
const router = { replace };
let pathname = "/intern/onboarding";
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => pathname,
}));
let profile: RecruitmentProfile;
let interview: Interview;
let workspace: InternWorkspace;
let errorStatus = 0;
let evaluationFailed = false;
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status });
const requests: { url: string; options: RequestInit }[] = [];
let evaluationWait: Promise<void> | undefined;
beforeEach(() => {
  evaluationWait = undefined;
  clearSession();
  setSession("token", principal);
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:8080/api/v1");
  profile = structuredClone(profileFixture);
  interview = structuredClone(interviewFixture);
  workspace = blocked("recruitment_required");
  pathname = "/intern/onboarding";
  errorStatus = 0;
  evaluationFailed = false;
  requests.length = 0;
  replace.mockClear();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, options: RequestInit) => {
      requests.push({ url, options });
      if (errorStatus) return json({ code: "TEST_ERROR" }, errorStatus);
      if (url.endsWith("/intern/me/workspace")) return json(workspace);
      if (url.endsWith("/recruitment/me")) return json(profile);
      if (url.endsWith("/me/role")) {
        const body = JSON.parse(String(options.body));
        profile = {
          ...profile,
          status: "role_selected",
          selectedRole: body.role,
          selectedRoleLabel:
            body.role === "qa" ? "QA Tester" : "Backend Developer",
        };
        return json(profile);
      }
      if (url.endsWith("/me/interviews")) {
        profile = {
          ...profile,
          status: "interview_in_progress",
          currentInterviewSessionId: interview.session.id,
        };
        return json(interview, 201);
      }
      if (url.endsWith("/questions")) return json(interview);
      if (url.includes("/answers/")) {
        const id = url.split("/").at(-1);
        interview.questions = interview.questions.map((q) =>
          q.id === id
            ? { ...q, answered: true, answeredAt: "2026-10-07T10:22:00Z" }
            : q,
        );
        return json({
          id: "answer-1",
          sessionQuestionId: id,
          answeredAt: "2026-10-07T10:22:00Z",
        });
      }
      if (url.endsWith("/submit") || url.endsWith("/retry-evaluation")) {
        await evaluationWait;
        if (evaluationFailed) {
          interview.session.status = "evaluation_failed";
          profile.status = "evaluation_pending";
          return json({
            session: interview.session,
            result: null,
            errorCode: "AI_PROVIDER_UNAVAILABLE",
          });
        }
        interview.session.status = "completed";
        profile = { ...profile, status: "passed", result };
        return json({ session: interview.session, result });
      }
      return json(result);
    }),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  clearSession();
});
function setupInterview() {
  pathname = "/intern/onboarding/interview";
  workspace = blocked("recruitment_in_progress");
  profile = {
    ...profile,
    status: "interview_in_progress",
    selectedRole: "backend",
    currentInterviewSessionId: interview.session.id,
  };
}
function renderFlow(child: React.ReactNode) {
  return render(<RecruitmentProvider>{child}</RecruitmentProvider>);
}
describe("Nest recruitment integration", () => {
  it.each([50, 62.2, 70])("shows evidence-backed role guidance at %s and requires explicit role selection", async (score) => {
    pathname = "/intern/onboarding/result";
    workspace = blocked("recruitment_failed");
    profile = { ...profile, status: "failed", selectedRole: "backend", attemptNumber: 1, attemptsRemaining: 2, result: { ...result, decision: "failed", overallScore: score, recommendedRole: "qa", feedback: "Câu hỏi 1: cách kiểm tra tình huống biên phù hợp để khám phá QA." } };
    renderFlow(<RecruitmentResult />);
    expect(await screen.findByRole("heading", { name: "AI đề xuất bạn thử một vai trò khác" })).toBeInTheDocument();
    expect(screen.getByText(/Câu hỏi 1: cách kiểm tra/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Vào Workspace" })).not.toBeInTheDocument();
    expect(requests.some((entry) => entry.options.method === "PATCH")).toBe(false);
    await userEvent.click(screen.getByRole("button", { name: "Chọn vai trò được đề xuất" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/intern/onboarding/role"));
    const selection = requests.find((entry) => entry.url.endsWith("/me/role"));
    expect(JSON.parse(String(selection?.options.body))).toEqual({ role: "qa" });
    expect(requests.some((entry) => entry.url.endsWith("/me/interviews") && entry.options.method === "POST")).toBe(false);
  });
  it("keeps the failed path below 50 and disables another attempt after the third", async () => {
    pathname = "/intern/onboarding/result";
    workspace = blocked("recruitment_failed");
    profile = { ...profile, status: "failed", selectedRole: "backend", attemptNumber: 3, attemptsRemaining: 0, result: { ...result, decision: "failed", overallScore: 49.9 } };
    renderFlow(<RecruitmentResult />);
    expect(await screen.findByRole("heading", { name: "Chưa đạt yêu cầu tuyển dụng" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thử lại tuyển dụng" })).toBeDisabled();
    expect(screen.getByText(/Bạn đã dùng hết 3 lượt/)).toBeInTheDocument();
  });
  it("shows an honest animated pending state during evaluation, not answer saving or a countdown", async () => {
    setupInterview();
    interview.questions.forEach((q) => { q.answered = true; });
    let finish!: () => void;
    evaluationWait = new Promise<void>((resolve) => { finish = resolve; });
    renderFlow(<InterviewStep />);
    await screen.findByText("Câu hỏi kỹ thuật từ backend");
    await userEvent.click(screen.getByRole("button", { name: "Nộp bài phỏng vấn" }));
    try {
      expect(await screen.findByRole("status", { name: "AI đang chấm bài" })).toBeInTheDocument();
      expect(screen.queryByLabelText("Thời gian còn lại")).not.toBeInTheDocument();
      expect(screen.queryByText("Đang lưu...")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Đang chấm bài…" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Tải lại trạng thái" })).toBeDisabled();
      expect(requests.filter((r) => r.url.endsWith("/submit"))).toHaveLength(1);
    } finally { finish(); }
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/intern/onboarding/result"));
  });
  it("Welcome retains guidance and real next-step link", async () => {
    renderFlow(<WelcomeStep />);
    expect(
      await screen.findByRole("heading", {
        name: "Chào mừng bạn đến với V-Intern!",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Bắt đầu/ })).toHaveAttribute(
      "href",
      "/intern/onboarding/role",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /Xem hướng dẫn/ }),
    );
    expect(screen.getByText("Hướng dẫn nhanh")).toBeInTheDocument();
  });
  it("role choice saves exact backend code then starts interview", async () => {
    pathname = "/intern/onboarding/role";
    renderFlow(<RoleSelectionStep />);
    await screen.findByRole("heading", { name: "Chọn vị trí ứng tuyển" });
    expect(
      screen.getByRole("button", { name: "Bắt đầu phỏng vấn" }),
    ).toBeDisabled();
    const user = userEvent.setup();
    await user.click(screen.getByRole("radio", { name: /QA Tester/ }));
    await user.click(screen.getByRole("button", { name: "Bắt đầu phỏng vấn" }));
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/intern/onboarding/interview"),
    );
    const req = requests.find((x) => x.url.endsWith("/me/role"));
    expect(req?.options.method).toBe("PATCH");
    expect(JSON.parse(String(req?.options.body))).toEqual({ role: "qa" });
    expect(
      requests.some(
        (x) => x.url.endsWith("/me/interviews") && x.options.method === "POST",
      ),
    ).toBe(true);
  });
  it("cooldown and attempt count gate start", async () => {
    pathname = "/intern/onboarding/role";
    profile = {
      ...profile,
      selectedRole: "backend",
      attemptsRemaining: 0,
      nextEligibleAt: "2099-10-09T10:00:00Z",
    };
    renderFlow(<RoleSelectionStep />);
    await screen.findByRole("heading", { name: "Chọn vị trí ứng tuyển" });
    expect(
      screen.getByRole("button", { name: "Bắt đầu phỏng vấn" }),
    ).toBeDisabled();
    expect(screen.getByText(/Có thể thử lại sau/)).toBeInTheDocument();
  });
  it("resume loads persisted answered flags and real questions", async () => {
    setupInterview();
    interview.questions[0].answered = true;
    renderFlow(<InterviewStep />);
    expect(
      await screen.findByText("Câu hỏi kỹ năng mềm từ backend"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Thời gian còn lại")).toHaveTextContent(
      "10:00",
    );
    expect(
      screen.getByRole("button", { name: /Câu 1.*Đã lưu/ }),
    ).toBeInTheDocument();
  });
  it("answer persists through PUT; submit only unlocks after all answers", async () => {
    setupInterview();
    renderFlow(<InterviewStep />);
    await screen.findByText("Câu hỏi kỹ thuật từ backend");
    const user = userEvent.setup();
    const submit = screen.getByRole("button", { name: "Nộp bài phỏng vấn" });
    expect(submit).toBeDisabled();
    await user.type(
      screen.getByLabelText("Câu trả lời của bạn"),
      "Câu trả lời kỹ thuật",
    );
    await user.click(screen.getByRole("button", { name: "Lưu câu trả lời" }));
    await screen.findByText("Câu hỏi kỹ năng mềm từ backend");
    expect(
      JSON.parse(
        String(
          requests.find((x) => x.url.includes("/answers/question-1"))?.options
            .body,
        ),
      ),
    ).toEqual({ answerText: "Câu trả lời kỹ thuật" });
    await user.type(
      screen.getByLabelText("Câu trả lời của bạn"),
      "Câu trả lời kỹ năng mềm",
    );
    await user.click(screen.getByRole("button", { name: "Lưu câu trả lời" }));
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/intern/onboarding/result"),
    );
  });
  it("failed answer remains draft and error is visible", async () => {
    setupInterview();
    renderFlow(<InterviewStep />);
    await screen.findByText("Câu hỏi kỹ thuật từ backend");
    errorStatus = 409;
    await userEvent.type(
      screen.getByLabelText("Câu trả lời của bạn"),
      "Không được mất bản nháp",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Lưu câu trả lời" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Trạng thái đã thay đổi",
    );
    expect(screen.getByLabelText("Câu trả lời của bạn")).toHaveValue(
      "Không được mất bản nháp",
    );
  });
  it("zero display countdown never submits or decides expiry", async () => {
    setupInterview();
    interview.session.secondsRemaining = 0;
    renderFlow(<InterviewStep />);
    await screen.findByText("Câu hỏi kỹ thuật từ backend");
    expect(screen.getByLabelText("Thời gian còn lại")).toHaveTextContent(
      "0:00",
    );
    expect(requests.some((x) => x.url.endsWith("/submit"))).toBe(false);
    expect(
      screen.getByRole("button", { name: "Lưu câu trả lời" }),
    ).toBeDisabled();
  });
  it("backend expired session offers a fresh attempt", async () => {
    setupInterview();
    interview.session.status = "expired";
    renderFlow(<InterviewStep />);
    expect(
      await screen.findByText(/Trạng thái phiên từ hệ thống: expired/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Bắt đầu lần phỏng vấn mới" }),
    ).toBeEnabled();
  });
  it("Result renders backend decision and overall without recalculation", async () => {
    pathname = "/intern/onboarding/result";
    workspace = waiting;
    profile = { ...profile, status: "passed", selectedRole: "backend", result };
    renderFlow(<RecruitmentResult />);
    expect(await screen.findByText("Bạn đã trúng tuyển")).toBeInTheDocument();
    expect(screen.getByText("88.7")).toBeInTheDocument();
    expect(screen.getByText("12.0")).toBeInTheDocument();
    expect(screen.getByText("Nhận xét từ API")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Vào Workspace" })).toHaveAttribute(
      "href",
      "/intern",
    );
  });
  it("below 50 retains the selected role when retrying and respects the retake policy", async () => {
    pathname = "/intern/onboarding/result";
    workspace = blocked("recruitment_failed");
    profile = {
      ...profile,
      status: "failed",
      selectedRole: "backend",
      attemptsRemaining: 2,
      result: {
        ...result,
        decision: "failed",
        overallScore: 45,
        recommendedRole: "qa",
      },
    };
    renderFlow(<RecruitmentResult />);
    await screen.findByText("Chưa đạt yêu cầu tuyển dụng");
    await userEvent.click(
      screen.getByRole("button", { name: "Thử lại tuyển dụng" }),
    );
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/intern/onboarding/role"),
    );
    expect(profile.selectedRole).toBe("backend");
  });
  it("pending evaluation hides old failed result and retries exact endpoint", async () => {
    pathname = "/intern/onboarding/result";
    workspace = {
      ...blocked("recruitment_in_progress"),
      recruitment: {
        status: "evaluation_pending",
        selectedRole: "backend",
        attemptCount: 1,
        recruitedAt: null,
      },
    };
    profile = {
      ...profile,
      status: "evaluation_pending",
      currentInterviewSessionId: interview.session.id,
      result: { ...result, decision: "failed" },
    };
    interview.session.status = "evaluation_failed";
    renderFlow(<RecruitmentResult />);
    await screen.findByText("Đánh giá chưa khả dụng");
    expect(
      screen.queryByText("Chưa đạt yêu cầu tuyển dụng"),
    ).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Thử lại đánh giá" }),
    );
    expect(await screen.findByText("Bạn đã trúng tuyển")).toBeInTheDocument();
    expect(
      requests.some(
        (x) =>
          x.url.endsWith("/retry-evaluation") && x.options.method === "POST",
      ),
    ).toBe(true);
  });
  it("unavailable AI returns notice, never fabricated score", async () => {
    setupInterview();
    interview.questions.forEach((q) => (q.answered = true));
    evaluationFailed = true;
    renderFlow(<InterviewStep />);
    await screen.findByText("Câu hỏi kỹ thuật từ backend");
    await userEvent.click(
      screen.getByRole("button", { name: "Nộp bài phỏng vấn" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("chưa khả dụng");
    expect(profile.result).toBeNull();
  });
  it("shell uses authenticated displayName without fake notification", async () => {
    renderFlow(
      <OnboardingShell variant="top" activeStep={1}>
        <WelcomeStep />
      </OnboardingShell>,
    );
    expect(await screen.findByText(principal.displayName)).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/thông báo chưa đọc/),
    ).not.toBeInTheDocument();
  });
  it("unassigned direct interview navigation redirects before revealing questions", async () => {
    pathname = "/intern/onboarding/interview";
    workspace = waiting;
    profile = { ...profile, status: "passed", result };
    renderFlow(<InterviewStep />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/intern"));
    expect(
      screen.queryByText("Câu hỏi kỹ thuật từ backend"),
    ).not.toBeInTheDocument();
  });
  it.each([403, 404, 409, 503])("HTTP %s stays an error", async (status) => {
    errorStatus = status;
    renderFlow(<WelcomeStep />);
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(
      screen.queryByText("Chào mừng bạn đến với V-Intern!"),
    ).not.toBeInTheDocument();
  });
});
