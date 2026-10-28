import type { InputHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Thông báo lỗi (tiếng Việt) — hiển thị inline ngay dưới input. */
  error?: string;
  /** Gợi ý tĩnh (vd: yêu cầu mật khẩu) — ẩn khi đang có lỗi. */
  hint?: string;
  className?: string;
}

/**
 * AuthField — input có label thật (htmlFor), icon đứng đầu, trạng thái
 * lỗi inline kết nối aria-invalid + aria-describedby. Không dùng màu
 * làm tín hiệu duy nhất: lỗi luôn kèm icon + chữ.
 */
export function AuthField({
  id,
  label,
  icon: Icon,
  error,
  hint,
  className,
  ...inputProps
}: AuthFieldProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [!error && hint ? hintId : null, error ? errorId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-2 block text-body font-semibold text-foreground"
      >
        {label}
      </label>
      <div className="relative">
        <Icon
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          {...inputProps}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-12 w-full rounded-control border bg-card pl-11 pr-4 text-body text-foreground outline-none transition-colors placeholder:text-muted-foreground",
            "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/25",
            error
              ? "border-destructive/30 focus-visible:border-destructive/40 focus-visible:ring-destructive/20"
              : "border-border",
            inputProps.disabled && "cursor-not-allowed bg-muted/50"
          )}
        />
      </div>
      {hint && !error && (
        <p id={hintId} className="mt-2 text-small text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          className="mt-2 flex items-start gap-2 text-small font-medium text-destructive"
        >
          <AlertCircle
            aria-hidden="true"
            className="mt-1 size-4 shrink-0"
          />
          {error}
        </p>
      )}
    </div>
  );
}
