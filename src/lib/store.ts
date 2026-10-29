"use client";

import { create } from "zustand";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "intern" | "instructor" | "admin";
  university: string | null;
  major: string | null;
  bio: string | null;
};

export type View = "landing" | "auth" | "app";

const STORAGE_KEY = "vintern-session";

function readSession(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionUser;
    if (!parsed?.id || !parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSession(user: SessionUser | null) {
  if (typeof window === "undefined") return;
  if (user) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

/** Đổi hash nhưng KHÔNG kích hoạt hashchange (dùng replaceState). */
function setHash(hash: "" | "login" | "app") {
  if (typeof window === "undefined") return;
  const { pathname, search } = window.location;
  const next = hash ? `${pathname}${search}#${hash}` : `${pathname}${search}`;
  window.history.replaceState(null, "", next);
}

type AppState = {
  user: SessionUser | null;
  view: View;
  hydrated: boolean;
  /** Gọi một lần khi AppShell mount — đọc localStorage + hash hiện tại. */
  hydrate: () => void;
  /** Người dùng đăng nhập / đăng ký thành công. */
  signIn: (user: SessionUser) => void;
  signOut: () => void;
  /** Điều hướng giữa các khung cảnh. */
  navigate: (view: View) => void;
};

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  view: "landing",
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    const user = readSession();
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    let view: View = "landing";
    if (hash === "#login") view = "auth";
    else if (hash === "#app" && user) view = "app";
    set({ user, view, hydrated: true });
  },

  signIn: (user) => {
    writeSession(user);
    setHash("app");
    set({ user, view: "app" });
    window.scrollTo({ top: 0 });
  },

  signOut: () => {
    writeSession(null);
    setHash("");
    set({ user: null, view: "landing" });
    window.scrollTo({ top: 0 });
  },

  navigate: (view) => {
    const current = get().view;
    if (current === view) return;
    setHash(view === "landing" ? "" : view === "auth" ? "login" : "app");
    set({ view });
    window.scrollTo({ top: 0 });
  },
}));

/** Map hash → view cho sự kiện back/forward của trình duyệt. */
export function viewFromHash(hash: string): View | null {
  const user = useAppStore.getState().user;
  if (hash === "#login") return "auth";
  if (hash === "#app" && user) return "app";
  if (hash === "" || hash === "#" || !hash.startsWith("#")) return "landing";
  return null;
}
