import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthTabs } from "@/components/auth/auth-tabs";

/**
 * Tabs điều hướng giữa 2 route thật: /login ↔ /register.
 * Test hành vi điều hướng (link + aria-current), không test style.
 */
describe("AuthTabs (điều hướng login ↔ register)", () => {
  it("ở trang /login: tab Đăng nhập đang active, tab Đăng ký trỏ sang /register", () => {
    render(<AuthTabs active="login" />);

    const loginTab = screen.getByRole("link", { name: "Đăng nhập" });
    const registerTab = screen.getByRole("link", { name: "Đăng ký" });

    expect(loginTab).toHaveAttribute("href", "/login");
    expect(loginTab).toHaveAttribute("aria-current", "page");
    expect(registerTab).toHaveAttribute("href", "/register");
    expect(registerTab).not.toHaveAttribute("aria-current");
  });

  it("ở trang /register: tab Đăng ký đang active, tab Đăng nhập trỏ về /login", () => {
    render(<AuthTabs active="register" />);

    const loginTab = screen.getByRole("link", { name: "Đăng nhập" });
    const registerTab = screen.getByRole("link", { name: "Đăng ký" });

    expect(registerTab).toHaveAttribute("href", "/register");
    expect(registerTab).toHaveAttribute("aria-current", "page");
    expect(loginTab).toHaveAttribute("href", "/login");
    expect(loginTab).not.toHaveAttribute("aria-current");
  });
});
