import type {
  CodeReview,
  Milestone,
  Plan,
  Project,
  SessionRecord,
  SessionTimelineEvent,
  Sprint,
  Submission,
  Task,
  TaskComment,
  TaskHistoryEntry,
  TaskSpec,
} from "../types";
import { buildPlanDraft } from "../plan";
import { daysAgo, daysFromNow } from "../util";

export function seedProjects(): Project[] {
  return [
    {
      id: "prj_edu",
      code: "PRJ-EDU",
      name: "Sàn TMĐT EduMart",
      description:
        "Sàn thương mại điện tử học liệu: danh mục sản phẩm, giỏ hàng, checkout, thanh toán sandbox, quản lý đơn và báo cáo doanh thu.",
      status: "active",
      techStack: ["Next.js", "Node.js", "PostgreSQL", "Redis"],
      templateId: "tpl_ecom",
      templateName: "Sàn TMĐT EduMart",
    },
    {
      id: "prj_task",
      code: "PRJ-TASK",
      name: "Quản lý công việc SaaS",
      description: "Ứng dụng quản lý công việc mini: bảng kanban kéo-thả, gán việc, nhắc hạn và thống kê cá nhân.",
      status: "planning",
      techStack: ["React", "Node.js", "SQLite"],
      templateId: "tpl_task",
      templateName: "Quản lý công việc SaaS",
    },
  ];
}

export function seedSessions(): SessionRecord[] {
  return [
    {
      id: "ses_2025_01",
      code: "SES-2025-01",
      name: "Thực tập Xuân 2025",
      status: "active",
      startDate: daysAgo(42),
      endDate: daysFromNow(42),
      projectId: "prj_edu",
      description: "Kỳ thực tập 12 tuần cho nhóm 5 thực tập sinh làm sản phẩm EduMart theo quy trình Scrum, mentor: Hồng Lê.",
      instructorIds: ["usr_hong"],
      createdAt: daysAgo(49),
      planPublishedAt: daysAgo(42),
    },
    {
      id: "ses_2025_02",
      code: "SES-2025-02",
      name: "Thực tập Hè 2025",
      status: "planning",
      startDate: daysFromNow(14),
      endDate: daysFromNow(98),
      projectId: "prj_task",
      description: "Kỳ thực tập hè với dự án SaaS quản lý công việc — đang chuẩn bị kế hoạch và tuyển thành viên.",
      instructorIds: ["usr_hong"],
      createdAt: daysAgo(7),
      planPublishedAt: null,
    },
  ];
}

export function seedSprints(): Sprint[] {
  return [
    { id: "spr_01", code: "SPR-01", name: "Sprint 1 — Nền tảng & Danh mục sản phẩm", goal: "Dựng nền dự án chuẩn và chạy được luồng duyệt danh mục end-to-end.", status: "done", startDate: daysAgo(42), endDate: daysAgo(28), sessionId: "ses_2025_01", projectId: "prj_edu" },
    { id: "spr_02", code: "SPR-02", name: "Sprint 2 — Giỏ hàng & Thanh toán", goal: "Người dùng thêm vào giỏ, đi qua checkout và thanh toán sandbox thành công.", status: "active", startDate: daysAgo(28), endDate: daysFromNow(14), sessionId: "ses_2025_01", projectId: "prj_edu" },
    { id: "spr_03", code: "SPR-03", name: "Sprint 3 — Đơn hàng & Vận hành", goal: "Người dùng theo dõi được đơn hàng, vận hành xử lý đơn qua trang quản trị.", status: "todo", startDate: daysFromNow(14), endDate: daysFromNow(28), sessionId: "ses_2025_01", projectId: "prj_edu" },
  ];
}

/* ------------------------------- TASKS ------------------------------- */

interface TaskSeed {
  id: string;
  code: string;
  title: string;
  description: string;
  status: Task["status"];
  priority: Task["priority"];
  progress: number;
  storyPoints: number;
  dueInDays: number; // âm = quá khứ
  assigneeId: string | null;
  sprintId: string;
  role: string;
  estimatedHours: number;
  deps?: string[];
  doneInDays?: number; // khi task done
  version?: number;
}

