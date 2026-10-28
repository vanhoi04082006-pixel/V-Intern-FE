"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { StudentOutcomeHeading } from "@/components/intern/student-outcome-heading";
import { LearningIcon } from "@/components/workspace/learning-icon";
import { errorMessage } from "@/lib/auth/api-client";
import { refreshSession } from "@/lib/auth/auth-service";
import { getSessionUser } from "@/lib/auth/session";
import { buttonClass, InlineAlert } from "./primitives";

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
        <RefreshCw size={15} className={busy ? "account-refresh-icon" : undefined} aria-hidden="true" />
        {busy ? "Đang làm mới..." : "Làm mới"}
      </button>} />
    {feedback && <InlineAlert className="mb-5" tone={feedback.tone}>{feedback.text}</InlineAlert>}
    <div className="account-notebook">
      <div className="account-notebook-identity">
        <span className="account-notebook-avatar" aria-hidden="true">{user?.displayName.trim().split(/\s+/).slice(-2).map(part => part[0]).join("").toLocaleUpperCase("vi") || "?"}</span>
        <div className="account-notebook-name">
          <h2>{user?.displayName || "Chưa có thông tin tài khoản."}</h2>
          <p>{user?.roles.map(value => roleLabels[value] ?? value).join(" · ") || "Chưa gán vai trò"}</p>
          <span>Tài khoản V-Intern</span>
        </div>
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
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </li>)}</ul>
          <p className="account-notebook-note">{role === "admin"
            ? "Kết nối GitHub dùng chung được quản lý trong Cài đặt. Trang hồ sơ không thay đổi quyền truy cập."
            : "Trạng thái GitHub và quyền repository được kiểm tra ở trang kết nối, độc lập với hồ sơ V-Intern."}</p>
        </aside>
      </div>
    </div>
  </>;
}
