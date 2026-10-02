/**
 * Dev-only preview cho Intern Workspace (`/intern?_preview=empty|active`).
 *
 * Quy tắc (bắt buộc theo task):
 * - Preview KHÔNG bypass auth: page vẫn bọc trong `WorkspaceGuard` — preview
 *   chỉ chọn business data state SAU khi role `intern` đã được xác thực.
 * - Chỉ bật khi `process.env.NODE_ENV === "development"`. Production build
 *   luôn nhận `null` → bỏ qua query param, không có fake state.
 * - Helper là pure function đọc env bên trong để test có thể `vi.stubEnv`.
 */

export const INTERN_PREVIEW_STATES = ["empty", "active"] as const;

export type InternPreviewState = (typeof INTERN_PREVIEW_STATES)[number];

/**
 * Trả về preview state hợp lệ từ query param `_preview`, hoặc `null` khi:
 * - đang chạy production (NODE_ENV !== "development"), hoặc
 * - param không phải string, hoặc giá trị không nằm trong danh sách hợp lệ.
 */
export function parseInternPreviewParam(
  value: string | string[] | undefined
): InternPreviewState | null {
  if (process.env.NODE_ENV !== "development") return null;
  if (typeof value !== "string") return null;
  return (INTERN_PREVIEW_STATES as readonly string[]).includes(value)
    ? (value as InternPreviewState)
    : null;
}
