import { describe, expect, it, vi, afterEach } from "vitest";
import { resolveLoginLanding } from "@/lib/auth/landing";
import { principal, waiting, active, blocked } from "@/test/nest-fixtures";
import { getWorkspace } from "@/lib/api/workspace";
vi.mock("@/lib/api/workspace", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/workspace")>()),
  getWorkspace: vi.fn(),
}));
afterEach(() => vi.clearAllMocks());
describe("login landing resolves backend lifecycle", () => {
  it.each([
    ["admin", "/admin"],
    ["instructor", "/instructor"],
  ])("%s lands directly without intern request", async (role, path) => {
    expect(await resolveLoginLanding({ ...principal, roles: [role] })).toBe(
      path,
    );
    expect(getWorkspace).not.toHaveBeenCalled();
  });
  it.each([
    ["recruitment_required", "/intern/onboarding"],
    ["recruitment_in_progress", "/intern/onboarding/interview"],
    ["recruitment_failed", "/intern/onboarding/result"],
    ["unassigned", "/intern"],
    ["active", "/intern"],
  ] as const)("intern %s resolves before navigation", async (status, path) => {
    vi.mocked(getWorkspace).mockResolvedValue(
      status === "active"
        ? active
        : status === "unassigned"
          ? waiting
          : blocked(status),
    );
    expect(await resolveLoginLanding(principal)).toBe(path);
  });
  it("backend outage never decides Active", async () => {
    vi.mocked(getWorkspace).mockRejectedValue(new Error("offline"));
    await expect(resolveLoginLanding(principal)).rejects.toThrow("offline");
  });
});
