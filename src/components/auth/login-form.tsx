"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthField } from "@/components/auth/auth-field";
import { GoogleIcon } from "@/components/auth/google-icon";
import { PasswordField } from "@/components/auth/password-field";
import { login } from "@/lib/auth/auth-service";
import { resolveLoginLanding } from "@/lib/auth/landing";
import { errorMessage } from "@/lib/auth/api-client";
import { validateLogin } from "@/lib/auth/validation";
import type { LoginFieldErrors } from "@/lib/auth/validation";
import { cn } from "@/lib/utils";

/**
 * Trạng thái form theo mô hình state rõ ràng (không rải boolean):
 * idle → submitting → success | auth-error | system-error | not-connected
 * | validation-error (lỗi nằm inline ở từng trường).
 */
export type LoginFormStatus =
  | "idle"
  | "submitting"
  | "validation-error"
  | "auth-error"
  | "system-error"
  | "not-connected"
  | "success";

/**
 * Dev-only: cho phép xem trước các trạng thái UI qua prop (page chỉ
 * truyền khi `process.env.NODE_ENV === "development"` và có query
 * `_preview=...`). Production build không bao giờ nhận prop này.
 */
export type LoginFormPreviewState = Extract<
  LoginFormStatus,
  "auth-error" | "system-error" | "not-connected" | "success"
>;

/** Thông báo mẫu cho chế độ preview dev-only. */
const PREVIEW_MESSAGES: Record<LoginFormPreviewState, string> = {
  "auth-error": "Email hoặc mật khẩu không chính xác.",
  "system-error": "Không thể kết nối đến hệ thống. Vui lòng thử lại sau.",
  "not-connected": "Tính năng đăng nhập chưa được kết nối với hệ thống.",
  success: "Đăng nhập thành công.",
};

interface LoginFormProps {
  previewState?: LoginFormPreviewState;
}

