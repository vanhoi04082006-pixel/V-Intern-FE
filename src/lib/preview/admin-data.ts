/**
 * DỮ LIỆU MOCK BỔ SUNG CHO PREVIEW — khoản quản trị (admin/instructor).
 *
 * Mọi shape bám parser fail-closed của src/lib/api/*.ts; ID bám thực thể đã có
 * trong data.ts (ss-f26, sp-02/sp-03, prj-lib, ts-11..ts-24, pv-intern-*,
 * kpi-2026-10, cert-01/02, ev-2026-mid...) để endpoint chi tiết khớp danh sách.
 * Router (router.ts) là nơi duy nhất gọi các builder ở đây.
 */
import { ONBOARDING_FLOW } from "./onboarding-flow";

const now = new Date();
const iso = (dayOffset: number, hour = 9) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, hour)
    .toISOString();

/** Hash giả định 64 hex chars — các parser (knowledge/assessment) chỉ kiểm format. */
export function sha256like(seed: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  let x = h || 0x9e3779b9;
  let out = "";
  for (let i = 0; i < 8; i++) {
    x ^= x << 13; x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5; x >>>= 0;
    out += x.toString(16).padStart(8, "0");
  }
  return out;
}

/* ------------------------------ Thực thể dùng chung ---------------------- */

export const SESSION_F26 = {
  id: "ss-f26",
  code: "SS-F26",
  name: "Kỳ thực tập Thu 2026",
  status: "active",
  startDate: iso(-30),
  endDate: iso(60),
};

export const PROJECT_LIB = {
  id: "prj-lib",
  code: "PRJ-LIB",
  name: "Hệ thống quản lý thư viện số",
  status: "active",
};

/** Thành viên phiên SS-F26 — khớp pv-intern-* trong accounts.ts. */
export const SESSION_MEMBERS = [
  { userId: "pv-intern-1", displayName: "Nguyễn An Khang", email: "sinhvien1@vintern.preview", role: "frontend", assignmentStatus: "active" },
  { userId: "pv-intern-2", displayName: "Đỗ Thuần Minh", email: "sinhvien_minh@vintern.preview", role: "backend", assignmentStatus: "active" },
  { userId: "pv-intern-4", displayName: "Trịnh Khả Nhi", email: "sinhvien_nanghe@vintern.preview", role: "qa", assignmentStatus: "completed" },
  { userId: "u-intern-5", displayName: "Lý Thu Trang", email: "thutrang.ly@vintern.preview", role: "fullstack", assignmentStatus: "active" },
  { userId: "u-intern-6", displayName: "Hoàng Gia Bảo", email: "giabao.hoang@vintern.preview", role: "business_analyst", assignmentStatus: "active" },
];

export const PROJECT_MEMBERS = SESSION_MEMBERS.map((m) => ({
  userId: m.userId,
  displayName: m.displayName,
  email: m.email,
  roleInProject: m.role,
}));

export const INSTRUCTOR_ROW = [
  { userId: "pv-inst-1", displayName: "Lê Thị Giang", email: "giangvien1@vintern.preview" },
  { userId: "pv-inst-2", displayName: "Phan Bảo Sơn", email: "giangvien2@vintern.preview" },
  { userId: "pv-admin-1", displayName: "Trần Hữu Quản", email: "admin@vintern.preview" },
];

/** Xếp loại tham chiếu cho trang chọn nghề (public). */
export const CAREER_ROLES = [
  {
    code: "frontend",
    name: "Frontend Developer",
    label: "Frontend Developer",
    description: "Xây dựng giao diện người dùng bằng TypeScript và React/Next.js.",
    level: "intern",
    language: "vi",
    requiredSkills: ["TypeScript", "React", "HTML/CSS"],
    optionalSkills: ["Next.js", "Tailwind CSS", "Vitest"],
    competencyWeights: { delivery: 0.4, quality: 0.35, discipline: 0.25 },
    status: "published",
    acceptingApplications: true,
    version: 3,
    createdAt: iso(-120),
    updatedAt: iso(-9),
  },
  {
    code: "backend",
    name: "Backend Developer",
    label: "Backend Developer",
    description: "Phát triển API NestJS, thiết kế dữ liệu PostgreSQL.",
    level: "junior",
    language: "vi",
    requiredSkills: ["TypeScript", "NestJS", "PostgreSQL"],
    optionalSkills: ["Redis", "Docker"],
    competencyWeights: { delivery: 0.45, quality: 0.3, discipline: 0.25 },
    status: "published",
    acceptingApplications: true,
    version: 2,
    createdAt: iso(-118),
    updatedAt: iso(-15),
  },
  {
    code: "fullstack",
    name: "Fullstack Developer",
    label: "Fullstack Developer",
    description: "Vừa giao diện vừa API cho sản phẩm nội bộ.",
    level: "intern",
    language: "vi",
    requiredSkills: ["TypeScript", "Next.js", "NestJS"],
    optionalSkills: ["Prisma"],
    competencyWeights: { delivery: 0.4, quality: 0.4, discipline: 0.2 },
    status: "published",
    acceptingApplications: true,
    version: 4,
    createdAt: iso(-110),
    updatedAt: iso(-3),
  },
  {
    code: "qa",
    name: "QA Tester",
    label: "QA Tester",
    description: "Thiết kế kịch bản kiểm thử và tự động hoá smoke test.",
    level: "intern",
    language: "vi",
    requiredSkills: ["Kiểm thử hộp đen", "Vitest"],
    optionalSkills: ["Playwright"],
    competencyWeights: { delivery: 0.35, quality: 0.45, discipline: 0.2 },
    status: "published",
    acceptingApplications: false,
    version: 1,
    createdAt: iso(-95),
    updatedAt: iso(-20),
  },
  {
    code: "business_analyst",
    name: "Business Analyst",
    label: "Business Analyst",
    description: "Bóc tách yêu cầu nghiệp vụ thư viện.",
    level: "junior",
    language: "vi",
    requiredSkills: ["UML", "Viết đặc tả"],
    optionalSkills: ["Jira"],
    competencyWeights: { delivery: 0.3, quality: 0.3, discipline: 0.4 },
    status: "draft",
    acceptingApplications: false,
    version: 1,
    createdAt: iso(-40),
    updatedAt: iso(-12),
  },
  {
    code: "devops",
    name: "DevOps Intern",
    label: "DevOps Intern",
    description: "CI/CD cho repo chung của các phiên thực tập.",
    level: "intern",
    language: "en",
    requiredSkills: ["Linux", "Docker"],
    optionalSkills: ["Kubernetes"],
    competencyWeights: { delivery: 0.5, quality: 0.3, discipline: 0.2 },
    status: "archived",
    acceptingApplications: false,
    version: 2,
    createdAt: iso(-200),
    updatedAt: iso(-60),
  },
];

/* ------------------------------ A) Đơn ứng tuyển ------------------------- */

export const PUBLIC_ROUNDS = [
  { id: "rr-01", name: "Đợt tuyển Tháng 11/2026", status: "open", opensAt: iso(-6), closesAt: iso(9, 17) },
  { id: "rr-02", name: "Đợt tuyển Tháng 12/2026", status: "open", opensAt: iso(2), closesAt: iso(24, 17) },
];

export const ROUND_SLOTS = [
  {
    id: "slot-11",
    roleCode: "frontend",
    startsAt: iso(3, 9),
    endsAt: iso(3, 11),
    timezone: "Asia/Ho_Chi_Minh",
    capacity: 4,
    booked: 2,
    status: "open",
    minimumPreparationMinutes: 30,
    credentialsLeadMinutes: 60,
  },
  {
    id: "slot-12",
    roleCode: "backend",
    startsAt: iso(4, 13),
    endsAt: iso(4, 15),
    timezone: "Asia/Ho_Chi_Minh",
    capacity: 4,
    booked: 1,
    status: "open",
    minimumPreparationMinutes: 30,
    credentialsLeadMinutes: 60,
  },
  {
    id: "slot-13",
    roleCode: "fullstack",
    startsAt: iso(6, 14),
    endsAt: iso(6, 16),
    timezone: "Asia/Ho_Chi_Minh",
    capacity: 3,
    booked: 3,
    status: "closed",
    minimumPreparationMinutes: 45,
    credentialsLeadMinutes: 90,
  },
];

export function candidateApplication() {
  return {
    id: "app-2026-331",
    fullName: "Phạm Tân Sinh",
    status: "booked",
    matchedRole: "frontend",
    revision: 2,
    hasCv: true,
    booking: {
      id: "bk-88",
      roleCode: "frontend",
      roleName: "Frontend Developer",
      status: "confirmed",
      startsAt: iso(3, 9),
      endsAt: iso(3, 11),
      timezone: "Asia/Ho_Chi_Minh",
      version: 2,
    },
    timeline: [
      { kind: "submitted", message: "Đã nhận CV qua đợt tuyển Tháng 11/2026.", createdAt: iso(-6, 10) },
      { kind: "verified", message: "Email đã được xác minh.", createdAt: iso(-6, 11) },
      { kind: "analyzed", message: "Agent đề xuất nghề Frontend Developer (độ tin cậy 0.82).", createdAt: iso(-5, 9) },
      { kind: "booked", message: "Đã xếp lịch phỏng vấn 09:00 — 11:00, khung Frontend.", createdAt: iso(-4, 15) },
    ],
  };
}

export const ROUND_APPLICATIONS = [
  { id: "app-2026-331", fullName: "Phạm Tân Sinh", email: "tansinh.pham@vintern.preview", status: "booked", matchedRole: "frontend", lastCode: null },
  { id: "app-2026-332", fullName: "Lý Thu Trang", email: "thutrang.ly@vintern.preview", status: "analyzing", matchedRole: null, lastCode: null },
  { id: "app-2026-333", fullName: "Hoàng Gia Bảo", email: "giabao.hoang@vintern.preview", status: "new", matchedRole: null, lastCode: null },
  { id: "app-2026-334", fullName: "Nguyễn Văn B", email: "vanb.nguyen@vintern.preview", status: "passed", matchedRole: "backend", lastCode: "INT-PASS-334" },
  { id: "app-2026-335", fullName: "Trần Thu Cường", email: "thucuong.tran@vintern.preview", status: "failed", matchedRole: "backend", lastCode: "INT-FAIL-335" },
  { id: "app-2026-336", fullName: "Võ Mai Hà", email: "maiha.vo@vintern.preview", status: "retake", matchedRole: "qa", lastCode: "INT-RETAKE-336" },
  { id: "app-2026-337", fullName: "Đặng Hải Nam", email: "hainam.dang@vintern.preview", status: "needs_information", matchedRole: null, lastCode: null },
  { id: "app-2026-338", fullName: "Bùi Khánh Vy", email: "khanhvy.bui@vintern.preview", status: "cancelled", matchedRole: null, lastCode: null },
];

/* ------------------------------ B) GitHub identity ----------------------- */

const GITHUB_SHARED_LOGIN = "vintern-admin";

export function githubStatusFor(accountId: string) {
  const connected =
    accountId === "pv-admin-1" ||
    accountId === "pv-inst-1" ||
    accountId === "pv-inst-2" ||
    accountId === "pv-intern-1" ||
    accountId === "pv-intern-2";
  const login = accountId === "pv-admin-1"
    ? GITHUB_SHARED_LOGIN
    : accountId === "pv-inst-1"
      ? "giang-le"
      : accountId === "pv-inst-2"
        ? "son-phan"
        : accountId === "pv-intern-1"
          ? "khang-nguyen"
          : accountId === "pv-intern-2"
            ? "minh-do"
            : null;
  return {
    configured: true,
    connected,
    login,
    canCreatePublicRepo: accountId === "pv-admin-1",
    reconnectRequired: false,
  };
}

export function repositoryAccountFor(accountId: string) {
  const isAdmin = accountId === "pv-admin-1";
  return {
    configured: true,
    connected: isAdmin,
    login: isAdmin ? GITHUB_SHARED_LOGIN : null,
    ready: isAdmin,
  };
}

export function sessionRepositoryPayload(sessionId: string) {
  const repo = sessionId === "ss-f26"
    ? {
      owner: "vintern-2026",
      name: "library-system",
      url: "https://github.com/vintern-2026/library-system",
      status: "ready" as const,
      errorCode: null,
      webhookStatus: "ready" as const,
      webhookUpdatedAt: iso(-1, 16),
    }
    : sessionId === "ss-s26"
      ? {
        owner: "vintern-2026",
        name: "job-portal",
        url: "https://github.com/vintern-2026/job-portal",
        status: "ready" as const,
        errorCode: null,
        webhookStatus: "failed" as const,
        webhookUpdatedAt: iso(-30, 12),
      }
      : null;
  const members = SESSION_MEMBERS.map((m, i) => ({
    userId: m.userId,
    displayName: m.displayName,
    status: i === 0 ? "accepted" : i === 1 ? "accepted" : i === 4 ? "expired" : "pending",
    login: i === 0 ? "khang-nguyen" : i === 1 ? "minh-do" : null,
    invitationId: i >= 2 ? `gh-inv-${100 + i}` : null,
    invitedAt: i >= 2 ? iso(-3, 10) : null,
    expiresAt: i >= 2 ? iso(4, 10) : null,
    acceptedAt: i < 2 ? iso(-3, 15) : null,
    lastCheckedAt: iso(-1, 9),
    errorCode: i === 4 ? "GITHUB_INVITATION_EXPIRED" : null,
  }));
  members.push({
    userId: "pv-inst-1",
    displayName: "Lê Thị Giang",
    status: "accepted",
    login: "giang-le",
    invitationId: null,
    invitedAt: null,
    expiresAt: null,
    acceptedAt: iso(-30, 11),
    lastCheckedAt: iso(-1, 9),
    errorCode: null,
  });
  return { repository: repo, members, canManage: true };
}

