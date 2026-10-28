/**
 * Kiểu dữ liệu domain "Tuyển dụng công khai & Nghề nghiệp" (Task 2-a):
 * cổng nộp CV công khai, đợt tuyển + khung giờ phỏng vấn, thư viện nghề nghiệp
 * và hàng đợi email. Store riêng — không đụng store.ts/types.ts chung.
 */

/** 9 trạng thái hồ sơ ứng tuyển công khai. */
export type ApplicationStatus =
  | "unverified"
  | "queued"
  | "analyzing"
  | "needs_information"
  | "waitlisted"
  | "booked"
  | "cancelled"
  | "deferred"
  | "failed";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "unverified",
  "queued",
  "analyzing",
  "needs_information",
  "waitlisted",
  "booked",
  "cancelled",
  "deferred",
  "failed",
];

export type RoundStatus = "draft" | "open" | "closed";
export type SlotStatus = "open" | "closed";
export type CareerLevel = "intern" | "junior";
export type CareerLanguage = "vi" | "en";
export type CareerRoleStatus = "draft" | "published" | "archived";

/** 9 trạng thái thư trong hàng đợi email. */
export type MailStatus =
  | "pending"
  | "sending"
  | "accepted"
  | "delivered"
  | "uncertain"
  | "bounced"
  | "dead"
  | "blocked"
  | "failed";

export type MailKind = "verify" | "schedule" | "credentials" | "existing-account" | "cancelled";

/** Kỹ năng bắt buộc của một nghề (weight tổng = 100 khi publish). */
export interface SkillRequirement {
  skill: string;
  weight: number;
  mandatory: boolean;
}

export interface CareerRoleRecord {
  code: string;
  name: string;
  description: string;
  level: CareerLevel;
  language: CareerLanguage;
  requiredSkills: SkillRequirement[];
  optionalSkills: string[];
  version: number;
  status: CareerRoleStatus;
  acceptingApplications: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Snapshot nội dung của một phiên bản nghề (lưu khi PUT / publish). */
export interface CareerRoleRevision {
  id: string;
  code: string;
  version: number;
  note: string;
  changedBy: string;
  changedAt: string;
  snapshot: Omit<CareerRoleRecord, "code" | "createdAt" | "updatedAt">;
}

export interface RoundRecord {
  id: string;
  code: string;
  name: string;
  description: string;
  status: RoundStatus;
  opensAt: string;
  closesAt: string;
  createdAt: string;
}

export interface SlotRecord {
  id: string;
  roundId: string;
  roleCode: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  minimumPreparationMinutes: number;
  credentialsLeadMinutes: number;
  status: SlotStatus;
  location: string;
  createdAt: string;
}

/** Bằng chứng kỹ năng Agent rút ra được từ CV. */
export interface AgentAnalysisFact {
  skill: string;
  evidence: string;
}

/** Kết quả phân tích CV bởi Agent (mock, sinh đồng bộ). */
export interface AgentAnalysis {
  matchedRole: string;
  matchedRoleLabel: string;
  confidence: number;
  facts: AgentAnalysisFact[];
  missing: string[];
  summary: string;
  analyzedAt: string;
}

export type TimelineKind =
  | "submitted"
  | "email_sent"
  | "email_verified"
  | "analysis_completed"
  | "needs_information"
  | "cv_updated"
  | "status_changed"
  | "waitlisted"
  | "slot_booked"
  | "slot_rescheduled"
  | "slot_released"
  | "cancelled"
  | "credentials_sent"
  | "credentials_resent"
  | "credentials_recovered";

export interface TimelineEvent {
  id: string;
  applicationId: string;
  kind: TimelineKind;
  message: string;
  actor: string;
  at: string;
}

/** Lịch phỏng vấn hiện tại của hồ sơ. */
export interface SlotBooking {
  slotId: string;
  roleCode: string;
  startsAt: string;
  endsAt: string;
  location: string;
  bookedAt: string;
}

export interface ApplicationRecord {
  id: string;
  roundId: string;
  fullName: string;
  email: string;
  cvFileName: string | null;
  consent: boolean;
  status: ApplicationStatus;
  /** Token xác minh email (chỉ trả về 1 lần khi tạo hồ sơ — không lộ qua GET). */
  verifyToken: string;
  analysis: AgentAnalysis | null;
  booking: SlotBooking | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  credentialsSentAt: string | null;
  rebookingAttemptsUsed: number;
  maxRebookingAttempts: number;
  nextRebookEligibleAt: string | null;
  /** Revision chống double-submit khi khôi phục credentials (optimistic lock). */
  recoveryRevision: number;
  accountUserId: string | null;
}

export interface MailRecord {
  id: string;
  kind: MailKind;
  applicationId: string | null;
  roundId: string | null;
  subject: string;
  /** Email đầy đủ — chỉ server dùng, FE luôn nhận recipientHint đã mask. */
  recipient: string;
  recipientHint: string;
  availableAt: string;
  attempts: number;
  status: MailStatus;
  lastCode: string | null;
  createdAt: string;
  updatedAt: string;
  lastResentAt: string | null;
  html: string;
  text: string;
}

export interface ApplyStore {
  /** Tăng khi đổi cấu trúc seed → store cũ tự seed lại (pattern "tự phục hồi" như store chính). */
  seedVersion: number;
  seededAt: string;
  rounds: RoundRecord[];
  slots: SlotRecord[];
  applications: ApplicationRecord[];
  timelineEvents: TimelineEvent[];
  careerRoles: CareerRoleRecord[];
  careerRoleRevisions: CareerRoleRevision[];
  mailQueue: MailRecord[];
}
