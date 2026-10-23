"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { InternEntry } from "@/components/product/intern-entry";
import "@/components/intern/student-experience.css";
import "@/components/workspace/workspace.css";
import "@/components/workspace/aurora.css";

/**
 * Persistent student shell.
 *
 * Keeping the shell at the layout level means the sidebar, topbar and their
 * scroll/focus state survive route changes. Onboarding owns a separate
 * full-screen layout, so it bypasses the shell entirely.
 */
export default function StudentLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/intern/onboarding")) return <>{children}</>;
  return <InternEntry>{children}</InternEntry>;
}
