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
        className="inline-flex items-center gap-1.5 rounded-sm text-sm font-semibold text-slate-500 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Quay lại đăng nhập
      </Link>

      <h1 className="mt-5 text-[28px] font-bold leading-tight tracking-tight text-navy">
        Quên mật khẩu?
      </h1>
      <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600">
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
          className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-brand text-[15px] font-semibold text-white transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-80"
        >
          {isSubmitting ? (
            <>
              <Loader2
                className="size-[18px] animate-spin"
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
