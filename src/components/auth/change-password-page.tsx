"use client";

/**
 * Đổi mật khẩu — dùng SplitAuthLayout như login-page.
 *
 * Form: mật khẩu hiện tại + mật khẩu mới (12–72 ký tự, checklist live:
 * đủ dài / có hoa-thường / có số) + nhập lại. Submit qua accountApi.changePassword
 * → toast → đăng xuất phiên hiện tại → về /login.
 * Perks bảo mật (riêng, không copy login) hiển thị dưới form vì BrandPanel của
 * auth-layout cố định perks dùng chung (không được sửa file đó theo ràng buộc).
 */

import * as React from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  Timer,
  X,
} from "lucide-react";
import { Link, navigate } from "@/lib/client/router";
import { clearSession, useSession } from "@/lib/client/session";
import { accountApi } from "@/lib/client/api-org";
import { SplitAuthLayout } from "./auth-layout";
import { cn } from "@/lib/utils";

const SECURITY_QUOTE = {
  name: "Lan Đoàn",
  role: "Thực tập sinh Full-stack · Kỳ 2026-1",
  text: "Có lần tài khoản đội bị lệch mật khẩu chung — từ hôm đó mình tập đổi mật khẩu định kỳ. V-Intern nhắc đúng hạn nên rất yên tâm.",
};

/** Perks bảo mật riêng cho trang này (không trùng perks login). */
const SECURITY_PERKS = [
  {
    icon: KeyRound,
    title: "Mật khẩu được băm một chiều",
    desc: "Hệ thống chỉ lưu bản băm có muối riêng — không ai đọc được mật khẩu gốc của bạn.",
  },
  {
    icon: ShieldCheck,
    title: "Hiệu lực phiên tức thì",
    desc: "Sau khi đổi mật khẩu, các phiên đăng nhập cũ được thu hồi — chỉ bạn giữ chìa khóa.",
  },
  {
    icon: Timer,
    title: "Chuẩn độ dài OWASP",
    desc: "12–72 ký tự, kết hợp hoa — thường — số để chịu được tấn công từ điển và dò brute-force.",
  },
];

/** Checklist điều kiện mật khẩu mới (live). */
function usePasswordChecks(pw: string) {
  return {
    length: pw.length >= 12 && pw.length <= 72,
    case: /[a-z]/.test(pw) && /[A-Z]/.test(pw),
    digit: /\d/.test(pw),
  };
}

function CheckRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li
      className={cn(
        "flex items-center gap-2 text-xs transition-colors",
        ok ? "text-emerald-400" : "text-faint"
      )}
    >
      <span
        className={cn(
          "grid size-4 shrink-0 place-items-center rounded-full border transition-colors",
          ok ? "border-emerald-500/40 bg-emerald-500/15" : "border-line bg-panel-2"
        )}
      >
        {ok ? <Check className="size-2.5 icon" /> : <X className="size-2.5 icon" />}
      </span>
      {label}
    </li>
  );
}

