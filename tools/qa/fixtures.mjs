/**
 * Route-interception fixtures for the local visual QA harness.
 *
 * Scope: LOCAL VISUAL VERIFICATION ONLY. The application keeps its real API
 * wiring; Playwright fulfils intercepted /api/v1 requests with these payloads
 * so layout/typography/a11y can be judged without a live backend. Shapes mirror
 * the parsers in src/lib/api/* (request contracts stay untouched).
 * The sql2019 CI gate remains the authority for real behaviour.
 */

const now = Date.UTC(2026, 9, 30, 4, 0, 0);
const daysAgo = (n) => new Date(now - n * 86400000).toISOString();
const daysAhead = (n) => new Date(now + n * 86400000).toISOString();
const id = (prefix, n = 1) =>
  `${prefix}-0000-4000-8000-${String(n).padStart(12, "0")}`;

export const internUser = {
  id: id("a1b2c3d4"),
  email: "minh.nguyen@student.edu.vn",
  displayName: "Nguyễn Minh",
  roles: ["intern"],
  permissions: [],
  mustChangePassword: false,
};

const workspaceActive = {
  status: "active",
  hasAssignmentHistory: false,
  assignment: {
    id: id("asg"),
    assignedAt: daysAgo(21),
    project: { id: id("prj"), code: "PRJ-ESC", name: "EduScale LMS", status: "active" },
    session: { id: id("ses"), code: "SS-2026-10", name: "Phiên thực tập Thu 2026", status: "active" },
  },
  recruitment: { status: "passed", selectedRole: "frontend", attemptCount: 1, recruitedAt: daysAgo(28) },
  currentSprint: { id: id("spr"), code: "SPR-03", name: "Sprint 3 — Bảng điểm & phản hồi", status: "active", startDate: daysAgo(5), endDate: daysAhead(9) },
  taskSummary: { todo: 3, doing: 2, review: 1, done: 8, total: 14 },
  focusedTask: {
    id: id("tsk", 3),
    code: "TASK-0412",
    title: "Bố cục cột điểm theo rubric",
    status: "doing",
    priority: "high",
    dueDate: daysAhead(3),
    progress: 45,
  },
};

// QA stage marker: the onboarding flow serves ONE profile/workspace per page
// (the provider redirects off-page states), so the harness pins the stage per
// route visit. "default" keeps the intern workspace for all other routes.
export const qaStage = { recruitment: "default" };

const emptyTaskSummary = { todo: 0, doing: 0, review: 0, done: 0, total: 0 };

const workspaceRecruitmentRequired = {
  status: "recruitment_required",
  hasAssignmentHistory: false,
  assignment: null,
  recruitment: { status: "not_started", selectedRole: null, attemptCount: 0, recruitedAt: null },
  currentSprint: null,
  taskSummary: emptyTaskSummary,
  focusedTask: null,
};

const workspaceRecruitmentInProgress = {
  status: "recruitment_in_progress",
  hasAssignmentHistory: false,
  assignment: null,
  recruitment: { status: "interview_in_progress", selectedRole: "frontend", attemptCount: 1, recruitedAt: null },
  currentSprint: null,
  taskSummary: emptyTaskSummary,
  focusedTask: null,
};

const recruitmentProfiles = {
  welcome: {
    status: "not_started",
    selectedRole: null,
    selectedRoleLabel: null,
    attemptNumber: 0,
    attemptsRemaining: 3,
    nextEligibleAt: null,
    currentInterviewSessionId: null,
    recruitedAt: null,
    result: null,
  },
  role: {
    status: "role_selected",
    selectedRole: "frontend",
    selectedRoleLabel: "Frontend Developer",
    attemptNumber: 0,
    attemptsRemaining: 3,
    nextEligibleAt: null,
    currentInterviewSessionId: null,
    recruitedAt: null,
    result: null,
  },
  interview: {
    status: "interview_in_progress",
    selectedRole: "frontend",
    selectedRoleLabel: "Frontend Developer",
    attemptNumber: 1,
    attemptsRemaining: 2,
    nextEligibleAt: null,
    currentInterviewSessionId: id("itv"),
    recruitedAt: null,
    result: null,
  },
  result: {
    status: "passed",
    selectedRole: "frontend",
    selectedRoleLabel: "Frontend Developer",
    attemptNumber: 1,
    attemptsRemaining: 2,
    nextEligibleAt: null,
    currentInterviewSessionId: null,
    recruitedAt: daysAgo(1),
    result: {
      id: id("res"),
      sessionId: id("itv"),
      technicalScore: 78,
      softSkillScore: 82,
      overallScore: 80,
      decision: "passed",
      strengths: ["Giải thích rõ suy luận kỹ thuật", "Có ví dụ thực tế cho từng câu trả lời"],
      weaknesses: ["Cần luyện quản lý thời gian khi trả lời dài"],
      criteria: [
        { code: "technical_depth", score: 78, feedback: "Trình bày đúng khái niệm cốt lõi, ví dụ cụ thể." },
        { code: "communication", score: 82, feedback: "Diễn đạt mạch lạc, cấu trúc câu trả lời rõ." },
        { code: "problem_solving", score: 80, feedback: "Phân tích vấn đề theo bước, có đánh giá trade-off." },
      ],
      feedback: "Đạt ngưỡng đầu vào vai trò Frontend. Tiếp tục luyện thêm về tối ưu hiệu năng.",
      recommendedRole: "frontend",
      model: "glm-4.7",
      promptVersion: "v2026.10",
      evaluatedAt: daysAgo(1),
    },
  },
};

