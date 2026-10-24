import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, expect, it, vi } from "vitest";
import { RecruitmentRounds } from "./recruitment-rounds";

const api = vi.hoisted(() => ({
  listRecruitmentRounds: vi.fn(),
  roundDetail: vi.fn(),
  roundApplications: vi.fn(),
  staffApplication: vi.fn(),
  resendApplicationCredentials: vi.fn(),
}));
vi.mock("@/lib/api/applications", async () => ({
  ...(await vi.importActual("@/lib/api/applications")),
  ...api,
}));
vi.mock("@/lib/api/career-roles", () => ({
  listRecruitingCareers: vi.fn().mockResolvedValue([]),
}));
const round = {
  id: "round",
  name: "Đợt kiểm chứng",
  status: "open",
  opensAt: "2026-10-24T01:00:00Z",
  closesAt: "2026-11-01T01:00:00Z",
  slots: [],
};
const application = {
  id: "candidate",
  fullName: "Ứng viên kiểm chứng",
  status: "booked",
  matchedRole: "frontend",
  revision: 1,
  hasCv: true,
  booking: {
    id: "booking",
    roleCode: "frontend",
    roleName: "Frontend",
    status: "confirmed",
    startsAt: "2026-11-02T02:00:00Z",
    endsAt: "2026-11-02T02:30:00Z",
    timezone: "Asia/Ho_Chi_Minh",
    version: 1,
  },
  timeline: [],
  analysis: {
    facts: {
      confidence: 0.8,
      missing: ["Cần mô tả kiểm thử"],
      facts: [
        { skill: "React", ref: "page:2", quote: "Tôi đã xây dự án React." },
      ],
    },
    match: {
      roleCode: "frontend",
      confidence: 0.75,
      reason: "Có dự án minh chứng.",
    },
  },
};
beforeAll(() => {
  // jsdom has no native dialog API; real-browser acceptance exercises showModal/focus separately.
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        this.setAttribute("open", "");
      },
    },
    close: {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        this.removeAttribute("open");
      },
    },
  });
});
beforeEach(() => {
  vi.clearAllMocks();
  api.listRecruitmentRounds.mockResolvedValue([round]);
  api.roundDetail.mockResolvedValue(round);
  api.roundApplications.mockResolvedValue({
    page: 1,
    total: 1,
    items: [
      {
        id: application.id,
        fullName: application.fullName,
        email: "qa@example.test",
        status: "booked",
        matchedRole: "frontend",
        lastCode: null,
      },
    ],
  });
  api.staffApplication.mockResolvedValue(application);
});
it("shows cited CV facts to staff and requires an explicit credential resend action without resetting a password", async () => {
  let complete!: (value: boolean) => void;
  api.resendApplicationCredentials.mockReturnValue(
    new Promise((resolve) => {
      complete = resolve;
    }),
  );
  render(<RecruitmentRounds />);
  fireEvent.change(await screen.findByRole("combobox", { name: "Đợt tuyển" }), {
    target: { value: "round" },
  });
  fireEvent.click(await screen.findByRole("tab", { name: "Hồ sơ ứng tuyển" }));
  fireEvent.click(await screen.findByRole("button", { name: "Xem hồ sơ" }));
  fireEvent.click(
    await screen.findByText("Phân tích CV & bằng chứng của Agent"),
  );
  expect(screen.getByText("Tôi đã xây dự án React.")).toBeVisible();
  expect(screen.getByText("· Trang 2")).toBeInTheDocument();
  expect(screen.getByText("Cần mô tả kiểm thử")).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: /đăng nhập/i }),
  ).not.toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Gửi lại email đăng nhập" }),
  );
  expect(api.resendApplicationCredentials).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole("checkbox", { name: /nguy cơ thư bị gửi trùng/ }),
  );
  const confirm = screen.getByRole("button", {
    name: "Xác nhận gửi lại email",
  });
  fireEvent.click(confirm);
  fireEvent.click(confirm);
  expect(api.resendApplicationCredentials).toHaveBeenCalledTimes(1);
  expect(api.resendApplicationCredentials).toHaveBeenCalledWith(
    "round",
    "candidate",
    true,
  );
  expect(confirm).toBeDisabled();
  complete(true);
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(screen.getByRole("status")).toHaveTextContent(
    "Không tạo hay thay đổi mật khẩu",
  );
});
