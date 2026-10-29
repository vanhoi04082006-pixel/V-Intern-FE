"use client";

import { create } from "zustand";
import {
  clearSession,
  getSessionUser,
  primaryRole,
  subscribeSession,
  type SessionUser,
} from "@/lib/auth/session";
import { logout as apiLogout, refreshSession } from "@/lib/auth/auth-service";

/**
 * SPA router — mọi khung cảnh sống trong route "/" duy nhất:
 *   #/                 → landing
 *   #/login            → đăng nhập / đăng ký
 *   #/app/<section>    → workspace theo vai trò + quyền
 *   #/apply            → nộp CV công khai (ứng viên, cookie riêng)
 *   #/verify           → kích hoạt link truy cập ứng viên
 *   #/github-invite    → thông báo mời GitHub
 */

export type View = "landing" | "auth" | "app" | "apply" | "verify" | "github-invite";

interface AppState {
  user: SessionUser | null;
  view: View;
  section: string;
  hydrated: boolean;
  /** Khôi phục phiên bằng refresh cookie — true khi request đang bay. */
  restoring: boolean;
  hydrate: () => void;
  signIn: (user: SessionUser) => void;
  signOut: () => Promise<void>;
  navigate: (view: View) => void;
  goSection: (section: string) => void;
}

export function parseHash(): { view: View; section: string } {
  if (typeof window === "undefined") return { view: "landing", section: "" };
  const raw = window.location.hash.replace(/^#\/?/, "");
  if (raw === "login") return { view: "auth", section: "" };
  if (raw === "app" || raw.startsWith("app/")) return { view: "app", section: raw.slice(4).replace(/^\/+/, "") };
  if (raw === "apply") return { view: "apply", section: "" };
  if (raw === "verify") return { view: "verify", section: "" };
  if (raw === "github-invite") return { view: "github-invite", section: "" };
  return { view: "landing", section: "" };
}

function setHashSilently(hash: string): void {
  if (typeof window === "undefined") return;
  // Chỉ bỏ các "#" thừa ở đầu — giữ nguyên "/..." phía sau (canonical: "#/app/x").
  const clean = hash.replace(/^#+/, "");
  const { pathname, search } = window.location;
  window.history.replaceState(null, "", `${pathname}${search}${clean ? `#${clean}` : ""}`);
}

export const DEFAULT_SECTION: Record<"admin" | "instructor" | "intern", string> = {
  intern: "dashboard",
  instructor: "dashboard",
  admin: "dashboard",
};

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  view: "landing",
  section: "",
  hydrated: false,
  restoring: false,

  hydrate: () => {
    if (get().hydrated) return;
    set({ hydrated: true });

    const { view, section } = parseHash();

    // Đồng bộ khi phiên đổi từ tab khác / bị 401-clear giữa chừng.
    subscribeSession(() => {
      const user = getSessionUser();
      const current = useAppStore.getState();
      if (!user && current.view === "app") {
        setHashSilently("");
        set({ user: null, view: "landing", section: "" });
      } else if (user && current.user?.id !== user.id) {
        set({ user });
      }
    });

    const local = getSessionUser();
    if (local) {
      set({
        user: local,
        view: view === "auth" ? "app" : view,
        section: view === "app" ? section || DEFAULT_SECTION[primaryRole(local)] : "",
      });
      return;
    }

    if (view === "app") {
      // Thử khôi phục phiên từ HttpOnly refresh cookie.
      set({ restoring: true });
      void refreshSession().then((ok) => {
        const user = getSessionUser();
        if (ok && user) {
          set({
            user,
            view: "app",
            section: section || DEFAULT_SECTION[primaryRole(user)],
            restoring: false,
          });
        } else {
          set({ user: null, view: "landing", section: "", restoring: false });
          setHashSilently("");
        }
      });
    } else {
      set({ view, section });
    }
  },

  signIn: (user) => {
    // Token đã được auth-service set vào session trước khi gọi signIn.
    setHashSilently(`#/app/${DEFAULT_SECTION[primaryRole(user)]}`);
    set({ user, view: "app", section: DEFAULT_SECTION[primaryRole(user)] });
    window.scrollTo({ top: 0 });
  },

  signOut: async () => {
    await apiLogout();
    clearSession();
    setHashSilently("");
    set({ user: null, view: "landing", section: "" });
    window.scrollTo({ top: 0 });
  },

  navigate: (view) => {
    if (get().view === view) return;
    setHashSilently(view === "landing" ? "" : `#/${view}`);
    set({ view });
    window.scrollTo({ top: 0 });
  },

  goSection: (section) => {
    if (get().section === section && get().view === "app") return;
    setHashSilently(`#/app/${section}`);
    set({ section, view: "app" });
    window.scrollTo({ top: 0 });
  },
}));

/** Map hash hiện tại → view cho sự kiện back/forward của trình duyệt. */
export function viewFromHash(): { view: View; section: string } | null {
  const parsed = parseHash();
  if (parsed.view === "landing" && typeof window !== "undefined" && window.location.hash.replace(/^#\/?/, "") !== "") {
    return null; // hash lạ — bỏ qua
  }
  return parsed;
}
