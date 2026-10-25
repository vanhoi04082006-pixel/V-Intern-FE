import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, expect, it, vi } from "vitest";
import { RepositoryAccessStatus } from "./repository-access";
import * as api from "@/lib/api/repository-access";
import { ApiError } from "@/lib/auth/api-client";
vi.mock("@/lib/api/repository-access", () => ({
  ownRepositoryAccess: vi.fn(),
  sessionRepositoryAccess: vi.fn(),
  retryRepositoryAccess: vi.fn(),
}));
const job: api.RepositoryAccessItem = {
  id: "job",
  sessionId: "session",
  status: "failed",
  displayStatus: "review_required",
  errorCode: "GITHUB_ACCESS_REVIEW_REQUIRED",
  attempts: 1,
  updatedAt: "2026-10-25T01:00:00Z",
  nextAttemptAt: "2026-10-25T01:00:00Z",
  revision: "a".repeat(64),
  displayName: "Sinh viên QA",
  sessionName: "Phiên QA",
  projectName: "Sổ tay",
  role: "departing",
  outcome: "accepted_permission_origin_unverifiable",
  repositoryUrl: "https://github.com/platform/demo",
  retryAllowed: true,
};
const report = {
  items: [job],
  summary: [{ status: "review_required" as const, total: 1 }],
  limit: 50,
};
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.ownRepositoryAccess).mockResolvedValue(report);
  vi.mocked(api.sessionRepositoryAccess).mockResolvedValue(report);
});
it("loads only the signed-in student report and explains preserved permissions without exposing staff actions", async () => {
  render(<RepositoryAccessStatus />);
  await screen.findByText("Sổ tay");
  expect(api.ownRepositoryAccess).toHaveBeenCalledWith(expect.any(AbortSignal));
  expect(api.sessionRepositoryAccess).not.toHaveBeenCalled();
  expect(
    screen.queryByRole("button", { name: "Đối chiếu lại" }),
  ).not.toBeInTheDocument();
  expect(screen.getByText(/giữ nguyên quyền/)).toBeInTheDocument();
});
it("guides a disconnected newcomer to its GitHub connection without claiming access exists", async () => {
  vi.mocked(api.ownRepositoryAccess).mockResolvedValue({
    ...report,
    items: [
      {
        ...job,
        role: "joining",
        status: "waiting_user",
        displayStatus: "waiting_user",
        errorCode: "GITHUB_MEMBER_NOT_CONNECTED",
      },
    ],
  });
  render(<RepositoryAccessStatus />);
  expect(
    await screen.findByRole("link", { name: "Kết nối GitHub" }),
  ).toHaveAttribute("href", "/intern/github");
  expect(
    screen.queryByText("Đã xác nhận quyền truy cập"),
  ).not.toBeInTheDocument();
});
it("requires a reason and submits the exact job revision for a scoped staff retry", async () => {
  vi.mocked(api.retryRepositoryAccess).mockResolvedValue({ queued: true });
  render(<RepositoryAccessStatus sessionId="session" />);
  fireEvent.click(await screen.findByRole("button", { name: "Đối chiếu lại" }));
  const submit = screen.getByRole("button", { name: "Đưa vào hàng đợi" });
  expect(submit).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Lý do đối chiếu lại"), {
    target: { value: "Admin đã kiểm tra quyền hiện tại trên GitHub." },
  });
  fireEvent.click(submit);
  await waitFor(() =>
    expect(api.retryRepositoryAccess).toHaveBeenCalledWith("session", "job", {
      expectedRevision: job.revision,
      reason: "Admin đã kiểm tra quyền hiện tại trên GitHub.",
    }),
  );
  await screen.findByText(/Đã đưa vào hàng đợi/);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
it("keeps a changed server revision visible and requires reload instead of silently retrying", async () => {
  vi.mocked(api.retryRepositoryAccess).mockRejectedValue(
    new ApiError(409, "GITHUB_ACCESS_CHANGED", "changed"),
  );
  render(<RepositoryAccessStatus sessionId="session" />);
  fireEvent.click(await screen.findByRole("button", { name: "Đối chiếu lại" }));
  fireEvent.change(screen.getByLabelText("Lý do đối chiếu lại"), {
    target: { value: "Giảng viên yêu cầu kiểm tra trạng thái mới." },
  });
  fireEvent.click(screen.getByRole("button", { name: "Đưa vào hàng đợi" }));
  await screen.findByRole("alert");
  expect(api.retryRepositoryAccess).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Đóng và tải lại" }));
  await waitFor(() =>
    expect(api.sessionRepositoryAccess).toHaveBeenCalledTimes(2),
  );
});
it("recovers a failed report read with retry", async () => {
  vi.mocked(api.ownRepositoryAccess).mockRejectedValueOnce(
    new Error("offline"),
  );
  render(<RepositoryAccessStatus />);
  fireEvent.click(await screen.findByRole("button", { name: "Thử lại" }));
  await screen.findByText("Sổ tay");
  expect(api.ownRepositoryAccess).toHaveBeenCalledTimes(2);
});
