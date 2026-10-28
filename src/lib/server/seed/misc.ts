import type {
  ActivityEvent,
  AdminSetting,
  AiConfig,
  AppNotificationRecord,
  AuditLog,
  NotificationCategory,
  ReportItem,
  User,
} from "../types";
import { daysAgo } from "../util";

export const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  "task",
  "session",
  "evaluation",
  "kpi",
  "salary",
  "certificate",
  "announcement",
  "system",
  "recruitment",
];

export function seedNotificationPrefs(users: User[]): Record<string, boolean> {
  const prefs: Record<string, boolean> = {};
  for (const u of users) {
    for (const cat of NOTIFICATION_CATEGORIES) {
      prefs[`${u.id}:${cat}`] = true;
    }
    prefs[`${u.id}:recruitment`] = false; // mặc định tắt tin khuyến mãi tuyển dụng
  }
  return prefs;
}

interface NotifSeed {
  category: NotificationCategory;
  title: string;
  content: string;
  link: string | null;
  days: number;
  read: boolean;
}

function anNotifications(): NotifSeed[] {
  return [
    { category: "task", title: "Được giao nhiệm vụ TSK-12 — Xây dựng trang giỏ hàng", content: "Mentor Hồng Lê đã giao cho bạn nhiệm vụ TSK-12 (SPR-02), ưu tiên cao, hạn còn 1 tuần.", link: "#/intern/work/TSK-12", days: 2, read: false },
    { category: "task", title: "TSK-10 cần làm lại theo nhận xét", content: "Bài nộp của bạn được chấm 55/100. Vui lòng làm lại phần optimistic update và viết test cho race condition.", link: "#/intern/work/TSK-10", days: 6, read: true },
    { category: "task", title: "Có nhận xét mới trên TSK-12", content: "Hồng Lê: \"Trang giỏ hàng nhớ dùng skeleton khi tải và empty state có CTA nhé em.\"", link: "#/intern/work/TSK-12", days: 1, read: false },
    { category: "task", title: "TSK-11 đã nộp, chờ AI đánh giá", content: "Bài nộp TSK-11 đang được AI review. Bạn sẽ nhận thông báo khi có kết quả.", link: "#/intern/work/TSK-11", days: 1, read: true },
    { category: "session", title: "Sprint 2 — Giỏ hàng & Thanh toán đã bắt đầu", content: "Sprint hiện tại có 8 nhiệm vụ cho toàn đội, dự kiến kết thúc sau 2 tuần.", link: "#/intern/board", days: 28, read: true },
    { category: "evaluation", title: "Đánh giá giữa kỳ đã chốt: 84/100", content: "Mentor Hồng Lê đã chốt đánh giá giữa kỳ với số điểm 84. Xem chi tiết từng tiêu chí để cải thiện.", link: "#/intern/evaluations", days: 18, read: true },
    { category: "kpi", title: "KPI Q2/2025 đã tính: 81.9 điểm", content: "KPI của bạn đạt 81.9/100, xếp loại Khá. Điểm yếu nhất là tỷ lệ hoàn thành task (57.1%).", link: "#/intern/kpi", days: 5, read: true },
    { category: "salary", title: "Cộng 730.000 ₫ (ảo) vào ví kỳ này", content: "Thu nhập điều chỉnh theo KPI Q2 đã được ghi vào sổ lương ảo. Số dư hiện tại 6.480.000 ₫ (ảo).", link: "#/intern/salary", days: 2, read: false },
    { category: "certificate", title: "Chứng chỉ CERT-2025-0142 đã được cấp", content: "Bạn nhận được chứng chỉ CERT-SILVER cho dự án Sàn TMĐT EduMart. Mã tra cứu: VIT-2025-0142.", link: "#/intern/certificates", days: 3, read: true },
    { category: "announcement", title: "Workshop: Viết CV ngành công nghệ", content: "Hội thảo trực tuyến chiều thứ 7 tuần này về cách viết CV nổi bật cho sinh viên IT. Đăng ký trong mục Sự kiện.", link: "#/intern/notifications", days: 4, read: true },
    { category: "announcement", title: "Bảo trì hệ thống Chủ nhật 02:00–04:00", content: "Hệ thống tạm dừng phục vụ trong khung giờ bảo trì định kỳ. Tiến độ làm việc được lưu tự động.", link: null, days: 8, read: true },
    { category: "system", title: "Đã bật gợi ý AI cho nhiệm vụ", content: "AI Mentor giờ có thể gợi ý 3 câu hỏi tiếp theo dựa trên ngữ cảnh task bạn đang hỏi.", link: "#/intern/mentor", days: 7, read: true },
  ];
}

