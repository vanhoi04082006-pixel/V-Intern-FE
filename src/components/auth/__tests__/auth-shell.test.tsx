import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthShell } from "@/components/auth/auth-shell";

// AuthShell dùng next/image (fill) cho background — mock rỗng
vi.mock("next/image", () => ({
  default: () => null,
}));

describe("AuthShell — back navigation", () => {
  it("có control 'Quay lại' dùng chung dẫn về Landing (/)", () => {
    render(
      <AuthShell>
        <div>auth content</div>
      </AuthShell>
    );

    const back = screen.getByRole("link", { name: "Quay lại trang chủ" });
    expect(back).toHaveAttribute("href", "/");
  });

  it("dùng internal Link (không phải router.back/history)", () => {
    render(
      <AuthShell>
        <div>auth content</div>
      </AuthShell>
    );

    const back = screen.getByRole("link", { name: "Quay lại trang chủ" });
    expect(back.tagName).toBe("A");
    expect(back).toHaveAttribute("href", "/");
    expect(back.getAttribute("href")).not.toBe("#");
  });
});
