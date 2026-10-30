/**
 * Admin-surface fixtures for the local visual QA harness.
 * Same scope rules as fixtures.mjs / fixtures-instructor.mjs: LOCAL VISUAL
 * VERIFICATION ONLY, shapes mirror src/lib/api/* parsers (admin.ts,
 * finance.ts, career-roles.ts, knowledge.ts, question-bank.ts,
 * communications.ts, business-agents.ts, system-admin.ts), sql2019 CI stays
 * the authority. Shared delivery/sessions/tasks/reports endpoints fall back
 * to the instructor fixtures (which themselves fall back to intern ones).
 */
import { resolveInstructorApi } from "./fixtures-instructor.mjs";

export const adminUser = {
  id: "3f9d2b7c-0000-4000-8000-000000000001",
  email: "quan.tri@vintern.edu.vn",
  displayName: "Trần Vân Anh",
  roles: ["admin"],
  permissions: [],
  mustChangePassword: false,
};

const now = Date.UTC(2026, 9, 30, 4, 0, 0);
const daysAgo = (n) => new Date(now - n * 86400000).toISOString();
const id = (prefix, n = 1) =>
  `${prefix}-0000-4000-8000-${String(n).padStart(12, "0")}`;

const page = (data, total, pageNumber, pageSize) => ({
  data,
  meta: { total, page: pageNumber, pageSize, totalPages: Math.ceil(total / pageSize) },
});

const users = [
  { id: id("usr", 1), email: "minh.nguyen@student.edu.vn", username: "minh.nguyen", displayName: "Nguyễn Minh", status: "active", lastLoginAt: daysAgo(1), createdAt: daysAgo(90) },
  { id: id("usr", 2), email: "lan.pham@vintern.edu.vn", username: "lan.pham", displayName: "TS. Phạm Thu Lan", status: "active", lastLoginAt: daysAgo(2), createdAt: daysAgo(200) },
  { id: id("usr", 3), email: "bao.long@student.edu.vn", username: "bao.long", displayName: "Trần Bảo Long", status: "pending", lastLoginAt: null, createdAt: daysAgo(6) },
  { id: id("usr", 4), email: "thu.ha@student.edu.vn", username: "thu.ha", displayName: "Lê Thu Hà", status: "locked", lastLoginAt: daysAgo(30), createdAt: daysAgo(120) },
];

const roles = [
  { id: id("rol", 1), code: "admin", name: "Quản trị viên", description: "Toàn quyền cấu hình hệ thống và dữ liệu." },
  { id: id("rol", 2), code: "instructor", name: "Giảng viên", description: "Quản lý phiên, chấm bài và đánh giá." },
  { id: id("rol", 3), code: "intern", name: "Sinh viên", description: "Nhận nhiệm vụ, nộp bài và xem kết quả." },
];

const permissions = [
  { id: id("per", 1), code: "session:manage", name: "Quản lý phiên", description: null },
  { id: id("per", 2), code: "evaluation:finalize", name: "Chốt đánh giá", description: null },
  { id: id("per", 3), code: "user:manage", name: "Quản lý tài khoản", description: "Tạo, sửa, khóa tài khoản người dùng." },
];

const groups = [
  { id: id("grp", 1), code: "fall-2026", name: "Khóa Thu 2026", description: "Sinh viên thực tập học kỳ Thu 2026." },
  { id: id("grp", 2), code: "instructors-core", name: "Giảng viên cốt lõi", description: "Giảng viên phụ trách các phiên EduScale." },
];

const catalogTypes = [
  { id: id("cty", 1), code: "domain_category", name: "Lĩnh vực dự án", description: "Phân loại dự án theo lĩnh vực." },
  { id: id("cty", 2), code: "difficulty", name: "Độ khó", description: null },
];

const catalogItems = [
  { id: id("cit", 1), code: "web-app", name: "Ứng dụng web", value: null, sortOrder: 1, isActive: true },
  { id: id("cit", 2), code: "data-platform", name: "Nền tảng dữ liệu", value: null, sortOrder: 2, isActive: true },
  { id: id("cit", 3), code: "intermediate", name: "Trung cấp", value: null, sortOrder: 2, isActive: true },
  { id: id("cit", 4), code: "beginner", name: "Sơ cấp", value: null, sortOrder: 1, isActive: false },
];

