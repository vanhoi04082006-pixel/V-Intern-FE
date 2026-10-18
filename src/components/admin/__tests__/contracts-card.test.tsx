import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { parseSystemContracts } from "@/lib/api/system-admin";
import { ContractsCard } from "@/components/admin/contracts-card";

const sealedPayload = {
  checkedAt: "2026-10-17T06:00:00.000Z",
  source: "GRADING_SUITES_JSON (operator-sealed; immutable per contract version)",
  valid: true,
  error: null,
  contracts: [
    {
      key: "LEARN-NOTES-V1:b2d1f16a-d64e-48ba-853e-82bf28854ff4",
      suiteId: "qa-notes-foundation-840404b2-v1",
      digest: "a".repeat(64),
      status: "active",
      issues: [],
      operator: {
        version: "v1.0.0",
        reviewer: "vintern operator audit 2026-10-17",
        sealedAt: "2026-10-17T06:00:00Z",
        images: { runtime: "runtime@sha256:1111", tester: "tester@sha256:2222" },
        complete: true,
      },
    },
  ],
};

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:8080/api/v1/");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("parseSystemContracts", () => {
  it("giữ nguyên trạng thái/issue/operator do BE trả", () => {
    expect(parseSystemContracts(sealedPayload)).toMatchObject({
      valid: true,
      error: null,
      contracts: [
        { suiteId: "qa-notes-foundation-840404b2-v1", status: "active", operator: { complete: true } },
      ],
    });
  });
});

describe("ContractsCard (admin services)", () => {
  it("liệt kê hợp đồng đã seal và kiểm tra được bản nháp trước khi seal", async () => {
    const fetchMock = vi.fn().mockImplementation((input: unknown, init?: { method?: string; body?: string }) => {
      const path = String(input);
      const method = init?.method ?? "GET";
      if (method === "POST" && path.includes("/admin/system/contracts/validate")) {
        const data = JSON.parse(init?.body ?? "{}");
        const parsed = parseSystemContracts({ ...sealedPayload, valid: false, error: null, contracts: [{ ...sealedPayload.contracts[0], status: "invalid", issues: [{ code: "DIGEST_INVALID", detail: "x" }] }] });
        void data;
        return Promise.resolve(new Response(JSON.stringify(parsed), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify(sealedPayload), { status: 200 }));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ContractsCard />);

    await waitFor(() => expect(screen.getByText(/qa-notes-foundation-840404b2-v1/)).toBeInTheDocument());
    expect(screen.getByText(/active · đầy đủ metadata/)).toBeInTheDocument();
    expect(screen.getByText(/v1\.0\.0/)).toBeInTheDocument();

    const user = userEvent.setup();
    fireEvent.change(screen.getByLabelText("Nội dung JSON cần kiểm tra"), {
      target: { value: '{"T:t":{"id":"x","digest":"zz"}}' },
    });
    await user.click(screen.getByRole("button", { name: "Kiểm tra JSON" }));

    await waitFor(() => expect(screen.getByText("Chặn seal")).toBeInTheDocument());
    const post = fetchMock.mock.calls.find(([, init]) => (init as { method?: string }).method === "POST");
    expect((post?.[1] as { body?: string }).body).toContain('"data"');
  });
});