const TASK_SEEDS: TaskSeed[] = [
  // ==== Sprint 1 (done) ====
  { id: "tsk_01", code: "TSK-01", title: "Khởi tạo dự án Next.js và cấu hình chuẩn code", description: "Tạo repo, cấu hình TypeScript, ESLint, Prettier, jest và pipeline CI chạy lint + test cho mỗi PR.", status: "done", priority: "high", progress: 100, storyPoints: 2, dueInDays: -30, assigneeId: "usr_an", sprintId: "spr_01", role: "frontend", estimatedHours: 6, doneInDays: -41 },
  { id: "tsk_02", code: "TSK-02", title: "Thiết kế schema CSDL PostgreSQL cho sản phẩm và đơn hàng", description: "Thiết kế bảng products, categories, orders, order_items kèm quan hệ, ràng buộc và migration ban đầu.", status: "done", priority: "high", progress: 100, storyPoints: 5, dueInDays: -30, assigneeId: "usr_minhha", sprintId: "spr_01", role: "backend", estimatedHours: 12, doneInDays: -40 },
  { id: "tsk_03", code: "TSK-03", title: "Xây dựng layout chung và điều hướng cửa hàng", description: "Header, footer, navigation responsive, dark mode, drawer cho mobile theo design system.", status: "done", priority: "high", progress: 100, storyPoints: 3, dueInDays: -29, assigneeId: "usr_an", sprintId: "spr_01", role: "frontend", estimatedHours: 10, doneInDays: -38 },
  { id: "tsk_04", code: "TSK-04", title: "Xây dựng trang danh mục sản phẩm kèm bộ lọc", description: "Trang /san-pham với lọc theo danh mục, khoảng giá, sắp xếp; debounce khi gõ tìm kiếm; skeleton khi tải.", status: "done", priority: "high", progress: 100, storyPoints: 3, dueInDays: -28, assigneeId: "usr_an", sprintId: "spr_01", role: "frontend", estimatedHours: 12, doneInDays: -26 },
  { id: "tsk_05", code: "TSK-05", title: "Component ProductCard và lưới hiển thị đáp ứng", description: "ProductCard hiển thị ảnh, tên, giá, badge giảm giá; lưới 1→4 cột theo breakpoint; memo hóa.", status: "done", priority: "medium", progress: 100, storyPoints: 2, dueInDays: -30, assigneeId: "usr_an", sprintId: "spr_01", role: "frontend", estimatedHours: 6, doneInDays: -34 },
  { id: "tsk_06", code: "TSK-06", title: "Xây dựng trang chi tiết sản phẩm", description: "Trang /san-pham/[slug]: gallery ảnh, thông số, nút thêm vào giỏ, sản phẩm liên quan, SSR + ISR.", status: "done", priority: "high", progress: 100, storyPoints: 3, dueInDays: -31, assigneeId: "usr_an", sprintId: "spr_01", role: "frontend", estimatedHours: 10, doneInDays: -32 },
  { id: "tsk_07", code: "TSK-07", title: "Viết unit test cho tiện ích định dạng giá và ngày", description: "Test formatPrice (VND), formatPercent, formatDate với các case biên (0, âm, số lớn).", status: "done", priority: "medium", progress: 100, storyPoints: 2, dueInDays: -30, assigneeId: "usr_an", sprintId: "spr_01", role: "frontend", estimatedHours: 4, doneInDays: -30 },
  { id: "tsk_08", code: "TSK-08", title: "Viết kịch bản test smoke luồng duyệt sản phẩm", description: "Kịch bản smoke: vào trang chủ → danh mục → chi tiết sản phẩm; ghi lại các bước và kết quả mong đợi.", status: "done", priority: "medium", progress: 100, storyPoints: 3, dueInDays: -29, assigneeId: "usr_lam", sprintId: "spr_01", role: "fullstack", estimatedHours: 6, doneInDays: -30 },
  { id: "tsk_09", code: "TSK-09", title: "Cấu hình pipeline CI kiểm tra lint và test", description: "GitHub Actions: install, lint, test, build trên PR; badge hiển thị trạng thái trên README.", status: "done", priority: "medium", progress: 100, storyPoints: 2, dueInDays: -29, assigneeId: "usr_lam", sprintId: "spr_01", role: "fullstack", estimatedHours: 5, doneInDays: -29 },
  // ==== Sprint 2 (active) ====
  { id: "tsk_10", code: "TSK-10", title: "Tích hợp API giỏ hàng và trạng thái client (Zustand)", description: "Tạo cart store với Zustand: thêm/xóa/sửa số lượng, optimistic update, đồng bộ với API và xử lý lỗi race condition.", status: "doing", priority: "medium", progress: 45, storyPoints: 3, dueInDays: -3, assigneeId: "usr_an", sprintId: "spr_02", role: "frontend", estimatedHours: 10, version: 3 },
  { id: "tsk_11", code: "TSK-11", title: "Trang checkout bước 1 — thông tin giao hàng", description: "Form thông tin giao hàng nhiều trường với validation từng bước, lưu bản nháp, điều hướng sang bước thanh toán.", status: "review", priority: "high", progress: 75, storyPoints: 2, dueInDays: 3, assigneeId: "usr_an", sprintId: "spr_02", role: "frontend", estimatedHours: 8, version: 2 },
  { id: "tsk_12", code: "TSK-12", title: "Xây dựng trang giỏ hàng", description: "Trang /gio-hang: danh sách sản phẩm, sửa số lượng, tạm tính, khuyến mãi, empty state và skeleton loading.", status: "doing", priority: "high", progress: 45, storyPoints: 2, dueInDays: 7, assigneeId: "usr_an", sprintId: "spr_02", role: "frontend", estimatedHours: 12, deps: ["tsk_04"], version: 2 },
  { id: "tsk_13", code: "TSK-13", title: "Xử lý trạng thái trống và lỗi tải giỏ hàng", description: "Empty state có CTA về danh mục; lỗi tải có nút thử lại; toast khi xóa sản phẩm với undo.", status: "done", priority: "medium", progress: 100, storyPoints: 3, dueInDays: -7, assigneeId: "usr_an", sprintId: "spr_02", role: "frontend", estimatedHours: 5, doneInDays: -8, version: 3 },
  { id: "tsk_14", code: "TSK-14", title: "Widget khuyến mãi áp dụng tại giỏ hàng", description: "Hiển thị mã giảm giá khả dụng, nhập mã, kiểm tra điều kiện và cập nhật tạm tính.", status: "done", priority: "medium", progress: 100, storyPoints: 3, dueInDays: -7, assigneeId: "usr_an", sprintId: "spr_02", role: "frontend", estimatedHours: 8, doneInDays: -9, version: 3 },
  { id: "tsk_15", code: "TSK-15", title: "API thanh toán và xác thực đơn hàng", description: "POST /api/orders: validate giỏ, tính lại giá phía server, gọi cổng thanh toán sandbox, idempotency key.", status: "doing", priority: "critical", progress: 10, storyPoints: 5, dueInDays: 2, assigneeId: "usr_minhha", sprintId: "spr_02", role: "backend", estimatedHours: 14, version: 2 },
  { id: "tsk_16", code: "TSK-16", title: "Kiểm thử tự động luồng thêm vào giỏ", description: "Playwright: thêm 2 sản phẩm, đổi số lượng, xóa 1 sản phẩm, kiểm tra tạm tính đúng.", status: "review", priority: "high", progress: 55, storyPoints: 3, dueInDays: 4, assigneeId: "usr_khanh", sprintId: "spr_02", role: "qa", estimatedHours: 8, version: 2 },
  { id: "tsk_17", code: "TSK-17", title: "Xây dựng luồng email xác nhận đơn (mock)", description: "Mock mailer: render template HTML đơn hàng, ghi log ra file để kiểm tra nội dung.", status: "done", priority: "medium", progress: 100, storyPoints: 3, dueInDays: -4, assigneeId: "usr_lam", sprintId: "spr_02", role: "fullstack", estimatedHours: 6, doneInDays: -5, version: 3 },
  // ==== Sprint 3 (todo) ====
  { id: "tsk_18", code: "TSK-18", title: "Trang lịch sử đơn hàng của người dùng", description: "Trang /don-hang: danh sách đơn theo trạng thái, chi tiết từng đơn, tìm kiếm theo mã đơn.", status: "todo", priority: "medium", progress: 0, storyPoints: 2, dueInDays: 21, assigneeId: "usr_an", sprintId: "spr_03", role: "frontend", estimatedHours: 10, deps: ["tsk_15"] },
  { id: "tsk_19", code: "TSK-19", title: "Trang đánh giá sản phẩm đã mua", description: "Form đánh giá sao + nhận xét cho sản phẩm trong đơn đã giao, kèm xác nhận cảm ơn.", status: "todo", priority: "low", progress: 0, storyPoints: 2, dueInDays: 24, assigneeId: "usr_an", sprintId: "spr_03", role: "frontend", estimatedHours: 8 },
  { id: "tsk_20", code: "TSK-20", title: "Chuẩn hóa accessibility cho toàn bộ trang", description: "Kiểm tra contrast, aria-label, focus order, điều hướng bằng bàn phím trên 6 trang chính.", status: "todo", priority: "medium", progress: 0, storyPoints: 2, dueInDays: 27, assigneeId: "usr_an", sprintId: "spr_03", role: "frontend", estimatedHours: 8 },
  { id: "tsk_21", code: "TSK-21", title: "API thống kê doanh thu theo danh mục", description: "Endpoint báo cáo: tổng doanh thu, số đơn, sản phẩm bán chạy theo khoảng thời gian.", status: "todo", priority: "high", progress: 0, storyPoints: 5, dueInDays: 22, assigneeId: "usr_minhha", sprintId: "spr_03", role: "backend", estimatedHours: 12, deps: ["tsk_02"] },
  { id: "tsk_22", code: "TSK-22", title: "Tối ưu truy vấn báo cáo bằng indexing", description: "Phân tích EXPLAIN các truy vấn báo cáo, thêm index cần dụng và đo lại before/after.", status: "todo", priority: "medium", progress: 0, storyPoints: 3, dueInDays: 25, assigneeId: "usr_minhha", sprintId: "spr_03", role: "backend", estimatedHours: 8, deps: ["tsk_21"] },
  { id: "tsk_23", code: "TSK-23", title: "Bộ kiểm thử hồi quy E2E luồng mua hàng", description: "Playwright regression: duyệt → thêm giỏ → checkout → thanh toán sandbox → xem đơn.", status: "todo", priority: "high", progress: 0, storyPoints: 5, dueInDays: 26, assigneeId: "usr_khanh", sprintId: "spr_03", role: "qa", estimatedHours: 12, deps: ["tsk_15"] },
  { id: "tsk_24", code: "TSK-24", title: "Tổng hợp tài liệu hướng dẫn sử dụng", description: "Cẩm nang sử dụng EduMart cho người dùng mới và tài liệu demo cuối kỳ cho mentor.", status: "todo", priority: "medium", progress: 0, storyPoints: 3, dueInDays: 27, assigneeId: "usr_thao", sprintId: "spr_03", role: "backend", estimatedHours: 6 },
  { id: "tsk_25", code: "TSK-25", title: "Trang quản trị nội bộ cho vận hành", description: "Dashboard vận hành: duyệt/hủy đơn, tìm đơn theo mã/SĐT khách, xuất CSV — chưa phân công người làm.", status: "todo", priority: "high", progress: 0, storyPoints: 5, dueInDays: 28, assigneeId: null, sprintId: "spr_03", role: "frontend", estimatedHours: 14, deps: ["tsk_18"] },
];

