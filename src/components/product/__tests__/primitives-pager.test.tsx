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

  it("hides navigation buttons on a single page so they never read as broken", () => {
    const onChange = vi.fn();
    render(
      <Pager page={1} totalPages={1} total={2} onChange={onChange} unit="ghi nhận" />,
    );

    // Count is still announced with the Vietnamese unit…
    expect(screen.getByText("2 ghi nhận")).toBeInTheDocument();
    // …but there are no disabled "Trước/Sau" controls on a single page.
    expect(screen.queryByRole("button", { name: "Trước" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sau" })).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});
