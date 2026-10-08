import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

describe("cross-tab session invalidation", () => {
  it("clears memory for logout or identity change and broadcasts no credentials", async () => {
    vi.resetModules();
    const posted = vi.fn();
    let receive!: (event: MessageEvent<unknown>) => void;
    class Channel {
      postMessage = posted;
      set onmessage(handler: typeof receive) { receive = handler; }
    }
    vi.stubGlobal("BroadcastChannel", Channel);
    const session = await import("../session");
    const user = { id: "test-user", email: "test@example.test", displayName: "Test", roles: ["intern"], permissions: [] };
    const listener = vi.fn();
    const unsubscribe = session.subscribeSession(listener);
    session.setSession("test-memory-token", user);
    session.notifyOtherTabs("logout");
    expect(posted.mock.calls).toEqual([["logout"]]);
    receive({ data: { accessToken: "untrusted", user } } as MessageEvent);
    expect(session.getSessionUser()).toEqual(user);
    receive({ data: "logout" } as MessageEvent);
    expect(session.getAccessToken()).toBeNull();
    const generation = session.getSessionGeneration();
    session.setSession("second-memory-token", user);
    receive({ data: "session-changed" } as MessageEvent);
    expect(session.getSessionUser()).toBeNull();
    expect(session.getSessionGeneration()).toBe(generation + 1);
    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });
});
