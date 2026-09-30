import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewsletterForm } from "@/components/v-intern/newsletter-form";

describe("NewsletterForm (backend chưa kết nối)", () => {
  it("email không hợp lệ → báo lỗi validation, không gửi", async () => {
    const user = userEvent.setup();
    render(<NewsletterForm />);

    await user.type(screen.getByLabelText(/email của bạn/i), "email-sai");
    await user.click(screen.getByRole("button", { name: "Đăng ký" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      /email chưa hợp lệ/i
    );
    expect(screen.queryByText(/chưa được kết nối/i)).not.toBeInTheDocument();
  });

  it("email hợp lệ nhưng backend chưa cấu hình → trạng thái 'chưa kết nối', KHÔNG giả thành công", async () => {
    const user = userEvent.setup();
    render(<NewsletterForm />);

    await user.type(screen.getByLabelText(/email của bạn/i), "sv@vintern.vn");
    await user.click(screen.getByRole("button", { name: "Đăng ký" }));

    expect(await screen.findByText(/chưa được kết nối với hệ thống/i)).toBeVisible();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("có nút thử lại để quay về form", async () => {
    const user = userEvent.setup();
    render(<NewsletterForm />);

    await user.type(screen.getByLabelText(/email của bạn/i), "sv@vintern.vn");
    await user.click(screen.getByRole("button", { name: "Đăng ký" }));
    await user.click(await screen.findByRole("button", { name: /thử lại/i }));

    expect(screen.getByLabelText(/email của bạn/i)).toBeVisible();
  });
});
