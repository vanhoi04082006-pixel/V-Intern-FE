/**
 * ONBOARDING FLOW STATE (preview session) — trạng thái luồng onboarding của
 * tài khoản demo pv-intern-3 (sinhvien_tan).
 *
 * Đặt ở module riêng để cả data.ts (workspace mock) và admin-data.ts
 * (recruitment/me mock) cùng dùng mà không tạo import vòng.
 *
 * Pattern giống markAllRead (notifications): thao tác thật trong phiên cập
 * nhật mock — PATCH role / POST interview / POST submit đổi trạng thái và
 * các GET sau đó phản ánh đúng.
 */
export type OnboardingStatus =
  | "not_started"
  | "role_selected"
  | "interview_in_progress"
  | "evaluation_pending"
  | "passed";

const FLOW_STORAGE_KEY = "vintern-preview-onboarding";

export const ONBOARDING_FLOW: {
  status: OnboardingStatus;
  role: string | null;
  roleLabel: string | null;
  interviewId: string | null;
  answeredQuestionIds: string[];
} = {
  status: "not_started",
  role: null,
  roleLabel: null,
  interviewId: null,
  answeredQuestionIds: [],
};

/** Khôi phục trạng thái luồng từ sessionStorage (giữ qua reload trong tab —
 *  đúng ngữ nghĩa phiên thật; preview-state của account/scenario cũng vậy). */
if (typeof window !== "undefined") {
  try {
    const raw = window.sessionStorage.getItem(FLOW_STORAGE_KEY);
    if (raw) {
      const v = JSON.parse(raw) as Partial<typeof ONBOARDING_FLOW>;
      if (typeof v.status === "string" && v.status.length) ONBOARDING_FLOW.status = v.status as OnboardingStatus;
      if (typeof v.role === "string" || v.role === null) ONBOARDING_FLOW.role = v.role ?? null;
      if (typeof v.roleLabel === "string" || v.roleLabel === null) ONBOARDING_FLOW.roleLabel = v.roleLabel ?? null;
      if (typeof v.interviewId === "string" || v.interviewId === null) ONBOARDING_FLOW.interviewId = v.interviewId ?? null;
      if (Array.isArray(v.answeredQuestionIds)) ONBOARDING_FLOW.answeredQuestionIds = v.answeredQuestionIds.filter(x => typeof x === "string");
    }
  } catch {
    /* sessionStorage không đọc được — dùng mặc định */
  }
}

function persistFlow(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      FLOW_STORAGE_KEY,
      JSON.stringify({
        status: ONBOARDING_FLOW.status,
        role: ONBOARDING_FLOW.role,
        roleLabel: ONBOARDING_FLOW.roleLabel,
        interviewId: ONBOARDING_FLOW.interviewId,
        answeredQuestionIds: ONBOARDING_FLOW.answeredQuestionIds,
      }),
    );
  } catch {
    /* bỏ qua lỗi quota */
  }
}

export function onboardingReset(): void {
  ONBOARDING_FLOW.status = "not_started";
  ONBOARDING_FLOW.role = null;
  ONBOARDING_FLOW.roleLabel = null;
  ONBOARDING_FLOW.interviewId = null;
  ONBOARDING_FLOW.answeredQuestionIds = [];
  persistFlow();
}

/** Đánh dấu câu hỏi đã lưu câu trả lời (PUT answers) — GET questions phản ánh. */
export function onboardingMarkAnswered(questionId: string): void {
  if (!ONBOARDING_FLOW.answeredQuestionIds.includes(questionId)) {
    ONBOARDING_FLOW.answeredQuestionIds.push(questionId);
    persistFlow();
  }
}

/** Danh sách câu hỏi đã trả lời theo phiên hiện tại. */
export function onboardingAnsweredIds(): string[] {
  return ONBOARDING_FLOW.answeredQuestionIds;
}

export function onboardingSelectRole(role: string, label: string): void {
  ONBOARDING_FLOW.status = "role_selected";
  ONBOARDING_FLOW.role = role;
  ONBOARDING_FLOW.roleLabel = label;
  persistFlow();
}

export function onboardingStartInterview(): string {
  ONBOARDING_FLOW.status = "interview_in_progress";
  ONBOARDING_FLOW.interviewId = `itv-live-${Date.now().toString(36)}`;
  persistFlow();
  return ONBOARDING_FLOW.interviewId;
}

export function onboardingSubmitInterview(): void {
  ONBOARDING_FLOW.status = "passed";
  persistFlow();
}

/** Trạng thái workspace tương ứng theo flow (đúng lifecyclePath của FE). */
export function onboardingWorkspaceStatus(): string {
  switch (ONBOARDING_FLOW.status) {
    case "not_started":
    case "role_selected":
      return "recruitment_required";
    case "interview_in_progress":
      return "recruitment_in_progress";
    case "evaluation_pending":
      return "recruitment_in_progress";
    case "passed":
      return "unassigned";
  }
}
