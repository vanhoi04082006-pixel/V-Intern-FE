// data.ts — in-memory stores + realistic Vietnamese demo seed.
// The whole mock universe is anchored around 2026-10-28 (DEMO_NOW).

export const DEMO_NOW = "2026-10-28T08:00:00.000Z";

/* ============================ Permission sets ============================ */

export const ADMIN_PERMS = ["*"];

export const INSTRUCTOR_PERMS = [
  "classes.view", "classes.manage",
  "sessions.view", "sessions.manage",
  "projects.view", "projects.manage",
  "templates.assessment.read", "templates.assessment.manage",
  "assignments.view", "assignments.manage",
  "sprints.view", "sprints.manage",
  "tasks.view", "tasks.manage",
  "recruitment.view",
  "evaluations.view", "evaluations.manage",
  "performance.view",
  "kpi.view",
  "certificates.view", "certificates.verify",
  "ai.evaluation.assist", "ai.recommendations.view",
  "applications.manage",
  "settings.read",
];

export const INTERN_PERMS = [
  "intern.workspace.view",
  "tasks.view.own", "tasks.update.own",
  "recruitment.view.own", "recruitment.start.own", "recruitment.answer.own", "recruitment.submit.own",
  "evaluations.view.own",
  "performance.view.own",
  "kpi.view.own",
  "virtual_salary.view.own",
  "certificates.view.own",
  "ai.mentor.use",
  "ai.recommendations.view.own",
];

export const PERM_CATALOG: { id: string; code: string; name: string; description: string }[] = [
  ...["users.read|Xem danh sách người dùng", "users.create|Tạo người dùng", "users.update|Cập nhật người dùng",
    "users.status|Khoá / mở người dùng", "roles.read|Xem vai trò và quyền", "settings.read|Xem cấu hình hệ thống",
    "settings.update|Cập nhật cấu hình hệ thống", "audit.read|Xem nhật ký hệ thống",
    "system.read|Xem trạng thái hệ thống", "knowledge.read|Xem kho kiến thức", "knowledge.manage|Quản lý kho kiến thức",
    "catalogs.read|Xem danh mục", "catalogs.manage|Quản lý danh mục", "agents.manage|Quản lý AI agent",
    "communications.read|Xem thông báo hệ thống", "communications.manage|Gửi lại thông báo hệ thống"].map((s, i) => {
    const [code, name] = s.split("|");
    return { id: `perm_${i + 1}`, code, name, description: `Cho phép ${name.toLowerCase()}.` };
  }),
  ...["classes", "sessions", "projects", "assignments", "sprints", "tasks", "recruitment", "evaluations", "kpi",
    "certificates", "virtual_salary"].flatMap((dom, i) =>
    [{ code: `${dom}.view`, name: `Xem ${dom}` }, { code: `${dom}.manage`, name: `Quản lý ${dom}` }].map((p, j) => ({
      id: `perm_${40 + i * 2 + j}`, code: p.code, name: p.name, description: `Cho phép ${p.name.toLowerCase()}.`,
    }))
  ),
  ...["performance.view|Xem hiệu suất", "certificates.verify|Xác minh chứng chỉ",
    "templates.assessment.read|Đọc mẫu đánh giá", "templates.assessment.manage|Quản lý mẫu đánh giá",
    "ai.evaluation.assist|Trợ lý đánh giá AI", "ai.recommendations.view|Xem gợi ý AI",
    "ai.mentor.use|Sử dụng AI mentor", "applications.manage|Quản lý hồ sơ ứng tuyển",
    "intern.workspace.view|Xem không gian làm việc thực tập"].map((s, i) => {
    const [code, name] = s.split("|");
    return { id: `perm_own_${i}`, code, name, description: `Cho phép ${name.toLowerCase()}.` };
  }),
  ...["tasks.view.own|Xem task của mình", "tasks.update.own|Cập nhật task của mình",
    "recruitment.view.own|Xem tuyển dụng của mình", "recruitment.start.own|Bắt đầu bài test của mình",
    "recruitment.answer.own|Trả lời bài test của mình", "recruitment.submit.own|Nộp bài test của mình",
    "evaluations.view.own|Xem đánh giá của mình", "performance.view.own|Xem hiệu suất của mình",
    "kpi.view.own|Xem KPI của mình", "virtual_salary.view.own|Xem lương ảo của mình",
    "certificates.view.own|Xem chứng chỉ của mình", "ai.recommendations.view.own|Xem gợi ý AI của mình"].map((s, i) => {
    const [code, name] = s.split("|");
    return { id: `perm_self_${i}`, code, name, description: `Cho phép ${name.toLowerCase()}.` };
  }),
];

/* ============================ Types ============================ */

export interface UserRec {
  id: string; email: string; username: string; displayName: string; password: string;
  status: "active" | "inactive" | "pending"; roles: string[]; permissions: string[];
  createdAt: string; mustChangePassword?: boolean;
  githubConnected?: boolean; githubLogin?: string | null;
}
export interface ProjectRec {
  id: string; code: string; name: string; description: string; domainCategory: string;
  difficulty: "beginner" | "intermediate" | "advanced"; status: string; mentorId: string | null;
  capacity: number; startDate: string; endDate: string; technologies: string[];
  sessionId: string | null; version: number; createdAt: string;
}
export interface MilestoneRec { id: string; name: string; dueDate: string; completed: boolean; }
export interface TimelineItemRec { id: string; kind: string; title: string; actorName: string; createdAt: string; }
export interface GithubLinkRec {
  connected: boolean; repositoryUrl: string; invitationPending: number;
  members: { userId: string; displayName: string; login: string; status: "invited" | "accepted" }[];
}
export interface ParticipationRec {
  incidents: { id: string; kind: string; severity: string; description: string; resolvedAt: string | null; createdAt: string }[];
  policy: Record<string, any> | null;
}
export interface SessionRec {
  id: string; code: string; name: string; description: string;
  status: "planned" | "active" | "completed"; leadInstructorId: string;
  startDate: string; endDate: string; memberIds: string[]; instructorIds: string[];
  projectIds: string[]; version: number; createdAt: string;
  milestones: MilestoneRec[]; timeline: TimelineItemRec[]; github: GithubLinkRec; participation: ParticipationRec;
}
export interface LessonRec { id: string; title: string; startsAt: string; attendance: Record<string, boolean>; }
export interface ClassRec {
  id: string; code: string; name: string; sessionId: string | null; status: string;
  memberIds: string[]; lessons: LessonRec[]; version: number; createdAt: string;
}
export interface SprintRec {
  id: string; code: string; name: string; goal: string; projectId: string; sessionId: string;
  status: "planned" | "active" | "completed" | "cancelled"; startDate: string; endDate: string;
  version: number; createdAt: string;
}
export interface TaskRec {
  id: string; title: string; description: string;
  status: "todo" | "doing" | "review" | "done"; priority: "low" | "medium" | "high" | "critical";
  storyPoints: number; dueDate: string | null; version: number; projectId: string; sprintId: string | null;
  assigneeId: string | null; progress: number; createdAt: string; completedAt?: string | null; deleted?: boolean;
}
export interface TaskCommentRec { id: string; taskId: string; authorId: string; content: string; createdAt: string; }
export interface TaskHistoryRec { id: string; taskId: string; fromStatus: string; toStatus: string; actorName: string; createdAt: string; note: string | null; }
export interface SubmissionRec {
  id: string; taskId: string; internId: string; prUrl: string; ref: string; summary: string;
  status: "submitted" | "withdrawn" | "reviewed"; version: number; submittedAt: string;
  reviewedAt: string | null; score: number | null; feedback: string | null;
}
export interface CodeReviewRec {
  id: string; submissionId: string; source: "ai" | "human"; status: string;
  findings: string[]; score: number; createdAt: string;
}
export interface CriterionRec { id: string; code: string; name: string; description: string; weight: number; maxScore: number; isRequired: boolean; }
export interface EvalCycleRec {
  id: string; code: string; name: string; type: string; status: "draft" | "open" | "closed" | "archived";
  sessionId: string | null; projectId: string | null; startDate: string; endDate: string; dueDate: string | null;
  criteria: CriterionRec[]; version: number; createdAt: string;
}
export interface EvalScoreRec { criterionId: string; score: number | null; comment: string | null; }
export interface EvaluationRec {
  id: string; cycleId: string; internId: string; evaluatorId: string | null;
  status: "draft" | "submitted" | "finalized"; overallScore: number | null; summary: string | null;
  scores: EvalScoreRec[]; version: number; createdAt: string; submittedAt?: string | null; finalizedAt?: string | null;
}
export interface ImportedReviewRec {
  id: string; internId: string; repositoryUrl: string; score: number;
  status: "passed" | "needs_review" | "failed"; feedback: string; version: number; createdAt: string;
}
export interface CareerRoleRec {
  id: string; code: string; name: string; description: string; level: string; language: string;
  requiredSkills: string[]; acceptingApplications: boolean; status: "active" | "archived"; version: number; createdAt: string;
}
export interface RecruitmentRoundRec { id: string; name: string; opensAt: string; closesAt: string; status: "upcoming" | "open" | "closed"; version: number; createdAt: string; }
export interface QuestionRec { id: string; section: string; prompt: string; language: string; version: number; createdAt: string; }
export interface InterviewQuestionRec { id: string; order: number; section: string; prompt: string; answerText: string | null; followUp: string | null; }
export interface InterviewRec {
  id: string; userId: string; role: string; status: "in_progress" | "submitted" | "evaluated" | "cancelled";
  startedAt: string; submittedAt?: string | null; evaluatedAt?: string | null;
  overallScore?: number | null; technicalScore?: number | null; softScore?: number | null;
  questions: InterviewQuestionRec[];
}
export interface RecruitmentStateRec {
  userId: string; status: "not_started" | "role_selected" | "in_progress" | "passed" | "failed";
  selectedRole: string | null; attemptsUsed: number; maxAttempts: number;
  cooldownUntil: string | null; latestResult: { status: string; overallScore: number; passed: boolean } | null;
}
export interface KpiPeriodRec { id: string; code: string; name: string; status: "draft" | "open" | "finalized" | "closed"; startDate: string; endDate: string; version: number; resultCount: number; createdAt: string; }
export interface KpiResultRec { id: string; periodId: string; userId: string; totalScore: number; rank: number; components: { code: string; name: string; score: number; weight: number; detail: string }[]; createdAt: string; }
export interface SalaryEntryRec { id: string; userId: string; type: "payout" | "bonus" | "penalty"; amount: number; reason: string; kpiPeriodName: string | null; createdAt: string; }
export interface CertificateRec { id: string; certificateNumber: string; userId: string; role: string; projectId: string; status: "issued" | "revoked"; issuedAt: string; revokedAt: string | null; revokeReason: string | null; }
export interface AssignmentRec { id: string; internId: string; projectId: string; sessionId: string; status: "active" | "completed" | "cancelled"; role: string; createdAt: string; }
export interface NotificationRec { id: string; userId: string; category: string; title: string; body: string; read: boolean; createdAt: string; }
export interface ConversationRec { id: string; userId: string; title: string; status: "active" | "archived"; createdAt: string; messages: { id: string; role: string; content: string; createdAt: string }[]; }
export interface ReportRec { id: string; requestId: string; title: string; kind: string; projectId: string | null; sessionId: string | null; status: string; createdAt: string; snapshot: Record<string, any>; }
export interface GroupRec { id: string; code: string; name: string; memberIds: string[]; createdAt: string; }
export interface KnowledgeRec { id: string; code: string; title: string; status: "draft" | "published" | "archived"; version: number; draft: { title: string; body: string }; publishedAt: string | null; updatedAt: string; createdAt: string; }
export interface AuditRec { id: string; actorId: string; actorName: string; action: string; module: string; createdAt: string; }
export interface AgentRunRec { id: string; requestId: string; question: string; roleCode: string | null; status: "running" | "completed" | "cancelled"; result: string | null; createdAt: string; }
export interface CommunicationRec { id: string; recipient: string; subject: string; status: "sent" | "failed" | "pending"; createdAt: string; }
export interface ApplicationRec { id: string; roundId: string; email: string; fullName: string; consentVersion: string; status: string; submittedAt: string; interviewSlot: string | null; cvName: string | null; accessCode: string; }

