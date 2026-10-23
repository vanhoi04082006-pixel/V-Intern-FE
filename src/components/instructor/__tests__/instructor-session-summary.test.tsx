import { expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { InstructorSessionSummary } from "../instructor-session-summary";
import type { SessionOverviewRow } from "@/lib/api/sessions";

const row: SessionOverviewRow = {
  id: "session-1",
  code: "SESSION-1",
  name: "Phiên Web",
  status: "active",
  startDate: "2026-10-01",
  endDate: "2026-12-31",
  project: null,
  memberCount: 2,
  sprintCount: 1,
  taskTotal: 8,
  taskDone: 3,
  taskPercent: 37.5,
  alerts: { pendingReview: 2, overdueTasks: 1, sessionOverdue: false },
};

it("labels visible-page statistics and links directly to the session review queue", () => {
  render(<InstructorSessionSummary rows={[row]} total={42} />);
  expect(screen.getByText("42")).toBeInTheDocument();
  expect(screen.getByText(/1 phiên đang hiển thị/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Duyệt 2 bài/ })).toHaveAttribute(
    "href",
    "/instructor/sessions/session-1?taskStatus=review#session-work",
  );
  expect(screen.queryByText(/42 phiên đang chạy/)).not.toBeInTheDocument();
});

it("does not turn missing alert data into a zero or claim the whole system is clear", () => {
  render(
    <InstructorSessionSummary
      rows={[{ ...row, alerts: undefined }]}
      total={42}
    />,
  );
  expect(screen.getAllByText("Chưa có dữ liệu")).toHaveLength(2);
  expect(
    screen.getByText("Chưa có dữ liệu cảnh báo cho các phiên này."),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: /Duyệt .* bài/ }),
  ).not.toBeInTheDocument();
});