export function githubActivityFor(sessionId: string) {
  const items = [
    { id: "gev-1", eventType: "pull_request", action: "opened", headSha: "9f2c1ab7d34e", pullNumber: 48, branch: "feat/returns-api", receivedAt: iso(-1, 11) },
    { id: "gev-2", eventType: "push", action: "pushed", headSha: "1aa9d3e5c22b", pullNumber: null, branch: "feat/returns-api", receivedAt: iso(-1, 10) },
    { id: "gev-3", eventType: "pull_request", action: "synchronize", headSha: "77b2f04a12de", pullNumber: 48, branch: "feat/returns-api", receivedAt: iso(-2, 9) },
    { id: "gev-4", eventType: "check_run", action: "completed", headSha: "9f2c1ab7d34e", pullNumber: 48, branch: "feat/returns-api", receivedAt: iso(-1, 12) },
    { id: "gev-5", eventType: "pull_request", action: "closed", headSha: "45cd88e9901a", pullNumber: 45, branch: "feat/search-filters", receivedAt: iso(-3, 17) },
    { id: "gev-6", eventType: "ping", action: "ping", headSha: null, pullNumber: null, branch: null, receivedAt: iso(-30, 8) },
  ];
  return { total: items.length, items: sessionId === "ss-f26" ? items : items.slice(0, 2) };
}

/* ------------------------------ C) RBAC admin ----------------------------- */

const PERMISSION_CATALOG: Record<string, Array<{ id: string; code: string; name: string; description: string | null }>> = {
  "r-admin": [
    { id: "pm-1", code: "users.manage", name: "Quản lý người dùng", description: "Tạo/khoá tài khoản" },
    { id: "pm-2", code: "roles.manage", name: "Quản lý vai trò", description: "Gán quyền hệ thống" },
    { id: "pm-3", code: "knowledge.read", name: "Đọc kho tri thức", description: null },
    { id: "pm-4", code: "knowledge.manage", name: "Sửa kho tri thức", description: null },
    { id: "pm-5", code: "knowledge.publish", name: "Phát hành kho tri thức", description: null },
    { id: "pm-6", code: "settings.manage", name: "Cấu hình hệ thống", description: "Thiết đặt chung" },
    { id: "pm-7", code: "audit.read", name: "Đọc nhật ký", description: null },
  ],
  "r-inst": [
    { id: "pm-11", code: "sessions.manage", name: "Quản lý phiên", description: null },
    { id: "pm-12", code: "sprints.manage", name: "Quản lý sprint", description: null },
    { id: "pm-13", code: "evaluations.manage", name: "Chấm đánh giá", description: null },
    { id: "pm-14", code: "recruitment.view", name: "Xem tuyển dụng", description: null },
  ],
  "r-intern": [
    { id: "pm-21", code: "work.view", name: "Xem công việc", description: null },
    { id: "pm-22", code: "submissions.create", name: "Nộp bài", description: null },
    { id: "pm-23", code: "sprint.view", name: "Xem sprint", description: null },
  ],
};

export function permissionsForRole(roleId: string) {
  return PERMISSION_CATALOG[roleId] ?? PERMISSION_CATALOG["r-intern"];
}

export const GROUP_MEMBERS = [
  { userId: "pv-intern-1", joinedAt: iso(-60) },
  { userId: "pv-intern-2", joinedAt: iso(-58) },
  { userId: "pv-intern-3", joinedAt: iso(-2) },
];

export const GROUP_ROLES = ["intern"];

/* ------------------------------ D) Danh mục ------------------------------- */

export const CATALOG_TYPES = [
  { id: "ct-1", code: "domain", name: "Lĩnh vực dự án", description: "Nhóm ngành của dự án thực tập" },
  { id: "ct-2", code: "difficulty", name: "Độ khó", description: "Bậc độ khó dự án" },
  { id: "ct-3", code: "technology", name: "Công nghệ", description: "Stack kỹ thuật" },
  { id: "ct-4", code: "priority", name: "Ưu tiên nhiệm vụ", description: null },
];

export const CATALOG_ITEMS = [
  { id: "ci-1", code: "lib", name: "Thư viện số", value: "library", sortOrder: 1, isActive: true, typeCode: "domain" },
  { id: "ci-2", code: "edu", name: "Giáo dục", value: "education", sortOrder: 2, isActive: true, typeCode: "domain" },
  { id: "ci-3", code: "portal", name: "Cổng thông tin", value: "portal", sortOrder: 3, isActive: true, typeCode: "domain" },
  { id: "ci-4", code: "beginner", name: "Nhập môn", value: "1", sortOrder: 1, isActive: true, typeCode: "difficulty" },
  { id: "ci-5", code: "intermediate", name: "Trung cấp", value: "2", sortOrder: 2, isActive: true, typeCode: "difficulty" },
  { id: "ci-6", code: "advanced", name: "Nâng cao", value: "3", sortOrder: 3, isActive: false, typeCode: "difficulty" },
  { id: "ci-7", code: "nextjs", name: "Next.js", value: "next", sortOrder: 1, isActive: true, typeCode: "technology" },
  { id: "ci-8", code: "nestjs", name: "NestJS", value: "nest", sortOrder: 2, isActive: true, typeCode: "technology" },
  { id: "ci-9", code: "postgres", name: "PostgreSQL", value: "pg", sortOrder: 3, isActive: true, typeCode: "technology" },
  { id: "ci-10", code: "urgent", name: "Khẩn cấp", value: "P0", sortOrder: 4, isActive: true, typeCode: "priority" },
];

/* ------------------------------ E) Hệ thống ------------------------------- */

export function systemStatusPayload() {
  return {
    checkedAt: iso(0, 8),
    counts: { users: 128, activeSessions: 8, activeQuestions: 42, activeTemplates: 12, migrations: 36, runningReviews: 2 },
    database: { latencyMs: 12 },
    integrations: {
      github: { configured: true, missing: [] },
      webhook: { configured: true },
      runner: { configured: true, missing: [], sealedSuites: 4, suiteConfigValid: true },
    },
    learningAlerts: {
      enabled: true,
      intervalSeconds: 1800,
      running: true,
      lastScanAt: iso(-1, 23),
      lastErrorCode: null,
      lastResult: { created: 3, muted: 1, processed: 4 },
    },
    aiLast24Hours: [
      { feature: "code-review", status: "ok", count: 132, averageLatencyMs: 2400 },
      { feature: "interview-evaluation", status: "ok", count: 26, averageLatencyMs: 5100 },
      { feature: "knowledge-run", status: "degraded", count: 9, averageLatencyMs: 8800 },
      { feature: "plan-generation", status: "ok", count: 14, averageLatencyMs: 6400 },
      { feature: "recommendation", status: "ok", count: 60, averageLatencyMs: 1800 },
    ],
  };
}

export function systemContractsPayload(stored: boolean) {
  return {
    checkedAt: iso(0, 8),
    source: stored
      ? "Cấu hình Runner đã lưu trên máy chủ"
      : "Bản nháp kiểm tra — chưa lưu, chưa kích hoạt",
    valid: true,
    error: null,
    contracts: [
      {
        key: "returns-api.suite",
        suiteId: "suite-returns-01",
        digest: sha256like("returns-api"),
        status: "sealed",
        issues: [],
        operator: { version: "op-2026.10", reviewer: "Trần Hữu Quản", sealedAt: iso(-6, 10), images: { runtime: "node:20-alpine", tester: "node:20" }, complete: true },
      },
      {
        key: "borrow-api.suite",
        suiteId: "suite-borrow-01",
        digest: sha256like("borrow-api"),
        status: "sealed",
        issues: [],
        operator: { version: "op-2026.10", reviewer: "Lê Thị Giang", sealedAt: iso(-12, 15), images: { runtime: "node:20-alpine", tester: null }, complete: true },
      },
      {
        key: "search-filters.suite",
        suiteId: null,
        digest: null,
        status: "missing",
        issues: [{ code: "SUITE_NOT_SEALED", detail: "Chưa có bản niêm phong cho suite này." }],
        operator: { version: null, reviewer: null, sealedAt: null, images: { runtime: null, tester: null }, complete: false },
      },
    ],
    ...(stored ? {} : { stored: false }),
  };
}

export function systemRepositoriesPayload() {
  const items = [
    { sessionId: "ss-f26", sessionName: "Kỳ thực tập Thu 2026", sessionCode: "SS-F26", instructorName: "Lê Thị Giang", ownerLogin: "vintern-2026", repoName: "library-system", status: "ready", webhookStatus: "ready", webhookErrorCode: null, lastEventAt: iso(-1, 11) },
    { sessionId: "ss-s26", sessionName: "Kỳ thực tập Hè 2026", sessionCode: "SS-S26", instructorName: "Lê Thị Giang", ownerLogin: "vintern-2026", repoName: "job-portal", status: "ready", webhookStatus: "failed", webhookErrorCode: "GITHUB_HOOK_NOT_FOUND", lastEventAt: iso(-40, 9) },
    { sessionId: "ss-w27", sessionName: "Kỳ thực tập Xuân 2027", sessionCode: "SS-W27", instructorName: "Phan Bảo Sơn", ownerLogin: null, repoName: null, status: "pending", webhookStatus: "not_configured", webhookErrorCode: null, lastEventAt: null },
    { sessionId: "ss-x27", sessionName: "Kỳ thực tập Xuân 2027 (khác)", sessionCode: "SS-X27", instructorName: "Phan Bảo Sơn", ownerLogin: "vintern-2026", repoName: "kids-viet-app", status: "provisioning", webhookStatus: "configuring", webhookErrorCode: null, lastEventAt: null },
    { sessionId: "ss-a25", sessionName: "Kỳ thực tập Thu 2025", sessionCode: "SS-A25", instructorName: "Lê Thị Giang", ownerLogin: "vintern-2025", repoName: "archive-2025", status: "archived", webhookStatus: "not_configured", webhookErrorCode: null, lastEventAt: iso(-400, 10) },
  ];
  return { total: items.length, pageSize: 20, items };
}

/* ------------------------------ F) AI config + agents --------------------- */

export function aiConfigurationPayload() {
  return {
    policy: { model: "gemini-2.5-pro", timeoutMs: 90000, maxRetries: 2, version: 7 },
    source: "Cấu hình đã lưu trên máy chủ",
    provider: "google",
    credentialsConfigured: true,
    appliesTo: ["code-review", "interview-evaluation", "plan-generation", "recommendation", "knowledge-run"],
  };
}

export function businessRunsPayload() {
  const statuses = ["succeeded", "running", "queued", "failed", "cancelled", "paused"] as const;
  const items = Array.from({ length: 12 }, (_, i) => ({
    id: `run-2026-${(500 + i).toString().padStart(4, "0")}`,
    agentId: ["code-reviewer", "interview-evaluator", "plan-generator"][i % 3],
    agentVersion: "1.4.2",
    promptVersion: "prompt-2026.10",
    status: statuses[i % statuses.length],
    model: i % 5 === 4 ? null : "gemini-2.5-pro",
    stepCount: 3 + (i % 6),
    attempts: i % 3 === 0 ? 2 : 1,
    toolCalls: 5 + (i % 9),
    inputTokens: i % 5 === 4 ? null : 18400 + i * 220,
    outputTokens: i % 5 === 4 ? null : 2600 + i * 80,
    errorCode: statuses[i % statuses.length] === "failed" ? "AI_PROVIDER_TIMEOUT" : null,
    createdAt: iso(-i, 10),
  }));
  return {
    definitions: [
      { id: "code-reviewer", version: "1.4.2", promptVersion: "prompt-2026.10", features: ["code-review", "grading-assist"], budget: { maxToolCalls: 24 } },
      { id: "interview-evaluator", version: "1.2.0", promptVersion: "prompt-2026.09", features: ["interview-evaluation"], budget: { maxToolCalls: 16 } },
      { id: "plan-generator", version: "1.1.5", promptVersion: "prompt-2026.10", features: ["plan-generation"], budget: { maxToolCalls: 12 } },
    ],
    items,
    total: items.length,
    page: 1,
    pageSize: 20,
  };
}

const KNOWLEDGE_CITATION = (code: string, version: number, title: string) => ({
  id: `cit-${code}-${version}`,
  kind: "knowledge" as const,
  code,
  version,
  sha256: sha256like(`${code}-v${version}`),
  title,
  sources: [{ title: "Kho tri thức nội bộ V-Intern", url: "https://wiki.vintern.example/knowledge", reference: `KL/${code}/v${version}` }],
});

export function knowledgeRunPayload(id: string, status: "running" | "succeeded" | "cancelled") {
  return {
    id,
    requestId: `req-${id}`,
    agentId: "knowledge-rag",
    agentVersion: "1.0.3",
    status,
    steps: status === "succeeded" ? 5 : 2,
    attempts: 1,
    inputTokens: status === "succeeded" ? 9200 : null,
    outputTokens: status === "succeeded" ? 1400 : null,
    errorCode: null,
    retryable: true,
    output: status === "succeeded"
      ? {
        answer: "Theo kho tri thức KL-GUIDE-02: ruồng mượn dùng hàng đợi FIFO, mỗi thẻ mượn tối đa 5 tài liệu và phí trễ tính theo bậc ngày.",
        insufficientEvidence: false,
        citations: [KNOWLEDGE_CITATION("KL-GUIDE-02", 3, "Hướng dẫn luồng mượn/trả"), KNOWLEDGE_CITATION("KL-QA-01", 2, "Q&A hạn mức mượn")],
      }
      : null,
    createdAt: iso(-1, 15),
    updatedAt: iso(-1, 15),
    deadlineAt: iso(0, 17),
  };
}

/* ------------------------------ I) Thư đi ------------------------------ */