const ASSIGNEE_NAMES: Record<string, string> = {
  usr_an: "An Nguyễn",
  usr_minhha: "Minh Hà Trần",
  usr_lam: "Lam Phạm",
  usr_khanh: "Khánh Đoàn",
  usr_thao: "Thảo Nguyễn",
};

const SPRINT_CODES: Record<string, string> = { spr_01: "SPR-01", spr_02: "SPR-02", spr_03: "SPR-03" };

const SPRINT_CREATED_DAYS: Record<string, number> = { spr_01: 43, spr_02: 29, spr_03: 16 };

export function seedTasks(): Task[] {
  return TASK_SEEDS.map((t) => ({
    id: t.id,
    code: t.code,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    progress: t.progress,
    storyPoints: t.storyPoints,
    dueDate: t.dueInDays < 0 ? daysAgo(-t.dueInDays) : daysFromNow(t.dueInDays),
    assigneeId: t.assigneeId,
    assigneeName: t.assigneeId ? ASSIGNEE_NAMES[t.assigneeId] ?? null : null,
    projectId: "prj_edu",
    sprintId: t.sprintId,
    sprintCode: SPRINT_CODES[t.sprintId],
    version: t.version ?? (t.status === "todo" ? 1 : 2),
    role: t.role,
    estimatedHours: t.estimatedHours,
    dependencies: t.deps ?? [],
    createdAt: daysAgo(SPRINT_CREATED_DAYS[t.sprintId] ?? 42),
    updatedAt: t.doneInDays != null ? daysAgo(-t.doneInDays) : daysAgo(2),
    doneAt: t.doneInDays != null ? daysAgo(-t.doneInDays) : null,
  }));
}

