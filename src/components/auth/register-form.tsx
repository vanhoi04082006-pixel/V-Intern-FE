"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
  User,
} from "lucide-react";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthField } from "@/components/auth/auth-field";
import { GoogleIcon } from "@/components/auth/google-icon";
import { PasswordField } from "@/components/auth/password-field";
import { register } from "@/lib/auth/auth-service";
import { PASSWORD_MIN_LENGTH, validateRegister } from "@/lib/auth/validation";
import type { RegisterFieldErrors } from "@/lib/auth/validation";
import { cn } from "@/lib/utils";

export type RegisterFormStatus =
  | "idle"
  | "submitting"
  | "validation-error"
  | "auth-error"
  | "system-error"
  | "not-connected"
  | "success";

export type RegisterFormPreviewState = Extract<
  RegisterFormStatus,
  "auth-error" | "system-error" | "not-connected" | "success"
>;

/** Thông báo mẫu cho chế độ preview dev-only. */
const PREVIEW_MESSAGES: Record<RegisterFormPreviewState, string> = {
  "auth-error": "Email này đã được sử dụng.",
  "system-error": "Không thể kết nối đến hệ thống. Vui lòng thử lại sau.",
  "not-connected": "Tính năng đăng ký chưa được kết nối với hệ thống.",
  success: "Đăng ký thành công.",
};

interface RegisterFormProps {
  previewState?: RegisterFormPreviewState;
}