const settings = {
  settings: [
    { key: "app.name", value: "V-Intern", description: "Tên hiển thị của hệ thống.", updatedAt: daysAgo(40) },
    { key: "recruitment.maxRounds", value: "4", description: "Số đợt tuyển mở đồng thời tối đa.", updatedAt: daysAgo(12) },
    { key: "JWT_SECRET", value: "FILTERED-BY-CLIENT", description: "Giá trị nhạy cảm — lớp hiển thị luôn lọc bỏ.", updatedAt: daysAgo(12) },
  ],
};

const audits = [
  { id: id("aud", 1), actorId: id("usr", 2), action: "evaluation.finalize", targetType: "evaluation", targetId: id("evl", 3), detail: "Chốt điểm đánh giá giữa kỳ.", ip: "10.20.4.11", userAgent: "Mozilla/5.0 (Windows NT 10.0)", createdAt: daysAgo(1) },
  { id: id("aud", 2), actorId: adminUser.id, action: "user.lock", targetType: "user", targetId: id("usr", 4), detail: "Khóa tài khoản sau 5 lần đăng nhập sai liên tiếp.", ip: "10.20.1.5", userAgent: "Mozilla/5.0 (macOS)", createdAt: daysAgo(3) },
  { id: id("aud", 3), actorId: null, action: "auth.login.success", targetType: "user", targetId: id("usr", 1), detail: null, ip: "10.20.7.9", userAgent: "Chrome/130 Mobile", createdAt: daysAgo(1) },
];

const activities = [
  { id: id("act", 1), actorId: id("usr", 1), module: "submission", action: "submission.create", targetType: "task", targetId: id("tsk", 2), summary: "Nguyễn Minh nộp bài TASK-0203 qua PR #128.", createdAt: daysAgo(1) },
  { id: id("act", 2), actorId: id("usr", 2), module: "sprint", action: "sprint.complete", targetType: "sprint", targetId: id("spr", 51), summary: "Sprint 2 hoàn tất với 12/12 task.", createdAt: daysAgo(2) },
  { id: id("act", 3), actorId: adminUser.id, module: "settings", action: "settings.update", targetType: "settings", targetId: null, summary: "Cập nhật recruitment.maxRounds = 4.", createdAt: daysAgo(12) },
];

const health = {
  status: "healthy",
  checks: { backend: "up", database: "up", dbLatencyMs: 6, ai: "up", aiProvider: "glm", aiModel: "glm-4.7" },
  uptimeSeconds: 512400,
  timestamp: new Date(now).toISOString(),
};

const systemStatus = {
  checkedAt: new Date(now).toISOString(),
  database: { latencyMs: 6 },
  counts: { users: 128, activeSessions: 3, activeQuestions: 42, activeTemplates: 5, migrations: 61, runningReviews: 2 },
  integrations: {
    github: { configured: true, missing: [] },
    webhook: { configured: true },
    runner: { configured: true, missing: [], sealedSuites: 12, suiteConfigValid: true },
  },
  learningAlerts: {
    enabled: true, intervalSeconds: 900, running: true,
    lastScanAt: daysAgo(1), lastErrorCode: null,
    lastResult: { created: 2, muted: 0, processed: 2 },
  },
  aiLast24Hours: [
    { feature: "evaluation_assist", status: "ok", count: 34, averageLatencyMs: 2100 },
    { feature: "recommendation", status: "ok", count: 12, averageLatencyMs: 1800 },
    { feature: "plan_generation", status: "degraded", count: 3, averageLatencyMs: 9800 },
  ],
};

