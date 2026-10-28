"use client";
import { getSessionUser } from "@/lib/auth/session";
import { LogoutButton } from "@/components/auth/logout-button";
import { Logo } from "@/components/v-intern/logo";
/** Phase 7.1 only: authenticated shell; overview contracts remain a gap. */
export function RoleWorkspaceEntry({ role }: { role: "admin" | "instructor" }) {
  const user = getSessionUser();
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
        <Logo />
        <div className="flex items-center gap-4">
          <span className="text-body">{user?.displayName}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-6">
        <h1 className="text-page font-bold text-foreground">
          {role === "admin" ? "Admin Workspace" : "Instructor Workspace"}
        </h1>
        <section className="mt-5 rounded-panel border border-border bg-card p-6">
          <p>Phiên đăng nhập và quyền truy cập đã được xác thực.</p>
          <p className="mt-2 text-body text-muted-foreground">
            Tổng quan và các chức năng quản lý sẽ được tích hợp ở giai đoạn tiếp
            theo.
          </p>
        </section>
      </main>
    </div>
  );
}
