"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { LoadingState } from "@/components/shared/data-state";
import { InternSidebar } from "./intern-sidebar";
import { InternTopbar } from "./intern-topbar";
import { workspaceNav, workspaceUser } from "./workspace-presentation";

export function InternShell({
  active,
  children,
  compact = false,
}: {
  active: boolean;
  children: ReactNode;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const user = getSessionUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const drawer = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const waiting = !active;
  const groups = workspaceNav(active).filter(
    (group) => active || group.id === "workspace",
  );
  const title =
    groups
      .flatMap((g) => g.items)
      .find(
        (i) =>
          i.href &&
          (i.href === pathname ||
            (i.href !== "/intern" && pathname.startsWith(i.href + "/"))),
      )?.label ?? "Hồ sơ";
  useEffect(() => {
    const breakpoint = window.matchMedia?.("(min-width: 1024px)");
    if (!breakpoint) return;
    const closeOnDesktop = () => {
      if (breakpoint.matches) setMenuOpen(false);
    };
    breakpoint.addEventListener("change", closeOnDesktop);
    return () => breakpoint.removeEventListener("change", closeOnDesktop);
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.activeElement;
    drawer.current
      ?.querySelector<HTMLElement>("a[href],button:not([disabled])")
      ?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = Array.from(
        drawer.current?.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]):not([tabindex="-1"])',
        ) ?? [],
      );
      const first = nodes[0],
        last = nodes[nodes.length - 1];
      if (!first) return;
      const active = document.activeElement;
      if (
        event.shiftKey &&
        (active === first || !drawer.current?.contains(active))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (active === last || !drawer.current?.contains(active))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [menuOpen]);
  if (!user) return <LoadingState label="Đang kiểm tra phiên đăng nhập..." />;
  return (
    <div className="min-h-dvh bg-[#F4F6FB]">
      <a
        href="#intern-main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:bg-white focus:p-3"
      >
        Bỏ qua tới nội dung chính
      </a>
      <InternSidebar
        currentPath={pathname}
        groups={groups}
        className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-[240px] lg:border-r lg:border-slate-200"
      />
      {menuOpen && (
        <div
          ref={drawer}
          role="dialog"
          aria-modal="true"
          aria-label="Menu thực tập sinh"
          className="fixed inset-0 z-50 lg:hidden"
        >
          <button
            type="button"
            aria-label="Đóng menu thực tập sinh"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-slate-900/50"
          />
          <InternSidebar
            currentPath={pathname}
            groups={groups}
            className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] border-r border-slate-200 shadow-xl"
            onNavigate={() => setMenuOpen(false)}
          />
        </div>
      )}
      <div
        inert={menuOpen}
        className={`flex min-h-dvh flex-col lg:pl-[240px] ${compact ? "xl:h-dvh xl:min-h-0" : ""}`}
      >
        <InternTopbar
          waiting={waiting}
          breadcrumb={[
            { id: "workspace", label: "Intern Workspace", href: "/intern" },
            { id: "current", label: title, current: true },
          ]}
          searchPlaceholder="Tìm trang trong không gian của bạn…"
          searchItems={groups
            .flatMap((g) => g.items)
            .flatMap((i) =>
              i.href && !i.unavailable
                ? [{ href: i.href, label: i.label }]
                : [],
            )}
          user={workspaceUser(user)}
          menuOpen={menuOpen}
          onOpenMenu={() => setMenuOpen(true)}
          menuButtonRef={menuButton}
        />
        <main
          id="intern-main-content"
          className={`mx-auto w-full max-w-[1600px] flex-1 px-4 py-4 sm:px-6 sm:py-5 ${compact ? "xl:min-h-0 xl:overflow-hidden xl:px-6 xl:py-2 2xl:px-8" : ""}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
