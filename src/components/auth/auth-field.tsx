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
        className="mb-1.5 block text-sm font-semibold text-slate-800"
      >
        {label}
      </label>
      <div className="relative">
        <Icon
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-slate-400"
        />
        <input
          {...inputProps}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-12 w-full rounded-[10px] border bg-white pl-11 pr-4 text-[15px] text-slate-900 outline-none transition-colors placeholder:text-slate-400",
            "focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25",
            error
              ? "border-rose-300 focus-visible:border-rose-400 focus-visible:ring-rose-200"
              : "border-slate-200",
            inputProps.disabled && "cursor-not-allowed bg-slate-50"
          )}
        />
      </div>
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-[13px] text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          className="mt-1.5 flex items-start gap-1.5 text-[13px] font-medium text-rose-600"
        >
          <AlertCircle
            aria-hidden="true"
            className="mt-[1px] size-4 shrink-0"
          />
          {error}
        </p>
      )}
    </div>
  );
}