/* ============================ Seed ============================ */

export function defaultCriteria(ids: string[]): CriterionRec[] {
  const defs: [string, string, string, number][] = [
    ["TECH_QUALITY", "Chất lượng kỹ thuật", "Chất lượng mã nguồn, kiến trúc và tuân thủ chuẩn dự án.", 35],
    ["DELIVERY", "Tiến độ & bàn giao", "Mức độ hoàn thành công việc đúng hạn và chất lượng bàn giao.", 30],
    ["COLLABORATION", "Hợp tác & giao tiếp", "Thái độ làm việc nhóm, giao tiếp với mentor và đồng đội.", 20],
    ["GROWTH", "Tinh thần học hỏi", "Khả năng tiếp thu, chủ động học hỏi công nghệ mới.", 15],
  ];
  return defs.map(([code, name, description, weight], i) => ({
    id: ids[i], code, name, description, weight, maxScore: 10, isRequired: true,
  }));
}

export function defaultInterviewQuestions(): InterviewQuestionRec[] {
  const prompts: [string, string][] = [
    ["intro", "Xin chào! Hãy giới thiệu ngắn gọn về bản thân bạn (tên, trường đang học và sở thích công nghệ)."],
    ["intro", "Bạn biết đến chương trình V-Intern qua kênh nào? Vì sao bạn muốn tham gia chương trình này?"],
    ["technical", "HTML/CSS: Sự khác biệt giữa margin và padding là gì? Cho ví dụ khi nào nên dùng mỗi loại."],
    ["technical", "JavaScript: Từ khoá `this` trong arrow function khác gì so với function thường? Nêu một ví dụ."],
    ["technical", "React: Component re-render khi nào? Kể tên hai cách tối ưu hiệu năng render."],
    ["technical", "Giải thích cơ chế bất đồng bộ trong JavaScript (event loop, Promise, async/await) bằng một ví dụ thực tế."],
    ["technical", "CSS: Flexbox và CSS Grid khác nhau thế nào? Bạn chọn cái nào cho layout danh sách sản phẩm? Vì sao?"],
    ["technical", "React: useEffect dùng để làm gì? Nêu một trường hợp dùng sai có thể gây memory leak."],
    ["english", "Please describe a small project you built and the main challenges you faced."],
    ["english", "If a teammate reviewed your code and left harsh comments, how would you respond?"],
  ];
  return prompts.map(([section, prompt], i) => ({
    id: `q_${i + 1}`, order: i + 1, section, prompt, answerText: null, followUp: null,
  }));
}

export interface LearningPackageRec { title: string; sections: { heading: string; items: string[] }[] }
export interface AiRecommendationRec { id: string; generatedAt: string; focusAreas: string[]; suggestions: string[]; encouragement: string }

