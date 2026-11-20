/**
 * DỮ LIỆU MOCK CHO PREVIEW — "Phiên Thu 2026" một mạch quan hệ thật:
 *   admin ← vai trò hệ thống; giảng viên Giang sở hữu phiên SS-F26
 *   (dự án Hệ thống quản lý thư viện số, sprint SP-03) với 6 thực tập sinh,
 *   mỗi người một trạng thái đại diện (xem accounts.ts).
 *
 * Mọi shape bám parser FE (outcomes.ts, workspace.ts, dashboard.ts) — parser
 * của repo là fail-closed nên shape sai sẽ hiện ErrorState thay vì giả dữ liệu.
 * Marker "VINTERN-PREVIEW-MARKER" nằm ở chuỗi này để script kiểm isolation dò
 * được trong bundle production (nếu lọt vào là FAIL ngay).
 */
import type { PreviewScenario } from "./store";

export const VINTERN_PREVIEW_MARKER = "VINTERN-PREVIEW-MARKER";

const now = new Date();
const iso = (dayOffset: number, hour = 9) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, hour)
    .toISOString();

/** Chữ dài để test tràn dòng — scenario "long-text". */
export const LONG_TEXT =
  "Hệ thống quản lý thư viện số hỗ trợ tra cứu, mượn trả và định danh tài liệu theo chuẩn MARC21 với các kho dữ liệu liên kết phòng đọc, kho sách đặc biệt và các nguồn số dùng chung liên thư viện.";