const systemRepositories = {
  total: 2,
  pageSize: 10,
  items: [
    { sessionId: "ses-0000-4000-8000-000000000050", sessionName: "Phiên thực tập Thu 2026", sessionCode: "SS-2026-09", instructorName: "TS. Phạm Thu Lan", ownerLogin: "v-intern", repoName: "vintern-eduscale-lms", status: "ready", webhookStatus: "ready", error: null, lastEventAt: daysAgo(1) },
    { sessionId: "ses-0000-4000-8000-000000000052", sessionName: "Phiên thực tập Hè 2026", sessionCode: "SS-2026-11", instructorName: "TS. Phạm Thu Lan", ownerLogin: "v-intern", repoName: "vintern-hedata-portal", status: "provisioning", webhookStatus: "configuring", error: null, lastEventAt: null },
  ],
};

const systemContracts = {
  checkedAt: new Date(now).toISOString(),
  source: "sealed-suites",
  valid: true,
  error: null,
  contracts: [
    { key: "intern.workflow", suiteId: "e2e-intern-workflow", digest: "9f31ab2c4d5e", status: "valid", issues: [], operator: { version: "2026.10", reviewer: "CI runner", sealedAt: daysAgo(8), images: { runtime: "node:22", tester: "mcr.microsoft.com/playwright:v1.58" }, complete: true } },
    { key: "admin.console", suiteId: "e2e-admin-console", digest: "c04d77e1a2b9", status: "valid", issues: [], operator: { version: "2026.10", reviewer: "CI runner", sealedAt: daysAgo(8), images: { runtime: "node:22", tester: "mcr.microsoft.com/playwright:v1.58" }, complete: true } },
  ],
};

const aiConfiguration = {
  policy: { model: "glm-4.7", timeoutMs: 60000, maxRetries: 2, version: 3 },
  source: "database",
  provider: "glm",
  credentialsConfigured: true,
  appliesTo: ["evaluation_assist", "recommendation", "plan_generation", "interview"],
};

const businessRuns = {
  definitions: [
    { id: "evaluation-assist", version: "2.4.0", promptVersion: "v2026.10", features: ["summary", "criterion_suggestions"], maxToolCalls: 6 },
    { id: "recommendation", version: "1.9.2", promptVersion: "v2026.10", features: ["summary", "actions"], maxToolCalls: 4 },
  ],
  items: [
    { id: id("run", 3), agentId: "evaluation-assist", agentVersion: "2.4.0", promptVersion: "v2026.10", status: "succeeded", model: "glm-4.7", stepCount: 4, attempts: 1, toolCalls: 3, inputTokens: 8100, outputTokens: 1900, errorCode: null, createdAt: daysAgo(1) },
    { id: id("run", 4), agentId: "recommendation", agentVersion: "1.9.2", promptVersion: "v2026.10", status: "failed", model: "glm-4.7", stepCount: 1, attempts: 3, toolCalls: 0, inputTokens: 400, outputTokens: null, errorCode: "AI_TIMEOUT", createdAt: daysAgo(2) },
  ],
  total: 2,
  page: 1,
  pageSize: 20,
};

const mail = {
  items: [
    { id: id("mail", 1), kind: "interview_credentials", recipientHint: "n***.anh@example.edu.vn", status: "delivered", attempts: 1, availableAt: daysAgo(2), expiresAt: daysAgo(1), lastCode: null, createdAt: daysAgo(2) },
    { id: id("mail", 2), kind: "account_activation", recipientHint: "b***.long@example.edu.vn", status: "bounced", attempts: 3, availableAt: daysAgo(1), expiresAt: daysAgo(0), lastCode: "SMTP_550", createdAt: daysAgo(3) },
    { id: id("mail", 3), kind: "password_reset", recipientHint: "t***.ha@student.edu.vn", status: "uncertain", attempts: 2, availableAt: daysAgo(0), expiresAt: daysAgo(-1), lastCode: "SMTP_TIMEOUT", createdAt: daysAgo(1) },
  ],
  total: 3,
  page: 1,
  pageSize: 20,
  transportConfigured: true,
  deliveryMode: "smtp",
};

