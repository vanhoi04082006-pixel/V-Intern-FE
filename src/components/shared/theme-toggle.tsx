"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  readPreference,
  subscribeTheme,
  setPreference,
  watchSystemTheme,
  type ThemePreference,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Sáng", Icon: Sun },
  { value: "dark", label: "Tối", Icon: Moon },
  { value: "system", label: "Theo máy", Icon: Monitor },
];

/**
 * Compact three-state theme switch. Reads the live store so every mounted
 * toggle stays in sync, and hydrates from `null` to avoid SSR mismatch.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [preference, setLocal] = useState<ThemePreference | null>(null);

  useEffect(() => {
    const sync = () => setLocal(readPreference());
    sync();
    const unsubscribe = subscribeTheme(sync);
    const stopWatching = watchSystemTheme();
    return () => {
      unsubscribe();
      stopWatching();
    };
  }, []);

  return (
    <div
      role="radiogroup"
      aria-label="Chủ đề giao diện"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-border bg-muted/60 p-0.5",
        className,
      )}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`Chủ đề ${label}`}
            title={`Chủ đề ${label}`}
            tabIndex={active || (preference === null && value === "system") ? 0 : -1}
            onClick={() => setPreference(value)}
            className={cn(
              "grid size-7 place-items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-card text-primary shadow-app-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon size={14} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
