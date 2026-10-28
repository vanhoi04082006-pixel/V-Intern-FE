import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { AiConfiguration } from "../ai-configuration";

const api = vi.hoisted(() => ({ getAiConfiguration: vi.fn(), saveAiConfiguration: vi.fn() }));
vi.mock("@/lib/api/system-admin", () => api);
vi.mock("@/components/admin/business-agent-monitor", () => ({ BusinessAgentMonitor: () => null }));

const config = { policy: { model: "gemini-2.5-flash", timeoutMs: 90000, maxRetries: 2, version: 4 }, source: "database", provider: "gemini", credentialsConfigured: true, appliesTo: [] };
beforeEach(() => { vi.resetAllMocks(); api.getAiConfiguration.mockResolvedValue(config); });

it("confirms a real successful save, preserves the version and blocks a repeated submit while pending", async () => {
  let finish!: (value: typeof config) => void;
  api.saveAiConfiguration.mockReturnValue(new Promise(resolve => { finish = resolve; }));
  render(<AiConfiguration />);
  const model = await screen.findByLabelText(/Gemini model ID/);
  fireEvent.change(model, { target: { value: "gemini-2.5-pro" } });
  const form = screen.getByRole("button", { name: "Lưu cấu hình AI" }).closest("form")!;
  fireEvent.submit(form); fireEvent.submit(form);
  expect(api.saveAiConfiguration).toHaveBeenCalledOnce();
  expect(api.saveAiConfiguration).toHaveBeenCalledWith({ ...config.policy, model: "gemini-2.5-pro" });
  expect(screen.queryByText(/Đã lưu cấu hình AI\./)).not.toBeInTheDocument();
  await act(async () => finish(config));
  expect((await screen.findByText(/Đã lưu cấu hình AI\./)).closest('[role="status"]')).not.toBeNull();
});

it("keeps edited values and never claims success when the server rejects a save", async () => {
  api.saveAiConfiguration.mockRejectedValue(new Error("Server rejected policy"));
  render(<AiConfiguration />);
  const model = await screen.findByLabelText(/Gemini model ID/);
  fireEvent.change(model, { target: { value: "gemini-2.5-pro" } });
  fireEvent.submit(screen.getByRole("button", { name: "Lưu cấu hình AI" }).closest("form")!);
  await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  expect(model).toHaveValue("gemini-2.5-pro");
  expect(screen.queryByText(/Đã lưu cấu hình AI\./)).not.toBeInTheDocument();
});