export function seedTaskHistory(users: { hong: string }): Record<string, TaskHistoryEntry[]> {
  const H = users.hong;
  const hist: Record<string, TaskHistoryEntry[]> = {};
  const mk = (id: string, entries: [TaskHistoryEntry["fromStatus"], TaskHistoryEntry["toStatus"], string, number, string?][]): void => {
    hist[id] = entries.map(([from, to, changedBy, d, reason]) => ({ fromStatus: from, toStatus: to, changedBy, at: daysAgo(d), reason: reason ?? null }));
  };
  const AN = "An Nguyễn";
  const MH = "Minh Hà Trần";
  const LA = "Lam Phạm";
  const KH = "Khánh Đoàn";
  // Sprint 1 — tất cả done
  mk("tsk_01", [[null, "todo", H, 42], ["todo", "doing", AN, 42], ["doing", "done", H, 41, "Nghiệm đạt sau review CI xanh"]]);
  mk("tsk_02", [[null, "todo", H, 42], ["todo", "doing", MH, 41], ["doing", "done", H, 40, "Schema chuẩn, có migration"]]);
  mk("tsk_03", [[null, "todo", H, 42], ["todo", "doing", AN, 40], ["doing", "done", H, 38, "Duyệt 85/100"]]);
  mk("tsk_04", [[null, "todo", H, 42], ["todo", "doing", AN, 38], ["doing", "done", H, 26, "Duyệt 78/100 — nộp trễ 2 ngày"]]);
  mk("tsk_05", [[null, "todo", H, 42], ["todo", "doing", AN, 36], ["doing", "done", H, 34]]);
  mk("tsk_06", [[null, "todo", H, 42], ["todo", "doing", AN, 34], ["doing", "done", H, 32]]);
  mk("tsk_07", [[null, "todo", H, 42], ["todo", "doing", AN, 32], ["doing", "done", H, 30]]);
  mk("tsk_08", [[null, "todo", H, 42], ["todo", "doing", LA, 32], ["doing", "done", H, 30, "Duyệt 81/100"]]);
  mk("tsk_09", [[null, "todo", H, 42], ["todo", "doing", LA, 31], ["doing", "done", H, 29]]);
  // Sprint 2
  mk("tsk_10", [[null, "todo", H, 28], ["todo", "doing", AN, 12, "Bắt đầu tích hợp API giỏ hàng"], ["doing", "review", AN, 8, "Nộp bài chờ đánh giá"], ["review", "doing", H, 7, "Yêu cầu làm lại sau đánh giá (55/100)"]]);
  mk("tsk_11", [[null, "todo", H, 28], ["todo", "doing", AN, 6], ["doing", "review", AN, 1, "Nộp bài chờ AI đánh giá"]]);
  mk("tsk_12", [[null, "todo", H, 28], ["todo", "doing", AN, 2, "Bắt đầu dựng trang giỏ hàng"]]);
  mk("tsk_13", [[null, "todo", H, 28], ["todo", "doing", AN, 10], ["doing", "done", H, 8]]);
  mk("tsk_14", [[null, "todo", H, 28], ["todo", "doing", AN, 11], ["doing", "done", H, 9]]);
  mk("tsk_15", [[null, "todo", H, 28], ["todo", "doing", MH, 5, "Bắt đầu dựng API thanh toán"]]);
  mk("tsk_16", [[null, "todo", H, 28], ["todo", "doing", KH, 4], ["doing", "review", KH, 2, "Nộp kịch bản chạy ổn định"]]);
  mk("tsk_17", [[null, "todo", H, 28], ["todo", "doing", LA, 8], ["doing", "done", H, 5]]);
  return hist;
}

