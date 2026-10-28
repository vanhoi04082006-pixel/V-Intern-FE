/**
 * Seed cho domain "Tuyển dụng công khai & Nghề nghiệp" (Task 2-a).
 *
 * Bố cục seed (tất cả thời gian tính tương đối "now" để demo luôn tươi):
 * - 6 career-roles: frontend/backend/fullstack/qa/business_analyst (published,
 *   accepting) + qa_tester (draft). Frontend có 3 revision snapshots.
 * - 2 đợt tuyển: RR-2025-03 "Thực tập Xuân 2026" (open, 8 slots cho 3 role,
 *   capacity 4–6, vài slot đã có người đặt) + RR-2025-02 (closed, 2 slot cũ).
 * - 9 hồ sơ application: 3 booked / 1 waitlisted / 1 analyzing (78%) /
 *   1 needs_information / 1 cancelled / 1 queued / 1 deferred — timeline 4–7
 *   sự kiện, analysis đủ trường (queued chưa phân tích → analysis null).
 * - 7 mail queue entries phủ đủ 5 kind + 7/9 status (sending/failed phát sinh
 *   lúc runtime).
 */

import type {
  AgentAnalysis,
  ApplicationRecord,
  ApplyStore,
  CareerRoleRecord,
  CareerRoleRevision,
  MailRecord,
  RoundRecord,
  SlotRecord,
  TimelineEvent,
  TimelineKind,
} from "./types";
import type { Question, Store } from "../types";
import { nowIso } from "../util";
import {
  maskEmail,
  buildCancelledMail,
  buildCredentialsMail,
  buildExistingAccountMail,
  buildScheduleMail,
  buildVerifyMail,
} from "./mail-templates";

/** Tăng khi thay đổi cấu trúc seed — store cũ sẽ tự seed lại trong getApplyStore(). */
export const SEED_VERSION = 1;

export const MAX_REBOOKING_ATTEMPTS = 2;
export const ROUND_POLICY = {
  maxRebookingAttempts: MAX_REBOOKING_ATTEMPTS,
  rebookingCooldownMinutes: 30,
  cancellationDeadlineHours: 24,
  minimumPreparationMinutesDefault: 60,
  credentialsLeadMinutesDefault: 120,
};

/** "n ngày trước" + lệch phút. */
function ago(days: number, minutes = 0): string {
  return new Date(Date.now() - days * 86400000 + minutes * 60000).toISOString();
}
/** Thời điểm sau `days` ngày, ghim giờ UTC sạch để demo dễ đọc. */
function at(days: number, hourUtc: number, minute = 0): string {
  const d = new Date(Date.now() + days * 86400000);
  d.setUTCHours(hourUtc, minute, 0, 0);
  return d.toISOString();
}

let evSeq = 0;
function ev(applicationId: string, kind: TimelineKind, message: string, at: string, actor: string): TimelineEvent {
  evSeq += 1;
  return { id: `ate_${String(evSeq).padStart(4, "0")}`, applicationId, kind, message, actor, at };
}

/* ============================== CAREER ROLES ============================== */

