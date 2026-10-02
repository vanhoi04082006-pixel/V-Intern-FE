"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

import { refreshSession } from "@/lib/auth/auth-service";
import { getSessionUser } from "@/lib/auth/session";
import { getWorkspacePathForUser, hasAllowedRole } from "@/lib/auth/role-landing";

/**
 * Bảo vệ một workspace theo role.
 *
 * - Access token chỉ sống trong bộ nhớ nên reload trang là mất → guard gọi
 *   `refreshSession()` (dùng HttpOnly refresh cookie, không đọc cookie bằng
 *   JS) để khôi phục phiên trước khi quyết định.
 * - Chưa đăng nhập → về `/login`.
 * - Đã đăng nhập nhưng không đủ role → về workspace đúng của user, KHÔNG
 *   render nội dung bị chặn.
 * - Trạng thái `checking` không render `children` để không lộ nội dung
 *   workspace trước khi xác thực xong.
 *
 * Lưu ý: đây là chặn phía client. Chặn thật ở server cần session httpOnly
 * đọc được từ RSC — chưa có trong kiến trúc hiện tại.
 */
export function WorkspaceGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: readonly string[];
  children: ReactNode;
}) {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "allowed">("checking");

  // `allowedRoles` được truyền vào từ hằng `PROTECTED_ROUTES` nên identity
  // ổn định giữa các render → effect chạy đúng một lần.
  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      // Phiên có thể còn trong bộ nhớ (điều hướng SPA) — dùng luôn, tránh
      // gọi refresh thừa.
      const user = getSessionUser() ?? (await refreshSession());
      if (cancelled) return;

      if (!user) {
        router.replace("/login");
        return;
      }

      if (!hasAllowedRole(user, allowedRoles)) {
        router.replace(getWorkspacePathForUser(user));
        return;
      }

      setState("allowed");
    }

    void resolve();

    return () => {
      cancelled = true;
    };
  }, [allowedRoles, router]);

  if (state === "checking") {
    return (
      <div className="grid min-h-dvh place-items-center bg-[#F4F6FB] px-4">
        <p role="status" className="text-sm text-slate-500">
          Đang kiểm tra phiên đăng nhập...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