export function seedTaskComments(): TaskComment[] {
  const c = (taskId: string, authorId: string, authorName: string, content: string, days: number): TaskComment => ({
    id: `cmt_${taskId.replace("tsk_", "")}_${Math.random().toString(36).slice(2, 6)}`,
    taskId,
    authorId,
    authorName,
    content,
    at: daysAgo(days),
  });
  return [
    c("tsk_12", "usr_hong", "Hồng Lê", "Trang giỏ hàng nhớ dùng skeleton khi tải và empty state có CTA quay lại danh mục nhé em.", 2),
    c("tsk_12", "usr_an", "An Nguyễn", "Dạ em đang làm skeleton 6 ô, empty state em sẽ thêm CTA 'Khám phá sản phẩm'.", 2),
    c("tsk_12", "usr_hong", "Hồng Lê", "Ổn. Ngoài ra chú ý memo hóa hàng trong giỏ — số lượng đổi thường xuyên đó.", 1),
    c("tsk_12", "usr_an", "An Nguyễn", "Em sẽ dùng selector tổng tiền + shallow compare để tránh re-render toàn cột ạ.", 1),
    c("tsk_11", "usr_hong", "Hồng Lê", "Checkout em chia validation theo từng bước, đừng disable nút mà không nói lý do — người dùng dễ bối rối.", 3),
    c("tsk_11", "usr_an", "An Nguyễn", "Dạ em đã hiện thông báo lỗi ngay từng trường và tóm tắt lỗi đầu form.", 3),
    c("tsk_11", "usr_hong", "Hồng Lê", "Bài nộp đã có AI review, em xem findings ở src/components/Checkout/Step1.tsx rồi tự sửa nhé.", 1),
    c("tsk_10", "usr_hong", "Hồng Lê", "Phần rework tập trung xử lý đồng bộ giỏ hàng khi đổi số lượng nhanh (race condition).", 6),
    c("tsk_10", "usr_an", "An Nguyễn", "Dạ em sẽ dùng optimistic update có rollback và viết test cho case bấm nhanh.", 6),
    c("tsk_10", "usr_hong", "Hồng Lê", "Nhớ thêm test cho case mất mạng giữa chừng nữa nhé — CI đang có job mock network.", 5),
    c("tsk_03", "usr_hong", "Hồng Lê", "Layout rất ổn, em bổ sung focus ring cho menu drawer là đạt.", 38),
    c("tsk_03", "usr_an", "An Nguyễn", "Dạ em đã thêm focus-visible, em sẽ cải thiện nốt transition ạ.", 37),
    c("tsk_03", "usr_minhha", "Minh Hà Trần", "Mình test trên Safari — drawer hoạt động tốt, carousel hơi giật nhẹ 1 nhịp.", 36),
    c("tsk_16", "usr_khanh", "Khánh Đoàn", "Kịch bản Playwright đã chạy ổn định 5/5 lần trên CI, em nộp để AI review ạ.", 2),
    c("tsk_16", "usr_lam", "Lam Phạm", "Em review nhanh: nên thêm case xóa toàn bộ giỏ để chắc tổng tiền về 0 nhé.", 2),
    c("tsk_16", "usr_hong", "Hồng Lê", "Ủng hộ ý của Lam — thêm case clear-cart rồi chốt nhé Khánh.", 1),
    c("tsk_15", "usr_hong", "Hồng Lê", "API thanh toán nhớ dùng idempotency key để tránh double-charge khi client retry.", 4),
    c("tsk_15", "usr_minhha", "Minh Hà Trần", "Dạ em đang làm idempotency theo header X-Idempotency-Key, hết tuần này có bản demo.", 3),
    c("tsk_15", "usr_hong", "Hồng Lê", "Tốt — em ghi log sang dịch vụ payment-sandbox để mình soi trace khi demo nhé.", 2),
    c("tsk_01", "usr_hong", "Hồng Lê", "Repo chuẩn, CI xanh ngay lần đầu — khởi đầu tốt.", 41),
    c("tsk_01", "usr_an", "An Nguyễn", "Dạ em có thêm pre-commit hook lint + format để cả nhóm khỏi quên ạ.", 41),
    c("tsk_02", "usr_minhha", "Minh Hà Trần", "Migration seed đã có 500 sản phẩm mẫu + 20 danh mục để test lọc.", 40),
  ];
}

export function seedTaskSpecs(): Record<string, TaskSpec> {
  const base = (role: string, sp: number, hours: number, req: string): TaskSpec => ({
    requirements: req,
    role,
    dod: [
      "Code đúng chuẩn ESLint/Prettier của dự án, không lỗi build",
      "Có unit test hoặc integration test cho logic chính",
      "Tự kiểm tra trên desktop và mobile (viewport 375px)",
      "Cập nhật mô tả PR và demo ngắn cho mentor khi hoàn thành",
    ],
    documentation: "Xem README dự án, ADR trong thư mục /docs và Figma EduMart (bản EduMart v3).",
    expectedOutput: "Một Pull request tới nhánh develop kèm ảnh chụp demo; CI xanh; mô tả ngắn cách triển khai.",
    skillTags:
      role === "frontend"
        ? ["React", "TypeScript", "TailwindCSS", "Zustand"]
        : role === "backend"
          ? ["Node.js", "PostgreSQL", "REST"]
          : role === "qa"
            ? ["Playwright", "Test plan"]
            : ["Tài liệu", "Quy trình"],
    complexity: sp <= 2 ? "easy" : sp <= 4 ? "medium" : "hard",
    estimatedHours: hours,
    blocked: false,
  });

  const specs: Record<string, TaskSpec> = {};
  for (const t of TASK_SEEDS) {
    specs[t.id] = base(t.role, t.storyPoints, t.estimatedHours, `${t.title}. ${t.description}`);
  }
  specs["tsk_12"] = {
    ...base("frontend", 3, 12, "Xây dựng trang /gio-hang hoàn chỉnh: danh sách sản phẩm trong giỏ, chỉnh số lượng, xóa sản phẩm, tạm tính, áp dụng khuyến mãi và empty state."),
    dod: [
      "Trang hiển thị đúng khi giỏ trống (empty state + CTA) và khi có 10+ sản phẩm",
      "Đổi số lượng cập nhật tạm tính tức thì, không re-render cả cột",
      "State giỏ hàng đồng bộ giữa trang giỏ và header badge",
      "Skeleton loading khi đang tải; có thể retry khi lỗi mạng",
      "Unit test cho phần tính tạm tính và áp dụng khuyến mãi",
    ],
    expectedOutput: "PR gồm trang /gio-hang + ảnh demo (desktop & mobile), test pass trên CI.",
    skillTags: ["React", "Zustand", "TailwindCSS", "Testing Library"],
    complexity: "medium",
  };
  specs["tsk_10"] = {
    ...base("frontend", 3, 10, "Tích hợp API giỏ hàng: store Zustand chứa items, đồng bộ với API, optimistic update có rollback, xử lý race condition khi thao tác nhanh."),
    dod: [
      "Optimistic update có rollback khi API lỗi",
      "Không xảy ra lệch số lượng khi bấm +/- nhanh liên tục (race condition)",
      "Có test cho store: thêm, sửa, xóa, rollback",
      "Toast lỗi thân thiện khi đồng bộ thất bại",
    ],
    expectedOutput: "PR gồm store /lib/cart + hook useCartSync + test; ảnh demo luồng thêm/xóa sản phẩm.",
    skillTags: ["Zustand", "React Query", "Testing Library"],
    complexity: "hard",
  };
  specs["tsk_11"] = {
    ...base("frontend", 2, 8, "Trang checkout bước 1: form thông tin giao hàng (họ tên, SĐT, địa chỉ, ghi chú) với validation từng bước, lưu nháp vào localStorage, điều hướng sang bước thanh toán."),
    dod: [
      "Validation chạy khi blur và khi submit; lỗi hiển thị rõ từng trường",
      "Lưu bản nháp — quay lại vẫn còn dữ liệu",
      "Đi tiếp bị chặn nếu form lỗi, có tóm tắt lỗi đầu trang",
      "Tương thích bàn phím (Tab order hợp lý)",
    ],
    expectedOutput: "PR gồm /gio-hang/checkout + component form; test validation pass.",
    skillTags: ["React Hook Form", "Zod", "TailwindCSS"],
    complexity: "medium",
  };
  return specs;
}