export const db = {
  users: <UserRec[]>[
    { id: "u1", email: "admin@vintern.edu.vn", username: "admin", displayName: "Quản trị viên Hệ thống", password: "Admin@123456", status: "active", roles: ["admin"], permissions: ADMIN_PERMS, createdAt: "2025-01-10T08:00:00.000Z", githubConnected: true, githubLogin: "vintern-admin" },
    { id: "u2", email: "instructor@vintern.edu.vn", username: "hung.nq", displayName: "Nguyễn Quốc Hùng", password: "Instructor@123456", status: "active", roles: ["instructor"], permissions: INSTRUCTOR_PERMS, createdAt: "2025-01-15T08:00:00.000Z" },
    { id: "u3", email: "trang.tt@vintern.edu.vn", username: "trang.tt", displayName: "Trần Thu Trang", password: "Instructor@123456", status: "active", roles: ["instructor"], permissions: INSTRUCTOR_PERMS, createdAt: "2025-02-01T08:00:00.000Z" },
    { id: "u10", email: "intern@vintern.edu.vn", username: "khoa.pm", displayName: "Phạm Minh Khoa", password: "Intern@123456", status: "active", roles: ["intern"], permissions: INTERN_PERMS, createdAt: "2026-09-05T08:00:00.000Z" },
    { id: "u11", email: "linh.tt@student.edu.vn", username: "linh.tt", displayName: "Trần Thị Linh", password: "Intern@123456", status: "active", roles: ["intern"], permissions: INTERN_PERMS, createdAt: "2026-09-05T08:10:00.000Z" },
    { id: "u12", email: "nam.nv@student.edu.vn", username: "nam.nv", displayName: "Nguyễn Văn Nam", password: "Intern@123456", status: "active", roles: ["intern"], permissions: INTERN_PERMS, createdAt: "2026-09-05T08:20:00.000Z" },
    { id: "u13", email: "mai.pt@student.edu.vn", username: "mai.pt", displayName: "Phạm Thị Mai", password: "Intern@123456", status: "active", roles: ["intern"], permissions: INTERN_PERMS, createdAt: "2026-09-06T08:00:00.000Z" },
    { id: "u14", email: "huy.ld@student.edu.vn", username: "huy.ld", displayName: "Lê Đức Huy", password: "Intern@123456", status: "active", roles: ["intern"], permissions: INTERN_PERMS, createdAt: "2026-09-06T08:30:00.000Z" },
    { id: "u15", email: "tuan.ha@student.edu.vn", username: "tuan.ha", displayName: "Hoàng Anh Tuấn", password: "Intern@123456", status: "inactive", roles: ["intern"], permissions: INTERN_PERMS, createdAt: "2026-09-07T08:00:00.000Z" },
  ],

  roles: [
    { id: "role-1", code: "admin", name: "Quản trị viên", description: "Toàn quyền quản lý hệ thống V-Intern.", isSystem: true },
    { id: "role-2", code: "instructor", name: "Giảng viên hướng dẫn", description: "Quản lý lớp học, phiên thực tập, dự án và đánh giá học viên.", isSystem: true },
    { id: "role-3", code: "intern", name: "Thực tập sinh", description: "Tham gia dự án, nộp bài và xem kết quả của bản thân.", isSystem: true },
  ],
  rolePermissions: <Record<string, string[]>>{
    admin: ADMIN_PERMS,
    instructor: INSTRUCTOR_PERMS,
    intern: INTERN_PERMS,
  },

  projects: <ProjectRec[]>[
    { id: "p1", code: "LIB-MGMT", name: "Hệ thống quản lý thư viện số", description: "Xây dựng hệ thống quản lý mượn/trả sách cho thư viện trường học: phân quyền, thống kê, báo cáo và nhắc hạn trả sách.", domainCategory: "education", difficulty: "intermediate", status: "active", mentorId: "u2", capacity: 6, startDate: "2026-10-01", endDate: "2026-12-31", technologies: ["React", "Node.js", "PostgreSQL", "Docker"], sessionId: "s1", version: 2, createdAt: "2026-09-20T08:00:00.000Z" },
    { id: "p2", code: "FOOD-APP", name: "Ứng dụng đặt món ăn trực tuyến", description: "Ứng dụng web đặt món cho căng-tin trường với giỏ hàng, thanh toán QR và theo dõi đơn hàng thời gian thực.", domainCategory: "ecommerce", difficulty: "beginner", status: "active", mentorId: "u3", capacity: 5, startDate: "2026-10-01", endDate: "2026-12-31", technologies: ["Next.js", "TypeScript", "MongoDB"], sessionId: "s1", version: 1, createdAt: "2026-09-21T08:00:00.000Z" },
    { id: "p3", code: "ECOM-PLT", name: "Nền tảng thương mại điện tử đa kênh", description: "Nền tảng bán hàng đa kênh với quản lý tồn kho, đối soát đơn và tích hợp vận chuyển.", domainCategory: "ecommerce", difficulty: "advanced", status: "active", mentorId: "u2", capacity: 4, startDate: "2026-10-15", endDate: "2027-03-31", technologies: ["React", "NestJS", "PostgreSQL", "Redis", "Docker"], sessionId: "s2", version: 1, createdAt: "2026-09-25T08:00:00.000Z" },
    { id: "p4", code: "STU-BOT", name: "Chatbot trợ lý sinh viên", description: "Chatbot trả lời tự động các câu hỏi về học vụ, học phí và thủ tục hành chính cho sinh viên.", domainCategory: "education", difficulty: "intermediate", status: "active", mentorId: "u3", capacity: 3, startDate: "2026-10-15", endDate: "2027-02-28", technologies: ["Python", "FastAPI", "React"], sessionId: "s2", version: 1, createdAt: "2026-09-26T08:00:00.000Z" },
  ],

  sessions: <SessionRec[]>[
    {
      id: "s1", code: "INT-2026-SPRING", name: "Đợt thực tập Xuân 2026",
      description: "Chương trình thực tập tín dụng mùa Xuân 2026, tập trung phát triển full-stack web.",
      status: "active", leadInstructorId: "u2", startDate: "2026-10-01", endDate: "2026-12-31",
      memberIds: ["u10", "u11", "u12", "u13", "u15"], instructorIds: ["u2", "u3"], projectIds: ["p1", "p2"],
      version: 3, createdAt: "2026-09-01T08:00:00.000Z",
      milestones: [
        { id: "ms1", name: "Kickoff & phân tích yêu cầu", dueDate: "2026-10-05", completed: true },
        { id: "ms2", name: "Hoàn thành MVP theo phạm vi đề xuất", dueDate: "2026-11-15", completed: false },
        { id: "ms3", name: "Bàn giao & demo cuối kỳ", dueDate: "2026-12-20", completed: false },
      ],
      timeline: [
        { id: "tl1", kind: "session.created", title: "Phiên thực tập được tạo", actorName: "Quản trị viên Hệ thống", createdAt: "2026-09-01T08:00:00.000Z" },
        { id: "tl2", kind: "member.added", title: "Thêm học viên Phạm Minh Khoa vào phiên", actorName: "Nguyễn Quốc Hùng", createdAt: "2026-09-28T09:00:00.000Z" },
        { id: "tl3", kind: "status.changed", title: "Chuyển trạng thái phiên sang active", actorName: "Nguyễn Quốc Hùng", createdAt: "2026-10-01T08:00:00.000Z" },
        { id: "tl4", kind: "github.connected", title: "Kết nối kho mã GitHub của phiên", actorName: "Quản trị viên Hệ thống", createdAt: "2026-10-02T10:00:00.000Z" },
        { id: "tl5", kind: "milestone.completed", title: "Hoàn thành cột mốc Kickoff & phân tích yêu cầu", actorName: "Nguyễn Quốc Hùng", createdAt: "2026-10-06T16:00:00.000Z" },
      ],
      github: {
        connected: true, repositoryUrl: "https://github.com/v-intern/session-1", invitationPending: 2,
        members: [
          { userId: "u11", displayName: "Trần Thị Linh", login: "linh-tt", status: "accepted" },
          { userId: "u12", displayName: "Nguyễn Văn Nam", login: "nam-nv", status: "invited" },
          { userId: "u15", displayName: "Hoàng Anh Tuấn", login: "tuan-ha", status: "invited" },
        ],
      },
      participation: {
        incidents: [
          { id: "pt1", kind: "late", severity: "warning", description: "Đi trễ 15 phút buổi học ngày 12/10/2026", resolvedAt: "2026-10-13T00:00:00.000Z", createdAt: "2026-10-12T09:15:00.000Z" },
          { id: "pt2", kind: "absent", severity: "minor", description: "Vắng mặt không phép buổi Stand-up ngày 21/10/2026", resolvedAt: null, createdAt: "2026-10-21T09:00:00.000Z" },
        ],
        policy: { lateThresholdMinutes: 15, allowGracePerMonth: 2, penaltyPerLateVnd: 50000, absentPenaltyVnd: 200000 },
      },
    },
    {
      id: "s2", code: "INT-2026-SUMMER", name: "Đợt thực tập Hè 2026 (dự kiến)",
      description: "Phiên dự kiến cho mùa Hè 2026, tập trung hệ thống lớn và AI.",
      status: "planned", leadInstructorId: "u3", startDate: "2027-03-01", endDate: "2027-06-30",
      memberIds: ["u14"], instructorIds: ["u3"], projectIds: ["p3", "p4"],
      version: 1, createdAt: "2026-10-10T08:00:00.000Z",
      milestones: [{ id: "ms4", name: "Kickoff phiên Hè", dueDate: "2027-03-05", completed: false }],
      timeline: [{ id: "tl6", kind: "session.created", title: "Phiên thực tập được tạo", actorName: "Trần Thu Trang", createdAt: "2026-10-10T08:00:00.000Z" }],
      github: { connected: false, repositoryUrl: "", invitationPending: 0, members: [] },
      participation: { incidents: [], policy: null },
    },
    {
      id: "s3", code: "INT-2025-AUTUMN", name: "Đợt thực tập Thu 2025",
      description: "Phiên đã kết thúc, phục vụ tra cứu báo cáo và chứng chỉ.",
      status: "completed", leadInstructorId: "u2", startDate: "2025-09-01", endDate: "2025-12-20",
      memberIds: ["u11", "u12"], instructorIds: ["u2"], projectIds: ["p2"],
      version: 2, createdAt: "2025-08-15T08:00:00.000Z",
      milestones: [{ id: "ms5", name: "Bàn giao cuối kỳ", dueDate: "2025-12-19", completed: true }],
      timeline: [{ id: "tl7", kind: "status.changed", title: "Chuyển trạng thái phiên sang completed", actorName: "Nguyễn Quốc Hùng", createdAt: "2025-12-20T17:00:00.000Z" }],
      github: { connected: true, repositoryUrl: "https://github.com/v-intern/session-2025-autumn", invitationPending: 0, members: [] },
      participation: { incidents: [], policy: null },
    },
  ],

  classes: <ClassRec[]>[
    {
      id: "c1", code: "REACT-ADV", name: "Lớp React nâng cao", sessionId: "s1", status: "active",
      memberIds: ["u10", "u11", "u12", "u15"], version: 2, createdAt: "2026-10-01T08:00:00.000Z",
      lessons: [
        { id: "ls1", title: "Hooks nâng cao & custom hooks", startsAt: "2026-10-15T18:00:00.000Z", attendance: { u10: true, u11: true, u12: false, u15: true } },
        { id: "ls2", title: "Quản lý state với Zustand", startsAt: "2026-10-22T18:00:00.000Z", attendance: { u10: true, u11: false } },
        { id: "ls3", title: "Tối ưu hiệu năng: memo, useMemo, useCallback", startsAt: "2026-10-29T18:00:00.000Z", attendance: {} },
      ],
    },
    {
      id: "c2", code: "NODE-BASIC", name: "Lớp Node.js & Express cơ bản", sessionId: "s1", status: "active",
      memberIds: ["u10", "u13", "u15"], version: 1, createdAt: "2026-10-03T08:00:00.000Z",
      lessons: [{ id: "ls4", title: "REST API & middleware", startsAt: "2026-10-18T18:00:00.000Z", attendance: { u10: true, u13: true, u15: false } }],
    },
    {
      id: "c3", code: "DEVOPS-BASIC", name: "Lớp DevOps cơ bản với Docker", sessionId: "s2", status: "planned",
      memberIds: [], version: 1, createdAt: "2026-10-12T08:00:00.000Z", lessons: [],
    },
  ],

  sprints: <SprintRec[]>[
    { id: "sp1", code: "SPRINT-01", name: "Sprint 01 – Nền móng sản phẩm", goal: "Hoàn thành khung ứng dụng, schema CSDL và luồng xác thực cơ bản.", projectId: "p1", sessionId: "s1", status: "active", startDate: "2026-10-19", endDate: "2026-10-30", version: 1, createdAt: "2026-10-15T08:00:00.000Z" },
    { id: "sp2", code: "SPRINT-02", name: "Sprint 02 – Tính năng cốt lõi", goal: "Hoàn thiện CRUD sách, mượn/trả và tìm kiếm.", projectId: "p1", sessionId: "s1", status: "planned", startDate: "2026-11-02", endDate: "2026-11-13", version: 1, createdAt: "2026-10-15T08:05:00.000Z" },
    { id: "sp3", code: "SPRINT-03", name: "Sprint 03 – Hoàn thiện & tối ưu", goal: "Tối ưu hiệu năng, bổ sung test và chuẩn bị bàn giao.", projectId: "p1", sessionId: "s1", status: "planned", startDate: "2026-11-16", endDate: "2026-11-27", version: 1, createdAt: "2026-10-15T08:10:00.000Z" },
    { id: "sp4", code: "SPRINT-00", name: "Sprint 00 – Nghiên cứu & thiết kế", goal: "Phân tích yêu cầu, chọn công nghệ và thiết kế tổng thể.", projectId: "p1", sessionId: "s1", status: "completed", startDate: "2026-10-05", endDate: "2026-10-16", version: 2, createdAt: "2026-09-30T08:00:00.000Z" },
  ],

  tasks: <TaskRec[]>[
    { id: "t01", title: "Khởi tạo cấu trúc dự án & công cụ", description: "Cài đặt monorepo, ESLint, Prettier, Husky và pipeline CI cơ bản.", status: "done", priority: "medium", storyPoints: 2, dueDate: "2026-10-08", version: 3, projectId: "p1", sprintId: "sp4", assigneeId: "u10", progress: 100, createdAt: "2026-10-05T09:00:00.000Z", completedAt: "2026-10-07T15:00:00.000Z" },
    { id: "t02", title: "Thiết kế schema cơ sở dữ liệu PostgreSQL", description: "Thiết kế bảng books, readers, loans, reservations kèm ràng buộc và index.", status: "done", priority: "high", storyPoints: 5, dueDate: "2026-10-12", version: 2, projectId: "p1", sprintId: "sp4", assigneeId: "u10", progress: 100, createdAt: "2026-10-05T09:10:00.000Z", completedAt: "2026-10-11T17:00:00.000Z" },
    { id: "t03", title: "Thiết kế API contract (OpenAPI)", description: "Đặc tả REST API cho toàn bộ tài nguyên: auth, books, loans, reports.", status: "done", priority: "medium", storyPoints: 3, dueDate: "2026-10-15", version: 2, projectId: "p1", sprintId: "sp4", assigneeId: "u10", progress: 100, createdAt: "2026-10-05T09:20:00.000Z", completedAt: "2026-10-16T10:00:00.000Z" },
    { id: "t04", title: "Xây dựng khung ứng dụng React + Vite", description: "Khởi tạo dự án frontend, cấu hình router, layout, gọi API và xử lý lỗi.", status: "done", priority: "high", storyPoints: 5, dueDate: "2026-10-23", version: 1, projectId: "p1", sprintId: "sp1", assigneeId: "u10", progress: 100, createdAt: "2026-10-19T09:00:00.000Z", completedAt: "2026-10-21T16:00:00.000Z" },
    { id: "t05", title: "Triển khai xác thực JWT cho API", description: "Access/refresh token, guard phân quyền và test tích hợp luồng đăng nhập.", status: "done", priority: "critical", storyPoints: 5, dueDate: "2026-10-27", version: 2, projectId: "p1", sprintId: "sp1", assigneeId: "u10", progress: 100, createdAt: "2026-10-19T09:30:00.000Z", completedAt: "2026-10-26T11:00:00.000Z" },
    { id: "t06", title: "Xây dựng API quản lý sách (CRUD)", description: "Endpoints tạo/sửa/xoá/liệt kê sách, validate đầu vào và phân trang.", status: "doing", priority: "high", storyPoints: 8, dueDate: "2026-11-03", version: 1, projectId: "p1", sprintId: "sp1", assigneeId: "u10", progress: 60, createdAt: "2026-10-20T09:00:00.000Z" },
    { id: "t07", title: "Tạo trang danh sách sách có phân trang", description: "Bảng danh mục sách với tìm kiếm, lọc theo thể loại và phân trang phía client.", status: "todo", priority: "medium", storyPoints: 5, dueDate: "2026-11-04", version: 1, projectId: "p1", sprintId: "sp1", assigneeId: "u10", progress: 0, createdAt: "2026-10-20T09:10:00.000Z" },
    { id: "t08", title: "Viết unit test cho service mượn/trả sách", description: "Đạt coverage ≥ 80% cho loan service: hạn mức, trễ hạn, đặt trước sách.", status: "review", priority: "medium", storyPoints: 5, dueDate: "2026-11-02", version: 1, projectId: "p1", sprintId: "sp1", assigneeId: "u10", progress: 80, createdAt: "2026-10-21T09:00:00.000Z" },
    { id: "t09", title: "Thiết kế UI màn hình dashboard", description: "Dashboard thống kê mượn/trả theo tuần, biểu đồ thể loại sách được mượn nhiều.", status: "todo", priority: "medium", storyPoints: 5, dueDate: "2026-11-06", version: 1, projectId: "p1", sprintId: "sp1", assigneeId: "u11", progress: 0, createdAt: "2026-10-21T10:00:00.000Z" },
    { id: "t10", title: "Tích hợp tìm kiếm sách theo tên/tác giả", description: "Tìm kiếm full-text trên PostgreSQL và gợi ý tìm kiếm khi gõ.", status: "doing", priority: "high", storyPoints: 5, dueDate: "2026-11-05", version: 1, projectId: "p1", sprintId: "sp1", assigneeId: "u12", progress: 40, createdAt: "2026-10-22T09:00:00.000Z" },
    { id: "t11", title: "Viết tài liệu API bằng Swagger", description: "Xuất OpenAPI sang Swagger UI, bổ sung ví dụ request/response.", status: "done", priority: "low", storyPoints: 3, dueDate: "2026-10-29", version: 1, projectId: "p1", sprintId: "sp1", assigneeId: "u13", progress: 100, createdAt: "2026-10-22T10:00:00.000Z", completedAt: "2026-10-28T09:00:00.000Z" },
    { id: "t12", title: "Tối ưu truy vấn danh mục sách", description: "Phân tích EXPLAIN, bổ sung composite index và cache danh mục.", status: "todo", priority: "high", storyPoints: 5, dueDate: "2026-11-07", version: 1, projectId: "p1", sprintId: "sp1", assigneeId: "u11", progress: 0, createdAt: "2026-10-23T09:00:00.000Z" },
    { id: "t13", title: "Sửa lỗi phân trang ở trang cuối", description: "Trang cuối hiển thị sai số bản ghi khi tổng item chia hết pageSize.", status: "done", priority: "high", storyPoints: 3, dueDate: "2026-10-26", version: 2, projectId: "p1", sprintId: "sp1", assigneeId: "u15", progress: 100, createdAt: "2026-10-23T10:00:00.000Z", completedAt: "2026-10-25T14:00:00.000Z" },
    { id: "t14", title: "Chuẩn bị demo sprint review", description: "Slide tổng kết Sprint 01, quay video demo luồng mượn sách.", status: "todo", priority: "low", storyPoints: 2, dueDate: "2026-10-27", version: 1, projectId: "p1", sprintId: "sp1", assigneeId: "u10", progress: 0, createdAt: "2026-10-24T09:00:00.000Z" },
  ],

  taskComments: <TaskCommentRec[]>[
    { id: "tc1", taskId: "t06", authorId: "u2", content: "Nhớ thêm index cho cột title để tìm kiếm nhanh hơn nhé.", createdAt: "2026-10-25T08:30:00.000Z" },
    { id: "tc2", taskId: "t06", authorId: "u10", content: "Dạ em đã thêm GIN index, anh xem commit mới nhất giúp em ạ.", createdAt: "2026-10-25T09:00:00.000Z" },
    { id: "tc3", taskId: "t08", authorId: "u2", content: "Coverage hiện 72%, cố gắng đạt tối thiểu 80% trước khi merge nhé.", createdAt: "2026-10-26T15:00:00.000Z" },
  ],

  taskHistory: <TaskHistoryRec[]>[
    { id: "th1", taskId: "t05", fromStatus: "review", toStatus: "done", actorName: "Nguyễn Quốc Hùng", createdAt: "2026-10-27T15:00:00.000Z", note: "Review xong, merge vào main." },
    { id: "th2", taskId: "t06", fromStatus: "todo", toStatus: "doing", actorName: "Phạm Minh Khoa", createdAt: "2026-10-22T09:00:00.000Z", note: "Bắt đầu triển khai." },
    { id: "th3", taskId: "t08", fromStatus: "todo", toStatus: "doing", actorName: "Phạm Minh Khoa", createdAt: "2026-10-24T09:00:00.000Z", note: null },
    { id: "th4", taskId: "t08", fromStatus: "doing", toStatus: "review", actorName: "Phạm Minh Khoa", createdAt: "2026-10-27T10:00:00.000Z", note: "Gửi mentor review." },
    { id: "th5", taskId: "t13", fromStatus: "review", toStatus: "done", actorName: "Nguyễn Quốc Hùng", createdAt: "2026-10-25T14:00:00.000Z", note: null },
  ],

  submissions: <SubmissionRec[]>[
    { id: "sub1", taskId: "t05", internId: "u10", prUrl: "https://github.com/v-intern/session-1/pull/12", ref: "feature/jwt-auth", summary: "Thêm xác thực JWT, refresh token và guard phân quyền cho API.", status: "reviewed", version: 2, submittedAt: "2026-10-26T09:30:00.000Z", reviewedAt: "2026-10-27T15:00:00.000Z", score: 8.5, feedback: "Code sạch, có test. Cần bổ sung rate limit cho endpoint đăng nhập." },
    { id: "sub2", taskId: "t08", internId: "u10", prUrl: "https://github.com/v-intern/session-1/pull/20", ref: "test/loan-service", summary: "Bổ sung 18 unit test cho service mượn/trả sách.", status: "submitted", version: 1, submittedAt: "2026-10-28T10:00:00.000Z", reviewedAt: null, score: null, feedback: null },
  ],

  codeReviews: <CodeReviewRec[]>[
    { id: "cr1", submissionId: "sub1", source: "ai", status: "completed", findings: ["Hàm signToken nên đưa expiresIn vào hằng số cấu hình.", "Thiếu xử lý lỗi khi refresh token hết hạn.", "Nên băm mật khẩu với bcrypt cost ≥ 10."], score: 7.5, createdAt: "2026-10-26T10:00:00.000Z" },
    { id: "cr2", submissionId: "sub2", source: "ai", status: "completed", findings: ["Một số test thiếu bước arrange rõ ràng.", "Nên dùng factory tạo dữ liệu test thay vì lặp code."], score: 8.0, createdAt: "2026-10-28T10:05:00.000Z" },
  ],

  evaluationCycles: <EvalCycleRec[]>[
    { id: "ec1", code: "MID-2026S", name: "Đánh giá giữa kỳ – Xuân 2026", type: "mid_term", status: "open", sessionId: "s1", projectId: null, startDate: "2026-11-01", endDate: "2026-11-10", dueDate: "2026-11-12", criteria: defaultCriteria(["c1", "c2", "c3", "c4"]), version: 1, createdAt: "2026-10-20T08:00:00.000Z" },
    { id: "ec2", code: "FINAL-2025A", name: "Đánh giá cuối kỳ – Thu 2025", type: "final", status: "closed", sessionId: "s3", projectId: null, startDate: "2025-12-01", endDate: "2025-12-15", dueDate: "2025-12-18", criteria: defaultCriteria(["c5", "c6", "c7", "c8"]), version: 2, createdAt: "2025-11-20T08:00:00.000Z" },
  ],

  evaluations: <EvaluationRec[]>[
    { id: "ev1", cycleId: "ec1", internId: "u10", evaluatorId: "u2", status: "draft", overallScore: null, summary: null, scores: [{ criterionId: "c1", score: 8, comment: "Code ổn, còn vài chỗ lặp logic." }, { criterionId: "c2", score: 7.5, comment: null }, { criterionId: "c3", score: null, comment: null }, { criterionId: "c4", score: null, comment: null }], version: 1, createdAt: "2026-11-02T09:00:00.000Z" },
    { id: "ev2", cycleId: "ec2", internId: "u10", evaluatorId: "u2", status: "finalized", overallScore: 8.2, summary: "Khoa có nền tảng tốt, chủ động và hoàn thành đúng tiến độ. Cần cải thiện kỹ năng viết test và quản lý task nhỏ.", finalizedAt: "2025-12-18T10:00:00.000Z", scores: [{ criterionId: "c5", score: 8.5, comment: "Kiến trúc module rõ ràng, tuân thủ chuẩn dự án." }, { criterionId: "c6", score: 8, comment: "Đa số task hoàn thành đúng hạn." }, { criterionId: "c7", score: 7.5, comment: "Hợp tác tốt, thỉnh thoảng còn bị động trong cuộc họp." }, { criterionId: "c8", score: 8.5, comment: "Chủ động học hỏi công nghệ mới." }], version: 3, createdAt: "2025-12-02T09:00:00.000Z", submittedAt: "2025-12-14T15:00:00.000Z" },
    { id: "ev3", cycleId: "ec1", internId: "u11", evaluatorId: "u2", status: "submitted", overallScore: 83.3, summary: "Linh tiến bộ nhanh, cần chú ý chất lượng CSS và responsive.", scores: [{ criterionId: "c1", score: 8.5, comment: null }, { criterionId: "c2", score: 8, comment: null }, { criterionId: "c3", score: 8, comment: null }, { criterionId: "c4", score: 9, comment: "Chủ động đọc tài liệu mới." }], version: 2, createdAt: "2026-11-02T10:00:00.000Z", submittedAt: "2026-11-05T16:00:00.000Z" },
  ],

  aiSuggestions: <{ id: string; evaluationId: string; status: string; draftSummary: string; draftScores: { code: string; score: number }[]; createdAt: string }[]>[
    { id: "ais1", evaluationId: "ev1", status: "ready", draftSummary: "Học viên hoàn thành tốt tiến độ sprint, chất lượng mã nguồn ổn định. Nên khuyến khích viết thêm unit test và chủ động đặt câu hỏi trong daily meeting.", draftScores: [{ code: "TECH_QUALITY", score: 8 }, { code: "DELIVERY", score: 7.5 }, { code: "COLLABORATION", score: 7 }, { code: "GROWTH", score: 8.5 }], createdAt: "2026-11-03T09:00:00.000Z" },
  ],

  importedReviews: <ImportedReviewRec[]>[
    { id: "ir1", internId: "u10", repositoryUrl: "https://github.com/v-intern/library-mgmt", score: 8.2, status: "passed", feedback: "Cấu trúc repo tốt, README đầy đủ, có CI chạy test tự động.", version: 2, createdAt: "2026-10-24T08:00:00.000Z" },
    { id: "ir2", internId: "u11", repositoryUrl: "https://github.com/linh-tt/ui-dashboard", score: 6.5, status: "needs_review", feedback: "Thiếu README và mô tả cấu trúc dự án.", version: 1, createdAt: "2026-10-25T08:00:00.000Z" },
    { id: "ir3", internId: "u12", repositoryUrl: "https://github.com/nam-nv/food-app", score: 4.2, status: "failed", feedback: "Không có commit trong 3 tuần, thiếu test.", version: 1, createdAt: "2026-10-26T08:00:00.000Z" },
  ],

  careerRoles: <CareerRoleRec[]>[
    { id: "role-fe", code: "fe-intern", name: "Frontend Intern", description: "Phát triển giao diện người dùng bằng React/TypeScript, làm việc cùng designer và backend.", level: "intern", language: "vi", requiredSkills: ["HTML/CSS", "JavaScript", "React", "Git"], acceptingApplications: true, status: "active", version: 1, createdAt: "2026-08-01T08:00:00.000Z" },
    { id: "role-be", code: "be-intern", name: "Backend Intern", description: "Xây dựng API và nghiệp vụ phía server với Node.js/NestJS và SQL.", level: "intern", language: "vi", requiredSkills: ["Node.js", "REST API", "SQL", "Git"], acceptingApplications: true, status: "active", version: 1, createdAt: "2026-08-01T08:05:00.000Z" },
    { id: "role-fs", code: "fullstack-intern", name: "Full-stack Intern", description: "Tham gia toàn bộ tầng ứng dụng từ UI đến CSDL, ưu tiên ứng viên biết TypeScript.", level: "intern", language: "vi", requiredSkills: ["TypeScript", "React", "Node.js", "PostgreSQL"], acceptingApplications: true, status: "active", version: 1, createdAt: "2026-08-01T08:10:00.000Z" },
    { id: "role-qa", code: "qa-intern", name: "QA Intern", description: "Thiết kế kịch bản test, tự động hoá kiểm thử API/UI và báo cáo lỗi.", level: "intern", language: "vi", requiredSkills: ["Test design", "Playwright", "API testing", "SQL"], acceptingApplications: true, status: "active", version: 1, createdAt: "2026-08-01T08:15:00.000Z" },
    { id: "role-data", code: "data-intern", name: "Data Intern", description: "Xử lý và phân tích dữ liệu học vụ bằng Python và SQL, xây dựng báo cáo thống kê.", level: "intern", language: "vi", requiredSkills: ["Python", "SQL", "Pandas", "Thống kê mô tả"], acceptingApplications: false, status: "archived", version: 2, createdAt: "2026-08-01T08:20:00.000Z" },
  ],

  recruitmentRounds: <RecruitmentRoundRec[]>[
    { id: "rd1", name: "Vòng tuyển thực tập Xuân 2026", opensAt: "2026-08-01T00:00:00.000Z", closesAt: "2026-09-20T23:59:59.000Z", status: "open", version: 1, createdAt: "2026-07-25T08:00:00.000Z" },
    { id: "rd2", name: "Vòng tuyển thực tập Hè 2026", opensAt: "2027-02-01T00:00:00.000Z", closesAt: "2027-03-15T23:59:59.000Z", status: "upcoming", version: 1, createdAt: "2026-10-01T08:00:00.000Z" },
  ],

  questionBank: <QuestionRec[]>[
    { id: "qb1", section: "intro", prompt: "Hãy giới thiệu ngắn gọn về bản thân: tên, trường và định hướng nghề nghiệp.", language: "vi", version: 1, createdAt: "2026-07-01T08:00:00.000Z" },
    { id: "qb2", section: "intro", prompt: "Điều gì khiến bạn muốn tham gia chương trình thực tập V-Intern?", language: "vi", version: 1, createdAt: "2026-07-01T08:05:00.000Z" },
    { id: "qb3", section: "technical", prompt: "Sự khác biệt giữa let, const và var trong JavaScript là gì?", language: "vi", version: 1, createdAt: "2026-07-01T08:10:00.000Z" },
    { id: "qb4", section: "technical", prompt: "Giải thích cách hoạt động của event loop trong JavaScript.", language: "vi", version: 2, createdAt: "2026-07-01T08:15:00.000Z" },
    { id: "qb5", section: "technical", prompt: "REST API và GraphQL khác nhau như thế nào? Ưu/nhược điểm của từng loại.", language: "vi", version: 1, createdAt: "2026-07-01T08:20:00.000Z" },
    { id: "qb6", section: "technical", prompt: "Nêu các kỹ thuật tối ưu hiệu năng tải trang web phía frontend.", language: "vi", version: 1, createdAt: "2026-07-01T08:25:00.000Z" },
    { id: "qb7", section: "english", prompt: "Describe a project you are proud of and your contribution to it.", language: "en", version: 1, createdAt: "2026-07-01T08:30:00.000Z" },
    { id: "qb8", section: "english", prompt: "How do you prioritize tasks when you have multiple deadlines?", language: "en", version: 1, createdAt: "2026-07-01T08:35:00.000Z" },
  ],

  recruitmentStates: <RecruitmentStateRec[]>[
    { userId: "u10", status: "role_selected", selectedRole: "fe-intern", attemptsUsed: 0, maxAttempts: 3, cooldownUntil: null, latestResult: null },
    { userId: "u11", status: "passed", selectedRole: "fe-intern", attemptsUsed: 1, maxAttempts: 3, cooldownUntil: null, latestResult: { status: "passed", overallScore: 8.1, passed: true } },
    { userId: "u12", status: "failed", selectedRole: "be-intern", attemptsUsed: 3, maxAttempts: 3, cooldownUntil: "2026-12-01T00:00:00.000Z", latestResult: { status: "failed", overallScore: 4.2, passed: false } },
    { userId: "u13", status: "not_started", selectedRole: null, attemptsUsed: 0, maxAttempts: 3, cooldownUntil: null, latestResult: null },
    { userId: "u14", status: "not_started", selectedRole: null, attemptsUsed: 0, maxAttempts: 3, cooldownUntil: null, latestResult: null },
    { userId: "u15", status: "not_started", selectedRole: null, attemptsUsed: 0, maxAttempts: 3, cooldownUntil: null, latestResult: null },
  ],

  interviews: <InterviewRec[]>[
    {
      id: "iv1", userId: "u11", role: "fe-intern", status: "evaluated",
      startedAt: "2026-08-10T09:00:00.000Z", submittedAt: "2026-08-10T09:45:00.000Z", evaluatedAt: "2026-08-10T09:46:00.000Z",
      overallScore: 8.1, technicalScore: 8.5, softScore: 7,
      questions: defaultInterviewQuestions().map((q, i) => ({
        ...q,
        answerText: i < 9 ? `Câu trả lời mẫu số ${i + 1} của Trần Thị Linh.` : null,
        followUp: i === 2 ? "Có thể so sánh box-sizing: border-box với content-box không?" : null,
      })),
    },
  ],

  kpiPeriods: <KpiPeriodRec[]>[
    { id: "kp1", code: "KPI-2025-Q4", name: "KPI Quý 4/2025", status: "finalized", startDate: "2025-10-01", endDate: "2025-12-31", version: 2, resultCount: 5, createdAt: "2025-10-01T08:00:00.000Z" },
    { id: "kp2", code: "KPI-2026-Q1", name: "KPI Quý 1/2026", status: "open", startDate: "2026-01-01", endDate: "2026-03-31", version: 1, resultCount: 0, createdAt: "2026-01-01T08:00:00.000Z" },
    { id: "kp3", code: "KPI-2026-Q2", name: "KPI Quý 2/2026", status: "draft", startDate: "2026-04-01", endDate: "2026-06-30", version: 1, resultCount: 0, createdAt: "2026-03-28T08:00:00.000Z" },
  ],

  kpiResults: <KpiResultRec[]>[
    { id: "kr1", periodId: "kp1", userId: "u10", totalScore: 8.4, rank: 2, components: [{ code: "TASK", name: "Hoàn thành công việc", score: 8.5, weight: 40, detail: "Hoàn thành 18/21 task, đúng hạn 15 task." }, { code: "QUALITY", name: "Chất lượng công việc", score: 8, weight: 30, detail: "Điểm code review trung bình 8.2/10." }, { code: "COLLAB", name: "Hợp tác & giao tiếp", score: 8.5, weight: 15, detail: "Chủ động hỗ trợ đồng nhóm trong sprint." }, { code: "DISCIPLINE", name: "Kỷ luật", score: 9, weight: 15, detail: "Đi đúng giờ, đầy đủ buổi học." }], createdAt: "2026-01-05T08:00:00.000Z" },
    { id: "kr2", periodId: "kp1", userId: "u11", totalScore: 8.9, rank: 1, components: [{ code: "TASK", name: "Hoàn thành công việc", score: 9, weight: 40, detail: "Hoàn thành 20/21 task." }, { code: "QUALITY", name: "Chất lượng công việc", score: 8.8, weight: 30, detail: "Code review trung bình 8.8/10." }, { code: "COLLAB", name: "Hợp tác & giao tiếp", score: 9, weight: 15, detail: "Điều phối tốt nhóm frontend." }, { code: "DISCIPLINE", name: "Kỷ luật", score: 8.5, weight: 15, detail: "Đủ giờ, 1 lần trễ." }], createdAt: "2026-01-05T08:05:00.000Z" },
    { id: "kr3", periodId: "kp1", userId: "u12", totalScore: 7.2, rank: 3, components: [{ code: "TASK", name: "Hoàn thành công việc", score: 7, weight: 40, detail: "Hoàn thành 14/20 task." }, { code: "QUALITY", name: "Chất lượng công việc", score: 7.5, weight: 30, detail: "Một số PR phải sửa nhiều vòng." }, { code: "COLLAB", name: "Hợp tác & giao tiếp", score: 7, weight: 15, detail: "Tham gia đều daily meeting." }, { code: "DISCIPLINE", name: "Kỷ luật", score: 7.5, weight: 15, detail: "2 lần vắng không phép." }], createdAt: "2026-01-05T08:10:00.000Z" },
    { id: "kr4", periodId: "kp1", userId: "u13", totalScore: 6.8, rank: 4, components: [{ code: "TASK", name: "Hoàn thành công việc", score: 6.5, weight: 40, detail: "Hoàn thành 12/19 task." }, { code: "QUALITY", name: "Chất lượng công việc", score: 7, weight: 30, detail: "Tài liệu viết tốt." }, { code: "COLLAB", name: "Hợp tác & giao tiếp", score: 6.5, weight: 15, detail: "Ít chủ động phát biểu." }, { code: "DISCIPLINE", name: "Kỷ luật", score: 8, weight: 15, detail: "Đúng giờ." }], createdAt: "2026-01-05T08:15:00.000Z" },
    { id: "kr5", periodId: "kp1", userId: "u15", totalScore: 6.1, rank: 5, components: [{ code: "TASK", name: "Hoàn thành công việc", score: 6, weight: 40, detail: "Hoàn thành 10/17 task." }, { code: "QUALITY", name: "Chất lượng công việc", score: 6.2, weight: 30, detail: "Cần cải thiện chất lượng commit." }, { code: "COLLAB", name: "Hợp tác & giao tiếp", score: 6, weight: 15, detail: "Cần chủ động hơn." }, { code: "DISCIPLINE", name: "Kỷ luật", score: 6.5, weight: 15, detail: "Nhiều lần đi trễ." }], createdAt: "2026-01-05T08:20:00.000Z" },
  ],

  salaryEntries: <SalaryEntryRec[]>[
    { id: "se1", userId: "u10", type: "payout", amount: 2000000, reason: "Chi trả lương ảo kỳ KPI Quý 4/2025", kpiPeriodName: "KPI Quý 4/2025", createdAt: "2026-01-10T09:00:00.000Z" },
    { id: "se2", userId: "u10", type: "bonus", amount: 600000, reason: "Thưởng top 3 KPI Quý 4/2025", kpiPeriodName: "KPI Quý 4/2025", createdAt: "2026-01-10T09:01:00.000Z" },
    { id: "se3", userId: "u10", type: "penalty", amount: -100000, reason: "Phạt 2 lần đi trễ trong tháng 10/2026", kpiPeriodName: null, createdAt: "2026-10-20T09:00:00.000Z" },
    { id: "se4", userId: "u11", type: "payout", amount: 2500000, reason: "Chi trả lương ảo kỳ KPI Quý 4/2025", kpiPeriodName: "KPI Quý 4/2025", createdAt: "2026-01-10T09:05:00.000Z" },
  ],

  certificates: <CertificateRec[]>[
    { id: "cert1", certificateNumber: "V-INTERN-2026-001", userId: "u10", role: "intern", projectId: "p1", status: "issued", issuedAt: "2026-12-28T00:00:00.000Z", revokedAt: null, revokeReason: null },
    { id: "cert2", certificateNumber: "V-INTERN-2025-042", userId: "u11", role: "intern", projectId: "p2", status: "issued", issuedAt: "2025-12-20T00:00:00.000Z", revokedAt: null, revokeReason: null },
    { id: "cert3", certificateNumber: "REVOKED-001", userId: "u12", role: "intern", projectId: "p2", status: "revoked", issuedAt: "2025-12-20T00:00:00.000Z", revokedAt: "2026-02-10T00:00:00.000Z", revokeReason: "Vi phạm quy tắc ứng xử trong phiên thực tập." },
  ],

  assignments: <AssignmentRec[]>[
    { id: "a1", internId: "u10", projectId: "p1", sessionId: "s1", status: "active", role: "developer", createdAt: "2026-10-02T08:00:00.000Z" },
    { id: "a2", internId: "u11", projectId: "p1", sessionId: "s1", status: "active", role: "developer", createdAt: "2026-10-02T08:05:00.000Z" },
    { id: "a3", internId: "u12", projectId: "p2", sessionId: "s1", status: "active", role: "developer", createdAt: "2026-10-02T08:10:00.000Z" },
    { id: "a4", internId: "u13", projectId: "p2", sessionId: "s3", status: "completed", role: "tester", createdAt: "2025-10-01T08:00:00.000Z" },
    { id: "a5", internId: "u14", projectId: "p4", sessionId: "s2", status: "active", role: "developer", createdAt: "2026-10-12T08:00:00.000Z" },
    { id: "a6", internId: "u15", projectId: "p1", sessionId: "s1", status: "active", role: "tester", createdAt: "2026-10-03T08:00:00.000Z" },
  ],

  notifications: <NotificationRec[]>[
    { id: "n1", userId: "u10", category: "deadline", title: "Nhiệm vụ sắp đến hạn", body: "Nhiệm vụ “Tạo trang danh sách sách có phân trang” sẽ đến hạn vào 04/11/2026.", read: false, createdAt: "2026-10-27T08:00:00.000Z" },
    { id: "n2", userId: "u10", category: "evaluation", title: "Kết quả đánh giá có sẵn", body: "Kết quả đánh giá cuối kỳ Thu 2025 của bạn đã được chốt: 8.2/10.", read: false, createdAt: "2026-10-26T10:00:00.000Z" },
    { id: "n3", userId: "u10", category: "general", title: "Chào mừng đến với V-Intern", body: "Chúc bạn có một kỳ thực tập hiệu quả cùng mentor Nguyễn Quốc Hùng.", read: true, createdAt: "2026-10-01T08:00:00.000Z" },
    { id: "n4", userId: "u10", category: "deadline", title: "Sprint 01 sắp kết thúc", body: "Sprint 01 sẽ kết thúc vào 30/10/2026, hãy cập nhật tiến độ các nhiệm vụ.", read: false, createdAt: "2026-10-25T08:00:00.000Z" },
    { id: "n5", userId: "u1", category: "general", title: "Yêu cầu cấp chứng chỉ mới", body: "Có 1 yêu cầu cấp chứng chỉ đang chờ phê duyệt.", read: false, createdAt: "2026-10-27T09:00:00.000Z" },
    { id: "n6", userId: "u1", category: "system", title: "Sao lưu dữ liệu hàng ngày", body: "Bản sao lưu tự động lúc 02:00 đã hoàn tất.", read: true, createdAt: "2026-10-28T02:05:00.000Z" },
    { id: "n7", userId: "u2", category: "evaluation", title: "Chuẩn bị đánh giá giữa kỳ", body: "Kỳ đánh giá giữa kỳ Xuân 2026 sẽ mở từ 01/11/2026.", read: false, createdAt: "2026-10-24T08:00:00.000Z" },
    { id: "n8", userId: "u2", category: "deadline", title: "Có 2 bài nộp chờ review", body: "Bài nộp cho task “Viết unit test…” đang chờ bạn review.", read: false, createdAt: "2026-10-28T10:00:00.000Z" },
  ],

  notificationPrefs: <Record<string, Record<string, boolean>>>{},

  conversations: <ConversationRec[]>[
    {
      id: "conv1", userId: "u10", title: "Kế hoạch học React nâng cao", status: "active", createdAt: "2026-10-20T14:00:00.000Z",
      messages: [
        { id: "m1", role: "user", content: "Em nên học gì trước để làm tốt dự án thư viện ạ?", createdAt: "2026-10-20T14:00:00.000Z" },
        { id: "m2", role: "mentor", content: "Chào Khoa! Em nên nắm chắc React cơ bản (component, state, props) trước, sau đó học React Query để quản lý dữ liệu API. Chúc em học tốt!", createdAt: "2026-10-20T14:00:05.000Z" },
      ],
    },
    {
      id: "conv2", userId: "u10", title: "Cách viết unit test", status: "archived", createdAt: "2026-10-15T09:00:00.000Z",
      messages: [
        { id: "m3", role: "user", content: "Em muốn viết unit test cho service mượn sách, bắt đầu từ đâu ạ?", createdAt: "2026-10-15T09:00:00.000Z" },
        { id: "m4", role: "mentor", content: "Em bắt đầu với các trường hợp nghiệp vụ chính: mượn thành công, vượt hạn mức, sách đã có người đặt. Dùng Jest + ts-mockito nhé!", createdAt: "2026-10-15T09:00:05.000Z" },
      ],
    },
  ],

  aiRecommendations: <Record<string, AiRecommendationRec>>{
    u10: {
      id: "rec1", generatedAt: "2026-10-27T06:00:00.000Z",
      focusAreas: ["Tối ưu hiệu năng danh sách trong React", "Bổ sung unit test cho service nghiệp vụ", "Quản lý tiến độ task nhỏ"],
      suggestions: [
        "Dùng React.memo và useMemo cho bảng danh mục sách để giảm render không cần thiết.",
        "Đặt mục tiêu coverage ≥ 80% cho module mượn/trả sách trong Sprint 02.",
        "Chia task lớn thành nhiều commit nhỏ để mentor dễ review.",
        "Dành 30 phút mỗi ngày ôn tiếng Anh chuyên ngành phục vụ buổi demo cuối kỳ.",
      ],
      encouragement: "Bạn đang làm rất tốt trong Sprint 01! Tiếp tục phát huy tinh thần chủ động nhé.",
    },
  },

  learningPackages: <Record<string, LearningPackageRec>>{
    p1: {
      title: "Gói học tập – Hệ thống quản lý thư viện số",
      sections: [
        { heading: "Nền tảng bắt buộc", items: ["HTML/CSS và layout Flexbox", "JavaScript ES6+ và xử lý bất đồng bộ", "React cơ bản: component, state, props"] },
        { heading: "Nâng cao theo dự án", items: ["React Query cho quản lý trạng thái server", "Thiết kế REST API với Node.js/Express", "Tối ưu truy vấn PostgreSQL và index"] },
        { heading: "Kỹ năng mềm", items: ["Viết commit message chuẩn Conventional Commits", "Thuyết trình demo sprint ngắn gọn, đúng trọng tâm"] },
      ],
    },
    p2: {
      title: "Gói học tập – Ứng dụng đặt món ăn trực tuyến",
      sections: [
        { heading: "Nền tảng bắt buộc", items: ["TypeScript cơ bản", "Next.js App Router"] },
        { heading: "Nâng cao theo dự án", items: ["Thiết kế schema MongoDB", "Tích hợp thanh toán QR"] },
      ],
    },
  },

  reports: <ReportRec[]>[
    { id: "r1", requestId: "req-1001", title: "Báo cáo tiến độ dự án Hệ thống quản lý thư viện số", kind: "project_progress", projectId: "p1", sessionId: "s1", status: "completed", createdAt: "2026-10-27T16:00:00.000Z", snapshot: { projectName: "Hệ thống quản lý thư viện số", totalTasks: 14, doneTasks: 6, openTasks: 8, totalStoryPoints: 55, doneStoryPoints: 23, averageEvaluationScore: 8.2 } },
    { id: "r2", requestId: "req-1002", title: "Báo cáo đánh giá học viên – Đợt thực tập Xuân 2026", kind: "intern_evaluation", projectId: null, sessionId: "s1", status: "completed", createdAt: "2026-10-26T16:00:00.000Z", snapshot: { sessionName: "Đợt thực tập Xuân 2026", internCount: 5, finalizedEvaluations: 1, averageScore: 8.2 } },
  ],

  groups: <GroupRec[]>[
    { id: "g1", code: "grp-react", name: "Nhóm nghiên cứu React", memberIds: ["u10", "u11"], createdAt: "2026-10-05T08:00:00.000Z" },
    { id: "g2", code: "grp-devops", name: "Nhóm DevOps", memberIds: ["u15"], createdAt: "2026-10-06T08:00:00.000Z" },
  ],

  settings: <{ key: string; value: string; description: string }[]>[
    { key: "semester.name", value: "Xuân 2026", description: "Tên học kỳ hiện tại của chương trình." },
    { key: "ai.enabled", value: "true", description: "Bật/tắt các tính năng AI (mentor, gợi ý đánh giá)." },
    { key: "github.organization", value: "v-intern", description: "Tổ chức GitHub dùng cho các kho mã phiên thực tập." },
    { key: "recruitment.maxAttempts", value: "3", description: "Số lần làm bài phỏng vấn tuyển dụng tối đa." },
  ],

  catalogTypes: <{ id: string; code: string; name: string }[]>[
    { id: "ct1", code: "technology", name: "Công nghệ" },
    { id: "ct2", code: "domain_category", name: "Lĩnh vực" },
  ],
  catalogItems: <{ id: string; typeCode: string; code: string; name: string; version: number }[]>[
    { id: "ci1", typeCode: "technology", code: "react", name: "React", version: 1 },
    { id: "ci2", typeCode: "technology", code: "nodejs", name: "Node.js", version: 1 },
    { id: "ci3", typeCode: "technology", code: "postgresql", name: "PostgreSQL", version: 1 },
    { id: "ci4", typeCode: "technology", code: "docker", name: "Docker", version: 1 },
    { id: "ci5", typeCode: "technology", code: "typescript", name: "TypeScript", version: 1 },
    { id: "ci6", typeCode: "domain_category", code: "education", name: "Giáo dục", version: 1 },
    { id: "ci7", typeCode: "domain_category", code: "ecommerce", name: "Thương mại điện tử", version: 1 },
    { id: "ci8", typeCode: "domain_category", code: "healthcare", name: "Y tế", version: 1 },
  ],

  knowledge: <KnowledgeRec[]>[
    { id: "kb1", code: "KB-001", title: "Hướng dẫn nộp bài qua Pull Request", status: "published", version: 2, draft: { title: "Hướng dẫn nộp bài qua Pull Request", body: "<h3>Quy trình</h3><p>1. Tạo nhánh <code>feature/&lt;task-id&gt;</code>.</p><p>2. Commit theo chuẩn Conventional Commits.</p><p>3. Mở PR và gán mentor là reviewer.</p>" }, publishedAt: "2026-09-15T08:00:00.000Z", updatedAt: "2026-10-01T08:00:00.000Z", createdAt: "2026-09-10T08:00:00.000Z" },
    { id: "kb2", code: "KB-002", title: "Quy chuẩn đặt tên và cấu trúc thư mục dự án", status: "draft", version: 1, draft: { title: "Quy chuẩn đặt tên và cấu trúc thư mục dự án", body: "<h3>Đặt tên</h3><p>Biến: camelCase. Component: PascalCase. Hằng số: SNAKE_CASE.</p>" }, publishedAt: null, updatedAt: "2026-10-20T08:00:00.000Z", createdAt: "2026-10-18T08:00:00.000Z" },
  ],

  auditLogs: <AuditRec[]>[
    { id: "al1", actorId: "u1", actorName: "Quản trị viên Hệ thống", action: "user.login", module: "auth", createdAt: "2026-10-28T07:30:00.000Z" },
    { id: "al2", actorId: "u2", actorName: "Nguyễn Quốc Hùng", action: "session.updated", module: "sessions", createdAt: "2026-10-27T09:00:00.000Z" },
    { id: "al3", actorId: "u2", actorName: "Nguyễn Quốc Hùng", action: "task.status_changed", module: "tasks", createdAt: "2026-10-27T15:00:00.000Z" },
    { id: "al4", actorId: "u1", actorName: "Quản trị viên Hệ thống", action: "certificate.issued", module: "certificates", createdAt: "2026-10-26T10:00:00.000Z" },
    { id: "al5", actorId: "u2", actorName: "Nguyễn Quốc Hùng", action: "evaluation.finalized", module: "evaluations", createdAt: "2025-12-18T10:00:00.000Z" },
  ],

  activityEvents: <AuditRec[]>[
    { id: "ae1", actorId: "u10", actorName: "Phạm Minh Khoa", action: "task.started", module: "tasks", createdAt: "2026-10-28T08:30:00.000Z" },
    { id: "ae2", actorId: "u11", actorName: "Trần Thị Linh", action: "submission.created", module: "submissions", createdAt: "2026-10-27T14:00:00.000Z" },
    { id: "ae3", actorId: "u2", actorName: "Nguyễn Quốc Hùng", action: "lesson.attendance_updated", module: "classes", createdAt: "2026-10-27T18:30:00.000Z" },
    { id: "ae4", actorId: "u1", actorName: "Quản trị viên Hệ thống", action: "settings.updated", module: "settings", createdAt: "2026-10-26T11:00:00.000Z" },
    { id: "ae5", actorId: "u10", actorName: "Phạm Minh Khoa", action: "ai.conversation_created", module: "ai", createdAt: "2026-10-20T14:00:00.000Z" },
  ],

  agentRuns: <AgentRunRec[]>[
    { id: "ar1", requestId: "req-2001", question: "Chương trình V-Intern quy định gì về giờ giấc và điểm danh?", roleCode: "intern", status: "completed", result: "Theo quy chế: học viên cần điểm danh trước 9:00 sáng các ngày làm việc; đi trễ quá 15 phút bị ghi nhận kỷ luật và trừ lương ảo 50.000 VND/lần.", createdAt: "2026-10-27T10:00:00.000Z" },
  ],

  communications: <CommunicationRec[]>[
    { id: "cm1", recipient: "intern@vintern.edu.vn", subject: "Nhắc hạn nộp task Sprint 01", status: "sent", createdAt: "2026-10-27T08:00:00.000Z" },
    { id: "cm2", recipient: "linh.tt@student.edu.vn", subject: "Kết quả phỏng vấn tuyển dụng", status: "sent", createdAt: "2026-08-12T08:00:00.000Z" },
    { id: "cm3", recipient: "tuan.ha@student.edu.vn", subject: "Thông báo buổi học bù Lớp React nâng cao", status: "failed", createdAt: "2026-10-26T08:00:00.000Z" },
  ],

  applications: <ApplicationRec[]>[
    { id: "app1", roundId: "rd1", email: "yen.vh@gmail.com", fullName: "Vũ Hải Yến", consentVersion: "v1.2", status: "submitted", submittedAt: "2026-08-12T10:30:00.000Z", interviewSlot: "2026-09-01T09:00:00.000Z", cvName: "CV_Vu_Hai_Yen.pdf", accessCode: "VC-2026-0001" },
    { id: "app2", roundId: "rd1", email: "dung.nt@gmail.com", fullName: "Ngô Trọng Dũng", consentVersion: "v1.2", status: "interviewed", submittedAt: "2026-08-13T15:00:00.000Z", interviewSlot: "2026-09-03T14:00:00.000Z", cvName: "CV_Ngo_Trong_Dung.pdf", accessCode: "VC-2026-0002" },
    { id: "app3", roundId: "rd1", email: "anh.pq@gmail.com", fullName: "Phạm Quang Anh", consentVersion: "v1.1", status: "rejected", submittedAt: "2026-08-14T09:00:00.000Z", interviewSlot: null, cvName: "CV_Pham_Quang_Anh.pdf", accessCode: "VC-2026-0003" },
  ],

  /** candidate access token -> applicationId */
  candidateTokens: new Map<string, string>(),
  /** per-user GitHub OAuth link */
  githubAccounts: <Record<string, { connected: boolean; login: string | null }>>{},
  /** session-level GitHub repository account (shared bot) */
  githubRepoAccount: { connected: true, login: "v-intern-bot", selected: true },
};
