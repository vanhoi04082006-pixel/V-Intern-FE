"use client";

import * as React from "react";
import { toast } from "sonner";
import { AlertTriangle, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { Link, navigate, useRoute } from "@/lib/client/router";
import { authApi } from "@/lib/client/api";
import { homePathOf } from "@/lib/client/session";
import { SplitAuthLayout } from "./auth-layout";

const DEMO_ACCOUNTS = [
  { label: "Thực tập sinh", email: "an.nguyen@student.edu.vn" },
  { label: "Thực tập sinh mới", email: "binh.tran@student.edu.vn" },
  { label: "Giảng viên", email: "hong.le@gv.edu.vn" },
  { label: "Quản trị", email: "admin@vintern.edu.vn" },
];

const LOGIN_QUOTE = {
  name: "Minh Châu",
  role: "Thực tập sinh Frontend · Kỳ 2025-1",
  text: "Mình tưởng thực tập sẽ rất khó — nhưng Mentor AI giải thích từng bước như một người anh cùng team.",
};

export function LoginPage() {
  const { search } = useRoute();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const user = await authApi.login(email.trim(), password);
      toast.success(`Chào mừng trở lại, ${user.displayName}!`);
      const next = search.get("next");
      navigate(next && next.startsWith("/") ? next : homePathOf(user.role), {
        replace: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SplitAuthLayout quote={LOGIN_QUOTE}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Đăng nhập</h1>
        <p className="mt-1.5 text-sm text-dim">Vào không gian làm việc V-Intern của bạn.</p>
      </div>

      <form onSubmit={submit} className="card-surface space-y-4 p-6 md:p-7">
        {error ? (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-rose/30 bg-rose/10 px-3.5 py-3 text-xs leading-relaxed text-rose"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0 icon" />
            {error}
          </div>
        ) : null}

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-dim">Email</span>
          <span className="relative block">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 icon text-faint" />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ban@email.vn"
              className="h-11 w-full rounded-lg border border-line bg-deep pl-10 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-line-strong"
            />
          </span>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-dim">Mật khẩu</span>
          <span className="relative block">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 icon text-faint" />
            <input
              type={showPw ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 w-full rounded-lg border border-line bg-deep pl-10 pr-12 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-line-strong"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              className="absolute inset-y-0 right-0 grid w-11 place-items-center text-faint transition-colors hover:text-ink"
            >
              {showPw ? <EyeOff className="size-4 icon" /> : <Eye className="size-4 icon" />}
            </button>
          </span>
        </label>

        <button
          type="submit"
          disabled={busy}
          className="glow-brand inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand text-sm font-semibold text-on-brand transition-all hover:bg-brand-bright active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin icon" /> : null}
          {busy ? "Đang đăng nhập…" : "Đăng nhập"}
          {busy ? null : <ArrowRight className="size-4 icon" />}
        </button>

        <div className="flex items-center justify-between text-xs text-dim">
          <Link to="/forgot-password" className="transition-colors hover:text-ink">
            Quên mật khẩu?
          </Link>
          <Link to="/register" className="font-medium text-brand-bright hover:underline">
            Tạo tài khoản
          </Link>
        </div>

        <div className="rounded-xl border border-line bg-deep/60 p-3.5">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-faint">
            Tài khoản demo — mật khẩu chung{" "}
            <span className="font-mono normal-case text-dim">demo1234</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => {
                  setEmail(acc.email);
                  setPassword("demo1234");
                  setError(null);
                }}
                className="h-11 rounded-lg border border-line bg-panel px-3 text-left transition-all hover:border-brand/40 hover:bg-panel-2 active:scale-[0.98]"
              >
                <span className="block truncate text-xs font-semibold text-ink">{acc.label}</span>
                <span className="block truncate font-mono text-[10px] text-faint">
                  {acc.email}
                </span>
              </button>
            ))}
          </div>
        </div>
      </form>
    </SplitAuthLayout>
  );
}
