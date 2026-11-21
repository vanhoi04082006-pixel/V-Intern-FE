"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type CSSProperties, type FormEvent } from "react";
import {
  IconArrowUpRight,
  IconLock,
  IconRefreshCw,
} from "@/components/v-intern/icons";
import { StudentOutcomeHeading } from "@/components/intern/student-outcome-heading";
import { LearningIcon } from "@/components/workspace/learning-icon";
import { MarginNote } from "@/components/workspace/notebook";
import { Tape } from "@/components/v-intern/doodles";
import { PasswordField } from "@/components/auth/password-field";
import { PasswordStrength } from "@/components/auth/password-strength";
import { errorMessage } from "@/lib/auth/api-client";
import { refreshSession } from "@/lib/auth/auth-service";
import {
  clearSession,
  getSessionUser,
  notifyOtherTabs,
} from "@/lib/auth/session";
import { request } from "@/lib/api/client";
import { buttonClass, InlineAlert, Spinner } from "./primitives";
import { useAction } from "./use-action";

const roleLabels: Record<string, string> = {
  intern: "Sinh viên", instructor: "Giảng viên", admin: "Quản trị viên",
};

export function Profile() {
  const pathname = usePathname();
  const role = pathname.startsWith("/admin") ? "admin" : pathname.startsWith("/instructor") ? "instructor" : "intern";
  const [user, setUser] = useState(() => getSessionUser());
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);

  /* v3 (port sandbox student/staff-profile): đổi mật khẩu ngay trong hồ sơ —
   * dùng lại đúng luồng thật của trang /change-password: POST /auth/change-password
   * qua request() của lib/api/client, sau đó kết phiên và về đăng nhập.
   * PasswordField/PasswordStrength import từ components/auth (không chỉnh sửa). */
  const password = useAction();
  const [newPasswordValue, setNewPasswordValue] = useState("");

  function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void password.run(async () => {
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
      window.location.assign("/login?password=changed");
    });
  }

  async function refresh() {
    setBusy(true);
    setFeedback(null);
    try {
      const next = await refreshSession();
      if (!next) {
        setFeedback({ tone: "danger", text: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." });
      } else {
        setUser(next);
        setRefreshedAt(new Date());
        setFeedback({ tone: "success", text: "Đã cập nhật thông tin tài khoản từ hệ thống." });
      }
    } catch (cause) {
      setFeedback({ tone: "danger", text: errorMessage(cause) });
    } finally {
      setBusy(false);
    }
  }

  const links = [
    { href: role === "admin" ? "/admin/settings" : `/${role}/github`, kind: "system" as const,
      title: role === "admin" ? "Quản lý kết nối" : "Kết nối GitHub",
      description: role === "admin" ? "Tài khoản repository và cấu hình tích hợp" : "Xem tài khoản liên kết và lời mời cộng tác" },
    { href: `/${role}/notifications`, kind: "notifications" as const, title: "Thông báo",
      description: "Đọc cập nhật và chọn nội dung muốn nhận" },
    { href: role === "admin" ? "/admin/services" : `/${role}/performance`, kind: "analytics" as const,
      title: role === "admin" ? "Tình trạng dịch vụ" : "Hiệu suất thực tập",
      description: role === "admin" ? "Kiểm tra dịch vụ và thông tin vận hành" : "Theo dõi kết quả và quá trình thực hành" },
  ];

  return <>
    <StudentOutcomeHeading title="Hồ sơ" subtitle="Thông tin của bạn và các kết nối trong V-Intern"
      action={<button type="button" className={buttonClass} disabled={busy} onClick={() => void refresh()}>
        {busy ? <Spinner className="size-3.5" /> : <IconRefreshCw size={15} aria-hidden="true" />}
        {busy ? "Đang làm mới…" : "Làm mới"}
      </button>} />
    {role === "instructor" && (
      <MarginNote className="mb-5 max-w-md">
        bấm làm mới để đối chiếu thông tin với hệ thống ✎
      </MarginNote>
    )}
    {feedback && <InlineAlert className="mb-5" tone={feedback.tone}>{feedback.text}</InlineAlert>}
    <div className="account-notebook">
      <div className="account-notebook-identity relative">
        {/* v3: băng dính washi + mẩu giấy note vàng viết tay — chất liệu
            sổ tay cho thẻ nhận diện (cùng bộ class journey đã có sẵn). */}
        <Tape variant="blue" rotate={2} className="-top-2.5 right-10 !h-5 !w-24" />
        <span
          className="account-notebook-avatar badge-glow"
          style={{ "--glow-tone": "var(--primary)" } as CSSProperties}
          aria-hidden="true">{user?.displayName.trim().split(/\s+/).slice(-2).map(part => part[0]).join("").toLocaleUpperCase("vi") || "?"}</span>
        <div className="account-notebook-name">
          <h2>{user?.displayName || "Chưa có thông tin tài khoản."}</h2>
          <p>{user?.roles.map(value => roleLabels[value] ?? value).join(" · ") || "Chưa gán vai trò"}</p>
          <span>Tài khoản V-Intern</span>
        </div>
        <aside
          className="sticky-note absolute -bottom-4 right-2 hidden w-56 p-3 sm:block"
          style={{ "--note-rotate": "1.2deg" } as CSSProperties}
        >
          <p className="font-hand text-caption font-medium leading-relaxed">
            hồ sơ này đi kèm mọi bài nộp và chứng nhận — giữ email và mật khẩu luôn đúng
          </p>
        </aside>
      </div>
      <div className="account-notebook-layout">
        <section className="account-notebook-details" aria-labelledby="account-information-title">
          <h2 id="account-information-title">Thông tin tài khoản</h2>
          <p>Thông tin đang lưu trên hệ thống. Liên hệ quản trị viên nếu cần cập nhật.</p>
          <dl>
            <div><dt>Họ và tên</dt><dd>{user?.displayName ?? "Chưa có thông tin"}</dd></div>
            <div><dt>Email</dt><dd>{user?.email ?? "Chưa có thông tin"}</dd></div>
            <div><dt>Vai trò</dt><dd>{user?.roles.length ? user.roles.map(value => roleLabels[value] ?? value).join(", ") : "Chưa gán vai trò"}</dd></div>
          </dl>
          <p className="account-notebook-source">{refreshedAt
            ? <>Làm mới lúc <time dateTime={refreshedAt.toISOString()}>{refreshedAt.toLocaleTimeString("vi-VN")}</time></>
            : "Dữ liệu từ phiên đăng nhập hiện tại. Chọn Làm mới để đối chiếu với hệ thống."}</p>
        </section>
        <aside className="account-notebook-connections" aria-labelledby="account-connections-title">
          <h2 id="account-connections-title">Kết nối & hoạt động</h2>
          <p>Đi thẳng đến nơi bạn cần.</p>
          <ul>{links.map(link => <li key={link.href}>
            <Link href={link.href}>
              <LearningIcon kind={link.kind} />
              <span><strong>{link.title}</strong><small>{link.description}</small></span>
              <IconArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </li>)}</ul>
          <p className="account-notebook-note">{role === "admin"
            ? "Kết nối GitHub dùng chung được quản lý trong Cài đặt. Trang hồ sơ không thay đổi quyền truy cập."
            : "Trạng thái GitHub và quyền repository được kiểm tra ở trang kết nối, độc lập với hồ sơ V-Intern."}</p>
        </aside>
      </div>

      {/* v3: thẻ đổi mật khẩu — viền đứt đường cắt giấy (dashed-cut), cùng phong
          cách notebook; ba ô nhập dùng PasswordField (caps-lock + hiện/ẩn)
          và thước độ mạnh PasswordStrength. Gọi đúng endpoint thật
          /auth/change-password, sau khi lưu thì kết phiên để đăng nhập lại. */}
      <section
        aria-labelledby="account-password-title"
        className="dashed-cut relative mt-6 rounded-panel bg-card p-4 sm:p-6"
      >
        <div className="mb-4 flex flex-wrap items-center gap-2.5 border-b border-dashed border-border pb-3.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-[8px_10px_8px_10px] border border-border bg-primary/10 text-primary">
            <IconLock size={17} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id="account-password-title" className="text-section font-bold text-foreground">Đổi mật khẩu</h2>
            <p className="mt-0.5 text-caption leading-relaxed text-muted-foreground">Dùng mật khẩu riêng cho tài khoản V-Intern — sau khi lưu, hệ thống đưa bạn về trang đăng nhập.</p>
          </div>
        </div>
        <form className="grid gap-4" onSubmit={submitPassword}>
          <PasswordField
            id="profile-current-password"
            name="currentPassword"
            label="Mật khẩu hiện tại"
            autoComplete="current-password"
            maxLength={72}
            required
          />
          <div>
            <PasswordField
              id="profile-new-password"
              name="newPassword"
              label="Mật khẩu mới"
              autoComplete="new-password"
              minLength={12}
              maxLength={72}
              hint="Từ 12 ký tự; tối đa 72 byte. Chọn mật khẩu riêng cho tài khoản này."
              required
              onChange={(event) => setNewPasswordValue(event.target.value)}
            />
            {newPasswordValue.length > 0 ? (
              <PasswordStrength password={newPasswordValue} />
            ) : null}
          </div>
          <PasswordField
            id="profile-confirm-password"
            name="confirm"
            label="Nhập lại mật khẩu mới"
            autoComplete="new-password"
            minLength={12}
            maxLength={72}
            required
          />
          <button type="submit" className={buttonClass} disabled={password.busy}>
            {password.busy ? <Spinner className="size-3.5" /> : <IconLock size={15} aria-hidden="true" />}
            {password.busy ? "Đang lưu…" : "Đổi mật khẩu"}
          </button>
        </form>
        {password.error ? (
          <InlineAlert className="mt-4" tone="danger">{errorMessage(password.error)}</InlineAlert>
        ) : null}
      </section>
    </div>
  </>;
}
