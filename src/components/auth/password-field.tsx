"use client";

import { useState } from "react";
import type { InputHTMLAttributes } from "react";
import { EyeOff } from "lucide-react";
import { IconAlertTriangle, IconEye, IconLock } from "@/components/v-intern/icons";
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
        className="mb-2 block text-body font-semibold text-foreground"
      >
        {label}
      </label>
      <div className="relative">
        <IconLock
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          {...inputProps}
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-12 w-full rounded-control border bg-card pl-11 pr-12 text-body text-foreground outline-none transition-colors placeholder:text-muted-foreground",
            "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/25",
            error
              ? "border-destructive/30 focus-visible:border-destructive/40 focus-visible:ring-destructive/20"
              : "border-border",
            inputProps.disabled && "cursor-not-allowed bg-muted/50"
          )}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          aria-pressed={visible}
          className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-control text-muted-foreground transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          {visible ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <IconEye className="size-4" aria-hidden="true" />
          )}
        </button>
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
          <IconAlertTriangle
            aria-hidden="true"
            className="mt-1 size-4 shrink-0"
          />
          {error}
        </p>
      )}
    </div>
  );
}