export interface MockNotification {
  id: string;
  title: string;
  body: string | null;
  linkUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface MockLedger {
  id: string;
  type: "kpi_earning" | "bonus" | "penalty" | "adjustment" | "reversal";
  amount: number;
  unit: string;
  description: string;
  createdAt: string;
}

/** Sinh notification theo ngữ cảnh role + scenario. */
export function notificationsFor(
  accountId: string,
  scenario: PreviewScenario,
): MockNotification[] {
  if (scenario === "empty") return [];
  const long = scenario === "long-text";
  const intern = accountId.startsWith("pv-intern");
  const base: MockNotification[] = intern
    ? [
      {
        id: "nt-101",
        title: "Bài nộp cần kiểm tra",
        body: long
          ? `AI review phát hiện ${LONG_TEXT}`
          : "AI review phát hiện thiếu test cho module mượn sách.",
        linkUrl: "/intern/work",
        readAt: null,
        createdAt: iso(-1, 8),
      },
      {
        id: "nt-102",
        title: "Kỳ KPI tháng này đã chốt",
        body: "Kết quả KPI tháng trước đã được chốt, điểm 82.5.",
        linkUrl: "/intern/kpi",
        readAt: iso(-2, 16),
        createdAt: iso(-2, 16),
      },
      {
        id: "nt-103",
        title: "Đánh giá giữa kỳ đã mở",
        body: "Giảng viên đã mở kỳ đánh giá giữa kỳ, hãy tự đánh giá trước thứ Sáu.",
        linkUrl: "/intern/evaluations",
        readAt: null,
        createdAt: iso(-3, 10),
      },
      {
        id: "nt-104",
        title: "Lương ảo kỳ 10/2026 đã ghi sổ",
        body: "Số dư mới 1.850.000 đ sau điều chỉnh thưởng đề xuất.",
        linkUrl: "/intern/virtual-salary",
        readAt: iso(-5, 9),
        createdAt: iso(-5, 9),
      },
      {
        id: "nt-105",
        title: "Sprint SP-03 bắt đầu",
        body: "Sprint board đã sẵn sàng; kéo task đầu tiên vào Doing khi bắt đầu.",
        linkUrl: "/intern/sprint",
        readAt: null,
        createdAt: iso(-6, 14),
      },
    ]
    : [
      {
        id: "nt-201",
        title: "Hồ sơ mới chờ duyệt",
        body: long
          ? `Ứng viên nộp hồ sơ ${LONG_TEXT}`
          : "Ứng viên Nguyễn Văn B vừa nộp hồ sơ Frontend Developer.",
        linkUrl: null,
        readAt: null,
        createdAt: iso(-1, 9),
      },
      {
        id: "nt-202",
        title: "Sprint SP-03 sắp kết thúc",
        body: "2 task chưa done và 1 bài nộp chờ duyệt.",
        linkUrl: null,
        readAt: iso(-2, 17),
        createdAt: iso(-2, 17),
      },
      {
        id: "nt-203",
        title: "Cấu hình AI đã cập nhật",
        body: "Quản trị viên cập nhật ngưỡng điểm đề xuất AI.",
        linkUrl: null,
        readAt: null,
        createdAt: iso(-4, 11),
      },
    ];
  if (scenario === "large") {
    const bulk: MockNotification[] = Array.from({ length: 120 }, (_, i) => ({
      id: `nt-bulk-${i + 1}`,
      title: `Thông báo hàng loạt #${i + 1}`,
      body: `Nội dung thông báo mẫu số ${i + 1} dùng để kiểm tra phân trang và cuộn dài.`,
      linkUrl: null,
      readAt: i % 3 === 0 ? iso(-i - 1) : null,
      createdAt: iso(-i - 1, 12),
    }));
    return bulk.concat(base);
  }
  return base;
}

/** KPI đơn giản theo trạng thái tài khoản. */
export function kpisFor(scenario: PreviewScenario) {
  if (scenario === "empty") return [];
  return [
    {
      id: "kpi-2026-10",
      ruleVersion: "kpi-rule-v3",
      status: "calculated",
      finalScore: 82.5,
      calculatedAt: iso(-12, 7),
    },
    {
      id: "kpi-2026-09",
      ruleVersion: "kpi-rule-v3",
      status: "calculated",
      finalScore: 78.25,
      calculatedAt: iso(-42, 7),
    },
    {
      id: "kpi-2026-08",
      ruleVersion: "kpi-rule-v2",
      status: "insufficient_data",
      finalScore: null,
      calculatedAt: iso(-72, 7),
    },
  ];
}

export function kpiDetailFor(id: string, scenario: PreviewScenario) {
  const base = kpisFor(scenario).find((k) => k.id === id) ?? kpisFor(scenario)[0];
  return {
    ...base,
    metrics: [
      {
        metricCode: "delivery",
        sourceValue: 24,
        configuredWeight: 0.4,
        effectiveWeight: 0.4,
        weightedContribution: 33.6,
        sourceJson: '{"completed":24,"total":30}',
      },
      {
        metricCode: "quality",
        sourceValue: 90,
        configuredWeight: 0.35,
        effectiveWeight: 0.35,
        weightedContribution: 31.5,
        sourceJson: '{"aiScore":90}',
      },
      {
        metricCode: "discipline",
        sourceValue: 95,
        configuredWeight: 0.25,
        effectiveWeight: 0.25,
        weightedContribution: 23.75,
        sourceJson: '{"attendance":95}',
      },
    ],
  };
}

export function ledgerFor(scenario: PreviewScenario): MockLedger[] {
  if (scenario === "empty") return [];
  const long = scenario === "long-text";
  const seed: MockLedger[] = [
    {
      id: "lg-01",
      type: "kpi_earning",
      amount: 650000,
      unit: "VND",
      description: "Thu nhập KPI kỳ 08/2026",
      createdAt: iso(-92, 8),
    },
    {
      id: "lg-02",
      type: "bonus",
      amount: 120000,
      unit: "VND",
      description: "Thưởng đề xuất cải tiến luồng mượn sách",
      createdAt: iso(-61, 15),
    },
    {
      id: "lg-03",
      type: "penalty",
      amount: -50000,
      unit: "VND",
      description: "Trừ do nộp trễ task TSK-12",
      createdAt: iso(-44, 10),
    },
    {
      id: "lg-04",
      type: "kpi_earning",
      amount: 720000,
      unit: "VND",
      description: "Thu nhập KPI kỳ 09/2026",
      createdAt: iso(-31, 8),
    },
    {
      id: "lg-05",
      type: "adjustment",
      amount: 30000,
      unit: "VND",
      description: long
        ? `Điều chỉnh thủ công: ${LONG_TEXT}`
        : "Điều chỉnh thủ công sau khi soát lại rubric",
      createdAt: iso(-12, 14),
    },
    {
      id: "lg-06",
      type: "reversal",
      amount: -30000,
      unit: "VND",
      description: "Hoàn đảo điều chỉnh lg-05 (nhập nhầm số liệu)",
      createdAt: iso(-11, 9),
    },
    {
      id: "lg-07",
      type: "kpi_earning",
      amount: 780000,
      unit: "VND",
      description: "Thu nhập KPI kỳ 10/2026",
      createdAt: iso(-2, 8),
    },
  ];
  if (scenario === "large") {
    const bulk: MockLedger[] = Array.from({ length: 120 }, (_, i) => ({
      id: `lg-bulk-${i + 1}`,
      type: "kpi_earning" as const,
      amount: 500000 + (i % 7) * 10000,
      unit: "VND",
      description: `Giao dịch hàng loạt mẫu ${i + 1}`,
      createdAt: iso(-i - 1, 10),
    }));
    return bulk.concat(seed);
  }
  return seed;
}

export function certificatesFor(scenario: PreviewScenario) {
  if (scenario === "empty") return [];
  return [
    {
      id: "cert-01",
      certificateNumber: "VINTERN-2026-000123",
      verificationCode: "VC-2026-000123-XK4T",
      status: "issued",
      issuedAt: iso(-10, 9),
      completedAt: iso(-12, 17),
      projectName: "Hệ thống quản lý thư viện số",
      sessionName: "Kỳ thực tập Thu 2026",
      revokedAt: null,
      revokeReason: null,
      policyCode: "internship-completion",
      policyVersion: 2,
    },
    {
      id: "cert-02",
      certificateNumber: "VINTERN-2026-000051",
      verificationCode: "VC-2026-000051-QQ7B",
      status: "revoked",
      issuedAt: iso(-70, 9),
      completedAt: iso(-73, 17),
      projectName: "Cổng thông tin tuyển dụng sinh viên CNTT",
      sessionName: "Kỳ thực tập Hè 2026",
      revokedAt: iso(-40, 11),
      revokeReason: "Phát hiện sao chép bài nộp cuối kỳ",
      policyCode: "internship-completion",
      policyVersion: 1,
    },
  ];
}

export function evaluationsFor(scenario: PreviewScenario) {
  if (scenario === "empty") return [];
  const long = scenario === "long-text";
  return [
    {
      id: "ev-2026-mid",
      cycleId: "cycle-2026-mid",
      status: "finalized",
      overallScore: 84,
      summary: long
        ? `Đánh giá giữa kỳ: ${LONG_TEXT}`
        : "Tiến độ tốt, chất lượng code ổn định, cần chủ động hơn trong code review.",
      finalizedAt: iso(-8, 15),
      revisionNumber: 2,
      scores: [
        {
          id: "sc-1",
          criterionId: "cr-quality",
          criterionName: "Chất lượng mã nguồn",
          weight: 40,
          maxScore: 100,
          score: 86,
          comment: "Kiểm thử độc lập đạt, còn một vài cảnh báo lint.",
        },
        {
          id: "sc-2",
          criterionId: "cr-process",
          criterionName: "Quy trình làm việc",
          weight: 30,
          maxScore: 100,
          score: 82,
          comment: "Commit đều, mô tả task rõ.",
        },
        {
          id: "sc-3",
          criterionId: "cr-collab",
          criterionName: "Hợp tác nhóm",
          weight: 30,
          maxScore: 100,
          score: 85,
          comment: "Tham gia review tốt cho đồng nghiệp.",
        },
      ],
    },
    {
      id: "ev-2026-final-draft",
      cycleId: "cycle-2026-final",
      status: "draft",
      overallScore: null,
      summary: null,
      finalizedAt: null,
      revisionNumber: 1,
      scores: [],
    },
  ];
}

export function recommendationsFor(scenario: PreviewScenario) {
  return {
    id: "rec-2026-11",
    createdAt: iso(-1, 10),
    reused: false,
    recommendations: {
      summary:
        scenario === "long-text"
          ? `Tổng quan năng lực: ${LONG_TEXT}`
          : "Năng lực kỹ thuật tốt; cần phân bổ lại khối lượng task để giữ nhịp deadline.",
      recommendations:
        scenario === "empty"
          ? []
          : [
            {
              type: "focus",
              priority: "high",
              title: "Ưu tiên hoàn thành luồng mượn sách",
              reason: "2 task còn lại của luồng này đang chậm so với kế hoạch sprint.",
              actions: [
                "Chia task lớn TS-21 thành hai task nhỏ",
                "Đặt review checkpoint giữa sprint",
              ],
              evidenceMetricCodes: ["delivery", "quality"],
            },
            {
              type: "learning",
              priority: "medium",
              title: "Bổ sung kiểm thử tích hợp",
              reason: "Tỉ lệ lỗi phát hiện muộn ở module trả sách còn cao.",
              actions: ["Thêm integration test cho 3 API chính"],
              evidenceMetricCodes: ["quality"],
            },
            {
              type: "habit",
              priority: "low",
              title: "Ghi chú quyết định kỹ thuật",
              reason: "Nhiều quyết định kiến trúc chưa được ghi lại để mentor theo dõi.",
              actions: ["Dùng ADR ngắn cho mỗi quyết định lớn"],
              evidenceMetricCodes: [],
            },
          ],
    },
  };
}

/** Dashboard admin. */
export function adminDashboard(scenario: PreviewScenario) {
  const empty = scenario === "empty";
  return {
    metrics: {
      userCount: empty ? 0 : 128,
      instructorCount: empty ? 0 : 12,
      internCount: empty ? 0 : 96,
      activeSessions: empty ? 0 : 8,
      aiRunsToday: empty ? 0 : 34,
    },
    users: empty
      ? []
      : [
        { id: "u-1", displayName: "Trần Hữu Quản", email: "admin@vintern.preview", status: "active", lastLoginAt: iso(0, 8) },
        { id: "u-2", displayName: "Lê Thị Giang", email: "giangvien1@vintern.preview", status: "active", lastLoginAt: iso(-1, 9) },
        { id: "u-3", displayName: "Phan Bảo Sơn", email: "giangvien2@vintern.preview", status: "active", lastLoginAt: null },
        { id: "u-4", displayName: "Nguyễn An Khang", email: "sinhvien1@vintern.preview", status: "active", lastLoginAt: iso(0, 7) },
        { id: "u-5", displayName: "Đỗ Thuần Minh", email: "sinhvien_minh@vintern.preview", status: "active", lastLoginAt: iso(-3, 22) },
        { id: "u-6", displayName: "Phạm Tân Sinh", email: "sinhvien_tan@vintern.preview", status: "pending", lastLoginAt: null },
        { id: "u-7", displayName: "Trịnh Khả Nhi", email: "sinhvien_nanghe@vintern.preview", status: "locked", lastLoginAt: iso(-30, 10) },
        ...(scenario === "large"
          ? Array.from({ length: 120 }, (_, i) => ({
            id: `u-bulk-${i + 1}`,
            displayName: `Người dùng hàng loạt ${i + 1}`,
            email: `bulk${i + 1}@vintern.preview`,
            status: i % 4 === 0 ? "locked" : "active",
            lastLoginAt: iso(-i - 1, 9),
          }))
          : []),
      ],
    roles: [
      { id: "r-1", code: "admin", name: "Quản trị viên", permissionCount: 42 },
      { id: "r-2", code: "instructor", name: "Giảng viên", permissionCount: 21 },
      { id: "r-3", code: "intern", name: "Thực tập sinh", permissionCount: 9 },
    ],
    activity: empty
      ? []
      : [
        { id: "a-1", summary: "Lê Thị Giang phát hành sprint SP-03", action: "sprint.publish", createdAt: iso(-1, 15), displayName: "Lê Thị Giang" },
        { id: "a-2", summary: "Nguyễn An Khang nộp bài TS-20", action: "submission.create", createdAt: iso(-1, 11), displayName: "Nguyễn An Khang" },
        { id: "a-3", summary: "Admin chốt kỳ KPI 10/2026", action: "kpi.finalize", createdAt: iso(-2, 9), displayName: "Trần Hữu Quản" },
        { id: "a-4", summary: null, action: "user.login", createdAt: iso(0, 7), displayName: "Nguyễn An Khang" },
      ],
    statuses: empty
      ? []
      : [
        { status: "active", count: 104 },
        { status: "pending", count: 12 },
        { status: "locked", count: 9 },
        { status: "inactive", count: 3 },
      ],
    generatedAt: iso(0, 8),
  };
}

/** Dashboard instructor — Giang có phiên; Sơn rỗng. */
export function instructorDashboard(
  accountId: string,
  scenario: PreviewScenario,
) {
  const empty = scenario === "empty" || accountId === "pv-inst-2";
  return {
    metrics: {
      sessionCount: empty ? 0 : 3,
      activeSessions: empty ? 0 : 2,
      internCount: empty ? 0 : 6,
      taskCount: empty ? 0 : 24,
      todoCount: empty ? 0 : 3,
      doingCount: empty ? 0 : 4,
      doneCount: empty ? 0 : 15,
      reviewCount: empty ? 0 : 2,
      overdueCount: empty ? 0 : 1,
      averageScore: empty ? null : 81.4,
    },
    sessions: empty
      ? []
      : [
        { id: "ss-f26", code: "SS-F26", name: "Kỳ thực tập Thu 2026", status: "active", startDate: iso(-30), endDate: iso(60), projectName: "Hệ thống quản lý thư viện số", memberCount: 6, taskCount: 24, doneCount: 15 },
        { id: "ss-s26", code: "SS-S26", name: "Kỳ thực tập Hè 2026", status: "completed", startDate: iso(-150), endDate: iso(-40), projectName: "Cổng thông tin tuyển dụng sinh viên CNTT", memberCount: 5, taskCount: 20, doneCount: 20 },
        { id: "ss-w27", code: "SS-W27", name: "Kỳ thực tập Xuân 2027", status: "planned", startDate: iso(40), endDate: iso(130), projectName: "Ứng dụng học tiếng Việt cho trẻ em", memberCount: 0, taskCount: 0, doneCount: 0 },
      ],
    students: empty
      ? []
      : [
        { id: "pv-intern-1", displayName: "Nguyễn An Khang", email: "sinhvien1@vintern.preview", projectName: "Hệ thống quản lý thư viện số", taskCount: 24, doneCount: 15, averageScore: 84 },
        { id: "pv-intern-2", displayName: "Đỗ Thuần Minh", email: "sinhvien_minh@vintern.preview", projectName: "Hệ thống quản lý thư viện số", taskCount: 24, doneCount: 6, averageScore: 71 },
        { id: "pv-intern-4", displayName: "Trịnh Khả Nhi", email: "sinhvien_nanghe@vintern.preview", projectName: "Hệ thống quản lý thư viện số", taskCount: 24, doneCount: 2, averageScore: null },
      ],
    activity: empty
      ? []
      : [
        { id: "ia-1", summary: "Nguyễn An Khang nộp bài task TS-20", action: "submission.create", createdAt: iso(-1, 11), displayName: "Nguyễn An Khang" },
        { id: "ia-2", summary: "AI review xong bài TS-19", action: "ai.review.finish", createdAt: iso(-2, 16), displayName: null },
      ],
    sprints: empty
      ? []
      : [
        { id: "sp-03", name: "Sprint 03 — Mượn/trả sách", projectName: "Hệ thống quản lý thư viện số", status: "active", startDate: iso(-7), endDate: iso(7) },
        { id: "sp-02", name: "Sprint 02 — Định danh tài liệu", projectName: "Hệ thống quản lý thư viện số", status: "completed", startDate: iso(-27), endDate: iso(-8) },
      ],
    reviews: empty
      ? []
      : [
        { id: "rv-1", taskId: "ts-20", internId: "pv-intern-1", prUrl: "https://github.com/vintern-2026/library-system/pull/48", status: "submitted", score: null, submittedAt: iso(-1, 11), taskCode: "TS-20", taskTitle: "API trả sách quá hạn", projectId: "prj-lib", displayName: "Nguyễn An Khang" },
        { id: "rv-2", taskId: "ts-19", internId: "pv-intern-2", prUrl: "https://github.com/vintern-2026/library-system/pull/45", status: "approved", score: 78, submittedAt: iso(-3, 14), taskCode: "TS-19", taskTitle: "Tìm kiếm tài liệu theo kho", projectId: "prj-lib", displayName: "Đỗ Thuần Minh" },
      ],
    generatedAt: iso(0, 8),
  };
}

/** Workspace intern theo trạng thái tài khoản. */
export function internWorkspace(accountId: string, scenario: PreviewScenario) {
  const long = scenario === "long-text";
  if (accountId === "pv-intern-3") {
    // new: chưa onboarding → resolver đẩy sang /intern/onboarding.
    return {
      status: "recruitment_required",
      hasAssignmentHistory: false,
      assignment: null,
      recruitment: {
        status: "not_started",
        selectedRole: null,
        attemptCount: 0,
        recruitedAt: null,
      },
      currentSprint: null,
      taskSummary: { todo: 0, doing: 0, review: 0, done: 0, total: 0 },
      focusedTask: null,
    };
  }
  const active =
    accountId === "pv-intern-1" || accountId === "pv-intern-2" || accountId === "pv-intern-4";
  if (!active) {
    return {
      status: "unassigned",
      hasAssignmentHistory: false,
      assignment: null,
      recruitment: { status: "passed", selectedRole: "frontend", attemptCount: 1, recruitedAt: iso(-5) },
      currentSprint: null,
      taskSummary: { todo: 0, doing: 0, review: 0, done: 0, total: 0 },
      focusedTask: null,
    };
  }
  const rich = accountId === "pv-intern-1";
  const projectName = long ? `Hệ thống quản lý thư viện số — ${LONG_TEXT}` : "Hệ thống quản lý thư viện số";
  return {
    status: "active",
    hasAssignmentHistory: true,
    assignment: {
      id: "asg-1",
      assignedAt: iso(-30, 10),
      project: { id: "prj-lib", code: "PRJ-LIB", name: projectName, status: "active" },
      session: { id: "ss-f26", code: "SS-F26", name: "Kỳ thực tập Thu 2026", status: "active" },
    },
    recruitment: {
      status: "passed",
      selectedRole: "frontend",
      attemptCount: 1,
      recruitedAt: iso(-32, 15),
    },
    currentSprint: rich
      ? {
        id: "sp-03",
        code: "SP-03",
        name: "Sprint 03 — Mượn/trả sách",
        status: "active",
        startDate: iso(-7),
        endDate: iso(7),
      }
      : null,
    taskSummary: {
      todo: rich ? 3 : 0,
      doing: rich ? 4 : 0,
      review: rich ? 2 : 0,
      done: rich ? 15 : 0,
      total: rich ? 24 : 0,
    },
    focusedTask: rich
      ? {
        id: "ts-20",
        code: "TS-20",
        title: long ? `API trả sách quá hạn — ${LONG_TEXT}` : "API trả sách quá hạn",
        status: "review",
        priority: "high",
        dueDate: iso(2, 17),
        progress: 70,
      }
      : null,
  };
}

/** Hiệu suất intern. */
export function internPerformance(scenario: PreviewScenario) {
  const empty = scenario === "empty";
  return {
    metrics: {
      totalTaskCount: empty ? 0 : 24,
      completedTaskCount: empty ? 0 : 15,
      taskCompletionRate: empty ? null : 62.5,
      committedStoryPoints: empty ? 0 : 48,
      completedStoryPoints: empty ? 0 : 30,
      storyPointCompletionRate: empty ? null : 62.5,
      onTimeCompletionRate: empty ? null : 86.7,
      overdueOpenTaskCount: empty ? 0 : 1,
      averageEvaluationScore: empty ? null : 84,
      finalizedEvaluationCount: empty ? 0 : 1,
      activeSprintProgress: empty ? null : 58,
    },
  };
}

/* ---------------- Intern work board / sprint / mentor (Section 10) ------- */

export interface MockTask {
  id: string;
  code: string;
  title: string;
  description: string | null;
  storyPoints: number | null;
  status: "todo" | "doing" | "review" | "done";
  priority: "low" | "medium" | "high" | "critical";
  progress: number;
  dueDate: string | null;
  assigneeId: string | null;
  projectId: string;
  sprintId: string | null;
  version: number;
}

const WORK_SEED: MockTask[] = [
  { id: "ts-11", code: "TS-11", title: "Khung tra cứu tài liệu theo kho", description: "Tìm kiếm gợi ý theo mã định danh MARC21.", storyPoints: 5, status: "done", priority: "medium", progress: 100, dueDate: iso(-20, 17), assigneeId: "pv-intern-1", projectId: "prj-lib", sprintId: "sp-02", version: 3 },
  { id: "ts-12", code: "TS-12", title: "Trang chi tiết tài liệu", description: null, storyPoints: 3, status: "done", priority: "low", progress: 100, dueDate: iso(-18, 17), assigneeId: "pv-intern-1", projectId: "prj-lib", sprintId: "sp-02", version: 2 },
  { id: "ts-17", code: "TS-17", title: "Định dạng kết quả tìm kiếm", description: "Định dạng danh sách theo chuẩn hiển thị thư viện.", storyPoints: 2, status: "done", priority: "low", progress: 100, dueDate: iso(-9, 17), assigneeId: "pv-intern-1", projectId: "prj-lib", sprintId: "sp-03", version: 1 },
  { id: "ts-18", code: "TS-18", title: "API mượn sách theo thẻ", description: "POST /borrow với kiểm tra hạn mức mượn song song.", storyPoints: 5, status: "done", priority: "high", progress: 100, dueDate: iso(-5, 17), assigneeId: "pv-intern-1", projectId: "prj-lib", sprintId: "sp-03", version: 4 },
  { id: "ts-19", code: "TS-19", title: "Tìm kiếm tài liệu theo kho", description: "Bộ lọc theo kho sách đặc biệt và kho chung.", storyPoints: 3, status: "done", priority: "medium", progress: 100, dueDate: iso(-3, 17), assigneeId: "pv-intern-1", projectId: "prj-lib", sprintId: "sp-03", version: 2 },
  { id: "ts-20", code: "TS-20", title: "API trả sách quá hạn", description: "Tính phí trễ theo bậc ngày, ghi nhận giao dịch bù trừ.", storyPoints: 5, status: "review", priority: "high", progress: 70, dueDate: iso(2, 17), assigneeId: "pv-intern-1", projectId: "prj-lib", sprintId: "sp-03", version: 2 },
  { id: "ts-21", code: "TS-21", title: "Đăng ký mượn trước", description: "Đặt chỗ tài liệu đang được mượn, hàng đợi FIFO.", storyPoints: 8, status: "doing", priority: "high", progress: 40, dueDate: iso(5, 17), assigneeId: "pv-intern-1", projectId: "prj-lib", sprintId: "sp-03", version: 1 },
  { id: "ts-22", code: "TS-22", title: "Gia hạn mượn online", description: null, storyPoints: 3, status: "doing", priority: "medium", progress: 25, dueDate: iso(6, 17), assigneeId: "pv-intern-1", projectId: "prj-lib", sprintId: "sp-03", version: 1 },
  { id: "ts-23", code: "TS-23", title: "Thống kê mượn theo tháng", description: "Bảng điều khiển mượn/trả theo tháng cho thủ thư.", storyPoints: 5, status: "todo", priority: "medium", progress: 0, dueDate: iso(9, 17), assigneeId: "pv-intern-1", projectId: "prj-lib", sprintId: "sp-03", version: 1 },
  { id: "ts-24", code: "TS-24", title: "Xuất báo cáo tồn kho", description: "Xuất xlsx tồn kho theo danh mục.", storyPoints: 3, status: "todo", priority: "low", progress: 0, dueDate: iso(10, 17), assigneeId: "pv-intern-1", projectId: "prj-lib", sprintId: "sp-03", version: 1 },
];

export function tasksFor(scenario: PreviewScenario): MockTask[] {
  if (scenario === "empty") return [];
  if (scenario === "long-text")
    return WORK_SEED.map((t) => ({
      ...t,
      title: `${t.title} — ${LONG_TEXT}`,
      description: t.description ? `${t.description} ${LONG_TEXT}` : null,
    }));
  if (scenario === "large") {
    const bulk: MockTask[] = Array.from({ length: 120 }, (_, i) => ({
      id: `ts-bulk-${i + 1}`,
      code: `TS-${100 + i}`,
      title: `Nhiệm vụ hàng loạt mẫu ${i + 1}`,
      description: `Mô tả nhiệm vụ mẫu ${i + 1} để kiểm tra phân trang và lọc.`,
      storyPoints: 1 + (i % 8),
      status: (["todo", "doing", "review", "done"] as const)[i % 4],
      priority: (["low", "medium", "high", "critical"] as const)[i % 4],
      progress: (i * 7) % 101 > 100 ? 100 : (i * 7) % 101,
      dueDate: iso(i - 60, 17),
      assigneeId: "pv-intern-1",
      projectId: "prj-lib",
      sprintId: "sp-03",
      version: 1,
    }));
    return bulk;
  }
  return WORK_SEED;
}

export function boardFor(scenario: PreviewScenario) {
  const tasks = tasksFor(scenario);
  const statuses = ["todo", "doing", "review", "done"] as const;
  const columns = statuses.map((status) => {
    const inColumn = tasks.filter((t) => t.status === status);
    return {
      status,
      count: inColumn.length,
      tasks: inColumn.map((t) => ({
        id: t.id, code: t.code, title: t.title, description: t.description,
        storyPoints: t.storyPoints, status: t.status, priority: t.priority,
        progress: t.progress, dueDate: t.dueDate, assigneeId: t.assigneeId,
      })),
    };
  });
  return {
    sprint: {
      id: "sp-03",
      code: "SP-03",
      name: "Sprint 03 — Mượn/trả sách",
      status: "active",
      projectId: "prj-lib",
      sessionId: "ss-f26",
      goal: "Hoàn chỉnh luồng mượn/trả và đặt chỗ tài liệu.",
      description: "Tập trung vào API mượn/trả, hàng đợi đặt chỗ và báo cáo tồn kho.",
      startDate: iso(-7),
      endDate: iso(7),
    },
    total: tasks.length,
    overdueOpenTaskCount: tasks.some((t) => t.id === "ts-20") ? 1 : 0,
    columns,
  };
}

export function ownProjectFor(scenario: PreviewScenario) {
  const empty = scenario === "empty";
  return {
    id: "prj-lib",
    code: "PRJ-LIB",
    name: empty ? "" : "Hệ thống quản lý thư viện số",
    description:
      scenario === "long-text"
        ? `Dự án xây dựng hệ thống quản lý thư viện số: ${LONG_TEXT}`
        : "Dự án xây dựng hệ thống quản lý thư viện số với tra cứu, mượn trả và báo cáo theo chuẩn MARC21.",
    status: "active",
    difficulty: "intermediate",
    mentorId: "pv-inst-1",
    capacity: 6,
    startDate: iso(-30),
    endDate: iso(60),
    technologies: ["Next.js", "NestJS", "PostgreSQL", "Redis"],
  };
}

export function mentorConversationsFor(scenario: PreviewScenario) {
  const empty = scenario === "empty";
  const list = empty
    ? []
    : [
      {
        id: "mc-1",
        title: "Chuẩn bị demo luồng mượn sách",
        status: "active",
        createdAt: iso(-9, 10),
        updatedAt: iso(-1, 16),
        lastMessageAt: iso(-1, 16),
      },
      {
        id: "mc-2",
        title: "Rà soát test cho API trả sách",
        status: "archived",
        createdAt: iso(-20, 9),
        updatedAt: iso(-8, 11),
        lastMessageAt: iso(-8, 11),
      },
    ];
  return { items: list, total: list.length, page: 1, pageSize: 20 };
}

export function mentorDetailFor(id: string, scenario: PreviewScenario) {
  const conversations = mentorConversationsFor(scenario).items;
  const found = conversations.find((c) => c.id === id) ?? conversations[0];
  return {
    conversation: found,
    messages: [
      {
        id: "mm-1",
        role: "user",
        content: "Em nên chuẩn bị gì cho demo luồng mượn sách?",
        aiRunId: null,
        createdAt: iso(-1, 15),
      },
      {
        id: "mm-2",
        role: "assistant",
        content:
          "Nên chuẩn bị ba kịch bản: mượn thành công, vượt hạn mức và tài liệu đã được đặt chỗ. Với mỗi kịch bản, mở sẵn Network tab để chiếu request thật và có slide tóm tắt ánh xạ endpoint — bằng chứng dễ thuyết phục hơn screenshot.",
        aiRunId: "run-771",
        createdAt: iso(-1, 16),
      },
    ],
  };
}

/* ---------------- Admin lists (users/groups/roles/audit/activity) ---------- */

export interface MockUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  status: "active" | "pending" | "locked" | "deleted";
  lastLoginAt: string | null;
  createdAt: string;
}

