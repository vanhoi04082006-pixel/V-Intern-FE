import type { ReactNode } from "react";
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleDashed,
  IconInfo,
  type IconComponent,
} from "@/components/v-intern/icons";
import { cn } from "@/lib/utils";

export type AuthAlertVariant = "error" | "system" | "info" | "success";

const STYLES: Record<
  AuthAlertVariant,
  {
    icon: IconComponent;
    box: string;
    role: "alert" | "status";
  }
> = {
  /** Lỗi xác thực từ hệ thống (vd: sai mật khẩu) — nhẹ, không chói. */
  error: {
    icon: IconAlertTriangle,
    box: "border-destructive/20 bg-destructive-subtle text-destructive",
    role: "alert",
  },
  /** Lỗi hệ thống/mạng — khác bản chất với lỗi xác thực. */
  system: {
    icon: IconCircleDashed,
    box: "border-warning/20 bg-warning-subtle text-warning",
    role: "alert",
  },
  /** Thông tin trung thực (tính năng chưa kết nối backend). */
  info: {
    icon: IconInfo,
    box: "border-primary/20 bg-info-subtle text-info",
    role: "status",
  },
  success: {
    icon: IconCircleCheck,
    box: "border-success/20 bg-success-subtle text-success",
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
        "flex items-start gap-3 rounded-panel border px-4 py-3 text-small leading-relaxed",
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
          className="shrink-0 self-center rounded-md text-small font-semibold underline-offset-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/60"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