function seedCareerRoles(): { roles: CareerRoleRecord[]; revisions: CareerRoleRevision[] } {
  const roles: CareerRoleRecord[] = [
    {
      code: "frontend",
      name: "Lập trình viên Frontend",
      description:
        "Xây dựng giao diện các sản phẩm web của chương trình: dashboard, kanban, luồng phỏng vấn AI. Làm việc chủ lực với React + TypeScript trên design system Emerald Noir, chú trọng accessibility và hiệu năng render.",
      level: "intern",
      language: "vi",
      requiredSkills: [
        { skill: "React", weight: 35, mandatory: true },
        { skill: "TypeScript", weight: 25, mandatory: true },
        { skill: "HTML/CSS & Responsive", weight: 20, mandatory: true },
        { skill: "Testing (Vitest/RTL)", weight: 20, mandatory: true },
      ],
      optionalSkills: ["Next.js", "Tailwind CSS", "Framer Motion", "Zustand"],
      version: 3,
      status: "published",
      acceptingApplications: true,
      createdAt: ago(40),
      updatedAt: ago(8),
    },
    {
      code: "backend",
      name: "Lập trình viên Backend",
      description:
        "Phát triển API và luồng dữ liệu cho nền tảng: quản lý phiên phỏng vấn, chấm điểm tự động, đồng bộ repository. Làm việc với Node.js, PostgreSQL và nền tảng serverless của chương trình.",
      level: "intern",
      language: "vi",
      requiredSkills: [
        { skill: "Node.js & Express", weight: 30, mandatory: true },
        { skill: "PostgreSQL & SQL", weight: 25, mandatory: true },
        { skill: "REST API Design", weight: 25, mandatory: true },
        { skill: "Testing (Jest/Supertest)", weight: 20, mandatory: true },
      ],
      optionalSkills: ["Redis", "Docker", "GraphQL", "TypeScript"],
      version: 1,
      status: "published",
      acceptingApplications: true,
      createdAt: ago(45),
      updatedAt: ago(45),
    },
    {
      code: "fullstack",
      name: "Lập trình viên Full-stack",
      description:
        "Trải nghiệm sản phẩm đầu-cuối: từ component UI đến API và triển khai. Phù hợp người thích làm MVP nhanh, tự chủ phạm vi nhỏ và hiểu toàn hệ thống.",
      level: "intern",
      language: "vi",
      requiredSkills: [
        { skill: "React", weight: 25, mandatory: true },
        { skill: "Node.js & Express", weight: 25, mandatory: true },
        { skill: "TypeScript", weight: 25, mandatory: true },
        { skill: "Kiến trúc & Triển khai", weight: 25, mandatory: true },
      ],
      optionalSkills: ["Docker", "CI/CD", "MongoDB", "Prisma"],
      version: 1,
      status: "published",
      acceptingApplications: true,
      createdAt: ago(44),
      updatedAt: ago(44),
    },
    {
      code: "qa",
      name: "Kỹ sư kiểm thử phần mềm (QA)",
      description:
        "Bảo vệ chất lượng sản phẩm: viết kịch bản, kiểm thử hồi quy, tự động hoá luồng chính bằng Playwright và theo dõi lỗi tới khi đóng.",
      level: "intern",
      language: "vi",
      requiredSkills: [
        { skill: "Thiết kế test case", weight: 30, mandatory: true },
        { skill: "Playwright & Tự động hoá", weight: 30, mandatory: true },
        { skill: "SQL & Kiểm tra dữ liệu", weight: 20, mandatory: true },
        { skill: "Báo cáo & theo dõi lỗi", weight: 20, mandatory: true },
      ],
      optionalSkills: ["JMeter", "Postman", "Selenium"],
      version: 1,
      status: "published",
      acceptingApplications: true,
      createdAt: ago(43),
      updatedAt: ago(43),
    },
    {
      code: "business_analyst",
      name: "Chuyên viên phân tích nghiệp vụ (BA)",
      description:
        "Cầu nối giữa ý tưởng và đội phát triển: thu thập yêu cầu, viết user story, mô hình hoá quy trình và giữ tài liệu cập nhật xuyên suốt dự án.",
      level: "intern",
      language: "vi",
      requiredSkills: [
        { skill: "Thu thập & làm rõ yêu cầu", weight: 30, mandatory: true },
        { skill: "User story & tài liệu", weight: 25, mandatory: true },
        { skill: "Mô hình hoá quy trình (BPMN)", weight: 25, mandatory: true },
        { skill: "Giao tiếp với stakeholder", weight: 20, mandatory: true },
      ],
      optionalSkills: ["Jira", "Figma", "UML"],
      version: 1,
      status: "published",
      acceptingApplications: true,
      createdAt: ago(42),
      updatedAt: ago(42),
    },
    {
      code: "qa_tester",
      name: "Kỹ sư kiểm thử tự động (QA Automation)",
      description:
        "Đang soạn thảo — hướng đi chuyên sâu kiểm thử tự động E2E và hiệu năng, yêu cầu kỹ năng code cao hơn vai trò QA thông thường.",
      level: "junior",
      language: "vi",
      requiredSkills: [
        { skill: "Playwright & Automation", weight: 40, mandatory: true },
        { skill: "TypeScript", weight: 30, mandatory: true },
        { skill: "CI/CD", weight: 20, mandatory: true },
        { skill: "API Testing", weight: 10, mandatory: false },
      ],
      optionalSkills: ["K6", "Grafana"],
      version: 1,
      status: "draft",
      acceptingApplications: false,
      createdAt: ago(3),
      updatedAt: ago(3),
    },
  ];

  // 3 revision snapshot cho vai trò frontend (v1 → v3).
  const frontend = roles[0];
  const snap = (r: CareerRoleRecord): Omit<CareerRoleRecord, "code" | "createdAt" | "updatedAt"> => ({
    name: r.name,
    description: r.description,
    level: r.level,
    language: r.language,
    requiredSkills: r.requiredSkills.map((s) => ({ ...s })),
    optionalSkills: [...r.optionalSkills],
    version: r.version,
    status: r.status,
    acceptingApplications: r.acceptingApplications,
  });
  const v1: CareerRoleRecord = {
    ...frontend,
    description: "Xây dựng giao diện người dùng cho các sản phẩm web của chương trình bằng React.",
    requiredSkills: [
      { skill: "React", weight: 30, mandatory: true },
      { skill: "JavaScript", weight: 25, mandatory: true },
      { skill: "HTML/CSS", weight: 25, mandatory: true },
      { skill: "Testing (Jest)", weight: 20, mandatory: true },
    ],
    optionalSkills: ["Tailwind CSS", "Framer Motion"],
    version: 1,
  };
  const v2: CareerRoleRecord = {
    ...frontend,
    requiredSkills: [
      { skill: "React", weight: 35, mandatory: true },
      { skill: "TypeScript", weight: 25, mandatory: true },
      { skill: "HTML/CSS", weight: 20, mandatory: true },
      { skill: "Testing (Jest)", weight: 20, mandatory: true },
    ],
    optionalSkills: ["Next.js", "Tailwind CSS", "Framer Motion"],
    version: 2,
  };
  const revisions: CareerRoleRevision[] = [
    {
      id: "crr_fe_v1",
      code: "frontend",
      version: 1,
      note: "Khởi tạo thư viện nghề — phiên bản đầu tiên",
      changedBy: "Quản trị Viên",
      changedAt: ago(40),
      snapshot: snap(v1),
    },
    {
      id: "crr_fe_v2",
      code: "frontend",
      version: 2,
      note: "Chuyển trọng số từ JavaScript sang TypeScript theo đề xuất của mentor",
      changedBy: "Quản trị Viên",
      changedAt: ago(22),
      snapshot: snap(v2),
    },
    {
      id: "crr_fe_v3",
      code: "frontend",
      version: 3,
      note: "Chuẩn hoá mô tả, bổ sung testing thực chiến (Vitest/RTL) và responsive",
      changedBy: "Quản trị Viên",
      changedAt: ago(8),
      snapshot: snap(frontend),
    },
  ];

  return { roles, revisions };
}

/* ============================== ROUNDS & SLOTS ============================== */

function seedRounds(): RoundRecord[] {
  return [
    {
      id: "rr_spring26",
      code: "RR-2025-03",
      name: "Thực tập Xuân 2026",
      description:
        "Đợt tuyển thực tập sinh cho kỳ Xuân 2026: nộp CV công khai, Agent phân tích và đặt lịch phỏng vấn trực tuyến. 5 vai trò đang mở: Frontend, Backend, Full-stack, QA và BA.",
      status: "open",
      opensAt: ago(12),
      closesAt: at(34, 23, 59),
      createdAt: ago(14),
    },
    {
      id: "rr_fall25",
      code: "RR-2025-02",
      name: "Thực tập Thu 2025",
      description: "Đợt tuyển đã kết thúc — tham khảo để đối chiếu hồ sơ và khung giờ cũ.",
      status: "closed",
      opensAt: ago(500),
      closesAt: ago(460),
      createdAt: ago(510),
    },
  ];
}

