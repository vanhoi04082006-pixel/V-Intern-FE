import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AudienceCards } from "@/components/v-intern/audience-cards";

// Card dùng next/image cho minh hoạ — mock rỗng (test không phụ thuộc ảnh)
vi.mock("next/image", () => ({
  default: () => null,
}));

describe("AudienceCards", () => {
  it("CTA sinh viên 'Bắt đầu hành trình của bạn' dẫn tới /login", () => {
    render(<AudienceCards />);

    expect(
      screen.getByRole("link", { name: /Bắt đầu hành trình của bạn/ })
    ).toHaveAttribute("href", "/login");
  });

  it("CTA giảng viên 'Khám phá tính năng' giữ mục đích explore (#platform)", () => {
    render(<AudienceCards />);

    expect(
      screen.getByRole("link", { name: /Khám phá tính năng/ })
    ).toHaveAttribute("href", "#platform");
  });
});
