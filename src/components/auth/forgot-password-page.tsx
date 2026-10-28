"use client";

import { KeyRound, LifeBuoy } from "lucide-react";
import { Link } from "@/lib/client/router";
import { CenteredAuthLayout } from "./auth-layout";

export function ForgotPasswordPage() {
  return (
    <CenteredAuthLayout>
      <div className="card-surface relative overflow-hidden p-8 text-center">
        <div
          className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-amber/[0.08] to-transparent"
          aria-hidden
        />
        {/* Vòng tròn glow amber — màu glow theo token amber của theme */}
        <span className="relative mx-auto mb-6 grid size-16 place-items-center rounded-full border border-amber/25 bg-amber/10 shadow-[0_0_44px_color-mix(in_srgb,var(--amber)_22%,transparent)]">
          <span className="absolute inset-0 rounded-full bg-amber/10 blur-md" aria-hidden />
          <KeyRound className="relative size-6 icon text-amber" />
        </span>
        <h1 className="relative text-lg font-bold tracking-tight text-ink">
          Khôi phục mật khẩu
        </h1>
        <p className="relative mt-3 text-sm leading-relaxed text-dim">
          Chức năng đặt lại mật khẩu qua email chưa được kết nối với máy chủ trong bản demo
          này. Hãy liên hệ quản trị viên của tổ chức để được hỗ trợ.
        </p>
        <div className="relative mt-7 flex flex-col gap-2.5">
          <Link
            to="/login"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-brand text-sm font-semibold text-on-brand transition-all hover:bg-brand-bright active:scale-[0.99]"
          >
            Về trang đăng nhập
          </Link>
          <Link
            to="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-line text-sm font-medium text-dim transition-colors hover:border-line-strong hover:text-ink"
          >
            <LifeBuoy className="size-4 icon" />
            Về trang chủ
          </Link>
        </div>
      </div>
    </CenteredAuthLayout>
  );
}
