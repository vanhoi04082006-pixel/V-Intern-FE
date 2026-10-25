import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ParticipationStudent } from "./student";
import { PolicyEditor } from "./policy-editor";
import { IncidentList } from "./incident-list";
import { IncidentActionDialog } from "./incident-action";
import * as api from "@/lib/api/participation";
vi.mock("@/lib/api/participation", () => ({
  ownParticipation: vi.fn(),
  saveParticipationPolicy: vi.fn(),
  resolveParticipation: vi.fn(),
  extendParticipationDeadline: vi.fn(),
}));
const policy = {
  version: 0,
  configured: false,
  activeFrom: null,
  warningFrom: 1,
  penaltyFrom: 2,
  replacementFrom: 3,
  penaltyPoints: null,
  penaltyCap: 20,
};
const report = {
  items: [],
  summary: { total: 0, active: 0, registeredPenalty: 0 },
  page: 1,
  pageSize: 20,
};
const incident: api.ParticipationIncident = {
  id: "i",
  taskId: "t",
  internId: "u",
  sessionId: "s",
  deadlineVersion: 2,
  policyVersion: 1,
  dueAt: "2026-10-24T00:00:00Z",
  submittedAt: null,
  kind: "missing",
  status: "active",
  ordinal: 3,
  points: 5,
  recommendReplacement: true,
  createdAt: "2026-10-25T00:00:00Z",
  reason: null,
  taskCode: "T-1",
  taskTitle: "Bài tập",
  displayName: "Sinh viên",
  sessionName: "Phiên",
  baseScore: 80,
  latePenalty: 5,
  score: 75,
  submissionStatus: "approved",
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
  vi.mocked(api.ownParticipation).mockResolvedValue(report);
});
describe("participation evidence", () => {
  it("loads only the signed-in student endpoint and explains first valid submission timing", async () => {
    render(<ParticipationStudent />);
    await screen.findByText(/Chưa có ghi nhận vi phạm/);
    expect(api.ownParticipation).toHaveBeenCalledWith(
      1,
      expect.any(AbortSignal),
    );
    expect(screen.getAllByText(/hợp lệ đầu tiên/).length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: "Miễn trừ" }),
    ).not.toBeInTheDocument();
  });
  it("recovers from a failed read using retry", async () => {
    vi.mocked(api.ownParticipation).mockRejectedValueOnce(new Error("offline"));
    render(<ParticipationStudent />);
    fireEvent.click(await screen.findByRole("button", { name: "Thử lại" }));
    await screen.findByText(/Chưa có ghi nhận vi phạm/);
    expect(api.ownParticipation).toHaveBeenCalledTimes(2);
  });
  it("keeps automatic penalty disabled when the amount is empty", async () => {
    const saved = vi.fn();
    vi.mocked(api.saveParticipationPolicy).mockResolvedValue({
      ...policy,
      version: 1,
      configured: true,
    });
    render(
      <PolicyEditor
        sessionId="session"
        policy={policy}
        onSaved={saved}
        onClose={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Lý do áp dụng" }), {
      target: { value: "Áp dụng cho đợt thực tập mới" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu chính sách" }));
    await waitFor(() => expect(saved).toHaveBeenCalled());
    expect(api.saveParticipationPolicy).toHaveBeenCalledWith(
      "session",
      expect.objectContaining({ penaltyPoints: null, expectedVersion: 0 }),
    );
  });
  it("preserves an explicitly configured zero without treating it as empty", async () => {
    vi.mocked(api.saveParticipationPolicy).mockResolvedValue({
      ...policy,
      version: 1,
      configured: true,
      penaltyPoints: 0,
    });
    render(
      <PolicyEditor
        sessionId="session"
        policy={policy}
        onSaved={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Điểm trừ mỗi lần"), {
      target: { value: "0" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Lý do áp dụng" }), {
      target: { value: "Không trừ điểm trong tuần đầu" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu chính sách" }));
    await waitFor(() =>
      expect(api.saveParticipationPolicy).toHaveBeenCalledWith(
        "session",
        expect.objectContaining({ penaltyPoints: 0 }),
      ),
    );
  });
  it("rejects unordered thresholds before submitting", async () => {
    render(
      <PolicyEditor
        sessionId="session"
        policy={policy}
        onSaved={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Cảnh báo từ lần"), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Lý do áp dụng" }), {
      target: { value: "Áp dụng cho đợt thực tập mới" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu chính sách" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/theo thứ tự/);
    expect(api.saveParticipationPolicy).not.toHaveBeenCalled();
  });
  it("shows an action error and preserves the reason for retry", async () => {
    vi.mocked(api.saveParticipationPolicy).mockRejectedValue(
      new Error("conflict"),
    );
    render(
      <PolicyEditor
        sessionId="session"
        policy={policy}
        onSaved={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const reason = screen.getByRole("textbox", { name: "Lý do áp dụng" });
    fireEvent.change(reason, {
      target: { value: "Giữ nguyên lý do khi xung đột" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu chính sách" }));
    await screen.findByRole("alert");
    expect(reason).toHaveValue("Giữ nguyên lý do khi xung đột");
  });
  it("keeps finalized scores visible after an incident reversal", () => {
    render(
      <IncidentList
        items={[
          {
            id: "i",
            taskId: "t",
            internId: "u",
            sessionId: "s",
            deadlineVersion: 1,
            policyVersion: 1,
            dueAt: "2026-10-24T00:00:00Z",
            submittedAt: null,
            kind: "missing",
            status: "reversed",
            ordinal: 3,
            points: 5,
            recommendReplacement: true,
            createdAt: "2026-10-25T00:00:00Z",
            reason: "Đã kiểm tra lại bằng chứng",
            taskCode: "T-1",
            taskTitle: "Bài tập",
            displayName: "Sinh viên",
            sessionName: "Phiên",
            baseScore: 80,
            latePenalty: 5,
            score: 75,
            submissionStatus: "approved",
          },
        ]}
      />,
    );
    expect(screen.getByText("75/100")).toBeInTheDocument();
    expect(screen.getByText(/không tự sửa điểm đã duyệt/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Miễn trừ" }),
    ).not.toBeInTheDocument();
  });
  it("sends the reviewed incident version and reason when granting an exemption", async () => {
    vi.mocked(api.resolveParticipation).mockResolvedValue({ resolved: true });
    const saved = vi.fn();
    render(
      <IncidentActionDialog
        item={incident}
        action="excused"
        onSaved={saved}
        onClose={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Lý do xử lý" }), {
      target: { value: "Sinh viên có giấy xác nhận nghỉ" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }));
    await waitFor(() => expect(saved).toHaveBeenCalled());
    expect(api.resolveParticipation).toHaveBeenCalledWith("s", "i", {
      action: "excused",
      expectedDeadlineVersion: 2,
      reason: "Sinh viên có giấy xác nhận nghỉ",
    });
  });
  it("rejects a shortened deadline and sends an extended deadline as UTC", async () => {
    vi.mocked(api.extendParticipationDeadline).mockResolvedValue({
      extended: true,
    });
    render(
      <IncidentActionDialog
        item={incident}
        action="extend"
        onSaved={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Lý do xử lý" }), {
      target: { value: "Gia hạn theo lịch thực tập mới" },
    });
    const until = screen.getByLabelText(/Hạn mới/);
    fireEvent.change(until, { target: { value: "2026-10-20T10:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /sau hạn hiệu lực/,
    );
    expect(api.extendParticipationDeadline).not.toHaveBeenCalled();
    fireEvent.change(until, { target: { value: "2026-11-20T10:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }));
    await waitFor(() =>
      expect(api.extendParticipationDeadline).toHaveBeenCalledWith("s", "t", {
        expectedVersion: 2,
        until: new Date("2026-11-20T10:00").toISOString(),
        reason: "Gia hạn theo lịch thực tập mới",
      }),
    );
  });
});
