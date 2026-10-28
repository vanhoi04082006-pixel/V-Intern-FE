import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Pager } from "../primitives";

describe("Pager", () => {
  it("renders Vietnamese labels and moves to the next page", () => {
    const onChange = vi.fn();
    render(<Pager page={1} totalPages={2} total={12} onChange={onChange} />);

    expect(screen.getByText("12 bản ghi · Trang 1/2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sau" }));
    expect(onChange).toHaveBeenCalledWith(2);
  });
});
