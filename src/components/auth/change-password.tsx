"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCurrentUser, type SessionUser } from "@/lib/auth/auth-service";
import { clearSession, notifyOtherTabs } from "@/lib/auth/session";
import { request } from "@/lib/api/client";
import { LiquidButton } from "@/components/animate-ui/buttons/liquid";
import { Spinner } from "@/components/product/primitives";
import { PasswordField } from "@/components/auth/password-field";
import { PasswordStrength } from "@/components/auth/password-strength";
import { ErrorState, LoadingState } from "@/components/shared/data-state";
import { useAction } from "@/components/product/use-action";
import { VCircleCheck } from "@/components/icons/v-icons";
import { InkBadge } from "@/components/notebook/ui";
import { cn } from "@/lib/utils";

/** Thẻ vai trò (sandbox ROLE_META / ROLE_AVATAR) — nhãn + tông mực theo role
 *  thật của phiên đăng nhập hiện tại. */
const ROLE_META: Record<
  string,
  { label: string; tone: string; avatar: string }
> = {
  intern: {
    label: "Sinh viên",
    tone: "blue",
    avatar: "bg-[var(--royal)] text-white",
  },
  instructor: {
    label: "Giảng viên",
    tone: "amber",
    avatar: "bg-[var(--note-yellow)] text-[var(--note-yellow-ink)]",
  },
  admin: {
    label: "Quản trị viên",
    tone: "mint",
    avatar: "bg-[var(--note-mint)] text-[var(--note-mint-ink)]",
  },
};

/** 6 hạt confetti quanh dấu tick (sandbox .confetti-pop.play) — vị trí và
 *  màu y hệt box-shadow gốc; keyframe `confetti-burst` có sẵn trong
 *  journey.css, hạt vẽ inline nên không cần class CSS dùng chung. */
const CONFETTI: Array<{
  color: string;
  x: number;
  y: number;
  delay: number;
}> = [
  { color: "--confetti-1", x: 0, y: 0, delay: 60 },
  { color: "--confetti-2", x: 9, y: 3, delay: 60 },
  { color: "--confetti-3", x: -10, y: -4, delay: 60 },
  { color: "--confetti-4", x: 0, y: 0, delay: 140 },
  { color: "--confetti-5", x: 8, y: -6, delay: 140 },
  { color: "--confetti-6", x: -9, y: 5, delay: 140 },
];