export function usersFor(scenario: PreviewScenario): MockUser[] {
  if (scenario === "empty") return [];
  const seed: MockUser[] = [
    { id: "pv-admin-1", email: "admin@vintern.preview", username: "quantri", displayName: "Trần Hữu Quản", status: "active", lastLoginAt: iso(0, 8), createdAt: iso(-200) },
    { id: "pv-inst-1", email: "giangvien1@vintern.preview", username: "giang.le", displayName: "Lê Thị Giang", status: "active", lastLoginAt: iso(-1, 9), createdAt: iso(-180) },
    { id: "pv-inst-2", email: "giangvien2@vintern.preview", username: "son.phan", displayName: "Phan Bảo Sơn", status: "active", lastLoginAt: iso(-3, 10), createdAt: iso(-90) },
    { id: "pv-intern-1", email: "sinhvien1@vintern.preview", username: "khang.nguyen", displayName: "Nguyễn An Khang", status: "active", lastLoginAt: iso(0, 7), createdAt: iso(-60) },
    { id: "pv-intern-2", email: "sinhvien_minh@vintern.preview", username: "minh.do", displayName: "Đỗ Thuần Minh", status: "active", lastLoginAt: iso(-3, 22), createdAt: iso(-58) },
    { id: "pv-intern-3", email: "sinhvien_tan@vintern.preview", username: "tan.pham", displayName: "Phạm Tân Sinh", status: "pending", lastLoginAt: null, createdAt: iso(-2) },
    { id: "pv-intern-4", email: "sinhvien_nanghe@vintern.preview", username: "nhi.trinh", displayName: "Trịnh Khả Nhi", status: "locked", lastLoginAt: iso(-30, 10), createdAt: iso(-55) },
    { id: "u-old-1", email: "cuudv1@vintern.preview", username: "cuu.dv1", displayName: "Cựu giảng viêndemo", status: "deleted", lastLoginAt: null, createdAt: iso(-300) },
  ];
  if (scenario === "long-text") {
    return seed.map((u) => ({
      ...u,
      displayName: `${u.displayName} — ${LONG_TEXT}`,
    }));
  }
  if (scenario === "large") {
    const bulk: MockUser[] = Array.from({ length: 120 }, (_, i) => ({
      id: `u-bulk-${i + 1}`,
      email: `bulk${i + 1}@vintern.preview`,
      username: `bulk${i + 1}`,
      displayName: `Người dùng hàng loạt ${i + 1}`,
      status: (["active", "pending", "locked", "deleted"] as const)[i % 4],
      lastLoginAt: i % 5 === 0 ? null : iso(-i - 1, 9),
      createdAt: iso(-i - 10),
    }));
    return bulk;
  }
  return seed;
}

