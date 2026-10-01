import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hero } from "@/components/v-intern/hero";

// Hero dùng next/image cho linh vật — mock rỗng (test không phụ thuộc ảnh)
vi.mock("next/image", () => ({
  default: () => null,
}));

describe("Hero", () => {
  it("CTA chính 'Bắt đầu ngay' dẫn tới /login (internal navigation)", () => {
    render(<Hero />);

    expect(screen.getByRole("link", { name: /Bắt đầu ngay/ })).toHaveAttribute(
      "href",
      "/login"
    );
  });

  it("CTA phụ 'Tìm hiểu thêm' giữ nguyên anchor #how-it-works", () => {
    render(<Hero />);

    expect(screen.getByRole("link", { name: "Tìm hiểu thêm" })).toHaveAttribute(
      "href",
      "#how-it-works"
    );
  });
});
