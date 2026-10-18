import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InternPage from "@/app/intern/page";
import { active, waiting, blocked, principal } from "@/test/nest-fixtures";
import { clearSession, setSession } from "@/lib/auth/session";
import type { InternWorkspace } from "@/lib/api/workspace";
const replace = vi.fn();
const router = { replace };
vi.mock("next/navigation", () => ({ useRouter: () => router, usePathname: () => "/intern" }));
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status });
let workspace: InternWorkspace;
let backendStatus: number;
const waitingTitle = 'Đã vượt qua phỏng vấn — đang chờ giảng viên phân dự án';
const profile = { status: 'passed', selectedRole: 'backend', selectedRoleLabel: 'Backend Developer', attemptNumber: 1, attemptsRemaining: 2, nextEligibleAt: null, currentInterviewSessionId: null, recruitedAt: '2026-10-15T00:00:00Z', result: null };
beforeEach(() => {
  clearSession();
  setSession("token", principal);
  workspace = waiting;
  backendStatus = 200;
  replace.mockClear();
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:8080/api/v1");
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) =>
      url.endsWith("/auth/me")
        ? json(principal)
        : url.endsWith('/recruitment/me') ? json(profile)
        : url.includes('/recruitment/me/interviews?') ? json({ items: [], total: 0 })
        : json(workspace, backendStatus),
    ),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  clearSession();
});
describe("Intern API integration", () => {
  it("Waiting renders six real rows, no invented project, sprint, task, or notifications", async () => {
    const { container } = render(<InternPage />);
    expect(
      screen.queryByText("Chưa có dự án được phân công"),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByText(waitingTitle),
    ).toBeInTheDocument();
    const rows = container.querySelectorAll(
      "section[aria-labelledby=thong-tin-thuc-tap] dl > div",
    );
    expect(rows).toHaveLength(6);
    expect(screen.getAllByText("Backend Developer").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Chưa phân công")).toHaveLength(2);
    expect(screen.getAllByText("Chưa có")).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: "Công việc của tôi" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Sprint Board" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Dự án" })).toBeDisabled();
    expect(screen.queryByText("E-commerce Platform")).not.toBeInTheDocument();
    expect(screen.queryByText("Dữ liệu mẫu")).not.toBeInTheDocument();
  });
  it("Active uses assignment, sprint, seven tasks and focused task from API", async () => {
    workspace = active;
    render(<InternPage />);
    expect(await screen.findByText("Dự án từ API")).toBeInTheDocument();
    expect(screen.getByText("Phiên từ API")).toBeInTheDocument();
    expect(screen.getByText("SPR-REAL · Sprint từ API")).toBeInTheDocument();
    expect(screen.getByText("TASK-REAL · Task từ API")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(
      screen.queryByText("Chưa có dự án được phân công"),
    ).not.toBeInTheDocument();
  });
  it.each([
    "recruitment_required",
    "recruitment_in_progress",
    "recruitment_failed",
  ] as const)("%s never flashes Waiting or Active", async (status) => {
    workspace = blocked(status);
    render(<InternPage />);
    await waitFor(() => expect(replace).toHaveBeenCalled());
    expect(
      screen.queryByText("Chưa có dự án được phân công"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Tổng quan Task")).not.toBeInTheDocument();
  });
  it.each([403, 404, 409, 500, 503])(
    "HTTP %s renders Error without demo",
    async (status) => {
      backendStatus = status;
      render(<InternPage />);
      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(screen.queryByText("Dữ liệu mẫu")).not.toBeInTheDocument();
    },
  );
  it("offline shows Error and retry", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    render(<InternPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Không thể kết nối",
    );
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });
  it("missing config shows explicit configuration error", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");
    render(<InternPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "NEXT_PUBLIC_API_BASE_URL",
    );
  });
  it("reload re-resolves a newly active assignment", async () => {
    render(<InternPage />);
    await screen.findByText(waitingTitle);
    workspace = active;
    await userEvent.click(
      screen.getByRole("button", { name: "Tải lại trạng thái" }),
    );
    expect(await screen.findByText("Dự án từ API")).toBeInTheDocument();
  });
  it("mobile drawer supports focus, Escape and focus restoration", async () => {
    render(<InternPage />);
    await screen.findByText(waitingTitle);
    const user = userEvent.setup();
    const opener = screen.getByRole("button", { name: "Mở menu điều hướng" });
    await user.click(opener);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});
