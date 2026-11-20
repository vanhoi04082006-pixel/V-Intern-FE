/**
 * TÀI KHOẢN DEMO CHO PREVIEW — ánh xạ ROLE_CATALOG thật của BE
 * (admin / instructor / intern — src/bootstrap/ensure-rbac.ts) cộng các
 * "trạng thái tài khoản đại diện" theo Section 10.1:
 *   - new: vừa vào, chưa onboarding;
 *   - normal: dữ liệu vừa đủ;
 *   - extensive: dữ liệu dày (đánh giá, KPI, sổ lương, chứng nhận);
 *   - incomplete: hồ sơ thiếu / ít dữ liệu;
 *   - restricted: quyền hẹp hơn trung bình (nếu nghiệp vụ hỗ trợ).
 *
 * Mật khẩu demo thống nhất để dễ thử; KHÔNG đưa vào DB thật — chỉ tồn tại
 * trong router preview (đã loại khỏi production build).
 */
import type { SessionUser } from "@/lib/auth/session";

export interface PreviewAccount {
  id: string;
  email: string;
  password: string;
  /** Nhãn hiện trong switcher, mô tả trạng thái đại diện. */
  label: string;
  hint: string;
  user: SessionUser;
}

const adminPermissions = [
  "users.manage",
  "roles.manage",
  "groups.manage",
  "sessions.view",
  "sessions.manage",
  "sprints.view",
  "sprints.manage",
  "tasks.view",
  "tasks.manage",
  "projects.view",
  "projects.manage",
  "templates.assessment.read",
  "templates.assessment.manage",
  "assignments.view",
  "assignments.manage",
  "recruitment.manage",
  "evaluations.view",
  "evaluations.manage",
  "performance.view",
  "kpi.view",
  "kpi.manage",
  "virtual-salary.manage",
  "certificates.view",
  "certificates.issue",
  "certificates.revoke",
  "notifications.read",
  "audit.read",
  "settings.manage",
  "ai.evaluation.assist",
];

const instructorPermissions = [
  "sessions.view",
  "sessions.manage",
  "projects.view",
  "projects.manage",
  "templates.assessment.read",
  "templates.assessment.manage",
  "assignments.view",
  "assignments.manage",
  "sprints.view",
  "sprints.manage",
  "tasks.view",
  "tasks.manage",
  "recruitment.view",
  "evaluations.view",
  "evaluations.manage",
  "performance.view",
  "kpi.view",
  "certificates.view",
  "certificates.verify",
  "ai.evaluation.assist",
  "notifications.read",
];

const internPermissions = [
  "work.view",
  "submissions.create",
  "sprint.view",
  "mentor.use",
  "evaluations.view",
  "kpi.view",
  "virtual-salary.view",
  "certificates.view",
  "notifications.read",
];

function account(config: {
  id: string;
  email: string;
  label: string;
  hint: string;
  role: "admin" | "instructor" | "intern";
  permissions: string[];
  mustChangePassword?: boolean;
}): PreviewAccount {
  return {
    id: config.id,
    email: config.email,
    password: "Preview@12345",
    label: config.label,
    hint: config.hint,
    user: {
      id: config.id,
      email: config.email,
      displayName: config.label.split(" — ")[0],
      roles: [config.role],
      permissions: config.permissions,
      mustChangePassword: config.mustChangePassword,
    },
  };
}

export const PREVIEW_ACCOUNTS: PreviewAccount[] = [
  account({
    id: "pv-admin-1",
    email: "admin@vintern.preview",
    label: "Trần Hữu Quản — Quản trị viên",
    hint: "extensive: toàn quyền hệ thống",
    role: "admin",
    permissions: adminPermissions,
  }),
  account({
    id: "pv-inst-1",
    email: "giangvien1@vintern.preview",
    label: "Lê Thị Giang — Giảng viên",
    hint: "normal: chủ sở hữu phiên Thu 2026",
    role: "instructor",
    permissions: instructorPermissions,
  }),
  account({
    id: "pv-inst-2",
    email: "giangvien2@vintern.preview",
    label: "Phan Bảo Sơn — Giảng viên mới",
    hint: "incomplete: chưa có phiên active",
    role: "instructor",
    permissions: instructorPermissions,
  }),
  account({
    id: "pv-intern-1",
    email: "sinhvien1@vintern.preview",
    label: "Nguyễn An Khang — Thực tập sinh",
    hint: "extensive: sprint chạy, KPI, sổ lương, chứng nhận",
    role: "intern",
    permissions: internPermissions,
  }),
  account({
    id: "pv-intern-2",
    email: "sinhvien_minh@vintern.preview",
    label: "Đỗ Thuần Minh — Thực tập sinh",
    hint: "normal: ít dữ liệu (empty-friendly)",
    role: "intern",
    permissions: internPermissions,
  }),
  account({
    id: "pv-intern-3",
    email: "sinhvien_tan@vintern.preview",
    label: "Phạm Tân Sinh — Thực tập sinh mới",
    hint: "new: chưa onboarding → luồng recruitment_required",
    role: "intern",
    permissions: internPermissions,
  }),
  account({
    id: "pv-intern-4",
    email: "sinhvien_nanghe@vintern.preview",
    label: "Trịnh Khả Nhi — Thực tập sinh hạn chế",
    hint: "restricted: không được nộp bài (thiếu submissions.create)",
    role: "intern",
    // Mảng rỗng → mọi hasPermission fail-closed: minh hoạ permission denied.
    permissions: ["work.view", "sprint.view"],
  }),
];

export const PREVIEW_ACCOUNTS_BY_ID: Record<string, PreviewAccount> =
  Object.fromEntries(PREVIEW_ACCOUNTS.map((a) => [a.id, a]));

/** Tài khoản mặc định theo role khi chưa chọn trong switcher. */
export const DEFAULT_ACCOUNT_BY_ROLE: Record<string, string> = {
  admin: "pv-admin-1",
  instructor: "pv-inst-1",
  intern: "pv-intern-1",
};

/** Giải user theo id đã chọn, hoặc theo role của phiên đăng nhập. */
export function resolvePreviewAccount(role?: string | null): PreviewAccount {
  const explicit = currentStoredAccountId();
  if (explicit && PREVIEW_ACCOUNTS_BY_ID[explicit]) {
    return PREVIEW_ACCOUNTS_BY_ID[explicit];
  }
  const roleKey = role ?? "intern";
  const fallback =
    DEFAULT_ACCOUNT_BY_ROLE[roleKey] ?? DEFAULT_ACCOUNT_BY_ROLE.intern;
  return PREVIEW_ACCOUNTS_BY_ID[fallback];
}

export function currentStoredAccountId(): string | null {
  // Tránh import vòng: đọc sessionStorage thẳng, có guard như store.ts.
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem("vintern-preview-state");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { account?: unknown };
    return typeof parsed.account === "string" ? parsed.account : null;
  } catch {
    return null;
  }
}
