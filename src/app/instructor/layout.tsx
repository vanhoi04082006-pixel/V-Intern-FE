"use client";
import type { ReactNode } from "react";
import { WorkspaceGuard } from "@/components/auth/workspace-guard";
import { ProductShell } from "@/components/product/shell";
import "@/components/instructor/instructor-experience.css";
import "@/components/workspace/workspace.css";
import "@/components/workspace/aurora.css";

const roles = ["instructor"];

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <WorkspaceGuard allowedRoles={roles}>
      <div className="instructor-experience workspace-ui aurora-workspace" data-workspace-role="instructor">
        <ProductShell role="instructor">{children}</ProductShell>
      </div>
    </WorkspaceGuard>
  );
}