export function ChangePasswordPage() {
  const { user } = useSession();
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const checks = usePasswordChecks(newPassword);
  const allOk = checks.length && checks.case && checks.digit;
  const match = confirmPassword.length > 0 && confirmPassword === newPassword;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!currentPassword) {
      setError("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (newPassword.length < 12 || newPassword.length > 72) {
      setError("Mật khẩu mới phải từ 12 đến 72 ký tự.");
      return;
    }
    if (!checks.case) {
      setError("Mật khẩu mới cần cả chữ hoa và chữ thường.");
      return;
    }
    if (!checks.digit) {
      setError("Mật khẩu mới cần ít nhất một chữ số.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("Mật khẩu mới phải khác mật khẩu hiện tại.");
      return;
    }
    if (confirmPassword !== newPassword) {
      setError("Mật khẩu nhập lại chưa khớp.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await accountApi.changePassword(currentPassword, newPassword);
      toast.success("Đổi mật khẩu thành công", {
        description: res.mockNote || "Hãy dùng mật khẩu mới khi đăng nhập lần tới.",
      });
      clearSession();
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đổi mật khẩu thất bại.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SplitAuthLayout quote={SECURITY_QUOTE}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Đổi mật khẩu</h1>
        <p className="mt-1.5 text-sm text-dim">
          Cập nhật mật khẩu định kỳ để giữ an toàn cho không gian làm việc.
        </p>
      </div>

      {user ? null : (
        <div
          role="status"
          className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber/30 bg-amber/10 px-3.5 py-3 text-xs leading-relaxed text-amber"
        >
          <Lock className="mt-0.5 size-4 shrink-0 icon" />
          <span>
            Bạn chưa đăng nhập. Hãy{" "}
            <Link
              to={`/login?next=${encodeURIComponent("/change-password")}`}
              className="font-semibold underline underline-offset-2"
            >
              đăng nhập
            </Link>{" "}
            trước khi đổi mật khẩu.
          </span>
        </div>
      )}

      <form onSubmit={submit} className="card-surface space-y-4 p-6 md:p-7">
        {error ? (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-rose/30 bg-rose/10 px-3.5 py-3 text-xs leading-relaxed text-rose"
          >
            <X className="mt-0.5 size-4 shrink-0 icon" />
            {error}
          </div>
        ) : null}

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-dim">Mật khẩu hiện tại</span>
          <span className="relative block">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 icon text-faint" />
            <input
              type={showCurrent ? "text" : "password"}
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 w-full rounded-lg border border-line bg-deep pl-10 pr-12 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-brand/70 dark:focus:border-line-strong"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              aria-label={showCurrent ? "Ẩn mật khẩu hiện tại" : "Hiện mật khẩu hiện tại"}
              className="absolute inset-y-0 right-0 grid w-11 place-items-center text-faint transition-colors hover:text-ink"
            >
              {showCurrent ? <EyeOff className="size-4 icon" /> : <Eye className="size-4 icon" />}
            </button>
          </span>
        </label>

        <div className="space-y-1.5">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-dim">
              Mật khẩu mới <span className="text-faint">(12–72 ký tự)</span>
            </span>
            <span className="relative block">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 icon text-faint" />
              <input
                type={showNew ? "text" : "password"}
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ít nhất 12 ký tự"
                className="h-11 w-full rounded-lg border border-line bg-deep pl-10 pr-12 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-brand/70 dark:focus:border-line-strong"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                aria-label={showNew ? "Ẩn mật khẩu mới" : "Hiện mật khẩu mới"}
                className="absolute inset-y-0 right-0 grid w-11 place-items-center text-faint transition-colors hover:text-ink"
              >
                {showNew ? <EyeOff className="size-4 icon" /> : <Eye className="size-4 icon" />}
              </button>
            </span>
          </label>
          <ul className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1">
            <CheckRow ok={checks.length} label="Đủ dài (12–72 ký tự)" />
            <CheckRow ok={checks.case} label="Có chữ hoa và chữ thường" />
            <CheckRow ok={checks.digit} label="Có chữ số" />
          </ul>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-dim">Nhập lại mật khẩu mới</span>
          <span className="relative block">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 icon text-faint" />
            <input
              type={showNew ? "text" : "password"}
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              className={cn(
                "h-11 w-full rounded-lg border bg-deep pl-10 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-brand/70 dark:focus:border-line-strong",
                confirmPassword.length === 0
                  ? "border-line"
                  : match
                    ? "border-emerald-500/40"
                    : "border-rose/50"
              )}
            />
          </span>
          {confirmPassword.length > 0 ? (
            <span
              className={cn(
                "flex items-center gap-1.5 text-[11px]",
                match ? "text-emerald-400" : "text-rose"
              )}
            >
              {match ? (
                <Check className="size-3 icon" />
              ) : (
                <X className="size-3 icon" />
              )}
              {match ? "Mật khẩu khớp" : "Mật khẩu chưa khớp"}
            </span>
          ) : null}
        </label>

        <button
          type="submit"
          disabled={busy}
          className="glow-brand inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand text-sm font-semibold text-on-brand transition-all hover:bg-brand-bright active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin icon" /> : <KeyRound className="size-4 icon" />}
          {busy ? "Đang xử lý…" : "Đổi mật khẩu"}
          {busy ? null : <ArrowRight className="size-4 icon" />}
        </button>

        <div className="flex items-center justify-between text-xs text-dim">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-3.5 icon" /> Về đăng nhập
          </Link>
          <span className="text-faint">Đổi ý? Bạn có thể quay lại sau.</span>
        </div>
      </form>

      {/* Cam kết bảo mật — perks riêng của trang này */}
      <div className="mt-6 rounded-xl border border-line bg-deep/60 p-5">
        <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
          <ShieldCheck className="size-3.5 icon text-brand-bright" />
          V-Intern bảo vệ tài khoản của bạn thế nào
        </p>
        <ul className="space-y-3.5">
          {SECURITY_PERKS.map((perk) => (
            <li key={perk.title} className="flex items-start gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-brand/25 bg-brand/10 text-brand-bright">
                <perk.icon className="size-3.5 icon" />
              </span>
              <span>
                <span className="block text-xs font-semibold text-ink">{perk.title}</span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-dim">
                  {perk.desc}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </SplitAuthLayout>
  );
}
