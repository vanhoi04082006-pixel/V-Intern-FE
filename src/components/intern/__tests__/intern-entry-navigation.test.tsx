import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { InternEntry } from "@/components/product/intern-entry";
import { InternWorkspace } from "../intern-workspace";
import { active, principal, waiting } from "@/test/nest-fixtures";
import { clearSession, setSession } from "@/lib/auth/session";
let path = "/intern/notifications";
let workspace: typeof waiting & { hasAssignmentHistory?: boolean } = waiting;
const router = { replace: vi.fn(), push: vi.fn() };
vi.mock("next/navigation", () => ({
  usePathname: () => path,
  useRouter: () => router,
}));
vi.mock("@/components/auth/workspace-guard", () => ({
  WorkspaceGuard: ({ children }: { children: React.ReactNode }) => children,
}));
// The topbar bell polls the unread-count endpoint; keep it out of the
// global fetch call-count assertions below.
vi.mock("@/lib/api/outcomes", () => ({
  fetchUnreadCount: async () => 0,
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
  it('shows results and history after an assignment ends instead of telling the student they are awaiting their first project', async () => {
    path = '/intern'; workspace = { ...waiting, hasAssignmentHistory: true };
    render(<InternWorkspace />);
    expect(await screen.findByRole('heading', { name: 'Kết quả và lịch sử thực tập', level: 1 })).toBeInTheDocument();
    expect(screen.queryByText('Đã vượt qua phỏng vấn — đang chờ giảng viên phân dự án')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Xem đánh giá đã ghi nhận/ })).toHaveAttribute('href', '/intern/evaluations');
    expect(screen.getByRole('link', { name: /Xem KPI và lương ảo/ })).toHaveAttribute('href', '/intern/kpi');
    expect(screen.getByRole('link', { name: /Xem chứng nhận/ })).toHaveAttribute('href', '/intern/certificates');
    // History can also contain cancellations: no completion badge, score or certificate count is invented.
    expect(screen.queryByText('Bạn đã hoàn thành kỳ thực tập')).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('keeps the history screen visible and blocks repeated refresh while checking for a new assignment', async () => {
    path = '/intern'; workspace = { ...waiting, hasAssignmentHistory: true };
    render(<InternEntry><InternWorkspace /></InternEntry>);
    await screen.findByRole('heading', { name: 'Kết quả và lịch sử thực tập' });
    let finish!: (response: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const { fireEvent, waitFor } = await import('@testing-library/react');
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra phân công mới' }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(screen.getByRole('button', { name: 'Đang kiểm tra phân công…' })).toBeDisabled();
    expect(screen.getByRole('heading', { name: 'Kết quả và lịch sử thực tập' })).toBeInTheDocument();
    finish(new Response(JSON.stringify(workspace)));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Kiểm tra phân công mới' })).toBeEnabled());
  });
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
  it.each(['certificates', 'certificates/cert-id', 'evaluations', 'performance', 'recommendations', 'kpi', 'virtual-salary'])('retains own historical %s after the active placement ends', async route => {
    workspace = { ...waiting, hasAssignmentHistory: true }; path = `/intern/${route}`;
    render(<InternEntry><h1>Historical outcome</h1></InternEntry>);
    await screen.findByText('Historical outcome');
    expect(within(screen.getByRole('navigation', { name: 'Điều hướng thực tập sinh' })).getByRole('link', { name: 'Chứng nhận' })).toHaveAttribute('href', '/intern/certificates');
    expect(screen.getByRole('button', { name: 'AI Mentor' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Công việc của tôi' })).toBeDisabled();
  });
  it.each(['mentor', 'work/task-id', 'sprint', 'project'])('history never mounts assignment-dependent %s content', async route => {
    workspace = { ...waiting, hasAssignmentHistory: true }; path = `/intern/${route}`;
    const content = vi.fn(() => <div>Protected child</div>); render(<InternEntry>{content}</InternEntry>);
    await screen.findByRole('heading', { name: 'Đang chờ phân công' }); expect(content).not.toHaveBeenCalled();
  });
});
