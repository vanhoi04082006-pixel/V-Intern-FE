"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthField } from "@/components/auth/auth-field";
import { requestPasswordReset } from "@/lib/auth/auth-service";
import { validateEmail } from "@/lib/auth/validation";

type ForgotStatus =
  | "idle"
  | "submitting"
  | "validation-error"
  | "not-connected";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [status, setStatus] = useState<ForgotStatus>("idle");

  const isSubmitting = status === "submitting";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const fieldError = validateEmail(email);
    setError(fieldError);

    if (fieldError) {
      setStatus("validation-error");
      document.getElementById("forgot-email")?.focus();
      return;
    }

    setStatus("submitting");
    const result = await requestPasswordReset(email.trim());

    if (result.ok) {
      // Không bao giờ xảy ra với adapter hiện tại — giữ để đồng bộ
      // logic khi backend thật ra mắt.
      setStatus("idle");
      return;
    }

    setStatus(result.kind === "not-connected" ? "not-connected" : "not-connected");
    setError(undefined);
  }

  return (
    <section aria-label="Quên mật khẩu">
      <Link
        href="/login"
        className="inline-flex items-center gap-2 rounded-sm text-body font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Quay lại đăng nhập
      </Link>

      <h1 className="mt-5 text-page font-bold leading-tight tracking-tight text-foreground">
        Quên mật khẩu?
      </h1>
      <p className="mt-2 text-body leading-relaxed text-muted-foreground">
        Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu.
      </p>

      {status === "not-connected" && (
        <AuthAlert variant="info" className="mt-4">
          Tính năng đặt lại mật khẩu chưa được kết nối với hệ thống. Vui lòng
          thử lại sau.
        </AuthAlert>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-4">
        <AuthField
          id="forgot-email"
          label="Email"
          icon={Mail}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="Nhập email của bạn"
          value={email}
          error={error}
          disabled={isSubmitting}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) setError(undefined);
          }}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-control bg-primary text-body font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-80"
        >
          {isSubmitting ? (
            <>
              <Loader2
                className="size-4 animate-spin"
                aria-hidden="true"
              />
              Đang gửi...
            </>
          ) : (
            "Gửi liên kết đặt lại"
          )}
        </button>

        <p aria-live="polite" className="sr-only">
          {status === "submitting"
            ? "Đang gửi..."
            : status === "validation-error"
              ? "Vui lòng kiểm tra lại thông tin đã nhập."
              : ""}
        </p>
      </form>
    </section>
  );
}
