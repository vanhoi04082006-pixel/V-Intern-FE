"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import {
  Bot,
  CalendarDays,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  Loader2,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/lib/store";
import type { WorkspaceData } from "@/lib/types";
import { Logo } from "@/components/landing/logo";
import { InitialAvatar } from "@/components/workspace/initial-avatar";
import { DashboardView } from "@/components/workspace/views/dashboard-view";
import { TasksView } from "@/components/workspace/views/tasks-view";
import { SprintView } from "@/components/workspace/views/sprint-view";
import { ProjectsView } from "@/components/workspace/views/projects-view";
import { MentorView } from "@/components/workspace/views/mentor-view";
import { PerformanceView } from "@/components/workspace/views/performance-view";
import { RosterView } from "@/components/workspace/views/roster-view";
import { SettingsView } from "@/components/workspace/views/settings-view";

export type SectionId =
  | "dashboard"
  | "tasks"
  | "sprint"
  | "projects"
  | "mentor"
  | "performance"
  | "roster"
  | "settings";

const NAV_ITEMS: Record<string, { id: SectionId; label: string; icon: typeof Bot }[]> = {
  intern: [
    { id: "dashboard", label: "Bảng điều khiển", icon: LayoutDashboard },
    { id: "tasks", label: "Nhiệm vụ của tôi", icon: ListTodo },
    { id: "sprint", label: "Sprint", icon: CalendarDays },
    { id: "projects", label: "Dự án", icon: FolderKanban },
    { id: "mentor", label: "AI Mentor", icon: Bot },
    { id: "performance", label: "Hiệu suất", icon: TrendingUp },
    { id: "settings", label: "Cài đặt", icon: Settings },
  ],
  instructor: [
    { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { id: "roster", label: "Sinh viên", icon: Users },
    { id: "tasks", label: "Nhiệm vụ", icon: ListTodo },
    { id: "sprint", label: "Sprint", icon: CalendarDays },
    { id: "projects", label: "Dự án", icon: FolderKanban },
    { id: "mentor", label: "AI Mentor", icon: Bot },
    { id: "settings", label: "Cài đặt", icon: Settings },
  ],
  admin: [
    { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { id: "roster", label: "Người dùng", icon: Users },
    { id: "tasks", label: "Nhiệm vụ", icon: ListTodo },
    { id: "sprint", label: "Sprint", icon: CalendarDays },
    { id: "projects", label: "Dự án", icon: FolderKanban },
    { id: "mentor", label: "AI Mentor", icon: Bot },
    { id: "settings", label: "Cài đặt", icon: Settings },
  ],
};

const ROLE_LABEL: Record<string, string> = {
  intern: "Sinh viên thực tập",
  instructor: "Giảng viên hướng dẫn",
  admin: "Quản trị nền tảng",
};

async function fetchWorkspace(userId: string): Promise<WorkspaceData> {
  const res = await fetch(`/api/workspace?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? "Không tải được workspace.");
  }
  return res.json();
}

function WorkspaceSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-9 w-9 animate-spin text-blue" aria-hidden="true" />
        <p className="font-hand text-xl text-ink-soft">
          đang lật từng trang sổ tay…
        </p>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Chuyển đổi giao diện sáng/tối"
      className="inline-flex h-11 w-11 items-center justify-center rounded-xl border-2 border-ink/15 bg-raised text-ink transition-all hover:-translate-y-0.5 hover:border-blue hover:text-blue"
    >
      <Moon className="h-5 w-5 dark:hidden" aria-hidden="true" />
      <Sun className="hidden h-5 w-5 dark:block" aria-hidden="true" />
    </button>
  );
}

/** Thanh bên đen than — đúng như tranh vẽ ở trang landing. */
function Sidebar({
  data,
  active,
  onNavigate,
  onSignOut,
}: {
  data: WorkspaceData;
  active: SectionId;
  onNavigate: (id: SectionId) => void;
  onSignOut: () => void;
}) {
  const items = NAV_ITEMS[data.role] ?? NAV_ITEMS.intern;

  return (
    <div className="flex h-full flex-col bg-coal text-chalk">
      <div className="bg-dots-chalk flex h-[72px] items-center border-b border-white/10 px-5">
        <Logo inverse className="text-base" />
      </div>

      <nav aria-label="Điều hướng workspace" className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={
                "flex w-full min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition-all " +
                (isActive
                  ? "border-2 border-royal bg-royal text-white shadow-[0_0_0_3px_rgba(32,96,240,0.25)]"
                  : "border-2 border-transparent text-chalk-soft hover:bg-white/5 hover:text-chalk")
              }
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Thẻ người dùng + đăng xuất */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <InitialAvatar name={data.me.name} id={data.me.id} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold text-chalk">{data.me.name}</p>
            <p className="truncate text-[11px] text-chalk-soft">
              {ROLE_LABEL[data.role] ?? data.role}
            </p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            aria-label="Đăng xuất"
            title="Đăng xuất"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-chalk-soft transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function Workspace() {
  const user = useAppStore((s) => s.user);
  const signOut = useAppStore((s) => s.signOut);
  const { toast } = useToast();
  const [section, setSection] = useState<SectionId>("dashboard");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["workspace", user?.id],
    queryFn: () => fetchWorkspace(user!.id),
    enabled: Boolean(user),
  });

  if (!user) return null;

  if (isLoading) return <WorkspaceSkeleton />;

  if (isError || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-paper px-4 text-center">
        <p className="font-hand text-2xl text-ink">
          ối, sổ tay bị rách một trang…
        </p>
        <p className="max-w-sm text-sm text-ink-soft">
          {error instanceof Error ? error.message : "Không tải được dữ liệu."}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex h-11 items-center rounded-xl border-2 border-ink bg-royal px-6 text-sm font-bold text-white shadow-[3px_3px_0_0_var(--ink)] transition-all hover:-translate-y-0.5"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const navigate = (id: SectionId) => {
    setSection(id);
    setDrawerOpen(false);
    window.scrollTo({ top: 0 });
  };

  const handleSignOut = () => {
    toast({
      title: "Hẹn gặp lại nhé! 👋",
      description: "Bạn đã đăng xuất khỏi V-Intern.",
    });
    signOut();
  };

  const sectionTitle =
    (NAV_ITEMS[data.role] ?? NAV_ITEMS.intern).find((i) => i.id === section)?.label ?? "";

  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      {/* Sidebar cố định — desktop */}
      <div className="fixed inset-y-0 left-0 z-40 hidden w-[272px] lg:block">
        <Sidebar
          data={data}
          active={section}
          onNavigate={navigate}
          onSignOut={handleSignOut}
        />
      </div>

      {/* Drawer — mobile */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-coal/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] shadow-2xl">
            <Sidebar
              data={data}
              active={section}
              onNavigate={navigate}
              onSignOut={handleSignOut}
            />
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Đóng menu"
              className="absolute -right-12 top-4 flex h-11 w-11 items-center justify-center rounded-xl border-2 border-white/25 bg-coal text-chalk"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}

      {/* Vùng nội dung chính */}
      <div className="lg:pl-[272px]">
        {/* Thanh trên */}
        <header className="sticky top-0 z-30 border-b-2 border-dashed border-ink/15 bg-paper/90 backdrop-blur-md">
          <div className="flex h-[72px] items-center justify-between gap-3 px-4 md:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Mở menu"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-ink/15 bg-raised text-ink transition-colors hover:border-blue hover:text-blue lg:hidden"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
              <div className="min-w-0">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-blue">
                  không gian làm việc
                </p>
                <h1 className="truncate text-lg font-extrabold leading-tight text-ink">
                  {sectionTitle}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <ThemeToggle />
              <div className="flex items-center gap-2.5 rounded-xl border-2 border-ink/12 bg-raised py-1.5 pl-1.5 pr-4">
                <InitialAvatar name={data.me.name} id={data.me.id} size="sm" />
                <div className="hidden min-w-0 sm:block">
                  <p className="truncate text-[13px] font-bold leading-tight text-ink">
                    {data.me.name}
                  </p>
                  <p className="text-[11px] leading-tight text-ink-faint">
                    {ROLE_LABEL[data.role] ?? data.role}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Nội dung theo section */}
        <main
          className="relative min-h-[calc(100vh-72px)] px-4 py-7 md:px-6 lg:px-8 lg:py-9"
          aria-live="polite"
        >
          <div
            aria-hidden="true"
            className="mask-fade-edges pointer-events-none absolute inset-0 bg-dots-paper"
          />
          <div className="relative mx-auto w-full max-w-6xl">
            {section === "dashboard" ? <DashboardView data={data} onNavigate={navigate} /> : null}
            {section === "tasks" ? <TasksView data={data} /> : null}
            {section === "sprint" ? <SprintView data={data} /> : null}
            {section === "projects" ? <ProjectsView data={data} /> : null}
            {section === "mentor" ? <MentorView /> : null}
            {section === "performance" ? <PerformanceView data={data} /> : null}
            {section === "roster" && data.roster ? <RosterView roster={data.roster} /> : null}
            {section === "settings" ? <SettingsView /> : null}
          </div>
        </main>
      </div>
    </div>
  );
}