export function LoginForm({ previewState }: LoginFormProps) {
  const router = useRouter();
  const pendingLogin = useRef(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<LoginFieldErrors>({});
  const [status, setStatus] = useState<LoginFormStatus>(previewState ?? "idle");
  const [statusMessage, setStatusMessage] = useState(
    previewState ? PREVIEW_MESSAGES[previewState] : "",
  );
  const [googleNotice, setGoogleNotice] = useState(false);

  const isSubmitting = status === "submitting";

  function clearBoxAlerts() {
    setGoogleNotice(false);
    if (
      status === "auth-error" ||
      status === "system-error" ||
      status === "not-connected"
    ) {
      setStatus("idle");
      setStatusMessage("");
    }
  }

  function focusField(id: string) {
    document.getElementById(id)?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingLogin.current) return;

    const fieldErrors = validateLogin({ identifier, password });
    setErrors(fieldErrors);
    const hasErrors = Object.keys(fieldErrors).length > 0;

    if (hasErrors) {
      setStatus("validation-error");
      setStatusMessage("Vui lòng kiểm tra lại các trường đã đánh dấu.");
      setGoogleNotice(false);
      focusField(
        fieldErrors.identifier ? "login-identifier" : "login-password",
      );
      return;
    }

    pendingLogin.current = true;
    setStatus("submitting");
    setStatusMessage("Đang đăng nhập...");
    setGoogleNotice(false);

    try {
      const result = await login({
        identifier: identifier.trim(),
        password,
        remember,
      });

      if (result.ok) {
        setStatus("success");
        setStatusMessage("Đăng nhập thành công.");
        // Đích đến sau đăng nhập theo role (admin → /admin, instructor →
        // /instructor). `replace` để nút Back không quay lại form đã dùng.
        try {
          router.replace(await resolveLoginLanding(result.user));
        } catch (error) {
          setStatus("system-error");
          setStatusMessage(errorMessage(error));
        }
        return;
      }

      setStatus(result.kind);
      setStatusMessage(result.message);
    } finally {
      pendingLogin.current = false;
    }
  }

  const showErrorAlert =
    status === "auth-error" ||
    status === "system-error" ||
    status === "not-connected" ||
    status === "success";

  return (
    <section aria-label="Đăng nhập tài khoản V-Intern">
      <h1 className="text-[28px] font-bold leading-tight tracking-tight text-navy">
        Chào mừng trở lại!
      </h1>
      <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600">
        Đăng nhập để tiếp tục hành trình thực tập của bạn.
      </p>

      {showErrorAlert && (
        <AuthAlert
          variant={
            status === "success"
              ? "success"
              : status === "auth-error"
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
                  focusField("login-identifier");
                }
              : undefined
          }
        >
          {statusMessage}
        </AuthAlert>
      )}

      {googleNotice && status !== "success" && (
        <AuthAlert variant="info" className="mt-4">
          Tính năng đăng nhập bằng Google chưa được kết nối với hệ thống.
        </AuthAlert>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-4">
        <div className="space-y-4">
          <AuthField
            id="login-identifier"
            label="Email hoặc tên đăng nhập"
            icon={Mail}
            type="text"
            name="identifier"
            inputMode="email"
            autoComplete="username"
            placeholder="Nhập email hoặc tên đăng nhập"
            value={identifier}
            error={errors.identifier}
            disabled={isSubmitting}
            onChange={(event) => {
              setIdentifier(event.target.value);
              if (errors.identifier) {
                setErrors((prev) => ({ ...prev, identifier: undefined }));
              }
            }}
          />

          <PasswordField
            id="login-password"
            label="Mật khẩu"
            name="password"
            autoComplete="current-password"
            placeholder="Nhập mật khẩu"
            value={password}
            error={errors.password}
            disabled={isSubmitting}
            onChange={(event) => {
              setPassword(event.target.value);
              if (errors.password) {
                setErrors((prev) => ({ ...prev, password: undefined }));
              }
            }}
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <label
            htmlFor="login-remember"
            className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-slate-700"
          >
            <input
              id="login-remember"
              name="remember"
              type="checkbox"
              checked={remember}
              disabled={isSubmitting}
              onChange={(event) => setRemember(event.target.checked)}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className="grid size-[18px] shrink-0 place-items-center rounded-[5px] border border-slate-300 bg-white transition-colors peer-checked:border-brand peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40 peer-focus-visible:ring-offset-2"
            >
              <svg
                viewBox="0 0 12 10"
                fill="none"
                className="h-2.5 w-3 text-white"
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
            Ghi nhớ đăng nhập
          </label>

          <Link
            href="/forgot-password"
            className="rounded-sm text-sm font-semibold text-brand underline-offset-2 transition-colors hover:text-[#0A57CB] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            Quên mật khẩu?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-brand text-[15px] font-semibold text-white transition-colors",
            "hover:bg-[#0A57CB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-80",
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2
                className="size-[18px] animate-spin"
                aria-hidden="true"
              />
              Đang đăng nhập...
            </>
          ) : (
            <>
              Đăng nhập
              <ArrowRight className="size-[18px]" aria-hidden="true" />
            </>
          )}
        </button>

        <div className="mt-4 flex items-center gap-4" aria-hidden="true">
          <span className="h-px flex-1 bg-[#E8EDF3]" />
          <span className="text-[13px] text-slate-500">Hoặc</span>
          <span className="h-px flex-1 bg-[#E8EDF3]" />
        </div>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => {
            clearBoxAlerts();
            setGoogleNotice(true);
          }}
          className="mt-4 inline-flex h-12 w-full items-center justify-center gap-3 rounded-[10px] border border-[#DDE3ED] bg-white text-[15px] font-semibold text-slate-800 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <GoogleIcon />
          Tiếp tục với Google
        </button>

        {/* Vùng thông báo cho screen reader khi trạng thái đổi */}
        <p aria-live="polite" className="sr-only">
          {status === "submitting"
            ? "Đang đăng nhập..."
            : status === "validation-error"
              ? "Vui lòng kiểm tra lại thông tin đã nhập."
              : statusMessage}
        </p>
      </form>

      <p className="mt-5 text-center text-sm text-slate-600">
        Chưa có tài khoản?{" "}
        <Link
          href="/register"
          className="rounded-sm font-semibold text-brand underline-offset-2 transition-colors hover:text-[#0A57CB] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          Đăng ký ngay
        </Link>
      </p>
    </section>
  );
}