export function rolesFor(): Array<{ id: string; code: string; name: string; description: string | null }> {
  return [
    { id: "r-admin", code: "admin", name: "Quản trị viên", description: "Toàn quyền hệ thống" },
    { id: "r-inst", code: "instructor", name: "Giảng viên", description: "Quản lý phiên thực tập, đồ án, phân công" },
    { id: "r-intern", code: "intern", name: "Thực tập sinh", description: "Người tham gia chương trình thực tập" },
  ];
}

export function groupsFor(): Array<{ id: string; code: string; name: string; description: string | null }> {
  return [
    { id: "g-1", code: "cntt-k26", name: "CNTT K26", description: "Sinh viên khoá 26 ngành CNTT" },
    { id: "g-2", code: "mentor-fe", name: "Mentor Frontend", description: "Nhóm mentor chuyên frontend" },
    { id: "g-3", code: "qa-bot", name: "QA hỗ trợ", description: null },
  ];
}

export function auditsFor(scenario: PreviewScenario) {
  if (scenario === "empty") return [];
  return [
    { id: "au-1", actorId: "pv-admin-1", action: "user.create", targetType: "user", targetId: "pv-intern-3", detail: "Tạo tài khoản thực tập sinh mới", ip: "10.0.0.9", userAgent: "Chrome/130 (Windows)", createdAt: iso(0, 8) },
    { id: "au-2", actorId: "pv-inst-1", action: "sprint.publish", targetType: "sprint", targetId: "sp-03", detail: "Phát hành sprint 03 cho phiên SS-F26", ip: "10.0.0.21", userAgent: "Edge/130 (macOS)", createdAt: iso(-1, 15) },
    { id: "au-3", actorId: "pv-admin-1", action: "role.grant", targetType: "role", targetId: "r-intern", detail: null, ip: "10.0.0.9", userAgent: null, createdAt: iso(-2, 9) },
    { id: "au-4", actorId: null, action: "auth.login", targetType: "user", targetId: "pv-intern-1", detail: "Đăng nhập thành công", ip: "10.0.5.31", userAgent: "Chrome/129 (Android)", createdAt: iso(0, 7) },
  ];
}

export function activityFor(scenario: PreviewScenario) {
  if (scenario === "empty") return [];
  return [
    { id: "ac-1", actorId: "pv-inst-1", module: "sprints", action: "sprint.publish", targetType: "sprint", targetId: "sp-03", summary: "Lê Thị Giang phát hành Sprint 03 — Mượn/trả sách", createdAt: iso(-1, 15) },
    { id: "ac-2", actorId: "pv-intern-1", module: "submissions", action: "submission.create", targetType: "task", targetId: "ts-20", summary: "Nguyễn An Khang nộp bài TS-20", createdAt: iso(-1, 11) },
    { id: "ac-3", actorId: "pv-admin-1", module: "kpi", action: "kpi.finalize", targetType: "kpi-period", targetId: "kpi-2026-10", summary: "Chốt kỳ KPI tháng 10/2026", createdAt: iso(-2, 9) },
    { id: "ac-4", actorId: null, module: "auth", action: "user.login", targetType: null, targetId: null, summary: null, createdAt: iso(0, 7) },
  ];
}
