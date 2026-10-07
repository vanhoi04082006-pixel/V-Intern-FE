import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch, ApiError } from "@/lib/auth/api-client";
import { request } from "@/lib/api/client";
import { clearSession, getAccessToken, setSession } from "@/lib/auth/session";
const user = {
  id: "u",
  email: "u@test.local",
  displayName: "Intern",
  roles: ["intern"],
  permissions: [],
};
const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), { status });
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:8080/api/v1/");
  clearSession();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe("Nest HTTP boundary", () => {
  it("uses the complete versioned base and credentials", async () => {
    const fetcher = vi.fn().mockResolvedValue(json(200, { ok: true }));
    vi.stubGlobal("fetch", fetcher);
    await apiFetch("/auth/login", {
      method: "POST",
      body: { email: "a", password: "b" },
    });
    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/auth/login",
      expect.objectContaining({ credentials: "include" }),
    );
  });
  it("missing config makes no request", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    await expect(apiFetch("/intern/me/workspace")).rejects.toMatchObject({
      code: "API_CONFIG_MISSING",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each([400, 401, 403, 404, 409, 422, 500, 503])(
    "preserves HTTP %s and validation details",
    async (status) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          json(status, {
            code: "TEST_ERROR",
            message: ["invalid email"],
            details: { field: "email" },
          }),
        ),
      );
      await expect(apiFetch("/test")).rejects.toMatchObject({
        statusCode: status,
        code: "TEST_ERROR",
        details: { field: "email" },
        message: "invalid email",
      });
    },
  );
  it("network unavailable is an error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(apiFetch("/test")).rejects.toBeInstanceOf(ApiError);
  });
  it("keeps cancellation distinguishable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new DOMException("cancelled", "AbortError")),
    );
    await expect(
      apiFetch("/test", { signal: new AbortController().signal }),
    ).rejects.toMatchObject({ name: "AbortError" });
  });
  it("concurrent 401s rotate once and retry with the new token", async () => {
    setSession("old", user);
    const fetcher = vi.fn(async (url: string, options: RequestInit) => {
      if (url.endsWith("/auth/refresh")) {
        await Promise.resolve();
        return json(200, { accessToken: "new", user });
      }
      return json(
        options.headers &&
          new Headers(options.headers).get("Authorization") === "Bearer new"
          ? 200
          : 401,
        { ok: true },
      );
    });
    vi.stubGlobal("fetch", fetcher);
    await Promise.all([request("/one", (x) => x), request("/two", (x) => x)]);
    expect(
      fetcher.mock.calls.filter(([url]) => url.endsWith("/auth/refresh")),
    ).toHaveLength(1);
    expect(getAccessToken()).toBe("new");
  });
  it("refresh failure clears state without looping", async () => {
    setSession("old", user);
    const fetcher = vi.fn().mockResolvedValue(json(401, { code: "EXPIRED" }));
    vi.stubGlobal("fetch", fetcher);
    await expect(request("/test", (x) => x)).rejects.toMatchObject({
      statusCode: 401,
    });
    expect(getAccessToken()).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("403 never refreshes or falls back", async () => {
    setSession("old", user);
    const fetcher = vi.fn().mockResolvedValue(json(403, {}));
    vi.stubGlobal("fetch", fetcher);
    await expect(request("/test", (x) => x)).rejects.toMatchObject({
      statusCode: 403,
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