const interviewQuestions = {
  session: {
    id: id("itv"),
    roleCode: "frontend",
    status: "in_progress",
    startedAt: daysAgo(0),
    expiresAt: new Date(now + 40 * 60000).toISOString(),
    submittedAt: null,
    attemptNumber: 1,
    questionCount: 5,
    serverNow: new Date(now).toISOString(),
    secondsRemaining: 2400,
  },
  questions: [
    { id: id("qus", 1), position: 1, category: "technical", difficulty: "medium", prompt: "Giải thích virtual DOM và khi nào re-render là tốn kém.", answered: true, answeredAt: daysAgo(0) },
    { id: id("qus", 2), position: 2, category: "technical", difficulty: "medium", prompt: "Khác biệt giữa useMemo và useCallback? Cho ví dụ dùng sai.", answered: true, answeredAt: daysAgo(0) },
    { id: id("qus", 3), position: 3, category: "technical", difficulty: "hard", prompt: "Tối ưu danh sách 10.000 dòng như thế nào? Nêu các bước đo lường.", answered: false, answeredAt: null },
    { id: id("qus", 4), position: 4, category: "soft", difficulty: "easy", prompt: "Kể một lần bạn nhận feedback khó và xử lý ra sao.", answered: false, answeredAt: null },
    { id: id("qus", 5), position: 5, category: "soft", difficulty: "medium", prompt: "Bạn ưu tiên thế nào khi deadline gần mà còn 2 task lớn?", answered: false, answeredAt: null },
  ],
};

const sprintSummary = {
  id: id("spr"),
  code: "SPR-03",
  name: "Sprint 3 — Bảng điểm & phản hồi",
  status: "active",
  projectId: id("prj"),
  goal: "Sinh viên nộp và theo dõi bài được chấm theo rubric.",
  description: "Tập trung vào bảng điểm, phản hồi và lịch sử nộp bài.",
  startDate: daysAgo(5),
  endDate: daysAhead(9),
};

const task = (n, overrides = {}) => ({
  id: id("tsk", n),
  code: `TASK-0${400 + n}`,
  title: [
    "Thiết kế khung trang danh sách nhiệm vụ",
    "API tổng hợp điểm rubric",
    "Bố cục cột điểm theo rubric",
    "Soạn kịch bản kiểm thử nộp bài",
    "Sửa lỗi tràn ngang ở khối tiến độ",
    "Viết tài liệu hướng dẫn Sprint",
  ][(n - 1) % 6],
  description:
    "Yêu cầu chi tiết: đọc đặc tả trong TaskSpec, trao đổi với giảng viên qua phần bình luận, cập nhật tiến độ trước khi nộp.",
  storyPoints: [2, 3, 5, 3, 2, 1][(n - 1) % 6],
  status: ["todo", "doing", "review", "done", "doing", "done"][(n - 1) % 6],
  priority: ["medium", "high", "high", "low", "critical", "medium"][(n - 1) % 6],
  progress: [0, 45, 100, 100, 30, 100][(n - 1) % 6],
  dueDate: [daysAhead(6), daysAhead(3), daysAgo(1), daysAgo(3), daysAhead(2), daysAgo(6)][(n - 1) % 6],
  assigneeId: id("a1b2c3d4"),
  projectId: id("prj"),
  sprintId: id("spr"),
  version: 3,
  sprint: { id: sprintSummary.id, code: sprintSummary.code, name: sprintSummary.name, status: "active" },
  repository: { status: "ready", fullName: "v-intern/eduscale-lms" },
  ...overrides,
});

