/**
 * Instructor-surface fixtures for the local visual QA harness.
 * Same scope rules as fixtures.mjs: LOCAL VISUAL VERIFICATION ONLY, shapes
 * mirror src/lib/api/* parsers, sql2019 CI stays the authority.
 */
import { resolveApi as resolveInternApi, internUser } from "./fixtures.mjs";

export const instructorUser = {
  ...internUser,
  id: "7b2c1d9e-0000-4000-8000-000000000009",
  email: "lan.pham@vintern.edu.vn",
  displayName: "TS. Phạm Thu Lan",
  roles: ["instructor"],
};

const now = Date.UTC(2026, 9, 30, 4, 0, 0);
const daysAgo = (n) => new Date(now - n * 86400000).toISOString();
const daysAhead = (n) => new Date(now + n * 86400000).toISOString();
const id = (prefix, n = 1) =>
  `${prefix}-0000-4000-8000-${String(n).padStart(12, "0")}`;

const sessionId = id("ses", 50);
const projectId = id("prj", 50);

const projectAcademic = {
  id: projectId,
  code: "PRJ-ESC",
  name: "EduScale LMS",
  status: "active",
  domainCategory: "web-app",
  description:
    "Nền tảng học tập cho giảng viên xây dựng Sprint, chấm bài theo rubric và sinh viên theo dõi tiến độ.",
  startDate: daysAgo(40),
  endDate: daysAhead(50),
  leadInstructorId: instructorUser.id,
  mentorId: instructorUser.id,
  difficulty: "intermediate",
  capacity: 6,
  technologies: ["Next.js", "TypeScript", "Tailwind CSS", "Vitest"],
};

const sessionOverview = (n) => ({
  id: n === 1 ? sessionId : id("ses", 50 + n),
  code: `SS-2026-${String(9 + n).padStart(2, "0")}`,
  name: ["Phiên thực tập Thu 2026", "Phiên thực tập Xuân 2026", "Phiên thực tập Hè 2026"][n - 1] ?? `Phiên số ${n}`,
  status: n === 1 ? "active" : n === 2 ? "upcoming" : "completed",
  startDate: daysAgo(40 - n * 5),
  endDate: daysAhead(50 - n * 10),
  project: n <= 2 ? { id: projectId, code: "PRJ-ESC", name: "EduScale LMS", templateVersion: 3 } : null,
  memberCount: 5 + n,
  sprintCount: 3,
  taskTotal: 14 + n * 2,
  taskDone: 8 + n,
  taskPercent: Math.round(((8 + n) / (14 + n * 2)) * 100),
  currentSprint: n === 1 ? { id: id("spr", 50), code: "SPR-03", name: "Sprint 3 — Bảng điểm & phản hồi" } : null,
  alerts: n === 1 ? { overdueTasks: 1, pendingReview: 2, sessionOverdue: false } : undefined,
});

const members = [
  { userId: id("a1b2c3d4"), displayName: "Nguyễn Minh", email: "minh.nguyen@student.edu.vn", role: "frontend", assignmentStatus: "active" },
  { userId: id("other", 2), displayName: "Trần Bảo Long", email: "bao.long@student.edu.vn", role: "backend", assignmentStatus: "active" },
  { userId: id("other", 3), displayName: "Lê Thu Hà", email: "thu.ha@student.edu.vn", role: "qa", assignmentStatus: "active" },
  { userId: id("other", 4), displayName: "Phạm Đức Anh", email: "duc.anh@student.edu.vn", role: "fullstack", assignmentStatus: "ended" },
];

const milestones = [
  { id: id("mst", 1), title: "Khung dự án & môi trường", status: "completed", dueDate: daysAgo(25) },
  { id: id("mst", 2), title: "Bảng điểm rubric", status: "in_progress", dueDate: daysAhead(7) },
  { id: id("mst", 3), title: "Nghiệm thu & demo", status: "upcoming", dueDate: daysAhead(35) },
];

const sessionDetail = {
  ...projectAcademic,
  id: sessionId,
  overview: sessionOverview(1),
  projectSnapshot: { name: "EduScale LMS", code: "PRJ-ESC" },
  members,
  milestones,
  sprintProgress: [
    { id: id("spr", 50), status: "active", taskTotal: 14, taskDone: 8, taskReview: 2 },
    { id: id("spr", 51), status: "completed", taskTotal: 12, taskDone: 12, taskReview: 0 },
    { id: id("spr", 52), status: "planned", taskTotal: 10, taskDone: 0, taskReview: 0 },
  ],
};

const sprintSummary = (n) => ({
  id: id("spr", 50 + n - 1),
  code: `SPR-0${n}`,
  name: ["Khung & môi trường", "Quản lý nhiệm vụ", "Bảng điểm & phản hồi"][n - 1] ?? `Sprint ${n}`,
  goal: "Sinh viên nộp và theo dõi bài được chấm theo rubric.",
  status: n === 1 ? "completed" : n === 2 ? "active" : "planned",
  projectId,
  sessionId,
  startDate: daysAgo(40 - n * 10),
  endDate: daysAgo(40 - n * 10 + 14),
  progress: n === 1 ? 100 : n === 2 ? 57 : null,
});

// nullable() only tolerates explicit null — undefined keys would fail the
// parser, so future points must carry actual: null (work not done yet).
const burndown = [0, 2, 4, 6, 8, 10].map((i) => ({
  date: daysAgo(10 - i),
  actual: [14, 13, 11, 9, 8, null][i] ?? null,
  ideal: Math.max(0, Math.round(14 - 1.4 * i)),
}));

