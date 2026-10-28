import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { RecruitmentRounds } from "./recruitment-rounds";

const round = { id: "keyboard-round", name: "Đợt kiểm tra bàn phím", status: "open", opensAt: "2026-10-26T01:00:00Z", closesAt: "2026-11-01T01:00:00Z", slots: [] };
vi.mock("@/lib/api/applications", async () => ({
  ...(await vi.importActual("@/lib/api/applications")),
  listRecruitmentRounds: vi.fn().mockResolvedValue([{ id: "keyboard-round", name: "Đợt kiểm tra bàn phím", status: "open" }]),
  roundDetail: vi.fn().mockImplementation(async () => round),
  roundApplications: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 25 }),
}));
vi.mock("@/lib/api/career-roles", () => ({ listRecruitingCareers: vi.fn().mockResolvedValue([]) }));

it("supports arrow and Home/End navigation with selected focus and a linked tab panel", async () => {
  render(<RecruitmentRounds />);
  fireEvent.change(await screen.findByRole("combobox", { name: "Đợt tuyển" }), { target: { value: round.id } });
  const schedule = await screen.findByRole("tab", { name: "Khung giờ phỏng vấn" });
  const candidates = screen.getByRole("tab", { name: "Hồ sơ ứng tuyển" });
  schedule.focus();
  fireEvent.keyDown(schedule, { key: "ArrowRight" });
  expect(candidates).toHaveFocus();
  expect(candidates).toHaveAttribute("aria-selected", "true");
  expect(schedule).toHaveAttribute("tabindex", "-1");
  expect(screen.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", candidates.id);
  expect(candidates).toHaveAttribute("aria-controls", screen.getByRole("tabpanel").id);
  fireEvent.keyDown(candidates, { key: "Home" });
  expect(schedule).toHaveFocus();
  fireEvent.keyDown(schedule, { key: "End" });
  expect(candidates).toHaveFocus();
  fireEvent.keyDown(candidates, { key: "ArrowLeft" });
  expect(schedule).toHaveFocus();
});