const board = {
  sprint: sprintSummary,
  total: 14,
  overdueOpenTaskCount: 1,
  columns: [
    { status: "todo", count: 3, tasks: [task(1), task(7), task(11)] },
    { status: "doing", count: 2, tasks: [task(2), task(5)] },
    { status: "review", count: 1, tasks: [task(3)] },
    { status: "done", count: 8, tasks: [task(4), task(6), task(8), task(9), task(10), task(12), task(13), task(14)] },
  ],
};

const page = (data, total, pageNumber, pageSize) => ({
  data,
  meta: { total, page: pageNumber, pageSize, totalPages: Math.ceil(total / pageSize) },
});

const project = {
  id: id("prj"),
  code: "PRJ-ESC",
  name: "EduScale LMS",
  description:
    "Nền tảng học tập cho phép giảng viên xây dựng Sprint, chấm bài theo rubric và sinh viên theo dõi tiến độ. Sinh viên phụ trách vùng giao diện bảng điểm và phản hồi.",
  status: "active",
  difficulty: "intermediate",
  mentorId: id("ins"),
  capacity: 6,
  startDate: daysAgo(40),
  endDate: daysAhead(50),
  technologies: ["Next.js", "TypeScript", "Tailwind CSS", "Vitest"],
};

const conversations = [1, 2, 3, 4, 5].map((n) => ({
  id: id("cnv", n),
  title: [
    "Câu hỏi về rubric chấm điểm",
    "Lỗi cài đặt môi trường local",
    "Hướng dẫn viết unit test",
    "Phân tích phản hồi Sprint 2",
    "Thảo luận cấu trúc component",
  ][n - 1],
  status: n === 4 ? "archived" : "active",
  createdAt: daysAgo(n * 3),
  updatedAt: daysAgo(n),
  lastMessageAt: daysAgo(n),
}));

const conversationDetail = (n) => ({
  conversation: conversations[n - 1],
  messages: [
    { id: id("msg", n * 10 + 1), role: "user", content: "Em đang kẹt ở bước dựng cột điểm theo rubric, thầy giúp em định hướng được không ạ?", aiRunId: null, createdAt: daysAgo(n) },
    { id: id("msg", n * 10 + 2), role: "assistant", content: "Chào Minh, bạn nên bắt đầu từ cấu trúc dữ liệu rubric: mỗi tiêu chí có mã, trọng số và thang điểm. Sau đó dựng bảng với đúng 5 cột: tiêu chí, trọng số, điểm, nhận xét và bằng chứng. Hãy đảm bảo xử lý trạng thái chưa chấm trước khi tinh chỉnh giao diện.", aiRunId: id("run", n), createdAt: daysAgo(n - 0.02) },
  ],
});

const comments = page(
  [
    { id: id("cmt", 1), content: "Em đã dựng xong khung, thầy xem giúp hướng xử lý cột nhận xét ạ?", authorId: id("a1b2c3d4"), createdAt: daysAgo(2) },
    { id: id("cmt", 2), content: "Nhớ bọc cột nhận xét bằng disclosure khi màn hình nhỏ hơn 768px.", authorId: id("ins"), createdAt: daysAgo(1) },
  ],
  2,
  1,
  20,
);

const history = page(
  [
    { id: id("hst", 3), fromStatus: "doing", toStatus: "review", changedById: id("a1b2c3d4"), reason: "Nộp bài qua link PR #128", createdAt: daysAgo(1) },
    { id: id("hst", 2), fromStatus: "todo", toStatus: "doing", changedById: id("a1b2c3d4"), reason: "Bắt đầu thực hiện", createdAt: daysAgo(4) },
    { id: id("hst", 1), fromStatus: null, toStatus: "todo", changedById: id("ins"), reason: "Phân công nhiệm vụ", createdAt: daysAgo(6) },
  ],
  3,
  1,
  20,
);