const sessionWorkTask = (n) => ({
  id: id("tsk", 100 + n),
  code: `TASK-05${String(n).padStart(2, "0")}`,
  title: [
    "Dựng khung bảng điểm rubric",
    "API tổng hợp điểm theo tiêu chí",
    "Trang phản hồi cho sinh viên",
    "Kiểm thử luồng nộp bài",
    "Tối ưu truy vấn danh sách nhiệm vụ",
  ][(n - 1) % 5],
  description: "Nhiệm vụ thuộc Sprint 3. Sinh viên tự cập nhật tiến độ và nộp bài qua pull request.",
  storyPoints: [3, 5, 3, 2, 5][(n - 1) % 5],
  status: ["doing", "review", "done", "todo", "review"][(n - 1) % 5],
  priority: ["high", "medium", "low", "high", "medium"][(n - 1) % 5],
  progress: [60, 100, 100, 0, 100][(n - 1) % 5],
  dueDate: [daysAhead(3), daysAgo(1), daysAgo(4), daysAhead(8), daysAgo(2)][(n - 1) % 5],
  assigneeId: members[(n - 1) % 4].userId,
  projectId,
  sprintId: id("spr", 50),
  version: 2,
  sprint: { id: id("spr", 50), code: "SPR-03", name: "Bảng điểm & phản hồi", status: "active" },
  repository: { status: "ready", fullName: "v-intern/eduscale-lms" },
  delivery: n % 3 === 2 ? {
    blocked: false,
    submission: {
      id: id("sub", 100 + n),
      status: "submitted",
      prUrl: "https://github.com/v-intern/eduscale-lms/pull/201",
      headSha: "8f21b4c9",
      submittedAt: daysAgo(1),
      aiStatus: "awaiting_instructor",
      aiScore: 8.2,
      aiSummary: "Bố cục đạt yêu cầu; cần bổ sung test cho nhánh lỗi mạng.",
      instructorScore: null,
      instructorFeedback: null,
    },
  } : n % 3 === 0 ? { blocked: false, submission: null } : null,
});

const timeline = {
  data: [1, 2, 3, 4, 5].map((n) => ({
    id: id("evt", n),
    action: ["task_submitted", "task_approved", "sprint_started", "member_joined", "task_rework"][(n - 1) % 5],
    summary: [
      "Nguyễn Minh nộp bài TASK-0501",
      "Trần Bảo Long được duyệt TASK-0503",
      "Sprint 3 được kích hoạt",
      "Lê Thu Hà tham gia phiên",
      "Bài TASK-0505 được yêu cầu làm lại",
    ][n - 1],
    createdAt: daysAgo(n),
    actorName: ["Nguyễn Minh", "TS. Phạm Thu Lan", "TS. Phạm Thu Lan", "Lê Thu Hà", "TS. Phạm Thu Lan"][n - 1],
  })),
  meta: { total: 5, page: 1, pageSize: 10, totalPages: 1 },
};

const planSummaries = [
  {
    planId: id("plan", 1),
    projectId,
    sessionId,
    templateVersion: 3,
    status: "confirmed",
    createdAt: daysAgo(30),
    sprintCount: 3,
    taskCount: 36,
    hasDraft: false,
  },
];

const planDetail = {
  ...planSummaries[0],
  sprintCount: 3,
  taskCount: 36,
  draft: {
    sprints: [1, 2, 3].map((n) => ({
      code: `SPR-0${n}`,
      name: ["Khung & môi trường", "Quản lý nhiệm vụ", "Bảng điểm & phản hồi"][n - 1],
      goal: "Mục tiêu sprint do AI đề xuất, giảng viên xác nhận.",
      startDate: daysAgo(40 - n * 12),
      endDate: daysAgo(40 - n * 12 + 12),
      tasks: [1, 2].map((k) => ({
        key: `S${n}-T${k}`,
        parentKey: null,
        dependsOn: k === 2 ? [`S${n}-T1`] : [],
        expectedOutput: "Pull request kèm ảnh chụp màn hình và kết quả kiểm thử.",
        estimatedHours: 8,
        skillTags: ["React", "CSS Layout"],
        complexity: "intermediate",
        title: ["Dựng khung trang", "Viết kiểm thử"][k - 1],
        description: "Nhiệm vụ do AI đề xuất từ mẫu dự án; giảng viên chỉnh sửa trước khi kích hoạt.",
        priority: k === 1 ? "high" : "medium",
        storyPoints: [3, 2][k - 1],
        dueDate: daysAgo(40 - n * 12 + 10),
        suggestedRole: "frontend",
        assigneeId: null,
        acceptanceCriteria: ["Đạt tiêu chí hoàn thành trong TaskSpec", "Không có lỗi console"],
      })),
    })),
    milestones: [
      { key: "M1", title: "Khung dự án", dueDate: daysAgo(28), taskKeys: ["S1-T1", "S1-T2"] },
    ],
  },
  warnings: [],
  error: null,
  deduped: false,
};