/* ----------------------------- SUBMISSIONS ----------------------------- */

export function seedSubmissions(): Submission[] {
  const s = (
    id: string,
    taskId: string,
    internId: string,
    internName: string,
    prUrl: string,
    summary: string,
    status: Submission["status"],
    score: number | null,
    feedback: string | null,
    days: number,
    reviewedDays?: number
  ): Submission => ({
    id,
    taskId,
    internId,
    internName,
    prUrl,
    summary,
    status,
    score,
    feedback,
    headSha: "a1b2c3d",
    submittedAt: daysAgo(days),
    reviewedAt: reviewedDays != null ? daysAgo(reviewedDays) : null,
  });
  return [
    s("sub_01", "tsk_03", "usr_an", "An Nguyễn", "https://github.com/vintern-labs/edumart/pull/12", "Layout + navigation responsive, dark mode, drawer mobile, focus-visible cho menu.", "approved", 85, "Code sạch, đúng design system. Bổ sung focus ring cho drawer là hoàn hảo.", 38, 37),
    s("sub_02", "tsk_04", "usr_an", "An Nguyễn", "https://github.com/vintern-labs/edumart/pull/21", "Trang danh mục với bộ lọc danh mục + khoảng giá, debounce tìm kiếm, skeleton khi tải.", "approved", 78, "Đạt yêu cầu. Nên tách hook useProductFilter để tái sử dụng cho trang tìm kiếm.", 27, 26),
    s("sub_03", "tsk_10", "usr_an", "An Nguyễn", "https://github.com/vintern-labs/edumart/pull/34", "Cart store Zustand + optimistic update, đồng bộ API mỗi thao tác.", "rework", 55, "Đồng bộ giỏ còn lỗi khi đổi số lượng nhanh (race). Làm lại optimistic update có rollback và viết test cho case bấm nhanh.", 8, 7),
    s("sub_04", "tsk_11", "usr_an", "An Nguyễn", "https://github.com/vintern-labs/edumart/pull/36", "Trang checkout bước 1 với validation từng bước, lưu nháp localStorage.", "submitted", null, null, 1),
    s("sub_05", "tsk_02", "usr_minhha", "Minh Hà Trần", "https://github.com/vintern-labs/edumart/pull/9", "Schema products/categories/orders + migration + seed dữ liệu mẫu.", "approved", 88, "Schema chuẩn hóa tốt, index hợp lý, có ràng buộc khoá ngoại đầy đủ.", 41, 40),
    s("sub_06", "tsk_08", "usr_lam", "Lam Phạm", "https://github.com/vintern-labs/edumart/pull/15", "Kịch bản smoke luồng duyệt sản phẩm: 14 bước, kết quả mong đợi từng bước.", "approved", 81, "Kịch bản đầy đủ, dễ theo dõi. Nên bổ sung case mạng chậm.", 31, 30),
    s("sub_07", "tsk_16", "usr_khanh", "Khánh Đoàn", "https://github.com/vintern-labs/edumart/pull/38", "Playwright: thêm 2 sản phẩm, đổi số lượng, xóa 1 sản phẩm, kiểm tra tổng tiền.", "submitted", null, null, 2),
  ];
}

function evidence(passed: number, ms: number): NonNullable<CodeReview["evidence"]> {
  return {
    complete: true,
    trustedTests: {
      status: "passed",
      passed,
      failed: 0,
      executionTimeMs: ms,
      checks: [
        { name: "build", passed: true, log: "✓ Compiled successfully in 3.2s" },
        { name: "lint", passed: true, log: "✓ No ESLint warnings or errors" },
        { name: "test", passed: true, log: `✓ ${passed} passed, 0 failed` },
      ],
    },
  };
}

