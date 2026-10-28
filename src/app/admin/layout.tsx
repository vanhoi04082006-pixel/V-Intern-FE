"use client";
import type { ReactNode } from "react";
import { WorkspaceGuard } from "@/components/auth/workspace-guard";
import { ProductShell } from "@/components/product/shell";
import "@/components/workspace/workspace.css";
import "@/components/workspace/aurora.css";
const roles = ["admin"];
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <WorkspaceGuard allowedRoles={roles}>
      <div className="workspace-ui aurora-workspace" data-workspace-role="admin">
        <ProductShell role="admin">{children}</ProductShell>
      </div>
    </WorkspaceGuard>
  );
}
