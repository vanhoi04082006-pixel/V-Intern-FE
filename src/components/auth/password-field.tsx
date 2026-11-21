"use client";

import { useState } from "react";
import type { InputHTMLAttributes, KeyboardEvent } from "react";
import { IconAlertTriangle, IconEye, IconEyeOff, IconLock } from "@/components/v-intern/icons";
import { cn } from "@/lib/utils";

interface PasswordFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className"> {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
}

/** Đọc trạng thái Caps Lock từ sự kiện bàn phím (an toàn với môi
 *  trường thiếu getModifierState như một số jsdom cũ). */
function readCapsLock(event: KeyboardEvent<HTMLInputElement>): boolean {
  return typeof event.getModifierState === "function"
    ? event.getModifierState("CapsLock")
    : false;
}

/**
 * PasswordField — input mật khẩu với nút hiện/ẩn:
 * - bàn phím thao tác được (button thật, focus ring đầy đủ)
 * - aria-label tiếng Việt đổi theo trạng thái + aria-pressed
 * - lỗi/hint nối aria-describedby như AuthField
 * - phát hiện Caps Lock (keydown/keyup) và cảnh báo bằng nét viết tay
 *   ngay dưới ô nhập — thuần hiển thị, không đụng logic form
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
  const [capsOn, setCapsOn] = useState(false);
  const {
    onKeyDown,
    onKeyUp,
    onBlur,
    ...restInputProps
  } = inputProps;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [!error && hint ? hintId : null, error ? errorId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className={cn("auth-ink-field", className)}>
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
          {...restInputProps}
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onKeyDown={(event) => {
            setCapsOn(readCapsLock(event));
            onKeyDown?.(event);
          }}
          onKeyUp={(event) => {
            setCapsOn(readCapsLock(event));
            onKeyUp?.(event);
          }}
          onBlur={(event) => {
            setCapsOn(false);
            onBlur?.(event);
          }}
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
          className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-control text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          {visible ? (
            <IconEye className="size-4" aria-hidden="true" />
          ) : (
            <IconEyeOff className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {capsOn ? (
        <p
          role="status"
          className="auth-caps-note mt-1.5 font-hand text-[0.84rem] font-medium text-[var(--warning)]"
        >
          Caps Lock đang bật
        </p>
      ) : null}
      {hint && !error && (
        <p id={hintId} className="auth-field-note mt-2 text-small text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          className="auth-field-note mt-2 flex items-start gap-2 text-small font-medium text-destructive"
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