export function seedCodeReviews(): CodeReview[] {
  const r = (
    id: string,
    submissionId: string,
    status: CodeReview["status"],
    result: CodeReview["result"],
    days: number,
    instructorScores: CodeReview["instructorScores"] | null,
    instructorFeedback: string | null
  ): CodeReview => ({
    id,
    submissionId,
    status,
    model: "gemini-2.0-flash",
    result,
    evidence: evidence(
      id === "cr_01" ? 8 : id === "cr_05" ? 12 : 6,
      id === "cr_01" ? 4200 : id === "cr_05" ? 5100 : 3600
    ),
    scoredAt: daysAgo(days),
    createdAt: daysAgo(days),
    instructorScores,
    instructorFeedback,
    overrideReason: null,
  });

  return [
    r(
      "cr_01",
      "sub_01",
      "passed",
      {
        score: 86,
        rubric: { functional: 90, quality: 86, testing: 72, errors: 90, security: 84, dod: 88 },
        summary: "Bài nộp đạt chất lượng tốt: layout khớp design system, responsive đầy đủ, xử lý focus khá chu đáo.",
        limitations: ["Chưa có test E2E cho drawer mobile"],
        findings: [
          { file: "src/components/layout/Header.tsx", line: 42, message: "Menu drawer nên thêm aria-label='Menu chính' để hỗ trợ trình đọc màn hình.", severity: "info" },
          { file: "src/components/layout/Footer.tsx", line: 18, message: "Link nhóm mạng xã hội nên dùng rel='noreferrer'.", severity: "warning" },
        ],
      },
      37,
      { functional: 86, quality: 85, testing: 78, errors: 86, security: 84, dod: 90 },
      "Code sạch, đúng design system. Bổ sung focus ring cho drawer là hoàn hảo."
    ),
    r(
      "cr_02",
      "sub_02",
      "passed",
      {
        score: 79,
        rubric: { functional: 84, quality: 78, testing: 64, errors: 82, security: 80, dod: 84 },
        summary: "Bộ lọc hoạt động đúng, debounce tốt. Cần cải thiện độ phủ test cho edge case giá 0 và trùng lọc.",
        limitations: ["Thiếu test cho lọc khoảng giá khi dữ liệu lớn"],
        findings: [
          { file: "src/components/catalog/FilterSidebar.tsx", line: 57, message: "Dùng index làm key cho danh sách chip lọc có thể gây lệch state.", severity: "warning" },
        ],
      },
      26,
      { functional: 80, quality: 76, testing: 70, errors: 82, security: 75, dod: 85 },
      "Đạt yêu cầu. Nên tách hook useProductFilter để tái sử dụng cho trang tìm kiếm."
    ),
    r(
      "cr_03",
      "sub_03",
      "needs_changes",
      {
        score: 58,
        rubric: { functional: 62, quality: 60, testing: 42, errors: 64, security: 58, dod: 60 },
        summary: "Chức năng chính hoạt động nhưng đồng bộ giỏ còn race condition khi thao tác nhanh; thiếu test cho store.",
        limitations: ["Không có test cho optimistic rollback", "Chưa xử lý trường hợp API timeout"],
        findings: [
          { file: "src/lib/cart/store.ts", line: 33, message: "updateQty không hủy request cũ khi đổi số lượng liên tục — dẫn tới lệch dữ liệu.", severity: "error" },
          { file: "src/lib/cart/sync.ts", line: 12, message: "Thiếu rollback state khi API trả lỗi 4xx.", severity: "error" },
          { file: "src/lib/cart/store.test.ts", line: 1, message: "Bộ test chưa phủ case bấm nhanh +/- 5 lần trong 1 giây.", severity: "warning" },
        ],
      },
      7,
      { functional: 55, quality: 50, testing: 45, errors: 65, security: 60, dod: 55 },
      "Đồng bộ giỏ còn lỗi khi đổi số lượng nhanh (race). Làm lại optimistic update có rollback và viết test cho case bấm nhanh."
    ),
    r(
      "cr_04",
      "sub_04",
      "awaiting_instructor",
      {
        score: 82,
        rubric: { functional: 85, quality: 80, testing: 70, errors: 90, security: 85, dod: 80 },
        summary: "Form validation chắc tay, lưu nháp hoạt động tốt. AI đề xuất chốt 82/100 — chờ mentor xác nhận.",
        limitations: ["Chưa có test cho luồng mất kết nối giữa chừng"],
        findings: [
          { file: "src/components/Cart.tsx", line: 42, message: "Nên useMemo cho tổng tiền thay vì tính trực tiếp trong render.", severity: "warning" },
          { file: "src/app/gio-hang/checkout/Step1.tsx", line: 88, message: "Trường số điện thoại chưa giới hạn ký tự nhập vào (chỉ cho 0-9).", severity: "info" },
        ],
      },
      1,
      null,
      null
    ),
    r(
      "cr_05",
      "sub_05",
      "passed",
      {
        score: 84,
        rubric: { functional: 88, quality: 86, testing: 76, errors: 88, security: 82, dod: 84 },
        summary: "Schema rõ ràng, quan hệ hợp lý, migration an toàn. Seed dữ liệu phong phú.",
        limitations: ["Chưa có script rollback migration"],
        findings: [{ file: "prisma/schema.prisma", line: 21, message: "Nên thêm index cột (category_id, created_at) cho truy vấn báo cáo sau này.", severity: "info" }],
      },
      40,
      { functional: 88, quality: 88, testing: 80, errors: 90, security: 86, dod: 88 },
      "Schema chuẩn hóa tốt, index hợp lý, có ràng buộc khoá ngoại đầy đủ."
    ),
    r(
      "cr_06",
      "sub_06",
      "passed",
      {
        score: 80,
        rubric: { functional: 82, quality: 80, testing: 74, errors: 82, security: 78, dod: 84 },
        summary: "Kịch bản smoke đầy đủ, dễ theo dõi; thiếu case mạng chậm nhưng tổng thể đạt.",
        limitations: ["Chưa có case kiểm thử offline"],
        findings: [{ file: "docs/test/smoke-catalog.md", line: 30, message: "Bổ sung bước kiểm tra khi API chậm > 3s.", severity: "info" }],
      },
      30,
      { functional: 82, quality: 80, testing: 74, errors: 84, security: 78, dod: 86 },
      "Kịch bản đầy đủ, dễ theo dõi. Nên bổ sung case mạng chậm."
    ),
    r(
      "cr_07",
      "sub_07",
      "awaiting_instructor",
      {
        score: 76,
        rubric: { functional: 80, quality: 74, testing: 78, errors: 78, security: 70, dod: 76 },
        summary: "Kịch bản Playwright chạy ổn định, assertion rõ ràng. AI đề xuất 76/100 — chờ mentor xác nhận.",
        limitations: ["Chưa có step debug (trace on failure)"],
        findings: [{ file: "e2e/cart.spec.ts", line: 24, message: "Nên thêm expect với số lượng chính xác thay vì toBeTruthy.", severity: "info" }],
      },
      2,
      null,
      null
    ),
  ];
}

