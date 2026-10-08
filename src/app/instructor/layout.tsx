"use client";
import type { ReactNode } from "react";
import { WorkspaceGuard } from "@/components/auth/workspace-guard";
import { ProductShell } from "@/components/product/shell";
const roles = ["instructor"];
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <WorkspaceGuard allowedRoles={roles}>
      <ProductShell role="instructor">{children}</ProductShell>
    </WorkspaceGuard>
  );
}
