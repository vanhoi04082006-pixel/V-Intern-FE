"use client";

import * as React from "react";

/**
 * Hash router cho SPA một route duy nhất `/`.
 * URL dạng: #/intern/work  →  path "/intern/work"
 */

const EVENT = "vintern:hashchange";

function getPath(): string {
  if (typeof window === "undefined") return "/";
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw || raw === "/") return "/";
  return raw.startsWith("/") ? raw : `/${raw}`;
}

/** Đọc path hiện tại từ hash — dùng trong effect khi cần path thật ngay. */
export function currentPath(): string {
  return getPath();
}

function emit() {
  window.dispatchEvent(new Event(EVENT));
}

export function navigate(to: string, opts?: { replace?: boolean }) {
  const target = to.startsWith("/") ? to : `/${to}`;
  const url = `${window.location.pathname}${window.location.search}#${target}`;
  if (opts?.replace) {
    window.history.replaceState(null, "", url);
  } else {
    window.history.pushState(null, "", url);
  }
  emit();
}

export function back() {
  window.history.back();
}

/**
 * useLayoutEffect trên client (chạy trước paint — tránh nhấp nháy),
 * useEffect khi SSR (tránh warning useLayoutEffect phía server).
 */
const useIsoLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export function useRoute(): { path: string; search: URLSearchParams } {
  /**
   * SSR và client render ĐẦU TIÊN luôn dùng "/" để khớp HTML server
   * (tránh hydration mismatch khi reload với hash URL).
   * Path thật từ hash được đồng bộ ngay trước lần paint đầu tiên.
   */
  const [path, setPath] = React.useState<string>("/");

  useIsoLayoutEffect(() => {
    const update = () => setPath(getPath());
    update();
    window.addEventListener(EVENT, update);
    window.addEventListener("hashchange", update);
    window.addEventListener("popstate", update);
    return () => {
      window.removeEventListener(EVENT, update);
      window.removeEventListener("hashchange", update);
      window.removeEventListener("popstate", update);
    };
  }, []);

  const search = React.useMemo(() => {
    const idx = path.indexOf("?");
    return new URLSearchParams(idx >= 0 ? path.slice(idx + 1) : "");
  }, [path]);

  const clean = React.useMemo(
    () => (path.includes("?") ? path.slice(0, path.indexOf("?")) : path),
    [path]
  );

  return { path: clean, search };
}

/** Match pattern "/intern/work/:id" với path thật. Trả về params hoặc null. */
export function matchPath(
  pattern: string,
  path: string
): Record<string, string> | null {
  const pp = pattern.split("/").filter(Boolean);
  const ap = path.split("/").filter(Boolean);
  if (pp.length !== ap.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(":")) {
      params[pp[i].slice(1)] = decodeURIComponent(ap[i]);
    } else if (pp[i] !== ap[i]) {
      return null;
    }
  }
  return params;
}

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  replace?: boolean;
}

export function Link({ to, replace, onClick, ...rest }: LinkProps) {
  return (
    <a
      href={`#${to.startsWith("/") ? to : `/${to}`}`}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        e.preventDefault();
        navigate(to, { replace });
      }}
      {...rest}
    />
  );
}