const participationReport = {
  items: [
    { id: id("inc", 1), taskId: id("tsk", 9), internId: id("a1b2c3d4"), sessionId: id("ses"), deadlineVersion: 2, policyVersion: 3, dueAt: daysAgo(6), submittedAt: daysAgo(6.3), kind: "late", status: "active", ordinal: 1, points: 2, recommendReplacement: false, replacementEligible: false, createdAt: daysAgo(6), reason: null, taskCode: "TASK-0408", taskTitle: "Soạn kịch bản kiểm thử nộp bài", displayName: "Nguyễn Minh", sessionName: "Phiên thực tập Thu 2026", baseScore: 8, latePenalty: 0.5, score: 7.5, submissionStatus: "late" },
    { id: id("inc", 2), taskId: id("tsk", 12), internId: id("a1b2c3d4"), sessionId: id("ses"), deadlineVersion: 2, policyVersion: 3, dueAt: daysAgo(12), submittedAt: null, kind: "missing", status: "excused", ordinal: 2, points: 0, recommendReplacement: false, replacementEligible: false, createdAt: daysAgo(12), reason: "Ốm có giấy báo nghỉ", taskCode: "TASK-0411", taskTitle: "Viết tài liệu hướng dẫn Sprint", displayName: "Nguyễn Minh", sessionName: "Phiên thực tập Thu 2026", baseScore: null, latePenalty: null, score: null, submissionStatus: null },
  ],
  summary: { total: 2, active: 1, registeredPenalty: 2 },
  page: 1,
  pageSize: 20,
};

const githubMe = { configured: true, connected: true, login: "minh-nguyen", canCreatePublicRepo: true, reconnectRequired: false };
const repositoryAccount = { configured: true, connected: true, login: "minh-nguyen", ready: true };
const sessionRepository = {
  repository: {
    owner: "v-intern",
    name: "eduscale-lms",
    url: "https://github.com/v-intern/eduscale-lms",
    status: "ready",
    errorCode: null,
    webhookStatus: "ready",
    webhookUpdatedAt: daysAgo(3),
  },
  members: [
    { userId: id("a1b2c3d4"), displayName: "Nguyễn Minh", status: "accepted", login: "minh-nguyen", invitationId: null, invitedAt: daysAgo(18), expiresAt: null, acceptedAt: daysAgo(18), lastCheckedAt: daysAgo(1), errorCode: null },
    { userId: id("other", 2), displayName: "Trần Bảo Long", status: "pending", login: "bao-long", invitationId: "inv-9x2", invitedAt: daysAgo(2), expiresAt: daysAhead(5), acceptedAt: null, lastCheckedAt: daysAgo(0.5), errorCode: null },
  ],
  canManage: false,
};
const repositoryActivity = {
  total: 12,
  items: [1, 2, 3, 4, 5].map((n) => ({
    id: id("act", n),
    eventType: ["push", "pull_request", "push", "pull_request", "push"][(n - 1) % 5],
    action: [
      "đẩy 3 commit vào nhánh feature/gradebook",
      "mở pull request #128: Gradebook layout",
      "đẩy 2 commit vào nhánh fix/overflow",
      "mở pull request #126: Responsive rubric",
      "đẩy 1 commit vào nhánh chore/deps",
    ][n - 1],
    headSha: ["9f31ab2", "c04d77e", "71e0f34", "b2c9e1", "5d8a90f"][n - 1],
    pullNumber: n % 2 === 0 ? 124 + n * 2 : null,
    branch: ["feature/gradebook", "feature/gradebook", "fix/overflow", "fix/overflow", "chore/deps"][n - 1],
    receivedAt: daysAgo(n * 0.7),
  })),
};

const notifications = page(
  [
    { id: id("ntf", 1), title: "Nhiệm vụ TASK-0403 đã được duyệt", body: "Giảng viên đã duyệt bài nộp của bạn.", linkUrl: "/intern/work", readAt: null, createdAt: daysAgo(0.2) },
    { id: id("ntf", 2), title: "Sprint 3 bắt đầu", body: "Sprint 3 — Bảng điểm & phản hồi đã được kích hồi.", linkUrl: "/intern/sprint", readAt: null, createdAt: daysAgo(1) },
    { id: id("ntf", 3), title: "Nhắc hạn nộp TASK-0402", body: "Hạn nộp còn 3 ngày.", linkUrl: "/intern/work", readAt: daysAgo(1.5), createdAt: daysAgo(2) },
  ],
  3,
  1,
  20,
);

const evaluations = [
  { id: id("evl", 1), cycleId: id("cyc", 1), status: "finalized", overallScore: 8.4, summary: "Tiến bộ rõ về chất lượng giao diện; cần cải thiện viết test.", finalizedAt: daysAgo(4), revisionNumber: 2, scores: [
    { id: id("esc", 1), criterionId: "quality", score: 8.5, comment: "Bố cục rõ ràng, đúng hệ thống token." },
    { id: id("esc", 2), criterionId: "testing", score: 7, comment: "Cần thêm test cho trạng thái lỗi." },
    { id: id("esc", 3), criterionId: "collaboration", score: 9, comment: "Phản hồi nhanh, trao đổi rõ ràng." },
  ] },
  { id: id("evl", 2), cycleId: id("cyc", 2), status: "submitted", overallScore: null, summary: "Bản đánh giá giữa kỳ, chờ giảng viên chốt.", finalizedAt: null, revisionNumber: 1, scores: [
    { id: id("esc", 4), criterionId: "quality", score: 7.5, comment: null },
  ] },
];

