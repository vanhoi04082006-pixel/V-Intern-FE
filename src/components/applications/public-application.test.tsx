import { StrictMode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { PublicApplication } from "./public-application";
import { ApiError } from "@/lib/auth/api-client";
const api = vi.hoisted(() => ({
  publicRounds: vi.fn(),
  myApplication: vi.fn(),
  verifyApplication: vi.fn(),
  submitApplication: vi.fn(),
  requestApplicationAccess: vi.fn(),
  supplementCv: vi.fn(),
}));
vi.mock("@/lib/api/applications", async () => ({
  ...(await vi.importActual("@/lib/api/applications")),
  ...api,
}));
const candidate = {
  id: "a",
  fullName: "Ứng viên",
  status: "needs_information",
  matchedRole: null,
  revision: 1,
  hasCv: true,
  booking: null,
  timeline: [
    {
      kind: "verified",
      message: "CV scan cần bản văn bản; chưa có OCR.",
      createdAt: "2026-10-24T01:00:00Z",
    },
  ],
};
beforeEach(() => {
  vi.clearAllMocks();
  window.history.replaceState(null, "", "/apply");
  api.publicRounds.mockResolvedValue([
    { id: "r", name: "Đợt thực tập", closesAt: "2026-11-01T00:00:00Z" },
  ]);
  api.myApplication.mockRejectedValue(
    new ApiError(401, "UNAUTHENTICATED", "No session"),
  );
  api.verifyApplication.mockResolvedValue({ verified: true });
});
it("verifies a fragment only once under StrictMode, removes it from the address and shows supplementation", async () => {
  window.history.replaceState(null, "", "/apply#verify=fixture-token");
  api.myApplication.mockResolvedValue(candidate);
  render(
    <StrictMode>
      <PublicApplication />
    </StrictMode>,
  );
  expect(
    await screen.findByText("CV scan cần bản văn bản; chưa có OCR."),
  ).toBeInTheDocument();
  expect(api.verifyApplication).toHaveBeenCalledTimes(1);
  expect(api.verifyApplication).toHaveBeenCalledWith("fixture-token");
  expect(window.location.hash).toBe("");
  expect(
    screen.getByRole("button", { name: "Nộp bản bổ sung" }),
  ).toBeInTheDocument();
});
it("submits one multipart request, retains fields on failure and shows readable feedback", async () => {
  let reject!: (e: Error) => void;
  api.submitApplication.mockReturnValue(
    new Promise((_, fail) => {
      reject = fail;
    }),
  );
  render(<PublicApplication />);
  const name = await screen.findByLabelText("Họ và tên");
  fireEvent.change(name, { target: { value: "Người nộp CV" } });
  fireEvent.change(screen.getByLabelText("Email nhận lịch"), {
    target: { value: "candidate@example.test" },
  });
  const button = screen.getByRole("button", {
    name: "Nộp CV & nhận email xác minh",
  });
  fireEvent.submit(button.closest("form")!);
  fireEvent.submit(button.closest("form")!);
  expect(api.submitApplication).toHaveBeenCalledTimes(1);
  expect(api.submitApplication.mock.calls[0][0]).toBeInstanceOf(FormData);
  expect(button).toBeDisabled();
  reject(new ApiError(400, "CV_FILE_INVALID", "Invalid file"));
  await waitFor(() => expect(button).not.toBeDisabled());
  expect(name).toHaveValue("Người nộp CV");
  expect(screen.getByRole("alert")).toBeInTheDocument();
});
it("keeps expired verification visible as an error instead of falsely displaying a submitted application", async () => {
  window.history.replaceState(null, "", "/apply#verify=expired-fixture");
  api.verifyApplication.mockRejectedValue(
    new ApiError(400, "VERIFICATION_INVALID", "Expired"),
  );
  render(<PublicApplication />);
  expect(await screen.findByRole("alert")).toBeInTheDocument();
  expect(screen.queryByText("Ứng viên")).not.toBeInTheDocument();
});
it("processes a verification link opened in the same already-mounted application tab", async () => {
  render(<PublicApplication />);
  await screen.findByLabelText("Họ và tên");
  api.myApplication.mockResolvedValue(candidate);
  window.history.pushState(null, "", "/apply#verify=same-tab-fixture");
  window.dispatchEvent(new HashChangeEvent("hashchange"));
  await waitFor(() =>
    expect(api.verifyApplication).toHaveBeenCalledWith("same-tab-fixture"),
  );
  expect(
    await screen.findByText("CV scan cần bản văn bản; chưa có OCR."),
  ).toBeInTheDocument();
});
