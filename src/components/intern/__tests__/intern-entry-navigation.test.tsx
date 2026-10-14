import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { InternEntry } from "@/components/product/intern-entry";
import { InternWorkspace } from "../intern-workspace";
import { active, principal, waiting } from "@/test/nest-fixtures";
import { clearSession, setSession } from "@/lib/auth/session";
let path = "/intern/notifications";
let workspace = waiting;
const router = { replace: vi.fn(), push: vi.fn() };
vi.mock("next/navigation", () => ({
  usePathname: () => path,
  useRouter: () => router,
}));
vi.mock("@/components/auth/workspace-guard", () => ({
  WorkspaceGuard: ({ children }: { children: React.ReactNode }) => children,
}));
beforeEach(() => {
  path = "/intern/notifications";
  workspace = waiting;
  setSession("test-token", principal);
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:8080/api/v1");
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(workspace))),
  );
});
afterEach(() => {
  clearSession();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("one lifecycle-aware intern shell", () => {
  it("uses the same navigation on overview and notifications, with the actual current page", async () => {
    path = "/intern";
    const view = render(<InternWorkspace />);
    const overview = await screen.findByRole("navigation", {
      name: "Điều hướng thực tập sinh",
    });
    const labels = overview.textContent;
    view.unmount();
    path = "/intern/notifications";
    render(
      <InternEntry>
        <h1>Inbox content</h1>
      </InternEntry>,
    );
    await screen.findByText("Inbox content");
    const nav = screen.getByRole("navigation", {
      name: "Điều hướng thực tập sinh",
    });
    expect(nav.textContent).toBe(labels);
    expect(
      within(nav).getByRole("link", { name: "Thông báo" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(nav).getByRole("link", { name: "Tổng quan" }),
    ).not.toHaveAttribute("aria-current");
    expect(
      within(nav).getByRole("button", { name: "AI Mentor" }),
    ).toBeDisabled();
    expect(within(nav).queryByText("KPI & Lương ảo")).not.toBeInTheDocument();
  });
  it.each([
    "mentor",
    "evaluations",
    "performance",
    "certificates",
    "recommendations",
    "work",
    "work/task-123",
    "kpi",
    "virtual-salary",
    "sprint",
    "project",
  ])(
    "does not mount protected %s content on direct navigation while unassigned",
    async (route) => {
      path = `/intern/${route}`;
      const content = vi.fn(() => <div>Protected child</div>);
      render(<InternEntry>{content}</InternEntry>);
      expect(
        await screen.findByRole("heading", { name: "Đang chờ phân công" }),
      ).toBeInTheDocument();
      expect(content).not.toHaveBeenCalled();
      expect(screen.queryByText("Protected child")).not.toBeInTheDocument();
    },
  );
  it("allows assigned intern content and highlights nested task pages", async () => {
    workspace = active;
    path = "/intern/work/task-123";
    render(
      <InternEntry>
        <h1>Task content</h1>
      </InternEntry>,
    );
    await screen.findByText("Task content");
    const nav = screen.getByRole("navigation", {
      name: "Điều hướng thực tập sinh",
    });
    expect(
      within(nav).getByRole("link", { name: "Công việc của tôi" }),
    ).toHaveAttribute("aria-current", "page");
  });
});
