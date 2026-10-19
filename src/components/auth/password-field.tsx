"use client";

import { useState } from "react";
import type { InputHTMLAttributes } from "react";
import { AlertCircle, Eye, EyeOff, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className"> {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
}

/**
 * PasswordField — input mật khẩu với nút hiện/ẩn:
 * - bàn phím thao tác được (button thật, focus ring đầy đủ)
 * - aria-label tiếng Việt đổi theo trạng thái + aria-pressed
 * - lỗi/hint nối aria-describedby như AuthField
 */
export function PasswordField({
  id,
  label,
  error,
  hint,
  className,
  ...inputProps
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
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
        <Lock
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-slate-400"
        />
        <input
          {...inputProps}
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-12 w-full rounded-[10px] border bg-white pl-11 pr-12 text-[15px] text-slate-900 outline-none transition-colors placeholder:text-slate-400",
            "focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25",
            error
              ? "border-rose-300 focus-visible:border-rose-400 focus-visible:ring-rose-200"
              : "border-slate-200",
            inputProps.disabled && "cursor-not-allowed bg-slate-50"
          )}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          aria-pressed={visible}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          {visible ? (
            <EyeOff className="size-[18px]" aria-hidden="true" />
          ) : (
            <Eye className="size-[18px]" aria-hidden="true" />
          )}
        </button>
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
