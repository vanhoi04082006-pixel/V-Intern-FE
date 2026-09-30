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
    expect(screen.getByRole("link", { name: "Platform" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "For Instructors" })).toBeInTheDocument();
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
      within(menu as HTMLElement).getByRole("link", { name: "For Students" })
    ).toBeInTheDocument();
  });

  it("đóng menu khi bấm lần nữa", async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    await user.click(screen.getByRole("button", { name: /mở menu/i }));
    await user.click(screen.getByRole("button", { name: /đóng menu/i }));

    expect(screen.queryByRole("button", { name: /đóng menu/i })).toBeNull();
  });

  it("không còn dead control 'Sign in' (đã bị loại trong bootstrap)", () => {
    render(<Navbar />);

    expect(screen.queryByText("Sign in")).not.toBeInTheDocument();
  });
});