function seedSlots(): SlotRecord[] {
  return [
    // RR-2025-03 — 8 khung giờ cho 3 role, capacity 4–6.
    { id: "slt_fe01", roundId: "rr_spring26", roleCode: "frontend", startsAt: at(31, 9), endsAt: at(31, 12), capacity: 6, minimumPreparationMinutes: 60, credentialsLeadMinutes: 120, status: "open", location: "Phòng ảo A.101 — Google Meet", createdAt: ago(13) },
    { id: "slt_fe02", roundId: "rr_spring26", roleCode: "frontend", startsAt: at(33, 14), endsAt: at(33, 17), capacity: 4, minimumPreparationMinutes: 60, credentialsLeadMinutes: 120, status: "open", location: "Phòng ảo A.102 — Google Meet", createdAt: ago(13) },
    { id: "slt_fe03", roundId: "rr_spring26", roleCode: "frontend", startsAt: at(37, 9), endsAt: at(37, 12), capacity: 5, minimumPreparationMinutes: 45, credentialsLeadMinutes: 90, status: "closed", location: "Phòng ảo A.103 — Google Meet", createdAt: ago(12) },
    { id: "slt_be01", roundId: "rr_spring26", roleCode: "backend", startsAt: at(32, 9), endsAt: at(32, 12), capacity: 5, minimumPreparationMinutes: 60, credentialsLeadMinutes: 120, status: "open", location: "Phòng ảo B.201 — Zoom", createdAt: ago(13) },
    { id: "slt_be02", roundId: "rr_spring26", roleCode: "backend", startsAt: at(34, 13, 30), endsAt: at(34, 16, 30), capacity: 4, minimumPreparationMinutes: 60, credentialsLeadMinutes: 120, status: "open", location: "Phòng ảo B.202 — Zoom", createdAt: ago(12) },
    { id: "slt_be03", roundId: "rr_spring26", roleCode: "backend", startsAt: at(38, 9), endsAt: at(38, 12), capacity: 6, minimumPreparationMinutes: 60, credentialsLeadMinutes: 120, status: "open", location: "Phòng ảo B.203 — Zoom", createdAt: ago(12) },
    { id: "slt_fs01", roundId: "rr_spring26", roleCode: "fullstack", startsAt: at(36, 9), endsAt: at(36, 12), capacity: 4, minimumPreparationMinutes: 60, credentialsLeadMinutes: 120, status: "open", location: "Phòng ảo C.301 — Discord", createdAt: ago(11) },
    { id: "slt_fs02", roundId: "rr_spring26", roleCode: "fullstack", startsAt: at(41, 14), endsAt: at(41, 17), capacity: 5, minimumPreparationMinutes: 45, credentialsLeadMinutes: 90, status: "closed", location: "Phòng ảo C.302 — Discord", createdAt: ago(11) },
    // RR-2025-02 — 2 khung giờ cũ đã diễn ra.
    { id: "slt_old_fe", roundId: "rr_fall25", roleCode: "frontend", startsAt: ago(430, 3), endsAt: ago(429, 15), capacity: 4, minimumPreparationMinutes: 60, credentialsLeadMinutes: 120, status: "closed", location: "Phòng ảo A.101 — Google Meet", createdAt: ago(470) },
    { id: "slt_old_be", roundId: "rr_fall25", roleCode: "backend", startsAt: ago(424, 3), endsAt: ago(423, 15), capacity: 4, minimumPreparationMinutes: 60, credentialsLeadMinutes: 120, status: "closed", location: "Phòng ảo B.201 — Zoom", createdAt: ago(470) },
  ];
}

/* ============================== APPLICATIONS ============================== */

function mkAnalysis(
  matchedRole: string,
  matchedRoleLabel: string,
  confidence: number,
  facts: AgentAnalysis["facts"],
  missing: string[],
  summary: string,
  analyzedAt: string
): AgentAnalysis {
  return { matchedRole, matchedRoleLabel, confidence, facts, missing, summary, analyzedAt };
}

