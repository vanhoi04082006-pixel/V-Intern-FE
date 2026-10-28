"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

/**
 * Công tắc sáng/tối — dùng được ở mọi nơi (landing, auth, app shell).
 * Icon hiển thị theo CSS (dark:hidden / hidden dark:block) nên không lệch
 * hydration; nhãn tĩnh để tránh mismatch trước khi mount.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  const toggle = React.useCallback(() => {
    setTheme(resolvedTheme === "light" ? "dark" : "light");
  }, [resolvedTheme, setTheme]);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Chuyển đổi chế độ sáng/tối"
      title="Chuyển đổi chế độ sáng/tối"
      className={cn(
        "group grid size-9 shrink-0 place-items-center rounded-full border border-line bg-panel/60 text-dim backdrop-blur",
        "transition-all duration-300 hover:rotate-12 hover:border-line-strong hover:bg-panel-2 hover:text-ink active:scale-95",
        className
      )}
    >
      <Sun className="size-4 icon hidden transition-transform duration-300 group-hover:rotate-[25deg] dark:block" />
      <Moon className="size-4 icon block transition-transform duration-300 group-hover:-rotate-[25deg] dark:hidden" />
    </button>
  );
}
