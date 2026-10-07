"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth/auth-service";
export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await logout();
        } finally {
          router.replace("/login");
        }
      }}
      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50"
    >
      {busy ? "Đang đăng xuất..." : "Đăng xuất"}
    </button>
  );
}