const kpiPeriods = {
  items: [
    { id: id("kpi", 1), code: "KPI-2026-Q3", name: "KPI quý 3 · 2026", startDate: daysAgo(70), endDate: daysAgo(10), status: "finalized", ruleVersion: "v2026.07", createdAt: daysAgo(75), updatedAt: daysAgo(9) },
    { id: id("kpi", 2), code: "KPI-2026-Q4", name: "KPI quý 4 · 2026", startDate: daysAgo(9), endDate: new Date(now + 80 * 86400000).toISOString(), status: "open", ruleVersion: "v2026.07", createdAt: daysAgo(10), updatedAt: daysAgo(2) },
    { id: id("kpi", 3), code: "KPI-2027-Q1", name: "KPI quý 1 · 2027", startDate: new Date(now + 82 * 86400000).toISOString(), endDate: new Date(now + 172 * 86400000).toISOString(), status: "draft", ruleVersion: "v2026.07", createdAt: daysAgo(1), updatedAt: daysAgo(1) },
  ],
  total: 3,
};

const kpiResults = {
  items: [
    { id: id("kpr", 1), periodId: id("kpi", 1), userId: id("usr", 1), ruleVersion: "v2026.07", status: "calculated", finalScore: 78.5, calculatedAt: daysAgo(9) },
    { id: id("kpr", 2), periodId: id("kpi", 1), userId: id("usr", 5), ruleVersion: "v2026.07", status: "insufficient_data", finalScore: null, calculatedAt: daysAgo(9) },
  ],
  total: 2,
};

const kpiResultDetail = {
  result: { ...kpiResults.items[0] },
  metrics: [
    { metricCode: "task_completion", sourceValue: 78.6, configuredWeight: 40, effectiveWeight: 40, weightedContribution: 31.4, sourceJson: "{\"completed\":11,\"total\":14}" },
    { metricCode: "evaluation_score", sourceValue: 7.8, configuredWeight: 40, effectiveWeight: 40, weightedContribution: 31.2, sourceJson: "{\"average\":7.8,\"finalized\":1}" },
    { metricCode: "on_time_rate", sourceValue: 72, configuredWeight: 20, effectiveWeight: 20, weightedContribution: 15.9, sourceJson: "{\"onTime\":8,\"total\":11}" },
  ],
};

const salaryLedger = {
  items: [
    { id: id("sal", 1), userId: id("usr", 1), kpiPeriodId: id("kpi", 1), type: "kpi_earning", amount: 785000, unit: "VND", description: "Thu nhập KPI quý 3 theo điểm 78.5.", createdAt: daysAgo(8) },
    { id: id("sal", 2), userId: id("usr", 1), kpiPeriodId: null, type: "bonus", amount: 100000, unit: "VND", description: "Thưởng đóng góp tài liệu hướng dẫn review PR.", createdAt: daysAgo(5) },
    { id: id("sal", 3), userId: id("usr", 1), kpiPeriodId: null, type: "penalty", amount: -50000, unit: "VND", description: "Trừ do 1 task quá hạn (xử lý kỷ luật phiên).", createdAt: daysAgo(4) },
  ],
  total: 3,
};

const salaryBalance = {
  virtual: true,
  balance: 835000,
  unit: "VND",
  earnedThisPeriod: 785000,
  latestEntries: salaryLedger.items.slice(0, 2),
};

const adminCertificates = {
  items: [
    { id: id("cer", 1), certificateNumber: "VINT-2026-0148", verificationCode: "VC-7F3K-92QX", userId: id("usr", 6), status: "issued", issuedAt: daysAgo(20), completedAt: daysAgo(21), holderName: "Nguyễn Minh", roleName: "Frontend Developer", projectName: "EduScale LMS", sessionName: "Phiên thực tập Thu 2026", revokedAt: null, revokeReason: null, policyCode: "default-2026", policyVersion: 2 },
    { id: id("cer", 2), certificateNumber: "VINT-2026-0131", verificationCode: "VC-2A8M-44DL", userId: id("usr", 7), status: "revoked", issuedAt: daysAgo(60), completedAt: daysAgo(61), holderName: "Phan Tất Đạt", roleName: "QA Engineer", projectName: "EduScale LMS", sessionName: "Phiên thực tập Hè 2026", revokedAt: daysAgo(30), revokeReason: "Phát hiện nộp bài không phải sản phẩm của sinh viên.", policyCode: "default-2026", policyVersion: 1 },
  ],
  total: 2,
};

