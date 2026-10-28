/**
 * Template email (HTML + text) cho domain tuyển dụng — hàm thuần, không đụng store
 * (để seed.ts dùng được mà không tạo vòng import store → seed → mail → store).
 */

import type { ApplicationRecord, MailKind, MailRecord, RoundRecord, SlotRecord } from "./types";

/** Các trạng thái được phép gửi lại thủ công. */
export const RESENDABLE_STATUSES: MailRecord["status"][] = ["dead", "accepted", "bounced", "uncertain"];
/** Thư loại này chứa thông tin nhạy cảm → phải acknowledge mới được gửi lại. */
export const SENSITIVE_KINDS: MailKind[] = ["credentials", "verify"];
export const RESEND_COOLDOWN_SECONDS = 60;

export function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!name || !domain) return "u***@khong-ro";
  return `${name.slice(0, 1)}***@${domain}`;
}

const BRAND = "#10B981";

export function mailShell(
  title: string,
  intro: string,
  bodyHtml: string,
  cta?: { label: string; url: string }
): { html: string; text: string } {
  const ctaHtml = cta
    ? `<tr><td style="padding:8px 0 24px"><a href="${cta.url}" style="display:inline-block;background:${BRAND};color:#04140d;font-weight:700;padding:12px 22px;border-radius:10px;text-decoration:none">${cta.label}</a></td></tr>`
    : "";
  const ctaText = cta ? `\nMở liên kết: ${cta.url}\n` : "";
  const html = `<!doctype html><html lang="vi"><body style="margin:0;background:#0b0f0d;font-family:'Be Vietnam Pro',Segoe UI,Arial,sans-serif;color:#e6ece9">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#121a16;border:1px solid #1f2b25;border-radius:16px">
<tr><td style="padding:28px 32px 8px"><span style="font-weight:800;letter-spacing:.08em;color:${BRAND};font-size:13px">V-INTERN</span></td></tr>
<tr><td style="padding:0 32px"><h1 style="margin:8px 0;font-size:20px;line-height:1.35;color:#f2f7f4">${title}</h1></td></tr>
<tr><td style="padding:0 32px 12px;font-size:14px;line-height:1.6;color:#b8c4bd">${intro}</td></tr>
<tr><td style="padding:0 32px"><table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.7;color:#dfe8e3">${bodyHtml}</table></td></tr>
${ctaHtml}<tr><td style="padding:18px 32px 30px;font-size:12px;color:#7c8a81;border-top:1px solid #1f2b25">Email tự động từ nền tảng V-Intern — dự án giáo dục, dữ liệu chỉ mang tính demo.</td></tr>
</table></td></tr></table></body></html>`;
  const text = `${title}\n\n${intro
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<\/?b>/g, "")}\n\n${bodyHtml
    .replace(/<tr><td[^>]*>/g, "")
    .replace(/<\/td><\/tr>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")}${ctaText}`;
  return { html, text };
}

function row(label: string, value: string): string {
  return `<tr><td style="padding:3px 12px 3px 0;white-space:nowrap;color:#9fb0a5;font-size:13px">${label}</td><td style="padding:3px 0;color:#f2f7f4;font-weight:600">${value}</td></tr>`;
}

export function buildVerifyMail(app: ApplicationRecord, round: RoundRecord): { html: string; text: string } {
  return mailShell(
    "Xác minh email ứng tuyển",
    `Chào ${app.fullName.split(" ").slice(-1)[0]}, hồ sơ ứng tuyển đợt <b>${round.name}</b> đã được ghi nhận. Nhấn vào liên kết bên dưới để xác minh email — Agent sẽ bắt đầu phân tích CV ngay sau đó.`,
    row("Họ và tên:", app.fullName) + row("Đợt tuyển:", `${round.code} — ${round.name}`) + row("Email:", app.email),
    { label: "Xác minh email", url: `https://v-intern.edu.vn/apply/verify?token=${app.verifyToken}` }
  );
}

export function buildScheduleMail(
  app: ApplicationRecord,
  round: RoundRecord,
  slot: SlotRecord,
  roleLabel: string
): { html: string; text: string } {
  return mailShell(
    "Xác nhận lịch phỏng vấn trực tuyến",
    `Lịch phỏng vấn vai trò <b>${roleLabel}</b> của bạn đã được chốt. Hãy chuẩn bị theo hướng dẫn bên dưới và vào phòng ảo đúng giờ.`,
    row("Đợt tuyển:", `${round.code} — ${round.name}`) +
      row("Khung giờ:", `${slot.startsAt.slice(0, 16).replace("T", " ")} → ${slot.endsAt.slice(11, 16)} (UTC)`) +
      row("Vai trò:", roleLabel) +
      row("Địa điểm:", slot.location) +
      row("Chuẩn bị:", `${slot.minimumPreparationMinutes} phút trước giờ bắt đầu — kiểm tra mic, cam và mạng.`),
    { label: "Xem hồ sơ ứng tuyển", url: `https://v-intern.edu.vn/apply?email=${encodeURIComponent(app.email)}&round=${round.id}` }
  );
}

export function buildCredentialsMail(
  app: ApplicationRecord,
  round: RoundRecord,
  slot: SlotRecord,
  roleLabel: string,
  password: string | null
): { html: string; text: string } {
  return mailShell(
    "Thông tin đăng nhập buổi phỏng vấn",
    `Tài khoản V-Intern của bạn đã sẵn sàng cho buổi phỏng vấn vai trò <b>${roleLabel}</b>. Đăng nhập bằng thông tin bên dưới (mật khẩu tạm — nên đổi sau khi đăng nhập lần đầu).`,
    row("Email đăng nhập:", app.email) +
      row("Mật khẩu tạm:", password ?? "(đặt lại qua “Quên mật khẩu”)") +
      row("Khung giờ:", `${slot.startsAt.slice(0, 16).replace("T", " ")} → ${slot.endsAt.slice(11, 16)} (UTC)`) +
      row("Địa điểm:", slot.location) +
      row("Đợt tuyển:", `${round.code} — ${round.name}`),
    { label: "Đăng nhập V-Intern", url: "https://v-intern.edu.vn/#/login" }
  );
}

export function buildExistingAccountMail(app: ApplicationRecord, round: RoundRecord): { html: string; text: string } {
  return mailShell(
    "Bạn đã có tài khoản trên V-Intern",
    `Email <b>${app.email}</b> đã từng đăng ký V-Intern nên hệ thống không tạo tài khoản mới. Dùng tài khoản hiện có (hoặc “Quên mật khẩu”) để theo dõi hồ sơ ứng tuyển đợt <b>${round.name}</b>.`,
    row("Họ và tên:", app.fullName) + row("Đợt tuyển:", `${round.code} — ${round.name}`) + row("Trạng thái hồ sơ:", app.status),
    { label: "Đăng nhập V-Intern", url: "https://v-intern.edu.vn/#/login" }
  );
}

export function buildCancelledMail(app: ApplicationRecord, round: RoundRecord, reason: string): { html: string; text: string } {
  return mailShell(
    "Xác nhận hủy hồ sơ ứng tuyển",
    `Hồ sơ ứng tuyển đợt <b>${round.name}</b> đã được hủy theo yêu cầu. Bạn vẫn có thể nộp lại ở đợt tuyển kế tiếp.`,
    row("Họ và tên:", app.fullName) + row("Đợt tuyển:", `${round.code} — ${round.name}`) + row("Lý do:", reason),
    undefined
  );
}
