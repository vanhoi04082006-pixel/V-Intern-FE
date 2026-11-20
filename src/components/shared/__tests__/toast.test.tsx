import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider, useToast } from "../toast";

/** Khu vực test toast: dùng component cầu nối để gọi API từ bên trong Provider. */
function ToastProbe() {
  const toast = useToast();
  return (
    <div>
      <button onClick={() => toast.success({ title: "Thành công: đã lưu hồ sơ" })}>
        success
      </button>
      <button onClick={() => toast.error({ title: "Không sinh được lương", description: "Chưa có kỳ KPI hoàn chỉnh." })}>
        error
      </button>
      <button onClick={() => toast.warning({ title: "Cảnh báo nhịp độ" })}>warning</button>
      <button onClick={() => toast.info({ title: "Đồng bộ GitHub xong" })}>info</button>
      <button onClick={() => toast.success({ title: "Đóng nhanh", duration: 40 })}>
        auto-fast
      </button>
      <button
        onClick={() => {
          const handle = toast.progress("Đang sinh lương kỳ 10/2026...");
          window.setTimeout(() => handle.done({ title: "Đã sinh lương kỳ 10/2026" }), 30);
        }}
      >
        progress-done
      </button>
      <button
        onClick={() => {
          const handle = toast.progress("Đang tải đánh giá...");
          window.setTimeout(() => handle.fail({ title: "Tải đánh giá thất bại" }), 30);
        }}
      >
        progress-fail
      </button>
      <button onClick={() => toast.permissionDenied()}>permission</button>
      <button onClick={() => toast.sessionExpired()}>session</button>
      <button onClick={() => toast.networkFailure()}>network</button>
    </div>
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe("ToastProvider + useToast", () => {
  it("không render gì khi chưa có toast", () => {
    render(
      <ToastProvider>
        <div>nội dung</div>
      </ToastProvider>,
    );
    expect(screen.getByText("nội dung")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("success: role=status, nội dung đúng, tự đóng theo duration", async () => {
    render(
      <ToastProvider>
        <ToastProbe />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "auto-fast" }));
    expect(screen.getByRole("status")).toHaveTextContent("Đóng nhanh");
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument(), { timeout: 1500 });
  });

  it("success tự đóng theo thời lượng mặc định 4500ms (fake timers)", async () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <ToastProbe />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "success" }));
    expect(screen.getByRole("status")).toHaveTextContent("Thành công: đã lưu hồ sơ");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200); // animation thời gian render
    });
    expect(screen.getByRole("status")).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4800); // qua ngưỡng 4500ms mặc định
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("error: role=alert (assertive) và có nút đóng", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastProbe />
      </ToastProvider>,
    );
    await user.click(screen.getByRole("button", { name: "error" }));
    const toast = screen.getByRole("alert");
    expect(toast).toHaveTextContent("Không sinh được lương");
    expect(toast).toHaveTextContent("Chưa có kỳ KPI hoàn chỉnh.");
    await user.click(screen.getByRole("button", { name: "Đóng thông báo" }));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });

  it("cảnh báo dùng role=alert, info dùng role=status", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastProbe />
      </ToastProvider>,
    );
    await user.click(screen.getByRole("button", { name: "warning" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Cảnh báo nhịp độ");
    await user.click(screen.getByRole("button", { name: "Đóng thông báo" }));
    await user.click(screen.getByRole("button", { name: "info" }));
    expect(screen.getByRole("status")).toHaveTextContent("Đồng bộ GitHub xong");
  });

  it("progress → done: spinner chuyển thành success", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastProbe />
      </ToastProvider>,
    );
    await user.click(screen.getByRole("button", { name: "progress-done" }));
    expect(screen.getByRole("status")).toHaveTextContent("Đang sinh lương kỳ 10/2026...");
    await waitFor(
      () => expect(screen.getByRole("status")).toHaveTextContent("Đã sinh lương kỳ 10/2026"),
      { timeout: 5000 },
    );
  });

  it("progress → fail: chuyển thành error giữ đúng thông tin thất bại", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastProbe />
      </ToastProvider>,
    );
    await user.click(screen.getByRole("button", { name: "progress-fail" }));
    await waitFor(
      () => expect(screen.getByRole("alert")).toHaveTextContent("Tải đánh giá thất bại"),
      { timeout: 5000 },
    );
  });

  it("stack trần 4 toast: toast cũ nhất rời khi đẩy thêm", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastProbe />
      </ToastProvider>,
    );
    for (const name of ["success", "warning", "info", "error", "session"]) {
      await user.click(screen.getByRole("button", { name }));
    }
    // Toast đầu ("Thành công: đã lưu hồ sơ") đã bị đẩy khỏi stack.
    expect(screen.queryByText("Thành công: đã lưu hồ sơ")).not.toBeInTheDocument();
    // Vẫn còn đúng 4 toast: warning/info/error/session.
    expect(screen.getByText("Cảnh báo nhịp độ")).toBeInTheDocument();
    expect(screen.getByText("Đồng bộ GitHub xong")).toBeInTheDocument();
    expect(screen.getByText("Không sinh được lương")).toBeInTheDocument();
    expect(screen.getByText("Phiên đăng nhập đã hết hạn")).toBeInTheDocument();
  });

  it("preset nghiệp vụ: hết phiên / mất mạng / không quyền có nội dung Việt ổn định", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastProbe />
      </ToastProvider>,
    );
    await user.click(screen.getByRole("button", { name: "permission" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Không có quyền thực hiện thao tác này");
    await user.click(screen.getByRole("button", { name: "network" }));
    expect(screen.getAllByRole("alert").some((node) => node.textContent?.includes("Không thể kết nối đến hệ thống"))).toBe(true);
    await user.click(screen.getByRole("button", { name: "session" }));
    expect(screen.getAllByRole("alert").some((node) => node.textContent?.includes("Phiên đăng nhập đã hết hạn"))).toBe(true);
  });

  it("useToast ngoài Provider: no-op, không vỡ UI", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    function Lonely() {
      const toast = useToast();
      return (
        <button
          onClick={() => {
            toast.success({ title: "bỏ qua" });
            toast.progress("bỏ qua").done({ title: "bỏ qua" });
            toast.permissionDenied();
          }}
        >
          lonely
        </button>
      );
    }
    render(<Lonely />);
    expect(() => screen.getByRole("button", { name: "lonely" })).not.toThrow();
    consoleError.mockRestore();
  });
});