const performance = {
  metrics: {
    totalTaskCount: 14,
    completedTaskCount: 8,
    taskCompletionRate: 57.1,
    committedStoryPoints: 26,
    completedStoryPoints: 16,
    storyPointCompletionRate: 61.5,
    onTimeCompletionRate: 75,
    overdueOpenTaskCount: 1,
    averageEvaluationScore: 8.4,
    finalizedEvaluationCount: 1,
    activeSprintProgress: 57,
  },
};

const kpis = [
  { id: id("kpi", 1), ruleVersion: "v2026.10", status: "calculated", finalScore: 8.2, calculatedAt: daysAgo(3) },
  { id: id("kpi", 2), ruleVersion: "v2026.09", status: "insufficient_data", finalScore: null, calculatedAt: daysAgo(33) },
];

const kpiDetail = {
  ...kpis[0],
  metrics: [
    { metricCode: "task_completion", sourceValue: 57.1, configuredWeight: 0.4, effectiveWeight: 0.4, weightedContribution: 2.28, sourceJson: "{\"completed\":8,\"total\":14}" },
    { metricCode: "on_time_rate", sourceValue: 75, configuredWeight: 0.3, effectiveWeight: 0.3, weightedContribution: 2.25, sourceJson: "{\"onTime\":6,\"submitted\":8}" },
    { metricCode: "evaluation_score", sourceValue: 8.4, configuredWeight: 0.3, effectiveWeight: 0.3, weightedContribution: 2.52, sourceJson: "{\"average\":8.4,\"count\":1}" },
  ],
};

const salary = {
  balance: 12450000,
  unit: "VND",
  virtual: true,
  earnedThisPeriod: 2150000,
  latestEntries: [
    { id: id("led", 1), type: "kpi_earning", amount: 1600000, unit: "VND", description: "Thu nhập KPI kỳ 2026-10 (điểm 8.2)", createdAt: daysAgo(3) },
    { id: id("led", 2), type: "bonus", amount: 750000, unit: "VND", description: "Thưởng nhiệm vụ chất lượng TASK-0403", createdAt: daysAgo(5) },
    { id: id("led", 3), type: "penalty", amount: -200000, unit: "VND", description: "Phạt nộp muộn TASK-0408", createdAt: daysAgo(6) },
    { id: id("led", 4), type: "adjustment", amount: 0, unit: "VND", description: "Đối soát kỳ 2026-09", createdAt: daysAgo(30) },
  ],
};

const ledgerPage = {
  items: salary.latestEntries,
  total: 12,
  page: 1,
  pageSize: 20,
};

const certificates = [
  { id: id("crt", 1), certificateNumber: "VINT-2026-ESC-014", verificationCode: "VC7X-2MK9-QQ4T", status: "issued", issuedAt: daysAgo(2), completedAt: daysAgo(4), projectName: "EduScale LMS", sessionName: "Phiên thực tập Thu 2026", revokedAt: null, revokeReason: null, policyCode: "CERT-STD", policyVersion: 2 },
];

const recommendations = {
  id: id("rec", 1),
  createdAt: daysAgo(1),
  reused: false,
  // Contract: parseRecommendations reads v.recommendations.{summary,recommendations}.
  recommendations: {
    summary: "Ưu tiên hoàn thành nhiệm vụ đúng hạn và bổ sung kiểm thử cho trạng thái lỗi.",
    recommendations: [
      { type: "focus", priority: "high", title: "Thu hẹp phạm vi TASK-0402 để kịp hạn", reason: "Nhiệm vụ ưu tiên cao hạn trong 3 ngày, tiến độ mới 45%.", actions: ["Chia nhỏ thành 2 bước nộp", "Trao đổi với giảng viên về phạm vi"], evidenceMetricCodes: ["task_completion", "overdue_open"] },
      { type: "skill", priority: "medium", title: "Bổ sung test cho trạng thái lỗi", reason: "Điểm tiêu chí testing 7.0 thấp hơn mức kỳ vọng 8.0.", actions: ["Thêm 2 test lỗi mạng cho form nộp bài"], evidenceMetricCodes: ["evaluation_score"] },
    ],
  },
};

