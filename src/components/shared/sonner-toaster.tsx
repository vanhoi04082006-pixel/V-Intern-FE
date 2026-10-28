"use client";

import { Toaster as Sonner } from "sonner";

export function SonnerToaster() {
  return (
    <Sonner
      theme="dark"
      position="top-right"
      toastOptions={{
        style: {
          background: "#171D1B",
          border: "1px solid rgba(255,255,255,0.09)",
          color: "#EDF2EF",
          borderRadius: "14px",
          fontFamily: "var(--font-be-vietnam), sans-serif",
        },
      }}
    />
  );
}