const instructorDashboard = {
  metrics: {
    sessionCount: 3,
    activeSessions: 1,
    internCount: 5,
    taskCount: 42,
    todoCount: 10,
    doingCount: 8,
    doneCount: 20,
    reviewCount: 3,
    overdueCount: 1,
    averageScore: 8.1,
  },
  sessions: [1, 2].map((n) => ({
    id: sessionOverview(n).id,
    code: sessionOverview(n).code,
    name: sessionOverview(n).name,
    status: sessionOverview(n).status,
    startDate: sessionOverview(n).startDate,
    endDate: sessionOverview(n).endDate,
    projectName: "EduScale LMS",
    memberCount: sessionOverview(n).memberCount,
    taskCount: sessionOverview(n).taskTotal,
    doneCount: sessionOverview(n).taskDone,
  })),
  students: members.slice(0, 3).map((m, i) => ({
    id: m.userId,
    displayName: m.displayName,
    email: m.email,
    projectName: "EduScale LMS",
    taskCount: 8 + i,
    doneCount: 5 + i,
    averageScore: [8.4, 7.9, 8.8][i],
  })),
  activity: [1, 2, 3, 4].map((n) => ({
    id: id("act", 20 + n),
    summary: ["Nguyễn Minh nộp bài TASK-0501", "Sprint 3 được kích hoạt", "Lê Thu Hà tham gia phiên", "Đánh giá kỳ giữa được chốt"][n - 1],
    action: "timeline",
    createdAt: daysAgo(n),
    displayName: ["Nguyễn Minh", "TS. Phạm Thu Lan", "Lê Thu Hà", "TS. Phạm Thu Lan"][n - 1],
  })),
  sprints: [1, 2, 3].map((n) => ({
    id: sprintSummary(n).id,
    name: `Sprint ${n} — ${sprintSummary(n).name}`,
    projectName: "EduScale LMS",
    status: sprintSummary(n).status,
    startDate: sprintSummary(n).startDate,
    endDate: sprintSummary(n).endDate,
  })),
  reviews: [1, 2].map((n) => ({
    id: id("rev", 10 + n),
    taskId: sessionWorkTask(n * 2).id,
    internId: members[(n - 1) % 3].userId,
    prUrl: "https://github.com/v-intern/eduscale-lms/pull/20" + n,
    status: "submitted",
    score: null,
    submittedAt: daysAgo(n),
    taskCode: sessionWorkTask(n * 2).code,
    taskTitle: sessionWorkTask(n * 2).title,
    projectId,
    displayName: members[(n - 1) % 3].displayName,
  })),
  generatedAt: daysAgo(0.1),
};

const projectsPage = {
  data: [projectAcademic, { ...projectAcademic, id: id("prj", 51), code: "PRJ-MOB", name: "FieldCheck Mobile", status: "draft", mentorId: null, leadInstructorId: null }],
  meta: { total: 2, page: 1, pageSize: 10, totalPages: 1 },
};

const projectSessions = {
  sessions: [1, 2].map((n) => ({
    id: sessionOverview(n).id,
    code: sessionOverview(n).code,
    name: sessionOverview(n).name,
    status: sessionOverview(n).status,
    startDate: sessionOverview(n).startDate,
    endDate: sessionOverview(n).endDate,
    memberCount: sessionOverview(n).memberCount,
  })),
};

const projectSlots = {
  slots: [
    { roleCode: "frontend", requiredCount: 2, filledCount: 1, members: [{ userId: members[0].userId, displayName: members[0].displayName }] },
    { roleCode: "backend", requiredCount: 2, filledCount: 2, members: members.slice(1, 3).map((m) => ({ userId: m.userId, displayName: m.displayName })) },
  ],
};

const page = (data, total, pageNumber, pageSize) => ({
  data,
  meta: { total, page: pageNumber, pageSize, totalPages: Math.ceil(total / pageSize) },
});


const learningPackage = {
  schemaVersion: 1,
  prerequisites: ["JavaScript cơ bản", "HTML/CSS", "Git"],
  setup: "Cài đặt dependencies bằng npm ci, sao chép .env.example sang .env và khởi động dev server ở cổng 3001.",
  run: "Chạy npm run dev, truy cập /intern và đăng nhập bằng tài khoản demo được cấp.",
  starterFiles: [
    { path: "README.md", content: "# EduScale LMS\nDự án mẫu cho phiên thực tập." },
    { path: "src/app/layout.tsx", content: "export const metadata = { title: 'EduScale' };" },
  ],
};

const templateSummary = (n) => ({
  id: n === 1 ? id("tpl", 1) : id("tpl", n),
  code: ["TPL-ESC", "TPL-FIELD"][n - 1] ?? `TPL-${n}`,
  name: ["EduScale LMS", "FieldCheck Mobile"][n - 1] ?? `Mẫu dự án ${n}`,
  category: "web-app",
  difficulty: "intermediate",
  status: n === 2 ? "draft" : "published",
  version: 3,
  techStack: ["Next.js", "TypeScript", "Tailwind CSS"],
  roles: ["frontend", "backend", "qa"],
  teamSize: 6,
  sprintCount: 3,
  createdAt: daysAgo(60 - n * 5),
});

const templateDetail = {
  ...templateSummary(1),
  archivedAt: null,
  definition: { learningPackage },
  runs: [{ id: id("run", 1), projectId, sessionId, templateVersion: 3, createdAt: daysAgo(35) }],
};

// ---------------------------------------------------------------------------
// P4 — Instructor monitoring surfaces (recruitment rounds, participation,
// evaluations, performance, reports). Shapes mirror src/lib/api parsers:
// applications.ts, career-roles.ts, participation.ts, management.ts,
// reports.ts, report-details.ts, imported-reviews.ts.
// Note the envelope differences per endpoint: parsePage -> {data, meta},
// parseItemsPage -> {items, total}, roundApplications -> {total, page, items}.
// ---------------------------------------------------------------------------

const hoursAhead = (n) => new Date(now + n * 3600000).toISOString();

