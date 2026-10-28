"use client";

import * as React from "react";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Loader2,
  Lock,
  Mail,
  User,
  X,
} from "lucide-react";
import { Link, navigate } from "@/lib/client/router";
import { authApi } from "@/lib/client/api";
import { ViewFrame } from "@/components/shared/primitives";
import { cn } from "@/lib/utils";
import { SplitAuthLayout } from "./auth-layout";

const REGISTER_QUOTE = {
  name: "Quốc Bảo",
  role: "Thực tập sinh Backend · Kỳ 2025-1",
  text: "Buổi phỏng vấn AI đầu tiên hơi căng — nhưng thấy ngay mình thiếu gì để học. Sprint đầu tiên đã được mentor chỉ từng commit.",
};

const STRENGTH_SEGMENTS = [
  { key: "len", cls: "bg-rose" },
  { key: "case", cls: "bg-amber" },
  { key: "digit", cls: "bg-teal" },
  { key: "special", cls: "bg-brand" },
] as const;

const STRENGTH_LABELS = ["", "Yếu", "Trung bình", "Khá", "Mạnh"] as const;
const STRENGTH_TEXT = [
  "",
  "text-rose",
  "text-amber",
  "text-teal",
  "text-brand-bright",
] as const;

export function RegisterPage() {
  const [form, setForm] = React.useState({ fullName: "", email: "", password: "" });
  const [accepted, setAccepted] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const pw = form.password;
  const checks = {
    len: pw.length >= 8,
    case: /[a-z]/.test(pw) && /[A-Z]/.test(pw),
    digit: /\d/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
  const score = Object.values(checks).filter(Boolean).length;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (form.password.length < 8) {
      setError("Mật khẩu cần tối thiểu 8 ký tự.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await authApi.register({ ...form, acceptedTerms: accepted });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng ký thất bại.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SplitAuthLayout quote={REGISTER_QUOTE}>
      {done ? (
        <ViewFrame>
          <div className="card-surface relative overflow-hidden p-8 text-center">
            <div
              className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-brand/12 to-transparent"
              aria-hidden
            />
            <span className="glow-brand relative mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-brand/12 text-brand-bright">
              <BadgeCheck className="size-6 icon" />
            </span>
            <h1 className="relative text-lg font-bold tracking-tight text-ink">
              Đăng ký thành công!
            </h1>
            <p className="relative mt-2 text-sm leading-relaxed text-dim">
              Tài khoản đã được tạo với vai trò thực tập sinh. Hãy đăng nhập để bắt đầu hành
              trình của bạn.
            </p>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="glow-brand relative mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand text-sm font-semibold text-on-brand transition-all hover:bg-brand-bright active:scale-[0.99]"
            >
              Đến trang đăng nhập
              <ArrowRight className="size-4 icon" />
            </button>
          </div>
        </ViewFrame>
      ) : (
        <>
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-ink">Tạo tài khoản</h1>
            <p className="mt-1.5 text-sm text-dim">
              Bắt đầu hành trình thực tập ảo cùng AI — miễn phí.
            </p>
          </div>

          <form onSubmit={submit} className="card-surface space-y-4 p-6 md:p-7">
            {error ? (
              <div
                role="alert"
                className="rounded-xl border border-rose/30 bg-rose/10 px-3.5 py-3 text-xs leading-relaxed text-rose"
              >
                {error}
              </div>
            ) : null}

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-dim">Họ và tên</span>
              <span className="relative block">
                <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 icon text-faint" />
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={form.fullName}
                  onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))}
                  placeholder="Nguyễn Văn An"
                  className="h-11 w-full rounded-lg border border-line bg-deep pl-10 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-brand/70 dark:focus:border-line-strong"
                />
              </span>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-dim">Email</span>
              <span className="relative block">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 icon text-faint" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                  placeholder="ban@email.vn"
                  className="h-11 w-full rounded-lg border border-line bg-deep pl-10 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-brand/70 dark:focus:border-line-strong"
                />
              </span>
            </label>

            <div className="space-y-1.5">
              <label className="flex items-center justify-between">
                <span className="text-xs font-medium text-dim">Mật khẩu</span>
                {pw ? (
                  <span
                    className={cn(
                      "text-[11px] font-semibold",
                      STRENGTH_TEXT[score] ?? STRENGTH_TEXT[1]
                    )}
                  >
                    {STRENGTH_LABELS[score] ?? STRENGTH_LABELS[1]}
                  </span>
                ) : null}
              </label>
              <span className="relative block">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 icon text-faint" />
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={pw}
                  onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                  placeholder="Tối thiểu 8 ký tự"
                  className="h-11 w-full rounded-lg border border-line bg-deep pl-10 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-brand/70 dark:focus:border-line-strong"
                />
              </span>

              {/* Strength meter: 4 đoạn */}
              <span className="mt-2.5 flex gap-1.5" aria-hidden>
                {STRENGTH_SEGMENTS.map((seg) => (
                  <span
                    key={seg.key}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-colors duration-300",
                      score > STRENGTH_SEGMENTS.findIndex((s) => s.key === seg.key)
                        ? seg.cls
                        : "bg-track"
                    )}
                  />
                ))}
              </span>

              {/* Checklist điều kiện */}
              <ul className="mt-2.5 space-y-1.5">
                {[
                  { ok: checks.len, label: "Tối thiểu 8 ký tự" },
                  { ok: checks.case, label: "Có cả chữ hoa và chữ thường" },
                  { ok: checks.digit || checks.special, label: "Có số hoặc ký tự đặc biệt" },
                ].map((item) => (
                  <li
                    key={item.label}
                    className={cn(
                      "flex items-center gap-2 text-[11px] transition-colors",
                      item.ok ? "text-brand-bright" : "text-faint"
                    )}
                  >
                    {item.ok ? (
                      <Check className="size-3.5 icon" />
                    ) : (
                      <X className="size-3.5 icon" />
                    )}
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>

            <label
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border bg-deep/50 p-3.5 transition-colors hover:border-line-strong",
                accepted ? "border-brand/40" : "border-line"
              )}
            >
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-brand"
              />
              <span className="text-xs leading-relaxed text-dim">
                Tôi đã đọc và đồng ý với{" "}
                <span className="font-medium text-ink">Điều khoản sử dụng</span> và{" "}
                <span className="font-medium text-ink">Chính sách dữ liệu</span> của V-Intern.
              </span>
            </label>

            <button
              type="submit"
              disabled={busy || !accepted}
              className="glow-brand inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand text-sm font-semibold text-on-brand transition-all hover:bg-brand-bright active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
            >
              {busy ? <Loader2 className="size-4 animate-spin icon" /> : null}
              {busy ? "Đang tạo tài khoản…" : "Đăng ký"}
              {busy ? null : <ArrowRight className="size-4 icon" />}
            </button>

            <p className="text-center text-xs text-dim">
              Đã có tài khoản?{" "}
              <Link to="/login" className="font-medium text-brand-bright hover:underline">
                Đăng nhập
              </Link>
            </p>
          </form>
        </>
      )}
    </SplitAuthLayout>
  );
}
