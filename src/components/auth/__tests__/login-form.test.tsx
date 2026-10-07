import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/auth/login-form";
import { login } from "@/lib/auth/auth-service";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/auth/auth-service", () => ({
  login: vi.fn(),
}));

vi.mock("@/lib/api/workspace", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/workspace")>()),
  getWorkspace: vi.fn(
    async () => (await import("@/test/nest-fixtures")).waiting,
  ),
}));
const mockLogin = vi.mocked(login);

async function fillAndSubmit(
  user: ReturnType<typeof userEvent.setup>,
  {
    identifier = "sv@vintern.vn",
    password = "matkhau123",
  }: { identifier?: string; password?: string } = {},
) {
  await user.type(
    screen.getByLabelText("Email hoặc tên đăng nhập"),
    identifier,
  );
  await user.type(screen.getByLabelText("Mật khẩu"), password);
  await user.click(screen.getByRole("button", { name: "Đăng nhập" }));
}

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("render đầy đủ các trường, checkbox ghi nhớ, quên mật khẩu và Google", () => {
    render(<LoginForm />);

    expect(
      screen.getByLabelText("Email hoặc tên đăng nhập"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Mật khẩu")).toBeInTheDocument();
    expect(screen.getByLabelText("Ghi nhớ đăng nhập")).toBeChecked();
    expect(
      screen.getByRole("link", { name: "Quên mật khẩu?" }),
    ).toHaveAttribute("href", "/forgot-password");
    expect(
      screen.getByRole("button", { name: "Tiếp tục với Google" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Đăng ký ngay" })).toHaveAttribute(
      "href",
      "/register",
    );
  });

  it("bắt buộc nhập: submit rỗng → lỗi inline tiếng Việt ở 2 trường, focus vào trường đầu", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(
      screen.getByText("Vui lòng nhập email hoặc tên đăng nhập."),
    ).toBeInTheDocument();
    expect(screen.getByText("Vui lòng nhập mật khẩu.")).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Email hoặc tên đăng nhập")).toHaveFocus();
  });

  it("mật khẩu có nút hiện/ẩn với aria-label tiếng Việt", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const passwordInput = screen.getByLabelText("Mật khẩu");
    const toggle = screen.getByRole("button", { name: "Hiện mật khẩu" });
    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(toggle);
    expect(passwordInput).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Ẩn mật khẩu" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "Ẩn mật khẩu" }));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("đang đăng nhập: nút disabled, không submit lặp, chỉ gọi API một lần", async () => {
    const user = userEvent.setup();
    mockLogin.mockReturnValue(new Promise(() => {})); // never resolves
    render(<LoginForm />);

    await fillAndSubmit(user);

    // Click lần 2 trên nút đang loading (guard trong handler + disabled)
    fireEvent.click(screen.getByRole("button", { name: /đăng nhập/i }));

    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", { name: /Đang đăng nhập\.\.\./ }),
    ).toBeDisabled();
  });

  it("lỗi xác thực (sai email/mật khẩu) → alert inline, không có nút Thử lại", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({
      ok: false,
      kind: "auth-error",
      message: "Email hoặc mật khẩu không chính xác.",
    });
    render(<LoginForm />);

    await fillAndSubmit(user);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Email hoặc mật khẩu không chính xác.");
    expect(
      screen.queryByRole("button", { name: "Thử lại" }),
    ).not.toBeInTheDocument();
  });

  it("lỗi hệ thống → alert riêng với nút Thử lại", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({
      ok: false,
      kind: "system-error",
      message: "Không thể kết nối đến hệ thống. Vui lòng thử lại sau.",
    });
    render(<LoginForm />);

    await fillAndSubmit(user);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "Không thể kết nối đến hệ thống. Vui lòng thử lại sau.",
    );
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  it("backend chưa kết nối → trạng thái trung thực, KHÔNG giả đăng nhập thành công", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({
      ok: false,
      kind: "not-connected",
      message: "Tính năng đăng nhập chưa được kết nối với hệ thống.",
    });
    render(<LoginForm />);

    await fillAndSubmit(user);

    const alert = await screen.findByRole("status");
    expect(alert).toHaveTextContent(
      "Tính năng đăng nhập chưa được kết nối với hệ thống.",
    );
    expect(screen.queryByText(/đăng nhập thành công/i)).not.toBeInTheDocument();
  });

  it("đăng nhập thành công → chuyển hướng theo role (admin → /admin)", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({
      ok: true,
      user: {
        id: "user-1",
        email: "admin@vintern.local",
        displayName: "V-Intern Admin",
        roles: ["admin"],
        permissions: ["auth.me.read"],
      },
    });
    render(<LoginForm />);

    await fillAndSubmit(user, { identifier: "admin@vintern.local" });

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/admin");
    });
  });

  it("đăng nhập thành công với role instructor → chuyển hướng /instructor", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({
      ok: true,
      user: {
        id: "user-2",
        email: "instructor@vintern.local",
        displayName: "V-Intern Teacher",
        roles: ["instructor"],
        permissions: ["auth.me.read"],
      },
    });
    render(<LoginForm />);

    await fillAndSubmit(user, { identifier: "instructor@vintern.local" });

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/instructor");
    });
  });

  it("đăng nhập thành công với role intern → chuyển hướng /intern", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({
      ok: true,
      user: {
        id: "user-3",
        email: "intern@vintern.local",
        displayName: "Nguyễn Văn A",
        roles: ["intern"],
        permissions: ["auth.me.read"],
      },
    });
    render(<LoginForm />);

    await fillAndSubmit(user, { identifier: "intern@vintern.local" });

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/intern");
    });
  });

  it("đăng nhập lỗi → KHÔNG chuyển hướng", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({
      ok: false,
      kind: "auth-error",
      message: "Email hoặc mật khẩu không chính xác.",
    });
    render(<LoginForm />);

    await fillAndSubmit(user, { identifier: "admin@vintern.local" });

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("previewState=success (dev-only) → hiển thị trạng thái thành công, không redirect", () => {
    render(<LoginForm previewState="success" />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Đăng nhập thành công.",
    );
    expect(replace).not.toHaveBeenCalled();
  });
});
