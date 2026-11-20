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
  mentorDetailFor,
  notificationsFor,
  ownProjectFor,
  recommendationsFor,
  tasksFor,
} from "./data";
import { currentScenario } from "./store";

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
  { method: "GET", test: (p) => p === "/settings", handle: () => ({ settings: [] }) },
  {
    method: "GET",
    test: (p) => p === "/health",
    handle: () => ({ status: "ok", checks: { backend: "ok", database: "ok" }, generatedAt: new Date().toISOString() }),
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
      return {
        conversation: detail.conversation,
        userMessage: {
          id: "mm-user-new",
          role: "user",
          content: typeof body.content === "string" ? body.content : "",
          aiRunId: null,
          createdAt: new Date().toISOString(),
        },
        assistantMessage: {
          id: "mm-ai-new",
          role: "assistant",
          content:
            "Gợi ý mô phỏng: chia nhỏ thay đổi, viết test cho nhánh chính và ghi chú quyết định trong mô tả PR.",
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
];

function kpiDetailFromPath(ctx: PreviewRequestContext): unknown {
  const id = ctx.path.split("/").pop() ?? "";
  return kpiDetailFor(id, ctx.scenario);
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
