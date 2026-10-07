import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { WorkspaceGuard } from "@/components/auth/workspace-guard";
import { LogoutButton } from "@/components/auth/logout-button";
import { clearSession, setSession, getSessionUser } from "@/lib/auth/session";
import { principal } from "@/test/nest-fixtures";
import { ApiError } from "@/lib/auth/api-client";
import { fetchCurrentUser } from "@/lib/auth/auth-service";
import userEvent from "@testing-library/user-event";
const replace = vi.fn();
const router = { replace };
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/lib/auth/auth-service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth/auth-service")>()),
  fetchCurrentUser: vi.fn(),
}));
const fetchUser = vi.mocked(fetchCurrentUser);
const roles = ["intern"];
beforeEach(() => {
  clearSession();
  vi.clearAllMocks();
  fetchUser.mockResolvedValue(principal);
  setSession("token", principal);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("backend principal guard", () => {
  it("unauthenticated protected route redirects to login", async () => {
    fetchUser.mockResolvedValue(null);
    render(<WorkspaceGuard allowedRoles={roles}>private</WorkspaceGuard>);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("private")).not.toBeInTheDocument();
  });
  it("fresh principal allows the role", async () => {
    render(<WorkspaceGuard allowedRoles={roles}>private</WorkspaceGuard>);
    expect(await screen.findByText("private")).toBeInTheDocument();
  });
  it.each([
    ["admin", "/admin"],
    ["instructor", "/instructor"],
  ])("wrong role %s redirects without leaking children", async (role, path) => {
    fetchUser.mockResolvedValue({ ...principal, roles: [role] });
    render(<WorkspaceGuard allowedRoles={roles}>private</WorkspaceGuard>);
    await waitFor(() => expect(replace).toHaveBeenCalledWith(path));
    expect(screen.queryByText("private")).not.toBeInTheDocument();
  });
  it("does not trust stale in-memory role", async () => {
    setSession("token", { ...principal, roles: ["admin"] });
    fetchUser.mockResolvedValue(principal);
    render(
      <WorkspaceGuard allowedRoles={["admin"]}>admin-private</WorkspaceGuard>,
    );
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/intern"));
    expect(screen.queryByText("admin-private")).not.toBeInTheDocument();
  });
  it("network failure is Error rather than unauthenticated redirect", async () => {
    fetchUser.mockRejectedValue(new ApiError(0, "NETWORK_ERROR", "offline"));
    render(<WorkspaceGuard allowedRoles={roles}>private</WorkspaceGuard>);
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
  it("session invalidation removes content and redirects", async () => {
    render(<WorkspaceGuard allowedRoles={roles}>private</WorkspaceGuard>);
    await screen.findByText("private");
    const { act } = await import("@testing-library/react");
    act(() => clearSession());
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("private")).not.toBeInTheDocument();
  });
  it("logout calls backend, clears state, redirects", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:8080/api/v1");
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetcher);
    render(<LogoutButton />);
    await userEvent.click(screen.getByRole("button", { name: "Đăng xuất" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(getSessionUser()).toBeNull();
    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/auth/logout",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });
});