function genericNotifications(user: User): NotifSeed[] {
  const seeds: NotifSeed[] = [];
  const internSpecific: Record<string, NotifSeed[]> = {
    usr_minhha: [
      { category: "task", title: "TSK-15 sắp đến hạn (2 ngày)", content: "API thanh toán và xác thực đơn hàng là nhiệm vụ nghiêm trọng duy nhất của bạn trong Sprint 2.", link: "#/intern/work/TSK-15", days: 1, read: false },
      { category: "task", title: "Bài nộp TSK-02 đã được duyệt 88/100", content: "Mentor nhận xét: schema chuẩn hóa tốt, index hợp lý.", link: "#/intern/work/TSK-02", days: 40, read: true },
    ],
    usr_lam: [
      { category: "task", title: "TSK-17 đã được duyệt", content: "Luồng email xác nhận đơn (mock) hoàn thành với chất lượng tốt.", link: "#/intern/work/TSK-17", days: 5, read: false },
      { category: "task", title: "Có nhận xét mới trên TSK-16", content: "Bạn đã để lại nhận xét cho kịch bản kiểm thử của Khánh Đoàn.", link: "#/intern/work/TSK-16", days: 2, read: true },
    ],
    usr_khanh: [
      { category: "task", title: "Bài nộp TSK-16 chờ mentor xác nhận", content: "AI review 76/100 — chờ mentor chốt điểm. Vui lòng theo dõi nhận xét.", link: "#/intern/work/TSK-16", days: 2, read: false },
      { category: "task", title: "Được giao TSK-23 — Bộ test hồi quy E2E", content: "Nhiệm vụ Sprint 3 với 5 story points, hạn còn 26 ngày.", link: "#/intern/work/TSK-23", days: 3, read: true },
    ],
    usr_thao: [
      { category: "task", title: "Được giao TSK-24 — Tổng hợp tài liệu", content: "Nhiệm vụ Sprint 3: cẩm nang sử dụng EduMart và tài liệu demo cuối kỳ.", link: "#/intern/work/TSK-24", days: 3, read: false },
    ],
    usr_binh: [
      { category: "recruitment", title: "Chọn vai trò để bắt đầu phỏng vấn AI", content: "Bạn chưa chọn vai trò. Hãy chọn frontend/backend/fullstack/qa hoặc business analyst để mở phỏng vấn đầu vào.", link: "#/recruitment", days: 1, read: false },
      { category: "recruitment", title: "Chào mừng đến V-Intern!", content: "Hoàn tất phỏng vấn AI đầu vào để được chọn vào kỳ thực tập phù hợp. Xem hướng dẫn trong mục Tuyển dụng.", link: "#/recruitment", days: 5, read: false },
    ],
    usr_chi: [
      { category: "recruitment", title: "Kết quả phỏng vấn: ĐẠT (76/100)", content: "Chúc mừng! Bạn đã qua phỏng vấn vai trò frontend. Đang chờ giảng viên chọn vào phiên thực tập.", link: "#/recruitment", days: 20, read: false },
      { category: "recruitment", title: "Bạn được thêm vào danh sách ứng viên", content: "Giảng viên có thể xem hồ sơ và kết quả phỏng vấn của bạn khi mở phiên mới.", link: "#/recruitment", days: 19, read: true },
    ],
    usr_quang: [
      { category: "recruitment", title: "Kết quả phỏng vấn: ĐẠT (69/100)", content: "Bạn đã qua phỏng vấn vai trò backend. Vui lòng chờ giảng viên tuyển vào phiên.", link: "#/recruitment", days: 15, read: false },
    ],
    usr_trang: [
      { category: "recruitment", title: "Kết quả phỏng vấn: ĐẠT (67/100)", content: "Bạn đã qua phỏng vấn vai trò QA. Vui lòng chờ giảng viên tuyển vào phiên.", link: "#/recruitment", days: 12, read: false },
    ],
    usr_dung: [
      { category: "recruitment", title: "Kết quả phỏng vấn: CHƯA ĐẠT (51/100)", content: "Đừng nản chí! Bạn còn 1 lần thi lại. Đề xuất ôn: thiết kế API, ACID, tiếng Anh chuyên ngành. Đủ điều kiện thi lại từ hôm nay.", link: "#/recruitment", days: 11, read: false },
      { category: "recruitment", title: "Nhắc nhở: lần thi lại cuối cùng", content: "Theo chính sách, bạn có tối đa 3 lần phỏng vấn. Hãy chuẩn bị kỹ trước khi bắt đầu.", link: "#/recruitment", days: 3, read: false },
    ],
    usr_hung: [
      { category: "system", title: "Tài khoản đang chờ kích hoạt", content: "Vui lòng liên hệ quản trị viên để kích hoạt tài khoản và bắt đầu phỏng vấn đầu vào.", link: null, days: 9, read: false },
    ],
    usr_mai: [
      { category: "system", title: "Tài khoản bị tạm khóa", content: "Tài khoản vi phạm điều khoản sử dụng. Liên hệ quản trị viên để kháng nghị.", link: null, days: 20, read: false },
    ],
  };

  seeds.push(...(internSpecific[user.id] ?? []));

  if (user.role === "instructor") {
    seeds.push(
      { category: "session", title: "Sprint 2 của SES-2025-01 đã bắt đầu", content: "8 nhiệm vụ được kích hoạt cho sprint giỏ hàng & thanh toán.", link: "#/sessions/ses_2025_01", days: 28, read: true },
      { category: "task", title: "Có 3 bài nộp chờ duyệt trong Sprint 2", content: "TSK-10 cần rework, TSK-11 và TSK-16 chờ bạn xác nhận sau AI review.", link: "#/sessions/ses_2025_01/work", days: 2, read: false },
      { category: "evaluation", title: "Chu kỳ đánh giá giữa kỳ đang mở", content: "Bạn có 2 đánh giá đã chốt, 1 bản nháp chưa hoàn tất cho SES-2025-01.", link: "#/evaluation-cycles", days: 10, read: false },
      { category: "session", title: "Phiên Thực tập Hè 2025 đã tạo", content: "Phiên đang ở trạng thái chuẩn bị — hãy tạo kế hoạch AI và thêm thành viên.", link: "#/sessions/ses_2025_02", days: 7, read: true },
      { category: "announcement", title: "Hướng dẫn đánh giá giữa kỳ", content: "Nhắc: đánh giá giữa kỳ chốt trước thứ 6 tuần tới, dùng gợi ý AI để tiết kiệm thời gian.", link: null, days: 12, read: true },
      { category: "system", title: "Báo cáo tuần tự động đã sẵn sàng", content: "Snapshot tiến độ mỗi tuần được tạo trong mục Báo cáo — có thể xuất CSV.", link: "#/reports", days: 4, read: true },
      { category: "system", title: "AI Engine hoạt động ổn định", content: "Tuần qua AI review 12 bài nộp với độ trễ trung bình 210ms.", link: null, days: 1, read: false }
    );
  } else if (user.role === "admin") {
    seeds.push(
      { category: "system", title: "Cảnh báo dịch vụ Notification degraded", content: "Độ trễ đẩy thông báo trung bình 180ms — cao hơn ngưỡng 150ms. Kiểm tra tại Trạng thái hệ thống.", link: "#/admin/system", days: 1, read: false },
      { category: "system", title: "2 cảnh báo học tập đang chờ xử lý", content: "2 thực tập sinh có rủi ro trễ tiến độ — xem chi tiết trong bảng điều khiển.", link: "#/admin/dashboard", days: 2, read: false },
      { category: "system", title: "Sao lưu định kỳ hoàn tất", content: "Snapshot dữ liệu 06:00 hôm nay thành công (2.1MB).", link: null, days: 3, read: true },
      { category: "announcement", title: "2 người dùng mới trong 7 ngày", content: "Tài khoản pending: hung.pham@student.edu.vn cần kích hoạt.", link: "#/admin/users?status=pending", days: 5, read: true },
      { category: "session", title: "Phiên Thực tập Hè 2025 được tạo", content: "Giảng viên Hồng Lê tạo phiên mới từ template TPL-TASK.", link: "#/admin/sessions", days: 7, read: true },
      { category: "announcement", title: "Cập nhật chính sách chứng chỉ", content: "Chính sách CERT-SILVER áp dụng từ 01/06: điểm đánh giá cuối kỳ ≥ 80.", link: null, days: 9, read: true }
    );
  } else {
    seeds.push(
      { category: "announcement", title: "Chào mừng đến V-Intern!", content: "Nền tảng thực tập ảo với AI phỏng vấn, AI mentor và dự án thật. Khám phá ngay!", link: "#/recruitment", days: 6, read: true },
      { category: "system", title: "Mẹo: dùng AI Mentor hiệu quả", content: "Đặt câu hỏi kèm ngữ cảnh (task đang làm, code gặp lỗi) để mentor trả lời chuẩn hơn.", link: "#/intern/mentor", days: 5, read: true },
      { category: "announcement", title: "Bảo trì hệ thống Chủ nhật 02:00–04:00", content: "Hệ thống tạm dừng phục vụ trong khung giờ bảo trì định kỳ.", link: null, days: 8, read: true },
      { category: "system", title: "Cập nhật điều khoản sử dụng", content: "Chính sách bảo mật cập nhật theo Nghị định 13/2023. Vui lòng xem lại.", link: null, days: 15, read: true }
    );
  }

  // đảm bảo mỗi user có đủ 12 thông báo (mới nhất trước) và đúng 3 unread
  const fillers: NotifSeed[] = [
    { category: "session", title: "Kỳ thực tập Thực tập Xuân 2025 đang diễn ra", content: "5 thực tập sinh đang làm dự án EduMart. Theo dõi tiến độ chung tại bảng điều khiển.", link: "#/sessions", days: 20, read: true },
    { category: "announcement", title: "Sự kiện Demo Day cuối kỳ", content: "Demo Day kỳ Xuân sẽ tổ chức trực tuyến — các đội trình bày sản phẩm trước mentor và doanh nghiệp.", link: null, days: 11, read: true },
    { category: "system", title: "Bảo mật: bật xác thực 2 lớp", content: "Tăng cường bảo mật tài khoản bằng xác thực 2 lớp trong phần Cài đặt.", link: null, days: 13, read: true },
    { category: "announcement", title: "Cập nhật chính sách điểm danh", content: "Từ tuần sau, điểm danh hàng ngày được ghi nhận tự động theo tiến độ task cập nhật.", link: null, days: 16, read: true },
    { category: "system", title: "Mẹo: xuất báo cáo CSV", content: "Bạn có thể xuất báo cáo tiến độ dạng CSV trong mục Báo cáo để lưu trữ hoặc gửi mentor.", link: "#/reports", days: 9, read: true },
  ];
  let i = 0;
  while (seeds.length < 12) {
    seeds.push(fillers[i % fillers.length]);
    i++;
  }
  // sắp xếp mới nhất trước rồi chốt 12 mục
  const list = seeds.slice(0, 12).sort((a, b) => a.days - b.days);
  // chuẩn về đúng 3 unread: thừa thì đọc bớt mục cũ nhất, thiếu thì đánh dấu mục mới nhất
  let unread = list.filter((s) => !s.read).length;
  if (unread > 3) {
    for (let k = list.length - 1; k >= 0 && unread > 3; k--) {
      if (!list[k].read) {
        list[k].read = true;
        unread -= 1;
      }
    }
  } else if (unread < 3) {
    for (let k = 0; k < list.length && unread < 3; k++) {
      if (list[k].read) {
        list[k].read = false;
        unread += 1;
      }
    }
  }
  return list;
}