function notificationCategoriesDefaults() {
  return ["system", "task", "session", "evaluation", "announcement", "recruitment", "kpi", "salary", "certificate"].map((category) => ({ category, enabled: true }));
}

const taskSpec = {
  requirements:
    "Xây dựng cột điểm theo rubric cho trang bảng điểm: mỗi tiêu chí hiển thị mã, trọng số, điểm đã chấm và nhận xét. Chưa chấm hiển thị nhãn riêng, không dùng màu đỏ cho trạng thái trung lập.",
  role: "frontend",
  dod: [
    "Bảng render đúng khi có tiêu chí chưa chấm",
    "Không tràn ngang ở 390px",
    "Có test cho trạng thái loading và lỗi",
    "Đã soát contrast tối thiểu AA",
  ],
  documentation:
    "Đặc tả chi tiết nằm trong tài liệu dự án mục 4.2. Bàn với giảng viên trước khi đổi cấu trúc cột.",
  rubricVersion: "v2026.10",
  expectedOutput: "Một pull request kèm ảnh chụp 390px và 1440px.",
  estimatedHours: 8,
  skillTags: ["React", "CSS Layout", "Accessibility"],
  complexity: "intermediate",
  blocked: false,
  dependencies: [],
};

const taskSpecSource = {
  requirements: taskSpec.requirements,
  role: taskSpec.role,
  dod: taskSpec.dod,
  documentation: taskSpec.documentation,
  rubricVersion: taskSpec.rubricVersion,
  raw: true,
};

const submissions = [
  { id: id("sub", 1), taskId: id("tsk", 2), internId: id("a1b2c3d4"), prUrl: "https://github.com/v-intern/eduscale-lms/pull/128", summary: "Thêm cột điểm rubric, xử lý trạng thái chưa chấm.", status: "submitted", score: null, baseScore: null, latePenalty: null, feedback: null, headSha: "9f31ab2c", sourceRef: "feature/gradebook", sourceKind: "pull", observedHeadSha: "9f31ab2c", sourceChangedAt: daysAgo(1), submittedAt: daysAgo(1) },
  { id: id("sub", 2), taskId: id("tsk", 2), internId: id("a1b2c3d4"), prUrl: "https://github.com/v-intern/eduscale-lms/pull/126", summary: "Bản nháp đầu: khung cột, chưa có test.", status: "rework", score: 6.5, baseScore: 7, latePenalty: 0.5, feedback: "Thiếu test trạng thái lỗi; làm lại phần validation.", headSha: "c04d77e", sourceRef: "draft/gradebook-1", sourceKind: "pull", observedHeadSha: "c04d77e", sourceChangedAt: daysAgo(4), submittedAt: daysAgo(4) },
];

const ownReplacements = {
  limit: 3,
  items: [
    {
      result: {
        schemaVersion: 1,
        replacementId: id("rep", 1),
        commandId: id("cmd", 1),
        sessionId: id("ses"),
        oldAssignmentId: id("asg", 2),
        newAssignmentId: id("asg", 3),
        oldInternId: id("other", 1),
        newInternId: id("a1b2c3d4"),
        transferredTaskIds: [id("tsk", 3), id("tsk", 4)],
        preservedTaskCount: 5,
        approvedById: id("ins"),
        approvedAt: daysAgo(20),
        reason: "Thay thế thành viên nghỉ giữa kỳ",
        repositoryAccessQueued: true,
      },
      sessionName: "Phiên thực tập Thu 2026",
      projectName: "EduScale LMS",
    },
  ],
};

const repositoryAccessReport = {
  items: [
    { id: id("job", 1), sessionId: id("ses"), status: "done", displayStatus: "done", errorCode: null, attempts: 1, updatedAt: daysAgo(18), nextAttemptAt: daysAgo(18), revision: "r3", displayName: "Nguyễn Minh", sessionName: "Phiên thực tập Thu 2026", projectName: "EduScale LMS", role: "joining", outcome: "Đã cấp quyền write repository v-intern/eduscale-lms", repositoryUrl: "https://github.com/v-intern/eduscale-lms", retryAllowed: false },
  ],
  summary: [
    { status: "done", total: 1 },
  ],
  limit: 5,
};