export function RegisterForm({ previewState }: RegisterFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<RegisterFieldErrors>({});
  const [status, setStatus] = useState<RegisterFormStatus>(
    previewState ?? "idle"
  );
  const [statusMessage, setStatusMessage] = useState(
    previewState ? PREVIEW_MESSAGES[previewState] : ""
  );
  const [googleNotice, setGoogleNotice] = useState(false);

  const isSubmitting = status === "submitting";

  function focusFirstInvalid(errors: RegisterFieldErrors) {
    const order: Array<[keyof RegisterFieldErrors, string]> = [
      ["fullName", "register-full-name"],
      ["email", "register-email"],
      ["password", "register-password"],
      ["confirmPassword", "register-confirm"],
      ["terms", "register-terms"],
    ];
    const first = order.find(([key]) => errors[key]);
    if (first) document.getElementById(first[1])?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const fieldErrors = validateRegister({
      fullName,
      email,
      password,
      confirmPassword,
      terms,
    });
    setErrors(fieldErrors);

    if (Object.keys(fieldErrors).length > 0) {
      setStatus("validation-error");
      setStatusMessage("Vui lòng kiểm tra lại các trường đã đánh dấu.");
      setGoogleNotice(false);
      focusFirstInvalid(fieldErrors);
      return;
    }

    setStatus("submitting");
    setStatusMessage("Đang đăng ký...");
    setGoogleNotice(false);

    const result = await register({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      acceptedTerms: terms,
    });

    if (result.ok) {
      // Signup does not grant a session; the user logs in explicitly.
      setStatus("success");
      setStatusMessage("Đăng ký thành công.");
      return;
    }

    setStatus(result.kind);
    setStatusMessage(result.message);
  }

  if (status === "success") {
    return (
      <section
        aria-label="Đăng ký thành công"
        className="flex flex-col items-center py-6 text-center sm:py-8"
      >
        <div className="grid size-14 place-items-center rounded-full bg-success-subtle ring-1 ring-success/20">
          <CheckCircle2
            className="size-7 text-success"
            aria-hidden="true"
          />
        </div>
        <h1 className="mt-5 text-section font-bold tracking-tight text-foreground">
          Đăng ký thành công
        </h1>
        <p className="mt-2 text-body leading-relaxed text-muted-foreground">
          Tài khoản của bạn đã được tạo. Hãy đăng nhập để bắt đầu hành trình
          thực tập.
        </p>
        <Link
          href="/login"
          className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-control bg-primary text-body font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2"
        >
          Đăng nhập ngay
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
        <p aria-live="polite" className="sr-only">
          Đăng ký thành công.
        </p>
      </section>
    );
  }

  const showErrorAlert =
    status === "auth-error" ||
    status === "system-error" ||
    status === "not-connected";

  return (
    <section aria-label="Đăng ký tài khoản V-Intern">
      <h1 className="text-page font-bold leading-tight tracking-tight text-foreground">
        Tạo tài khoản mới
      </h1>
      <p className="mt-2 text-body leading-relaxed text-muted-foreground">
        Bắt đầu hành trình thực tập của bạn ngay hôm nay.
      </p>

      {showErrorAlert && (
        <AuthAlert
          variant={
            status === "auth-error"
              ? "error"
              : status === "system-error"
                ? "system"
                : "info"
          }
          className="mt-4"
          actionLabel={status === "system-error" ? "Thử lại" : undefined}
          onAction={
            status === "system-error"
              ? () => {
                  setStatus("idle");
                  setStatusMessage("");
                  document
                    .getElementById("register-full-name")
                    ?.focus();
                }
              : undefined
          }
        >
          {statusMessage}
        </AuthAlert>
      )}

      {googleNotice && (
        <AuthAlert variant="info" className="mt-4">
          Tính năng đăng ký bằng Google chưa được kết nối với hệ thống.
        </AuthAlert>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-4">
        <div className="grid gap-x-3 gap-y-4 sm:grid-cols-2">
          <AuthField
            id="register-full-name"
            label="Họ và tên"
            icon={User}
            type="text"
            name="name"
            autoComplete="name"
            placeholder="Nhập họ và tên"
            value={fullName}
            error={errors.fullName}
            disabled={isSubmitting}
            onChange={(event) => {
              setFullName(event.target.value);
              if (errors.fullName) {
                setErrors((prev) => ({ ...prev, fullName: undefined }));
              }
            }}
          />

          <AuthField
            id="register-email"
            label="Email"
            icon={Mail}
            type="email"
            name="email"
            autoComplete="email"
            placeholder="Nhập email"
            value={email}
            error={errors.email}
            disabled={isSubmitting}
            onChange={(event) => {
              setEmail(event.target.value);
              if (errors.email) {
                setErrors((prev) => ({ ...prev, email: undefined }));
              }
            }}
          />

          <PasswordField
            id="register-password"
            label="Mật khẩu"
            name="password"
            autoComplete="new-password"
            placeholder="Nhập mật khẩu"
            value={password}
            error={errors.password}
            hint={`Tối thiểu ${PASSWORD_MIN_LENGTH} ký tự.`}
            disabled={isSubmitting}
            onChange={(event) => {
              setPassword(event.target.value);
              if (errors.password) {
                setErrors((prev) => ({ ...prev, password: undefined }));
              }
            }}
          />

          <PasswordField
            id="register-confirm"
            label="Xác nhận mật khẩu"
            name="confirm-password"
            autoComplete="new-password"
            placeholder="Nhập lại mật khẩu"
            value={confirmPassword}
            error={errors.confirmPassword}
            disabled={isSubmitting}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              if (errors.confirmPassword) {
                setErrors((prev) => ({
                  ...prev,
                  confirmPassword: undefined,
                }));
              }
            }}
          />
        </div>

        <div className="mt-4">
          <label
            htmlFor="register-terms"
            className="flex cursor-pointer select-none items-start gap-3 text-body leading-relaxed text-foreground"
          >
            <input
              id="register-terms"
              name="terms"
              type="checkbox"
              checked={terms}
              disabled={isSubmitting}
              onChange={(event) => {
                setTerms(event.target.checked);
                if (errors.terms) {
                  setErrors((prev) => ({ ...prev, terms: undefined }));
                }
              }}
              aria-invalid={errors.terms ? true : undefined}
              aria-describedby={errors.terms ? "register-terms-error" : undefined}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className={cn(
                "mt-0.5 grid size-4 shrink-0 place-items-center rounded-sm border transition-colors",
                "peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring/40 peer-focus-visible:ring-offset-2",
                errors.terms ? "border-destructive/30" : "border-input"
              )}
            >
              <svg
                viewBox="0 0 12 10"
                fill="none"
                className={cn(
                  "h-2.5 w-3",
                  terms ? "text-primary-foreground" : "text-transparent"
                )}
              >
                <path
                  d="M1 5.2 4.2 8.4 11 1.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span>
              Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật của{" "}
              <span className="whitespace-nowrap">V-Intern</span>.
            </span>
          </label>
          {errors.terms && (
            <p
              id="register-terms-error"
              className="mt-2 text-small font-medium text-destructive"
            >
              {errors.terms}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-control bg-primary text-body font-semibold text-primary-foreground transition-colors",
            "hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-80"
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2
                className="size-4 animate-spin"
                aria-hidden="true"
              />
              Đang đăng ký...
            </>
          ) : (
            <>
              Đăng ký
              <ArrowRight className="size-4" aria-hidden="true" />
            </>
          )}
        </button>

        <div className="mt-4 flex items-center gap-4" aria-hidden="true">
          <span className="h-px flex-1 bg-secondary" />
          <span className="text-small text-muted-foreground">Hoặc</span>
          <span className="h-px flex-1 bg-secondary" />
        </div>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => {
            setGoogleNotice((value) => !value);
            if (
              status === "auth-error" ||
              status === "system-error" ||
              status === "not-connected"
            ) {
              setStatus("idle");
              setStatusMessage("");
            }
          }}
          className="mt-4 inline-flex h-12 w-full items-center justify-center gap-3 rounded-control border border-border bg-card text-body font-semibold text-foreground transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <GoogleIcon />
          Tiếp tục với Google
        </button>

        <p aria-live="polite" className="sr-only">
          {status === "submitting"
            ? "Đang đăng ký..."
            : status === "validation-error"
              ? "Vui lòng kiểm tra lại thông tin đã nhập."
              : statusMessage}
        </p>
      </form>

      <p className="mt-5 text-center text-body text-muted-foreground">
        Đã có tài khoản?{" "}
        <Link
          href="/login"
          className="rounded-sm font-semibold text-primary underline-offset-2 transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          Đăng nhập
        </Link>
      </p>
    </section>
  );
}