function seedApplications(): { applications: ApplicationRecord[]; timeline: TimelineEvent[] } {
  const applications: ApplicationRecord[] = [
    // 1. BOOKED — Phượng Võ, frontend, slot 28/11.
    {
      id: "app_phuong",
      roundId: "rr_spring26",
      fullName: "Phượng Võ",
      email: "phuong.vo@student.edu.vn",
      cvFileName: "Phuong_Vo_CV_FPT.pdf",
      consent: true,
      status: "booked",
      verifyToken: "vrf_phuong_2f81",
      analysis: mkAnalysis(
        "frontend",
        "Lập trình viên Frontend",
        84,
        [
          { skill: "React", evidence: "page:1 — dự án EduMart clone (SPA React + Vite, 3 tháng)" },
          { skill: "TypeScript", evidence: "page:1 — đồ án tốt nghiệp viết toàn bộ bằng TypeScript" },
          { skill: "HTML/CSS & Responsive", evidence: "page:2 — 5 trang layout responsive, PageSpeed 94/100" },
        ],
        ["Testing (Vitest/RTL)", "Tiếng Anh kỹ thuật (chưa có chứng chỉ)"],
        "Nền tảng React/TypeScript khá chắc với 2 dự án có link demo. Buổi phỏng vấn sẽ tập trung vào tư duy kiểm thử và tối ưu render.",
        ago(5.85)
      ),
      booking: { slotId: "slt_fe01", roleCode: "frontend", startsAt: at(31, 9), endsAt: at(31, 12), location: "Phòng ảo A.101 — Google Meet", bookedAt: ago(4.2) },
      cancelReason: null,
      createdAt: ago(6),
      updatedAt: ago(4.1),
      credentialsSentAt: ago(4.1),
      rebookingAttemptsUsed: 1,
      maxRebookingAttempts: MAX_REBOOKING_ATTEMPTS,
      nextRebookEligibleAt: null,
      recoveryRevision: 0,
      accountUserId: null,
    },
    // 2. BOOKED — Hải Lý, frontend, cùng slot 28/11.
    {
      id: "app_hai",
      roundId: "rr_spring26",
      fullName: "Hải Lý",
      email: "hai.ly@student.edu.vn",
      cvFileName: "Hai_Ly_CV_2026.pdf",
      consent: true,
      status: "booked",
      verifyToken: "vrf_hai_9d02",
      analysis: mkAnalysis(
        "frontend",
        "Lập trình viên Frontend",
        76,
        [
          { skill: "React", evidence: "page:1 — 2 dự án React trong CLB Lập trình trường" },
          { skill: "HTML/CSS & Responsive", evidence: "page:2 — landing page sự kiện CLB, tự thiết kế Figma → code" },
        ],
        ["TypeScript", "Testing (Vitest/RTL)", "Quản lý state (Zustand/Redux)"],
        "Portfolio CLB cho thấy tinh thần tự học tốt; cần bổ sung kiến thức type an toàn và testing trước khi vào dự án thật.",
        ago(4.75)
      ),
      booking: { slotId: "slt_fe01", roleCode: "frontend", startsAt: at(31, 9), endsAt: at(31, 12), location: "Phòng ảo A.101 — Google Meet", bookedAt: ago(3.5) },
      cancelReason: null,
      createdAt: ago(5),
      updatedAt: ago(3.5),
      credentialsSentAt: null,
      rebookingAttemptsUsed: 0,
      maxRebookingAttempts: MAX_REBOOKING_ATTEMPTS,
      nextRebookEligibleAt: null,
      recoveryRevision: 0,
      accountUserId: null,
    },
    // 3. BOOKED — Trang Vũ (email trùng user đã có tài khoản → demo mail existing-account), backend.
    {
      id: "app_trangvu",
      roundId: "rr_spring26",
      fullName: "Trang Vũ",
      email: "trang.vu@student.edu.vn",
      cvFileName: "Trang_Vu_CV_PTIT.pdf",
      consent: true,
      status: "booked",
      verifyToken: "vrf_trang_77be",
      analysis: mkAnalysis(
        "backend",
        "Lập trình viên Backend",
        69,
        [
          { skill: "Node.js & Express", evidence: "page:1 — REST API quản lý chi tiêu nhóm (Node + Express)" },
          { skill: "PostgreSQL & SQL", evidence: "page:2 — đồ án CSDL chuẩn hoá sang PostgreSQL, viết view + index" },
        ],
        ["REST API Design (chuẩn hoá)", "Testing (Jest/Supertest)", "Redis & caching"],
        "Kinh nghiệm backend ở mức đồ án, kỹ năng SQL tốt. Cần rèn design API chuẩn REST và thói quen viết test trong kỳ thực tập.",
        ago(3.85)
      ),
      booking: { slotId: "slt_be01", roleCode: "backend", startsAt: at(32, 9), endsAt: at(32, 12), location: "Phòng ảo B.201 — Zoom", bookedAt: ago(3.2) },
      cancelReason: null,
      createdAt: ago(4),
      updatedAt: ago(2.1),
      credentialsSentAt: ago(2.1),
      rebookingAttemptsUsed: 0,
      maxRebookingAttempts: MAX_REBOOKING_ATTEMPTS,
      nextRebookEligibleAt: null,
      recoveryRevision: 0,
      accountUserId: null,
    },
    // 4. WAITLISTED — Minh Trạng, backend, điểm khớp vùng xem xét.
    {
      id: "app_minhtrang",
      roundId: "rr_spring26",
      fullName: "Minh Trạng",
      email: "minh.trang@student.edu.vn",
      cvFileName: "Minh_Trang_CV_UIT.pdf",
      consent: true,
      status: "waitlisted",
      verifyToken: "vrf_tranglist_31aa",
      analysis: mkAnalysis(
        "backend",
        "Lập trình viên Backend",
        64,
        [
          { skill: "Node.js & Express", evidence: "page:1 — đồ án môn học API quản lý thư viện" },
          { skill: "PostgreSQL & SQL", evidence: "page:2 — viết JOIN và index cơ bản đúng ngữ cảnh" },
        ],
        ["Docker", "Tối ưu truy vấn", "Kiến trúc REST chuẩn hoá", "Kinh nghiệm làm việc nhóm"],
        "Điểm khớp 64% thuộc vùng xem xét: kỹ năng cốt lõi có mặt nhưng thiếu chiều sâu. Giảng viên sẽ xem xét khi mở thêm khung giờ.",
        ago(2.85)
      ),
      booking: null,
      cancelReason: null,
      createdAt: ago(3),
      updatedAt: ago(2.7),
      credentialsSentAt: null,
      rebookingAttemptsUsed: 0,
      maxRebookingAttempts: MAX_REBOOKING_ATTEMPTS,
      nextRebookEligibleAt: null,
      recoveryRevision: 0,
      accountUserId: null,
    },
    // 5. ANALYZING — Lan Đoàn, fullstack, confidence 78%.
    {
      id: "app_lan",
      roundId: "rr_spring26",
      fullName: "Lan Đoàn",
      email: "lan.doan@student.edu.vn",
      cvFileName: "Lan_Doan_CV_Fullstack.pdf",
      consent: true,
      status: "analyzing",
      verifyToken: "vrf_lan_5cc4",
      analysis: mkAnalysis(
        "fullstack",
        "Lập trình viên Full-stack",
        78,
        [
          { skill: "React", evidence: "page:1 — website bán hàng cá nhân (React + Firebase)" },
          { skill: "Node.js & Express", evidence: "page:2 — backend mini blog Express + MongoDB" },
          { skill: "TypeScript", evidence: "page:2 — dùng TypeScript trong dự án cuối kỳ" },
        ],
        ["Kiến trúc & Triển khai (deploy, CI)", "Testing"],
        "Hồ sơ cân bằng cả frontend và backend — đúng chất fullstack. Chưa thấy kinh nghiệm deploy; buổi phỏng vấn sẽ thử bài toán triển khai.",
        ago(1.85)
      ),
      booking: null,
      cancelReason: null,
      createdAt: ago(2),
      updatedAt: ago(1.85),
      credentialsSentAt: null,
      rebookingAttemptsUsed: 0,
      maxRebookingAttempts: MAX_REBOOKING_ATTEMPTS,
      nextRebookEligibleAt: null,
      recoveryRevision: 0,
      accountUserId: null,
    },
    // 6. NEEDS_INFORMATION — Hoàng Trần, CV quá ngắn.
    {
      id: "app_hoang",
      roundId: "rr_spring26",
      fullName: "Hoàng Trần",
      email: "hoang.tran@student.edu.vn",
      cvFileName: "Hoang_Tran_CV.pdf",
      consent: true,
      status: "needs_information",
      verifyToken: "vrf_hoang_8e11",
      analysis: mkAnalysis(
        "frontend",
        "Lập trình viên Frontend",
        62,
        [{ skill: "React", evidence: "page:1 — từng hoàn thành khoá học React (theo mô tả)" }],
        ["Dự án thực tế — CV quá ngắn, chưa thấy sản phẩm", "TypeScript", "Kinh nghiệm làm việc nhóm"],
        "CV chỉ nêu danh mục khoá học, chưa có dự án minh hoạ. Cần bản CV trải dài kèm link dự án để Agent đánh giá chính xác.",
        ago(0.92)
      ),
      booking: null,
      cancelReason: null,
      createdAt: ago(1),
      updatedAt: ago(0.92),
      credentialsSentAt: null,
      rebookingAttemptsUsed: 0,
      maxRebookingAttempts: MAX_REBOOKING_ATTEMPTS,
      nextRebookEligibleAt: null,
      recoveryRevision: 0,
      accountUserId: null,
    },
    // 7. CANCELLED — Đức Bùi, từng đặt slot rồi rút hồ sơ (slot đã giải phóng).
    {
      id: "app_duc",
      roundId: "rr_spring26",
      fullName: "Đức Bùi",
      email: "duc.bui@student.edu.vn",
      cvFileName: "Duc_Bui_CV_HCMUT.pdf",
      consent: true,
      status: "cancelled",
      verifyToken: "vrf_duc_4a97",
      analysis: mkAnalysis(
        "backend",
        "Lập trình viên Backend",
        72,
        [
          { skill: "REST API Design", evidence: "page:1 — API đặt lịch hẹn cho phòng khám nhỏ" },
          { skill: "PostgreSQL & SQL", evidence: "page:2 — thiết kế schema bệnh án có ràng buộc khoá ngoại" },
        ],
        ["Testing", "Node.js nâng cao (async patterns)"],
        "Thiết kế API có suy nghĩ, SQL chuẩn. Hồ sơ dừng lại vì ứng viên rút để nhận offer thực tập ở công ty khác.",
        ago(7.85)
      ),
      booking: null,
      cancelReason: "Ứng viên xin rút hồ sơ — đã nhận lời thực tập tại công ty khác.",
      createdAt: ago(8),
      updatedAt: ago(5.15),
      credentialsSentAt: null,
      rebookingAttemptsUsed: 0,
      maxRebookingAttempts: MAX_REBOOKING_ATTEMPTS,
      nextRebookEligibleAt: null,
      recoveryRevision: 0,
      accountUserId: null,
    },
    // 8. QUEUED — Giang Ngô, mới xác minh, chưa tới lượt phân tích.
    {
      id: "app_giang",
      roundId: "rr_spring26",
      fullName: "Giang Ngô",
      email: "giang.ngo@student.edu.vn",
      cvFileName: "Giang_Ngo_CV_HUST.pdf",
      consent: true,
      status: "queued",
      verifyToken: "vrf_giang_2c05",
      analysis: null,
      booking: null,
      cancelReason: null,
      createdAt: ago(0.6),
      updatedAt: ago(0.54),
      credentialsSentAt: null,
      rebookingAttemptsUsed: 0,
      maxRebookingAttempts: MAX_REBOOKING_ATTEMPTS,
      nextRebookEligibleAt: null,
      recoveryRevision: 0,
      accountUserId: null,
    },
    // 9. DEFERRED — Bảo Nguyễn, đợt cũ RR-2025-02, hoãn sang đợt sau.
    {
      id: "app_bao",
      roundId: "rr_fall25",
      fullName: "Bảo Nguyễn",
      email: "bao.nguyen@student.edu.vn",
      cvFileName: "Bao_Nguyen_CV_2025.pdf",
      consent: true,
      status: "deferred",
      verifyToken: "vrf_bao_6d33",
      analysis: mkAnalysis(
        "backend",
        "Lập trình viên Backend",
        75,
        [
          { skill: "Node.js & Express", evidence: "page:1 — API quản lý chi tiêu nhóm có xác thực JWT" },
          { skill: "PostgreSQL & SQL", evidence: "page:2 — thiết kế schema đơn giản cho app chi tiêu" },
        ],
        ["Kinh nghiệm production", "Docker"],
        "Hồ sơ ổn ở mức sinh viên; ứng viên xin hoãn sang đợt sau vì trùng lịch học.",
        ago(479.85)
      ),
      booking: null,
      cancelReason: null,
      createdAt: ago(480),
      updatedAt: ago(478),
      credentialsSentAt: null,
      rebookingAttemptsUsed: 0,
      maxRebookingAttempts: MAX_REBOOKING_ATTEMPTS,
      nextRebookEligibleAt: null,
      recoveryRevision: 0,
      accountUserId: null,
    },
  ];

  const t = (a: ApplicationRecord) => a.id;
  const timeline: TimelineEvent[] = [
    // app_phuong — 6 events.
    ev(t(applications[0]), "submitted", "Hồ sơ ứng tuyển đợt “Thực tập Xuân 2026” đã được ghi nhận.", ago(6), "Ứng viên"),
    ev(t(applications[0]), "email_sent", "Đã gửi email xác minh tới phuong.vo@student.edu.vn.", ago(6, 4), "Hệ thống"),
    ev(t(applications[0]), "email_verified", "Xác minh email thành công — hồ sơ vào hàng đợi phân tích.", ago(5.9), "Ứng viên"),
    ev(t(applications[0]), "analysis_completed", "Agent phân tích CV: khớp 84% với vai trò Lập trình viên Frontend.", ago(5.85), "Agent V-Intern"),
    ev(t(applications[0]), "slot_booked", "Đã đặt lịch phỏng vấn Frontend — khung giờ 28/11, 09:00–12:00 (UTC).", ago(4.2), "Ứng viên"),
    ev(t(applications[0]), "credentials_sent", "Đã gửi email chứa thông tin đăng nhập buổi phỏng vấn.", ago(4.1), "Hệ thống"),
    // app_hai — 5 events.
    ev(t(applications[1]), "submitted", "Hồ sơ ứng tuyển đợt “Thực tập Xuân 2026” đã được ghi nhận.", ago(5), "Ứng viên"),
    ev(t(applications[1]), "email_sent", "Đã gửi email xác minh tới hai.ly@student.edu.vn.", ago(5, 4), "Hệ thống"),
    ev(t(applications[1]), "email_verified", "Xác minh email thành công — hồ sơ vào hàng đợi phân tích.", ago(4.8), "Ứng viên"),
    ev(t(applications[1]), "analysis_completed", "Agent phân tích CV: khớp 76% với vai trò Lập trình viên Frontend.", ago(4.75), "Agent V-Intern"),
    ev(t(applications[1]), "slot_booked", "Đã đặt lịch phỏng vấn Frontend — khung giờ 28/11, 09:00–12:00 (UTC).", ago(3.5), "Ứng viên"),
    // app_trangvu — 6 events.
    ev(t(applications[2]), "submitted", "Hồ sơ ứng tuyển đợt “Thực tập Xuân 2026” đã được ghi nhận.", ago(4), "Ứng viên"),
    ev(t(applications[2]), "email_sent", "Đã gửi email xác minh tới trang.vu@student.edu.vn.", ago(4, 4), "Hệ thống"),
    ev(t(applications[2]), "email_verified", "Xác minh email thành công — hồ sơ vào hàng đợi phân tích.", ago(3.9), "Ứng viên"),
    ev(t(applications[2]), "analysis_completed", "Agent phân tích CV: khớp 69% với vai trò Lập trình viên Backend.", ago(3.85), "Agent V-Intern"),
    ev(t(applications[2]), "slot_booked", "Đã đặt lịch phỏng vấn Backend — khung giờ 29/11, 09:00–12:00 (UTC).", ago(3.2), "Ứng viên"),
    ev(t(applications[2]), "credentials_sent", "Đã gửi email chứa thông tin đăng nhập buổi phỏng vấn.", ago(2.1), "Hệ thống"),
    // app_minhtrang — 5 events.
    ev(t(applications[3]), "submitted", "Hồ sơ ứng tuyển đợt “Thực tập Xuân 2026” đã được ghi nhận.", ago(3), "Ứng viên"),
    ev(t(applications[3]), "email_sent", "Đã gửi email xác minh tới minh.trang@student.edu.vn.", ago(3, 4), "Hệ thống"),
    ev(t(applications[3]), "email_verified", "Xác minh email thành công — hồ sơ vào hàng đợi phân tích.", ago(2.9), "Ứng viên"),
    ev(t(applications[3]), "analysis_completed", "Agent phân tích CV: khớp 64% với vai trò Lập trình viên Backend.", ago(2.85), "Agent V-Intern"),
    ev(t(applications[3]), "waitlisted", "Xếp vào danh sách chờ — điểm khớp 64% thuộc vùng xem xét, giảng viên sẽ liên hệ khi mở thêm khung giờ.", ago(2.7), "Hệ thống"),
    // app_lan — 4 events.
    ev(t(applications[4]), "submitted", "Hồ sơ ứng tuyển đợt “Thực tập Xuân 2026” đã được ghi nhận.", ago(2), "Ứng viên"),
    ev(t(applications[4]), "email_sent", "Đã gửi email xác minh tới lan.doan@student.edu.vn.", ago(2, 4), "Hệ thống"),
    ev(t(applications[4]), "email_verified", "Xác minh email thành công — hồ sơ vào hàng đợi phân tích.", ago(1.9), "Ứng viên"),
    ev(t(applications[4]), "analysis_completed", "Agent phân tích CV: khớp 78% với vai trò Lập trình viên Full-stack.", ago(1.85), "Agent V-Intern"),
    // app_hoang — 4 events.
    ev(t(applications[5]), "submitted", "Hồ sơ ứng tuyển đợt “Thực tập Xuân 2026” đã được ghi nhận.", ago(1), "Ứng viên"),
    ev(t(applications[5]), "email_sent", "Đã gửi email xác minh tới hoang.tran@student.edu.vn.", ago(1, 3), "Hệ thống"),
    ev(t(applications[5]), "email_verified", "Xác minh email thành công — hồ sơ vào hàng đợi phân tích.", ago(0.95), "Ứng viên"),
    ev(t(applications[5]), "needs_information", "Cần bổ sung CV chi tiết hơn — CV hiện tại thiếu mục dự án thực tế.", ago(0.92), "Agent V-Intern"),
    // app_duc — 7 events.
    ev(t(applications[6]), "submitted", "Hồ sơ ứng tuyển đợt “Thực tập Xuân 2026” đã được ghi nhận.", ago(8), "Ứng viên"),
    ev(t(applications[6]), "email_sent", "Đã gửi email xác minh tới duc.bui@student.edu.vn.", ago(8, 4), "Hệ thống"),
    ev(t(applications[6]), "email_verified", "Xác minh email thành công — hồ sơ vào hàng đợi phân tích.", ago(7.9), "Ứng viên"),
    ev(t(applications[6]), "analysis_completed", "Agent phân tích CV: khớp 72% với vai trò Lập trình viên Backend.", ago(7.85), "Agent V-Intern"),
    ev(t(applications[6]), "slot_booked", "Đã đặt lịch phỏng vấn Backend — khung giờ 29/11, 09:00–12:00 (UTC).", ago(6.5), "Ứng viên"),
    ev(t(applications[6]), "slot_released", "Đã giải phóng khung giờ phỏng vấn 29/11 cho ứng viên khác.", ago(5.2), "Hệ thống"),
    ev(t(applications[6]), "cancelled", "Hồ sơ đã hủy: ứng viên xin rút hồ sơ — đã nhận lời thực tập tại công ty khác.", ago(5.15), "Ứng viên"),
    // app_giang — 4 events.
    ev(t(applications[7]), "submitted", "Hồ sơ ứng tuyển đợt “Thực tập Xuân 2026” đã được ghi nhận.", ago(0.6), "Ứng viên"),
    ev(t(applications[7]), "email_sent", "Đã gửi email xác minh tới giang.ngo@student.edu.vn.", ago(0.6, 3), "Hệ thống"),
    ev(t(applications[7]), "email_verified", "Xác minh email thành công — hồ sơ vào hàng đợi phân tích.", ago(0.55), "Ứng viên"),
    ev(t(applications[7]), "status_changed", "Hồ sơ vào hàng đợi phân tích — Agent sẽ xử lý theo thứ tự nhận được.", ago(0.54), "Hệ thống"),
    // app_bao — 5 events.
    ev(t(applications[8]), "submitted", "Hồ sơ ứng tuyển đợt “Thực tập Thu 2025” đã được ghi nhận.", ago(480), "Ứng viên"),
    ev(t(applications[8]), "email_sent", "Đã gửi email xác minh tới bao.nguyen@student.edu.vn.", ago(480, 4), "Hệ thống"),
    ev(t(applications[8]), "email_verified", "Xác minh email thành công — hồ sơ vào hàng đợi phân tích.", ago(479.9), "Ứng viên"),
    ev(t(applications[8]), "analysis_completed", "Agent phân tích CV: khớp 75% với vai trò Lập trình viên Backend.", ago(479.85), "Agent V-Intern"),
    ev(t(applications[8]), "status_changed", "Tạm hoãn sang đợt sau theo yêu cầu của ứng viên (trùng lịch học).", ago(478), "Giảng viên"),
  ];

  return { applications, timeline };
}

