"use client";

/** Cookie rotation must be serialized across tabs, not only within one module. */
export async function withAuthCookieLock<T>(action: () => Promise<T>): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.locks?.request) {
    return await navigator.locks.request("vintern-auth-cookie", action);
  }
  return action();
}
