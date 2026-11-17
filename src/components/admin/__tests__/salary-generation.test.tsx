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
  api.listKpiPeriods.mockResolvedValue({ items: [{ id: "p1", code: "QA", name: "Kỳ QA", status: "finalized" }], total: 1, pageSize: 20 });
  api.listSalaryLedger.mockImplementation(async () => ({ items: balance ? [{ id: "l1", userId: "u1", kpiPeriodId: "p1", type: "kpi_earning", amount: balance, unit: "đồng ảo", description: "QA", createdAt: "2026-11-17T00:00:00Z" }] : [], total: balance ? 1 : 0, pageSize: 20 }));
  api.getUserSalaryBalance.mockImplementation(async () => ({ balance, earnedThisPeriod: balance, unit: "đồng ảo", virtual: true, latestEntries: [] }));
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