/* ============================== MAIL QUEUE ============================== */

function seedMailQueue(
  applications: ApplicationRecord[],
  rounds: RoundRecord[],
  slots: SlotRecord[]
): MailRecord[] {
  const round03 = rounds[0];
  const round02 = rounds[1];
  const byId = <T extends { id: string }>(arr: T[], id: string): T => arr.find((x) => x.id === id) as T;
  const app = (id: string) => byId(applications, id);

  const mk = (
    id: string,
    kind: MailRecord["kind"],
    appId: string,
    recipient: string,
    subject: string,
    status: MailRecord["status"],
    attempts: number,
    lastCode: string | null,
    availableAt: string,
    body: { html: string; text: string }
  ): MailRecord => ({
    id,
    kind,
    applicationId: appId,
    roundId: app(appId).roundId,
    subject,
    recipient,
    recipientHint: maskEmail(recipient),
    availableAt,
    attempts,
    status,
    lastCode,
    createdAt: availableAt,
    updatedAt: availableAt,
    lastResentAt: null,
    html: body.html,
    text: body.text,
  });

  return [
    mk("mail_001", "verify", "app_phuong", "phuong.vo@student.edu.vn", "[V-Intern] Xác minh email ứng tuyển — Thực tập Xuân 2026", "delivered", 1, "250 2.0.0 OK — delivered by provider", ago(6, 2), buildVerifyMail(app("app_phuong"), round03)),
    mk("mail_002", "schedule", "app_hai", "hai.ly@student.edu.vn", "[V-Intern] Xác nhận lịch phỏng vấn vai trò Frontend", "accepted", 1, "250 2.1.5 OK — queued by provider", ago(3.5), buildScheduleMail(app("app_hai"), round03, byId(slots, "slt_fe01"), "Lập trình viên Frontend")),
    mk("mail_003", "credentials", "app_trangvu", "trang.vu@student.edu.vn", "[V-Intern] Thông tin đăng nhập buổi phỏng vấn Backend", "uncertain", 2, "450 4.2.1 Greylisted — nhà cung cấp yêu cầu thử lại sau", ago(2.1), buildCredentialsMail(app("app_trangvu"), round03, byId(slots, "slt_be01"), "Lập trình viên Backend", "Vint@2026!x7k2")),
    mk("mail_004", "cancelled", "app_duc", "duc.bui@student.edu.vn", "[V-Intern] Xác nhận hủy hồ sơ ứng tuyển", "dead", 3, "5.1.1 Mailbox unavailable — địa chỉ không tồn tại", ago(5.15), buildCancelledMail(app("app_duc"), round03, "Ứng viên xin rút hồ sơ — đã nhận lời thực tập tại công ty khác.")),
    mk("mail_005", "verify", "app_giang", "giang.ngo@student.edu.vn", "[V-Intern] Xác minh email ứng tuyển — Thực tập Xuân 2026", "pending", 0, null, new Date(Date.now() + 2 * 3600000).toISOString(), buildVerifyMail(app("app_giang"), round03)),
    mk("mail_006", "existing-account", "app_trangvu", "trang.vu@student.edu.vn", "[V-Intern] Bạn đã có tài khoản trên V-Intern", "bounced", 1, "5.2.2 Mailbox full — hộp thư quá dung lượng", ago(3.1), buildExistingAccountMail(app("app_trangvu"), round03)),
    mk("mail_007", "verify", "app_bao", "bao.nguyen@student.edu.vn", "[V-Intern] Xác minh email ứng tuyển — Thực tập Thu 2025", "blocked", 1, "5.7.1 Blocked by spam filter — cần whitelist tên miền", ago(479.8), buildVerifyMail(app("app_bao"), round02)),
  ];
}

