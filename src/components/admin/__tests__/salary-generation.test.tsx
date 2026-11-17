import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { SalaryConsole } from "../salary-console";
import { ApiError } from "@/lib/auth/api-client";

const api = vi.hoisted(() => ({
  listKpiPeriods: vi.fn(), listSalaryLedger: vi.fn(), generateSalaryForPeriod: vi.fn(),
  getUserSalaryBalance: vi.fn(), createSalaryAdjustment: vi.fn(),
  salaryAdjustmentTypes: ["bonus", "penalty", "adjustment", "reversal"],
  salaryLedgerTypes: ["kpi_earning", "bonus", "penalty", "adjustment", "reversal"],
}));
vi.mock("@/lib/api/finance", () => api);
vi.mock("@/lib/api/management", () => ({ listPerformance: async () => ({ items: [{ userId: "u1", displayName: "SV QA" }], total: 1, pageSize: 10 }) }));
let balance = 0;
beforeEach(() => {
  vi.resetAllMocks(); balance = 0;
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
  api.listKpiPeriods.mockResolvedValue({ items: [{ id: "p1", code: "QA", name: "Kỳ QA", status: "finalized" }], total: 1, pageSize: 20 });
  api.listSalaryLedger.mockImplementation(async () => ({ items: balance ? [{ id: "l1", userId: "u1", kpiPeriodId: "p1", type: "kpi_earning", amount: balance, unit: "đồng ảo", description: "QA", createdAt: "2026-11-17T00:00:00Z" }] : [], total: balance ? 1 : 0, pageSize: 20 }));
  api.getUserSalaryBalance.mockImplementation(async () => ({ balance, earnedThisPeriod: balance, unit: "đồng ảo", virtual: true, latestEntries: [] }));
});