const codeReviews = [
  {
    id: id("rev", 1),
    headSha: "9f31ab2c",
    status: "awaiting_instructor",
    model: "glm-4.6",
    inputHash: "b2c9e1",
    errorCode: null,
    result: {
      score: 8.2,
      rubric: { functional: 9, quality: 8, testing: 7, errors: 8, security: 9, dod: 8 },
      summary: "Bố cục đạt yêu cầu, xử lý trạng thái chưa chấm tốt. Cần bổ sung test cho nhánh lỗi mạng.",
      limitations: ["Chỉ xem mã nguồn, không chạy được ứng dụng thật."],
      findings: [
        { file: "src/app/intern/work/page.tsx", line: 42, message: "Thiếu nhãn aria-live khi tải lại danh sách.", severity: "medium" },
        { file: "src/components/intern/student-work-list.tsx", line: 88, message: "Nút mở nhiệm vụ nên mô tả rõ mã nhiệm vụ.", severity: "low" },
      ],
    },
    // Contract note: evidence sits at the item level (see parseCodeReviews:
    // it reads v.evidence, not result.evidence).
    evidence: {
      complete: true,
      warnings: [],
      trustedTests: {
        status: "passed",
        passed: 24,
        failed: 0,
        summary: "24 passed, 0 failed",
        executionTimeMs: 4120,
        score: 8,
        checks: [{ name: "vitest", passed: true, log: "Test Files 12 passed" }],
      },
    },
  },
];