const adminCareerRoles = {
  items: [
    { code: "frontend", name: "Frontend Developer", description: "Xây dựng giao diện Next.js với accessibility và form phức tạp.", level: "intern", language: "vi", requiredSkills: ["TypeScript", "React", "HTML/CSS"], optionalSkills: ["Vitest", "Playwright"], competencyWeights: { technical: 40, communication: 20, teamwork: 20, english: 20 }, status: "published", acceptingApplications: true, version: 3, createdAt: daysAgo(200), updatedAt: daysAgo(10) },
    { code: "backend", name: "Backend Developer", description: "Thiết kế API NestJS, bảo mật và kiểm thử tích hợp.", level: "intern", language: "vi", requiredSkills: ["NestJS", "SQL", "REST"], optionalSkills: ["Docker"], competencyWeights: { technical: 50, communication: 20, teamwork: 15, english: 15 }, status: "published", acceptingApplications: true, version: 2, createdAt: daysAgo(190), updatedAt: daysAgo(15) },
    { code: "qa", name: "QA Engineer", description: "Viết kịch bản kiểm thử, theo dõi lỗi và regression.", level: "junior", language: "vi", requiredSkills: ["Vitest", "Playwright"], optionalSkills: ["k6"], competencyWeights: { technical: 45, communication: 25, teamwork: 15, english: 15 }, status: "draft", acceptingApplications: false, version: 1, createdAt: daysAgo(3), updatedAt: daysAgo(3) },
  ],
  total: 3,
  page: 1,
  pageSize: 100,
};

const careerRoleRevisions = {
  items: [
    { version: 3, snapshot: { ...adminCareerRoles.items[0] }, createdBy: id("usr", 2), createdAt: daysAgo(10) },
    { version: 2, snapshot: { ...adminCareerRoles.items[0], version: 2, updatedAt: daysAgo(40) }, createdBy: adminUser.id, createdAt: daysAgo(40) },
  ],
  total: 2,
  page: 1,
  pageSize: 10,
};

const knowledgeDocuments = {
  items: [
    { id: id("knw", 1), code: "huong-dan-review-pr", kind: "guide", title: "Hướng dẫn review PR theo rubric", summary: "Quy trình review: đọc spec, chạy test, nhận xét theo tiêu chí.", language: "vi", difficulty: "easy", audience: "student_safe", purposes: ["code_review", "mentoring"], roleCodes: ["frontend", "backend"], tags: ["review", "rubric"], version: 2, status: "published", updatedAt: daysAgo(5), sha256: "a".repeat(64) },
    { id: id("knw", 2), code: "cau-hoi-interview-fe", kind: "qa", title: "Bộ câu hỏi phỏng vấn Frontend", summary: "Câu hỏi kỹ thuật + giao tiếp cho vai trò frontend.", language: "vi", difficulty: "medium", audience: "staff_only", purposes: ["interview", "interview_evaluation"], roleCodes: ["frontend"], tags: ["interview"], version: 1, status: "draft", updatedAt: daysAgo(9), sha256: "b".repeat(64) },
  ],
  total: 2,
  page: 1,
  pageSize: 12,
};

const knowledgeDocumentDetail = {
  id: id("knw", 1),
  code: "huong-dan-review-pr",
  version: 2,
  status: "published",
  snapshot: {
    schemaVersion: 1,
    code: "huong-dan-review-pr",
    version: 2,
    status: "published",
    kind: "guide",
    title: "Hướng dẫn review PR theo rubric",
    summary: "Quy trình review: đọc spec, chạy test, nhận xét theo tiêu chí.",
    language: "vi",
    difficulty: "easy",
    audience: "student_safe",
    purposes: ["code_review", "mentoring"],
    roleCodes: ["frontend", "backend"],
    tags: ["review", "rubric"],
    sources: [{ title: "Bảng rubric EduScale", reference: "docs/rubric-2026.md" }],
    body: { sections: [{ heading: "Quy trình", paragraphs: ["Đọc spec trước khi mở diff.", "Chạy vitest trước khi phê duyệt."] }] },
  },
  sha256: "c".repeat(64),
};

