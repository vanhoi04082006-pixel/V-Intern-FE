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
const listeners = new Set<() => void>();
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
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
