"use client";
export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  permissions: string[];
}
let state: { accessToken: string; user: SessionUser } | null = null;
let generation = 0;
let logoutPending = false;
const listeners = new Set<() => void>();
let channel: BroadcastChannel | null = null;
function sessionChannel(): BroadcastChannel | null {
  if (!channel && typeof window !== "undefined" && window.BroadcastChannel) {
    channel = new window.BroadcastChannel("vintern-session-events");
    channel.onmessage = (event: MessageEvent<unknown>) => {
      if (event.data === "logout" || event.data === "session-changed") {
        clearSession();
      }
    };
  }
  return channel;
}
/** Send invalidation only. Tokens and principals never cross this channel. */
export function notifyOtherTabs(event: "logout" | "session-changed"): void {
  sessionChannel()?.postMessage(event);
}
export function setSession(accessToken: string, user: SessionUser): void {
  state = { accessToken, user };
  listeners.forEach((fn) => fn());
}
export function getAccessToken(): string | null {
  return state?.accessToken ?? null;
}
export function getSessionUser(): SessionUser | null {
  return state?.user ?? null;
}
export function getSessionGeneration(): number {
  return generation;
}
export function clearSession(): void {
  state = null;
  generation++;
  listeners.forEach((fn) => fn());
}
export function subscribeSession(listener: () => void): () => void {
  sessionChannel();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Hide private UI immediately; navigate only after cookie revocation request settles. */
export function isLogoutPending(): boolean {
  return logoutPending;
}
export function setLogoutPending(pending: boolean): void {
  logoutPending = pending;
  listeners.forEach((fn) => fn());
}