const recruitingCareerRoles = {
  items: [
    { code: "frontend", label: "Frontend Developer", description: "Xây dựng giao diện Next.js với accessibility và form phức tạp.", level: "intern", language: "TypeScript", requiredSkills: ["TypeScript", "React", "HTML/CSS"], optionalSkills: ["Vitest", "Playwright"], version: 3 },
    { code: "backend", label: "Backend Developer", description: "Thiết kế API NestJS, bảo mật và kiểm thử tích hợp.", level: "intern", language: "TypeScript", requiredSkills: ["NestJS", "SQL", "REST"], optionalSkills: ["Docker"], version: 2 },
    { code: "qa", label: "QA Engineer", description: "Viết kịch bản kiểm thử, theo dõi lỗi và regression.", level: "intern", language: "TypeScript", requiredSkills: ["Vitest", "Playwright"], optionalSkills: ["k6"], version: 1 },
  ],
};

const recruitmentRound = (n) => ({
  id: id("rec", n),
  name: ["Đợt tuyển Thu 2026", "Đợt tuyển Xuân 2027"][n - 1] ?? `Đợt tuyển số ${n}`,
  status: n === 1 ? "open" : "closed",
  opensAt: daysAgo(22 - n * 6),
  closesAt: n === 1 ? daysAhead(12) : daysAgo(2),
});

const recruitmentRoundDetail = {
  ...recruitmentRound(1),
  slots: [
    { id: id("slt", 1), roleCode: "frontend", startsAt: hoursAhead(72), endsAt: hoursAhead(74), timezone: "Asia/Ho_Chi_Minh", capacity: 6, booked: 4, status: "open", minimumPreparationMinutes: 60, credentialsLeadMinutes: 30 },
    { id: id("slt", 2), roleCode: "backend", startsAt: hoursAhead(96), endsAt: hoursAhead(98), timezone: "Asia/Ho_Chi_Minh", capacity: 4, booked: 4, status: "open", minimumPreparationMinutes: 60, credentialsLeadMinutes: 30 },
  ],
};

const roundApplicationsPage = {
  total: 4,
  page: 1,
  items: [
    { id: id("app", 1), fullName: "Vũ Ngọc Ánh", email: "ngoc.anh@example.edu.vn", status: "booked", matchedRole: "frontend", lastCode: null },
    { id: id("app", 2), fullName: "Hoàng Gia Bảo", email: "gia.bao@example.edu.vn", status: "waitlisted", matchedRole: "backend", lastCode: null },
    { id: id("app", 3), fullName: "Đặng Khánh Linh", email: "khanh.linh@example.edu.vn", status: "analyzing", matchedRole: null, lastCode: null },
    { id: id("app", 4), fullName: "Phan Tất Đạt", email: "tat.dat@example.edu.vn", status: "needs_information", matchedRole: "qa", lastCode: null },
  ],
};

const staffApplicationDetail = {
  id: id("app", 1),
  fullName: "Vũ Ngọc Ánh",
  status: "booked",
  matchedRole: "frontend",
  revision: 2,
  hasCv: true,
  booking: { id: id("bkg", 1), roleCode: "frontend", roleName: "Frontend Developer", status: "confirmed", startsAt: hoursAhead(72), endsAt: hoursAhead(74), timezone: "Asia/Ho_Chi_Minh", version: 1 },
  timeline: [
    { kind: "submitted", message: "Nộp CV và hoàn thành form ứng tuyển.", createdAt: daysAgo(6) },
    { kind: "analyzed", message: "Agent trích xuất facts và khớp vai trò frontend (độ tin 88%).", createdAt: daysAgo(5) },
    { kind: "booked", message: "Đặt khung phỏng vấn Frontend Developer, thời lượng 120 phút.", createdAt: daysAgo(2) },
  ],
  analysis: {
    facts: {
      confidence: 0.88,
      missing: ["Kinh nghiệm làm việc nhóm"],
      facts: [
        { skill: "React", ref: "CV — mục Dự án", quote: "Xây dựng 2 dự án React + TypeScript." },
        { skill: "Accessibility", ref: "CV — mục Kỹ năng", quote: "WCAG 2.1 AA cơ bản." },
      ],
    },
    match: { roleCode: "frontend", confidence: 0.88, reason: "Kỹ năng React/TypeScript khớp vai trò Frontend; thiếu minh chứng làm việc nhóm." },
  },
  interviewPolicy: {
    canRebook: true,
    serverNow: new Date(now).toISOString(),
    attemptsUsed: 0,
    attemptsRemaining: 2,
    nextEligibleAt: null,
    allowedRoleCodes: ["frontend", "backend", "qa"],
  },
};

const participationIncidents = [
  { id: id("inc", 1), taskId: id("tsk", 2), internId: id("a1b2c3d4"), sessionId, deadlineVersion: 3, policyVersion: 2, dueAt: daysAgo(6), submittedAt: null, kind: "missing", status: "active", ordinal: 1, points: 2, recommendReplacement: false, replacementEligible: false, createdAt: daysAgo(5), reason: null, taskCode: "TASK-0203", taskTitle: "Thêm cột nhận xét theo tiêu chí", displayName: "Nguyễn Minh", sessionName: "Phiên thực tập Thu 2026", baseScore: null, latePenalty: null, score: null, submissionStatus: "missing" },
  { id: id("inc", 2), taskId: id("tsk", 3), internId: id("other", 2), sessionId, deadlineVersion: 2, policyVersion: 2, dueAt: daysAgo(3), submittedAt: daysAgo(2), kind: "late", status: "active", ordinal: 2, points: 1, recommendReplacement: false, replacementEligible: false, createdAt: daysAgo(2), reason: null, taskCode: "TASK-0204", taskTitle: "Trang danh sách nhiệm vụ", displayName: "Trần Bảo Long", sessionName: "Phiên thực tập Thu 2026", baseScore: 7.5, latePenalty: 0.5, score: 7, submissionStatus: "late" },
  { id: id("inc", 3), taskId: id("tsk", 5), internId: id("other", 3), sessionId, deadlineVersion: 1, policyVersion: 2, dueAt: daysAgo(10), submittedAt: daysAgo(9), kind: "late", status: "excused", ordinal: 1, points: 0, recommendReplacement: false, replacementEligible: false, createdAt: daysAgo(9), reason: "Ốm, có giấy nghỉ phép của phòng đào tạo.", taskCode: "TASK-0205", taskTitle: "Form nộp bài kèm PR", displayName: "Lê Thu Hà", sessionName: "Phiên thực tập Thu 2026", baseScore: 8, latePenalty: 0, score: 8, submissionStatus: "late" },
];

