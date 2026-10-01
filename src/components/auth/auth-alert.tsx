import type { ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CloudOff,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AuthAlertVariant = "error" | "system" | "info" | "success";

const STYLES: Record<
  AuthAlertVariant,
  {
    icon: typeof Info;
    box: string;
    role: "alert" | "status";
  }
> = {
  /** Lỗi xác thực từ hệ thống (vd: sai mật khẩu) — nhẹ, không chói. */
  error: {
    icon: AlertCircle,
    box: "border-rose-200 bg-rose-50 text-rose-700",
    role: "alert",
  },
  /** Lỗi hệ thống/mạng — khác bản chất với lỗi xác thực. */
  system: {
    icon: CloudOff,
    box: "border-amber-200 bg-amber-50 text-amber-800",
    role: "alert",
  },
  /** Thông tin trung thực (tính năng chưa kết nối backend). */
  info: {
    icon: Info,
    box: "border-sky-200 bg-sky-50 text-sky-800",
    role: "status",
  },
  success: {
    icon: CheckCircle2,
    box: "border-emerald-200 bg-emerald-50 text-emerald-700",
    role: "status",
  },
};

interface AuthAlertProps {
  variant: AuthAlertVariant;
  children: ReactNode;
  /** Nhãn nút hành động tuỳ chọn (vd: "Thử lại"). */
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * AuthAlert — hộp thông báo đặt phía trên form, phân biệt rõ 4 nhóm:
 * lỗi xác thực / lỗi hệ thống / thông tin / thành công.
 */
export function AuthAlert({
  variant,
  children,
  actionLabel,
  onAction,
  className,
}: AuthAlertProps) {
  const style = STYLES[variant];
  const Icon = style.icon;

  return (
    <div
      role={style.role}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[13px] leading-relaxed",
        style.box,
        className
      )}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 self-center rounded-md text-[13px] font-semibold underline-offset-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/60"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
