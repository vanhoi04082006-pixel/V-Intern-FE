/**
 * Dev-only preview cho Intern Workspace (`/intern?_preview=empty|active`).
 *
 * Quy tắc (bắt buộc theo task):
 * - Preview chọn business data state VÀ (dev-only) cho phép page render
 *   workspace không mount `WorkspaceGuard` — phục vụ local UI review khi
 *   Backend/auth session không chạy. Production KHÔNG bao giờ bypass auth.
 * - Helper là ĐIỂM ENFORCE duy nhất của điều kiện bypass: phải thỏa CẢ HAI
 *   `process.env.NODE_ENV === "development"` (Next.js inline lúc build →
 *   production build luôn nhận `null`) VÀ giá trị param chính xác
 *   `empty|active`. Mọi giá trị khác → `null` → page đi qua guard như cũ.
 * - Đọc env bên trong (render/call time) để test có thể `vi.stubEnv`.
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
