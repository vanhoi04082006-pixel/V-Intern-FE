import { beforeAll, beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AdminSettings } from "../admin-management";

const api = vi.hoisted(() => ({ getSettings: vi.fn(), saveSetting: vi.fn() }));
vi.mock("@/lib/api/admin", async original => ({
  ...(await original<typeof import("@/lib/api/admin")>()),
  ...api,
}));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});

beforeEach(() => {
  vi.clearAllMocks();
  api.getSettings.mockResolvedValue([]);
  api.saveSetting.mockImplementation(async value => {
    const rows = [{ ...value, updatedAt: "2026-10-23T00:00:00Z" }];
    api.getSettings.mockResolvedValue(rows);
    return rows;
  });
});

it.each([true, false])("can create business settings when embedded=%s without duplicate page titles", async embedded => {
  render(<AdminSettings embedded={embedded} />);
  await screen.findByText("Chưa có cấu hình nghiệp vụ.");
  expect(screen.queryAllByRole("heading", { level: 1 })).toHaveLength(embedded ? 0 : 1);
  fireEvent.click(screen.getByRole("button", { name: "Thêm cấu hình" }));
  const dialog = screen.getByRole("dialog");
  fireEvent.change(within(dialog).getByLabelText("Khóa cấu hình"), { target: { value: "program.unit.test" } });
  fireEvent.change(within(dialog).getByLabelText("Giá trị cấu hình"), { target: { value: "Nội dung cấu hình" } });
  fireEvent.change(within(dialog).getByLabelText("Mô tả cấu hình"), { target: { value: "Chính sách thực tập" } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Lưu cấu hình" }));
  await waitFor(() => expect(api.saveSetting).toHaveBeenCalledWith({ key: "program.unit.test", value: "Nội dung cấu hình", description: "Chính sách thực tập" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(await screen.findByText("Nội dung cấu hình")).toBeInTheDocument();
});
