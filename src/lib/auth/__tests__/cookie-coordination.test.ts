import { afterEach, describe, expect, it, vi } from "vitest";
import { withAuthCookieLock } from "../cookie-coordination";

afterEach(() => vi.unstubAllGlobals());

describe("auth cookie coordination", () => {
  it("waits for the browser lock before touching the shared cookie", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const action = vi.fn().mockResolvedValue("principal");
    const request = vi.fn(async (_name, run) => { await gate; return run(); });
    vi.stubGlobal("navigator", { locks: { request } });
    const pending = withAuthCookieLock(action);
    expect(action).not.toHaveBeenCalled();
    release();
    expect(await pending).toBe("principal");
    expect(request.mock.calls[0][0]).toBe("vintern-auth-cookie");
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("preserves rejection and releases the browser-owned lock", async () => {
    vi.stubGlobal("navigator", { locks: { request: vi.fn((_name, run) => run()) } });
    const failure = new Error("offline");
    await expect(withAuthCookieLock(() => Promise.reject(failure))).rejects.toBe(failure);
    expect(await withAuthCookieLock(() => Promise.resolve("retry"))).toBe("retry");
  });

  it("uses the existing request flow when Web Locks is unavailable", async () => {
    vi.stubGlobal("navigator", {});
    expect(await withAuthCookieLock(() => Promise.resolve("value"))).toBe("value");
  });
});