const knowledgePublicationCheck = {
  code: "huong-dan-review-pr",
  currentVersion: 2,
  status: "published",
  sha256: "c".repeat(64),
  publishable: true,
  issues: [],
};

const knowledgeRevisions = {
  items: [
    { version: 2, snapshot: knowledgeDocumentDetail.snapshot, sha256: "c".repeat(64), createdBy: id("usr", 2), createdAt: daysAgo(5) },
    { version: 1, snapshot: { ...knowledgeDocumentDetail.snapshot, version: 1, status: "draft" }, sha256: "d".repeat(64), createdBy: adminUser.id, createdAt: daysAgo(30) },
  ],
  total: 2,
  page: 1,
  pageSize: 10,
};

const questionBank = {
  items: [
    { id: id("qus", 1), roleCode: "frontend", phase: "technical", difficulty: "medium", language: "vi", prompt: "Giải thích cách bạn tối ưu danh sách 10.000 dòng trong React.", expectedConcepts: ["virtualization", "memoization"], exampleAnswer: "Dùng virtualized list, memo hàng, phân trang phía dữ liệu.", scoringRubric: "Nêu đúng 2/3 khái niệm: đạt. Có ví dụ thực tế: vượt.", followUpHints: ["Nếu DOM vẫn chậm thì sao?"], tags: ["react", "performance"], isActive: true, sortOrder: 1, version: 2, updatedAt: daysAgo(4) },
    { id: id("qus", 2), roleCode: "frontend", phase: "introduction", difficulty: "easy", language: "vi", prompt: "Giới thiệu bản thân trong 2 phút.", expectedConcepts: ["structure", "relevance"], exampleAnswer: "Tên, trường, dự án gần nhất, lý do ứng tuyển.", scoringRubric: "Có cấu trúc và liên quan vai trò: đạt.", followUpHints: [], tags: ["soft-skill"], isActive: true, sortOrder: 2, version: 1, updatedAt: daysAgo(20) },
    { id: id("qus", 3), roleCode: "backend", phase: "english", difficulty: "medium", language: "en", prompt: "Describe a database index and when it hurts performance.", expectedConcepts: ["b-tree", "write-amplification"], exampleAnswer: "Index speeds reads but slows writes and adds storage.", scoringRubric: "Đúng khái niệm trade-off: đạt.", followUpHints: ["Composite index ordering?"], tags: ["database"], isActive: false, sortOrder: 3, version: 1, updatedAt: daysAgo(25) },
  ],
  total: 3,
  page: 1,
  pageSize: 10,
  coverage: [
    { roleCode: "frontend", phase: "technical", count: 8 },
    { roleCode: "frontend", phase: "introduction", count: 4 },
    { roleCode: "backend", phase: "technical", count: 6 },
  ],
};

