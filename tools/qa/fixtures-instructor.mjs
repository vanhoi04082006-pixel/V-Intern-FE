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
  return resolveInternApi(method, pathname, search);
}
