"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
  IconInfo,
} from "@/components/v-intern/icons";
import { Spinner, btn } from "@/components/product/primitives";
import { cn } from "@/lib/utils";

/* =====================================================================
 * TOAST — "Mẩu giấy nhớ trên mặt bàn"
 * Phản hồi tạm thời cho thao tác (Section 8 của master brief): thành công,
 * lỗi hệ thống, cảnh báo, thông tin, tiến độ — và các trường hợp nghiệp vụ
 * đặc thù (hết phiên, mất mạng, không quyền) qua preset dưới file.
 *
 * Nguyên tắc trung thực (giữ nguyên tinh thần repo):
 * - Toast success CHỈ hiện khi BE trả về thật sự thành công — caller quyết,
 *   toast không tự giả kết quả.
 * - Error toast mô tả đúng ApiError đã được errorMessage() dịch.
 * - Không toast khi loading xong page (đó là việc của Skeleton).
 *
 * Accessibility:
 * - success/info/progress: role="status" (polite) — người dùng đang thao tác
 *   không bị gián đoạn.
 * - error/warning: role="alert" (assertive) — cần được đọc ngay.
 * - Nút Đóng mỗi toast; Escape đóng toast đang focus.
 * - prefers-reduced-motion: nb-toast-in/out tự tắt (motion.css).
 * ===================================================================== */

export type ToastTone = "success" | "info" | "warning" | "error" | "progress";

export interface ToastContent {
  /** Dòng chính. Bắt buộc với mọi toast để người dùng không phải đoán. */
  title: string;
  /** Chi tiết tùy chọn: kết quả đếm, mã lỗi, bước tiếp theo. */
  description?: ReactNode;
  /** ms tự đóng. 0 = giữ đến khi người dùng đóng. */
  duration?: number;
  /** Một hành động nhỏ (VD: "Xem", "Thử lại") — không dùng thay confirm. */
  action?: { label: string; run: () => void };
}

interface ToastRecord extends ToastContent {
  id: number;
  tone: ToastTone;
  closing?: boolean;
}

/** Handle của toast tiến độ: kết thúc bằng done()/fail() để đổi trạng thái. */
export interface ToastProgressHandle {
  done(content: ToastContent): void;
  fail(content: ToastContent): void;
}

export interface ToastApi {
  /** Trả về id toast để caller có thể dismiss khi bắt đầu thao tác mới. */
  success(content: ToastContent): number;
  info(content: ToastContent): number;
  warning(content: ToastContent): number;
  error(content: ToastContent): number;
  /** Toast "đang chạy" (spinner) — sticky đến khi gọi done/fail. */
  progress(label: string): ToastProgressHandle;
  /** Đóng sớm một toast (dùng cho action "Đóng"/"Đăng nhập lại"). */
  dismiss(id: number): void;
  permissionDenied(): void;
  sessionExpired(): void;
  networkFailure(): void;
}

/** Thời lượng mặc định theo tone: lỗi đọc chậm hơn thành công để kịp xử lý. */
const DEFAULT_DURATION: Record<ToastTone, number> = {
  success: 4500,
  info: 4500,
  warning: 6500,
  error: 8000,
  progress: 0, // sticky: chỉ done/fail hoặc người dùng đóng
};