/** Resolve admin-surface fixtures; falls back to instructor fixtures. */
export function resolveAdminApi(method, pathname, search) {
  const p = pathname.replace(/\/+$/, "");
  if (method === "GET" && p === "/auth/me") return adminUser;

  // --- RBAC: users, roles, permissions, groups, catalogs, settings ---
  if (method === "GET" && p === "/users") return page(users, users.length, 1, 10);
  const userMatch = p.match(/^\/users\/([^/]+)$/);
  if (method === "GET" && userMatch)
    return users.find((u) => u.id === userMatch[1]) ?? users[0];
  if (method === "GET" && p === "/roles") return page(roles, roles.length, 1, 10);
  if (method === "GET" && p === "/permissions") return page(permissions, permissions.length, 1, 10);
  const rolePermsMatch = p.match(/^\/roles\/([^/]+)\/permissions$/);
  if (method === "GET" && rolePermsMatch) return page(permissions, permissions.length, 1, 10);
  if (method === "GET" && p === "/groups") return page(groups, groups.length, 1, 10);
  const groupMembersMatch = p.match(/^\/groups\/([^/]+)\/members$/);
  if (method === "GET" && groupMembersMatch)
    return { members: [{ userId: users[0].id, joinedAt: daysAgo(60) }, { userId: users[3].id, joinedAt: daysAgo(20) }] };
  const groupRolesMatch = p.match(/^\/groups\/([^/]+)\/roles$/);
  if (method === "GET" && groupRolesMatch) return { roles: ["instructor"] };
  if (method === "GET" && p === "/catalogs/types") return page(catalogTypes, catalogTypes.length, 1, 10);
  if (method === "GET" && p === "/catalogs/items") return page(catalogItems, catalogItems.length, 1, 10);
  if (method === "GET" && p === "/settings") return settings;

  // --- Observability: audit + activity + health ---
  if (method === "GET" && p === "/audit-logs") return page(audits, audits.length, 1, 10);
  if (method === "GET" && p === "/activity-events") return page(activities, activities.length, 1, 10);
  if (method === "GET" && p === "/health") return health;

  // --- System admin: status, repositories, contracts, AI configuration ---
  if (method === "GET" && p === "/admin/system/status") return systemStatus;
  if (method === "GET" && p === "/admin/system/repositories") return systemRepositories;
  if (method === "GET" && p === "/admin/system/contracts") return systemContracts;
  if (method === "GET" && p === "/admin/ai-configuration") return aiConfiguration;
  if (method === "GET" && p === "/admin/agents/business-runs") return businessRuns;

  // --- Communications (mail outbox) ---
  if (method === "GET" && p === "/admin/communications") return mail;
  const mailPreviewMatch = p.match(/^\/admin\/communications\/([^/]+)\/preview$/);
  if (method === "GET" && mailPreviewMatch)
    return { redacted: false, subject: "[V-Intern] Thông tin phỏng vấn của bạn", text: "Chào bạn,\nKhung phỏng vấn đã được đặt. Vui lòng đăng nhập để xem chi tiết.", html: "<p>Chào bạn,</p><p>Khung phỏng vấn đã được đặt. <a href=\"https://vintern.edu.vn\">Đăng nhập</a> để xem chi tiết.</p>" };

  // --- Finance: KPI periods/results, virtual salary, certificates ---
  if (method === "GET" && p === "/kpi-periods") return kpiPeriods;
  const kpiResultsMatch = p.match(/^\/kpi-periods\/([^/]+)\/results$/);
  if (method === "GET" && kpiResultsMatch) return kpiResults;
  const kpiResultMatch = p.match(/^\/kpi-results\/([^/]+)$/);
  if (method === "GET" && kpiResultMatch) return kpiResultDetail;
  if (method === "GET" && p === "/virtual-salary") return salaryLedger;
  const balanceMatch = p.match(/^\/virtual-salary\/users\/([^/]+)\/balance$/);
  if (method === "GET" && balanceMatch) return salaryBalance;
  if (method === "GET" && p === "/certificates") return adminCertificates;

  // --- Career roles authoring (admin catalog differs from public recruiting) ---
  if (method === "GET" && p === "/admin/career-roles") return adminCareerRoles;
  const careerRevMatch = p.match(/^\/admin\/career-roles\/([^/]+)\/revisions$/);
  if (method === "GET" && careerRevMatch) return careerRoleRevisions;

  // --- Knowledge library + editor ---
  if (method === "GET" && p === "/admin/knowledge") return knowledgeDocuments;
  const knowledgeMatch = p.match(/^\/admin\/knowledge\/([^/]+)$/);
  if (method === "GET" && knowledgeMatch) return knowledgeDocumentDetail;
  const knowledgeCheckMatch = p.match(/^\/admin\/knowledge\/([^/]+)\/publication-check$/);
  if (method === "GET" && knowledgeCheckMatch) return knowledgePublicationCheck;
  const knowledgeRevMatch = p.match(/^\/admin\/knowledge\/([^/]+)\/revisions$/);
  if (method === "GET" && knowledgeRevMatch) return knowledgeRevisions;

  // --- Question bank ---
  if (method === "GET" && p === "/admin/question-bank") return questionBank;

  return resolveInstructorApi(method, pathname, search);
}