const sessionParticipationReport = {
  items: participationIncidents,
  summary: { total: 3, active: 2, registeredPenalty: 3 },
  page: 1,
  pageSize: 20,
  policy: { version: 2, configured: true, activeFrom: daysAgo(60), warningFrom: 1, penaltyFrom: 2, replacementFrom: 3, penaltyPoints: 2, penaltyCap: 6 },
};

const evaluationCycle = (n) => ({
  id: id("cyc", n),
  code: `EV-2026-${String(n).padStart(2, "0")}`,
  name: ["Đánh giá giữa kỳ", "Đánh giá cuối kỳ"][n - 1] ?? `Kỳ đánh giá ${n}`,
  status: n === 1 ? "open" : "closed",
  type: "session",
  projectId,
  sessionId,
  startDate: daysAgo(20 - n * 5),
  endDate: n === 1 ? daysAhead(9) : daysAgo(1),
});

const evaluationCriteria = {
  items: [
    { id: id("cri", 1), code: "QUALITY", name: "Chất lượng mã nguồn", weight: 30, maxScore: 10, isRequired: true },
    { id: id("cri", 2), code: "TESTING", name: "Kiểm thử và độ phủ", weight: 25, maxScore: 10, isRequired: true },
    { id: id("cri", 3), code: "PROCESS", name: "Quy trình làm việc", weight: 25, maxScore: 10, isRequired: true },
    { id: id("cri", 4), code: "TEAMWORK", name: "Làm việc nhóm", weight: 20, maxScore: 10, isRequired: false },
  ],
};

const managedEvaluation = (n) => ({
  id: id("evl", n),
  cycleId: id("cyc", 1),
  internId: id("a1b2c3d4", n),
  evaluatorId: instructorUser.id,
  status: ["draft", "submitted", "finalized"][n - 1] ?? "draft",
  // Draft must carry null score: the list UI shows "Chưa chấm" only when the
  // backend has no final score yet (content-provenance rule).
  overallScore: [null, 7.5, 8.4][n - 1] ?? null,
  summary: [null, "Đã gửi, chờ giảng viên thứ hai xác nhận.", "Đã chốt: chất lượng tốt, cần cải thiện test."][n - 1] ?? null,
  revisionNumber: n,
});

const evaluationDetail = {
  evaluation: { ...managedEvaluation(1), status: "draft", overallScore: null, summary: "Bản nháp giữa kỳ; đã chấm 2/4 tiêu chí." },
  scores: [
    { criterionId: id("cri", 1), score: 8, comment: "Mã nguồn rõ ràng, tuân thủ quy ước đặt tên." },
    { criterionId: id("cri", 2), score: 6, comment: "Còn 2 luồng lỗi chưa có test." },
  ],
};

const aiSuggestionPayload = {
  summary: "Sinh viên nắm rõ kiến trúc màn hình, điểm yếu chính là độ phủ kiểm thử cho luồng lỗi.",
  strengths: ["Chia component hợp lý, dễ đọc.", "Form nộp bài xử lý đúng trạng thái chờ."],
  improvementAreas: ["Bổ sung test cho luồng lỗi mạng.", "Viết nhận xét rõ ràng theo từng tiêu chí rubric."],
  criterionSuggestions: [
    { criterionCode: "QUALITY", suggestedScore: 8, comment: "Quy ước mã nhất quán, có nhận xét review.", evidence: ["PR #128 được duyệt với 2 nhận xét nhỏ."] },
    { criterionCode: "TESTING", suggestedScore: 6, comment: "Độ phủ 61%, luồng lỗi chưa test.", evidence: ["Báo cáo vitest coverage 61% (30/10).", "2 luồng lỗi submit chưa có test."] },
  ],
};

const evaluationSuggestions = {
  items: [
    { id: id("sug", 1), status: "generated", generatedAt: daysAgo(1), suggestion: aiSuggestionPayload },
    { id: id("sug", 2), status: "superseded", generatedAt: daysAgo(4), suggestion: aiSuggestionPayload },
  ],
};

const evaluationSuggestionDetail = {
  id: id("sug", 1),
  evaluationId: id("evl", 1),
  status: "generated",
  generatedAt: daysAgo(1),
  aiRunId: id("run", 2),
  promptVersion: "v2026.10",
  acceptedAt: null,
  suggestion: aiSuggestionPayload,
};

