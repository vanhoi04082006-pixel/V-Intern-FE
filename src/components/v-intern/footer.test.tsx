import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "@/components/v-intern/footer";

describe("Footer", () => {
  it("không còn anchor giả href='#'", () => {
    const { container } = render(<Footer />);

    expect(container.querySelector('a[href="#"]')).toBeNull();
    expect(container.querySelector('a[href="#platform"]')).not.toBeNull();
  });

  it("link chưa có đích hiển thị dạng <span> không tương tác", () => {
    const { container } = render(<Footer />);

    const spans = Array.from(container.querySelectorAll("span"));
    const label = spans.find((el) => el.textContent === "Bảng giá");

    expect(label).not.toBeNull();
    expect(label?.closest("a")).toBeNull();
  });

  it("render đủ 4 nhóm liên kết + copyright", () => {
    render(<Footer />);

    // DOM giữ chữ gốc; chữ HOA do class `uppercase` của CSS
    expect(screen.getByRole("heading", { name: /sản phẩm/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /công ty/i })).toBeInTheDocument();
    expect(
      screen.getByText(/V-Intern\. Bảo lưu mọi quyền\./)
    ).toBeInTheDocument();
  });
});