/* ============================== TOP-UP QUESTION BANK ============================== */

const QUESTION_TOPUPS: Array<Pick<Question, "roleCode" | "phase" | "difficulty" | "prompt" | "expectedConcepts">> = [
  // frontend +3 (7 → 10)
  { roleCode: "frontend", phase: "technical", difficulty: "medium", prompt: "memo, useMemo và useCallback dùng khi nào trong React? Cho một ví dụ mà lạm dụng chúng lại làm chậm ứng dụng.", expectedConcepts: ["memo", "usememo", "usecallback", "hiệu năng"] },
  { roleCode: "frontend", phase: "technical", difficulty: "medium", prompt: "CSS Grid và Flexbox khác nhau thế nào? Với layout dashboard 12 cột có sidebar co giãn, bạn chọn gì và vì sao?", expectedConcepts: ["grid", "flexbox", "layout", "responsive"] },
  { roleCode: "frontend", phase: "communication", difficulty: "easy", prompt: "Mentor nhận xét code của bạn khó đọc. Bạn sẽ cải thiện quy trình làm việc và thói quen code thế nào?", expectedConcepts: ["tiếp nhận", "thói quen", "code", "giao tiếp"] },
  // backend +4 (6 → 10)
  { roleCode: "backend", phase: "technical", difficulty: "medium", prompt: "Middleware trong Express là gì? Viết ví dụ middleware ghi log thời gian xử lý của mỗi request.", expectedConcepts: ["middleware", "express", "next", "log"] },
  { roleCode: "backend", phase: "technical", difficulty: "medium", prompt: "Khi một API bị gọi quá tải (thundering herd), bạn áp dụng những cơ chế nào để bảo vệ hệ thống?", expectedConcepts: ["rate limit", "cache", "hàng đợi", "giới hạn"] },
  { roleCode: "backend", phase: "technical", difficulty: "hard", prompt: "Thiết kế cơ chế idempotency cho API đặt hàng: vì sao cần và bạn triển khai thế nào (khóa, TTL, trả kết quả trùng)?", expectedConcepts: ["idempotency", "khóa", "ttl", "nhất quán"] },
  { roleCode: "backend", phase: "english", difficulty: "medium", prompt: "Describe how you would design a pagination strategy for an API returning a large dataset.", expectedConcepts: ["pagination", "cursor", "offset", "api"] },
  // fullstack +5 (5 → 10)
  { roleCode: "fullstack", phase: "introduction", difficulty: "easy", prompt: "Bạn đã tự triển khai một sản phẩm nhỏ end-to-end chưa? Khó khăn lớn nhất khi tự làm cả frontend lẫn backend là gì?", expectedConcepts: ["sản phẩm", "khó khăn", "học hỏi", "trải nghiệm"] },
  { roleCode: "fullstack", phase: "technical", difficulty: "medium", prompt: "CORS là gì? Lỗi CORS thường gặp khi tách frontend/backend ở môi trường nào và cách xử lý đúng?", expectedConcepts: ["cors", "origin", "header", "proxy"] },
  { roleCode: "fullstack", phase: "technical", difficulty: "medium", prompt: "Bạn tổ chức cấu trúc thư mục dự án fullstack thế nào để frontend và backend chia sẻ kiểu dữ liệu với nhau?", expectedConcepts: ["cấu trúc", "type", "chia sẻ", "monorepo"] },
  { roleCode: "fullstack", phase: "technical", difficulty: "hard", prompt: "Từ database schema đến form UI, bạn đảm bảo validation nhất quán giữa backend và frontend bằng cách nào?", expectedConcepts: ["validation", "schema", "zod", "nhất quán"] },
  { roleCode: "fullstack", phase: "communication", difficulty: "medium", prompt: "Trong nhóm 4 người phụ trách cả frontend lẫn backend, bạn đề xuất quy trình code review ra sao để không tắc nghẽn?", expectedConcepts: ["code review", "quy trình", "phân công", "thống nhất"] },
  // qa +4 (6 → 10)
  { roleCode: "qa", phase: "technical", difficulty: "medium", prompt: "Viết kịch bản test cho chức năng “đăng nhập”: liệt kê ít nhất 6 trường hợp biên bạn sẽ kiểm tra.", expectedConcepts: ["kịch bản", "biên", "đăng nhập", "trường hợp"] },
  { roleCode: "qa", phase: "technical", difficulty: "medium", prompt: "Bug chỉ tái hiện trên production mà local chạy tốt: các bước thu thập bằng chứng và cách bạn báo cáo?", expectedConcepts: ["production", "bằng chứng", "log", "báo cáo"] },
  { roleCode: "qa", phase: "english", difficulty: "easy", prompt: "Explain the difference between smoke testing and sanity testing with one example each.", expectedConcepts: ["smoke", "sanity", "example", "testing"] },
  { roleCode: "qa", phase: "communication", difficulty: "easy", prompt: "Bạn cần thuyết phục team ưu tiên fix một bug P1 trước ngày release. Trình bày thế nào cho thuyết phục?", expectedConcepts: ["ưu tiên", "rủi ro", "trình bày", "dữ liệu"] },
  // business_analyst +4 (6 → 10)
  { roleCode: "business_analyst", phase: "technical", difficulty: "medium", prompt: "Vẽ flowchart mô tả quy trình đặt hàng online từ giỏ hàng đến thanh toán thành công — nêu 3 điểm rủi ro nghiệp vụ.", expectedConcepts: ["flowchart", "quy trình", "rủi ro", "thanh toán"] },
  { roleCode: "business_analyst", phase: "technical", difficulty: "medium", prompt: "Có yêu cầu thay đổi giữa dự án: bạn đánh giá tác động thế nào và trình bày với team ra sao?", expectedConcepts: ["thay đổi", "tác động", "đánh giá", "trình bày"] },
  { roleCode: "business_analyst", phase: "english", difficulty: "medium", prompt: "How do you write acceptance criteria that developers will not misunderstand?", expectedConcepts: ["acceptance criteria", "given when then", "clear", "testable"] },
  { roleCode: "business_analyst", phase: "communication", difficulty: "medium", prompt: "Bạn phải báo cáo tiến độ cho lãnh đạo không biết kỹ thuật. Chọn nội dung gì và diễn đạt thế nào?", expectedConcepts: ["báo cáo", "phi kỹ thuật", "đơn giản", "trọng tâm"] },
];

