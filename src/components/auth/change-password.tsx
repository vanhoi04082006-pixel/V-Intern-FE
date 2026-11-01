"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCurrentUser } from "@/lib/auth/auth-service";
import { clearSession, notifyOtherTabs } from "@/lib/auth/session";
import { request } from "@/lib/api/client";
import { LiquidButton } from "@/components/animate-ui/buttons/liquid";
import { Spinner } from "@/components/product/primitives";
import { PasswordField } from "@/components/auth/password-field";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { useAction } from "@/components/product/use-action";

export function ChangePassword() {
  const router = useRouter(),
    [ready, setReady] = useState(false),
    [loadError, setLoadError] = useState<unknown>(),
    action = useAction();
  useEffect(() => {
    let active = true;
    void fetchCurrentUser()
      .then((user) => {
        if (!active) return;
        if (!user) router.replace("/login");
        else setReady(true);
      })
      .catch((error) => {
        if (active) setLoadError(error);
      });
    return () => {
      active = false;
    };
  }, [router]);
  if (loadError) return <ErrorState error={loadError} />;
  if (!ready) return <LoadingState />;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page font-bold text-foreground">
          Bảo vệ <span className="marker">tài khoản của bạn</span>
        </h1>
        <p className="mt-2 text-body leading-6 text-muted-foreground">
          Đổi mật khẩu tạm trước khi vào hệ thống. Sau khi lưu, đăng nhập lại
          bằng mật khẩu mới.
        </p>
      </div>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          void action.run(async () => {
            if (data.get("newPassword") !== data.get("confirm"))
              throw Error("Mật khẩu xác nhận chưa khớp.");
            await request("/auth/change-password", (raw) => raw, {
              method: "POST",
              body: {
                currentPassword: data.get("currentPassword"),
                newPassword: data.get("newPassword"),
              },
            });
            clearSession();
            notifyOtherTabs("session-changed");
            router.replace("/login?password=changed");
          });
        }}
      >
        {/* v6 Gọn: đồng bộ ngôn ngữ trường nhập với các form auth khác
            (PasswordField + hint + error inline) thay vì inputClass sản phẩm. */}
        <PasswordField
          id="current-password"
          name="currentPassword"
          label="Mật khẩu hiện tại"
          autoComplete="current-password"
          maxLength={72}
          required
        />
        <PasswordField
          id="new-password"
          name="newPassword"
          label="Mật khẩu mới"
          autoComplete="new-password"
          minLength={12}
          maxLength={72}
          hint="Từ 12 ký tự; tối đa 72 byte. Chọn mật khẩu riêng cho tài khoản này."
          required
        />
        <PasswordField
          id="confirm-password"
          name="confirm"
          label="Nhập lại mật khẩu mới"
          autoComplete="new-password"
          minLength={12}
          maxLength={72}
          required
        />
        <LiquidButton
          type="submit"
          disabled={action.busy}
          delay="0.32s"
          className="auth-cta mt-1 inline-flex h-12 w-full items-center justify-center gap-2 rounded-control bg-primary text-body font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-80 [--liquid-button-background-color:var(--primary)] [--liquid-button-color:var(--app-primary-800)] hover:text-primary-foreground"
        >
          {action.busy ? (
            <>
              <Spinner />
              Đang lưu…
            </>
          ) : (
            "Đổi mật khẩu & đăng nhập lại"
          )}
        </LiquidButton>
      </form>
      {action.error ? <ErrorState error={action.error} /> : null}
    </div>
  );
}
