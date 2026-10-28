"use client";
import { useState, type FormEvent } from "react";
import { Info, Mail } from "lucide-react";
/** No Nest newsletter contract exists. Never submit to a guessed legacy endpoint. */
export function NewsletterForm() {
  const [email, setEmail] = useState(""),
    [state, setState] = useState<"idle" | "invalid" | "unavailable">("idle");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState(
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
        ? "unavailable"
        : "invalid",
    );
  }
  return state === "unavailable" ? (
    <div className="mt-3.5">
      <p className="flex items-start gap-2 rounded-lg border border-sky-400/25 bg-sky-400/10 px-3.5 py-3 text-xs text-sky-200">
        <Info size={16} aria-hidden="true" />
        Đăng ký bản tin chưa được kết nối với hệ thống. Tính năng sẽ khả dụng
        khi backend chính thức ra mắt.
      </p>
      <button
        type="button"
        onClick={() => setState("idle")}
        className="mt-2 text-xs text-muted-foreground underline focus-visible:outline-brand"
      >
        Thử lại
      </button>
    </div>
  ) : (
    <form onSubmit={submit} noValidate className="mt-3.5">
      <div className="flex">
        <div className="relative min-w-0 flex-1">
          <Mail
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
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
            className="h-11 w-full rounded-l-lg border border-white/10 bg-white/[0.06] pl-10 pr-3 text-sm text-white outline-none focus:ring-2 focus:ring-accent0/40"
          />
        </div>
        <button
          type="submit"
          className="rounded-r-lg bg-brand px-4 text-sm font-semibold text-white focus-visible:outline-brand"
        >
          Đăng ký
        </button>
      </div>
      <p
        id="footer-newsletter-feedback"
        role="alert"
        aria-live="polite"
        className="mt-2 min-h-4 text-xs text-rose-400"
      >
        {state === "invalid" ? "Email chưa hợp lệ, vui lòng kiểm tra lại." : ""}
      </p>
    </form>
  );
}