export function seedNotifications(users: User[]): AppNotificationRecord[] {
  const out: AppNotificationRecord[] = [];
  for (const u of users) {
    const seeds = u.id === "usr_an" ? anNotifications() : genericNotifications(u);
    seeds.forEach((s, idx) => {
      out.push({
        id: `ntf_${u.id.replace("usr_", "")}_${String(idx + 1).padStart(2, "0")}`,
        userId: u.id,
        category: s.category,
        title: s.title,
        content: s.content,
        read: s.read,
        link: s.link,
        createdAt: daysAgo(s.days),
      });
    });
  }
  return out;
}

export function seedSettings(): AdminSetting[] {
  return [
    { key: "site.name", value: "V-Intern", description: "Tên hiển thị của nền tảng", isSecret: false },
    { key: "registration.enabled", value: "true", description: "Cho phép đăng ký tài khoản mới", isSecret: false },
    { key: "interview.maxAttempts", value: "3", description: "Số lần phỏng vấn đầu vào tối đa", isSecret: false },
    { key: "interview.passScore", value: "60", description: "Điểm sàn để qua phỏng vấn AI", isSecret: false },
    { key: "interview.durationMinutes", value: "45", description: "Thời lượng phiên phỏng vấn (phút)", isSecret: false },
    { key: "ai.model", value: "gemini-2.0-flash", description: "Mô hình AI mặc định cho review & mentor", isSecret: false },
    { key: "github.org", value: "vintern-labs", description: "Tổ chức GitHub dùng cho pull request demo", isSecret: false },
    { key: "smtp.apiKey", value: "SG.9f2k-demo-key-xxxx", description: "Khóa SMTP gửi email", isSecret: true },
    { key: "jwt.secret", value: "vintern-jwt-secret-2025", description: "Khóa ký token đăng nhập", isSecret: true },
  ];
}

