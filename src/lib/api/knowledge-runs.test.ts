import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cancelKnowledgeRun,
  createKnowledgeRun,
  getKnowledgeRun,
  resumeKnowledgeRun,
} from "./knowledge-runs";
import { clearSession, setSession } from "@/lib/auth/session";

const user = {
  id: "u-admin",
  email: "admin@test.local",
  displayName: "Admin",
  roles: ["admin"],
  permissions: ["knowledge.read"],
};

const RUN = {
  id: "run-1",
  requestId: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
  agentId: "knowledge-assistant",
  agentVersion: "1",
  status: "queued",
  steps: 0,
  attempts: 0,
  inputTokens: null,
  outputTokens: null,
  errorCode: null,
  retryable: false,
  output: null,
  createdAt: "2026-10-28T09:00:00Z",
  updatedAt: "2026-10-28T09:00:00Z",
  deadlineAt: "2026-10-28T09:10:00Z",
};

const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), { status });

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:8080/api/v1");
  clearSession();
  setSession("token-a", user);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it("creates a knowledge run with a client-generated requestId and no empty roleCode", async () => {
  const fetcher = vi.fn().mockResolvedValue(json(202, RUN));
  vi.stubGlobal("fetch", fetcher);
  const run = await createKnowledgeRun("Liều thuốc nào cho cơn đau đầu?", undefined);
  expect(fetcher).toHaveBeenCalledWith(
    "http://localhost:8080/api/v1/admin/agents/knowledge-runs",
    expect.objectContaining({ method: "POST" }),
  );
  const body = JSON.parse(fetcher.mock.calls[0][1].body as string);
  expect(body.question).toBe("Liều thuốc nào cho cơn đau đầu?");
  expect(body.requestId).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  );
  expect("roleCode" in body).toBe(false);
  expect(run.id).toBe("run-1");
  expect(run.status).toBe("queued");
  expect(run.deadlineAt).toBe("2026-10-28T09:10:00Z");
});

it("creates a knowledge run with a roleCode when provided", async () => {
  const fetcher = vi.fn().mockResolvedValue(json(202, { ...RUN, id: "run-2" }));
  vi.stubGlobal("fetch", fetcher);
  await createKnowledgeRun("Câu hỏi", "nurse");
  const body = JSON.parse(fetcher.mock.calls[0][1].body as string);
  expect(body.roleCode).toBe("nurse");
});

it("gets a knowledge run by id from the admin agents namespace", async () => {
  const fetcher = vi.fn().mockResolvedValue(
    json(200, {
      ...RUN,
      status: "succeeded",
      steps: 3,
      attempts: 1,
      inputTokens: 120,
      outputTokens: 55,
      output: {
        answer: "Paracetamol.",
        insufficientEvidence: false,
        citations: [{ source: "handbook" }],
      },
    }),
  );
  vi.stubGlobal("fetch", fetcher);
  const run = await getKnowledgeRun("run-1");
  expect(fetcher.mock.calls[0][0]).toBe(
    "http://localhost:8080/api/v1/admin/agents/knowledge-runs/run-1",
  );
  expect(run.status).toBe("succeeded");
  expect(run.steps).toBe(3);
  expect(run.attempts).toBe(1);
  expect(run.inputTokens).toBe(120);
  expect(run.outputTokens).toBe(55);
  expect(run.output?.answer).toBe("Paracetamol.");
  expect(run.output?.insufficientEvidence).toBe(false);
  expect(run.output?.citations).toHaveLength(1);
});

it("cancels a knowledge run via the cancel subresource", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValue(json(200, { ...RUN, status: "cancelled" }));
  vi.stubGlobal("fetch", fetcher);
  const run = await cancelKnowledgeRun("run-9");
  expect(fetcher.mock.calls[0][0]).toBe(
    "http://localhost:8080/api/v1/admin/agents/knowledge-runs/run-9/cancel",
  );
  expect(fetcher.mock.calls[0][1].method).toBe("POST");
  expect(run.status).toBe("cancelled");
});

it("resumes a retryable failed run and parses the accepted envelope", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValue(json(202, { id: "run-7", accepted: true }));
  vi.stubGlobal("fetch", fetcher);
  const result = await resumeKnowledgeRun("run-7");
  expect(fetcher.mock.calls[0][0]).toBe(
    "http://localhost:8080/api/v1/admin/agents/knowledge-runs/run-7/resume",
  );
  expect(fetcher.mock.calls[0][1].method).toBe("POST");
  expect(result).toEqual({ id: "run-7", accepted: true });
});
