import { useState } from "react";
import { beforeEach, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Modal } from "../primitives";

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});

function Nested() {
  const [outer, setOuter] = useState(true);
  const [inner, setInner] = useState(false);
  return outer && <Modal title="Kết quả KPI" onClose={() => setOuter(false)}>
    <button onClick={() => setInner(true)}>Mở nguồn tính</button>
    {inner && <Modal title="Nguồn tính" onClose={() => setInner(false)}>Chi tiết</Modal>}
  </Modal>;
}

it("cancels only the top dialog and returns focus to its opener", () => {
  render(<Nested />);
  const opener = screen.getByRole("button", { name: "Mở nguồn tính" });
  opener.focus();
  fireEvent.click(opener);
  const inner = screen.getByRole("dialog", { name: "Nguồn tính" });
  fireEvent(inner, new Event("cancel", { cancelable: true }));
  expect(screen.queryByRole("dialog", { name: "Nguồn tính" })).not.toBeInTheDocument();
  const outer = screen.getByRole("dialog", { name: "Kết quả KPI" });
  expect(opener).toHaveFocus();
  fireEvent.click(within(outer).getByRole("button", { name: "Đóng" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
