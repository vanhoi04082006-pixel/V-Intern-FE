"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCurrentUser } from "@/lib/auth/auth-service";
import { clearSession, notifyOtherTabs } from "@/lib/auth/session";
import { request } from "@/lib/api/client";
import { buttonClass, inputClass } from "@/components/product/primitives";
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
    <div className="auth-form-surface space-y-6">
      <div>
        <h1 className="text-page font-semibold text-foreground">
          Bảo vệ tài khoản của bạn
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
        <label className="block text-body font-medium">
          Mật khẩu hiện tại
          <input
            className={inputClass}
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            maxLength={72}
          />
        </label>
        <label className="block text-body font-medium">
          Mật khẩu mới
          <input
            className={inputClass}
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={72}
            aria-describedby="new-password-help"
            required
          />
        </label>
        <p
          id="new-password-help"
          className="mt-1 text-caption font-normal text-muted-foreground"
        >
          Từ 12 ký tự; tối đa 72 byte. Chọn mật khẩu riêng cho tài khoản này.
        </p>
        <label className="block text-body font-medium">
          Nhập lại mật khẩu mới
          <input
            className={inputClass}
            name="confirm"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={72}
            required
          />
        </label>
        <button className={`${buttonClass} w-full`} disabled={action.busy}>
          {action.busy ? "Đang lưu…" : "Đổi mật khẩu & đăng nhập lại"}
        </button>
      </form>
      {action.error ? <ErrorState error={action.error} /> : null}
    </div>
  );
}
