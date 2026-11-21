import { render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "../confirm-dialog";

/* jsdom không có showModal()/close() — polyfill theo pattern shell.test/nested-modal.test. */
HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.setAttribute("open", "");
};
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.removeAttribute("open");
};

describe("ConfirmDialog", () => {
  it("không render gì khi open=false", () => {
    render(
      <ConfirmDialog
        open={false}
        title="Xóa nhiệm vụ?"
        onConfirm={() => undefined}
        onCancel={() => undefined}
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("danger: hiện đúng tiêu đề/mô tả, hủy không chạy onConfirm", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open
        tone="danger"
        title="Xóa nhiệm vụ TASK-101?"
        description="Lịch sử vẫn được giữ."
        confirmLabel="Xóa nhiệm vụ"
        cancelLabel="Không xóa"
        onConfirm={onConfirm}
        onCancel={onCancel}
      >
        Các bài nộp liên quan không bị xoá kèm.
      </ConfirmDialog>,
    );
    const dialog = screen.getByRole("dialog", { name: "Xóa nhiệm vụ TASK-101?" });
    expect(dialog).toHaveTextContent("Lịch sử vẫn được giữ.");
    expect(dialog).toHaveTextContent("Các bài nộp liên quan không bị xoá kèm.");
    await user.click(screen.getByRole("button", { name: "Không xóa" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("xác nhận chạy onConfirm đúng một lần", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog open title="Bỏ dở thiết lập?" confirmLabel="Bỏ dở" onConfirm={onConfirm} onCancel={() => undefined} />,
    );
    await user.click(screen.getByRole("button", { name: "Bỏ dở" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("busy: cả hai nút khoá để không gửi hai lần / đóng nhầm", async () => {
    const user = userEvent.setup();
    render(
      <ConfirmDialog open busy title="Đang xử lý?" confirmLabel="Xóa" cancelLabel="Hủy" onConfirm={() => undefined} onCancel={() => undefined} />,
    );
    expect(screen.getByRole("button", { name: /xóa/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Hủy" })).toBeDisabled();
    // Nút đóng (aria-label "Đóng") cũng khoá khi busy.
    expect(screen.getByRole("button", { name: "Đóng" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /xóa/i })).catch(() => undefined);
  });

  it("focus về phần tử trước khi mở khi đóng", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <button type="button" onClick={() => setOpen(true)}>
            Mở xác nhận
          </button>
          <ConfirmDialog open={open} title="Xác nhận?" onConfirm={() => setOpen(false)} onCancel={() => setOpen(false)} />
        </div>
      );
    }
    render(<Harness />);
    // Nhấn nút mở (focus nằm ở nút mở) → dialog mount với previous = nút mở.
    await user.click(screen.getByRole("button", { name: "Mở xác nhận" }));
    await user.click(screen.getByRole("button", { name: "Hủy" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Mở xác nhận" })).toHaveFocus());
  });
});