/**
 * Bổ sung câu hỏi phỏng vấn vào ngân hàng câu hỏi chính để 5 role onboarding
 * đạt ngưỡng ≥10 câu — điều kiện mở khung giờ phỏng vấn (chỉ chạy 1 lần/idempotent).
 */
export function topUpQuestionBank(store: Store): void {
  const hasExt = store.questionBank.some((q) => q.id.startsWith("qbk_ext_"));
  if (hasExt) return;
  QUESTION_TOPUPS.forEach((q, i) => {
    store.questionBank.push({
      id: `qbk_ext_${String(i + 1).padStart(3, "0")}`,
      roleCode: q.roleCode,
      phase: q.phase,
      difficulty: q.difficulty,
      language: "vi",
      prompt: q.prompt,
      expectedConcepts: q.expectedConcepts,
      isActive: true,
      version: 1,
    });
  });
}

/* ============================== ROOT ============================== */

export function seedApplyStore(): ApplyStore {
  const { roles, revisions } = seedCareerRoles();
  const rounds = seedRounds();
  const slots = seedSlots();
  const { applications, timeline } = seedApplications();
  const mailQueue = seedMailQueue(applications, rounds, slots);
  return {
    seedVersion: SEED_VERSION,
    seededAt: nowIso(),
    rounds,
    slots,
    applications,
    timelineEvents: timeline,
    careerRoles: roles,
    careerRoleRevisions: revisions,
    mailQueue,
  };
}