const importedReviewsPage = {
  items: [
    { id: id("rev", 1), projectId, studentId: id("a1b2c3d4"), sourceImage: "github-pr", title: "Gradebook: cột điểm rubric", displayName: "Nguyễn Minh", projectName: "EduScale LMS", prNumber: 128, score: 8, status: "passed", feedback: "Trả lời review nhanh, sửa đúng chỗ.", occurredAt: daysAgo(2), version: 1 },
    { id: id("rev", 2), projectId, studentId: id("other", 2), sourceImage: "github-pr", title: "Task list: filter theo sprint", displayName: "Trần Bảo Long", projectName: "EduScale LMS", prNumber: 126, score: 6.5, status: "needs_review", feedback: null, occurredAt: daysAgo(4), version: 1 },
    { id: id("rev", 3), projectId, studentId: id("other", 3), sourceImage: "github-pr", title: "Upload CV parser", displayName: "Lê Thu Hà", projectName: "EduScale LMS", prNumber: 121, score: 4, status: "failed", feedback: "Test fail ở 2 case, chưa đạt ngưỡng.", occurredAt: daysAgo(6), version: 1 },
  ],
};

const performanceMembers = [
  { userId: id("a1b2c3d4"), displayName: "Nguyễn Minh", totalTaskCount: 14, completedTaskCount: 11, taskCompletionRate: 78.6, storyPointCompletionRate: 80, averageEvaluationScore: 7.8, rank: 1 },
  { userId: id("other", 2), displayName: "Trần Bảo Long", totalTaskCount: 13, completedTaskCount: 9, taskCompletionRate: 69.2, storyPointCompletionRate: 70, averageEvaluationScore: 7.1, rank: 2 },
  { userId: id("other", 3), displayName: "Lê Thu Hà", totalTaskCount: 12, completedTaskCount: 7, taskCompletionRate: 58.3, storyPointCompletionRate: 55, averageEvaluationScore: 6.4, rank: 3 },
];

const memberPerformanceMetrics = {
  metrics: {
    totalTaskCount: 14,
    completedTaskCount: 11,
    taskCompletionRate: 78.6,
    committedStoryPoints: 21,
    completedStoryPoints: 17,
    storyPointCompletionRate: 81,
    onTimeCompletionRate: 72,
    overdueOpenTaskCount: 1,
    averageEvaluationScore: 7.8,
    finalizedEvaluationCount: 1,
    activeSprintProgress: 57,
  },
};

const memberRecommendations = {
  id: id("rec", 2),
  createdAt: daysAgo(1),
  reused: false,
  recommendations: {
    summary: "Ưu tiên đóng 1 task quá hạn và nâng độ phủ kiểm thử cho luồng lỗi.",
    recommendations: [
      { type: "focus", priority: "high", title: "Chốt TASK-0203 đang quá hạn 6 ngày", reason: "Đang là task quá hạn duy nhất, chặn demo cuối sprint.", actions: ["Nộp phần đã làm xong", "Xin giảng viên gia hạn có lý do"], evidenceMetricCodes: ["overdue_open"] },
      { type: "skill", priority: "medium", title: "Bổ sung test cho trạng thái lỗi", reason: "Điểm tiêu chí TESTING 6.0 thấp hơn mức kỳ vọng 8.0.", actions: ["Thêm 2 test lỗi mạng cho form nộp bài"], evidenceMetricCodes: ["evaluation_score"] },
    ],
  },
};

const reportMetadata = (n) => ({
  id: id("rpt", n),
  title: ["Báo cáo tiến độ Sprint 3", "Hiệu suất thành viên phiên Thu", "Tổng hợp đánh giá giữa kỳ"][n - 1] ?? `Báo cáo ${n}`,
  kind: ["progress", "performance", "evaluation"][n - 1] ?? "progress",
  projectId,
  projectName: "EduScale LMS",
  createdAt: daysAgo(n),
});

const reportsList = {
  items: [1, 2, 3].map(reportMetadata),
  total: 3,
  counts: [
    { kind: "progress", count: 1, recentCount: 1 },
    { kind: "performance", count: 1, recentCount: 1 },
    { kind: "evaluation", count: 1, recentCount: 0 },
  ],
};

const savedReportDetail = {
  ...reportMetadata(1),
  snapshot: {
    projectName: "EduScale LMS",
    scope: { projectId, sessionId, from: daysAgo(14), to: daysAgo(1) },
    members: [
      { userId: id("a1b2c3d4"), displayName: "Nguyễn Minh", totalTaskCount: 5, completedTaskCount: 4, taskCompletionRate: 80, averageEvaluationScore: 7.8, overdueOpenTaskCount: 1, submissionCount: 6, approvedCount: 4, reworkCount: 2 },
      { userId: id("other", 2), displayName: "Trần Bảo Long", totalTaskCount: 5, completedTaskCount: 3, taskCompletionRate: 60, averageEvaluationScore: 7.1, overdueOpenTaskCount: 0, submissionCount: 5, approvedCount: 3, reworkCount: 1 },
    ],
    details: {
      summary: { total: 10, completed: 7, overdue: 1, blocked: 1, unassigned: 1, risk: "medium", reasons: ["1 task quá hạn 6 ngày", "1 task bị chờ phụ thuộc"] },
      tasks: [
        { id: id("tsk", 2), code: "TASK-0203", title: "Thêm cột nhận xét theo tiêu chí", status: "review", assigneeId: id("a1b2c3d4"), assigneeName: "Nguyễn Minh", sprintName: "Sprint 3", dueDate: daysAgo(6), blocked: false, submissionStatus: "submitted", aiStatus: "pending_review", aiScore: 7, instructorScore: null },
        { id: id("tsk", 3), code: "TASK-0204", title: "Trang danh sách nhiệm vụ", status: "doing", assigneeId: id("other", 2), assigneeName: "Trần Bảo Long", sprintName: "Sprint 3", dueDate: daysAhead(3), blocked: false, submissionStatus: "draft", aiStatus: null, aiScore: null, instructorScore: null },
        { id: id("tsk", 6), code: "TASK-0206", title: "Dashboard quản trị", status: "todo", assigneeId: null, assigneeName: null, sprintName: "Sprint 3", dueDate: daysAhead(9), blocked: true, submissionStatus: null, aiStatus: null, aiScore: null, instructorScore: null },
      ],
      sprints: [
        { id: id("spr", 50), name: "Sprint 3 — Bảng điểm & phản hồi", status: "active", total: 10, completed: 7, overdue: 1, blocked: 1 },
      ],
      timeline: [
        { taskId: id("tsk", 2), taskCode: "TASK-0203", toStatus: "review", createdAt: daysAgo(1) },
        { taskId: id("tsk", 3), taskCode: "TASK-0204", toStatus: "doing", createdAt: daysAgo(2) },
      ],
    },
  },
};

