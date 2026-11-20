/**
 * ROUTER PREVIEW — khớp (method, path) thật mà lib/api gọi qua apiFetch.
 *
 * Quy tắc trung thực (Section 10/11 master brief):
 * - Endpoint nào chưa mock → ném ApiError 501 PREVIEW_ENDPOINT_NOT_MOCKED
 *   (hiện ErrorState; coverage matrix ghi rõ endpoint chưa mock, không bịa).
 * - Thao tác có trạng thái thật trong phiên: đánh dấu thông báo đã đọc
 *   cập nhật danh sách mock — hành vi nhất quán, không chỉ vẽ UI.
 * - Scenario do transport áp phủ (xem transport.ts): mọi handler chỉ lo dữ liệu.
 */
import { ApiError } from "@/lib/auth/api-client";
import {
  PREVIEW_ACCOUNTS,
  PREVIEW_ACCOUNTS_BY_ID,
  currentStoredAccountId,
  resolvePreviewAccount,
  type PreviewAccount,
} from "./accounts";
import {
  currentAccountId,
  resetPreviewState,
  setPreviewAccount,
} from "./store";
import {
  activityFor,
  adminDashboard,
  auditsFor,
  boardFor,
  certificatesFor,
  groupsFor,
  rolesFor,
  usersFor,
  evaluationsFor,
  instructorDashboard,
  internPerformance,
  internWorkspace,
  kpiDetailFor,
  kpisFor,
  ledgerFor,
  mentorConversationsFor,
  mentorAppendMessage,
  mentorDetailFor,
  notificationsFor,
  ownProjectFor,
  recommendationsFor,
  tasksFor,
} from "./data";
import { currentScenario } from "./store";
import {
  AI_SUGGESTION_ROWS,
  ASSIGNMENT_ROWS,
  BANK_QUESTIONS,
  CAREER_ROLES,
  CATALOG_ITEMS,
  CATALOG_TYPES,
  EVALUATION_CRITERIA,
  EVALUATION_CYCLES,
  GROUP_MEMBERS,
  GROUP_ROLES,
  IMPORTED_REVIEWS,
  KPI_PERIODS,
  KPI_RESULTS,
  KPI_METRICS,
  KNOWLEDGE_DOCS,
  MAIL_LOG,
  MANAGED_EVALUATIONS,
  PERFORMANCE_MEMBERS,
  PLAN_SUMMARIES,
  PROJECT_MEMBERS,
  PROJECT_ROWS,
  PROJECT_SLOTS,
  PROJECT_SESSIONS,
  PUBLIC_ROUNDS,
  RECRUITMENT_CANDIDATES,
  REPORT_LIST,
  ROUND_APPLICATIONS,
  ROUND_SLOTS,
  SALARY_LEDGER,
  SESSION_MEMBERS,
  SESSION_MILESTONES,
  SESSION_SPRINT_PROGRESS,
  SESSION_TIMELINE,
  SESSION_ROWS,
  SPRINT_ROWS,
  TEMPLATE_SUMMARIES,
  aiConfigurationPayload,
  aiSuggestionPayload,
  businessRunsPayload,
  candidateApplication,
  candidateDetailPayload,
  githubActivityFor,
  githubStatusFor,
  interviewConversationPayload,
  interviewEvaluationPayload,
  interviewHistoryPayload,
  interviewPayload,
  interviewSessionPayload,
  knowledgeDocument,
  knowledgeMetadata,
  knowledgeRevisions,
  learningPackagePayload,
  mailPreview,
  planDetailPayload,
  planDraftBody,
  permissionsForRole,
  projectTemplateContextPayload,
  recruitmentMeProfile,
  replacementAdvicePayload,
  replacementPreviewPayload,
  replacementResultPayload,
  reportCounts,
  reportDetailPayload,
  repositoryAccessJobsPayload,
  repositoryAccountFor,
  sessionRepositoryPayload,
  sessionWorkPayload,
  sha256like,
  sprintBurndownPayload,
  studentDetailPayload,
  systemContractsPayload,
  systemRepositoriesPayload,
  systemStatusPayload,
  knowledgeRunPayload,
  templateAssessmentPayload,
  templateDetailPayload,
  templateRevisionDetail,
  templateRevisionsPayload,
  questionCoverage,
  ADMIN_CERTIFICATES,
  issuedCertificateFor,
  staffApplicationPayload,
  evaluationDetailPayload,
  recruitmentResultPayload,
  SETTINGS_ROWS,
  INSTRUCTOR_ROW,
} from "./admin-data";
import {
  onboardingAnsweredIds,
  onboardingMarkAnswered,
  onboardingSelectRole,
  onboardingStartInterview,
  onboardingSubmitInterview,
} from "./onboarding-flow";

export interface PreviewRequestContext {
  method: string;
  path: string; // không có query string
  query: URLSearchParams;
  body: unknown;
  token?: string | null;
  account: PreviewAccount;
  scenario: ReturnType<typeof currentScenario>;
}

interface RouteHandler {
  method: string;
  /** Pattern dạng chuẩn hoá: bỏ query, giữ param động nguyên văn. */
  test: (path: string) => boolean;
  handle: (ctx: PreviewRequestContext) => unknown;
}

const err = (status: number, code: string, message: string, details?: unknown) =>
  new ApiError(status, code, message, details);

/** Đăng nhập demo: đúng tài khoản + mật khẩu demo.
 *  Persist lựa chọn vào preview store: sessionStorage đóng vai "refresh cookie"
 *  của preview — reload sau đó /auth/refresh trả lại đúng tài khoản này. */
function login(ctx: PreviewRequestContext): unknown {
  const body = (ctx.body ?? {}) as { email?: string; password?: string };
  const found = PREVIEW_ACCOUNTS.find((a) => a.email === body.email);
  if (!found || body.password !== found.password)
    throw err(401, "INVALID_CREDENTIALS", "Email hoặc mật khẩu không chính xác.");
  rememberSessionAccount(found.id);
  setPreviewAccount(found.id);
  return { accessToken: `preview-token-${found.id}`, user: found.user };
}

function me(ctx: PreviewRequestContext): unknown {
  return ctx.account.user;
}

function refresh(ctx: PreviewRequestContext): unknown {
  /* Khách chưa từng đăng nhập preview (không token, không preview state):
     401 như refresh cookie thật không tồn tại → guard đưa về /login. Chỉ khi
     đã login (store có account) hoặc token preview-token-* hợp lệ mới có phiên. */
  const stored =
    activeAccountId ?? currentStoredAccountId() ?? currentAccountId();
  if (!stored && !ctx.token)
    throw err(401, "NO_PREVIEW_SESSION", "Chưa có phiên preview (đăng nhập bằng tài khoản demo).");
  rememberSessionAccount(ctx.account.id);
  return { accessToken: `preview-token-${ctx.account.id}`, user: ctx.account.user };
}

/** Trong-memory session account bám theo token preview-token-<id>. */
let activeAccountId: string | null = null;
function rememberSessionAccount(id: string): void {
  activeAccountId = id;
}

/** account cho request: ưu tiên (1) token preview-token-<id>, (2) module
 *  memory activeAccountId, (3) lựa chọn trong preview store (sessionStorage —
 *  giữ qua reload, đóng vai "refresh cookie" của preview), (4) mặc định role. */
function accountForRequest(token?: string | null): PreviewAccount {
  if (token?.startsWith("preview-token-")) {
    const id = token.slice("preview-token-".length);
    const byToken = PREVIEW_ACCOUNTS.find((a) => a.id === id);
    if (byToken) {
      activeAccountId = id;
      return byToken;
    }
  }
  const remembered = activeAccountId
    ?? currentStoredAccountId()
    ?? currentAccountId();
  if (remembered && PREVIEW_ACCOUNTS_BY_ID[remembered]) {
    activeAccountId = remembered;
    return PREVIEW_ACCOUNTS_BY_ID[remembered];
  }
  const roleGuess = remembered
    ? PREVIEW_ACCOUNTS_BY_ID[remembered]?.user.roles[0]
    : undefined;
  return resolvePreviewAccount(roleGuess ?? null);
}


