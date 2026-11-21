"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconLock, IconMail } from "@/components/v-intern/icons";
import { IconArrowRight } from "@/components/v-intern/icons";
import { VCircleCheck } from "@/components/icons/v-icons";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthField } from "@/components/auth/auth-field";
import { GoogleIcon } from "@/components/auth/google-icon";
import { PasswordField } from "@/components/auth/password-field";
import { Spinner } from "@/components/product/primitives";
import { LiquidButton } from "@/components/animate-ui/buttons/liquid";
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

/** Prefix câu lỗi mà auth-service trả về cho HTTP 403 + ACCOUNT_LOCKED
 *  (src/lib/auth/auth-service.ts) — dấu hiệu duy nhất form có được để vẽ
 *  hộp chú ý kiến bò (sandbox LockedNotice). Không đụng vào auth-service. */
const LOCKED_MESSAGE_PREFIX = "Tài khoản đã bị khóa";

interface LoginFormProps {
  previewState?: LoginFormPreviewState;
}

const hydrationSubscribe = () => () => {};
export function LoginForm({ previewState }: LoginFormProps) {
  const hydrated = useSyncExternalStore(hydrationSubscribe, () => true, () => false);
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
  /* Điền sẵn email từ /register (sandbox: switchTab("login", email)) và ghi
   * chú nhỏ khi vừa đổi mật khẩu xong (/login?password=changed). Đọc query
   * sau mount — SSR an toàn (server render luôn rỗng, không lệch hydrat).
   * Không dùng useSearchParams để không cần Suspense quanh trang tĩnh. */
  const [prefilledEmail, setPrefilledEmail] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  /* Giảm chuyển động — chặn hai nhịp trình diễn (vẽ tick, đợi 560ms). */
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    /* Bọc trong hàm local rồi gọi (pattern auth-glyph-layer: sync()) — đọc
     * query sau mount, SSR an toàn, không lệch hydrat. */
    const applyQuery = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const email = params.get("email");
        if (email && email.trim()) {
          setIdentifier(email.trim());
          setPrefilledEmail(true);
        }
        if (params.get("password") === "changed") setPasswordChanged(true);
      } catch {
        /* URLSearchParams lỗi hiếm — bỏ qua, không chặn form. */
      }
      setReducedMotion(
        Boolean(
          window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches,
        ),
      );
    };
    applyQuery();
  }, []);

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
          const landing = await resolveLoginLanding(result.user);
          /* Sandbox: chờ giữa chừng để dấu tick vẽ mực kịp hoàn tất rồi mới
           * mở sổ tay — thuần trình diễn, không đụng luồng login/landing. */
          if (!reducedMotion) {
            await new Promise((resolve) => setTimeout(resolve, 560));
          }
          router.replace(landing);
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

  /* 403 + ACCOUNT_LOCKED (xem auth-service) → hộp chú ý kiến bò riêng,
     thay cho alert generic — giữ nguyên mọi trạng thái lỗi khác. */
  const isLockedNotice =
    status === "auth-error" && statusMessage.startsWith(LOCKED_MESSAGE_PREFIX);

  return (
    <section aria-label="Đăng nhập tài khoản V-Intern">
      <h1 className="text-page font-bold leading-tight tracking-tight text-foreground">
        Chào mừng trở lại!
      </h1>
      <p className="mt-2 text-body leading-relaxed text-muted-foreground">
        Đăng nhập để tiếp tục hành trình thực tập của bạn.
      </p>

      {/* Sandbox Journey v3: note viết tay sau khi đổi mật khẩu xong — đọc
       * /login?password=changed (luồng thật của change-password.tsx). */}
      {passwordChanged && status !== "success" && (
        <p className="auth-caps-note mt-3 font-hand text-[0.95rem] font-medium text-[var(--success)]">
          mật khẩu đã đổi xong — đăng nhập lại bằng mật khẩu mới nhé ✎
        </p>
      )}
      {prefilledEmail && (
        <p className="auth-caps-note mt-2 font-hand text-[0.95rem] font-medium text-[var(--pencil)]">
          email của bạn đã được điền sẵn — kiểm tra rồi nhập mật khẩu ✎
        </p>
      )}

      {showErrorAlert && !isLockedNotice && (
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
          className={cn(
            "mt-4",
            /* Lắc mực khi có lỗi (sandbox shake-ink) — chỉ áp cho
             * trạng thái lỗi (auth-error / system-error), không áp cho
             * info (not-connected) hay success. Alert unmount khi
             * chuyển sang "submitting" nên mỗi lần lỗi mới animation
             * tự chạy lại. Thuần hiển thị — không đụng logic submit. */
            (status === "auth-error" || status === "system-error") &&
              "animate-shake-ink",
          )}
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

      {/* Hộp chú ý 403 — viền kiến bò quanh (journey.css .ants-border),
         ổ khóa vẽ tay + tiêu đề đậm (sandbox LockedNotice). role="alert"
         cho screen reader; animate-shake-ink lắc một nhịp khi xuất hiện. */}
      {isLockedNotice && (
        <div
          role="alert"
          className="ants-border animate-shake-ink mt-4 flex items-start gap-3 rounded-[10px_12px_10px_12px] bg-[color-mix(in_srgb,var(--danger)_7%,transparent)] p-3.5"
          style={{ "--ants-color": "var(--danger)" } as CSSProperties}
        >
          <IconLock
            size={22}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-[var(--danger)]"
          />
          <div className="min-w-0 text-small leading-snug">
            <p className="font-bold text-[var(--danger)]">Tài khoản đã bị khóa</p>
            <p className="mt-0.5 font-medium text-[var(--ink-soft)]">
              {statusMessage}
            </p>
          </div>
        </div>
      )}

      {googleNotice && status !== "success" && (
        <AuthAlert variant="info" className="mt-4">
          Tính năng đăng nhập bằng Google chưa được kết nối với hệ thống.
        </AuthAlert>
      )}

      <form method="post" onSubmit={handleSubmit} noValidate className="mt-4">
        <div className="space-y-4">
          <AuthField
            id="login-identifier"
            label="Email"
            icon={IconMail}
            type="text"
            name="identifier"
            inputMode="email"
            autoComplete="username"
            placeholder="Nhập email"
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
            className="flex cursor-pointer select-none items-center gap-3 text-body text-foreground"
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
              className="grid size-[18px] shrink-0 place-items-center rounded-[5px] border-[1.5px] border-input bg-card transition-colors peer-checked:border-primary peer-checked:bg-primary peer-hover:border-primary/70 peer-focus-visible:ring-2 peer-focus-visible:ring-ring/40 peer-focus-visible:ring-offset-2"
            >
              <svg
                viewBox="0 0 12 10"
                fill="none"
                className="h-2.5 w-3 text-primary-foreground"
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
            className="shrink-0 whitespace-nowrap rounded-sm text-body font-semibold text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            Quên mật khẩu?
          </Link>
        </div>

        <LiquidButton
          type="submit"
          disabled={!hydrated || isSubmitting}
          delay="0.32s"
          className={cn(
            "auth-cta mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-control bg-primary text-body font-semibold text-primary-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2",
            "disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-80",
            "[--liquid-button-background-color:var(--primary)] [--liquid-button-color:var(--app-primary-800)] hover:text-primary-foreground",
          )}
        >
          {isSubmitting ? (
            <>
              <Spinner />
              Đang đăng nhập...
            </>
          ) : status === "success" ? (
            /* Sandbox: dấu tick vẽ dần bằng keyframe draw-check (journey.css)
             * + dòng "Đăng nhập thành công!". Vẽ nét qua stroke-dasharray /
             * dashoffset trên chính svg (thuộc tính kế thừa xuống path) —
             * không cần thêm class CSS dùng chung. Giảm chuyển động → tĩnh. */
            <>
              <VCircleCheck
                size={19}
                className="text-primary-foreground [stroke-dasharray:60] [stroke-dashoffset:60]"
                style={
                  reducedMotion
                    ? undefined
                    : { animation: "draw-check 560ms 140ms ease-out forwards" }
                }
              />
              Đăng nhập thành công!
            </>
          ) : (
            <>
              Đăng nhập
              <IconArrowRight className="auth-cta-arrow size-4" aria-hidden="true" />
            </>
          )}
        </LiquidButton>

        <div className="mt-5 flex items-center gap-4" aria-hidden="true">
          <span className="auth-divider-line h-0 flex-1 border-t" />
          <span className="text-small text-muted-foreground">Hoặc</span>
          <span className="auth-divider-line h-0 flex-1 border-t" />
        </div>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => {
            clearBoxAlerts();
            setGoogleNotice(true);
          }}
          className="auth-google-btn mt-5 inline-flex h-12 w-full items-center justify-center gap-3 rounded-control border border-border bg-card text-body font-semibold text-foreground transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
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

      <p className="mt-6 text-center text-body text-muted-foreground">
        Chưa có tài khoản?{" "}
        <Link
          href="/register"
          className="rounded-sm font-semibold text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          Đăng ký ngay
        </Link>
      </p>
    </section>
  );
}
