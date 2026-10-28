import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { InterviewRebooking } from "./interview-rebooking";
const api = vi.hoisted(() => ({ rebookApplication: vi.fn() }));
vi.mock("@/lib/api/applications", async () => ({
  ...(await vi.importActual("@/lib/api/applications")),
  ...api,
}));
beforeAll(() =>
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
  }),
);
const application = {
  id: "candidate",
  fullName: "Ứng viên",
  status: "deferred",
  matchedRole: "frontend",
  revision: 1,
  hasCv: true,
  timeline: [],
  booking: null,
  analysis: { facts: null, match: null },
  interviewPolicy: {
    serverNow: '2026-10-25T02:00:00Z',
    canRebook: true,
    attemptsUsed: 1,
    attemptsRemaining: 2,
    nextEligibleAt: null,
    allowedRoleCodes: ["frontend"],
  },
};
afterEach(()=>vi.restoreAllMocks());
const slot = {
  id: "slot",
  roleCode: "frontend",
  startsAt: "2030-10-25T02:00:00Z",
  endsAt: "2030-10-25T02:30:00Z",
  timezone: "Asia/Ho_Chi_Minh",
  capacity: 1,
  booked: 0,
  status: "open",
  minimumPreparationMinutes: 60,
  credentialsLeadMinutes: 30,
};
it("shows attempt policy, limits careers and requires an explicit reason without double submission", async () => {
  vi.spyOn(Date,'now').mockReturnValue(Date.UTC(2040,0,1));
  let complete!: (value: boolean) => void;
  api.rebookApplication.mockReturnValue(
    new Promise((resolve) => {
      complete = resolve;
    }),
  );
  const onChanged = vi.fn().mockResolvedValue(undefined);
  render(
    <InterviewRebooking
      roundId="round"
      application={application}
      slots={[slot, { ...slot, id: "foreign", roleCode: "unrelated-role" }]}
      onChanged={onChanged}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Hẹn phỏng vấn lại" }));
  expect(screen.getByText(/ngoại lệ.*ghi audit/i)).toBeInTheDocument();
  expect(
    screen
      .getByRole("combobox", { name: "Khung giờ mới" })
      .querySelectorAll("option"),
  ).toHaveLength(2);
  fireEvent.change(screen.getByRole("combobox", { name: "Khung giờ mới" }), {
    target: { value: "slot" },
  });
  fireEvent.change(screen.getByLabelText("Lý do hẹn lại / ngoại lệ"), {
    target: { value: "Giảng viên đã trao đổi và xác nhận lịch mới." },
  });
  const submit = screen.getByRole("button", { name: "Xác nhận hẹn lại" });
  fireEvent.submit(submit.closest("form")!);
  fireEvent.submit(submit.closest("form")!);
  expect(api.rebookApplication).toHaveBeenCalledTimes(1);
  expect(api.rebookApplication).toHaveBeenCalledWith(
    "round",
    "candidate",
    "slot",
    "Giảng viên đã trao đổi và xác nhận lịch mới.",
  );
  expect(submit).toBeDisabled();
  complete(true);
  await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
  expect(await screen.findByRole("status")).toHaveTextContent(
    "Không đặt lại mật khẩu hoặc số lượt",
  );
});
