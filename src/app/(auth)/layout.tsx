import type { ReactNode } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import "@/components/auth/support.css";

/**
 * Route group (auth): /login, /register, /forgot-password dùng chung
 * AuthShell (background + marketing panel + card).
 * Route "/" (landing) không bị ảnh hưởng.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
