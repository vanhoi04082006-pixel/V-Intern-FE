import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { ReportsWorkspace } from "../reports-workspace";
import { createReport, getSavedReport, listReports, type SavedReport } from "@/lib/api/reports";

vi.mock("@/components/product/academic-picker", () => ({ AcademicPicker: ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => <input aria-label={label} value={value} onChange={e => onChange(e.target.value)} /> }));
vi.mock('../report-scope-pickers', () => ({ ReportScopePickers: () => null }));
vi.mock("@/lib/api/reports", async importOriginal => ({ ...await importOriginal<typeof import("@/lib/api/reports")>(), createReport: vi.fn(), getSavedReport: vi.fn(), listReports: vi.fn() }));
const saved: SavedReport = { id: "r1", title: "Old session report", kind: "progress", projectId: "p1", projectName: "Project one", createdAt: "2026-10-12T00:00:00Z", snapshot: { projectName: "Project one", scope: { projectId: "p1", from: undefined, to: undefined }, members: [] } };
beforeEach(() => {
  vi.mocked(listReports).mockResolvedValue({ items: [], total: 0, counts: [] });
  vi.mocked(getSavedReport).mockResolvedValue(saved);
});
it('keeps embedded report creation and history inside its session', async () => {
  vi.mocked(createReport).mockResolvedValue(saved);
  render(<ReportsWorkspace initialProjectId="p1" initialSessionId="s1" lockedScope embedded />);
  await waitFor(() => expect(listReports).toHaveBeenLastCalledWith(1, '', expect.any(AbortSignal), { projectId: 'p1', sessionId: 's1' }));
  expect(screen.queryByLabelText('Phiên thực tập')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Tên báo cáo'), { target: { value: 'Phiên hiện tại' } });
  fireEvent.click(screen.getByRole('button', { name: 'Tạo và lưu báo cáo' }));
  await waitFor(() => expect(createReport).toHaveBeenLastCalledWith(expect.objectContaining({ projectId: 'p1', sessionId: 's1', title: 'Phiên hiện tại' })));
});
it("does not select a late saved report after the user switches session scope", async () => {
  let resolveSave!: (value: typeof saved) => void;
  vi.mocked(createReport).mockImplementation(() => new Promise(resolve => { resolveSave = resolve; }));
  render(<ReportsWorkspace initialProjectId="p1" initialSessionId="s1" />);
  fireEvent.change(screen.getByLabelText("Tên báo cáo"), { target: { value: "Old session report" } });
  fireEvent.click(screen.getByRole("button", { name: "Tạo và lưu báo cáo" }));
  fireEvent.change(screen.getByLabelText("Phiên thực tập"), { target: { value: "s2" } });
  await act(async () => resolveSave(saved));
  expect(screen.queryByText("Chi tiết bản chụp")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Phiên thực tập")).toHaveValue("s2");
});
