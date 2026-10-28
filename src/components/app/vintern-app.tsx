"use client";

import * as React from "react";
import { Compass } from "lucide-react";
import { useRoute, navigate, currentPath } from "@/lib/client/router";
import { homePathOf, useSession } from "@/lib/client/session";
import { AppShell } from "./shell";
import { matchRoutes, type RouteDefinition } from "./route-types";
import { internRoutes, outcomeRoutes } from "./routes.intern";
import { instructorRoutes } from "./routes.instructor";
import { adminRoutes } from "./routes.admin";
import { LandingPage } from "@/components/landing/landing-page";
import { LoginPage } from "@/components/auth/login-page";
import { RegisterPage } from "@/components/auth/register-page";
import { ForgotPasswordPage } from "@/components/auth/forgot-password-page";
import { VerifyCertificatePage } from "@/components/auth/verify-page";
import { ChangePasswordPage } from "@/components/auth/change-password-page";
import { ApplyView } from "@/components/views/public/apply-view";
import { GithubInvitationView } from "@/components/views/public/github-invitation-view";
import { ViewFrame } from "@/components/shared/primitives";
import { Button } from "@/components/ui/button";

const sharedInstructor = outcomeRoutes.filter((r) =>
  r.pattern.startsWith("/instructor/")
);
const sharedAdmin = outcomeRoutes.filter((r) => r.pattern.startsWith("/admin/"));

const ROLE_ROUTES: Record<string, RouteDefinition[]> = {
  intern: internRoutes,
  instructor: [...instructorRoutes, ...sharedInstructor],
  admin: [...adminRoutes, ...sharedAdmin],
};

/** Route public — không cần workspace guard. */
const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/verify",
  "/apply",
  "/github/invitation",
  "/change-password",
];

/** Trang auth thuần — người đã đăng nhập sẽ bị chuyển về workspace. */
const AUTH_ONLY_PREFIXES = ["/login", "/register", "/forgot-password"];

function NotFound() {
  const { user } = useSession();
  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-6">
      <ViewFrame className="text-center">
        <span className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl border border-line bg-panel text-brand-bright">
          <Compass className="size-6 icon" />
        </span>
        <h1 className="text-2xl font-bold tracking-tight">Không tìm thấy trang</h1>
        <p className="mt-2 text-sm text-dim">
          Đường dẫn bạn truy cập không tồn tại hoặc đã bị di chuyển.
        </p>
        <Button
          className="mt-6 rounded-lg bg-brand text-on-brand hover:bg-brand-bright"
          onClick={() => navigate(user ? homePathOf(user.role) : "/")}
        >
          Về trang chính
        </Button>
      </ViewFrame>
    </div>
  );
}

function WorkspaceGate({ children }: { children: React.ReactNode }) {
  const { user } = useSession();
  const { path } = useRoute();

  React.useEffect(() => {
    // Đọc path thật từ hash tại thời điểm effect chạy — render đầu của
    // useRoute dùng "/" để khớp hydration nên state có thể chưa kịp sync.
    const current = currentPath();
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(current)}`, { replace: true });
      return;
    }
    const wanted = current.split("/")[1];
    if (user.role !== wanted) {
      navigate(homePathOf(user.role), { replace: true });
    }
  }, [user, path]);

  if (!user) return null;
  const wanted = currentPath().split("/")[1];
  if (user.role !== wanted) return null;

  return <AppShell role={user.role}>{children}</AppShell>;
}

export function VInternApp() {
  const { path } = useRoute();
  const { user } = useSession();
  const isPublic = PUBLIC_PREFIXES.some((p) => path.startsWith(p));

  // Chuyển hướng người đã đăng nhập đừng nhìn trang auth thuần nữa
  // (/apply, /verify, /github/invitation, /change-password vẫn xem được)
  React.useEffect(() => {
    if (user && AUTH_ONLY_PREFIXES.some((p) => path.startsWith(p))) {
      navigate(homePathOf(user.role), { replace: true });
    }
  }, [user, path]);

  let content: React.ReactNode;

  if (path === "/" || path === "") {
    content = <LandingPage />;
  } else if (path.startsWith("/login")) {
    content = <LoginPage />;
  } else if (path.startsWith("/register")) {
    content = <RegisterPage />;
  } else if (path.startsWith("/forgot-password")) {
    content = <ForgotPasswordPage />;
  } else if (path.startsWith("/verify")) {
    content = <VerifyCertificatePage />;
  } else if (path.startsWith("/apply")) {
    content = <ApplyView />;
  } else if (path.startsWith("/github/invitation")) {
    content = <GithubInvitationView />;
  } else if (path.startsWith("/change-password")) {
    content = <ChangePasswordPage />;
  } else if (path.startsWith("/intern") || path.startsWith("/instructor") || path.startsWith("/admin")) {
    const role = path.split("/")[1];
    const routes = ROLE_ROUTES[role] ?? [];
    const matched = matchRoutes(routes, path);
    if (!matched) {
      content = <NotFound />;
    } else {
      const View = matched.definition.component;
      content = (
        <WorkspaceGate>
          <View params={matched.params} />
        </WorkspaceGate>
      );
    }
  } else {
    content = <NotFound />;
  }

  return <div className="min-h-screen bg-canvas text-ink">{content}</div>;
}