/** Resolve instructor-surface fixtures; falls back to shared intern fixtures. */
export function resolveInstructorApi(method, pathname, search) {
  const p = pathname.replace(/\/+$/, "");
  if (method === "GET" && p === "/auth/me") return instructorUser;
  if (method === "GET" && p === "/dashboard/instructor") return instructorDashboard;
  if (method === "GET" && p === "/sessions/member-options") {
    const pageSize = Number(search.get("pageSize") ?? 10);
    return page(members.map((m) => ({ userId: m.userId, displayName: m.displayName, email: m.email })), members.length, Number(search.get("page") ?? 1), pageSize);
  }
  if (method === "GET" && p === "/sessions") {
    const pageSize = Number(search.get("pageSize") ?? 10);
    return page([1, 2, 3].map(sessionOverview).slice(0, pageSize).map((row) => ({
      id: row.id, code: row.code, name: row.name, status: row.status,
      domainCategory: "web-app", description: "Phiên thực tập theo mẫu dự án EduScale LMS.",
      startDate: row.startDate, endDate: row.endDate,
      leadInstructorId: instructorUser.id, mentorId: instructorUser.id,
      difficulty: "intermediate", capacity: 6, technologies: ["Next.js", "TypeScript"],
    })), 3, Number(search.get("page") ?? 1), pageSize);
  }
  const boardMatch = p.match(/^\/sprints\/([^/]+)\/board$/);
  if (method === "GET" && boardMatch) return resolveInternApi("GET", "/intern/me/sprints/x/board", search);
  if (method === "GET" && p === "/project-templates") {
    const pageSize = Number(search.get("pageSize") ?? 10);
    return page([1, 2].map(templateSummary).slice(0, pageSize), 2, Number(search.get("page") ?? 1), pageSize);
  }
  const templateMatch = p.match(/^\/project-templates\/([^/]+)$/);
  if (method === "GET" && templateMatch) return templateDetail;
  const templateContextMatch = p.match(/^\/projects\/([^/]+)\/template-context$/);
  if (method === "GET" && templateContextMatch) return { definition: { learningPackage }, templateVersion: 3 };
  if (method === "GET" && p === "/sessions/overview") {
    const pageSize = Number(search.get("pageSize") ?? 10);
    return page([1, 2, 3].map(sessionOverview).slice(0, pageSize), 3, Number(search.get("page") ?? 1), pageSize);
  }
  const sessionMatch = p.match(/^\/sessions\/([^/]+)$/);
  if (method === "GET" && sessionMatch) return sessionDetail;
  const sessionWorkMatch = p.match(/^\/sessions\/([^/]+)\/work$/);
  if (method === "GET" && sessionWorkMatch) {
    const pageSize = Number(search.get("pageSize") ?? 20);
    return page([1, 2, 3, 4, 5].map(sessionWorkTask), 5, Number(search.get("page") ?? 1), pageSize);
  }
  const timelineMatch = p.match(/^\/sessions\/([^/]+)\/timeline$/);
  if (method === "GET" && timelineMatch) return timeline;
  const membersMatch = p.match(/^\/(sessions|projects)\/([^/]+)\/members$/);
  if (method === "GET" && membersMatch) return { members };
  if (method === "GET" && p === "/sprints") {
    const pageSize = Number(search.get("pageSize") ?? 20);
    return page([1, 2, 3].map(sprintSummary).slice(0, pageSize), 3, Number(search.get("page") ?? 1), pageSize);
  }
  const sprintMatch = p.match(/^\/sprints\/([^/]+)$/);
  if (method === "GET" && sprintMatch) return sprintSummary(2);
  const burndownMatch = p.match(/^\/dashboard\/sprints\/([^/]+)\/burndown$/);
  if (method === "GET" && burndownMatch) return burndown;
  if (method === "GET" && p === "/ai-generations/plans") return planSummaries;
  const planMatch = p.match(/^\/ai-generations\/plans\/([^/]+)$/);
  if (method === "GET" && planMatch) return planDetail;
  if (method === "GET" && p === "/projects") return projectsPage;
  const projectMatch = p.match(/^\/projects\/([^/]+)$/);
  if (method === "GET" && projectMatch) return projectAcademic;
  const projectSessionsMatch = p.match(/^\/projects\/([^/]+)\/sessions$/);
  if (method === "GET" && projectSessionsMatch) return projectSessions;
  const slotsMatch = p.match(/^\/projects\/([^/]+)\/slots$/);
  if (method === "GET" && slotsMatch) return projectSlots;
  const changesMatch = p.match(/^\/projects\/([^/]+)\/changes$/);
  if (method === "GET" && changesMatch)
    return [
      { id: id("chg", 1), title: "Thêm cột nhận xét theo tiêu chí", description: "Bổ sung nhận xét riêng cho từng tiêu chí rubric.", reason: "Sinh viên cần biết điểm nào bị trừ.", status: "applied", taskId: null, createdAt: daysAgo(9) },
      { id: id("chg", 2), title: "Tách màn phản hồi", description: "Tách phản hồi ra trang riêng cho sinh viên.", reason: "Giảm mật độ bảng điểm.", status: "pending", taskId: null, createdAt: daysAgo(2) },
    ];
  if (method === "GET" && p === "/tasks") {
    const pageSize = Number(search.get("pageSize") ?? 10);
    return page([1, 2, 3, 4, 5].map(sessionWorkTask).slice(0, pageSize), 5, Number(search.get("page") ?? 1), pageSize);
  }

  // --- P4: recruitment rounds & applications (instructor monitoring) ---
  if (method === "GET" && p === "/recruitment-rounds")
    return { items: [1, 2].map(recruitmentRound) };
  const roundMatch = p.match(/^\/recruitment-rounds\/([^/]+)$/);
  if (method === "GET" && roundMatch) return recruitmentRoundDetail;
  if (method === "GET" && p === "/career-roles") return recruitingCareerRoles;
  const roundAppsMatch = p.match(/^\/recruitment-rounds\/([^/]+)\/applications$/);
  if (method === "GET" && roundAppsMatch) return roundApplicationsPage;
  const staffAppMatch = p.match(/^\/recruitment-rounds\/([^/]+)\/applications\/([^/]+)$/);
  if (method === "GET" && staffAppMatch) return staffApplicationDetail;

  // --- P4: session participation (incidents + policy) ---
  const participationMatch = p.match(/^\/sessions\/([^/]+)\/participation$/);
  if (method === "GET" && participationMatch) return sessionParticipationReport;
  const sessionRepoJobsMatch = p.match(/^\/sessions\/([^/]+)\/participation\/repository-access-jobs$/);
  if (method === "GET" && sessionRepoJobsMatch)
    return {
      items: [
        { id: id("job", 1), sessionId, status: "done", displayStatus: "done", errorCode: null, attempts: 1, updatedAt: daysAgo(18), nextAttemptAt: daysAgo(18), revision: "r3", displayName: "Nguyễn Minh", sessionName: "Phiên thực tập Thu 2026", projectName: "EduScale LMS", role: "joining", outcome: "Đã cấp quyền write repository v-intern/eduscale-lms", repositoryUrl: "https://github.com/v-intern/eduscale-lms", retryAllowed: false },
        { id: id("job", 2), sessionId, status: "waiting_user", displayStatus: "waiting_user", errorCode: null, attempts: 1, updatedAt: daysAgo(1), nextAttemptAt: daysAgo(1), revision: "r1", displayName: "Trần Bảo Long", sessionName: "Phiên thực tập Thu 2026", projectName: "EduScale LMS", role: "joining", outcome: "Đang chờ sinh viên chấp nhận lời mời trên GitHub", repositoryUrl: "https://github.com/v-intern/eduscale-lms", retryAllowed: true },
      ],
      summary: [
        { status: "done", total: 1 },
        { status: "waiting_user", total: 1 },
      ],
      limit: 5,
    };

  // --- P4: evaluation cycles, managed evaluations, AI suggestions ---
  if (method === "GET" && p === "/evaluation-cycles")
    return { items: [1, 2].map(evaluationCycle), total: 2 };
  const criteriaMatch = p.match(/^\/evaluation-cycles\/([^/]+)\/criteria$/);
  if (method === "GET" && criteriaMatch) return evaluationCriteria;
  if (method === "GET" && p === "/evaluations")
    return { items: [1, 2, 3].map(managedEvaluation), total: 3 };
  const evaluationMatch = p.match(/^\/evaluations\/([^/]+)$/);
  if (method === "GET" && evaluationMatch) return evaluationDetail;
  const suggestionListMatch = p.match(/^\/evaluations\/([^/]+)\/ai-suggestions$/);
  if (method === "GET" && suggestionListMatch) return evaluationSuggestions;
  const suggestionMatch = p.match(/^\/evaluations\/([^/]+)\/ai-suggestions\/([^/]+)$/);
  if (method === "GET" && suggestionMatch) return evaluationSuggestionDetail;
  if (method === "POST" && suggestionListMatch) return evaluationSuggestionDetail;

  // --- P4: imported PR reviews ---
  if (method === "GET" && p === "/imported-reviews") return importedReviewsPage;

  // --- P4: member performance + AI recommendations ---
  if (method === "GET" && p === "/performance/interns")
    return { items: performanceMembers, total: 3, page: Number(search.get("page") ?? 1), pageSize: Number(search.get("pageSize") ?? 10) };
  const memberPerfMatch = p.match(/^\/performance\/interns\/([^/]+)$/);
  if (method === "GET" && memberPerfMatch) return memberPerformanceMetrics;
  const memberRecMatch = p.match(/^\/performance\/interns\/([^/]+)\/ai-recommendations$/);
  if (method === "GET" && memberRecMatch) return memberRecommendations;

  // --- P4: saved reports ---
  if (method === "GET" && p === "/reports") return reportsList;
  const reportMatch = p.match(/^\/reports\/([^/]+)$/);
  if (method === "GET" && reportMatch) return savedReportDetail;
  if (method === "POST" && p === "/reports") return savedReportDetail;

  return resolveInternApi(method, pathname, search);
}