const MAX_STACK = 4;

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const seq = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((current) =>
      current.map((t) => (t.id === id ? { ...t, closing: true } : t)),
    );
    // Thời gian animation rời khung; reduced-motion thì CSS đã tắt animation
    // nhưng vẫn cần timeout để xoá hẳn khỏi DOM (không để vùng aria lớn dần).
    window.setTimeout(
      () => setToasts((current) => current.filter((t) => t.id !== id)),
      200,
    );
  }, []);

  const push = useCallback((tone: ToastTone, content: ToastContent) => {
    const id = ++seq.current;
    setToasts((current) => {
      const next = [...current, { ...content, id, tone }];
      // Trần 4 toast: toast cũ nhất rời ngay để stack không phình.
      return next.length > MAX_STACK ? next.slice(next.length - MAX_STACK) : next;
    });
    return id;
  }, []);

  const api = useMemo<ToastApi>(() => {
    const byTone =
      (tone: ToastTone) =>
      (content: ToastContent): number =>
        push(tone, content);
    return {
      success: byTone("success"),
      info: byTone("info"),
      warning: byTone("warning"),
      error: byTone("error"),
      progress(label: string): ToastProgressHandle {
        const id = push("progress", { title: label });
        return {
          done(content: ToastContent): void {
            setToasts((current) =>
              current.map((t) =>
                t.id === id ? { ...content, id, tone: "success" } : t,
              ),
            );
          },
          fail(content: ToastContent): void {
            setToasts((current) =>
              current.map((t) =>
                t.id === id ? { ...content, id, tone: "error" } : t,
              ),
            );
          },
        };
      },
      dismiss: remove,
      permissionDenied(): void {
        push("warning", {
          title: "Không có quyền thực hiện thao tác này",
          description:
            "Tài khoản của bạn chưa được cấp quyền. Liên hệ quản trị viên nếu cần thêm quyền.",
        });
      },
      sessionExpired(): void {
        push("warning", {
          title: "Phiên đăng nhập đã hết hạn",
          description: "Đăng nhập lại để tiếp tục công việc đang làm.",
        });
      },
      networkFailure(): void {
        push("error", {
          title: "Không thể kết nối đến hệ thống",
          description:
            "Kiểm tra kết nối mạng rồi thử lại; dữ liệu chưa gửi sẽ không bị mất.",
        });
      },
    };
  }, [push, remove]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Vùng stacking: pointer-events-none để không chặn trang bên dưới;
          từng toast tự nhận pointer-events-auto. */}
      <div
        aria-label="Thông báo hệ thống"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[70] flex w-auto flex-col gap-2 sm:inset-x-auto sm:right-4 sm:w-96"
      >
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onExpire={() => remove(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Không có Provider (VD: test render lẻ component) → no-op an toàn, không vỡ UI. */
export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  // Trả về stub ổn định để caller không phải null-check ở từng call site.
  return api ?? noopApi;
}

const noopApi: ToastApi = {
  success: () => 0,
  info: () => 0,
  warning: () => 0,
  error: () => 0,
  progress: () => ({ done: () => undefined, fail: () => undefined }),
  dismiss: () => undefined,
  permissionDenied: () => undefined,
  sessionExpired: () => undefined,
  networkFailure: () => undefined,
};

const toneStyle: Record<
  ToastTone,
  { chip: string; icon: typeof IconInfo; role: "status" | "alert" }
> = {
  success: {
    chip: "bg-success-subtle text-success",
    icon: IconCircleCheck,
    role: "status",
  },
  info: { chip: "bg-accent text-primary", icon: IconInfo, role: "status" },
  warning: {
    chip: "bg-warning-subtle text-warning",
    icon: IconAlertTriangle,
    role: "alert",
  },
  error: {
    chip: "bg-destructive-subtle text-destructive",
    icon: IconCircleX,
    role: "alert",
  },
  progress: { chip: "bg-accent text-primary", icon: IconInfo, role: "status" },
};

function ToastItem({
  toast,
  onExpire,
}: {
  toast: ToastRecord;
  onExpire: () => void;
}) {
  const conf = toneStyle[toast.tone];
  const Icon = conf.icon;
  const duration = toast.duration ?? DEFAULT_DURATION[toast.tone];
  const [paused, setPaused] = useState(false);
  // remaining tính bằng ms còn lại; mốc startedAt chỉ ghi trong effect (không
  // gọi Date.now() lúc render — react-hooks/purity).
  const remaining = useRef(duration);
  const startedAt = useRef(0);

  // Đồng hồ tự đóng: pause khi hover/focus (người dùng đang đọc); sticky
  // (duration 0) và toast đang rời khung thì không chạy. Cleanup trừ đúng
  // thời gian chạy thật — thời gian pause không bị trừ vào remaining.
  useEffect(() => {
    if (duration === 0 || toast.closing || paused) return;
    startedAt.current = Date.now();
    const timer = window.setTimeout(onExpire, remaining.current);
    return () => {
      window.clearTimeout(timer);
      if (startedAt.current) {
        remaining.current = Math.max(
          0,
          remaining.current - (Date.now() - startedAt.current),
        );
        startedAt.current = 0;
      }
    };
  }, [duration, paused, toast.closing, onExpire]);

  const Pause = {
    onMouseEnter: () => setPaused(true),
    onMouseLeave: () => setPaused(false),
    onFocus: () => setPaused(true),
    onBlur: () => setPaused(false),
  };

  return (
    <article
      {...Pause}
      role={conf.role}
      onKeyDown={(event) => {
        if (event.key === "Escape") onExpire();
      }}
      className={cn(
        "nb-toast-in pointer-events-auto relative flex items-start gap-3 rounded-panel border border-border bg-card p-4 pr-10 shadow-popover",
        toast.closing && "nb-toast-out",
      )}
    >
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-control",
          conf.chip,
        )}
      >
        {toast.tone === "progress" ? (
          <Spinner className="size-4" />
        ) : (
          <Icon size={17} aria-hidden="true" />
        )}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-body font-semibold leading-6 text-foreground">
          {toast.title}
        </p>
        {toast.description && (
          <div className="mt-0.5 text-small leading-5 text-muted-foreground">
            {toast.description}
          </div>
        )}
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action?.run();
              onExpire();
            }}
            className={cn(btn("secondary", "sm"), "mt-3")}
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        aria-label="Đóng thông báo"
        onClick={onExpire}
        className="absolute right-2 top-2 grid size-7 place-items-center rounded-control text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <IconXSmall />
      </button>
    </article>
  );
}

function IconXSmall() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 6 C 11.5 11.5, 12.5 12.5, 18 18" />
      <path d="M18 6 C 12.5 11.5, 11.5 12.5, 6 18" />
    </svg>
  );
}