export function ChangePassword() {
  const router = useRouter(),
    [ready, setReady] = useState(false),
    [loadError, setLoadError] = useState<unknown>(),
    /* Người dùng thật của phiên (fetchCurrentUser) — vẽ thẻ vai trò bằng
     * dữ liệu thật, không đoán không giả. */
    [user, setUser] = useState<SessionUser | null>(null),
    /* Mirror giá trị mật khẩu mới vào state (form vẫn uncontrolled,
     * submit đọc FormData như cũ) — chỉ để vẽ thước độ mạnh. */
    [newPasswordValue, setNewPasswordValue] = useState(""),
    /* Nhịp "Đã đổi mật khẩu — đang mở sổ tay…" (sandbox cpStatus success). */
    [justChanged, setJustChanged] = useState(false),
    [reducedMotion, setReducedMotion] = useState(false),
    action = useAction();
  useEffect(() => {
    let active = true;
    /* Bọc trong hàm local rồi gọi (pattern auth-glyph-layer: sync()) — đọc
     * thiết lập giảm chuyển động sau mount, không đụng luồng fetch user. */
    const readReducedMotion = () =>
      setReducedMotion(
        Boolean(
          window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches,
        ),
      );
    readReducedMotion();
    void fetchCurrentUser()
      .then((current) => {
        if (!active) return;
        if (!current) router.replace("/login");
        else {
          setUser(current);
          setReady(true);
        }
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

  const roleKey = user?.roles.find((role) => ROLE_META[role]) ?? "";
  const roleMeta =
    ROLE_META[roleKey] ??
    ({ label: "Người dùng", tone: "neutral", avatar: "bg-muted text-foreground" } as const);
  const initials =
    (user?.displayName ?? "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toLocaleUpperCase("vi") || "?";

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

      {/* Ai đang đổi mật khẩu — thẻ giấy nét đứt với avatar viết tay,
          tên/email thật và InkBadge vai trò (sandbox cpCtx.user card). */}
      {user ? (
        <div className="flex items-center gap-3 rounded-[10px_12px_10px_12px] border-2 border-dashed border-[color-mix(in_srgb,var(--ink)_25%,transparent)] bg-[var(--paper-raised)] p-3">
          <span
            aria-hidden="true"
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-[var(--ink)] text-[0.74rem] font-extrabold",
              roleMeta.avatar,
            )}
          >
            {initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-body font-bold text-[var(--ink)]">
              {user.displayName}
            </span>
            <span className="block truncate text-caption text-[var(--ink-soft)]">
              {user.email}
            </span>
          </span>
          <InkBadge tone={roleMeta.tone} className="shrink-0 px-2 py-0 text-[0.66rem]">
            {roleMeta.label}
          </InkBadge>
        </div>
      ) : null}

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
            /* Sandbox Journey v3: hiện nhịp "Đã đổi mật khẩu — đang mở sổ
             * tay…" với dấu tick vẽ mực + confetti rồi mới rời trang. Luồng
             * thật giữ nguyên thứ tự (request → clearSession → notifyOtherTabs
             * → /login?password=changed); chỉ hoãn redirect ~0.76s để kịp vẽ.
             * Giảm chuyển động → chuyển thẳng. */
            setJustChanged(true);
            if (!reducedMotion) {
              await new Promise((resolve) => setTimeout(resolve, 760));
            }
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
          hint="Chính là mật khẩu bạn vừa dùng để đăng nhập lúc nãy."
        />
        <div>
          <PasswordField
            id="new-password"
            name="newPassword"
            label="Mật khẩu mới"
            autoComplete="new-password"
            minLength={12}
            maxLength={72}
            hint="Từ 12 ký tự; tối đa 72 byte. Chọn mật khẩu riêng cho tài khoản này."
            required
            onChange={(event) => setNewPasswordValue(event.target.value)}
          />
          {/* Thước độ mạnh mật khẩu (sandbox PasswordStrength) — hiện
           * khi ô mật khẩu mới có nội dung; thuần hiển thị, không đụng
           * luồng submit FormData. */}
          {newPasswordValue.length > 0 ? (
            <PasswordStrength password={newPasswordValue} />
          ) : null}
        </div>
        <PasswordField
          id="confirm-password"
          name="confirm"
          label="Nhập lại mật khẩu mới"
          autoComplete="new-password"
          minLength={12}
          maxLength={72}
          required
        />
        {justChanged ? (
          /* Nhịp thành công (sandbox cpStatus success): dấu tick vẽ dần bằng
           * keyframe draw-check + 6 hạt confetti bung ra + dòng nhắn. Tick vẽ
           * qua stroke-dasharray/dashoffset inline trên svg — không thêm CSS
           * dùng chung. Giảm chuyển động → chỉ text, không hạt. */
          <div
            role="status"
            className="flex items-center justify-center gap-2.5 rounded-[10px_13px_11px_12px] border-2 border-[var(--success)] bg-[color-mix(in_srgb,var(--success)_12%,transparent)] p-4 text-body font-bold text-[var(--success)]"
          >
            <span className="relative inline-flex" aria-hidden="true">
              <VCircleCheck
                size={24}
                className="[stroke-dasharray:60] [stroke-dashoffset:60]"
                style={
                  reducedMotion
                    ? undefined
                    : { animation: "draw-check 560ms 140ms ease-out forwards" }
                }
              />
              {reducedMotion
                ? null
                : CONFETTI.map(({ color, x, y, delay }) => (
                    <span
                      key={`${color}-${x}-${y}`}
                      className="absolute size-[5px] rounded-[1.5px]"
                      style={{
                        left: `calc(50% + ${x}px)`,
                        top: `calc(50% + ${y}px)`,
                        background: `var(${color})`,
                        animation: `confetti-burst ${
                          delay === 60 ? "680ms" : "640ms"
                        } ${delay}ms cubic-bezier(0.2,0.7,0.3,1) forwards`,
                      }}
                    />
                  ))}
            </span>
            Đã đổi mật khẩu — đang mở sổ tay…
          </div>
        ) : (
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
        )}
      </form>
      {action.error ? <ErrorState error={action.error} /> : null}
    </div>
  );
}