export const MAIL_LOG = [
  { id: "ml-1", kind: "verification", recipientHint: "t***inh@vintern.preview", status: "delivered", attempts: 1, availableAt: iso(-6, 11), expiresAt: iso(-5, 11), lastCode: null, createdAt: iso(-6, 11) },
  { id: "ml-2", kind: "interview_schedule", recipientHint: "t***inh@vintern.preview", status: "delivered", attempts: 1, availableAt: iso(-4, 15), expiresAt: iso(3, 11), lastCode: null, createdAt: iso(-4, 15) },
  { id: "ml-3", kind: "credential_recovery", recipientHint: "v***ha@vintern.preview", status: "pending", attempts: 0, availableAt: iso(0, 9), expiresAt: iso(1, 9), lastCode: null, createdAt: iso(0, 9) },
  { id: "ml-4", kind: "credential_recovery", recipientHint: "k***vy@vintern.preview", status: "uncertain", attempts: 2, availableAt: iso(-1, 10), expiresAt: iso(2, 10), lastCode: "MAIL_RETRY_450", createdAt: iso(-1, 10) },
  { id: "ml-5", kind: "account_created", recipientHint: "b***ao@vintern.preview", status: "bounced", attempts: 3, availableAt: iso(-2, 8), expiresAt: iso(-1, 8), lastCode: "SMTP_550", createdAt: iso(-2, 8) },
  { id: "ml-6", kind: "certificate_issued", recipientHint: "k***ng@vintern.preview", status: "delivered", attempts: 1, availableAt: iso(-10, 9), expiresAt: iso(-3, 9), lastCode: null, createdAt: iso(-10, 9) },
  { id: "ml-7", kind: "kpi_finalized", recipientHint: "k***ng@vintern.preview", status: "delivered", attempts: 1, availableAt: iso(-12, 7), expiresAt: iso(-5, 7), lastCode: null, createdAt: iso(-12, 7) },
  { id: "ml-8", kind: "replacement_notice", recipientHint: "g***le@vintern.preview", status: "cancelled", attempts: 1, availableAt: iso(-8, 14), expiresAt: iso(-7, 14), lastCode: null, createdAt: iso(-8, 14) },
  { id: "ml-9", kind: "deadline_extended", recipientHint: "m***do@vintern.preview", status: "accepted", attempts: 1, availableAt: iso(-3, 16), expiresAt: iso(-2, 16), lastCode: null, createdAt: iso(-3, 16) },
  { id: "ml-10", kind: "verification", recipientHint: "n***b@vintern.preview", status: "expired", attempts: 1, availableAt: iso(-9, 9), expiresAt: iso(-8, 9), lastCode: null, createdAt: iso(-9, 9) },
];

export function mailPreview(id: string) {
  if (id === "ml-4") return { redacted: true, message: "Nội dung chứa thông tin đăng nhập tạm; đã ẩn theo chính sách bảo vệ." };
  return {
    redacted: false,
    subject: "Lịch phỏng vấn thực tập V-Intern",
    text: "Chào bạn,\nBạn có lịch phỏng vấn vai trò Frontend Developer vào 09:00 (Asia/Ho_Chi_Minh). Đăng nhập bằng tài khoản tạm trong thư này và đổi mật khẩu trước khi vào phòng.",
    html: "<p>Chào bạn,</p><p>Bạn có lịch phỏng vấn vai trò <strong>Frontend Developer</strong> vào 09:00 (Asia/Ho_Chi_Minh).</p>",
  };
}

/* ------------------------------ J) Kho tri thức --------------------------- */

export interface KnowledgeDocSeed {
  id: string;
  code: string;
  version: number;
  status: "draft" | "published" | "archived";
  kind: "qa" | "guide" | "exercise" | "solution" | "rubric" | "plan_template" | "communication";
  title: string;
  summary: string;
  audience: "student_safe" | "staff_only" | "grading_only";
  purposes: string[];
  difficulty: "easy" | "medium" | "hard" | null;
}

export const KNOWLEDGE_DOCS: KnowledgeDocSeed[] = [
  { id: "kl-1", code: "KL-QA-01", version: 2, status: "published", kind: "qa", title: "Q&A hạn mức mượn tài liệu", summary: "Câu trả lời chuẩn cho các câu hỏi về hạn mức và gia hạn mượn.", audience: "student_safe", purposes: ["interview", "mentoring"], difficulty: "easy" },
  { id: "kl-2", code: "KL-GUIDE-02", version: 3, status: "published", kind: "guide", title: "Hướng dẫn luồng mượn/trả", summary: "Quy trình mượn trả theo hàng đợi FIFO và phí trễ bậc ngày.", audience: "student_safe", purposes: ["planning", "mentoring"], difficulty: "medium" },
  { id: "kl-3", code: "KL-EX-03", version: 1, status: "draft", kind: "exercise", title: "Bài tập bảng giá phí trễ", summary: "Bài tập dựng bảng giá và kiểm thử biên.", audience: "student_safe", purposes: ["planning"], difficulty: "medium" },
  { id: "kl-4", code: "KL-SOL-04", version: 2, status: "published", kind: "solution", title: "Đáp án API trả sách quá hạn", summary: "Tham khảo giải pháp cho bài trả sách (chỉ nội bộ chấm).", audience: "grading_only", purposes: ["code_review", "interview_evaluation"], difficulty: "hard" },
  { id: "kl-5", code: "KL-RUB-05", version: 4, status: "published", kind: "rubric", title: "Rubric chấm API backend", summary: "Tiêu chí chấm điểm các API backend của sprint mượn/trả.", audience: "grading_only", purposes: ["interview_evaluation", "evaluation_assistance"], difficulty: null },
  { id: "kl-6", code: "KL-PLAN-06", version: 1, status: "draft", kind: "plan_template", title: "Mẫu kế hoạch sprint thư viện", summary: "Mẫu kế hoạch 3 sprint cho dự án thư viện số.", audience: "staff_only", purposes: ["planning"], difficulty: null },
  { id: "kl-7", code: "KL-COMM-07", version: 2, status: "published", kind: "communication", title: "Mẫu thư nhắc nộp bài", summary: "Mẫu email nhắc deadline theo từng mức trễ.", audience: "staff_only", purposes: ["communication"], difficulty: "easy" },
  { id: "kl-8", code: "KL-QA-08", version: 1, status: "archived", kind: "qa", title: "Q&A phiên bản cũ tra cứu MARC", summary: "Bộ Q&A cũ trước khi chuẩn MARC21 được cập nhật.", audience: "student_safe", purposes: ["interview"], difficulty: null },
];

export function knowledgeFields(seed: KnowledgeDocSeed) {
  return {
    kind: seed.kind,
    title: seed.title,
    summary: seed.summary,
    language: "vi",
    difficulty: seed.difficulty,
    audience: seed.audience,
    purposes: seed.purposes,
    roleCodes: ["intern", "instructor"],
    tags: ["library", "borrows"],
    sources: [{ title: "Wiki nội bộ V-Intern", url: "https://wiki.vintern.example/knowledge", reference: `KL/${seed.code}` }],
  };
}

export function knowledgeBody(seed: KnowledgeDocSeed) {
  switch (seed.kind) {
    case "qa":
      return {
        questions: [
          { q: "Một thẻ mượn tối đa mấy tài liệu?", a: "5 tài liệu cùng lúc, gia hạn 1 lần." },
          { q: "Đặt chỗ khi tài liệu đang mượn xử lý ra sao?", a: "Hàng đợi FIFO, ưu tiên theo thời gian đặt." },
        ],
      };
    case "guide":
      return {
        steps: [
          "Kiểm tra hạn mức thẻ mượn",
          "Tạo yêu cầu mượn qua POST /borrow",
          "Ghi giao dịch vào sổ lương ảo",
          "Trả sách: tính phí trễ theo bậc ngày",
        ],
        notes: "Mọi bước đều có kiểm thử đơn vị bắt buộc.",
      };
    case "exercise":
      return { tasks: ["Dựng bảng giá phí trễ 3 bậc", "Viết test biên 0/1/7 ngày"], hours: 4 };
    case "solution":
      return { approach: "Service tính phí bậc thang + repository ghi giao dịch bù trừ.", files: ["src/returns/fee.ts", "src/returns/fee.spec.ts"] };
    case "rubric":
      return {
        criteria: [
          { code: "functional", weight: 40, max: 100 },
          { code: "testing", weight: 30, max: 100 },
          { code: "security", weight: 30, max: 100 },
        ],
      };
    case "plan_template":
      return { sprints: 3, weeklyHours: 12, milestones: ["Khung dự án", "Định danh tài liệu", "Mượn/trả"] };
    default:
      return { template: "Nhắc nộp bài", tone: "thân thiện", escalation: ["trễ 1 ngày", "trễ 3 ngày", "trễ 7 ngày"] };
  }
}

export function knowledgeSnapshot(seed: KnowledgeDocSeed) {
  return {
    ...knowledgeFields(seed),
    schemaVersion: 1,
    body: knowledgeBody(seed),
    code: seed.code,
    version: seed.version,
    status: seed.status,
  };
}

export function knowledgeDocument(seed: KnowledgeDocSeed) {
  return {
    id: seed.id,
    code: seed.code,
    version: seed.version,
    status: seed.status,
    snapshot: knowledgeSnapshot(seed),
    sha256: sha256like(`${seed.code}-v${seed.version}`),
  };
}

export function knowledgeMetadata(seed: KnowledgeDocSeed) {
  return {
    ...knowledgeFields(seed),
    id: seed.id,
    code: seed.code,
    version: seed.version,
    status: seed.status,
    updatedAt: iso(-seed.version * 3, 10),
    sha256: sha256like(`${seed.code}-v${seed.version}`),
  };
}

export function knowledgeRevisions(seed: KnowledgeDocSeed) {
  return Array.from({ length: seed.version }, (_, i) => {
    const version = i + 1;
    return {
      version,
      snapshot: knowledgeSnapshot({ ...seed, version, status: version === seed.version ? seed.status : "archived" }),
      sha256: sha256like(`${seed.code}-v${version}`),
      createdBy: "pv-admin-1",
      createdAt: iso(-(seed.version - i) * 9, 10),
    };
  }).reverse();
}

/* ------------------------------ K) Kỳ KPI + lương ảo ---------------------- */

export const KPI_PERIODS = [
  { id: "kpi-2026-10", code: "KPI-2026-10", name: "Kỳ KPI tháng 10/2026", startDate: iso(-31), endDate: iso(-1), status: "open", ruleVersion: "kpi-rule-v3", createdAt: iso(-33), updatedAt: iso(-1, 7) },
  { id: "kpi-2026-09", code: "KPI-2026-09", name: "Kỳ KPI tháng 09/2026", startDate: iso(-61), endDate: iso(-31), status: "finalized", ruleVersion: "kpi-rule-v3", createdAt: iso(-63), updatedAt: iso(-12, 7) },
  { id: "kpi-2026-08", code: "KPI-2026-08", name: "Kỳ KPI tháng 08/2026", startDate: iso(-92), endDate: iso(-62), status: "closed", ruleVersion: "kpi-rule-v2", createdAt: iso(-94), updatedAt: iso(-42, 7) },
  { id: "kpi-2026-11", code: "KPI-2026-11", name: "Kỳ KPI tháng 11/2026", startDate: iso(0), endDate: iso(30), status: "draft", ruleVersion: "kpi-rule-v3", createdAt: iso(-1), updatedAt: iso(-1, 8) },
];

export const KPI_METRICS = [
  { metricCode: "delivery", sourceValue: 24, configuredWeight: 0.4, effectiveWeight: 0.4, weightedContribution: 33.6, sourceJson: '{"completed":24,"total":30}' },
  { metricCode: "quality", sourceValue: 90, configuredWeight: 0.35, effectiveWeight: 0.35, weightedContribution: 31.5, sourceJson: '{"aiScore":90}' },
  { metricCode: "discipline", sourceValue: 95, configuredWeight: 0.25, effectiveWeight: 0.25, weightedContribution: 23.75, sourceJson: '{"attendance":95}' },
];

export const KPI_RESULTS = [
  { id: "kpi-res-101", periodId: "kpi-2026-10", userId: "pv-intern-1", ruleVersion: "kpi-rule-v3", status: "calculated", finalScore: 82.5, calculatedAt: iso(-1, 7) },
  { id: "kpi-res-102", periodId: "kpi-2026-10", userId: "pv-intern-2", ruleVersion: "kpi-rule-v3", status: "calculated", finalScore: 71.25, calculatedAt: iso(-1, 7) },
  { id: "kpi-res-103", periodId: "kpi-2026-10", userId: "u-intern-5", ruleVersion: "kpi-rule-v3", status: "calculated", finalScore: 77, calculatedAt: iso(-1, 7) },
  { id: "kpi-res-104", periodId: "kpi-2026-10", userId: "u-intern-6", ruleVersion: "kpi-rule-v3", status: "insufficient_data", finalScore: null, calculatedAt: iso(-1, 7) },
  { id: "kpi-res-105", periodId: "kpi-2026-10", userId: "pv-intern-4", ruleVersion: "kpi-rule-v3", status: "insufficient_data", finalScore: null, calculatedAt: iso(-1, 7) },
  { id: "kpi-res-201", periodId: "kpi-2026-09", userId: "pv-intern-1", ruleVersion: "kpi-rule-v3", status: "calculated", finalScore: 78.25, calculatedAt: iso(-42, 7) },
];

export const SALARY_LEDGER = [
  { id: "lg-01", userId: "pv-intern-1", kpiPeriodId: "kpi-2026-08", type: "kpi_earning", amount: 650000, unit: "VND", description: "Thu nhập KPI kỳ 08/2026", createdAt: iso(-92, 8) },
  { id: "lg-02", userId: "pv-intern-1", kpiPeriodId: null, type: "bonus", amount: 120000, unit: "VND", description: "Thưởng đề xuất cải tiến luồng mượn sách", createdAt: iso(-61, 15) },
  { id: "lg-03", userId: "pv-intern-1", kpiPeriodId: null, type: "penalty", amount: -50000, unit: "VND", description: "Trừ do nộp trễ task TS-12", createdAt: iso(-44, 10) },
  { id: "lg-04", userId: "pv-intern-2", kpiPeriodId: "kpi-2026-09", type: "kpi_earning", amount: 540000, unit: "VND", description: "Thu nhập KPI kỳ 09/2026 (Đỗ Thuần Minh)", createdAt: iso(-31, 8) },
  { id: "lg-05", userId: "pv-intern-1", kpiPeriodId: "kpi-2026-09", type: "kpi_earning", amount: 720000, unit: "VND", description: "Thu nhập KPI kỳ 09/2026", createdAt: iso(-31, 8) },
  { id: "lg-06", userId: "pv-intern-1", kpiPeriodId: null, type: "adjustment", amount: 30000, unit: "VND", description: "Điều chỉnh thủ công sau khi soát lại rubric", createdAt: iso(-12, 14) },
  { id: "lg-07", userId: "pv-intern-1", kpiPeriodId: null, type: "reversal", amount: -30000, unit: "VND", description: "Hoàn đảo điều chỉnh lg-06 (nhập nhầm số liệu)", createdAt: iso(-11, 9) },
  { id: "lg-08", userId: "pv-intern-1", kpiPeriodId: "kpi-2026-10", type: "kpi_earning", amount: 780000, unit: "VND", description: "Thu nhập KPI kỳ 10/2026", createdAt: iso(-2, 8) },
];

