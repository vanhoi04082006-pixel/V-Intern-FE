"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getWorkspace,
  lifecyclePath,
  type InternWorkspace as Workspace,
} from "@/lib/api/workspace";
import { getSessionUser } from "@/lib/auth/session";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { EmptyInternWorkspace } from "./empty-intern-workspace";
import { ActiveEntry } from "./active-entry";
import { InternSidebar } from "./intern-sidebar";
import { InternTopbar } from "./intern-topbar";
import {
  waitingPresentation,
  workspaceNav,
  workspaceUser,
} from "./workspace-presentation";
export function InternWorkspace() {
  const router = useRouter();
  const [data, setData] = useState<Workspace | null>(null);
  const [error, setError] = useState<unknown>();
  const [attempt, setAttempt] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const drawer = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    void getWorkspace(controller.signal)
      .then((workspace) => {
        const target = lifecyclePath(workspace);
        if (target !== "/intern") {
          router.replace(target);
          return;
        }
        setData(workspace);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e);
      });
    return () => controller.abort();
  }, [attempt, router]);
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
  const reload = () => {
    setError(undefined);
    setData(null);
    setAttempt((x) => x + 1);
  };
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!data)
    return <LoadingState label="Đang xác định trạng thái thực tập..." />;
  const user = getSessionUser();
  if (!user) return <LoadingState label="Đang kiểm tra phiên đăng nhập..." />;
  const waiting = data.status === "unassigned";
  return (
    <div className="min-h-dvh bg-[#F4F6FB]">
      <a
        href="#intern-main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:bg-white focus:p-3"
      >
        Bỏ qua tới nội dung chính
      </a>
      <InternSidebar
        groups={workspaceNav(!waiting)}
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
            groups={workspaceNav(!waiting)}
            className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] border-r border-slate-200 shadow-xl"
            onNavigate={() => setMenuOpen(false)}
          />
        </div>
      )}
      <div
        inert={menuOpen}
        className={`flex min-h-dvh flex-col lg:pl-[240px] ${waiting ? "xl:h-dvh xl:min-h-0" : ""}`}
      >
        <InternTopbar
          waiting={waiting}
          breadcrumb={[
            { id: "workspace", label: "Intern Workspace", href: "/intern" },
            { id: "overview", label: "Tổng quan", current: true },
          ]}
          searchPlaceholder="Tìm kiếm dự án, tài liệu, thông báo..."
          user={workspaceUser(user)}
          menuOpen={menuOpen}
          onOpenMenu={() => setMenuOpen(true)}
          menuButtonRef={menuButton}
        />
        <main
          id="intern-main-content"
          className={`mx-auto w-full max-w-[1600px] flex-1 px-4 py-4 sm:px-6 sm:py-5 ${waiting ? "xl:min-h-0 xl:overflow-hidden xl:px-6 xl:py-2 2xl:px-8" : ""}`}
        >
          {waiting ? (
            <EmptyInternWorkspace
              state={waitingPresentation(data, user)}
              onReload={reload}
            />
          ) : (
            <ActiveEntry workspace={data} />
          )}
        </main>
      </div>
    </div>
  );
}
