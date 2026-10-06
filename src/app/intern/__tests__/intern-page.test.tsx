import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import InternPage from "@/app/intern/page";
import { refreshSession } from "@/lib/auth/auth-service";
import { clearSession, setSession } from "@/lib/auth/session";

/**
 * Test trang /intern — phân nhánh auth theo `_preview`:
 *
 * - DEVELOPMENT + `_preview=empty|active` (giá trị CHÍNH XÁC): render
 *   Intern Workspace TRỰC TIẾP, KHÔNG mount WorkspaceGuard — review UI
 *   không cần Backend. Chứng minh bằng: refreshSession được mock thành
 *   promise không bao giờ resolve (guard nếu mount sẽ kẹt ở "checking",
 *   nội dung không bao giờ xuất hiện) + không redirect + không đụng auth.
 * - Mọi trường hợp khác (dev không/không hợp lệ preview, production có
 *   preview, production không preview) → đi qua WorkspaceGuard THẬT như
 *   trước: chưa đăng nhập → /login. Production KHÔNG bao giờ bypass.
 *
 * Bypass được enforce tại `parseInternPreviewParam` (dev + giá trị hợp lệ)
 * — case helper đã cover trong intern-workspace.test.tsx; ở đây chốt hành
 * vi PHÂN NHÁNH của page. Guard tổng quát đã cover ở workspace-guard.test.tsx.
 */

const replace = vi.fn();
const routerStub = { replace, push: vi.fn(), refresh: vi.fn() };

vi.mock("next/navigation", () => ({
  useRouter: () => routerStub,
}));

vi.mock("@/lib/auth/auth-service", () => ({
  refreshSession: vi.fn(),
}));

const mockRefresh = vi.mocked(refreshSession);

const INTERN_USER = {
  id: "u1",
  email: "intern@vintern.local",
  displayName: "Nguyễn Văn A",
  roles: ["intern"],
  permissions: [],
};

type SearchParams = { [key: string]: string | string[] | undefined };

/** Gọi page (server component async) với searchParams giả rồi render JSX. */
async function renderInternPage(params: SearchParams) {
  const ui = await InternPage({ searchParams: Promise.resolve(params) });
  return render(ui);
}

describe("InternPage — dev preview render không cần auth (KHÔNG Backend)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSession();
    // Guard nếu (sai) được mount sẽ gọi refresh — promise treo vĩnh viễn
    // để bất kỳ lộ trình qua guard nào cũng kẹt "checking" và fail test.
    mockRefresh.mockReturnValue(new Promise(() => {}));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("dev + ?_preview=empty → Waiting State render NGAY, không refresh, không redirect", async () => {
    vi.stubEnv("NODE_ENV", "development");

    await renderInternPage({ _preview: "empty" });

    // Nội dung Waiting xuất hiện NGAY — guard không được mount.
    expect(
      screen.getByRole("heading", { level: 1, name: "Intern Workspace" })
    ).toBeInTheDocument();
    expect(screen.getByText("Xin chào, Nguyễn Văn A 👋")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Chưa có dự án được phân công" })
    ).toBeInTheDocument();
    expect(screen.getByText("Chờ phân công")).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Task Board" })
    ).not.toBeInTheDocument();

    // Không đụng auth: không gọi refresh (BE), không redirect, không
    // trạng thái checking của guard.
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    expect(
      screen.queryByText("Đang kiểm tra phiên đăng nhập...")
    ).not.toBeInTheDocument();
  });

  it("dev + ?_preview=active → Active Workspace render NGAY, không refresh, không redirect", async () => {
    vi.stubEnv("NODE_ENV", "development");

    await renderInternPage({ _preview: "active" });

    expect(
      screen.getByRole("heading", { level: 1, name: "Intern Workspace" })
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Task Board" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Chưa có dự án được phân công" })
    ).not.toBeInTheDocument();

    expect(mockRefresh).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });
});

describe("InternPage — mọi trường hợp khác đều qua WorkspaceGuard như cũ", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSession();
    // Không đăng nhập + BE không có → refresh trả null → redirect /login.
    mockRefresh.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("dev + không có preview → guard giữ nguyên: refresh rồi /login, không lộ workspace", async () => {
    vi.stubEnv("NODE_ENV", "development");

    await renderInternPage({});

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/login");
    });
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("heading", { level: 1, name: "Intern Workspace" })
    ).not.toBeInTheDocument();
  });

  it("dev + preview KHÔNG hợp lệ (hack/true/array) → không bypass, vẫn /login", async () => {
    vi.stubEnv("NODE_ENV", "development");

    for (const value of ["hack", "true", ["empty"], ["hack"]] as (
      | string
      | string[]
    )[]) {
      replace.mockClear();
      mockRefresh.mockClear();

      await renderInternPage({ _preview: value });

      await waitFor(() => {
        expect(replace).toHaveBeenCalledWith("/login");
      });
      expect(mockRefresh).toHaveBeenCalledTimes(1);
      expect(
        screen.queryByRole("heading", { level: 1, name: "Intern Workspace" })
      ).not.toBeInTheDocument();
    }
  });

  it("production + ?_preview=empty → KHÔNG bypass: vẫn qua guard về /login", async () => {
    vi.stubEnv("NODE_ENV", "production");

    await renderInternPage({ _preview: "empty" });

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/login");
    });
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByText("Xin chào, Nguyễn Văn A 👋")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Chưa có dự án được phân công" })
    ).not.toBeInTheDocument();
  });

  it("production + ?_preview=active → KHÔNG bypass: vẫn qua guard về /login", async () => {
    vi.stubEnv("NODE_ENV", "production");

    await renderInternPage({ _preview: "active" });

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/login");
    });
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("region", { name: "Task Board" })
    ).not.toBeInTheDocument();
  });

  it("dev + đủ role intern (không preview) → guard vẫn cho render như cũ", async () => {
    vi.stubEnv("NODE_ENV", "development");
    setSession("token", INTERN_USER);

    await renderInternPage({});

    // Guard xác thực session trong bộ nhớ → render workspace (default ACTIVE).
    expect(
      await screen.findByRole("region", { name: "Task Board" })
    ).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
