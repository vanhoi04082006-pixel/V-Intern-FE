"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

export function SonnerToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={resolvedTheme === "light" ? "light" : "dark"}
      position="top-right"
      toastOptions={{
        style: {
          background: "var(--panel-2)",
          border: "1px solid var(--line-strong)",
          color: "var(--ink)",
          borderRadius: "14px",
          fontFamily: "var(--font-be-vietnam), sans-serif",
        },
      }}
    />
  );
}
