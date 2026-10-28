import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, expect, it, vi } from "vitest";
import { ReplacementDialog } from "./replacement-dialog";
import * as api from "@/lib/api/replacements";
import { ApiError } from "@/lib/auth/api-client";
vi.mock("@/lib/api/replacements", () => ({
  replacementAdvice: vi.fn(),
  prepareReplacement: vi.fn(),
  approveReplacement: vi.fn(),
}));
const candidate = "candidate",
  session = "session",
  incident = "incident";
const recommendation = {
  id: "advice",
  aiRunId: "ai",
  contextHash: "a".repeat(64),
  requiresInstructorApproval: true,
  searchLimited: false,
  advice: {
    candidateId: candidate,
    reason: "Đã đạt phỏng vấn đúng vai trò.",
    evidenceRefs: ["candidate:evidence"],
    limitations: [],
  },
  candidates: [
    {
      userId: candidate,
      displayName: "Nguyễn QA",
      roleCode: "frontend",
      overallScore: 82,
      technicalScore: 85,
      strengths: ["Kiểm thử tốt"],
      weaknesses: [],
      evaluatedAt: null,
      evidenceRef: "candidate:evidence",
    },
  ],
};
const preview = {
  id: "command",
  previewHash: "b".repeat(64),
  expiresAt: new Date(Date.now() + 600000).toISOString(),
  status: "pending" as const,
  document: {
    schemaVersion: 1,
    preparedAt: new Date().toISOString(),
    handoverHours: 24,
    adviceId: "advice",
    sourceFingerprint: "f".repeat(64),
    summary: {
      sessionId: session,
      sessionName: "Phiên QA",
      projectId: "project",
      projectName: "Ghi chú",
      roleCode: "frontend",
      roleName: "Frontend",
      oldAssignmentId: "old",
      oldInternId: "target",
      oldInternName: "Sinh viên cũ",
      candidateId: candidate,
      candidateName: "Nguyễn QA",
    },
    taskPlan: {
      handoverAt: new Date(Date.now() + 86400000).toISOString(),
      preservedCount: 1,
      transfers: [
        {
          id: "task",
          code: "QA-1",
          title: "Bàn giao giao diện",
          status: "doing" as const,
          version: 2,
          dueAt: "2026-10-24T01:00:00Z",
          handoverDueAt: new Date(Date.now() + 86400000).toISOString(),
        },
      ],
    },
    warnings: ["Quyền GitHub được đối chiếu riêng."],
  },
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
  vi.mocked(api.replacementAdvice).mockResolvedValue(recommendation);
  vi.mocked(api.prepareReplacement).mockResolvedValue(preview);
});
function open() {
  const saved = vi.fn();
  render(
    <ReplacementDialog
      sessionId={session}
      incidentId={incident}
      studentName="Sinh viên cũ"
      onClose={vi.fn()}
      onSaved={saved}
    />,
  );
  return saved;
}
async function prepare() {
  fireEvent.click(
    screen.getByRole("button", { name: "Yêu cầu Agent đối chiếu" }),
  );
  await screen.findByText("Nguyễn QA");
  fireEvent.click(screen.getByRole("button", { name: "Xem trước ảnh hưởng" }));
  await screen.findByText("Bàn giao giao diện");
}
it("requires an explicit Agent request and concrete preview plus reason/confirmation before approval", async () => {
  const saved = open();
  expect(api.replacementAdvice).not.toHaveBeenCalled();
  await prepare();
  expect(api.approveReplacement).not.toHaveBeenCalled();
  expect(screen.getByText(/1 bài.*lịch sử/)).toBeInTheDocument();
  const approve = screen.getByRole("button", {
    name: "Phê duyệt thay thành viên",
  });
  expect(approve).toBeDisabled();
  fireEvent.change(screen.getByLabelText(/Lý do quyết định/), {
    target: { value: "Đã kiểm tra bằng chứng và trao đổi lịch bàn giao." },
  });
  expect(approve).toBeDisabled();
  vi.mocked(api.approveReplacement).mockResolvedValue({
    schemaVersion: 1,
    replacementId: "r",
    commandId: "command",
    sessionId: session,
    oldAssignmentId: "old",
    newAssignmentId: "new",
    oldInternId: "target",
    newInternId: candidate,
    transferredTaskIds: ["task"],
    preservedTaskCount: 1,
    approvedById: "teacher",
    approvedAt: new Date().toISOString(),
    reason: "Đã kiểm tra bằng chứng.",
    repositoryAccessQueued: true,
  });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(approve);
  await screen.findByRole("heading", { name: "Đã phê duyệt thay thành viên" });
  expect(api.approveReplacement).toHaveBeenCalledWith(session, "command", {
    expectedPreviewHash: preview.previewHash,
    reason: "Đã kiểm tra bằng chứng và trao đổi lịch bàn giao.",
  });
  expect(saved).toHaveBeenCalledOnce();
  expect(screen.getByText(/chờ đối chiếu/)).toBeInTheDocument();
});
it("shows no candidate honestly and never prepares or approves a replacement", async () => {
  vi.mocked(api.replacementAdvice).mockResolvedValue({
    ...recommendation,
    candidates: [],
    advice: {
      candidateId: null,
      reason: "Chưa có ứng viên khả dụng.",
      evidenceRefs: [],
      limitations: [],
    },
  });
  open();
  fireEvent.click(
    screen.getByRole("button", { name: "Yêu cầu Agent đối chiếu" }),
  );
  await screen.findByText("Chưa có ứng viên khả dụng.");
  expect(
    screen.queryByRole("button", { name: "Xem trước ảnh hưởng" }),
  ).not.toBeInTheDocument();
  expect(api.approveReplacement).not.toHaveBeenCalled();
});
it("invalidates the preview when handover hours change and does not submit stale effects", async () => {
  open();
  await prepare();
  fireEvent.change(screen.getByLabelText(/Khoảng bàn giao/), {
    target: { value: "48" },
  });
  expect(screen.queryByText("Bàn giao giao diện")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Phê duyệt thay thành viên" }),
  ).not.toBeInTheDocument();
});
it("keeps the exact command for a retry after an uncertain network response", async () => {
  vi.mocked(api.approveReplacement).mockRejectedValue(new Error("Mất kết nối"));
  open();
  await prepare();
  fireEvent.change(screen.getByLabelText(/Lý do quyết định/), {
    target: { value: "Đã đối chiếu bằng chứng cần thiết." },
  });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(
    screen.getByRole("button", { name: "Phê duyệt thay thành viên" }),
  );
  await screen.findByRole("alert");
  fireEvent.click(
    screen.getByRole("button", { name: "Phê duyệt thay thành viên" }),
  );
  await waitFor(() => expect(api.approveReplacement).toHaveBeenCalledTimes(2));
  expect(vi.mocked(api.approveReplacement).mock.calls[0]).toEqual(
    vi.mocked(api.approveReplacement).mock.calls[1],
  );
});
it("requires a new preview after the server rejects changed evidence", async () => {
  vi.mocked(api.approveReplacement).mockRejectedValue(
    new ApiError(409, "REPLACEMENT_CONTEXT_CHANGED", "changed"),
  );
  open();
  await prepare();
  fireEvent.change(screen.getByLabelText(/Lý do quyết định/), {
    target: { value: "Đã đối chiếu bằng chứng cần thiết." },
  });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(
    screen.getByRole("button", { name: "Phê duyệt thay thành viên" }),
  );
  await screen.findByRole("alert");
  expect(
    screen.queryByRole("button", { name: "Phê duyệt thay thành viên" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Xem trước ảnh hưởng" }),
  ).toBeInTheDocument();
});
it("blocks an expired preview even when the user supplies reason and confirmation", async () => {
  vi.mocked(api.prepareReplacement).mockResolvedValue({
    ...preview,
    expiresAt: new Date(Date.now() - 1000).toISOString(),
  });
  open();
  await prepare();
  expect(screen.getByText(/Bản xem trước đã hết hạn/)).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Phê duyệt thay thành viên" }),
  ).toBeDisabled();
  expect(screen.getByRole("checkbox")).toBeDisabled();
  expect(api.approveReplacement).not.toHaveBeenCalled();
});
