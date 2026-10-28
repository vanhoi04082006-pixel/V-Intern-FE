"use client";

import * as React from "react";

export type Role = "intern" | "instructor" | "admin";

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  permissions: string[];
  avatarColor: string;
}

interface AuthState {
  token: string | null;
  user: SessionUser | null;
}

const STORAGE_KEY = "vintern-session";

const EMPTY_STATE: AuthState = { token: null, user: null };
const SERVER_SNAPSHOT: AuthState = EMPTY_STATE;

let state: AuthState = EMPTY_STATE;
let initialized = false;
const listeners = new Set<() => void>();

function readStored(): AuthState {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as AuthState;
    if (parsed.token && parsed.user) return parsed;
  } catch {
    /* ignore */
  }
  return EMPTY_STATE;
}

function ensureInit() {
  if (initialized) return;
  initialized = true;
  state = readStored();
}

function set(next: AuthState) {
  state = next;
  if (typeof window !== "undefined") {
    if (next.token && next.user) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): AuthState {
  ensureInit();
  return state;
}

export function setSession(token: string, user: SessionUser) {
  set({ token, user });
}

export function clearSession() {
  set({ token: null, user: null });
}

export function getSessionToken(): string | null {
  ensureInit();
  return state.token;
}

export function homePathOf(role: Role): string {
  if (role === "admin") return "/admin";
  if (role === "instructor") return "/instructor";
  return "/intern";
}

/** Hook lấy phiên đăng nhập hiện tại. */
export function useSession(): AuthState {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function getServerSnapshot(): AuthState {
  return SERVER_SNAPSHOT;
}