export function seedAiConfig(): AiConfig {
  return { model: "gemini-2.0-flash", timeoutMs: 60000, maxRetries: 2, version: 4, provider: "connected", fallbackEnabled: true };
}

export function seedActivityEvents(): ActivityEvent[] {
  const e = (id: string, module: ActivityEvent["module"], action: string, actorName: string, summary: string, days: number): ActivityEvent => ({
    id, module, action, actorName, summary, at: daysAgo(days),
  });
  return [
    e("act_01", "auth", "LOGIN", "An Nguyễn", "Đăng nhập từ trình duyệt Chrome (Windows).", 0),
    e("act_02", "session", "PLAN_CONFIRMED", "Hồng Lê", "Xác nhận kế hoạch AI cho phiên Thực tập Xuân 2025 (SES-2025-01).", 42),
    e("act_03", "session", "MEMBER_ADDED", "Hồng Lê", "Thêm An Nguyễn vào SES-2025-01 với vai trò frontend.", 42),
    e("act_04", "task", "TASK_COMPLETED", "An Nguyễn", "Hoàn thành TSK-01 — khởi tạo dự án EduMart.", 41),
    e("act_05", "recruitment", "INTERVIEW_PASSED", "Chi Phạm", "Phỏng vấn AI vai trò frontend: ĐẠT (76/100).", 21),
    e("act_06", "evaluation", "EVALUATION_FINALIZED", "Hồng Lê", "Chốt đánh giá giữa kỳ cho An Nguyễn: 84/100.", 18),
    e("act_07", "system", "AI_RUN", "AI Engine", "AI code review 7 bài nộp trong 24h, không có lỗi hệ thống.", 1),
    e("act_08", "auth", "LOGIN", "Hồng Lê", "Đăng nhập thành công.", 1),
    e("act_09", "recruitment", "INTERVIEW_FAILED", "Dũng Võ", "Lần 2 phỏng vấn backend: chưa đạt (51/100).", 12),
    e("act_10", "session", "SESSION_CREATED", "Hồng Lê", "Tạo phiên Thực tập Hè 2025 (SES-2025-02) từ template TPL-TASK.", 7),
    e("act_11", "task", "SUBMISSION_REWORK", "Hồng Lê", "Yêu cầu TSK-10 làm lại sau AI review 58/100.", 7),
    e("act_12", "auth", "REGISTER", "Hùng Phạm", "Đăng ký tài khoản mới — chờ kích hoạt.", 10),
    e("act_13", "auth", "ACCOUNT_LOCKED", "Quản trị Viên", "Khóa tài khoản mai.dinh (vi phạm điều khoản).", 20),
    e("act_14", "evaluation", "CYCLE_CREATED", "Hồng Lê", "Tạo chu kỳ đánh giá cuối kỳ S1 (nháp).", 3),
    e("act_15", "system", "SETTING_UPDATED", "Quản trị Viên", "Cập nhật cấu hình AI: maxRetries 2 → 2, version 4.", 5),
    e("act_16", "recruitment", "INTERVIEW_PASSED", "Trang Vũ", "Phỏng vấn AI vai trò QA: ĐẠT (67/100).", 12),
    e("act_17", "auth", "LOGIN", "Quản trị Viên", "Đăng nhập bảng điều khiển quản trị.", 2),
    e("act_18", "task", "TASK_COMPLETED", "An Nguyễn", "Hoàn thành TSK-13 và TSK-14 trong Sprint 2.", 8),
  ];
}

