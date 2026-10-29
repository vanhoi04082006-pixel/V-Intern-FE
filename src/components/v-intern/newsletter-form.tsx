"use client";

import { useState, type FormEvent } from "react";
import { Info, Mail } from "lucide-react";

/**
 * Form bản tin — validate email phía client.
 * Chưa có contract newsletter với backend: sau khi email hợp lệ,
 * hiển thị thông báo "chưa kết nối" thay vì gửi tới endpoint giả.
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "invalid" | "unavailable">("idle");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState(
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
        ? "unavailable"
        : "invalid",
    );
  }

  return state === "unavailable" ? (
    <div className="mt-4">
      <p className="flex items-start gap-2 rounded-lg border-2 border-dashed border-royal/50 bg-royal/15 px-3.5 py-3 text-xs leading-relaxed text-[#a3b9ff]">
        <Info size={16} className="shrink-0" aria-hidden="true" />
        Đăng ký bản tin chưa được kết nối với hệ thống. Tính năng sẽ khả dụng
        khi backend chính thức ra mắt.
      </p>
      <button
        type="button"
        onClick={() => setState("idle")}
        className="mt-2 text-xs font-semibold text-chalk-soft underline decoration-dotted underline-offset-4 transition-colors hover:text-[#7d97ff]"
      >
        Thử lại
      </button>
    </div>
  ) : (
    <form onSubmit={submit} noValidate className="mt-4">
      <div className="flex">
        <div className="relative min-w-0 flex-1">
          <Mail
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-chalk/50"
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
            onChange={(e) => {
              setEmail(e.target.value);
              setState("idle");
            }}
            aria-invalid={state === "invalid"}
            aria-describedby="footer-newsletter-feedback"
            className="h-11 w-full rounded-l-xl border-2 border-chalk/25 bg-chalk/10 pl-10 pr-3 text-sm text-chalk outline-none transition-colors placeholder:text-chalk/40 focus:border-[#7d97ff]"
          />
        </div>
        <button
          type="submit"
          className="rounded-r-xl border-2 border-royal bg-royal px-4 text-sm font-bold text-white transition-all hover:bg-royal-deep"
        >
          Đăng ký
        </button>
      </div>
      <p
        id="footer-newsletter-feedback"
        role="alert"
        aria-live="polite"
        className="mt-2 min-h-4 text-xs text-rose-300"
      >
        {state === "invalid"
          ? "Email chưa hợp lệ, vui lòng kiểm tra lại."
          : ""}
      </p>
    </form>
  );
}