/** Trang theo contract Nest chuẩn ({data, meta}) — parsePage của parse.ts. */
function nestPage<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const start = (Math.max(1, page) - 1) * pageSize;
  return {
    data: items.slice(start, start + pageSize),
    meta: {
      total,
      page: Math.max(1, page),
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

function participationFor(scenario: ReturnType<typeof currentScenario>, page: number) {
  const empty = scenario === "empty";
  const items = empty
    ? []
    : [
      {
        id: "inc-1",
        taskId: "ts-12",
        internId: "pv-intern-1",
        sessionId: "ss-f26",
        deadlineVersion: 2,
        policyVersion: 3,
        dueAt: iso(-19, 17),
        submittedAt: iso(-19, 19),
        kind: "late",
        status: "active",
        ordinal: 1,
        points: -1,
        recommendReplacement: false,
        replacementEligible: false,
        createdAt: iso(-19, 20),
        reason: null,
        taskCode: "TS-12",
        taskTitle: "Trang chi tiết tài liệu",
        displayName: "Nguyễn An Khang",
        sessionName: "Kỳ thực tập Thu 2026",
        baseScore: 8,
        latePenalty: -1,
        score: 7,
        submissionStatus: "late",
      },
      {
        id: "inc-2",
        taskId: "ts-24",
        internId: "pv-intern-1",
        sessionId: "ss-f26",
        deadlineVersion: 2,
        policyVersion: 3,
        dueAt: iso(1, 17),
        submittedAt: null,
        kind: "missing",
        status: "excused",
        ordinal: 2,
        points: 0,
        recommendReplacement: false,
        replacementEligible: false,
        createdAt: iso(1, 18),
        reason: "Nghỉ ốm có giấy xác nhận.",
        taskCode: "TS-24",
        taskTitle: "Xuất báo cáo tồn kho",
        displayName: "Nguyễn An Khang",
        sessionName: "Kỳ thực tập Thu 2026",
        baseScore: null,
        latePenalty: null,
        score: null,
        submissionStatus: null,
      },
    ];
  return {
    items,
    summary: { total: items.length, active: items.filter((i) => i.status === "active").length, registeredPenalty: items.reduce((sum, i) => sum + i.points, 0) },
    page,
    pageSize: 20,
  };
}

function ownSprintsList(scenario: ReturnType<typeof currentScenario>) {
  if (scenario === "empty") return [];
  return [
    { id: "sp-03", code: "SP-03", name: "Sprint 03 — Mượn/trả sách", status: "active", startDate: iso(-7), endDate: iso(7) },
    { id: "sp-02", code: "SP-02", name: "Sprint 02 — Định danh tài liệu", status: "completed", startDate: iso(-27), endDate: iso(-8) },
    { id: "sp-01", code: "SP-01", name: "Sprint 01 — Khung dự án", status: "completed", startDate: iso(-47), endDate: iso(-28) },
  ];
}

function taskDetail(ctx: PreviewRequestContext): unknown {
  const id = ctx.path.split("/")[2];
  return tasksFor(ctx.scenario).find((t) => t.id === id) ?? {
    ...tasksFor(ctx.scenario)[0],
    sprint: { id: "sp-03", code: "SP-03", name: "Sprint 03 — Mượn/trả sách", status: "active" },
  };
}

function taskComments() {
  return [
    { id: "cm-1", content: "Đã thêm kiểm thử cho nhánh vượt hạn mức.", authorId: "pv-intern-1", createdAt: iso(-2, 14) },
    { id: "cm-2", content: "Nhớ ghi rõ lý do đổi deadline trong mô tả PR.", authorId: "pv-inst-1", createdAt: iso(-1, 9) },
  ];
}

function taskHistory() {
  return [
    { id: "h-1", fromStatus: "doing", toStatus: "review", changedById: "pv-intern-1", reason: "Nộp PR chờ duyệt", createdAt: iso(-2, 16) },
    { id: "h-2", fromStatus: "todo", toStatus: "doing", changedById: "pv-intern-1", reason: null, createdAt: iso(-5, 10) },
  ];
}

function mentorDetailFromPath(ctx: PreviewRequestContext): ReturnType<typeof mentorDetailFor> {
  const id = ctx.path.split("/")[5];
  return mentorDetailFor(id, ctx.scenario);
}

const iso = (dayOffset: number, hour = 9) =>
  new Date(Date.now() + dayOffset * 86400000 + hour * 3600000).toISOString();


function pageOf(ctx: PreviewRequestContext): number {
  return Number(ctx.query.get("page") ?? 1) || 1;
}

function pageSizeOf(ctx: PreviewRequestContext, fallback: number): number {
  const size = Number(ctx.query.get("pageSize") ?? fallback) || fallback;
  return Math.max(1, Math.min(200, size));
}

/** Envelope legacy `{ items, total, page, pageSize }` (question-bank, kpi, career...). */
function itemsPage<T>(items: T[], page: number, pageSize: number) {
  return {
    items,
    total: items.length,
    page: Math.max(1, page),
    pageSize: Math.max(1, pageSize),
  };
}

/** Scenario empty → danh sách rỗng (empty state như các endpoint cũ). */
function nonEmpty<T>(ctx: PreviewRequestContext, items: T[]): T[] {
  return ctx.scenario === "empty" ? [] : items;
}

/** PDF/zip nhỉ dùng cho endpoint tải xuống (parser FE kiểm instanceof Blob). */
function downloadBlob(content: string, type: string): Blob {
  return new Blob([content], { type });
}

const tinyPdf = () =>
  downloadBlob(
    "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 320 160]>>endobj\nxref\n0 4\ntrailer<</Root 1 0 R/Size 4>>\nstartxref\n0\n%%EOF",
    "application/pdf",
  );

const tinyXlsx = () =>
  downloadBlob(
    "PK\u0003\u0004mock-workbook.xlsx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );

const tinyCv = () =>
  downloadBlob("Pham Tan Sinh — CV (mo phong preview).", "application/octet-stream");

/** Đọc body dạng record an toàn cho mutation handlers. */
function bodyOf(ctx: PreviewRequestContext): Record<string, unknown> {
  const body = ctx.body;
  return body && typeof body === "object" && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : {};
}

function bodyString(ctx: PreviewRequestContext, key: string): string | null {
  const value = bodyOf(ctx)[key];
  return typeof value === "string" ? value : null;
}

function bodyNumber(ctx: PreviewRequestContext, key: string): number | null {
  const value = bodyOf(ctx)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Trích id động tại vị trí cố định trong path (đã bỏ query). */
function segment(path: string, index: number): string {
  return decodeURIComponent(path.split("/")[index] ?? "");
}

function requireEnum(value: string | null, allowed: readonly string[], label: string): string {
  if (!value || !allowed.includes(value))
    throw err(422, "VALIDATION_ERROR", `Giá trị ${label} không hợp lệ trong Preview.`);
  return value;
}

const USER_STATUSES = ["active", "pending", "locked", "deleted"] as const;
const KPI_PERIOD_STATUSES = ["draft", "open", "calculating", "finalized", "closed"] as const;
const CYCLE_STATUSES = ["draft", "open", "closed", "archived"] as const;
const SPRINT_STATUSES = ["planned", "active", "completed", "cancelled"] as const;
const REPORT_KINDS = ["progress", "performance", "evaluation", "review", "risk"] as const;
const TASK_STATUSES = ["todo", "doing", "review", "done"] as const;
const TASK_PRIORITIES = ["low", "medium", "high", "critical"] as const;

/** PATCH /tasks/:id (+ /tasks/:id/my) — cập nhật task mock, tăng version. */
function updatedTask(ctx: PreviewRequestContext, idIndex: number): unknown {
  const id = segment(ctx.path, idIndex);
  const list = tasksFor(ctx.scenario);
  const base = list.find((t) => t.id === id) ?? list[0];
  if (!base)
    return {
      id,
      code: "TS-NEW",
      title: bodyString(ctx, "title") ?? "Nhiệm vụ mới",
      description: bodyString(ctx, "description"),
      storyPoints: bodyNumber(ctx, "storyPoints"),
      status: "todo",
      priority: "medium",
      progress: 0,
      dueDate: bodyString(ctx, "dueDate"),
      assigneeId: bodyString(ctx, "assigneeId"),
      projectId: "prj-lib",
      sprintId: "sp-03",
      version: 1,
    };
  const status = bodyString(ctx, "status");
  const priority = bodyString(ctx, "priority");
  const progress = bodyNumber(ctx, "progress");
  const expectedVersion = bodyNumber(ctx, "expectedVersion");
  return {
    ...base,
    ...(bodyString(ctx, "title") ? { title: bodyString(ctx, "title") } : {}),
    ...(bodyString(ctx, "description") !== null ? { description: bodyString(ctx, "description") } : {}),
    ...(bodyString(ctx, "dueDate") ? { dueDate: bodyString(ctx, "dueDate") } : {}),
    ...(bodyString(ctx, "assigneeId") !== null ? { assigneeId: bodyString(ctx, "assigneeId") } : {}),
    ...(bodyNumber(ctx, "storyPoints") !== null ? { storyPoints: bodyNumber(ctx, "storyPoints") } : {}),
    ...(status && (TASK_STATUSES as readonly string[]).includes(status) ? { status: status as typeof base.status } : {}),
    ...(priority && (TASK_PRIORITIES as readonly string[]).includes(priority) ? { priority: priority as typeof base.priority } : {}),
    ...(progress !== null ? { progress: Math.max(0, Math.min(100, progress)) } : {}),
    version: (expectedVersion ?? base.version) + 1,
  };
}

function userDetail(ctx: PreviewRequestContext): unknown {
  const id = ctx.path.split("/")[2];
  return usersFor(ctx.scenario).find((u) => u.id === id) ?? usersFor(ctx.scenario)[0] ?? {
    id,
    email: "unknown@vintern.preview",
    username: "unknown",
    displayName: "Người dùng chưa rõ",
    status: "active",
    lastLoginAt: null,
    createdAt: new Date().toISOString(),
  };
}


function sessionOverviewRows(scenario: ReturnType<typeof currentScenario>) {
  if (scenario === "empty") return [];
  return [
    {
      id: "ss-f26", code: "SS-F26", name: "Kỳ thực tập Thu 2026", status: "active",
      startDate: iso(-30), endDate: iso(60),
      project: { id: "prj-lib", code: "PRJ-LIB", name: "Hệ thống quản lý thư viện số", templateVersion: 2 },
      memberCount: 6, sprintCount: 3, taskTotal: 24, taskDone: 15, taskPercent: 62,
      currentSprint: { id: "sp-03", code: "SP-03", name: "Sprint 03 — Mượn/trả sách" },
      alerts: { overdueTasks: 1, pendingReview: 2, sessionOverdue: false },
    },
    {
      id: "ss-s26", code: "SS-S26", name: "Kỳ thực tập Hè 2026", status: "completed",
      startDate: iso(-150), endDate: iso(-40),
      project: { id: "prj-portal", code: "PRJ-PORTAL", name: "Cổng thông tin tuyển dụng sinh viên CNTT", templateVersion: 1 },
      memberCount: 5, sprintCount: 2, taskTotal: 20, taskDone: 20, taskPercent: 100,
      currentSprint: null,
    },
    {
      id: "ss-w27", code: "SS-W27", name: "Kỳ thực tập Xuân 2027", status: "upcoming",
      startDate: iso(40), endDate: iso(130),
      project: { id: "prj-edu", code: "PRJ-EDU", name: "Ứng dụng học tiếng Việt cho trẻ em", templateVersion: 1 },
      memberCount: 0, sprintCount: 0, taskTotal: 0, taskDone: 0, taskPercent: 0,
      currentSprint: null,
    },
  ];
}

function taskSpecFor(): unknown {
  return {
    requirements:
      "Xây API trả sách quá hạn: tính phí trễ theo bậc ngày, ghi giao dịch bù trừ vào sổ, có kiểm thử đơn vị cho bảng giá.",
    role: "backend",
    dod: [
      "Endpoint POST /returns xử lý đúng bậc phí theo số ngày trễ",
      "Giao dịch bù trừ được ghi vào sổ lương ảo",
      "Kiểm thử đơn vị phủ bảng giá mọi bậc",
      "Tài liệu API cập nhật theo chuẩn repo",
    ],
    documentation: "docs/api/returns.md",
    rubricVersion: "rubric-v3",
    expectedOutput: "Giao dịch bù trừ + JSON phí trễ theo từng dòng mượn",
    estimatedHours: 12,
    skillTags: ["nestjs", "testing", "finance"],
    complexity: "intermediate",
  };
}

function taskSubmissionsFor(): unknown[] {
  return [
    {
      id: "sub-1", taskId: "ts-20", internId: "pv-intern-1",
      prUrl: "https://github.com/vintern-2026/library-system/pull/48",
      summary: "Bổ sung API trả sách + kiểm thử bậc phí",
      status: "submitted", score: null, feedback: null,
      headSha: "9f2c1ab", submittedAt: iso(-1, 11),
    },
    {
      id: "sub-0", taskId: "ts-20", internId: "pv-intern-1",
      prUrl: "https://github.com/vintern-2026/library-system/pull/44",
      summary: "Bản nháp đầu: khung controller",
      status: "withdrawn", score: null, feedback: null,
      headSha: "1aa9d3e", submittedAt: iso(-4, 16),
    },
  ];
}


function codeReviewsFor(): unknown[] {
  return [
    {
      id: "cr-1",
      headSha: "9f2c1ab",
      status: "awaiting_instructor",
      model: "gemini-2.5-pro",
      inputHash: "in-8821",
      errorCode: null,
      result: {
        score: 82,
        rubric: { functional: 85, quality: 80, testing: 78, errors: 82, security: 84, dod: 80 },
        summary: "API trả sách đúng bậc phí; thiếu một nhánh kiểm thử biên.",
        limitations: ["Không chạy được integration test trong preview"],
        findings: [
          { file: "src/returns/fee.ts", line: 42, message: "Bậc phí thứ 3 chưa có test", severity: "warning" },
          { file: "src/returns/controller.ts", line: 15, message: "Thiếu validate ngày trả trước ngày mượn", severity: "error" },
        ],
      },
      evidence: {
        complete: true,
        warnings: [],
        tests: {
          status: "passed",
          passed: 24,
          failed: 0,
          summary: "24 passed",
          executionTimeMs: 1820,
          score: 96,
          checks: [{ name: "build", passed: true, log: "OK" }],
        },
      },
    },
  ];
}

// ---------------------------------------------------------------- routes ----
const NOTIFICATION_CATEGORIES = [
  "system", "task", "session", "evaluation", "announcement",
  "recruitment", "kpi", "salary", "certificate",
] as const;

const routes: RouteHandler[] = [
  // ---- auth
  { method: "POST", test: (p) => p === "/auth/login", handle: login },
  {
    method: "POST",
    test: (p) => p === "/auth/register",
    handle: () => ({ registered: true }),
  },
  { method: "POST", test: (p) => p === "/auth/refresh", handle: refresh },
  {
    method: "POST",
    test: (p) => p === "/auth/logout",
    handle: () => {
      // Đăng xuất preview: xóa "refresh cookie" mô phỏng để reload không tự vào lại.
      activeAccountId = null;
      resetPreviewState();
      return null;
    },
  },
  { method: "GET", test: (p) => p === "/auth/me", handle: me },
  // ---- dashboard
  { method: "GET", test: (p) => p === "/dashboard/admin", handle: (c) => adminDashboard(c.scenario) },
  { method: "GET", test: (p) => p === "/dashboard/instructor", handle: (c) => instructorDashboard(c.account.id, c.scenario) },
  // ---- admin lists
  { method: "GET", test: (p) => p === "/users", handle: (c) => nestPage(usersFor(c.scenario), pageOf(c), 10) },
  { method: "GET", test: (p) => /^\/users\/[^/]+$/.test(p), handle: (c) => userDetail(c) },
  { method: "GET", test: (p) => p === "/roles", handle: () => nestPage(rolesFor(), 1, 10) },
  { method: "GET", test: (p) => p === "/permissions", handle: () => nestPage([], 1, 10) },
  { method: "GET", test: (p) => p === "/groups", handle: () => nestPage(groupsFor(), 1, 10) },
  { method: "GET", test: (p) => p === "/audit-logs", handle: (c) => nestPage(auditsFor(c.scenario), pageOf(c), 10) },
  { method: "GET", test: (p) => p === "/activity-events", handle: (c) => nestPage(activityFor(c.scenario), pageOf(c), 10) },
  {
    method: "GET",
    test: (p) => p === "/settings",
    handle: () => ({ settings: SETTINGS_ROWS.map((row) => ({ ...row })) }),
  },
  {
    method: "GET",
    test: (p) => p === "/health",
    handle: () => ({
      status: "ok",
      checks: {
        backend: "ok",
        database: "ok",
        dbLatencyMs: 12,
        ai: "ok",
        aiProvider: "google",
        aiModel: "gemini-2.5-pro",
      },
      uptimeSeconds: 86400,
      timestamp: new Date().toISOString(),
    }),
  },
  // ---- intern workspace + outcomes
  { method: "GET", test: (p) => p === "/intern/me/workspace", handle: (c) => internWorkspace(c.account.id, c.scenario) },
  { method: "GET", test: (p) => p === "/intern/me/evaluations", handle: (c) => ({ items: evaluationsFor(c.scenario) }) },
  {
    method: "GET",
    test: (p) => /^\/intern\/me\/evaluations\/[^/]+$/.test(p),
    handle: (c) => evaluationsFor(c.scenario)[0] ?? err(404, "NOT_FOUND", "Không tìm thấy đánh giá."),
  },
  { method: "GET", test: (p) => p === "/intern/me/performance", handle: (c) => internPerformance(c.scenario) },
  { method: "GET", test: (p) => p === "/intern/me/kpi", handle: (c) => ({ items: kpisFor(c.scenario) }) },
  {
    method: "GET",
    test: (p) => /^\/intern\/me\/kpi\/[^/]+$/.test(p),
    handle: (c) => kpiDetailFromPath(c),
  },
  { method: "GET", test: (p) => p === "/intern/me/virtual-salary", handle: (c) => salaryFor(c) },
  {
    method: "GET",
    test: (p) => p === "/intern/me/virtual-salary/ledger",
    handle: (c) => paged(ledgerFor(c.scenario), Number(c.query.get("page") ?? 1), 20),
  },
  { method: "GET", test: (p) => p === "/intern/me/certificates", handle: (c) => ({ items: certificatesFor(c.scenario) }) },
  {
    method: "GET",
    test: (p) => /^\/intern\/me\/certificates\/[^/]+$/.test(p),
    handle: (c) => certificatesFor(c.scenario)[0] ?? err(404, "NOT_FOUND", "Không tìm thấy chứng nhận."),
  },
  { method: "GET", test: (p) => p === "/intern/me/ai-recommendations", handle: (c) => recommendationsFor(c.scenario) },
  { method: "POST", test: (p) => p === "/intern/me/ai-recommendations/refresh", handle: (c) => recommendationsFor(c.scenario) },
  // ---- intern work / sprint / project / mentor
  {
    method: "GET",
    test: (p) => p === "/intern/me/sprint/board",
    handle: (c) => boardFor(c.scenario),
  },
  {
    method: "GET",
    test: (p) => /^\/intern\/me\/sprints\/[^/]+\/board$/.test(p),
    handle: (c) => boardFor(c.scenario),
  },
  {
    method: "GET",
    test: (p) => /^\/sprints\/[^/]+\/completion$/.test(p),
    handle: (c) => {
      const tasks = tasksFor(c.scenario);
      const done = tasks.filter((t) => t.status === "done");
      const committed = tasks.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);
      return {
        total: tasks.length,
        done: done.length,
        open: tasks.length - done.length,
        committedStoryPoints: committed,
        completedStoryPoints: done.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0),
      };
    },
  },
  {
    method: "GET",
    test: (p) => p === "/intern/me/sprints",
    handle: (c) => nestPage(ownSprintsList(c.scenario), Number(c.query.get("page") ?? 1), 50),
  },
  {
    method: "GET",
    test: (p) => p === "/intern/me/project",
    handle: (c) => ownProjectFor(c.scenario),
  },
  {
    method: "GET",
    test: (p) => p === "/tasks",
    handle: (c) => nestPage(tasksFor(c.scenario), Number(c.query.get("page") ?? 1), Number(c.query.get("pageSize") ?? 20)),
  },
  {
    method: "GET",
    test: (p) => /^\/tasks\/[^/]+$/.test(p),
    handle: (c) => taskDetail(c),
  },
  {
    method: "GET",
    test: (p) => /^\/tasks\/[^/]+\/comments$/.test(p),
    handle: (c) => nestPage(taskComments(), Number(c.query.get("page") ?? 1), 20),
  },
  {
    method: "POST",
    test: (p) => /^\/tasks\/[^/]+\/comments$/.test(p),
    handle: (c) => {
      const body = (c.body ?? {}) as { content?: string };
      return {
        id: `cm-${Date.now()}`,
        content:
          typeof body.content === "string" && body.content.trim()
            ? body.content
            : "Nhận xét (mặc định khi gửi rỗng).",
        authorId: c.account.id,
        createdAt: new Date().toISOString(),
      };
    },
  },
  {
    method: "GET",
    test: (p) => /^\/tasks\/[^/]+\/history$/.test(p),
    handle: (c) => nestPage(taskHistory(), Number(c.query.get("page") ?? 1), 20),
  },
  // ---- session overview (instructor/admin dashboard + trang sessions)
  {
    method: "GET",
    test: (p) => p === "/sessions/overview",
    handle: (c) => nestPage(sessionOverviewRows(c.scenario), pageOf(c), 10),
  },
  // ---- task spec + submissions (chi tiết công việc)
  {
    method: "GET",
    test: (p) => /^\/tasks\/[^/]+\/spec$/.test(p),
    handle: (c) => (c.scenario === "empty" ? null : taskSpecFor()),
  },
  {
    method: "GET",
    test: (p) => /^\/tasks\/[^/]+\/spec\/source$/.test(p),
    handle: () => ({
      requirements: "Xây API trả sách quá hạn theo bậc phí.",
      notes: "Nguồn spec mẫu trong preview.",
    }),
  },
  {
    method: "GET",
    test: (p) => /^\/tasks\/[^/]+\/submissions$/.test(p),
    handle: (c) => (c.scenario === "empty" ? [] : taskSubmissionsFor()),
  },
  {
    method: "GET",
    test: (p) => /^\/submissions\/[^/]+\/code-reviews$/.test(p),
    handle: (c) => (c.scenario === "empty" ? [] : codeReviewsFor()),
  },
  // ---- github repository access (intern participation page)
  {
    method: "GET",
    test: (p) => p === "/github/me/repository-access",
    handle: (c) => ({
      items: c.scenario === "empty" ? [] : [
        {
          id: "ra-1",
          sessionId: "ss-f26",
          status: "done",
          displayStatus: "done",
          errorCode: null,
          attempts: 1,
          updatedAt: iso(-2, 10),
          nextAttemptAt: iso(-2, 11),
          revision: "ra-rev-1",
          displayName: "Nguyễn An Khang",
          sessionName: "Kỳ thực tập Thu 2026",
          projectName: "Hệ thống quản lý thư viện số",
          role: "joining",
          outcome: "repository-member",
          repositoryUrl: "https://github.com/vintern-2026/library-system",
          retryAllowed: false,
        },
      ],
      summary: [{ status: "done", total: c.scenario === "empty" ? 0 : 1 }],
      limit: 5,
    }),
  },
  // ---- participation replacements (intern)
  {
    method: "GET",
    test: (p) => p === "/participation/me/replacements",
    handle: () => ({ limit: 3, items: [] }),
  },
  // ---- participation (intern + instructor)
  {
    method: "GET",
    test: (p) => p === "/participation/me",
    handle: (c) => participationFor(c.scenario, 1),
  },
  {
    method: "GET",
    test: (p) => /^\/sessions\/[^/]+\/participation$/.test(p),
    handle: (c) => ({
      ...participationFor(c.scenario, 1),
      policy: {
        version: 3,
        configured: true,
        activeFrom: iso(-60),
        warningFrom: 2,
        penaltyFrom: 4,
        replacementFrom: 6,
        penaltyPoints: -2,
        penaltyCap: -10,
      },
    }),
  },
  // ---- notifications (mọi role)
  { method: "GET", test: (p) => p === "/notifications", handle: (c) => notificationsPaged(c) },
  { method: "GET", test: (p) => p === "/notifications/unread-count", handle: (c) => ({ count: unreadCount(c) }) },
  {
    method: "POST",
    test: (p) => /^\/notifications\/[^/]+\/read$/.test(p),
    handle: (c) => {
      markRead(c.path.split("/")[2]);
      return null;
    },
  },
  { method: "POST", test: (p) => p === "/notifications/read-all", handle: (c) => ({ updated: markAllRead(c) }) },
  { method: "GET", test: (p) => p === "/notifications/preferences", handle: () => ({ preferences: preferences }) },
  {
    method: "PUT",
    test: (p) => p === "/notifications/preferences",
    handle: (c) => {
      const body = (c.body ?? {}) as { category?: string; enabled?: boolean };
      const category = NOTIFICATION_CATEGORIES.find((x) => x === body.category);
      if (!category) throw err(422, "VALIDATION_ERROR", "Danh mục thông báo không hợp lệ.");
      const found = preferences.find((p) => p.category === category);
      if (found) found.enabled = Boolean(body.enabled);
      return { preferences: preferences };
    },
  },
  // ---- AI mentor (intern)
  {
    method: "GET",
    test: (p) => p === "/intern/me/ai-mentor/conversations",
    handle: (c) => mentorConversationsFor(c.scenario),
  },
  {
    method: "POST",
    test: (p) => p === "/intern/me/ai-mentor/conversations",
    handle: (c) => mentorConversationsFor(c.scenario).items[0] ?? null,
  },
  {
    method: "GET",
    test: (p) => /^\/intern\/me\/ai-mentor\/conversations\/[^/]+$/.test(p),
    handle: (c) => mentorDetailFromPath(c),
  },
  {
    method: "POST",
    test: (p) => /^\/intern\/me\/ai-mentor\/conversations\/[^/]+\/archive$/.test(p),
    handle: (c) => mentorDetailFromPath(c).conversation,
  },
  {
    method: "POST",
    test: (p) => /^\/intern\/me\/ai-mentor\/conversations\/[^/]+\/messages$/.test(p),
    handle: (c) => {
      const detail = mentorDetailFromPath(c);
      const body = (c.body ?? {}) as { content?: string };
      const userContent = typeof body.content === "string" ? body.content : "";
      const assistantContent =
        "Gợi ý mô phỏng: chia nhỏ thay đổi, viết test cho nhánh chính và ghi chú quyết định trong mô tả PR.";
      mentorAppendMessage(detail.conversation.id, userContent, assistantContent);
      return {
        conversation: detail.conversation,
        userMessage: {
          id: "mm-user-new",
          role: "user",
          content: userContent,
          aiRunId: null,
          createdAt: new Date().toISOString(),
        },
        assistantMessage: {
          id: "mm-ai-new",
          role: "assistant",
          content: assistantContent,
          aiRunId: "run-772",
          createdAt: new Date().toISOString(),
        },
        summary: "Trả lời AI mentor (mô phỏng).",
        followUps: [
          "Chia task này thành các bước nhỏ hơn được không?",
          "Nên viết test gì trước khi mở PR?",
        ],
      };
    },
  },
  // ---- verify public
  {
    method: "GET",
    test: (p) => /^\/certificates\/verify\/[^/]+$/.test(p),
    handle: (c) => {
      const code = decodeURIComponent(c.path.split("/")[3]);
      const cert = certificatesFor("populated").find((x) => x.verificationCode === code);
      if (!cert)
        throw err(404, "CERTIFICATE_NOT_FOUND", "Không tìm thấy chứng nhận với mã này.");
      return {
        valid: cert.status === "issued",
        status: cert.status,
        certificateNumber: cert.certificateNumber,
        holderName: "Nguyễn An Khang",
        role: "Frontend Developer",
        projectName: cert.projectName,
        sessionName: cert.sessionName,
        completedAt: cert.completedAt,
        issuedAt: cert.issuedAt,
        revokedAt: cert.revokedAt,
      };
    },
  },

  /* ==================== GAP-2: mở rộng endpoint cho Preview ==================== */

  // ---- A) ứng tuyển công khai + auth phụ
  {
    method: "GET",
    test: (p) => p === "/applications/rounds",
    handle: () => ({
      items: PUBLIC_ROUNDS.map((r) => ({ id: r.id, name: r.name, closesAt: r.closesAt })),
    }),
  },
  { method: "GET", test: (p) => p === "/applications/me", handle: () => candidateApplication() },
  {
    method: "POST",
    test: (p) => p === "/applications",
    handle: () => ({ received: true }),
  },
  {
    method: "POST",
    test: (p) => p === "/applications/verify",
    handle: () => ({ verified: true, emailHint: "t***inh@vintern.preview" }),
  },
  {
    method: "GET",
    test: (p) => p === "/applications/me/cv",
    handle: () => tinyCv(),
  },
  {
    method: "POST",
    test: (p) => p === "/applications/me/cv",
    handle: () => candidateApplication(),
  },
  {
    method: "POST",
    test: (p) => p === "/applications/leave",
    handle: () => ({ cleared: true }),
  },
  {
    method: "POST",
    test: (p) => p === "/applications/request-access",
    handle: () => ({ queued: true, message: "Liên kết theo dõi hồ sơ sẽ được gửi qua email nếu hồ sơ tồn tại." }),
  },
  {
    method: "POST",
    test: (p) => p === "/auth/forgot-password",
    handle: () => ({ queued: true }),
  },
  {
    method: "POST",
    test: (p) => p === "/auth/change-password",
    handle: () => ({ changed: true }),
  },

  // ---- B) danh tính GitHub
  {
    method: "GET",
    test: (p) => p === "/github/me",
    handle: (c) => githubStatusFor(c.account.id),
  },
  {
    method: "POST",
    test: (p) => p === "/github/connect",
    handle: () => ({
      authorizeUrl:
        "https://github.com/login/oauth/authorize?client_id=preview-vintern&scope=repo%20read%3Aorg",
    }),
  },
  {
    method: "DELETE",
    test: (p) => p === "/github/me",
    handle: () => ({ disconnected: true }),
  },
  {
    method: "GET",
    test: (p) => p === "/github/repository-account",
    handle: (c) => repositoryAccountFor(c.account.id),
  },
  {
    method: "POST",
    test: (p) => p === "/github/repository-account",
    handle: () => repositoryAccountFor("pv-admin-1"),
  },
  {
    method: "GET",
    test: (p) => /^\/sessions\/[^/]+\/github$/.test(p),
    handle: (c) => sessionRepositoryPayload(segment(c.path, 2)),
  },
  {
    method: "POST",
    test: (p) => /^\/sessions\/[^/]+\/github\/provision$/.test(p),
    handle: (c) => sessionRepositoryPayload(segment(c.path, 2)),
  },
  {
    method: "POST",
    test: (p) => /^\/sessions\/[^/]+\/github\/invite$/.test(p),
    handle: () => ({ processed: 2, invited: 1, skipped: 3 }),
  },
  {
    method: "POST",
    test: (p) => /^\/sessions\/[^/]+\/github\/members\/[^/]+\/invite$/.test(p),
    handle: (c) => ({ processed: 1, userId: segment(c.path, 5) }),
  },
  {
    method: "POST",
    test: (p) => /^\/sessions\/[^/]+\/github\/webhook$/.test(p),
    handle: (c) => sessionRepositoryPayload(segment(c.path, 2)),
  },
  {
    method: "POST",
    test: (p) => /^\/sessions\/[^/]+\/github\/reconcile$/.test(p),
    handle: (c) => sessionRepositoryPayload(segment(c.path, 2)),
  },
  {
    method: "GET",
    test: (p) => /^\/sessions\/[^/]+\/github\/activity$/.test(p),
    handle: (c) => githubActivityFor(segment(c.path, 2)),
  },

  // ---- C) quản trị người dùng/vai trò/nhóm (mutation)
  {
    method: "POST",
    test: (p) => p === "/users",
    handle: (c) => {
      const body = bodyOf(c);
      return {
        id: `pv-user-${Date.now().toString(36)}`,
        email: typeof body.email === "string" && body.email ? body.email : "moi@vintern.preview",
        username: bodyString(c, "username") ?? "moi.sinh",
        displayName: bodyString(c, "displayName") ?? "Người dùng mới",
        status: "pending",
        lastLoginAt: null,
        createdAt: new Date().toISOString(),
      };
    },
  },
  {
    method: "PATCH",
    test: (p) => /^\/users\/[^/]+\/status$/.test(p),
    handle: (c) => {
      const id = segment(c.path, 2);
      const status = requireEnum(bodyString(c, "status"), USER_STATUSES, "trạng thái");
      const found = usersFor(c.scenario).find((u) => u.id === id);
      if (found) found.status = status as typeof found.status;
      return (
        found ?? {
          id,
          email: "unknown@vintern.preview",
          username: "unknown",
          displayName: "Người dùng chưa rõ",
          status,
          lastLoginAt: null,
          createdAt: new Date().toISOString(),
        }
      );
    },
  },
  {
    method: "PATCH",
    test: (p) => /^\/users\/[^/]+$/.test(p),
    handle: (c) => {
      const id = segment(c.path, 2);
      const found = usersFor(c.scenario).find((u) => u.id === id);
      if (!found)
        throw err(404, "USER_NOT_FOUND", "Không tìm thấy người dùng trong Preview.");
      const displayName = bodyString(c, "displayName");
      const username = bodyString(c, "username");
      if (displayName) found.displayName = displayName;
      if (username) found.username = username;
      return found;
    },
  },
  {
    method: "GET",
    test: (p) => /^\/roles\/[^/]+\/permissions$/.test(p),
    handle: (c) => nestPage(permissionsForRole(segment(c.path, 2)), pageOf(c), 10),
  },
  {
    method: "POST",
    test: (p) => p === "/groups",
    handle: (c) => ({
      id: `g-${Date.now().toString(36)}`,
      code: bodyString(c, "code") ?? "nhom-moi",
      name: bodyString(c, "name") ?? "Nhóm mới",
      description: bodyString(c, "description"),
    }),
  },
  {
    method: "PATCH",
    test: (p) => /^\/groups\/[^/]+$/.test(p),
    handle: (c) => {
      const id = segment(c.path, 2);
      const found = groupsFor().find((g) => g.id === id);
      if (!found) throw err(404, "GROUP_NOT_FOUND", "Không tìm thấy nhóm trong Preview.");
      const name = bodyString(c, "name");
      const description = bodyString(c, "description");
      if (name) found.name = name;
      if (description !== null) found.description = description;
      return found;
    },
  },
  {
    method: "GET",
    test: (p) => /^\/groups\/[^/]+\/members$/.test(p),
    handle: () => ({ members: GROUP_MEMBERS }),
  },
  {
    method: "POST",
    test: (p) => /^\/groups\/[^/]+\/members$/.test(p),
    handle: () => null,
  },
  {
    method: "DELETE",
    test: (p) => /^\/groups\/[^/]+\/members\/[^/]+$/.test(p),
    handle: () => null,
  },
  {
    method: "GET",
    test: (p) => /^\/groups\/[^/]+\/roles$/.test(p),
    handle: () => ({ roles: GROUP_ROLES }),
  },
  {
    method: "PUT",
    test: (p) => /^\/groups\/[^/]+\/roles$/.test(p),
    handle: (c) => {
      const raw = bodyOf(c).roleCodes;
      const roles = Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : GROUP_ROLES;
      return { roles };
    },
  },

  // ---- D) danh mục
  {
    method: "GET",
    test: (p) => p === "/catalogs/types",
    handle: (c) => nestPage(nonEmpty(c, CATALOG_TYPES), pageOf(c), 10),
  },
  {
    method: "GET",
    test: (p) => p === "/catalogs/items",
    handle: (c) => {
      const typeCode = c.query.get("typeCode");
      const items = nonEmpty(c, CATALOG_ITEMS).filter((i) => !typeCode || i.typeCode === typeCode);
      return nestPage(items, pageOf(c), 10);
    },
  },
  {
    method: "POST",
    test: (p) => p === "/catalogs/types",
    handle: (c) => ({
      id: `ct-${Date.now().toString(36)}`,
      code: bodyString(c, "code") ?? "loai-moi",
      name: bodyString(c, "name") ?? "Loại mới",
      description: bodyString(c, "description"),
    }),
  },
  {
    method: "POST",
    test: (p) => p === "/catalogs/items",
    handle: (c) => ({
      id: `ci-${Date.now().toString(36)}`,
      code: bodyString(c, "code") ?? "gia-tri-moi",
      name: bodyString(c, "name") ?? "Giá trị mới",
      value: bodyString(c, "value"),
      sortOrder: bodyNumber(c, "sortOrder") ?? 99,
      isActive: true,
    }),
  },
  {
    method: "PATCH",
    test: (p) => /^\/catalogs\/items\/[^/]+$/.test(p),
    handle: (c) => {
      const id = segment(c.path, 3);
      const found = CATALOG_ITEMS.find((i) => i.id === id);
      if (!found) throw err(404, "CATALOG_ITEM_NOT_FOUND", "Không tìm thấy giá trị danh mục.");
      const name = bodyString(c, "name");
      const value = bodyString(c, "value");
      const isActive = bodyOf(c).isActive;
      if (name) found.name = name;
      if (value !== null) found.value = value;
      if (typeof isActive === "boolean") found.isActive = isActive;
      return found;
    },
  },

  // ---- E) hệ thống
  {
    method: "GET",
    test: (p) => p === "/admin/system/status",
    handle: () => systemStatusPayload(),
  },
  {
    method: "GET",
    test: (p) => p === "/admin/system/contracts",
    handle: () => systemContractsPayload(true),
  },
  {
    method: "POST",
    test: (p) => p === "/admin/system/contracts/validate",
    handle: () => systemContractsPayload(false),
  },
  {
    method: "GET",
    test: (p) => p === "/admin/system/repositories",
    handle: () => systemRepositoriesPayload(),
  },

  // ---- F) cấu hình AI + agent
  {
    method: "GET",
    test: (p) => p === "/admin/ai-configuration",
    handle: () => aiConfigurationPayload(),
  },
  {
    method: "PUT",
    test: (p) => p === "/admin/ai-configuration",
    handle: (c) => {
      const base = aiConfigurationPayload();
      const model = bodyString(c, "model");
      const timeoutMs = bodyNumber(c, "timeoutMs");
      const maxRetries = bodyNumber(c, "maxRetries");
      const version = bodyNumber(c, "version");
      return {
        ...base,
        policy: {
          model: model ?? base.policy.model,
          timeoutMs: timeoutMs ?? base.policy.timeoutMs,
          maxRetries: maxRetries ?? base.policy.maxRetries,
          version: version ?? base.policy.version,
        },
        source: "Cấu hình vừa lưu qua Preview",
      };
    },
  },
  {
    method: "GET",
    test: (p) => p === "/admin/agents/business-runs",
    handle: () => businessRunsPayload(),
  },
  {
    method: "POST",
    test: (p) => p === "/admin/agents/knowledge-runs",
    handle: (c) => {
      const run = knowledgeRunPayload(`kr-${Date.now().toString(36)}`, "running");
      const requestId = bodyString(c, "requestId");
      return requestId ? { ...run, requestId } : run;
    },
  },
  {
    method: "GET",
    test: (p) => /^\/admin\/agents\/knowledge-runs\/[^/]+$/.test(p),
    handle: (c) => knowledgeRunPayload(segment(c.path, 4), "succeeded"),
  },
  {
    method: "POST",
    test: (p) => /^\/admin\/agents\/knowledge-runs\/[^/]+\/cancel$/.test(p),
    handle: (c) => knowledgeRunPayload(segment(c.path, 4), "cancelled"),
  },
  {
    method: "POST",
    test: (p) => /^\/admin\/agents\/knowledge-runs\/[^/]+\/resume$/.test(p),
    handle: (c) => ({ id: segment(c.path, 4), accepted: true }),
  },

  // ---- G) nghề nghiệp
  {
    method: "GET",
    test: (p) => p === "/admin/career-roles",
    handle: (c) => itemsPage(nonEmpty(c, CAREER_ROLES), pageOf(c), pageSizeOf(c, 20)),
  },
  {
    method: "POST",
    test: (p) => p === "/admin/career-roles",
    handle: (c) => {
      const body = bodyOf(c);
      const weights = body.competencyWeights;
      return {
        code: bodyString(c, "code") ?? "nghe-moi",
        name: bodyString(c, "name") ?? "Nghề mới",
        description: bodyString(c, "description") ?? "",
        level: bodyString(c, "level") ?? "intern",
        language: bodyString(c, "language") ?? "vi",
        requiredSkills: Array.isArray(body.requiredSkills) ? body.requiredSkills.filter((x): x is string => typeof x === "string") : [],
        optionalSkills: Array.isArray(body.optionalSkills) ? body.optionalSkills.filter((x): x is string => typeof x === "string") : [],
        competencyWeights:
          weights && typeof weights === "object" && !Array.isArray(weights)
            ? Object.fromEntries(Object.entries(weights).map(([k, v]) => [k, typeof v === "number" ? v : 0]))
            : {},
        status: "draft",
        acceptingApplications: false,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    },
  },
  {
    method: "PUT",
    test: (p) => /^\/admin\/career-roles\/[^/]+$/.test(p),
    handle: (c) => {
      const code = segment(c.path, 3);
      const found = CAREER_ROLES.find((r) => r.code === code);
      if (!found) throw err(404, "CAREER_ROLE_NOT_FOUND", "Không tìm thấy nghề.");
      const body = bodyOf(c);
      const name = bodyString(c, "name");
      const description = bodyString(c, "description");
      if (name) found.name = name;
      if (description !== null) found.description = description;
      const status = bodyString(c, "status");
      if (status && ["draft", "published", "archived"].includes(status))
        found.status = status as typeof found.status;
      if (typeof body.acceptingApplications === "boolean")
        found.acceptingApplications = body.acceptingApplications;
      return { ...found, version: found.version + 1, updatedAt: new Date().toISOString() };
    },
  },
  {
    method: "POST",
    test: (p) => /^\/admin\/career-roles\/[^/]+\/archive$/.test(p),
    handle: (c) => {
      const code = segment(c.path, 3);
      const found = CAREER_ROLES.find((r) => r.code === code);
      if (!found) throw err(404, "CAREER_ROLE_NOT_FOUND", "Không tìm thấy nghề.");
      return {
        ...found,
        status: "archived",
        acceptingApplications: false,
        version: (bodyNumber(c, "version") ?? found.version) + 1,
        updatedAt: new Date().toISOString(),
      };
    },
  },
  {
    method: "GET",
    test: (p) => /^\/admin\/career-roles\/[^/]+\/revisions$/.test(p),
    handle: (c) => {
      const code = segment(c.path, 3);
      const found = CAREER_ROLES.find((r) => r.code === code) ?? CAREER_ROLES[0];
      const rows = Array.from({ length: found.version }, (_, i) => {
        const version = i + 1;
        return {
          version,
          snapshot: { ...found, version, status: version === found.version ? found.status : "archived" },
          createdBy: "pv-admin-1",
          createdAt: iso(-(found.version - i) * 15),
        };
      }).reverse();
      return itemsPage(rows, pageOf(c), 10);
    },
  },
  {
    method: "GET",
    test: (p) => p === "/career-roles",
    handle: () => ({
      items: CAREER_ROLES
        .filter((r) => r.status === "published" && r.acceptingApplications)
        .map((r) => ({
          code: r.code,
          label: r.label ?? r.name,
          description: r.description,
          level: r.level,
          language: r.language,
          requiredSkills: r.requiredSkills,
          optionalSkills: r.optionalSkills,
          version: r.version,
        })),
    }),
  },
  {
    method: "GET",
    test: (p) => p === "/career-roles/reference",
    handle: () => ({
      items: CAREER_ROLES.map((r) => ({ code: r.code, label: r.label ?? r.name })),
    }),
  },

  // ---- H) chứng nhận (console admin)
  {
    method: "GET",
    test: (p) => p === "/certificates",
    handle: (c) => ({
      items: nonEmpty(c, ADMIN_CERTIFICATES),
      total: c.scenario === "empty" ? 0 : ADMIN_CERTIFICATES.length,
      page: pageOf(c),
      pageSize: pageSizeOf(c, 20),
    }),
  },
  {
    method: "POST",
    test: (p) => p === "/certificates/issue",
    handle: (c) => issuedCertificateFor(bodyString(c, "userId") ?? "pv-intern-1"),
  },
  {
    method: "POST",
    test: (p) => /^\/certificates\/[^/]+\/revoke$/.test(p),
    handle: (c) => {
      const id = segment(c.path, 2);
      const found = ADMIN_CERTIFICATES.find((x) => x.id === id);
      if (!found) throw err(404, "CERTIFICATE_NOT_FOUND", "Không tìm thấy chứng nhận.");
      return {
        ...found,
        status: "revoked",
        revokedAt: new Date().toISOString(),
        revokeReason: bodyString(c, "reason") ?? "Thu hồi qua console Preview.",
      };
    },
  },
  {
    method: "GET",
    test: (p) => /^\/certificates\/[^/]+\/pdf$/.test(p),
    handle: () => tinyPdf(),
  },

  // ---- I) log thư đi
  {
    method: "GET",
    test: (p) => p === "/admin/communications",
    handle: (c) => ({
      items: nonEmpty(c, MAIL_LOG),
      total: c.scenario === "empty" ? 0 : MAIL_LOG.length,
      page: pageOf(c),
      pageSize: pageSizeOf(c, 20),
      transportConfigured: true,
      deliveryMode: "smtp",
    }),
  },
  {
    method: "GET",
    test: (p) => /^\/admin\/communications\/[^/]+\/preview$/.test(p),
    handle: (c) => mailPreview(segment(c.path, 3)),
  },
  {
    method: "POST",
    test: (p) => /^\/admin\/communications\/[^/]+\/resend$/.test(p),
    handle: () => ({ queued: true }),
  },

  // ---- J) kho tri thức
  {
    method: "GET",
    test: (p) => p === "/admin/knowledge",
    handle: (c) =>
      itemsPage(
        nonEmpty(c, KNOWLEDGE_DOCS.map(knowledgeMetadata)),
        pageOf(c),
        pageSizeOf(c, 20),
      ),
  },
  {
    method: "POST",
    test: (p) => p === "/admin/knowledge/import/dry-run",
    handle: (c) => {
      const body = bodyOf(c);
      const entries = Array.isArray(body.entries) ? body.entries : [];
      const rows = entries.map((entry, index) => {
        const row = entry && typeof entry === "object" && !Array.isArray(entry)
          ? (entry as Record<string, unknown>)
          : {};
        const code = typeof row.code === "string" ? row.code : null;
        const exists = code ? KNOWLEDGE_DOCS.some((d) => d.code === code) : false;
        return {
          index,
          code,
          validDraft: true,
          publishable: true,
          exists,
          currentVersion: exists ? (KNOWLEDGE_DOCS.find((d) => d.code === code)?.version ?? 1) : null,
          issues: [],
          publicationIssues: [],
        };
      });
      return {
        total: rows.length,
        validDrafts: rows.length,
        publishable: rows.length,
        mutationsPerformed: 0,
        items: rows,
      };
    },
  },
  {
    method: "GET",
    test: (p) => /^\/admin\/knowledge\/[^/]+$/.test(p),
    handle: (c) => {
      const code = segment(c.path, 3);
      const seed = KNOWLEDGE_DOCS.find((d) => d.code === code);
      if (!seed) throw err(404, "KNOWLEDGE_NOT_FOUND", "Không tìm thấy tài liệu tri thức.");
      return knowledgeDocument(seed);
    },
  },
  {
    method: "POST",
    test: (p) => p === "/admin/knowledge",
    handle: (c) => {
      const body = bodyOf(c);
      const code = bodyString(c, "code") ?? `KL-NEW-${Date.now().toString(36).toUpperCase()}`;
      const draft = body.draft && typeof body.draft === "object" && !Array.isArray(body.draft)
        ? (body.draft as Record<string, unknown>)
        : {};
      const seed = {
        id: `kl-${Date.now().toString(36)}`,
        code,
        version: 1,
        status: "draft" as const,
        kind: (typeof draft.kind === "string" && draft.kind ? draft.kind : "qa") as "qa",
        title: typeof draft.title === "string" && draft.title ? draft.title : "Tài liệu mới",
        summary: typeof draft.summary === "string" && draft.summary ? draft.summary : "Tóm tắt mới.",
        audience: "student_safe" as const,
        purposes: ["mentoring"],
        difficulty: null,
      };
      return knowledgeDocument(seed);
    },
  },
  {
    method: "PUT",
    test: (p) => /^\/admin\/knowledge\/[^/]+$/.test(p),
    handle: (c) => {
      const code = segment(c.path, 3);
      const seed = KNOWLEDGE_DOCS.find((d) => d.code === code);
      if (!seed) throw err(404, "KNOWLEDGE_NOT_FOUND", "Không tìm thấy tài liệu tri thức.");
      const expected = bodyNumber(c, "version") ?? seed.version;
      return knowledgeDocument({ ...seed, version: expected + 1 });
    },
  },
  {
    method: "POST",
    test: (p) => /^\/admin\/knowledge\/[^/]+\/publish$/.test(p),
    handle: (c) => {
      const code = segment(c.path, 3);
      const seed = KNOWLEDGE_DOCS.find((d) => d.code === code);
      if (!seed) throw err(404, "KNOWLEDGE_NOT_FOUND", "Không tìm thấy tài liệu tri thức.");
      const version = bodyNumber(c, "version") ?? seed.version;
      return knowledgeDocument({ ...seed, status: "published", version });
    },
  },
  {
    method: "POST",
    test: (p) => /^\/admin\/knowledge\/[^/]+\/archive$/.test(p),
    handle: (c) => {
      const code = segment(c.path, 3);
      const seed = KNOWLEDGE_DOCS.find((d) => d.code === code);
      if (!seed) throw err(404, "KNOWLEDGE_NOT_FOUND", "Không tìm thấy tài liệu tri thức.");
      const version = bodyNumber(c, "version") ?? seed.version;
      return knowledgeDocument({ ...seed, status: "archived", version });
    },
  },
  {
    method: "POST",
    test: (p) => /^\/admin\/knowledge\/[^/]+\/restore$/.test(p),
    handle: (c) => {
      const code = segment(c.path, 3);
      const seed = KNOWLEDGE_DOCS.find((d) => d.code === code);
      if (!seed) throw err(404, "KNOWLEDGE_NOT_FOUND", "Không tìm thấy tài liệu tri thức.");
      const version = bodyNumber(c, "version") ?? seed.version;
      return knowledgeDocument({ ...seed, status: "draft", version: version + 1 });
    },
  },
  {
    method: "GET",
    test: (p) => /^\/admin\/knowledge\/[^/]+\/revisions$/.test(p),
    handle: (c) => {
      const code = segment(c.path, 3);
      const seed = KNOWLEDGE_DOCS.find((d) => d.code === code);
      if (!seed) throw err(404, "KNOWLEDGE_NOT_FOUND", "Không tìm thấy tài liệu tri thức.");
      return itemsPage(knowledgeRevisions(seed), pageOf(c), 10);
    },
  },
  {
    method: "GET",
    test: (p) => /^\/admin\/knowledge\/[^/]+\/publication-check$/.test(p),
    handle: (c) => {
      const code = segment(c.path, 3);
      const seed = KNOWLEDGE_DOCS.find((d) => d.code === code);
      if (!seed) throw err(404, "KNOWLEDGE_NOT_FOUND", "Không tìm thấy tài liệu tri thức.");
      return {
        code: seed.code,
        currentVersion: seed.version,
        status: seed.status,
        sha256: sha256like(`${seed.code}-v${seed.version}`),
        publishable: seed.status !== "published",
        issues: seed.status === "published" ? ["Tài liệu đã phát hành ở phiên bản này."] : [],
      };
    },
  },

  // ---- K) kỳ KPI + kết quả KPI
  {
    method: "GET",
    test: (p) => p === "/kpi-periods",
    handle: (c) => ({
      items: nonEmpty(c, KPI_PERIODS),
      total: c.scenario === "empty" ? 0 : KPI_PERIODS.length,
      pageSize: 20,
    }),
  },
  {
    method: "POST",
    test: (p) => p === "/kpi-periods",
    handle: (c) => {
      const now = new Date().toISOString();
      return {
        id: `kpi-${Date.now().toString(36)}`,
        code: bodyString(c, "code") ?? "KPI-NEW",
        name: bodyString(c, "name") ?? "Kỳ KPI mới",
        startDate: bodyString(c, "startDate") ?? iso(0),
        endDate: bodyString(c, "endDate") ?? iso(30),
        status: "draft",
        ruleVersion: "kpi-rule-v3",
        createdAt: now,
        updatedAt: now,
      };
    },
  },
  {
    method: "PATCH",
    test: (p) => /^\/kpi-periods\/[^/]+$/.test(p),
    handle: (c) => {
      const id = segment(c.path, 2);
      const found = KPI_PERIODS.find((k) => k.id === id);
      if (!found) throw err(404, "KPI_PERIOD_NOT_FOUND", "Không tìm thấy kỳ KPI.");
      const name = bodyString(c, "name");
      const startDate = bodyString(c, "startDate");
      const endDate = bodyString(c, "endDate");
      if (name) found.name = name;
      if (startDate) found.startDate = startDate;
      if (endDate) found.endDate = endDate;
      return { ...found, updatedAt: new Date().toISOString() };
    },
  },
  {
    method: "POST",
    test: (p) => /^\/kpi-periods\/[^/]+\/status$/.test(p),
    handle: (c) => {
      const id = segment(c.path, 2);
      const found = KPI_PERIODS.find((k) => k.id === id);
      if (!found) throw err(404, "KPI_PERIOD_NOT_FOUND", "Không tìm thấy kỳ KPI.");
      const status = requireEnum(bodyString(c, "status"), KPI_PERIOD_STATUSES, "trạng thái kỳ KPI");
      return { ...found, status, updatedAt: new Date().toISOString() };
    },
  },
  {
    method: "POST",
    test: (p) => /^\/kpi-periods\/[^/]+\/calculate$/.test(p),
    handle: (c) => {
      const id = segment(c.path, 2);
      const found = KPI_PERIODS.find((k) => k.id === id) ?? KPI_PERIODS[0];
      return {
        period: { ...found, status: "calculating", updatedAt: new Date().toISOString() },
        calculated: c.scenario === "empty" ? 0 : 4,
        insufficientData: c.scenario === "empty" ? 0 : 2,
      };
    },
  },
  {
    method: "POST",
    test: (p) => /^\/kpi-periods\/[^/]+\/finalize$/.test(p),
    handle: (c) => {
      const id = segment(c.path, 2);
      const found = KPI_PERIODS.find((k) => k.id === id) ?? KPI_PERIODS[0];
      return { ...found, status: "finalized", updatedAt: new Date().toISOString() };
    },
  },
  {
    method: "GET",
    test: (p) => /^\/kpi-periods\/[^/]+\/results$/.test(p),
    handle: (c) => {
      const periodId = segment(c.path, 2);
      const rows = nonEmpty(c, KPI_RESULTS).filter((r) => r.periodId === periodId);
      return { items: rows, total: rows.length, pageSize: 20 };
    },
  },
  {
    method: "GET",
    test: (p) => /^\/kpi-results\/[^/]+$/.test(p),
    handle: (c) => {
      const id = segment(c.path, 2);
      const result = KPI_RESULTS.find((r) => r.id === id) ?? KPI_RESULTS[0];
      if (!result) throw err(404, "KPI_RESULT_NOT_FOUND", "Không tìm thấy kết quả KPI.");
      return { result, metrics: KPI_METRICS };
    },
  },

  // ---- L) hiệu suất
  {
    method: "GET",
    test: (p) => p === "/performance/interns",
    handle: (c) => {
      const items = nonEmpty(c, PERFORMANCE_MEMBERS);
      return {
        items,
        total: items.length,
        page: pageOf(c),
        pageSize: pageSizeOf(c, 10),
      };
    },
  },
  {
    method: "GET",
    test: (p) => /^\/performance\/interns\/[^/]+$/.test(p),
    handle: (c) => internPerformance(c.scenario),
  },
  {
    method: "GET",
    test: (p) => /^\/performance\/interns\/[^/]+\/ai-recommendations$/.test(p),
    handle: (c) => recommendationsFor(c.scenario),
  },
  {
    method: "GET",
    test: (p) => /^\/performance\/interns\/[^/]+\/detail$/.test(p),
    handle: (c) => studentDetailPayload(segment(c.path, 3), pageOf(c)),
  },

  // ---- M) ngân hàng câu hỏi
  {
    method: "GET",
    test: (p) => p === "/admin/question-bank",
    handle: (c) => {
      const q = (c.query.get("q") ?? c.query.get("search") ?? "").trim().toLowerCase();
      const roleCode = c.query.get("roleCode") ?? "";
      const phase = c.query.get("phase") ?? "";
      const status = c.query.get("status") ?? "";
      const rows = nonEmpty(c, BANK_QUESTIONS).filter((item) => {
        if (q && !item.prompt.toLowerCase().includes(q) && !item.tags.some((t) => t.toLowerCase().includes(q)))
          return false;
        if (roleCode && item.roleCode !== roleCode) return false;
        if (phase && item.phase !== phase) return false;
        if (status && (status === "active") !== item.isActive) return false;
        return true;
      });
      return {
        items: rows,
        total: rows.length,
        page: pageOf(c),
        pageSize: pageSizeOf(c, 10),
        coverage: c.scenario === "empty" ? [] : questionCoverage(),
      };
    },
  },
  {
    method: "POST",
    test: (p) => p === "/admin/question-bank",
    handle: (c) => {
      const body = bodyOf(c);
      return {
        id: `qb-${Date.now().toString(36)}`,
        roleCode: bodyString(c, "roleCode") ?? "frontend",
        phase: bodyString(c, "phase") ?? "technical",
        difficulty: bodyString(c, "difficulty") ?? "medium",
        language: bodyString(c, "language") ?? "vi",
        prompt: bodyString(c, "prompt") ?? "Câu hỏi mới?",
        expectedConcepts: Array.isArray(body.expectedConcepts) ? body.expectedConcepts.filter((x): x is string => typeof x === "string") : [],
        exampleAnswer: bodyString(c, "exampleAnswer") ?? "Câu trả lời mẫu.",
        scoringRubric: bodyString(c, "scoringRubric") ?? "Rubric mẫu.",
        followUpHints: Array.isArray(body.followUpHints) ? body.followUpHints.filter((x): x is string => typeof x === "string") : [],
        tags: Array.isArray(body.tags) ? body.tags.filter((x): x is string => typeof x === "string") : [],
        isActive: true,
        sortOrder: bodyNumber(c, "sortOrder") ?? 99,
        version: 1,
        updatedAt: new Date().toISOString(),
      };
    },
  },
  {
    method: "PUT",
    test: (p) => /^\/admin\/question-bank\/[^/]+$/.test(p),
    handle: (c) => {
      const id = segment(c.path, 3);
      const found = BANK_QUESTIONS.find((q) => q.id === id);
      if (!found) throw err(404, "QUESTION_NOT_FOUND", "Không tìm thấy câu hỏi.");
      const prompt = bodyString(c, "prompt");
      if (prompt) found.prompt = prompt;
      const difficulty = bodyString(c, "difficulty");
      if (difficulty && ["easy", "medium", "hard"].includes(difficulty))
        found.difficulty = difficulty as typeof found.difficulty;
      const isActive = bodyOf(c).isActive;
      if (typeof isActive === "boolean") found.isActive = isActive;
      return { ...found, version: found.version + 1, updatedAt: new Date().toISOString() };
    },
  },
  {
    method: "DELETE",
    test: (p) => /^\/admin\/question-bank\/[^/]+$/.test(p),
    handle: (c) => {
      const id = segment(c.path, 3);
      const found = BANK_QUESTIONS.find((q) => q.id === id);
      if (!found) throw err(404, "QUESTION_NOT_FOUND", "Không tìm thấy câu hỏi.");
      found.isActive = false;
      return { ...found, version: found.version + 1, updatedAt: new Date().toISOString() };
    },
  },

  // ---- N) đợt tuyển + hồ sơ trong đợt
  {
    method: "GET",
    test: (p) => p === "/recruitment-rounds",
    handle: (c) => ({ items: nonEmpty(c, PUBLIC_ROUNDS) }),
  },
  {
    method: "POST",
    test: (p) => p === "/recruitment-rounds",
    handle: (c) => ({
      id: `rr-${Date.now().toString(36)}`,
      name: bodyString(c, "name") ?? "Đợt tuyển mới",
      status: "open",
      opensAt: bodyString(c, "opensAt") ?? iso(0),
      closesAt: bodyString(c, "closesAt") ?? iso(20, 17),
    }),
  },
  {
    method: "GET",
    test: (p) => /^\/recruitment-rounds\/[^/]+$/.test(p),
    handle: (c) => {
      const id = segment(c.path, 2);
      const round = PUBLIC_ROUNDS.find((r) => r.id === id) ?? PUBLIC_ROUNDS[0];
      return { ...round, slots: ROUND_SLOTS };
    },
  },
  {
    method: "POST",
    test: (p) => /^\/recruitment-rounds\/[^/]+\/status$/.test(p),
    handle: (c) => {
      const id = segment(c.path, 2);
      const round = PUBLIC_ROUNDS.find((r) => r.id === id) ?? PUBLIC_ROUNDS[0];
      const status = bodyString(c, "status");
      return { ...round, status: status ?? round.status };
    },
  },
  {
    method: "POST",
    test: (p) => /^\/recruitment-rounds\/[^/]+\/slots$/.test(p),
    handle: (c) => {
      const id = segment(c.path, 2);
      const round = PUBLIC_ROUNDS.find((r) => r.id === id) ?? PUBLIC_ROUNDS[0];
      const slot = {
        id: `slot-${Date.now().toString(36)}`,
        roleCode: bodyString(c, "roleCode") ?? "frontend",
        startsAt: bodyString(c, "startsAt") ?? iso(3, 9),
        endsAt: bodyString(c, "endsAt") ?? iso(3, 11),
        timezone: bodyString(c, "timezone") ?? "Asia/Ho_Chi_Minh",
        capacity: bodyNumber(c, "capacity") ?? 4,
        booked: 0,
        status: "open",
        minimumPreparationMinutes: bodyNumber(c, "minimumPreparationMinutes") ?? 30,
        credentialsLeadMinutes: bodyNumber(c, "credentialsLeadMinutes") ?? 60,
      };
      return { ...round, slots: [...ROUND_SLOTS, slot] };
    },
  },
  {
    method: "POST",
    test: (p) => /^\/recruitment-rounds\/[^/]+\/slots\/[^/]+\/close$/.test(p),
    handle: () => ({ closed: true }),
  },
  {
    method: "GET",
    test: (p) => /^\/recruitment-rounds\/[^/]+\/applications$/.test(p),
    handle: (c) => ({
      items: nonEmpty(c, ROUND_APPLICATIONS),
      total: c.scenario === "empty" ? 0 : ROUND_APPLICATIONS.length,
      page: pageOf(c),
    }),
  },
  {
    method: "GET",
    test: (p) => /^\/recruitment-rounds\/[^/]+\/applications\/[^/]+$/.test(p),
    handle: (c) => staffApplicationPayload(segment(c.path, 4)),
  },
  {
    method: "GET",
    test: (p) => /^\/recruitment-rounds\/[^/]+\/applications\/[^/]+\/cv$/.test(p),
    handle: () => tinyCv(),
  },
  {
    method: "POST",
    test: (p) => /^\/recruitment-rounds\/[^/]+\/applications\/[^/]+\/retake$/.test(p),
    handle: () => ({ rebooked: true, slotId: "slot-11" }),
  },
  {
    method: "POST",
    test: (p) => /^\/recruitment-rounds\/[^/]+\/applications\/[^/]+\/(reschedule|cancel|retry)$/.test(p),
    handle: (c) => ({ updated: true, applicationId: segment(c.path, 4) }),
  },
  {
    method: "POST",
    test: (p) => /^\/recruitment-rounds\/[^/]+\/applications\/[^/]+\/resend-credentials$/.test(p),
    handle: () => ({ queued: true }),
  },
  {
    method: "GET",
    test: (p) => /^\/recruitment-rounds\/[^/]+\/applications\/[^/]+\/credential-recovery$/.test(p),
    handle: () => ({
      allowed: true,
      message: "Cho phép gửi lại thông tin đăng nhập một lần trong khung giờ này.",
      revision: `rev-${Date.now().toString(36)}`,
      expiresAt: iso(0, 18),
    }),
  },
  {
    method: "POST",
    test: (p) => /^\/recruitment-rounds\/[^/]+\/applications\/[^/]+\/recover-credentials$/.test(p),
    handle: () => ({ recovered: true, duplicate: false, mailId: "ml-11" }),
  },

  // ---- O) báo cáo
  {
    method: "GET",
    test: (p) => p === "/reports",
    handle: (c) => {
      const kind = c.query.get("kind") ?? "";
      const rows = nonEmpty(c, REPORT_LIST).filter((r) => !kind || r.kind === kind);
      return { items: rows, total: rows.length, counts: c.scenario === "empty" ? [] : reportCounts() };
    },
  },
  {
    method: "GET",
    test: (p) => /^\/reports\/[^/]+$/.test(p),
    handle: (c) => reportDetailPayload(segment(c.path, 2)),
  },
  {
    method: "POST",
    test: (p) => p === "/reports",
    handle: (c) => {
      const kind = requireEnum(bodyString(c, "kind"), REPORT_KINDS, "loại báo cáo");
      const projectId = bodyString(c, "projectId") ?? "prj-lib";
      const project = PROJECT_ROWS.find((p) => p.id === projectId) ?? PROJECT_ROWS[0];
      const detail = reportDetailPayload("rp-1");
      return {
        ...detail,
        id: `rp-${Date.now().toString(36)}`,
        title: bodyString(c, "title") ?? `Báo cáo ${kind} mới`,
        kind,
        projectId,
        projectName: project.name,
        createdAt: new Date().toISOString(),
        snapshot: { ...detail.snapshot, projectName: project.name, scope: { ...detail.snapshot.scope, projectId } },
      };
    },
  },
  {
    method: "GET",
    test: (p) => /^\/reports\/[^/]+\/pdf$/.test(p),
    handle: () => tinyPdf(),
  },
  {
    method: "GET",
    test: (p) => /^\/reports\/[^/]+\/xlsx$/.test(p),
    handle: () => tinyXlsx(),
  },

  // ---- P) lương ảo (admin)
  {
    method: "GET",
    test: (p) => p === "/virtual-salary",
    handle: (c) => ({
      items: nonEmpty(c, SALARY_LEDGER),
      total: c.scenario === "empty" ? 0 : SALARY_LEDGER.length,
      pageSize: 20,
    }),
  },
  {
    method: "POST",
    test: (p) => /^\/virtual-salary\/generate\/[^/]+$/.test(p),
    handle: (c) => ({
      kpiPeriodId: segment(c.path, 3),
      generated: c.scenario === "empty" ? 0 : 4,
      skipped: c.scenario === "empty" ? 0 : 2,
      unit: "VND",
    }),
  },
  {
    method: "POST",
    test: (p) => p === "/virtual-salary/adjustments",
    handle: (c) => ({
      id: `lg-${Date.now().toString(36)}`,
      userId: bodyString(c, "userId") ?? "pv-intern-1",
      kpiPeriodId: null,
      type: bodyString(c, "type") ?? "adjustment",
      amount: bodyNumber(c, "amount") ?? 50000,
      unit: "VND",
      description: bodyString(c, "reason") ?? "Điều chỉnh thủ công (Preview)",
      createdAt: new Date().toISOString(),
    }),
  },
  {
    method: "GET",
    test: (p) => /^\/virtual-salary\/users\/[^/]+\/balance$/.test(p),
    handle: (c) => {
      const userId = segment(c.path, 3);
      const rows = SALARY_LEDGER.filter((r) => r.userId === userId);
      return {
        balance: rows.reduce((sum, r) => sum + r.amount, 0),
        unit: "VND",
        virtual: true,
        earnedThisPeriod: c.scenario === "empty" ? 0 : rows.at(-1)?.amount ?? 0,
        latestEntries: rows.slice(-5),
      };
    },
  },

  // ---- Q) phiên thực tập (quản trị)
  {
    method: "GET",
    test: (p) => p === "/sessions/instructor-options",
    handle: (c) => nestPage(nonEmpty(c, INSTRUCTOR_ROW), pageOf(c), 10),
  },
  {
    method: "GET",
    test: (p) => p === "/sessions/member-options",
    handle: (c) =>
      nestPage(
        nonEmpty(c, SESSION_MEMBERS.map((m) => ({ userId: m.userId, displayName: m.displayName, email: m.email }))),
        pageOf(c),
        10,
      ),
  },
  {
    method: "GET",
    test: (p) => p === "/sessions",
    handle: (c) => nestPage(nonEmpty(c, SESSION_ROWS), pageOf(c), 10),
  },
  {
    method: "POST",
    test: (p) => p === "/sessions",
    handle: (c) => {
      const code = bodyString(c, "code") ?? "SS-NEW";
      return {
        id: code.toLowerCase(),
        code,
        name: bodyString(c, "name") ?? "Kỳ thực tập mới",
        status: bodyString(c, "status") ?? "upcoming",
        domainCategory: null,
        description: bodyString(c, "description") ?? null,
        startDate: bodyString(c, "startDate") ?? iso(30),
        endDate: bodyString(c, "endDate") ?? iso(120),
        leadInstructorId: bodyString(c, "leadInstructorId"),
        mentorId: null,
        technologies: [],
      };
    },
  },
  {
    method: "GET",
    test: (p) => /^\/sessions\/[^/]+$/.test(p),
    handle: (c) => {
      const id = segment(c.path, 2);
      const row = SESSION_ROWS.find((s) => s.id === id) ?? SESSION_ROWS[0];
      const overview = sessionOverviewRows(c.scenario).find((s) => s.id === row.id)
        ?? sessionOverviewRows(c.scenario)[0];
      return {
        ...row,
        overview: c.scenario === "empty"
          ? {
            id: row.id, code: row.code, name: row.name, status: row.status,
            startDate: row.startDate, endDate: row.endDate,
            project: null, memberCount: 0, sprintCount: 0, taskTotal: 0, taskDone: 0, taskPercent: 0,
            currentSprint: null,
          }
          : overview,
        projectSnapshot: c.scenario === "empty"
          ? null
          : PROJECT_ROWS.find((p) => p.id === row.id.replace(/^ss-/, "prj-")) ?? PROJECT_ROWS[0],
        members: nonEmpty(c, SESSION_MEMBERS),
        milestones: nonEmpty(c, SESSION_MILESTONES),
        sprintProgress: nonEmpty(c, SESSION_SPRINT_PROGRESS),
      };
    },
  },
  {
    method: "PATCH",
    test: (p) => /^\/sessions\/[^/]+$/.test(p),
    handle: (c) => {
      const id = segment(c.path, 2);
      const row = SESSION_ROWS.find((s) => s.id === id) ?? SESSION_ROWS[0];
      const status = bodyString(c, "status");
      return { ...row, status: status ?? row.status };
    },
  },
  {
    method: "GET",
    test: (p) => /^\/sessions\/[^/]+\/members$/.test(p),
    handle: (c) => ({ members: nonEmpty(c, SESSION_MEMBERS) }),
  },
  {
    method: "POST",
    test: (p) => /^\/sessions\/[^/]+\/members$/.test(p),
    handle: () => null,
  },
  {
    method: "DELETE",
    test: (p) => /^\/sessions\/[^/]+\/members\/[^/]+$/.test(p),
    handle: () => null,
  },
  {
    method: "GET",
    test: (p) => /^\/sessions\/[^/]+\/instructors$/.test(p),
    handle: (c) => ({ instructors: nonEmpty(c, INSTRUCTOR_ROW) }),
  },
  {
    method: "POST",
    test: (p) => /^\/sessions\/[^/]+\/instructors$/.test(p),
    handle: () => null,
  },
  {
    method: "DELETE",
    test: (p) => /^\/sessions\/[^/]+\/instructors\/[^/]+$/.test(p),
    handle: () => null,
  },
  {
    method: "GET",
    test: (p) => /^\/sessions\/[^/]+\/milestones$/.test(p),
    handle: (c) => ({ milestones: nonEmpty(c, SESSION_MILESTONES) }),
  },
  {
    method: "POST",
    test: (p) => /^\/sessions\/[^/]+\/milestones$/.test(p),
    handle: (c) => ({
      id: `ms-${Date.now().toString(36)}`,
      title: bodyString(c, "title") ?? "Cột mốc mới",
      status: bodyString(c, "status") ?? "pending",
      dueDate: bodyString(c, "dueDate") ?? iso(30),
    }),
  },
  {
    method: "PATCH",
    test: (p) => /^\/sessions\/[^/]+\/milestones\/[^/]+$/.test(p),
    handle: (c) => {
      const milestoneId = segment(c.path, 4);
      const found = SESSION_MILESTONES.find((m) => m.id === milestoneId) ?? SESSION_MILESTONES[0];
      const title = bodyString(c, "title");
      const status = bodyString(c, "status");
      const dueDate = bodyString(c, "dueDate");
      return {
        ...found,
        ...(title ? { title } : {}),
        ...(status ? { status } : {}),
        ...(dueDate ? { dueDate } : {}),
      };
    },
  },
  {
    method: "DELETE",
    test: (p) => /^\/sessions\/[^/]+\/milestones\/[^/]+$/.test(p),
    handle: () => null,
  },
  {
    method: "GET",
    test: (p) => /^\/sessions\/[^/]+\/timeline$/.test(p),
    handle: (c) => nestPage(nonEmpty(c, SESSION_TIMELINE), pageOf(c), 10),
  },
  {
    method: "GET",
    test: (p) => /^\/sessions\/[^/]+\/work$/.test(p),
    handle: (c) => nestPage(nonEmpty(c, sessionWorkPayload()), pageOf(c), 20),
  },

  // ---- R) dự án
  {
    method: "GET",
    test: (p) => p === "/projects/filter-options",
    handle: () => ({
      domains: ["library", "portal", "education"],
      technologies: ["Next.js", "NestJS", "PostgreSQL", "Redis", "React Native", "Astro"],
    }),
  },
  {
    method: "GET",
    test: (p) => p === "/projects",
    handle: (c) => nestPage(nonEmpty(c, PROJECT_ROWS), pageOf(c), 10),
  },
  {
    method: "POST",
    test: (p) => p === "/projects",
    handle: (c) => {
      const code = bodyString(c, "code") ?? "PRJ-NEW";
      return {
        id: code.toLowerCase(),
        code,
        name: bodyString(c, "name") ?? "Dự án mới",
        status: bodyString(c, "status") ?? "draft",
        domainCategory: null,
        description: bodyString(c, "description") ?? null,
        startDate: bodyString(c, "startDate") ?? iso(30),
        endDate: bodyString(c, "endDate") ?? iso(120),
        mentorId: bodyString(c, "mentorId"),
        difficulty: bodyString(c, "difficulty") ?? "beginner",
        capacity: bodyNumber(c, "capacity") ?? 5,
        technologies: [],
      };
    },
  },
  {
    method: "GET",
    test: (p) => /^\/projects\/[^/]+$/.test(p),
    handle: (c) => {
      const id = segment(c.path, 2);
      return (
        PROJECT_ROWS.find((p) => p.id === id) ??
        PROJECT_ROWS.find((p) => p.id === "prj-lib") ??
        PROJECT_ROWS[0]
      );
    },
  },
  {
    method: "PATCH",
    test: (p) => /^\/projects\/[^/]+$/.test(p),
    handle: (c) => {
      const id = segment(c.path, 2);
      const found = PROJECT_ROWS.find((p) => p.id === id);
      if (!found) throw err(404, "PROJECT_NOT_FOUND", "Không tìm thấy dự án trong Preview.");
      const status = bodyString(c, "status");
      const name = bodyString(c, "name");
      const description = bodyString(c, "description");
      return {
        ...found,
        ...(name ? { name } : {}),
        ...(description !== null ? { description } : {}),
        ...(status ? { status } : {}),
      };
    },
  },
  {
    method: "GET",
    test: (p) => /^\/projects\/[^/]+\/members$/.test(p),
    handle: (c) => ({ members: nonEmpty(c, PROJECT_MEMBERS) }),
  },
  {
    method: "GET",
    test: (p) => /^\/projects\/[^/]+\/slots$/.test(p),
    handle: (c) => ({ slots: nonEmpty(c, PROJECT_SLOTS) }),
  },
  {
    method: "GET",
    test: (p) => /^\/projects\/[^/]+\/sessions$/.test(p),
    handle: (c) => ({ sessions: nonEmpty(c, PROJECT_SESSIONS) }),
  },
  {
    method: "POST",
    test: (p) => /^\/projects\/[^/]+\/claim$/.test(p),
    handle: (c) => ({ id: segment(c.path, 2).toLowerCase() }),
  },
  {
    method: "GET",
    test: (p) => /^\/projects\/[^/]+\/template-context$/.test(p),
    handle: () => projectTemplateContextPayload(),
  },
  {
    method: "GET",
    test: (p) => /^\/projects\/[^/]+\/template-assessment$/.test(p),
    handle: () => templateAssessmentPayload(2),
  },

  // ---- S) burndown sprint (dashboard)
  {
    method: "GET",
    test: (p) => /^\/dashboard\/sprints\/[^/]+\/burndown$/.test(p),
    handle: (c) => sprintBurndownPayload(segment(c.path, 3)),
  },

  // ---- T) sprint (quản trị)
  {
    method: "GET",
    test: (p) => p === "/sprints",
    handle: (c) => {
      const status = c.query.get("status") ?? "";
      const rows = nonEmpty(c, SPRINT_ROWS).filter((s) => !status || s.status === status);
      return nestPage(rows, pageOf(c), 10);
    },
  },
  {
    method: "POST",
    test: (p) => p === "/sprints",
    handle: (c) => {
      const code = bodyString(c, "code") ?? `SP-${Date.now().toString(36).toUpperCase()}`;
      return {
        id: code.toLowerCase(),
        code,
        name: bodyString(c, "name") ?? "Sprint mới",
        status: "planned",
        projectId: bodyString(c, "projectId") ?? "prj-lib",
        sessionId: bodyString(c, "sessionId") ?? "ss-f26",
        startDate: bodyString(c, "startDate") ?? iso(8),
        endDate: bodyString(c, "endDate") ?? iso(28),
        description: bodyString(c, "description") ?? null,
        goal: bodyString(c, "goal") ?? null,
        progress: 0,
      };
    },
  },
  {
    method: "GET",
    test: (p) => /^\/sprints\/[^/]+$/.test(p),
    handle: (c) => {
      const id = segment(c.path, 2);
      return SPRINT_ROWS.find((s) => s.id === id) ?? SPRINT_ROWS.find((s) => s.id === "sp-03") ?? SPRINT_ROWS[0];
    },
  },
  {
    method: "PATCH",
    test: (p) => /^\/sprints\/[^/]+$/.test(p),
    handle: (c) => {
      const id = segment(c.path, 2);
      const found = SPRINT_ROWS.find((s) => s.id === id);
      if (!found) throw err(404, "SPRINT_NOT_FOUND", "Không tìm thấy sprint trong Preview.");
      const name = bodyString(c, "name");
      const goal = bodyString(c, "goal");
      const description = bodyString(c, "description");
      const startDate = bodyString(c, "startDate");
      const endDate = bodyString(c, "endDate");
      return {
        ...found,
        ...(name ? { name } : {}),
        ...(goal !== null ? { goal } : {}),
        ...(description !== null ? { description } : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
      };
    },
  },
  {
    method: "POST",
    test: (p) => /^\/sprints\/[^/]+\/status$/.test(p),
    handle: (c) => {
      const id = segment(c.path, 2);
      const found = SPRINT_ROWS.find((s) => s.id === id) ?? SPRINT_ROWS[0];
      const status = requireEnum(bodyString(c, "status"), SPRINT_STATUSES, "trạng thái sprint");
      return { ...found, status, progress: status === "completed" ? 100 : found.progress };
    },
  },
  {
    method: "GET",
    test: (p) => /^\/sprints\/[^/]+\/board$/.test(p),
    handle: (c) => boardFor(c.scenario),
  },

  // ---- U) mutation nhiệm vụ + bài nộp
  {
    method: "POST",
    test: (p) => p === "/tasks",
    handle: (c) => {
      const seq = Date.now().toString(36).toUpperCase().slice(-4);
      return {
        id: `ts-new-${seq.toLowerCase()}`,
        code: `TS-${seq}`,
        title: bodyString(c, "title") ?? "Nhiệm vụ mới",
        description: bodyString(c, "description") ?? null,
        storyPoints: bodyNumber(c, "storyPoints"),
        status: bodyString(c, "status") ?? "todo",
        priority: bodyString(c, "priority") ?? "medium",
        progress: 0,
        dueDate: bodyString(c, "dueDate"),
        assigneeId: bodyString(c, "assigneeId"),
        projectId: bodyString(c, "projectId") ?? "prj-lib",
        sprintId: bodyString(c, "sprintId") ?? "sp-03",
        version: 1,
      };
    },
  },
  {
    method: "PATCH",
    test: (p) => /^\/tasks\/[^/]+$/.test(p),
    handle: (c) => updatedTask(c, 2),
  },
  {
    method: "PATCH",
    test: (p) => /^\/tasks\/[^/]+\/my$/.test(p),
    handle: (c) => updatedTask(c, 2),
  },
  {
    method: "DELETE",
    test: (p) => /^\/tasks\/[^/]+$/.test(p),
    handle: () => null,
  },
  {
    method: "POST",
    test: (p) => /^\/tasks\/[^/]+\/submissions$/.test(p),
    handle: (c) => {
      const taskId = segment(c.path, 2);
      const task = tasksFor(c.scenario).find((t) => t.id === taskId) ?? tasksFor(c.scenario)[0];
      return {
        id: `sub-${Date.now().toString(36)}`,
        taskId,
        internId: c.account.id,
        prUrl: bodyString(c, "prUrl") ?? "https://github.com/vintern-2026/library-system/pull/49",
        summary: bodyString(c, "summary") ?? "Bài nộp mới trong Preview.",
        status: "submitted",
        score: null,
        feedback: null,
        headSha: "ab12cd3",
        submittedAt: new Date().toISOString(),
        ...(task ? { taskVersion: task.version } : {}),
      };
    },
  },
  {
    method: "POST",
    test: (p) => /^\/submissions\/[^/]+\/withdraw$/.test(p),
    handle: () => ({
      id: "sub-1",
      taskId: "ts-20",
      internId: "pv-intern-1",
      prUrl: "https://github.com/vintern-2026/library-system/pull/48",
      summary: "Bổ sung API trả sách + kiểm thử bậc phí",
      status: "withdrawn",
      score: null,
      feedback: null,
      headSha: "9f2c1ab",
      submittedAt: iso(-1, 11),
    }),
  },
  {
    method: "POST",
    test: (p) => /^\/submissions\/[^/]+\/review$/.test(p),
    handle: (c) => {
      const body = bodyOf(c);
      const rubric = body.rubric && typeof body.rubric === "object" && !Array.isArray(body.rubric)
        ? (body.rubric as Record<string, unknown>)
        : {};
      const base = rubric.functional;
      return {
        id: segment(c.path, 2),
        taskId: "ts-20",
        internId: "pv-intern-1",
        prUrl: "https://github.com/vintern-2026/library-system/pull/48",
        summary: "Bổ sung API trả sách + kiểm thử bậc phí",
        status: "approved",
        score: typeof base === "number" ? base : 82,
        feedback: bodyString(c, "feedback") ?? "Đã duyệt qua Preview.",
        headSha: "9f2c1ab",
        submittedAt: iso(-1, 11),
      };
    },
  },
  {
    method: "POST",
    test: (p) => /^\/submissions\/[^/]+\/code-reviews$/.test(p),
    handle: (c) => (c.scenario === "empty" ? [] : codeReviewsFor()),
  },

  // ---- V) kế hoạch AI
  {
    method: "GET",
    test: (p) => p === "/ai-generations/plans",
    handle: (c) => nonEmpty(c, PLAN_SUMMARIES),
  },
  {
    method: "POST",
    test: (p) => p === "/ai-generations/plans/generate",
    handle: () => ({
      planId: `plan-${Date.now().toString(36)}`,
      status: "draft",
      deduped: false,
    }),
  },
  {
    method: "GET",
    test: (p) => /^\/ai-generations\/plans\/[^/]+$/.test(p),
    handle: (c) => planDetailPayload(segment(c.path, 3)),
  },
  {
    method: "POST",
    test: (p) => p === "/ai-generations/sprint-plan/confirm",
    handle: () => ({
      sprintIds: ["sp-03", "sp-04"],
      taskIds: ["ts-20", "ts-21", "ts-22", "ts-23", "ts-24"],
      sprintCount: 2,
      taskCount: 5,
      deduped: false,
    }),
  },
  {
    method: "POST",
    test: (p) => p === "/ai-generations/sprint-plan/draft",
    handle: () => ({
      draft: planDraftBody(),
      warnings: [{ taskTitle: "Đăng ký mượn trước", message: "Hạn nhiệm vụ lệch 1 ngày so với cuối sprint." }],
    }),
  },

  // ---- W) bản dựng dự án
  {
    method: "GET",
    test: (p) => p === "/project-templates",
    handle: (c) => nestPage(nonEmpty(c, TEMPLATE_SUMMARIES), pageOf(c), 10),
  },
  {
    method: "POST",
    test: (p) => p === "/project-templates",
    handle: (c) => {
      const body = bodyOf(c);
      const definition = body.definition && typeof body.definition === "object" && !Array.isArray(body.definition)
        ? (body.definition as Record<string, unknown>)
        : {};
      return {
        id: `tpl-${Date.now().toString(36)}`,
        version: 1,
        ...(definition.code ? { code: String(definition.code) } : {}),
        ...(definition.name ? { name: String(definition.name) } : {}),
      };
    },
  },
  {
    method: "PATCH",
    test: (p) => /^\/project-templates\/[^/]+$/.test(p),
    handle: (c) => {
      const id = segment(c.path, 2);
      const found = TEMPLATE_SUMMARIES.find((t) => t.id === id);
      if (!found) throw err(404, "TEMPLATE_NOT_FOUND", "Không tìm thấy bản dựng dự án.");
      const status = bodyString(c, "status");
      if (status && ["active", "archived"].includes(status))
        found.status = status;
      return { ...found, version: found.version + 1 };
    },
  },
  {
    method: "GET",
    test: (p) => /^\/project-templates\/[^/]+$/.test(p),
    handle: (c) => templateDetailPayload(segment(c.path, 2)),
  },
  {
    method: "POST",
    test: (p) => /^\/project-templates\/[^/]+\/start$/.test(p),
    handle: (c) => ({
      id: segment(c.path, 2),
      projectId: "prj-new-session",
      sessionId: `ss-${Date.now().toString(36)}`,
      templateVersion: 2,
      deduped: false,
    }),
  },
  {
    method: "GET",
    test: (p) => /^\/project-templates\/[^/]+\/revisions$/.test(p),
    handle: (c) => templateRevisionsPayload(segment(c.path, 2)),
  },
  {
    method: "GET",
    test: (p) => /^\/project-templates\/[^/]+\/revisions\/[^/]+$/.test(p),
    handle: (c) => {
      const version = Number(segment(c.path, 4));
      return templateRevisionDetail(segment(c.path, 2), Number.isFinite(version) ? version : 1);
    },
  },

  // ---- X) kỳ đánh giá + phiếu đánh giá (quản trị)
  {
    method: "GET",
    test: (p) => p === "/evaluation-cycles",
    handle: (c) => itemsPage(nonEmpty(c, EVALUATION_CYCLES), pageOf(c), 10),
  },
  {
    method: "POST",
    test: (p) => p === "/evaluation-cycles",
    handle: (c) => {
      return {
        id: `cycle-${Date.now().toString(36)}`,
        code: bodyString(c, "code") ?? "EV-NEW",
        name: bodyString(c, "name") ?? "Kỳ đánh giá mới",
        status: "draft",
        type: bodyString(c, "type") ?? "final",
        projectId: bodyString(c, "projectId") ?? "prj-lib",
        sessionId: bodyString(c, "sessionId") ?? "ss-f26",
        startDate: bodyString(c, "startDate") ?? iso(0),
        endDate: bodyString(c, "endDate") ?? iso(14),
      };
    },
  },
  {
    method: "PATCH",
    test: (p) => /^\/evaluation-cycles\/[^/]+$/.test(p),
    handle: (c) => {
      const id = segment(c.path, 2);
      const found = EVALUATION_CYCLES.find((x) => x.id === id);
      if (!found) throw err(404, "CYCLE_NOT_FOUND", "Không tìm thấy kỳ đánh giá.");
      const name = bodyString(c, "name");
      const startDate = bodyString(c, "startDate");
      const endDate = bodyString(c, "endDate");
      return {
        ...found,
        ...(name ? { name } : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
      };
    },
  },
  {
    method: "POST",
    test: (p) => /^\/evaluation-cycles\/[^/]+\/status$/.test(p),
    handle: (c) => {
      const id = segment(c.path, 2);
      const found = EVALUATION_CYCLES.find((x) => x.id === id);
      if (!found) throw err(404, "CYCLE_NOT_FOUND", "Không tìm thấy kỳ đánh giá.");
      const status = requireEnum(bodyString(c, "status"), CYCLE_STATUSES, "trạng thái kỳ đánh giá");
      return { ...found, status };
    },
  },
  {
    method: "GET",
    test: (p) => /^\/evaluation-cycles\/[^/]+\/criteria$/.test(p),
    handle: (c) => ({ items: nonEmpty(c, EVALUATION_CRITERIA) }),
  },
  {
    method: "POST",
    test: (p) => /^\/evaluation-cycles\/[^/]+\/criteria$/.test(p),
    handle: (c) => ({
      id: `cr-${Date.now().toString(36)}`,
      code: bodyString(c, "code") ?? "CR-NEW",
      name: bodyString(c, "name") ?? "Tiêu chí mới",
      weight: bodyNumber(c, "weight") ?? 20,
      maxScore: bodyNumber(c, "maxScore") ?? 100,
      isRequired: true,
    }),
  },
  {
    method: "PATCH",
    test: (p) => /^\/evaluation-cycles\/[^/]+\/criteria\/[^/]+$/.test(p),
    handle: (c) => {
      const criterionId = segment(c.path, 4);
      const found = EVALUATION_CRITERIA.find((x) => x.id === criterionId) ?? EVALUATION_CRITERIA[0];
      return {
        ...found,
        ...(bodyString(c, "name") ? { name: bodyString(c, "name") } : {}),
        ...(bodyNumber(c, "weight") !== null ? { weight: bodyNumber(c, "weight") } : {}),
        ...(bodyNumber(c, "maxScore") !== null ? { maxScore: bodyNumber(c, "maxScore") } : {}),
      };
    },
  },
  {
    method: "DELETE",
    test: (p) => /^\/evaluation-cycles\/[^/]+\/criteria\/[^/]+$/.test(p),
    handle: () => null,
  },
  {
    method: "GET",
    test: (p) => p === "/evaluations",
    handle: (c) => {
      const cycleId = c.query.get("cycleId") ?? "";
      const status = c.query.get("status") ?? "";
      const rows = nonEmpty(c, MANAGED_EVALUATIONS)
        .filter((e) => !cycleId || e.cycleId === cycleId)
        .filter((e) => !status || e.status === status);
      return itemsPage(rows, pageOf(c), 10);
    },
  },
  {
    method: "POST",
    test: (p) => p === "/evaluations",
    handle: (c) => ({
      id: `ev-${Date.now().toString(36)}`,
      cycleId: bodyString(c, "cycleId") ?? "cycle-2026-final",
      internId: bodyString(c, "internId") ?? "pv-intern-1",
      evaluatorId: c.account.id,
      status: "draft",
      overallScore: null,
      summary: null,
      revisionNumber: 1,
    }),
  },
  {
    method: "GET",
    test: (p) => /^\/evaluations\/[^/]+$/.test(p),
    handle: (c) => evaluationDetailFromPath(c),
  },
  {
    method: "PATCH",
    test: (p) => /^\/evaluations\/[^/]+$/.test(p),
    handle: (c) => {
      const detail = evaluationDetailFromPath(c) as { evaluation: Record<string, unknown> };
      return { evaluation: { ...detail.evaluation, revisionNumber: Number(detail.evaluation.revisionNumber ?? 1) + 1 } };
    },
  },
  {
    method: "POST",
    test: (p) => /^\/evaluations\/[^/]+\/submit$/.test(p),
    handle: (c) => evaluationAdvance(c, "submitted"),
  },
  {
    method: "POST",
    test: (p) => /^\/evaluations\/[^/]+\/finalize$/.test(p),
    handle: (c) => evaluationAdvance(c, "finalized"),
  },
  {
    method: "POST",
    test: (p) => /^\/evaluations\/[^/]+\/ai-suggestions$/.test(p),
    handle: () => aiSuggestionPayload(),
  },
  {
    method: "GET",
    test: (p) => /^\/evaluations\/[^/]+\/ai-suggestions$/.test(p),
    handle: (c) => ({ items: nonEmpty(c, AI_SUGGESTION_ROWS) }),
  },
  {
    method: "GET",
    test: (p) => /^\/evaluations\/[^/]+\/ai-suggestions\/[^/]+$/.test(p),
    handle: (c) => {
      const suggestionId = segment(c.path, 4);
      const row = AI_SUGGESTION_ROWS.find((s) => s.id === suggestionId) ?? AI_SUGGESTION_ROWS[0];
      return {
        ...row,
        evaluationId: segment(c.path, 2),
        aiRunId: "run-772",
        promptVersion: "prompt-2026.10",
        acceptedAt: row.status === "accepted" ? iso(-6, 16) : null,
      };
    },
  },

  // ---- Y) review nhập từ ngoài
  {
    method: "GET",
    test: (p) => p === "/imported-reviews",
    handle: (c) => ({ items: nonEmpty(c, IMPORTED_REVIEWS) }),
  },
  {
    method: "PATCH",
    test: (p) => /^\/imported-reviews\/[^/]+$/.test(p),
    handle: (c) => {
      const id = segment(c.path, 2);
      const found = IMPORTED_REVIEWS.find((r) => r.id === id);
      if (!found) throw err(404, "REVIEW_NOT_FOUND", "Không tìm thấy review.");
      return { version: found.version + 1 };
    },
  },

  // ---- Z) tham dự (instructor ops)
  {
    method: "POST",
    test: (p) => /^\/sessions\/[^/]+\/participation\/refresh$/.test(p),
    handle: () => ({ refreshed: 2, scannedTasks: 24 }),
  },
  {
    method: "POST",
    test: (p) => /^\/sessions\/[^/]+\/participation\/policy$/.test(p),
    handle: () => ({
      version: 4,
      configured: true,
      activeFrom: iso(0),
      warningFrom: 2,
      penaltyFrom: 4,
      replacementFrom: 6,
      penaltyPoints: -2,
      penaltyCap: -10,
    }),
  },
  {
    method: "POST",
    test: (p) => /^\/sessions\/[^/]+\/participation\/incidents\/[^/]+\/resolve$/.test(p),
    handle: (c) => ({ resolved: true, incidentId: segment(c.path, 5) }),
  },
  {
    method: "POST",
    test: (p) => /^\/sessions\/[^/]+\/participation\/tasks\/[^/]+\/extend$/.test(p),
    handle: (c) => ({
      extended: true,
      taskId: segment(c.path, 5),
      until: bodyString(c, "until") ?? iso(3, 17),
    }),
  },
  {
    method: "POST",
    test: (p) => /^\/sessions\/[^/]+\/participation\/incidents\/[^/]+\/replacement-advice$/.test(p),
    handle: () => replacementAdvicePayload(),
  },
  {
    method: "POST",
    test: (p) => /^\/sessions\/[^/]+\/participation\/incidents\/[^/]+\/replacement-preview$/.test(p),
    handle: () => replacementPreviewPayload(),
  },
  {
    method: "POST",
    test: (p) => /^\/sessions\/[^/]+\/participation\/replacements\/[^/]+\/approve$/.test(p),
    handle: () => replacementResultPayload(),
  },
  {
    method: "GET",
    test: (p) => /^\/sessions\/[^/]+\/participation\/replacements\/[^/]+$/.test(p),
    handle: () => ({ ...replacementPreviewPayload(), result: replacementResultPayload() }),
  },
  {
    method: "GET",
    test: (p) => /^\/sessions\/[^/]+\/participation\/repository-access-jobs$/.test(p),
    handle: () => repositoryAccessJobsPayload(),
  },
  {
    method: "POST",
    test: (p) => /^\/sessions\/[^/]+\/participation\/repository-access-jobs\/[^/]+\/retry$/.test(p),
    handle: (c) => ({ queued: true, jobId: segment(c.path, 5) }),
  },

  // ---- AA) tuyển dụng "me" (onboarding)
  {
    method: "GET",
    test: (p) => p === "/recruitment/me",
    handle: (c) => recruitmentMeProfile(c.account.id),
  },
  {
    method: "PATCH",
    test: (p) => p === "/recruitment/me/role",
    handle: (c) => {
      const role = bodyString(c, "role") ?? "frontend";
      const label = CAREER_ROLES.find((r) => r.code === role)?.name ?? role;
      if (c.account.id === "pv-intern-3") {
        onboardingSelectRole(role, label);
        return recruitmentMeProfile(c.account.id);
      }
      return {
        ...recruitmentMeProfile(c.account.id),
        status: "role_selected",
        selectedRole: role,
        selectedRoleLabel: label,
      };
    },
  },
  {
    method: "GET",
    test: (p) => p === "/recruitment/me/result",
    handle: () => recruitmentResultFor(),
  },
  {
    method: "GET",
    test: (p) => p === "/recruitment/me/interviews",
    handle: () => interviewHistoryPayload(),
  },
  {
    method: "POST",
    test: (p) => p === "/recruitment/me/interviews",
    handle: (c) => {
      const id =
        c.account.id === "pv-intern-3"
          ? onboardingStartInterview()
          : `itv-${Date.now().toString(36)}`;
      return interviewPayload(id);
    },
  },
  {
    method: "GET",
    test: (p) => /^\/recruitment\/me\/interviews\/[^/]+$/.test(p),
    handle: (c) => interviewSessionPayload(segment(c.path, 4)),
  },
  {
    method: "GET",
    test: (p) => /^\/recruitment\/me\/interviews\/[^/]+\/questions$/.test(p),
    handle: (c) => {
      const payload = interviewPayload(segment(c.path, 4));
      if (c.account.id === "pv-intern-3") {
        const done = new Set(onboardingAnsweredIds());
        payload.questions = payload.questions.map((q) => ({
          ...q,
          answered: done.has(q.id),
          answeredAt: done.has(q.id) ? new Date().toISOString() : null,
        }));
      }
      return payload;
    },
  },
  {
    method: "PUT",
    test: (p) => /^\/recruitment\/me\/interviews\/[^/]+\/answers\/[^/]+$/.test(p),
    handle: (c) => {
      if (c.account.id === "pv-intern-3") onboardingMarkAnswered(segment(c.path, 6));
      return {
        id: `ans-${Date.now().toString(36)}`,
        sessionQuestionId: segment(c.path, 6),
        answeredAt: new Date().toISOString(),
      };
    },
  },
  {
    method: "PUT",
    test: (p) => /^\/recruitment\/me\/interviews\/[^/]+\/follow-ups\/[^/]+$/.test(p),
    handle: () => ({ saved: true }),
  },
  {
    method: "POST",
    test: (p) => /^\/recruitment\/me\/interviews\/[^/]+\/submit$/.test(p),
    handle: (c) => {
      if (c.account.id === "pv-intern-3") onboardingSubmitInterview();
      return interviewEvaluationPayload(segment(c.path, 4));
    },
  },
  {
    method: "POST",
    test: (p) => /^\/recruitment\/me\/interviews\/[^/]+\/retry-evaluation$/.test(p),
    handle: (c) => interviewEvaluationPayload(segment(c.path, 4)),
  },
  {
    method: "GET",
    test: (p) => /^\/recruitment\/me\/interviews\/[^/]+\/conversation$/.test(p),
    handle: (c) => interviewConversationPayload(segment(c.path, 4)),
  },
  {
    method: "POST",
    test: (p) => /^\/recruitment\/me\/interviews\/[^/]+\/conversation\/next$/.test(p),
    handle: (c) => interviewConversationPayload(segment(c.path, 4)),
  },
  {
    method: "POST",
    test: (p) => /^\/recruitment\/me\/interviews\/[^/]+\/conversation\/clarify$/.test(p),
    handle: (c) => interviewConversationPayload(segment(c.path, 4)),
  },

  // ---- AB) ứng viên tuyển dụng
  {
    method: "GET",
    test: (p) => p === "/recruitment/candidates",
    handle: (c) => ({
      items: nonEmpty(c, RECRUITMENT_CANDIDATES),
      total: c.scenario === "empty" ? 0 : RECRUITMENT_CANDIDATES.length,
    }),
  },
  {
    method: "GET",
    test: (p) => /^\/recruitment\/candidates\/[^/]+$/.test(p),
    handle: (c) => candidateDetailPayload(segment(c.path, 3)),
  },

  // ---- AC) phân công
  {
    method: "GET",
    test: (p) => p === "/assignments",
    handle: (c) => ({ items: nonEmpty(c, ASSIGNMENT_ROWS) }),
  },
  {
    method: "POST",
    test: (p) => p === "/assignments",
    handle: () => ({ id: `asg-${Date.now().toString(36)}` }),
  },
  {
    method: "POST",
    test: (p) => /^\/assignments\/[^/]+\/cancel$/.test(p),
    handle: (c) => ({ id: segment(c.path, 2), status: "cancelled" }),
  },
  {
    method: "POST",
    test: (p) => /^\/assignments\/[^/]+\/complete$/.test(p),
    handle: (c) => ({ id: segment(c.path, 2), status: "completed" }),
  },

  // ---- AD) tiện ích intern
  {
    method: "GET",
    test: (p) => /^\/intern\/me\/certificates\/[^/]+\/pdf$/.test(p),
    handle: () => tinyPdf(),
  },
  {
    method: "GET",
    test: (p) => /^\/intern\/me\/projects\/[^/]+\/learning-package$/.test(p),
    handle: () => learningPackagePayload(),
  },

  // ---- AE) cài đặt
  {
    method: "PATCH",
    test: (p) => p === "/settings",
    handle: (c) => {
      const key = bodyString(c, "key");
      const value = bodyString(c, "value");
      const description = bodyString(c, "description");
      const rows = SETTINGS_ROWS.map((row) =>
        row.key === key
          ? { ...row, value: value ?? row.value, description: description ?? row.description, updatedAt: new Date().toISOString() }
          : row,
      );
      if (key && !rows.some((row) => row.key === key)) {
        rows.unshift({
          key,
          value: value ?? "",
          description: description ?? null,
          updatedAt: new Date().toISOString(),
        });
      }
      return { settings: rows };
    },
  },
];

function kpiDetailFromPath(ctx: PreviewRequestContext): unknown {
  const id = ctx.path.split("/").pop() ?? "";
  return kpiDetailFor(id, ctx.scenario);
}

function recruitmentResultFor(): unknown {
  return recruitmentResultPayload();
}

function evaluationDetailFromPath(ctx: PreviewRequestContext): unknown {
  return evaluationDetailPayload(segment(ctx.path, 2));
}

function evaluationAdvance(ctx: PreviewRequestContext, status: "submitted" | "finalized"): unknown {
  const detail = evaluationDetailPayload(segment(ctx.path, 2)) as {
    evaluation: Record<string, unknown>;
    scores: Array<{ criterionId: string; score: number }>;
  };
  const evaluation: Record<string, unknown> = { ...detail.evaluation, status };
  const average = detail.scores.length
    ? Math.round((detail.scores.reduce((sum, s) => sum + s.score, 0) / detail.scores.length) * 10) / 10
    : 80;
  if (evaluation.overallScore === null || evaluation.overallScore === undefined) {
    evaluation.overallScore = average;
  }
  if (status === "finalized") {
    evaluation.finalizedAt = new Date().toISOString();
  }
  return { evaluation };
}

function salaryFor(ctx: PreviewRequestContext): unknown {
  const ledger = ledgerFor(ctx.scenario);
  return {
    balance: ledger.reduce((sum, e) => sum + e.amount, 0),
    unit: "VND",
    virtual: true,
    earnedThisPeriod: ctx.scenario === "empty" ? 0 : 780000,
    latestEntries: ledger.slice(0, 5),
  };
}

function paged<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const start = (Math.max(1, page) - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page: Math.max(1, page),
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

// ---- notification mutable state (trong phiên preview; reset khi reload)
let notificationStore: ReturnType<typeof notificationsFor> | null = null;
let notificationAccount: string | null = null;
let notificationScenario: string | null = null;

function notifications(ctx: PreviewRequestContext) {
  if (
    notificationStore === null ||
    notificationAccount !== ctx.account.id ||
    notificationScenario !== ctx.scenario
  ) {
    notificationStore = notificationsFor(ctx.account.id, ctx.scenario);
    notificationAccount = ctx.account.id;
    notificationScenario = ctx.scenario;
  }
  return notificationStore;
}

function notificationsPaged(ctx: PreviewRequestContext): unknown {
  const unreadOnly = ctx.query.get("unread") === "true";
  const list = notifications(ctx).filter((n) => (unreadOnly ? !n.readAt : true));
  // parse.ts parsePage — contract Nest chuẩn {data, meta}.
  return nestPage(list, pageOf(ctx), Number(ctx.query.get("pageSize") ?? 20));
}

function unreadCount(ctx: PreviewRequestContext): number {
  return notifications(ctx).filter((n) => !n.readAt).length;
}

function markRead(id: string): void {
  const list = notificationStore ?? [];
  const found = list.find((n) => n.id === id);
  if (found && !found.readAt) found.readAt = new Date().toISOString();
}

function markAllRead(ctx: PreviewRequestContext): number {
  const list = notifications(ctx);
  const updated = list.filter((n) => !n.readAt).length;
  list.forEach((n) => {
    if (!n.readAt) n.readAt = new Date().toISOString();
  });
  return updated;
}

const preferences = NOTIFICATION_CATEGORIES.map((category) => ({
  category,
  enabled: category !== "announcement",
}));

/** Điểm vào duy nhất của transport. */
export function handlePreviewRequest(
  path: string,
  options: { method?: string; body?: unknown; token?: string | null },
): { data: unknown } | { error: ApiError; status: number } {
  const [rawPath, rawQuery] = path.split("?");
  const clean = rawPath.replace(/\/+$/, "") || "/";
  const query = new URLSearchParams(rawQuery ?? "");
  const method = (options.method ?? "GET").toUpperCase();
  const account = accountForRequest(options.token);
  const ctx: PreviewRequestContext = {
    method,
    path: clean,
    query,
    body: options.body,
    token: options.token ?? null,
    account,
    scenario: currentScenario(),
  };
  const route = routes.find((r) => r.method === method && r.test(clean));
  if (!route) {
    return {
      error: err(
        501,
        "PREVIEW_ENDPOINT_NOT_MOCKED",
        `Chưa mock ${method} ${clean} trong Preview (xem src/lib/preview/router.ts).`,
      ),
      status: 501,
    };
  }
  return { data: route.handle(ctx) };
}

/** Cho test + isolation script: danh sách endpoint đã mock. */
export const PREVIEW_MOCKED_ENDPOINTS = routes.map(
  (r) => `${r.method} ${r.test.toString()}`,
);
