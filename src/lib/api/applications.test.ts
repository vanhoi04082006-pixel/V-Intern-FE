import { expect, it, vi, afterEach } from "vitest";
import { apiFetch } from "@/lib/auth/api-client";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("lets the browser set multipart boundary and includes only the intended candidate cookie transport", async () => {
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:8080/api/v1");
  const fetcher = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ accepted: true }), {
        headers: { "Content-Type": "application/json" },
      }),
    );
  vi.stubGlobal("fetch", fetcher);
  const data = new FormData();
  data.set("fullName", "Ứng viên");
  await apiFetch("/applications", { method: "POST", formData: data });
  expect(fetcher).toHaveBeenCalledWith(
    "http://localhost:8080/api/v1/applications",
    expect.objectContaining({
      body: data,
      method: "POST",
      credentials: "include",
      headers: {},
    }),
  );
  expect(fetcher.mock.calls[0][0]).not.toContain("Ứng viên");
});
