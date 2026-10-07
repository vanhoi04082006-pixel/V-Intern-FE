import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchCurrentUser,
  getSessionUser,
  login,
  logout,
  refreshSession,
  register,
  requestPasswordReset,
} from "@/lib/auth/auth-service";
import { clearSession } from "@/lib/auth/session";

const API_BASE = "http://localhost:8080/api/v1";

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const LOGIN_SUCCESS_BODY = {
  accessToken: "test-access-token",
  tokenType: "Bearer",
  expiresInSeconds: 900,
  user: {
    id: "user-1",
    email: "admin@vintern.local",
    displayName: "V-Intern Admin",
    roles: ["admin"],
    permissions: ["auth.me.read"],
  },
};

const VALID_CREDENTIALS = {
  identifier: "admin@vintern.local",
  password: "VInternDev123!",
  remember: true,
};

describe("auth-service (nối BE Module 1)", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    clearSession();
    process.env.NEXT_PUBLIC_API_BASE_URL = API_BASE;
  });

  it("chưa cấu hình API → not-connected, không gọi fetch", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "";
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const result = await login(VALID_CREDENTIALS);

    expect(result).toEqual({
      ok: false,
      kind: "not-connected",
      message: expect.stringContaining("NEXT_PUBLIC_API_BASE_URL"),
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("identifier không phải email → auth-error, không gọi fetch (BE chỉ nhận email)", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const result = await login({
      identifier: "not-an-email",
      password: "whatever123",
      remember: true,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.kind).toBe("auth-error");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("login thành công → POST đúng URL/method/body, KHÔNG gửi remember, lưu session", async () => {
    const fetchSpy = vi.fn(async () => jsonResponse(200, LOGIN_SUCCESS_BODY));
    vi.stubGlobal("fetch", fetchSpy);

    const result = await login({
      ...VALID_CREDENTIALS,
      identifier: " admin@vintern.local ",
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${API_BASE}/auth/login`);
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/json",
    );
    expect(JSON.parse(init.body as string)).toEqual({
      email: "admin@vintern.local",
      password: "VInternDev123!",
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.user.email).toBe("admin@vintern.local");
    expect(getSessionUser()?.email).toBe("admin@vintern.local");
  });

  it("response sai shape → system-error, không lưu session", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(200, { tokenType: "Bearer" })),
    );

    const result = await login(VALID_CREDENTIALS);

    expect(result).toEqual({
      ok: false,
      kind: "system-error",
      message: "Không thể kết nối đến hệ thống. Vui lòng thử lại sau.",
    });
    expect(getSessionUser()).toBeNull();
  });

  it.each([["null", null]])(
    "login 200/%s → system-error, không throw, không lưu session",
    async (_label, body) => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => jsonResponse(200, body)),
      );

      const result = await login(VALID_CREDENTIALS);

      expect(result).toEqual({
        ok: false,
        kind: "system-error",
        message: "Không thể kết nối đến hệ thống. Vui lòng thử lại sau.",
      });
      expect(getSessionUser()).toBeNull();
    },
  );

  it.each([
    ["primitive", "ok-string"],
    ["array", [{ accessToken: "x", user: LOGIN_SUCCESS_BODY.user }]],
  ])("login 200/%s → system-error, không lưu session", async (_label, body) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(200, body)),
    );

    const result = await login(VALID_CREDENTIALS);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.kind).toBe("system-error");
    expect(getSessionUser()).toBeNull();
  });

  it("login từ chối roles/permissions chứa phần tử không phải string", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(200, {
          ...LOGIN_SUCCESS_BODY,
          user: { ...LOGIN_SUCCESS_BODY.user, roles: ["admin", 123] },
        }),
      ),
    );

    const result = await login(VALID_CREDENTIALS);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.kind).toBe("system-error");
    expect(getSessionUser()).toBeNull();
  });

  it("refresh 200/null → null và xóa session", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        calls.push(url);
        if (url.endsWith("/auth/login"))
          return jsonResponse(200, LOGIN_SUCCESS_BODY);
        return jsonResponse(200, null);
      }),
    );

    await login(VALID_CREDENTIALS);
    expect(getSessionUser()).not.toBeNull();
    await expect(refreshSession()).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
    expect(getSessionUser()).toBeNull();
  });

  it("401 INVALID_CREDENTIALS → auth-error tiếng Việt", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(401, {
          statusCode: 401,
          code: "INVALID_CREDENTIALS",
          message: "Email or password is incorrect.",
        }),
      ),
    );

    const result = await login({
      ...VALID_CREDENTIALS,
      password: "sai-mat-khau",
      remember: false,
    });

    expect(result).toEqual({
      ok: false,
      kind: "auth-error",
      message: "Email hoặc mật khẩu không chính xác.",
    });
    expect(getSessionUser()).toBeNull();
  });

  it("429 LOGIN_RATE_LIMITED → auth-error báo chờ 60 giây", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(429, {
          statusCode: 429,
          code: "LOGIN_RATE_LIMITED",
          message: "Too many login attempts.",
        }),
      ),
    );

    const result = await login(VALID_CREDENTIALS);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe("auth-error");
      expect(result.message).toContain("60 giây");
    }
  });

  it("mất mạng → system-error (không nhầm thành sai credentials)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    );

    const result = await login(VALID_CREDENTIALS);

    expect(result).toEqual({
      ok: false,
      kind: "system-error",
      message: "Không thể kết nối đến hệ thống. Vui lòng thử lại sau.",
    });
  });

  it("refresh → POST /auth/refresh không body, dùng cookie (credentials:include)", async () => {
    const fetchSpy = vi.fn(async () => jsonResponse(200, LOGIN_SUCCESS_BODY));
    vi.stubGlobal("fetch", fetchSpy);

    const user = await refreshSession();

    expect(user?.email).toBe("admin@vintern.local");
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${API_BASE}/auth/refresh`);
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    expect(init.body).toBeUndefined();
    expect(init.headers as Record<string, string>).not.toHaveProperty(
      "Content-Type",
    );
    expect(getSessionUser()?.email).toBe("admin@vintern.local");
  });

  it("refresh thất bại → null và xóa session", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(401, {
          statusCode: 401,
          code: "INVALID_REFRESH_TOKEN",
          message: "Refresh token is invalid or expired.",
        }),
      ),
    );

    expect(await refreshSession()).toBeNull();
    expect(getSessionUser()).toBeNull();
  });

  it("me → GET kèm Authorization Bearer", async () => {
    const fetchSpy = vi.fn(async () => {
      const [url, init] = fetchSpy.mock.calls.at(-1) as unknown as [
        string,
        RequestInit,
      ];
      if (url.endsWith("/auth/login"))
        return jsonResponse(200, LOGIN_SUCCESS_BODY);
      expect(url).toBe(`${API_BASE}/auth/me`);
      expect((init.headers as Record<string, string>).Authorization).toBe(
        "Bearer test-access-token",
      );
      expect(init.headers as Record<string, string>).not.toHaveProperty(
        "Content-Type",
      );
      return jsonResponse(200, LOGIN_SUCCESS_BODY.user);
    });
    vi.stubGlobal("fetch", fetchSpy);

    await login(VALID_CREDENTIALS);
    const user = await fetchCurrentUser();

    expect(user?.email).toBe("admin@vintern.local");
  });

  it("me 401 → refresh một lần và retry /me", async () => {
    const refreshedBody = {
      ...LOGIN_SUCCESS_BODY,
      accessToken: "rotated-token",
    };
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        calls.push(url);
        if (url.endsWith("/auth/login"))
          return jsonResponse(200, LOGIN_SUCCESS_BODY);
        if (
          url.endsWith("/auth/me") &&
          calls.filter((x) => x.endsWith("/auth/me")).length > 1
        )
          return jsonResponse(200, refreshedBody.user);
        if (url.endsWith("/auth/me"))
          return jsonResponse(401, {
            statusCode: 401,
            code: "INVALID_ACCESS_TOKEN",
            message: "A valid bearer access token is required.",
          });
        return jsonResponse(200, refreshedBody);
      }),
    );

    await login(VALID_CREDENTIALS);
    const user = await fetchCurrentUser();

    expect(user?.email).toBe("admin@vintern.local");
    expect(calls).toEqual([
      `${API_BASE}/auth/login`,
      `${API_BASE}/auth/me`,
      `${API_BASE}/auth/refresh`,
      `${API_BASE}/auth/me`,
    ]);
  });

  it("me 200 sai shape → null và xóa session stale (fail-closed)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.endsWith("/auth/login"))
          return jsonResponse(200, LOGIN_SUCCESS_BODY);
        return jsonResponse(200, { unexpected: "shape" });
      }),
    );

    await login(VALID_CREDENTIALS);
    expect(getSessionUser()).not.toBeNull();

    await expect(fetchCurrentUser()).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
    expect(getSessionUser()).toBeNull();
  });

  it("logout → POST 204, xóa session kể cả khi BE lỗi", async () => {
    const fetchSpy = vi.fn(async (url: string) => {
      if (url.endsWith("/auth/login"))
        return jsonResponse(200, LOGIN_SUCCESS_BODY);
      return new Response(null, { status: 204 });
    });
    vi.stubGlobal("fetch", fetchSpy);

    await login(VALID_CREDENTIALS);
    expect(getSessionUser()).not.toBeNull();
    await logout();

    expect(getSessionUser()).toBeNull();
    const [url, init] = fetchSpy.mock.calls.at(-1) as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`${API_BASE}/auth/logout`);
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    expect(init.headers as Record<string, string>).not.toHaveProperty(
      "Content-Type",
    );

    // BE lỗi mạng khi logout → session local vẫn bị xóa.
    await login(VALID_CREDENTIALS);
    fetchSpy.mockImplementationOnce(async () => {
      throw new TypeError("fetch failed");
    });
    await logout();
    expect(getSessionUser()).toBeNull();
  });

  it("logout chặn /me đang chạy khôi phục phiên đã xóa", async () => {
    let resolveMe!: (response: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url.endsWith("/auth/login"))
          return Promise.resolve(jsonResponse(200, LOGIN_SUCCESS_BODY));
        if (url.endsWith("/auth/me"))
          return new Promise<Response>((resolve) => {
            resolveMe = resolve;
          });
        return Promise.resolve(new Response(null, { status: 204 }));
      }),
    );
    await login(VALID_CREDENTIALS);
    const pending = fetchCurrentUser();
    await logout();
    resolveMe(jsonResponse(200, LOGIN_SUCCESS_BODY.user));
    expect(await pending).toBeNull();
    expect(getSessionUser()).toBeNull();
  });

  it("logout xóa phiên ngay khi backend chưa trả lời", async () => {
    let resolveLogout!: (response: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url.endsWith("/auth/login"))
          return Promise.resolve(jsonResponse(200, LOGIN_SUCCESS_BODY));
        return new Promise<Response>((resolve) => {
          resolveLogout = resolve;
        });
      }),
    );
    await login(VALID_CREDENTIALS);
    const pending = logout();
    expect(getSessionUser()).toBeNull();
    resolveLogout(new Response(null, { status: 204 }));
    await pending;
  });
  it("register giữ not-connected trung thực (BE không có endpoint public)", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const result = await register({
      fullName: "New Intern",
      email: "new.intern@vintern.local",
      password: "ChangeMe_2026!",
    });

    expect(result).toEqual({
      ok: false,
      kind: "not-connected",
      message: expect.stringContaining("chưa được kết nối"),
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("forgot-password giữ not-connected trung thực (BE không có endpoint)", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const result = await requestPasswordReset("sv@vintern.vn");

    expect(result).toEqual({
      ok: false,
      kind: "not-connected",
      message: expect.stringContaining("chưa được kết nối"),
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