/* --------------------------- TIMELINE + MILESTONES --------------------------- */

export function seedTimeline(): SessionTimelineEvent[] {
  const e = (id: string, action: string, summary: string, actorName: string, days: number): SessionTimelineEvent => ({
    id,
    sessionId: "ses_2025_01",
    action,
    summary,
    actorName,
    createdAt: daysAgo(days),
  });
  return [
    e("tlm_01", "session_created", "Khởi tạo phiên thực tập SES-2025-01 với dự án Sàn TMĐT EduMart.", "Hồng Lê", 49),
    e("tlm_02", "plan_published", "Xác nhận kế hoạch AI: 3 sprint, 25 nhiệm vụ được tạo tự động.", "Hồng Lê", 42),
    e("tlm_03", "member_joined", "Thêm thành viên An Nguyễn — vai trò frontend.", "Hồng Lê", 42),
    e("tlm_04", "member_joined", "Thêm thành viên Minh Hà Trần — vai trò backend.", "Hồng Lê", 42),
    e("tlm_05", "member_joined", "Thêm thành viên Lam Phạm (fullstack), Khánh Đoàn (QA), Thảo Nguyễn (backend).", "Hồng Lê", 41),
    e("tlm_06", "sprint_started", "Sprint 1 — Nền tảng & Danh mục sản phẩm bắt đầu.", "Hồng Lê", 42),
    e("tlm_07", "submission_approved", "Duyệt bài nộp TSK-03 (Layout & navigation) với 85 điểm.", "Hồng Lê", 37),
    e("tlm_08", "sprint_completed", "Sprint 1 hoàn thành 100% — 9/9 nhiệm vụ đóng.", "Hồng Lê", 28),
    e("tlm_09", "sprint_started", "Sprint 2 — Giỏ hàng & Thanh toán bắt đầu.", "Hồng Lê", 28),
    e("tlm_10", "submission_rework", "TSK-10 bị yêu cầu làm lại sau đánh giá AI (58/100).", "Hồng Lê", 7),
    e("tlm_11", "evaluation_finalized", "Chốt đánh giá giữa kỳ cho An Nguyễn: 84/100.", "Hồng Lê", 18),
    e("tlm_12", "submission_submitted", "An Nguyễn nộp bài TSK-11 (checkout bước 1), AI review 82/100.", "An Nguyễn", 1),
  ];
}

export function seedMilestones(): Milestone[] {
  return [
    { id: "mst_01", sessionId: "ses_2025_01", title: "Kickoff & chốt phạm vi MVP", dueDate: daysAgo(40), completed: true },
    { id: "mst_02", sessionId: "ses_2025_01", title: "Hoàn thành Sprint 1 — Danh mục sản phẩm", dueDate: daysAgo(28), completed: true },
    { id: "mst_03", sessionId: "ses_2025_01", title: "Demo giữa kỳ — Sprint 2 (giỏ hàng & checkout)", dueDate: daysFromNow(7), completed: false },
    { id: "mst_04", sessionId: "ses_2025_01", title: "Nghiệm thu & bảo vệ đồ án cuối kỳ", dueDate: daysFromNow(35), completed: false },
  ];
}

export function seedPlans(templates: { id: string; blueprint: unknown; name: string }[]): Plan | null {
  const tpl = templates.find((t) => t.id === "tpl_ecom");
  if (!tpl) return null;
  const session = { id: "ses_2025_01", startDate: daysAgo(42) };
  const draft = buildPlanDraft(tpl as never, session as never);
  return {
    planId: "plan_ses_2025_01",
    sessionId: "ses_2025_01",
    status: "published",
    createdAt: daysAgo(42, 4),
    generatingSince: null,
    sprintCount: draft.sprints.length,
    taskCount: draft.sprints.reduce((a, s) => a + s.tasks.length, 0),
    draft,
    warnings: [],
    error: null,
  };
}