/* ------------------------------ L) Hiệu suất ------------------------------ */

export const PERFORMANCE_MEMBERS = [
  { userId: "pv-intern-1", displayName: "Nguyễn An Khang", totalTaskCount: 24, completedTaskCount: 15, taskCompletionRate: 62.5, storyPointCompletionRate: 62.5, averageEvaluationScore: 84, rank: 1 },
  { userId: "u-intern-5", displayName: "Lý Thu Trang", totalTaskCount: 22, completedTaskCount: 16, taskCompletionRate: 72.7, storyPointCompletionRate: 70, averageEvaluationScore: 79.5, rank: 2 },
  { userId: "pv-intern-2", displayName: "Đỗ Thuần Minh", totalTaskCount: 24, completedTaskCount: 6, taskCompletionRate: 25, storyPointCompletionRate: 28.6, averageEvaluationScore: 71, rank: 3 },
  { userId: "u-intern-6", displayName: "Hoàng Gia Bảo", totalTaskCount: 18, completedTaskCount: 9, taskCompletionRate: 50, storyPointCompletionRate: 48.3, averageEvaluationScore: null, rank: 4 },
  { userId: "pv-intern-4", displayName: "Trịnh Khả Nhi", totalTaskCount: 24, completedTaskCount: 2, taskCompletionRate: 8.3, storyPointCompletionRate: 6.7, averageEvaluationScore: null, rank: 5 },
  { userId: "pv-intern-3", displayName: "Phạm Tân Sinh", totalTaskCount: 0, completedTaskCount: 0, taskCompletionRate: null, storyPointCompletionRate: null, averageEvaluationScore: null },
];

export function studentDetailPayload(userId: string, page: number) {
  const person =
    SESSION_MEMBERS.find((m) => m.userId === userId) ??
    { userId, displayName: "Nguyễn An Khang", email: "sinhvien1@vintern.preview" };
  const tasks = [
    { id: "ts-20", code: "TS-20", title: "API trả sách quá hạn", status: "review", dueDate: iso(2, 17), sprintName: "Sprint 03 — Mượn/trả sách", sessionId: "ss-f26", submissionId: "sub-1", submissionStatus: "submitted", headSha: "9f2c1ab", instructorScore: null, instructorFeedback: null, aiReviewStatus: "awaiting_instructor", aiScore: 82, aiSummary: "API trả sách đúng bậc phí; thiếu một nhánh kiểm thử biên." },
    { id: "ts-19", code: "TS-19", title: "Tìm kiếm tài liệu theo kho", status: "done", dueDate: iso(-3, 17), sprintName: "Sprint 03 — Mượn/trả sách", sessionId: "ss-f26", submissionId: "sub-2", submissionStatus: "approved", headSha: "5ab90d2", instructorScore: 8.5, instructorFeedback: "Ổn, chú ý index trùng lặp.", aiReviewStatus: "needs_changes", aiScore: 74, aiSummary: "Thiếu kiểm thử cho kho đặc biệt." },
    { id: "ts-18", code: "TS-18", title: "API mượn sách theo thẻ", status: "done", dueDate: iso(-5, 17), sprintName: "Sprint 03 — Mượn/trả sách", sessionId: "ss-f26", submissionId: "sub-3", submissionStatus: "approved", headSha: "c31f7e8", instructorScore: 9, instructorFeedback: null, aiReviewStatus: null, aiScore: 88, aiSummary: null },
    { id: "ts-21", code: "TS-21", title: "Đăng ký mượn trước", status: "doing", dueDate: iso(5, 17), sprintName: "Sprint 03 — Mượn/trả sách", sessionId: "ss-f26", submissionId: null, submissionStatus: null, headSha: null, instructorScore: null, instructorFeedback: null, aiReviewStatus: null, aiScore: null, aiSummary: null },
    { id: "ts-23", code: "TS-23", title: "Thống kê mượn theo tháng", status: "todo", dueDate: iso(9, 17), sprintName: "Sprint 03 — Mượn/trả sách", sessionId: "ss-f26", submissionId: null, submissionStatus: null, headSha: null, instructorScore: null, instructorFeedback: null, aiReviewStatus: null, aiScore: null, aiSummary: null },
    { id: "ts-11", code: "TS-11", title: "Khung tra cứu tài liệu theo kho", status: "done", dueDate: iso(-20, 17), sprintName: "Sprint 02 — Định danh tài liệu", sessionId: "ss-f26", submissionId: "sub-4", submissionStatus: "approved", headSha: "88de1c4", instructorScore: 8, instructorFeedback: null, aiReviewStatus: null, aiScore: 80, aiSummary: null },
  ];
  const start = (Math.max(1, page) - 1) * 10;
  return {
    profile: { id: userId, displayName: person.displayName, email: person.email, selectedRole: "frontend" },
    interview: null,
    metrics: {
      totalTaskCount: 24,
      completedTaskCount: 15,
      taskCompletionRate: 62.5,
      committedStoryPoints: 48,
      completedStoryPoints: 30,
      storyPointCompletionRate: 62.5,
      onTimeCompletionRate: 86.7,
      overdueOpenTaskCount: 1,
      averageEvaluationScore: 84,
      finalizedEvaluationCount: 1,
      activeSprintProgress: 58,
    },
    assignments: [
      { id: "asg-1", projectId: "prj-lib", projectName: "Hệ thống quản lý thư viện số", sessionId: "ss-f26", sessionName: "Kỳ thực tập Thu 2026", roleInProject: "frontend", status: "active" },
    ],
    tasks: { total: tasks.length, page: Math.max(1, page), pageSize: 10, items: tasks.slice(start, start + 10) },
    trend: [
      { month: "2026-06", created: 8, completed: 6 },
      { month: "2026-07", created: 10, completed: 9 },
      { month: "2026-08", created: 9, completed: 7 },
      { month: "2026-09", created: 11, completed: 8 },
      { month: "2026-10", created: 12, completed: 10 },
    ],
  };
}

/* ------------------------------ M) Ngân hàng câu hỏi --------------------- */

export const BANK_QUESTIONS = [
  { id: "qb-1", roleCode: "frontend", phase: "technical", difficulty: "medium", language: "vi", prompt: "Giải thích khác biệt giữa useMemo và useCallback; khi nào không nên dùng?", expectedConcepts: ["memoization", "referential equality"], exampleAnswer: "useMemo ghi nhớ giá trị tính toán, useCallback ghi nhớ hàm; tránh dùng khi tính toán rẻ hoặc_dependency đổi liên tục.", scoringRubric: "Điểm 0-100: đúng khái niệm 40, ví dụ 30, cảnh giác lạm dụng 30.", followUpHints: ["React Compiler thay đổi gì?"], tags: ["react", "hooks"], isActive: true, sortOrder: 1, version: 3, updatedAt: iso(-5) },
  { id: "qb-2", roleCode: "frontend", phase: "introduction", difficulty: "easy", language: "vi", prompt: "Giới thiệu bản thân trong 1 phút theo cấu trúc STAR rút gọn.", expectedConcepts: ["context", "action", "result"], exampleAnswer: "Tôi là X, đã làm dự án Y, đảm nhiệm Z, kết quả T.", scoringRubric: "Cấu trúc 40, rõ ràng 30, thời lượng 30.", followUpHints: [], tags: ["soft-skill"], isActive: true, sortOrder: 2, version: 1, updatedAt: iso(-30) },
  { id: "qb-3", roleCode: "backend", phase: "technical", difficulty: "hard", language: "vi", prompt: "Thiết kế API trả sách quá hạn: bảng giá phí trễ bậc ngày + giao dịch bù trừ. Nêu cách chống double-booking.", expectedConcepts: ["idempotency", "transaction", " locking"], exampleAnswer: "Dùng transaction + unique constraint trên line_id; idempotency key cho POST /returns.", scoringRubric: "Thiết kế 50, kiểm thử 30, an toàn 20.", followUpHints: ["Nếu Redis die thì sao?"], tags: ["nestjs", "postgresql"], isActive: true, sortOrder: 3, version: 2, updatedAt: iso(-12) },
  { id: "qb-4", roleCode: "backend", phase: "english", difficulty: "medium", language: "en", prompt: "Describe a production incident you handled and the follow-up actions.", expectedConcepts: ["incident response", "postmortem"], exampleAnswer: "A slow query timed out; I added an index, set an alert, and wrote a postmortem.", scoringRubric: "Fluency 40, structure 30, vocabulary 30.", followUpHints: [], tags: ["english"], isActive: true, sortOrder: 4, version: 1, updatedAt: iso(-20) },
  { id: "qb-5", roleCode: "fullstack", phase: "communication", difficulty: "easy", language: "vi", prompt: "Đồng nghiệp chậm phản hồi PR của bạn; xử lý thế nào?", expectedConcepts: ["empathy", "escalation"], exampleAnswer: "Nhắc nhẹ, hẹn giờ pair review, nếu cần đề cập với lead.", scoringRubric: "Ứng xử 50, quy trình 50.", followUpHints: ["Nếu lead cũng bận?"], tags: ["teamwork"], isActive: true, sortOrder: 5, version: 1, updatedAt: iso(-8) },
  { id: "qb-6", roleCode: "qa", phase: "technical", difficulty: "medium", language: "vi", prompt: "Viết kịch bản kiểm thử cho hàng đợi đặt chỗ FIFO (3 user, 1 tài liệu).", expectedConcepts: ["edge case", "assertion"], exampleAnswer: "Mượn tài liệu, 3 user đặt chỗ lần lượt, hoàn tài liệu, kiểm tra thứ tự nhận.", scoringRubric: "Độ phủ 40, biên 30, tự động hoá 30.", followUpHints: ["Race condition?"], tags: ["testing"], isActive: true, sortOrder: 6, version: 1, updatedAt: iso(-2) },
  { id: "qb-7", roleCode: "frontend", phase: "english", difficulty: "easy", language: "en", prompt: "Explain your favorite CSS layout technique and a pitfall.", expectedConcepts: ["flexbox", "grid"], exampleAnswer: "Grid for two-dimensional layout; pitfall is implicit row sizing.", scoringRubric: "Clarity 50, correctness 50.", followUpHints: [], tags: ["css", "english"], isActive: true, sortOrder: 7, version: 1, updatedAt: iso(-15) },
  { id: "qb-8", roleCode: "business_analyst", phase: "introduction", difficulty: "medium", language: "vi", prompt: "Tóm tắt yêu cầu nghiệp vụ cho luồng trả sách quá hạn trong 5 câu.", expectedConcepts: ["requirement", "stakeholder"], exampleAnswer: "Độc giả trả trễ; hệ thống tính phí theo bậc; thủ thư đối soát; báo cáo tháng.", scoringRubric: "Đủ ý 40, ngắn gọn 30, đúng bên liên quan 30.", followUpHints: [], tags: ["analysis"], isActive: false, sortOrder: 8, version: 2, updatedAt: iso(-40) },
  { id: "qb-9", roleCode: "fullstack", phase: "technical", difficulty: "medium", language: "vi", prompt: "Đưa ra cách chia Backend/Frontend cho màn hình mượn sách và lỗi hiển thị.", expectedConcepts: ["api contract", "error state"], exampleAnswer: "API trả lỗi chuẩn RFC7807, FE map mã lỗi sang thông điệp tiếng Việt.", scoringRubric: "Kiến trúc 40, lỗi 30, kiểm thử 30.", followUpHints: ["Toast hay inline error?"], tags: ["architecture"], isActive: true, sortOrder: 9, version: 1, updatedAt: iso(-7) },
  { id: "qb-10", roleCode: "qa", phase: "communication", difficulty: "hard", language: "vi", prompt: "Báo cáo bug cho giảng viên đang bận: viết lại tin nhắn mẫu.", expectedConcepts: ["repro steps", "severity"], exampleAnswer: "Mô tả bước tái hiện, mức nghiêm trọng, môi trường, kèm screenshot.", scoringRubric: "Rõ ràng 50, đầy đủ thông tin 50.", followUpHints: [], tags: ["reporting"], isActive: true, sortOrder: 10, version: 1, updatedAt: iso(-18) },
];

