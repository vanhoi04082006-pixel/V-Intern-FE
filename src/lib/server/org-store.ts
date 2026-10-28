/**
 * Store riêng (in-memory) cho nhóm tính năng participation / knowledge /
 * org (groups, roles, catalogs) / account (change-password, github invitation,
 * session sharing) — Task 2-b.
 *
 * KHÔNG đụng store.ts/types.ts chính: gắn trên globalThis key riêng
 * `__vintern_org_store__` (sống qua HMR), pattern giống store.ts.
 */

import { daysAgo, daysFromNow } from "./util";

/* ============================== Participation ============================== */

export type IncidentKind = "missing" | "late";
export type IncidentStatus = "active" | "excused" | "reversed";

export interface ParticipationPolicy {
  id: string;
  sessionId: string;
  version: number;
  /** Giờ — từ lúc quá hạn tới khi cảnh báo. */
  warningFrom: number;
  /** Giờ — từ lúc quá hạn tới khi trừ điểm kỷ luật. */
  penaltyFrom: number;
  /** Giờ — từ lúc quá hạn tới khi đề xuất thay người. */
  replacementFrom: number;
  /** Điểm trừ mỗi lần vi phạm (missing). */
  penaltyPoints: number;
  /** Trần điểm trừ mỗi thực tập sinh trong phiên. */
  penaltyCap: number;
  /** Ngày chính sách có hiệu lực (ISO date). */
  activeFrom: string;
  reason: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParticipationIncident {
  id: string;
  sessionId: string;
  sessionName: string;
  internId: string;
  internName: string;
  taskId: string;
  taskCode: string;
  taskTitle: string;
  dueAt: string;
  submittedAt: string | null;
  /** Lần vi phạm thứ mấy của intern trong phiên. */
  ordinal: number;
  /** Điểm kỷ luật ghi nhận (số âm; excused/reversed không tính vào tổng). */
  points: number;
  kind: IncidentKind;
  status: IncidentStatus;
  baseScore: number;
  /** Điểm trừ trên điểm task (số âm). */
  latePenalty: number;
  score: number;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolveReason: string | null;
  createdAt: string;
}

export interface ReplacementTransfer {
  taskId: string;
  taskCode: string;
  taskTitle: string;
}

export interface ReplacementPreserved {
  taskCode: string;
  reason: string;
}

export interface ReplacementRecord {
  id: string;
  sessionId: string;
  sessionName: string;
  incidentId: string | null;
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  reason: string;
  transfers: ReplacementTransfer[];
  preservedTasks: ReplacementPreserved[];
  handoverHours: number;
  createdBy: string;
  at: string;
}

export interface ReplacementPreviewCommand {
  commandId: string;
  sessionId: string;
  incidentId: string;
  fromUserId: string;
  fromName: string;
  candidateUserId: string;
  candidateName: string;
  handoverHours: number;
  previewHash: string;
  expiresAt: string;
  transfers: { taskId: string; taskCode: string; taskTitle: string; from: string; to: string; fromName: string; toName: string }[];
  preservedTasks: ReplacementPreserved[];
  warnings: string[];
  createdAt: string;
}

export type RepoJobStatus =
  | "pending"
  | "leased"
  | "retry"
  | "waiting_user"
  | "done"
  | "failed"
  | "review_required";

export interface RepositoryAccessJob {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  displayStatus: RepoJobStatus;
  revision: number;
  note: string;
  at: string;
}

/* =============================== Knowledge ================================ */

export type KnowledgeKind =
  | "qa"
  | "guide"
  | "exercise"
  | "solution"
  | "rubric"
  | "plan_template"
  | "communication";

export type KnowledgeStatus = "draft" | "published" | "archived";
export type KnowledgeAudience = "student_safe" | "staff_only" | "grading_only";

export type KnowledgePurpose =
  | "interview_question"
  | "code_review"
  | "plan_generation"
  | "career_advice"
  | "exercise_grading"
  | "cv_analysis"
  | "session_summary"
  | "mentor_chat"
  | "onboarding_guide";

export interface KnowledgeSource {
  name: string;
  url: string;
}

export interface KnowledgeDoc {
  id: string;
  code: string;
  title: string;
  summary: string;
  kind: KnowledgeKind;
  audience: KnowledgeAudience;
  purpose: KnowledgePurpose;
  roleCode: string | null;
  version: number;
  status: KnowledgeStatus;
  /** Nội dung theo kind (qa/guide/exercise/...). */
  body: Record<string, unknown>;
  sources: KnowledgeSource[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  archivedAt: string | null;
}

export interface KnowledgeRevisionSnapshot {
  title: string;
  summary: string;
  kind: KnowledgeKind;
  audience: KnowledgeAudience;
  purpose: KnowledgePurpose;
  roleCode: string | null;
  status: KnowledgeStatus;
  body: Record<string, unknown>;
  sources: KnowledgeSource[];
}

export interface KnowledgeRevision {
  id: string;
  docId: string;
  docCode: string;
  version: number;
  snapshot: KnowledgeRevisionSnapshot;
  note: string;
  editedBy: string;
  at: string;
}

/* ============================ Groups / Roles ============================== */

export interface OrgGroup {
  id: string;
  code: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface GroupMember {
  groupId: string;
  userId: string;
  addedAt: string;
}

export interface OrgRole {
  id: string;
  code: string;
  name: string;
  description: string;
}

export interface OrgPermission {
  id: string;
  code: string;
  name: string;
  description: string;
  group: string;
}

export interface CatalogType {
  id: string;
  code: string;
  name: string;
  createdAt: string;
}

export interface CatalogItem {
  id: string;
  typeCode: string;
  name: string;
  code: string;
  value: string;
  isActive: boolean;
  sortOrder: number;
}

/* ======================== Account / sharing / GitHub ====================== */

export interface SessionShareRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  ownerEmail: string;
  ownerName: string;
  reason: string;
  status: "pending" | "approved" | "denied" | "revoked";
  sessionId: string | null;
  sessionName: string | null;
  expiresAt: string | null;
  createdAt: string;
  decidedAt: string | null;
  decidedBy: string | null;
}

export interface GithubRepoState {
  sessionId: string;
  repository: {
    owner: string;
    name: string;
    status: "ready" | "provisioning" | "failed";
    url: string;
    webhookStatus: "healthy" | "pending" | "failed";
  };
  members: {
    userId: string;
    name: string;
    status: "accepted" | "pending" | "expired" | "failed" | "not_connected";
    invitedAt: string;
  }[];
  /** Số lần reconcile đã chạy (mỗi lần: pending → accepted). */
  reconciledCount: number;
}

export interface GithubActivityEntry {
  id: string;
  sessionId: string;
  action: string;
  pr: string | null;
  branch: string | null;
  headSha: string;
  at: string;
  actor: string;
}

export interface PasswordChangeRecord {
  userId: string;
  at: string;
}

export interface OrgStore {
  /** Marker seed — đổi để tự dựng lại store sau khi nâng cấp seed (HMR giữ globalThis). */
  seedVersion: number;
  seededAt: string;
  policies: ParticipationPolicy[];
  incidents: ParticipationIncident[];
  replacements: ReplacementRecord[];
  previewCommands: ReplacementPreviewCommand[];
  repoAccessJobs: RepositoryAccessJob[];
  knowledgeDocs: KnowledgeDoc[];
  knowledgeRevisions: KnowledgeRevision[];
  groups: OrgGroup[];
  groupMembers: GroupMember[];
  groupRoles: { groupId: string; roleCode: string }[];
  roles: OrgRole[];
  permissions: OrgPermission[];
  rolePermissions: { roleCode: string; permissionCode: string }[];
  catalogTypes: CatalogType[];
  catalogItems: CatalogItem[];
  shareRequests: SessionShareRequest[];
  githubSessions: Record<string, GithubRepoState>;
  githubActivity: GithubActivityEntry[];
  passwordChanges: PasswordChangeRecord[];
}

/* ================================ Seeds =================================== */

function seedPolicies(): ParticipationPolicy[] {
  return [
    {
      id: "pol_ses_2025_01",
      sessionId: "ses_2025_01",
      version: 2,
      warningFrom: 24,
      penaltyFrom: 48,
      replacementFrom: 72,
      penaltyPoints: 5,
      penaltyCap: 15,
      activeFrom: "2026-09-15T00:00:00.000Z",
      reason: "Chính sách kỷ luật phiên Xuân 2025: cảnh báo sau 24h, trừ điểm sau 48h, đề xuất thay người sau 72h.",
      updatedBy: "Hồng Lê",
      createdAt: daysAgo(48),
      updatedAt: daysAgo(30),
    },
  ];
}

function seedIncidents(): ParticipationIncident[] {
  return [
    {
      id: "inc_2025_01_01",
      sessionId: "ses_2025_01",
      sessionName: "Thực tập Xuân 2025",
      internId: "usr_an",
      internName: "An Nguyễn",
      taskId: "tsk_12",
      taskCode: "TSK-12",
      taskTitle: "Xây dựng trang giỏ hàng",
      dueAt: daysAgo(3),
      submittedAt: daysAgo(1, 23),
      ordinal: 1,
      points: -2,
      kind: "late",
      status: "active",
      baseScore: 8,
      latePenalty: -2,
      score: 6,
      resolvedAt: null,
      resolvedBy: null,
      resolveReason: null,
      createdAt: daysAgo(1, 20),
    },
    {
      id: "inc_2025_01_02",
      sessionId: "ses_2025_01",
      sessionName: "Thực tập Xuân 2025",
      internId: "usr_khanh",
      internName: "Khánh Đoàn",
      taskId: "tsk_16",
      taskCode: "TSK-16",
      taskTitle: "Kiểm thử tự động luồng thêm vào giỏ",
      dueAt: daysAgo(3, 12),
      submittedAt: null,
      ordinal: 1,
      points: -5,
      kind: "missing",
      status: "active",
      baseScore: 8,
      latePenalty: -5,
      score: 3,
      resolvedAt: null,
      resolvedBy: null,
      resolveReason: null,
      createdAt: daysAgo(2, 12),
    },
    {
      id: "inc_2025_01_03",
      sessionId: "ses_2025_01",
      sessionName: "Thực tập Xuân 2025",
      internId: "usr_minhha",
      internName: "Minh Hà Trần",
      taskId: "tsk_15",
      taskCode: "TSK-15",
      taskTitle: "API thanh toán và xác thực đơn hàng",
      dueAt: daysAgo(5),
      submittedAt: daysAgo(4, 12),
      ordinal: 1,
      points: -2,
      kind: "late",
      status: "excused",
      baseScore: 9,
      latePenalty: -2,
      score: 9,
      resolvedAt: daysAgo(3),
      resolvedBy: "Hồng Lê",
      resolveReason: "Ốm có giấy xác nhận của phòng khám — miễn trừ lần trễ này.",
      createdAt: daysAgo(4, 10),
    },
    {
      id: "inc_2025_01_04",
      sessionId: "ses_2025_01",
      sessionName: "Thực tập Xuân 2025",
      internId: "usr_lam",
      internName: "Lam Phạm",
      taskId: "tsk_17",
      taskCode: "TSK-17",
      taskTitle: "Xây dựng luồng email xác nhận đơn (mock)",
      dueAt: daysAgo(6),
      submittedAt: daysAgo(5, 12),
      ordinal: 1,
      points: -5,
      kind: "missing",
      status: "reversed",
      baseScore: 9,
      latePenalty: -5,
      score: 9,
      resolvedAt: daysAgo(4),
      resolvedBy: "Hồng Lê",
      resolveReason: "Hệ thống ghi nhầm — sinh viên đã nộp đúng hạn (commit trước deadline).",
      createdAt: daysAgo(5, 6),
    },
    {
      id: "inc_2025_01_05",
      sessionId: "ses_2025_01",
      sessionName: "Thực tập Xuân 2025",
      internId: "usr_thao",
      internName: "Thảo Nguyễn",
      taskId: "tsk_24",
      taskCode: "TSK-24",
      taskTitle: "Tổng hợp tài liệu hướng dẫn sử dụng",
      dueAt: daysAgo(2, 12),
      submittedAt: null,
      ordinal: 1,
      points: -5,
      kind: "missing",
      status: "active",
      baseScore: 7,
      latePenalty: -5,
      score: 2,
      resolvedAt: null,
      resolvedBy: null,
      resolveReason: null,
      createdAt: daysAgo(1, 12),
    },
  ];
}

function seedReplacements(): ReplacementRecord[] {
  return [
    {
      id: "rep_2025_01_01",
      sessionId: "ses_2025_01",
      sessionName: "Thực tập Xuân 2025",
      incidentId: null,
      fromUserId: "usr_hung",
      fromName: "Hùng Phạm",
      toUserId: "usr_an",
      toName: "An Nguyễn",
      reason:
        "Hùng Phạm xin thôi thực tập vì lý do cá nhân — bàn giao 3 task frontend cho An Nguyễn (cùng vai trò, còn dư năng lực ở sprint 3).",
      transfers: [
        { taskId: "tsk_18", taskCode: "TSK-18", taskTitle: "Trang lịch sử đơn hàng của người dùng" },
        { taskId: "tsk_19", taskCode: "TSK-19", taskTitle: "Trang đánh giá sản phẩm đã mua" },
        { taskId: "tsk_20", taskCode: "TSK-20", taskTitle: "Chuẩn hóa accessibility cho toàn bộ trang" },
      ],
      preservedTasks: [
        { taskCode: "TSK-25", reason: "Task chưa bắt đầu — để lại kho chung chờ phân công lại" },
        { taskCode: "TSK-24", reason: "Task tài liệu tổng hợp — chuyển cho nhóm backend lo" },
      ],
      handoverHours: 24,
      createdBy: "Hồng Lê",
      at: daysAgo(12),
    },
  ];
}

function seedRepoAccessJobs(): RepositoryAccessJob[] {
  return [
    {
      id: "raj_ses_2025_01_01",
      sessionId: "ses_2025_01",
      userId: "usr_an",
      userName: "An Nguyễn",
      displayStatus: "done",
      revision: 1,
      note: "Đã cấp quyền collaborator trên GitHub.",
      at: daysAgo(40),
    },
    {
      id: "raj_ses_2025_01_02",
      sessionId: "ses_2025_01",
      userId: "usr_khanh",
      userName: "Khánh Đoàn",
      displayStatus: "pending",
      revision: 1,
      note: "Đang chờ GitHub xác nhận lời mời collaborator.",
      at: daysAgo(1),
    },
  ];
}

/* ------------------------------ Knowledge ------------------------------ */

function qaBody(): Record<string, unknown> {
  return {
    intendedKeyPoints: [
      "useState trả về cặp [state, setState]; state là bộ nhớ cục bộ của component",
      "Cập nhật state phải bất biến (immutable) — tạo object/mảng mới, không mutate trực tiếp",
      "setState là bất đồng bộ và được gộp batch — không đọc state ngay sau khi set",
      "Dùng functional update (setItems(prev => [...prev, item])) khi giá trị mới phụ thuộc giá trị cũ",
      "Phân biệt state (nội bộ, có thể đổi) và props (truyền từ cha, chỉ đọc)",
    ],
    correctApproaches: [
      "Định nghĩa state là 'bộ nhớ của component', ví dụ form giỏ hàng với useState",
      "Nhấn mạnh cập nhật bất biến: setItems([...items, item]) thay vì items.push(item)",
      "Giải thích batching và vì sao cần functional update trong các event liên tiếp",
      "Nêu lifting state up khi hai component con cần cùng một dữ liệu",
    ],
    illustration:
      "function Cart() {\n  const [items, setItems] = useState<Item[]>([]);\n  const addItem = (item: Item) =>\n    setItems((prev) => [...prev, item]); // bất biến + functional update\n  return <CartBadge count={items.length} />;\n}",
    commonErrors: [
      "Mutate state trực tiếp: items.push(item) rồi setItems(items) — component không re-render",
      "Đọc state ngay sau setState và kỳ vọng giá trị mới (do batching)",
      "Quên key khi render danh sách sinh từ state",
      "Dùng state cho dữ liệu phái sinh thay vì useMemo",
    ],
    followUpQuestions: [
      "Khi nào nên dùng useReducer thay vì useState?",
      "Làm sao tránh re-render không cần thiết khi state đổi?",
      "State đặt ở đâu khi 3 component cùng cần dữ liệu này?",
    ],
    weakExample:
      "Trả lời chỉ nói 'state là biến của React, dùng useState để tạo' — không nhắc bất biến, batching và không có ví dụ cụ thể.",
    rubric: [
      {
        criterion: "Định nghĩa chính xác",
        excellent: "Nêu đúng bản chất bộ nhớ cục bộ + bất biến + batching",
        passing: "Nêu đúng useState tạo state của component",
      },
      {
        criterion: "Ví dụ thực tế",
        excellent: "Ví dụ giỏ hàng/đếm số với code bất biến đúng",
        passing: "Có ví dụ counter đơn giản",
      },
      {
        criterion: "Độ sâu kỹ thuật",
        excellent: "Nêu functional update, lifting state up và trade-off",
        passing: "Nêu được setState là bất đồng bộ",
      },
    ],
  };
}

function guideBody(): Record<string, unknown> {
  return {
    overview:
      "Quy trình Git chuẩn của V-Intern: tạo nhánh theo task, commit nhỏ có nghĩa, mở pull request đi qua AI code review trước khi mentor chốt merge.",
    sections: [
      {
        title: "1. Tạo nhánh",
        content:
          "Tạo nhánh từ main theo mẫu feature/TSK-xx-slug-ngắn (vd: feature/TSK-12-cart-page). Không làm việc trực tiếp trên main.",
      },
      {
        title: "2. Commit",
        content:
          "Commit nhỏ, mỗi commit làm đúng một việc. Thông điệp theo mẫu: 'TSK-12: thêm skeleton trang giỏ hàng'. Chạy lint + test trước khi commit.",
      },
      {
        title: "3. Pull request & review",
        content:
          "Mở PR về main, mô tả ngắn + ảnh chụp (nếu có UI). AI code review chạy tự động; đạt ≥70 mới chuyển sang trạng thái chờ mentor duyệt.",
      },
      {
        title: "4. Đồng bộ & giải quyết xung đột",
        content:
          "Rebase thường xuyên lên main; xung đột tự giải trên nhánh của mình, không yêu cầu người khác resolve hộ.",
      },
    ],
    checklist: [
      "Nhánh tạo từ main mới nhất",
      "Lint + test pass local",
      "PR có mô tả rõ ràng",
      "Đã qua AI code review",
    ],
  };
}

function rubricBody(): Record<string, unknown> {
  return {
    criteria: [
      {
        code: "FUNCTIONAL",
        label: "Tính năng đúng yêu cầu",
        weight: 0.25,
        levels: {
          excellent: "Đáp ứng toàn bộ spec, xử lý cả case biên",
          good: "Đáp ứng spec chính, thiếu 1-2 case phụ",
          passing: "Luồng chính chạy được",
          failing: "Chức năng chính không chạy",
        },
      },
      {
        code: "QUALITY",
        label: "Chất lượng code",
        weight: 0.2,
        levels: {
          excellent: "Component hóa rõ, đặt tên chuẩn, không code chết",
          good: "Đọc dễ hiểu, còn vài chỗ lặp",
          passing: "Chạy được nhưng cấu trúc lỏng",
          failing: "Copy-paste nặng, khó bảo trì",
        },
      },
      {
        code: "TESTING",
        label: "Kiểm thử",
        weight: 0.15,
        levels: {
          excellent: "Có unit test cho logic chính, coverage ≥70%",
          good: "Có test nhưng còn lỗ hổng",
          passing: "Test thủ công các luồng chính",
          failing: "Không kiểm thử",
        },
      },
      {
        code: "ERRORS",
        label: "Xử lý lỗi",
        weight: 0.15,
        levels: {
          excellent: "Có error boundary + retry + thông báo thân thiện",
          good: "Bắt lỗi chính, thông báo đơn giản",
          passing: "Không crash nhưng lỗi hiển thị thô",
          failing: "Văng exception không xử lý",
        },
      },
      {
        code: "SECURITY",
        label: "Bảo mật",
        weight: 0.1,
        levels: {
          excellent: "Không secret trong code, validate input cả 2 phía",
          good: "Validate input cơ bản",
          passing: "Cảnh báo nhưng chưa validate",
          failing: "Có lỗ hổng rõ ràng",
        },
      },
      {
        code: "DOD",
        label: "Định nghĩa hoàn thành",
        weight: 0.15,
        levels: {
          excellent: "Đủ DoD: test, tài liệu, demo trên mobile + desktop",
          good: "Đủ 2/3 hạng mục DoD",
          passing: "Chỉ hoàn thiện chức năng",
          failing: "Bỏ qua DoD",
        },
      },
    ],
  };
}

function exerciseBody(): Record<string, unknown> {
  return {
    prompt:
      "Viết hàm fetchWithRetry(url, retries = 2) trả về Promise: gọi fetch, nếu lỗi và còn lượt retry thì chờ 500ms rồi thử lại; hết lượt thì reject với lỗi cuối.",
    requirements: [
      "TypeScript, không dùng thư viện ngoài",
      "Giữ type-safe: trả về Promise<Response>",
      "Không retry khi response OK (status 2xx)",
      "Có ít nhất 3 unit test: thành công lần đầu, retry rồi thành công, hết lượt",
    ],
    hints: [
      "Dùng vòng lặp for và await trong try/catch",
      "new Promise(r => setTimeout(r, 500)) để chờ giữa các lần thử",
    ],
    expectedOutcome:
      "Hàm chạy đúng 3 kịch bản test; code sạch, đặt tên rõ; giải thích được vì sao chọn vòng lặp thay vì đệ quy.",
  };
}

function planTemplateBody(): Record<string, unknown> {
  return {
    sections: [
      { key: "goal", title: "Mục tiêu sprint", fields: ["goal", "successCriteria"] },
      { key: "capacity", title: "Năng lực đội", fields: ["memberCount", "storyPointsCapacity"] },
      { key: "tasks", title: "Danh sách task", fields: ["title", "priority", "storyPoints", "suggestedRole", "dependsOn"] },
      { key: "milestones", title: "Cột mốc", fields: ["title", "dueOffsetDays"] },
    ],
    usage:
      "Template dùng cho AI kế hoạch sprint: điền từng section, AI sinh bản nháp kế hoạch rồi mentor xác nhận trước khi publish thành sprint thật.",
  };
}

function communicationBody(): Record<string, unknown> {
  return {
    scenario:
      "Phản hồi cho thực tập sinh nộp bài trễ lần thứ hai trong tuần — cần nghiêm túc nhưng giữ động lực học tập.",
    script: [
      { speaker: "mentor", line: "Mình thấy tuần này bạn có 2 bài nộp trễ hạn. Chuyện gì đang làm bạn kẹt vậy?" },
      { speaker: "intern", line: "Dạ, em bị kẹt phần async nên mất nhiều thời gian hơn dự kiến ạ." },
      { speaker: "mentor", line: "OK — kẹt kỹ thuật thì mình cùng mổ xẻ ngay bây giờ. Nhưng lần sau nếu thấy nguy trễ hạn, báo mình trước ít nhất 24h nhé." },
      { speaker: "intern", line: "Dạ em nhớ ạ." },
    ],
    tips: [
      "Mở đầu bằng câu hỏi, không phải lời trách móc",
      "Tách rõ 'vấn đề kỹ thuật' và 'vấn đề quy trình'",
      "Chốt hành động cụ thể cho lần sau (báo trước 24h)",
    ],
  };
}

function seedKnowledge(): { docs: KnowledgeDoc[]; revisions: KnowledgeRevision[] } {
  const docs: KnowledgeDoc[] = [];
  const revisions: KnowledgeRevision[] = [];

  const mk = (
    id: string,
    code: string,
    title: string,
    summary: string,
    kind: KnowledgeKind,
    audience: KnowledgeAudience,
    purpose: KnowledgePurpose,
    roleCode: string | null,
    version: number,
    status: KnowledgeStatus,
    body: Record<string, unknown>,
    sources: KnowledgeSource[],
    revNotes: string[]
  ): void => {
    docs.push({
      id,
      code,
      title,
      summary,
      kind,
      audience,
      purpose,
      roleCode,
      version,
      status,
      body,
      sources,
      createdAt: daysAgo(60),
      updatedAt: daysAgo(60 - (revNotes.length - 1) * 7),
      publishedAt: status === "published" ? daysAgo(60 - (revNotes.length - 1) * 7) : null,
      archivedAt: status === "archived" ? daysAgo(10) : null,
    });
    revNotes.forEach((note, i) => {
      revisions.push({
        id: `${id}_rev_${i + 1}`,
        docId: id,
        docCode: code,
        version: i + 1,
        snapshot: {
          title,
          summary,
          kind,
          audience,
          purpose,
          roleCode,
          status: i + 1 === version ? status : i + 1 < version && status !== "draft" ? "draft" : "draft",
          body,
          sources,
        },
        note,
        editedBy: i === 0 ? "Quản trị Viên" : "Hồng Lê",
        at: daysAgo(60 - i * 7),
      });
    });
  };

  mk(
    "kdoc_react_state",
    "react-state-interview",
    "React state — bộ câu hỏi phỏng vấn vai trò Frontend",
    "Bộ Q&A chuẩn về useState: bất biến, batching, functional update — dùng cho AI phỏng vấn vai trò frontend.",
    "qa",
    "student_safe",
    "interview_question",
    "frontend",
    3,
    "published",
    qaBody(),
    [
      { name: "React Docs — useState", url: "https://react.dev/reference/react/useState" },
      { name: "React Docs — State: A Component's Memory", url: "https://react.dev/learn/state-a-components-memory" },
      { name: "React Docs — Queueing a Series of State Updates", url: "https://react.dev/learn/queueing-a-series-of-state-updates" },
    ],
    ["Soạn bản đầu từ tài liệu React chính thức", "Bổ sung common errors + rubric chấm điểm", "Xuất bản cho AI phỏng vấn dùng"]
  );

  mk(
    "kdoc_git_workflow",
    "git-workflow",
    "Hướng dẫn quy trình Git cho thực tập sinh mới",
    "Quy trình nhánh - commit - pull request chuẩn V-Intern, kèm checklist trước khi mở PR.",
    "guide",
    "student_safe",
    "onboarding_guide",
    null,
    2,
    "published",
    guideBody(),
    [
      { name: "Pro Git Book", url: "https://git-scm.com/book/en/v2" },
      { name: "GitHub Docs — About pull requests", url: "https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests" },
    ],
    ["Bản đầu cho onboarding kỳ Xuân", "Bổ sung mục đồng bộ & giải quyết xung đột"]
  );

  mk(
    "kdoc_code_review_fe",
    "code-review-frontend",
    "Rubric chấm code review frontend (6 tiêu chí)",
    "Rubric 6 tiêu chí dùng chung cho AI code review và mentor chấm bài nộp frontend.",
    "rubric",
    "grading_only",
    "code_review",
    "frontend",
    2,
    "published",
    rubricBody(),
    [
      { name: "web.dev — Learn Testing", url: "https://web.dev/learn/testing" },
      { name: "React Docs — Thinking in React", url: "https://react.dev/learn/thinking-in-react" },
    ],
    ["Rubric đầu tiên 5 tiêu chí", "Bổ sung tiêu chí SECURITY, chuẩn hóa weight"]
  );

  mk(
    "kdoc_async_exercise",
    "js-async-exercise",
    "Bài tập Promise & retry (JavaScript)",
    "Bài tập tự thực hành fetchWithRetry kèm yêu cầu, gợi ý và kết quả mong đợi.",
    "exercise",
    "student_safe",
    "exercise_grading",
    "frontend",
    2,
    "draft",
    exerciseBody(),
    [
      { name: "MDN — Promise", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise" },
      { name: "MDN — Using the Fetch API", url: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch" },
    ],
    ["Soạn đề bài + yêu cầu", "Bổ sung hints và 3 kịch bản test"]
  );

  mk(
    "kdoc_plan_template",
    "sprint-plan-template",
    "Template kế hoạch sprint cho AI",
    "Cấu trúc dữ liệu chuẩn để AI sinh bản nháp kế hoạch sprint trước khi mentor xác nhận.",
    "plan_template",
    "staff_only",
    "plan_generation",
    null,
    1,
    "draft",
    planTemplateBody(),
    [{ name: "Scrum Guides", url: "https://www.scrumguides.org/scrum-guide.html" }],
    ["Bản đầu theo cấu trúc sprint EduMart"]
  );

  mk(
    "kdoc_mentor_script",
    "mentor-feedback-script",
    "Kịch bản phản hồi khi thực tập sinh nộp trễ",
    "Kịch bản hội thoại mẫu cho mentor khi phản hồi tình huống nộp bài trễ — đã thay bằng phiên bản mới hơn.",
    "communication",
    "staff_only",
    "mentor_chat",
    null,
    2,
    "archived",
    communicationBody(),
    [{ name: "React Docs — Thinking in React", url: "https://react.dev/learn/thinking-in-react" }],
    ["Kịch bản đầu", "Sửa giọng văn mềm hơn — lưu trữ vì có bản mới"]
  );

  return { docs, revisions };
}

/* --------------------------- Groups / Roles --------------------------- */

function seedGroups(): { groups: OrgGroup[]; members: GroupMember[]; groupRoles: { groupId: string; roleCode: string }[] } {
  const groups: OrgGroup[] = [
    {
      id: "grp_frontend",
      code: "nhom-frontend",
      name: "Nhóm Frontend",
      description: "Nhóm thực tập sinh + mentor mảng frontend, phụ trách phỏng vấn đầu vào vai trò frontend.",
      createdAt: daysAgo(90),
    },
    {
      id: "grp_mentors",
      code: "nhom-mentors",
      name: "Nhóm Mentor",
      description: "Các giảng viên hướng dẫn trực tiếp các phiên thực tập.",
      createdAt: daysAgo(200),
    },
    {
      id: "grp_qa",
      code: "nhom-qa",
      name: "Nhóm Kiểm thử",
      description: "Nhóm QA kiểm thử chéo giữa các phiên, phụ trách audit chất lượng.",
      createdAt: daysAgo(75),
    },
  ];
  const members: GroupMember[] = [
    { groupId: "grp_frontend", userId: "usr_an", addedAt: daysAgo(85) },
    { groupId: "grp_frontend", userId: "usr_chi", addedAt: daysAgo(50) },
    { groupId: "grp_frontend", userId: "usr_lam", addedAt: daysAgo(80) },
    { groupId: "grp_frontend", userId: "usr_hong", addedAt: daysAgo(90) },
    { groupId: "grp_mentors", userId: "usr_hong", addedAt: daysAgo(200) },
    { groupId: "grp_mentors", userId: "usr_ngoc", addedAt: daysAgo(190) },
    { groupId: "grp_qa", userId: "usr_khanh", addedAt: daysAgo(70) },
    { groupId: "grp_qa", userId: "usr_trang", addedAt: daysAgo(60) },
  ];
  const groupRoles: { groupId: string; roleCode: string }[] = [
    { groupId: "grp_frontend", roleCode: "interviewer" },
    { groupId: "grp_mentors", roleCode: "instructor" },
    { groupId: "grp_qa", roleCode: "auditor" },
  ];
  return { groups, members, groupRoles };
}

function seedRoles(): {
  roles: OrgRole[];
  permissions: OrgPermission[];
  rolePermissions: { roleCode: string; permissionCode: string }[];
} {
  const mkPerm = (id: string, code: string, name: string, description: string, group: string): OrgPermission => ({
    id,
    code,
    name,
    description,
    group,
  });

  const permissions: OrgPermission[] = [
    mkPerm("prm_01", "users.manage", "Quản lý người dùng", "Tạo / khóa / phân vai trò tài khoản", "Quản trị hệ thống"),
    mkPerm("prm_02", "roles.manage", "Quản lý vai trò & nhóm", "Sửa vai trò, nhóm và gán quyền", "Quản trị hệ thống"),
    mkPerm("prm_03", "settings.manage", "Quản lý cấu hình hệ thống", "Sửa cài đặt và cấu hình AI", "Quản trị hệ thống"),
    mkPerm("prm_04", "audit.view", "Xem nhật ký hệ thống", "Xem audit log và sự kiện hệ thống", "Quản trị hệ thống"),
    mkPerm("prm_05", "sessions.manage", "Quản lý phiên thực tập", "Tạo / cập nhật phiên và thành viên", "Đào tạo"),
    mkPerm("prm_06", "assignments.manage", "Quản lý phân công", "Gán / hủy phân công thực tập sinh", "Đào tạo"),
    mkPerm("prm_07", "participation.manage", "Quản lý kỷ luật & thay người", "Cấu hình policy, xử lý incident, duyệt thay người", "Đào tạo"),
    mkPerm("prm_08", "evaluations.manage", "Quản lý đánh giá", "Tạo cycle, tiêu chí và chốt đánh giá", "Đào tạo"),
    mkPerm("prm_09", "knowledge.manage", "Quản lý kho tri thức", "Soạn / xuất bản tài liệu Agent", "Nội dung"),
    mkPerm("prm_10", "question_bank.manage", "Quản lý ngân hàng câu hỏi", "Thêm / sửa câu hỏi phỏng vấn", "Nội dung"),
    mkPerm("prm_11", "templates.manage", "Quản lý mẫu dự án", "Sửa template blueprint dự án", "Nội dung"),
    mkPerm("prm_12", "catalogs.manage", "Quản lý danh mục", "Sửa catalog loại / mục cấu hình", "Nội dung"),
    mkPerm("prm_13", "reports.view", "Xem báo cáo", "Xem và xuất báo cáo các phiên", "Báo cáo"),
    mkPerm("prm_14", "performance.view", "Xem hiệu suất", "Xem bảng hiệu suất thực tập sinh", "Báo cáo"),
    mkPerm("prm_15", "kpi.view", "Xem KPI", "Xem điểm KPI và lương ảo", "Báo cáo"),
    mkPerm("prm_16", "recruitment.view", "Xem tuyển sinh", "Xem hồ sơ ứng viên", "Tuyển sinh"),
    mkPerm("prm_17", "candidates.view", "Xem ứng viên", "Xem danh sách ứng viên qua phỏng vấn", "Tuyển sinh"),
    mkPerm("prm_18", "interviews.conduct", "Phỏng vấn", "Tham gia phỏng vấn đầu vào", "Tuyển sinh"),
    mkPerm("prm_19", "reviews.conduct", "Review code", "Tham gia review bài nộp", "Đánh giá"),
    mkPerm("prm_20", "grading.manage", "Chấm điểm", "Chấm bài tập và bài nộp", "Đánh giá"),
    mkPerm("prm_21", "workspace.view", "Xem không gian làm việc", "Truy cập workspace thực tập", "Thực tập"),
    mkPerm("prm_22", "tasks.work", "Làm task", "Nhận và cập nhật tiến độ task", "Thực tập"),
    mkPerm("prm_23", "submissions.create", "Nộp bài", "Tạo bài nộp cho task", "Thực tập"),
    mkPerm("prm_24", "mentor.chat", "Chat mentor AI", "Trò chuyện với AI mentor", "Thực tập"),
    mkPerm("prm_25", "certificates.view", "Xem chứng chỉ", "Xem và xác minh chứng chỉ", "Thực tập"),
    mkPerm("prm_26", "knowledge.view", "Xem kho tri thức", "Đọc tài liệu được xuất bản", "Nội dung"),
  ];

  const roles: OrgRole[] = [
    { id: "role_admin", code: "admin", name: "Quản trị viên", description: "Toàn quyền hệ thống: người dùng, cấu hình, nội dung." },
    { id: "role_instructor", code: "instructor", name: "Giảng viên hướng dẫn", description: "Quản lý phiên thực tập, phân công, đánh giá và kỷ luật." },
    { id: "role_intern", code: "intern", name: "Thực tập sinh", description: "Làm task, nộp bài, chat mentor và xem kết quả của mình." },
    { id: "role_interviewer", code: "interviewer", name: "Phỏng vấn viên", description: "Tham gia phỏng vấn đầu vào và đóng góp câu hỏi." },
    { id: "role_auditor", code: "auditor", name: "Kiểm toán viên", description: "Chỉ đọc: báo cáo, KPI, nhật ký và chất lượng phiên." },
  ];

  const map: Record<string, string[]> = {
    admin: ["users.manage", "roles.manage", "settings.manage", "audit.view", "sessions.manage", "knowledge.manage", "question_bank.manage", "catalogs.manage", "reports.view", "templates.manage"],
    instructor: ["sessions.manage", "assignments.manage", "participation.manage", "evaluations.manage", "reviews.conduct", "reports.view", "performance.view", "candidates.view", "interviews.conduct"],
    intern: ["workspace.view", "tasks.work", "submissions.create", "mentor.chat", "certificates.view", "knowledge.view"],
    interviewer: ["interviews.conduct", "question_bank.manage", "knowledge.view", "candidates.view", "reports.view", "grading.manage"],
    auditor: ["audit.view", "reports.view", "performance.view", "kpi.view", "knowledge.view", "recruitment.view"],
  };
  const rolePermissions: { roleCode: string; permissionCode: string }[] = [];
  for (const [roleCode, codes] of Object.entries(map)) {
    for (const permissionCode of codes) rolePermissions.push({ roleCode, permissionCode });
  }
  return { roles, permissions, rolePermissions };
}

function seedCatalogs(): { types: CatalogType[]; items: CatalogItem[] } {
  const types: CatalogType[] = [
    { id: "cat_campus", code: "campus", name: "Cơ sở đào tạo", createdAt: daysAgo(300) },
    { id: "cat_semester", code: "semester", name: "Kỳ học", createdAt: daysAgo(300) },
  ];
  const items: CatalogItem[] = [
    { id: "itm_cs_hn", typeCode: "campus", name: "Cơ sở Hà Nội", code: "cs-hn", value: "HN", isActive: true, sortOrder: 1 },
    { id: "itm_cs_hcm", typeCode: "campus", name: "Cơ sở TP.HCM", code: "cs-hcm", value: "HCM", isActive: true, sortOrder: 2 },
    { id: "itm_cs_dn", typeCode: "campus", name: "Cơ sở Đà Nẵng", code: "cs-dn", value: "DN", isActive: false, sortOrder: 3 },
    { id: "itm_k25s", typeCode: "semester", name: "Xuân 2025", code: "k25s", value: "2025S", isActive: true, sortOrder: 1 },
    { id: "itm_k25h", typeCode: "semester", name: "Hè 2025", code: "k25h", value: "2025U", isActive: true, sortOrder: 2 },
    { id: "itm_k25t", typeCode: "semester", name: "Thu 2025", code: "k25t", value: "2025F", isActive: true, sortOrder: 3 },
    { id: "itm_k26s", typeCode: "semester", name: "Xuân 2026", code: "k26s", value: "2026S", isActive: false, sortOrder: 4 },
  ];
  return { types, items };
}

/* ---------------------- Sharing / GitHub / mật khẩu ---------------------- */

function seedShareRequests(): SessionShareRequest[] {
  return [
    {
      id: "shr_01",
      requesterId: "usr_ngoc",
      requesterName: "Ngọc Trần",
      ownerEmail: "hong.le@gv.edu.vn",
      ownerName: "Hồng Lê",
      reason: "Đang đồng hướng dẫn nhóm frontend, cần xem dữ liệu phiên Thực tập Xuân 2025 để đối chiếu tiến độ chung.",
      status: "pending",
      sessionId: null,
      sessionName: null,
      expiresAt: null,
      createdAt: daysAgo(2),
      decidedAt: null,
      decidedBy: null,
    },
    {
      id: "shr_02",
      requesterId: "usr_hong",
      requesterName: "Hồng Lê",
      ownerEmail: "admin@vintern.edu.vn",
      ownerName: "Quản trị Viên",
      reason: "Chuẩn bị báo cáo tổng kết giữa kỳ cho ban giám hiệu, cần toàn bộ dữ liệu phiên SES-2025-01.",
      status: "approved",
      sessionId: "ses_2025_01",
      sessionName: "Thực tập Xuân 2025",
      expiresAt: daysFromNow(24),
      createdAt: daysAgo(7),
      decidedAt: daysAgo(6),
      decidedBy: "Quản trị Viên",
    },
    {
      id: "shr_03",
      requesterId: "usr_ngoc",
      requesterName: "Ngọc Trần",
      ownerEmail: "hong.le@gv.edu.vn",
      ownerName: "Hồng Lê",
      reason: "Xin phép xem trước dữ liệu phiên Thực tập Hè 2025 để tham khảo cách tổ chức kế hoạch.",
      status: "denied",
      sessionId: null,
      sessionName: null,
      expiresAt: null,
      createdAt: daysAgo(4),
      decidedAt: daysAgo(3),
      decidedBy: "Hồng Lê",
    },
  ];
}

function seedGithub(): { sessions: Record<string, GithubRepoState>; activity: GithubActivityEntry[] } {
  const sessions: Record<string, GithubRepoState> = {
    ses_2025_01: {
      sessionId: "ses_2025_01",
      repository: {
        owner: "vintern-labs",
        name: "edumart-spring2025",
        status: "ready",
        url: "https://github.com/vintern-labs/edumart-spring2025",
        webhookStatus: "healthy",
      },
      members: [
        { userId: "usr_an", name: "An Nguyễn", status: "accepted", invitedAt: daysAgo(40) },
        { userId: "usr_minhha", name: "Minh Hà Trần", status: "accepted", invitedAt: daysAgo(40) },
        { userId: "usr_lam", name: "Lam Phạm", status: "pending", invitedAt: daysAgo(2) },
        { userId: "usr_khanh", name: "Khánh Đoàn", status: "pending", invitedAt: daysAgo(1) },
        { userId: "usr_thao", name: "Thảo Nguyễn", status: "not_connected", invitedAt: daysAgo(1) },
      ],
      reconciledCount: 0,
    },
  };
  const activity: GithubActivityEntry[] = [
    { id: "gha_01", sessionId: "ses_2025_01", action: "Mở pull request", pr: "#48 Thêm trang giỏ hàng", branch: "feature/cart-page", headSha: "e3a1b7c2", at: daysAgo(0, 5), actor: "An Nguyễn" },
    { id: "gha_02", sessionId: "ses_2025_01", action: "Push commit", pr: null, branch: "feature/cart-page", headSha: "9f02d1ab", at: daysAgo(0, 8), actor: "An Nguyễn" },
    { id: "gha_03", sessionId: "ses_2025_01", action: "Góp ý pull request", pr: "#47 Kiểm thử luồng thêm giỏ", branch: "test/add-to-cart", headSha: "b77cc10e", at: daysAgo(1), actor: "Khánh Đoàn" },
    { id: "gha_04", sessionId: "ses_2025_01", action: "Merge pull request", pr: "#45 Widget khuyến mãi", branch: "main", headSha: "3c9de4f0", at: daysAgo(2), actor: "Hồng Lê" },
    { id: "gha_05", sessionId: "ses_2025_01", action: "Mở pull request", pr: "#44 API thanh toán", branch: "feature/payment-api", headSha: "aa41f8c3", at: daysAgo(3), actor: "Minh Hà Trần" },
    { id: "gha_06", sessionId: "ses_2025_01", action: "Đóng pull request", pr: "#41 Trang chi tiết sản phẩm (làm lại)", branch: "feature/pdp", headSha: "5d0e7712", at: daysAgo(5), actor: "Hồng Lê" },
  ];
  return { sessions, activity };
}

/* ============================== Store root ============================== */

/** Tăng lên khi thay đổi seed để store cũ tự dựng lại (globalThis sống qua HMR). */
const SEED_VERSION = 3;

function buildOrgStore(): OrgStore {
  const knowledge = seedKnowledge();
  const groups = seedGroups();
  const roles = seedRoles();
  const catalogs = seedCatalogs();
  const github = seedGithub();
  return {
    seedVersion: SEED_VERSION,
    seededAt: new Date().toISOString(),
    policies: seedPolicies(),
    incidents: seedIncidents(),
    replacements: seedReplacements(),
    previewCommands: [],
    repoAccessJobs: seedRepoAccessJobs(),
    knowledgeDocs: knowledge.docs,
    knowledgeRevisions: knowledge.revisions,
    groups: groups.groups,
    groupMembers: groups.members,
    groupRoles: groups.groupRoles,
    roles: roles.roles,
    permissions: roles.permissions,
    rolePermissions: roles.rolePermissions,
    catalogTypes: catalogs.types,
    catalogItems: catalogs.items,
    shareRequests: seedShareRequests(),
    githubSessions: github.sessions,
    githubActivity: github.activity,
    passwordChanges: [],
  };
}

const GLOBAL_KEY = "__vintern_org_store__";

const globalRef = globalThis as unknown as { [GLOBAL_KEY]?: OrgStore };
let orgStore: OrgStore;

export function getOrgStore(): OrgStore {
  const stale =
    !globalRef[GLOBAL_KEY] ||
    globalRef[GLOBAL_KEY]!.seedVersion !== SEED_VERSION ||
    !Array.isArray(globalRef[GLOBAL_KEY]!.previewCommands);
  if (stale) {
    globalRef[GLOBAL_KEY] = buildOrgStore();
    orgStore = globalRef[GLOBAL_KEY]!;
  }
  orgStore = globalRef[GLOBAL_KEY]!;
  // Tự phục hồi khi store cũ thiếu trường mới (HMR / nâng cấp seed).
  if (!Array.isArray(orgStore.previewCommands)) orgStore.previewCommands = [];
  if (!Array.isArray(orgStore.passwordChanges)) orgStore.passwordChanges = [];
  if (!orgStore.githubSessions) orgStore.githubSessions = {};
  if (!Array.isArray(orgStore.githubActivity)) orgStore.githubActivity = [];
  return orgStore;
}

/* ========================= Truy vấn tiện ích ========================= */

export function findPolicy(sessionId: string): ParticipationPolicy | undefined {
  return getOrgStore().policies.find((p) => p.sessionId === sessionId);
}

export function incidentsOf(sessionId: string): ParticipationIncident[] {
  return getOrgStore()
    .incidents.filter((i) => i.sessionId === sessionId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function findIncident(id: string): ParticipationIncident | undefined {
  return getOrgStore().incidents.find((i) => i.id === id);
}

/** Policy đang có hiệu lực (đã đến ngày activeFrom). */
export function policyActiveFor(sessionId: string): ParticipationPolicy | null {
  const p = findPolicy(sessionId);
  if (!p) return null;
  return new Date(p.activeFrom).getTime() <= Date.now() ? p : null;
}

/** Tổng báo cáo kỷ luật của phiên. */
export function participationReport(sessionId: string) {
  const items = incidentsOf(sessionId);
  const active = items.filter((i) => i.status === "active");
  return {
    totalIncidents: items.length,
    active: active.length,
    excused: items.filter((i) => i.status === "excused").length,
    reversed: items.filter((i) => i.status === "reversed").length,
    penaltyPointsTotal: active.reduce((acc, i) => acc + Math.abs(i.points), 0),
    affectedInterns: new Set(active.map((i) => i.internId)).size,
  };
}