/** Resolve a fixture for an intercepted API request. Returns null when unmatched. */
export function resolveApi(method, pathname, search) {
  const p = pathname.replace(/\/+$/, "");
  const q = search;
  if (method === "POST" && p === "/auth/refresh") return { accessToken: "qa-token", user: internUser };
  if (method === "GET" && p === "/auth/me") return internUser;
  // Public apply portal: open rounds + the candidate's own application.
  if (method === "GET" && p === "/career-roles")
    return {
      items: [
        { code: "frontend", label: "Frontend Developer", description: "Xây dựng giao diện Next.js với accessibility và form phức tạp.", level: "intern", language: "TypeScript", requiredSkills: ["TypeScript", "React", "HTML/CSS"], optionalSkills: ["Vitest", "Playwright"], version: 3 },
        { code: "backend", label: "Backend Developer", description: "Thiết kế API NestJS, bảo mật và kiểm thử tích hợp.", level: "intern", language: "TypeScript", requiredSkills: ["NestJS", "SQL", "REST"], optionalSkills: ["Docker"], version: 2 },
        { code: "qa", label: "QA Engineer", description: "Viết kịch bản kiểm thử, theo dõi lỗi và regression.", level: "intern", language: "TypeScript", requiredSkills: ["Vitest", "Playwright"], optionalSkills: ["k6"], version: 1 },
      ],
    };
  if (method === "GET" && p === "/applications/rounds")
    return {
      items: [
        { id: id("rec", 1), name: "Đợt tuyển Thu 2026", closesAt: daysAhead(12) },
        { id: id("rec", 2), name: "Đợt tuyển Xuân 2027", closesAt: daysAhead(70) },
      ],
    };
  if (method === "GET" && p === "/applications/me")
    return {
      id: id("app", 1),
      fullName: "Vũ Ngọc Ánh",
      status: "queued",
      matchedRole: "frontend",
      revision: 2,
      hasCv: true,
      booking: null,
      timeline: [
        { kind: "submitted", message: "Nộp CV và hoàn thành form ứng tuyển.", createdAt: daysAgo(6) },
        { kind: "analyzed", message: "Agent trích xuất facts và khớp vai trò frontend (độ tin 88%).", createdAt: daysAgo(5) },
        { kind: "queued", message: "Hồ sơ vào hàng đợi phỏng vấn vai trò Frontend Developer.", createdAt: daysAgo(3) },
      ],
    };
  if (method === "GET" && p === "/intern/me/workspace") {
    if (qaStage.recruitment === "welcome" || qaStage.recruitment === "role")
      return workspaceRecruitmentRequired;
    if (qaStage.recruitment === "interview")
      return workspaceRecruitmentInProgress;
    return workspaceActive;
  }
  if (method === "GET" && p === "/recruitment/me") {
    return recruitmentProfiles[qaStage.recruitment] ?? recruitmentProfiles.welcome;
  }
  const interviewQuestionsMatch = p.match(/^\/recruitment\/me\/interviews\/([^/]+)\/questions$/);
  if (method === "GET" && interviewQuestionsMatch) return interviewQuestions;
  if (method === "GET" && p === "/recruitment/me/result")
    return recruitmentProfiles.result.result;
  if (method === "GET" && p === "/tasks") {
    const mine = q.get("mine") === "true";
    const pageSize = Number(q.get("pageSize") ?? 10);
    const all = mine ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => task(n)) : [];
    return page(all.slice(0, pageSize), all.length, Number(q.get("page") ?? 1), pageSize);
  }
  const taskMatch = p.match(/^\/tasks\/([^/]+)$/);
  if (method === "GET" && taskMatch) return task(2);
  const commentsMatch = p.match(/^\/tasks\/([^/]+)\/comments$/);
  if (commentsMatch) return method === "POST" ? comments.data[0] : comments;
  const historyMatch = p.match(/^\/tasks\/([^/]+)\/history$/);
  if (method === "GET" && historyMatch) return history;
  if (method === "GET" && p === "/intern/me/sprints") return page([sprintSummary], 1, Number(q.get("page") ?? 1), 50);
  const ownBoardMatch = p.match(/^\/intern\/me\/sprints\/([^/]+)\/board$/);
  if (method === "GET" && ownBoardMatch) return board;
  const completionMatch = p.match(/^\/sprints\/([^/]+)\/completion$/);
  if (method === "GET" && completionMatch) return { total: 14, done: 8, open: 6, committedStoryPoints: 26, completedStoryPoints: 16 };
  if (method === "GET" && p === "/intern/me/project") return project;
  if (method === "GET" && p === "/intern/me/ai-mentor/conversations") {
    const status = q.get("status") ?? "active";
    const filtered = conversations.filter((c) => c.status === status);
    return { items: filtered, total: filtered.length, page: 1, pageSize: 20 };
  }
  const conversationMatch = p.match(/^\/intern\/me\/ai-mentor\/conversations\/([^/]+)$/);
  if (method === "GET" && conversationMatch) return conversationDetail(1);
  if (method === "GET" && p === "/github/me") return githubMe;
  if (method === "GET" && p === "/github/repository-account") return repositoryAccount;
  const sessionGithubMatch = p.match(/^\/sessions\/([^/]+)\/github$/);
  if (method === "GET" && sessionGithubMatch) return sessionRepository;
  const activityMatch = p.match(/^\/sessions\/([^/]+)\/github\/activity$/);
  if (method === "GET" && activityMatch) return repositoryActivity;
  if (method === "GET" && p === "/participation/me") return participationReport;
  if (method === "GET" && p === "/participation/me/replacements") return ownReplacements;
  if (method === "GET" && p === "/github/me/repository-access") return repositoryAccessReport;
  const codeReviewsMatch = p.match(/^\/submissions\/([^/]+)\/code-reviews$/);
  if (codeReviewsMatch) return codeReviews;
  const specMatch = p.match(/^\/tasks\/([^/]+)\/spec$/);
  if (method === "GET" && specMatch) return taskSpec;
  const specSourceMatch = p.match(/^\/tasks\/([^/]+)\/spec\/source$/);
  if (method === "GET" && specSourceMatch) return taskSpecSource;
  const submissionsMatch = p.match(/^\/tasks\/([^/]+)\/submissions$/);
  if (method === "GET" && submissionsMatch) return submissions;
  if (method === "POST" && submissionsMatch) return submissions[0];
  if (method === "GET" && p === "/participation/policy") return { version: 3, configured: true, activeFrom: daysAgo(60), warningFrom: 1, penaltyFrom: 2, replacementFrom: 3, penaltyPoints: 2, penaltyCap: 6 };
  if (method === "GET" && p === "/notifications") return notifications;
  if (method === "GET" && p === "/notifications/unread-count") return { count: 2 };
  if (method === "GET" && p === "/notifications/preferences") return { preferences: notificationCategoriesDefaults() };
  if (method === "GET" && p === "/intern/me/evaluations") return { items: evaluations };
  const evaluationMatch = p.match(/^\/intern\/me\/evaluations\/([^/]+)$/);
  if (method === "GET" && evaluationMatch) return evaluations[0];
  if (method === "GET" && p === "/intern/me/performance") return performance;
  if (method === "GET" && p === "/intern/me/kpi") return { items: kpis };
  const kpiMatch = p.match(/^\/intern\/me\/kpi\/([^/]+)$/);
  if (method === "GET" && kpiMatch) return kpiDetail;
  if (method === "GET" && p === "/intern/me/virtual-salary") return salary;
  if (method === "GET" && p === "/intern/me/virtual-salary/ledger") return ledgerPage;
  if (method === "GET" && p === "/intern/me/certificates") return { items: certificates };
  const certMatch = p.match(/^\/intern\/me\/certificates\/([^/]+)$/);
  if (method === "GET" && certMatch) return certificates[0];
  if (method === "GET" && p === "/intern/me/ai-recommendations") return recommendations;
  return null;
}