export function questionCoverage() {
  const map = new Map<string, number>();
  for (const q of BANK_QUESTIONS) {
    const key = `${q.roleCode}:${q.phase}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([key, count]) => {
    const [roleCode, phase] = key.split(":");
    return { roleCode, phase, count };
  });
}

/* ------------------------------ O) Báo cáo -------------------------------- */

export const REPORT_LIST = [
  { id: "rp-1", title: "Tiến độ phiên Thu 2026", kind: "progress", projectId: "prj-lib", projectName: "Hệ thống quản lý thư viện số", createdAt: iso(-1, 8) },
  { id: "rp-2", title: "Hiệu suất sprint 03", kind: "performance", projectId: "prj-lib", projectName: "Hệ thống quản lý thư viện số", createdAt: iso(-2, 9) },
  { id: "rp-3", title: "Đánh giá giữa kỳ SS-F26", kind: "evaluation", projectId: "prj-lib", projectName: "Hệ thống quản lý thư viện số", createdAt: iso(-8, 15) },
  { id: "rp-4", title: "Chất lượng review PR sprint 03", kind: "review", projectId: "prj-lib", projectName: "Hệ thống quản lý thư viện số", createdAt: iso(-3, 10) },
  { id: "rp-5", title: "Rủi ro chậm tiến phiên Xuân 2027", kind: "risk", projectId: "prj-edu", projectName: "Ứng dụng học tiếng Việt cho trẻ em", createdAt: iso(-5, 11) },
  { id: "rp-6", title: "Tiến độ phiên Hè 2026", kind: "progress", projectId: "prj-portal", projectName: "Cổng thông tin tuyển dụng sinh viên CNTT", createdAt: iso(-40, 9) },
  { id: "rp-7", title: "Hiệu suất tổng mùa Hè", kind: "performance", projectId: "prj-portal", projectName: "Cổng thông tin tuyển dụng sinh viên CNTT", createdAt: iso(-38, 9) },
  { id: "rp-8", title: "Đánh giá cuối kỳ SS-S26", kind: "evaluation", projectId: "prj-portal", projectName: "Cổng thông tin tuyển dụng sinh viên CNTT", createdAt: iso(-35, 9) },
];

export function reportCounts() {
  const kinds = ["progress", "performance", "evaluation", "review", "risk"] as const;
  return kinds.map((kind) => {
    const count = REPORT_LIST.filter((r) => r.kind === kind).length;
    return { kind, count, recentCount: count };
  });
}

export function reportDetailPayload(id: string) {
  const meta = REPORT_LIST.find((r) => r.id === id) ?? REPORT_LIST[0];
  const members = PERFORMANCE_MEMBERS.slice(0, 5).map((m) => ({
    userId: m.userId,
    displayName: m.displayName,
    totalTaskCount: m.totalTaskCount,
    completedTaskCount: m.completedTaskCount,
    taskCompletionRate: m.taskCompletionRate,
    averageEvaluationScore: m.averageEvaluationScore,
    overdueOpenTaskCount: m.userId === "pv-intern-1" ? 1 : 0,
    submissionCount: Math.max(1, m.completedTaskCount - 2),
    approvedCount: Math.max(0, m.completedTaskCount - 4),
    reworkCount: m.userId === "pv-intern-2" ? 3 : 0,
  }));
  return {
    id: meta.id,
    title: meta.title,
    kind: meta.kind,
    projectId: meta.projectId,
    projectName: meta.projectName,
    createdAt: meta.createdAt,
    snapshot: {
      projectName: meta.projectName,
      scope: {
        projectId: meta.projectId,
        from: iso(-30),
        to: iso(0),
        sessionId: "ss-f26",
        sprintId: meta.kind === "performance" ? "sp-03" : undefined,
        studentId: meta.kind === "evaluation" ? "pv-intern-1" : undefined,
      },
      members,
      details: {
        summary: { total: 24, completed: 15, overdue: 1, blocked: 1, unassigned: 2, risk: "medium", reasons: ["1 task quá hạn mở", "2 task chưa phân công"] },
        tasks: [
          { id: "ts-20", code: "TS-20", title: "API trả sách quá hạn", status: "review", assigneeId: "pv-intern-1", assigneeName: "Nguyễn An Khang", sprintName: "Sprint 03 — Mượn/trả sách", dueDate: iso(2, 17), blocked: false, submissionStatus: "submitted", aiStatus: "awaiting_instructor", aiScore: 82, instructorScore: null },
          { id: "ts-21", code: "TS-21", title: "Đăng ký mượn trước", status: "doing", assigneeId: "pv-intern-1", assigneeName: "Nguyễn An Khang", sprintName: "Sprint 03 — Mượn/trả sách", dueDate: iso(5, 17), blocked: true, submissionStatus: null, aiStatus: null, aiScore: null, instructorScore: null },
          { id: "ts-24", code: "TS-24", title: "Xuất báo cáo tồn kho", status: "todo", assigneeId: null, assigneeName: null, sprintName: "Sprint 03 — Mượn/trả sách", dueDate: iso(10, 17), blocked: false, submissionStatus: null, aiStatus: null, aiScore: null, instructorScore: null },
        ],
        sprints: [
          { id: "sp-03", name: "Sprint 03 — Mượn/trả sách", status: "active", total: 8, completed: 5, overdue: 1, blocked: 1 },
          { id: "sp-02", name: "Sprint 02 — Định danh tài liệu", status: "completed", total: 8, completed: 8, overdue: 0, blocked: 0 },
        ],
        timeline: [
          { taskId: "ts-20", taskCode: "TS-20", toStatus: "review", createdAt: iso(-2, 16) },
          { taskId: "ts-19", taskCode: "TS-19", toStatus: "done", createdAt: iso(-3, 14) },
          { taskId: "ts-18", taskCode: "TS-18", toStatus: "done", createdAt: iso(-5, 15) },
        ],
      },
    },
  };
}

/* ------------------------------ Q) Phiên thực tập ------------------------- */

export const SESSION_ROWS = [
  {
    id: "ss-f26", code: "SS-F26", name: "Kỳ thực tập Thu 2026", status: "active",
    domainCategory: "library", description: "Phiên thực tập chính 2026 với dự án thư viện số.",
    startDate: iso(-30), endDate: iso(60), leadInstructorId: "pv-inst-1", mentorId: "pv-inst-1",
    difficulty: "intermediate", capacity: 6, technologies: ["Next.js", "NestJS", "PostgreSQL", "Redis"],
  },
  {
    id: "ss-s26", code: "SS-S26", name: "Kỳ thực tập Hè 2026", status: "completed",
    domainCategory: "portal", description: "Phiên Hè với cổng thông tin tuyển dụng.",
    startDate: iso(-150), endDate: iso(-40), leadInstructorId: "pv-inst-1", mentorId: "pv-inst-1",
    difficulty: "intermediate", capacity: 5, technologies: ["Next.js", "NestJS", "PostgreSQL"],
  },
  {
    id: "ss-w27", code: "SS-W27", name: "Kỳ thực tập Xuân 2027", status: "upcoming",
    domainCategory: "education", description: "Phiên kế hoạch cho ứng dụng học tiếng Việt trẻ em.",
    startDate: iso(40), endDate: iso(130), leadInstructorId: "pv-inst-2", mentorId: "pv-inst-2",
    difficulty: "advanced", capacity: 5, technologies: ["React Native", "NestJS"],
  },
];

export const SESSION_MILESTONES = [
  { id: "ms-1", title: "Khung dự án chạy được", status: "completed", dueDate: iso(-18) },
  { id: "ms-2", title: "Định danh tài liệu hoàn tất", status: "completed", dueDate: iso(-8) },
  { id: "ms-3", title: "Luồng mượn/trả end-to-end", status: "in_progress", dueDate: iso(12) },
  { id: "ms-4", title: "Báo cáo & demo cuối kỳ", status: "pending", dueDate: iso(50) },
];

export const SESSION_SPRINT_PROGRESS = [
  { id: "sp-01", status: "completed", taskTotal: 8, taskDone: 8, taskReview: 0 },
  { id: "sp-02", status: "completed", taskTotal: 8, taskDone: 8, taskReview: 0 },
  { id: "sp-03", status: "active", taskTotal: 8, taskDone: 5, taskReview: 1 },
];

export const SESSION_TIMELINE = [
  { id: "tl-1", action: "session.started", summary: "Phiên Thu 2026 chính thức bắt đầu.", createdAt: iso(-30, 8), actorName: "Lê Thị Giang" },
  { id: "tl-2", action: "assignment.created", summary: "Phân công Nguyễn An Khang vào dự án thư viện.", createdAt: iso(-30, 10), actorName: "Lê Thị Giang" },
  { id: "tl-3", action: "sprint.published", summary: "Phát hành Sprint 02 — Định danh tài liệu.", createdAt: iso(-27, 15), actorName: "Lê Thị Giang" },
  { id: "tl-4", action: "milestone.completed", summary: "Khung dự án chạy được (milestone 1).", createdAt: iso(-18, 17), actorName: "Hệ thống" },
  { id: "tl-5", action: "sprint.published", summary: "Phát hành Sprint 03 — Mượn/trả sách.", createdAt: iso(-7, 9), actorName: "Lê Thị Giang" },
  { id: "tl-6", action: "submission.created", summary: "Nguyễn An Khang nộp bài TS-20.", createdAt: iso(-1, 11), actorName: "Nguyễn An Khang" },
];

export function sessionWorkPayload() {
  const rows = [
    {
      id: "ts-20", code: "TS-20", title: "API trả sách quá hạn", description: "Tính phí trễ theo bậc ngày, ghi nhận giao dịch bù trừ.",
      storyPoints: 5, status: "review", priority: "high", progress: 70, dueDate: iso(2, 17), assigneeId: "pv-intern-1", projectId: "prj-lib", sprintId: "sp-03", version: 2,
      delivery: {
        blocked: false,
        submission: { id: "sub-1", status: "submitted", prUrl: "https://github.com/vintern-2026/library-system/pull/48", headSha: "9f2c1ab", submittedAt: iso(-1, 11), aiStatus: "awaiting_instructor", aiScore: 82, aiSummary: "API trả sách đúng bậc phí; thiếu một nhánh kiểm thử biên.", instructorScore: null, instructorFeedback: null },
      },
    },
    {
      id: "ts-21", code: "TS-21", title: "Đăng ký mượn trước", description: "Đặt chỗ tài liệu đang được mượn, hàng đợi FIFO.",
      storyPoints: 8, status: "doing", priority: "high", progress: 40, dueDate: iso(5, 17), assigneeId: "pv-intern-1", projectId: "prj-lib", sprintId: "sp-03", version: 1,
      delivery: { blocked: true, submission: null },
    },
    {
      id: "ts-19", code: "TS-19", title: "Tìm kiếm tài liệu theo kho", description: "Bộ lọc theo kho sách đặc biệt và kho chung.",
      storyPoints: 3, status: "done", priority: "medium", progress: 100, dueDate: iso(-3, 17), assigneeId: "pv-intern-1", projectId: "prj-lib", sprintId: "sp-03", version: 2,
      delivery: {
        blocked: false,
        submission: { id: "sub-2", status: "approved", prUrl: "https://github.com/vintern-2026/library-system/pull/45", headSha: "5ab90d2", submittedAt: iso(-3, 14), aiStatus: "needs_changes", aiScore: 74, aiSummary: "Thiếu kiểm thử cho kho đặc biệt.", instructorScore: 8.5, instructorFeedback: "Ổn, chú ý index trùng lặp." },
      },
    },
    {
      id: "ts-24", code: "TS-24", title: "Xuất báo cáo tồn kho", description: null,
      storyPoints: 3, status: "todo", priority: "low", progress: 0, dueDate: iso(10, 17), assigneeId: "pv-intern-1", projectId: "prj-lib", sprintId: "sp-03", version: 1,
      delivery: null,
    },
    {
      id: "ts-12", code: "TS-12", title: "Trang chi tiết tài liệu", description: null,
      storyPoints: 3, status: "done", priority: "low", progress: 100, dueDate: iso(-18, 17), assigneeId: "pv-intern-1", projectId: "prj-lib", sprintId: "sp-02", version: 2,
      delivery: null,
    },
  ];
  return rows;
}

/* ------------------------------ R) Dự án ---------------------------------- */

export const PROJECT_ROWS = [
  {
    id: "prj-lib", code: "PRJ-LIB", name: "Hệ thống quản lý thư viện số", status: "active",
    domainCategory: "library", description: "Dự án xây dựng hệ thống quản lý thư viện số với tra cứu, mượn trả và báo cáo theo chuẩn MARC21.",
    startDate: iso(-30), endDate: iso(60), mentorId: "pv-inst-1", difficulty: "intermediate", capacity: 6,
    technologies: ["Next.js", "NestJS", "PostgreSQL", "Redis"],
  },
  {
    id: "prj-portal", code: "PRJ-PORTAL", name: "Cổng thông tin tuyển dụng sinh viên CNTT", status: "completed",
    domainCategory: "portal", description: "Cổng thông tin việc làm cho sinh viên CNTT với luồng nộp CV.",
    startDate: iso(-150), endDate: iso(-40), mentorId: "pv-inst-1", difficulty: "intermediate", capacity: 5,
    technologies: ["Next.js", "NestJS", "PostgreSQL"],
  },
  {
    id: "prj-edu", code: "PRJ-EDU", name: "Ứng dụng học tiếng Việt cho trẻ em", status: "draft",
    domainCategory: "education", description: "Ứng dụng học chữ và từ vựng tiếng Việt cho trẻ 5-8 tuổi.",
    startDate: iso(40), endDate: iso(130), mentorId: "pv-inst-2", difficulty: "advanced", capacity: 4,
    technologies: ["React Native", "NestJS"],
  },
  {
    id: "prj-blog", code: "PRJ-BLOG", name: "Nền tảng blog kỹ thuật nội bộ", status: "archived",
    domainCategory: "portal", description: "Blog nội bộ chia sẻ kỹ thuật các phiên thực tập.",
    startDate: iso(-200), endDate: iso(-120), mentorId: "pv-inst-2", difficulty: "beginner", capacity: 3,
    technologies: ["Astro"],
  },
];

export const PROJECT_SLOTS = [
  { roleCode: "frontend", requiredCount: 2, filledCount: 1, members: [{ userId: "pv-intern-1", displayName: "Nguyễn An Khang" }] },
  { roleCode: "backend", requiredCount: 2, filledCount: 1, members: [{ userId: "pv-intern-2", displayName: "Đỗ Thuần Minh" }] },
  { roleCode: "qa", requiredCount: 1, filledCount: 1, members: [{ userId: "pv-intern-4", displayName: "Trịnh Khả Nhi" }] },
  { roleCode: "fullstack", requiredCount: 1, filledCount: 1, members: [{ userId: "u-intern-5", displayName: "Lý Thu Trang" }] },
];

export const PROJECT_SESSIONS = [
  { id: "ss-f26", code: "SS-F26", name: "Kỳ thực tập Thu 2026", status: "active", startDate: iso(-30), endDate: iso(60), memberCount: 6 },
  { id: "ss-s26", code: "SS-S26", name: "Kỳ thực tập Hè 2026", status: "completed", startDate: iso(-150), endDate: iso(-40), memberCount: 5 },
];

export function projectTemplateContextPayload() {
  return {
    definition: templateDefinition(),
    templateVersion: 2,
  };
}

/* ------------------------------ T) Sprint quản trị ------------------------- */

export const SPRINT_ROWS = [
  { id: "sp-01", code: "SP-01", name: "Sprint 01 — Khung dự án", status: "completed", projectId: "prj-lib", sessionId: "ss-f26", startDate: iso(-47), endDate: iso(-28), description: "Dựng khung dự án và chuẩn hoá repo.", goal: "Repo chạy được CI xanh.", progress: 100 },
  { id: "sp-02", code: "SP-02", name: "Sprint 02 — Định danh tài liệu", status: "completed", projectId: "prj-lib", sessionId: "ss-f26", startDate: iso(-27), endDate: iso(-8), description: "Định danh và tra cứu tài liệu MARC21.", goal: "Tra cứu theo kho hoạt động.", progress: 100 },
  { id: "sp-03", code: "SP-03", name: "Sprint 03 — Mượn/trả sách", status: "active", projectId: "prj-lib", sessionId: "ss-f26", startDate: iso(-7), endDate: iso(7), description: "Tập trung vào API mượn/trả, hàng đợi đặt chỗ và báo cáo tồn kho.", goal: "Hoàn chỉnh luồng mượn/trả và đặt chỗ tài liệu.", progress: 58 },
  { id: "sp-04", code: "SP-04", name: "Sprint 04 — Báo cáo & demo", status: "planned", projectId: "prj-lib", sessionId: "ss-f26", startDate: iso(8), endDate: iso(28), description: "Báo cáo tồn kho, thống kê và chuẩn bị demo cuối kỳ.", goal: "Demo end-to-end cho ban giám hiệu.", progress: 0 },
];

export function sprintBurndownPayload(sprintId: string) {
  const days = sprintId === "sp-03" ? 14 : 20;
  const totalPoints = sprintId === "sp-03" ? 34 : 40;
  // sp-03 đang chạy: hôm nay là ngày 7/14; sprint cũ chạy hết chu kỳ.
  const todayIndex = sprintId === "sp-03" ? 7 : days;
  const burnRate = sprintId === "sp-03" ? 0.75 : 1;
  const round = (v: number) => Math.round(v * 10) / 10;
  return Array.from({ length: days + 1 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7 + i);
    const ideal = round((totalPoints * (days - i)) / days);
    const actual = i > todayIndex
      ? null
      : round(Math.max(0, totalPoints - (totalPoints / days) * burnRate * i));
    return { date: date.toISOString(), actual, ideal };
  });
}

/* ------------------------------ V) Kế hoạch AI ---------------------------- */

export const PLAN_SUMMARIES = [
  { planId: "plan-771", projectId: "prj-lib", sessionId: "ss-f26", templateVersion: 2, status: "published", createdAt: iso(-47), sprintCount: 3, taskCount: 24, hasDraft: false },
  { planId: "plan-772", projectId: "prj-lib", sessionId: "ss-f26", templateVersion: 2, status: "draft", createdAt: iso(-1, 10), sprintCount: 1, taskCount: 8, hasDraft: true },
];

export function plannedTasks() {
  return [
    { key: "t-returns-api", title: "API trả sách quá hạn", description: "Tính phí trễ theo bậc ngày, ghi giao dịch bù trừ.", priority: "high", storyPoints: 5, dueDate: iso(2, 17), suggestedRole: "backend", assigneeId: "pv-intern-1", dependsOn: [], estimatedHours: 12, skillTags: ["nestjs", "finance"], complexity: "intermediate", acceptanceCriteria: ["Endpoint POST /returns đúng bậc phí", "Giao dịch bù trừ vào sổ ảo", "Unit test phủ mọi bậc"] },
    { key: "t-reserve-queue", title: "Đăng ký mượn trước", description: "Hàng đợi FIFO cho tài liệu đang mượn.", priority: "high", storyPoints: 8, dueDate: iso(5, 17), suggestedRole: "backend", assigneeId: "pv-intern-1", dependsOn: ["t-returns-api"], estimatedHours: 16, skillTags: ["nestjs", "queue"], complexity: "intermediate", acceptanceCriteria: ["Đặt chỗ đúng thứ tự FIFO", "Thông báo khi có lượt"] },
    { key: "t-inventory-report", title: "Xuất báo cáo tồn kho", description: "Xuất xlsx tồn kho theo danh mục.", priority: "medium", storyPoints: 3, dueDate: iso(10, 17), suggestedRole: "fullstack", assigneeId: "u-intern-5", dependsOn: [], estimatedHours: 6, skillTags: ["xlsx"], complexity: "beginner", acceptanceCriteria: ["Tệp xlsx đúng cột", "Lọc theo kho"] },
    { key: "t-borrow-stats", title: "Thống kê mượn theo tháng", description: "Dashboard mượn/trả theo tháng.", priority: "medium", storyPoints: 5, dueDate: iso(9, 17), suggestedRole: "frontend", assigneeId: "pv-intern-2", dependsOn: [], estimatedHours: 10, skillTags: ["charts"], complexity: "intermediate", acceptanceCriteria: ["Biểu đồ đúng dữ liệu", "Lọc tháng"] },
  ];
}

export function planDraftBody() {
  return {
    sprints: [
      { code: "SP-03", name: "Sprint 03 — Mượn/trả sách", goal: "Hoàn chỉnh luồng mượn/trả.", startDate: iso(-7), endDate: iso(7), tasks: plannedTasks() },
      { code: "SP-04", name: "Sprint 04 — Báo cáo & demo", goal: "Báo cáo tồn kho và demo.", startDate: iso(8), endDate: iso(28), tasks: plannedTasks().slice(2) },
    ],
    milestones: [
      { key: "m-borrow", title: "Luồng mượn/trả end-to-end", dueDate: iso(12), taskKeys: ["t-returns-api", "t-reserve-queue"] },
      { key: "m-demo", title: "Demo cuối kỳ", dueDate: iso(50), taskKeys: ["t-inventory-report"] },
    ],
  };
}

export function planDetailPayload(planId: string) {
  const summary = PLAN_SUMMARIES.find((p) => p.planId === planId) ?? PLAN_SUMMARIES[1];
  return {
    planId: summary.planId,
    projectId: summary.projectId,
    sessionId: summary.sessionId,
    templateVersion: summary.templateVersion,
    status: summary.status,
    createdAt: summary.createdAt,
    sprintCount: null,
    taskCount: null,
    hasDraft: summary.hasDraft,
    draft: summary.hasDraft ? planDraftBody() : null,
    warnings: [{ taskTitle: "Đăng ký mượn trước", message: "Hạn nhiệm vụ lệch 1 ngày so với cuối sprint." }],
    error: null,
    deduped: false,
  };
}

/* ------------------------------ W) Bản dựng dự án ------------------------- */

function templateDefinition() {
  return {
    name: "Hệ thống quản lý thư viện số",
    category: "library",
    difficulty: "intermediate",
    teamSize: 6,
    sprintCount: 4,
    techStack: ["Next.js", "NestJS", "PostgreSQL", "Redis"],
    roles: ["frontend", "backend", "qa", "fullstack"],
    learningPackage: {
      schemaVersion: 1,
      prerequisites: ["TypeScript cơ bản", "REST API", "SQL cơ bản"],
      setup: "Cài Node 20, PostgreSQL 16 rồi nạp seed ở scripts/seed.sql.",
      run: "npm ci && npm run dev — mở http://localhost:3000.",
      starterFiles: [
        { path: "README.md", content: "# Library System\nDự án mẫu cho phiên thực tập." },
        { path: "src/main.ts", content: "console.log('library starter');" },
        { path: "src/returns/fee.ts", content: "export const feeTiers = [0, 2000, 5000, 10000];" },
      ],
      sampleData: [{ path: "data/sample.json", content: "{\"items\":3}" }],
    },
  };
}

export const TEMPLATE_SUMMARIES = [
  { id: "tpl-lib", code: "TPL-LIB", name: "Hệ thống quản lý thư viện số", category: "library", difficulty: "intermediate", status: "active", version: 2, techStack: ["Next.js", "NestJS", "PostgreSQL", "Redis"], roles: ["frontend", "backend", "qa", "fullstack"], teamSize: 6, sprintCount: 4, createdAt: iso(-120) },
  { id: "tpl-portal", code: "TPL-PORTAL", name: "Cổng thông tin tuyển dụng", category: "portal", difficulty: "intermediate", status: "active", version: 1, techStack: ["Next.js", "NestJS", "PostgreSQL"], roles: ["frontend", "backend"], teamSize: 5, sprintCount: 3, createdAt: iso(-150) },
  { id: "tpl-edu", code: "TPL-EDU", name: "Ứng dụng học tiếng Việt", category: "education", difficulty: "advanced", status: "draft", version: 1, techStack: ["React Native", "NestJS"], roles: ["frontend", "backend", "qa"], teamSize: 4, sprintCount: 4, createdAt: iso(-30) },
  { id: "tpl-blog", code: "TPL-BLOG", name: "Blog kỹ thuật nội bộ", category: "portal", difficulty: "beginner", status: "archived", version: 3, techStack: ["Astro"], roles: ["frontend"], teamSize: 3, sprintCount: 2, createdAt: iso(-200) },
];

export function templateDetailPayload(id: string) {
  const summary = TEMPLATE_SUMMARIES.find((t) => t.id === id) ?? TEMPLATE_SUMMARIES[0];
  return {
    ...summary,
    archivedAt: summary.status === "archived" ? iso(-60) : null,
    definition: templateDefinition(),
    runs: [
      { id: "run-ss-f26", projectId: "prj-lib", sessionId: "ss-f26", templateVersion: 2, createdAt: iso(-30) },
      { id: "run-ss-s26", projectId: "prj-portal", sessionId: "ss-s26", templateVersion: 1, createdAt: iso(-150) },
    ],
  };
}

export function templateRevisionsPayload(id: string) {
  const total = 3;
  return {
    total,
    items: Array.from({ length: total }, (_, i) => ({
      version: total - i,
      sha256: sha256like(`tpl-${id}-v${total - i}`),
      createdAt: iso(-(i * 20 + 5)),
    })),
  };
}

export function templateRevisionDetail(id: string, version: number) {
  return {
    version,
    sha256: sha256like(`tpl-${id}-v${version}`),
    definition: templateDefinition(),
  };
}

export function templateAssessmentPayload(version: number) {
  return {
    version,
    assessment: {
      schemaVersion: 1,
      solutionFiles: [
        { path: "solution/fee.ts", content: "export function lateFee(days:number){return 0;}" },
        { path: "solution/returns.controller.ts", content: "export const returns = [];" },
      ],
      hiddenTestFiles: [
        { path: "tests/fee.spec.ts", content: "test('tiers', () => { expect(1).toBe(1); });" },
      ],
      rubric: [
        { criterion: "functional", description: "API đúng nghiệp vụ", weight: 40 },
        { criterion: "testing", description: "Kiểm thử độc lập", weight: 30 },
        { criterion: "security", description: "Không lỗ hổng rõ ràng", weight: 30 },
      ],
      taskSuites: [
        { taskKey: "returns-api", suiteId: "suite-returns-01", digest: sha256like("suite-returns-01") },
        { taskKey: "reserve-queue", suiteId: "suite-reserve-01", digest: sha256like("suite-reserve-01") },
      ],
    },
  };
}

export function learningPackagePayload() {
  return {
    templateVersion: 2,
    templateCode: "TPL-LIB",
    learningPackage: templateDefinition().learningPackage,
  };
}

/* ------------------------------ X) Đánh giá quản trị ---------------------- */

export const EVALUATION_CYCLES = [
  { id: "cycle-2026-final", code: "EV-2026-FINAL", name: "Đánh giá cuối kỳ Thu 2026", status: "open", type: "final", projectId: "prj-lib", sessionId: "ss-f26", startDate: iso(2), endDate: iso(16) },
  { id: "cycle-2026-mid", code: "EV-2026-MID", name: "Đánh giá giữa kỳ Thu 2026", status: "closed", type: "midterm", projectId: "prj-lib", sessionId: "ss-f26", startDate: iso(-14), endDate: iso(-8) },
  { id: "cycle-2026-summer", code: "EV-2026-SUM", name: "Đánh giá cuối kỳ Hè 2026", status: "archived", type: "final", projectId: "prj-portal", sessionId: "ss-s26", startDate: iso(-45), endDate: iso(-41) },
  { id: "cycle-2027-mid", code: "EV-2027-MID", name: "Đánh giá giữa kỳ Xuân 2027", status: "draft", type: "midterm", projectId: "prj-edu", sessionId: "ss-w27", startDate: iso(60), endDate: iso(70) },
];

export const EVALUATION_CRITERIA = [
  { id: "cr-quality", code: "CR-QUALITY", name: "Chất lượng mã nguồn", weight: 40, maxScore: 100, isRequired: true },
  { id: "cr-process", code: "CR-PROCESS", name: "Quy trình làm việc", weight: 30, maxScore: 100, isRequired: true },
  { id: "cr-collab", code: "CR-COLLAB", name: "Hợp tác nhóm", weight: 30, maxScore: 100, isRequired: false },
];

export const MANAGED_EVALUATIONS = [
  { id: "ev-2026-mid", cycleId: "cycle-2026-mid", internId: "pv-intern-1", evaluatorId: "pv-inst-1", status: "finalized", overallScore: 84, summary: "Tiến độ tốt, chất lượng code ổn định, cần chủ động hơn trong code review.", revisionNumber: 2 },
  { id: "ev-2026-final-draft", cycleId: "cycle-2026-final", internId: "pv-intern-1", evaluatorId: "pv-inst-1", status: "draft", overallScore: null, summary: null, revisionNumber: 1 },
  { id: "ev-2026-mid-m2", cycleId: "cycle-2026-mid", internId: "pv-intern-2", evaluatorId: "pv-inst-1", status: "submitted", overallScore: 71, summary: "Cần cải thiện nhịp nộp bài và viết kiểm thử.", revisionNumber: 3 },
  { id: "ev-2026-mid-t5", cycleId: "cycle-2026-mid", internId: "u-intern-5", evaluatorId: "pv-inst-1", status: "finalized", overallScore: 79.5, summary: "Ổn định, giao tiếp tốt.", revisionNumber: 1 },
  { id: "ev-2026-final-m2", cycleId: "cycle-2026-final", internId: "pv-intern-2", evaluatorId: "pv-inst-1", status: "draft", overallScore: null, summary: null, revisionNumber: 1 },
  { id: "ev-2026-final-n4", cycleId: "cycle-2026-final", internId: "pv-intern-4", evaluatorId: "pv-inst-1", status: "submitted", overallScore: 55, summary: "Khối lượng hoàn thành thấp trong kỳ.", revisionNumber: 2 },
  { id: "ev-2026-summer", cycleId: "cycle-2026-summer", internId: "u-intern-6", evaluatorId: "pv-inst-2", status: "finalized", overallScore: 82, summary: "Hoàn thành tốt cổng thông tin.", revisionNumber: 1 },
  { id: "ev-2027-mid-d", cycleId: "cycle-2027-mid", internId: "u-intern-6", evaluatorId: "pv-inst-2", status: "draft", overallScore: null, summary: null, revisionNumber: 1 },
];

export function evaluationDetailPayload(id: string) {
  const base = MANAGED_EVALUATIONS.find((e) => e.id === id) ?? MANAGED_EVALUATIONS[1];
  return {
    evaluation: base,
    scores: base.status === "draft" && base.overallScore === null
      ? []
      : EVALUATION_CRITERIA.map((c, i) => ({
        criterionId: c.id,
        score: [86, 82, 85][i] ?? 80,
        comment: ["Kiểm thử độc lập đạt, còn vài cảnh báo lint.", "Commit đều, mô tả task rõ.", "Tham gia review tốt cho đồng nghiệp."][i] ?? null,
      })),
  };
}

export function aiSuggestionPayload() {
  return {
    suggestion: {
      summary: "Ổn định về tiến độ; chú trọng kiểm thử tích hợp cho luồng trả sách.",
      strengths: ["Nộp bài đều đặn", "Mô tả PR rõ ràng"],
      improvementAreas: ["Thêm integration test", "Giảm thời gian chờ review"],
      criterionSuggestions: [
        { criterionCode: "CR-QUALITY", suggestedScore: 84, comment: "Mã nguồn sạch, còn vài cảnh báo lint.", evidence: ["AI review TS-20 đạt 82", "24/24 test xanh"] },
        { criterionCode: "CR-PROCESS", suggestedScore: 82, comment: "Commit đều, mô tả rõ.", evidence: ["Commit mỗi 1-2 ngày"] },
        { criterionCode: "CR-COLLAB", suggestedScore: 86, comment: "Review tích cực cho đồng nghiệp.", evidence: ["12 lượt review sprint này"] },
      ],
    },
  };
}

export const AI_SUGGESTION_ROWS = [
  { id: "ais-1", status: "generated", generatedAt: iso(-1, 10), suggestion: aiSuggestionPayload().suggestion },
  { id: "ais-2", status: "accepted", generatedAt: iso(-6, 15), suggestion: aiSuggestionPayload().suggestion },
];

/* ------------------------------ Y) Review nhập từ ngoài ------------------- */

export const IMPORTED_REVIEWS = [
  { id: "ir-1", projectId: "prj-lib", studentId: "pv-intern-1", sourceImage: "github:library-system", title: "PR #48 — API trả sách", displayName: "Nguyễn An Khang", projectName: "Hệ thống quản lý thư viện số", prNumber: 48, score: 82, status: "passed", feedback: "Đúng bậc phí, còn thiếu 1 test biên.", occurredAt: iso(-1, 12), version: 1 },
  { id: "ir-2", projectId: "prj-lib", studentId: "pv-intern-2", sourceImage: "github:library-system", title: "PR #45 — Tìm kiếm theo kho", displayName: "Đỗ Thuần Minh", projectName: "Hệ thống quản lý thư viện số", prNumber: 45, score: 74, status: "needs_review", feedback: null, occurredAt: iso(-3, 14), version: 1 },
  { id: "ir-3", projectId: "prj-lib", studentId: "pv-intern-4", sourceImage: "github:library-system", title: "PR #31 — Smoke test mượn sách", displayName: "Trịnh Khả Nhi", projectName: "Hệ thống quản lý thư viện số", prNumber: 31, score: 45, status: "failed", feedback: "Kịch bản không phủ luồng chính.", occurredAt: iso(-9, 10), version: 2 },
  { id: "ir-4", projectId: "prj-portal", studentId: "u-intern-6", sourceImage: "github:job-portal", title: "PR #77 — Trang việc làm", displayName: "Hoàng Gia Bảo", projectName: "Cổng thông tin tuyển dụng sinh viên CNTT", prNumber: 77, score: 88, status: "passed", feedback: "Responsive tốt.", occurredAt: iso(-38, 9), version: 1 },
  { id: "ir-5", projectId: "prj-lib", studentId: "u-intern-5", sourceImage: "github:library-system", title: "PR #52 — Xuất tồn kho", displayName: "Lý Thu Trang", projectName: "Hệ thống quản lý thư viện số", prNumber: 52, score: 79, status: "needs_review", feedback: null, occurredAt: iso(-2, 16), version: 1 },
  { id: "ir-6", projectId: "prj-portal", studentId: "u-intern-5", sourceImage: "github:job-portal", title: "PR #70 — Bộ lọc lương", displayName: "Lý Thu Trang", projectName: "Cổng thông tin tuyển dụng sinh viên CNTT", prNumber: 70, score: 66, status: "failed", feedback: "Bộ lọc sai múi giờ.", occurredAt: iso(-41, 11), version: 1 },
];

/* ------------------------------ Z) Thay người / truy cập repo ------------- */

export function replacementAdvicePayload() {
  return {
    id: "advice-551",
    aiRunId: "run-790",
    contextHash: sha256like("participation-context"),
    requiresInstructorApproval: true,
    searchLimited: false,
    advice: {
      candidateId: "u-intern-5",
      reason: "Lý Thu Trang đạt phỏng vấn fullstack và còn slot trống; khối lượng handover nhỏ nhất.",
      evidenceRefs: ["kpi-res-103", "ir-4"],
      limitations: ["Điểm KPI tháng 10 thấp hơn trung bình nhóm", "Chưa từng làm module mượn sách"],
    },
    candidates: [
      { userId: "u-intern-5", displayName: "Lý Thu Trang", roleCode: "fullstack", overallScore: 77, technicalScore: 74, strengths: ["Kiểm thử tốt", "Học nhanh"], weaknesses: ["Kinh nghiệm queue ít"], evaluatedAt: iso(-1, 7), evidenceRef: "kpi-res-103" },
      { userId: "u-intern-6", displayName: "Hoàng Gia Bảo", roleCode: "business_analyst", overallScore: 72, technicalScore: 65, strengths: ["Đặc tả rõ"], weaknesses: ["Code ít"], evaluatedAt: iso(-1, 7), evidenceRef: "ir-4" },
    ],
  };
}

export function replacementPreviewPayload() {
  return {
    id: "cmd-991",
    previewHash: sha256like("replacement-preview"),
    expiresAt: iso(0, 20),
    status: "pending",
    document: {
      schemaVersion: 1,
      preparedAt: iso(0, 8),
      handoverHours: 4,
      adviceId: "advice-551",
      sourceFingerprint: sha256like("participation-context"),
      summary: {
        sessionId: "ss-f26",
        sessionName: "Kỳ thực tập Thu 2026",
        projectId: "prj-lib",
        projectName: "Hệ thống quản lý thư viện số",
        roleCode: "frontend",
        roleName: "Frontend Developer",
        oldAssignmentId: "asg-2",
        oldInternId: "pv-intern-2",
        oldInternName: "Đỗ Thuần Minh",
        candidateId: "u-intern-5",
        candidateName: "Lý Thu Trang",
      },
      taskPlan: {
        handoverAt: iso(1, 9),
        preservedCount: 20,
        transfers: [
          { id: "ts-21", code: "TS-21", title: "Đăng ký mượn trước", status: "doing", version: 1, dueAt: iso(5, 17), handoverDueAt: iso(3, 17) },
          { id: "ts-22", code: "TS-22", title: "Gia hạn mượn online", status: "todo", version: 1, dueAt: iso(6, 17), handoverDueAt: iso(4, 17) },
        ],
      },
      warnings: ["Nhiệm vụ TS-21 đang dở 40% — cần pair 2 giờ đầu."],
    },
  };
}

export function replacementResultPayload() {
  return {
    schemaVersion: 1,
    replacementId: "rep-440",
    commandId: "cmd-991",
    sessionId: "ss-f26",
    oldAssignmentId: "asg-2",
    newAssignmentId: "asg-9",
    oldInternId: "pv-intern-2",
    newInternId: "u-intern-5",
    transferredTaskIds: ["ts-21", "ts-22"],
    preservedTaskCount: 20,
    approvedById: "pv-inst-1",
    approvedAt: iso(0, 9),
    reason: "Đề xuất của Agent sau 2 vi phạm còn hiệu lực.",
    repositoryAccessQueued: true,
  };
}

export function repositoryAccessJobsPayload() {
  const items = [
    { id: "raj-1", sessionId: "ss-f26", status: "done", displayStatus: "done", errorCode: null, attempts: 1, updatedAt: iso(-30, 11), nextAttemptAt: iso(-30, 12), revision: "ra-rev-1", displayName: "Nguyễn An Khang", sessionName: "Kỳ thực tập Thu 2026", projectName: "Hệ thống quản lý thư viện số", role: "joining", outcome: "repository-member", repositoryUrl: "https://github.com/vintern-2026/library-system", retryAllowed: false },
    { id: "raj-2", sessionId: "ss-f26", status: "failed", displayStatus: "failed", errorCode: "GITHUB_INVITATION_EXPIRED", attempts: 3, updatedAt: iso(-1, 13), nextAttemptAt: iso(0, 13), revision: "ra-rev-2", displayName: "Hoàng Gia Bảo", sessionName: "Kỳ thực tập Thu 2026", projectName: "Hệ thống quản lý thư viện số", role: "joining", outcome: null, repositoryUrl: "https://github.com/vintern-2026/library-system", retryAllowed: true },
    { id: "raj-3", sessionId: "ss-f26", status: "review_required", displayStatus: "review_required", errorCode: null, attempts: 1, updatedAt: iso(-2, 15), nextAttemptAt: iso(-2, 16), revision: "ra-rev-3", displayName: "Lý Thu Trang", sessionName: "Kỳ thực tập Thu 2026", projectName: "Hệ thống quản lý thư viện số", role: "joining", outcome: "invitation-revoked", repositoryUrl: null, retryAllowed: false },
    { id: "raj-4", sessionId: "ss-s26", status: "done", displayStatus: "done", errorCode: null, attempts: 1, updatedAt: iso(-150, 9), nextAttemptAt: iso(-150, 10), revision: "ra-rev-4", displayName: "Hoàng Gia Bảo", sessionName: "Kỳ thực tập Hè 2026", projectName: "Cổng thông tin tuyển dụng sinh viên CNTT", role: "departing", outcome: "repository-removed", repositoryUrl: "https://github.com/vintern-2026/job-portal", retryAllowed: false },
  ];
  return {
    items,
    summary: [
      { status: "done", total: 2 },
      { status: "failed", total: 1 },
      { status: "review_required", total: 1 },
    ],
    limit: 5,
  };
}

/* ------------------------------ AA) Tuyển dụng "me" ----------------------- */

export function recruitmentMeProfile(accountId: string) {
  if (accountId === "pv-intern-3") {
    return {
      status: ONBOARDING_FLOW.status,
      selectedRole: ONBOARDING_FLOW.role,
      selectedRoleLabel: ONBOARDING_FLOW.roleLabel,
      attemptNumber: ONBOARDING_FLOW.interviewId ? 1 : 0,
      attemptsRemaining: 3,
      nextEligibleAt: null,
      currentInterviewSessionId: ONBOARDING_FLOW.interviewId,
      recruitedAt: ONBOARDING_FLOW.status === "passed" ? iso(0, 15) : null,
      result: ONBOARDING_FLOW.status === "passed" ? recruitmentResultPayload() : null,
    };
  }
  return {
    status: "passed",
    selectedRole: "frontend",
    selectedRoleLabel: "Frontend Developer",
    attemptNumber: 1,
    attemptsRemaining: 2,
    nextEligibleAt: null,
    currentInterviewSessionId: null,
    recruitedAt: iso(-32, 15),
    result: recruitmentResultPayload(),
  };
}

export function recruitmentResultPayload() {
  return {
    id: "res-2026-777",
    sessionId: "itv-2026-777",
    technicalScore: 78,
    softSkillScore: 82,
    overallScore: 80,
    decision: "passed",
    strengths: ["Kiến thức React tốt", "Trình bày rõ ràng"],
    weaknesses: ["Kinh nghiệm kiểm thử còn ít"],
    criteria: [
      { code: "TECH", score: 78, feedback: "Đáp ứng kiến thức frontend cơ bản đến khá." },
      { code: "SOFT", score: 82, feedback: "Giao tiếp tự tin, lắng nghe tốt." },
      { code: "ENG", score: 70, feedback: "Đọc hiểu tài liệu tiếng Anh ổn." },
    ],
    feedback: "Đạt chuẩn Frontend Developer intern; nên bổ sung kiểm thử.",
    recommendedRole: "frontend",
    model: "gemini-2.5-pro",
    promptVersion: "prompt-2026.10",
    evaluatedAt: iso(-32, 17),
  };
}

export function interviewQuestionsPayload() {
  return [
    { id: "q-1", position: 1, category: "technical", difficulty: "medium", prompt: "S khác nhau giữa useMemo và useCallback là gì?", answered: false, answeredAt: null as string | null },
    { id: "q-2", position: 2, category: "technical", difficulty: "easy", prompt: "REST API idempotent nghĩa là gì? Cho ví dụ.", answered: false, answeredAt: null as string | null },
    { id: "q-3", position: 3, category: "soft", difficulty: "easy", prompt: "Kể một lần bạn nhận phản hồi khó nghe và cách xử lý.", answered: false, answeredAt: null as string | null },
    { id: "q-4", position: 4, category: "soft", difficulty: "medium", prompt: "Bạn ưu tiên thế nào khi 2 deadline cùng lúc?", answered: false, answeredAt: null as string | null },
    { id: "q-5", position: 5, category: "technical", difficulty: "hard", prompt: "Thiết kế hàng đợi đặt chỗ FIFO — nêu cách chống race condition.", answered: false, answeredAt: null as string | null },
    { id: "q-6", position: 6, category: "soft", difficulty: "easy", prompt: "Vì sao chọn thực tập ở V-Intern?", answered: false, answeredAt: null as string | null },
  ];
}

export function interviewSessionPayload(id: string, status = "in_progress") {
  return {
    id,
    roleCode: "frontend",
    status,
    startedAt: status === "created" ? null : iso(0, 9),
    expiresAt: iso(0, 11),
    submittedAt: null,
    attemptNumber: 1,
    questionCount: 6,
    serverNow: new Date().toISOString(),
    secondsRemaining: status === "in_progress" ? 5400 : null,
  };
}

export function interviewPayload(id: string) {
  return {
    session: interviewSessionPayload(id),
    questions: interviewQuestionsPayload(),
  };
}

export function interviewHistoryPayload() {
  return {
    total: 1,
    items: [
      {
        id: "itv-2026-776",
        roleCode: "backend",
        status: "completed",
        attemptNumber: 1,
        questionCount: 6,
        startedAt: iso(-32, 9),
        submittedAt: iso(-32, 10),
        evaluatedAt: iso(-32, 17),
        result: { ...recruitmentResultPayload(), id: "res-2026-776", sessionId: "itv-2026-776", decision: "failed", overallScore: 54, technicalScore: 50, recommendedRole: null },
      },
    ],
  };
}

export function interviewConversationPayload(id: string) {
  return {
    session: interviewSessionPayload(id),
    answeredCount: 2,
    messages: [
      { role: "assistant", questionId: "q-1", position: 1, content: "S khác nhau giữa useMemo và useCallback là gì? Bạn có thể trả lời trong khung dưới." },
      { role: "user", questionId: "q-1", position: 1, content: "useMemo memo hoá giá trị, useCallback memo hoá hàm." },
      { role: "assistant", questionId: "q-2", position: 2, content: "REST API idempotent nghĩa là gì? Cho ví dụ." },
    ],
    currentQuestion: { id: "q-2", position: 2, phase: "technical", kind: "main", status: "ready", errorCode: null },
  };
}

export function interviewEvaluationPayload(id: string) {
  return {
    session: { ...interviewSessionPayload(id, "evaluating"), submittedAt: iso(0, 10) },
    result: recruitmentResultPayload(),
    errorCode: undefined,
  };
}

/* ------------------------------ AB) Ứng viên phân công ------------------- */

export const RECRUITMENT_CANDIDATES = [
  { userId: "pv-intern-1", displayName: "Nguyễn An Khang", email: "sinhvien1@vintern.preview", status: "active", selectedRole: "frontend", attemptCount: 1, recruitedAt: iso(-32, 15), hasActiveAssignment: true, activeProjectId: "prj-lib", result: { overallScore: 80, technicalScore: 78, softSkillScore: 82, englishScore: 70, strengths: ["React tốt"], weaknesses: ["Kiểm thử ít"], decision: "passed", evaluatedAt: iso(-32, 17) } },
  { userId: "pv-intern-2", displayName: "Đỗ Thuần Minh", email: "sinhvien_minh@vintern.preview", status: "active", selectedRole: "backend", attemptCount: 1, recruitedAt: iso(-33, 15), hasActiveAssignment: true, activeProjectId: "prj-lib", result: { overallScore: 68, technicalScore: 66, softSkillScore: 70, englishScore: 60, strengths: ["NestJS ổn"], weaknesses: ["Kiểm thử"], decision: "passed", evaluatedAt: iso(-33, 17) } },
  { userId: "pv-intern-3", displayName: "Phạm Tân Sinh", email: "sinhvien_tan@vintern.preview", status: "pending", selectedRole: null, attemptCount: 0, recruitedAt: null, hasActiveAssignment: false, activeProjectId: null, result: null },
  { userId: "pv-intern-4", displayName: "Trịnh Khả Nhi", email: "sinhvien_nanghe@vintern.preview", status: "locked", selectedRole: "qa", attemptCount: 1, recruitedAt: iso(-55, 15), hasActiveAssignment: false, activeProjectId: null, result: { overallScore: 58, technicalScore: 52, softSkillScore: 64, englishScore: 55, strengths: [], weaknesses: ["Kịch bản thử mỏng"], decision: "passed", evaluatedAt: iso(-55, 17) } },
  { userId: "u-intern-5", displayName: "Lý Thu Trang", email: "thutrang.ly@vintern.preview", status: "active", selectedRole: "fullstack", attemptCount: 2, recruitedAt: iso(-90, 15), hasActiveAssignment: true, activeProjectId: "prj-lib", result: { overallScore: 72, technicalScore: 70, softSkillScore: 76, englishScore: 74, strengths: ["Học nhanh"], weaknesses: ["Queue ít kinh nghiệm"], decision: "passed", evaluatedAt: iso(-90, 17) } },
  { userId: "u-intern-6", displayName: "Hoàng Gia Bảo", email: "giabao.hoang@vintern.preview", status: "active", selectedRole: "business_analyst", attemptCount: 1, recruitedAt: iso(-160, 15), hasActiveAssignment: false, activeProjectId: null, result: { overallScore: 69, technicalScore: 60, softSkillScore: 78, englishScore: 68, strengths: ["Đặc tả rõ"], weaknesses: ["Code ít"], decision: "passed", evaluatedAt: iso(-160, 17) } },
];

export function candidateDetailPayload(userId: string) {
  const found = RECRUITMENT_CANDIDATES.find((c) => c.userId === userId) ?? RECRUITMENT_CANDIDATES[0];
  return {
    candidate: found,
    assignable: !found.hasActiveAssignment,
    suggestion: found.selectedRole
      ? { roleCode: found.selectedRole, reason: `Đạt phỏng vấn vai trò ${found.selectedRole} và còn slot trống.` }
      : null,
  };
}

/* ------------------------------ AC) Phân công ----------------------------- */

export const ASSIGNMENT_ROWS = [
  { id: "asg-1", internId: "pv-intern-1", status: "active" },
  { id: "asg-2", internId: "pv-intern-2", status: "active" },
  { id: "asg-3", internId: "u-intern-5", status: "active" },
  { id: "asg-4", internId: "u-intern-6", status: "active" },
  { id: "asg-5", internId: "pv-intern-4", status: "completed" },
];

/* ------------------------------ H) Chứng nhận (admin) --------------------- */

export const ADMIN_CERTIFICATES = [
  {
    id: "cert-01",
    certificateNumber: "VINTERN-2026-000123",
    verificationCode: "VC-2026-000123-XK4T",
    userId: "pv-intern-1",
    status: "issued",
    issuedAt: iso(-10, 9),
    completedAt: iso(-12, 17),
    holderNameSnapshot: "Nguyễn An Khang",
    roleLabelSnapshot: "Frontend Developer",
    projectNameSnapshot: "Hệ thống quản lý thư viện số",
    sessionNameSnapshot: "Kỳ thực tập Thu 2026",
    revokedAt: null,
    revokeReason: null,
    policyCode: "internship-completion",
    policyVersion: 2,
  },
  {
    id: "cert-02",
    certificateNumber: "VINTERN-2026-000051",
    verificationCode: "VC-2026-000051-QQ7B",
    userId: "pv-intern-1",
    status: "revoked",
    issuedAt: iso(-70, 9),
    completedAt: iso(-73, 17),
    holderNameSnapshot: "Nguyễn An Khang",
    roleLabelSnapshot: "Backend Developer",
    projectNameSnapshot: "Cổng thông tin tuyển dụng sinh viên CNTT",
    sessionNameSnapshot: "Kỳ thực tập Hè 2026",
    revokedAt: iso(-40, 11),
    revokeReason: "Phát hiện sao chép bài nộp cuối kỳ",
    policyCode: "internship-completion",
    policyVersion: 1,
  },
  {
    id: "cert-03",
    certificateNumber: "VINTERN-2026-000118",
    verificationCode: "VC-2026-000118-ZZ3P",
    userId: "u-intern-6",
    status: "issued",
    issuedAt: iso(-35, 9),
    completedAt: iso(-37, 17),
    holderNameSnapshot: "Hoàng Gia Bảo",
    roleLabelSnapshot: "Business Analyst",
    projectNameSnapshot: "Cổng thông tin tuyển dụng sinh viên CNTT",
    sessionNameSnapshot: "Kỳ thực tập Hè 2026",
    revokedAt: null,
    revokeReason: null,
    policyCode: "internship-completion",
    policyVersion: 1,
  },
  {
    id: "cert-04",
    certificateNumber: "VINTERN-2026-000132",
    verificationCode: "VC-2026-000132-LM8Q",
    userId: "u-intern-5",
    status: "issued",
    issuedAt: iso(-8, 9),
    completedAt: iso(-9, 17),
    holderNameSnapshot: "Lý Thu Trang",
    roleLabelSnapshot: "Fullstack Developer",
    projectNameSnapshot: "Hệ thống quản lý thư viện số",
    sessionNameSnapshot: "Kỳ thực tập Thu 2026",
    revokedAt: null,
    revokeReason: null,
    policyCode: "internship-completion",
    policyVersion: 2,
  },
  {
    id: "cert-05",
    certificateNumber: "VINTERN-2026-000127",
    verificationCode: "VC-2026-000127-KA9D",
    userId: "pv-intern-4",
    status: "issued",
    issuedAt: iso(-6, 9),
    completedAt: iso(-7, 17),
    holderNameSnapshot: "Trịnh Khả Nhi",
    roleLabelSnapshot: "QA Tester",
    projectNameSnapshot: "Hệ thống quản lý thư viện số",
    sessionNameSnapshot: "Kỳ thực tập Thu 2026",
    revokedAt: null,
    revokeReason: null,
    policyCode: "internship-completion",
    policyVersion: 2,
  },
  {
    id: "cert-06",
    certificateNumber: "VINTERN-2026-000096",
    verificationCode: "VC-2026-000096-HH2R",
    userId: "pv-intern-2",
    status: "issued",
    issuedAt: iso(-4, 9),
    completedAt: iso(-5, 17),
    holderNameSnapshot: "Đỗ Thuần Minh",
    roleLabelSnapshot: "Backend Developer",
    projectNameSnapshot: "Hệ thống quản lý thư viện số",
    sessionNameSnapshot: "Kỳ thực tập Thu 2026",
    revokedAt: null,
    revokeReason: null,
    policyCode: "internship-completion",
    policyVersion: 2,
  },
];

export function issuedCertificateFor(userId: string) {
  const person = SESSION_MEMBERS.find((m) => m.userId === userId);
  const role = person?.role ?? "frontend";
  return {
    id: `cert-${Date.now().toString(36)}`,
    certificateNumber: `VINTERN-2026-${(200 + Math.floor(Math.random() * 800)).toString().padStart(6, "0")}`,
    verificationCode: `VC-2026-${Date.now().toString(36).toUpperCase().slice(-8)}`,
    userId,
    status: "issued",
    issuedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    holderNameSnapshot: person?.displayName ?? "Người dùng",
    roleLabelSnapshot: role === "frontend" ? "Frontend Developer" : role === "backend" ? "Backend Developer" : role === "qa" ? "QA Tester" : "Fullstack Developer",
    projectNameSnapshot: "Hệ thống quản lý thư viện số",
    sessionNameSnapshot: "Kỳ thực tập Thu 2026",
    revokedAt: null,
    revokeReason: null,
    policyCode: "internship-completion",
    policyVersion: 2,
  };
}

/* ------------------------------ N) Hồ sơ trong đợt tuyển ------------------ */

export function staffApplicationPayload(appId: string) {
  const row = ROUND_APPLICATIONS.find((a) => a.id === appId) ?? ROUND_APPLICATIONS[0];
  const base = candidateApplication();
  return {
    id: row.id,
    fullName: row.fullName,
    status: row.status,
    matchedRole: row.matchedRole,
    revision: row.status === "new" ? 1 : 2,
    hasCv: row.status !== "new",
    booking: row.status === "booked" ? base.booking : null,
    timeline: base.timeline.map((t, i) =>
      i === base.timeline.length - 1
        ? { kind: row.status, message: `Trạng thái hiện tại: ${row.status}.`, createdAt: iso(-1, 9) }
        : t,
    ),
    analysis: {
      facts: row.status === "new"
        ? null
        : {
          confidence: 0.82,
          missing: row.status === "needs_information" ? ["kinh nghiệm dự án thật"] : [],
          facts: [
            { skill: "TypeScript", ref: "CV mục Kỹ năng", quote: "2 năm dùng TypeScript cho đồ án học phần." },
            { skill: "React", ref: "CV mục Dự án", quote: "Xây dựng dashboard thư viện nội bộ." },
          ],
        },
      match: row.status === "new" || row.status === "needs_information"
        ? null
        : { roleCode: row.matchedRole, confidence: 0.78, reason: "Kỹ năng frontend khớp 6/7 tiêu chí nghề." },
    },
    interviewPolicy: {
      canRebook: true,
      serverNow: new Date().toISOString(),
      attemptsUsed: 1,
      attemptsRemaining: 2,
      nextEligibleAt: null,
      allowedRoleCodes: ["frontend", "fullstack"],
    },
  };
}

/* ------------------------------ AE) Cài đặt ------------------------------- */

export const SETTINGS_ROWS: Array<{ key: string; value: string; description: string | null; updatedAt: string }> = [
  { key: "virtual_salary.base_amount", value: "500000", description: "Mức lương cơ sở ảo mỗi kỳ KPI", updatedAt: iso(-12, 7) },
  { key: "recruitment.default_capacity", value: "4", description: "Sức chứa khung phỏng vấn mặc định", updatedAt: iso(-30, 9) },
  { key: "github.repo_prefix", value: "vintern", description: "Tiền tố repository chung", updatedAt: iso(-88, 10) },
];