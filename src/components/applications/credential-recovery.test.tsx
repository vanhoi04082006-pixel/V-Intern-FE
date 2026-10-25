import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { CredentialRecovery } from "./credential-recovery";
const api = vi.hoisted(() => ({
  previewCredentialRecovery: vi.fn(),
  recoverApplicationCredentials: vi.fn(),
}));
vi.mock("@/lib/api/credential-recovery", () => api);
const slot = {
  id: "slot",
  roleCode: "frontend",
  startsAt: "2030-01-01T02:00:00Z",
  endsAt: "2030-01-01T03:00:00Z",
  status: "open",
  timezone: "Asia/Ho_Chi_Minh",
  capacity: 1,
  booked: 0,
  minimumPreparationMinutes: 60,
  credentialsLeadMinutes: 30,
};
const props = {
  roundId: "round",
  applicationId: "application",
  slots: [slot],
  onChanged: vi.fn().mockResolvedValue(undefined),
};
beforeEach(() => {
  vi.clearAllMocks();
  api.previewCredentialRecovery.mockResolvedValue({
    allowed: true,
    message: "Chỉ đổi mật khẩu tạm đã hết hạn.",
    revision: "a".repeat(64),
    expiresAt: "2030-01-02T03:00:00Z",
  });
  api.recoverApplicationCredentials.mockResolvedValue({
    recovered: true,
    duplicate: false,
    mailId: "mail",
  });
});
async function preview() {
  fireEvent.change(screen.getByLabelText("Lịch dùng để tính hạn mật khẩu"), {
    target: { value: "slot" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Kiểm tra điều kiện" }));
  await screen.findByText("Chỉ đổi mật khẩu tạm đã hết hạn.");
}
it("requires server preview, reason and confirmation, then queues credentials without revealing a password", async () => {
  render(<CredentialRecovery {...props} />);
  await preview();
  const button = screen.getByRole("button", { name: "Cấp lại mật khẩu tạm" });
  expect(button).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Lý do cấp lại"), {
    target: { value: "Đã xác minh lại email và kiểm tra danh tính." },
  });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(button);
  await waitFor(() =>
    expect(api.recoverApplicationCredentials).toHaveBeenCalledWith(
      "round",
      "application",
      {
        slotId: "slot",
        expectedRevision: "a".repeat(64),
        reason: "Đã xác minh lại email và kiểm tra danh tính.",
      },
    ),
  );
  await screen.findByRole("status");
  expect(props.onChanged).toHaveBeenCalledOnce();
});
it("explains ineligible accounts and never offers rotation", async () => {
  api.previewCredentialRecovery.mockResolvedValue({
    allowed: false,
    message: "Mật khẩu chính thức được giữ nguyên.",
    revision: null,
    expiresAt: null,
  });
  render(<CredentialRecovery {...props} />);
  fireEvent.change(screen.getByLabelText("Lịch dùng để tính hạn mật khẩu"), {
    target: { value: "slot" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Kiểm tra điều kiện" }));
  await screen.findByText("Mật khẩu chính thức được giữ nguyên.");
  expect(
    screen.queryByRole("button", { name: "Cấp lại mật khẩu tạm" }),
  ).not.toBeInTheDocument();
});
it("invalidates stale preview after an error and after selecting a different slot", async () => {
  api.recoverApplicationCredentials.mockRejectedValue(
    new Error("Trạng thái đã đổi."),
  );
  render(<CredentialRecovery {...props} />);
  await preview();
  fireEvent.change(screen.getByLabelText("Lý do cấp lại"), {
    target: { value: "Đã đối chiếu hồ sơ cần phục hồi." },
  });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Cấp lại mật khẩu tạm" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: "Cấp lại mật khẩu tạm" }),
    ).not.toBeInTheDocument(),
  );
  expect(
    screen.getByRole("button", { name: "Kiểm tra điều kiện" }),
  ).toBeEnabled();
});
