import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn()", () => {
  it("nối các class với điều kiện falsy bị loại bỏ", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });

  it("giữ class cuối khi Tailwind conflict", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("hỗ trợ object điều kiện", () => {
    expect(cn("base", { active: true, disabled: false })).toBe("base active");
  });

  it("giữ màu chữ nút khi áp dụng typography token", () => {
    expect(cn("bg-primary text-primary-foreground", "text-body"))
      .toBe("bg-primary text-primary-foreground text-body");
  });

  it("chỉ thay kích thước chữ, giữ semantic color và responsive variant", () => {
    expect(cn("text-caption text-success md:text-small", "text-body md:text-section"))
      .toBe("text-success text-body md:text-section");
  });
});
