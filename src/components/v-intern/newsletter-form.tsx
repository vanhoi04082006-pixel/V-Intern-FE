"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { CheckCircle2, Info, Loader2, Mail } from "lucide-react";

/**
 * Backend integration hiện chưa có API contract.
 *
 * - Khi `NEXT_PUBLIC_API_BASE_URL` chưa được cấu hình (mặc định), form vẫn
 *   validate client-side nhưng hiển thị trạng thái trung thực "chưa kết nối",
 *   KHÔNG giả vờ submit thành công.
 * - Khi backend ra mắt, chỉ cần set biến môi trường; form sẽ POST tới
 *   `${NEXT_PUBLIC_API_BASE_URL}/api/newsletter` (path có thể chỉnh lại theo
 *   API contract thật).
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const UNAVAILABLE_MESSAGE =
  "Đăng ký bản tin chưa được kết nối với hệ thống. Tính năng sẽ khả dụng khi backend chính thức ra mắt.";

type Status = "idle" | "loading" | "error" | "unavailable" | "success";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function submitNewsletter(
  email: string
): Promise<{ ok: boolean; unavailable: boolean }> {
  if (!API_BASE_URL) {
    return { ok: false, unavailable: true };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/newsletter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return { ok: response.ok, unavailable: false };
  } catch {
    return { ok: false, unavailable: false };
  }
}

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim();

    if (!value || !EMAIL_PATTERN.test(value)) {
      setStatus("error");
      return;
    }

    setStatus("loading");
    const result = await submitNewsletter(value);

    if (result.unavailable) {
      setStatus("unavailable");
      return;
    }

    if (result.ok) {
      setStatus("success");
      setEmail("");
      return;
    }

    setStatus("error");
  }

  const isBlocked = status === "unavailable" || status === "success";

  return (
    <div>
      {isBlocked ? (
        <div className="mt-3.5">
          {status === "success" ? (
            <p
              role="status"
              className="flex items-start gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3.5 py-3 text-xs leading-relaxed text-emerald-300"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Đăng ký thành công! Bản tin V-Intern sẽ được gửi tới hộp thư của bạn.
            </p>
          ) : (
            <p className="flex items-start gap-2 rounded-lg border border-sky-400/25 bg-sky-400/10 px-3.5 py-3 text-xs leading-relaxed text-sky-200">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {UNAVAILABLE_MESSAGE}
            </p>
          )}
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="mt-2 rounded text-xs font-medium text-slate-400 underline-offset-2 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            {status === "success" ? "Đăng ký email khác" : "Thử lại"}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-3.5">
          <div className="flex">
            <div className="relative min-w-0 flex-1">
              <Mail
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <label htmlFor="footer-newsletter-email" className="sr-only">
                Email của bạn
              </label>
              <input
                id="footer-newsletter-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Email của bạn"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (status === "error") setStatus("idle");
                }}
                aria-invalid={status === "error"}
                aria-describedby="footer-newsletter-feedback"
                className={`h-11 w-full rounded-l-lg border bg-white/[0.06] pl-10 pr-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:bg-white/[0.09] ${
                  status === "error"
                    ? "border-rose-500/70 focus:ring-2 focus:ring-rose-500/40"
                    : "border-white/10 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/30"
                }`}
              />
            </div>
            <button
              type="submit"
              disabled={status === "loading"}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-r-lg border border-l-0 border-blue-500/70 bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-navy disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span className="sr-only">Đang xử lý</span>
                </>
              ) : (
                "Đăng ký"
              )}
            </button>
          </div>
          <p
            id="footer-newsletter-feedback"
            role={status === "error" ? "alert" : undefined}
            aria-live="polite"
            className="mt-2 min-h-4 text-xs leading-relaxed text-rose-400"
          >
            {status === "error"
              ? "Email chưa hợp lệ, vui lòng kiểm tra lại."
              : ""}
          </p>
        </form>
      )}
    </div>
  );
}
