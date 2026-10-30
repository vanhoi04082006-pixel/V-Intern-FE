import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Navbar } from "@/components/v-intern/navbar";

describe("Navbar", () => {
  it("render brand + đầy đủ nav link", () => {
    render(<Navbar />);

    expect(screen.getByRole("link", { name: /V-Intern - Về đầu trang/i })).toHaveAttribute(
      "href",
      "#platform"
    );
    expect(screen.getByRole("link", { name: "Nền tảng" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dành cho giảng viên" })).toBeInTheDocument();
  });

  it("mobile menu đóng mặc định", () => {
    render(<Navbar />);

    expect(screen.getByRole("button", { name: /mở menu/i })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
    expect(document.getElementById("mobile-menu")).toBeNull();
  });

  it("mở menu khi bấm hamburger", async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    await user.click(screen.getByRole("button", { name: /mở menu/i }));

    expect(screen.getByRole("button", { name: /đóng menu/i })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    const menu = document.getElementById("mobile-menu");
    expect(menu).not.toBeNull();
    expect(
      within(menu as HTMLElement).getByRole("link", { name: "Dành cho sinh viên" })
    ).toBeInTheDocument();
  });

  it("đóng menu khi bấm lần nữa", async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    await user.click(screen.getByRole("button", { name: /mở menu/i }));
    await user.click(screen.getByRole("button", { name: /đóng menu/i }));

    expect(screen.queryByRole("button", { name: /đóng menu/i })).toBeNull();
  });

  it("Escape đóng menu mobile và trả focus về nút bật/tắt", async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    const toggle = screen.getByRole("button", { name: /mở menu/i });
    await user.click(toggle);
    expect(document.getElementById("mobile-menu")).not.toBeNull();

    await user.keyboard("{Escape}");

    expect(document.getElementById("mobile-menu")).toBeNull();
    expect(screen.getByRole("button", { name: /mở menu/i })).toHaveFocus();
  });

  it("không còn dead control 'Sign in' (đã bị loại trong bootstrap)", () => {
    render(<Navbar />);

    expect(screen.queryByText("Sign in")).not.toBeInTheDocument();
  });

  it("CTA đã Việt hóa: có 'Bắt đầu', không còn 'Get started' (regression i18n)", () => {
    render(<Navbar />);

    expect(screen.getAllByRole("link", { name: "Bắt đầu" }).length).toBeGreaterThan(0);
    expect(screen.queryByText("Get started")).not.toBeInTheDocument();
  });

  it("CTA 'Bắt đầu' desktop + mobile đều dẫn tới /login", async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    // Desktop: menu đóng → chỉ CTA desktop trong DOM
    expect(screen.getByRole("link", { name: "Bắt đầu" })).toHaveAttribute(
      "href",
      "/login"
    );

    // Mobile: mở menu → CTA trong menu cũng trỏ /login
    await user.click(screen.getByRole("button", { name: /mở menu/i }));
    const menu = document.getElementById("mobile-menu");
    expect(menu).not.toBeNull();
    const mobileCta = within(menu as HTMLElement).getByRole("link", {
      name: "Bắt đầu",
    });
    expect(mobileCta).toHaveAttribute("href", "/login");

    // Behavior giữ nguyên: click CTA mobile phải đóng menu
    await user.click(mobileCta);
    expect(document.getElementById("mobile-menu")).toBeNull();
  });
});
