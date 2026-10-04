/**
 * Dev-only preview cho Recruitment Result (`/intern/onboarding/result
 * ?_preview=pass|fail`).
 *
 * Pass/fail là 2 DATA STATE của cùng một Result screen — KHÔNG tách thành
 * 2 production route. Cơ chế preview để dev/QA xem cả 2 trạng thái:
 * - Preview KHÔNG bypass auth: page vẫn bọc trong guard role `intern`
 *   (layout onboarding) — preview chỉ chọn business data state SAU khi
 *   role đã được xác thực.
 * - Chỉ bật khi `process.env.NODE_ENV === "development"`. Production build
 *   luôn nhận `null` → Result dùng dataset mặc định của flow (pass).
 * - Mirror đúng pattern `intern-preview.ts` của Intern Workspace.
 */

export const ONBOARDING_RESULT_PREVIEWS = ["pass", "fail"] as const;

export type OnboardingResultPreview =
  (typeof ONBOARDING_RESULT_PREVIEWS)[number];

/**
 * Trả về preview hợp lệ từ query param `_preview`, hoặc `null` khi:
 * - đang chạy production (NODE_ENV !== "development"), hoặc
 * - param không phải string / không nằm trong danh sách hợp lệ.
 */
export function parseInternResultPreviewParam(
  value: string | string[] | undefined
): OnboardingResultPreview | null {
  if (process.env.NODE_ENV !== "development") return null;
  if (typeof value !== "string") return null;
  return (ONBOARDING_RESULT_PREVIEWS as readonly string[]).includes(value)
    ? (value as OnboardingResultPreview)
    : null;
}