export function seedAuditLogs(): AuditLog[] {
  const l = (id: string, actorName: string, action: AuditLog["action"], target: string, days: number, ip: string): AuditLog => ({
    id, actorName, action, target, at: daysAgo(days), ip,
  });
  return [
    l("aud_01", "An Nguyễn", "LOGIN", "Phiên đăng nhập usr_an", 1, "10.0.12.44"),
    l("aud_02", "Hồng Lê", "UPDATE", "Cập nhật đánh giá giữa kỳ ev_01 (An Nguyễn)", 18, "10.0.8.21"),
    l("aud_03", "Hồng Lê", "STATUS_CHANGE", "Chuyển evaluation ev_01 → finalized", 18, "10.0.8.21"),
    l("aud_04", "Hồng Lê", "CREATE", "Tạo phiên thực tập SES-2025-02", 7, "10.0.8.21"),
    l("aud_05", "Quản trị Viên", "STATUS_CHANGE", "Khóa tài khoản usr_mai", 20, "10.0.1.5"),
    l("aud_06", "Hồng Lê", "CREATE", "Tạo chu kỳ đánh giá cyc_02 (cuối kỳ S1)", 3, "10.0.8.21"),
    l("aud_07", "An Nguyễn", "UPDATE", "Cập nhật tiến độ TSK-12 (45%)", 2, "10.0.12.44"),
    l("aud_08", "An Nguyễn", "CREATE", "Nộp bài TSK-11 (sub_04)", 1, "10.0.12.44"),
    l("aud_09", "Quản trị Viên", "UPDATE", "Cấu hình AI model gemini-2.0-flash v4", 5, "10.0.1.5"),
    l("aud_10", "Hùng Phạm", "CREATE", "Đăng ký tài khoản usr_hung", 10, "10.0.33.7"),
    l("aud_11", "Quản trị Viên", "DELETE", "Xóa tiêu chí thử nghiệm cyc_03", 25, "10.0.1.5"),
    l("aud_12", "Hồng Lê", "CREATE", "Thêm Khánh Đoàn vào SES-2025-01", 41, "10.0.8.21"),
    l("aud_13", "Chi Phạm", "LOGIN", "Phiên đăng nhập usr_chi", 19, "10.0.27.13"),
    l("aud_14", "Dũng Võ", "LOGIN", "Phiên đăng nhập usr_dung", 11, "10.0.27.88"),
    l("aud_15", "Hồng Lê", "STATUS_CHANGE", "Sprint SPR-01 → done", 28, "10.0.8.21"),
    l("aud_16", "Quản trị Viên", "CREATE", "Tạo câu hỏi ngân hàng qbk_022", 6, "10.0.1.5"),
    l("aud_17", "Hồng Lê", "UPDATE", "Sửa template TPL-ECOM version 3", 15, "10.0.8.21"),
    l("aud_18", "Minh Hà Trần", "LOGIN", "Phiên đăng nhập usr_minhha", 2, "10.0.41.9"),
  ];
}

export function seedReports(): ReportItem[] {
  const r = (id: string, kind: ReportItem["kind"], title: string, scope: string, days: number): ReportItem => ({
    id, kind, title, scope, sessionId: "ses_2025_01", createdAt: daysAgo(days), authorName: "Hồng Lê",
  });
  return [
    r("rep_01", "progress", "Báo cáo tiến độ giữa kỳ — SES-2025-01", "SES-2025-01 · Thực tập Xuân 2025", 14),
    r("rep_02", "performance", "Hiệu suất thực tập sinh SES-2025-01", "SES-2025-01 · Thực tập Xuân 2025", 12),
    r("rep_03", "evaluation", "Tổng hợp đánh giá giữa kỳ S1", "SES-2025-01 · Đánh giá giữa kỳ", 17),
    r("rep_04", "review", "Chất lượng bài nộp Sprint 2", "SES-2025-01 · Sprint 2", 4),
    r("rep_05", "risk", "Rủi ro tiến độ Sprint 2 & kế hoạch ứng phó", "SES-2025-01 · Sprint 2", 3),
  ];
}
