import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterForm } from "@/components/auth/register-form";
import { register } from "@/lib/auth/auth-service";

vi.mock("@/lib/auth/auth-service", () => ({
  register: vi.fn(),
}));

const mockRegister = vi.mocked(register);

const VALID = {
  fullName: "Nguyễn Văn A",
  email: "sv@vintern.vn",
  password: "matkhau123",
  confirm: "matkhau123",
};

async function fillValidForm(
  user: ReturnType<typeof userEvent.setup>,
  overrides: Partial<typeof VALID> = {}
) {
  const values = { ...VALID, ...overrides };
  await user.type(screen.getByLabelText("Họ và tên"), values.fullName);
  await user.type(screen.getByLabelText("Email"), values.email);
  const passwordFields = screen.getAllByLabelText("Mật khẩu");
  // Thứ tự DOM: Mật khẩu → Xác nhận mật khẩu
  await user.type(passwordFields[0], values.password);
  await user.type(
    screen.getByLabelText("Xác nhận mật khẩu"),
    values.confirm
  );
  await user.click(screen.getByLabelText(/Tôi đồng ý với Điều khoản/));
}

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submit rỗng → đủ 5 lỗi bắt buộc bằng tiếng Việt, không gọi API", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.click(screen.getByRole("button", { name: "Đăng ký" }));

    expect(screen.getByText("Vui lòng nhập họ và tên.")).toBeInTheDocument();
    expect(screen.getByText("Vui lòng nhập email.")).toBeInTheDocument();
    expect(screen.getByText("Vui lòng nhập mật khẩu.")).toBeInTheDocument();
    expect(
      screen.getByText("Vui lòng xác nhận mật khẩu.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Bạn cần đồng ý với điều khoản để tiếp tục.")
    ).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("email sai định dạng → báo 'Email không đúng định dạng.'", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await fillValidForm(user, { email: "email-khong-dung" });
    await user.click(screen.getByRole("button", { name: "Đăng ký" }));

    expect(
      screen.getByText("Email không đúng định dạng.")
    ).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("mật khẩu quá ngắn → báo lỗi tối thiểu 8 ký tự", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await fillValidForm(user, { password: "abc12", confirm: "abc12" });
    await user.click(screen.getByRole("button", { name: "Đăng ký" }));

    expect(
      screen.getByText("Mật khẩu phải có ít nhất 8 ký tự.")
    ).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("xác nhận mật khẩu không khớp → báo lỗi mismatch", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await fillValidForm(user, { confirm: "matkhau-khac" });
    await user.click(screen.getByRole("button", { name: "Đăng ký" }));

    expect(
      screen.getByText("Mật khẩu xác nhận không khớp.")
    ).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("chưa đồng ý điều khoản → báo lỗi và không gửi", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Họ và tên"), VALID.fullName);
    await user.type(screen.getByLabelText("Email"), VALID.email);
    await user.type(screen.getByLabelText("Mật khẩu"), VALID.password);
    await user.type(
      screen.getByLabelText("Xác nhận mật khẩu"),
      VALID.confirm
    );
    await user.click(screen.getByRole("button", { name: "Đăng ký" }));

    expect(
      screen.getByText("Bạn cần đồng ý với điều khoản để tiếp tục.")
    ).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("backend chưa kết nối → trạng thái trung thực, KHÔNG giả đăng ký thành công", async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue({
      ok: false,
      kind: "not-connected",
      message: "Tính năng đăng ký chưa được kết nối với hệ thống.",
    });
    render(<RegisterForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Đăng ký" }));

    const alert = await screen.findByRole("status");
    expect(alert).toHaveTextContent(
      "Tính năng đăng ký chưa được kết nối với hệ thống."
    );
    expect(
      screen.queryByText(/đăng ký thành công/i)
    ).not.toBeInTheDocument();
  });

  it("đăng ký thành công → UI success với nút về đăng nhập", async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue({ ok: true });
    render(<RegisterForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Đăng ký" }));

    expect(
      await screen.findByRole("heading", { name: "Đăng ký thành công" })
    ).toBeInTheDocument();
    expect(mockRegister).toHaveBeenCalledWith({ fullName: VALID.fullName, email: VALID.email, password: VALID.password, acceptedTerms: true });
    expect(
      screen.getByText(/Tài khoản của bạn đã được tạo\./)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Đăng nhập ngay" })
    ).toHaveAttribute("href", "/login");
  });

  it("previewState=success (dev-only) → hiển thị UI thành công", () => {
    render(<RegisterForm previewState="success" />);
    expect(
      screen.getByRole("heading", { name: "Đăng ký thành công" })
    ).toBeInTheDocument();
  });
});
