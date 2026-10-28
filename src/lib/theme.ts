"use client";

/**
 * Theme store — one source of truth for light/dark across the whole app
 * (landing, auth and all three workspaces).
 *
 * - Preference lives in localStorage (`vintern-theme`): "light" | "dark" | "system".
 * - The resolved theme is the `.dark` class on <html> plus a matching
 *   `color-scheme` so native controls (scrollbars, inputs, forms) follow.
 * - "system" tracks the OS preference live.
 * - A tiny inline script in the root layout applies the class before first
 *   paint, so there is no flash of the wrong theme.
 */

export type ThemePreference = "light" | "dark" | "system";
const STORAGE_KEY = "vintern-theme";

const listeners = new Set<() => void>();

function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export function readPreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : "system";
}

function apply(preference: ThemePreference) {
  const dark = preference === "dark" || (preference === "system" && systemPrefersDark());
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
}

export function setPreference(preference: ThemePreference) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, preference);
  apply(preference);
  for (const listener of listeners) listener();
}

export function togglePreference(): ThemePreference {
  const current = readPreference();
  const resolvedDark =
    current === "dark" || (current === "system" && systemPrefersDark());
  const next: ThemePreference = resolvedDark ? "light" : "dark";
  setPreference(next);
  return next;
}

export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Wire OS-preference changes; call once from a client effect. */
export function watchSystemTheme() {
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    if (readPreference() === "system") {
      apply("system");
      for (const listener of listeners) listener();
    }
  };
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * Runs before hydration inside the inline <script> in the root layout.
 * Kept as a string so the bundler never tree-shakes it.
 */
export const THEME_BOOTSTRAP = `(function(){try{var s=localStorage.getItem("${STORAGE_KEY}");var d=s==="dark"||(s!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";}catch(e){}})();`;