it("opens reversal from the selected ledger row without asking the user to find an internal ID", async () => {
  balance = 10000;
  api.createSalaryAdjustment.mockResolvedValue({});
  render(<SalaryConsole />);
  fireEvent.click(await screen.findByRole("button", { name: "Hoàn đảo Thu nhập KPI 10.000 đồng ảo của SV QA" }));
  const dialog = screen.getByRole("dialog", { name: "Hoàn đảo dòng lương ảo" });
  expect(within(dialog).queryByLabelText(/Mã dòng gốc/)).not.toBeInTheDocument();
  expect(within(dialog).getByText(/giữ nguyên dòng gốc/i)).toBeInTheDocument();
  fireEvent.change(within(dialog).getByLabelText(/Lý do/), { target: { value: "QA hoàn đảo dòng đã chọn" } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Xác nhận hoàn đảo" }));
  await waitFor(() => expect(api.createSalaryAdjustment).toHaveBeenCalledWith({ userId: "u1", type: "reversal", sourceId: "l1", reason: "QA hoàn đảo dòng đã chọn", requestId: expect.any(String) }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});

it("reuses an adjustment request ID after a lost response and allocates a new one only when the payload changes", async () => {
  api.createSalaryAdjustment.mockRejectedValueOnce(new ApiError(0, "NETWORK_ERROR", "Lost response")).mockRejectedValueOnce(new ApiError(0, "NETWORK_ERROR", "Lost response")).mockResolvedValue({});
  render(<SalaryConsole />);
  fireEvent.click(screen.getByRole("button", { name: "Ghi điều chỉnh" }));
  const member = screen.getByRole("combobox", { name: "Sinh viên" });
  await within(member).findByRole("option", { name: "SV QA" });
  fireEvent.change(member, { target: { value: "u1" } });
  fireEvent.change(screen.getByLabelText(/Số tiền/), { target: { value: "10000" } });
  fireEvent.change(screen.getByLabelText(/Lý do/), { target: { value: "QA thử lại khi mất phản hồi" } });
  fireEvent.click(screen.getByRole("button", { name: "Ghi vào sổ" }));
  await screen.findByRole("alert");
  const original = api.createSalaryAdjustment.mock.calls[0][0];
  fireEvent.click(screen.getByRole("button", { name: "Ghi vào sổ" }));
  await waitFor(() => expect(api.createSalaryAdjustment).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(screen.getByRole("button", { name: "Ghi vào sổ" })).toBeEnabled());
  expect(api.createSalaryAdjustment.mock.calls[1][0]).toEqual(original);
  fireEvent.change(screen.getByLabelText(/Số tiền/), { target: { value: "20000" } });
  fireEvent.click(screen.getByRole("button", { name: "Ghi vào sổ" }));
  await waitFor(() => expect(api.createSalaryAdjustment).toHaveBeenCalledTimes(3));
  expect(api.createSalaryAdjustment.mock.calls[2][0].amount).toBe(20000);
  expect(api.createSalaryAdjustment.mock.calls[2][0].requestId).not.toBe(original.requestId);
});

it("explains a whitespace-only reason rather than silently ignoring the adjustment", async () => {
  render(<SalaryConsole />);
  fireEvent.click(screen.getByRole("button", { name: "Ghi điều chỉnh" }));
  const member = screen.getByRole("combobox", { name: "Sinh viên" });
  await within(member).findByRole("option", { name: "SV QA" });
  fireEvent.change(member, { target: { value: "u1" } });
  fireEvent.change(screen.getByLabelText(/Số tiền/), { target: { value: "10000" } });
  fireEvent.change(screen.getByLabelText(/Lý do/), { target: { value: "   " } });
  fireEvent.click(screen.getByRole("button", { name: "Ghi vào sổ" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Nhập lý do điều chỉnh, không chỉ khoảng trắng.");
  expect(api.createSalaryAdjustment).not.toHaveBeenCalled();
});

it("keeps the adjustment modal and operation identity alive until the pending write finishes", async () => {
  let finish!: (value: object) => void;
  api.createSalaryAdjustment.mockReturnValue(new Promise(resolve => { finish = resolve; }));
  render(<SalaryConsole />);
  fireEvent.click(screen.getByRole("button", { name: "Ghi điều chỉnh" }));
  const member = screen.getByRole("combobox", { name: "Sinh viên" });
  await within(member).findByRole("option", { name: "SV QA" });
  fireEvent.change(member, { target: { value: "u1" } });
  fireEvent.change(screen.getByLabelText(/Số tiền/), { target: { value: "10000" } });
  fireEvent.change(screen.getByLabelText(/Lý do/), { target: { value: "QA đang chờ ghi sổ" } });
  fireEvent.click(screen.getByRole("button", { name: "Ghi vào sổ" }));
  const dialog = screen.getByRole("dialog", { name: "Ghi điều chỉnh lương ảo" });
  expect(within(dialog).getByRole("button", { name: "Đóng" })).toBeDisabled();
  fireEvent(dialog, new Event("cancel", { cancelable: true }));
  fireEvent.click(dialog);
  expect(screen.getByRole("dialog")).toBe(dialog);
  expect(api.createSalaryAdjustment).toHaveBeenCalledOnce();
  await act(async () => finish({}));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});
async function selectPeriod() {
  await screen.findByRole("option", { name: "Kỳ QA (QA)" });
  fireEvent.change(screen.getByRole("combobox", { name: "Kỳ KPI đã chốt" }), { target: { value: "p1" } });
}

it("shows a configuration failure and retains the selected period for retry", async () => {
  api.generateSalaryForPeriod.mockRejectedValueOnce(new ApiError(409, "VIRTUAL_SALARY_CONFIG_MISSING", "Internal detail")).mockResolvedValue({ generated: 0, skipped: 0, unit: "đồng ảo", kpiPeriodId: "p1" });
  render(<SalaryConsole />);
  await selectPeriod();
  fireEvent.click(screen.getByRole("button", { name: "Sinh lương cho kỳ" }));
  await screen.findByRole("alert");
  expect(screen.getByRole("alert")).toHaveTextContent("Cài đặt hệ thống");
  expect(screen.getByRole("combobox", { name: "Kỳ KPI đã chốt" })).toHaveValue("p1");
  expect(screen.queryByText(/Đã sinh/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Sinh lương cho kỳ" }));
  await screen.findByText(/Đã sinh 0 dòng/);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("disables generation and prevents duplicate requests while a batch is pending", async () => {
  let finish!: (value: { generated: number; skipped: number; unit: string; kpiPeriodId: string }) => void;
  api.generateSalaryForPeriod.mockReturnValue(new Promise(resolve => { finish = resolve; }));
  render(<SalaryConsole />);
  await selectPeriod();
  const generate = screen.getByRole("button", { name: "Sinh lương cho kỳ" });
  fireEvent.click(generate);
  expect(generate).toBeDisabled();
  fireEvent.click(generate);
  expect(api.generateSalaryForPeriod).toHaveBeenCalledOnce();
  await act(async () => finish({ generated: 0, skipped: 0, unit: "đồng ảo", kpiPeriodId: "p1" }));
  await waitFor(() => expect(generate).toBeEnabled());
});

it("refreshes the visible balance as well as the ledger after successful generation", async () => {
  api.generateSalaryForPeriod.mockImplementation(async () => { balance = 955000; return { generated: 1, skipped: 0, unit: "đồng ảo", kpiPeriodId: "p1" }; });
  render(<SalaryConsole />);
  await selectPeriod();
  const member = screen.getByRole("combobox", { name: "Sinh viên cần tra" });
  await within(member).findByRole("option", { name: "SV QA" });
  fireEvent.change(member, { target: { value: "u1" } });
  const balanceSection = screen.getByRole("heading", { name: "Tra số dư sinh viên" }).closest("section")!;
  await within(balanceSection).findByText("Thu nhập kỳ đang chọn:", { exact: false });
  fireEvent.click(screen.getByRole("button", { name: "Sinh lương cho kỳ" }));
  await screen.findByText(/Đã sinh 1 dòng/);
  await waitFor(() => expect(within(balanceSection).getByText(/Thu nhập kỳ đang chọn:/)).toHaveTextContent("955.000 đồng ảo"));
});
